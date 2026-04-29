/**
 * useFavorites.js
 * React hook for managing a user's favorited IATLAS activities.
 *
 * - Loads favorites from the backend on mount (when authenticated)
 * - Provides toggleFavorite() with optimistic UI updates
 * - Falls back gracefully when the user is not authenticated
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiUrl } from '../api/baseUrl.js';

export default function useFavorites() {
  const { isAuthenticated, getAccessTokenSilently, loginWithRedirect } = useAuth0();

  const [favoriteIds, setFavoriteIds] = useState(/** @type {string[]} */([]));
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState(null);

  // Stable ref so callbacks always call the latest getAccessTokenSilently
  // without needing it in their dependency arrays.
  const getAccessTokenRef = useRef(getAccessTokenSilently);
  useEffect(() => {
    getAccessTokenRef.current = getAccessTokenSilently;
  }, [getAccessTokenSilently]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const getToken = useCallback(async () => {
    try {
      return await getAccessTokenRef.current();
    } catch (err) {
      // If the refresh token is missing or login is required, redirect to Auth0
      if (
        isAuthenticated &&
        (err.error === 'login_required' || err.message?.includes('Missing Refresh Token'))
      ) {
        loginWithRedirect({
          appState: { returnTo: window.location.pathname + window.location.search },
        });
      }
      return null;
    }
  }, [isAuthenticated, loginWithRedirect]);

  // ── Load favorites on mount ──────────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    async function loadFavorites() {
      setIsLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) return;

        const res = await fetch(apiUrl('/api/activity-favorites'), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (!cancelled) {
          setFavoriteIds((data.favorites || []).map(f => f.activityId));
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadFavorites();
    return () => { cancelled = true; };
  }, [isAuthenticated, getToken]);

  // ── Toggle favorite ──────────────────────────────────────────────────────────

  const toggleFavorite = useCallback(async (activityId) => {
    if (!isAuthenticated) return;

    // Capture current state via functional updater to avoid stale closure.
    // We use a ref to communicate `wasFavorited` out of the updater.
    let wasFavorited = false;
    setFavoriteIds(prev => {
      wasFavorited = prev.includes(activityId);
      return wasFavorited ? prev.filter(id => id !== activityId) : [...prev, activityId];
    });

    try {
      const token = await getToken();
      if (!token) throw new Error('No token');

      const method = wasFavorited ? 'DELETE' : 'POST';
      const res = await fetch(apiUrl(`/api/activity-favorites/${activityId}`), {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setFavoriteIds((data.favorites || []).map(f => f.activityId));
    } catch (err) {
      // Revert optimistic update on error
      setFavoriteIds(prev =>
        wasFavorited ? [...prev, activityId] : prev.filter(id => id !== activityId)
      );
      setError(err.message);
    }
  }, [isAuthenticated, getToken]);

  const isFavorited = useCallback(
    (activityId) => favoriteIds.includes(activityId),
    [favoriteIds]
  );

  return { favoriteIds, isFavorited, toggleFavorite, isLoading, error };
}
