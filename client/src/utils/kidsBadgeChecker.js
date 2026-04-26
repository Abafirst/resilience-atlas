/**
 * kidsBadgeChecker.js
 * Checks badge unlock conditions against current progress.
 */

import { ALL_KIDS_BADGES } from '../data/kidsBadges.js';
import {
  loadKidsJSON,
  saveKidsJSON,
  KIDS_STORAGE_KEYS,
  getDimensionProgressCounts,
  getTriedDimensions,
  checkAgeGroupComplete,
  normalizeDimensionKey,
} from './kidsProgressHelpers.js';

/** Load previously earned badge records { [badgeId]: { earnedAt: ISO } } */
export function loadEarnedKidsBadges() {
  return loadKidsJSON(KIDS_STORAGE_KEYS.BADGES, {});
}

/** Persist a set of badge IDs with timestamps */
function saveEarnedBadges(earned) {
  saveKidsJSON(KIDS_STORAGE_KEYS.BADGES, earned);
}

/**
 * Check all badge unlock conditions and award any newly earned badges.
 *
 * @param {object} progress  - loadKidsProgress() result
 * @param {object} opts      - extra context: { currentStreak, parentNoteCount }
 * @returns {Array}          - array of newly awarded badge objects
 */
export function checkAndAwardKidsBadges(progress, opts = {}) {
  const earned = loadEarnedKidsBadges();
  const nowISO = new Date().toISOString();

  const dimCounts     = getDimensionProgressCounts(progress);
  const triedDims     = getTriedDimensions(progress);
  const totalCompleted = Object.keys(progress).length;
  const { currentStreak = 0, parentNoteCount = 0 } = opts;

  const newlyUnlocked = [];

  for (const badge of ALL_KIDS_BADGES) {
    if (earned[badge.id]) continue; // already earned

    const { requirement } = badge;
    let unlock = false;

    switch (requirement.type) {

      case 'dimension_activities': {
        // Earned by completing N activities in a specific dimension for a specific age group
        const ageGroupCounts = dimCounts[requirement.ageGroup] || {};
        const count = ageGroupCounts[normalizeDimensionKey(requirement.dimension)] || 0;
        unlock = count >= requirement.count;
        break;
      }

      case 'dimension_total': {
        // Total across all age groups for a dimension
        const dimKey  = normalizeDimensionKey(requirement.dimension);
        let total = 0;
        for (const ageGroupCounts of Object.values(dimCounts)) {
          total += ageGroupCounts[dimKey] || 0;
        }
        unlock = total >= requirement.count;
        break;
      }

      case 'total_activities': {
        unlock = totalCompleted >= requirement.count;
        break;
      }

      case 'all_dimensions_tried': {
        unlock = triedDims.size >= 6;
        break;
      }

      case 'streak': {
        unlock = currentStreak >= requirement.days;
        break;
      }

      case 'age_group_complete': {
        // Any age group is fully complete
        const ageGroups = ['age-5-7', 'age-8-10', 'age-11-14', 'age-15-18'];
        unlock = ageGroups.some(ag => checkAgeGroupComplete(progress, ag));
        break;
      }

      case 'parent_notes': {
        unlock = parentNoteCount >= requirement.count;
        break;
      }

      case 'any_dimension_activities': {
        // Any single dimension in a specific age group has N activities
        const ageGroupCounts = dimCounts[requirement.ageGroup] || {};
        unlock = Object.values(ageGroupCounts).some(c => c >= requirement.count);
        break;
      }

      case 'all_dimensions_min': {
        // All 6 dimensions in an age group each have at least N activities
        const ageGroupCounts = dimCounts[requirement.ageGroup] || {};
        const DIMENSION_KEYS = [
          'emotional-adaptive', 'somatic-regulative', 'relational-connective',
          'agentic-generative', 'spiritual-reflective', 'cognitive-narrative',
        ];
        unlock = DIMENSION_KEYS.every(k => (ageGroupCounts[k] || 0) >= requirement.count);
        break;
      }

      default:
        break;
    }

    if (unlock) {
      earned[badge.id] = { earnedAt: nowISO };
      newlyUnlocked.push({ ...badge, earnedAt: nowISO });
    }
  }

  if (newlyUnlocked.length > 0) {
    saveEarnedBadges(earned);
  }

  return newlyUnlocked;
}

/**
 * Return all badges annotated with earned/earnedAt info.
 * @returns {Array}
 */
export function getAllKidsBadgesWithStatus() {
  const earned = loadEarnedKidsBadges();
  return ALL_KIDS_BADGES.map(badge => ({
    ...badge,
    earned:   !!earned[badge.id],
    earnedAt: earned[badge.id]?.earnedAt || null,
  }));
}
