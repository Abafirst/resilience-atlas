'use strict';

/**
 * sessionPlans.js — IATLAS clinical session-plan CRUD routes.
 *
 * All routes require a valid JWT (authenticateJWT middleware).
 * Access is restricted to Practitioner, Practice, or Enterprise tiers.
 *
 * Endpoints:
 *   GET    /api/iatlas/clinical/session-plans                    — List plans for user
 *   POST   /api/iatlas/clinical/session-plans                    — Create new plan
 *   GET    /api/iatlas/clinical/session-plans/:sessionPlanId     — Get single plan
 *   PUT    /api/iatlas/clinical/session-plans/:sessionPlanId     — Update plan
 *   DELETE /api/iatlas/clinical/session-plans/:sessionPlanId     — Soft-delete (archive)
 */

const express   = require('express');
const router    = express.Router();
const mongoose  = require('mongoose');
const crypto    = require('crypto');
const rateLimit = require('express-rate-limit');

const { authenticateJWT } = require('../middleware/auth');
const SessionPlan          = require('../models/SessionPlan');
const logger               = require('../utils/logger');

// ── Rate limiter ──────────────────────────────────────────────────────────────

const plansLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max:      120,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

// ── Tier helpers ──────────────────────────────────────────────────────────────

const PROFESSIONAL_TIERS = new Set(['practitioner', 'practice', 'enterprise']);

