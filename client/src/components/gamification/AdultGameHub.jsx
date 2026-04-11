import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import useGamification from '../../hooks/useGamification.js';
import StarterMicroQuests from './StarterMicroQuests.jsx';
import NavigatorSkillPaths from './NavigatorSkillPaths.jsx';
import ProgressDashboard from './ProgressDashboard.jsx';
import GamificationToast from './GamificationToast.jsx';
import { isStarterOrAbove, isNavigatorOrAbove } from '../../data/gamificationContent.js';
import { apiUrl } from '../../api/baseUrl.js';

async function fetchUserTier(email, token) {
  if (!email) return 'free';
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res  = await fetch(apiUrl(`/api/report/access?email=${encodeURIComponent(email)}`), { headers });
  if (!res.ok) throw new Error(`Access check failed (${res.status})`);
  const data = await res.json();
  if (!data.hasAccess) return 'free';
  const purchases = Array.isArray(data.purchases) ? data.purchases : [];
  const tiers = purchases.map(p => p.tier);
  // Individual tiers
  if (tiers.some(t => t === 'atlas-premium'))                                       return 'atlas-navigator';
  if (tiers.some(t => t === 'atlas-navigator') || data.hasNavigatorAccess)          return 'atlas-navigator';
  if (tiers.some(t => t === 'atlas-starter'))                                       return 'atlas-starter';
  // Teams tiers — map to equivalent individual access levels
  if (tiers.some(t => t === 'teams-enterprise' || t === 'enterprise'))              return 'atlas-navigator';
  if (tiers.some(t => t === 'teams-pro'        || t === 'pro'))                     return 'atlas-navigator';
  if (tiers.some(t => t === 'teams-starter'    || t === 'starter'))                 return 'atlas-starter';
  // hasAccess is true but no specific tier found — grant minimum starter access.
  if (purchases.length === 0) return 'atlas-starter';
  return 'free';
}

