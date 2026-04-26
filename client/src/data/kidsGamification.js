/**
 * kidsGamification.js
 * Star earning rules and level definitions for the IATLAS Kids gamification system.
 */

/** Star earning rules */
export const STAR_RULES = {
  COMPLETE_ACTIVITY: 3,   // Fully complete an activity
  PARTIAL_ACTIVITY:  1,   // Try an activity (partial)
  COMPLETE_DIMENSION: 10, // Complete all activities in one dimension for an age group
  STREAK_3_DAY:       5,  // 3-day activity streak bonus
  PARENT_NOTE:        2,  // Parent adds a celebration note
};

/** Age group color scheme */
export const AGE_GROUP_COLORS = {
  'age-5-7':    '#f59e0b',
  'age-8-10':   '#10b981',
  'age-11-14':  '#6366f1',
  'age-15-18':  '#8b5cf6',
};

/** Age group labels */
export const AGE_GROUP_LABELS = {
  'age-5-7':   'Ages 5–7',
  'age-8-10':  'Ages 8–10',
  'age-11-14': 'Ages 11–14',
  'age-15-18': 'Ages 15–18',
};

/** Level progression thresholds */
export const KIDS_LEVELS = [
  {
    level:    1,
    title:    'Starter',
    minStars: 0,
    maxStars: 14,
    color:    '#94a3b8',
    icon:     '/icons/compass.svg',
    message:  'Every hero starts somewhere. You\'ve taken the first step!',
  },
  {
    level:    2,
    title:    'Explorer',
    minStars: 15,
    maxStars: 39,
    color:    '#10b981',
    icon:     '/icons/agentic-generative.svg',
    message:  'You\'re exploring your resilience. Keep discovering!',
  },
  {
    level:    3,
    title:    'Adventurer',
    minStars: 40,
    maxStars: 79,
    color:    '#6366f1',
    icon:     '/icons/game-target.svg',
    message:  'You\'re on an adventure! Every activity makes you stronger.',
  },
  {
    level:    4,
    title:    'Champion',
    minStars: 80,
    maxStars: 149,
    color:    '#8b5cf6',
    icon:     '/icons/badges.svg',
    message:  'You\'re a champion! Your resilience skills are growing fast.',
  },
  {
    level:    5,
    title:    'Resilience Hero',
    minStars: 150,
    maxStars: Infinity,
    color:    '#f59e0b',
    icon:     '/icons/trophy.svg',
    message:  'You\'re a Resilience Hero! You inspire everyone around you.',
  },
];

/**
 * Calculate level info from total stars.
 * @param {number} totalStars
 * @returns {{ level, title, progress, color, icon, message, starsToNext, isMax }}
 */
export function calculateKidsLevel(totalStars) {
  const stars = Math.max(0, totalStars);
  const levelData =
    KIDS_LEVELS.slice().reverse().find(l => stars >= l.minStars) ||
    KIDS_LEVELS[0];
  const isMax = levelData.level === KIDS_LEVELS.length;
  const progress = isMax
    ? 100
    : Math.min(
        100,
        Math.round(
          ((stars - levelData.minStars) /
            (levelData.maxStars - levelData.minStars + 1)) *
            100
        )
      );
  const starsToNext = isMax ? 0 : levelData.maxStars + 1 - stars;
  return {
    level:       levelData.level,
    title:       levelData.title,
    progress,
    color:       levelData.color,
    icon:        levelData.icon,
    message:     levelData.message,
    minStars:    levelData.minStars,
    nextStars:   isMax ? levelData.maxStars : levelData.maxStars + 1,
    starsToNext,
    isMax,
  };
}
