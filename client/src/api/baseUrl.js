/**
 * baseUrl — native platform detection for Capacitor-bundled builds.
 *
 * When the SPA is running inside the Android (or iOS) Capacitor native wrapper
 * the Vite dev-proxy is not available, so relative paths like `/api/...` would
 * hit the local WebView server and return nothing.
 *
 * This module exports a single `apiUrl(path)` helper that:
 *   - On a native Capacitor platform: prefixes the path with the public
 *     production origin so every fetch goes to the real backend.
 *   - On the web (dev or production website): returns the path unchanged,
 *     preserving the existing same-origin / Vite-proxy behaviour.
 */

const PRODUCTION_ORIGIN = 'https://theresilienceatlas.com';

/**
 * Returns true when the SPA is running inside a Capacitor native wrapper.
 * `window.Capacitor` is injected by the native WebView bridge at runtime.
 */
function isNative() {
  return !!(
    typeof window !== 'undefined' &&
    window.Capacitor &&
    typeof window.Capacitor.isNativePlatform === 'function' &&
    window.Capacitor.isNativePlatform()
  );
}

/**
 * Resolve an API path to the correct URL for the current runtime environment.
 *
 * @param {string} path - Relative API path, e.g. `'/api/auth/user-status'`
 * @returns {string}      Absolute URL on native platforms; same path on web.
 *
 * @example
 * // Inside a component / hook:
 * import { apiUrl } from '../api/baseUrl.js';
 * const res = await fetch(apiUrl('/api/gamification/progress'), { headers });
 */
export function apiUrl(path) {
  return isNative() ? `${PRODUCTION_ORIGIN}${path}` : path;
}

export default apiUrl;
