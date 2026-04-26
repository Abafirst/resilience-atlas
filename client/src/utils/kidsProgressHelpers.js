/**
 * kidsProgressHelpers.js
 * Utility functions for the IATLAS Kids gamification system.
 * All persistence uses localStorage.
 */

import { KIDS_ACTIVITIES } from '../data/kidsActivities.js';
import { STAR_RULES, calculateKidsLevel } from '../data/kidsGamification.js';

// ── Storage keys ───────────────────────────────────────────────────────────────

export const KIDS_STORAGE_KEYS = {
  PROGRESS:       'iatlas_kids_progress',
  STARS:          'iatlas_kids_stars',
  BADGES:         'iatlas_kids_badges',
  LEVEL:          'iatlas_kids_level',
  CERTIFICATES:   'iatlas_kids_certificates',
  STREAKS:        'iatlas_kids_streaks',
  PARENT_NOTES:   'iatlas_kids_parent_notes',
  ADVENTURES:     'iatlas_kids_adventures',
};

// ── Safe localStorage helpers ─────────────────────────────────────────────────

export function loadKidsJSON(key, fallback = {}) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveKidsJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail (storage quota, private mode, etc.)
  }
}

// ── Activity ID helpers ───────────────────────────────────────────────────────

/**
 * Generate a consistent slug ID for an activity.
 * @param {string} ageGroup  e.g. 'age-5-7'
 * @param {string} title     Activity title
 * @returns {string}
 */
