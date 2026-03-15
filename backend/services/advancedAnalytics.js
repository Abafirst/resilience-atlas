'use strict';

/**
 * advancedAnalytics.js — Advanced team analytics for the Teams tier.
 *
 * Computes:
 *  - Dimension distribution (% of team scoring high/medium/low per dimension)
 *  - Trend analysis (compare current vs previous assessment cycles)
 *  - Risk flagging (individuals with overall score < threshold)
 *  - Benchmark comparison (team vs industry baseline)
 *  - Dimension heatmap data (strength/weakness matrix)
 */

const ResilienceResult = require('../models/ResilienceResult');
const TeamResult       = require('../models/TeamResult');

// ── Constants ─────────────────────────────────────────────────────────────────

const DIMENSIONS = ['relational', 'cognitive', 'somatic', 'emotional', 'spiritual', 'agentic'];

const DIMENSION_LABELS = {
  relational: 'Relational-Connective',
  cognitive:  'Cognitive-Narrative',
  somatic:    'Somatic-Behavioral',
  emotional:  'Emotional-Adaptive',
  spiritual:  'Spiritual-Existential',
  agentic:    'Agentic-Generative',
};

// Industry baseline benchmarks (% scores, illustrative defaults)
const INDUSTRY_BASELINES = {
  relational: 62,
  cognitive:  65,
  somatic:    58,
  emotional:  60,
  spiritual:  55,
  agentic:    63,
  overall:    61,
};

// Score band thresholds
const THRESHOLDS = {
  high:   70,  // >= 70% → high
  medium: 40,  // 40–69% → medium
  // < 40% → low
};

const DEFAULT_RISK_THRESHOLD = 40;  // overall score below this → risk flag

// ── Dimension key normalisation ───────────────────────────────────────────────

const DIM_MAP = {
  relational:              'relational',
  'relational-connective': 'relational',
  cognitive:               'cognitive',
  'cognitive-narrative':   'cognitive',
  somatic:                 'somatic',
  'somatic-regulative':    'somatic',
  'somatic-behavioral':    'somatic',
  emotional:               'emotional',
  'emotional-adaptive':    'emotional',
  spiritual:               'spiritual',
  'spiritual-existential': 'spiritual',
  'spiritual-reflective':  'spiritual',
  agentic:                 'agentic',
  'agentic-generative':    'agentic',
};

function canonicalDim(key) {
  return DIM_MAP[(key || '').toLowerCase()] || null;
}

/**
 * Extract a percentage value from a raw score entry.
 * Handles both plain numbers and objects with a .percentage field.
 */
function extractPct(val) {
  if (val == null) return null;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && val.percentage != null) return val.percentage;
  return null;
}

/**
 * Normalise a ResilienceResult document into a flat dimension map.
 * @param {Object} r – ResilienceResult lean document
 * @returns {Object} { relational, cognitive, somatic, emotional, spiritual, agentic, overall }
 */
function normaliseDims(r) {
  const out = { overall: r.overall || r.overall_score || null };

  // Prefer pre-computed dimension_scores when available
  if (r.dimension_scores) {
    for (const dim of DIMENSIONS) {
      if (r.dimension_scores[dim] != null) out[dim] = r.dimension_scores[dim];
    }
  }

  // Fall back to the raw scores map
  if (r.scores) {
    const entries = r.scores instanceof Map
      ? Array.from(r.scores.entries())
      : Object.entries(r.scores);

    for (const [key, val] of entries) {
      const dim = canonicalDim(key);
      if (dim && out[dim] == null) {
        const pct = extractPct(val);
        if (pct != null) out[dim] = pct;
      }
    }
  }

  return out;
}

// ── Distribution ──────────────────────────────────────────────────────────────

/**
 * Compute dimension distribution — percentage of members in each score band.
 *
 * @param {Object[]} results – Array of normalised dimension maps
 * @returns {Object} { relational: { high, medium, low }, … }
 */
function computeDistribution(results) {
  const dist = {};
  const n = results.length;

  for (const dim of DIMENSIONS) {
    let high = 0, medium = 0, low = 0;

    for (const r of results) {
      const pct = r[dim];
      if (pct == null) continue;
      if (pct >= THRESHOLDS.high) high++;
      else if (pct >= THRESHOLDS.medium) medium++;
      else low++;
    }

    const safeN = n || 1;
    dist[dim] = {
      high:   Math.round((high   / safeN) * 100),
      medium: Math.round((medium / safeN) * 100),
      low:    Math.round((low    / safeN) * 100),
      label:  DIMENSION_LABELS[dim],
    };
  }

  return dist;
}

// ── Trend Analysis ────────────────────────────────────────────────────────────

/**
 * Compute trend by comparing the latest TeamResult (period='current') with
 * the previous one (period='previous').
 *
 * @param {string|ObjectId} orgId
 * @returns {Promise<Object>} { delta: { relational, … }, hasData: boolean }
 */
