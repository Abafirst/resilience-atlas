/**
 * authFetch.js
 * Authenticated fetch wrapper that automatically redirects to login on
 * token failure or 401 API responses.
 *
 * @param {string}   path                   - API endpoint path (relative or absolute)
 * @param {RequestInit} [options]            - Standard fetch options
 * @param {Function} getAccessTokenSilently - Auth0 token getter
 * @param {Function} loginWithRedirect      - Auth0 login redirect
 * @returns {Promise<Response>}
 */
export async function authFetch(path, options = {}, getAccessTokenSilently, loginWithRedirect) {
  let token = null;

  try {
    token = await getAccessTokenSilently();
  } catch (err) {
    if (err.error === 'login_required' || err.message?.includes('Missing Refresh Token')) {
      loginWithRedirect({
        appState: { returnTo: window.location.pathname + window.location.search },
      });
      throw new Error('Session expired. Redirecting to login...');
    }
    // Log other token retrieval errors and fall through without a token
    console.warn('[authFetch] getAccessTokenSilently failed:', err?.message || err);
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(path, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    loginWithRedirect({
      appState: { returnTo: window.location.pathname + window.location.search },
    });
    throw new Error('Session expired. Redirecting to login...');
  }

  return res;
}

export default authFetch;
