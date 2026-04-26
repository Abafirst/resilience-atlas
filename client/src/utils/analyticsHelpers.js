/**
 * analyticsHelpers.js
 *
 * Data aggregation and analytics utility functions for the IATLAS
 * Advanced Analytics Dashboard.
 *
 * Works with:
 *  - Child profiles from ProfileContext / API
 *  - Kids progress data from localStorage (kidsProgressHelpers)
 *  - ABA protocol data from abaProtocols.js
 */

import { loadKidsJSON, KIDS_STORAGE_KEYS } from './kidsProgressHelpers.js';

// ── Date range helpers ────────────────────────────────────────────────────────

export const DATE_RANGE_OPTIONS = [
  { value: '7d',     label: 'Last 7 days' },
  { value: '30d',    label: 'Last 30 days' },
  { value: '90d',    label: 'Last 90 days' },
  { value: '1y',     label: 'Last year' },
  { value: 'custom', label: 'Custom range' },
];

/**
 * Returns a Date object `n` days before today.
 */
export function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Converts a date-range option key to a start Date.
 */
export function rangeToStartDate(rangeKey) {
  switch (rangeKey) {
    case '7d':  return daysAgo(7);
    case '30d': return daysAgo(30);
    case '90d': return daysAgo(90);
    case '1y':  return daysAgo(365);
    default:    return daysAgo(30);
  }
}

/**
 * Format a Date as 'MMM D'
 */
