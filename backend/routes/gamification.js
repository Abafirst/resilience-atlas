'use strict';

/**
 * gamification.js — REST routes
 *
 * Endpoints
 *   GET  /api/gamification/progress        — fetch own progress
 *   POST /api/gamification/practice        — record a practice completion
 *   POST /api/gamification/challenge       — set / update weekly challenge
 *   POST /api/gamification/share           — award share points
 *   PUT  /api/gamification/preferences     — update opt-in preferences
 *   GET  /api/gamification/leaderboard     — opt-in leaderboard (weekly/monthly/alltime)
 */

const express    = require('express');
const rateLimit  = require('express-rate-limit');
const { authenticateJWT } = require('../middleware/auth');
const svc        = require('../services/gamificationService');
const logger     = require('../utils/logger');

const router = express.Router();

// ── Rate limiting ─────────────────────────────────────────────────────────────

const gamificationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      60,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(gamificationLimiter);

// ── All routes require authentication ─────────────────────────────────────────

router.use(authenticateJWT);

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_DIMENSIONS = new Set([
  'Cognitive-Narrative',
  'Emotional-Somatic',
  'Relational-Social',
  'Agentic-Generative',
  'Somatic-Regulative',
  'Spiritual-Reflective',
]);

const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

function userId(req) {
  return req.user.id || req.user.userId;
}

// ── GET /api/gamification/progress ───────────────────────────────────────────

/**
 * Fetch (or create) the calling user's full gamification progress.
 */
router.get('/progress', async (req, res) => {
  try {
    const progress = await svc.getOrCreateProgress(userId(req));
    res.status(200).json({ progress });
  } catch (err) {
    logger.error('gamification/progress error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/gamification/practice ──────────────────────────────────────────

/**
 * Record a micro-practice completion.
 *
 * Body:
 *   practiceId  {string}  required
 *   dimension   {string}  optional — resilience dimension for challenge tracking
 */
router.post('/practice', async (req, res) => {
  try {
    const { practiceId, dimension } = req.body;

    if (!practiceId || typeof practiceId !== 'string' || !practiceId.trim()) {
      return res.status(400).json({ error: 'practiceId is required.' });
    }

    if (dimension !== undefined && !VALID_DIMENSIONS.has(dimension)) {
      return res.status(400).json({ error: `dimension must be one of: ${[...VALID_DIMENSIONS].join(', ')}.` });
    }

    const { progress, newBadges, streakUpdated } = await svc.recordPracticeCompletion(
      userId(req),
      practiceId.trim(),
      dimension || null
    );

    res.status(200).json({
      message:       'Practice completion recorded.',
      totalPoints:   progress.totalPoints,
      currentStreak: progress.currentStreak.days,
      newBadges,
      streakUpdated,
    });
  } catch (err) {
    logger.error('gamification/practice error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/gamification/challenge ─────────────────────────────────────────

/**
 * Set the user's weekly challenge.
 *
 * Body:
 *   dimension   {string}  required
 *   difficulty  {string}  optional — easy | medium | hard (default: medium)
 */
router.post('/challenge', async (req, res) => {
  try {
    const { dimension, difficulty = 'medium' } = req.body;

    if (!dimension || !VALID_DIMENSIONS.has(dimension)) {
      return res.status(400).json({ error: `dimension must be one of: ${[...VALID_DIMENSIONS].join(', ')}.` });
    }

    if (!VALID_DIFFICULTIES.has(difficulty)) {
      return res.status(400).json({ error: 'difficulty must be easy, medium, or hard.' });
    }

    const progress = await svc.setWeeklyChallenge(userId(req), dimension, difficulty);

    res.status(200).json({
      message:          'Weekly challenge set.',
      currentChallenge: progress.currentChallenge,
    });
  } catch (err) {
    logger.error('gamification/challenge error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/gamification/share ─────────────────────────────────────────────

/**
 * Award the user +1 point for sharing a result.
 */
router.post('/share', async (req, res) => {
  try {
    const progress = await svc.recordShare(userId(req));
    res.status(200).json({
      message:     'Share recorded.',
      totalPoints: progress.totalPoints,
    });
  } catch (err) {
    logger.error('gamification/share error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── PUT /api/gamification/preferences ────────────────────────────────────────

/**
 * Update opt-in preferences.
 *
 * Body (all optional, at least one required):
 *   leaderboardOptIn     {boolean}
 *   notificationsEnabled {boolean}
 */
router.put('/preferences', async (req, res) => {
  try {
    const { leaderboardOptIn, notificationsEnabled } = req.body;

    if (leaderboardOptIn === undefined && notificationsEnabled === undefined) {
      return res.status(400).json({ error: 'At least one preference field is required.' });
    }

    if (leaderboardOptIn !== undefined && typeof leaderboardOptIn !== 'boolean') {
      return res.status(400).json({ error: 'leaderboardOptIn must be a boolean.' });
    }
    if (notificationsEnabled !== undefined && typeof notificationsEnabled !== 'boolean') {
      return res.status(400).json({ error: 'notificationsEnabled must be a boolean.' });
    }

    const progress = await svc.updatePreferences(userId(req), { leaderboardOptIn, notificationsEnabled });

    res.status(200).json({
      message:               'Preferences updated.',
      leaderboardOptIn:      progress.leaderboardOptIn,
      notificationsEnabled:  progress.notificationsEnabled,
    });
  } catch (err) {
    logger.error('gamification/preferences error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/gamification/leaderboard ────────────────────────────────────────

/**
 * Return the opt-in leaderboard.
 *
 * Query params:
 *   period  weekly | monthly | alltime  (default: weekly)
 *   limit   1-100                       (default: 10)
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const period = ['weekly', 'monthly', 'alltime'].includes(req.query.period)
      ? req.query.period
      : 'weekly';

    const rawLimit = parseInt(req.query.limit, 10);
    const limit = (!Number.isNaN(rawLimit) && rawLimit >= 1 && rawLimit <= 100)
      ? rawLimit
      : 10;

    const entries = await svc.getLeaderboard(period, limit);
    res.status(200).json({ period, entries });
  } catch (err) {
    logger.error('gamification/leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
