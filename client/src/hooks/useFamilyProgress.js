/**
 * useFamilyProgress.js
 * Aggregates progress across all child profiles for the Family tier.
 *
 * Reads from localStorage using the same profile-namespaced keys that
 * useKidsProgress.js writes to, mirroring the approach used in
 * FamilyDashboard.jsx.
 *
 * Returns:
 *   familyMembers         — array of profile objects enriched with their individual XP/challenge counts
 *   totalFamilyXP         — combined XP (stars) across all profiles
 *   challengesCompleted   — total completed activities across all profiles
 *   familyChallengesCompleted — number of family-specific challenges completed
 *   refresh               — function to re-read from localStorage
 */

import { useState, useEffect, useCallback } from 'react';
import { useProfiles } from '../contexts/ProfileContext.jsx';
import {
  loadKidsProgress,
  getTotalKidsStars,
  KIDS_STORAGE_KEYS,
} from '../utils/kidsProgressHelpers.js';

const FAMILY_CHALLENGES_STORAGE_KEY = 'iatlas_family_challenges_progress';

/** Build profile-namespaced storage keys — mirrors useKidsProgress.js */
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

/** Read family challenge completions from localStorage */
function loadFamilyChallengeProgress() {
  try {
    const raw = localStorage.getItem(FAMILY_CHALLENGES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Save family challenge completions to localStorage */
export function saveFamilyChallengeCompletion(challengeId) {
  try {
    const current = loadFamilyChallengeProgress();
    current[challengeId] = {
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem(FAMILY_CHALLENGES_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // localStorage unavailable — silently skip
  }
}

/** Check if a specific family challenge has been completed */
export function isFamilyChallengeCompleted(challengeId) {
  const progress = loadFamilyChallengeProgress();
  return !!progress[challengeId];
}

export function useFamilyProgress() {
  const { profiles } = useProfiles();

  const [totalFamilyXP,              setTotalFamilyXP]              = useState(0);
  const [challengesCompleted,        setChallengesCompleted]        = useState(0);
  const [familyChallengesCompleted,  setFamilyChallengesCompleted]  = useState(0);
  const [familyMembers,              setFamilyMembers]              = useState([]);

  const refresh = useCallback(() => {
    let totalXP         = 0;
    let totalChallenges = 0;
    const enriched      = [];

    profiles.forEach((profile) => {
      const keys    = getProfileStorageKeys(profile.profileId);
      const prog    = loadKidsProgress(keys);
      const stars   = getTotalKidsStars(keys);
      const count   = Object.keys(prog).length;

      totalXP         += stars;
      totalChallenges += count;

      enriched.push({
        ...profile,
        xp:                  stars,
        activitiesCompleted: count,
      });
    });

    const fcProgress   = loadFamilyChallengeProgress();
    const fcCount      = Object.keys(fcProgress).length;

    setTotalFamilyXP(totalXP);
    setChallengesCompleted(totalChallenges);
    setFamilyChallengesCompleted(fcCount);
    setFamilyMembers(enriched);
  }, [profiles]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    familyMembers,
    totalFamilyXP,
    challengesCompleted,
    familyChallengesCompleted,
    refresh,
  };
}
