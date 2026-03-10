'use strict';

/**
 * insights.js
 *
 * API routes for the Philosophical Content Engine.
 *
 * Base path: /api/insights
 *
 * GET  /api/insights/today            — today's full content bundle
 * GET  /api/insights/day/:dayNumber   — bundle for a specific day number
 * GET  /api/insights/quotes           — full quote library (paginated)
 * GET  /api/insights/quotes/:id       — single quote entry
 * GET  /api/insights/dimension/:name  — today's insight for a given dimension
 */

const express    = require('express');
const rateLimit  = require('express-rate-limit');

const {
  getQuoteForDay,
  getQuoteForDimension,
  generateContentBundle,
  getDailyBundle,
  TOTAL_QUOTES,
} = require('../services/philosophical-content-engine');

const { PHILOSOPHICAL_QUOTES, DIMENSION_SUBTITLES } = require('../data/philosophical-quotes');

const router = express.Router();

const insightLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max:      120,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(insightLimiter);

// ── GET /api/insights/today ───────────────────────────────────────────────────

router.get('/today', (req, res) => {
  try {
    const bundle = getDailyBundle();
    res.json({ ok: true, data: bundle });
  } catch (err) {
    /* istanbul ignore next */
    res.status(500).json({ error: 'Failed to generate daily insight.' });
  }
});

// ── GET /api/insights/day/:dayNumber ──────────────────────────────────────────

router.get('/day/:dayNumber', (req, res) => {
  const dayNumber = parseInt(req.params.dayNumber, 10);

  if (!Number.isInteger(dayNumber) || dayNumber < 1) {
    return res.status(400).json({ error: 'dayNumber must be a positive integer.' });
  }

  try {
    const entry  = getQuoteForDay(dayNumber);
    const bundle = generateContentBundle(entry);
    res.json({ ok: true, data: bundle });
  } catch (err) {
    /* istanbul ignore next */
    res.status(500).json({ error: 'Failed to generate insight.' });
  }
});

// ── GET /api/insights/quotes ──────────────────────────────────────────────────

router.get('/quotes', (req, res) => {
  const page    = Math.max(1, parseInt(req.query.page,  10) || 1);
  const limit   = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const dimFilter = req.query.dimension;

  let pool = PHILOSOPHICAL_QUOTES;
  if (dimFilter) {
    pool = pool.filter(q => q.resilienceDimension === dimFilter);
  }

  const total  = pool.length;
  const start  = (page - 1) * limit;
  const quotes = pool.slice(start, start + limit);

  res.json({
    ok:   true,
    data: {
      quotes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// ── GET /api/insights/quotes/:id ──────────────────────────────────────────────

router.get('/quotes/:id', (req, res) => {
  const entry = PHILOSOPHICAL_QUOTES.find(q => q.id === req.params.id);
  if (!entry) {
    return res.status(404).json({ error: 'Quote not found.' });
  }

  const bundle = generateContentBundle(entry);
  res.json({ ok: true, data: bundle });
});

// ── GET /api/insights/dimension/:name ────────────────────────────────────────

router.get('/dimension/:name', (req, res) => {
  const name = req.params.name;

  if (!DIMENSION_SUBTITLES[name]) {
    return res.status(400).json({
      error:      'Unknown dimension.',
      dimensions: Object.keys(DIMENSION_SUBTITLES),
    });
  }

  const dayNumber = parseInt(req.query.day, 10) || undefined;

  try {
    const entry = getQuoteForDimension(name, dayNumber);
    if (!entry) {
      return res.status(404).json({ error: 'No quotes found for this dimension.' });
    }
    const bundle = generateContentBundle(entry);
    res.json({ ok: true, data: bundle });
  } catch (err) {
    /* istanbul ignore next */
    res.status(500).json({ error: 'Failed to generate dimension insight.' });
  }
});

// ── GET /api/insights/dimensions ─────────────────────────────────────────────

router.get('/dimensions', (req, res) => {
  const dimensions = Object.entries(DIMENSION_SUBTITLES).map(([name, subtitle]) => ({
    name,
    subtitle,
    quoteCount: PHILOSOPHICAL_QUOTES.filter(q => q.resilienceDimension === name).length,
  }));

  res.json({
    ok:           true,
    data:         { dimensions, totalQuotes: TOTAL_QUOTES },
  });
});

module.exports = router;
