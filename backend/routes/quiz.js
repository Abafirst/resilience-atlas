const express = require('express');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { authenticateJWT } = require('../middleware/auth');
const { calculateResilienceScores, generateReport } = require('../scoring');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const ResilienceResult = require('../models/ResilienceResult');
const ResilienceAssessment = require('../models/ResilienceAssessment');
const { calculateEvolution } = require('../services/evolution');
const { generateNarrativeReport } = require('../services/reportGenerator');

const router = express.Router();

// Rate limit for quiz submission: 10 submissions per 15 minutes per IP
const submitLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many quiz submissions. Please try again in a few minutes.' },
});

// Map question indices (0-based) to the six resilience type names
const RESILIENCE_CATEGORIES = {
    'Agentic-Generative':   [0, 1, 2, 3, 4, 5],        // Q1–Q6
    'Relational':           [6, 7, 8, 9, 10, 11],       // Q7–Q12
    'Spiritual-Existential':[12, 13, 14, 15, 16, 17],   // Q13–Q18
    'Emotional-Adaptive':   [18, 19, 20, 21, 22, 23],   // Q19–Q24
    'Somatic-Behavioral':   [24, 25, 26, 27, 28, 29],   // Q25–Q30
    'Cognitive-Narrative':  [30, 31, 32, 33, 34, 35],   // Q31–Q36
};

const MAX_PER_QUESTION = 5;

/**
 * Calculate resilience scores from 36 answers grouped by the six types.
 * @param {number[]} answers - Array of 36 numeric answers (1–5)
 * @returns {{ overall: number, dominantType: string, scores: Object }}
 */
function scoreResilienceAnswers(answers) {
    const scores = {};
    let totalRaw = 0;
    let totalMax = 0;

    for (const [type, indices] of Object.entries(RESILIENCE_CATEGORIES)) {
        const raw = indices.reduce((sum, i) => sum + (Number(answers[i]) || 0), 0);
        const max = indices.length * MAX_PER_QUESTION;
        scores[type] = {
            raw,
            max,
            percentage: parseFloat(((raw / max) * 100).toFixed(2)),
        };
        totalRaw += raw;
        totalMax += max;
    }

    const overall = Math.round((totalRaw / totalMax) * 100);

    const dominantType = Object.entries(scores).reduce(
        (best, [type, s]) => (s.percentage > best[1] ? [type, s.percentage] : best),
        ['', -1]
    )[0];

    return { overall, dominantType, scores };
}

/**
 * POST /api/quiz
 * Submit quiz answers (no authentication required).
 * Calculates resilience scores, persists to MongoDB, and returns results.
 */
router.post('/', async (req, res) => {
    try {
        const { firstName, email, answers } = req.body;

        if (!answers || !Array.isArray(answers) || answers.length !== 36) {
            return res.status(400).json({ error: 'Please provide all 36 answers.' });
        }

        if (!email) {
            return res.status(400).json({ error: 'Email is required.' });
        }

        const result = scoreResilienceAnswers(answers);

        // Save to MongoDB (non-blocking — does not affect response)
        ResilienceResult.create({
            email,
            firstName,
            overall: result.overall,
            dominantType: result.dominantType,
            scores: result.scores,
        }).catch(err => logger.error('Failed to save resilience result:', err));

        res.status(200).json(result);
    } catch (err) {
        logger.error('Quiz submission error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * POST /api/quiz/submit
 * Submit quiz answers and receive resilience scores
 */
router.post('/submit', submitLimiter, authenticateJWT, async (req, res) => {
    try {
        const { answers } = req.body;

        if (!answers || !Array.isArray(answers) || answers.length !== 36) {
            return res.status(400).json({ error: 'Please provide all 36 answers.' });
        }

        const scores = calculateResilienceScores(answers);
        const report = generateReport(scores);

        // Fetch previous assessment for evolution tracking
        const userId = req.user && (req.user.userId || req.user.id);
        let previousAssessment = null;
        if (userId) {
            try {
                previousAssessment = await ResilienceAssessment.findOne({ userId })
                    .sort({ assessmentDate: -1 })
                    .lean();
            } catch (err) {
                logger.warn('Could not fetch previous assessment (non-fatal):', err.message);
            }
        }

        // Calculate evolution compared to previous assessment
        const evolution = calculateEvolution(scores, previousAssessment);

        // Generate narrative report
        const narrativeReport = generateNarrativeReport(
            scores.categories,
            scores.overall,
            scores.dominantType,
            evolution
        );

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
            report: report.summary,
            evolution,
            narrativeReport,
            retakeMessage: 'Return in 30 days to track your progress on The Resilience Atlas™ and see how your resilience evolves over time.',
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
