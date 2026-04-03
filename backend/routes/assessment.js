'use strict';

/**
 * backend/routes/assessment.js — Assessment access-control endpoints.
 *
 * Endpoints:
 *   GET  /api/assessment/access          — Check if user can download a specific report.
 *   GET  /api/assessment/unlock-options  — Return available purchase options.
 *   GET  /api/assessment/unlocked-reports — List all unlocked report hashes for an email.
 *   GET  /api/assessment/history         — Get user's assessment history with unlock status.
 *
 * All endpoints use email-based identification (consistent with /api/report/*).
 * Authentication is not required since email is the primary identifier in the
 * individual assessment flow.
 */

const express    = require('express');
const rateLimit  = require('express-rate-limit');
const Purchase   = require('../models/Purchase');
const ResilienceResult = require('../models/ResilienceResult');
const {
    canDownloadReport,
    getUnlockOptions,
    hasUnlimitedAccess,
    getUnlockedReportHashes,
    buildAssessmentHash,
    BLANKET_ACCESS_TIERS,
} = require('../services/assessmentAccessControl');
const logger = require('../utils/logger');

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
            return {
                hash,
                overall:      r.overall,
                dominantType: r.dominantType,
                scores:       scoresObj,
                createdAt:    r.createdAt,
                pdfUnlocked,
                tier:         pdfUnlocked
                    ? (navigatorAccess ? 'atlas-navigator' : (purchase ? purchase.tier : null))
                    : null,
                unlockedAt:   purchase ? (purchase.purchasedAt || purchase.createdAt) : null,
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

module.exports = router;
