'use strict';

const https = require('https');
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const stripe = require('../config/stripe');
const Purchase = require('../models/Purchase');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Attempt a HEAD request to https://api.stripe.com and log the outcome.
 * Helps distinguish TLS verification failures, DNS errors, and network egress
 * issues without making an authenticated Stripe API call.
 * Only invoked when DEBUG_STRIPE=true.
 */
function runStripeTlsSmokeCheck() {
    const req = https.request(
        { hostname: 'api.stripe.com', method: 'HEAD', path: '/', port: 443 },
        (res) => {
            logger.info('Stripe TLS smoke-check: connected', { statusCode: res.statusCode });
            res.resume();
        }
    );
    req.on('error', (e) => {
        logger.error('Stripe TLS smoke-check: failed', {
            code: e.code,
            message: e.message,
            errno: e.errno,
            syscall: e.syscall,
            address: e.address,
            port: e.port,
        });
    });
    req.end();
}

/** HTML entities that the sanitisation middleware may encode in user input. */
const HTML_ENTITY_DECODE_MAP = {
    '&quot;': '"', '&#34;': '"', '&#x22;': '"',
    '&apos;': "'", '&#39;': "'", '&#x27;': "'",
    '&amp;': '&', '&lt;': '<', '&gt;': '>',
};

/** Tier definitions: name, price in cents, currency. */
const TIERS = {
    'atlas-navigator': {
        name: 'Atlas Navigator',
        amount: 999, // $9.99
        currency: 'usd',
    },
    'atlas-premium': {
        name: 'Atlas Premium',
        amount: 4900, // $49.00
        currency: 'usd',
    },
};

/**
 * Full tier configuration matching the frontend TIER_CONFIG.
 * Covers all 7 tiers with pricing, feature access, and billing metadata.
 * Tiers with null price use custom/contact-sales pricing.
 */
