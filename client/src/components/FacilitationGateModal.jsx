import React, { useEffect, useCallback } from 'react';
import { TIER_NAMES, TIER_PRICES, TEAM_TIERS } from '../utils/tierGating';

/**
 * FacilitationGateModal — Access-control modal for facilitation guides.
 * Shows an upgrade prompt when a user lacks the required tier.
 */
export default function FacilitationGateModal({ userTier, onClose }) {
  const isNonCustomer = !userTier || userTier === TEAM_TIERS.none;
  const isBasic = userTier === TEAM_TIERS.basic;

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  return (
    <div
      style={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fgate-title"
      onClick={handleBackdropClick}
    >
      <div style={styles.modal}>
        <button
          style={styles.closeBtn}
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>

        <div style={styles.lockIcon} aria-hidden="true">🔒</div>

        <h2 id="fgate-title" style={styles.title}>
          {isNonCustomer
            ? 'Upgrade to Access Facilitation Guides'
            : 'This Guide Requires Atlas Team Premium'}
        </h2>

        <p style={styles.desc}>
          {isNonCustomer
            ? 'Facilitation guides are available to Atlas Team Premium and Enterprise customers. Get started today to unlock 6+ workshop guides, templates, and facilitation resources.'
            : `You currently have ${TIER_NAMES[userTier]}. Facilitation guides are included in Atlas Team Premium and above.`}
        </p>

        {isBasic && (
          <div style={styles.currentTierBadge} aria-label="Your current plan">
            Current plan: <strong>{TIER_NAMES[userTier]} — {TIER_PRICES[userTier]}</strong>
          </div>
        )}

        <div style={styles.ctaGroup}>
          {isNonCustomer ? (
            <>
              <a href="/pricing-teams" style={{ ...styles.btn, ...styles.btnPrimary }}>
                Get Started — {TIER_PRICES.premium} one-time
              </a>
              <a href="/teams#teamLeadForm" style={{ ...styles.btn, ...styles.btnOutline }}>
                Contact Sales (Enterprise)
              </a>
            </>
          ) : (
            <>
              <a href="/pricing-teams" style={{ ...styles.btn, ...styles.btnPrimary }}>
                Upgrade to Premium — {TIER_PRICES.premium}
              </a>
              <button style={{ ...styles.btn, ...styles.btnGhost }} onClick={onClose}>
                Maybe Later
              </button>
            </>
          )}
        </div>

        <p style={styles.tierNote}>
          Atlas Team Premium includes 30 users, advanced analytics, auto-generated reports,
          full gamification suite, leaderboards, and all facilitation resources.
        </p>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1rem',
  },
  modal: {
    background: '#fff',
    borderRadius: '1rem',
    padding: '2.5rem 2rem',
    maxWidth: '460px',
    width: '100%',
    position: 'relative',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
  },
  closeBtn: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: 'none',
    border: 'none',
    fontSize: '1.1rem',
    cursor: 'pointer',
    color: '#94a3b8',
    lineHeight: 1,
    padding: '0.25rem',
  },
  lockIcon: {
    fontSize: '2.5rem',
    marginBottom: '0.75rem',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 0.75rem',
    lineHeight: 1.3,
  },
  desc: {
    fontSize: '0.92rem',
    color: '#475569',
    lineHeight: 1.6,
    margin: '0 0 1.25rem',
  },
  currentTierBadge: {
    background: '#f1f5f9',
    borderRadius: '0.5rem',
    padding: '0.6rem 1rem',
    fontSize: '0.85rem',
    color: '#334155',
    marginBottom: '1.25rem',
  },
  ctaGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    marginBottom: '1.25rem',
  },
  btn: {
    display: 'block',
    width: '100%',
    padding: '0.8rem 1rem',
    borderRadius: '0.5rem',
    fontWeight: 600,
    fontSize: '0.95rem',
    textDecoration: 'none',
    cursor: 'pointer',
    border: 'none',
    textAlign: 'center',
  },
  btnPrimary: {
    background: '#4F46E5',
    color: '#fff',
  },
  btnOutline: {
    background: 'transparent',
    border: '1.5px solid #4F46E5',
    color: '#4F46E5',
  },
  btnGhost: {
    background: 'transparent',
    color: '#64748b',
    textDecoration: 'underline',
  },
  tierNote: {
    fontSize: '0.78rem',
    color: '#94a3b8',
    margin: 0,
    lineHeight: 1.5,
  },
};
