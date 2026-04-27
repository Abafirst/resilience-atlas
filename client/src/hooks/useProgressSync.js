/**
 * useProgressSync.js
 * React hook that bidirectionally syncs IATLAS progress between
 * localStorage (offline-first) and the backend MongoDB store.
 *
 * Features:
 *   - Fetches backend progress on mount and merges it into localStorage
 *   - Auto-syncs to backend on every progress update (debounced 5 s)
 *   - Handles offline mode: queues failed syncs and retries on reconnect
 *
 * Usage:
 *   const { isSyncing, lastSynced, syncError, syncProgress } = useProgressSync();
 *   // For a child profile:
 *   const sync = useProgressSync('child-profile-id-123');
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiUrl } from '../api/baseUrl.js';
import {
  loadProgress,
  loadEarnedBadges,
  loadOverallStreak,
  loadStreaks,
  loadJSON,
  saveJSON,
  STORAGE_KEYS,
} from '../utils/gamificationHelpers.js';
import {
  loadKidsProgress,
  getTotalKidsStars,
  loadKidsJSON,
  KIDS_STORAGE_KEYS,
} from '../utils/kidsProgressHelpers.js';

const SYNC_QUEUE_KEY = 'iatlas_sync_queue';
const SYNC_DEBOUNCE_MS = 5000;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Load the pending sync queue from localStorage. */
function loadSyncQueue() {
  return loadJSON(SYNC_QUEUE_KEY, []);
}

/** Append an item to the sync queue. */
function enqueueSyncItem(item) {
  const queue = loadSyncQueue();
  queue.push({ ...item, queuedAt: new Date().toISOString() });
  saveJSON(SYNC_QUEUE_KEY, queue);
}

/** Clear the sync queue after successful drain. */
function clearSyncQueue() {
  saveJSON(SYNC_QUEUE_KEY, []);
}

/**
 * Collect current adult progress from localStorage.
 * Returns the complete progress snapshot ready for /api/progress/sync.
 */
function collectAdultProgress() {
  const skillProgress = loadProgress();
  const badges = loadEarnedBadges();
  const overallStreak = loadOverallStreak();
  const dimensionStreaks = loadStreaks();
  const quests = loadJSON(STORAGE_KEYS.QUESTS, []);
  const activityFeed = loadJSON(STORAGE_KEYS.ACTIVITY, []);

  // Compute total XP from skill progress
  let xp = 0;
  for (const dimProgress of Object.values(skillProgress)) {
    if (dimProgress && typeof dimProgress === 'object') {
      for (const skillData of Object.values(dimProgress)) {
        xp += (skillData && typeof skillData === 'object' ? skillData.xpEarned || 0 : 0);
      }
    }
  }

  return {
    skillProgress,
    completedModules: Object.keys(skillProgress),
    xp,
    badges: badges.map(b => b.id || b.name).filter(Boolean),
    streaks: {
      current: overallStreak.current || 0,
      longest: overallStreak.longest || 0,
      lastActivityDate: overallStreak.lastDate || null,
    },
    quests: quests.map(q => ({
      questId:     q.questId,
      status:      q.status,
      progress:    q.progress?.percentage || 0,
      completedAt: q.completedAt || null,
    })),
    rawAdultData: {
      dimensionStreaks,
      activityFeed: activityFeed.slice(-50), // last 50 entries to avoid oversized payload
    },
  };
}

/**
 * Collect current kids progress from localStorage for the given profile.
 * @param {string|null} childProfileId
 */
function collectKidsProgress(childProfileId) {
  const keys = childProfileId
    ? (() => {
        const prefix = `iatlas_progress_${childProfileId}`;
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
      })()
    : KIDS_STORAGE_KEYS;

  const activities = loadKidsProgress(keys);
  const stars      = getTotalKidsStars(keys);
  const badges     = loadKidsJSON(keys.BADGES, []);
  const streaksRaw = loadKidsJSON(keys.STREAKS, { current: 0, longest: 0, lastDate: null });
  const adventures = loadKidsJSON(keys.ADVENTURES, []);

  return {
    kidsActivities: activities,
    kidsBadges:     Array.isArray(badges) ? badges.map(b => b.id || b.name || b).filter(Boolean) : [],
    kidsStreaks: {
      current:          streaksRaw.current  || 0,
      longest:          streaksRaw.longest  || 0,
      lastActivityDate: streaksRaw.lastDate || null,
    },
    kidsAdventures: Array.isArray(adventures) ? adventures : [],
    rawKidsData: { totalStars: stars },
  };
}

