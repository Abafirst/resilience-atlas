'use strict';

/**
 * backend/routes/history.js
 *
 * Assessment history + timeline endpoints.
 *
 * Mounted at /api/history in server.js.
 */

const express   = require('express');
const rateLimit = require('express-rate-limit');
const mongoose  = require('mongoose');
const { authenticateJWT } = require('../middleware/auth');
const ResilienceAssessment = require('../models/ResilienceAssessment');
const AssessmentHistory    = require('../models/AssessmentHistory');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting: 60 req/min per IP
const historyLimiter = rateLimit({
    windowMs: 60 * 1000,
    max:      60,
    standardHeaders: true,
    legacyHeaders:   false,
    message: { error: 'Too many requests. Please try again in a moment.' },
});
router.use(historyLimiter);

// ── Dimension keys ────────────────────────────────────────────────────────────
const DIMS = ['Agentic-Generative', 'Relational-Connective', 'Spiritual-Reflective', 'Emotional-Adaptive', 'Somatic-Regulative', 'Cognitive-Narrative'];

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build per-dimension trend arrays from a chronologically sorted
 * (oldest first) array of assessment documents.
 */
function buildTrends(sorted) {
    const trends = { overall: [] };
    DIMS.forEach(d => { trends[d] = []; });

    sorted.forEach(a => {
        const pt = { date: a.assessmentDate, score: a.overall };
        trends.overall.push(pt);
        DIMS.forEach(d => {
            trends[d].push({ date: a.assessmentDate, score: (a.scores && a.scores[d]) || 0 });
        });
    });
    return trends;
}

/**
 * Detect milestone badges for a given assessment in context.
 *
 * @param {object} assessment  - current assessment (newest)
 * @param {object[]} history   - all assessments, newest first
 * @returns {string[]} badge keys earned on this assessment
 */
function detectMilestones(assessment, history) {
    const badges = [];

    // First-ever assessment
    if (history.length === 1) {
        badges.push('first_assessment');
    }

    // Perfect score in any dimension
    DIMS.forEach(d => {
        if ((assessment.scores && assessment.scores[d]) === 100) {
            badges.push(`perfect_${d}`);
        }
    });

    // 100-point cumulative overall improvement (vs oldest)
    const oldest = history[history.length - 1];
    if (oldest && String(oldest._id) !== String(assessment._id)) {
        if ((assessment.overall - oldest.overall) >= 100) {
            badges.push('100pt_improvement');
        }
    }

    // 3-month streak: at least 3 assessments within 90 days
    if (history.length >= 3) {
        const sorted = [...history].sort((a, b) => new Date(a.assessmentDate) - new Date(b.assessmentDate));
        const span = new Date(sorted[sorted.length - 1].assessmentDate) - new Date(sorted[0].assessmentDate);
        if (span <= 90 * 24 * 60 * 60 * 1000) {
            badges.push('3_month_streak');
        }
    }

    // Consistent high performer: all assessments overall >= 80
    if (history.length >= 3 && history.every(a => a.overall >= 80)) {
        badges.push('consistent_high_performer');
    }

    return badges;
}

/**
 * Auto-generate a growth narrative for a user's history.
 *
 * @param {object[]} history - assessments newest-first
 * @returns {string[]} narrative sentences
 */
function buildNarrative(history) {
    if (!history || history.length < 2) return [];

    const latest  = history[0];
    const oldest  = history[history.length - 1];
    const lines   = [];

    // Overall change
    const overallDelta = latest.overall - oldest.overall;
    if (overallDelta > 0) {
        lines.push(`Your overall resilience score has grown by ${overallDelta} points since your first assessment.`);
    } else if (overallDelta < 0) {
        lines.push(`Your overall resilience score has changed by ${overallDelta} points since your first assessment.`);
    } else {
        lines.push('Your overall resilience score has remained stable.');
    }

    // Biggest improvement dimension
    let bestDim = null, bestDelta = -Infinity;
    DIMS.forEach(d => {
        const delta = ((latest.scores && latest.scores[d]) || 0) - ((oldest.scores && oldest.scores[d]) || 0);
        if (delta > bestDelta) { bestDelta = delta; bestDim = d; }
    });
    if (bestDim && bestDelta > 0) {
        lines.push(`Your biggest improvement is in ${capitalize(bestDim)}, up ${bestDelta} points.`);
    }

    // Most consistent dimension (smallest standard deviation)
    let mostConsistentDim = null, minSd = Infinity;
    DIMS.forEach(d => {
        const vals = history.map(a => (a.scores && a.scores[d]) || 0);
        const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
        const sd   = Math.sqrt(vals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / vals.length);
        if (sd < minSd) { minSd = sd; mostConsistentDim = d; }
    });
    if (mostConsistentDim) {
        lines.push(`Your most consistent strength is ${capitalize(mostConsistentDim)}.`);
    }

    lines.push("Your resilience foundation is getting stronger.");
    return lines;
}

