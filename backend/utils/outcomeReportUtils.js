'use strict';

/**
 * outcomeReportUtils.js — Pure utility functions for the Outcome Report feature.
 *
 * All functions are side-effect free so they can be unit-tested without a
 * database connection.
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

const DIMENSION_LABELS = {
  agenticGenerative:    'Agentic-Generative',
  relationalConnective: 'Relational-Connective',
  somaticRegulative:    'Somatic-Regulative',
  cognitiveNarrative:   'Cognitive-Interpretive',
  emotionalAdaptive:    'Emotional-Adaptive',
  spiritualExistential: 'Spiritual-Existential',
};

// Session counts that trigger automatic milestone reports.
const MILESTONE_SESSION_COUNTS = [10, 20, 50, 100];

// ── Dimension progress ────────────────────────────────────────────────────────

/**
 * Compute baseline scores as the average of the first `n` snapshots
 * (sorted ascending by date).
 *
 * @param {Array<{dimensionScores: object, snapshotDate: Date|string}>} snapshots
 * @param {number} n — how many snapshots form the baseline window (default: 3)
 * @returns {object} per-dimension average scores
 */
function computeBaselineScores(snapshots, n = 3) {
  if (!Array.isArray(snapshots) || snapshots.length === 0) {
    return Object.fromEntries(DIMENSION_KEYS.map(k => [k, 0]));
  }

  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime()
  );
  const window = sorted.slice(0, n);
  return _averageDimensionScores(window);
}

/**
 * Compute current scores as the average of the last `n` snapshots
 * (sorted ascending by date, then take tail).
 *
 * @param {Array<{dimensionScores: object, snapshotDate: Date|string}>} snapshots
 * @param {number} n
 * @returns {object}
 */
function computeCurrentScores(snapshots, n = 3) {
  if (!Array.isArray(snapshots) || snapshots.length === 0) {
    return Object.fromEntries(DIMENSION_KEYS.map(k => [k, 0]));
  }

  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime()
  );
  const window = sorted.slice(-n);
  return _averageDimensionScores(window);
}

/**
 * Average dimension scores across an array of snapshots.
 *
 * @param {Array<{dimensionScores: object}>} snapshotWindow
 * @returns {object}
 */
function _averageDimensionScores(snapshotWindow) {
  if (!snapshotWindow || snapshotWindow.length === 0) {
    return Object.fromEntries(DIMENSION_KEYS.map(k => [k, 0]));
  }

  const sums = Object.fromEntries(DIMENSION_KEYS.map(k => [k, 0]));
  snapshotWindow.forEach(snap => {
    const ds = snap.dimensionScores || {};
    DIMENSION_KEYS.forEach(k => {
      sums[k] += (typeof ds[k] === 'number' ? ds[k] : 0);
    });
  });

  return Object.fromEntries(
    DIMENSION_KEYS.map(k => [k, Math.round(sums[k] / snapshotWindow.length)])
  );
}

/**
 * Build a per-dimension progress array comparing baseline to current scores.
 *
 * @param {object} baselineScores
 * @param {object} currentScores
 * @returns {Array<{dimension: string, label: string, baseline: number, current: number, change: number, pctChange: number}>}
 */
function buildDimensionProgress(baselineScores, currentScores) {
  return DIMENSION_KEYS.map(dim => {
    const baseline  = (baselineScores && typeof baselineScores[dim] === 'number') ? baselineScores[dim] : 0;
    const current   = (currentScores  && typeof currentScores[dim]  === 'number') ? currentScores[dim]  : 0;
    const change    = current - baseline;
    const pctChange = baseline > 0 ? Math.round((change / baseline) * 100) : 0;
    return { dimension: dim, label: DIMENSION_LABELS[dim] || dim, baseline, current, change, pctChange };
  });
}

// ── Goal achievement ──────────────────────────────────────────────────────────

/**
 * Count goals by status from a ClientProfile.clinicalGoals array.
 *
 * @param {Array<{status: string}>} goals
 * @returns {{ achieved: number, inProgress: number, total: number }}
 */
function countGoalsByStatus(goals) {
  if (!Array.isArray(goals)) return { achieved: 0, inProgress: 0, total: 0 };

  let achieved   = 0;
  let inProgress = 0;

  goals.forEach(g => {
    if (g.status === 'achieved')                     achieved++;
    else if (g.status === 'active' || g.status === 'in-progress') inProgress++;
  });

  return { achieved, inProgress, total: goals.length };
}

// ── Session activity highlights ───────────────────────────────────────────────

/**
 * Identify the most-used activities from an array of session notes,
 * sorted by usage count descending.
 *
 * @param {Array<{activities?: Array<{activityId: string, category?: string}>}>} sessionNotes
 * @param {number} limit — max activities to return (default: 5)
 * @returns {Array<{activityId: string, count: number}>}
 */
function topActivities(sessionNotes, limit = 5) {
  if (!Array.isArray(sessionNotes)) return [];

  const counts = {};
  sessionNotes.forEach(note => {
    (note.activities || []).forEach(act => {
      if (!act.activityId) return;
      counts[act.activityId] = (counts[act.activityId] || 0) + 1;
    });
  });

  return Object.entries(counts)
    .map(([activityId, count]) => ({ activityId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ── Milestone trigger detection ───────────────────────────────────────────────

/**
 * Returns true when the given session count is an automated milestone that
 * should trigger report generation (10, 20, 50, 100).
 *
 * @param {number} totalSessions
 * @returns {boolean}
 */
function isMilestoneTrigger(totalSessions) {
  return MILESTONE_SESSION_COUNTS.includes(totalSessions);
}

// ── Report narrative helpers ──────────────────────────────────────────────────

/**
 * Generate a one-line narrative summary for a dimension's progress.
 *
 * @param {{ label: string, change: number, pctChange: number }} dimProgress
 * @returns {string}
 */
function dimensionNarrative(dimProgress) {
  const { label, change, pctChange } = dimProgress;
  if (change > 0) return `${label} improved by ${change} points (+${pctChange}%).`;
  if (change < 0) return `${label} declined by ${Math.abs(change)} points (${pctChange}%).`;
  return `${label} remained stable (no change).`;
}

/**
 * Return a colour indicator string for a dimension change value.
 *
 * @param {number} change
 * @returns {'green'|'yellow'|'red'}
 */
function changeColour(change) {
  if (change > 0) return 'green';
  if (change < 0) return 'red';
  return 'yellow';
}

// ── Period helpers ────────────────────────────────────────────────────────────

/**
 * Format a Date as "Month D, YYYY" (US locale).
 *
 * @param {Date|string|null} d
 * @returns {string}
 */
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  DIMENSION_KEYS,
  DIMENSION_LABELS,
  MILESTONE_SESSION_COUNTS,
  computeBaselineScores,
  computeCurrentScores,
  buildDimensionProgress,
  countGoalsByStatus,
  topActivities,
  isMilestoneTrigger,
  dimensionNarrative,
  changeColour,
  formatDate,
};