export function makeActivityId(ageGroup, title) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${ageGroup}/${slug}`;
}

// ── Progress load/save ────────────────────────────────────────────────────────

/**
 * Load all completed activity records.
 * Schema: { [activityId]: ActivityCompletionRecord }
 *
 * ActivityCompletionRecord:
 *   activityId, dimension, ageGroup, completedAt, starsEarned,
 *   parentNote?, attemptNumber, selfRating?
 */
export function loadKidsProgress() {
  return loadKidsJSON(KIDS_STORAGE_KEYS.PROGRESS, {});
}

/**
 * Record an activity completion and award stars.
 * Returns the number of stars awarded.
 * @param {object} record - ActivityCompletionRecord fields
 */
export function recordActivityCompletion(record) {
  const progress = loadKidsProgress();

  // Determine stars (3 for complete, 1 for partial)
  const isComplete = record.complete !== false;
  const baseStars  = isComplete ? STAR_RULES.COMPLETE_ACTIVITY : STAR_RULES.PARTIAL_ACTIVITY;

  const id = record.activityId || makeActivityId(record.ageGroup, record.title || '');
  const attempt = (progress[id]?.attemptNumber || 0) + 1;

  const entry = {
    activityId:    id,
    dimension:     normalizeDimensionKey(record.dimension || ''),
    ageGroup:      record.ageGroup,
    completedAt:   record.completedAt || new Date().toISOString(),
    starsEarned:   baseStars,
    attemptNumber: attempt,
    ...(record.parentNote  ? { parentNote:  record.parentNote  } : {}),
    ...(record.selfRating  ? { selfRating:  record.selfRating  } : {}),
    complete:      isComplete,
  };

  progress[id] = entry;
  saveKidsJSON(KIDS_STORAGE_KEYS.PROGRESS, progress);

  // Update total stars
  const newTotalStars = addKidsStars(baseStars);

  // Check if dimension is now complete and award bonus
  const dimComplete = checkDimensionComplete(progress, record.ageGroup, entry.dimension);
  let extraStars = 0;
  if (dimComplete) {
    extraStars = STAR_RULES.COMPLETE_DIMENSION;
    addKidsStars(extraStars);
  }

  return { starsEarned: baseStars, extraStars, totalStars: newTotalStars + extraStars, dimComplete };
}

// ── Stars ─────────────────────────────────────────────────────────────────────

/** Load total stars */
export function loadKidsStars() {
  return loadKidsJSON(KIDS_STORAGE_KEYS.STARS, { total: 0, byDimension: {} });
}

/** Add stars and persist. Returns new total. */
export function addKidsStars(amount) {
  const current = loadKidsStars();
  const updated = { ...current, total: (current.total || 0) + amount };
  saveKidsJSON(KIDS_STORAGE_KEYS.STARS, updated);
  return updated.total;
}

/** Calculate total stars from the persisted store */
export function getTotalKidsStars() {
  return loadKidsStars().total || 0;
}

// ── Level ─────────────────────────────────────────────────────────────────────

/** Get current level info */
export function getKidsLevelInfo() {
  return calculateKidsLevel(getTotalKidsStars());
}

// ── Dimension progress ────────────────────────────────────────────────────────

/**
 * Normalize a dimension label to a lowercase key.
 * e.g. 'Emotional-Adaptive' → 'emotional-adaptive'
 */
export function normalizeDimensionKey(dim) {
  if (!dim) return '';
  // Handle 'Spiritual-Reflective' vs 'Spiritual-Existential' alias
  const normalized = dim.toLowerCase().replace(/\s+/g, '-');
  if (normalized === 'spiritual-existential') return 'spiritual-reflective';
  return normalized;
}

/**
 * Count activities completed per dimension per age group.
 * Returns: { [ageGroup]: { [dimensionKey]: number } }
 */
export function getDimensionProgressCounts(progress) {
  const counts = {};
  for (const record of Object.values(progress)) {
    if (!record.ageGroup || !record.dimension) continue;
    if (!counts[record.ageGroup]) counts[record.ageGroup] = {};
    const dim = record.dimension;
    counts[record.ageGroup][dim] = (counts[record.ageGroup][dim] || 0) + 1;
  }
  return counts;
}

/**
 * Count total activities available per dimension per age group from KIDS_ACTIVITIES.
 * Returns: { [ageGroup]: { [dimensionKey]: number } }
 */
export function getTotalActivitiesByDimension() {
  const totals = {};
  for (const [ageGroup, activities] of Object.entries(KIDS_ACTIVITIES)) {
    totals[ageGroup] = {};
    for (const act of activities) {
      const dimKey = normalizeDimensionKey(act.dimension);
      if (!dimKey) continue;
      totals[ageGroup][dimKey] = (totals[ageGroup][dimKey] || 0) + 1;
    }
  }
  return totals;
}

/**
 * Total activities per age group.
 */
export function getTotalActivitiesPerAgeGroup() {
  const result = {};
  for (const [ageGroup, activities] of Object.entries(KIDS_ACTIVITIES)) {
    result[ageGroup] = activities.length;
  }
  return result;
}

/**
 * Count completed activities per age group.
 */
export function getCompletedCountPerAgeGroup(progress) {
  const counts = {};
  for (const record of Object.values(progress)) {
    if (!record.ageGroup) continue;
    counts[record.ageGroup] = (counts[record.ageGroup] || 0) + 1;
  }
  return counts;
}

/**
 * Check whether all activities in a dimension (for a given age group) are complete.
 */
export function checkDimensionComplete(progress, ageGroup, dimensionKey) {
  const dimKey = normalizeDimensionKey(dimensionKey);
  const activities = (KIDS_ACTIVITIES[ageGroup] || []).filter(
    a => normalizeDimensionKey(a.dimension) === dimKey
  );
  if (activities.length === 0) return false;

  const completed = Object.values(progress).filter(
    r => r.ageGroup === ageGroup && r.dimension === dimKey
  );
  return completed.length >= activities.length;
}

/**
 * Check whether all activities in an age group are complete.
 */
export function checkAgeGroupComplete(progress, ageGroup) {
  const totalActivities = (KIDS_ACTIVITIES[ageGroup] || []).length;
  if (totalActivities === 0) return false;
  const completed = Object.values(progress).filter(r => r.ageGroup === ageGroup);
  return completed.length >= totalActivities;
}

/**
 * Get all dimensions that have been tried (at least 1 activity).
 */
export function getTriedDimensions(progress) {
  const tried = new Set();
  for (const record of Object.values(progress)) {
    if (record.dimension) tried.add(record.dimension);
  }
  return tried;
}

/**
 * Get summary stats.
 */
export function getKidsStats(progress) {
  const totalCompleted  = Object.keys(progress).length;
  const totalStars      = getTotalKidsStars();
  const levelInfo       = calculateKidsLevel(totalStars);
  const triedDimensions = getTriedDimensions(progress);

  return {
    totalCompleted,
    totalStars,
    levelInfo,
    triedDimensions: [...triedDimensions],
    dimensionCount:  triedDimensions.size,
  };
}
