'use strict';

/**
 * iatlas-progress.js — IATLAS completion-based progress routes.
 *
 * Progress is tracked by COMPLETIONS only — no assessment scores or
 * performance ratings are stored.
 *
 * Endpoints:
 *   POST   /api/iatlas/progress/complete-activity  — Mark an activity as complete
 *   GET    /api/iatlas/progress                    — Fetch progress for user / child
 *   GET    /api/iatlas/progress/:profileId         — Load saved progress snapshot for a child profile
 *   POST   /api/iatlas/progress/:profileId         — Save/upsert progress snapshot for a child profile
 *   DELETE /api/iatlas/progress/:profileId         — Clear all progress for a child profile
 */

const express   = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();

const { authenticateJWT }  = require('../middleware/auth');
const IATLASProgress       = require('../models/IATLASProgress');
const ChildProfile         = require('../models/ChildProfile');
const logger               = require('../utils/logger');

// ── Rate limiting ─────────────────────────────────────────────────────────────

const progressLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      120,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(progressLimiter);
router.use(authenticateJWT);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extract userId string from the verified JWT payload. */
function getUserId(req) {
  const raw = req.user?.userId || req.user?.sub || req.user?.id || null;
  return typeof raw === 'string' && raw.length > 0 ? raw : null;
}

/**
 * Sanitize an optional childProfileId from request params/body/query.
 * Accepts only non-empty strings of alphanumeric characters, hyphens, and
 * underscores (UUIDs, short IDs).  Returns null for any other value.
 */
function sanitizeProfileId(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return null;
  return /^[a-zA-Z0-9_-]{1,128}$/.test(value) ? value : null;
}

/** Empty progress shape returned when no document exists yet. */
function emptyProgress() {
  return {
    completedActivities: [],
    dimensionProgress: {
      'agentic-generative':   0,
      'somatic-regulative':   0,
      'cognitive-narrative':  0,
      'relational-connective':0,
      'emotional-adaptive':   0,
      'spiritual-existential':0,
    },
    unlockedBadges: [],
    totalXP: 0,
    xpHistory: [],
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    milestones: [],
  };
}

// ── Badge definitions (server-side copy) ─────────────────────────────────────
// Kept in sync with client/src/data/iatlas/badges.js

const XP_REWARDS = {
  activity_completed:    25,
  first_activity_of_day: 10,
};

const BADGE_DEFINITIONS = {
  'first-activity':     { xpReward: 50,   unlockCondition: { type: 'activity_count',     threshold: 1  } },
  'early-explorer':     { xpReward: 100,  unlockCondition: { type: 'activity_count',     threshold: 5  } },
  'skill-builder':      { xpReward: 200,  unlockCondition: { type: 'activity_count',     threshold: 10 } },
  'agentic-beginner':   { xpReward: 150,  dimension: 'agentic-generative',   unlockCondition: { type: 'dimension_count', dimension: 'agentic-generative',   threshold: 5 } },
  'somatic-beginner':   { xpReward: 150,  dimension: 'somatic-regulative',   unlockCondition: { type: 'dimension_count', dimension: 'somatic-regulative',   threshold: 5 } },
  'cognitive-beginner': { xpReward: 150,  dimension: 'cognitive-narrative',  unlockCondition: { type: 'dimension_count', dimension: 'cognitive-narrative',  threshold: 5 } },
  'relational-beginner':{ xpReward: 150,  dimension: 'relational-connective',unlockCondition: { type: 'dimension_count', dimension: 'relational-connective',threshold: 5 } },
  'emotional-beginner': { xpReward: 150,  dimension: 'emotional-adaptive',   unlockCondition: { type: 'dimension_count', dimension: 'emotional-adaptive',   threshold: 5 } },
  'spiritual-beginner': { xpReward: 150,  dimension: 'spiritual-existential',unlockCondition: { type: 'dimension_count', dimension: 'spiritual-existential',threshold: 5 } },
  'streak-3':           { xpReward: 100,  unlockCondition: { type: 'streak',               threshold: 3  } },
  'streak-7':           { xpReward: 250,  unlockCondition: { type: 'streak',               threshold: 7  } },
  'streak-30':          { xpReward: 1000, unlockCondition: { type: 'streak',               threshold: 30 } },
  'balanced-explorer':  { xpReward: 500,  unlockCondition: { type: 'balanced_dimensions',  threshold: 3  } },
  'dimension-master':   { xpReward: 300,  unlockCondition: { type: 'dimension_mastery',    threshold: 8  } },
  'iatlas-champion':    { xpReward: 1000, unlockCondition: { type: 'activity_count',       threshold: 50 } },
};

