/**
 * useXP.js
 * React hook for XP tracking and level-up detection.
 * Reads from and writes to localStorage.
 */

import { useState, useEffect, useCallback } from 'react';
import { loadProgress, computeTotalXP, getXPSummary } from '../utils/gamificationHelpers.js';
import { calculateLevel } from '../data/gamification/levels.js';
import useProgressSync from './useProgressSync.js';

export default function useXP() {
  const [totalXP, setTotalXP]       = useState(0);
  const [levelInfo, setLevelInfo]   = useState(() => calculateLevel(0));
  const [levelUp, setLevelUp]       = useState(null); // { from, to } when a level-up occurs

  const { syncProgress } = useProgressSync();

  const refresh = useCallback(() => {
    const progress = loadProgress();
    const xp = computeTotalXP(progress);
    const info = calculateLevel(xp);
    setTotalXP(xp);
    setLevelInfo(info);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Called after a skill is marked complete (XP already written to localStorage).
   * Detects level-up transitions.
   * @param {number} previousXP
   */
  const checkLevelUp = useCallback((previousXP) => {
    const progress = loadProgress();
    const newXP = computeTotalXP(progress);
    const oldLevel = calculateLevel(previousXP).level;
    const newLevel = calculateLevel(newXP).level;
    if (newLevel > oldLevel) {
      const newInfo = calculateLevel(newXP);
      setLevelUp({ from: calculateLevel(previousXP), to: newInfo });
      setTotalXP(newXP);
      setLevelInfo(newInfo);
    } else {
      refresh();
    }
    syncProgress();
  }, [refresh, syncProgress]);

  const clearLevelUp = useCallback(() => setLevelUp(null), []);

  return { totalXP, levelInfo, levelUp, checkLevelUp, clearLevelUp, refresh };
}
