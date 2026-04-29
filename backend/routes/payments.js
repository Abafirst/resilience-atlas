'use strict';

const https = require('https');
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const stripe = require('../config/stripe');
const Purchase = require('../models/Purchase');
const User = require('../models/User');
const MicroPracticePlan = require('../models/MicroPracticePlan');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');
const { TIER_CONFIG, PLAN_ALIASES } = require('../config/tiers');
const { mapPurchaseTierToPlanTier } = require('../utils/microPracticeTier');

// One-time log at module load so Railway logs show the diagnostic state of the
// running container.  Safe: no secrets — only reflects whether the flag is set.
logger.info(`DEBUG_STRIPE enabled: ${process.env.DEBUG_STRIPE === 'true'}`);

/**
 * Ordered list of tiers from most to least permissive, used by /api/payments/status.
 * Individual tiers: atlas-premium > atlas-navigator > atlas-starter
 * Teams tiers: enterprise > pro/teams-pro > starter/teams-starter
 * Includes PLAN_ALIASES keys for defensive coverage of both naming conventions.
 */
const STATUS_TIER_PRIORITY = [
    'atlas-premium',
    'atlas-navigator',
    'enterprise',
    'pro',
    ...Object.keys(PLAN_ALIASES).filter(k => PLAN_ALIASES[k] === 'pro'),
    'atlas-starter',
    'starter',
    ...Object.keys(PLAN_ALIASES).filter(k => PLAN_ALIASES[k] === 'starter'),
];

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
    'atlas-starter': {
        name: 'Atlas Starter',
        amount: 999, // $9.99
        currency: 'usd',
    },
    'atlas-navigator': {
        name: 'Atlas Navigator (Lifetime)',
        amount: 4999, // $49.99
        currency: 'usd',
    },
    'atlas-premium': {
        name: 'Atlas Premium',
        amount: 4999, // $49.99
        currency: 'usd',
    },
    'starter': {
        name: 'Atlas Team Basic',
        amount: 29900, // $299 one-time
        currency: 'usd',
    },
    'pro': {
        name: 'Atlas Team Premium',
        amount: 69900, // $699 one-time
        currency: 'usd',
    },
    'enterprise': {
        name: 'Atlas Enterprise',
        amount: 249900, // Starting at $2,499 one-time
        currency: 'usd',
    },
};

// 'atlas-enterprise' is the canonical public-facing key; 'enterprise' is kept
// as a legacy alias so existing Stripe sessions and webhooks are not broken.
TIERS['atlas-enterprise'] = TIERS['enterprise'];

// TIER_CONFIG is imported from backend/config/tiers.js — the canonical source
// of truth for all plan names, features, and limits.  Do not duplicate it here.

/** Team tiers that use the /team page instead of /results after checkout. */
const TEAM_TIER_SET = new Set(['starter', 'pro', 'enterprise', 'atlas-enterprise']);

async function promoteMicroPracticePlansForPurchase(email, purchaseTier) {
    const planTier = mapPurchaseTierToPlanTier(purchaseTier);
    if (!email || planTier === 'starter') return;

    if (planTier === 'full') {
        await MicroPracticePlan.updateMany({ email }, { $set: { tier: 'full' } });
        return;
    }

    await MicroPracticePlan.updateMany(
        { email, tier: { $ne: 'full' } },
        { $set: { tier: 'paid' } }
    );
}

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
// Return public pricing for the purchasable individual tiers.
// No authentication required — used by the frontend to display current prices.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/tiers', paymentsLimiter, (req, res) => {
    res.json({
        tiers: [
            {
                id: 'atlas-starter',
                name: TIERS['atlas-starter'].name,
                price: TIERS['atlas-starter'].amount / 100,
                currency: TIERS['atlas-starter'].currency.toUpperCase(),
                billing: 'one-time',
            },
            {
                id: 'atlas-navigator',
                name: TIERS['atlas-navigator'].name,
                price: TIERS['atlas-navigator'].amount / 100,
                currency: TIERS['atlas-navigator'].currency.toUpperCase(),
                billing: 'one-time',
            },
        ],
    });
});