function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/**
 * Parse a period query param and return a "from" Date (or null for all time).
 * @param {string} period  "30d" | "90d" | "1y" | "all"
 * @returns {Date|null}
 */
function periodToDate(period) {
    const now = Date.now();
    if (period === '30d') return new Date(now - 30 * 24 * 60 * 60 * 1000);
    if (period === '90d') return new Date(now - 90 * 24 * 60 * 60 * 1000);
    if (period === '1y')  return new Date(now - 365 * 24 * 60 * 60 * 1000);
    return null; // "all"
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /api/history/timeline
 *
 * Full timeline with trends, milestones, and growth narrative.
 * Optional query params:
 *   ?period=30d|90d|1y|all   (default: all)
 *   ?limit=N                  (default: 100, max: 200)
 */
router.get('/timeline', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const period = req.query.period || 'all';
        const limit  = Math.min(parseInt(req.query.limit, 10) || 100, 200);

        const fromDate = periodToDate(period);
        const query    = fromDate
            ? { userId, assessmentDate: { $gte: fromDate } }
            : { userId };

        const assessments = await ResilienceAssessment.find(query)
            .sort({ assessmentDate: -1 })
            .limit(limit)
            .lean();

        if (assessments.length === 0) {
            return res.status(200).json({
                timeline: {
                    firstAssessment:    null,
                    lastAssessment:     null,
                    totalAssessments:   0,
                    trends:             buildTrends([]),
                    milestones:         [],
                },
                assessments: [],
                narrative:   [],
            });
        }

        // Oldest first for trend arrays
        const sorted = [...assessments].reverse();

        const trends      = buildTrends(sorted);
        const milestones  = assessments.length >= 1
            ? detectMilestones(assessments[0], assessments)
            : [];

        const narrative = buildNarrative(assessments);

        res.status(200).json({
            timeline: {
                firstAssessment:  sorted[0].assessmentDate,
                lastAssessment:   assessments[0].assessmentDate,
                totalAssessments: assessments.length,
                trends,
                milestones: milestones.map(m => ({
                    date:        assessments[0].assessmentDate,
                    type:        m,
                    title:       milestoneTitle(m),
                    description: milestoneDescription(m),
                })),
            },
            assessments,
            narrative,
        });
    } catch (err) {
        logger.error('History timeline error:', err);
        res.status(500).json({ error: 'Could not retrieve timeline.' });
    }
});

/**
 * GET /api/history/trends
 *
 * Lightweight endpoint returning only trend arrays (no full assessment docs).
 * Optional ?period=30d|90d|1y|all
 */
router.get('/trends', authenticateJWT, async (req, res) => {
    try {
        const userId   = req.user.userId || req.user.id;
        const fromDate = periodToDate(req.query.period || 'all');
        const query    = fromDate
            ? { userId, assessmentDate: { $gte: fromDate } }
            : { userId };

        const assessments = await ResilienceAssessment.find(query)
            .sort({ assessmentDate: 1 })  // oldest first
            .select('assessmentDate overall scores')
            .lean();

        res.status(200).json({ trends: buildTrends(assessments) });
    } catch (err) {
        logger.error('History trends error:', err);
        res.status(500).json({ error: 'Could not retrieve trends.' });
    }
});

/**
 * GET /api/history/milestones
 *
 * Returns all milestone badges earned across the user's full history.
 */
