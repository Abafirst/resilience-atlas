'use strict';

/**
 * backend/routes/assessment.js — Assessment access-control endpoints.
 *
 * Endpoints:
 *   GET  /api/assessment/access               — Check if user can download a specific report.
 *   GET  /api/assessment/unlock-options       — Return available purchase options.
 *   GET  /api/assessment/unlocked-reports     — List all unlocked report hashes for an email.
 *   GET  /api/assessment/history              — Get user's assessment history with unlock status.
 *   POST /api/assessment/unlock-payment       — Create Stripe payment intent for inline checkout.
 *   POST /api/assessment/unlock-payment/confirm — Confirm payment and mark purchase complete.
 *
 * All endpoints use email-based identification (consistent with /api/report/*).
 * Authentication is not required since email is the primary identifier in the
 * individual assessment flow.
 */

const express    = require('express');
const rateLimit  = require('express-rate-limit');
const Purchase   = require('../models/Purchase');
const ResilienceResult = require('../models/ResilienceResult');
const stripe     = require('../config/stripe');
const {
    canDownloadReport,
    getUnlockOptions,
    hasUnlimitedAccess,
    getUnlockedReportHashes,
    buildAssessmentHash,
    BLANKET_ACCESS_TIERS,
} = require('../services/assessmentAccessControl');
const logger = require('../utils/logger');

/** Per-tier amounts in cents used for inline payment intent creation. */
const UNLOCK_TIER_AMOUNTS = {
    'atlas-starter':   999,  // $9.99
    'atlas-navigator': 4999, // $49.99
};

/** HTML entities potentially introduced by the sanitisation middleware. */
const HTML_ENTITY_DECODE_MAP = {
    '&quot;': '"', '&#34;': '"', '&#x22;': '"',
    '&apos;': "'", '&#39;': "'", '&#x27;': "'",
    '&amp;': '&', '&lt;': '<', '&gt;': '>',
};

const STRIPE_PLACEHOLDER_KEY = 'pk_test_placeholder';

function decodeHtmlEntities(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/&(?:[a-z]+|#\d+|#x[\da-f]+);/gi, (e) => HTML_ENTITY_DECODE_MAP[e] ?? e);
}

/**
 * Validate an email address without a ReDoS-prone regex.
 * Uses a length limit and split-based check rather than a complex regex.
 * @param {string} email — normalised (lowercase, trimmed) email
 * @returns {boolean}
 */
function isValidEmail(email) {
    if (!email || email.length > 254) return false;
    const atIdx = email.lastIndexOf('@');
    if (atIdx < 1) return false; // no '@' or '@' at start
    const local  = email.slice(0, atIdx);
    const domain = email.slice(atIdx + 1);
    return local.length > 0 && domain.length >= 3 && domain.includes('.');
}

const router = express.Router();

const accessLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(accessLimiter);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Reverse HTML entity encoding applied by the sanitiseInput middleware.
 * Necessary when JSON strings are passed as query parameters.
 */
function unescapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/')
        .replace(/&#x3D;/g, '=')
        .replace(/&lt;/g,   '<')
        .replace(/&gt;/g,   '>')
        .replace(/&amp;/g,  '&');
}

// ── GET /api/assessment/unlock-options ───────────────────────────────────────

/**
 * Return the available PDF unlock options (pricing).
 * No email or auth required — this is purely informational.
 */
router.get('/unlock-options', (req, res) => {
    return res.json({ unlockOptions: getUnlockOptions() });
});

// ── GET /api/assessment/access ───────────────────────────────────────────────

/**
 * Check whether an email address can download the PDF for a specific assessment.
 *
 * Query params:
 *   email       (required)
 *   overall     (optional) — assessment overall score
 *   dominantType (optional) — assessment dominant type
 *   scores      (optional) — JSON-encoded scores object
 *
 * Response:
 *   {
 *     allowed: boolean,
 *     hasNavigatorAccess: boolean,
 *     isCurrentAssessmentUnlocked: boolean,
 *     unlockOptions: [...],
 *     assessmentHash: string | null,
 *   }
 */
router.get('/access', async (req, res) => {
    const { email, overall, dominantType } = req.query;
    const scores = unescapeHtml(req.query.scores);

    if (!email) {
        return res.status(400).json({ error: 'email parameter is required', allowed: false });
    }

    // In dev/test environments without Stripe, grant access freely.
    if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV !== 'production') {
        return res.json({
            allowed: true,
            hasNavigatorAccess: true,
            isCurrentAssessmentUnlocked: true,
            unlockOptions: [],
            assessmentHash: null,
        });
    }

    try {
        const navigatorAccess = await hasUnlimitedAccess(email);

        // Build hash if assessment data was provided.
        let assessmentHash = null;
        if (overall && scores) {
            try {
                const scoresObj  = JSON.parse(scores);
                assessmentHash   = buildAssessmentHash(String(overall), dominantType || '', JSON.stringify(scoresObj));
            } catch {
                // Invalid scores JSON — ignore assessment-specific check.
            }
        }

        let isCurrentAssessmentUnlocked = navigatorAccess;

        if (!isCurrentAssessmentUnlocked && assessmentHash) {
            const { allowed } = await canDownloadReport(email, assessmentHash);
            isCurrentAssessmentUnlocked = allowed;
        }

        return res.json({
            allowed:                     isCurrentAssessmentUnlocked,
            hasNavigatorAccess:          navigatorAccess,
            isCurrentAssessmentUnlocked,
            unlockOptions:               isCurrentAssessmentUnlocked ? [] : getUnlockOptions(),
            assessmentHash,
        });
    } catch (err) {
        logger.error('[assessment/access] error:', err.message);
        return res.status(503).json({
            error: 'Unable to verify access at this time. Please try again shortly.',
            allowed: false,
        });
    }
});

