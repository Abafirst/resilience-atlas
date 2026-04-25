/**
 * useStreaks.js
 * React hook for streak tracking and milestone detection.
 */

import { useState, useEffect, useCallback } from 'react';
import { loadStreaks, loadOverallStreak, updateOverallStreak, addActivityEntry } from '../utils/gamificationHelpers.js';
import { getNewStreakMilestones, getNextStreakMilestone } from '../data/gamification/streakMilestones.js';

export default function useStreaks() {
  const [overallStreak, setOverallStreak]       = useState({ current: 0, longest: 0, lastDate: null });
  const [dimensionStreaks, setDimensionStreaks]  = useState({});
  const [newMilestones, setNewMilestones]        = useState([]);

  const refresh = useCallback(() => {
    setOverallStreak(loadOverallStreak());
    setDimensionStreaks(loadStreaks());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Update the overall streak after completing a skill.
   * Returns any newly hit milestones.
   */
  const recordActivity = useCallback(() => {
    const result = updateOverallStreak();
    if (!result) return [];
    const { updated, prev } = result;
    const milestones = getNewStreakMilestones(updated.current, prev?.current || 0);
    if (milestones.length > 0) {
      setNewMilestones(milestones);
      for (const m of milestones) {
        addActivityEntry({ type: 'streak_milestone', days: m.days, label: m.label, icon: m.icon });
      }
    }
    setOverallStreak(updated);
    return milestones;
  }, []);

  const clearNewMilestones = useCallback(() => setNewMilestones([]), []);

  const nextMilestone = getNextStreakMilestone(overallStreak.current);

  return {
    overallStreak,
    dimensionStreaks,
    newMilestones,
    nextMilestone,
    recordActivity,
    clearNewMilestones,
    refresh,
  };
}
