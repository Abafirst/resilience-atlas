/**
 * theme-toggle.js — Dark Mode Toggle
 * The Resilience Atlas™
 *
 * • Reads saved preference from localStorage on load
 * • Falls back to system prefers-color-scheme
 * • Applies [data-theme="dark"] on <html>
 * • Syncs across tabs via the `storage` event
 * • Exports applyTheme() for use in inline scripts
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'ra-theme';
  const DARK = 'dark';
  const LIGHT = 'light';

  /** Return the user's saved preference, or null if none. */
  function savedPreference() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (_) {
      return null;
    }
  }

  /** Return true when the system prefers dark. */
  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /** Apply the given theme ('dark' | 'light') to <html>. */
  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === DARK) {
      root.setAttribute('data-theme', DARK);
    } else {
      root.setAttribute('data-theme', LIGHT);
    }
    updateToggleIcon(theme);
  }

  /** Update the icon/label of every .theme-toggle button on the page. */
  function updateToggleIcon(theme) {
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      var isDark = theme === DARK;
      btn.setAttribute('aria-pressed', String(isDark));
      btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      btn.innerHTML = isDark
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    });
  }

  /** Determine and apply the initial theme before first paint. */
  function initTheme() {
    var pref = savedPreference();
    var theme = pref || (systemPrefersDark() ? DARK : LIGHT);
    applyTheme(theme);
  }

  /** Toggle between dark and light, save to localStorage. */
  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') === DARK ? DARK : LIGHT;
    var next = current === DARK ? LIGHT : DARK;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (_) {}
    applyTheme(next);
  }

  /** Wire up click listeners on all .theme-toggle buttons. */
  function bindToggles() {
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.addEventListener('click', toggleTheme);
    });
  }

  /** Sync theme when another tab changes the preference. */
  function onStorageChange(e) {
    if (e.key === STORAGE_KEY) {
      applyTheme(e.newValue === DARK ? DARK : LIGHT);
    }
  }

  // ── Bootstrap ────────────────────────────────────────────────────────────

  // Apply before DOM is interactive to prevent flash of wrong theme.
  initTheme();

  // Bind buttons once DOM is ready.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindToggles);
  } else {
    bindToggles();
  }

  // Listen for system preference changes when the user hasn't set a manual pref.
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      if (!savedPreference()) {
        applyTheme(e.matches ? DARK : LIGHT);
      }
    });
  }

  // Sync across browser tabs.
  window.addEventListener('storage', onStorageChange);

  // Expose for inline usage (e.g. server-side rendered pages).
  window.raTheme = { apply: applyTheme, toggle: toggleTheme };
}());
