import React, { useState, useEffect } from 'react';

const DISMISSED_KEY = 'ra-dm-hint-dismissed';

/**
 * DarkModeHint — Site-wide readability hint shown in dark mode.
 *
 * Renders a dismissible banner reminding users they can switch to light mode
 * for better text readability. Automatically appears when dark mode is active
 * and hides permanently once dismissed (stored in localStorage).
 */
export default function DarkModeHint() {
  const [isDark, setIsDark] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check persisted dismissal
    try {
      if (localStorage.getItem(DISMISSED_KEY) === 'true') {
        setDismissed(true);
      }
    } catch (_) {}

    // Sync with current data-theme attribute
    const checkTheme = () => {
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    };

    checkTheme();

    // Watch for theme changes triggered by the SiteHeader toggle
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  function handleDismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, 'true');
    } catch (_) {}
  }

  if (!isDark || dismissed) return null;

  return (
    <div className="dm-quiz-hint" role="note" aria-label="Accessibility tip">
      <img src="/icons/info.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'text-bottom' }} />
      {' '}Finding content hard to read? Select the{' '}
      <strong><span aria-hidden="true">&#9728;&#65039;</span> sun icon</strong> (top right) to switch to <strong>Light Mode</strong>.
      <button
        type="button"
        className="dm-quiz-hint-close"
        aria-label="Dismiss accessibility tip"
        onClick={handleDismiss}
      >
        &#x2715;
      </button>
    </div>
  );
}
