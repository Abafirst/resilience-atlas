'use strict';

/**
 * clinical-scales.js — CRUD routes for validated clinical rating scales.
 *
 * Supports PHQ-9 (depression) and GAD-7 (anxiety).
 * All routes require Practitioner-tier access.
 *
 * Endpoints:
 *   POST /api/clinical/scales         — Save a completed assessment
 *   GET  /api/clinical/scales         — List assessments (query: clientProfileId, scaleType)
 *   GET  /api/clinical/scales/:id     — Get a single assessment
 */

const express   = require('express');
const mongoose  = require('mongoose');
const rateLimit = require('express-rate-limit');

const { authenticateJWT, requirePractitionerTier } = require('../../middleware/auth');
const ClinicalScale = require('../../models/ClinicalScale');
const logger        = require('../../utils/logger');

const router = express.Router();

// ── Rate limiter ──────────────────────────────────────────────────────────────

const scalesLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      120,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

// ── Scoring helpers ───────────────────────────────────────────────────────────

const SEVERITY_BANDS = {
  'PHQ-9': [
    { max: 4,  band: 'minimal' },
    { max: 9,  band: 'mild' },
    { max: 14, band: 'moderate' },
    { max: 19, band: 'moderately_severe' },
    { max: 27, band: 'severe' },
  ],
  'GAD-7': [
    { max: 4,  band: 'minimal' },
    { max: 9,  band: 'mild' },
    { max: 14, band: 'moderate' },
    { max: 21, band: 'severe' },
  ],
};

const EXPECTED_QUESTIONS = { 'PHQ-9': 9, 'GAD-7': 7 };

function getSeverityBand(scaleType, totalScore) {
  const bands = SEVERITY_BANDS[scaleType];
  if (!bands) return null;
  for (const { max, band } of bands) {
    if (totalScore <= max) return band;
  }
  return bands[bands.length - 1].band;
}

function resolveUserId(req) {
  return req.user && (req.user.userId || req.user.sub);
}

// ── POST / — Save a completed clinical scale ──────────────────────────────────

router.post(
  '/',
  scalesLimiter,
  authenticateJWT,
  requirePractitionerTier,
  async (req, res) => {
    try {
      const practitionerId = resolveUserId(req);
      const { clientProfileId, scaleType, responses, notes = '', administeredAt } = req.body;

      if (!clientProfileId || typeof clientProfileId !== 'string') {
        return res.status(400).json({ error: 'clientProfileId is required.' });
      }

      const validScales = ['PHQ-9', 'GAD-7'];
      if (!scaleType || !validScales.includes(scaleType)) {
        return res.status(400).json({ error: `scaleType must be one of: ${validScales.join(', ')}.` });
      }

      const expectedCount = EXPECTED_QUESTIONS[scaleType];
      if (!Array.isArray(responses) || responses.length !== expectedCount) {
        return res.status(400).json({ error: `${scaleType} requires exactly ${expectedCount} responses.` });
      }

      for (const r of responses) {
        if (!r.questionId || typeof r.score !== 'number' || r.score < 0) {
          return res.status(400).json({ error: 'Each response must have a questionId and a non-negative score.' });
        }
      }

      const totalScore   = responses.reduce((sum, r) => sum + r.score, 0);
      const severityBand = getSeverityBand(scaleType, totalScore);

      const doc = await ClinicalScale.create({
        practitionerId,
        clientProfileId: clientProfileId.trim(),
        scaleType,
        responses,
        totalScore,
        severityBand,
        notes: typeof notes === 'string' ? notes.trim().slice(0, 5000) : '',
        administeredAt: administeredAt ? new Date(administeredAt) : new Date(),
      });

      logger.info(`[clinical-scales] Saved ${scaleType} for client ${clientProfileId}`, {
        practitionerId,
        totalScore,
        severityBand,
      });

      return res.status(201).json({ clinicalScale: doc });
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
      }
      logger.error('[clinical-scales] POST / error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ── GET / — List assessments ──────────────────────────────────────────────────

router.get(
  '/',
  scalesLimiter,
  authenticateJWT,
  requirePractitionerTier,
  async (req, res) => {
    try {
      const practitionerId = resolveUserId(req);
      const { clientProfileId, scaleType, limit: limitRaw = '50' } = req.query;

      const filter = { practitionerId };
      if (clientProfileId) filter.clientProfileId = String(clientProfileId).slice(0, 128);
      if (scaleType && ['PHQ-9', 'GAD-7'].includes(scaleType)) filter.scaleType = scaleType;

      const limit = Math.min(100, Math.max(1, parseInt(limitRaw, 10) || 50));

      const docs = await ClinicalScale
        .find(filter)
        .sort({ administeredAt: -1 })
        .limit(limit)
        .lean();

      return res.json({ clinicalScales: docs, count: docs.length });
    } catch (err) {
      logger.error('[clinical-scales] GET / error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ── GET /:id — Get a single assessment ────────────────────────────────────────

router.get(
  '/:id',
  scalesLimiter,
  authenticateJWT,
  requirePractitionerTier,
  async (req, res) => {
    try {
      const practitionerId = resolveUserId(req);
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID.' });
      }

      const doc = await ClinicalScale.findOne({ _id: id, practitionerId }).lean();
      if (!doc) return res.status(404).json({ error: 'Assessment not found.' });

      return res.json({ clinicalScale: doc });
    } catch (err) {
      logger.error('[clinical-scales] GET /:id error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

module.exports = router;
