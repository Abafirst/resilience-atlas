const express = require('express');
const User = require('../models/User');
const { authenticateJWT } = require('../middleware/auth');
const { calculateResilienceScores, generateReport } = require('../scoring');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/quiz/submit
 * Submit quiz answers and receive resilience scores
 */
router.post('/submit', authenticateJWT, async (req, res) => {
    try {
        const { answers } = req.body;

        if (!answers || !Array.isArray(answers) || answers.length !== 36) {
            return res.status(400).json({ error: 'Please provide all 36 answers.' });
        }

        const scores = calculateResilienceScores(answers);
        const report = generateReport(scores);

        // Save results to user's profile
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            {
                $push: {
                    quizResults: {
                        completedAt: new Date(),
                        scores: scores.categories,
                        overallScore: scores.overall,
                        dominantType: scores.dominantType
                    }
                }
            },
            { new: true }
        );

        // Send email report
        if (user && user.email) {
            try {
                await emailService.sendQuizReport(user.email, user.username, report);
            } catch (emailErr) {
                logger.warn('Email delivery failed (non-fatal):', emailErr.message);
            }
        }

        logger.info(`Quiz submitted by user: ${req.user.username}`);

        res.status(200).json({
            message: 'Quiz submitted successfully.',
            scores: scores.categories,
            overall: scores.overall,
            dominantType: scores.dominantType,
            report: report.summary
        });
    } catch (err) {
        logger.error('Quiz submission error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * GET /api/quiz/results
 * Get quiz history for the authenticated user
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
 * Return the list of quiz questions
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
