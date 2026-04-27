/**
 * useFavorites.js
 * React hook for managing a user's favorited IATLAS activities.
 *
 * - Loads favorites from the backend on mount (when authenticated)
 * - Provides toggleFavorite() with optimistic UI updates
 * - Falls back gracefully when the user is not authenticated
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiUrl } from '../api/baseUrl.js';

export default function useFavorites() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();

  const [favoriteIds, setFavoriteIds] = useState(/** @type {string[]} */([]));
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState(null);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  async function getToken() {
    try {
      return await getAccessTokenSilently();
    } catch {
      return null;
    }
  }

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // ── Toggle favorite ──────────────────────────────────────────────────────────

  const toggleFavorite = useCallback(async (activityId) => {
    if (!isAuthenticated) return;

    const wasFavorited = favoriteIds.includes(activityId);

    // Optimistic update
    setFavoriteIds(prev =>
      wasFavorited ? prev.filter(id => id !== activityId) : [...prev, activityId]
    );

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, favoriteIds]);

  const isFavorited = useCallback(
    (activityId) => favoriteIds.includes(activityId),
    [favoriteIds]
  );

  return { favoriteIds, isFavorited, toggleFavorite, isLoading, error };
}
