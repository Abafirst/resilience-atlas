/**
 * useKidsBadges.js
 * React hook for IATLAS Kids badge tracking.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  checkAndAwardKidsBadges,
  getAllKidsBadgesWithStatus,
} from '../utils/kidsBadgeChecker.js';
import { loadKidsProgress } from '../utils/kidsProgressHelpers.js';

export default function useKidsBadges() {
  const [allBadges, setAllBadges]   = useState([]);
  const [newBadges, setNewBadges]   = useState([]);

  const refresh = useCallback(() => {
    setAllBadges(getAllKidsBadgesWithStatus());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Check for newly unlocked badges after a progress update.
   * @param {object} opts - { currentStreak, parentNoteCount }
   * @returns {Array} newly unlocked badge objects
   */
  const checkBadges = useCallback((opts = {}) => {
    const progress = loadKidsProgress();
    const unlocked = checkAndAwardKidsBadges(progress, opts);
    if (unlocked.length > 0) {
      setNewBadges(unlocked);
      refresh();
    }
    return unlocked;
  }, [refresh]);

  const clearNewBadges = useCallback(() => setNewBadges([]), []);

  const earnedBadges = allBadges.filter(b => b.earned);
  const earnedCount  = earnedBadges.length;

  return {
    allBadges,
    earnedBadges,
    earnedCount,
    newBadges,
    checkBadges,
    clearNewBadges,
    refresh,
  };
}
