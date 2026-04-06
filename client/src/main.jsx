import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App.jsx';

// ===== SPA MARKER FOR DEBUGGING =====
window._spaVersion = import.meta.env.VITE_APP_VERSION || 'dev';
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
        return {
          domain:   data.auth0Domain,
          clientId: data.auth0ClientId,
          // Prefer server-side audience so the SPA and backend always agree,
          // even when VITE_AUTH0_AUDIENCE was not set at build time.
          audience: data.auth0Audience || import.meta.env.VITE_AUTH0_AUDIENCE || null,
        };
      }
    }
  } catch (_) {
    // Server unreachable — fall through to build-time fallback below.
  }
  // Fall back to values baked in at build time (local dev / offline).
  return {
    domain:   import.meta.env.VITE_AUTH0_DOMAIN,
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
    audience: import.meta.env.VITE_AUTH0_AUDIENCE || null,
  };
}

async function init() {
  const { domain, clientId, audience: configAudience } = await loadAuth0Config();
  const audience    = configAudience;
  const redirectUri = import.meta.env.VITE_AUTH0_REDIRECT_URI || window.location.origin;

  if (!domain || !clientId) {
    // Render a visible error so developers know what to fix.
    document.getElementById('root').textContent =
      'Auth0 configuration is missing. ' +
      'Set AUTH0_DOMAIN and AUTH0_CLIENT_ID on the server ' +
      '(or VITE_AUTH0_DOMAIN / VITE_AUTH0_CLIENT_ID for local development).';
    return;
  }

  // After Auth0 redirects back to the app, check whether the user has already
  // completed the quiz and navigate to the appropriate page:
  //   - appState.returnTo is honoured when explicitly set (e.g. deep-link logins)
  //   - if the user has a completed quiz → /results
  //   - otherwise → / (assessment hub for new users)
  const onRedirectCallback = (appState, user) => {
    // If a specific returnTo was encoded in appState, honour it (deep-link logins).
    const explicitTarget = appState?.returnTo;
    // Also check sessionStorage as a belt-and-suspenders fallback (set by pages
    // that call loginWithRedirect, e.g. GamificationDashboard).
    let sessionTarget = '';
    try {
      sessionTarget = sessionStorage.getItem('returnAfterLogin') || '';
      sessionStorage.removeItem('returnAfterLogin');
    } catch (_) {}
    const returnTarget = explicitTarget || sessionTarget;
    if (
      returnTarget &&
      typeof returnTarget === 'string' &&
      returnTarget.startsWith('/') &&
      returnTarget !== '/'
    ) {
      console.debug('[Auth0] onRedirectCallback returnTo:', returnTarget);
      // Use window.location.replace so that React Router initialises at the
      // correct path.  window.history.replaceState only changes the address
      // bar without firing a popstate event, so React Router v6 would never
      // re-render the matching route.  A full navigation (replace, not push)
      // keeps the back-button behaviour clean.
      window.location.replace(returnTarget);
      return;
    }

    // No explicit destination — check quiz/subscription status and redirect smartly.
    const email = user?.email;
    if (email) {
      fetch(`/api/auth/user-status?email=${encodeURIComponent(email)}`)
        .then((r) => {
          if (!r.ok) throw new Error('Failed to fetch user status');
          return r.json();
        })
        .then((data) => {
          const target = data.hasCompletedQuiz ? '/results' : '/';
          console.debug('[Auth0] onRedirectCallback status check → navigating to', target);
          window.location.replace(target);
        })
        .catch(() => {
          // On error fall back to home; HomeRoute will re-check on mount.
          window.location.replace('/');
        });
    } else {
      window.location.replace('/');
    }
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
