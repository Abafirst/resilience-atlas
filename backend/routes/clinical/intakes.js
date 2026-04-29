'use strict';

/**
 * intakes.js — IATLAS clinical intake assessment CRUD routes.
 *
 * All routes require a valid JWT (authenticateJWT) and that the user holds
 * a Practitioner, Practice, or Enterprise subscription tier.
 *
 * Endpoints:
 *   POST   /api/iatlas/clinical/intakes          — Create new intake
 *   GET    /api/iatlas/clinical/intakes          — List intakes (paginated)
 *   GET    /api/iatlas/clinical/intakes/:id      — Get single intake
 *   PUT    /api/iatlas/clinical/intakes/:id      — Update intake
 *   DELETE /api/iatlas/clinical/intakes/:id      — Archive intake (soft delete)
 */

const express   = require('express');
const mongoose  = require('mongoose');
const rateLimit = require('express-rate-limit');

const { authenticateJWT, requirePractitionerTier } = require('../../middleware/auth');
const ClinicalIntake = require('../../models/ClinicalIntake');
const logger         = require('../../utils/logger');

const router = express.Router();

// ── Rate limiter ──────────────────────────────────────────────────────────────

const intakesLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max:      120,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

// ── Constants ─────────────────────────────────────────────────────────────────

const VALID_DIMENSIONS = [
  'agentic-generative',
  'somatic-regulative',
  'cognitive-narrative',
  'relational-connective',
  'emotional-adaptive',
  'spiritual-existential',
];

const VALID_SUPPORT_VALUES = new Set(['yes', 'no', 'partial', '']);

