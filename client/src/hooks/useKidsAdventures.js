/**
 * useKidsAdventures.js
 * React hook for IATLAS Kids adventure (quest) tracking.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  loadKidsJSON,
  saveKidsJSON,
  KIDS_STORAGE_KEYS,
  addKidsStars,
  getDimensionProgressCounts,
  loadKidsProgress,
  normalizeDimensionKey,
} from '../utils/kidsProgressHelpers.js';
import { ALL_KIDS_ADVENTURES, KIDS_ADVENTURES } from '../data/kidsAdventures.js';

/** Default adventure store: { [adventureId]: { started, completedSteps: [], completedAt? } } */
function loadAdventureData() {
  return loadKidsJSON(KIDS_STORAGE_KEYS.ADVENTURES, {});
}

function saveAdventureData(data) {
  saveKidsJSON(KIDS_STORAGE_KEYS.ADVENTURES, data);
}

/**
 * Calculate how many steps an adventure has completed based on current progress.
 * Returns number of completed steps (0–totalSteps).
 */
function calcAdventureStepsCompleted(adventure, progress) {
  if (!adventure || adventure.comingSoon) return 0;
  const { requirement } = adventure;
  const dimCounts = getDimensionProgressCounts(progress);
  const totalCompleted = Object.keys(progress).length;

  switch (requirement.type) {
    case 'dimension_activities': {
      const ageGroupCounts = dimCounts[requirement.ageGroup] || {};
      const dimKey = normalizeDimensionKey(requirement.dimension);
      const count  = ageGroupCounts[dimKey] || 0;
      return Math.min(count, adventure.totalSteps);
    }
    case 'all_dimensions_tried': {
      // One step per tried dimension
      const tried = new Set();
      for (const r of Object.values(progress)) {
        if (r.dimension) tried.add(r.dimension);
      }
      return Math.min(tried.size, adventure.totalSteps);
    }
    case 'total_activities': {
      return Math.min(totalCompleted, adventure.totalSteps);
    }
    case 'streak': {
      const streakData = loadKidsJSON(KIDS_STORAGE_KEYS.STREAKS, { current: 0 });
      return Math.min(streakData.current || 0, adventure.totalSteps);
    }
    case 'any_dimension_activities': {
      const ageGroupCounts = dimCounts[requirement.ageGroup] || {};
      const best = Math.max(0, ...Object.values(ageGroupCounts));
      return Math.min(best, adventure.totalSteps);
    }
    case 'all_dimensions_min': {
      const ageGroupCounts = dimCounts[requirement.ageGroup] || {};
      const DIMENSION_KEYS = [
        'emotional-adaptive', 'somatic-regulative', 'relational-connective',
        'agentic-generative', 'spiritual-reflective', 'cognitive-narrative',
      ];
      let completedDims = 0;
      for (const k of DIMENSION_KEYS) {
        if ((ageGroupCounts[k] || 0) >= requirement.count) completedDims++;
      }
      return completedDims;
    }
    default:
      return 0;
  }
}

export default function useKidsAdventures(selectedAgeGroup = 'age-5-7') {
  const [adventureData, setAdventureData] = useState({});

  const refresh = useCallback(() => {
    setAdventureData(loadAdventureData());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Get all adventures for the selected age group with current progress.
   */
  const getAdventures = useCallback(() => {
    const progress  = loadKidsProgress();
    const stored    = loadAdventureData();
    const adventures = KIDS_ADVENTURES[selectedAgeGroup] || [];

    return adventures.map(adventure => {
      const stepsCompleted = calcAdventureStepsCompleted(adventure, progress);
      const isComplete     = stepsCompleted >= adventure.totalSteps;
      const completedAt    = stored[adventure.id]?.completedAt || null;
      const wasCompleted   = !!completedAt;

      return {
        ...adventure,
        stepsCompleted,
        isComplete,
        completedAt: wasCompleted ? completedAt : (isComplete ? new Date().toISOString() : null),
        started:     stepsCompleted > 0,
      };
    });
  }, [selectedAgeGroup]);

  /**
   * Check if any adventures have just been completed; award rewards if so.
   * Call this after recording a new activity completion.
   * Returns array of newly completed adventure objects.
   */
  const checkAdventureCompletion = useCallback(() => {
    const progress  = loadKidsProgress();
    const stored    = loadAdventureData();
    const nowISO    = new Date().toISOString();
    const newlyDone = [];

    for (const adventure of ALL_KIDS_ADVENTURES) {
      if (adventure.comingSoon)               continue;
      if (stored[adventure.id]?.completedAt)  continue; // already completed

      const stepsCompleted = calcAdventureStepsCompleted(adventure, progress);
      if (stepsCompleted >= adventure.totalSteps) {
        stored[adventure.id] = { ...stored[adventure.id], completedAt: nowISO };
        newlyDone.push(adventure);

        // Award star rewards
        for (const reward of adventure.rewards || []) {
          if (reward.type === 'stars') addKidsStars(reward.amount);
        }
      }
    }

    if (newlyDone.length > 0) {
      saveAdventureData(stored);
      setAdventureData({ ...stored });
    }

    return newlyDone;
  }, []);

  /** All adventures across all age groups with status */
  const getAllAdventures = useCallback(() => {
    const progress = loadKidsProgress();
    const stored   = loadAdventureData();

    return ALL_KIDS_ADVENTURES.map(adventure => {
      const stepsCompleted = calcAdventureStepsCompleted(adventure, progress);
      const isComplete     = stepsCompleted >= adventure.totalSteps;
      const completedAt    = stored[adventure.id]?.completedAt || null;

      return {
        ...adventure,
        stepsCompleted,
        isComplete,
        completedAt,
        started: stepsCompleted > 0,
      };
    });
  }, []);

  return {
    adventureData,
    getAdventures,
    getAllAdventures,
    checkAdventureCompletion,
    refresh,
  };
}
