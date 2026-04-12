'use strict';

/**
 * backend/routes/micro-practice-plan.js
 *
 * Endpoints for the 30-day personalised micro-practice plan.
 *
 * GET  /api/micro-practice-plan?email=&assessmentHash=
 *   — Returns the existing plan (or 404 if none yet).
 *
 * POST /api/micro-practice-plan
 *   Body: { email, assessmentHash, scores, timezone }
 *   — Creates a new plan (idempotent: returns existing if one already exists).
 *   — `scores` is a map of dimension → { percentage } (mirrors ResultsPage data).
 */

const express     = require('express');
const rateLimit   = require('express-rate-limit');
const MicroPracticePlan = require('../models/MicroPracticePlan');
const logger      = require('../utils/logger');

const router = express.Router();

const planLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(planLimiter);

// ── Practice catalogue (mirrors EVIDENCE_PRACTICES in ResultsPage) ───────────
// Two practices per dimension — one low-effort "starter" and one slightly richer one.
const PRACTICE_CATALOGUE = {
  'Cognitive-Narrative': [
    'Reframing Journal',
    'Leaves on a Stream',
  ],
  'Relational-Connective': [
    'Empathic Listening',
    'Connection Scheduling',
  ],
  'Agentic-Generative': [
    'One Small Step',
    'Values-Based Decision',
  ],
  'Emotional-Adaptive': [
    'RAIN Mindfulness',
    'Emotion Naming',
  ],
  'Spiritual-Reflective': [
    'Values Reflection',
    'Gratitude Practice',
  ],
  'Somatic-Regulative': [
    'Mindful Breathing',
    'Body-Scan Reset',
  ],
};

const DIMENSIONS = Object.keys(PRACTICE_CATALOGUE);

/**
 * Build a deterministic 30-day sequence from the assessment scores.
 *
 * Strategy:
 *   - Dimensions with lower scores appear more often (more practice needed).
 *   - The sequence is constructed so each dimension appears at least once
 *     in the first 6 days, then weighted distribution fills days 7–30.
 *   - A seeded shuffle based on the assessmentHash ensures the plan is
 *     consistent across multiple calls for the same assessment.
 *
 * @param {Object} scores          dimension → { percentage }
 * @param {string} assessmentHash  Used as a deterministic seed
 * @param {string} startDate       ISO date string YYYY-MM-DD for Day 1
 * @returns {Array<{ day, dimension, practiceTitle, scheduledDate }>}
 */
function buildPlan(scores, assessmentHash, startDate) {
  // Compute a numeric seed from the hash (or use 42 as fallback).
  let seed = 42;
  if (assessmentHash && typeof assessmentHash === 'string') {
    seed = assessmentHash.slice(0, 8).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  }

  // Simple seeded pseudo-random (LCG) so we don't need an npm package.
  function seededRand(s) {
    let state = s;
    return function () {
      state = (state * 1664525 + 1013904223) & 0xffffffff;
      return (state >>> 0) / 0x100000000;
    };
  }
  const rand = seededRand(seed);

  // Compute dimension weights: lower score → higher weight.
  const weights = DIMENSIONS.map((dim) => {
    const pct = (scores && scores[dim] && scores[dim].percentage != null)
      ? scores[dim].percentage
      : 50;
    // Invert so lower scores get more practice.
    return Math.max(1, 100 - Math.round(pct));
  });

  // Build a weighted pool of (dimension, practiceIndex) pairs for 30 days.
  // Ensure every dimension appears at least once.
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const pool = [];
  DIMENSIONS.forEach((dim, i) => {
    // Each dimension appears at least once, plus proportional extra slots.
    const extra = Math.round((weights[i] / totalWeight) * 24);
    pool.push({ dim, idx: 0 }); // guaranteed slot
    for (let e = 0; e < extra; e++) {
      pool.push({ dim, idx: rand() > 0.5 ? 1 : 0 });
    }
  });

  // Shuffle the pool with Fisher-Yates using our seeded rand.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Trim/extend to exactly 30 entries.
  while (pool.length < 30) {
    const extra = pool[Math.floor(rand() * pool.length)];
    pool.push({ ...extra });
  }
  const thirty = pool.slice(0, 30);

  // Map to day objects.
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  return thirty.map((entry, i) => {
    const d = new Date(startYear, startMonth - 1, startDay + i);
    const scheduledDate = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-');

    const practiceTitle = PRACTICE_CATALOGUE[entry.dim][entry.idx] ||
      PRACTICE_CATALOGUE[entry.dim][0];

    return {
      day: i + 1,
      dimension: entry.dim,
      practiceTitle,
      scheduledDate,
      completedAt: null,
    };
  });
}

