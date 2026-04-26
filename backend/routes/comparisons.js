'use strict';

/**
 * comparisons.js — REST API for the resilience profile comparison system.
 *
 * Endpoints:
 *  POST   /api/comparisons               — Create a new comparison
 *  GET    /api/comparisons               — List comparisons created by the authed user
 *  GET    /api/comparisons/:id           — Get a single comparison (auth or shareToken)
 *  DELETE /api/comparisons/:id           — Delete / revoke a comparison
 *  POST   /api/comparisons/:id/share     — Toggle public sharing
 *  GET    /api/comparisons/share/:token  — Public access via share token
 *  GET    /api/comparisons/growth        — Growth history for the authed user
 */

const express       = require('express');
const rateLimit     = require('express-rate-limit');
const mongoose      = require('mongoose');
const { authenticateJWT } = require('../middleware/auth');
const Comparison        = require('../models/Comparison');
const ResilienceAssessment = require('../models/ResilienceAssessment');
const User              = require('../models/User');
const {
    analyzeProfiles,
    buildGrowthReport,
    normalizeScores,
} = require('../services/comparisonService');
const logger = require('../utils/logger');

const router = express.Router();

// ── Rate limiting ─────────────────────────────────────────────────────────────

const compareLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again shortly.' },
});

router.use(compareLimiter);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Return a sanitised participant object from a ResilienceAssessment document.
 * @param {Object} assessment
 * @param {string} displayName
 * @returns {Object}
 */
function participantFromAssessment(assessment, displayName = 'Anonymous') {
    return {
        userId:        assessment.userId,
        displayName,
        overall:       assessment.overall,
        dominantType:  assessment.dominantType,
        scores:        normalizeScores(assessment.scores),
        assessmentId:  assessment._id,
        assessmentDate: assessment.assessmentDate || assessment.createdAt,
    };
}

// ── POST /api/comparisons ─────────────────────────────────────────────────────

/**
 * Create a new comparison.
 *
 * Body (individual):
 *   { type: 'individual', user2AssessmentId: '<id>', user2Name?: '<name>' }
 *
 * Body (growth – compare own latest vs. a past assessment):
 *   { type: 'growth', previousAssessmentId: '<id>' }
 *
 * Body (team):
 *   { type: 'team' }  — compares the user's latest assessment to their org team average
 */
