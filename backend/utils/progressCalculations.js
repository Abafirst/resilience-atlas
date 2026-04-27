'use strict';

/**
 * progressCalculations.js — Utility functions for IATLAS progress analytics.
 *
 * All functions are pure (no side-effects) and work with plain objects so they
 * can be tested in isolation without a database connection.
 */

// ── Constants ─────────────────────────────────────────────────────────────────

const DIMENSION_KEYS = [
  'agenticGenerative',
  'relationalConnective',
  'somaticRegulative',
  'cognitiveNarrative',
  'emotionalAdaptive',
  'spiritualExistential',
];

// ── Progress calculations ─────────────────────────────────────────────────────

/**
 * Calculate the average improvement across all 6 resilience dimensions
 * between a baseline snapshot and a current snapshot.
 *
 * @param {Object} baselineScores  — dimension scores at baseline (0–100 per key)
 * @param {Object} currentScores   — dimension scores now (0–100 per key)
 * @returns {number} average improvement in points (negative = decline)
 */
function calculateOverallProgress(baselineScores, currentScores) {
  if (!baselineScores || !currentScores) return 0;

  const improvements = DIMENSION_KEYS.map(
    dim => (currentScores[dim] || 0) - (baselineScores[dim] || 0)
  );

  const avg = improvements.reduce((sum, val) => sum + val, 0) / improvements.length;
  return Math.round(avg);
}

/**
 * Determine whether a client's progress is improving, stable, or declining
 * by comparing the average overall_score of the recent half of snapshots
 * against the older half.
 *
 * @param {Array<{snapshotDate: string|Date, overallScore: number}>} snapshots
 * @returns {'improving'|'stable'|'declining'}
 */
function calculateProgressTrend(snapshots) {
  if (!Array.isArray(snapshots) || snapshots.length < 2) return 'stable';

  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime()
  );

  const mid        = Math.floor(sorted.length / 2);
  const olderHalf  = sorted.slice(0, mid);
  const recentHalf = sorted.slice(mid);

  const avg = arr =>
    arr.reduce((sum, s) => sum + (s.overallScore || 0), 0) / arr.length;

  const diff = avg(recentHalf) - avg(olderHalf);

  if (diff > 5)  return 'improving';
  if (diff < -5) return 'declining';
  return 'stable';
}

/**
 * Auto-calculate an overall score (0–100) as the simple mean of all provided
 * dimension scores.
 *
 * @param {Object} dimensionScores
 * @returns {number}
 */
function calculateOverallScore(dimensionScores) {
  if (!dimensionScores) return 0;

  const values = DIMENSION_KEYS.map(k => dimensionScores[k] || 0);
  const sum    = values.reduce((a, b) => a + b, 0);
  return Math.round(sum / values.length);
}

/**
 * Calculate how many sessions fall within each week bucket over the last
 * `rangeInDays` days, returning sessions-per-week and a consistency score.
 *
 * @param {Date[]} sessionDates   — array of session Date objects
 * @param {number} rangeInDays   — look-back window (e.g. 30, 60, 90)
 * @returns {{ sessionsPerWeek: number, consistency: number }}
 *          consistency is 0–100 where 100 = perfectly uniform frequency
 */
function calculateSessionFrequency(sessionDates, rangeInDays) {
  if (!Array.isArray(sessionDates) || sessionDates.length === 0) {
    return { sessionsPerWeek: 0, consistency: 100 };
  }

  const now        = Date.now();
  const cutoff     = now - rangeInDays * 24 * 60 * 60 * 1000;
  const recent     = sessionDates.filter(d => new Date(d).getTime() >= cutoff);

  const weeks          = rangeInDays / 7;
  const sessionsPerWeek = recent.length / weeks;

  // Bucket sessions by completed weeks ago (0 = current week).
  const weekCount = Math.ceil(weeks);
  const buckets   = Array(weekCount).fill(0);
  recent.forEach(date => {
    const idx = Math.floor((now - new Date(date).getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (idx >= 0 && idx < buckets.length) {
      buckets[idx]++;
    }
  });

  const variance = buckets.reduce(
    (sum, count) => sum + Math.pow(count - sessionsPerWeek, 2),
    0
  ) / buckets.length;

  const consistency = Math.max(0, Math.min(100, Math.round(100 - variance * 10)));

  return { sessionsPerWeek: Math.round(sessionsPerWeek * 100) / 100, consistency };
}

/**
 * Build time-series data points for a given metric over a date range.
 *
 * @param {Array<{snapshotDate: string|Date, overallScore: number, dimensionScores: object}>} snapshots
 * @param {string} granularity — 'daily' | 'weekly' | 'monthly'
 * @returns {Array<{date: string, value: number}>}
 */
function buildTimelineDataPoints(snapshots, granularity = 'monthly') {
  if (!Array.isArray(snapshots) || snapshots.length === 0) return [];

  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime()
  );

  // Group by period key.
  const groups = {};
  sorted.forEach(snap => {
    const d   = new Date(snap.snapshotDate);
    let key;
    if (granularity === 'daily') {
      key = d.toISOString().slice(0, 10);
    } else if (granularity === 'weekly') {
      // ISO week: Monday of the week.
      const day   = d.getDay() || 7;
      const monday = new Date(d);
      monday.setDate(d.getDate() - day + 1);
      key = monday.toISOString().slice(0, 10);
    } else {
      // Monthly.
      key = d.toISOString().slice(0, 7); // YYYY-MM
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(snap.overallScore || 0);
  });

  return Object.entries(groups).map(([date, values]) => ({
    date,
    value: Math.round(values.reduce((s, v) => s + v, 0) / values.length),
  }));
}

/**
 * Compute per-dimension change objects comparing baseline to current scores.
 *
 * @param {Object} baselineScores
 * @param {Object} currentScores
 * @returns {Array<{dimension: string, baseline: number, current: number, change: number}>}
 */
function buildDimensionChanges(baselineScores, currentScores) {
  return DIMENSION_KEYS.map(dim => ({
    dimension: dim,
    baseline:  baselineScores ? (baselineScores[dim] || 0) : 0,
    current:   currentScores  ? (currentScores[dim]  || 0) : 0,
    change:    (currentScores  ? (currentScores[dim]  || 0) : 0) -
               (baselineScores ? (baselineScores[dim] || 0) : 0),
  }));
}

// ── Date range helpers ────────────────────────────────────────────────────────

/**
 * Convert a date-range label to a concrete cut-off Date.
 *
 * @param {'7_days'|'30_days'|'90_days'|'6_months'|'1_year'|'all_time'} range
 * @returns {Date|null}  null means "no lower bound" (all_time)
 */
function dateRangeToCutoff(range) {
  const now = new Date();
  switch (range) {
    case '7_days':    { const d = new Date(now); d.setDate(d.getDate() - 7);        return d; }
    case '30_days':   { const d = new Date(now); d.setDate(d.getDate() - 30);       return d; }
    case '90_days':   { const d = new Date(now); d.setDate(d.getDate() - 90);       return d; }
    case '6_months':  { const d = new Date(now); d.setMonth(d.getMonth() - 6);      return d; }
    case '1_year':    { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d; }
    case 'all_time':
    default:          return null;
  }
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  DIMENSION_KEYS,
  calculateOverallProgress,
  calculateProgressTrend,
  calculateOverallScore,
  calculateSessionFrequency,
  buildTimelineDataPoints,
  buildDimensionChanges,
  dateRangeToCutoff,
};
