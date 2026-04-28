'use strict';

/**
 * iatlas-mini-assessments.js — Routes for IATLAS mini assessment results.
 *
 * Endpoints:
 *   POST /api/iatlas/mini-assessments        — Save a mini assessment result
 *   GET  /api/iatlas/mini-assessments        — Get history (query: clientProfileId, dimension, limit)
 *   GET  /api/iatlas/mini-assessments/:id    — Get a single result
 */

const express   = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();

const { authenticateJWT } = require('../middleware/auth');
const MiniAssessment      = require('../models/MiniAssessment');
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

const VALID_DIMENSIONS = new Set([
  'emotional-adaptive',
  'agentic-generative',
  'somatic-regulative',
  'cognitive-narrative',
  'relational-connective',
  'spiritual-existential',
]);

const SCORE_BANDS = {
  low:    [3, 7],
  medium: [8, 11],
  high:   [12, 15],
};

function getInterpretation(score) {
  for (const [band, [min, max]] of Object.entries(SCORE_BANDS)) {
    if (score >= min && score <= max) return band;
  }
  return null;
}

// ── POST / — Save a new mini assessment result ─────────────────────────────────

router.post('/', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'User identity could not be determined.' });
  }

  const {
    dimension,
    versionUsed = 'parent',
    responses,
    notes = '',
    clientProfileId: rawClientProfileId = null,
    recommendedActivities = [],
  } = req.body || {};

  const clientProfileId = sanitizeId(rawClientProfileId);

  // Validate dimension
  if (!dimension || !VALID_DIMENSIONS.has(dimension)) {
    return res.status(400).json({ error: 'Invalid or missing dimension.' });
  }

  // Validate versionUsed
  if (!['parent', 'practitioner'].includes(versionUsed)) {
    return res.status(400).json({ error: 'versionUsed must be "parent" or "practitioner".' });
  }

  // Validate responses
  if (!Array.isArray(responses) || responses.length !== 3) {
    return res.status(400).json({ error: 'Exactly 3 responses are required.' });
  }

  for (const r of responses) {
    if (!r.questionId || typeof r.score !== 'number' || r.score < 1 || r.score > 5) {
      return res.status(400).json({ error: 'Each response must have a questionId and a score between 1 and 5.' });
    }
  }

  const totalScore = responses.reduce((sum, r) => sum + r.score, 0);
  const interpretation = getInterpretation(totalScore);

  try {
    const doc = await MiniAssessment.create({
      userId:         String(userId),
      clientProfileId,
      dimension,
      versionUsed,
      responses,
      totalScore,
      interpretation,
      recommendedActivities: Array.isArray(recommendedActivities) ? recommendedActivities : [],
      notes: typeof notes === 'string' ? notes.trim().slice(0, 2000) : '',
    });

    return res.status(201).json({ miniAssessment: doc });
  } catch (err) {
    logger.error('[iatlas-mini-assessments/post] error:', err);
    return res.status(500).json({ error: 'Failed to save mini assessment.' });
  }
});

// ── GET / — Get assessment history ────────────────────────────────────────────

router.get('/', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'User identity could not be determined.' });
  }

  const clientProfileId = sanitizeId(req.query.clientProfileId);
  const dimension       = req.query.dimension || null;
  const limitRaw        = parseInt(req.query.limit, 10);
  const limit           = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 50;

  const filter = { userId: String(userId) };
  if (clientProfileId) filter.clientProfileId = clientProfileId;
  if (dimension && VALID_DIMENSIONS.has(dimension)) {
    filter.dimension = dimension;
  }

  try {
    const results = await MiniAssessment
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({ miniAssessments: results, count: results.length });
  } catch (err) {
    logger.error('[iatlas-mini-assessments/get] error:', err);
    return res.status(500).json({ error: 'Failed to fetch mini assessments.' });
  }
});

// ── GET /:id — Get a single result ────────────────────────────────────────────

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
    const doc = await MiniAssessment.findOne({ _id: id, userId: String(userId) }).lean();
    if (!doc) {
      return res.status(404).json({ error: 'Mini assessment not found.' });
    }
    return res.json({ miniAssessment: doc });
  } catch (err) {
    logger.error('[iatlas-mini-assessments/getById] error:', err);
    return res.status(500).json({ error: 'Failed to fetch mini assessment.' });
  }
});

module.exports = router;
