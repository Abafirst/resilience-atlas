/**
 * useKidsProgress.js
 * React hook for IATLAS Kids activity progress tracking.
 * Reads from and writes to localStorage.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  loadKidsProgress,
  recordActivityCompletion,
  getTotalKidsStars,
  getKidsLevelInfo,
  getKidsStats,
  getDimensionProgressCounts,
  getTotalActivitiesByDimension,
  KIDS_STORAGE_KEYS,
  loadKidsJSON,
} from '../utils/kidsProgressHelpers.js';

export default function useKidsProgress() {
  const [progress,   setProgress]   = useState({});
  const [totalStars, setTotalStars] = useState(0);
  const [levelInfo,  setLevelInfo]  = useState(() => getKidsLevelInfo());
  const [stats,      setStats]      = useState({});

  const refresh = useCallback(() => {
    const prog = loadKidsProgress();
    setProgress(prog);
    setTotalStars(getTotalKidsStars());
    setLevelInfo(getKidsLevelInfo());
    setStats(getKidsStats(prog));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Mark an activity as complete (or partially complete).
   * Returns { starsEarned, extraStars, totalStars, dimComplete }
   *
   * @param {object} record - { activityId?, title?, ageGroup, dimension, complete?, selfRating? }
   */
  const completeActivity = useCallback((record) => {
    const result = recordActivityCompletion(record);
    refresh();
    return result;
  }, [refresh]);

  /**
   * Check whether a specific activity has been completed.
   */
  const isCompleted = useCallback((activityId) => {
    const prog = loadKidsProgress();
    return !!prog[activityId];
  }, []);

  /**
   * Get dimension progress counts for a specific age group.
   * Returns { [dimensionKey]: count }
   */
  const getDimensionCounts = useCallback((ageGroup) => {
    const counts = getDimensionProgressCounts(loadKidsProgress());
    return counts[ageGroup] || {};
  }, []);

  /**
   * Total activities available by dimension for the given age group.
   */
  const getTotals = useCallback((ageGroup) => {
    const totals = getTotalActivitiesByDimension();
    return totals[ageGroup] || {};
  }, []);

  /**
   * Load parent notes (for star bonus calculation).
   */
  const getParentNoteCount = useCallback(() => {
    const notes = loadKidsJSON(KIDS_STORAGE_KEYS.PARENT_NOTES, []);
    return Array.isArray(notes) ? notes.length : 0;
  }, []);

  return {
    progress,
    totalStars,
    levelInfo,
    stats,
    completeActivity,
    isCompleted,
    getDimensionCounts,
    getTotals,
    getParentNoteCount,
    refresh,
  };
}
