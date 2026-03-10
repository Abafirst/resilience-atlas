'use strict';

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const stripe = require('../config/stripe');
const Purchase = require('../models/Purchase');
const User = require('../models/User');
const logger = require('../utils/logger');

/** Tier definitions: name, price in cents, currency. */
const TIERS = {
    'deep-report': {
        name: 'Deep Resilience Report',
        amount: 1400, // $14
        currency: 'usd',
    },
    'atlas-premium': {
        name: 'Atlas Premium',
        amount: 4900, // $49
        currency: 'usd',
    },
};

/** Rate limiter for all payment endpoints — low limit to prevent abuse. */
const paymentsLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again in a moment.' },
});

/**
 * Webhook rate limiter — more permissive than other endpoints because Stripe
 * may retry events, but still guards against excessive unauthenticated traffic.
 * Signature verification provides the primary security layer.
 */
const webhookLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again in a moment.' },
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/checkout
// Create a Stripe Checkout session for the requested tier.
// Body: { tier: 'deep-report' | 'atlas-premium', email: string }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/checkout', paymentsLimiter, async (req, res) => {
    try {
        const { tier, email } = req.body;

        if (!TIERS[tier]) {
            return res
                .status(400)
                .json({ error: 'Invalid tier. Must be deep-report or atlas-premium.' });
        }
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'Email is required.' });
        }

        const tierConfig = TIERS[tier];
        const appUrl = process.env.APP_URL || 'http://localhost:3000';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: tierConfig.currency,
                        product_data: { name: tierConfig.name },
                        unit_amount: tierConfig.amount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            customer_email: email.toLowerCase().trim(),
            metadata: { tier, email: email.toLowerCase().trim() },
            success_url: `${appUrl}/results.html?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/results.html?upgrade=cancelled`,
        });

        // Record pending purchase so the webhook can update it later.
        await Purchase.create({
            email: email.toLowerCase().trim(),
            stripeSessionId: session.id,
            tier,
            amount: tierConfig.amount,
            currency: tierConfig.currency,
            status: 'pending',
        });

        res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        logger.error('Stripe checkout error:', error);
        res.status(500).json({ error: 'Failed to create checkout session.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/verify
// Verify a completed Stripe Checkout session and unlock premium content.
// Query: ?session_id=<cs_xxx>
// ─────────────────────────────────────────────────────────────────────────────
router.get('/verify', paymentsLimiter, async (req, res) => {
    try {
        const { session_id } = req.query;
        if (!session_id) {
            return res.status(400).json({ error: 'session_id is required.' });
        }

        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (session.payment_status !== 'paid') {
            return res.status(402).json({
                error: 'Payment not completed.',
                status: session.payment_status,
            });
        }

        const tier = session.metadata?.tier;
        const email = (session.customer_email || session.metadata?.email || '').toLowerCase();

        // Mark purchase as completed.
        await Purchase.findOneAndUpdate(
            { stripeSessionId: session_id },
            { status: 'completed', purchasedAt: new Date() },
            { upsert: false }
        );

        // Update user record if they have a registered account.
        if (email) {
            const updateFields =
                tier === 'atlas-premium'
                    ? { atlasPremium: true, purchasedDeepReport: true, purchaseDate: new Date() }
                    : { purchasedDeepReport: true, purchaseDate: new Date() };

            await User.findOneAndUpdate({ email }, updateFields, { upsert: false }).catch(
                (err) => logger.warn('User update skipped:', err.message)
            );
        }

        res.json({ success: true, tier, email });
    } catch (error) {
        logger.error('Payment verification error:', error);
        res.status(500).json({ error: 'Failed to verify payment.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/status
// Check the highest completed purchase tier for a given email.
// Query: ?email=<email>
// ─────────────────────────────────────────────────────────────────────────────
router.get('/status', paymentsLimiter, async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ error: 'Email is required.' });
        }

        // Atlas Premium supersedes Deep Report — return the best available tier.
        const premiumPurchase = await Purchase.findOne({
            email: email.toLowerCase().trim(),
            status: 'completed',
            tier: 'atlas-premium',
        });
        if (premiumPurchase) {
            return res.json({ tier: 'atlas-premium', purchasedAt: premiumPurchase.purchasedAt });
        }

        const deepPurchase = await Purchase.findOne({
            email: email.toLowerCase().trim(),
            status: 'completed',
            tier: 'deep-report',
        });
        if (deepPurchase) {
            return res.json({ tier: 'deep-report', purchasedAt: deepPurchase.purchasedAt });
        }

        res.json({ tier: 'free' });
    } catch (error) {
        logger.error('Payment status error:', error);
        res.status(500).json({ error: 'Failed to check payment status.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/webhook
// Handle Stripe webhook events.  Raw body is required for signature verification;
// the express.raw() middleware is applied in server.js BEFORE express.json() for
// this path.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/webhook', webhookLimiter, async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        logger.warn('STRIPE_WEBHOOK_SECRET not configured — webhook ignored');
        return res.status(500).json({ error: 'Webhook secret not configured.' });
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        logger.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: `Webhook error: ${err.message}` });
    }

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const tier = session.metadata?.tier;
            const email = (
                session.customer_email ||
                session.metadata?.email ||
                ''
            ).toLowerCase();
            const status = session.payment_status === 'paid' ? 'completed' : 'pending';

            await Purchase.findOneAndUpdate(
                { stripeSessionId: session.id },
                {
                    status,
                    ...(status === 'completed' ? { purchasedAt: new Date() } : {}),
                    // Upsert fallback: if webhook arrives before checkout record exists.
                    $setOnInsert: { email, tier, amount: 0, currency: 'usd' },
                },
                { upsert: true }
            );

            if (status === 'completed' && email) {
                const updateFields =
                    tier === 'atlas-premium'
                        ? {
                              atlasPremium: true,
                              purchasedDeepReport: true,
                              purchaseDate: new Date(),
                          }
                        : { purchasedDeepReport: true, purchaseDate: new Date() };

                await User.findOneAndUpdate({ email }, updateFields, { upsert: false }).catch(
                    (err) => logger.warn('Webhook user update skipped:', err.message)
                );
            }
        }

        res.json({ received: true });
    } catch (error) {
        logger.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed.' });
    }
});

module.exports = router;
