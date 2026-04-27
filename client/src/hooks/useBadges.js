/**
 * useBadges.js
 * React hook for badge tracking and unlock detection.
 */

import { useState, useEffect, useCallback } from 'react';
import { ALL_BADGES } from '../data/gamification/badges.js';
import { loadEarnedBadges, addActivityEntry, loadProgress } from '../utils/gamificationHelpers.js';
import { checkAndUnlockBadges } from '../utils/badgeUnlockChecker.js';
import { ALL_MODULES_BY_DIMENSION } from '../data/iatlas/index.js';
import useProgressSync from './useProgressSync.js';

export default function useBadges() {
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [newBadges, setNewBadges]       = useState([]); // Badges just unlocked

  const { syncProgress } = useProgressSync();

  const refresh = useCallback(() => {
    const earned = loadEarnedBadges();
    setEarnedBadges(earned);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Run badge check after a skill is completed.
   * Returns array of newly unlocked badge objects.
   */
  const checkBadges = useCallback((opts = {}) => {
    const progress = loadProgress();
    const unlocked = checkAndUnlockBadges(progress, ALL_MODULES_BY_DIMENSION, opts);
    if (unlocked.length > 0) {
      // Add activity entries for each new badge
      for (const badge of unlocked) {
        addActivityEntry({ type: 'badge_earned', badgeId: badge.id, badgeName: badge.name, badgeEmoji: badge.emoji });
      }
      setNewBadges(unlocked);
      refresh();
      syncProgress();
    }
    return unlocked;
  }, [refresh, syncProgress]);

  const clearNewBadges = useCallback(() => setNewBadges([]), []);

  const allBadges = ALL_BADGES.map(badge => {
    const earned = earnedBadges.find(e => e.id === badge.id);
    return { ...badge, earned: !!earned, earnedAt: earned?.earnedAt || null };
  });

  return { earnedBadges, allBadges, newBadges, checkBadges, clearNewBadges, refresh };
}
