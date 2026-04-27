'use strict';

/**
 * clientActivities.js — Client-specific activity selection routes.
 *
 * All routes require:
 *  - a valid JWT (`authenticateJWT`)
 *  - a Practitioner, Practice, or Enterprise subscription (`requirePractitionerTier`)
 *  - ownership of the target client profile (enforced by `verifyClientOwnership`)
 *
 * Endpoints (all prefixed with /api/clinical/clients/:id):
 *
 *   GET  /recommended-activities             — Smart recommendations based on client profile
 *   GET  /activity-favorites                 — List favourited activities
 *   POST /activity-favorites                 — Add activity to favourites
 *   DELETE /activity-favorites/:activityId   — Remove activity from favourites
 *   GET  /activity-history                   — List activity usage history
 *   POST /activity-history                   — Record activity usage
 *   PATCH /activity-history/:historyId       — Update rating / notes on a history entry
 *   GET  /activity-stats                     — Aggregated usage statistics
 */

const express   = require('express');
const mongoose  = require('mongoose');
const rateLimit = require('express-rate-limit');

const { authenticateJWT, requirePractitionerTier } = require('../../middleware/auth');
const ClientProfile            = require('../../models/ClientProfile');
const ClientActivityFavorites  = require('../../models/ClientActivityFavorites');
const ClientActivityHistory    = require('../../models/ClientActivityHistory');
const { getRecommendedActivities } = require('../../utils/activityRecommendations');
const logger = require('../../utils/logger');

const router = express.Router({ mergeParams: true });

// ── Rate limiter ──────────────────────────────────────────────────────────────

const activitiesLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             120,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveUserId(req) {
  return req.user && (req.user.userId || req.user.sub);
}

/**
 * Validate an activityId: alphanumeric, hyphens, underscores (1–128 chars).
 */
function isValidActivityId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(id);
}

/**
 * Parse a non-negative integer from a string; fall back to `defaultVal`.
 */
function parsePositiveInt(value, defaultVal) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : defaultVal;
}

// ── Middleware: verify client ownership ──────────────────────────────────────

/**
 * Ensures the authenticated practitioner owns the client profile identified
 * by :id.  Attaches the raw client doc to `req.clientDoc` on success.
 */
