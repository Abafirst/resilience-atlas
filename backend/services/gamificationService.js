'use strict';

/**
 * gamificationService.js
 *
 * Core logic for the gamification system:
 *   - Recording practice completions (streak + points)
 *   - Awarding badges
 *   - Managing weekly challenges
 *   - Leaderboard queries
 *   - IARF XP levels and dimensional streak tracking
 */

const GamificationProgress = require('../models/GamificationProgress');
const logger = require('../utils/logger');

// ── Constants ─────────────────────────────────────────────────────────────────

const POINTS = {
  PRACTICE_COMPLETE:   1,
  STREAK_MAINTAINED:   2,
  CHALLENGE_COMPLETE:  10,
  BADGE_UNLOCKED:      5,
  SHARE:               1,
};

// ── IARF XP System ────────────────────────────────────────────────────────────

/**
 * XP awards for each activity type (IARF curriculum gamification).
 * These XP values are used in parallel with the points system for level display.
 */
const XP_AWARDS = {
  MICROPRACTICE_COMPLETE:   10,
  SKILL_MODULE_COMPLETE:    50,
  WEEKLY_REFLECTION:        25,
  RETAKE_RESILIENCE_ATLAS: 100,
  DIMENSIONAL_IMPROVEMENT: 150,   // +5% score improvement
  HELP_ANOTHER_USER:        75,
  STREAK_BONUS_7:           20,   // bonus for 7-day streak milestone
  STREAK_BONUS_30:          60,
  STREAK_BONUS_90:         150,
  STREAK_BONUS_365:        500,
  QUEST_COMPLETE:           80,
  BALANCE_BONUS:            30,   // all 6 dims within 15%
};

/**
 * XP level tier definitions for the IARF curriculum gamification system.
 */
const XP_LEVEL_TIERS = [
  { name: 'Resilience Explorer',  minXP:      0, maxXP:   999, minLevel:  1, maxLevel: 10 },
  { name: 'Resilience Builder',   minXP:   1000, maxXP:  4999, minLevel: 11, maxLevel: 20 },
  { name: 'Resilience Architect', minXP:   5000, maxXP: 14999, minLevel: 21, maxLevel: 30 },
  { name: 'Resilience Master',    minXP:  15000, maxXP: Infinity, minLevel: 31, maxLevel: Infinity },
];

/**
 * Compute IARF XP level from total XP.
 * XP is scaled from the internal points system (1 point ≈ 10 XP for display).
 *
 * @param {number} totalPoints — raw points from the DB
 * @returns {{ xp: number, level: number, tier: string, nextLevelXP: number, progress: number }}
 */
function computeXPLevel(totalPoints) {
  const xp = totalPoints * 10; // scale factor: 1 point = 10 XP
  let level = 1;
  let tierIdx = 0;

  for (let i = 0; i < XP_LEVEL_TIERS.length; i++) {
    const t = XP_LEVEL_TIERS[i];
    if (xp >= t.minXP) {
      tierIdx = i;
      // Compute level within tier
      const xpInTier = xp - t.minXP;
      const tierRange = t.maxXP === Infinity ? 15000 : (t.maxXP - t.minXP);
      const levelsInTier = t.maxLevel === Infinity ? 10 : (t.maxLevel - t.minLevel + 1);
      const xpPerLevel = Math.floor(tierRange / levelsInTier);
      const levelsEarned = xpPerLevel > 0 ? Math.floor(xpInTier / xpPerLevel) : 0;
      level = t.minLevel + Math.min(levelsEarned, levelsInTier - 1);
    }
  }

  const tier = XP_LEVEL_TIERS[tierIdx];
  const xpInTier = xp - tier.minXP;
  const tierRange = tier.maxXP === Infinity ? 15000 : (tier.maxXP - tier.minXP);
  const levelsInTier = tier.maxLevel === Infinity ? 10 : (tier.maxLevel - tier.minLevel + 1);
  const xpPerLevel = Math.floor(tierRange / levelsInTier);
  const xpForNextLevel = tier.maxXP === Infinity ? tier.minXP + tierRange : Math.min(tier.minXP + (level - tier.minLevel + 1) * xpPerLevel, tier.maxXP + 1);
  const xpProgress = xpPerLevel > 0 ? ((xpInTier % xpPerLevel) / xpPerLevel) * 100 : 0;

  return {
    xp,
    level,
    tierName:     tier.name,
    nextLevelXP:  xpForNextLevel,
    progress:     Math.round(Math.min(xpProgress, 100)),
  };
}