router.get('/milestones', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;

        const assessments = await ResilienceAssessment.find({ userId })
            .sort({ assessmentDate: -1 })
            .lean();

        const badges = assessments.length > 0
            ? detectMilestones(assessments[0], assessments)
            : [];

        res.status(200).json({
            milestones: badges.map(m => ({
                type:        m,
                title:       milestoneTitle(m),
                description: milestoneDescription(m),
            })),
        });
    } catch (err) {
        logger.error('History milestones error:', err);
        res.status(500).json({ error: 'Could not retrieve milestones.' });
    }
});

/**
 * GET /api/history/compare
 *
 * Compare two periods.  Returns summary stats for each.
 * Query params:
 *   ?period=30d|90d|1y|all   (current window, default 90d)
 */
router.get('/compare', authenticateJWT, async (req, res) => {
    try {
        const userId  = req.user.userId || req.user.id;
        const period  = req.query.period || '90d';
        const fromNow = periodToDate(period);

        const allAssessments = await ResilienceAssessment.find({ userId })
            .sort({ assessmentDate: -1 })
            .lean();

        const inPeriod  = fromNow
            ? allAssessments.filter(a => new Date(a.assessmentDate) >= fromNow)
            : allAssessments;
        const prePeriod = fromNow
            ? allAssessments.filter(a => new Date(a.assessmentDate) < fromNow)
            : [];

        const summarize = (arr) => {
            if (arr.length === 0) return null;
            const avg = (key) => arr.reduce((s, a) => s + ((a.scores && a.scores[key]) || 0), 0) / arr.length;
            return {
                count:        arr.length,
                avgOverall:   Math.round(arr.reduce((s, a) => s + a.overall, 0) / arr.length),
                avgScores:    Object.fromEntries(DIMS.map(d => [d, Math.round(avg(d))])),
                firstDate:    arr[arr.length - 1].assessmentDate,
                lastDate:     arr[0].assessmentDate,
            };
        };

        res.status(200).json({
            period,
            current:  summarize(inPeriod),
            previous: summarize(prePeriod),
        });
    } catch (err) {
        logger.error('History compare error:', err);
        res.status(500).json({ error: 'Could not retrieve comparison.' });
    }
});

/**
 * PATCH /api/history/:id/note
 *
 * Add or update the optional user note on an assessment stored in
 * AssessmentHistory (requires that record to exist — created separately by
 * the quiz flow).  Falls back gracefully if not found.
 *
 * Body: { note: string }
 */
router.patch('/:id/note', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const { id } = req.params;
        const { note } = req.body;

        if (typeof note !== 'string') {
            return res.status(400).json({ error: 'note must be a string.' });
        }
        if (note.length > 2000) {
            return res.status(400).json({ error: 'note must be 2000 characters or fewer.' });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid assessment ID.' });
        }

        const updated = await AssessmentHistory.findOneAndUpdate(
            { _id: id, userId },
            { $set: { notes: note } },
            { new: true, select: '_id notes assessmentDate' }
        );
        if (!updated) {
            return res.status(404).json({ error: 'Assessment not found.' });
        }

        res.status(200).json({ success: true, id: updated._id, notes: updated.notes });
    } catch (err) {
        logger.error('History note update error:', err);
        res.status(500).json({ error: 'Could not save note.' });
    }
});

// ── Milestone helpers ────────────────────────────────────────────────────────

function milestoneTitle(type) {
    const map = {
        first_assessment:         'First Assessment',
        '3_month_streak':         '3 Month Streak',
        '100pt_improvement':      '100 Point Improvement',
        consistent_high_performer: 'Consistent High Performer',
    };
    if (map[type]) return map[type];
    if (type.startsWith('perfect_')) {
        const dim = type.replace('perfect_', '');
        return `Perfect Score in ${capitalize(dim)}`;
    }
    return type;
}

function milestoneDescription(type) {
    const map = {
        first_assessment:         'You mapped the first point on your Resilience Atlas.',
        '3_month_streak':         'Three or more assessments completed within 90 days.',
        '100pt_improvement':      'Your overall score improved by 100 points or more.',
        consistent_high_performer: 'All your assessments scored 80 or above.',
    };
    if (map[type]) return map[type];
    if (type.startsWith('perfect_')) {
        const dim = type.replace('perfect_', '');
        return `You achieved a perfect 100 in ${capitalize(dim)}.`;
    }
    return '';
}

module.exports = router;
