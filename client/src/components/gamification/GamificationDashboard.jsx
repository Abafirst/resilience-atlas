import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

import useGamification from '../../hooks/useGamification.js';
import GamificationToast from './GamificationToast.jsx';
import LockedFeatureCard from './LockedFeatureCard.jsx';
import NavigationMilestones from './NavigationMilestones.jsx';
import ResilienceBadgesWidget from './ResilienceBadgesWidget.jsx';
import NavigationPathways from './NavigationPathways.jsx';
import ResilienceMap from './ResilienceMap.jsx';
import DailyCompassStreaks from './DailyCompassStreaks.jsx';
import ExplorerAchievements from './ExplorerAchievements.jsx';
import { isStarterOrAbove, isNavigatorOrAbove, CHECKOUT_URLS } from '../../data/gamificationContent.js';

// ── Tier detection ─────────────────────────────────────────────────────────────

async function fetchUserTier(email) {
  if (!email) return 'free';
  try {
    const res = await fetch(`/api/report/access?email=${encodeURIComponent(email)}`);
    const data = await res.json().catch(() => ({}));
    if (!data.hasAccess || !Array.isArray(data.purchases) || data.purchases.length === 0) {
      return 'free';
    }
    const tiers = data.purchases.map(p => p.tier);
    if (tiers.some(t => t === 'atlas-premium'))   return 'atlas-premium';
    if (tiers.some(t => t === 'atlas-navigator')) return 'atlas-navigator';
    if (tiers.some(t => t === 'atlas-starter'))   return 'atlas-starter';
    return 'free';
  } catch {
    return 'free';
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0e1a 0%, #0d1526 100%)',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: '#e2e8f0',
  },
  header: {
    background: 'rgba(10,14,26,0.95)',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    boxShadow: '0 1px 0 rgba(255,255,255,0.06)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  logo: {
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: 17,
    letterSpacing: '-0.01em',
  },
  nav: {
    display: 'flex',
    gap: 20,
    alignItems: 'center',
  },
  navLink: {
    color: '#718096',
    textDecoration: 'none',
    fontSize: 14,
  },
  navLinkActive: {
    color: '#fff',
    fontWeight: 600,
    textDecoration: 'none',
    fontSize: 14,
  },
  hero: {
    background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1a3d 60%, #102040 100%)',
    borderBottom: '1px solid rgba(14,165,233,0.15)',
    color: '#fff',
    textAlign: 'center',
    padding: '56px 24px 40px',
    position: 'relative',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: '-40%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 500,
    height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: '#7aafc8',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 800,
    margin: '0 0 12px',
    lineHeight: 1.15,
    background: 'linear-gradient(135deg, #e2e8f0 0%, #93c5fd 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSub: {
    fontSize: 15,
    color: '#718096',
    margin: '0 auto',
    maxWidth: 520,
    lineHeight: 1.6,
  },
  main: {
    maxWidth: 1040,
    margin: '0 auto',
    padding: '40px 24px 60px',
    display: 'flex',
    flexDirection: 'column',
    gap: 40,
  },
  signInBanner: {
    background: 'rgba(14,165,233,0.08)',
    border: '1px solid rgba(14,165,233,0.2)',
    borderRadius: 12,
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  signInText: {
    fontSize: 14,
    color: '#94a3b8',
    flex: 1,
    margin: 0,
  },
  signInBtn: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
    padding: '9px 22px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(14,165,233,0.3)',
    flexShrink: 0,
  },
  loadingMsg: {
    textAlign: 'center',
    padding: '40px 24px',
    fontSize: 14,
    color: '#4a5568',
  },
  errorMsg: {
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 10,
    padding: '14px 18px',
    color: '#fca5a5',
    fontSize: 14,
  },
  tierSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  tierHeading: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  tierTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#e2e8f0',
    margin: 0,
  },
  tierPill: (bg) => ({
    display: 'inline-block',
    background: bg,
    color: '#fff',
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    padding: '3px 10px',
    borderRadius: 20,
  }),
  tierDesc: {
    fontSize: 13,
    color: '#4a5568',
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 1.5,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 16,
  },
  fullWidth: {
    gridColumn: '1 / -1',
  },
  divider: {
    height: 1,
    background: 'rgba(255,255,255,0.06)',
  },
  footer: {
    background: 'rgba(10,14,26,0.95)',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    color: '#4a5568',
    textAlign: 'center',
    padding: '24px',
    fontSize: 12,
  },
  footerLink: {
    color: '#7aafc8',
    textDecoration: 'none',
  },
};

