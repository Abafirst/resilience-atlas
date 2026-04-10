'use strict';

/**
 * teams-resources.js — Secure Teams Resource Access Routes
 *
 * All routes under /api/teams
 *
 * Endpoints:
 *   GET /api/teams/access          — verify teams purchase (session_id, email, or Bearer JWT)
 *   GET /api/teams/download/:id    — download a resource PDF (requires session_id, email, or Bearer JWT)
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const router = express.Router();

const stripe = require('../config/stripe');
const Purchase = require('../models/Purchase');
const logger = require('../utils/logger');
const { generateResourcePdf, ALL_RESOURCE_IDS } = require('../services/teamsResourcePdfService');

// Rate limiter — 30 requests per minute per IP
const teamsLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again in a moment.' },
});

// Rate limiter for downloads — 20 per 10 minutes per IP
const downloadLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many download requests. Please try again shortly.' },
});

// Tiers that grant teams resource access
const TEAMS_TIERS = new Set(['starter', 'pro', 'enterprise']);

// Tier order for comparisons (higher index = more access)
const TIER_ORDER = { starter: 1, pro: 2, enterprise: 3 };

/**
 * Returns true if userTier meets or exceeds the requiredTier.
 * Enterprise implies Premium implies Basic.
 */
function tierMeetsRequirement(userTier, requiredTier) {
    return (TIER_ORDER[userTier] || 0) >= (TIER_ORDER[requiredTier] || 0);
}

/**
 * Per-resource minimum tier requirements.
 * Mirrors the minTier values in client/src/data/teamsContent.js.
 *
 * Tier hierarchy: starter (Basic) < pro (Premium) < enterprise (Enterprise)
 *
 * Workshop Guides: Premium-only (pro)
 * Templates, Activity Cards, Facilitation: Basic (starter)
 * Most Visuals: Premium (pro); vis-001, vis-002, vis-014: Basic; vis-013: Enterprise
 */
const RESOURCE_MIN_TIERS = {
    // Workshop Guides — Premium-only
    'hand-001': 'pro',
    'hand-002': 'pro',
    'hand-003': 'pro',
    'hand-004': 'pro',
    'hand-005': 'pro',
    'hand-006': 'pro',
    // Templates — Basic
    'hand-007': 'starter',
    'hand-008': 'starter',
    'hand-009': 'starter',
    'hand-011': 'starter',
    'hand-016': 'starter',
    // Discussion Prompt Sheets — Basic
    'hand-010': 'starter',
    // Activity Cards — Basic
    'hand-014': 'starter',
    'hand-015': 'starter',
    // Facilitation / Bonus downloads — Basic
    'hand-012': 'starter',
    'hand-013': 'starter',
    'hand-017': 'starter',
    // Visuals — Basic: vis-001, vis-002, vis-014
    'vis-001': 'starter',
    'vis-002': 'starter',
    'vis-014': 'starter',
    // Visuals — Premium: vis-003..vis-012
    'vis-003': 'pro',
    'vis-004': 'pro',
    'vis-005': 'pro',
    'vis-006': 'pro',
    'vis-007': 'pro',
    'vis-008': 'pro',
    'vis-009': 'pro',
    'vis-010': 'pro',
    'vis-011': 'pro',
    'vis-012': 'pro',
    // Visuals — Enterprise: vis-013
    'vis-013': 'enterprise',
};

/**
 * Extract the userId from a Bearer JWT in the Authorization header.
 * Returns null if no token is present, the token is invalid, or JWT_SECRET is not configured.
 */
function extractUserIdFromToken(req) {
    if (!process.env.JWT_SECRET) return null;
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.userId || decoded.id || null;
    } catch {
        return null;
    }
}

/**
 * Verify whether a given session_id, email, or authenticated userId corresponds
 * to a completed teams-tier purchase.
 * Returns { valid: boolean, tier: string|null }.
 *
 * @param {string|null} sessionId  Stripe checkout session ID
 * @param {string|null} email      Purchaser email
 * @param {string|null} userId     Authenticated user's MongoDB ObjectId (from JWT)
 */