const VALID_STRESSORS = new Set([
  'work', 'relationships', 'health', 'finances', 'family',
  'school', 'other',
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveUserId(req) {
  return req.user && (req.user.userId || req.user.sub);
}

/**
 * Escape special regex characters to prevent ReDoS attacks.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitise a ClinicalIntake document for API response.
 */
function sanitiseIntake(doc) {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  // eslint-disable-next-line no-unused-vars
  const { __v, ...rest } = obj;
  return rest;
}

/**
 * Validate dimension ratings object.  Returns error string or null.
 */
function validateDimensionRatings(ratings) {
  if (!ratings || typeof ratings !== 'object') return null; // optional
  for (const dim of Object.keys(ratings)) {
    if (!VALID_DIMENSIONS.includes(dim)) {
      return `Invalid dimension key: ${dim}`;
    }
    const val = ratings[dim];
    if (val !== null && val !== undefined) {
      if (typeof val !== 'number' || !Number.isInteger(val) || val < 1 || val > 10) {
        return `Dimension rating for "${dim}" must be an integer 1–10.`;
      }
    }
  }
  return null;
}

/**
 * Validate support system object.  Returns error string or null.
 */
function validateSupportSystem(system) {
  if (!system || typeof system !== 'object') return null;
  const allowed = ['family', 'friends', 'professional', 'community'];
  for (const key of Object.keys(system)) {
    if (!allowed.includes(key)) return `Invalid support system key: ${key}`;
    if (!VALID_SUPPORT_VALUES.has(system[key])) {
      return `Support system value for "${key}" must be "yes", "no", or "partial".`;
    }
  }
  return null;
}

// ── Middleware: verify intake ownership ───────────────────────────────────────

async function verifyIntakeOwnership(req, res, next) {
  try {
    const intakeId      = req.params.id;
    const practitionerId = resolveUserId(req);

    if (!mongoose.Types.ObjectId.isValid(intakeId)) {
      return res.status(400).json({ error: 'Invalid intake ID.' });
    }

    const intake = await ClinicalIntake.findById(intakeId).lean();

    if (!intake || intake.practitionerId !== practitionerId) {
      return res.status(404).json({ error: 'Intake not found.' });
    }

    if (intake.archived) {
      return res.status(404).json({ error: 'Intake not found.' });
    }

    req.intakeDoc = intake;
    next();
  } catch (err) {
    logger.error('[clinical/intakes] verifyIntakeOwnership error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/iatlas/clinical/intakes — Create new intake
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  '/',
  intakesLimiter,
  authenticateJWT,
  requirePractitionerTier,
  async (req, res) => {
    try {
      const practitionerId = resolveUserId(req);

      const {
        clientIdentifier,
        clientProfileId,
        dateOfBirth,
        pronouns,
        guardianContact,
        dimensionRatings,
        currentStressors,
        supportSystem,
        therapyGoals,
        additionalNotes,
      } = req.body;

      // ── Validation ────────────────────────────────────────────────────────

      if (!clientIdentifier || typeof clientIdentifier !== 'string' || !clientIdentifier.trim()) {
        return res.status(400).json({ error: 'clientIdentifier is required.' });
      }
      const trimmedId = clientIdentifier.trim();
      if (trimmedId.length < 2 || trimmedId.length > 128) {
        return res.status(400).json({ error: 'clientIdentifier must be 2–128 characters.' });
      }

      if (dateOfBirth) {
        const dob = new Date(dateOfBirth);
        if (isNaN(dob.getTime())) {
          return res.status(400).json({ error: 'dateOfBirth is not a valid date.' });
        }
        if (dob >= new Date()) {
          return res.status(400).json({ error: 'dateOfBirth must be in the past.' });
        }
        if (dob <= new Date('1900-01-01')) {
          return res.status(400).json({ error: 'dateOfBirth must be after 1900-01-01.' });
        }
      }

      const dimError = validateDimensionRatings(dimensionRatings);
      if (dimError) return res.status(400).json({ error: dimError });

      const sysError = validateSupportSystem(supportSystem);
      if (sysError) return res.status(400).json({ error: sysError });

      if (therapyGoals !== undefined && !Array.isArray(therapyGoals)) {
        return res.status(400).json({ error: 'therapyGoals must be an array.' });
      }
      if (Array.isArray(therapyGoals) && therapyGoals.length > 10) {
        return res.status(400).json({ error: 'therapyGoals must contain at most 10 items.' });
      }

      if (currentStressors !== undefined && !Array.isArray(currentStressors)) {
        return res.status(400).json({ error: 'currentStressors must be an array.' });
      }
      if (Array.isArray(currentStressors)) {
        const invalidStressors = currentStressors.filter(s => !VALID_STRESSORS.has(s));
        if (invalidStressors.length > 0) {
          return res.status(400).json({ error: `Invalid stressors: ${invalidStressors.join(', ')}` });
        }
      }

      // ── Create ────────────────────────────────────────────────────────────

      const intake = await ClinicalIntake.create({
        practitionerId,
        clientIdentifier: trimmedId,
        clientProfileId:  clientProfileId || null,
        dateOfBirth:      dateOfBirth ? new Date(dateOfBirth) : null,
        pronouns:         pronouns      || '',
        guardianContact:  guardianContact || {},
        dimensionRatings: dimensionRatings || {},
        currentStressors: currentStressors || [],
        supportSystem:    supportSystem || {},
        therapyGoals:     Array.isArray(therapyGoals) ? therapyGoals.map(g => g.trim()).filter(Boolean) : [],
        additionalNotes:  additionalNotes || '',
      });

      logger.info(`[clinical/intakes] Created intake ${intake._id} for practitioner ${practitionerId}`);
      return res.status(201).json(sanitiseIntake(intake));
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
      }
      logger.error('[clinical/intakes] POST / error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/iatlas/clinical/intakes — List intakes (paginated)
// Query params: clientIdentifier, page, limit, sort
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/',
  intakesLimiter,
  authenticateJWT,
  requirePractitionerTier,
  async (req, res) => {
    try {
      const practitionerId = resolveUserId(req);
      const {
        clientIdentifier,
        clientProfileId,
        sort  = 'created',
        page  = '1',
        limit = '20',
      } = req.query;

      // ── Build filter ──────────────────────────────────────────────────────

      const filter = { practitionerId, archived: false };

      if (clientIdentifier) {
        filter.clientIdentifier = new RegExp(escapeRegex(clientIdentifier), 'i');
      }

      if (clientProfileId) {
        filter.clientProfileId = clientProfileId;
      }

      // ── Pagination ────────────────────────────────────────────────────────

      const pageNum  = Math.max(1, parseInt(page, 10)  || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const skip     = (pageNum - 1) * limitNum;

      // ── Sort ──────────────────────────────────────────────────────────────

      let sortObj = { createdAt: -1 };
      if (sort === 'client') sortObj = { clientIdentifier: 1, createdAt: -1 };
      else if (sort === 'updated') sortObj = { updatedAt: -1 };

      const [intakes, total] = await Promise.all([
        ClinicalIntake.find(filter).sort(sortObj).skip(skip).limit(limitNum),
        ClinicalIntake.countDocuments(filter),
      ]);

      return res.json({
        intakes: intakes.map(sanitiseIntake),
        pagination: {
          total,
          page:       pageNum,
          limit:      limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (err) {
      logger.error('[clinical/intakes] GET / error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/iatlas/clinical/intakes/:id — Get single intake
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/:id',
  intakesLimiter,
  authenticateJWT,
  requirePractitionerTier,
  verifyIntakeOwnership,
  async (req, res) => {
    try {
      const intake = await ClinicalIntake.findById(req.params.id);
      if (!intake) return res.status(404).json({ error: 'Intake not found.' });
      return res.json(sanitiseIntake(intake));
    } catch (err) {
      logger.error('[clinical/intakes] GET /:id error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/iatlas/clinical/intakes/:id — Update intake
// ─────────────────────────────────────────────────────────────────────────────

const UPDATABLE_FIELDS = [
  'clientIdentifier',
  'clientProfileId',
  'dateOfBirth',
  'pronouns',
  'guardianContact',
  'dimensionRatings',
  'currentStressors',
  'supportSystem',
  'therapyGoals',
  'additionalNotes',
];

router.put(
  '/:id',
  intakesLimiter,
  authenticateJWT,
  requirePractitionerTier,
  verifyIntakeOwnership,
  async (req, res) => {
    try {
      const intake = await ClinicalIntake.findById(req.params.id);
      if (!intake) return res.status(404).json({ error: 'Intake not found.' });

      for (const field of UPDATABLE_FIELDS) {
        if (req.body[field] === undefined) continue;

        if (field === 'clientIdentifier') {
          const val = req.body[field];
          if (typeof val !== 'string' || !val.trim()) {
            return res.status(400).json({ error: 'clientIdentifier must be a non-empty string.' });
          }
          const trimmed = val.trim();
          if (trimmed.length < 2 || trimmed.length > 128) {
            return res.status(400).json({ error: 'clientIdentifier must be 2–128 characters.' });
          }
          intake[field] = trimmed;
        } else if (field === 'dateOfBirth') {
          if (req.body[field]) {
            const dob = new Date(req.body[field]);
            if (isNaN(dob.getTime())) {
              return res.status(400).json({ error: 'dateOfBirth is not a valid date.' });
            }
            if (dob >= new Date()) {
              return res.status(400).json({ error: 'dateOfBirth must be in the past.' });
            }
            intake[field] = dob;
          } else {
            intake[field] = null;
          }
        } else if (field === 'dimensionRatings') {
          const dimError = validateDimensionRatings(req.body[field]);
          if (dimError) return res.status(400).json({ error: dimError });
          intake[field] = req.body[field];
        } else if (field === 'supportSystem') {
          const sysError = validateSupportSystem(req.body[field]);
          if (sysError) return res.status(400).json({ error: sysError });
          intake[field] = req.body[field];
        } else if (field === 'therapyGoals') {
          if (!Array.isArray(req.body[field])) {
            return res.status(400).json({ error: 'therapyGoals must be an array.' });
          }
          if (req.body[field].length > 10) {
            return res.status(400).json({ error: 'therapyGoals must contain at most 10 items.' });
          }
          intake[field] = req.body[field].map(g => g.trim()).filter(Boolean);
        } else if (field === 'currentStressors') {
          if (!Array.isArray(req.body[field])) {
            return res.status(400).json({ error: 'currentStressors must be an array.' });
          }
          const invalid = req.body[field].filter(s => !VALID_STRESSORS.has(s));
          if (invalid.length > 0) {
            return res.status(400).json({ error: `Invalid stressors: ${invalid.join(', ')}` });
          }
          intake[field] = req.body[field];
        } else {
          intake[field] = req.body[field];
        }
      }

      await intake.save();

      logger.info(`[clinical/intakes] Updated intake ${intake._id} for practitioner ${resolveUserId(req)}`);
      return res.json(sanitiseIntake(intake));
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
      }
      logger.error('[clinical/intakes] PUT /:id error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/iatlas/clinical/intakes/:id — Archive intake (soft delete)
// ─────────────────────────────────────────────────────────────────────────────

router.delete(
  '/:id',
  intakesLimiter,
  authenticateJWT,
  requirePractitionerTier,
  verifyIntakeOwnership,
  async (req, res) => {
    try {
      const intake = await ClinicalIntake.findById(req.params.id);
      if (!intake) return res.status(404).json({ error: 'Intake not found.' });

      intake.archived = true;
      await intake.save();

      logger.info(`[clinical/intakes] Archived intake ${intake._id} for practitioner ${resolveUserId(req)}`);
      return res.json({ message: 'Intake archived successfully.', id: intake._id });
    } catch (err) {
      logger.error('[clinical/intakes] DELETE /:id error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

module.exports = router;