// ── Main component ─────────────────────────────────────────────────────────────

/**
 * GamificationDashboard — Atlas-branded gamification hub.
 *
 * All features are visible to all users; locked/unlocked based on purchase tier:
 *   free              → all features locked
 *   atlas-starter     → Navigation Milestones + Resilience Badges unlocked
 *   atlas-navigator+  → all features unlocked + interactive
 */
export default function GamificationDashboard() {
  const { isAuthenticated, loginWithRedirect, user } = useAuth0();
  const {
    progress,
    loading: gamLoading,
    error,
    setChallenge,
    enableLeaderboard,
    fetchLeaderboard,
    toasts,
    dismissToast,
  } = useGamification();

  const [userTier, setUserTier]       = useState('free');
  const [tierLoading, setTierLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setUserTier('free');
      setTierLoading(false);
      return;
    }
    const email = user?.email || '';
    setTierLoading(true);
    fetchUserTier(email)
      .then(tier => setUserTier(tier))
      .finally(() => setTierLoading(false));
  }, [isAuthenticated, user]);

  const hasStarter   = isStarterOrAbove(userTier);
  const hasNavigator = isNavigatorOrAbove(userTier);

  const isGamError = error && (
    error.toLowerCase().includes('paid tier') ||
    error.toLowerCase().includes('upgrade') ||
    error.toLowerCase().includes('402')
  );

  // Gamification API progress is only available for Navigator+
  const activeProgress = (hasNavigator && !isGamError) ? progress : null;

  const showContent = !isAuthenticated || !tierLoading;

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
            <a href="/gamification" style={s.navLinkActive}>
              Resilience Journey
            </a>
          </nav>
        </header>

        {/* Hero */}
        <section style={s.hero} aria-labelledby="gamHeroTitle">
          <div style={s.heroGlow} aria-hidden="true" />
          <div style={s.heroEyebrow}>🧭 Atlas Gamification</div>
          <h1 id="gamHeroTitle" style={s.heroTitle}>Your Resilience Journey</h1>
          <p style={s.heroSub}>
            Explore Navigation Milestones, earn Resilience Badges, navigate Pathways,
            and build your Daily Compass Streak. Each tier unlocks deeper features.
          </p>
        </section>

        {/* Main content */}
        <main style={s.main}>

          {/* Sign-in banner (non-blocking — features still show below) */}
          {!isAuthenticated && (
            <div style={s.signInBanner} role="region" aria-label="Sign in prompt">
              <p style={s.signInText}>
                🔐 Sign in to track your resilience progress and see which features you have unlocked.
              </p>
              <button style={s.signInBtn} onClick={() => loginWithRedirect({ appState: { returnTo: '/gamification' } })}>
                Sign In to Atlas
              </button>
            </div>
          )}

          {/* Tier detection loading */}
          {isAuthenticated && tierLoading && (
            <div style={s.loadingMsg} role="status" aria-live="polite">
              Checking your compass bearing…
            </div>
          )}

          {/* Non-upgrade API error */}
          {isAuthenticated && !gamLoading && error && !isGamError && (
            <div style={s.errorMsg} role="alert">{error}</div>
          )}

          {/* ── Atlas Starter Features ──────────────────────────────────── */}
          {showContent && (
            <section style={s.tierSection} aria-labelledby="starterSectionTitle">
              <div style={s.tierHeading}>
                <h2 id="starterSectionTitle" style={s.tierTitle}>🧭 Atlas Starter</h2>
                <span style={s.tierPill(
                  hasStarter
                    ? 'linear-gradient(135deg, #059669, #047857)'
                    : 'linear-gradient(135deg, #0ea5e9, #0284c7)'
                )}>
                  {hasStarter ? '✓ Unlocked' : 'From $9.99'}
                </span>
              </div>
              <p style={s.tierDesc}>
                Navigation Milestones and Resilience Badges — your first steps on the
                resilience journey. Requires Atlas Starter purchase.
              </p>

              <div style={s.grid}>
                <LockedFeatureCard
                  locked={!hasStarter}
                  tierName="Atlas Starter"
                  checkoutUrl={CHECKOUT_URLS['atlas-starter']}
                >
                  <NavigationMilestones scores={null} />
                </LockedFeatureCard>

                <LockedFeatureCard
                  locked={!hasStarter}
                  tierName="Atlas Starter"
                  checkoutUrl={CHECKOUT_URLS['atlas-starter']}
                >
                  <ResilienceBadgesWidget
                    earnedBadges={activeProgress ? (activeProgress.badges || []) : []}
                    showNavigator={false}
                  />
                </LockedFeatureCard>
              </div>
            </section>
          )}

          {showContent && <div style={s.divider} />}

          {/* ── Atlas Navigator Features ─────────────────────────────────── */}
          {showContent && (
            <section style={s.tierSection} aria-labelledby="navigatorSectionTitle">
              <div style={s.tierHeading}>
                <h2 id="navigatorSectionTitle" style={s.tierTitle}>🗺️ Atlas Navigator</h2>
                <span style={s.tierPill(
                  hasNavigator
                    ? 'linear-gradient(135deg, #059669, #047857)'
                    : 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                )}>
                  {hasNavigator ? '✓ Unlocked' : 'Lifetime Access'}
                </span>
              </div>
              <p style={s.tierDesc}>
                Navigation Pathways, Daily Compass Streaks, Resilience Map, Explorer
                Achievements, and enhanced Resilience Badges. Requires Atlas Navigator.
              </p>

              <div style={s.grid}>
                {/* Daily Compass Streaks */}
                <LockedFeatureCard
                  locked={!hasNavigator}
                  tierName="Atlas Navigator"
                  checkoutUrl={CHECKOUT_URLS['atlas-navigator']}
                >
                  <DailyCompassStreaks progress={activeProgress} />
                </LockedFeatureCard>

                {/* Navigation Pathways */}
                <LockedFeatureCard
                  locked={!hasNavigator}
                  tierName="Atlas Navigator"
                  checkoutUrl={CHECKOUT_URLS['atlas-navigator']}
                >
                  <NavigationPathways
                    progress={activeProgress}
                    onSetChallenge={hasNavigator ? setChallenge : undefined}
                  />
                </LockedFeatureCard>

                {/* Enhanced Badges */}
                <LockedFeatureCard
                  locked={!hasNavigator}
                  tierName="Atlas Navigator"
                  checkoutUrl={CHECKOUT_URLS['atlas-navigator']}
                >
                  <ResilienceBadgesWidget
                    earnedBadges={activeProgress ? (activeProgress.badges || []) : []}
                    showNavigator={true}
                  />
                </LockedFeatureCard>

                {/* Resilience Map (full width) */}
                <div style={s.fullWidth}>
                  <LockedFeatureCard
                    locked={!hasNavigator}
                    tierName="Atlas Navigator"
                    checkoutUrl={CHECKOUT_URLS['atlas-navigator']}
                  >
                    <ResilienceMap
                      progress={activeProgress}
                      fetchLeaderboard={hasNavigator ? fetchLeaderboard : undefined}
                      onEnableLeaderboard={hasNavigator ? enableLeaderboard : undefined}
                    />
                  </LockedFeatureCard>
                </div>

                {/* Explorer Achievements (full width) */}
                <div style={s.fullWidth}>
                  <LockedFeatureCard
                    locked={!hasNavigator}
                    tierName="Atlas Navigator"
                    checkoutUrl={CHECKOUT_URLS['atlas-navigator']}
                  >
                    <ExplorerAchievements earnedIds={new Set()} />
                  </LockedFeatureCard>
                </div>
              </div>
            </section>
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