/**
 * Merge backend progress into localStorage.
 * Uses an additive strategy: keeps locally stored data and overlays server data
 * for keys that are empty / zero locally.
 *
 * @param {object} serverProgress - Canonical progress from the backend.
 * @param {string|null} childProfileId
 */
function mergeServerProgressIntoLocalStorage(serverProgress, childProfileId) {
  if (!serverProgress) return;

  if (!childProfileId) {
    // ── Adult progress ──────────────────────────────────────────────────────
    try {
      const localSkill = loadProgress();
      if (Object.keys(localSkill).length === 0 && serverProgress.skillProgress) {
        saveJSON(STORAGE_KEYS.PROGRESS, serverProgress.skillProgress);
      }

      const localBadges = loadEarnedBadges();
      if (localBadges.length === 0 && serverProgress.badges?.length) {
        saveJSON(STORAGE_KEYS.BADGES, serverProgress.badges.map(id => ({ id, earnedAt: null })));
      }

      const localStreak = loadOverallStreak();
      if (
        (localStreak.current || 0) === 0 &&
        serverProgress.streaks?.current > 0
      ) {
        saveJSON(STORAGE_KEYS.OVERALL_STREAK, {
          current:  serverProgress.streaks.current,
          longest:  serverProgress.streaks.longest,
          lastDate: serverProgress.streaks.lastActivityDate,
        });
      }

      const localQuests = loadJSON(STORAGE_KEYS.QUESTS, []);
      if (localQuests.length === 0 && serverProgress.quests?.length) {
        saveJSON(STORAGE_KEYS.QUESTS, serverProgress.quests);
      }
    } catch (err) {
      // Silently skip if localStorage is unavailable (private mode, quota, etc.)
      if (import.meta.env?.DEV) {
        console.debug('[useProgressSync] mergeServerProgressIntoLocalStorage (adult) error:', err?.message);
      }
    }
  } else {
    // ── Kids progress ───────────────────────────────────────────────────────
    try {
      const prefix = `iatlas_progress_${childProfileId}`;
      const keys = {
        PROGRESS:  `${prefix}_progress`,
        BADGES:    `${prefix}_badges`,
        STREAKS:   `${prefix}_streaks`,
        ADVENTURES:`${prefix}_adventures`,
      };

      const localActivities = loadKidsProgress(keys);
      if (Object.keys(localActivities).length === 0 && serverProgress.kidsActivities) {
        saveJSON(keys.PROGRESS, serverProgress.kidsActivities);
      }

      const localKidsBadges = loadKidsJSON(keys.BADGES, []);
      if (localKidsBadges.length === 0 && serverProgress.kidsBadges?.length) {
        saveJSON(keys.BADGES, serverProgress.kidsBadges);
      }

      const localKidsStreaks = loadKidsJSON(keys.STREAKS, { current: 0, longest: 0, lastDate: null });
      if (
        (localKidsStreaks.current || 0) === 0 &&
        serverProgress.kidsStreaks?.current > 0
      ) {
        saveJSON(keys.STREAKS, {
          current:  serverProgress.kidsStreaks.current,
          longest:  serverProgress.kidsStreaks.longest,
          lastDate: serverProgress.kidsStreaks.lastActivityDate,
        });
      }

      if (serverProgress.kidsAdventures?.length) {
        const localAdv = loadKidsJSON(keys.ADVENTURES, []);
        if (localAdv.length === 0) {
          saveJSON(keys.ADVENTURES, serverProgress.kidsAdventures);
        }
      }
    } catch (err) {
      // Silently skip if localStorage is unavailable (private mode, quota, etc.)
      if (import.meta.env?.DEV) {
        console.debug('[useProgressSync] mergeServerProgressIntoLocalStorage (kids) error:', err?.message);
      }
    }
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useProgressSync(childProfileId = null) {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  const [isSyncing, setIsSyncing]   = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [syncError, setSyncError]   = useState(null);

  // Track whether the initial fetch has been performed
  const fetchedRef   = useRef(false);
  // Debounce timer ref
  const debounceRef  = useRef(null);

  // ── Authenticated request helper ────────────────────────────────────────────

  const getToken = useCallback(async () => {
    try {
      return await getAccessTokenSilently();
    } catch (err) {
      // Fallback to localStorage cached token (legacy path / unauthenticated)
      if (import.meta.env?.DEV) {
        console.debug('[useProgressSync] getAccessTokenSilently failed, using cached token:', err?.message);
      }
      return (
        (typeof localStorage !== 'undefined' && localStorage.getItem('token')) ||
        (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('token')) ||
        ''
      );
    }
  }, [getAccessTokenSilently]);

  const authFetch = useCallback(async (path, options = {}) => {
    const token  = await getToken();
    const url    = childProfileId
      ? `${path}?childProfileId=${encodeURIComponent(childProfileId)}`
      : path;
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };
    const res = await fetch(apiUrl(url), { ...options, headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const err  = new Error(body.error || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }, [getToken, childProfileId]);

  // ── Fetch and merge on mount ────────────────────────────────────────────────

  const fetchAndMergeProgress = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      const data = await authFetch('/api/progress');
      if (data?.progress) {
        mergeServerProgressIntoLocalStorage(data.progress, childProfileId);
      }
    } catch (err) {
      // Network or server error — log and continue using localStorage
      if (import.meta.env?.DEV) {
        console.debug('[useProgressSync] fetchAndMergeProgress error:', err?.message);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, authFetch, childProfileId]);

  useEffect(() => {
    if (isAuthenticated && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchAndMergeProgress();
    }
  }, [isAuthenticated, fetchAndMergeProgress]);

  // ── Drain queued syncs on reconnect ────────────────────────────────────────

  const drainQueue = useCallback(async () => {
    const queue = loadSyncQueue();
    if (!queue.length || !isAuthenticated) return;

    for (const item of queue) {
      try {
        const token = await getToken();
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        await fetch(apiUrl('/api/progress/sync'), {
          method:  'POST',
          headers,
          body:    JSON.stringify({
            childProfileId: item.childProfileId,
            progressData:   item.progressData,
          }),
        });
      } catch (err) {
        // Still offline — leave queue intact and stop
        if (import.meta.env?.DEV) {
          console.debug('[useProgressSync] drainQueue: still offline or sync failed:', err?.message);
        }
        return;
      }
    }
    clearSyncQueue();
  }, [isAuthenticated, getToken]);

  useEffect(() => {
    const handler = () => drainQueue();
    window.addEventListener('online', handler);
    return () => window.removeEventListener('online', handler);
  }, [drainQueue]);

  // ── Sync progress to backend (debounced 5 s) ───────────────────────────────

  const syncProgress = useCallback((progressData) => {
    if (!isAuthenticated) return;

    // Cancel previous pending call
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setIsSyncing(true);
      setSyncError(null);

      const payload = progressData || (
        childProfileId
          ? collectKidsProgress(childProfileId)
          : collectAdultProgress()
      );

      if (!navigator.onLine) {
        // Offline: queue for later
        enqueueSyncItem({ childProfileId, progressData: payload });
        setIsSyncing(false);
        return;
      }

      try {
        const token = await getToken();
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        const res = await fetch(apiUrl('/api/progress/sync'), {
          method:  'POST',
          headers,
          body:    JSON.stringify({ childProfileId, progressData: payload }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        setLastSynced(data.lastSyncedAt || new Date().toISOString());

        // Drain any queued items now that we're confirmed online
        drainQueue();
      } catch (err) {
        if (import.meta.env?.DEV) {
          console.debug('[useProgressSync] syncProgress error:', err?.message);
        }
        setSyncError(err.message || 'Sync failed');
        // Queue for retry
        enqueueSyncItem({ childProfileId, progressData: payload });
      } finally {
        setIsSyncing(false);
      }
    }, SYNC_DEBOUNCE_MS);
  }, [isAuthenticated, childProfileId, getToken, drainQueue]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { isSyncing, lastSynced, syncError, syncProgress };
}

export default useProgressSync;
