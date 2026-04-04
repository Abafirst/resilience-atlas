import React, { useState, useEffect, useRef } from 'react';

const DEFAULT_NAV_ITEMS = [
  { href: '/', label: 'Home', key: 'home' },
  { href: '/assessment', label: 'Assessment', key: 'assessment' },
  { href: '/research', label: 'Research', key: 'research' },
  { href: '/teams', label: 'Teams', key: 'teams' },
  { href: '/kids', label: 'Kids', key: 'kids' },
  { href: '/about', label: 'About', key: 'about' },
];

/** Tiers that include Atlas Starter access or above. */
const STARTER_AND_ABOVE = ['atlas-starter', 'atlas-navigator', 'atlas-premium'];

/** Returns true when the locally-stored tier grants Starter (or above) access. */
function readIsStarterOrAbove() {
  try {
    const stored = localStorage.getItem('resilience_tier');
    return STARTER_AND_ABOVE.includes(stored);
  } catch (_) {
    return false;
  }
}

/**
 * SiteHeader — Shared responsive header/navigation component.
 *
 * Props:
 *  activePage    {string}       Key of the currently active nav item (e.g. 'research')
 *  navItems      {Array}        Custom nav items array; defaults to DEFAULT_NAV_ITEMS
 *  ctaButton     {ReactNode}    Custom CTA element. Pass `null` to suppress CTA entirely.
 *                               If omitted, renders the default "Take the Assessment" link.
 *  onThemeChange {Function}     Optional callback (isDark: boolean) when theme is toggled.
 */
export default function SiteHeader({
  activePage = '',
  navItems,
  ctaButton,
  onThemeChange,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  // Lazy initializer: read tier once on mount; missing/non-paid tier returns false.
  const [showJourneyLink, setShowJourneyLink] = useState(() => readIsStarterOrAbove());
  const navRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    try {
      const t = localStorage.getItem('ra-theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const dark = t === 'dark' || (!t && prefersDark);
      if (dark) document.documentElement.setAttribute('data-theme', 'dark');
      setIsDarkTheme(dark);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        toggleRef.current && toggleRef.current.focus();
      }
    }

    function handleClickOutside(e) {
      if (
        navRef.current && !navRef.current.contains(e.target) &&
        toggleRef.current && !toggleRef.current.contains(e.target)
      ) {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  function handleThemeToggle() {
    try {
      const next = !isDarkTheme;
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      localStorage.setItem('ra-theme', next ? 'dark' : 'light');
      setIsDarkTheme(next);
      if (onThemeChange) onThemeChange(next);
    } catch (_) {}
  }

  const items = navItems !== undefined ? navItems : DEFAULT_NAV_ITEMS;

  const defaultCta = (
    <a className="btn btn-primary" href="/quiz">Take the Assessment</a>
  );

  const resolvedCta = ctaButton === undefined ? defaultCta : ctaButton;

  return (
    <header className="site-header" role="banner">
      <div className="header-inner">
        <a className="logo" href="/">
          <div className="logo-icon" aria-hidden="true">
            <img src="/assets/compass-icon.svg" alt="The Resilience Atlas™" width="36" height="36" />
          </div>
          <span className="logo-text">The Resilience Atlas&#8482;</span>
        </a>

        <button
          ref={toggleRef}
          className={`hamburger-toggle${mobileMenuOpen ? ' is-open' : ''}`}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="site-main-nav"
          onClick={() => setMobileMenuOpen(open => !open)}
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </button>

        <nav
          id="site-main-nav"
          ref={navRef}
          className={`header-nav${mobileMenuOpen ? ' mobile-open' : ''}`}
          aria-label="Main navigation"
        >
          {items.map(item => (
            <a
              key={item.key}
              href={item.href}
              className={`nav-link${activePage === item.key ? ' active' : ''}`}
            >
              {item.label}
            </a>
          ))}
          {showJourneyLink && (
            <a
              href="/gamification"
              className={`nav-link nav-link--journey${activePage === 'gamification' ? ' active' : ''}`}
              aria-label="Resilience Journey — your practices and progress"
            >
              <img src="/icons/compass.svg" alt="" aria-hidden="true" style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: 5 }} />
              Resilience Journey
            </a>
          )}
          <button
            className="theme-toggle"
            aria-label={isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={isDarkTheme ? 'true' : 'false'}
            title="Toggle dark mode"
            onClick={handleThemeToggle}
          />
          {resolvedCta}
        </nav>
      </div>
    </header>
  );
}
