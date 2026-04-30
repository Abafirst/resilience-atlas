const express = require('express');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { authenticateJWT } = require('../middleware/auth');
const { calculateResilienceScores, generateReport } = require('../scoring');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const ResilienceResult = require('../models/ResilienceResult');
const ResilienceAssessment = require('../models/ResilienceAssessment');
const ResilienceReport = require('../models/ResilienceReport');
const UserDataSharing = require('../models/UserDataSharing');
const { calculateEvolution } = require('../services/evolution');
const { generateNarrativeReport } = require('../services/reportGenerator');
const { buildResultsHash } = require('../services/reportService');
const { buildAssessmentHash } = require('../services/assessmentAccessControl');
const QuizFeedback = require('../models/QuizFeedback');
const ReminderOptIn = require('../models/ReminderOptIn');

// Lazy-load report queue — gracefully degrades when bullmq / Redis is unavailable.
let _addReportJob = null;
function getAddReportJob() {
    if (_addReportJob !== null) return _addReportJob;
    try {
        _addReportJob = require('../../queue/reportQueue').addReportJob;
    } catch (err) {
        logger.warn('[quiz] reportQueue unavailable (bullmq not installed or Redis not configured) — report jobs will not be enqueued:', err.message);
        _addReportJob = () => Promise.resolve(null);
    }
    return _addReportJob;
}

// Rate limit for quiz results endpoint: 60 requests per minute per IP
const resultsLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again in a moment.' },
});

const router = express.Router();

// Rate limit for quiz submission: 10 submissions per 15 minutes per IP
const submitLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many quiz submissions. Please try again in a few minutes.' },
});

/**
 * All 7 tiers have access to the quiz assessment.
 * Tier hierarchy (lowest → highest access):
 *   free → atlas-navigator → atlas-premium → business → starter → pro → enterprise
 */
const VALID_TIERS = new Set([
    'free', 'atlas-navigator', 'atlas-premium', 'business', 'starter', 'pro', 'enterprise',
]);

