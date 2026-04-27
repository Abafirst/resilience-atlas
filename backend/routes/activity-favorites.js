'use strict';

/**
 * activity-favorites.js
 * REST endpoints for user activity favorites (bookmarking).
 *
 * Mounted at: /api/activity-favorites
 * Auth:       authenticateJWT (applied in server.js before mounting)
 *
 * GET    /api/activity-favorites              – Get the current user's favorites
 * POST   /api/activity-favorites/:activityId  – Add an activity to favorites
 * DELETE /api/activity-favorites/:activityId  – Remove an activity from favorites
 */

const express   = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();

const ActivityFavorites = require('../models/ActivityFavorites');
const logger            = require('../utils/logger');

// ── Rate limiting ─────────────────────────────────────────────────────────────

const favoritesLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             120,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(favoritesLimiter);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extract userId string from the verified JWT payload. */
function getUserId(req) {
  const raw = req.user?.sub || req.user?.userId || req.user?.id || null;
  return typeof raw === 'string' && raw.length > 0 ? raw : null;
}

/**
 * Validate an activityId path parameter.
 * Accepts alphanumeric strings, hyphens, and underscores (1–128 chars).
 */
function isValidActivityId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(id);
}

// ── GET /api/activity-favorites ───────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const doc = await ActivityFavorites.findOne({ userId }).lean();

    res.json({
      favorites: doc?.favorites || [],
      count:     doc?.favorites?.length || 0,
    });
  } catch (err) {
    logger.error('[activity-favorites] GET error', { message: err.message });
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// ── POST /api/activity-favorites/:activityId ──────────────────────────────────

router.post('/:activityId', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { activityId } = req.params;
    if (!isValidActivityId(activityId)) {
      return res.status(400).json({ error: 'Invalid activityId' });
    }

    const notes = typeof req.body?.notes === 'string'
      ? req.body.notes.slice(0, 500)
      : '';

    // Use $addToSet with a match on activityId to avoid duplicate entries.
    // If a document for this user doesn't exist yet, upsert creates it.
    // Because $addToSet compares entire sub-documents we first pull any
    // existing entry for this activityId, then push the new one.
    const result = await ActivityFavorites.findOneAndUpdate(
      { userId },
      {
        $pull: { favorites: { activityId } },
      },
      { upsert: true, new: false }
    );

    // Now push the (re-)added favorite
    const updated = await ActivityFavorites.findOneAndUpdate(
      { userId },
      {
        $push: {
          favorites: {
            activityId,
            savedAt: new Date(),
            notes,
          },
        },
      },
      { upsert: true, new: true }
    );

    res.json({
      success:   true,
      favorites: updated.favorites,
      message:   'Activity added to favorites',
    });
  } catch (err) {
    logger.error('[activity-favorites] POST error', { message: err.message });
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// ── DELETE /api/activity-favorites/:activityId ────────────────────────────────

router.delete('/:activityId', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { activityId } = req.params;
    if (!isValidActivityId(activityId)) {
      return res.status(400).json({ error: 'Invalid activityId' });
    }

    const updated = await ActivityFavorites.findOneAndUpdate(
      { userId },
      { $pull: { favorites: { activityId } } },
      { new: true }
    );

    res.json({
      success:   true,
      favorites: updated?.favorites || [],
      message:   'Activity removed from favorites',
    });
  } catch (err) {
    logger.error('[activity-favorites] DELETE error', { message: err.message });
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

module.exports = router;
