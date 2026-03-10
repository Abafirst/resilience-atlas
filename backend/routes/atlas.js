'use strict';

const express   = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateJWT } = require('../middleware/auth');
const ResilienceAssessment = require('../models/ResilienceAssessment');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting: 60 requests per minute per IP
const atlasLimiter = rateLimit({
    windowMs: 60 * 1000,
    max:      60,
    standardHeaders: true,
    legacyHeaders:   false,
    message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(atlasLimiter);

/**
 * GET /api/atlas/history
 * Retrieve the authenticated user's assessment history (last 20 assessments).
 */
router.get('/history', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        const assessments = await ResilienceAssessment.find({ userId })
            .sort({ assessmentDate: -1 })
            .limit(20)
            .lean();

        res.status(200).json({
            assessments,
            count: assessments.length,
        });
    } catch (err) {
        logger.error('Atlas history fetch error:', err);
        res.status(500).json({ error: 'Could not retrieve assessment history.' });
    }
});

/**
 * GET /api/atlas/assessment/:id
 * Retrieve a single assessment by ID (must belong to the authenticated user).
 */
router.get('/assessment/:id', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        const assessment = await ResilienceAssessment.findOne({
            _id: req.params.id,
            userId,
        }).lean();

        if (!assessment) {
            return res.status(404).json({ error: 'Assessment not found.' });
        }

        res.status(200).json({ assessment });
    } catch (err) {
        logger.error('Atlas assessment fetch error:', err);
        res.status(500).json({ error: 'Could not retrieve assessment.' });
    }
});

module.exports = router;