router.post('/', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const { type = 'individual', user2AssessmentId, user2Name, previousAssessmentId } = req.body;

        if (!['individual', 'growth', 'team'].includes(type)) {
            return res.status(400).json({ error: 'Invalid comparison type.' });
        }

        // ── Fetch user1's latest assessment ──────────────────────────────────
        const latestAssessment = await ResilienceAssessment.findOne({ userId })
            .sort({ assessmentDate: -1 })
            .lean();

        if (!latestAssessment) {
            return res.status(404).json({
                error: 'No assessment found. Please complete the quiz first.',
            });
        }

        const currentUser = await User.findById(userId).lean();
        const user1Name   = currentUser ? (currentUser.username || currentUser.email) : 'You';

        const user1 = participantFromAssessment(latestAssessment, user1Name);

        let user2;
        let comparisonType = type;

        // ── Build user2 depending on type ────────────────────────────────────
        if (type === 'individual') {
            if (!user2AssessmentId || !mongoose.Types.ObjectId.isValid(user2AssessmentId)) {
                return res.status(400).json({ error: 'user2AssessmentId is required for individual comparisons.' });
            }

            const assessment2 = await ResilienceAssessment.findById(user2AssessmentId).lean();
            if (!assessment2) {
                return res.status(404).json({ error: 'Colleague assessment not found.' });
            }

            // Resolve colleague's display name
            let name2 = user2Name || 'Colleague';
            if (!user2Name && assessment2.userId) {
                const colleague = await User.findById(assessment2.userId).lean();
                if (colleague) {
                    name2 = colleague.username || colleague.email;
                }
            }

            user2 = participantFromAssessment(assessment2, name2);

        } else if (type === 'growth') {
            if (!previousAssessmentId || !mongoose.Types.ObjectId.isValid(previousAssessmentId)) {
                return res.status(400).json({ error: 'previousAssessmentId is required for growth comparisons.' });
            }

            const prevAssessment = await ResilienceAssessment.findById(previousAssessmentId).lean();
            if (!prevAssessment) {
                return res.status(404).json({ error: 'Previous assessment not found.' });
            }

            // Security: growth comparisons can only compare the user's own assessments
            if (String(prevAssessment.userId) !== String(userId)) {
                return res.status(403).json({ error: 'You can only compare your own assessments.' });
            }

            user2 = participantFromAssessment(prevAssessment, `${user1Name} (Past)`);

        } else if (type === 'team') {
            // Compute team average from org members
            if (!currentUser || !currentUser.organization_id) {
                return res.status(400).json({ error: 'Team comparisons require an organization membership.' });
            }

            // Aggregate latest assessment per team member
            const teamMembers = await User.find({ organization_id: currentUser.organization_id }).lean();
            const memberIds   = teamMembers.map(m => m._id);

            const teamAssessments = await ResilienceAssessment.aggregate([
                { $match: { userId: { $in: memberIds } } },
                { $sort:  { assessmentDate: -1 } },
                { $group: { _id: '$userId', doc: { $first: '$$ROOT' } } },
                { $replaceRoot: { newRoot: '$doc' } },
            ]);

            if (teamAssessments.length === 0) {
                return res.status(400).json({ error: 'No team assessments found.' });
            }

            const DIMS = ['emotional', 'mental', 'physical', 'social', 'spiritual', 'financial'];
            const avgScores = {};
            let avgOverall = 0;

            for (const dim of DIMS) {
                const vals = teamAssessments.map(a => normalizeScores(a.scores)[dim]);
                avgScores[dim] = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
            }
            avgOverall = Math.round(
                teamAssessments.reduce((s, a) => s + (a.overall || 0), 0) / teamAssessments.length
            );

            user2 = {
                userId:        null,
                displayName:   'Team Average',
                overall:       avgOverall,
                dominantType:  '',
                scores:        avgScores,
                assessmentId:  null,
                assessmentDate: new Date(),
            };
        }

        // ── Compute analysis ─────────────────────────────────────────────────
        const comparisonAnalysis = analyzeProfiles(
            user1.scores,
            user2.scores,
            user1.displayName,
            user2.displayName
        );

        // ── Persist ──────────────────────────────────────────────────────────
        const comparison = await Comparison.create({
            createdBy: userId,
            comparisonType,
            user1,
            user2,
            comparisonAnalysis,
        });

        res.status(201).json({ success: true, comparison });
    } catch (err) {
        logger.error('Create comparison error:', err);
        res.status(500).json({ error: 'Failed to create comparison.' });
    }
});

// ── GET /api/comparisons ──────────────────────────────────────────────────────

router.get('/', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const { type, limit = 20 } = req.query;

        const filter = { createdBy: userId };
        if (type && ['individual', 'growth', 'team'].includes(type)) {
            filter.comparisonType = type;
        }

        const comparisons = await Comparison.find(filter)
            .sort({ createdAt: -1 })
            .limit(Math.min(Number(limit), 100))
            .lean();

        res.json({ comparisons });
    } catch (err) {
        logger.error('List comparisons error:', err);
        res.status(500).json({ error: 'Failed to list comparisons.' });
    }
});

// ── GET /api/comparisons/growth ───────────────────────────────────────────────

/**
 * Return growth history for the authenticated user based on all their
 * ResilienceAssessment records.
 *
 * Query params:
 *  ?period=90d | 1y | all  (default: all)
 */