/** Evaluate a single badge unlock condition against the current progress state. */
function checkBadgeUnlock(condition, progress) {
  if (!condition) return false;
  const dp = progress.dimensionProgress || {};

  switch (condition.type) {
    case 'activity_count':
      return (progress.completedActivities || []).length >= condition.threshold;

    case 'dimension_count':
      return (dp[condition.dimension] || 0) >= condition.threshold;

    case 'streak':
      return (progress.currentStreak || 0) >= condition.threshold;

    case 'balanced_dimensions':
      return Object.values(dp).every(count => count >= condition.threshold);

    case 'dimension_mastery':
      return Object.values(dp).some(count => count >= condition.threshold);

    case 'dimensions_touched':
      return Object.values(dp).filter(count => count > 0).length >= condition.threshold;

    default:
      return false;
  }
}

// ── POST /complete-activity ───────────────────────────────────────────────────

/**
 * Mark an activity as completed and update progress, XP, streaks, and badges.
 *
 * Body: { activityId, dimension, ageGroup?, notes?, childProfileId? }
 *
 * Returns: { message, progress, newBadges, xpEarned }
 */
router.post('/complete-activity', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'User identity could not be determined.' });
  }

  const {
    activityId,
    dimension,
    ageGroup = null,
    notes    = '',
    childProfileId: rawChildProfileId = null,
  } = req.body || {};

  const childProfileId = sanitizeProfileId(rawChildProfileId);

  if (!activityId || typeof activityId !== 'string' || !activityId.trim()) {
    return res.status(400).json({ error: 'activityId is required.' });
  }
  if (!dimension || typeof dimension !== 'string' || !dimension.trim()) {
    return res.status(400).json({ error: 'dimension is required.' });
  }

  try {
    // ── Find or initialise progress document ─────────────────────────────────
    // Use findOneAndUpdate with upsert to avoid race conditions when two
    // concurrent requests would both try to create the initial document.
    let progress = await IATLASProgress.findOneAndUpdate(
      { userId, childProfileId },
      { $setOnInsert: { userId, childProfileId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // ── Prevent duplicate completions ─────────────────────────────────────────
    const alreadyCompleted = (progress.completedActivities || []).some(
      a => a.activityId === activityId.trim()
    );

    if (alreadyCompleted) {
      return res.status(200).json({
        message: 'Activity already completed',
        progress,
        newBadges: [],
        xpEarned: 0,
      });
    }

    const now = new Date();
    const todayStr = now.toDateString();

    // ── Add completion record ─────────────────────────────────────────────────
    progress.completedActivities.push({
      activityId: activityId.trim(),
      dimension:  dimension.trim(),
      ageGroup:   ageGroup  ? String(ageGroup).trim()  : undefined,
      notes:      notes     ? String(notes).trim()     : '',
      completedAt: now,
    });

    // ── Update dimension counter ──────────────────────────────────────────────
    const dimKey = dimension.trim();
    if (progress.dimensionProgress[dimKey] !== undefined) {
      progress.dimensionProgress[dimKey] += 1;
    }
    // Mark Mixed field as modified so Mongoose detects the change
    progress.markModified('dimensionProgress');

    // ── Award base XP ─────────────────────────────────────────────────────────
    let xpEarned = XP_REWARDS.activity_completed;

    const lastDayStr = progress.lastActivityDate
      ? new Date(progress.lastActivityDate).toDateString()
      : null;

    // Bonus XP for first activity of the day
    if (lastDayStr !== todayStr) {
      xpEarned += XP_REWARDS.first_activity_of_day;
    }

    progress.totalXP += xpEarned;
    progress.xpHistory.push({ amount: xpEarned, reason: 'activity_completed', earnedAt: now });

    // ── Update streak ─────────────────────────────────────────────────────────
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (lastDayStr === yesterdayStr) {
      progress.currentStreak += 1;
    } else if (lastDayStr !== todayStr) {
      progress.currentStreak = 1;
    }

    if (progress.currentStreak > progress.longestStreak) {
      progress.longestStreak = progress.currentStreak;
    }

    progress.lastActivityDate = now;

    // ── Check badge unlocks ───────────────────────────────────────────────────
    const newBadges = [];

    for (const [badgeId, badge] of Object.entries(BADGE_DEFINITIONS)) {
      const alreadyUnlocked = (progress.unlockedBadges || []).some(b => b.badgeId === badgeId);
      if (alreadyUnlocked) continue;

      if (checkBadgeUnlock(badge.unlockCondition, progress)) {
        progress.unlockedBadges.push({
          badgeId,
          dimension: badge.dimension || null,
          milestone: badgeId,
          unlockedAt: now,
        });
        const reward = badge.xpReward || 0;
        if (reward > 0) {
          progress.totalXP += reward;
          progress.xpHistory.push({
            amount:   reward,
            reason:   `badge_unlocked_${badgeId}`,
            earnedAt: now,
          });
        }
        newBadges.push({ badgeId, ...badge });
      }
    }

    await progress.save();

    const xpEarnedThisCompletion = xpEarned + newBadges.reduce((sum, b) => sum + (b.xpReward || 0), 0);

    return res.json({
      message:   'Activity completed!',
      progress,
      newBadges,
      xpEarned:  xpEarnedThisCompletion,
    });
  } catch (err) {
    logger.error('[iatlas-progress/complete-activity] error:', err);
    return res.status(500).json({ error: 'Failed to update progress.' });
  }
});

// ── GET / ─────────────────────────────────────────────────────────────────────

/**
 * Fetch progress for the authenticated user (or a specific child).
 *
 * Query: ?childProfileId=<id> (optional)
 *
 * Returns the progress document, or an empty progress object if none exists.
 */
router.get('/', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'User identity could not be determined.' });
  }

  const childProfileId = sanitizeProfileId(req.query.childProfileId);

  try {
    const progress = await IATLASProgress.findOne({ userId, childProfileId }).lean();

    if (!progress) {
      return res.json({ progress: emptyProgress(), exists: false });
    }

    return res.json({ progress, exists: true });
  } catch (err) {
    logger.error('[iatlas-progress/get] error:', err);
    return res.status(500).json({ error: 'Failed to fetch progress.' });
  }
});

