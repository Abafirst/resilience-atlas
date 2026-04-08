import { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { ALL_BADGES } from '../data/gamificationContent.js';

const GAMIFICATION_API = '/api/gamification';

/** Index ALL_BADGES by name for O(1) lookup */
const BADGE_BY_NAME = Object.fromEntries(ALL_BADGES.map(b => [b.name, b]));

/**
 * Custom hook that manages all gamification state and API interactions.
 *
 * Returns:
 *   progress          — current GamificationProgress document (or null)
 *   loading           — true while the initial fetch is in flight
 *   error             — error message string, or null
 *   refresh           — function to re-fetch progress
 *   recordPractice    — (practiceId, dimension?) → Promise<result>
 *   setChallenge      — (dimension, difficulty) → Promise<progress>
 *   enableLeaderboard — () → Promise<void>
 *   fetchLeaderboard  — (period?) → Promise<entries>
 *   toasts            — array of { id, message, type }
 *   dismissToast      — (id) → void
 *   addToast          — (message, type) → void
 *   celebration       — badge object to celebrate (or null)
 *   clearCelebration  — () → void
 */
export default function useGamification() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  const [progress, setProgress]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [tierBlocked, setTierBlocked] = useState(false);
  const [toasts, setToasts]           = useState([]);
  const [celebration, setCelebration] = useState(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getHeaders = useCallback(async () => {
    const headers = { 'Content-Type': 'application/json' };
    try {
      const token = await getAccessTokenSilently();
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch (_) {
      // No token available from Auth0 — fall back to localStorage (legacy path)
      const stored = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (stored) {
        headers.Authorization = `Bearer ${stored}`;
      } else if (isAuthenticated) {
        // The user appears authenticated but we cannot obtain a token. The Auth0
        // session may have expired or silent token renewal failed. Throw a
        // user-friendly error so callers surface a "sign in again" prompt rather
        // than letting the request go out without credentials and receiving a raw
        // 401 "Access denied. No token provided." message from the API.
        const authErr = new Error('Your session has expired. Please sign in again to continue.');
        authErr.status = 401;
        authErr.isAuthError = true;
        throw authErr;
      }
    }
    return headers;
  }, [getAccessTokenSilently, isAuthenticated]);

  const apiFetch = useCallback(async (path, options = {}) => {
    const headers = await getHeaders();
    const res = await fetch(`${GAMIFICATION_API}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return data;
  }, [getHeaders]);

  // ── Toast helpers ─────────────────────────────────────────────────────────

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Fetch progress ────────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setTierBlocked(false);
    try {
      const data = await apiFetch('/progress');
      setProgress(data.progress);
    } catch (err) {
      if (err.status === 402 || err.status === 403) {
        setTierBlocked(true);
        // Preserve the server's error message so callers can surface it if needed.
        setError(err.message || 'A paid tier (Atlas Starter or above) is required to access gamification features.');
      } else if (err.isAuthError || err.status === 401) {
        // Session expired or token missing — surface a sign-in prompt.
        setError(err.message || 'Your session has expired. Please sign in again to continue.');
      } else {
        setError(err.message || 'Could not load gamification data.');
      }
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, refresh]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const clearCelebration = useCallback(() => setCelebration(null), []);

  const recordPractice = useCallback(async (practiceId, dimension) => {
    const data = await apiFetch('/practice', {
      method: 'POST',
      body: JSON.stringify({ practiceId, ...(dimension ? { dimension } : {}) }),
    });
    if (data.newBadges && data.newBadges.length > 0) {
      // Show a toast for every unlocked badge
      data.newBadges.forEach(name => addToast(`🏅 Badge unlocked: ${name}`, 'success'));
      // Trigger celebration modal for the first new badge
      const firstBadge = BADGE_BY_NAME[data.newBadges[0]];
      if (firstBadge) setCelebration(firstBadge);
    }
    if (data.streakUpdated) {
      addToast(`🔥 ${data.currentStreak}-day streak!`, 'info');
    }
    await refresh();
    return data;
  }, [apiFetch, addToast, refresh]);

  const setChallenge = useCallback(async (dimension, difficulty = 'medium') => {
    const data = await apiFetch('/challenge', {
      method: 'POST',
      body: JSON.stringify({ dimension, difficulty }),
    });
    addToast(`🧭 Pathway started! Check in daily to build your streak.`, 'success');
    await refresh();
    return data;
  }, [apiFetch, addToast, refresh]);

  const enableLeaderboard = useCallback(async () => {
    await apiFetch('/preferences', {
      method: 'PUT',
      body: JSON.stringify({ leaderboardOptIn: true }),
    });
    await refresh();
  }, [apiFetch, refresh]);

  const fetchLeaderboard = useCallback(async (period = 'weekly') => {
    const data = await apiFetch(`/leaderboard?period=${period}`);
    return data.entries || [];
  }, [apiFetch]);

  return {
    progress,
    loading,
    error,
    tierBlocked,
    refresh,
    recordPractice,
    setChallenge,
    enableLeaderboard,
    fetchLeaderboard,
    toasts,
    dismissToast,
    addToast,
    celebration,
    clearCelebration,
  };
}