/**
 * Streak badge tier names (IARF micropractice streak rewards).
 */
const STREAK_BADGE_TIERS = [
  { days: 365, badge: '💎 Diamond', rarity: 'legendary' },
  { days:  90, badge: '🥇 Gold',    rarity: 'rare'      },
  { days:  30, badge: '🥈 Silver',  rarity: 'uncommon'  },
  { days:   7, badge: '🥉 Bronze',  rarity: 'common'    },
];

/**
 * Get streak badge tier for a given streak length.
 * @param {number} days
 * @returns {{ badge: string, rarity: string }|null}
 */
function getStreakBadgeTier(days) {
  for (const tier of STREAK_BADGE_TIERS) {
    if (days >= tier.days) return tier;
  }
  return null;
}

/** All badge definitions — ordered so early/easy ones are checked first. */
const BADGE_DEFINITIONS = [
  // Completion
  { name: 'First Practice',    rarity: 'common',   icon: '/icons/badge.svg',          test: (p) => totalPractices(p) >= 1   },
  { name: '10 Practices',      rarity: 'common',   icon: '/icons/badges.svg',         test: (p) => totalPractices(p) >= 10  },
  { name: '50 Practices',      rarity: 'uncommon', icon: '/icons/kids-trophy.svg',    test: (p) => totalPractices(p) >= 50  },
  // Streaks
  { name: '7-Day Streak',      rarity: 'common',   icon: '/icons/streaks.svg',        test: (p) => p.longestStreak >= 7    },
  { name: '30-Day Streak',     rarity: 'uncommon', icon: '/icons/streaks.svg',        test: (p) => p.longestStreak >= 30   },
  { name: '100-Day Streak',    rarity: 'rare',     icon: '/icons/streaks.svg',        test: (p) => p.longestStreak >= 100  },
  // Growth (points proxy)
  { name: '10% Improvement',   rarity: 'common',   icon: '/icons/game-mountain.svg',  test: (p) => p.totalPoints >= 25     },
  { name: 'New Personal Best', rarity: 'uncommon', icon: '/icons/star.svg',           test: (p) => p.longestStreak > 0 && p.longestStreak === p.currentStreak.days },
  // Speed
  { name: 'Quick Study',       rarity: 'common',   icon: '/icons/game-target.svg',    test: (p) => totalPractices(p) >= 5 && p.totalPoints >= 10 },
  { name: 'Lightning Learner', rarity: 'rare',     icon: '/icons/challenges.svg',     test: (p) => p.currentStreak.days >= 7 && totalPractices(p) >= 20 },
  // Challenges
  { name: 'First Challenge',   rarity: 'common',   icon: '/icons/challenges.svg',     test: (p) => p.completedChallenges >= 1  },
  { name: 'Challenge Master',  rarity: 'rare',     icon: '/icons/badges.svg',         test: (p) => p.completedChallenges >= 10 },
  // Special
  { name: "Founder's Friend",  rarity: 'legendary', icon: '/icons/star.svg',          test: (p) => p.totalPoints >= 100 },
];

/**
 * Derive the ISO week number (1-53) and year for a given date.
 * Uses the standard ISO 8601 algorithm.
 */
function getISOWeekAndYear(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return { week, year: d.getUTCFullYear() };
}

/** Count total practice completions recorded in pointHistory. */
function totalPractices(progress) {
  return progress.pointHistory.filter(e => e.type === 'practice_complete').length;
}

/** Return true when two dates fall on the same calendar day (UTC). */
function isSameDay(a, b) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth()    === b.getUTCMonth()    &&
    a.getUTCDate()     === b.getUTCDate()
  );
}

/** Return true when date b is exactly one calendar day after date a. */
function isConsecutiveDay(a, b) {
  const next = new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate() + 1));
  return isSameDay(next, b);
}

