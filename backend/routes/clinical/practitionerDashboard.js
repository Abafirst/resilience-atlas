'use strict';

/**
 * practitionerDashboard.js — Aggregate practitioner dashboard routes.
 *
 * Endpoints:
 *   GET   /api/clinical/dashboard/alerts          — Cross-client alerts
 *   GET   /api/clinical/dashboard/aggregate-stats — Aggregate caseload stats
 *   PATCH /api/clinical/dashboard/settings        — Update dashboard preferences
 *   GET   /api/clinical/dashboard/settings        — Get dashboard preferences
 */

const express   = require('express');
const rateLimit = require('express-rate-limit');
const mongoose  = require('mongoose');

const { authenticateJWT, requirePractitionerTier } = require('../../middleware/auth');
const ClientProfile                = require('../../models/ClientProfile');
const ClientProgressSnapshot       = require('../../models/ClientProgressSnapshot');
const SessionNote                  = require('../../models/SessionNote');
const ClientActivityHistory        = require('../../models/ClientActivityHistory');
const PractitionerDashboardSettings = require('../../models/PractitionerDashboardSettings');
const { generateClientAlerts }     = require('../../utils/clientAlerts');
const { calculateProgressTrend }   = require('../../utils/progressCalculations');
const logger                       = require('../../utils/logger');

const router = express.Router();

// ── Rate limiter ──────────────────────────────────────────────────────────────

const dashboardLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             60,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveUserId(req) {
  return req.user && (req.user.userId || req.user.sub);
}

// ── Common middleware ─────────────────────────────────────────────────────────

const commonChain = [dashboardLimiter, authenticateJWT, requirePractitionerTier];

// ─────────────────────────────────────────────────────────────────────────────
// GET /alerts
// ─────────────────────────────────────────────────────────────────────────────

