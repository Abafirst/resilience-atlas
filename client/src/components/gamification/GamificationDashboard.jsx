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
import AdultGameHub from './AdultGameHub.jsx';

// ── Tier detection ─────────────────────────────────────────────────────────────

async function fetchUserTier(email, token) {
  if (!email) return 'free';
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`/api/report/access?email=${encodeURIComponent(email)}`, { headers });
  if (!res.ok) throw new Error(`Access check failed (${res.status})`);
  const data = await res.json();
  if (!data.hasAccess) return 'free';
  const purchases = Array.isArray(data.purchases) ? data.purchases : [];
  const tiers = purchases.map(p => p.tier);
  // Individual tiers
  if (tiers.some(t => t === 'atlas-premium'))                                       return 'atlas-premium';
  if (tiers.some(t => t === 'atlas-navigator') || data.hasNavigatorAccess)          return 'atlas-navigator';
  if (tiers.some(t => t === 'atlas-starter'))                                       return 'atlas-starter';
  // Teams tiers — map to equivalent individual access levels
  if (tiers.some(t => t === 'teams-enterprise' || t === 'enterprise'))              return 'atlas-navigator';
  if (tiers.some(t => t === 'teams-pro'        || t === 'pro'))                     return 'atlas-navigator';
  if (tiers.some(t => t === 'teams-starter'    || t === 'starter'))                 return 'atlas-starter';
  // hasAccess is true but no specific tier detected in purchases —
  // grant minimum starter access (covers dev mode where purchases is empty,
  // and legacy user-flag grants that don't produce a Purchase record).
  if (purchases.length === 0) return 'atlas-starter';
  return 'free';
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: '#1e293b',
  },
  header: {
    background: '#fff',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    boxShadow: '0 1px 0 #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  logo: {
    color: '#1e293b',
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
    color: '#64748b',
    textDecoration: 'none',
    fontSize: 14,
  },
  navLinkActive: {
    color: '#4f46e5',
    fontWeight: 600,
    textDecoration: 'none',
    fontSize: 14,
  },
  hero: {
    background: 'linear-gradient(135deg, #0f2942 0%, #1a3a5c 60%, #163351 100%)',
    borderBottom: '1px solid rgba(79,70,229,0.15)',
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
    background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroEyebrow: {
    display: 'inline-block',
    background: 'rgba(79,70,229,0.25)',
    border: '1px solid rgba(79,70,229,0.5)',
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    padding: '4px 14px',
    borderRadius: 999,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 800,
    margin: '0 0 12px',
    lineHeight: 1.15,
    color: '#fff',
  },
  heroSub: {
    fontSize: 15,
    color: '#94a3b8',
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
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
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
    color: '#1e40af',
    flex: 1,
    margin: 0,
  },
  signInBtn: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
    padding: '9px 22px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
    flexShrink: 0,
    textDecoration: 'none',
  },
  loadingMsg: {
    textAlign: 'center',
    padding: '40px 24px',
    fontSize: 14,
    color: '#64748b',
  },
  errorMsg: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 10,
    padding: '14px 18px',
    color: '#b91c1c',
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
    color: '#0f172a',
    margin: 0,
  },
  tierPill: (bg, color) => ({
    display: 'inline-block',
    background: bg,
    color: color || '#fff',
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    padding: '3px 10px',
    borderRadius: 20,
  }),
  tierDesc: {
    fontSize: 13,
    color: '#475569',
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
    background: '#e2e8f0',
  },
  footer: {
    background: '#fff',
    borderTop: '1px solid #e2e8f0',
    color: '#64748b',
    textAlign: 'center',
    padding: '24px',
    fontSize: 12,
  },
  footerLink: {
    color: '#4f46e5',
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
  const { isAuthenticated, isLoading: auth0Loading, loginWithRedirect, user, getAccessTokenSilently } = useAuth0();
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

  const [userTier, setUserTier]       = useState(() => {
    // Pre-populate from localStorage so features appear immediately for returning users
    // while the backend tier check is in progress. The API call will update the tier
    // if the cached value is stale or incorrect.
    try { return localStorage.getItem('resilience_tier') || 'free'; } catch (_) { return 'free'; }
  });
  const [tierLoading, setTierLoading] = useState(true);
  const [tierError, setTierError]     = useState(null);
  const [tierRetryKey, setTierRetryKey] = useState(0); // incremented to force-retry the tier check
  const [paymentBanner, setPaymentBanner] = useState(null);

  useEffect(() => {
    if (auth0Loading) return; // Wait for Auth0 to finish initialising

    let email = user?.email || '';
    if (!email) {
      try { email = localStorage.getItem('resilience_email') || ''; } catch (_) { /* ignore */ }
    }

    if (!email) {
      setUserTier('free');
      setTierLoading(false);
      return;
    }
    setTierLoading(true);
    setTierError(null);
    const tokenPromise = isAuthenticated
      ? getAccessTokenSilently().catch(() => null)
      : Promise.resolve(null);
    tokenPromise
      .then(token => fetchUserTier(email, token))
      .then(tier => {
        setUserTier(tier);
        // Keep localStorage in sync so future visits use the latest tier.
        try { localStorage.setItem('resilience_tier', tier); } catch (_) { /* ignore */ }
      })
      .catch(() => {
        // Fall back to cached tier so users with valid purchases aren't
        // incorrectly shown the locked state due to a transient network error.
        // Normalize legacy/teams tier names to canonical individual tiers.
        try {
          const cachedTier = localStorage.getItem('resilience_tier');
          if (cachedTier) {
            const LEGACY_TIER_MAP = {
              'starter': 'atlas-starter', 'teams-starter': 'atlas-starter',
              'pro': 'atlas-navigator', 'teams-pro': 'atlas-navigator',
              'enterprise': 'atlas-navigator', 'teams-enterprise': 'atlas-navigator',
              'business': 'atlas-navigator',
            };
            const resolved = LEGACY_TIER_MAP[cachedTier] || cachedTier;
            if (isStarterOrAbove(resolved)) {
              setUserTier(resolved);
              return;
            }
          }
        } catch (_) { /* ignore */ }
        setTierError('Unable to verify your access level. Please refresh the page or try again.');
      })
      .finally(() => setTierLoading(false));
  }, [auth0Loading, isAuthenticated, user, getAccessTokenSilently, tierRetryKey]);

  // Handle return from Stripe after a successful purchase initiated on this page.
  // Stripe redirects to /gamification?upgrade=success&session_id=... (set via
  // returnPath='/gamification' in the checkout API call below).
  useEffect(() => {
    if (auth0Loading) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgrade') !== 'success') return;
    const sessionId = params.get('session_id');
    if (!sessionId) return;

    // Clean the URL immediately so a page refresh doesn't re-trigger verification.
    window.history.replaceState({}, document.title, window.location.pathname);

    const TIER_NAMES = {
      'atlas-starter':   'Atlas Starter',
      'atlas-navigator': 'Atlas Navigator',
      'atlas-premium':   'Atlas Premium',
    };

    // Verify the Stripe session and refresh the displayed tier.
    fetch(`/api/payments/verify?session_id=${encodeURIComponent(sessionId)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.tier) {
          setUserTier(data.tier);
          try { localStorage.setItem('resilience_tier', data.tier); } catch (_) { /* ignore */ }
          const tierName = TIER_NAMES[data.tier] || data.tier;
          setPaymentBanner({ type: 'success', message: `✅ Purchase confirmed! Your ${tierName} features are now unlocked.` });
        }
      })
      .catch(() => { /* non-fatal — tier will still be fetched via /api/report/access */ })
      .finally(() => setTierLoading(false));
  }, [auth0Loading]);

  // Auto-start checkout when the user returns from Auth0 login with a
  // ?checkout=<tier> URL parameter (set by LockedFeatureCard.handleUnlock).
  useEffect(() => {
    if (auth0Loading || !isAuthenticated) return;
    const params = new URLSearchParams(window.location.search);
    const checkoutTier = params.get('checkout');
    if (!checkoutTier) return;

    // Clean the URL so a page refresh doesn't re-trigger checkout.
    window.history.replaceState({}, document.title, window.location.pathname);

    const email = user?.email || '';
    getAccessTokenSilently()
      .catch(() => null)
      .then(token => fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ tier: checkoutTier, email, returnPath: '/gamification' }),
      }))
      .then(res => res.json())
      .then(data => {
        if (data.url) {
          window.location.href = data.url;
        }
      })
      .catch((err) => {
        // Log the error; the user can retry by clicking the unlock button.
        console.warn('[GamificationDashboard] Auto-checkout after login failed:', err?.message || err);
      });
  }, [auth0Loading, isAuthenticated, user, getAccessTokenSilently]);

  const hasStarter   = isStarterOrAbove(userTier);
  const hasNavigator = isNavigatorOrAbove(userTier);

  const isGamError = error && (
    error.toLowerCase().includes('paid tier') ||
    error.toLowerCase().includes('upgrade') ||
    error.toLowerCase().includes('402')
  );

  // Gamification API progress is only available for Navigator+
  const activeProgress = (hasNavigator && !isGamError) ? progress : null;

  // Show gamification content once:
  //   - the user is not authenticated (features shown in locked/preview mode), OR
  //   - Auth0 and the backend tier check have both completed.
  // This prevents a flash of incorrect locked-state content for users whose
  // tier is still being verified.
  const showContent = !isAuthenticated || (!auth0Loading && !tierLoading);

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
          <div style={s.heroEyebrow}><img src="/icons/compass.svg" alt="" aria-hidden="true" style={{ width: 14, height: 14, verticalAlign: 'middle', marginRight: 6, filter: 'brightness(0) invert(1)' }} />Atlas Gamification</div>
          <h1 id="gamHeroTitle" style={s.heroTitle}>Your Resilience Journey</h1>
          <p style={s.heroSub}>
            Explore Navigation Milestones, earn Resilience Badges, navigate Pathways,
            and build your Daily Compass Streak. Each tier unlocks deeper features.
          </p>
        </section>

        {/* Main content */}
        <main style={s.main}>

          {/* Payment success banner (shown after returning from Stripe checkout) */}
          {paymentBanner && (
            <div
              role="alert"
              style={{
                margin: '0 0 16px',
                padding: '12px 16px',
                borderRadius: 8,
                background: paymentBanner.type === 'success' ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${paymentBanner.type === 'success' ? '#86efac' : '#fca5a5'}`,
                color: paymentBanner.type === 'success' ? '#15803d' : '#dc2626',
                fontSize: '.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <span>{paymentBanner.message}</span>
              <button
                onClick={() => setPaymentBanner(null)}
                aria-label="Dismiss"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1rem', padding: 0, lineHeight: 1 }}
              >✕</button>
            </div>
          )}

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
          {isAuthenticated && (auth0Loading || tierLoading) && (
            <div style={s.loadingMsg} role="status" aria-live="polite">
              Checking your compass bearing…
            </div>
          )}

          {/* Tier verification error */}
          {isAuthenticated && !tierLoading && tierError && (
            <div style={{ ...s.errorMsg, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }} role="alert">
              <span>⚠️ {tierError}</span>
              <button
                onClick={() => { setTierError(null); setTierRetryKey(k => k + 1); }}
                style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid currentColor', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'inherit' }}
              >
                Retry
              </button>
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
                <h2 id="starterSectionTitle" style={s.tierTitle}><img src="/icons/compass.svg" alt="" aria-hidden="true" style={{ width: 18, height: 18, verticalAlign: 'middle', marginRight: 6 }} />Atlas Starter</h2>
                <span style={s.tierPill(
                  hasStarter ? '#dcfce7' : '#eff6ff',
                  hasStarter ? '#15803d' : '#1d4ed8'
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
                  icon="/icons/compass.svg"
                  title="Navigation Milestones"
                  description="Track your progress across the 6 resilience dimensions with milestone achievements and celebrate every step forward."
                  accentColor="#4f46e5"
                  returnPath="/gamification"
                >
                  <NavigationMilestones scores={null} />
                </LockedFeatureCard>

                <LockedFeatureCard
                  locked={!hasStarter}
                  tierName="Atlas Starter"
                  checkoutUrl={CHECKOUT_URLS['atlas-starter']}
                  icon="/icons/badges.svg"
                  title="Resilience Badges"
                  description="Earn badges as you build resilience skills across all six dimensions of the Atlas framework."
                  accentColor="#7c3aed"
                  returnPath="/gamification"
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

          {/* ── Practice Hub (Adult Gamification — Starter + Navigator) ───── */}
          {showContent && (
            <section style={s.tierSection} aria-labelledby="practiceHubTitle">
              <div style={s.tierHeading}>
                <h2 id="practiceHubTitle" style={s.tierTitle}><img src="/icons/compass.svg" alt="" aria-hidden="true" style={{ width: 18, height: 18, verticalAlign: 'middle', marginRight: 6 }} />Practice Hub</h2>
                <span style={s.tierPill(
                  hasStarter ? '#dcfce7' : '#eff6ff',
                  hasStarter ? '#15803d' : '#1d4ed8'
                )}>
                  {hasStarter ? '✓ Unlocked' : 'From $9.99'}
                </span>
              </div>
              <p style={s.tierDesc}>
                Values-aligned micro-practices, skill pathways, and ACT-informed choice scenarios.
                Starter unlocks micro-commitment practices; Navigator unlocks all 6 skill pathways and the full reinforcement menu.
              </p>
              <LockedFeatureCard
                locked={!hasStarter}
                tierName="Atlas Starter"
                checkoutUrl={CHECKOUT_URLS['atlas-starter']}
                icon="/icons/game-target.svg"
                title="Practice Hub"
                description="Values-aligned micro-practices, skill pathways, and ACT-informed choice scenarios to build resilience daily."
                accentColor="#0ea5e9"
                returnPath="/gamification"
              >
                <AdultGameHub tier={userTier} />
              </LockedFeatureCard>
            </section>
          )}

          {showContent && <div style={s.divider} />}

          {/* ── Atlas Navigator Features ─────────────────────────────────── */}
          {showContent && (
            <section style={s.tierSection} aria-labelledby="navigatorSectionTitle">
              <div style={s.tierHeading}>
                <h2 id="navigatorSectionTitle" style={s.tierTitle}><img src="/icons/game-map.svg" alt="" aria-hidden="true" style={{ width: 18, height: 18, verticalAlign: 'middle', marginRight: 6 }} />Atlas Navigator</h2>
                <span style={s.tierPill(
                  hasNavigator ? '#dcfce7' : '#ede9fe',
                  hasNavigator ? '#15803d' : '#5b21b6'
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
                  icon="/icons/streaks.svg"
                  title="Daily Compass Streaks"
                  description="Track your daily resilience practice streaks and celebrate momentum as you build lasting habits."
                  accentColor="#f59e0b"
                  returnPath="/gamification"
                >
                  <DailyCompassStreaks progress={activeProgress} />
                </LockedFeatureCard>

                {/* Navigation Pathways */}
                <LockedFeatureCard
                  locked={!hasNavigator}
                  tierName="Atlas Navigator"
                  checkoutUrl={CHECKOUT_URLS['atlas-navigator']}
                  icon="/icons/game-map.svg"
                  title="Navigation Pathways"
                  description="Follow structured pathways to develop resilience across all six dimensions with guided progression."
                  accentColor="#4f46e5"
                  returnPath="/gamification"
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
                  icon="/icons/custom-badges.svg"
                  title="Enhanced Resilience Badges"
                  description="Unlock advanced badges and exclusive achievements only available at the Navigator tier."
                  accentColor="#7c3aed"
                  returnPath="/gamification"
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
                    icon="/icons/game-mountain.svg"
                    title="Resilience Map"
                    description="Visualize your resilience journey on an interactive map with community leaderboard features."
                    accentColor="#059669"
                    returnPath="/gamification"
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
                    icon="/icons/star.svg"
                    title="Explorer Achievements"
                    description="Complete challenges and earn special achievements as you explore your resilience journey."
                    accentColor="#d97706"
                    returnPath="/gamification"
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
