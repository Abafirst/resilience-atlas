import React, { useState, useEffect } from 'react';
import DataExportPanel from '../components/DataExportPanel.jsx';

// ── Helpers ──────────────────────────────────────────────────────────────────

function tierLabel(tier) {
  const labels = {
    starter: 'Atlas Team Basic',
    'teams-starter': 'Atlas Team Basic',
    pro: 'Atlas Team Premium',
    'teams-pro': 'Atlas Team Premium',
    enterprise: 'Atlas Enterprise',
  };
  return labels[tier] || tier;
}

// ── Styles ───────────────────────────────────────────────────────────────────

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
    display: 'flex',
    alignItems: 'center',
    gap: 8,
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
    transition: 'color 0.2s',
  },
  hero: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    color: '#fff',
    textAlign: 'center',
    padding: '64px 24px 48px',
  },
  heroEyebrow: {
    fontSize: 13,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#7aafc8',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 800,
    margin: '0 0 16px',
    lineHeight: 1.2,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#a0aec0',
    maxWidth: 540,
    margin: '0 auto',
    lineHeight: 1.6,
  },
  main: {
    maxWidth: 820,
    margin: '0 auto',
    padding: '40px 24px',
  },
  bannerBase: {
    borderRadius: 10,
    padding: '16px 20px',
    marginBottom: 28,
    fontSize: 15,
    fontWeight: 500,
    lineHeight: 1.5,
  },
  bannerSuccess: {
    background: '#d1fae5',
    border: '1px solid #6ee7b7',
    color: '#065f46',
  },
  bannerWarning: {
    background: '#fef3c7',
    border: '1px solid #fcd34d',
    color: '#92400e',
  },
  bannerError: {
    background: '#fee2e2',
    border: '1px solid #fca5a5',
    color: '#991b1b',
  },
  bannerInfo: {
    background: '#dbeafe',
    border: '1px solid #93c5fd',
    color: '#1e40af',
  },
  spinner: {
    display: 'inline-block',
    width: 18,
    height: 18,
    border: '3px solid rgba(0,0,0,0.1)',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginRight: 10,
    verticalAlign: 'middle',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: 20,
  },
  tierGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: 20,
    marginBottom: 40,
  },
  tierCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '24px 20px',
    textAlign: 'center',
  },
  tierName: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: 6,
  },
  tierPrice: {
    fontSize: 28,
    fontWeight: 800,
    color: '#2563eb',
    marginBottom: 4,
  },
  tierBilling: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 16,
  },
  tierFeatures: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 20px',
    textAlign: 'left',
  },
  tierFeatureItem: {
    fontSize: 13,
    color: '#374151',
    padding: '4px 0',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 6,
  },
  tierFeatureCheck: {
    color: '#059669',
    fontWeight: 700,
    flexShrink: 0,
  },
  ctaButton: {
    display: 'inline-block',
    background: '#2563eb',
    color: '#fff',
    fontWeight: 600,
    fontSize: 14,
    padding: '10px 22px',
    borderRadius: 8,
    textDecoration: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.2s',
    width: '100%',
    boxSizing: 'border-box',
    textAlign: 'center',
  },
  confirmCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '32px 28px',
    textAlign: 'center',
    marginBottom: 32,
  },
  confirmIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: '#1a1a2e',
    marginBottom: 8,
  },
  confirmSubtitle: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 1.6,
    marginBottom: 24,
  },
  nextSteps: {
    background: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: 10,
    padding: '20px 24px',
    textAlign: 'left',
    marginBottom: 24,
  },
  nextStepsTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#0369a1',
    marginBottom: 12,
  },
  nextStepsList: {
    margin: 0,
    paddingLeft: 20,
    fontSize: 14,
    color: '#1a1a2e',
    lineHeight: 1.8,
  },
  buttonRow: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryBtn: {
    display: 'inline-block',
    background: '#2563eb',
    color: '#fff',
    fontWeight: 600,
    fontSize: 14,
    padding: '11px 24px',
    borderRadius: 8,
    textDecoration: 'none',
    transition: 'background 0.2s',
  },
  secondaryBtn: {
    display: 'inline-block',
    background: '#fff',
    color: '#374151',
    fontWeight: 600,
    fontSize: 14,
    padding: '11px 24px',
    borderRadius: 8,
    textDecoration: 'none',
    border: '1px solid #d1d5db',
    transition: 'background 0.2s',
  },
  footer: {
    background: '#1a1a2e',
    color: '#a0aec0',
    textAlign: 'center',
    padding: '28px 24px',
    fontSize: 13,
    marginTop: 'auto',
  },
  footerLink: {
    color: '#7aafc8',
    textDecoration: 'none',
  },
};