const s = {
  wrap: { fontFamily: "'Inter','Segoe UI',sans-serif", color: '#e2e8f0', background: '#0d1526', borderRadius: 12, overflow: 'hidden' },
  header: {
    textAlign: 'center',
    padding: '32px 24px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  eyebrow: {
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.12em', color: '#7aafc8', marginBottom: 8,
  },
  title: {
    fontSize: 26, fontWeight: 800, margin: '0 0 8px',
    background: 'linear-gradient(135deg,#e2e8f0 0%,#93c5fd 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  subtitle: { fontSize: 14, color: '#718096', margin: 0, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' },
  tierBadge: (tier) => ({
    display: 'inline-block',
    marginTop: 12,
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    background: isNavigatorOrAbove(tier) ? 'rgba(79,70,229,0.15)' : 'rgba(107,114,128,0.15)',
    color: isNavigatorOrAbove(tier) ? '#818cf8' : '#9ca3af',
    border: `1px solid ${isNavigatorOrAbove(tier) ? 'rgba(79,70,229,0.3)' : 'rgba(107,114,128,0.3)'}`,
  }),
  tabs: {
    display: 'flex', gap: 4, padding: '16px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    flexWrap: 'wrap',
  },
  tab: (active) => ({
    padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500,
    cursor: 'pointer', border: 'none', transition: 'all 0.15s',
    background: active ? 'rgba(79,70,229,0.2)' : 'transparent',
    color: active ? '#818cf8' : '#718096',
    outline: active ? '1px solid rgba(79,70,229,0.4)' : '1px solid transparent',
  }),
  content: { padding: '24px' },
};

export default function AdultGameHub({ tier: tierProp }) {
  const { user, isAuthenticated, isLoading: auth0Loading, getAccessTokenSilently } = useAuth0();
  const { progress, loading, tierBlocked, toasts, dismissToast } = useGamification();
  // Initialise tier from the parent-provided prop immediately to avoid a
  // "Loading…" flash on first render.  Falls back to localStorage for
  // standalone (non-dashboard) use where no tierProp is supplied.
  const [tier, setTier] = useState(() => {
    if (tierProp) return tierProp;
    try { return localStorage.getItem('resilience_tier') || null; } catch (_) { return null; }
  });
  // Skip the loading state entirely when a parent-provided tier is available.
  const [tierLoading, setTierLoading] = useState(!tierProp);
  const [activeTab, setActiveTab] = useState('practices');

  useEffect(() => {
    // When a tier is provided by the parent, trust it completely and skip the
    // redundant API call.  LockedFeatureCard (the parent) already verified the
    // user's access tier before rendering this component.
    if (tierProp) {
      setTier(tierProp);
      setTierLoading(false);
      return;
    }
    if (auth0Loading) return;
    if (isAuthenticated && user?.email) {
      getAccessTokenSilently()
        .catch(() => null)
        .then(token => fetchUserTier(user.email, token))
        .then(t => {
          setTier(t);
          try { localStorage.setItem('resilience_tier', t); } catch (_) { /* ignore */ }
        })
        .catch(() => {
          setTier(current => current || 'free');
        })
        .finally(() => setTierLoading(false));
    } else if (!isAuthenticated) {
      setTier('free');
      setTierLoading(false);
    }
  }, [auth0Loading, isAuthenticated, user?.email, getAccessTokenSilently, tierProp]);

  const tierLabel = isNavigatorOrAbove(tier) ? 'Atlas Navigator' : isStarterOrAbove(tier) ? 'Atlas Starter' : 'Free';

  const tabs = [
    { id: 'practices', label: 'Micro-Practices', available: isStarterOrAbove(tier) },
    { id: 'pathways',  label: 'Skill Pathways',  available: isNavigatorOrAbove(tier) },
    { id: 'progress',  label: 'Progress',         available: isStarterOrAbove(tier) },
  ];

  if (tierLoading) {
    return (
      <div style={s.wrap}>
        <div style={{ padding: 40, textAlign: 'center', color: '#718096', fontSize: 14 }}>
          Loading your practice hub…
        </div>
      </div>
    );
  }

  // LockedFeatureCard (in GamificationDashboard) is the primary gating mechanism and
  // only renders this component when the user's tier has been verified as Starter or
  // above.  The standalone lock screen that previously lived here created a double-lock
  // race condition — users with Navigator access sometimes saw the "Unlock Your Practice
  // Hub" screen because AdultGameHub's own tier detection ran independently and lagged
  // behind the parent's verified tier.  We now trust the parent-supplied tierProp
  // completely.
  //
  // Standalone use (no tierProp): the component fetches the tier itself via the API
  // (see the useEffect above).  Unauthenticated or free-tier users will have all tabs
  // disabled (isStarterOrAbove / isNavigatorOrAbove return false) and the content area
  // will render nothing, which is the expected no-access fallback.

  return (
    <div style={s.wrap}>
      {toasts.map(t => <GamificationToast key={t.id} toast={t} onDismiss={dismissToast} />)}
      <div style={s.header}>
        <p style={s.eyebrow}>Resilience Practice Hub</p>
        <h2 style={s.title}>Values-Aligned Practice</h2>
        <p style={s.subtitle}>Evidence-based ABA and ACT practices for building durable resilience across all 6 dimensions.</p>
        <div style={s.tierBadge(tier)}>{tierLabel}</div>
      </div>

      <div style={s.tabs}>
        {tabs.map(tab => (
          tab.available ? (
            <button
              key={tab.id}
              style={s.tab(activeTab === tab.id)}
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ) : (
            <button
              key={tab.id}
              style={{ ...s.tab(false), opacity: 0.4, cursor: 'not-allowed' }}
              title="Available with Atlas Navigator"
              disabled
            >
              <img src="/icons/lock.svg" alt="" aria-hidden="true" width={12} height={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {tab.label}
            </button>
          )
        ))}
      </div>

      <div style={s.content}>
        {activeTab === 'practices' && <StarterMicroQuests tier={tier} progress={progress} />}
        {activeTab === 'pathways'  && isNavigatorOrAbove(tier) && <NavigatorSkillPaths progress={progress} />}
        {activeTab === 'progress'  && <ProgressDashboard tier={tier} progress={progress} loading={loading} tierBlocked={tierBlocked} />}
      </div>
    </div>
  );
}
