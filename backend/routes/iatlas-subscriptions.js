'use strict';

/**
 * iatlas-subscriptions.js — IATLAS Stripe subscription routes.
 *
 * Endpoints:
 *   POST /api/iatlas/subscribe              — Create a Stripe Checkout Session
 *   GET  /api/iatlas/subscription-status    — Get current subscription status
 *   POST /api/iatlas/cancel-subscription    — Cancel subscription at period end
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const stripe = require('../config/stripe');
const { authenticateJWT } = require('../middleware/auth');
const logger = require('../utils/logger');

// ── Environment variables for IATLAS Stripe Price IDs ────────────────────────
const IATLAS_PRICE_IDS = {
    individual:   process.env.STRIPE_IATLAS_INDIVIDUAL_PRICE_ID,
    family:       process.env.STRIPE_IATLAS_FAMILY_PRICE_ID,
    complete:     process.env.STRIPE_IATLAS_COMPLETE_PRICE_ID,
    practitioner: process.env.STRIPE_IATLAS_PRACTITIONER_PRICE_ID,
    practice:     process.env.STRIPE_IATLAS_PRACTICE_PRICE_ID,
};

const iatlasLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again in a moment.' },
});

/**
 * Helper: return the mongoose db handle.
 * Uses mongoose.connection.db for direct collection access.
 */
function getDb() {
    return mongoose.connection.db;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/iatlas/subscribe
// Create a Stripe Checkout Session for an IATLAS subscription tier.
// Body: { tier }  — one of individual, family, complete, practitioner, practice
// ─────────────────────────────────────────────────────────────────────────────
router.post('/subscribe', iatlasLimiter, authenticateJWT, async (req, res) => {
    try {
        const { tier } = req.body;
        const userId = req.user && (req.user.userId || req.user.sub);

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated.' });
        }

        // Validate tier — enterprise has no Stripe price (contact sales)
        if (!tier || !IATLAS_PRICE_IDS.hasOwnProperty(tier)) {
            return res.status(400).json({ error: 'Invalid subscription tier.' });
        }

        const priceId = IATLAS_PRICE_IDS[tier];
        if (!priceId) {
            return res.status(500).json({ error: `Stripe Price ID not configured for tier: ${tier}` });
        }

        const db = getDb();
        if (!db) {
            return res.status(503).json({ error: 'Database unavailable.' });
        }

        // Get user info from database
        const User = require('../models/User');

        // Build a flexible query: Auth0 sub-based userIds are not ObjectIds,
        // so only include the _id condition when the value is a valid ObjectId.
        // If neither email nor a valid ObjectId is available, the query will
        // return null and the 404 response below will handle it gracefully.
        const userQuery = req.user.email
            ? { email: req.user.email }
            : mongoose.Types.ObjectId.isValid(userId)
                ? { _id: userId }
                : null;

        const user = await User.findOne(userQuery).lean();

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Create or retrieve Stripe customer
        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { userId: userId.toString() },
            });
            customerId = customer.id;

            // Save customer ID to user record
            await User.findByIdAndUpdate(user._id, {
                $set: { stripeCustomerId: customerId },
            });
        }

        // Create Checkout Session.
        // subscription_data.metadata propagates the IATLAS-specific identifiers
        // (userId, tier, productType) to the subscription object itself. Without
        // this, webhook handlers receive subscription events without any metadata
        // and cannot distinguish IATLAS subscriptions from other subscription
        // types — causing all IATLAS subscription lifecycle events to be silently
        // ignored. The session-level metadata below is a belt-and-suspenders copy.
        const APP_URL = process.env.APP_URL || 'http://localhost:3000';

        // For the Practice tier, accept an optional practiceId to link the
        // subscription directly to an existing practice document.
        const practiceId = (tier === 'practice' && req.body.practiceId)
            ? String(req.body.practiceId).slice(0, 64)
            : undefined;

        const sessionMetadata = {
            userId: userId.toString(),
            tier,
            productType: 'iatlas',
        };
        if (practiceId) {
            sessionMetadata.practiceId = practiceId;
        }

        const successUrl = tier === 'practice' && practiceId
            ? `${APP_URL}/iatlas/practice/dashboard?session_id={CHECKOUT_SESSION_ID}&upgrade_success=true`
            : `${APP_URL}/iatlas?session_id={CHECKOUT_SESSION_ID}&upgrade_success=true`;

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: successUrl,
            cancel_url: `${APP_URL}/iatlas?canceled=true`,
            metadata: sessionMetadata,
            subscription_data: {
                metadata: sessionMetadata,
            },
        });

        res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        logger.error('IATLAS subscribe error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/iatlas/subscription-status
// Return the current IATLAS subscription for the authenticated user.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/subscription-status', iatlasLimiter, authenticateJWT, async (req, res) => {
    try {
        const userId = req.user && (req.user.userId || req.user.sub);

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated.' });
        }

        const db = getDb();
        if (!db) {
            return res.status(503).json({ error: 'Database unavailable.' });
        }

        const subscription = await db.collection('iatlas_subscriptions').findOne({
            userId: userId.toString(),
            status: { $in: ['active', 'trialing'] },
        });

        if (!subscription) {
            return res.json({ tier: 'free', status: 'none' });
        }

        res.json({
            tier: subscription.tier,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
        });
    } catch (error) {
        logger.error('IATLAS subscription-status error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/iatlas/cancel-subscription
// Cancel the active IATLAS subscription at period end.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/cancel-subscription', iatlasLimiter, authenticateJWT, async (req, res) => {
    try {
        const userId = req.user && (req.user.userId || req.user.sub);

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated.' });
        }

        const db = getDb();
        if (!db) {
            return res.status(503).json({ error: 'Database unavailable.' });
        }

        const subscription = await db.collection('iatlas_subscriptions').findOne({
            userId: userId.toString(),
            status: 'active',
        });

        if (!subscription) {
            return res.status(404).json({ error: 'No active subscription found.' });
        }

        // Cancel at period end (don't immediately revoke access)
        const updated = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            cancel_at_period_end: true,
        });

        await db.collection('iatlas_subscriptions').updateOne(
            { _id: subscription._id },
            { $set: { cancelAtPeriodEnd: true, updatedAt: new Date() } }
        );

        res.json({
            message: 'Subscription will be canceled at period end.',
            currentPeriodEnd: updated.current_period_end,
        });
    } catch (error) {
        logger.error('IATLAS cancel-subscription error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