// ── Team pricing tiers ────────────────────────────────────────────────────────

const TEAM_TIERS = [
  {
    key: 'starter',
    name: 'Atlas Team Basic',
    price: '$299',
    billing: 'one-time',
    features: [
      'Up to 15 users | 1 team',
      'Gamifications: Personal & team badges, streaks, milestones',
      'Team Tracking: Leaderboards, progress dashboards, parental views',
      'Team dashboard & aggregated radar chart',
      'Self-service CSV & PDF export',
      'Bulk email invitations',
      'Download all your data anytime',
    ],
  },
  {
    key: 'pro',
    name: 'Atlas Team Premium',
    price: '$699',
    billing: 'one-time',
    features: [
      'Up to 30 users | Multiple teams',
      'Enhanced Gamifications: Advanced team challenges, achievement tracking',
      'Advanced Leaderboards: Multi-team comparisons, dimension breakdowns',
      'Parental Controls: Detailed team member progress tracking',
      'Advanced analytics (downloadable)',
      'Auto-generated team reports (PDF)',
      'Facilitation tools & resource library',
      'Everything in Basic',
    ],
    highlight: true,
  },
  {
    key: 'enterprise',
    name: 'Atlas Enterprise',
    price: 'From $2,499',
    billing: 'one-time',
    features: [
      'Unlimited users & teams',
      'Full Gamification Suite: Custom badges, unlimited challenges, org-wide leaderboards',
      'Enterprise Tracking: Advanced parental/manager dashboards, real-time analytics',
      'Org-managed branding (logos, colors, domain)',
      'SSO/SAML integration — configure yourself',
      'Self-service data export & custody',
      'Everything in Premium',
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const [banner, setBanner] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [tierName, setTierName] = useState('');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const upgradeParam = params.get('upgrade');
    const sessionId = params.get('session_id');

    if (upgradeParam === 'cancelled') {
      setBanner({
        type: 'warning',
        message: 'Your payment was cancelled. You can upgrade your team any time.',
      });
      window.history.replaceState({}, '', '/team');
      return;
    }

    if (upgradeParam === 'success' && sessionId) {
      setBanner({ type: 'info', message: '⏳ Verifying your purchase…' });
      setVerifying(true);
      fetch(`/api/payments/verify?session_id=${encodeURIComponent(sessionId)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.tier) {
            setTierName(tierLabel(data.tier));
            setVerified(true);
            setBanner({
              type: 'success',
              message: `✅ Payment confirmed! Your ${tierLabel(data.tier)} plan is now active.`,
            });
            try { localStorage.setItem('team_tier', data.tier); } catch (_) { /* ignore */ }
          } else {
            setBanner({
              type: 'error',
              message: data.error || 'Could not verify payment. Please contact support.',
            });
          }
        })
        .catch(() => {
          setBanner({
            type: 'error',
            message: 'Failed to verify payment. Please contact support or refresh the page.',
          });
        })
        .finally(() => {
          setVerifying(false);
          window.history.replaceState({}, '', '/team');
        });
    }
  }, []);

  const bannerStyle = banner
    ? { ...s.bannerBase, ...(s[`banner${banner.type.charAt(0).toUpperCase() + banner.type.slice(1)}`] || s.bannerInfo) }
    : null;

  return (
    <>
      {/* Keyframe for spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={s.page}>
        {/* Header */}
        <header style={s.header} role="banner">
          <a href="/" style={s.logo}>
            <img src="/assets/logo-256x256.png?v=2026-04-13" alt="" width="28" height="28" />
            The Resilience Atlas™
          </a>
          <nav style={s.nav} aria-label="Main navigation">
            <a href="/" style={s.navLink}>Home</a>
            <a href="/assessment.html" style={s.navLink}>Assessment</a>
            <a href="/results" style={s.navLink}>My Results</a>
            <a href="/team" style={{ ...s.navLink, color: '#fff', fontWeight: 600 }}>Teams</a>
          </nav>
        </header>

        {/* Hero */}
        <section style={s.hero}>
          <div style={s.heroEyebrow}>Teams &amp; Organizations</div>
          <h1 style={s.heroTitle}>Resilience Atlas for Teams</h1>
          <p style={s.heroSubtitle}>
            Bring the Six Dimensions of Resilience to your organization. Aggregate
            insights, team dashboards, and tools for HR and L&amp;D professionals.
          </p>
        </section>

        {/* Main content */}
        <main style={s.main}>
          {/* Payment banner */}
          {banner && (
            <div role="alert" style={bannerStyle}>
              {verifying && <span style={s.spinner} aria-hidden="true" />}
              {banner.message}
            </div>
          )}

          {/* Post-payment confirmation card */}
          {verified && tierName && (
            <div style={s.confirmCard}>
              <div style={s.confirmIcon}>🎉</div>
              <div style={s.confirmTitle}>Welcome to {tierName}!</div>
              <p style={s.confirmSubtitle}>
                Your team plan is active. Set up your team dashboard to invite members
                and start exploring your organization's resilience profile.
              </p>

              <div style={s.nextSteps}>
                <div style={s.nextStepsTitle}>🚀 Getting Started</div>
                <ol style={s.nextStepsList}>
                  <li>Access your <strong>Team Dashboard</strong> to manage members and settings.</li>
                  <li>Invite team members by email — they'll each complete the assessment.</li>
                  <li>Review your team's aggregate resilience profile once assessments are in.</li>
                </ol>
              </div>

              <div style={s.buttonRow}>
                <a href="/team-analytics" style={s.primaryBtn}>
                  Open Team Dashboard
                </a>
                <a href="/assessment.html" style={s.secondaryBtn}>
                  Take Assessment
                </a>
              </div>
            </div>
          )}

          {/* Pricing tiers — always visible */}
          <h2 style={s.sectionTitle}>Team Plans</h2>
          <div style={s.tierGrid}>
            {TEAM_TIERS.map((tier) => (
              <div
                key={tier.key}
                style={{
                  ...s.tierCard,
                  ...(tier.highlight
                    ? { border: '2px solid #2563eb', boxShadow: '0 4px 20px rgba(37,99,235,0.12)' }
                    : {}),
                }}
              >
                {tier.highlight && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    Most Popular
                  </div>
                )}
                <div style={s.tierName}>{tier.name}</div>
                <div style={s.tierPrice}>{tier.price}</div>
                <div style={s.tierBilling}>{tier.billing}</div>
                <ul style={s.tierFeatures}>
                  {tier.features.map((f) => (
                    <li key={f} style={s.tierFeatureItem}>
                      <span style={s.tierFeatureCheck}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {tier.key === 'enterprise' ? (
                  <a href="mailto:support@theresilienceatlas.com" style={s.ctaButton}>
                    Contact Sales
                  </a>
                ) : (
                  <a href="/assessment.html" style={s.ctaButton}>
                    Get Started
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Links to team resources */}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <a href="/teams/resources" style={{ color: '#2563eb', fontSize: 14, textDecoration: 'none', marginRight: 24 }}>
              Team Resources →
            </a>
            <a href="/teams/activities" style={{ color: '#2563eb', fontSize: 14, textDecoration: 'none', marginRight: 24 }}>
              Team Activities →
            </a>
            <a href="/teams/facilitation" style={{ color: '#2563eb', fontSize: 14, textDecoration: 'none' }}>
              Facilitation Guide →
            </a>
          </div>

          {/* Data Export Section */}
          <div style={{ marginTop: '2.5rem', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
            <DataExportPanel orgId="team" />
          </div>
        </main>

      </div>
    </>
  );
}
