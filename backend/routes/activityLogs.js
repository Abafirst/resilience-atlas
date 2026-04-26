'use strict';

/**
 * activityLogs.js — Activity log query routes.
 * Mounted at /api/activity-logs
 */

const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const ActivityLog = require('../models/ActivityLog');
const PracticePractitioner = require('../models/PracticePractitioner');
const { authenticateJWT } = require('../middleware/auth');
const { hasPermission } = require('../config/practicePermissions');

const router = express.Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(limiter);

function getUserId(req) {
  return req.user && (req.user.userId || req.user.id || req.user._id);
}

async function getPractitionerRole(practiceId, userId) {
  const pp = await PracticePractitioner.findOne({ practiceId, userId, status: 'active' }).lean();
  return pp ? pp.role : null;
}

// ── GET /api/activity-logs — Get activity logs ────────────────────────────────
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { practiceId, limit = 50, page = 1, action, resourceType, startDate, endDate } = req.query;

    if (!practiceId || !mongoose.Types.ObjectId.isValid(practiceId)) {
      return res.status(400).json({ error: 'Valid practiceId query param is required.' });
    }

    const role = await getPractitionerRole(practiceId, userId);
    const canViewAll = hasPermission(role, 'audit_logs', 'view_all');
    const canViewOwn = hasPermission(role, 'audit_logs', 'view_own');

    if (!canViewAll && !canViewOwn) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    const filter = { practiceId };
    if (!canViewAll) filter.userId = userId;
    if (action) filter.action = action;
    if (resourceType) filter.resourceType = resourceType;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const parsedLimit = Math.min(parseInt(limit, 10) || 50, 100);
    const parsedPage = parseInt(page, 10) || 1;
    const skip = (parsedPage - 1) * parsedLimit;

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate('userId', 'email name')
        .lean(),
      ActivityLog.countDocuments(filter),
    ]);

    res.json({ logs, total, page: parsedPage, limit: parsedLimit });
  } catch (err) {
    console.error('[activityLogs] GET /:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/activity-logs/export — Export activity logs as JSON ──────────────
router.get('/export', authenticateJWT, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { practiceId, startDate, endDate } = req.query;

    if (!practiceId || !mongoose.Types.ObjectId.isValid(practiceId)) {
      return res.status(400).json({ error: 'Valid practiceId query param is required.' });
    }

    const role = await getPractitionerRole(practiceId, userId);
    if (!hasPermission(role, 'audit_logs', 'view_all')) {
      return res.status(403).json({ error: 'Insufficient permissions. Only admins can export logs.' });
    }

    const filter = { practiceId };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(5000)
      .populate('userId', 'email name')
      .lean();

    res.setHeader('Content-Disposition', 'attachment; filename="activity-logs.json"');
    res.setHeader('Content-Type', 'application/json');
    res.json({ logs, exportedAt: new Date(), total: logs.length });
  } catch (err) {
    console.error('[activityLogs] GET /export:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
