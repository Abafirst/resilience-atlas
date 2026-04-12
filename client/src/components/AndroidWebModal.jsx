import React from 'react';
import { getWebUrl, openExternalUrl } from '../utils/platform.js';

const MARKETING_PATH = '/teams';

// ── Styles ─────────────────────────────────────────────────────────────────

const s = {
  overlay: {
    position:       'fixed',
    inset:          0,
    background:     'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(4px)',
    zIndex:         9900,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        '16px',
  },
  modal: {
    background:   '#ffffff',
    borderRadius: 16,
    boxShadow:    '0 20px 60px rgba(0,0,0,0.3)',
    maxWidth:     400,
    width:        '100%',
    overflow:     'hidden',
    position:     'relative',
  },
  header: {
    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    padding:    '24px 24px 20px',
    color:      '#fff',
    textAlign:  'center',
    position:   'relative',
  },
  icon: {
    fontSize:     36,
    display:      'block',
    marginBottom: 8,
  },
  title: {
    fontSize:   20,
    fontWeight: 700,
    margin:     0,
    lineHeight: 1.3,
  },
  body: {
    padding: '24px',
  },
  message: {
    fontSize:   15,
    color:      '#475569',
    margin:     '0 0 24px',
    lineHeight: 1.6,
    textAlign:  'center',
  },
  btnPrimary: {
    display:     'block',
    width:       '100%',
    padding:     '12px 20px',
    background:  'linear-gradient(135deg, #1e40af, #3b82f6)',
    color:       '#fff',
    border:      'none',
    borderRadius: 8,
    fontSize:    15,
    fontWeight:  700,
    cursor:      'pointer',
    marginBottom: 10,
    fontFamily:  'inherit',
    boxSizing:   'border-box',
  },
  btnSecondary: {
    display:     'block',
    width:       '100%',
    padding:     '11px 20px',
    background:  'transparent',
    color:       '#475569',
    border:      '1.5px solid #cbd5e1',
    borderRadius: 8,
    fontSize:    14,
    fontWeight:  600,
    cursor:      'pointer',
    fontFamily:  'inherit',
    boxSizing:   'border-box',
  },
  closeBtn: {
    position:   'absolute',
    top:        12,
    right:      14,
    background: 'rgba(255,255,255,0.15)',
    border:     'none',
    borderRadius: 6,
    color:      '#fff',
    cursor:     'pointer',
    fontSize:   18,
    lineHeight: 1,
    padding:    '2px 7px',
    fontFamily: 'inherit',
  },
};

/**
 * AndroidWebModal — shown on Capacitor Android instead of starting a Stripe
 * checkout session.
 *
 * Informs the user that the feature is available on the web and provides a
 * link to the marketing page (not a checkout/payment page).
 *
 * Props:
 *   onClose  {function}  Called when the user dismisses the modal.
 */
export default function AndroidWebModal({ onClose }) {
  function handleOpenWeb() {
    openExternalUrl(getWebUrl(MARKETING_PATH));
  }

  return (
    <div
      style={s.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="awm-title"
    >
      <div style={s.modal}>
        <div style={s.header}>
          <button
            type="button"
            style={s.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
          <span aria-hidden="true" style={s.icon}>🌐</span>
          <h2 id="awm-title" style={s.title}>Available on the web</h2>
        </div>
        <div style={s.body}>
          <p style={s.message}>
            This feature is available on the web. Visit our website to learn more.
          </p>
          <button type="button" style={s.btnPrimary} onClick={handleOpenWeb}>
            Learn more on the web
          </button>
          <button type="button" style={s.btnSecondary} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