const TIER_CONFIG = {
    'free': {
        name: 'Free',
        price: 0,
        billing: 'free',
        maxUsers: 1,
        maxTeams: 0,
        features: ['Basic assessment', 'Individual results', 'Radar chart'],
        dataRetention: '1 month',
    },
    'atlas-navigator': {
        name: 'Atlas Navigator',
        price: 999, // $9.99
        billing: 'one-time',
        maxUsers: 1,
        maxTeams: 0,
        features: ['Deep Report', 'Full dimension analysis', 'Personalized strategies'],
        dataRetention: '1 year',
    },
    'atlas-premium': {
        name: 'Atlas Premium',
        price: 4900, // $49.00
        billing: 'one-time',
        maxUsers: 1,
        maxTeams: 0,
        features: ['All Deep Report features', 'Lifetime access', 'Unlimited reassessments'],
        dataRetention: 'Unlimited',
    },
    'business': {
        name: 'Business',
        price: null, // Custom pricing
        billing: 'custom',
        maxUsers: 25,
        maxTeams: 1,
        features: ['Team analytics', 'Member results', 'Admin dashboard'],
        dataRetention: '1 year',
    },
    'starter': {
        name: 'Atlas Team Starter',
        price: 29900, // $299 one-time
        billing: 'one-time',
        maxUsers: 15,
        maxTeams: 1,
        features: ['Team dashboard', 'Basic reports', 'CSV export', '1 team'],
        dataRetention: '1 year',
    },
    'pro': {
        name: 'Atlas Team Professional',
        price: 69900, // $699 one-time
        billing: 'one-time',
        maxUsers: 30,
        maxTeams: 999,
        features: ['Advanced analytics', 'Facilitation tools', 'Multiple teams', 'Auto-generated reports'],
        dataRetention: '3 years',
    },
    'enterprise': {
        name: 'Atlas Team Enterprise',
        price: 249900, // Starting at $2,499 one-time
        billing: 'one-time',
        maxUsers: Infinity,
        maxTeams: Infinity,
        features: ['Unlimited everything', 'Custom branding', 'Webhooks', 'SSO/SAML', 'Dedicated support'],
        dataRetention: 'Unlimited',
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
// GET /api/payments/tiers
// Return public pricing for the two purchasable tiers (atlas-navigator, atlas-premium).
// No authentication required — used by the frontend to display current prices.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/tiers', paymentsLimiter, (req, res) => {
    res.json({
        tiers: [
            {
                id: 'atlas-navigator',
                name: TIERS['atlas-navigator'].name,
                price: TIERS['atlas-navigator'].amount / 100,
                currency: TIERS['atlas-navigator'].currency.toUpperCase(),
                billing: 'one-time',
            },
            {
                id: 'atlas-premium',
                name: TIERS['atlas-premium'].name,
                price: TIERS['atlas-premium'].amount / 100,
                currency: TIERS['atlas-premium'].currency.toUpperCase(),
                billing: 'one-time',
            },
        ],
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/checkout
// Create a Stripe Checkout session for the requested tier.
// Body: { tier: 'atlas-navigator' | 'atlas-premium', email: string }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/checkout', paymentsLimiter, async (req, res) => {
    // Declared outside try/catch so both blocks can safely reference them for
    // logging without a ReferenceError if the Stripe call itself throws.
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    // Support both the canonical name and a legacy variant for backwards compat.
    const hasOneTimePriceId = Boolean(
        process.env.STRIPE_ONE_TIME_PRICE_ID || process.env.STRIPE_PRICE_ID
    );
    let priceIdVarUsed;
    if (process.env.STRIPE_ONE_TIME_PRICE_ID) {
        priceIdVarUsed = 'STRIPE_ONE_TIME_PRICE_ID';
    } else if (process.env.STRIPE_PRICE_ID) {
        priceIdVarUsed = 'STRIPE_PRICE_ID (legacy)';
    } else {
        priceIdVarUsed = 'none (using inline price_data)';
    }

    // Guard: fail fast with a clear server-side message if the key is absent.
    if (!stripeSecretKey) {
        logger.error('Stripe checkout: STRIPE_SECRET_KEY is not set — cannot create session');
        return res.status(500).json({ error: 'Payment service configuration error.' });
    }

    try {
        const { tier, email } = req.body;

        if (!TIERS[tier]) {
            return res
                .status(400)
                .json({ error: 'Invalid tier. Must be one of: atlas-navigator, atlas-premium.' });
        }
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'Email is required.' });
        }

        const tierConfig = TIERS[tier];
        const appUrl = process.env.APP_URL || 'http://localhost:3000';

        // Decode HTML entities that the sanitisation middleware may have introduced
        // (e.g. &quot; → ", &#x27; → ') before stripping any remaining literal quotes.
        const cleanEmail = String(email || '')
            .replace(/&(?:[a-z]+|#\d+|#x[\da-f]+);/gi, (entity) => HTML_ENTITY_DECODE_MAP[entity] ?? entity)
            .replace(/"/g, '')
            .replace(/'/g, '')
            .trim()
            .toLowerCase();

        if (!cleanEmail || !cleanEmail.includes('@')) {
            return res.status(400).json({ error: 'Valid email is required.' });
        }

        // ── Env-var presence check ──────────────────────────────────────────
        // Log before hitting Stripe so Railway logs expose config problems
        // (missing key, wrong variable name) without leaking secret values.
        logger.info('Stripe checkout: pre-call env check', {
            hasStripeSecretKey: Boolean(stripeSecretKey),
            // Show only the 7-char prefix (sk_live_ / sk_test_) — no key material
            stripeKeyPrefix: stripeSecretKey.slice(0, 7),
            hasOneTimePriceId,
            priceIdVarUsed,
            appUrlSet: Boolean(process.env.APP_URL),
            tier,
        });

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
            customer_email: cleanEmail,
            metadata: { tier, email: cleanEmail },
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
    } catch (err) {
        // Always log a minimal summary so the error is visible in every environment.
        logger.error('Stripe checkout error', { message: err.message });

        // Detailed diagnostic logging — enabled only when DEBUG_STRIPE=true or
        // outside production so production logs stay clean by default.
        const debugStripe =
            process.env.DEBUG_STRIPE === 'true' ||
            process.env.NODE_ENV !== 'production';

        if (debugStripe) {
            logger.error('Stripe checkout error details', {
                // Stripe SDK error classification fields
                type: err.type,
                code: err.code,
                statusCode: err.statusCode,
                message: err.message,
                requestId: err.requestId,
                // Underlying network / TLS cause (exposes the real cause of
                // "connection to Stripe" retries, e.g. ECONNREFUSED, CERT_*)
                causeCode: err.cause?.code,
                causeMessage: err.cause?.message,
                // Node-level network fields present on low-level errors
                errno: err.errno,
                syscall: err.syscall,
                address: err.address,
                port: err.port,
                // Re-log env-var presence at error time — no secret values exposed
                hasStripeSecretKey: Boolean(stripeSecretKey),
                stripeKeyPrefix: stripeSecretKey ? stripeSecretKey.slice(0, 7) : 'not-set',
                hasOneTimePriceId,
            });

            if (err.stack) {
                logger.debug('Stripe checkout error stack:', err.stack);
            }

            // Run a connectivity probe to distinguish TLS / DNS / egress failures.
            // Intentionally fire-and-forget: diagnostic only, must not delay the response.
            runStripeTlsSmokeCheck();
        }

        // Return a generic message — never expose internal details to the client
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

        // Atlas Premium supersedes Atlas Navigator — return the best available tier.
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
            tier: 'atlas-navigator',
        });
        if (deepPurchase) {
            return res.json({ tier: 'atlas-navigator', purchasedAt: deepPurchase.purchasedAt });
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