/**
 * Determine the app-relative path to return to after Stripe checkout.
 *
 * The caller may supply an optional `returnPath` (e.g. '/gamification') so that
 * users who start a purchase from a page other than /results are sent back to
 * the correct page instead of always landing on /results.
 *
 * Security: only same-origin relative paths (starting with '/' but NOT '//') are
 * accepted to prevent open-redirect attacks. Any other value is silently ignored
 * and the default tier-based path is used instead.
 *
 * @param {string} tier        - Stripe tier ID
 * @param {string} [returnPath] - Optional caller-supplied return path
 * @returns {string} A validated relative path (always starts with '/')
 */
function resolveReturnPath(tier, returnPath) {
    if (
        typeof returnPath === 'string' &&
        returnPath.startsWith('/') &&
        !returnPath.startsWith('//')
    ) {
        return returnPath;
    }
    return `/${TEAM_TIER_SET.has(tier) ? 'team' : 'results'}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/checkout
// Create a Stripe Checkout session for the requested tier.
// Body: { tier, email, returnPath? }
//   returnPath — optional safe same-origin path to redirect to after purchase
//                (e.g. '/gamification'). Defaults to '/results' or '/team'.
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

    // Evaluate debug flag once here so it is available to both the try and catch
    // blocks without being re-read from env on every log call.
    // To enable:  set DEBUG_STRIPE=true in Railway Variables (or .env locally).
    // To disable: remove the variable or set it to any value other than 'true'.
    // Note: non-production environments (NODE_ENV !== 'production') also enable
    // debug logging automatically to aid local development, since those
    // environments are not externally accessible by default.
    const debugStripe =
        process.env.DEBUG_STRIPE === 'true' ||
        process.env.NODE_ENV !== 'production';

    // Emit a per-request confirmation when debug mode is on.  Logging this
    // once per request (rather than only at startup) lets you cross-reference
    // each failing checkout attempt in Railway with the exact active flag state,
    // and immediately rule out "did my env var take effect?" as a question.
    if (debugStripe) {
        logger.info('DEBUG_STRIPE runtime=true');
    }

    // Guard: fail fast with a clear server-side message if the key is absent.
    if (!stripeSecretKey) {
        logger.error('Stripe checkout: STRIPE_SECRET_KEY is not set — cannot create session');
        return res.status(500).json({ error: 'Payment service configuration error.' });
    }

    try {
        const { tier, email, overall, dominantType, scores, returnPath } = req.body;

        if (!TIERS[tier]) {
            return res
                .status(400)
                .json({ error: 'Invalid tier. Must be one of: atlas-starter, atlas-navigator, atlas-premium, starter, pro, enterprise, atlas-enterprise.' });
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
            // Do not collect phone numbers — we don't need them and they add
            // unnecessary friction to the checkout flow.
            phone_number_collection: { enabled: false },
            metadata: { tier, email: cleanEmail },
            success_url: `${appUrl}${resolveReturnPath(tier, returnPath)}?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}${resolveReturnPath(tier, returnPath)}?upgrade=canceled`,
        });

        // Record pending purchase so the webhook can update it later.
        const purchaseDoc = {
            email: email.toLowerCase().trim(),
            stripeSessionId: session.id,
            tier,
            amount: tierConfig.amount,
            currency: tierConfig.currency,
            status: 'pending',
        };

        // If the user is on the results page and passes assessment data, store it
        // so we can regenerate the exact PDF for this purchase later.
        if (overall !== undefined && dominantType !== undefined && scores !== undefined && scores !== null) {
            let parsedScores = scores;
            if (typeof scores === 'string') {
                try { parsedScores = JSON.parse(scores); } catch (_) { parsedScores = null; }
            }
            if (parsedScores && typeof parsedScores === 'object' && !Array.isArray(parsedScores)) {
                purchaseDoc.assessmentData = {
                    overall:      Number(overall),
                    dominantType: String(dominantType),
                    scores:       parsedScores,
                };
            }
        }

        await Purchase.create(purchaseDoc);

        res.json({ sessionId: session.id, url: session.url });
    } catch (err) {
        // Always log a minimal summary so the error is visible in every environment.
        logger.error('Stripe checkout error', { message: err.message });

        // Detailed diagnostic logging — enabled only when DEBUG_STRIPE=true.
        // Gated to prevent sensitive stack traces from appearing in production
        // logs by default; set DEBUG_STRIPE=true in Railway to enable.
        const debugStripe = process.env.DEBUG_STRIPE === 'true';

        if (debugStripe) {
            // Build a sanitised summary object — omit request headers/body to
            // avoid leaking auth tokens or PII that Stripe may echo back.
            const errSummary = JSON.stringify({
                type: err.type,
                code: err.code,
                statusCode: err.statusCode,
                message: err.message,
                requestId: err.requestId,
                causeCode: err.cause?.code,
                causeMessage: err.cause?.message,
                causeErrno: err.cause?.errno,
                causeSyscall: err.cause?.syscall,
                // Node-level network fields present on low-level errors
                errno: err.errno,
                syscall: err.syscall,
                address: err.address,
                port: err.port,
                hasStripeSecretKey: Boolean(stripeSecretKey),
                stripeKeyPrefix: stripeSecretKey ? stripeSecretKey.slice(0, 7) : 'not-set',
                hasOneTimePriceId,
            });

            // Use console.error with a plain string so Railway captures the data
            // even when the Winston transport drops structured metadata objects.
            console.error('Stripe checkout debug:', errSummary);
            console.error('Stripe checkout error stack:', err.stack);
            if (err.cause) {
                console.error(
                    'Stripe checkout error cause:',
                    err.cause.code,
                    err.cause.message
                );
            }

            // Dump all own property names (including non-enumerable ones) so we
            // capture fields that JSON.stringify silently skips (e.g. `stack`,
            // inherited getters, or library-specific non-enumerable properties).
            console.error(
                'Stripe checkout err own props:',
                Object.getOwnPropertyNames(err)
            );
            // Also log enumerable keys in case the sets differ.
            console.error(
                'Stripe checkout err enum keys:',
                Object.keys(err)
            );
            // Serialize the full error using all own property names so that
            // non-enumerable fields (like `stack`) are included in the output.
            console.error(
                'Stripe checkout err full:',
                JSON.stringify(err, Object.getOwnPropertyNames(err))
            );
            // Log the raw error object last — useful when the JSON representation
            // above is truncated, as Railway may still format it as an object.
            console.error('Stripe checkout raw err:', err);

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

        // Mark purchase as completed and atomically claim the email send slot.
        // If confirmationEmailSent was already true (e.g. webhook fired first),
        // purchase will be null and we skip sending a duplicate email.
        const purchase = await Purchase.findOneAndUpdate(
            { stripeSessionId: session_id, confirmationEmailSent: { $ne: true } },
            { status: 'completed', purchasedAt: new Date(), confirmationEmailSent: true },
            { upsert: false, new: true }
        );

        // If the email was already sent (purchase is null), still ensure status is current.
        if (!purchase) {
            await Purchase.findOneAndUpdate(
                { stripeSessionId: session_id },
                { status: 'completed', purchasedAt: new Date() },
                { upsert: false }
            );
        }

        // Update user record if they have a registered account.
        if (email) {
            const updateFields = tier === 'atlas-premium'
                ? { atlasPremium: true, purchasedDeepReport: true, purchaseDate: new Date() }
                : { purchasedDeepReport: true, purchaseDate: new Date() };

            await User.findOneAndUpdate({ email }, updateFields, { upsert: false }).catch(
                (err) => logger.warn('User update skipped:', err.message)
            );

            await promoteMicroPracticePlansForPurchase(email, tier).catch(
                (err) => logger.warn('Micro-practice plan tier update skipped:', err.message)
            );
        }

        // Send confirmation email for team tiers (Basic/Premium/Enterprise) — self-serve only.
        // The purchase variable is non-null only when we are the first to mark
        // confirmationEmailSent = true, preventing duplicate sends with webhook.
        const isTeamTier = tier === 'starter' || tier === 'pro' || tier === 'enterprise';
        const isIndividualTier = tier === 'atlas-starter' || tier === 'atlas-navigator' || tier === 'atlas-premium';
        if (isTeamTier && email && purchase) {
            const tierConfig = TIERS[tier] || {};
            const priceInDollars = tierConfig.amount ? `$${(tierConfig.amount / 100).toFixed(0)}` : '';
            emailService.sendTeamPurchaseConfirmation(email, {
                planName:  tierConfig.name || tier,
                planPrice: priceInDollars,
                email,
            }).catch((err) => logger.warn('[payments/verify] Confirmation email failed:', err.message));
        }

        // Send purchase welcome email for individual Atlas tier purchases.
        // Only fires once (purchase non-null = first confirmationEmailSent claim).
        if (isIndividualTier && email && purchase) {
            const APP_URL = process.env.APP_URL || 'https://resilience-atlas.app';
            const firstName = (email.split('@')[0] || '').replace(/[._-]/g, ' ').split(' ')[0] || 'Friend';
            emailService.sendPurchaseWelcome(email, {
                firstName,
                tier,
                resultsLink:      `${APP_URL}/results`,
                gamificationLink: `${APP_URL}/gamification`,
            }).catch((err) => logger.warn('[payments/verify] Purchase welcome email failed:', err.message));
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
// Returns the best available tier (individual or teams) in priority order.
// Query: ?email=<email>
// ─────────────────────────────────────────────────────────────────────────────
router.get('/status', paymentsLimiter, async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ error: 'Email is required.' });
        }

        const cleanEmail = email.toLowerCase().trim();

        // Fetch all completed purchases for this email in one query, then find
        // the highest-priority tier in memory to avoid N+1 database calls.
        const purchases = await Purchase.find({
            email: cleanEmail,
            status: 'completed',
            tier: { $in: STATUS_TIER_PRIORITY },
        }).select('tier purchasedAt').lean();

        if (purchases.length === 0) {
            return res.json({ tier: 'free' });
        }

        const purchaseTierSet = new Map(purchases.map(p => [p.tier, p.purchasedAt]));
        for (const tier of STATUS_TIER_PRIORITY) {
            if (purchaseTierSet.has(tier)) {
                return res.json({ tier, purchasedAt: purchaseTierSet.get(tier) });
            }
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
        const db = mongoose.connection.db;

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const tier = session.metadata?.tier;
            const email = (
                session.customer_email ||
                session.metadata?.email ||
                ''
            ).toLowerCase();
            const status = session.payment_status === 'paid' ? 'completed' : 'pending';

            // Upsert the purchase record.  Use a conditional update to atomically
            // set confirmationEmailSent only when transitioning to completed for the
            // first time — prevents duplicate emails if both webhook and verify fire.
            const webhookPurchase = status === 'completed'
                ? await Purchase.findOneAndUpdate(
                    { stripeSessionId: session.id, confirmationEmailSent: { $ne: true } },
                    {
                        status,
                        purchasedAt: new Date(),
                        confirmationEmailSent: true,
                        $setOnInsert: { email, tier, amount: 0, currency: 'usd' },
                    },
                    { upsert: true, new: true }
                )
                : await Purchase.findOneAndUpdate(
                    { stripeSessionId: session.id },
                    {
                        status,
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

                await promoteMicroPracticePlansForPurchase(email, tier).catch(
                    (err) => logger.warn('Webhook micro-practice plan tier update skipped:', err.message)
                );

                // Send purchase confirmation email for team tiers (Basic/Premium).
                // webhookPurchase is non-null only when this webhook is the first to
                // set confirmationEmailSent = true, preventing duplicate sends.
                const isTeamTier = tier === 'starter' || tier === 'pro';
                if (isTeamTier && webhookPurchase) {
                    const tierConfig = TIERS[tier] || {};
                    const priceInDollars = tierConfig.amount ? `$${(tierConfig.amount / 100).toFixed(0)}` : '';
                    emailService.sendTeamPurchaseConfirmation(email, {
                        planName:  tierConfig.name || tier,
                        planPrice: priceInDollars,
                        email,
                    }).catch((err) => logger.warn('[payments/webhook] Confirmation email failed:', err.message));
                }
            }
        }

        // ── IATLAS subscription lifecycle events ─────────────────────────────
        if (
            event.type === 'customer.subscription.created' ||
            event.type === 'customer.subscription.updated'
        ) {
            const subscription = event.data.object;
            const iatlasUserId = subscription.metadata?.userId;
            const iatlasTier   = subscription.metadata?.tier;
            const iatlasPracticeId = subscription.metadata?.practiceId;

            if (subscription.metadata?.productType === 'iatlas' && iatlasUserId && db) {
                await db.collection('iatlas_subscriptions').updateOne(
                    { stripeSubscriptionId: subscription.id },
                    {
                        $set: {
                            userId:              iatlasUserId,
                            tier:                iatlasTier,
                            status:              subscription.status,
                            stripeSubscriptionId: subscription.id,
                            stripeCustomerId:    subscription.customer,
                            currentPeriodStart:  new Date(subscription.current_period_start * 1000),
                            currentPeriodEnd:    new Date(subscription.current_period_end * 1000),
                            cancelAtPeriodEnd:   subscription.cancel_at_period_end,
                            updatedAt:           new Date(),
                        },
                        $setOnInsert: {
                            createdAt: new Date(),
                        },
                    },
                    { upsert: true }
                );
                logger.info(`IATLAS subscription ${event.type}: userId=${iatlasUserId} tier=${iatlasTier} status=${subscription.status}`);

                // Update Practice.billing when this is a practice-tier subscription
                if (iatlasTier === 'practice' && iatlasPracticeId) {
                    try {
                        const Practice = require('../models/Practice');
                        // Build query: prefer practiceId (UUID string), fall back to _id if valid ObjectId
                        const practiceQuery = mongoose.Types.ObjectId.isValid(iatlasPracticeId)
                            ? { $or: [{ practiceId: iatlasPracticeId }, { _id: iatlasPracticeId }] }
                            : { practiceId: iatlasPracticeId };
                        await Practice.findOneAndUpdate(
                            practiceQuery,
                            {
                                $set: {
                                    'billing.stripeCustomerId':     subscription.customer,
                                    'billing.stripeSubscriptionId': subscription.id,
                                    'billing.subscriptionStatus':   subscription.status,
                                    'billing.currentPeriodEnd':     new Date(subscription.current_period_end * 1000),
                                },
                            }
                        );
                        logger.info(`IATLAS Practice billing updated: practiceId=${iatlasPracticeId}`);
                    } catch (practiceErr) {
                        logger.warn('[payments/webhook] Practice billing update skipped:', practiceErr.message);
                    }
                }
            }
        }

        if (event.type === 'customer.subscription.deleted') {
            const deletedSub = event.data.object;

            if (deletedSub.metadata?.productType === 'iatlas' && db) {
                await db.collection('iatlas_subscriptions').updateOne(
                    { stripeSubscriptionId: deletedSub.id },
                    {
                        $set: {
                            status:    'canceled',
                            canceledAt: new Date(),
                            updatedAt:  new Date(),
                        },
                    }
                );
                logger.info(`IATLAS subscription deleted: ${deletedSub.id}`);
            }
        }

        if (event.type === 'invoice.payment_succeeded') {
            const invoice = event.data.object;

            if (invoice.subscription && db) {
                // Retrieve the subscription to check if it's an IATLAS product
                const stripeSubscription = await stripe.subscriptions.retrieve(invoice.subscription)
                    .catch(() => null);

                if (stripeSubscription?.metadata?.productType === 'iatlas') {
                    await db.collection('iatlas_payments').insertOne({
                        stripeInvoiceId:      invoice.id,
                        stripeSubscriptionId: invoice.subscription,
                        amount:               invoice.amount_paid / 100,
                        currency:             invoice.currency,
                        status:               'paid',
                        paidAt:               invoice.status_transitions?.paid_at
                            ? new Date(invoice.status_transitions.paid_at * 1000)
                            : new Date(),
                        createdAt: new Date(),
                    });
                    logger.info(`IATLAS invoice paid: ${invoice.id}`);
                }
            }
        }

        if (event.type === 'invoice.payment_failed') {
            const failedInvoice = event.data.object;

            if (failedInvoice.subscription && db) {
                const stripeSubscription = await stripe.subscriptions.retrieve(failedInvoice.subscription)
                    .catch(() => null);

                if (stripeSubscription?.metadata?.productType === 'iatlas') {
                    await db.collection('iatlas_payments').insertOne({
                        stripeInvoiceId:      failedInvoice.id,
                        stripeSubscriptionId: failedInvoice.subscription,
                        amount:               failedInvoice.amount_due / 100,
                        currency:             failedInvoice.currency,
                        status:               'failed',
                        failedAt:             new Date(),
                        createdAt:            new Date(),
                    });
                    logger.info(`IATLAS invoice payment failed: ${failedInvoice.id}`);
                }
            }
        }

        res.json({ received: true });
    } catch (error) {
        logger.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed.' });
    }
});

module.exports = router;
