/**
 * useKidsProgress.js
 * React hook for IATLAS Kids activity progress tracking.
 * Reads from and writes to localStorage.
 *
 * Accepts an optional `profileId` parameter.  When provided, all storage
 * keys are namespaced to that profile so each child's progress is isolated.
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

/**
 * Return a set of storage keys namespaced to `profileId`.
 * Falls back to the global keys when no profileId is given.
 */
function getProfileStorageKeys(profileId) {
  if (!profileId) return KIDS_STORAGE_KEYS;
  const prefix = `iatlas_progress_${profileId}`;
  return {
    PROGRESS:     `${prefix}_progress`,
    STARS:        `${prefix}_stars`,
    BADGES:       `${prefix}_badges`,
    LEVEL:        `${prefix}_level`,
    CERTIFICATES: `${prefix}_certificates`,
    STREAKS:      `${prefix}_streaks`,
    PARENT_NOTES: `${prefix}_parent_notes`,
    ADVENTURES:   `${prefix}_adventures`,
  };
}

export default function useKidsProgress(profileId) {
  const [progress,   setProgress]   = useState({});
  const [totalStars, setTotalStars] = useState(0);
  const [levelInfo,  setLevelInfo]  = useState(() => getKidsLevelInfo(getProfileStorageKeys(profileId)));
  const [stats,      setStats]      = useState({});

  const refresh = useCallback(() => {
    const keys = getProfileStorageKeys(profileId);
    const prog = loadKidsProgress(keys);
    setProgress(prog);
    setTotalStars(getTotalKidsStars(keys));
    setLevelInfo(getKidsLevelInfo(keys));
    setStats(getKidsStats(prog, keys));
  }, [profileId]);

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
    const keys   = getProfileStorageKeys(profileId);
    const result = recordActivityCompletion(record, keys);
    refresh();
    return result;
  }, [profileId, refresh]);

  /**
   * Check whether a specific activity has been completed.
   */
  const isCompleted = useCallback((activityId) => {
    const keys = getProfileStorageKeys(profileId);
    const prog = loadKidsProgress(keys);
    return !!prog[activityId];
  }, [profileId]);

  /**
   * Get dimension progress counts for a specific age group.
   * Returns { [dimensionKey]: count }
   */
  const getDimensionCounts = useCallback((ageGroup) => {
    const keys   = getProfileStorageKeys(profileId);
    const counts = getDimensionProgressCounts(loadKidsProgress(keys));
    return counts[ageGroup] || {};
  }, [profileId]);

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
    const keys  = getProfileStorageKeys(profileId);
    const notes = loadKidsJSON(keys.PARENT_NOTES, []);
    return Array.isArray(notes) ? notes.length : 0;
  }, [profileId]);

  // Expose the resolved storage keys so callers (e.g. ParentDashboard) can
  // write directly to the correct namespace without having to re-derive them.
  const storageKeys = getProfileStorageKeys(profileId);

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
    storageKeys,
  };
}