async function verifyTeamsAccess(sessionId, email, userId = null) {
    // Normalise email once up front so all DB queries use the same value.
    const emailNorm = email ? email.toLowerCase().trim() : null;

    // Primary: verify via authenticated userId (most secure)
    if (userId) {
        const purchase = await Purchase.findOne({
            userId,
            status: 'completed',
            tier: { $in: Array.from(TEAMS_TIERS) },
        })
            .sort({ purchasedAt: -1 })
            .lean();

        if (purchase) {
            return { valid: true, tier: purchase.tier };
        }
    }

    // Secondary: verify via Stripe session ID
    if (sessionId) {
        // First check our database
        const purchase = await Purchase.findOne({
            stripeSessionId: sessionId,
            status: 'completed',
        }).lean();

        if (purchase && TEAMS_TIERS.has(purchase.tier)) {
            return { valid: true, tier: purchase.tier };
        }

        // If not found in DB, try Stripe directly (handles race conditions at purchase time)
        try {
            const session = await stripe.checkout.sessions.retrieve(sessionId);
            if (session.payment_status === 'paid') {
                const tier = session.metadata && session.metadata.tier;
                if (tier && TEAMS_TIERS.has(tier)) {
                    return { valid: true, tier };
                }
            }
        } catch (stripeErr) {
            logger.warn('[teams] Stripe session lookup failed:', stripeErr.message);
        }
    }

    // Fallback: verify via email
    if (emailNorm) {
        const purchase = await Purchase.findOne({
            email: emailNorm,
            status: 'completed',
            tier: { $in: Array.from(TEAMS_TIERS) },
        })
            .sort({ purchasedAt: -1 })
            .lean();

        if (purchase) {
            return { valid: true, tier: purchase.tier };
        }
    }

    return { valid: false, tier: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/teams/access
// Check whether the requester holds a valid Teams-tier purchase.
// Query: ?session_id=<cs_xxx>  OR  ?email=<email>
// OR: Authorization: Bearer <jwt>  (for authenticated org/team users)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/access', teamsLimiter, async (req, res) => {
    try {
        const sessionId = (req.query.session_id || '').trim();
        const email     = (req.query.email     || '').trim();
        const userId    = extractUserIdFromToken(req);

        if (!sessionId && !email && !userId) {
            return res.status(400).json({ error: 'session_id, email, or authenticated session is required.' });
        }

        const result = await verifyTeamsAccess(sessionId || null, email || null, userId);
        return res.json(result);
    } catch (err) {
        logger.error('[teams/access] Error:', err);
        return res.status(500).json({ error: 'Unable to verify access.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/teams/download/:resourceId
// Stream a PDF resource.  Requires proof of teams purchase.
// Query: ?session_id=<cs_xxx>  or  ?email=<email>
// OR: Authorization: Bearer <jwt>  (for authenticated users)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/download/:resourceId', downloadLimiter, async (req, res) => {
    try {
        const { resourceId } = req.params;
        const sessionId = (req.query.session_id || '').trim();
        const email     = (req.query.email     || '').trim();
        const userId    = extractUserIdFromToken(req);

        // Validate resource ID
        if (!ALL_RESOURCE_IDS.includes(resourceId)) {
            return res.status(404).json({ error: 'Resource not found.' });
        }

        // Verify access
        if (!sessionId && !email && !userId) {
            return res.status(401).json({
                error: 'Purchase verification required. Please include session_id, email, or log in.',
            });
        }

        const { valid, tier } = await verifyTeamsAccess(sessionId || null, email || null, userId);
        if (!valid) {
            return res.status(403).json({
                error: 'Access denied. A valid Teams purchase is required to download this resource.',
            });
        }

        // Per-resource tier check — enforce minTier for each item
        const requiredTier = RESOURCE_MIN_TIERS[resourceId];
        if (requiredTier && !tierMeetsRequirement(tier, requiredTier)) {
            const TIER_LABELS = { starter: 'Atlas Team Basic', pro: 'Atlas Team Premium', enterprise: 'Atlas Team Enterprise' };
            const tierLabel = TIER_LABELS[requiredTier] || 'Atlas Team Premium';
            return res.status(403).json({
                error: `This resource requires ${tierLabel} access.`,
            });
        }

        // Generate filename
        const filename = `resilience-atlas-${resourceId}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Cache-Control', 'private, max-age=3600');
        res.setHeader('X-Teams-Tier', tier);

        // Generate and stream the PDF
        const doc = generateResourcePdf(resourceId);
        doc.pipe(res);

        doc.on('error', (pdfErr) => {
            logger.error('[teams/download] PDF generation error:', pdfErr);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to generate PDF.' });
            }
        });
    } catch (err) {
        logger.error('[teams/download] Error:', err);
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Failed to process download request.' });
        }
    }
});

module.exports = router;