router.get('/growth', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const { period = 'all' } = req.query;

        let dateFilter = {};
        if (period === '90d') {
            dateFilter = { assessmentDate: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } };
        } else if (period === '1y') {
            dateFilter = { assessmentDate: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } };
        }

        const assessments = await ResilienceAssessment.find({ userId, ...dateFilter })
            .sort({ assessmentDate: 1 })
            .lean();

        const history = assessments.map(a => ({
            _id:    a._id,
            date:   a.assessmentDate || a.createdAt,
            scores: a.scores,
            overall: a.overall,
            dominantType: a.dominantType,
        }));

        const report = buildGrowthReport(history);

        res.json({ history, report });
    } catch (err) {
        logger.error('Growth history error:', err);
        res.status(500).json({ error: 'Failed to fetch growth history.' });
    }
});

// ── GET /api/comparisons/share/:token ─────────────────────────────────────────

router.get('/share/:token', async (req, res) => {
    try {
        const comparison = await Comparison.findOne({
            shareToken: req.params.token,
            isPublic:   true,
        }).lean();

        if (!comparison) {
            return res.status(404).json({ error: 'Comparison not found or link has expired.' });
        }

        if (comparison.expiresAt && new Date(comparison.expiresAt) < new Date()) {
            return res.status(410).json({ error: 'This comparison link has expired.' });
        }

        // Strip private user IDs from public response
        const safe = {
            ...comparison,
            createdBy: undefined,
            'user1.userId': undefined,
            'user2.userId': undefined,
        };

        res.json({ comparison: safe });
    } catch (err) {
        logger.error('Share token lookup error:', err);
        res.status(500).json({ error: 'Failed to load comparison.' });
    }
});

// ── GET /api/comparisons/:id ──────────────────────────────────────────────────

router.get('/:id', authenticateJWT, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid comparison ID.' });
        }

        const userId = req.user.userId || req.user.id;
        const comparison = await Comparison.findById(req.params.id).lean();

        if (!comparison) {
            return res.status(404).json({ error: 'Comparison not found.' });
        }

        // Only the creator may view private comparisons
        if (!comparison.isPublic && String(comparison.createdBy) !== String(userId)) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        res.json({ comparison });
    } catch (err) {
        logger.error('Get comparison error:', err);
        res.status(500).json({ error: 'Failed to load comparison.' });
    }
});

// ── POST /api/comparisons/:id/share ──────────────────────────────────────────

/**
 * Toggle public sharing or update share settings.
 * Body: { isPublic: true|false }
 */
router.post('/:id/share', authenticateJWT, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid comparison ID.' });
        }

        const userId = req.user.userId || req.user.id;
        const comparison = await Comparison.findById(req.params.id);

        if (!comparison) {
            return res.status(404).json({ error: 'Comparison not found.' });
        }

        if (String(comparison.createdBy) !== String(userId)) {
            return res.status(403).json({ error: 'Only the creator can modify sharing settings.' });
        }

        const isPublic = Boolean(req.body.isPublic);
        comparison.isPublic = isPublic;
        await comparison.save();

        const shareUrl = isPublic
            ? `/comparison.html?token=${comparison.shareToken}`
            : null;

        res.json({ success: true, isPublic, shareToken: comparison.shareToken, shareUrl });
    } catch (err) {
        logger.error('Share comparison error:', err);
        res.status(500).json({ error: 'Failed to update sharing settings.' });
    }
});

// ── DELETE /api/comparisons/:id ───────────────────────────────────────────────

router.delete('/:id', authenticateJWT, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid comparison ID.' });
        }

        const userId = req.user.userId || req.user.id;
        const comparison = await Comparison.findById(req.params.id);

        if (!comparison) {
            return res.status(404).json({ error: 'Comparison not found.' });
        }

        if (String(comparison.createdBy) !== String(userId)) {
            return res.status(403).json({ error: 'Only the creator can delete a comparison.' });
        }

        await comparison.deleteOne();

        res.json({ success: true });
    } catch (err) {
        logger.error('Delete comparison error:', err);
        res.status(500).json({ error: 'Failed to delete comparison.' });
    }
});

module.exports = router;
