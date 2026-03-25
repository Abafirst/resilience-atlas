import React from 'react';

/**
 * AssessmentHub — shown to authenticated users as the default landing page.
 *
 * The basic 72-question resilience assessment is FREE and does not require
 * payment.  Payment is only requested when the user explicitly chooses to
 * unlock the full premium (deep) report.
 */

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
  header: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: '16px 24px',
  },
  logoutBtn: {
    background: 'none',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 6,
    padding: '6px 14px',
    cursor: 'pointer',
    color: '#a0aec0',
    fontSize: 14,
  },
  hero: {
    textAlign: 'center',
    maxWidth: 680,
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
    fontSize: 38,
    fontWeight: 800,
    color: '#e8f0fe',
    lineHeight: 1.2,
    margin: '0 0 16px',
  },
  subtitle: {
    fontSize: 17,
    color: '#a0aec0',
    lineHeight: 1.7,
    marginBottom: 40,
  },
  cards: {
    display: 'flex',
    gap: 24,
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 32,
  },
  card: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: '28px 32px',
    maxWidth: 280,
    flex: '1 1 240px',
    textAlign: 'left',
  },
  cardPremium: {
    background: 'rgba(74,144,217,0.1)',
    border: '1px solid rgba(74,144,217,0.35)',
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: 14,
  },
  cardTitle: {
    color: '#e8f0fe',
    fontWeight: 700,
    fontSize: 18,
    marginBottom: 8,
  },
  cardDesc: {
    color: '#a0aec0',
    fontSize: 14,
    lineHeight: 1.6,
    marginBottom: 20,
  },
  freeBadge: {
    display: 'inline-block',
    background: '#10b981',
    color: '#fff',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 14,
  },
  premiumBadge: {
    display: 'inline-block',
    background: '#4a90d9',
    color: '#fff',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 14,
  },
  btnFree: {
    display: 'block',
    width: '100%',
    padding: '11px 0',
    background: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
    textDecoration: 'none',
  },
  btnPremium: {
    display: 'block',
    width: '100%',
    padding: '11px 0',
    background: '#4a90d9',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 20px',
    color: '#a0aec0',
    fontSize: 13,
    lineHeight: 1.8,
  },
  checkmark: {
    color: '#10b981',
    marginRight: 6,
  },
};

export default function AssessmentHub({ onUpgrade, onLogout }) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button type="button" style={styles.logoutBtn} onClick={onLogout}>
          Sign out
        </button>
      </div>

      <div style={styles.hero}>
        <span style={styles.eyebrow}>You&apos;re logged in</span>
        <h1 style={styles.title}>Your Resilience Journey Starts Here</h1>
        <p style={styles.subtitle}>
          Take the free assessment to discover your resilience profile across six
          dimensions — no payment required. Upgrade for a comprehensive deep-dive report.
        </p>

        <div style={styles.cards}>
          {/* Free assessment card */}
          <div style={styles.card}>
            <div style={styles.cardIcon}>🧭</div>
            <span style={styles.freeBadge}>FREE</span>
            <div style={styles.cardTitle}>Basic Assessment</div>
            <p style={styles.cardDesc}>
              72 questions · ~15 minutes · no credit card needed
            </p>
            <ul style={styles.featureList}>
              <li><span style={styles.checkmark}>✓</span>Your resilience scores</li>
              <li><span style={styles.checkmark}>✓</span>Top strength identified</li>
              <li><span style={styles.checkmark}>✓</span>Radar chart overview</li>
              <li><span style={styles.checkmark}>✓</span>Brief narrative snapshot</li>
            </ul>
            <a href="/quiz.html" style={styles.btnFree}>
              Start Free Assessment
            </a>
          </div>

          {/* Premium report card */}
          <div style={{ ...styles.card, ...styles.cardPremium }}>
            <div style={styles.cardIcon}>📋</div>
            <span style={styles.premiumBadge}>PREMIUM</span>
            <div style={styles.cardTitle}>Full Deep Report</div>
            <p style={styles.cardDesc}>
              Comprehensive PDF report with personalized insights and growth plan
            </p>
            <ul style={styles.featureList}>
              <li><span style={styles.checkmark}>✓</span>Everything in Basic</li>
              <li><span style={styles.checkmark}>✓</span>Detailed dimension analysis</li>
              <li><span style={styles.checkmark}>✓</span>Personalized growth plan</li>
              <li><span style={styles.checkmark}>✓</span>Downloadable PDF report</li>
            </ul>
            <button type="button" style={styles.btnPremium} onClick={onUpgrade}>
              Unlock Full Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
