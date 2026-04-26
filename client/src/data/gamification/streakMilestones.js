/**
 * streakMilestones.js
 * Streak milestone definitions for the IATLAS gamification system.
 */

export const STREAK_MILESTONES = [
  { days: 3,   badge: 'streak-starter',    xp: 10,   icon: '/icons/fire.svg',              label: '3-Day Streak'       },
  { days: 7,   badge: 'week-warrior',       xp: 25,   icon: '/icons/game-target.svg',       label: 'Week Warrior'        },
  { days: 14,  badge: 'fortnight-champion', xp: 50,   icon: '/icons/strength.svg',          label: 'Fortnight Champion'  },
  { days: 30,  badge: 'month-legend',       xp: 100,  icon: '/icons/kids-trophy.svg',       label: 'Month Legend'        },
  { days: 60,  badge: 'dedication-diamond', xp: 200,  icon: '/icons/game-diamond.svg',      label: 'Dedication Diamond'  },
  { days: 90,  badge: 'quarter-master',     xp: 300,  icon: '/icons/star.svg',              label: 'Quarter Master'      },
  { days: 180, badge: 'half-year-hero',     xp: 500,  icon: '/icons/star-burst.svg',        label: 'Half-Year Hero'      },
  { days: 365, badge: 'year-long-legend',   xp: 1000, icon: '/icons/trophy.svg',            label: 'Year-Long Legend'    },
];

/**
 * Get all streak milestones the user has just hit (transitions).
 * @param {number} newStreak - The new streak count after updating
 * @param {number} oldStreak - The streak count before updating
 * @returns {Array} Array of milestone objects that were just reached
 */
export function getNewStreakMilestones(newStreak, oldStreak) {
  return STREAK_MILESTONES.filter(
    m => newStreak >= m.days && oldStreak < m.days
  );
}

/**
 * Get the next streak milestone beyond the current streak.
 * @param {number} currentStreak
 * @returns {Object|null}
 */
export function getNextStreakMilestone(currentStreak) {
  return STREAK_MILESTONES.find(m => m.days > currentStreak) || null;
}
