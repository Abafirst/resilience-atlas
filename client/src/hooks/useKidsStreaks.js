/**
 * useKidsStreaks.js
 * React hook for IATLAS Kids daily activity streak tracking.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  loadKidsJSON,
  saveKidsJSON,
  KIDS_STORAGE_KEYS,
  addKidsStars,
} from '../utils/kidsProgressHelpers.js';
import { STAR_RULES } from '../data/kidsGamification.js';

/** Returns today's date as YYYY-MM-DD in local time */
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Returns true if dateStr is yesterday (local) */
function isYesterday(dateStr) {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return dateStr === y;
}

/** Default streak state */
const DEFAULT_STREAKS = {
  current:  0,
  longest:  0,
  lastDate: null,
};

function loadStreakData() {
  return loadKidsJSON(KIDS_STORAGE_KEYS.STREAKS, DEFAULT_STREAKS);
}

function saveStreakData(data) {
  saveKidsJSON(KIDS_STORAGE_KEYS.STREAKS, data);
}

export default function useKidsStreaks() {
  const [streakData, setStreakData] = useState(DEFAULT_STREAKS);

  const refresh = useCallback(() => {
    setStreakData(loadStreakData());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Record a new activity completion for streak tracking.
   * Called after completing an activity.
   * Returns: { streakData, hitMilestone: false | 3 | 7, bonusStars }
   */
  const recordActivity = useCallback(() => {
    const current  = loadStreakData();
    const todayStr = today();

    // Already recorded today — no change
    if (current.lastDate === todayStr) {
      return { streakData: current, hitMilestone: false, bonusStars: 0 };
    }

    let newCurrent;
    if (current.lastDate === null || isYesterday(current.lastDate)) {
      // Extend streak
      newCurrent = current.current + 1;
    } else {
      // Gap — restart streak
      newCurrent = 1;
    }

    const newLongest = Math.max(current.longest, newCurrent);
    const updated = {
      current:  newCurrent,
      longest:  newLongest,
      lastDate: todayStr,
    };
    saveStreakData(updated);
    setStreakData(updated);

    // Check milestones
    let hitMilestone = false;
    let bonusStars   = 0;
    if (newCurrent === 3 || (newCurrent > 3 && current.current < 3)) {
      hitMilestone = 3;
      bonusStars   = STAR_RULES.STREAK_3_DAY;
      addKidsStars(bonusStars);
    } else if (newCurrent === 7 || (newCurrent > 7 && current.current < 7)) {
      hitMilestone = 7;
      bonusStars   = STAR_RULES.STREAK_7_DAY;
      addKidsStars(bonusStars);
    }

    return { streakData: updated, hitMilestone, bonusStars };
  }, []);

  return {
    current:    streakData.current,
    longest:    streakData.longest,
    lastDate:   streakData.lastDate,
    streakData,
    recordActivity,
    refresh,
  };
}
