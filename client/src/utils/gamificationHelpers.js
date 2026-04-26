/**
 * gamificationHelpers.js
 * XP calculations, level checks, and general gamification utilities.
 * All data is read from / written to localStorage.
 */

import { calculateLevel } from '../data/gamification/levels.js';

// ── localStorage keys ──────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  PROGRESS:        'iatlas_progress',
  STREAK:          'iatlas_streak',
  OVERALL_STREAK:  'iatlas_overall_streak',
  BADGES:          'iatlas_badges_earned',
  QUESTS:          'iatlas_active_quests',
  ACTIVITY:        'iatlas_activity_feed',
  LAST_ACTIVITY:   'iatlas_last_activity_date',
  REFLECTIONS:     'iatlas_reflections_completed',
};

const VALID_DIMENSION_KEYS = new Set([
  'agentic-generative', 'somatic-regulative', 'cognitive-narrative',
  'relational-connective', 'emotional-adaptive', 'spiritual-existential',
]);

// ── Safe localStorage helpers ──────────────────────────────────────────────────

export function loadJSON(key, fallback = {}) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail (storage quota, private mode, etc.)
  }
}

// ── Progress helpers ───────────────────────────────────────────────────────────

/** Load the full skill progress object (keyed by dimensionKey → skillId → {completedAt, xpEarned}) */
export function loadProgress() {
  return loadJSON(STORAGE_KEYS.PROGRESS, {});
}

/** Calculate total XP from progress */
export function computeTotalXP(progress) {
  let total = 0;
  for (const dimProgress of Object.values(progress)) {
    for (const skillData of Object.values(dimProgress)) {
      total += (skillData && typeof skillData === 'object' ? skillData.xpEarned || 0 : 0);
    }
  }
  return total;
}

/** Get skills completed count overall and per dimension */
export function computeSkillCounts(progress) {
  let total = 0;
  const byDimension = {};
  for (const [dimKey, dimProgress] of Object.entries(progress)) {
    if (!VALID_DIMENSION_KEYS.has(dimKey)) continue;
    const count = Object.keys(dimProgress).length;
    byDimension[dimKey] = count;
    total += count;
  }
  return { total, byDimension };
}

/** Get dimension-level breakdown (foundation/building/mastery completed per dimension) */
export function computeDimensionLevels(progress, allModulesByDimension) {
  const result = {};
  for (const dimKey of VALID_DIMENSION_KEYS) {
    const dimProgress = progress[dimKey] || {};
    const modules = allModulesByDimension[dimKey] || [];
    const completedIds = new Set(Object.keys(dimProgress));
    result[dimKey] = {
      foundation: modules.filter(m => m.level === 'foundation' && completedIds.has(m.id)).length,
      building:   modules.filter(m => m.level === 'building'   && completedIds.has(m.id)).length,
      mastery:    modules.filter(m => m.level === 'mastery'     && completedIds.has(m.id)).length,
    };
  }
  return result;
}

/** Full XP and level summary */
export function getXPSummary(progress) {
  const totalXP = computeTotalXP(progress);
  return { totalXP, ...calculateLevel(totalXP) };
}

// ── Streak helpers ─────────────────────────────────────────────────────────────

export function loadStreaks() {
  return loadJSON(STORAGE_KEYS.STREAK, {});
}

export function loadOverallStreak() {
  return loadJSON(STORAGE_KEYS.OVERALL_STREAK, { current: 0, longest: 0, lastDate: null });
}

export function saveOverallStreak(streakData) {
  saveJSON(STORAGE_KEYS.OVERALL_STREAK, streakData);
}

/**
 * Update the overall streak based on today's activity.
 * Returns the updated streak object.
 */
export function updateOverallStreak() {
  const streak = loadOverallStreak();
  const today = new Date().toDateString();
  if (streak.lastDate === today) return streak; // Already counted today
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const prev = { ...streak };
  if (streak.lastDate === yesterday) {
    streak.current += 1;
  } else {
    streak.current = 1;
  }
  streak.longest = Math.max(streak.longest, streak.current);
  streak.lastDate = today;
  saveOverallStreak(streak);
  return { updated: streak, prev };
}

// ── Activity feed helpers ──────────────────────────────────────────────────────

export function loadActivityFeed() {
  return loadJSON(STORAGE_KEYS.ACTIVITY, []);
}

export function addActivityEntry(entry) {
  const feed = loadActivityFeed();
  const newEntry = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    ...entry,
  };
  const updated = [newEntry, ...feed].slice(0, 50); // Keep last 50 entries
  saveJSON(STORAGE_KEYS.ACTIVITY, updated);
  return updated;
}

/** Format a timestamp as a relative "time ago" string */
export function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(isoString).toLocaleDateString();
}

// ── Badge helpers ──────────────────────────────────────────────────────────────

export function loadEarnedBadges() {
  return loadJSON(STORAGE_KEYS.BADGES, []);
}

export function saveEarnedBadge(badgeId) {
  const badges = loadEarnedBadges();
  if (badges.find(b => b.id === badgeId)) return false; // Already earned
  badges.push({ id: badgeId, earnedAt: new Date().toISOString() });
  saveJSON(STORAGE_KEYS.BADGES, badges);
  return true;
}

export function hasBadge(badgeId) {
  return loadEarnedBadges().some(b => b.id === badgeId);
}
