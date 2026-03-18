'use strict';

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const UpsellEvent = require('../models/UpsellEvent');
const logger = require('../utils/logger');

/** Rate limiter — prevents event-flood abuse. */
const upsellLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again shortly.' },
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/upsell/event
// Log a single upsell lifecycle event (impression, dismiss, click, conversion).
// Body: { sessionId, trigger, variant, targetTier, eventType, userTier?,
//         offerShown?, campaign?, pageUrl? }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/event', upsellLimiter, async (req, res) => {
    try {
        const {
            sessionId,
            trigger,
            variant,
            targetTier,
            eventType,
            userTier,
            offerShown,
            campaign,
            pageUrl,
        } = req.body;

        if (!sessionId || typeof sessionId !== 'string') {
            return res.status(400).json({ error: 'sessionId is required.' });
        }
        if (!trigger) {
            return res.status(400).json({ error: 'trigger is required.' });
        }
        if (!targetTier) {
            return res.status(400).json({ error: 'targetTier is required.' });
        }
        if (!eventType) {
            return res.status(400).json({ error: 'eventType is required.' });
        }

        const event = await UpsellEvent.create({
            sessionId: String(sessionId).slice(0, 128),
            trigger,
            variant:    variant    || 'control',
            targetTier,
            eventType,
            userTier:   userTier   || 'free',
            offerShown: Boolean(offerShown),
            campaign:   campaign   ? String(campaign).slice(0, 64) : null,
            pageUrl:    pageUrl    ? String(pageUrl).slice(0, 512) : null,
            userAgent:  req.headers['user-agent']
                ? req.headers['user-agent'].slice(0, 256)
                : null,
        });

        res.status(201).json({ success: true, id: event._id });
    } catch (error) {
        logger.error('Upsell event error:', error);
        res.status(500).json({ error: 'Failed to record upsell event.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/upsell/stats
// Return aggregated upsell funnel stats.
// Query: ?days=30 (default 30)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', upsellLimiter, async (req, res) => {
    try {
        const days = Math.min(parseInt(req.query.days, 10) || 30, 365);
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const [byEventType, byTrigger, byVariant] = await Promise.all([
            // Total counts per event type
            UpsellEvent.aggregate([
                { $match: { createdAt: { $gte: since } } },
                { $group: { _id: '$eventType', count: { $sum: 1 } } },
            ]),

            // Impressions per trigger
            UpsellEvent.aggregate([
                { $match: { createdAt: { $gte: since }, eventType: 'impression' } },
                { $group: { _id: '$trigger', impressions: { $sum: 1 } } },
                { $sort: { impressions: -1 } },
            ]),

            // A/B variant performance: impressions vs conversions
            UpsellEvent.aggregate([
                { $match: { createdAt: { $gte: since } } },
                {
                    $group: {
                        _id: { variant: '$variant', eventType: '$eventType' },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.variant': 1 } },
            ]),
        ]);

        // Build a summary object for the response
        const totals = { impression: 0, dismiss: 0, click: 0, conversion: 0 };
        byEventType.forEach((row) => {
            if (totals[row._id] !== undefined) {
                totals[row._id] = row.count;
            }
        });

        const conversionRate =
            totals.impression > 0
                ? ((totals.conversion / totals.impression) * 100).toFixed(2)
                : '0.00';

        res.json({
            period: `${days}d`,
            totals,
            conversionRate: `${conversionRate}%`,
            byTrigger,
            byVariant,
        });
    } catch (error) {
        logger.error('Upsell stats error:', error);
        res.status(500).json({ error: 'Failed to retrieve upsell stats.' });
    }
});

module.exports = router;
