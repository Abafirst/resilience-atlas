'use strict';

/**
 * clientProgress.js — Per-client progress tracking routes.
 *
 * All routes require a valid JWT (authenticateJWT) and Practitioner/Practice/
 * Enterprise tier access (requirePractitionerTier).
 *
 * Endpoints (all prefixed with /api/clinical/clients/:id):
 *
 *   GET  /progress-overview              — Comprehensive progress summary
 *   GET  /progress-timeline              — Time-series data for charts
 *   POST /progress-snapshots             — Create a new progress snapshot
 *   GET  /progress-snapshots             — List all snapshots (sorted newest-first)
 *   POST /milestones                     — Record a new milestone
 *   GET  /milestones                     — List all milestones (sorted newest-first)
 *   GET  /activity-effectiveness-trends  — Activity effectiveness analysis
 *   GET  /session-frequency-analysis     — Session frequency metrics
 *   GET  /goal-progress-report           — Detailed goal progress breakdown
 */

const express   = require('express');
const mongoose  = require('mongoose');
const rateLimit = require('express-rate-limit');

const { authenticateJWT, requirePractitionerTier } = require('../../middleware/auth');
const ClientProfile          = require('../../models/ClientProfile');
const ClientProgressSnapshot = require('../../models/ClientProgressSnapshot');
const ClientMilestone        = require('../../models/ClientMilestone');
const SessionNote            = require('../../models/SessionNote');
const ClientActivityHistory  = require('../../models/ClientActivityHistory');
const {
  calculateOverallProgress,
  calculateProgressTrend,
  calculateOverallScore,
  calculateSessionFrequency,
  buildTimelineDataPoints,
  buildDimensionChanges,
  dateRangeToCutoff,
} = require('../../utils/progressCalculations');
const logger = require('../../utils/logger');

const router = express.Router({ mergeParams: true });

// ── Rate limiter ──────────────────────────────────────────────────────────────

const progressLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             120,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveUserId(req) {
  return req.user && (req.user.userId || req.user.sub);
}

// ── Middleware: verify client ownership ──────────────────────────────────────