export function formatShortDate(date) {
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Format a Date as 'MMM YYYY'
 */
export function formatMonthYear(date) {
  return new Date(date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

// ── Profile-namespaced storage key builder ────────────────────────────────────

export function getProfileProgressKey(profileId) {
  if (!profileId) return KIDS_STORAGE_KEYS.PROGRESS;
  return `iatlas_progress_${profileId}_progress`;
}

export function getProfileStarsKey(profileId) {
  if (!profileId) return KIDS_STORAGE_KEYS.STARS;
  return `iatlas_progress_${profileId}_stars`;
}

// ── Activity / progress aggregation ──────────────────────────────────────────

/**
 * Load all completed activity records for a child profile.
 * Returns: { [activityId]: { completedAt, stars, dimension, ... } }
 */
export function loadProfileProgress(profileId) {
  const key = getProfileProgressKey(profileId);
  return loadKidsJSON(key, {});
}

/**
 * Get all completed activities for a profile within a date range.
 * @param {string} profileId
 * @param {Date}   startDate
 * @param {Date}   endDate
 * @returns {Array<{ id, completedAt, dimension, stars }>}
 */
export function getActivitiesInRange(profileId, startDate, endDate = new Date()) {
  const progress = loadProfileProgress(profileId);
  const results  = [];

  for (const [id, record] of Object.entries(progress)) {
    if (!record?.completedAt) continue;
    try {
      const d = new Date(record.completedAt);
      if (d >= startDate && d <= endDate) {
        // Derive dimension from activityId pattern: "age-5-7/slug" or "dim/slug"
        const dim = extractDimensionFromId(id);
        results.push({ id, completedAt: d, dimension: dim, stars: record.stars || 0 });
      }
    } catch {
      // skip malformed dates
    }
  }

  return results.sort((a, b) => a.completedAt - b.completedAt);
}

/**
 * Extract the resilience dimension from an activity ID (heuristic).
 * Activity IDs may encode age groups or dimension names.
 */
function extractDimensionFromId(id) {
  const DIMENSIONS = [
    'agentic-generative',
    'relational-attunement',
    'somatic-nervous',
    'cognitive-flexibility',
    'emotional-regulation',
    'spiritual-existential',
  ];
  const lower = id.toLowerCase();
  for (const dim of DIMENSIONS) {
    if (lower.includes(dim.replace(/-/g, ''))) return dim;
  }
  // Fall back to first path segment
  const segment = id.split('/')[0];
  return segment || 'general';
}

// ── Skill dimension labels ────────────────────────────────────────────────────

export const DIMENSION_LABELS = {
  'agentic-generative':    'Agentic',
  'relational-attunement': 'Relational',
  'somatic-nervous':       'Somatic',
  'cognitive-flexibility': 'Cognitive',
  'emotional-regulation':  'Emotional',
  'spiritual-existential': 'Spiritual',
  'general':               'General',
};

export const DIMENSION_COLORS = {
  'agentic-generative':    '#6366f1',
  'relational-attunement': '#10b981',
  'somatic-nervous':       '#f59e0b',
  'cognitive-flexibility': '#3b82f6',
  'emotional-regulation':  '#ef4444',
  'spiritual-existential': '#8b5cf6',
  'general':               '#6b7280',
};

// ── Trend line builders ───────────────────────────────────────────────────────

/**
 * Build a weekly engagement series (count of activities per week) for one profile.
 * Returns: Array<{ week: 'MMM D', count: number }>
 */
export function buildWeeklyEngagementSeries(profileId, startDate, endDate = new Date()) {
  const activities = getActivitiesInRange(profileId, startDate, endDate);
  const buckets = {};

  for (const act of activities) {
    const weekStart = getWeekStart(act.completedAt);
    const key       = formatShortDate(weekStart);
    buckets[key]    = (buckets[key] || 0) + 1;
  }

  // Fill gaps so the chart is continuous
  const series = [];
  const cursor = new Date(getWeekStart(startDate));
  while (cursor <= endDate) {
    const key = formatShortDate(cursor);
    series.push({ week: key, count: buckets[key] || 0 });
    cursor.setDate(cursor.getDate() + 7);
  }
  return series;
}

/**
 * Build a cumulative skill mastery series per dimension for one profile.
 * Returns: Array<{ week, [dimension]: count, ... }>
 */
export function buildSkillMasterySeries(profileId, startDate, endDate = new Date()) {
  const activities = getActivitiesInRange(profileId, startDate, endDate);

  const buckets = {};
  for (const act of activities) {
    const weekStart = getWeekStart(act.completedAt);
    const key       = formatShortDate(weekStart);
    if (!buckets[key]) buckets[key] = {};
    const dim = DIMENSION_LABELS[act.dimension] || act.dimension;
    buckets[key][dim] = (buckets[key][dim] || 0) + 1;
  }

  const series = [];
  const cursor = new Date(getWeekStart(startDate));
  while (cursor <= endDate) {
    const key  = formatShortDate(cursor);
    series.push({ week: key, ...(buckets[key] || {}) });
    cursor.setDate(cursor.getDate() + 7);
  }
  return series;
}

/**
 * Build radar chart data for a single profile — one entry per dimension.
 * Returns: Array<{ subject: string, value: number, fullMark: number }>
 */
export function buildRadarData(profileId, startDate, endDate = new Date()) {
  const activities = getActivitiesInRange(profileId, startDate, endDate);
  const counts     = {};

  for (const act of activities) {
    const dim = DIMENSION_LABELS[act.dimension] || act.dimension;
    counts[dim] = (counts[dim] || 0) + 1;
  }

  const allDims = Object.values(DIMENSION_LABELS);
  const maxVal  = Math.max(10, ...Object.values(counts));

  return allDims
    .filter(d => d !== 'General')
    .map(d => ({ subject: d, value: counts[d] || 0, fullMark: maxVal }));
}

// ── Overview metrics ──────────────────────────────────────────────────────────

/**
 * Compute high-level overview metrics across all profiles.
 *
 * @param {Array} profiles   Array of ChildProfile objects from ProfileContext
 * @param {string} rangeKey  e.g. '30d'
 * @returns {Object}
 */
export function computeOverviewMetrics(profiles, rangeKey = '30d') {
  const startDate = rangeToStartDate(rangeKey);
  let totalActivities   = 0;
  let totalStars        = 0;
  let activeFamilies    = 0;
  let activeChildren    = 0;

  for (const profile of profiles) {
    const acts = getActivitiesInRange(profile.id, startDate);
    if (acts.length > 0) {
      activeChildren++;
      activeFamilies++; // treat each profile as a family member for now
    }
    totalActivities += acts.length;
    totalStars      += acts.reduce((sum, a) => sum + (a.stars || 0), 0);
  }

  return {
    totalFamilies:    profiles.length,
    activeChildren,
    activeFamilies,
    totalActivities,
    totalStars,
    averageActivitiesPerChild: profiles.length
      ? Math.round(totalActivities / profiles.length)
      : 0,
  };
}

/**
 * Build an engagement trend series aggregated across all profiles.
 * Returns: Array<{ week: string, count: number }>
 */
export function buildOverallEngagementSeries(profiles, rangeKey = '30d') {
  const startDate = rangeToStartDate(rangeKey);

  const combined = {};
  for (const profile of profiles) {
    const series = buildWeeklyEngagementSeries(profile.id, startDate);
    for (const pt of series) {
      combined[pt.week] = (combined[pt.week] || 0) + pt.count;
    }
  }

  // Rebuild ordered series
  const startCursor = new Date(getWeekStart(startDate));
  const endDate     = new Date();
  const result      = [];
  while (startCursor <= endDate) {
    const key = formatShortDate(startCursor);
    result.push({ week: key, Activities: combined[key] || 0 });
    startCursor.setDate(startCursor.getDate() + 7);
  }
  return result;
}

// ── Skill development analytics ───────────────────────────────────────────────

/**
 * Compute dimension breakdown (count per dimension) for a profile.
 * Returns: Array<{ dimension: string, count: number, color: string }>
 */
export function buildDimensionBreakdown(profileId, rangeKey = '90d') {
  const startDate  = rangeToStartDate(rangeKey);
  const activities = getActivitiesInRange(profileId, startDate);
  const counts     = {};

  for (const act of activities) {
    const label = DIMENSION_LABELS[act.dimension] || act.dimension;
    counts[label] = (counts[label] || 0) + 1;
  }

  return Object.entries(counts).map(([dim, count]) => {
    const key   = Object.keys(DIMENSION_LABELS).find(k => DIMENSION_LABELS[k] === dim) || dim;
    return { dimension: dim, count, color: DIMENSION_COLORS[key] || '#6b7280' };
  }).sort((a, b) => b.count - a.count);
}

/**
 * Calculate learning velocity — activities per week averaged.
 * @returns {number}
 */
export function calculateLearningVelocity(profileId, rangeKey = '30d') {
  const startDate  = rangeToStartDate(rangeKey);
  const activities = getActivitiesInRange(profileId, startDate);
  const weeks      = Math.max(1, Math.ceil(
    (new Date() - startDate) / (7 * 24 * 60 * 60 * 1000),
  ));
  return parseFloat((activities.length / weeks).toFixed(1));
}

// ── Comparative analytics ─────────────────────────────────────────────────────

/**
 * Build grouped bar chart data comparing all profiles across dimensions.
 * Returns: Array<{ dimension: string, [childName]: count, ... }>
 */
export function buildComparativeDimensionData(profiles, rangeKey = '90d') {
  const startDate = rangeToStartDate(rangeKey);
  const dims      = Object.values(DIMENSION_LABELS).filter(d => d !== 'General');

  return dims.map(dim => {
    const entry = { dimension: dim };
    for (const profile of profiles) {
      const acts = getActivitiesInRange(profile.id, startDate);
      entry[profile.name] = acts.filter(
        a => DIMENSION_LABELS[a.dimension] === dim || a.dimension === dim,
      ).length;
    }
    return entry;
  });
}

/**
 * Build multi-line progress data with one series per profile.
 * Returns: Array<{ week: string, [childName]: count, ... }>
 */
export function buildMultiChildProgressSeries(profiles, rangeKey = '90d') {
  const startDate = rangeToStartDate(rangeKey);
  const allWeeks  = new Set();

  const profileSeries = profiles.map(profile => {
    const series = buildWeeklyEngagementSeries(profile.id, startDate);
    series.forEach(pt => allWeeks.add(pt.week));
    return { name: profile.name, series };
  });

  const sortedWeeks = [...allWeeks].sort();

  return sortedWeeks.map(week => {
    const entry = { week };
    for (const { name, series } of profileSeries) {
      const pt = series.find(p => p.week === week);
      entry[name] = pt ? pt.count : 0;
    }
    return entry;
  });
}

// ── Protocol completion stats ─────────────────────────────────────────────────

/**
 * Compute protocol completion data for display.
 * Returns an array of objects suitable for a pie chart.
 */
export function buildProtocolCompletionData(profiles) {
  let completed = 0;
  let active    = 0;

  for (const profile of profiles) {
    const progress = loadProfileProgress(profile.id);
    const entries  = Object.keys(progress);
    if (entries.length > 0) active++;
    completed += Object.values(progress).filter(r => r?.stars >= 3).length;
  }

  const total = completed + active;
  return [
    { name: 'Completed (★★★)', value: completed, color: '#10b981' },
    { name: 'In Progress',     value: Math.max(0, active),    color: '#6366f1' },
    { name: 'Not Started',     value: Math.max(0, total === 0 ? 3 : 0), color: '#e2e8f0' },
  ].filter(d => d.value > 0);
}

// ── Sample / demo data (shown when no real data exists) ───────────────────────

export function generateSampleEngagementData(weeks = 8) {
  const data = [];
  const now  = new Date();
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    data.push({
      week:       formatShortDate(d),
      Activities: Math.floor(Math.random() * 8) + 2,
    });
  }
  return data;
}

export function generateSampleRadarData() {
  const dims = ['Agentic', 'Relational', 'Somatic', 'Cognitive', 'Emotional', 'Spiritual'];
  return dims.map(d => ({
    subject:  d,
    value:    Math.floor(Math.random() * 8) + 2,
    fullMark: 12,
  }));
}

export function generateSampleProgressData(names = ['Child A', 'Child B'], weeks = 8) {
  const data = [];
  const now  = new Date();
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const entry = { week: formatShortDate(d) };
    for (const name of names) {
      entry[name] = Math.floor(Math.random() * 6) + 1;
    }
    data.push(entry);
  }
  return data;
}

export function generateSampleDimensionData(names = ['Child A', 'Child B']) {
  const dims = ['Agentic', 'Relational', 'Somatic', 'Cognitive', 'Emotional', 'Spiritual'];
  return dims.map(dim => {
    const entry = { dimension: dim };
    for (const name of names) {
      entry[name] = Math.floor(Math.random() * 10) + 1;
    }
    return entry;
  });
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}