async function computeTrend(orgId) {
  const [current, previous] = await Promise.all([
    TeamResult.findOne({ organization_id: orgId, period: 'current'  }).lean(),
    TeamResult.findOne({ organization_id: orgId, period: 'previous' }).lean(),
  ]);

  if (!current || !previous) {
    return { hasData: false, delta: {} };
  }

  const delta = {};
  for (const dim of [...DIMENSIONS, 'overall']) {
    const cur  = (current.averages  || {})[dim];
    const prev = (previous.averages || {})[dim];
    if (cur != null && prev != null) {
      delta[dim] = Math.round((cur - prev) * 10) / 10;
    }
  }

  return {
    hasData:        true,
    current:        current.averages  || {},
    previous:       previous.averages || {},
    currentCount:   current.team_count  || 0,
    previousCount:  previous.team_count || 0,
    delta,
  };
}

// ── Risk Flagging ─────────────────────────────────────────────────────────────

/**
 * Identify result IDs and emails where overall score < threshold.
 *
 * @param {Object[]} results  – normalised dim maps with _id / email
 * @param {number}   threshold – default 40
 * @returns {Object[]} Flagged individuals (anonymised by default)
 */
function flagAtRisk(results, threshold = DEFAULT_RISK_THRESHOLD) {
  return results
    .filter((r) => r.overall != null && r.overall < threshold)
    .map((r) => ({
      id:      r._id,
      overall: r.overall,
      // Only expose the email domain for anonymisation
      emailDomain: r.email ? r.email.split('@')[1] || '' : '',
    }));
}

// ── Benchmark Comparison ──────────────────────────────────────────────────────

/**
 * Compare team averages against industry baselines.
 *
 * @param {Object} teamAverages – { relational, cognitive, … }
 * @param {Object} [baselines]  – override defaults
 * @returns {Object[]} Array of { dim, teamScore, baseline, delta, label }
 */
function computeBenchmarks(teamAverages, baselines = INDUSTRY_BASELINES) {
  return DIMENSIONS.map((dim) => {
    const teamScore = teamAverages[dim] || 0;
    const baseline  = baselines[dim] || 0;
    const delta     = Math.round((teamScore - baseline) * 10) / 10;

    return {
      dim,
      label:     DIMENSION_LABELS[dim],
      teamScore,
      baseline,
      delta,
      direction: delta >= 0 ? 'above' : 'below',
    };
  });
}

// ── Heatmap ───────────────────────────────────────────────────────────────────

/**
 * Build heatmap data: for each dimension return the average score and a
 * strength classification ('strong' | 'moderate' | 'weak').
 *
 * @param {Object} teamAverages
 * @returns {Object[]} Array of { dim, label, score, strength }
 */
function buildHeatmap(teamAverages) {
  return DIMENSIONS.map((dim) => {
    const score = teamAverages[dim] || 0;
    let strength;
    if (score >= THRESHOLDS.high) strength = 'strong';
    else if (score >= THRESHOLDS.medium) strength = 'moderate';
    else strength = 'weak';

    return { dim, label: DIMENSION_LABELS[dim], score, strength };
  });
}

// ── Master Compute ────────────────────────────────────────────────────────────

/**
 * Run all advanced analytics for an organization.
 *
 * @param {Object} org         – Mongoose Organization document (lean)
 * @param {Object} [options]
 * @param {number} [options.riskThreshold=40]
 * @param {Object} [options.baselines]
 * @returns {Promise<Object>}
 */
async function computeAdvancedAnalytics(org, options = {}) {
  const { riskThreshold = DEFAULT_RISK_THRESHOLD, baselines } = options;
  const resultIds = org.completedResultIds || [];

  const rawResults = await ResilienceResult.find({
    _id: { $in: resultIds },
  }).lean();

  const results = rawResults.map((r) => ({ ...normaliseDims(r), _id: r._id, email: r.email }));

  // Team averages
  const teamAverages = {};
  for (const dim of DIMENSIONS) {
    const vals = results.map((r) => r[dim]).filter((v) => v != null);
    teamAverages[dim] = vals.length
      ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10
      : 0;
  }
  const overallVals = results.map((r) => r.overall).filter((v) => v != null);
  teamAverages.overall = overallVals.length
    ? Math.round((overallVals.reduce((s, v) => s + v, 0) / overallVals.length) * 10) / 10
    : 0;

  const [trend] = await Promise.all([computeTrend(org._id)]);

  return {
    memberCount:   results.length,
    teamAverages,
    distribution:  computeDistribution(results),
    trend,
    atRisk:        flagAtRisk(results, riskThreshold),
    benchmarks:    computeBenchmarks(teamAverages, baselines),
    heatmap:       buildHeatmap(teamAverages),
    generatedAt:   new Date().toISOString(),
  };
}

module.exports = {
  computeAdvancedAnalytics,
  computeDistribution,
  computeTrend,
  flagAtRisk,
  computeBenchmarks,
  buildHeatmap,
  DIMENSIONS,
  DIMENSION_LABELS,
  INDUSTRY_BASELINES,
};
