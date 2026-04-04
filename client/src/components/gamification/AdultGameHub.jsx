import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import useGamification from '../../hooks/useGamification.js';
import StarterMicroQuests from './StarterMicroQuests.jsx';
import NavigatorSkillPaths from './NavigatorSkillPaths.jsx';
import ProgressDashboard from './ProgressDashboard.jsx';
import GamificationToast from './GamificationToast.jsx';
import { ADULT_BADGES } from '../../data/adultGames.js';

async function fetchUserTier(email) {
  if (!email) return 'free';
  try {
    const res  = await fetch(`/api/report/access?email=${encodeURIComponent(email)}`);
    const data = await res.json().catch(() => ({}));
    if (!data.hasAccess || !Array.isArray(data.purchases) || data.purchases.length === 0) return 'free';
    const tiers = data.purchases.map(p => p.tier);
    if (tiers.some(t => t === 'atlas-premium'))   return 'atlas-navigator'; // premium gets navigator features
    if (tiers.some(t => t === 'atlas-navigator')) return 'atlas-navigator';
    if (tiers.some(t => t === 'atlas-starter'))   return 'atlas-starter';
    return 'free';
  } catch { return 'free'; }
}

const s = {
  wrap: { fontFamily: "'Inter','Segoe UI',sans-serif", color: '#e2e8f0' },
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
    background: tier === 'atlas-navigator' ? 'rgba(79,70,229,0.15)' : 'rgba(107,114,128,0.15)',
    color: tier === 'atlas-navigator' ? '#818cf8' : '#9ca3af',
    border: `1px solid ${tier === 'atlas-navigator' ? 'rgba(79,70,229,0.3)' : 'rgba(107,114,128,0.3)'}`,
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
  lockedWrap: {
    textAlign: 'center', padding: '48px 24px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: 12, margin: '24px',
  },
  lockedIcon: { fontSize: 40, marginBottom: 16 },
  lockedTitle: { fontSize: 18, fontWeight: 700, color: '#e2e8f0', margin: '0 0 8px' },
  lockedText: { fontSize: 14, color: '#718096', margin: '0 0 20px', lineHeight: 1.6, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' },
  upgradeBtn: {
    display: 'inline-block',
    padding: '10px 24px', borderRadius: 8,
    background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
    color: '#fff', fontWeight: 600, fontSize: 14,
    textDecoration: 'none', cursor: 'pointer', border: 'none',
  },
};

export default function AdultGameHub() {
  const { user, isAuthenticated } = useAuth0();
  const { progress, loading, toasts, dismissToast } = useGamification();
  const [tier, setTier]       = useState(null);
  const [activeTab, setActiveTab] = useState('practices');

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      fetchUserTier(user.email).then(setTier);
    } else if (!isAuthenticated) {
      setTier('free');
    }
  }, [isAuthenticated, user?.email]);

  const tierLabel = tier === 'atlas-navigator' ? 'Atlas Navigator' : tier === 'atlas-starter' ? 'Atlas Starter' : 'Free';

  const tabs = [
    { id: 'practices', label: 'Micro-Practices', available: tier === 'atlas-starter' || tier === 'atlas-navigator' },
    { id: 'pathways',  label: 'Skill Pathways',  available: tier === 'atlas-navigator' },
    { id: 'progress',  label: 'Progress',         available: tier === 'atlas-starter' || tier === 'atlas-navigator' },
  ];

  if (!tier || loading) {
    return (
      <div style={s.wrap}>
        <div style={{ padding: 40, textAlign: 'center', color: '#718096', fontSize: 14 }}>
          Loading your practice hub…
        </div>
      </div>
    );
  }

  if (!isAuthenticated || tier === 'free') {
    return (
      <div style={s.wrap}>
        <div style={s.header}>
          <p style={s.eyebrow}>Resilience Practice Hub</p>
          <h2 style={s.title}>Values-Aligned Practice</h2>
          <p style={s.subtitle}>ABA and ACT-informed practices for building durable resilience.</p>
        </div>
        <div style={s.lockedWrap}>
          <div style={s.lockedIcon}>🔒</div>
          <h3 style={s.lockedTitle}>Unlock Your Practice Hub</h3>
          <p style={s.lockedText}>
            Access evidence-based, ABA and ACT-aligned micro-practices, skill pathways, and personalized reinforcement — available with Atlas Starter ($9.99) or Atlas Navigator ($49.99).
          </p>
          <a href="/pricing" style={s.upgradeBtn}>View Plans</a>
        </div>
      </div>
    );
  }

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
              🔒 {tab.label}
            </button>
          )
        ))}
      </div>

      <div style={s.content}>
        {activeTab === 'practices' && <StarterMicroQuests tier={tier} progress={progress} />}
        {activeTab === 'pathways'  && tier === 'atlas-navigator' && <NavigatorSkillPaths progress={progress} />}
        {activeTab === 'progress'  && <ProgressDashboard tier={tier} progress={progress} />}
      </div>
    </div>
  );
}
