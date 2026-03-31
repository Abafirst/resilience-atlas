import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

import useGamification from '../../hooks/useGamification.js';
import StreakWidget from './StreakWidget.jsx';
import PointsWidget from './PointsWidget.jsx';
import BadgesWidget from './BadgesWidget.jsx';
import ChallengeWidget from './ChallengeWidget.jsx';
import LeaderboardWidget from './LeaderboardWidget.jsx';
import GamificationToast from './GamificationToast.jsx';

const s = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: '#1a1a2e',
  },
  header: {
    background: '#1a1a2e',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  logo: {
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: 18,
  },
  nav: {
    display: 'flex',
    gap: 20,
    alignItems: 'center',
  },
  navLink: {
    color: '#a0aec0',
    textDecoration: 'none',
    fontSize: 14,
  },
  hero: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    color: '#fff',
    textAlign: 'center',
    padding: '48px 24px 36px',
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#7aafc8',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: 800,
    margin: '0 0 10px',
    lineHeight: 1.2,
  },
  heroSub: {
    fontSize: 15,
    color: '#a0aec0',
    margin: 0,
  },
  main: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '36px 24px',
  },
  loadingMsg: {
    textAlign: 'center',
    padding: '60px 24px',
    fontSize: 15,
    color: '#64748b',
  },
  errorMsg: {
    textAlign: 'center',
    padding: '40px 24px',
    color: '#dc2626',
    fontSize: 15,
  },
  upgradeMsg: {
    background: '#fef3c7',
    border: '1px solid #fcd34d',
    borderRadius: 12,
    padding: '24px 28px',
    textAlign: 'center',
    color: '#92400e',
    fontSize: 15,
    lineHeight: 1.6,
  },
  upgradeLink: {
    display: 'inline-block',
    marginTop: 16,
    background: '#d97706',
    color: '#fff',
    fontWeight: 700,
    padding: '10px 24px',
    borderRadius: 8,
    textDecoration: 'none',
    fontSize: 14,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 20,
  },
  fullWidth: {
    gridColumn: '1 / -1',
  },
  footer: {
    background: '#1a1a2e',
    color: '#a0aec0',
    textAlign: 'center',
    padding: '24px',
    fontSize: 13,
    marginTop: 'auto',
  },
  footerLink: {
    color: '#7aafc8',
    textDecoration: 'none',
  },
};

/**
 * GamificationDashboard — full-page React component displaying all
 * gamification widgets: streak, points, badges, weekly challenge, and leaderboard.
 */
export default function GamificationDashboard() {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const {
    progress,
    loading,
    error,
    setChallenge,
    enableLeaderboard,
    fetchLeaderboard,
    toasts,
    dismissToast,
  } = useGamification();

  const isUpgradeError = error && (
    error.toLowerCase().includes('paid tier') ||
    error.toLowerCase().includes('upgrade') ||
    error.toLowerCase().includes('402')
  );

  return (
    <>
      <div style={s.page}>
        {/* Header */}
        <header style={s.header} role="banner">
          <a href="/" style={s.logo}>The Resilience Atlas™</a>
          <nav style={s.nav} aria-label="Main navigation">
            <a href="/" style={s.navLink}>Home</a>
            <a href="/results" style={s.navLink}>My Results</a>
            <a href="/atlas" style={s.navLink}>Atlas</a>
            <a href="/gamification" style={{ ...s.navLink, color: '#fff', fontWeight: 600 }}>
              My Progress
            </a>
          </nav>
        </header>

        {/* Hero */}
        <section style={s.hero}>
          <div style={s.heroEyebrow}>Resilience Journey</div>
          <h1 style={s.heroTitle}>Your Progress Dashboard</h1>
          <p style={s.heroSub}>
            Track streaks, points, badges, and weekly challenges on your resilience journey.
          </p>
        </section>

        {/* Main content */}
        <main style={s.main}>
          {!isAuthenticated && (
            <div style={s.upgradeMsg}>
              <p style={{ margin: 0 }}>Sign in to view your gamification progress.</p>
              <button
                style={{ ...s.upgradeLink, background: '#2563eb', border: 'none', cursor: 'pointer' }}
                onClick={() => loginWithRedirect()}
              >
                Sign In
              </button>
            </div>
          )}

          {isAuthenticated && loading && (
            <div style={s.loadingMsg} role="status" aria-live="polite">
              Loading your progress…
            </div>
          )}

          {isAuthenticated && !loading && isUpgradeError && (
            <div style={s.upgradeMsg} role="alert">
              <p style={{ margin: 0 }}>
                🔒 Gamification features are available on <strong>Atlas Navigator</strong> and
                above plans. Upgrade to start tracking streaks, earning badges, and competing on
                the leaderboard.
              </p>
              <a href="/pricing-teams" style={s.upgradeLink}>View Plans</a>
            </div>
          )}

          {isAuthenticated && !loading && error && !isUpgradeError && (
            <div style={s.errorMsg} role="alert">
              {error}
            </div>
          )}

          {isAuthenticated && !loading && !error && progress && (
            <div style={s.grid}>
              <StreakWidget progress={progress} />
              <PointsWidget progress={progress} />
              <BadgesWidget progress={progress} />
              <ChallengeWidget
                progress={progress}
                onSetChallenge={setChallenge}
              />
              <div style={s.fullWidth}>
                <LeaderboardWidget
                  progress={progress}
                  fetchLeaderboard={fetchLeaderboard}
                  onEnableLeaderboard={enableLeaderboard}
                />
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer style={s.footer} role="contentinfo">
          <p style={{ margin: 0 }}>
            &copy; {new Date().getFullYear()} The Resilience Atlas™ &nbsp;·&nbsp;{' '}
            <a href="/about" style={s.footerLink}>About</a>
            {' '}&nbsp;·&nbsp;{' '}
            <a href="/results" style={s.footerLink}>My Results</a>
          </p>
        </footer>
      </div>

      <GamificationToast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