// ── GET /:profileId ───────────────────────────────────────────────────────────

/**
 * Load the saved progress snapshot for a specific child profile.
 *
 * Route param: :profileId (UUID from ChildProfile)
 *
 * Returns the progress object stored in the child's profile document, or an
 * empty object `{}` when no progress has been saved yet.
 *
 * Response:
 *   { progress: { completedActivities, totalXP, level, badges, streaks, certificates },
 *     lastSyncedAt: <ISO date or null> }
 */
router.get('/:profileId', async (req, res) => {
  const userId    = getUserId(req);
  const profileId = sanitizeProfileId(req.params.profileId);

  if (!userId) {
    return res.status(401).json({ error: 'User identity could not be determined.' });
  }
  if (!profileId) {
    return res.status(400).json({ error: 'Invalid profileId.' });
  }

  try {
    const profile = await ChildProfile.findOne({
      profileId,
      userId: userId.toString(),
    }).lean();

    if (!profile) {
      return res.status(403).json({ error: 'Profile not found or access denied.' });
    }

    const progress = profile.progress || {};
    const hasProgress = progress.totalXP > 0 ||
      (Array.isArray(progress.badges) && progress.badges.length > 0) ||
      (progress.completedActivities && Object.keys(progress.completedActivities).length > 0);

    if (!hasProgress) {
      return res.json({ progress: {}, lastSyncedAt: null });
    }

    return res.json({
      progress,
      lastSyncedAt: profile.updatedAt || null,
    });
  } catch (err) {
    logger.error('[iatlas-progress/get-profile] error:', err);
    return res.status(500).json({ error: 'Failed to fetch progress.' });
  }
});

// ── POST /:profileId ──────────────────────────────────────────────────────────

