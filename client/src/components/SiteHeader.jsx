import React, { useState, useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const DEFAULT_NAV_ITEMS = [
  { href: '/', label: 'Home', key: 'home' },
  { href: '/assessment', label: 'Assessment', key: 'assessment' },
  { href: '/iatlas', label: 'IATLAS Curriculum', key: 'iatlas' },
  { href: '/research', label: 'Research', key: 'research' },
  { href: '/resources', label: 'Resources', key: 'resources' },
  { href: '/teams', label: 'Teams', key: 'teams' },
  { href: '/kids', label: 'Kids', key: 'kids' },
  { href: '/about', label: 'About', key: 'about' },
];

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
  const { isAuthenticated, isLoading: auth0Loading, loginWithRedirect } = useAuth0();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
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

  // "Resilience Journey" always links to /results-history.
  // Unauthenticated users are prompted to sign in (loginWithRedirect) and
  // returned to /results-history after successful login.

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
    <a className="btn btn-primary" href="/quiz" title="For adults 18+">Take the Assessment <span style={{fontSize: '0.85em', opacity: 0.85}}>(18+)</span></a>
  );

  const resolvedCta = ctaButton === undefined ? defaultCta : ctaButton;

  return (
    <header className="site-header" role="banner">
      <div className="header-inner">
        <a className="logo" href="/">
          <div className="logo-icon" aria-hidden="true">
            <img src={`${import.meta.env.BASE_URL}assets/logo-256x256.png?v=2026-04-13`} alt="The Resilience Atlas™" width="36" height="36" />
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
          <a
            href="/results-history"
            className={`nav-link nav-link--journey${activePage === 'gamification' ? ' active' : ''}`}
            aria-label="Resilience Journey — your practices and progress"
            onClick={(e) => {
              // Unauthenticated users are always prompted to sign in and
              // returned to /results-history after login.
              if (!isAuthenticated && !auth0Loading) {
                e.preventDefault();
                loginWithRedirect({ appState: { returnTo: '/results-history' } });
              }
            }}
          >
            <img src="/icons/compass.svg" alt="" aria-hidden="true" style={{width:16,height:16,verticalAlign:"middle",marginRight:5}} /> Resilience Journey
          </a>
          <button
            className="theme-toggle"
            aria-label={isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={isDarkTheme ? 'true' : 'false'}
            title={isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={handleThemeToggle}
          >
            {isDarkTheme ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
          {resolvedCta}
        </nav>
      </div>
    </header>
  );
}