// ── GET /api/assessment/unlocked-reports ─────────────────────────────────────

/**
 * Return the list of assessment hashes the user has unlocked.
 * Navigator users have blanket access; Starter users get a list of hashes.
 *
 * Query params:
 *   email (required)
 *
 * Response:
 *   {
 *     hasNavigatorAccess: boolean,
 *     unlockedHashes: string[],
 *   }
 */
router.get('/unlocked-reports', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'email parameter is required' });
    }

    if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV !== 'production') {
        return res.json({ hasNavigatorAccess: true, unlockedHashes: [] });
    }

    try {
        const navigatorAccess = await hasUnlimitedAccess(email);
        const unlockedHashes  = navigatorAccess ? [] : await getUnlockedReportHashes(email);
        return res.json({ hasNavigatorAccess: navigatorAccess, unlockedHashes });
    } catch (err) {
        logger.error('[assessment/unlocked-reports] error:', err.message);
        return res.status(503).json({
            error: 'Unable to retrieve unlocked reports at this time.',
        });
    }
});

// ── GET /api/assessment/history ──────────────────────────────────────────────

/**
 * Return the user's assessment history with unlock status for each attempt.
 *
 * Query params:
 *   email (required)
 *
 * Response:
 *   {
 *     hasNavigatorAccess: boolean,
 *     assessments: [
 *       {
 *         hash:        string,
 *         overall:     number,
 *         dominantType: string,
 *         scores:      object,
 *         createdAt:   date,
 *         pdfUnlocked: boolean,
 *         tier:        string | null,
 *       },
 *       ...
 *     ]
 *   }
 */
