/**
 * apiFetch — authenticated fetch helper for the Resilience Atlas SPA.
 *
 * Wraps the browser's fetch() API and automatically attaches an
 * `Authorization: Bearer <token>` header using the Auth0 access token
 * obtained via getAccessTokenSilently().
 *
 * Usage (inside a React component that calls useAuth0):
 *
 *   const { getAccessTokenSilently } = useAuth0();
 *   const res = await apiFetch('/api/auth/profile', {}, getAccessTokenSilently);
 *
 * Falls back to an unauthenticated request when getAccessTokenSilently is not
 * provided or when the token cannot be retrieved (e.g. offline, no audience
 * configured).  This ensures non-protected calls still work without changes.
 */

/**
 * Fetch a URL, optionally attaching an Auth0 bearer token.
 *
 * @param {string}   url
 * @param {RequestInit} [options]      - Standard fetch options (method, body, headers, …)
 * @param {Function} [getTokenFn]      - Auth0 getAccessTokenSilently hook value
 * @returns {Promise<Response>}
 */
export async function apiFetch(url, options = {}, getTokenFn) {
  // Only carry forward the caller's headers; do not inject a default
  // Content-Type so that multipart and other non-JSON requests work correctly.
  const headers = { ...(options.headers || {}) };

  if (typeof getTokenFn === 'function') {
    try {
      const token = await getTokenFn();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (err) {
      // getAccessTokenSilently failed (e.g. user not logged in, no audience).
      // Log in development so misconfiguration is easy to spot, then proceed
      // without the Authorization header — unprotected routes still work.
      if (import.meta.env?.DEV) {
        console.debug('[apiFetch] Could not get access token:', err?.message || err);
      }
    }
  }

  return fetch(url, { ...options, headers });
}

export default apiFetch;