async function verifyClientOwnership(req, res, next) {
  try {
    const clientId       = req.params.id;
    const practitionerId = resolveUserId(req);

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID.' });
    }

    const client = await ClientProfile.findById(clientId).lean();
    if (!client || client.practitionerId !== practitionerId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    req.clientDoc = client;
    next();
  } catch (err) {
    logger.error('[clinical/client-activities] verifyClientOwnership error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

// Shared middleware chain applied to every route in this file.
const COMMON = [
  activitiesLimiter,
  authenticateJWT,
  requirePractitionerTier,
  verifyClientOwnership,
];

// ── GET /recommended-activities ───────────────────────────────────────────────

/**
 * Build a minimal ClientProfile-compatible object from a Mongoose doc so that
 * the recommendation algorithm can consume it without DB-format knowledge.
 */
function buildClientProfileForAlgo(doc) {
  // Calculate age in years from dateOfBirth.
  let age = 0;
  if (doc.dateOfBirth) {
    const dob = doc.dateOfBirth instanceof Date ? doc.dateOfBirth : new Date(doc.dateOfBirth);
    age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }

  // Map clinicalGoals to the format expected by the algorithm.
  const goals = (doc.clinicalGoals || []).map(g => ({
    category: g.goal || '',
    priority: g.priority === 'high' ? 3 : g.priority === 'low' ? 1 : 2,
  }));

  return {
    id:                  doc._id.toString(),
    age,
    goals,
    sensory_preferences: doc.sensoryPreferences || [],
    diagnosis_tags:      doc.diagnosisTags      || [],
  };
}

router.get(
  '/recommended-activities',
  ...COMMON,
  async (req, res) => {
    try {
      const clientId       = req.params.id;
      const practitionerId = resolveUserId(req);

      const rawLimit = parsePositiveInt(req.query.limit, 20);
      const limit    = Math.min(rawLimit, 100);
      const category = typeof req.query.category === 'string' ? req.query.category.trim() : null;
      const excludeRecentlyUsed = req.query.exclude_used === 'true';

      // Fetch favourites and history concurrently.
      const [favDoc, historyDocs] = await Promise.all([
        ClientActivityFavorites.findOne({ practitionerId, clientProfileId: clientId }).lean(),
        ClientActivityHistory.find({ practitionerId, clientProfileId: clientId })
          .sort({ usedAt: -1 })
          .limit(500)
          .lean(),
      ]);

      const favorites = (favDoc?.favorites || []).map(f => f.activityId);
      const history   = historyDocs.map(h => ({
        activity_id:          h.activityId,
        effectiveness_rating: h.effectivenessRating,
        used_at:              h.usedAt ? h.usedAt.toISOString() : new Date().toISOString(),
      }));

      // The IATLAS catalog is stored in-process as a JSON data file.
      // We load it lazily here so that the module doesn't fail to initialise
      // when the file is absent in test environments.
      let catalog = [];
      try {
        // eslint-disable-next-line global-require
        catalog = require('../../data/iatlasCatalog.json');
      } catch {
        // Catalog not available — return empty recommendations gracefully.
        catalog = [];
      }

      const clientProfile = buildClientProfileForAlgo(req.clientDoc);
      const recommendations = getRecommendedActivities(
        catalog,
        clientProfile,
        favorites,
        history,
        { limit, category: category || null, excludeRecentlyUsed }
      );

      return res.json({
        recommendations,
        count: recommendations.length,
        client_id: clientId,
      });
    } catch (err) {
      logger.error('[clinical/client-activities] GET recommended-activities error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ── GET /activity-favorites ───────────────────────────────────────────────────

router.get(
  '/activity-favorites',
  ...COMMON,
  async (req, res) => {
    try {
      const clientId       = req.params.id;
      const practitionerId = resolveUserId(req);

      const doc = await ClientActivityFavorites.findOne({
        practitionerId,
        clientProfileId: clientId,
      }).lean();

      return res.json({
        favorites: doc?.favorites || [],
        count:     doc?.favorites?.length || 0,
        client_id: clientId,
      });
    } catch (err) {
      logger.error('[clinical/client-activities] GET activity-favorites error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ── POST /activity-favorites ──────────────────────────────────────────────────

router.post(
  '/activity-favorites',
  ...COMMON,
  async (req, res) => {
    try {
      const clientId       = req.params.id;
      const practitionerId = resolveUserId(req);

      const { activity_id, notes } = req.body || {};

      if (!isValidActivityId(activity_id)) {
        return res.status(400).json({ error: 'activity_id is required and must be a valid alphanumeric identifier.' });
      }

      const safeNotes = typeof notes === 'string' ? notes.slice(0, 500) : '';

      // Atomic upsert: de-duplicate then append the new favourite entry.
      const updated = await ClientActivityFavorites.findOneAndUpdate(
        { practitionerId, clientProfileId: clientId },
        [
          {
            $set: {
              favorites: {
                $concatArrays: [
                  {
                    $filter: {
                      input: { $ifNull: ['$favorites', []] },
                      cond:  { $ne: ['$$this.activityId', activity_id] },
                    },
                  },
                  [{ activityId: activity_id, addedAt: new Date(), notes: safeNotes }],
                ],
              },
            },
          },
        ],
        { upsert: true, new: true }
      );

      logger.info(
        `[clinical/client-activities] Added favourite ${activity_id} for client ${clientId}`
      );
      return res.json({
        success:   true,
        favorites: updated.favorites,
        count:     updated.favorites.length,
        client_id: clientId,
      });
    } catch (err) {
      logger.error('[clinical/client-activities] POST activity-favorites error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ── DELETE /activity-favorites/:activityId ────────────────────────────────────

router.delete(
  '/activity-favorites/:activityId',
  ...COMMON,
  async (req, res) => {
    try {
      const clientId       = req.params.id;
      const practitionerId = resolveUserId(req);
      const { activityId } = req.params;

      if (!isValidActivityId(activityId)) {
        return res.status(400).json({ error: 'Invalid activityId.' });
      }

      const updated = await ClientActivityFavorites.findOneAndUpdate(
        { practitionerId, clientProfileId: clientId },
        { $pull: { favorites: { activityId } } },
        { new: true }
      );

      logger.info(
        `[clinical/client-activities] Removed favourite ${activityId} for client ${clientId}`
      );
      return res.json({
        success:   true,
        favorites: updated?.favorites || [],
        count:     updated?.favorites?.length || 0,
        client_id: clientId,
      });
    } catch (err) {
      logger.error('[clinical/client-activities] DELETE activity-favorites error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ── GET /activity-history ─────────────────────────────────────────────────────

router.get(
  '/activity-history',
  ...COMMON,
  async (req, res) => {
    try {
      const clientId       = req.params.id;
      const practitionerId = resolveUserId(req);

      const rawLimit = parsePositiveInt(req.query.limit, 50);
      const limit    = Math.min(rawLimit, 200);
      const { session_note_id } = req.query;

      const filter = { practitionerId, clientProfileId: clientId };
      if (session_note_id && mongoose.Types.ObjectId.isValid(session_note_id)) {
        filter.sessionNoteId = session_note_id;
      }

      const history = await ClientActivityHistory.find(filter)
        .sort({ usedAt: -1 })
        .limit(limit)
        .lean();

      return res.json({
        history,
        count:     history.length,
        client_id: clientId,
      });
    } catch (err) {
      logger.error('[clinical/client-activities] GET activity-history error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ── POST /activity-history ────────────────────────────────────────────────────

router.post(
  '/activity-history',
  ...COMMON,
  async (req, res) => {
    try {
      const clientId       = req.params.id;
      const practitionerId = resolveUserId(req);

      const {
        activity_id,
        session_note_id,
        effectiveness_rating,
        notes,
      } = req.body || {};

      if (!isValidActivityId(activity_id)) {
        return res.status(400).json({
          error: 'activity_id is required and must be a valid alphanumeric identifier.',
        });
      }

      // Validate effectiveness_rating when provided.
      let rating = null;
      if (effectiveness_rating != null) {
        rating = parseInt(effectiveness_rating, 10);
        if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
          return res.status(400).json({ error: 'effectiveness_rating must be an integer 1–5.' });
        }
      }

      const entry = await ClientActivityHistory.create({
        practitionerId,
        clientProfileId:     clientId,
        activityId:          activity_id,
        sessionNoteId:       session_note_id && mongoose.Types.ObjectId.isValid(session_note_id)
                               ? session_note_id
                               : null,
        usedAt:              new Date(),
        effectivenessRating: rating,
        notes:               typeof notes === 'string' ? notes.slice(0, 2000) : '',
      });

      logger.info(
        `[clinical/client-activities] Recorded history ${entry._id} (activity: ${activity_id}) for client ${clientId}`
      );
      return res.status(201).json({ history_entry: entry });
    } catch (err) {
      logger.error('[clinical/client-activities] POST activity-history error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ── PATCH /activity-history/:historyId ────────────────────────────────────────

router.patch(
  '/activity-history/:historyId',
  ...COMMON,
  async (req, res) => {
    try {
      const clientId       = req.params.id;
      const practitionerId = resolveUserId(req);
      const { historyId }  = req.params;

      if (!mongoose.Types.ObjectId.isValid(historyId)) {
        return res.status(400).json({ error: 'Invalid historyId.' });
      }

      const entry = await ClientActivityHistory.findOne({
        _id:             historyId,
        practitionerId,
        clientProfileId: clientId,
      });

      if (!entry) {
        return res.status(404).json({ error: 'History entry not found.' });
      }

      const { effectiveness_rating, notes } = req.body || {};

      if (effectiveness_rating != null) {
        const rating = parseInt(effectiveness_rating, 10);
        if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
          return res.status(400).json({ error: 'effectiveness_rating must be an integer 1–5.' });
        }
        entry.effectivenessRating = rating;
      }

      if (typeof notes === 'string') {
        entry.notes = notes.slice(0, 2000);
      }

      await entry.save();

      return res.json({ history_entry: entry });
    } catch (err) {
      logger.error('[clinical/client-activities] PATCH activity-history error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ── GET /activity-stats ───────────────────────────────────────────────────────

router.get(
  '/activity-stats',
  ...COMMON,
  async (req, res) => {
    try {
      const clientId       = req.params.id;
      const practitionerId = resolveUserId(req);

      const history = await ClientActivityHistory.find({
        practitionerId,
        clientProfileId: clientId,
      }).lean();

      if (history.length === 0) {
        return res.json({
          total_unique_activities:       0,
          avg_effectiveness_rating:      null,
          most_frequently_used:          [],
          highest_rated:                 [],
          category_breakdown:            [],
          client_id: clientId,
        });
      }

      // ── Frequency map ───────────────────────────────────────────────────
      const freqMap = {};
      const ratingMap = {};

      for (const h of history) {
        const id = h.activityId;
        if (!freqMap[id]) {
          freqMap[id]  = 0;
          ratingMap[id] = [];
        }
        freqMap[id] += 1;
        if (h.effectivenessRating != null) {
          ratingMap[id].push(h.effectivenessRating);
        }
      }

      const uniqueIds = Object.keys(freqMap);

      // Most frequently used (top 10).
      const mostFreq = uniqueIds
        .sort((a, b) => freqMap[b] - freqMap[a])
        .slice(0, 10)
        .map(id => ({
          activity_id: id,
          usage_count: freqMap[id],
          avg_effectiveness_rating: ratingMap[id].length > 0
            ? ratingMap[id].reduce((s, v) => s + v, 0) / ratingMap[id].length
            : null,
        }));

      // Highest rated (top 10, must have at least one rating).
      const highestRated = uniqueIds
        .filter(id => ratingMap[id].length > 0)
        .map(id => {
          const avg = ratingMap[id].reduce((s, v) => s + v, 0) / ratingMap[id].length;
          return { activity_id: id, avg_effectiveness_rating: avg, usage_count: freqMap[id] };
        })
        .sort((a, b) => b.avg_effectiveness_rating - a.avg_effectiveness_rating)
        .slice(0, 10);

      // Overall average rating.
      const allRatings = history
        .map(h => h.effectivenessRating)
        .filter(r => r != null);
      const avgRating = allRatings.length > 0
        ? allRatings.reduce((s, v) => s + v, 0) / allRatings.length
        : null;

      return res.json({
        total_unique_activities:  uniqueIds.length,
        avg_effectiveness_rating: avgRating,
        most_frequently_used:     mostFreq,
        highest_rated:            highestRated,
        category_breakdown:       [], // requires catalog lookup — omitted for performance
        client_id: clientId,
      });
    } catch (err) {
      logger.error('[clinical/client-activities] GET activity-stats error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

module.exports = router;
