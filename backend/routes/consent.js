'use strict';

/**
 * consent.js — User data-sharing consent management endpoints.
 *
 * All endpoints require JWT authentication.
 *
 * Endpoints:
 *   GET    /api/user/consent           — Get current consent settings
 *   POST   /api/user/consent           — Update consent preferences
 *   GET    /api/user/consent/history   — View consent change history
 *   PUT    /api/user/consent/default   — Update default (remembered) preferences
 *   POST   /api/user/consent/revoke/:type — Revoke a specific consent type
 */

const express   = require('express');
const rateLimit = require('express-rate-limit');
const mongoose  = require('mongoose');

const { authenticateJWT } = require('../middleware/auth');
const User            = require('../models/User');
const UserDataSharing = require('../models/UserDataSharing');
const logger          = require('../utils/logger');

const router = express.Router();

const consentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      60,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(consentLimiter);
router.use(authenticateJWT);

// ── Helpers ───────────────────────────────────────────────────────────────────

function getUserId(req) {
  const raw = req.user?.userId || req.user?.sub || req.user?.id || null;
  if (!raw) return null;
  // Auth0 subs are strings; Mongo ObjectIds are strings too
  if (mongoose.Types.ObjectId.isValid(raw)) return raw;
  // Fall back to string match used by other routes
  return raw;
}

/**
 * Resolve the user's Mongo _id (ObjectId) from the JWT subject.
 * Auth0 users store their sub in the userId field of the JWT payload.
 */
async function resolveMongoUser(req) {
  const raw = getUserId(req);
  if (!raw) return null;

  // If it already looks like a Mongo ObjectId, find directly
  if (mongoose.Types.ObjectId.isValid(raw)) {
    return User.findById(raw).lean();
  }
  // Otherwise find by Auth0 sub stored in the username or a dedicated field
  return User.findOne({ $or: [{ auth0Id: raw }, { username: raw }, { email: raw }] }).lean();
}