router.get('/alerts', ...commonChain, async (req, res) => {
  try {
    const practitionerId = resolveUserId(req);
    const { alert_type, priority } = req.query;

    // Fetch all active clients for this practitioner.
    const clients = await ClientProfile.find(
      { practitionerId, isActive: true },
      { _id: 1, clinicalGoals: 1, lastSessionDate: 1, clientIdentifier: 1 }
    ).lean();

    const allAlerts = [];

    // Fetch snapshots for all clients in one query.
    const clientIds = clients.map(c => c._id);
    const snapshots = await ClientProgressSnapshot.find(
      { practitionerId, clientProfileId: { $in: clientIds } },
      { clientProfileId: 1, overallScore: 1, snapshotDate: 1 }
    ).lean();

    // Group snapshots by clientProfileId.
    const snapshotsByClient = {};
    snapshots.forEach(s => {
      const key = s.clientProfileId.toString();
      (snapshotsByClient[key] ||= []).push(s);
    });

    clients.forEach(client => {
      const clientId = client._id.toString();
      const clientSnaps = snapshotsByClient[clientId] || [];
      const goals       = client.clinicalGoals || [];

      const alerts = generateClientAlerts(
        clientId,
        client.lastSessionDate || null,
        clientSnaps,
        goals
      );

      alerts.forEach(a => allAlerts.push({ ...a, clientIdentifier: client.clientIdentifier }));
    });

    // Filter by query params if supplied.
    let filtered = allAlerts;
    if (alert_type) {
      filtered = filtered.filter(a => a.alertType === alert_type);
    }
    if (priority) {
      filtered = filtered.filter(a => a.priority === priority);
    }

    return res.json({ alerts: filtered, total: filtered.length });
  } catch (err) {
    logger.error('[dashboard] GET /alerts error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /aggregate-stats
// ─────────────────────────────────────────────────────────────────────────────

router.get('/aggregate-stats', ...commonChain, async (req, res) => {
  try {
    const practitionerId = resolveUserId(req);

    // Active client count.
    const totalActiveClients = await ClientProfile.countDocuments({
      practitionerId,
      isActive: true,
    });

    // Sessions this calendar month.
    const startOfMonth  = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const sessionsThisMonth = await SessionNote.countDocuments({
      practitionerId,
      isDeleted:   false,
      sessionDate: { $gte: startOfMonth },
    });

    // Average progress across all clients (mean of latest overallScore per client).
    const clients = await ClientProfile.find(
      { practitionerId, isActive: true },
      { _id: 1 }
    ).lean();

    const clientIds = clients.map(c => c._id);

    // Get latest snapshot per client.
    const latestSnapshots = await ClientProgressSnapshot.aggregate([
      { $match: { practitionerId, clientProfileId: { $in: clientIds } } },
      { $sort:  { snapshotDate: -1 } },
      { $group: { _id: '$clientProfileId', overallScore: { $first: '$overallScore' } } },
    ]);

    const avgProgress = latestSnapshots.length
      ? Math.round(
          latestSnapshots.reduce((s, d) => s + (d.overallScore || 0), 0) /
          latestSnapshots.length
        )
      : null;

    // Most effective activities across all clients.
    const topActivities = await ClientActivityHistory.aggregate([
      { $match: { practitionerId, effectivenessRating: { $ne: null } } },
      {
        $group: {
          _id:           '$activityId',
          avgRating:     { $avg: '$effectivenessRating' },
          usageCount:    { $sum: 1 },
        },
      },
      { $sort:  { avgRating: -1 } },
      { $limit: 10 },
    ]);

    // Caseload age distribution.
    const ageGroups = await ClientProfile.aggregate([
      { $match: { practitionerId, isActive: true } },
      { $group: { _id: '$ageGroup', count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
    ]);

    return res.json({
      totalActiveClients,
      sessionsThisMonth,
      averageClientProgress: avgProgress,
      topActivitiesAcrossClients: topActivities.map(a => ({
        activityId:    a._id,
        averageRating: Math.round(a.avgRating * 10) / 10,
        usageCount:    a.usageCount,
      })),
      caseloadByAgeGroup: ageGroups.map(g => ({ ageGroup: g._id, count: g.count })),
    });
  } catch (err) {
    logger.error('[dashboard] GET /aggregate-stats error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /settings
// ─────────────────────────────────────────────────────────────────────────────

router.get('/settings', ...commonChain, async (req, res) => {
  try {
    const practitionerId = resolveUserId(req);

    let settings = await PractitionerDashboardSettings.findOne({ practitionerId }).lean();

    if (!settings) {
      // Return defaults without persisting.
      settings = {
        practitionerId,
        defaultDateRange:  '90_days',
        favoriteMetrics:   [],
        alertPreferences:  {
          no_recent_session:  true,
          declining_progress: true,
          goal_at_risk:       true,
        },
      };
    }

    return res.json(settings);
  } catch (err) {
    logger.error('[dashboard] GET /settings error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /settings
// ─────────────────────────────────────────────────────────────────────────────

router.patch('/settings', ...commonChain, async (req, res) => {
  try {
    const practitionerId = resolveUserId(req);
    const { default_date_range, favorite_metrics, alert_preferences } = req.body;

    const validRanges = PractitionerDashboardSettings.VALID_DATE_RANGES ||
      ['7_days', '30_days', '90_days', '6_months', '1_year', 'all_time'];

    const update = {};

    if (default_date_range !== undefined) {
      if (!validRanges.includes(default_date_range)) {
        return res.status(400).json({
          error: `default_date_range must be one of: ${validRanges.join(', ')}`,
        });
      }
      update.defaultDateRange = default_date_range;
    }

    if (favorite_metrics !== undefined) {
      if (!Array.isArray(favorite_metrics)) {
        return res.status(400).json({ error: 'favorite_metrics must be an array.' });
      }
      update.favoriteMetrics = favorite_metrics;
    }

    if (alert_preferences !== undefined) {
      if (typeof alert_preferences !== 'object' || Array.isArray(alert_preferences)) {
        return res.status(400).json({ error: 'alert_preferences must be an object.' });
      }
      update.alertPreferences = alert_preferences;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided to update.' });
    }

    const settings = await PractitionerDashboardSettings.findOneAndUpdate(
      { practitionerId },
      { $set: update },
      { upsert: true, new: true, runValidators: true }
    );

    logger.info(`[dashboard] Updated settings for practitioner ${practitionerId}`);
    return res.json(settings);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    logger.error('[dashboard] PATCH /settings error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
