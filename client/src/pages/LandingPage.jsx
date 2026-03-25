import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  hero: {
    textAlign: 'center',
    maxWidth: 640,
  },
  eyebrow: {
    display: 'inline-block',
    background: 'rgba(74, 144, 217, 0.15)',
    color: '#4a90d9',
    borderRadius: 20,
    padding: '4px 16px',
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.05em',
    marginBottom: 24,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 42,
    fontWeight: 800,
    color: '#e8f0fe',
    lineHeight: 1.2,
    marginBottom: 20,
    margin: '0 0 20px',
  },
  subtitle: {
    fontSize: 18,
    color: '#a0aec0',
    lineHeight: 1.7,
    marginBottom: 40,
  },
  ctaBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    background: '#4a90d9',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '16px 36px',
    fontSize: 18,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 24px rgba(74, 144, 217, 0.35)',
    transition: 'background 0.2s, box-shadow 0.2s',
  },
  features: {
    display: 'flex',
    gap: 32,
    marginTop: 48,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  feature: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: '20px 24px',
    maxWidth: 180,
    textAlign: 'center',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 10,
  },
  featureTitle: {
    color: '#e8f0fe',
    fontWeight: 600,
    fontSize: 14,
    marginBottom: 6,
  },
  featureText: {
    color: '#718096',
    fontSize: 13,
    lineHeight: 1.5,
  },
  loginLink: {
    marginTop: 24,
    color: '#718096',
    fontSize: 14,
  },
  loginLinkBtn: {
    background: 'none',
    border: 'none',
    color: '#4a90d9',
    cursor: 'pointer',
    fontSize: 14,
    padding: '0 4px',
    textDecoration: 'underline',
  },
};

export default function LandingPage() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <span style={styles.eyebrow}>Resilience is Learnable</span>
        <h1 style={styles.title}>Build the Resilience You Already Have</h1>
        <p style={styles.subtitle}>
          In 10 minutes, discover your personalized map across six dimensions of resilience
          and get a clear path forward. Start where you are. Grow from here.
        </p>
        <button type="button" style={styles.ctaBtn} onClick={() => loginWithRedirect()}>
          <span aria-hidden="true">&#9654;</span> Start Assessment
        </button>
        <div style={styles.features}>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>🧭</div>
            <div style={styles.featureTitle}>6 Dimensions</div>
            <div style={styles.featureText}>Map all six resilience capacities</div>
          </div>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>⏱</div>
            <div style={styles.featureTitle}>10 Minutes</div>
            <div style={styles.featureText}>Quick, research-backed assessment</div>
          </div>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>📊</div>
            <div style={styles.featureTitle}>Full Report</div>
            <div style={styles.featureText}>Personalized insights and action plan</div>
          </div>
        </div>
        <p style={styles.loginLink}>
          Already have an account?{' '}
          <button
            type="button"
            style={styles.loginLinkBtn}
            aria-label="Log in to your account"
            onClick={() => loginWithRedirect()}
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
