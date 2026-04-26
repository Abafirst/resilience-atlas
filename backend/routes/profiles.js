'use strict';

/**
 * profiles.js — IATLAS child-profile CRUD routes.
 *
 * All routes require a valid JWT (authenticateJWT middleware).
 * Tier enforcement is done server-side using the iatlas_subscriptions collection.
 *
 * Endpoints:
 *   POST   /api/iatlas/profiles                         — Create child profile
 *   GET    /api/iatlas/profiles                         — List all profiles for user
 *   PUT    /api/iatlas/profiles/:profileId              — Update profile (name/avatar/ageGroup)
 *   DELETE /api/iatlas/profiles/:profileId              — Archive profile (soft delete)
 *   GET    /api/iatlas/profiles/:profileId/progress     — Get profile progress
 *   PUT    /api/iatlas/profiles/:profileId/progress     — Upsert / merge profile progress
 */

const express   = require('express');
const router    = express.Router();
const mongoose  = require('mongoose');
const crypto    = require('crypto');
const rateLimit = require('express-rate-limit');

const { authenticateJWT } = require('../middleware/auth');
const ChildProfile         = require('../models/ChildProfile');
const logger               = require('../utils/logger');

// ── Rate limiter ──────────────────────────────────────────────────────────────

const profilesLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max:      60,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

// ── Tier helpers ──────────────────────────────────────────────────────────────

/**
 * Resolve the user's current IATLAS tier from the iatlas_subscriptions collection.
 * Falls back to 'free' when no active subscription is found.
 */
async function getUserIATLASTier(userId) {
  try {
    const db  = mongoose.connection.db;
    if (!db) return 'free';
    const sub = await db.collection('iatlas_subscriptions').findOne({
      userId: userId.toString(),
      status: { $in: ['active', 'trialing'] },
    });
    return sub?.tier || 'free';
  } catch {
    return 'free';
  }
}

/**
 * Return the maximum number of child profiles allowed for a given tier.
 * Individual tier = 1 profile; Family and above = 5 profiles.
 */
function getMaxProfiles(tier) {
  const TIER_LIMITS = {
    free:         0,
    individual:   1,
    family:       5,
    complete:     5,
    practitioner: 5,
    practice:     5,
    enterprise:   5,
  };
  return TIER_LIMITS[tier] ?? 0;
}

// ── Middleware: resolve userId from JWT ───────────────────────────────────────

