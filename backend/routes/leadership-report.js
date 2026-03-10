'use strict';

/**
 * leadership-report.js
 *
 * API endpoints for the Leadership Insights Report.
 * All routes require authentication and admin membership in the organization.
 *
 * Base path: /api/org/:organizationId/leadership-report
 */

const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const LeadershipReport = require('../models/LeadershipReport');
const Organization = require('../models/Organization');
const { authenticateJWT } = require('../middleware/auth');
const { generateLeadershipReport } = require('../services/leadership-report-generator');

const router = express.Router({ mergeParams: true });

const reportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(reportLimiter);

// ── Helper ────────────────────────────────────────────────────────────────────

function isAdmin(org, userId) {
  return org.admins.some((id) => id.toString() === userId.toString());
}

async function requireOrgAdmin(req, res) {
  const { organizationId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    res.status(400).json({ error: 'Invalid organization ID.' });
    return null;
  }

  const org = await Organization.findById(organizationId);
  if (!org) {
    res.status(404).json({ error: 'Organization not found.' });
    return null;
  }

  if (!isAdmin(org, req.user.userId)) {
    res.status(403).json({ error: 'Access denied. Admins only.' });
    return null;
  }

  return org;
}

// ── GET latest report ─────────────────────────────────────────────────────────

/**
 * GET /api/org/:organizationId/leadership-report
 * Returns the most recent non-archived leadership report for the organization.
 */
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const org = await requireOrgAdmin(req, res);
    if (!org) return;

    const reports = await LeadershipReport.find({
      organizationId: org._id,
      isArchived: false,
    }).sort({ reportDate: -1 }).limit(1);

    const report = reports[0] || null;

    if (!report) {
      return res.status(404).json({ error: 'No report found. Generate one first.' });
    }

    res.json({ report });
  } catch (err) {
    console.error('Get report error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST generate report ──────────────────────────────────────────────────────

/**
 * POST /api/org/:organizationId/leadership-report/generate
 * Manually trigger report generation (admin only).
 */
router.post('/generate', authenticateJWT, async (req, res) => {
  try {
    const org = await requireOrgAdmin(req, res);
    if (!org) return;

    const report = await generateLeadershipReport(org._id, req.user.userId);

    res.status(201).json({
      reportId: report._id,
      status: 'generated',
      completedAt: report.reportDate,
    });
  } catch (err) {
    console.error('Generate report error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET report history ────────────────────────────────────────────────────────

/**
 * GET /api/org/:organizationId/leadership-report/history
 * Returns a summary list of all historical reports (newest first).
 */
router.get('/history', authenticateJWT, async (req, res) => {
  try {
    const org = await requireOrgAdmin(req, res);
    if (!org) return;

    const reports = await LeadershipReport.find({
      organizationId: org._id,
      isArchived: false,
    })
      .sort({ reportDate: -1 })
      .select('reportDate teamOverview.totalRespondents teamOverview.averageOverallScore _id');

    const history = reports.map((r) => ({
      reportId: r._id,
      reportDate: r.reportDate,
      respondents: r.teamOverview.totalRespondents,
      averageScore: r.teamOverview.averageOverallScore,
    }));

    res.json({ history });
  } catch (err) {
    console.error('Report history error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET specific report ───────────────────────────────────────────────────────

/**
 * GET /api/org/:organizationId/leadership-report/:reportId
 * Returns a specific report by ID.
 */
router.get('/:reportId', authenticateJWT, async (req, res) => {
  try {
    const org = await requireOrgAdmin(req, res);
    if (!org) return;

    const { reportId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID.' });
    }

    const report = await LeadershipReport.findOne({
      _id: reportId,
      organizationId: org._id,
    });

    if (!report) return res.status(404).json({ error: 'Report not found.' });

    res.json({ report });
  } catch (err) {
    console.error('Get report by ID error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── PUT archive report ────────────────────────────────────────────────────────

/**
 * PUT /api/org/:organizationId/leadership-report/:reportId/archive
 * Soft-delete (archive) a report.
 */
router.put('/:reportId/archive', authenticateJWT, async (req, res) => {
  try {
    const org = await requireOrgAdmin(req, res);
    if (!org) return;

    const { reportId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID.' });
    }

    const report = await LeadershipReport.findOneAndUpdate(
      { _id: reportId, organizationId: org._id },
      { isArchived: true, lastUpdated: new Date() },
      { new: true }
    );

    if (!report) return res.status(404).json({ error: 'Report not found.' });

    res.json({ success: true, archived_at: report.lastUpdated });
  } catch (err) {
    console.error('Archive report error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET compare reports ───────────────────────────────────────────────────────

/**
 * GET /api/org/:organizationId/leadership-report/:reportId/compare
 * Compare a report against a previous one.
 * Query: ?previous_report_id=<id>
 */
router.get('/:reportId/compare', authenticateJWT, async (req, res) => {
  try {
    const org = await requireOrgAdmin(req, res);
    if (!org) return;

    const { reportId } = req.params;
    const { previous_report_id } = req.query;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID.' });
    }

    const [current, previous] = await Promise.all([
      LeadershipReport.findOne({ _id: reportId, organizationId: org._id }),
      previous_report_id && mongoose.Types.ObjectId.isValid(previous_report_id)
        ? LeadershipReport.findOne({ _id: previous_report_id, organizationId: org._id })
        : Promise.resolve(null),
    ]);

    if (!current) return res.status(404).json({ error: 'Report not found.' });

    const comparison = {
      current: {
        reportId: current._id,
        reportDate: current.reportDate,
        averageOverallScore: current.teamOverview.averageOverallScore,
        resilienceLevel: current.teamOverview.resilienceLevel,
        responseRate: current.teamOverview.responseRate,
      },
      previous: previous
        ? {
            reportId: previous._id,
            reportDate: previous.reportDate,
            averageOverallScore: previous.teamOverview.averageOverallScore,
            resilienceLevel: previous.teamOverview.resilienceLevel,
            responseRate: previous.teamOverview.responseRate,
          }
        : null,
      trend_analysis: null,
    };

    if (previous) {
      const scoreDelta =
        current.teamOverview.averageOverallScore - previous.teamOverview.averageOverallScore;

      const dimensionDeltas = {};
      for (const dim of Object.keys(current.dimensionAnalysis)) {
        const cur = current.dimensionAnalysis[dim];
        const prev = previous.dimensionAnalysis[dim];
        if (cur && prev) {
          dimensionDeltas[dim] = Math.round((cur.average - prev.average) * 10) / 10;
        }
      }

      comparison.trend_analysis = {
        overallScoreDelta: Math.round(scoreDelta * 10) / 10,
        direction: scoreDelta > 0 ? 'improving' : scoreDelta < 0 ? 'declining' : 'stable',
        dimensionDeltas,
      };
    }

    res.json({ comparison });
  } catch (err) {
    console.error('Compare reports error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