/**
 * Save/upsert progress snapshot for a specific child profile.
 *
 * Route param: :profileId (UUID from ChildProfile)
 * Body: { progress: { completedActivities?, totalXP?, level?, badges?, streaks?, certificates? } }
 *
 * Performs a merge: incoming fields overwrite existing values; omitted fields
 * retain their existing values.
 *
 * Response:
 *   { success: true, progress: { ... }, lastSyncedAt: <ISO date> }
 */
router.post('/:profileId', async (req, res) => {
  const userId    = getUserId(req);
  const profileId = sanitizeProfileId(req.params.profileId);
  const { progress: incomingProgress } = req.body || {};

  if (!userId) {
    return res.status(401).json({ error: 'User identity could not be determined.' });
  }
  if (!profileId) {
    return res.status(400).json({ error: 'Invalid profileId.' });
  }
  if (!incomingProgress || typeof incomingProgress !== 'object' || Array.isArray(incomingProgress)) {
    return res.status(400).json({ error: 'progress is required and must be an object.' });
  }

  // Validate numeric fields
  if (incomingProgress.totalXP !== undefined && (typeof incomingProgress.totalXP !== 'number' || incomingProgress.totalXP < 0)) {
    return res.status(400).json({ error: 'progress.totalXP must be a non-negative number.' });
  }
  if (incomingProgress.level !== undefined && (typeof incomingProgress.level !== 'number' || incomingProgress.level < 1)) {
    return res.status(400).json({ error: 'progress.level must be a number >= 1.' });
  }

  try {
    // Verify ownership and load current document.
    const existing = await ChildProfile.findOne({
      profileId,
      userId: userId.toString(),
    });

    if (!existing) {
      return res.status(403).json({ error: 'Profile not found or access denied.' });
    }

    const current = existing.progress || {};

    const merged = {
      dimensions:          incomingProgress.dimensions          ?? current.dimensions          ?? {},
      totalXP:             incomingProgress.totalXP             ?? current.totalXP             ?? 0,
      level:               incomingProgress.level               ?? current.level               ?? 1,
      badges:              incomingProgress.badges              ?? current.badges              ?? [],
      streaks:             incomingProgress.streaks             ?? current.streaks             ?? {},
      completedActivities: incomingProgress.completedActivities ?? current.completedActivities ?? {},
      certificates:        incomingProgress.certificates        ?? current.certificates        ?? [],
    };

    existing.progress = merged;
    existing.markModified('progress');
    const saved = await existing.save();

    return res.json({
      success:      true,
      progress:     saved.progress,
      lastSyncedAt: saved.updatedAt,
    });
  } catch (err) {
    logger.error('[iatlas-progress/post-profile] error:', err);
    return res.status(500).json({ error: 'Failed to save progress.' });
  }
});

// ── DELETE /:profileId ────────────────────────────────────────────────────────

/**
 * Clear all progress for a specific child profile (reset to defaults).
 *
 * Route param: :profileId (UUID from ChildProfile)
 *
 * Response:
 *   { success: true, message: "Progress cleared for profile <profileId>" }
 */
router.delete('/:profileId', async (req, res) => {
  const userId    = getUserId(req);
  const profileId = sanitizeProfileId(req.params.profileId);

  if (!userId) {
    return res.status(401).json({ error: 'User identity could not be determined.' });
  }
  if (!profileId) {
    return res.status(400).json({ error: 'Invalid profileId.' });
  }

  try {
    const profile = await ChildProfile.findOne({
      profileId,
      userId: userId.toString(),
    });

    if (!profile) {
      return res.status(403).json({ error: 'Profile not found or access denied.' });
    }

    profile.progress = {
      dimensions:          {},
      totalXP:             0,
      level:               1,
      badges:              [],
      streaks:             {},
      completedActivities: {},
      certificates:        [],
    };
    profile.markModified('progress');
    await profile.save();

    return res.json({
      success: true,
      message: `Progress cleared for profile ${profileId}`,
    });
  } catch (err) {
    logger.error('[iatlas-progress/delete-profile] error:', err);
    return res.status(500).json({ error: 'Failed to clear progress.' });
  }
});


module.exports = router;
