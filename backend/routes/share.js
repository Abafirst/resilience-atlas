'use strict';

const express   = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateJWT } = require('../middleware/auth');
const ResilienceAssessment = require('../models/ResilienceAssessment');
const { generateShareCard } = require('../services/shareCardGenerator');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting: 30 requests per minute per IP (SVG generation is more expensive)
const shareLimiter = rateLimit({
    windowMs: 60 * 1000,
    max:      30,
    standardHeaders: true,
    legacyHeaders:   false,
    message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(shareLimiter);

/**
 * GET /api/share/profile-card
 * Generate and return an SVG profile card for the user's latest assessment.
 */
router.get('/profile-card', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        const latest = await ResilienceAssessment.findOne({ userId })
            .sort({ assessmentDate: -1 })
            .lean();

        if (!latest) {
            return res.status(404).json({
                error: 'No assessment found. Please complete the quiz first.',
            });
        }

        const cardBuffer = generateShareCard({
            overall:     latest.overall,
            dominantType: latest.dominantType,
            scores:      latest.scores,
            direction:   'N',
        });

        res.set('Content-Type', 'image/svg+xml');
        res.set('Content-Disposition', 'inline; filename="resilience-profile.svg"');
        res.set('Cache-Control', 'private, max-age=3600');
        res.send(cardBuffer);
    } catch (err) {
        logger.error('Share card generation error:', err);
        res.status(500).json({ error: 'Could not generate profile card.' });
    }
});

/**
 * GET /api/share/profile-card/:assessmentId
 * Generate a share card for a specific assessment (public — no auth required).
 */
router.get('/profile-card/:assessmentId', async (req, res) => {
    try {
        const assessment = await ResilienceAssessment
            .findById(req.params.assessmentId);

        if (!assessment) {
            return res.status(404).json({ error: 'Assessment not found.' });
        }

        const cardBuffer = generateShareCard({
            overall:      assessment.overall,
            dominantType: assessment.dominantType,
            scores:       assessment.scores,
            direction:    'N',
        });

        res.set('Content-Type', 'image/svg+xml');
        res.set('Content-Disposition', 'inline; filename="resilience-profile.svg"');
        res.set('Cache-Control', 'public, max-age=86400');
        res.send(cardBuffer);
    } catch (err) {
        logger.error('Share card generation error:', err);
        res.status(500).json({ error: 'Could not generate profile card.' });
    }
});

module.exports = router;
