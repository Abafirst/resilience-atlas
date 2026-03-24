/* =====================================================
   quiz-auth.js — Auth0 authentication guard for quiz.html

   On page load this module:
     1. Fetches Auth0 configuration from the server's /config endpoint.
        Required server environment variables:
          AUTH0_DOMAIN    – e.g. dev-xxxx.us.auth0.com
          AUTH0_CLIENT_ID – the SPA client ID from the Auth0 dashboard
     2. Initialises the Auth0 SPA JS SDK.
     3. Handles any redirect callback from Auth0 (when returning after login).
     4. If the user is not authenticated, redirects them to the Auth0
        Universal Login page.  The redirect_uri is always set to the quiz
        page so that Auth0 returns users here after successful login.
     5. If the user IS authenticated, hides the loading overlay and lets
        the rest of the page (quiz.js) proceed normally.

   Auth0 Dashboard – Application settings required:
     Allowed Callback URLs : https://yourdomain.com/quiz.html,
                             http://localhost:3000/quiz.html
     Allowed Logout URLs   : https://yourdomain.com, http://localhost:3000
     Allowed Web Origins   : https://yourdomain.com, http://localhost:3000
   ===================================================== */

(function () {
  'use strict';

  function showError(message) {
    var overlay = document.getElementById('spinnerOverlay');
    var label   = document.getElementById('spinnerText');
    if (label)   label.textContent = message;
    if (overlay) overlay.classList.add('active');
  }

  function hideSpinner() {
    var overlay = document.getElementById('spinnerOverlay');
    if (overlay) overlay.classList.remove('active');
  }

  async function initAuth() {
    // ── 1. Fetch runtime configuration from the server ──────────────────
    var config;
    try {
      var res = await fetch('/config');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      config = await res.json();
    } catch (err) {
      // Server is unreachable or returned an error — block access and tell
      // the user rather than silently bypassing authentication.
      console.error('[quiz-auth] Could not fetch /config:', err);
      showError('Unable to verify authentication. Please refresh the page or try again later.');
      return;
    }

    var auth0Domain   = config.auth0Domain;
    var auth0ClientId = config.auth0ClientId;

    // If Auth0 is not configured server-side, allow access without login
    // so that local development without Auth0 credentials still works.
    if (!auth0Domain || !auth0ClientId) {
      console.warn(
        '[quiz-auth] AUTH0_DOMAIN or AUTH0_CLIENT_ID is not set on the server. ' +
        'Auth enforcement is disabled. Set both environment variables to require login.'
      );
      hideSpinner();
      return;
    }

    // ── 2. Initialise Auth0 SPA JS client ───────────────────────────────
    var redirectUri = window.location.origin + '/quiz.html';
    var client;
    try {
      client = await window.auth0.createAuth0Client({
        domain:   auth0Domain,
        clientId: auth0ClientId,
        authorizationParams: {
          redirect_uri: redirectUri,
        },
      });
    } catch (err) {
      console.error('[quiz-auth] Failed to initialise Auth0 client:', err);
      showError('Authentication service unavailable. Please refresh the page or contact support.');
      return;
    }

    // ── 3. Handle redirect callback (returning from Auth0 login) ────────
    if (window.location.search.includes('code=') &&
        window.location.search.includes('state=')) {
      try {
        await client.handleRedirectCallback();
        // Remove the Auth0 query params from the URL to keep it clean.
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err) {
        console.error('[quiz-auth] Error handling redirect callback:', err);
      }
    }

    // ── 4. Check authentication status ──────────────────────────────────
    var isAuthenticated = await client.isAuthenticated();

    if (!isAuthenticated) {
      // Redirect to Auth0 Universal Login.
      // The spinner stays visible while the browser navigates away.
      await client.loginWithRedirect({
        authorizationParams: {
          redirect_uri: redirectUri,
        },
      });
      return;
    }

    // ── 5. Authenticated – reveal the quiz ──────────────────────────────
    hideSpinner();
  }

  // Run as soon as the DOM is available so the spinner is shown early.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }
}());