router.get('/history', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'email parameter is required' });
    }

    if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV !== 'production') {
        return res.json({ hasNavigatorAccess: true, assessments: [] });
    }

    try {
        const cleanEmail = String(email).toLowerCase().trim();

        const [navigatorAccess, unlockedHashes, results] = await Promise.all([
            hasUnlimitedAccess(cleanEmail),
            getUnlockedReportHashes(cleanEmail),
            ResilienceResult.find({ email: cleanEmail })
                .sort({ createdAt: -1 })
                .limit(50)
                .lean(),
        ]);

        // Also fetch Starter purchases to find purchase dates for matched hashes.
        const purchases = await Purchase.find({
            email:  cleanEmail,
            tier:   'atlas-starter',
            status: 'completed',
        }).lean();

        // Build a map of hash → purchase record for Starter unlocks.
        const hashToPurchase = {};
        for (const p of purchases) {
            if (!p.assessmentData || !p.assessmentData.scores) continue;
            const h = buildAssessmentHash(
                String(p.assessmentData.overall),
                p.assessmentData.dominantType || '',
                JSON.stringify(p.assessmentData.scores)
            );
            hashToPurchase[h] = p;
        }

        const unlockedHashSet = new Set(unlockedHashes);

        const assessments = results.map((r) => {
            let scoresObj = r.scores;
            if (scoresObj && typeof scoresObj.toObject === 'function') {
                scoresObj = scoresObj.toObject();
            }
            const hash = buildAssessmentHash(
                String(r.overall || 0),
                r.dominantType || '',
                JSON.stringify(scoresObj || {})
            );
            const pdfUnlocked = navigatorAccess || unlockedHashSet.has(hash);
            const purchase     = hashToPurchase[hash];
            let unlockedTier   = null;
            if (pdfUnlocked) {
                if (navigatorAccess) {
                    unlockedTier = 'atlas-navigator';
                } else if (purchase) {
                    unlockedTier = purchase.tier;
                }
            }
            return {
                hash,
                overall:      r.overall,
                dominantType: r.dominantType,
                scores:       scoresObj,
                createdAt:    r.createdAt,
                pdfUnlocked,
                tier:       unlockedTier,
                unlockedAt: purchase ? (purchase.purchasedAt || purchase.createdAt) : null,
            };
        });

        return res.json({ hasNavigatorAccess: navigatorAccess, assessments });
    } catch (err) {
        logger.error('[assessment/history] error:', err.message);
        return res.status(503).json({
            error: 'Unable to retrieve assessment history at this time.',
        });
    }
});

// ── POST /api/assessment/unlock-payment ──────────────────────────────────────

/**
 * Create a Stripe payment intent for inline (embedded) checkout.
 * The client confirms the payment using Stripe.js and then calls
 * /api/assessment/unlock-payment/confirm to record the purchase.
 *
 * Body:
 *   email        (required) — user email
 *   tier         (required) — 'atlas-starter' | 'atlas-navigator'
 *   overall      (optional) — assessment score (needed for atlas-starter hash)
 *   dominantType (optional) — assessment dominant type
 *   scores       (optional) — JSON object of dimension scores
 *
 * Response:
 *   { clientSecret, paymentIntentId }
 */
router.post('/unlock-payment', async (req, res) => {
    if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(503).json({ error: 'Payment service is not configured.' });
    }

    const { tier, overall, dominantType } = req.body;
    let { email, scores } = req.body;

    if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'email is required.' });
    }
    if (!UNLOCK_TIER_AMOUNTS[tier]) {
        return res.status(400).json({ error: 'Invalid tier. Must be atlas-starter or atlas-navigator.' });
    }

    // Normalise email.
    const cleanEmail = decodeHtmlEntities(String(email))
        .replace(/"/g, '').replace(/'/g, '').trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
        return res.status(400).json({ error: 'Valid email is required.' });
    }

    // Parse scores if passed as a string.
    let parsedScores = null;
    if (scores) {
        try {
            parsedScores = typeof scores === 'string' ? JSON.parse(decodeHtmlEntities(scores)) : scores;
        } catch (_) { /* ignore parse failures */ }
    }

    try {
        const amount   = UNLOCK_TIER_AMOUNTS[tier];
        const currency = 'usd';

        // Create a Stripe Payment Intent for inline checkout.
        const intent = await stripe.paymentIntents.create({
            amount,
            currency,
            metadata: { tier, email: cleanEmail },
            description: tier === 'atlas-starter'
                ? 'Atlas Starter — Unlock single PDF report'
                : 'Atlas Navigator — Lifetime unlimited PDF reports',
        });

        // Create a pending Purchase record so we can fulfil on confirmation.
        const purchaseDoc = {
            email:          cleanEmail,
            tier,
            amount,
            currency,
            status:         'pending',
            stripeSessionId: intent.id, // reuse field to store payment intent id
        };

        if (overall !== undefined && dominantType !== undefined && parsedScores) {
            purchaseDoc.assessmentData = {
                overall:     Number(overall),
                dominantType: String(dominantType),
                scores:      parsedScores,
            };
        }

        await Purchase.create(purchaseDoc);

        return res.json({ clientSecret: intent.client_secret, paymentIntentId: intent.id });
    } catch (err) {
        logger.error('[assessment/unlock-payment] Stripe error:', err.message);
        return res.status(500).json({ error: 'Failed to create payment. Please try again.' });
    }
});