function resolveUserId(req) {
  return req.user && (req.user.userId || req.user.sub);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/iatlas/profiles — Create child profile
// Body: { name, ageGroup?, avatar?, dateOfBirth?, gender?, clinical?, preferences? }
// ─────────────────────────────────────────────────────────────────────────────

const VALID_AGE_GROUPS   = ['5-7', '8-10', '11-14', '15-18'];
const VALID_GENDERS      = ['male', 'female', 'non-binary', 'prefer-not-to-say', ''];
const VALID_SUPPORT_LVLS = ['low', 'moderate', 'high', 'intensive', ''];

/**
 * Sanitise the optional clinical sub-object from the request body.
 * Returns undefined when nothing useful was provided.
 */
function sanitiseClinical(raw) {
  if (!raw || typeof raw !== 'object') return undefined;
  const out = {};
  if (Array.isArray(raw.diagnoses))  out.diagnoses  = raw.diagnoses.map(String).slice(0, 20);
  if (Array.isArray(raw.goals))      out.goals      = raw.goals.map(String).slice(0, 20);
  if (typeof raw.strengths   === 'string') out.strengths   = raw.strengths.slice(0, 500);
  if (typeof raw.challenges  === 'string') out.challenges  = raw.challenges.slice(0, 500);
  if (VALID_SUPPORT_LVLS.includes(raw.supportLevel)) out.supportLevel = raw.supportLevel;
  return Object.keys(out).length ? out : undefined;
}

/**
 * Sanitise the optional preferences sub-object from the request body.
 */
function sanitisePreferences(raw) {
  if (!raw || typeof raw !== 'object') return undefined;
  const out = {};
  if (Array.isArray(raw.activities)) out.activities = raw.activities.map(String).slice(0, 20);
  if (typeof raw.sensoryPreferences  === 'string') out.sensoryPreferences  = raw.sensoryPreferences.slice(0, 500);
  if (typeof raw.communicationStyle  === 'string') out.communicationStyle  = raw.communicationStyle.slice(0, 500);
  if (typeof raw.learningPreferences === 'string') out.learningPreferences = raw.learningPreferences.slice(0, 500);
  return Object.keys(out).length ? out : undefined;
}

router.post('/', profilesLimiter, authenticateJWT, async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const { name, ageGroup, avatar, dateOfBirth, gender, clinical, preferences } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Profile name is required.' });
    }

    if (ageGroup && !VALID_AGE_GROUPS.includes(ageGroup)) {
      return res.status(400).json({ error: 'Invalid age group.' });
    }

    if (gender !== undefined && !VALID_GENDERS.includes(gender)) {
      return res.status(400).json({ error: 'Invalid gender value.' });
    }

    let parsedDOB;
    if (dateOfBirth) {
      parsedDOB = new Date(dateOfBirth);
      if (isNaN(parsedDOB.getTime())) {
        return res.status(400).json({ error: 'Invalid date of birth.' });
      }
    }

    // Tier enforcement
    const tier       = await getUserIATLASTier(userId);
    const maxAllowed = getMaxProfiles(tier);

    if (maxAllowed === 0) {
      return res.status(403).json({
        error:   'IATLAS subscription required.',
        code:    'NO_IATLAS_ACCESS',
        upgrade: true,
      });
    }

    const existing = await ChildProfile.countDocuments({
      userId:   userId.toString(),
      archived: false,
    });

    if (existing >= maxAllowed) {
      return res.status(403).json({
        error:     `Profile limit reached. Your ${tier} plan allows up to ${maxAllowed} child profile(s).`,
        code:      'PROFILE_LIMIT_REACHED',
        tier,
        maxProfiles: maxAllowed,
        current:     existing,
        upgrade:     tier === 'individual',
      });
    }

    const profileData = {
      profileId:   crypto.randomUUID(),
      userId:      userId.toString(),
      name:        name.trim(),
      ageGroup:    ageGroup  || null,
      avatar:      avatar    || '🧒',
      gender:      gender    || '',
      progress:    {},
      archived:    false,
    };

    if (parsedDOB)                     profileData.dateOfBirth  = parsedDOB;
    const clinicalData    = sanitiseClinical(clinical);
    const preferencesData = sanitisePreferences(preferences);
    if (clinicalData)                  profileData.clinical     = clinicalData;
    if (preferencesData)               profileData.preferences  = preferencesData;

    const profile = await ChildProfile.create(profileData);

    logger.info(`[profiles] Created profile ${profile.profileId} for user ${userId}`);
    return res.status(201).json(sanitiseProfile(profile));
  } catch (err) {
    logger.error('[profiles] POST / error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/iatlas/profiles — List profiles for authenticated user
// ─────────────────────────────────────────────────────────────────────────────

router.get('/', profilesLimiter, authenticateJWT, async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const profiles = await ChildProfile.find({
      userId:   userId.toString(),
      archived: false,
    }).lean();

    return res.json(profiles.map(sanitiseProfile));
  } catch (err) {
    logger.error('[profiles] GET / error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/iatlas/profiles/:profileId — Update name / avatar / ageGroup / clinical / preferences
// Body: { name?, avatar?, ageGroup?, dateOfBirth?, gender?, clinical?, preferences? }
// ─────────────────────────────────────────────────────────────────────────────

router.put('/:profileId', profilesLimiter, authenticateJWT, async (req, res) => {
  try {
    const userId    = resolveUserId(req);
    const { profileId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const profile = await ChildProfile.findOne({
      profileId,
      userId:   userId.toString(),
      archived: false,
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    const { name, avatar, ageGroup, dateOfBirth, gender, clinical, preferences } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Profile name must be a non-empty string.' });
      }
      profile.name = name.trim();
    }
    if (avatar   !== undefined) profile.avatar   = avatar;
    if (ageGroup !== undefined) {
      if (ageGroup && !VALID_AGE_GROUPS.includes(ageGroup)) {
        return res.status(400).json({ error: 'Invalid age group.' });
      }
      profile.ageGroup = ageGroup || null;
    }
    if (gender !== undefined) {
      if (!VALID_GENDERS.includes(gender)) {
        return res.status(400).json({ error: 'Invalid gender value.' });
      }
      profile.gender = gender;
    }
    if (dateOfBirth !== undefined) {
      if (dateOfBirth === null || dateOfBirth === '') {
        profile.dateOfBirth = undefined;
      } else {
        const parsed = new Date(dateOfBirth);
        if (isNaN(parsed.getTime())) {
          return res.status(400).json({ error: 'Invalid date of birth.' });
        }
        profile.dateOfBirth = parsed;
      }
    }
    if (clinical !== undefined) {
      const sanitised = sanitiseClinical(clinical);
      profile.clinical = sanitised || {};
      profile.markModified('clinical');
    }
    if (preferences !== undefined) {
      const sanitised = sanitisePreferences(preferences);
      profile.preferences = sanitised || {};
      profile.markModified('preferences');
    }

    await profile.save();
    return res.json(sanitiseProfile(profile));
  } catch (err) {
    logger.error('[profiles] PUT /:profileId error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/iatlas/profiles/:profileId — Soft-delete (archive) a profile
// ─────────────────────────────────────────────────────────────────────────────

router.delete('/:profileId', profilesLimiter, authenticateJWT, async (req, res) => {
  try {
    const userId    = resolveUserId(req);
    const { profileId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const profile = await ChildProfile.findOne({
      profileId,
      userId:   userId.toString(),
      archived: false,
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    profile.archived = true;
    await profile.save();

    logger.info(`[profiles] Archived profile ${profileId} for user ${userId}`);
    return res.json({ message: 'Profile archived successfully.', profileId });
  } catch (err) {
    logger.error('[profiles] DELETE /:profileId error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/iatlas/profiles/:profileId/progress — Get progress data
// ─────────────────────────────────────────────────────────────────────────────

router.get('/:profileId/progress', profilesLimiter, authenticateJWT, async (req, res) => {
  try {
    const userId    = resolveUserId(req);
    const { profileId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const profile = await ChildProfile.findOne({
      profileId,
      userId:   userId.toString(),
      archived: false,
    }).lean();

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    return res.json(profile.progress || {});
  } catch (err) {
    logger.error('[profiles] GET /:profileId/progress error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/iatlas/profiles/:profileId/progress — Upsert / merge progress data
// Body: { dimensions?, totalXP?, level?, badges?, streaks?, completedActivities? }
// ─────────────────────────────────────────────────────────────────────────────

router.put('/:profileId/progress', profilesLimiter, authenticateJWT, async (req, res) => {
  try {
    const userId    = resolveUserId(req);
    const { profileId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const profile = await ChildProfile.findOne({
      profileId,
      userId:   userId.toString(),
      archived: false,
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    const {
      dimensions,
      totalXP,
      level,
      badges,
      streaks,
      completedActivities,
    } = req.body;

    // Merge incoming fields into existing progress object.
    const current = profile.progress || {};

    const updated = {
      dimensions:          dimensions          ?? current.dimensions          ?? {},
      totalXP:             totalXP             ?? current.totalXP             ?? 0,
      level:               level               ?? current.level               ?? 1,
      badges:              badges              ?? current.badges              ?? [],
      streaks:             streaks             ?? current.streaks             ?? {},
      completedActivities: completedActivities ?? current.completedActivities ?? {},
    };

    profile.progress = updated;
    // Force Mongoose to detect the nested object change.
    profile.markModified('progress');
    await profile.save();

    return res.json(profile.progress);
  } catch (err) {
    logger.error('[profiles] PUT /:profileId/progress error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: strip internal MongoDB fields from the response
// ─────────────────────────────────────────────────────────────────────────────

function sanitiseProfile(doc) {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  // eslint-disable-next-line no-unused-vars
  const { _id, __v, ...rest } = obj;
  return rest;
}

module.exports = router;
