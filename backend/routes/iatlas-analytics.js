'use strict';

/**
 * iatlas-analytics.js — Server-side analytics aggregation for IATLAS.
 *
 * Aggregates data from IATLASProgress documents to produce:
 *   - Total XP, activities completed, badges earned, current streak
 *   - Dimension completion counts
 *   - XP trend (daily earned XP over the requested time window)
 *   - Dimension completion over time (weekly completions per dimension)
 *
 * Endpoints:
 *   GET /api/iatlas/analytics/overview  — Aggregate overview for a user / child
 *
 * Query parameters:
 *   childProfileId  — optional; restrict to a specific child profile
 *   rangeKey        — '7d' | '30d' | '90d' | '1y' | 'all' (default: '30d')
 */

const express   = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();

const { authenticateJWT }  = require('../middleware/auth');
const IATLASProgress       = require('../models/IATLASProgress');
const logger               = require('../utils/logger');

// ── Rate limiting ─────────────────────────────────────────────────────────────

const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      60,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(analyticsLimiter);
router.use(authenticateJWT);

// ── Helpers ───────────────────────────────────────────────────────────────────

function getUserId(req) {
  const raw = req.user?.userId || req.user?.sub || req.user?.id || null;
  return typeof raw === 'string' && raw.length > 0 ? raw : null;
}

function sanitizeProfileId(value) {
  if (!value || typeof value !== 'string') return null;
  return /^[a-zA-Z0-9_-]{1,128}$/.test(value) ? value : null;
}

const RANGE_DAYS = {
  '7d':  7,
  '30d': 30,
  '90d': 90,
  '1y':  365,
  'all': null,
};

/**
 * Build a daily XP trend array within the given date window.
 * Returns an array of { date: 'YYYY-MM-DD', xp: number }.
 */
function buildXPTrend(xpHistory, since) {
  const daily = {};

  for (const entry of xpHistory) {
    const d = new Date(entry.earnedAt);
    if (since && d < since) continue;
    const key = d.toISOString().split('T')[0];
    daily[key] = (daily[key] || 0) + (entry.amount || 0);
  }

  return Object.entries(daily)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, xp]) => ({ date, xp }));
}

/**
 * Build weekly dimension completion counts within the given window.
 * Returns an array of { week: 'YYYY-Www', <dimensionKey>: number, ... }.
 */
function buildDimensionTrend(completedActivities, since) {
  const DIMENSIONS = [
    'agentic-generative',
    'somatic-regulative',
    'cognitive-narrative',
    'relational-connective',
    'emotional-adaptive',
    'spiritual-existential',
  ];

  /**
   * Return an ISO 8601 week string ('YYYY-Www') for a given date.
   * Week 1 is the week containing the first Thursday of the year.
   */
  function isoWeekKey(d) {
    // Set to the nearest Thursday so that the year is correct
    const thursday = new Date(d.getTime());
    thursday.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3);
    const yearStart = new Date(thursday.getFullYear(), 0, 1);
    const weekNum   = Math.ceil(((thursday - yearStart) / 86400000 + 1) / 7);
    return `${thursday.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }

  const weekly = {};

  for (const activity of completedActivities) {
    const d = new Date(activity.completedAt);
    if (since && d < since) continue;

    const week = isoWeekKey(d);

    if (!weekly[week]) {
      const entry = { week };
      DIMENSIONS.forEach(dim => { entry[dim] = 0; });
      weekly[week] = entry;
    }

    const dim = activity.dimension;
    if (dim && weekly[week][dim] !== undefined) {
      weekly[week][dim] += 1;
    }
  }

  return Object.values(weekly).sort((a, b) => a.week.localeCompare(b.week));
}

// ── GET /overview ─────────────────────────────────────────────────────────────

router.get('/overview', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'User identity could not be determined.' });
  }

  const childProfileId = sanitizeProfileId(req.query.childProfileId);
  const rangeKey       = RANGE_DAYS[req.query.rangeKey] !== undefined
    ? req.query.rangeKey
    : '30d';

  const days  = RANGE_DAYS[rangeKey];
  const since = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : null;

  try {
    // Build query — if childProfileId is provided restrict to that profile,
    // otherwise fetch all profiles for the user and aggregate.
    const query = childProfileId
      ? { userId, childProfileId }
      : { userId };

    const docs = await IATLASProgress.find(query).lean();

    if (!docs.length) {
      return res.json({
        overview: {
          totalXP: 0,
          totalActivities: 0,
          totalBadges: 0,
          currentStreak: 0,
          longestStreak: 0,
          dimensionProgress: {
            'agentic-generative':    0,
            'somatic-regulative':    0,
            'cognitive-narrative':   0,
            'relational-connective': 0,
            'emotional-adaptive':    0,
            'spiritual-existential': 0,
          },
          xpTrend:        [],
          dimensionTrend: [],
          rangeKey,
        },
      });
    }

    // Aggregate across all returned documents
    let totalXP          = 0;
    let totalBadges      = 0;
    let currentStreak    = 0;
    let longestStreak    = 0;
    const dimTotals      = {
      'agentic-generative':    0,
      'somatic-regulative':    0,
      'cognitive-narrative':   0,
      'relational-connective': 0,
      'emotional-adaptive':    0,
      'spiritual-existential': 0,
    };
    const allXPHistory           = [];
    const allCompletedActivities = [];

    for (const doc of docs) {
      totalXP       += doc.totalXP     || 0;
      totalBadges   += (doc.unlockedBadges || []).length;
      currentStreak  = Math.max(currentStreak, doc.currentStreak || 0);
      longestStreak  = Math.max(longestStreak, doc.longestStreak || 0);

      const dp = doc.dimensionProgress || {};
      for (const dim of Object.keys(dimTotals)) {
        dimTotals[dim] += dp[dim] || 0;
      }

      allXPHistory.push(...(doc.xpHistory || []));
      allCompletedActivities.push(...(doc.completedActivities || []));
    }

    const totalActivities = allCompletedActivities.length;

    const xpTrend        = buildXPTrend(allXPHistory, since);
    const dimensionTrend = buildDimensionTrend(allCompletedActivities, since);

    return res.json({
      overview: {
        totalXP,
        totalActivities,
        totalBadges,
        currentStreak,
        longestStreak,
        dimensionProgress: dimTotals,
        xpTrend,
        dimensionTrend,
        rangeKey,
      },
    });
  } catch (err) {
    logger.error('[iatlas-analytics/overview] error:', err);
    return res.status(500).json({ error: 'Failed to fetch analytics overview.' });
  }
});

module.exports = router;
