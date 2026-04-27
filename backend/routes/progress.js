'use strict';

/**
 * progress.js — REST routes for IATLAS user progress persistence.
 *
 * Endpoints
 *   GET    /api/progress        — fetch own progress (adult or kids)
 *   POST   /api/progress/sync   — upsert (sync) progress from client
 *   DELETE /api/progress/reset  — delete all progress for user / child profile
 *
 * All endpoints require JWT authentication (authenticateJWT).
 */

const express   = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateJWT } = require('../middleware/auth');
const UserProgress = require('../models/UserProgress');
const logger    = require('../utils/logger');

const router = express.Router();

// ── Rate limiting ─────────────────────────────────────────────────────────────

const progressLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      120,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(progressLimiter);

// ── All routes require JWT authentication ─────────────────────────────────────

router.use(authenticateJWT);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extract userId from the authenticated request. */
function userId(req) {
  return req.user?.userId || req.user?.sub || req.user?.id || null;
}

/** Default empty adult progress document (no DB document yet). */
function defaultAdultProgress(uid, childProfileId = null) {
  return {
    userId:           uid,
    childProfileId:   childProfileId,
    progressType:     'adult',
    skillProgress:    {},
    completedModules: [],
    xp:               0,
    level:            1,
    badges:           [],
    streaks:          { current: 0, longest: 0, lastActivityDate: null },
    quests:           [],
    rawAdultData:     {},
    lastSyncedAt:     null,
  };
}

/** Default empty kids progress document. */
function defaultKidsProgress(uid, childProfileId) {
  return {
    userId:          uid,
    childProfileId:  childProfileId,
    progressType:    'kids',
    kidsActivities:  {},
    kidsBadges:      [],
    kidsStreaks:     { current: 0, longest: 0, lastActivityDate: null },
    kidsAdventures:  [],
    rawKidsData:     {},
    lastSyncedAt:    null,
  };
}

/**
 * Deep-merge incoming progress data with existing document data.
 * Arrays are deduplicated (union); numeric fields take the maximum;
 * nested objects are recursively merged.
 */
function mergeProgress(existing, incoming) {
  const merged = { ...existing };

  for (const [key, inVal] of Object.entries(incoming)) {
    const exVal = existing[key];

    if (inVal === null || inVal === undefined) continue;

    if (Array.isArray(inVal) && Array.isArray(exVal)) {
      // Union — deduplicate primitive arrays (badges, completedModules, kidsBadges)
      merged[key] = [...new Set([...exVal, ...inVal])];
    } else if (typeof inVal === 'number' && typeof exVal === 'number') {
      // Take the larger value (XP, level, stars)
      merged[key] = Math.max(exVal, inVal);
    } else if (
      inVal !== null &&
      typeof inVal === 'object' &&
      !Array.isArray(inVal) &&
      exVal !== null &&
      typeof exVal === 'object' &&
      !Array.isArray(exVal)
    ) {
      // Recursively merge plain objects (skillProgress, kidsActivities, streaks, etc.)
      merged[key] = mergeProgress(exVal, inVal);
    } else {
      // Scalar values: keep incoming
      merged[key] = inVal;
    }
  }

  return merged;
}

// ── GET /api/progress ─────────────────────────────────────────────────────────

/**
 * Fetch user progress.
 *
 * Query params:
 *   childProfileId (optional) — fetch kids progress for a specific child profile
 *
 * Returns the progress document or a default empty object if none exists.
 */
router.get('/', async (req, res) => {
  const uid            = userId(req);
  const childProfileId = req.query.childProfileId || null;

  if (!uid) {
    return res.status(401).json({ error: 'User identity could not be determined.' });
  }

  try {
    const doc = await UserProgress.findOne({ userId: uid, childProfileId }).lean();

    if (!doc) {
      const empty = childProfileId
        ? defaultKidsProgress(uid, childProfileId)
        : defaultAdultProgress(uid);
      return res.json({ progress: empty, exists: false });
    }

    return res.json({ progress: doc, exists: true });
  } catch (err) {
    logger.error('[progress] GET / error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/progress/sync ───────────────────────────────────────────────────

/**
 * Upsert (sync) progress data from the client.
 *
 * Body:
 *   childProfileId (optional string)
 *   progressData   (object) — partial or full progress state from localStorage
 *
 * Returns the merged canonical progress state with an updated lastSyncedAt.
 */
router.post('/sync', async (req, res) => {
  const uid = userId(req);
  if (!uid) {
    return res.status(401).json({ error: 'User identity could not be determined.' });
  }

  const { childProfileId = null, progressData } = req.body || {};

  if (!progressData || typeof progressData !== 'object') {
    return res.status(400).json({ error: 'progressData is required and must be an object.' });
  }

  try {
    const now = new Date();
    const existing = await UserProgress.findOne({ userId: uid, childProfileId }).lean();

    const base = existing
      ? existing
      : (childProfileId ? defaultKidsProgress(uid, childProfileId) : defaultAdultProgress(uid));

    // Sanitise: strip MongoDB internals before merging
    const { _id, __v, createdAt, updatedAt, ...baseFields } = base;

    const mergedFields = mergeProgress(baseFields, progressData);
    mergedFields.lastSyncedAt = now;

    const updated = await UserProgress.findOneAndUpdate(
      { userId: uid, childProfileId },
      { $set: mergedFields },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({ progress: updated, lastSyncedAt: now });
  } catch (err) {
    logger.error('[progress] POST /sync error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── DELETE /api/progress/reset ────────────────────────────────────────────────

/**
 * Delete all progress for the authenticated user (or a specific child profile).
 *
 * Body:
 *   childProfileId (optional string)
 *
 * Returns { success: true }.
 */
router.delete('/reset', async (req, res) => {
  const uid = userId(req);
  if (!uid) {
    return res.status(401).json({ error: 'User identity could not be determined.' });
  }

  const { childProfileId = null } = req.body || {};

  try {
    await UserProgress.deleteOne({ userId: uid, childProfileId });
    return res.json({ success: true });
  } catch (err) {
    logger.error('[progress] DELETE /reset error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