// ── Badge helper ──────────────────────────────────────────────────────────────

/**
 * Check all badge definitions and award any that are newly earned.
 * Returns the number of new badges awarded.
 */
async function checkAndAwardBadges(progress) {
  const existing = new Set(progress.badges.map(b => b.name));
  let newBadges = 0;

  for (const def of BADGE_DEFINITIONS) {
    if (existing.has(def.name)) continue;
    if (!def.test(progress)) continue;

    progress.badges.push({ name: def.name, rarity: def.rarity, icon: def.icon });
    progress.totalPoints += POINTS.BADGE_UNLOCKED;
    progress.pointHistory.push({
      type:        'badge_unlocked',
      points:      POINTS.BADGE_UNLOCKED,
      description: `Badge unlocked: ${def.name}`,
    });
    newBadges++;
  }

  return newBadges;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch (or create) a user's GamificationProgress document.
 *
 * @param {string} userId
 * @returns {Promise<GamificationProgress>}
 */
async function getOrCreateProgress(userId) {
  let progress = await GamificationProgress.findOne({ userId });
  if (!progress) {
    progress = new GamificationProgress({ userId });
    await progress.save();
  }
  return progress;
}

/**
 * Record a practice completion for a user. Updates streak, awards points
 * and triggers badge checks. Idempotent within the same calendar day.
 * Also updates dimensional streak tracking when a dimension is provided.
 *
 * @param {string}  userId
 * @param {string}  practiceId
 * @param {string}  dimension   — resilience dimension (e.g. 'Cognitive-Narrative')
 * @returns {Promise<{progress, newBadges: string[], streakUpdated: boolean, dimensionalStreakUpdated: boolean}>}
 */
async function recordPracticeCompletion(userId, practiceId, dimension) {
  const progress = await getOrCreateProgress(userId);
  const now = new Date();
  const lastDate = progress.currentStreak.lastPracticeDate;
  let streakUpdated = false;
  let dimensionalStreakUpdated = false;

  // --- Update global streak ---
  if (!lastDate || (!isSameDay(lastDate, now) && !isConsecutiveDay(lastDate, now))) {
    // Streak broken (or first practice)
    progress.currentStreak.days = 1;
    progress.currentStreak.startDate = now;
  } else if (isSameDay(lastDate, now)) {
    // Already practiced today — don't double-count streak
  } else {
    // Consecutive day
    progress.currentStreak.days += 1;
    streakUpdated = true;
  }

  progress.currentStreak.lastPracticeDate = now;

  // Update longest streak
  if (progress.currentStreak.days > progress.longestStreak) {
    progress.longestStreak = progress.currentStreak.days;
  }

  // --- Update dimensional streak when a dimension is provided ---
  if (dimension) {
    dimensionalStreakUpdated = updateDimensionalStreak(progress, dimension, now);
  }

  // --- Award points for the practice ---
  progress.totalPoints += POINTS.PRACTICE_COMPLETE;
  progress.pointHistory.push({
    type:        'practice_complete',
    points:      POINTS.PRACTICE_COMPLETE,
    description: `Completed practice: ${practiceId}`,
  });

  // --- Log activity for IARF tracking ---
  if (progress.activityLog) {
    progress.activityLog.push({
      type:      'micropractice_complete',
      dimension: dimension || null,
      skillId:   practiceId,
      xpEarned:  XP_AWARDS.MICROPRACTICE_COMPLETE,
      timestamp: now,
    });
  }

  // Streak maintenance bonus (awarded once per day when streak is ongoing)
  if (streakUpdated) {
    progress.totalPoints += POINTS.STREAK_MAINTAINED;
    progress.pointHistory.push({
      type:        'streak_maintained',
      points:      POINTS.STREAK_MAINTAINED,
      description: `${progress.currentStreak.days}-day streak maintained`,
    });
  }

  // --- Weekly challenge progress ---
  const { week, year } = getISOWeekAndYear(now);
  if (
    progress.currentChallenge.dimension &&
    progress.currentChallenge.week === week &&
    progress.currentChallenge.year === year &&
    dimension === progress.currentChallenge.dimension
  ) {
    const maxDays = 3; // 3 daily micro-practices per weekly challenge
    if (progress.currentChallenge.completedDays < maxDays) {
      progress.currentChallenge.completedDays += 1;

      if (progress.currentChallenge.completedDays === maxDays) {
        // Challenge completed!
        const reward = progress.currentChallenge.reward || POINTS.CHALLENGE_COMPLETE;
        progress.totalPoints += reward;
        progress.pointHistory.push({
          type:        'challenge_complete',
          points:      reward,
          description: `Weekly challenge completed: ${progress.currentChallenge.dimension}`,
        });
        progress.completedChallenges += 1;
        progress.challengeHistory.push({
          week,
          year,
          dimension: progress.currentChallenge.dimension,
          completed: true,
        });
        // Reset for next week
        progress.currentChallenge = {
          dimension:     null,
          week:          null,
          year:          null,
          completedDays: 0,
          reward:        POINTS.CHALLENGE_COMPLETE,
          difficulty:    'medium',
        };
      }
    }
  }

  // --- Check badges ---
  const newBadgeCount = await checkAndAwardBadges(progress);
  const newBadgeNames = newBadgeCount > 0
    ? progress.badges.slice(-newBadgeCount).map(b => b.name)
    : [];

  await progress.save();

  logger.info(`Gamification: practice recorded for user ${userId} (streak: ${progress.currentStreak.days})`);

  return { progress, newBadges: newBadgeNames, streakUpdated, dimensionalStreakUpdated };
}

/**
 * Update dimensional streak tracking for a given dimension.
 * Supports streak recovery: 1 miss forgiveness per calendar month.
 *
 * @param {object} progress  — GamificationProgress document
 * @param {string} dimension — Canonical dimension name
 * @param {Date}   now       — Current timestamp
 * @returns {boolean} True if streak was extended (consecutive day)
 */
function updateDimensionalStreak(progress, dimension, now) {
  if (!progress.dimensionalStreaks) {
    progress.dimensionalStreaks = [];
  }

  let ds = progress.dimensionalStreaks.find(d => d.dimension === dimension);
  if (!ds) {
    progress.dimensionalStreaks.push({
      dimension,
      current:          0,
      longest:          0,
      lastPracticeDate: null,
      totalCount:       0,
      lastRecoveryMonth: null,
      lastRecoveryYear:  null,
    });
    ds = progress.dimensionalStreaks[progress.dimensionalStreaks.length - 1];
  }

  const lastDate = ds.lastPracticeDate;
  let streakExtended = false;

  if (!lastDate) {
    // First practice in this dimension
    ds.current = 1;
    ds.totalCount = 1;
  } else if (isSameDay(lastDate, now)) {
    // Already practiced today — increment count but not streak
    ds.totalCount += 1;
  } else if (isConsecutiveDay(lastDate, now)) {
    // Consecutive day — extend streak
    ds.current += 1;
    ds.totalCount += 1;
    streakExtended = true;
  } else {
    // Gap — check for streak recovery (1 miss per month)
    const nowMonth = now.getUTCMonth();
    const nowYear  = now.getUTCFullYear();
    const daysSinceLast = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
    const canRecover = daysSinceLast === 2 &&
      (ds.lastRecoveryMonth !== nowMonth || ds.lastRecoveryYear !== nowYear);

    if (canRecover) {
      // Use the forgiveness — extend streak as if consecutive
      ds.current += 1;
      ds.totalCount += 1;
      ds.lastRecoveryMonth = nowMonth;
      ds.lastRecoveryYear  = nowYear;
      streakExtended = true;
      logger.info(`Dimensional streak recovery used for dimension: ${dimension}`);
    } else {
      // Streak broken
      ds.current = 1;
      ds.totalCount += 1;
    }
  }

  ds.lastPracticeDate = now;

  if (ds.current > ds.longest) {
    ds.longest = ds.current;
  }

  return streakExtended;
}

/**
 * Set or replace the current weekly challenge for a user.
 *
 * @param {string} userId
 * @param {string} dimension
 * @param {'easy'|'medium'|'hard'} difficulty
 * @returns {Promise<GamificationProgress>}
 */
async function setWeeklyChallenge(userId, dimension, difficulty = 'medium') {
  const progress = await getOrCreateProgress(userId);
  const { week, year } = getISOWeekAndYear(new Date());

  progress.currentChallenge = {
    dimension,
    week,
    year,
    completedDays: 0,
    reward:        POINTS.CHALLENGE_COMPLETE,
    difficulty,
  };

  await progress.save();
  return progress;
}

/**
 * Award share points to a user.
 *
 * @param {string} userId
 * @returns {Promise<GamificationProgress>}
 */
async function recordShare(userId) {
  const progress = await getOrCreateProgress(userId);

  progress.totalPoints += POINTS.SHARE;
  progress.pointHistory.push({
    type:        'share',
    points:      POINTS.SHARE,
    description: 'Shared a result',
  });

  await checkAndAwardBadges(progress);
  await progress.save();
  return progress;
}

/**
 * Update user gamification preferences (opt-in settings).
 *
 * @param {string}  userId
 * @param {object}  prefs  — { leaderboardOptIn?, notificationsEnabled? }
 * @returns {Promise<GamificationProgress>}
 */
async function updatePreferences(userId, prefs) {
  const progress = await getOrCreateProgress(userId);

  if (typeof prefs.leaderboardOptIn === 'boolean') {
    progress.leaderboardOptIn = prefs.leaderboardOptIn;
  }
  if (typeof prefs.notificationsEnabled === 'boolean') {
    progress.notificationsEnabled = prefs.notificationsEnabled;
  }

  await progress.save();
  return progress;
}

/**
 * Return the top-N users on the leaderboard (opt-in only).
 *
 * @param {'weekly'|'monthly'|'alltime'} period
 * @param {number} limit
 * @returns {Promise<Array>}
 */
async function getLeaderboard(period, limit = 10) {
  const now = new Date();
  let dateFilter = {};

  if (period === 'weekly') {
    const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    weekStart.setUTCDate(weekStart.getUTCDate() - now.getUTCDay());
    dateFilter = { 'currentStreak.lastPracticeDate': { $gte: weekStart } };
  } else if (period === 'monthly') {
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    dateFilter = { 'currentStreak.lastPracticeDate': { $gte: monthStart } };
  }

  const entries = await GamificationProgress
    .find({ leaderboardOptIn: true, ...dateFilter })
    .sort({ totalPoints: -1 })
    .limit(limit)
    .lean();

  return entries.map((e, idx) => ({
    rank:          idx + 1,
    username:      'Anonymous',
    totalPoints:   e.totalPoints,
    currentStreak: e.currentStreak.days,
    badgeCount:    e.badges.length,
  }));
}

/**
 * Daily streak-maintenance job: resets streaks that have been broken
 * for more than one day. Called by the cron job.
 *
 * @returns {Promise<number>}  Number of streaks reset
 */
async function runDailyStreakCheck() {
  const cutoffDate = new Date();
  cutoffDate.setUTCDate(cutoffDate.getUTCDate() - 2); // broken for more than 1 day

  const result = await GamificationProgress.updateMany(
    {
      'currentStreak.days':             { $gt: 0 },
      'currentStreak.lastPracticeDate': { $lt: cutoffDate },
    },
    {
      $set: {
        'currentStreak.days':             0,
        'currentStreak.startDate':        null,
        'currentStreak.lastPracticeDate': null,
      },
    }
  );

  const resetCount = result.modifiedCount || 0;
  if (resetCount > 0) {
    logger.info(`Streak check: reset ${resetCount} broken streaks`);
  }
  return resetCount;
}

module.exports = {
  getOrCreateProgress,
  recordPracticeCompletion,
  setWeeklyChallenge,
  recordShare,
  updatePreferences,
  getLeaderboard,
  runDailyStreakCheck,
  // IARF XP system
  computeXPLevel,
  getStreakBadgeTier,
  updateDimensionalStreak,
  XP_AWARDS,
  XP_LEVEL_TIERS,
  STREAK_BADGE_TIERS,
  // Exported for testing
  getISOWeekAndYear,
  POINTS,
  BADGE_DEFINITIONS,
};
