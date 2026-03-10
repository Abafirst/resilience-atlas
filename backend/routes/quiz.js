const express   = require('express');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { authenticateJWT } = require('../middleware/auth');
const { calculateResilienceScores, generateReport } = require('../scoring');
const emailService = require('../services/emailService');
const ResilienceAssessment = require('../models/ResilienceAssessment');
const { calculateEvolution } = require('../services/evolution');
const { generateNarrativeReport } = require('../services/reportGenerator');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting: 20 quiz submissions per minute per IP
const submitLimiter = rateLimit({
    windowMs: 60 * 1000,
    max:      20,
    standardHeaders: true,
    legacyHeaders:   false,
    message: { error: 'Too many quiz submissions. Please wait a moment before trying again.' },
});

/**
 * POST /api/quiz/submit
 * Submit quiz answers and receive resilience scores.
 *
 * Modified flow:
 *   1. Calculate scores using scoring.js (unchanged)
 *   2. Save a new ResilienceAssessment record (never overwrites previous)
 *   3. Fetch previous assessment for evolution comparison
 *   4. Calculate evolution metrics and compass direction
 *   5. Generate pattern-based narrative report
 *   6. Return results with evolution data and retake encouragement
 */
router.post('/submit', submitLimiter, authenticateJWT, async (req, res) => {
    try {
        const { answers } = req.body;

        if (!answers || !Array.isArray(answers) || answers.length !== 36) {
            return res.status(400).json({ error: 'Please provide all 36 answers.' });
        }

        // 1. Score the quiz (scoring.js unchanged)
        const scores = calculateResilienceScores(answers);
        const report = generateReport(scores);

        const userId = req.user.userId || req.user.id;

        // 2. Save a NEW assessment record (longitudinal — never overwrites past results)
        const assessment = new ResilienceAssessment({
            userId,
            assessmentDate: new Date(),
            overall:        scores.overall,
            dominantType:   scores.dominantType,
            scores:         scores.categories,
        });

        let savedAssessment = null;
        try {
            savedAssessment = await assessment.save();
        } catch (saveErr) {
            logger.warn('Assessment save failed (non-fatal):', saveErr.message);
        }

        // 3. Fetch the most recent PREVIOUS assessment for evolution comparison
        let previousAssessment = null;
        if (savedAssessment) {
            try {
                previousAssessment = await ResilienceAssessment
                    .findOne({ userId, _id: { $ne: savedAssessment._id } })
                    .sort({ assessmentDate: -1 })
                    .lean();
            } catch (fetchErr) {
                logger.warn('Previous assessment fetch failed (non-fatal):', fetchErr.message);
            }
        }

        // 4. Calculate evolution metrics
        const evolution = calculateEvolution(scores, previousAssessment);

        // 5. Generate pattern-based narrative report
        let narrativeReport;
        try {
            narrativeReport = generateNarrativeReport(
                scores.categories,
                scores.overall,
                scores.dominantType,
                evolution
            );
        } catch (reportErr) {
            logger.warn('Narrative report generation failed (non-fatal):', reportErr.message);
            // Fallback to the deterministic report from scoring.js
            narrativeReport = { fullReport: report.summary, disclaimer: 'This assessment provides insights for personal growth. It is not a clinical assessment.' };
        }

        // Save results to user's profile (existing behavior — preserved for backward compatibility)
        const user = await User.findByIdAndUpdate(
            userId,
            {
                $push: {
                    quizResults: {
                        completedAt:  new Date(),
                        scores:       scores.categories,
                        overallScore: scores.overall,
                        dominantType: scores.dominantType,
                    },
                },
            },
            { new: true }
        );

        // Send email report (non-fatal)
        if (user && user.email) {
            try {
                await emailService.sendQuizReport(user.email, user.username, report);
            } catch (emailErr) {
                logger.warn('Email delivery failed (non-fatal):', emailErr.message);
            }
        }

        logger.info(`Quiz submitted by user: ${req.user.username}`);

        res.status(200).json({
            message:   'Quiz submitted successfully.',
            scores:    scores.categories,
            overall:   scores.overall,
            dominantType: scores.dominantType,
            report:    report.summary,
            assessmentId: savedAssessment ? savedAssessment._id : null,
            evolution,
            narrativeReport,
            retakeMessage:
                evolution.isFirstAssessment
                    ? "You've mapped the first point in your Resilience Atlas. Return in 30 days to see how your resilience evolves."
                    : 'Your Resilience Atlas has been updated. Review your evolution below.',
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
