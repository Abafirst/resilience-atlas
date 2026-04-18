import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import SiteHeader from '../components/SiteHeader.jsx';
import AssessmentHistory from '../components/AssessmentHistory.jsx';

const s = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg, #0f0f23)',
    color: 'var(--text, #e2e8f0)',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  main: {
    maxWidth: 860,
    margin: '0 auto',
    padding: '2rem 1.5rem 4rem',
  },
  hero: {
    textAlign: 'center',
    padding: '3rem 1rem 2rem',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    marginBottom: '2rem',
  },
  heroTitle: {
    fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
    fontWeight: 700,
    margin: '0 0 0.75rem',
    background: 'linear-gradient(135deg, #a78bfa, #818cf8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  heroSub: {
    fontSize: '1rem',
    color: 'var(--text-muted, #94a3b8)',
    maxWidth: 560,
    margin: '0 auto',
    lineHeight: 1.6,
  },
  signInBanner: {
    background: 'rgba(99,102,241,0.1)',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: 12,
    padding: '2rem',
    textAlign: 'center',
    marginTop: '2rem',
  },
  signInText: {
    fontSize: '1rem',
    color: 'var(--text-muted, #94a3b8)',
    marginBottom: '1.25rem',
  },
  signInBtn: {
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '0.75rem 2rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  quizLink: {
    display: 'inline-block',
    marginTop: '1rem',
    color: '#a78bfa',
    textDecoration: 'none',
    fontSize: '0.9rem',
  },
  loading: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f0f23',
    color: '#94a3b8',
    fontSize: 16,
  },
};

export default function ResultsHistoryPage() {
  const {
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    user,
    getAccessTokenSilently,
  } = useAuth0();

  useEffect(() => {
    document.title = 'Resilience Journey — The Resilience Atlas™';
  }, []);

  if (isLoading) {
    return <div style={s.loading}>Loading…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div style={s.page}>
        <SiteHeader activePage="results-history" />
        <main style={s.main} id="main-content">
          <section style={s.hero}>
            <h1 style={s.heroTitle}>
              <img src="/brand/logo-256x256.png" alt="" aria-hidden="true" width={28} height={28} />
              Your Resilience Journey
            </h1>
            <p style={s.heroSub}>
              Track how your resilience evolves over time. Sign in to view your assessment
              history, download reports, and access your personal resilience dashboard.
            </p>
          </section>
          <div style={s.signInBanner}>
            <p style={s.signInText}>
              <img src="/icons/lock.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'text-bottom', marginRight: 5 }} />Sign in to view your saved results, download PDF reports, and track your
              resilience journey over time.
            </p>
            <button
              style={s.signInBtn}
              onClick={() => loginWithRedirect({ appState: { returnTo: '/results-history' } })}
            >
              Sign In to View Your Journey
            </button>
            <br />
            <a href="/quiz" style={s.quizLink}>
              New here? Take the free assessment →
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <SiteHeader activePage="results-history" />
      <main style={s.main} id="main-content">
        <section style={s.hero}>
          <h1 style={s.heroTitle}>
            <img src="/brand/logo-256x256.png" alt="" aria-hidden="true" width={28} height={28} />
            Your Resilience Journey
          </h1>
          <p style={s.heroSub}>
            Your assessment history and PDF reports are below. Each assessment marks a new
            point on your personal resilience atlas.
          </p>
        </section>
        <AssessmentHistory
          email={user?.email}
          getTokenFn={getAccessTokenSilently}
        />
      </main>
    </div>
  );
}