// Map question indices (0-based) to the six resilience type names
// 72 questions total: 12 per dimension, grouped sequentially in QUESTIONS array
const RESILIENCE_CATEGORIES = {
  'Agentic-Generative':   [ 0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11],
  'Relational-Connective':           [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
  'Spiritual-Reflective':[24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
  'Emotional-Adaptive':   [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47],
  'Somatic-Regulative':   [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
  'Cognitive-Narrative':  [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71],
};
const MAX_PER_QUESTION = 5;

/**
 * Calculate resilience scores from 72 answers grouped by the six types.
 * @param {number[]} answers - Array of 72 numeric answers (1–5)
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
 * All tiers (free through enterprise) can access this endpoint.
 */
router.post('/', submitLimiter, async (req, res) => {
    try {
        const { firstName, email, answers, tier, sharingConsent, sharingGoals } = req.body;

        if (!answers || !Array.isArray(answers) || answers.length !== 72) {
            return res.status(400).json({ error: 'Please provide all 72 answers.' });
        }

        if (!email) {
            return res.status(400).json({ error: 'Email is required.' });
        }

        // Tier is optional; if provided, it must be one of the 7 known tiers.
        if (tier !== undefined && !VALID_TIERS.has(tier)) {
            return res.status(400).json({ error: `Invalid tier: "${tier}".` });
        }

        const result = scoreResilienceAnswers(answers);

        // Compute a deterministic hash to identify this specific assessment attempt.
        // Stored in ResilienceResult so it can be looked up directly by hash later.
        const assessmentHash = buildAssessmentHash(
            String(result.overall),
            result.dominantType,
            JSON.stringify(result.scores)
        );

        // Resolve sharing consent value:
        // - If explicitly provided as boolean, use that value (user made a choice)
        // - If not provided (undefined/null), use null to indicate "not yet asked"
        //   (covers non-org users, unauthenticated submissions, and legacy records)
        // NOTE: null has two roles — "not yet asked" for new submissions and
        // "legacy/pre-feature" for existing records. Both are treated as
        // equivalent to true in team analytics queries for backward compatibility.
        const resolvedConsent = typeof sharingConsent === 'boolean' ? sharingConsent : null;
        const safeGoals = resolvedConsent && sharingGoals
            ? String(sharingGoals).trim().slice(0, 1000)
            : null;

        // Save to MongoDB (non-blocking — does not affect response)
        ResilienceResult.create({
            email,
            firstName,
            overall: result.overall,
            dominantType: result.dominantType,
            scores: result.scores,
            assessmentHash,
            sharingConsent: resolvedConsent,
            sharingConsentDate: resolvedConsent !== null ? new Date() : null,
            sharingGoals: safeGoals,
        }).catch(err => logger.error('Failed to save resilience result:', err));

        // Persist consent preferences to UserDataSharing when the user belongs to an org.
        // We look up the user by email; if not found or not in an org, we skip silently.
        if (typeof scoresConsent === 'boolean' || typeof curriculumConsent === 'boolean') {
            User.findOne({ email: email.trim().toLowerCase() }).lean().then(async (user) => {
                if (!user) return;
                const orgId = user.organizationId || user.organization_id || null;
                if (!orgId) return;

                const historyEntries = [];
                const updateFields   = { updatedAt: now };

                if (typeof scoresConsent === 'boolean') {
                    updateFields.scoresEnabled     = scoresConsent;
                    updateFields.scoresLastUpdated = now;
                    if (scoresConsent) {
                        updateFields.scoresConsentDate = now;
                        updateFields.scoresGoals = sharingConsent.scoresGoals;
                    }
                    historyEntries.push({
                        type:    'scores',
                        action:  scoresConsent ? 'granted' : 'revoked',
                        date:    now,
                        goals:   sharingConsent.scoresGoals,
                        context: 'assessment_submission',
                    });
                }

                if (typeof curriculumConsent === 'boolean') {
                    updateFields.curriculumEnabled     = curriculumConsent;
                    updateFields.curriculumLastUpdated = now;
                    if (curriculumConsent) {
                        updateFields.curriculumConsentDate = now;
                        updateFields.curriculumGoals = sharingConsent.curriculumGoals;
                    }
                    historyEntries.push({
                        type:    'curriculum',
                        action:  curriculumConsent ? 'granted' : 'revoked',
                        date:    now,
                        goals:   sharingConsent.curriculumGoals,
                        context: 'assessment_submission',
                    });
                }

                try {
                    await UserDataSharing.findOneAndUpdate(
                        { userId: user._id, organizationId: orgId },
                        {
                            $set:  updateFields,
                            $push: historyEntries.length > 0
                                ? { history: { $each: historyEntries } }
                                : undefined,
                        },
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );

                    // Remember defaults if requested
                    if (rememberPreference) {
                        const defaultUpdate = {};
                        if (typeof scoresConsent === 'boolean')     defaultUpdate['defaultSharingConsent.scores']     = scoresConsent;
                        if (typeof curriculumConsent === 'boolean') defaultUpdate['defaultSharingConsent.curriculum'] = curriculumConsent;
                        if (Object.keys(defaultUpdate).length > 0) {
                            await User.findByIdAndUpdate(user._id, { $set: defaultUpdate });
                        }
                    }

                    // Append to User.consentHistory
                    if (historyEntries.length > 0) {
                        await User.findByIdAndUpdate(user._id, {
                            $push: { consentHistory: { $each: historyEntries } },
                        });
                    }
                } catch (consentErr) {
                    logger.warn('[quiz] Failed to save consent preferences (non-fatal):', consentErr.message);
                }
            }).catch(err => logger.warn('[quiz] Failed to look up user for consent (non-fatal):', err.message));
        }

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

        if (!answers || !Array.isArray(answers) || answers.length !== 72) {
            return res.status(400).json({ error: 'Please provide all 72 answers.' });
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

        // Build a deterministic hash for this set of scores.
        const resultsHash = buildResultsHash(scores);

        // Persist a pending report record so the SPA can poll /api/report/status.
        try {
            await ResilienceReport.findOneAndUpdate(
                { userId, resultsHash },
                { userId, resultsHash, status: 'pending' },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        } catch (reportErr) {
            logger.warn('ResilienceReport upsert failed (non-fatal):', reportErr.message);
        }

        // Enqueue async PDF generation (gracefully degrades when queue is unavailable).
        try {
            await getAddReportJob()({ userId, scores, resultsHash });
        } catch (queueErr) {
            logger.warn('Report job enqueue failed (non-fatal):', queueErr.message);
        }

        res.status(200).json({
            status: 'submitted',
            message: 'Quiz submitted successfully.',
            scores: scores.categories,
            overall: scores.overall,
            dominantType: scores.dominantType,
            resultsHash,
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
router.get('/results', resultsLimiter, authenticateJWT, async (req, res) => {
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

/**
 * POST /api/quiz/email-report
 * Send a resilience assessment summary email to a provided email address.
 * Does not require authentication — any user (including anonymous quiz-takers)
 * can request their summary report email.
 *
 * Body: { email, firstName, overall, dominantType, scores }
 */
const emailReportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many email requests. Please try again later.' },
});

router.post('/email-report', emailReportLimiter, async (req, res) => {
    try {
        const { email, firstName, overall, dominantType, scores } = req.body;

        if (!email || typeof email !== 'string' || !email.trim()) {
            return res.status(400).json({ error: 'A valid email address is required.' });
        }

        const safeEmail = email.trim().toLowerCase();
        // Basic structural email validation without regex backtracking risk.
        const atIdx = safeEmail.indexOf('@');
        if (atIdx < 1 || atIdx !== safeEmail.lastIndexOf('@') || !safeEmail.slice(atIdx + 1).includes('.')) {
            return res.status(400).json({ error: 'Please provide a valid email address.' });
        }

        const safeName = (firstName || '').toString().trim().slice(0, 100);
        const safeScore = typeof overall === 'number' && overall >= 0 && overall <= 100
            ? overall
            : 0;
        const safeDominant = (dominantType || '').toString().trim().slice(0, 100);
        const rawScores = scores && typeof scores === 'object' && !Array.isArray(scores)
            ? scores
            : {};
        // Normalize scores to plain numbers.  The React SPA stores each dimension
        // value as { percentage: number } while legacy callers send plain numbers.
        // Accept both shapes; default to 0 for anything else (prevents NaN% in emails).
        const safeScores = Object.fromEntries(
            Object.entries(rawScores).map(([dim, val]) => {
                if (typeof val === 'number' && Number.isFinite(val)) return [dim, val];
                if (val && typeof val === 'object' && Number.isFinite(val.percentage)) return [dim, val.percentage];
                return [dim, 0];
            })
        );

        // Compute the assessment hash from the original (non-normalized) scores so
        // the link matches the hash stored when the quiz was submitted.  This lets
        // the email CTA deep-link directly to the correct assessment.
        const assessmentHash = buildAssessmentHash(
            String(safeScore),
            safeDominant,
            JSON.stringify(rawScores)
        );

        await emailService.sendQuizReport(safeEmail, safeName, {
            overall:      safeScore,
            dominantType: safeDominant,
            categories:   safeScores,
            summary:      '',
            assessmentHash,
        });

        logger.info(`Quiz email-report sent to ${safeEmail}`);
        res.status(200).json({ message: 'Report sent! Please check your inbox.' });
    } catch (err) {
        logger.error('Quiz email-report error:', err);
        res.status(500).json({ error: 'Failed to send report email. Please try again.' });
    }
});

/**
 * POST /api/quiz/feedback
 * Store question flags and post-quiz improvement feedback for admin review.
 * No authentication required — captures anonymous feedback.
 *
 * Body: { email, firstName, flaggedQuestions: number[], feedbackText: string }
 */
const feedbackLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many feedback submissions. Please try again later.' },
});

router.post('/feedback', feedbackLimiter, async (req, res) => {
    try {
        const { email, firstName, flaggedQuestions, feedbackText } = req.body;

        if (!email || typeof email !== 'string' || !email.trim()) {
            return res.status(400).json({ error: 'Email is required.' });
        }

        const safeEmail = email.trim().toLowerCase();
        const safeName  = (firstName || '').toString().trim().slice(0, 100);
        const safeText  = (feedbackText || '').toString().trim().slice(0, 2000);
        const safeFlags = Array.isArray(flaggedQuestions)
            ? flaggedQuestions.filter(n => Number.isInteger(n) && n >= 1 && n <= 72)
            : [];

        await QuizFeedback.create({
            email:            safeEmail,
            firstName:        safeName,
            flaggedQuestions: safeFlags,
            feedbackText:     safeText,
        });

        logger.info(`Quiz feedback received from ${safeEmail}: ${safeFlags.length} flags, text: ${safeText.length > 0}`);
        res.status(200).json({ message: 'Feedback saved. Thank you!' });
    } catch (err) {
        logger.error('Quiz feedback save error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * POST /api/quiz/reminder-optin
 * Opt a user in to 30-day reassessment reminder emails.
 *
 * Body: { email, firstName, lastScore }
 */
const reminderOptInLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
});

router.post('/reminder-optin', reminderOptInLimiter, async (req, res) => {
    try {
        const { email, firstName, lastScore } = req.body;

        if (!email || typeof email !== 'string' || !email.trim()) {
            return res.status(400).json({ error: 'Email is required.' });
        }

        const safeEmail = email.trim().toLowerCase();
        const safeName  = (firstName || '').toString().trim().slice(0, 100);
        const safeScore = typeof lastScore === 'number' && lastScore >= 0 && lastScore <= 100
            ? lastScore
            : null;

        // Upsert so re-opting in after a new assessment refreshes the date
        await ReminderOptIn.findOneAndUpdate(
            { email: safeEmail },
            {
                $set: {
                    firstName:          safeName,
                    lastScore:          safeScore,
                    lastAssessmentDate: new Date(),
                    optedIn:            true,
                },
            },
            { upsert: true, new: true }
        );

        logger.info(`Reminder opt-in recorded for ${safeEmail}`);
        res.status(200).json({ message: 'You\'ll receive a reminder to reassess in 30 days.' });
    } catch (err) {
        logger.error('Reminder opt-in error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * POST /api/quiz/reminder-optout
 * Opt a user out of reassessment reminder emails (unsubscribe via form/API).
 *
 * Body: { email }
 */
router.post('/reminder-optout', reminderOptInLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || typeof email !== 'string' || !email.trim()) {
            return res.status(400).json({ error: 'Email is required.' });
        }
        await ReminderOptIn.findOneAndUpdate(
            { email: email.trim().toLowerCase() },
            { $set: { optedIn: false } }
        );
        res.status(200).json({ message: 'You have been unsubscribed from reassessment reminders.' });
    } catch (err) {
        logger.error('Reminder opt-out error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * GET /api/quiz/reminder-optout
 * Opt a user out of reassessment reminder emails via a one-click link in email.
 *
 * Query: ?email=user@example.com
 */
router.get('/reminder-optout', reminderOptInLimiter, async (req, res) => {
    try {
        const email = (req.query.email || '').trim().toLowerCase();
        if (!email) {
            return res.status(400).send('Email parameter is required.');
        }
        await ReminderOptIn.findOneAndUpdate(
            { email },
            { $set: { optedIn: false } }
        );
        res.status(200).send(
            '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Unsubscribed</title></head>' +
            '<body style="font-family:sans-serif;max-width:480px;margin:60px auto;text-align:center">' +
            '<h2>✅ Unsubscribed</h2>' +
            '<p>You\'ve been removed from reassessment reminder emails.</p>' +
            '<p><a href="/">Return to The Resilience Atlas</a></p>' +
            '</body></html>'
        );
    } catch (err) {
        logger.error('Reminder opt-out (GET) error:', err);
        res.status(500).send('An error occurred. Please try again.');
    }
});

module.exports = router;
