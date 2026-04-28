'use strict';

/**
 * iatlas-parent-outcomes.js — Routes for IATLAS Parent-Reported Outcome (PRO) forms.
 *
 * Endpoints:
 *   POST  /api/iatlas/parent-outcomes            — Submit a parent check-in
 *   GET   /api/iatlas/parent-outcomes            — Get parent check-in history
 *   GET   /api/iatlas/parent-outcomes/:id        — Get a single submission
 *   PATCH /api/iatlas/parent-outcomes/:id/review — Practitioner marks as reviewed + adds notes
 */

const express   = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();

const { authenticateJWT } = require('../middleware/auth');
const ParentOutcome       = require('../models/ParentOutcome');
const logger              = require('../utils/logger');

// ── Rate limiting ─────────────────────────────────────────────────────────────

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max:      60,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(limiter);
router.use(authenticateJWT);

// ── Helpers ───────────────────────────────────────────────────────────────────

function getUserId(req) {
  const raw = req.user?.userId || req.user?.sub || req.user?.id || null;
  return typeof raw === 'string' && raw.length > 0 ? raw : null;
}

function sanitizeId(value) {
  if (!value || typeof value !== 'string') return null;
  return /^[a-zA-Z0-9_-]{1,128}$/.test(value) ? value : null;
}

function sanitizeText(value, maxLen = 5000) {
  if (!value || typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

// ── POST / — Submit a parent check-in ─────────────────────────────────────────

router.post('/', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'User identity could not be determined.' });
  }

  const {
    childProfileId: rawChildProfileId = null,
    formType,
    period = null,
    wins            = [],
    challenges      = [],
    observations    = '',
    dimensionRatings = [],
    overallProgress  = null,
    flags           = [],
    questionsForPractitioner = '',
    celebration     = '',
    additionalResponses = {},
  } = req.body || {};

  const childProfileId = sanitizeId(rawChildProfileId);

  if (!['weekly', 'monthly'].includes(formType)) {
    return res.status(400).json({ error: 'formType must be "weekly" or "monthly".' });
  }

  try {
    const doc = await ParentOutcome.create({
      parentUserId:   String(userId),
      childProfileId,
      formType,
      period:         period ? String(period).trim().slice(0, 20) : null,
      wins:           Array.isArray(wins) ? wins.filter(w => typeof w === 'string') : [],
      challenges:     Array.isArray(challenges) ? challenges.filter(c => typeof c === 'string') : [],
      observations:   sanitizeText(observations, 5000),
      dimensionRatings: Array.isArray(dimensionRatings)
        ? dimensionRatings.filter(r => r.dimensionKey && typeof r.rating === 'number' && r.rating >= 1 && r.rating <= 5)
        : [],
      overallProgress: overallProgress !== null && overallProgress >= 1 && overallProgress <= 5
        ? Number(overallProgress)
        : undefined,
      flags: Array.isArray(flags) ? flags.filter(f => typeof f === 'string') : [],
      questionsForPractitioner: sanitizeText(questionsForPractitioner, 2000),
      celebration:    sanitizeText(celebration, 2000),
      additionalResponses: typeof additionalResponses === 'object' && !Array.isArray(additionalResponses)
        ? additionalResponses
        : {},
    });

    return res.status(201).json({ parentOutcome: doc });
  } catch (err) {
    logger.error('[iatlas-parent-outcomes/post] error:', err);
    return res.status(500).json({ error: 'Failed to save parent check-in.' });
  }
});

// ── GET / — Get check-in history ──────────────────────────────────────────────

router.get('/', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'User identity could not be determined.' });
  }

  const childProfileId = sanitizeId(req.query.childProfileId);
  const formType       = req.query.formType || null;
  const limitRaw       = parseInt(req.query.limit, 10);
  const limit          = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 50;

  const filter = { parentUserId: String(userId) };
  if (childProfileId) filter.childProfileId = childProfileId;
  if (formType && ['weekly', 'monthly'].includes(formType)) filter.formType = formType;

  try {
    const results = await ParentOutcome
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({ parentOutcomes: results, count: results.length });
  } catch (err) {
    logger.error('[iatlas-parent-outcomes/get] error:', err);
    return res.status(500).json({ error: 'Failed to fetch parent check-ins.' });
  }
});

// ── GET /:id — Get a single submission ────────────────────────────────────────

router.get('/:id', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'User identity could not be determined.' });
  }

  const id = sanitizeId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid ID.' });
  }

  try {
    const doc = await ParentOutcome.findOne({ _id: id, parentUserId: String(userId) }).lean();
    if (!doc) {
      return res.status(404).json({ error: 'Parent check-in not found.' });
    }
    return res.json({ parentOutcome: doc });
  } catch (err) {
    logger.error('[iatlas-parent-outcomes/getById] error:', err);
    return res.status(500).json({ error: 'Failed to fetch parent check-in.' });
  }
});

// ── PATCH /:id/review — Practitioner review + notes ───────────────────────────

router.patch('/:id/review', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'User identity could not be determined.' });
  }

  const id = sanitizeId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid ID.' });
  }

  const { practitionerNotes = '' } = req.body || {};

  try {
    // Allow both the parent AND practitioners to mark as reviewed.
    // In a full implementation this would check practitioner role.
    const doc = await ParentOutcome.findByIdAndUpdate(
      id,
      {
        $set: {
          reviewedByPractitioner: true,
          reviewedAt:             new Date(),
          practitionerNotes:      sanitizeText(practitionerNotes, 5000),
        },
      },
      { new: true }
    ).lean();

    if (!doc) {
      return res.status(404).json({ error: 'Parent check-in not found.' });
    }

    return res.json({ parentOutcome: doc });
  } catch (err) {
    logger.error('[iatlas-parent-outcomes/review] error:', err);
    return res.status(500).json({ error: 'Failed to update review status.' });
  }
});

module.exports = router;