// ── POST /api/assessment/unlock-payment/confirm ───────────────────────────────

/**
 * Confirm a completed payment intent and mark the purchase as unlocked.
 * Called by the frontend after stripe.confirmCardPayment() succeeds.
 *
 * Body:
 *   paymentIntentId (required) — Stripe payment intent ID (pi_…)
 *   email           (required) — user email
 *   tier            (required) — 'atlas-starter' | 'atlas-navigator'
 *   overall         (optional) — included so we can update assessmentData if missing
 *   dominantType    (optional)
 *   scores          (optional) — JSON object
 *
 * Response:
 *   { success: true, tier, purchasedAt }
 */
router.post('/unlock-payment/confirm', async (req, res) => {
    if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(503).json({ error: 'Payment service is not configured.' });
    }

    const { paymentIntentId, tier, overall, dominantType } = req.body;
    let { email, scores } = req.body;

    if (!paymentIntentId || !email || !tier) {
        return res.status(400).json({ error: 'paymentIntentId, email, and tier are required.' });
    }

    // Validate paymentIntentId format: Stripe IDs start with "pi_" and contain
    // only alphanumeric characters, underscores, and hyphens.
    if (!/^pi_[A-Za-z0-9_-]+$/.test(String(paymentIntentId))) {
        return res.status(400).json({ error: 'Invalid paymentIntentId format.' });
    }

    const cleanEmail = decodeHtmlEntities(String(email))
        .replace(/"/g, '').replace(/'/g, '').trim().toLowerCase();

    if (!isValidEmail(cleanEmail)) {
        return res.status(400).json({ error: 'Valid email is required.' });
    }

    let parsedScores = null;
    if (scores) {
        try {
            parsedScores = typeof scores === 'string' ? JSON.parse(decodeHtmlEntities(scores)) : scores;
        } catch (_) { /* ignore */ }
    }

    try {
        // Verify the payment intent is actually paid.
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (intent.status !== 'succeeded') {
            return res.status(402).json({ error: 'Payment has not been completed.' });
        }

        const now = new Date();
        const update = { status: 'completed', purchasedAt: now };

        // Ensure assessmentData is stored (may have been missing on creation).
        if (overall !== undefined && dominantType !== undefined && parsedScores) {
            update.assessmentData = {
                overall:     Number(overall),
                dominantType: String(dominantType),
                scores:      parsedScores,
            };
        }

        // Use the already-validated paymentIntentId (regex-checked above) as a
        // plain string to prevent operator injection in the MongoDB query.
        const safeIntentId = String(paymentIntentId);

        // Mark the pending purchase created in unlock-payment as completed.
        const purchase = await Purchase.findOneAndUpdate(
            { stripeSessionId: safeIntentId, email: cleanEmail },
            update,
            { new: true }
        );

        if (!purchase) {
            // Fallback: create a completed purchase if the pending record is missing.
            const newPurchase = await Purchase.create({
                email:          cleanEmail,
                tier,
                amount:         UNLOCK_TIER_AMOUNTS[tier] || 999,
                currency:       'usd',
                status:         'completed',
                purchasedAt:    now,
                stripeSessionId: safeIntentId,
                ...(overall !== undefined && dominantType !== undefined && parsedScores
                    ? { assessmentData: { overall: Number(overall), dominantType: String(dominantType), scores: parsedScores } }
                    : {}),
            });
            return res.json({ success: true, tier, purchasedAt: newPurchase.purchasedAt });
        }

        return res.json({ success: true, tier, purchasedAt: purchase.purchasedAt });
    } catch (err) {
        logger.error('[assessment/unlock-payment/confirm] error:', err.message);
        return res.status(500).json({ error: 'Failed to confirm payment. Please contact support.' });
    }
});

module.exports = router;
