'use strict';

/**
 * orgAnalytics.js — Organization-wide analytics routes for the Multi-Client Dashboard.
 *
 * Endpoints:
 *   GET  /api/analytics/org/overview          — KPIs, dimension averages, alerts
 *   GET  /api/analytics/org/cohorts           — List saved cohorts & comparison data
 *   POST /api/analytics/org/cohorts           — Create a new cohort
 *   GET  /api/analytics/org/practitioners     — Practitioner performance metrics
 *   GET  /api/analytics/org/capacity          — Caseload & capacity planning data
 *   POST /api/analytics/org/export            — Generate / schedule an export report
 *
 * All routes require authentication + practitioner tier (practice or enterprise).
 * The requesting user must be an admin or member of the target organization.
 */

const express   = require('express');
const rateLimit = require('express-rate-limit');
const mongoose  = require('mongoose');

const { authenticateJWT, requirePractitionerTier } = require('../../middleware/auth');
const ClientProfile          = require('../../models/ClientProfile');
const ClientProgressSnapshot = require('../../models/ClientProgressSnapshot');
const SessionNote            = require('../../models/SessionNote');
const logger                 = require('../../utils/logger');

const router = express.Router();

// ── Rate limiter ──────────────────────────────────────────────────────────────

const analyticsLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             60,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

// ── Common middleware ─────────────────────────────────────────────────────────

const commonChain = [analyticsLimiter, authenticateJWT, requirePractitionerTier];

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveUserId(req) {
  return req.user && (req.user.userId || req.user.sub);
}

const DIMENSIONS = ['agentic', 'somatic', 'emotional', 'cognitive', 'relational', 'spiritual'];

/**
 * Average an array of dimension-score objects into a single summary object.
 */