/**
 * Validate an email without a ReDoS-prone regex.
 */
function isValidEmail(email) {
  if (!email || email.length > 254) return false;
  const atIdx = email.lastIndexOf('@');
  if (atIdx < 1) return false;
  const domain = email.slice(atIdx + 1);
  return domain.length >= 3 && domain.includes('.');
}

// ── GET /api/micro-practice-plan ─────────────────────────────────────────────

router.get('/', async (req, res) => {
  const { email, assessmentHash } = req.query;

  const cleanEmail = (typeof email === 'string') ? email.trim().toLowerCase() : '';
  if (!isValidEmail(cleanEmail)) {
    return res.status(400).json({ error: 'Valid email is required.' });
  }

  try {
    const query = { email: cleanEmail };
    if (assessmentHash) query.assessmentHash = String(assessmentHash).slice(0, 64);

    const plan = await MicroPracticePlan.findOne(query).lean();
    if (!plan) {
      return res.status(404).json({ error: 'No plan found. POST to create one.' });
    }
    return res.json({ plan });
  } catch (err) {
    logger.error('[micro-practice-plan GET] error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve plan.' });
  }
});

// ── POST /api/micro-practice-plan ────────────────────────────────────────────

router.post('/', async (req, res) => {
  let { email, assessmentHash, scores, timezone } = req.body;

  const cleanEmail = (typeof email === 'string') ? email.trim().toLowerCase() : '';
  if (!isValidEmail(cleanEmail)) {
    return res.status(400).json({ error: 'Valid email is required.' });
  }

  const cleanHash = assessmentHash ? String(assessmentHash).slice(0, 64) : null;
  const cleanTz   = (typeof timezone === 'string' && timezone.length < 64) ? timezone : 'UTC';

  // Determine today's date in the user's timezone.
  let startDate;
  try {
    startDate = new Date().toLocaleDateString('en-CA', { timeZone: cleanTz });
  } catch (_) {
    startDate = new Date().toISOString().slice(0, 10);
  }

  try {
    // Return existing plan (idempotent).
    const existing = await MicroPracticePlan.findOne({
      email: cleanEmail,
      ...(cleanHash ? { assessmentHash: cleanHash } : {}),
    }).lean();

    if (existing) {
      return res.json({ plan: existing, created: false });
    }

    const days = buildPlan(scores || {}, cleanHash || '', startDate);

    const plan = await MicroPracticePlan.create({
      email:          cleanEmail,
      assessmentHash: cleanHash,
      startDate,
      timezone:       cleanTz,
      days,
    });

    logger.info(`[micro-practice-plan] Created 30-day plan for ${cleanEmail}`);
    return res.status(201).json({ plan, created: true });
  } catch (err) {
    // Handle duplicate key (race condition — plan created between our findOne and create).
    if (err.code === 11000) {
      const existing = await MicroPracticePlan.findOne({
        email: cleanEmail,
        ...(cleanHash ? { assessmentHash: cleanHash } : {}),
      }).lean().catch(() => null);
      return res.json({ plan: existing, created: false });
    }
    logger.error('[micro-practice-plan POST] error:', err.message);
    return res.status(500).json({ error: 'Failed to create plan.' });
  }
});

// ── PATCH /api/micro-practice-plan/complete ──────────────────────────────────
// Mark a specific day's practice as completed.
// Body: { email, assessmentHash, day }

router.patch('/complete', async (req, res) => {
  let { email, assessmentHash, day } = req.body;

  const cleanEmail = (typeof email === 'string') ? email.trim().toLowerCase() : '';
  if (!isValidEmail(cleanEmail)) {
    return res.status(400).json({ error: 'Valid email is required.' });
  }
  const dayNum = parseInt(day, 10);
  if (!Number.isFinite(dayNum) || dayNum < 1 || dayNum > 30) {
    return res.status(400).json({ error: 'day must be an integer between 1 and 30.' });
  }

  const cleanHash = assessmentHash ? String(assessmentHash).slice(0, 64) : null;

  try {
    const plan = await MicroPracticePlan.findOneAndUpdate(
      {
        email: cleanEmail,
        ...(cleanHash ? { assessmentHash: cleanHash } : {}),
        'days.day': dayNum,
      },
      { $set: { 'days.$.completedAt': new Date() } },
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({ error: 'Plan or day not found.' });
    }
    return res.json({ success: true });
  } catch (err) {
    logger.error('[micro-practice-plan PATCH] error:', err.message);
    return res.status(500).json({ error: 'Failed to update plan.' });
  }
});

module.exports = router;
