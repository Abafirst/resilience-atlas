/**
 * ProfileContext.jsx
 * Global state for IATLAS child profile management.
 *
 * Provides:
 *   profiles          — array of ChildProfile objects for the current user
 *   activeProfileId   — profileId of the currently selected child
 *   activeProfile     — full profile object (derived)
 *   loading           — true while fetching from the API
 *   error             — last API error message, or null
 *   errorCode         — 'auth' when the error is authentication-related, otherwise null
 *
 *   switchProfile(profileId)          — set the active profile
 *   createProfile(data)               — POST a new profile
 *   updateProfile(profileId, data)    — PUT edits to an existing profile
 *   deleteProfile(profileId)          — DELETE (archive) a profile
 *   loginWithRedirect()                — redirect the user to the Auth0 login page
 *   refreshProfiles()                 — re-fetch from the API
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useAuth0 } from '@auth0/auth0-react';

// ── Storage key for the active profile ID ────────────────────────────────────

const ACTIVE_PROFILE_KEY = 'iatlas_active_profile_id';

// ── Context & hook ────────────────────────────────────────────────────────────

const ProfileContext = createContext(null);

export function useProfiles() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error('useProfiles must be used inside <ProfileProvider>');
  }
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ProfileProvider({ children }) {
  const { isAuthenticated, loginWithRedirect, getAccessTokenSilently } = useAuth0();

  const [profiles,        setProfiles]        = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(() => {
    try { return localStorage.getItem(ACTIVE_PROFILE_KEY) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [errorCode, setErrorCode] = useState(null); // 'auth' | null

  // ── API helpers ─────────────────────────────────────────────────────────────

  const getAuthHeaders = useCallback(async () => {
    if (!isAuthenticated) {
      const err = new Error('You must be logged in to access profiles');
      err.isAuthError = true;
      throw err;
    }

    try {
      const token = await getAccessTokenSilently({
        cacheMode: 'on', // Use cached token if available
      });

      return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    } catch (err) {
      // Log the actual error for debugging
      console.error('[ProfileContext] Auth token error:', err);

      // Throw a tagged, user-friendly error
      const toThrow = (() => {
        if (err.error === 'login_required') {
          return new Error('Please log in again to continue');
        } else if (err.error === 'consent_required') {
          return new Error('Additional permissions required');
        } else {
          return new Error('Authentication failed. Please refresh the page or log in again.');
        }
      })();
      toThrow.isAuthError = true;
      throw toThrow;
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  // ── Fetch profiles ──────────────────────────────────────────────────────────

  const refreshProfiles = useCallback(async () => {
    if (!isAuthenticated) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      const headers = await getAuthHeaders();
      const res     = await fetch('/api/iatlas/profiles', { headers });

      if (res.status === 401) {
        setErrorCode('auth');
        throw new Error('Your session has expired. Please log in again.');
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to load profiles (${res.status})`);
      }

      const data = await res.json();
      setProfiles(data);

      // Auto-select a profile if the stored one is no longer valid.
      if (data.length > 0) {
        const stored = localStorage.getItem(ACTIVE_PROFILE_KEY);
        const still  = data.find(p => p.profileId === stored);
        if (!still) {
          const first = data[0].profileId;
          setActiveProfileId(first);
          try { localStorage.setItem(ACTIVE_PROFILE_KEY, first); } catch { /* noop */ }
        }
      }
    } catch (err) {
      console.error('[ProfileContext] Failed to refresh profiles:', err);
      if (err.isAuthError) setErrorCode('auth');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getAuthHeaders]);

  useEffect(() => {
    refreshProfiles();
  }, [refreshProfiles]);

  // ── Switch profile ──────────────────────────────────────────────────────────

  const switchProfile = useCallback((profileId) => {
    setActiveProfileId(profileId);
    try { localStorage.setItem(ACTIVE_PROFILE_KEY, profileId); } catch { /* noop */ }
  }, []);

  // ── Create profile ──────────────────────────────────────────────────────────

  const createProfile = useCallback(async (data) => {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/iatlas/profiles', {
      method:  'POST',
      headers,
      body:    JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw Object.assign(new Error(json.error || 'Create failed'), json);
    setProfiles(prev => [...prev, json]);
    // Auto-switch to the newly created profile.
    switchProfile(json.profileId);
    return json;
  }, [getAuthHeaders, switchProfile]);

  // ── Update profile ──────────────────────────────────────────────────────────

  const updateProfile = useCallback(async (profileId, data) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/iatlas/profiles/${profileId}`, {
      method:  'PUT',
      headers,
      body:    JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Update failed');
    setProfiles(prev => prev.map(p => p.profileId === profileId ? json : p));
    return json;
  }, [getAuthHeaders]);

  // ── Delete (archive) profile ────────────────────────────────────────────────

  const deleteProfile = useCallback(async (profileId) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/iatlas/profiles/${profileId}`, {
      method:  'DELETE',
      headers,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Delete failed');

    setProfiles(prev => {
      const remaining = prev.filter(p => p.profileId !== profileId);
      // If the deleted profile was active, switch to the first remaining one.
      if (activeProfileId === profileId) {
        const next = remaining[0]?.profileId || null;
        setActiveProfileId(next);
        try {
          if (next) localStorage.setItem(ACTIVE_PROFILE_KEY, next);
          else localStorage.removeItem(ACTIVE_PROFILE_KEY);
        } catch { /* noop */ }
      }
      return remaining;
    });
    return json;
  }, [getAuthHeaders, activeProfileId]);

  // ── Derived active profile ──────────────────────────────────────────────────

  const activeProfile = useMemo(
    () => profiles.find(p => p.profileId === activeProfileId) || null,
    [profiles, activeProfileId]
  );

  // ── Context value ───────────────────────────────────────────────────────────

  const value = useMemo(() => ({
    profiles,
    activeProfileId: activeProfile?.profileId || activeProfileId,
    activeProfile,
    loading,
    error,
    errorCode,
    switchProfile,
    createProfile,
    updateProfile,
    deleteProfile,
    refreshProfiles,
    loginWithRedirect,
  }), [
    profiles, activeProfile, loading, error, errorCode,
    switchProfile, createProfile, updateProfile, deleteProfile, refreshProfiles,
  ]);

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export default ProfileContext;