async function getUserIATLASTier(userId) {
  try {
    const db = mongoose.connection.db;
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

async function requireProfessionalTier(req, res) {
  const userId = resolveUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated.' });
    return false;
  }
  const tier = await getUserIATLASTier(userId);
  if (!PROFESSIONAL_TIERS.has(tier)) {
    res.status(403).json({
      error:   'Practitioner tier required.',
      code:    'PROFESSIONAL_TIER_REQUIRED',
      upgrade: true,
    });
    return false;
  }
  return true;
}

// ── Misc helpers ──────────────────────────────────────────────────────────────

function resolveUserId(req) {
  return req.user && (req.user.userId || req.user.sub);
}

/**
 * Escape special regex characters from a user-supplied string so that it is
 * treated as a plain literal match inside a MongoDB $regex query.
 * This prevents ReDoS attacks from malicious input strings.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sanitisePlan(doc) {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  // eslint-disable-next-line no-unused-vars
  const { _id, __v, ...rest } = obj;
  return rest;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/iatlas/clinical/session-plans
// List all session plans for authenticated user (most recent first).
// Query params: clientIdentifier, dimensionalFocus, from, to, search
// ─────────────────────────────────────────────────────────────────────────────

router.get('/', plansLimiter, authenticateJWT, async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.status(401).json({ error: 'User not authenticated.' });

    const allowed = await requireProfessionalTier(req, res);
    if (!allowed) return;

    const { clientIdentifier, dimensionalFocus, from, to, search } = req.query;

    const filter = { userId: userId.toString(), archived: false };

    if (clientIdentifier) {
      filter.clientIdentifier = { $regex: escapeRegex(clientIdentifier), $options: 'i' };
    }
    if (dimensionalFocus) {
      filter.dimensionalFocus = dimensionalFocus;
    }
    if (from || to) {
      filter.sessionDate = {};
      if (from) filter.sessionDate.$gte = new Date(from);
      if (to)   filter.sessionDate.$lte = new Date(to);
    }
    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { clientIdentifier: { $regex: safeSearch, $options: 'i' } },
        { sessionNotes:     { $regex: safeSearch, $options: 'i' } },
        { clinicalNotes:    { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const plans = await SessionPlan.find(filter)
      .sort({ sessionDate: -1, createdAt: -1 })
      .lean();

    return res.json(plans.map(sanitisePlan));
  } catch (err) {
    logger.error('[sessionPlans] GET / error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/iatlas/clinical/session-plans — Create new session plan
// ─────────────────────────────────────────────────────────────────────────────

router.post('/', plansLimiter, authenticateJWT, async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.status(401).json({ error: 'User not authenticated.' });

    const allowed = await requireProfessionalTier(req, res);
    if (!allowed) return;

    const {
      clientIdentifier,
      sessionDate,
      sessionNumber,
      dimensionalFocus,
      sessionGoals,
      activitiesSelected,
      sessionNotes,
      dataCollected,
      progressTowardObjectives,
      generalizationObserved,
      homeworkAssigned,
      planForNextSession,
      clinicalNotes,
    } = req.body;

    if (!clientIdentifier || typeof clientIdentifier !== 'string' || !clientIdentifier.trim()) {
      return res.status(400).json({ error: 'clientIdentifier is required.' });
    }

    const plan = await SessionPlan.create({
      sessionPlanId:            crypto.randomUUID(),
      userId:                   userId.toString(),
      clientIdentifier:         clientIdentifier.trim(),
      sessionDate:              sessionDate        || null,
      sessionNumber:            sessionNumber      || null,
      dimensionalFocus:         dimensionalFocus   || '',
      sessionGoals:             Array.isArray(sessionGoals)             ? sessionGoals             : [],
      activitiesSelected:       Array.isArray(activitiesSelected)       ? activitiesSelected       : [],
      sessionNotes:             sessionNotes             || '',
      dataCollected:            Array.isArray(dataCollected)            ? dataCollected            : [],
      progressTowardObjectives: Array.isArray(progressTowardObjectives) ? progressTowardObjectives : [],
      generalizationObserved:   generalizationObserved   || '',
      homeworkAssigned:         Array.isArray(homeworkAssigned)         ? homeworkAssigned         : [],
      planForNextSession:       planForNextSession       || '',
      clinicalNotes:            clinicalNotes            || '',
    });

    logger.info(`[sessionPlans] Created plan ${plan.sessionPlanId} for user ${userId}`);
    return res.status(201).json(sanitisePlan(plan));
  } catch (err) {
    logger.error('[sessionPlans] POST / error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/iatlas/clinical/session-plans/:sessionPlanId — Get single plan
// ─────────────────────────────────────────────────────────────────────────────

router.get('/:sessionPlanId', plansLimiter, authenticateJWT, async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.status(401).json({ error: 'User not authenticated.' });

    const allowed = await requireProfessionalTier(req, res);
    if (!allowed) return;

    const { sessionPlanId } = req.params;
    const plan = await SessionPlan.findOne({
      sessionPlanId,
      userId:   userId.toString(),
      archived: false,
    }).lean();

    if (!plan) return res.status(404).json({ error: 'Session plan not found.' });

    return res.json(sanitisePlan(plan));
  } catch (err) {
    logger.error('[sessionPlans] GET /:sessionPlanId error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/iatlas/clinical/session-plans/:sessionPlanId — Update plan
// ─────────────────────────────────────────────────────────────────────────────

const UPDATABLE_FIELDS = [
  'clientIdentifier',
  'sessionDate',
  'sessionNumber',
  'dimensionalFocus',
  'sessionGoals',
  'activitiesSelected',
  'sessionNotes',
  'dataCollected',
  'progressTowardObjectives',
  'generalizationObserved',
  'homeworkAssigned',
  'planForNextSession',
  'clinicalNotes',
];

router.put('/:sessionPlanId', plansLimiter, authenticateJWT, async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.status(401).json({ error: 'User not authenticated.' });

    const allowed = await requireProfessionalTier(req, res);
    if (!allowed) return;

    const { sessionPlanId } = req.params;
    const plan = await SessionPlan.findOne({
      sessionPlanId,
      userId:   userId.toString(),
      archived: false,
    });

    if (!plan) return res.status(404).json({ error: 'Session plan not found.' });

    for (const field of UPDATABLE_FIELDS) {
      if (req.body[field] !== undefined) {
        if (field === 'clientIdentifier') {
          const val = req.body[field];
          if (typeof val !== 'string' || !val.trim()) {
            return res.status(400).json({ error: 'clientIdentifier must be a non-empty string.' });
          }
          plan[field] = val.trim();
        } else {
          plan[field] = req.body[field];
        }
      }
    }

    await plan.save();
    return res.json(sanitisePlan(plan));
  } catch (err) {
    logger.error('[sessionPlans] PUT /:sessionPlanId error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/iatlas/clinical/session-plans/:sessionPlanId — Soft-delete
// ─────────────────────────────────────────────────────────────────────────────

router.delete('/:sessionPlanId', plansLimiter, authenticateJWT, async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.status(401).json({ error: 'User not authenticated.' });

    const allowed = await requireProfessionalTier(req, res);
    if (!allowed) return;

    const { sessionPlanId } = req.params;
    const plan = await SessionPlan.findOne({
      sessionPlanId,
      userId:   userId.toString(),
      archived: false,
    });

    if (!plan) return res.status(404).json({ error: 'Session plan not found.' });

    plan.archived = true;
    await plan.save();

    logger.info(`[sessionPlans] Archived plan ${sessionPlanId} for user ${userId}`);
    return res.json({ message: 'Session plan archived successfully.', sessionPlanId });
  } catch (err) {
    logger.error('[sessionPlans] DELETE /:sessionPlanId error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
