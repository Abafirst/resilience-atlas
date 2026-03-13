'use strict';

/**
 * analytics.js — Team analytics computation helpers and route module.
 *
 * Exported helpers are also used directly by organizations.js to avoid
 * code duplication.
 *
 * Route (optional, mounted at /api/organizations/:id/analytics by server.js)
 * is handled inside organizations.js. This file primarily exports the
 * shared computeTeamAverages() helper.
 */

const Organization     = require('../models/Organization');
const ResilienceResult = require('../models/ResilienceResult');
const TeamResult       = require('../models/TeamResult');

// ── Dimension key normalisation ───────────────────────────────────────────────

/**
 * Map the varied dimension key names stored in ResilienceResult.scores
 * to the canonical six-key set used in TeamResult.averages.
 *
 * ResilienceResult scores keys (from backend/routes/quiz.js):
 *   'Agentic-Generative', 'Relational', 'Spiritual-Existential',
 *   'Emotional-Adaptive', 'Somatic-Behavioral', 'Cognitive-Narrative'
 *
 * Canonical keys in TeamResult.averages:
 *   relational, cognitive, somatic, emotional, spiritual, agentic
 */
const DIM_MAP = {
  relational:           'relational',
  'cognitive-narrative':'cognitive',
  cognitive:            'cognitive',
  'somatic-behavioral': 'somatic',
  somatic:              'somatic',
  'emotional-adaptive': 'emotional',
  emotional:            'emotional',
  'spiritual-existential': 'spiritual',
  spiritual:            'spiritual',
  'agentic-generative': 'agentic',
  agentic:              'agentic',
};

function canonicalDim(key) {
  return DIM_MAP[(key || '').toLowerCase()] || null;
}

// ── Core computation ──────────────────────────────────────────────────────────

/**
 * Compute (or refresh) the TeamResult for an organisation.
 *
 * Fetches all linked ResilienceResult documents, averages each dimension,
 * then upserts the TeamResult for the 'current' period.
 *
 * @param {Object} org  – Mongoose Organisation document (or plain object with _id + completedResultIds)
 * @returns {Promise<Object>} – the upserted TeamResult document
 */
async function computeTeamAverages(org) {
  const orgId = org._id || org;

  const results = await ResilienceResult.find({
    _id: { $in: org.completedResultIds || [] },
  }).lean();

  const count = results.length;

  const sums = {
    relational: 0, cognitive: 0, somatic: 0,
    emotional: 0, spiritual: 0, agentic: 0, overall: 0,
  };
  let overallCount = 0;

  for (const r of results) {
    if (r.overall != null) { sums.overall += r.overall; overallCount++; }

    const sc = r.scores;
    if (!sc) continue;

    // scores may be a plain object or a Mongoose Map
    const entries = sc instanceof Map
      ? Array.from(sc.entries())
      : Object.entries(sc);

    for (const [key, val] of entries) {
      const dim = canonicalDim(key);
      if (!dim) continue;
      const pct =
        typeof val === 'object' && val !== null && val.percentage != null
          ? val.percentage
          : typeof val === 'number'
          ? val
          : null;
      if (pct != null) sums[dim] += pct;
    }
  }

  const avg = (key) => (count > 0 ? Math.round((sums[key] / count) * 10) / 10 : 0);

  const averages = {
    relational: avg('relational'),
    cognitive:  avg('cognitive'),
    somatic:    avg('somatic'),
    emotional:  avg('emotional'),
    spiritual:  avg('spiritual'),
    agentic:    avg('agentic'),
    overall:    overallCount > 0 ? Math.round((sums.overall / overallCount) * 10) / 10 : 0,
  };

  const teamResult = await TeamResult.findOneAndUpdate(
    { organization_id: orgId, period: 'current' },
    { $set: { team_count: count, averages } },
    { upsert: true, new: true }
  );

  return teamResult;
}

module.exports = { computeTeamAverages };
