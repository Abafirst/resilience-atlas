/**
 * useIATLASTierSync.js
 * Hook that syncs the IATLAS subscription tier from the backend to localStorage
 * on every authenticated session start.
 *
 * This ensures:
 *  - The tier stored in localStorage reflects the server-verified subscription status.
 *  - Manually edited localStorage values are overwritten on next login.
 *  - Cleared localStorage values are restored from the backend.
 *
 * Behaviour:
 *  - If no Auth0 token is cached (user not logged in), sets tierSynced immediately
 *    and returns without making any network request.
 *  - If the subscription is active/trialing, writes the tier to localStorage.
 *  - If the subscription is inactive/missing, removes the tier from localStorage.
 *  - Fails open: if the API call fails, the app is not blocked.
 */

import { useEffect, useState } from 'react';
import { getIATLASSubscriptionStatus } from '../api/iatlas.js';
import { getAuth0CachedToken } from '../lib/apiFetch.js';
import { IATLAS_TIER_KEY } from '../utils/iatlasGating.js';

export function useIATLASTierSync() {
  const [tierSynced, setTierSynced] = useState(false);
  const [syncError, setSyncError] = useState(null);

  useEffect(() => {
    async function syncTierFromBackend() {
      try {
        const token = getAuth0CachedToken();
        if (!token) {
          // User not logged in — skip sync and unblock the app immediately
          setTierSynced(true);
          return;
        }

        const { tier, status } = await getIATLASSubscriptionStatus(token);

        if (status === 'active' || status === 'trialing') {
          const currentTier = localStorage.getItem(IATLAS_TIER_KEY);
          if (currentTier !== tier) {
            localStorage.setItem(IATLAS_TIER_KEY, tier);
            if (import.meta.env?.DEV) {
              console.debug(`[IATLAS] Tier synced from backend: ${tier}`);
            }
          }
        } else {
          // Subscription not active — clear any stale tier from localStorage
          localStorage.removeItem(IATLAS_TIER_KEY);
        }
      } catch (error) {
        // Fail open — do not block the app if the sync request fails
        if (import.meta.env?.DEV) {
          console.debug('[IATLAS] Tier sync error (non-blocking):', error?.message || error);
        }
        setSyncError(error?.message || 'Tier sync failed');
      } finally {
        setTierSynced(true);
      }
    }

    syncTierFromBackend();
  }, []);

  return { tierSynced, syncError };
}
