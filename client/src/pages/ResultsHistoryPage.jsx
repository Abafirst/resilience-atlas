import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import SiteHeader from '../components/SiteHeader.jsx';
import AssessmentHistory from '../components/AssessmentHistory.jsx';

const styles = `
  .results-history-page {
    min-height: 100vh;
    position: relative;
    overflow: hidden;
    --history-bg: #ffffff;
    --history-border: rgba(148, 163, 184, .32);
    --history-text: #334155;
    --history-text-muted: #64748b;
    --history-btn-primary: #4f46e5;
    --history-btn-primary-text: #ffffff;
    --history-btn-secondary-bg: #f8fafc;
    --history-btn-secondary-text: #334155;
    --history-btn-secondary-border: rgba(148, 163, 184, .38);
  }

  .results-history-page::before {
    content: '';
    position: absolute;
    width: 520px;
    height: 520px;
    top: 130px;
    right: -200px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(79, 70, 229, .16) 0%, rgba(79, 70, 229, 0) 72%);
    pointer-events: none;
  }

  .results-history-page::after {
    content: '';
    position: absolute;
    width: 460px;
    height: 460px;
    bottom: 80px;
    left: -180px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(16, 185, 129, .12) 0%, rgba(16, 185, 129, 0) 70%);
    pointer-events: none;
  }

  .results-history-main {
    max-width: 1080px;
    margin: 0 auto;
    padding: 2rem 1.25rem 4rem;
    position: relative;
    z-index: 1;
  }

  .results-history-hero,
  .results-history-panel {
    border-radius: 22px;
    border: 1px solid var(--history-border);
    background: var(--history-bg);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
  }

  .results-history-hero {
    text-align: center;
    padding: clamp(1.25rem, 2.8vw, 2rem);
    background: linear-gradient(140deg, #fff8f1 0%, #fdf2f8 45%, #eef2ff 100%);
    border-color: rgba(79, 70, 229, .2);
  }

  .results-history-title {
    font-size: clamp(1.5rem, 4vw, 2.2rem);
    font-weight: 700;
    margin: 0 0 .75rem;
    color: #1f2937;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .results-history-sub {
    font-size: 1rem;
    color: var(--history-text);
    max-width: 560px;
    margin: 0 auto;
    line-height: 1.6;
  }

  .results-history-panel {
    margin-top: 1rem;
    padding: clamp(1.05rem, 2.6vw, 1.6rem);
  }

  .results-history-signin {
    text-align: center;
  }

  .results-history-signin-text {
    font-size: 1rem;
    color: var(--history-text);
    margin-bottom: 1.25rem;
  }

  .results-history-signin-btn {
    background: linear-gradient(135deg, #4f46e5, #4338ca);
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 0.75rem 2rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform .2s ease, opacity .2s ease;
  }

  .results-history-signin-btn:hover {
    transform: translateY(-1px);
    opacity: .94;
  }

  .results-history-quiz-link {
    display: inline-block;
    margin-top: 1rem;
    color: #4338ca;
    text-decoration: none;
    font-size: .95rem;
    font-weight: 600;
  }

  [data-theme='dark'] .results-history-page {
    --history-bg: #111827;
    --history-border: #334155;
    --history-text: #cbd5e1;
    --history-text-muted: #94a3b8;
    --history-btn-primary: #6366f1;
    --history-btn-primary-text: #ffffff;
    --history-btn-secondary-bg: #1f2937;
    --history-btn-secondary-text: #e2e8f0;
    --history-btn-secondary-border: #334155;
  }

  [data-theme='dark'] .results-history-page::before {
    background: radial-gradient(circle, rgba(168, 85, 247, .22) 0%, rgba(168, 85, 247, 0) 72%);
  }

  [data-theme='dark'] .results-history-page::after {
    background: radial-gradient(circle, rgba(59, 130, 246, .2) 0%, rgba(59, 130, 246, 0) 70%);
  }

  [data-theme='dark'] .results-history-hero {
    background: linear-gradient(140deg, rgba(30, 41, 59, .95) 0%, rgba(51, 65, 85, .92) 52%, rgba(30, 41, 59, .95) 100%);
    border-color: rgba(148, 163, 184, .25);
    box-shadow: 0 16px 40px rgba(2, 6, 23, .55);
  }

  [data-theme='dark'] .results-history-title { color: #f8fafc; }
  [data-theme='dark'] .results-history-quiz-link { color: #c7d2fe; }

  @media (max-width: 640px) {
    .results-history-main { padding: 1.5rem 1rem 3rem; }
  }
`;

const s = {
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
      <div className="storytelling-page results-history-page">
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        <SiteHeader activePage="results-history" />
        <main className="results-history-main" id="main-content">
          <section className="results-history-hero">
            <h1 className="results-history-title">
              <img src="/brand/logo-256x256.png" alt="" aria-hidden="true" width={28} height={28} />
              Your Resilience Journey
            </h1>
            <p className="results-history-sub">
              Track how your resilience evolves over time. Sign in to view your assessment
              history and brief summary results. Full PDF download/email is available with Atlas Starter or Atlas Navigator.
            </p>
          </section>
          <div className="results-history-panel results-history-signin">
            <p className="results-history-signin-text">
              <img src="/icons/lock.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'text-bottom', marginRight: 5 }} />Sign in to view your saved results, summary history, and track your
              resilience journey over time.
            </p>
            <button
              className="results-history-signin-btn"
              onClick={() => loginWithRedirect({ appState: { returnTo: '/results-history' } })}
            >
              Sign In to View Your Journey
            </button>
            <br />
            <a href="/quiz" className="results-history-quiz-link" title="For adults 18+">
              New here? Take the free assessment <span style={{fontSize: '0.85em', opacity: 0.85}}>(18+)</span> →
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="storytelling-page results-history-page">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <SiteHeader activePage="results-history" />
      <main className="results-history-main" id="main-content">
        <section className="results-history-hero">
          <h1 className="results-history-title">
            <img src="/brand/logo-256x256.png" alt="" aria-hidden="true" width={28} height={28} />
            Your Resilience Journey
          </h1>
          <p className="results-history-sub">
            Your assessment history is below. Full PDF download/email requires Atlas Starter or Atlas Navigator. Each assessment marks a new
            point on your personal resilience atlas.
          </p>
        </section>
        <section className="results-history-panel" aria-label="Assessment history">
          <AssessmentHistory
            email={user?.email}
            getTokenFn={getAccessTokenSilently}
          />
        </section>
      </main>
    </div>
  );
}
