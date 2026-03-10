'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { authenticateJWT } = require('../middleware/auth');
const { calculateResilienceScores } = require('../scoring');
const { buildResultsHash } = require('../services/reportService');
const { addReportJob } = require('../../queue/reportQueue');
const ResilienceReport = require('../models/ResilienceReport');
const logger = require('../utils/logger');

const router = express.Router();

// ── Rate limiting: max 100 quiz submissions per minute per IP ─────────────────
const quizRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again in a minute.' },
});

/**
 * POST /api/quiz/submit
 * Submit quiz answers, persist scores, queue report generation, and return immediately.
 */
router.post('/submit', quizRateLimiter, authenticateJWT, async (req, res) => {
    try {
        const { answers } = req.body;

        if (!answers || !Array.isArray(answers) || answers.length !== 36) {
            return res.status(400).json({ error: 'Please provide all 36 answers.' });
        }

        // 1. Calculate scores (synchronous, fast).
        const scores = calculateResilienceScores(answers);

        // 2. Save results to user's profile.
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            {
                $push: {
                    quizResults: {
                        completedAt: new Date(),
                        scores: scores.categories,
                        overallScore: scores.overall,
                        dominantType: scores.dominantType,
                    },
                },
            },
            { new: true }
        );

        // 3. Create a pending ResilienceReport document (cache key).
        const resultsHash = buildResultsHash(scores);

        // Upsert to handle concurrent submissions with identical answers.
        await ResilienceReport.findOneAndUpdate(
            { userId: req.user.userId, resultsHash },
            { $setOnInsert: { userId: req.user.userId, resultsHash, status: 'pending' } },
            { upsert: true, new: true }
        ).catch(() => {
            // Ignore duplicate-key errors from the unique index — report already exists.
        });

        // 4. Queue background report generation (non-blocking).
        const jobQueued = await addReportJob({
            userId: req.user.userId,
            scores,
            username: req.user.username || (user && user.username),
            email: user ? user.email : null,
            resultsHash,
        });

        if (!jobQueued) {
            logger.warn('Report queue unavailable — report will not be generated asynchronously.');
        }

        logger.info(`Quiz submitted by user: ${req.user.username}`);

        // 5. Return immediately with scores and submission confirmation.
        return res.status(200).json({
            status: 'submitted',
            message: 'Quiz submitted successfully. Your full report is being generated.',
            scores: scores.categories,
            overall: scores.overall,
            dominantType: scores.dominantType,
            resultsHash,
        });
    } catch (err) {
        logger.error('Quiz submission error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * GET /api/quiz/results
 * Get quiz history for the authenticated user.
 */
router.get('/results', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.status(200).json({ results: user.quizResults });
    } catch (err) {
        logger.error('Quiz results fetch error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * GET /api/quiz/questions
 * Return the list of quiz questions.
 */
router.get('/questions', (req, res) => {
    try {
        const questions = require('../../questions.json');
        res.status(200).json({ questions });
    } catch (err) {
        logger.error('Questions fetch error:', err);
        res.status(500).json({ error: 'Could not load questions.' });
    }
});

module.exports = router;