async function verifyClientOwnership(req, res, next) {
  try {
    const clientId       = req.params.id;
    const practitionerId = resolveUserId(req);

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID.' });
    }

    const client = await ClientProfile.findById(clientId).lean();
    if (!client || client.practitionerId !== practitionerId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    req.clientDoc    = client;
    req.clientId     = clientId;
    req.practitionerId = practitionerId;
    next();
  } catch (err) {
    logger.error('[clientProgress] verifyClientOwnership error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

// ── Common middleware chain ───────────────────────────────────────────────────

const commonChain = [
  progressLimiter,
  authenticateJWT,
  requirePractitionerTier,
  verifyClientOwnership,
];

// ─────────────────────────────────────────────────────────────────────────────
// GET /progress-overview
// ─────────────────────────────────────────────────────────────────────────────

router.get('/progress-overview', ...commonChain, async (req, res) => {
  try {
    const { id: clientProfileId, practitionerId } = req;
    const dateRange  = req.query.date_range || '90_days';
    const cutoff     = dateRangeToCutoff(dateRange);
    const dateFilter = cutoff ? { $gte: cutoff } : undefined;

    // Fetch data in parallel.
    const [allNotes, allSnapshots, allMilestones] = await Promise.all([
      SessionNote.find(
        {
          practitionerId,
          clientProfileId: new mongoose.Types.ObjectId(clientProfileId),
          isDeleted: false,
          ...(dateFilter ? { sessionDate: dateFilter } : {}),
        },
        { sessionDate: 1, activities: 1 }
      ).sort({ sessionDate: -1 }).lean(),

      ClientProgressSnapshot.find(
        { practitionerId, clientProfileId: new mongoose.Types.ObjectId(clientProfileId) }
      ).sort({ snapshotDate: 1 }).lean(),

      ClientMilestone.find(
        { practitionerId, clientProfileId: new mongoose.Types.ObjectId(clientProfileId) }
      ).sort({ achievedDate: -1 }).lean(),
    ]);

    // Session stats.
    const allSessionsNotes = await SessionNote.find(
      { practitionerId, clientProfileId: new mongoose.Types.ObjectId(clientProfileId), isDeleted: false },
      { sessionDate: 1 }
    ).sort({ sessionDate: -1 }).lean();

    const totalSessions     = allSessionsNotes.length;
    const sessionsInRange   = allNotes.length;
    const lastSessionDate   = allSessionsNotes[0]?.sessionDate || null;
    const daysSinceLast     = lastSessionDate
      ? Math.floor((Date.now() - new Date(lastSessionDate).getTime()) / (24 * 60 * 60 * 1000))
      : null;

    // Activity stats.
    const activityUsageCounts = {};
    const activityCategoryMap = {};
    allNotes.forEach(note => {
      (note.activities || []).forEach(act => {
        const aid = act.activityId;
        if (!aid) return;
        activityUsageCounts[aid] = (activityUsageCounts[aid] || 0) + 1;
        if (act.category) activityCategoryMap[aid] = act.category;
      });
    });

    const activityHistoryDocs = await ClientActivityHistory.find(
      { practitionerId, clientProfileId: new mongoose.Types.ObjectId(clientProfileId) },
      { activityId: 1, effectivenessRating: 1 }
    ).lean();

    const ratingAccum = {};
    activityHistoryDocs.forEach(doc => {
      if (doc.effectivenessRating == null) return;
      if (!ratingAccum[doc.activityId]) ratingAccum[doc.activityId] = { sum: 0, count: 0 };
      ratingAccum[doc.activityId].sum   += doc.effectivenessRating;
      ratingAccum[doc.activityId].count += 1;
    });

    const avgRating = (id) =>
      ratingAccum[id] ? ratingAccum[id].sum / ratingAccum[id].count : null;

    const uniqueActivityIds = Object.keys(activityUsageCounts);
    const top5Frequent = [...uniqueActivityIds]
      .sort((a, b) => activityUsageCounts[b] - activityUsageCounts[a])
      .slice(0, 5)
      .map(id => ({ activityId: id, usageCount: activityUsageCounts[id] }));

    const top5Rated = uniqueActivityIds
      .filter(id => avgRating(id) !== null)
      .sort((a, b) => (avgRating(b) || 0) - (avgRating(a) || 0))
      .slice(0, 5)
      .map(id => ({ activityId: id, averageRating: Math.round(avgRating(id) * 10) / 10 }));

    const allRatings = activityHistoryDocs
      .filter(d => d.effectivenessRating != null)
      .map(d => d.effectivenessRating);
    const averageEffectiveness = allRatings.length
      ? Math.round((allRatings.reduce((s, v) => s + v, 0) / allRatings.length) * 10) / 10
      : null;

    // Category breakdown.
    const categoryTotals = {};
    uniqueActivityIds.forEach(id => {
      const cat = activityCategoryMap[id] || 'uncategorized';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + activityUsageCounts[id];
    });
    const totalActUsages = Object.values(categoryTotals).reduce((s, v) => s + v, 0);
    const categoryBreakdown = Object.entries(categoryTotals).map(([cat, count]) => ({
      category:   cat,
      count,
      percentage: totalActUsages ? Math.round((count / totalActUsages) * 100) : 0,
    }));

    // Goal stats from client profile.
    const goals       = req.clientDoc.clinicalGoals || [];
    const totalGoals  = goals.length;
    const achieved    = goals.filter(g => g.status === 'achieved').length;
    const inProgress  = goals.filter(g => g.status === 'active').length;
    const completionPct = totalGoals ? Math.round((achieved / totalGoals) * 100) : 0;

    const completionTimes = goals
      .filter(g => g.status === 'achieved' && g.createdAt && g.achievedAt)
      .map(g =>
        (new Date(g.achievedAt).getTime() - new Date(g.createdAt).getTime()) /
        (24 * 60 * 60 * 1000)
      );
    const avgDaysToGoalCompletion = completionTimes.length
      ? Math.round(completionTimes.reduce((s, v) => s + v, 0) / completionTimes.length)
      : null;

    // Dimension progress.
    const baselineSnapshot = allSnapshots[0] || null;
    const latestSnapshot   = allSnapshots[allSnapshots.length - 1] || null;

    const baselineScores = baselineSnapshot?.dimensionScores || null;
    const currentScores  = latestSnapshot?.dimensionScores   || null;
    const dimensionChanges = buildDimensionChanges(baselineScores, currentScores);
    const overallImprovement = calculateOverallProgress(baselineScores, currentScores);
    const trend = calculateProgressTrend(allSnapshots);

    return res.json({
      sessionStats: {
        totalSessions,
        sessionsInRange,
        lastSessionDate,
        daysSinceLast,
      },
      activityStats: {
        totalUniqueActivities:   uniqueActivityIds.length,
        mostFrequentActivities:  top5Frequent,
        highestRatedActivities:  top5Rated,
        categoryBreakdown,
        averageEffectivenessRating: averageEffectiveness,
      },
      goalProgress: {
        totalGoals,
        goalsCompleted:    achieved,
        goalsInProgress:   inProgress,
        completionPercentage: completionPct,
        avgDaysToCompletion:  avgDaysToGoalCompletion,
      },
      milestones: {
        totalMilestones:    allMilestones.length,
        recentMilestones:   allMilestones.slice(0, 5),
      },
      dimensionProgress: {
        baselineScores,
        currentScores,
        dimensionChanges,
        overallImprovementPoints: overallImprovement,
        trend,
      },
    });
  } catch (err) {
    logger.error('[clientProgress] GET /progress-overview error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /progress-timeline
// ─────────────────────────────────────────────────────────────────────────────

router.get('/progress-timeline', ...commonChain, async (req, res) => {
  try {
    const { id: clientProfileId, practitionerId } = req;
    const {
      metric      = 'overall_score',
      date_range  = '90_days',
      granularity = 'monthly',
    } = req.query;

    if (!['daily', 'weekly', 'monthly'].includes(granularity)) {
      return res.status(400).json({ error: 'granularity must be daily, weekly, or monthly.' });
    }

    const cutoff = dateRangeToCutoff(date_range);
    const snapshotFilter = {
      practitionerId,
      clientProfileId: new mongoose.Types.ObjectId(clientProfileId),
      ...(cutoff ? { snapshotDate: { $gte: cutoff } } : {}),
    };

    const snapshots = await ClientProgressSnapshot.find(snapshotFilter)
      .sort({ snapshotDate: 1 })
      .lean();

    if (metric === 'session_frequency') {
      // Build weekly session buckets from session notes.
      const noteFilter = {
        practitionerId,
        clientProfileId: new mongoose.Types.ObjectId(clientProfileId),
        isDeleted: false,
        ...(cutoff ? { sessionDate: { $gte: cutoff } } : {}),
      };
      const notes = await SessionNote.find(noteFilter, { sessionDate: 1 }).lean();

      const buckets = {};
      notes.forEach(note => {
        const d      = new Date(note.sessionDate);
        const day    = d.getDay() || 7;
        const monday = new Date(d);
        monday.setDate(d.getDate() - day + 1);
        const key = monday.toISOString().slice(0, 10);
        buckets[key] = (buckets[key] || 0) + 1;
      });

      const dataPoints = Object.entries(buckets)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, value]) => ({ date, value }));

      return res.json({ metric, granularity, dataPoints });
    }

    if (metric === 'dimension_scores') {
      // Return one series per dimension.
      const series = {};
      const DIMENSIONS = require('../../utils/progressCalculations').DIMENSION_KEYS;
      DIMENSIONS.forEach(dim => { series[dim] = []; });

      snapshots.forEach(snap => {
        const dateStr = new Date(snap.snapshotDate).toISOString().slice(0, 10);
        DIMENSIONS.forEach(dim => {
          series[dim].push({ date: dateStr, value: snap.dimensionScores?.[dim] || 0 });
        });
      });

      return res.json({ metric, granularity, series });
    }

    // Default: overall_score timeline.
    const dataPoints = buildTimelineDataPoints(snapshots, granularity);
    return res.json({ metric, granularity, dataPoints });
  } catch (err) {
    logger.error('[clientProgress] GET /progress-timeline error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /progress-snapshots — Create a new snapshot
// ─────────────────────────────────────────────────────────────────────────────

router.post('/progress-snapshots', ...commonChain, async (req, res) => {
  try {
    const { id: clientProfileId, practitionerId } = req;
    const { snapshot_date, dimension_scores, overall_score, data_source, notes } = req.body;

    if (!snapshot_date) {
      return res.status(400).json({ error: 'snapshot_date is required.' });
    }
    const parsedDate = new Date(snapshot_date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'snapshot_date is not a valid date.' });
    }

    if (!dimension_scores || typeof dimension_scores !== 'object') {
      return res.status(400).json({ error: 'dimension_scores object is required.' });
    }

    const validSources = ClientProgressSnapshot.VALID_DATA_SOURCES ||
      ['assessment', 'practitioner_observation', 'self_report'];
    const resolvedSource = data_source || 'practitioner_observation';
    if (!validSources.includes(resolvedSource)) {
      return res.status(400).json({ error: `data_source must be one of: ${validSources.join(', ')}` });
    }

    const computedOverall = overall_score != null
      ? Number(overall_score)
      : calculateOverallScore(dimension_scores);

    if (!Number.isFinite(computedOverall) || computedOverall < 0 || computedOverall > 100) {
      return res.status(400).json({ error: 'overall_score must be a number between 0 and 100.' });
    }

    const snapshot = await ClientProgressSnapshot.create({
      practitionerId,
      clientProfileId: new mongoose.Types.ObjectId(clientProfileId),
      snapshotDate:    parsedDate,
      dimensionScores: dimension_scores,
      overallScore:    computedOverall,
      dataSource:      resolvedSource,
      notes:           notes || '',
    });

    logger.info(`[clientProgress] Created snapshot ${snapshot._id} for client ${clientProfileId}`);
    return res.status(201).json(snapshot);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    logger.error('[clientProgress] POST /progress-snapshots error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /progress-snapshots — List all snapshots with trend analysis
// ─────────────────────────────────────────────────────────────────────────────

router.get('/progress-snapshots', ...commonChain, async (req, res) => {
  try {
    const { id: clientProfileId, practitionerId } = req;

    const snapshots = await ClientProgressSnapshot.find({
      practitionerId,
      clientProfileId: new mongoose.Types.ObjectId(clientProfileId),
    }).sort({ snapshotDate: -1 }).lean();

    const trend = calculateProgressTrend([...snapshots].reverse());

    return res.json({ snapshots, trend });
  } catch (err) {
    logger.error('[clientProgress] GET /progress-snapshots error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /milestones — Record a new milestone
// ─────────────────────────────────────────────────────────────────────────────

router.post('/milestones', ...commonChain, async (req, res) => {
  try {
    const { id: clientProfileId, practitionerId } = req;
    const {
      milestone_type,
      title,
      description,
      achieved_date,
      session_note_id,
      related_goal_id,
    } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'title is required.' });
    }
    if (title.trim().length < 2 || title.trim().length > 200) {
      return res.status(400).json({ error: 'title must be 2–200 characters.' });
    }

    if (!achieved_date) {
      return res.status(400).json({ error: 'achieved_date is required.' });
    }
    const parsedDate = new Date(achieved_date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'achieved_date is not a valid date.' });
    }

    const validTypes = ClientMilestone.VALID_MILESTONE_TYPES ||
      ['goal_achieved', 'skill_mastered', 'behavior_improved', 'session_count', 'custom'];
    const resolvedType = milestone_type || 'custom';
    if (!validTypes.includes(resolvedType)) {
      return res.status(400).json({ error: `milestone_type must be one of: ${validTypes.join(', ')}` });
    }

    const milestone = await ClientMilestone.create({
      practitionerId,
      clientProfileId: new mongoose.Types.ObjectId(clientProfileId),
      milestoneType:   resolvedType,
      title:           title.trim(),
      description:     description || '',
      achievedDate:    parsedDate,
      sessionNoteId:   session_note_id && mongoose.Types.ObjectId.isValid(session_note_id)
        ? new mongoose.Types.ObjectId(session_note_id)
        : null,
      relatedGoalId: related_goal_id && mongoose.Types.ObjectId.isValid(related_goal_id)
        ? new mongoose.Types.ObjectId(related_goal_id)
        : null,
    });

    logger.info(`[clientProgress] Created milestone ${milestone._id} for client ${clientProfileId}`);
    return res.status(201).json(milestone);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    logger.error('[clientProgress] POST /milestones error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /milestones — List milestones (newest first)
// ─────────────────────────────────────────────────────────────────────────────

router.get('/milestones', ...commonChain, async (req, res) => {
  try {
    const { id: clientProfileId, practitionerId } = req;

    const milestones = await ClientMilestone.find({
      practitionerId,
      clientProfileId: new mongoose.Types.ObjectId(clientProfileId),
    }).sort({ achievedDate: -1 }).lean();

    return res.json({ milestones });
  } catch (err) {
    logger.error('[clientProgress] GET /milestones error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /activity-effectiveness-trends
// ─────────────────────────────────────────────────────────────────────────────

router.get('/activity-effectiveness-trends', ...commonChain, async (req, res) => {
  try {
    const { id: clientProfileId, practitionerId } = req;

    const historyDocs = await ClientActivityHistory.find({
      practitionerId,
      clientProfileId: new mongoose.Types.ObjectId(clientProfileId),
    }).sort({ usedAt: 1 }).lean();

    // Aggregate per activity.
    const activityMap = {};
    historyDocs.forEach(doc => {
      const id = doc.activityId;
      if (!activityMap[id]) {
        activityMap[id] = { activityId: id, category: doc.category || null, entries: [] };
      }
      activityMap[id].entries.push({
        usedAt: doc.usedAt,
        rating: doc.effectivenessRating,
      });
    });

    const activities = Object.values(activityMap).map(act => {
      const rated   = act.entries.filter(e => e.rating != null);
      const avgRating = rated.length
        ? Math.round((rated.reduce((s, e) => s + e.rating, 0) / rated.length) * 10) / 10
        : null;

      // Simple trend: compare first-half vs second-half ratings.
      let trend = 'stable';
      if (rated.length >= 4) {
        const mid        = Math.floor(rated.length / 2);
        const olderAvg   = rated.slice(0, mid).reduce((s, e) => s + e.rating, 0) / mid;
        const recentAvg  = rated.slice(mid).reduce((s, e) => s + e.rating, 0) / (rated.length - mid);
        if (recentAvg - olderAvg > 0.5)  trend = 'improving';
        if (recentAvg - olderAvg < -0.5) trend = 'declining';
      }

      return {
        activityId:    act.activityId,
        category:      act.category,
        usageCount:    act.entries.length,
        averageRating: avgRating,
        trend,
      };
    });

    // Categorise.
    const trending  = activities.filter(a => a.trend === 'improving');
    const declining = activities.filter(a => a.trend === 'declining');

    // Category summary.
    const categoryMap = {};
    activities.forEach(a => {
      const cat = a.category || 'uncategorized';
      if (!categoryMap[cat]) categoryMap[cat] = { category: cat, count: 0, ratingSum: 0, ratedCount: 0 };
      categoryMap[cat].count++;
      if (a.averageRating != null) {
        categoryMap[cat].ratingSum   += a.averageRating;
        categoryMap[cat].ratedCount  += 1;
      }
    });

    const byCategory = Object.values(categoryMap).map(c => ({
      category:      c.category,
      activityCount: c.count,
      averageRating: c.ratedCount ? Math.round((c.ratingSum / c.ratedCount) * 10) / 10 : null,
    }));

    return res.json({
      activities,
      trendingActivities:  trending,
      decliningActivities: declining,
      byCategory,
    });
  } catch (err) {
    logger.error('[clientProgress] GET /activity-effectiveness-trends error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /session-frequency-analysis
// ─────────────────────────────────────────────────────────────────────────────

router.get('/session-frequency-analysis', ...commonChain, async (req, res) => {
  try {
    const { id: clientProfileId, practitionerId } = req;

    const notes = await SessionNote.find(
      {
        practitionerId,
        clientProfileId: new mongoose.Types.ObjectId(clientProfileId),
        isDeleted: false,
      },
      { sessionDate: 1 }
    ).sort({ sessionDate: 1 }).lean();

    const sessionDates = notes.map(n => new Date(n.sessionDate));

    const freq4w  = calculateSessionFrequency(sessionDates, 28);
    const freq8w  = calculateSessionFrequency(sessionDates, 56);
    const freq12w = calculateSessionFrequency(sessionDates, 84);
    const freq3m  = calculateSessionFrequency(sessionDates, 91);
    const freq6m  = calculateSessionFrequency(sessionDates, 182);
    const freq12m = calculateSessionFrequency(sessionDates, 365);

    // Identify gaps (stretches of 14+ days between consecutive sessions).
    const gaps = [];
    for (let i = 1; i < sessionDates.length; i++) {
      const days = Math.floor(
        (sessionDates[i].getTime() - sessionDates[i - 1].getTime()) / (24 * 60 * 60 * 1000)
      );
      if (days >= 14) {
        gaps.push({
          from: sessionDates[i - 1].toISOString().slice(0, 10),
          to:   sessionDates[i].toISOString().slice(0, 10),
          days,
        });
      }
    }

    return res.json({
      totalSessions: notes.length,
      byWeeks: {
        last4:  freq4w,
        last8:  freq8w,
        last12: freq12w,
      },
      byMonths: {
        last3:  freq3m,
        last6:  freq6m,
        last12: freq12m,
      },
      gaps,
    });
  } catch (err) {
    logger.error('[clientProgress] GET /session-frequency-analysis error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /goal-progress-report
// ─────────────────────────────────────────────────────────────────────────────

router.get('/goal-progress-report', ...commonChain, async (req, res) => {
  try {
    const goals = req.clientDoc.clinicalGoals || [];
    const now   = Date.now();

    const RISK_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000;

    const enriched = goals.map(g => {
      const daysSinceUpdate = g.updatedAt
        ? Math.floor((now - new Date(g.updatedAt).getTime()) / (24 * 60 * 60 * 1000))
        : null;

      const atRisk = g.status === 'active' &&
        (!g.updatedAt || (now - new Date(g.updatedAt).getTime()) > RISK_THRESHOLD_MS);

      const daysToComplete = (g.status === 'achieved' && g.createdAt && g.achievedAt)
        ? Math.floor(
            (new Date(g.achievedAt).getTime() - new Date(g.createdAt).getTime()) /
            (24 * 60 * 60 * 1000)
          )
        : null;

      return {
        goalId:          g._id,
        goal:            g.goal,
        priority:        g.priority,
        status:          g.status,
        createdAt:       g.createdAt,
        achievedAt:      g.achievedAt || null,
        updatedAt:       g.updatedAt || null,
        daysSinceUpdate,
        daysToComplete,
        atRisk,
      };
    });

    const byPriority  = {};
    const byStatus    = {};
    enriched.forEach(g => {
      (byPriority[g.priority]  ||= []).push(g);
      (byStatus[g.status]      ||= []).push(g);
    });

    const achieved       = enriched.filter(g => g.status === 'achieved');
    const completionTimes = achieved.filter(g => g.daysToComplete !== null).map(g => g.daysToComplete);
    const avgCompletion  = completionTimes.length
      ? Math.round(completionTimes.reduce((s, v) => s + v, 0) / completionTimes.length)
      : null;

    return res.json({
      goals: enriched,
      byPriority,
      byStatus,
      goalsAtRisk:              enriched.filter(g => g.atRisk),
      averageDaysToCompletion:  avgCompletion,
    });
  } catch (err) {
    logger.error('[clientProgress] GET /goal-progress-report error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
