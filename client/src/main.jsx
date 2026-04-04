import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App.jsx';

// ===== SPA MARKER FOR DEBUGGING =====
window._spaVersion = '2026-03-29-mytest';
console.log('[DEBUG][SPA] Resilience Atlas SPA loaded, version:', window._spaVersion);
// ====================================
/**
 * Fetch Auth0 runtime configuration from the backend /config endpoint.
 *
 * The backend exposes auth0Domain and auth0ClientId from its own environment
 * variables.  Using the same values here guarantees that the SPA and the
 * server-side CSP (which also reads those env vars) always reference the
 * same Auth0 tenant — preventing the CSP from blocking the silent-auth
 * iframe or the token-exchange CORS request when the tenant domain differs
 * between the build-time VITE_ variables and the runtime environment.
 *
 * Falls back to VITE_ build-time variables so that local development without
 * a running backend still works when the developer sets those values in
 * client/.env.local.
 */
async function loadAuth0Config() {
  try {
    const res = await fetch('/config');
    if (res.ok) {
      const data = await res.json();
      if (data.auth0Domain && data.auth0ClientId) {
        return { domain: data.auth0Domain, clientId: data.auth0ClientId };
      }
    }
  } catch (_) {
    // Server unreachable — fall through to build-time fallback below.
  }
  // Fall back to values baked in at build time (local dev / offline).
  return {
    domain:   import.meta.env.VITE_AUTH0_DOMAIN,
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
  };
}

async function init() {
  const { domain, clientId } = await loadAuth0Config();
  const audience    = import.meta.env.VITE_AUTH0_AUDIENCE;
  const redirectUri = import.meta.env.VITE_AUTH0_REDIRECT_URI || window.location.origin;

  if (!domain || !clientId) {
    // Render a visible error so developers know what to fix.
    document.getElementById('root').textContent =
      'Auth0 configuration is missing. ' +
      'Set AUTH0_DOMAIN and AUTH0_CLIENT_ID on the server ' +
      '(or VITE_AUTH0_DOMAIN / VITE_AUTH0_CLIENT_ID for local development).';
    return;
  }

  // After Auth0 redirects back to the app, navigate to the path stored in
  // appState.returnTo (set by loginWithRedirect callers).  If no returnTo is
  // present we always fall back to "/" so users land on the landing/assessment
  // hub instead of wherever the browser was last pointed.
  const onRedirectCallback = (appState) => {
    const target = appState?.returnTo;
    // Validate that returnTo is a safe same-origin path before using it.
    const safePath =
      target && typeof target === 'string' && target.startsWith('/')
        ? target
        : '/';
    console.debug('[Auth0] onRedirectCallback appState:', appState, '→ navigating to', safePath);
    window.history.replaceState({}, document.title, safePath);
  };

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <Auth0Provider
        domain={domain}
        clientId={clientId}
        authorizationParams={{
          redirect_uri: redirectUri,
          ...(audience ? { audience } : {}),
        }}
        // After a successful login Auth0 calls this with the appState that was
        // passed to loginWithRedirect.  We use it to navigate deterministically
        // instead of letting Auth0 restore the browser's previous URL.
        onRedirectCallback={onRedirectCallback}
        // Persist tokens in localStorage so that navigating between pages
        // (e.g. quiz → results) does not clear the in-memory cache and force
        // a silent-authentication round-trip on every page load.
        cacheLocation="localstorage"
        // Use refresh tokens for silent token renewal instead of relying on
        // the hidden-iframe / third-party-cookie approach, which is blocked
        // by modern browsers (Chrome, Safari ITP) and produces the
        // "login_required" error that was keeping the results page on
        // "Loading…" indefinitely.
        useRefreshTokens={true}
      >
        <App />
      </Auth0Provider>
    </React.StrictMode>
  );
}

init();