// ── GET /api/user/consent ─────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const user = await resolveMongoUser(req);
    if (!user) return res.status(401).json({ error: 'User not found.' });

    const orgId = user.organizationId || user.organization_id || null;

    // Return default preferences even without an org
    const defaults = user.defaultSharingConsent || { scores: false, curriculum: false };

    if (!orgId) {
      return res.json({
        organizationId: null,
        scoresEnabled: null,
        curriculumEnabled: null,
        defaults,
      });
    }

    const sharing = await UserDataSharing.findOne({
      userId: user._id,
      organizationId: orgId,
    }).lean();

    return res.json({
      organizationId: orgId,
      scoresEnabled:      sharing ? sharing.scoresEnabled      : null,
      scoresGoals:        sharing ? sharing.scoresGoals        : null,
      scoresConsentDate:  sharing ? sharing.scoresConsentDate  : null,
      scoresLastUpdated:  sharing ? sharing.scoresLastUpdated  : null,
      curriculumEnabled:      sharing ? sharing.curriculumEnabled      : null,
      curriculumGoals:        sharing ? sharing.curriculumGoals        : null,
      curriculumConsentDate:  sharing ? sharing.curriculumConsentDate  : null,
      curriculumLastUpdated:  sharing ? sharing.curriculumLastUpdated  : null,
      defaults,
    });
  } catch (err) {
    logger.error('[consent] GET / error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/user/consent ────────────────────────────────────────────────────

/**
 * Update consent preferences.
 *
 * Body:
 * {
 *   scores:           boolean | null,
 *   scoresGoals:      string (optional),
 *   curriculum:       boolean | null,
 *   curriculumGoals:  string (optional),
 *   rememberDefault:  boolean (optional) — persist as default for future assessments
 *   context:          string (optional) — e.g. 'assessment_submission'
 * }
 */
router.post('/', async (req, res) => {
  try {
    const user = await resolveMongoUser(req);
    if (!user) return res.status(401).json({ error: 'User not found.' });

    const orgId = user.organizationId || user.organization_id || null;
    if (!orgId) {
      return res.status(400).json({ error: 'You are not a member of any organization.' });
    }

    const {
      scores,
      scoresGoals,
      curriculum,
      curriculumGoals,
      rememberDefault = false,
      context = 'settings_change',
    } = req.body;

    const now = new Date();
    const historyEntries = [];
    const updateFields = { updatedAt: now };

    // ── Scores consent ──────────────────────────────────────────────────────
    if (typeof scores === 'boolean') {
      updateFields.scoresEnabled     = scores;
      updateFields.scoresLastUpdated = now;
      if (scores) {
        updateFields.scoresConsentDate = now;
        updateFields.scoresGoals       = typeof scoresGoals === 'string'
          ? scoresGoals.trim().slice(0, 500) : null;
      }
      historyEntries.push({
        type:    'scores',
        action:  scores ? 'granted' : 'revoked',
        date:    now,
        goals:   scores && typeof scoresGoals === 'string' ? scoresGoals.trim().slice(0, 500) : null,
        context,
      });
    }

    // ── Curriculum consent ──────────────────────────────────────────────────
    if (typeof curriculum === 'boolean') {
      updateFields.curriculumEnabled     = curriculum;
      updateFields.curriculumLastUpdated = now;
      if (curriculum) {
        updateFields.curriculumConsentDate = now;
        updateFields.curriculumGoals       = typeof curriculumGoals === 'string'
          ? curriculumGoals.trim().slice(0, 500) : null;
      }
      historyEntries.push({
        type:    'curriculum',
        action:  curriculum ? 'granted' : 'revoked',
        date:    now,
        goals:   curriculum && typeof curriculumGoals === 'string' ? curriculumGoals.trim().slice(0, 500) : null,
        context,
      });
    }

    const sharing = await UserDataSharing.findOneAndUpdate(
      { userId: user._id, organizationId: orgId },
      {
        $set:  updateFields,
        $push: historyEntries.length > 0
          ? { history: { $each: historyEntries } }
          : undefined,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // ── Update user's default preferences if requested ────────────────────
    if (rememberDefault) {
      const defaultUpdate = {};
      if (typeof scores === 'boolean')     defaultUpdate['defaultSharingConsent.scores']     = scores;
      if (typeof curriculum === 'boolean') defaultUpdate['defaultSharingConsent.curriculum'] = curriculum;

      if (Object.keys(defaultUpdate).length > 0) {
        await User.findByIdAndUpdate(user._id, { $set: defaultUpdate });
      }
    }

    // ── Append to User.consentHistory ────────────────────────────────────
    if (historyEntries.length > 0) {
      await User.findByIdAndUpdate(user._id, {
        $push: { consentHistory: { $each: historyEntries } },
      });
    }

    logger.info('[consent] Updated consent for user', { userId: user._id, scores, curriculum });

    return res.json({
      success: true,
      scoresEnabled:      sharing.scoresEnabled,
      curriculumEnabled:  sharing.curriculumEnabled,
    });
  } catch (err) {
    logger.error('[consent] POST / error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/user/consent/history ─────────────────────────────────────────────

router.get('/history', async (req, res) => {
  try {
    const user = await resolveMongoUser(req);
    if (!user) return res.status(401).json({ error: 'User not found.' });

    const orgId = user.organizationId || user.organization_id || null;
    let orgHistory = [];

    if (orgId) {
      const sharing = await UserDataSharing.findOne(
        { userId: user._id, organizationId: orgId },
        { history: 1 }
      ).lean();
      orgHistory = sharing?.history || [];
    }

    // Also return User-level history (cross-org) from the user document
    const userHistory = (user.consentHistory || []).slice().reverse();

    return res.json({ history: orgHistory, userHistory });
  } catch (err) {
    logger.error('[consent] GET /history error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── PUT /api/user/consent/default ─────────────────────────────────────────────

router.put('/default', async (req, res) => {
  try {
    const user = await resolveMongoUser(req);
    if (!user) return res.status(401).json({ error: 'User not found.' });

    const { scores, curriculum } = req.body;
    const update = {};
    if (typeof scores === 'boolean')     update['defaultSharingConsent.scores']     = scores;
    if (typeof curriculum === 'boolean') update['defaultSharingConsent.curriculum'] = curriculum;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'Provide at least one of: scores, curriculum.' });
    }

    await User.findByIdAndUpdate(user._id, { $set: update });

    return res.json({ success: true, defaults: { scores, curriculum } });
  } catch (err) {
    logger.error('[consent] PUT /default error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/user/consent/revoke/:type ───────────────────────────────────────

router.post('/revoke/:type', async (req, res) => {
  try {
    const { type } = req.params;
    if (!['scores', 'curriculum'].includes(type)) {
      return res.status(400).json({ error: 'type must be "scores" or "curriculum".' });
    }

    const user = await resolveMongoUser(req);
    if (!user) return res.status(401).json({ error: 'User not found.' });

    const orgId = user.organizationId || user.organization_id || null;
    if (!orgId) {
      return res.status(400).json({ error: 'You are not a member of any organization.' });
    }

    const now     = new Date();
    const field   = type === 'scores' ? 'scoresEnabled' : 'curriculumEnabled';
    const lastUpd = type === 'scores' ? 'scoresLastUpdated' : 'curriculumLastUpdated';

    const historyEntry = { type, action: 'revoked', date: now, context: 'settings_change' };

    await UserDataSharing.findOneAndUpdate(
      { userId: user._id, organizationId: orgId },
      {
        $set:  { [field]: false, [lastUpd]: now, updatedAt: now },
        $push: { history: historyEntry },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await User.findByIdAndUpdate(user._id, {
      $push: { consentHistory: historyEntry },
    });

    logger.info('[consent] Revoked', { userId: user._id, type });

    return res.json({ success: true, type, action: 'revoked' });
  } catch (err) {
    logger.error('[consent] POST /revoke/:type error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
