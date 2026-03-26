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
 *
 * All endpoints require:
 *   1. JWT authentication (authenticateJWT)
 *   2. A paid individual tier (atlas-navigator or atlas-premium) or any teams
 *      tier (starter, pro, enterprise) — enforced by requirePaidTier.
 */

const express    = require('express');
const rateLimit  = require('express-rate-limit');
const { authenticateJWT } = require('../middleware/auth');
const Purchase   = require('../models/Purchase');
const User       = require('../models/User');
const { PREMIUM_TIERS } = require('../config/tiers');
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

// ── All routes require JWT authentication ─────────────────────────────────────

router.use(authenticateJWT);

// ── Tier gate middleware ───────────────────────────────────────────────────────

/**
 * Tiers that grant access to gamification features.
 * Individual: atlas-navigator, atlas-premium
 * Teams:      starter, pro, enterprise
 *
 * Sourced from the canonical tier config — do not hardcode here.
 */
const GAMIFICATION_TIERS = new Set(PREMIUM_TIERS);

/**
 * requirePaidTier — middleware that verifies the authenticated user holds a
 * completed purchase for one of the GAMIFICATION_TIERS.
 *
 * Falls back gracefully when the DB is unavailable (allows access rather than
 * blocking — prevents lockout in degraded-DB scenarios).
 *
 * When STRIPE_SECRET_KEY is not set (development / local environment without
 * Stripe configured) the check is skipped so developers can test without a
 * real payment.
 */
async function requirePaidTier(req, res, next) {
  // Skip in environments where Stripe / payments are not configured.
  if (!process.env.STRIPE_SECRET_KEY) {
    return next();
  }

  // Resolve the email from the JWT payload.
  const email = req.user && (req.user.email || req.user.sub || '');
  if (!email) {
    return res.status(403).json({
      error: 'A paid tier (Atlas Navigator or above) is required to access gamification features.',
      upgradeRequired: true,
    });
  }

  try {
    const cleanEmail = String(email).toLowerCase().trim();

    // Check for a completed purchase at any gamification-eligible tier.
    const purchase = await Purchase.findOne({
      email:  cleanEmail,
      tier:   { $in: [...GAMIFICATION_TIERS] },
      status: 'completed',
    });

    if (purchase) return next();

    // Fallback: check User record flags for users granted access outside Stripe.
    let userHasAccess = false;
    try {
      const user = await User.findOne({ email: cleanEmail });
      userHasAccess = Boolean(
        user && (user.purchasedDeepReport || user.atlasPremium)
      );
    } catch (userErr) {
      logger.warn('[gamification] User fallback check failed:', userErr.message);
    }

    if (userHasAccess) return next();

    return res.status(402).json({
      error: 'A paid tier (Atlas Navigator or above) is required to access gamification features.',
      upgradeRequired: true,
    });
  } catch (dbErr) {
    // DB unavailable — block access to maintain security.
    // Return 503 so the client knows this is a temporary issue, not a permanent denial.
    logger.warn('[gamification] Purchase check failed (DB unavailable):', dbErr.message);
    return res.status(503).json({
      error: 'Unable to verify your purchase status at this time. Please try again shortly.',
    });
  }
}

router.use(requirePaidTier);

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