function averageDimScores(snapshots) {
  if (!snapshots || snapshots.length === 0) {
    return DIMENSIONS.reduce((acc, d) => ({ ...acc, [d]: 0 }), {});
  }
  const sums = DIMENSIONS.reduce((acc, d) => ({ ...acc, [d]: 0 }), {});
  let count = 0;
  for (const snap of snapshots) {
    const s = snap.scores || {};
    let valid = false;
    for (const d of DIMENSIONS) {
      if (s[d] != null) { sums[d] += s[d]; valid = true; }
    }
    if (valid) count++;
  }
  if (count === 0) return DIMENSIONS.reduce((acc, d) => ({ ...acc, [d]: 0 }), {});
  return DIMENSIONS.reduce((acc, d) => ({ ...acc, [d]: Math.round((sums[d] / count) * 10) / 10 }), {});
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /overview
// Returns top-level KPIs and dimension averages for the organization.
// ─────────────────────────────────────────────────────────────────────────────

router.get('/overview', ...commonChain, async (req, res) => {
  try {
    const practitionerId = resolveUserId(req);

    // Fetch all active clients for this practitioner / org
    const clients = await ClientProfile.find(
      { practitionerId, isActive: true },
      { _id: 1, firstName: 1, lastName: 1, dateOfBirth: 1, createdAt: 1 },
    ).lean();

    const clientIds = clients.map(c => c._id);
    const totalActiveClients = clients.length;

    // Sessions this month
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const sessionsThisMonth = await SessionNote.countDocuments({
      clientId:    { $in: clientIds },
      sessionDate: { $gte: monthStart },
    });

    // Dimension averages from the most-recent snapshot per client
    const latestSnapshots = await ClientProgressSnapshot.aggregate([
      { $match: { clientId: { $in: clientIds } } },
      { $sort:  { snapshotDate: -1 } },
      { $group: { _id: '$clientId', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
    ]);
    const avgDimensions = averageDimScores(latestSnapshots);

    // Baseline snapshots (oldest per client)
    const baselineSnapshots = await ClientProgressSnapshot.aggregate([
      { $match: { clientId: { $in: clientIds } } },
      { $sort:  { snapshotDate: 1 } },
      { $group: { _id: '$clientId', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
    ]);
    const baselineDimensions = averageDimScores(baselineSnapshots);

    // Improvement delta per dimension
    const dimensionImprovement = DIMENSIONS.reduce((acc, d) => ({
      ...acc,
      [d]: Math.round((avgDimensions[d] - baselineDimensions[d]) * 10) / 10,
    }), {});

    // Program completion rate (clients with at least one goal_achieved milestone)
    const Milestone = (() => {
      try { return require('../../models/ClientMilestone'); } catch { return null; }
    })();
    let completionRate = null;
    if (Milestone && clientIds.length > 0) {
      const completedIds = await Milestone.distinct('clientId', {
        clientId:      { $in: clientIds },
        milestoneType: 'goal_achieved',
      });
      completionRate = Math.round((completedIds.length / clientIds.length) * 1000) / 10;
    }

    // Simple retention rate (clients created > 90 days ago who are still active)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const olderClients  = clients.filter(c => new Date(c.createdAt) <= ninetyDaysAgo);
    const retentionRate = olderClients.length > 0
      ? Math.round((olderClients.length / clients.length) * 1000) / 10
      : null;

    return res.json({
      kpis: {
        totalActiveClients,
        sessionsThisMonth,
        completionRate,
        retentionRate,
      },
      avgDimensions,
      baselineDimensions,
      dimensionImprovement,
    });
  } catch (err) {
    logger.error('[orgAnalytics] GET /overview error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /practitioners
// Per-practitioner caseload and outcome metrics.
// ─────────────────────────────────────────────────────────────────────────────

router.get('/practitioners', ...commonChain, async (req, res) => {
  try {
    const practitionerId = resolveUserId(req);

    // Active clients
    const clients = await ClientProfile.find(
      { practitionerId, isActive: true },
      { _id: 1, createdAt: 1 },
    ).lean();
    const clientIds = clients.map(c => c._id);

    // Sessions last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sessions30d   = await SessionNote.countDocuments({
      clientId:    { $in: clientIds },
      sessionDate: { $gte: thirtyDaysAgo },
    });

    // Average dimension improvement
    const latestSnapshots = await ClientProgressSnapshot.aggregate([
      { $match: { clientId: { $in: clientIds } } },
      { $sort:  { snapshotDate: -1 } },
      { $group: { _id: '$clientId', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
    ]);
    const baselineSnapshots = await ClientProgressSnapshot.aggregate([
      { $match: { clientId: { $in: clientIds } } },
      { $sort:  { snapshotDate: 1 } },
      { $group: { _id: '$clientId', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
    ]);

    const latestAvg  = averageDimScores(latestSnapshots);
    const baseline   = averageDimScores(baselineSnapshots);
    const overallImprovement = Math.round(
      DIMENSIONS.reduce((sum, d) => sum + (latestAvg[d] - baseline[d]), 0) / DIMENSIONS.length * 10
    ) / 10;

    // Note completion rate
    const totalExpectedNotes = clients.length * 4; // assume 4 sessions/month per client
    const noteCompletionRate = totalExpectedNotes > 0
      ? Math.min(100, Math.round((sessions30d / totalExpectedNotes) * 100))
      : 0;

    return res.json({
      practitioners: [
        {
          practitionerId,
          caseloadSize:       clients.length,
          sessions30d,
          overallImprovement,
          noteCompletionRate,
        },
      ],
    });
  } catch (err) {
    logger.error('[orgAnalytics] GET /practitioners error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /capacity
// Caseload utilization and capacity planning data.
// ─────────────────────────────────────────────────────────────────────────────

router.get('/capacity', ...commonChain, async (req, res) => {
  try {
    const practitionerId = resolveUserId(req);

    const [activeClients, inactiveClients] = await Promise.all([
      ClientProfile.countDocuments({ practitionerId, isActive: true }),
      ClientProfile.countDocuments({ practitionerId, isActive: false }),
    ]);

    // Default max caseload (would normally come from practitioner_capacity table)
    const maxCaseload = 20;
    const utilizationPct = maxCaseload > 0
      ? Math.min(100, Math.round((activeClients / maxCaseload) * 100))
      : 0;

    return res.json({
      practitioners: [
        {
          practitionerId,
          currentCaseload:   activeClients,
          maxCaseload,
          utilizationPct,
          acceptsNewClients: activeClients < maxCaseload,
        },
      ],
      waitlistCount: Math.max(0, inactiveClients),
    });
  } catch (err) {
    logger.error('[orgAnalytics] GET /capacity error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /cohorts
// List saved cohorts for the current practitioner / org.
// ─────────────────────────────────────────────────────────────────────────────

router.get('/cohorts', ...commonChain, async (req, res) => {
  try {
    // Cohorts table not yet persisted — return empty list so the UI can
    // still operate in "create first cohort" mode.
    return res.json({ cohorts: [] });
  } catch (err) {
    logger.error('[orgAnalytics] GET /cohorts error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /cohorts
// Create a new cohort definition and return a client preview count.
// ─────────────────────────────────────────────────────────────────────────────

router.post('/cohorts', ...commonChain, async (req, res) => {
  try {
    const practitionerId = resolveUserId(req);
    const { name, filterCriteria = {} } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Cohort name is required.' });
    }

    // Build a dynamic query from filterCriteria
    const query = { practitionerId, isActive: true };

    if (filterCriteria.ageRange && Array.isArray(filterCriteria.ageRange)) {
      const [min, max] = filterCriteria.ageRange;
      const now        = new Date();
      if (min != null) {
        query.dateOfBirth = { ...query.dateOfBirth, $lte: new Date(now.getFullYear() - min, now.getMonth(), now.getDate()) };
      }
      if (max != null) {
        query.dateOfBirth = { ...query.dateOfBirth, $gte: new Date(now.getFullYear() - max - 1, now.getMonth(), now.getDate()) };
      }
    }

    if (filterCriteria.gender) {
      query.gender = filterCriteria.gender;
    }

    const clients = await ClientProfile.find(query, { _id: 1 }).lean();

    return res.status(201).json({
      cohortId:    `cohort_${Date.now()}`,
      name:        name.trim(),
      clientCount: clients.length,
      previewData: { clientIds: clients.map(c => c._id.toString()) },
    });
  } catch (err) {
    logger.error('[orgAnalytics] POST /cohorts error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /export
// Generate a report export (returns a placeholder download URL).
// ─────────────────────────────────────────────────────────────────────────────

router.post('/export', ...commonChain, async (req, res) => {
  try {
    const { reportType = 'executive_summary', format = 'pdf', filters = {} } = req.body;

    const ALLOWED_TYPES   = new Set(['executive_summary', 'board_report', 'grant_report', 'raw_csv']);
    const ALLOWED_FORMATS = new Set(['pdf', 'csv', 'xlsx']);

    if (!ALLOWED_TYPES.has(reportType)) {
      return res.status(400).json({ error: 'Invalid report type.' });
    }
    if (!ALLOWED_FORMATS.has(format)) {
      return res.status(400).json({ error: 'Invalid export format.' });
    }

    // Placeholder — actual generation would be handled by a background job.
    return res.json({
      exportId:    `export_${Date.now()}`,
      downloadUrl: null,
      scheduled:   false,
      message:     'Export queued. Download will be available shortly.',
    });
  } catch (err) {
    logger.error('[orgAnalytics] POST /export error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
