/**
 * badgeUnlockChecker.js
 * Checks badge requirements against current progress and awards new badges.
 */

import { ALL_BADGES } from '../data/gamification/badges.js';
import { loadEarnedBadges, saveEarnedBadge, loadOverallStreak, loadStreaks } from './gamificationHelpers.js';

const VALID_DIMENSION_KEYS = [
  'agentic-generative', 'somatic-regulative', 'cognitive-narrative',
  'relational-connective', 'emotional-adaptive', 'spiritual-existential',
];

/**
 * Check all badge requirements and return newly unlocked badges.
 * @param {Object} progress - Skill progress (from loadProgress())
 * @param {Object} allModulesByDimension - From data/iatlas/index.js
 * @param {Object} opts
 * @param {number} opts.skillsCompletedToday - Number of skills completed today (all dimensions)
 * @param {string} [opts.activeDimension] - Currently active dimension key
 * @param {number} [opts.skillsInDimToday] - Skills completed today in activeDimension
 * @param {number} [opts.reflectionsInDim] - Reflections completed in activeDimension
 * @param {number} [opts.currentLevel] - Current IATLAS level number
 * @returns {Array} Array of newly unlocked badge objects
 */
export function checkAndUnlockBadges(progress, allModulesByDimension, opts = {}) {
  const earnedIds = new Set(loadEarnedBadges().map(b => b.id));
  const newlyUnlocked = [];

  for (const badge of ALL_BADGES) {
    if (earnedIds.has(badge.id)) continue; // Already earned
    if (checkBadgeRequirement(badge.requirement, progress, allModulesByDimension, opts)) {
      if (saveEarnedBadge(badge.id)) {
        newlyUnlocked.push(badge);
      }
    }
  }

  return newlyUnlocked;
}

function checkBadgeRequirement(req, progress, allModulesByDimension, opts) {
  const { skillsCompletedToday = 0, activeDimension, skillsInDimToday = 0, reflectionsInDim = 0, currentLevel = 1 } = opts;

  switch (req.type) {
    case 'first_skill': {
      const dimProgress = progress[req.dimension] || {};
      return Object.keys(dimProgress).length >= 1;
    }
    case 'level_complete': {
      const dimProgress = progress[req.dimension] || {};
      const completedIds = new Set(Object.keys(dimProgress));
      const modules = allModulesByDimension[req.dimension] || [];
      const levelModules = modules.filter(m => m.level === req.level);
      return levelModules.length > 0 && levelModules.every(m => completedIds.has(m.id));
    }
    case 'dimension_complete': {
      const dimProgress = progress[req.dimension] || {};
      const completedIds = new Set(Object.keys(dimProgress));
      const modules = allModulesByDimension[req.dimension] || [];
      return modules.length > 0 && modules.every(m => completedIds.has(m.id));
    }
    case 'dimension_streak': {
      const streaks = loadStreaks();
      const dimStreak = streaks[req.dimension];
      return dimStreak && dimStreak.current >= req.days;
    }
    case 'skills_in_day': {
      if (req.dimension) {
        return activeDimension === req.dimension && skillsInDimToday >= req.count;
      }
      return skillsCompletedToday >= req.count;
    }
    case 'reflections_complete': {
      return activeDimension === req.dimension && reflectionsInDim >= req.count;
    }
    case 'foundation_all_dimensions': {
      return VALID_DIMENSION_KEYS.every(dimKey => {
        const dimProgress = progress[dimKey] || {};
        const completedIds = new Set(Object.keys(dimProgress));
        const modules = allModulesByDimension[dimKey] || [];
        return modules.filter(m => m.level === 'foundation').every(m => completedIds.has(m.id));
      });
    }
    case 'building_all_dimensions': {
      return VALID_DIMENSION_KEYS.every(dimKey => {
        const dimProgress = progress[dimKey] || {};
        const completedIds = new Set(Object.keys(dimProgress));
        const modules = allModulesByDimension[dimKey] || [];
        const bm = modules.filter(m => m.level === 'building');
        return bm.length > 0 && bm.every(m => completedIds.has(m.id));
      });
    }
    case 'mastery_all_dimensions': {
      return VALID_DIMENSION_KEYS.every(dimKey => {
        const dimProgress = progress[dimKey] || {};
        const completedIds = new Set(Object.keys(dimProgress));
        const modules = allModulesByDimension[dimKey] || [];
        const mm = modules.filter(m => m.level === 'mastery');
        return mm.length > 0 && mm.every(m => completedIds.has(m.id));
      });
    }
    case 'overall_streak': {
      const streak = loadOverallStreak();
      return streak.current >= req.days;
    }
    case 'all_dimensions_started': {
      return VALID_DIMENSION_KEYS.every(dimKey => Object.keys(progress[dimKey] || {}).length >= 1);
    }
    case 'total_skills': {
      let total = 0;
      for (const dimProgress of Object.values(progress)) {
        total += Object.keys(dimProgress).length;
      }
      return total >= req.count;
    }
    case 'quests_complete': {
      // Checked externally — handled by useQuests hook
      return false;
    }
    case 'dimensions_complete': {
      let count = 0;
      for (const dimKey of VALID_DIMENSION_KEYS) {
        const dimProgress = progress[dimKey] || {};
        const completedIds = new Set(Object.keys(dimProgress));
        const modules = allModulesByDimension[dimKey] || [];
        if (modules.length > 0 && modules.every(m => completedIds.has(m.id))) count++;
      }
      return count >= req.count;
    }
    case 'reach_level': {
      return currentLevel >= req.level;
    }
    default:
      return false;
  }
}
