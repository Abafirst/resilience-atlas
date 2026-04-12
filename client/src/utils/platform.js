/**
 * platform.js — runtime platform detection for Capacitor-bundled builds.
 *
 * Provides helpers to detect Android (Capacitor) and to open external URLs
 * safely on both web and native environments.
 *
 * On Capacitor Android the WebView origin is not the production domain, so
 * `getWebUrl` uses a hard-coded production origin instead of
 * `window.location.origin` to construct absolute URLs.
 */

const PRODUCTION_ORIGIN = 'https://theresilienceatlas.com';

/**
 * Returns true when the SPA is running inside a Capacitor Android native
 * wrapper.  `window.Capacitor` is injected by the native WebView bridge.
 */
export function isCapacitorAndroid() {
  return (
    typeof window !== 'undefined' &&
    window.Capacitor != null &&
    typeof window.Capacitor.isNativePlatform === 'function' &&
    window.Capacitor.isNativePlatform() &&
    typeof window.Capacitor.getPlatform === 'function' &&
    window.Capacitor.getPlatform() === 'android'
  );
}

/**
 * Returns an absolute URL for the given path.
 *
 * On Capacitor Android the WebView origin resolves to `capacitor://localhost`
 * rather than the production domain, so we substitute the hard-coded
 * production origin.  On the web we use the page's actual origin so the app
 * works in both dev and production.
 *
 * @param {string} path  Path starting with `/`, e.g. `'/teams'`
 * @returns {string}     Absolute URL
 */
export function getWebUrl(path) {
  if (isCapacitorAndroid()) {
    return `${PRODUCTION_ORIGIN}${path}`;
  }
  return `${window.location.origin}${path}`;
}

/**
 * Opens a URL in an external browser.
 *
 * On Capacitor Android `window.open` with target `'_blank'` triggers Chrome
 * Custom Tabs — a browser window outside the app WebView.  On the web it
 * opens a new tab in the usual way.
 *
 * @param {string} url  Absolute URL to open
 */
export function openExternalUrl(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}
