import React, { useCallback } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { UNLOCK_TIERS } from '../constants/unlockPricing.js';
import { useUnlockPayment } from '../hooks/useUnlockPayment.js';

/**
 * UnlockReportModal — shown when a user tries to download a locked PDF report.
 *
 * Displays brief results summary and two inline Stripe purchase options:
 *   - Atlas Starter ($9.99) — unlocks this report only.
 *   - Atlas Navigator ($49.99) — unlocks all reports forever.
 *
 * After successful payment shows a success message and a download button.
 *
 * Props:
 *   results          {object}   Assessment results (overall, dominantType, scores)
 *   onClose          {function} Called when the user dismisses the modal.
 *   onUnlockSuccess  {function} Called after a successful purchase (triggers download).
 *   onUnlock         {function} (legacy) Called with tier ID for redirect-to-checkout fallback.
 *   checkoutLoading  {string}   (legacy) Tier ID currently redirecting to checkout.
 */

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize:    '14px',
      color:       '#1a202c',
      fontFamily:  'system-ui, -apple-system, sans-serif',
      '::placeholder': { color: '#a0aec0' },
    },
    invalid: { color: '#e53e3e' },
  },
};

// ── Styles ───────────────────────────────────────────────────────────────────

const s = {
  overlay: {
    position:        'fixed',
    inset:           0,
    background:      'rgba(15, 23, 42, 0.65)',
    backdropFilter:  'blur(4px)',
    zIndex:          9000,
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         '16px',
    overflowY:       'auto',
  },
  modal: {
    background:    '#ffffff',
    borderRadius:  16,
    boxShadow:     '0 20px 60px rgba(0,0,0,0.3)',
    maxWidth:      520,
    width:         '100%',
    overflow:      'hidden',
    position:      'relative',
    maxHeight:     '95vh',
    overflowY:     'auto',
  },
  header: {
    background:    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding:       '28px 28px 20px',
    color:         '#fff',
    textAlign:     'center',
    position:      'relative',
  },
  headerIcon: {
    fontSize:    40,
    marginBottom: 8,
    display:     'block',
  },
  headerTitle: {
    fontSize:    22,
    fontWeight:  700,
    margin:      0,
    lineHeight:  1.3,
  },
  headerSub: {
    fontSize:    14,
    opacity:     0.85,
    margin:      '6px 0 0',
  },
  briefResults: {
    padding:     '20px 28px 4px',
  },
  briefTitle: {
    fontSize:    13,
    fontWeight:  700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color:       '#718096',
    marginBottom: 12,
  },
  scoreRow: {
    display:        'flex',
    justifyContent: 'center',
    gap:            20,
    marginBottom:   12,
    flexWrap:       'wrap',
  },
  scoreBadge: {
    background:   '#f0f4ff',
    border:       '1px solid #e0e7ff',
    borderRadius: 10,
    padding:      '10px 18px',
    textAlign:    'center',
    minWidth:     90,
  },
  scoreValue: {
    fontSize:   22,
    fontWeight: 700,
    color:      '#667eea',
    display:    'block',
  },
  scoreLabel: {
    fontSize:   12,
    color:      '#718096',
    marginTop:  2,
    display:    'block',
  },
  dimType: {
    textAlign:    'center',
    fontSize:     14,
    color:        '#4a5568',
    marginBottom: 12,
    padding:      '8px 16px',
    background:   '#f8fafc',
    borderRadius: 8,
    border:       '1px solid #e2e8f0',
  },
  divider: {
    height:     1,
    background: '#e2e8f0',
    margin:     '0 28px',
  },
  optionsTitle: {
    padding:    '18px 28px 6px',
    fontSize:   15,
    fontWeight: 700,
    color:      '#1a202c',
  },
  optionsDesc: {
    padding:    '0 28px 12px',
    fontSize:   13,
    color:      '#718096',
    lineHeight: 1.5,
  },
  optionsList: {
    padding:    '0 28px 4px',
    display:    'flex',
    flexDirection: 'column',
    gap:        10,
  },
  optionCard: (isActive, isHighlighted) => ({
    border:       isActive ? '2px solid #667eea' : (isHighlighted ? '2px solid #667eea' : '1.5px solid #e2e8f0'),
    borderRadius: 12,
    padding:      '16px 18px',
    background:   isHighlighted ? '#f5f3ff' : '#fff',
    transition:   'border-color 0.15s, background 0.15s',
    position:     'relative',
  }),
  optionHeader: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   4,
  },
  optionName: {
    fontSize:   15,
    fontWeight: 700,
    color:      '#1a202c',
  },
  optionBadge: (isHighlighted) => ({
    background:   isHighlighted ? '#667eea' : '#e2e8f0',
    color:        isHighlighted ? '#fff' : '#4a5568',
    borderRadius: 20,
    padding:      '2px 8px',
    fontSize:     11,
    fontWeight:   600,
  }),
  optionPrice: {
    fontSize:   20,
    fontWeight: 700,
    color:      '#667eea',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize:   13,
    color:      '#718096',
    lineHeight: 1.4,
    marginBottom: 10,
  },
  selectBtn: (isHighlighted) => ({
    width:        '100%',
    padding:      '9px 0',
    background:   isHighlighted ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f8fafc',
    color:        isHighlighted ? '#fff' : '#4a5568',
    border:       isHighlighted ? 'none' : '1.5px solid #e2e8f0',
    borderRadius: 8,
    fontSize:     14,
    fontWeight:   600,
    cursor:       'pointer',
    transition:   'all 0.15s',
  }),
  cardBox: {
    border:       '1px solid #e2e8f0',
    borderRadius: 8,
    padding:      '10px 12px',
    background:   '#fafafa',
    marginBottom: 10,
    marginTop:    10,
  },
  payBtn: (loading, isHighlighted) => ({
    width:        '100%',
    padding:      '10px 0',
    background:   loading ? '#a0aec0' : (isHighlighted ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#4a5568'),
    color:        '#fff',
    border:       'none',
    borderRadius: 8,
    fontSize:     14,
    fontWeight:   700,
    cursor:       loading ? 'not-allowed' : 'pointer',
    transition:   'background 0.15s',
  }),
  backBtn: {
    width:        '100%',
    padding:      '7px 0',
    background:   'none',
    color:        '#718096',
    border:       '1px solid #e2e8f0',
    borderRadius: 8,
    fontSize:     13,
    cursor:       'pointer',
    marginTop:    6,
  },
  errorMsg: {
    fontSize:   13,
    color:      '#e53e3e',
    background: '#fff5f5',
    border:     '1px solid #fed7d7',
    borderRadius: 6,
    padding:    '8px 10px',
    marginTop:  8,
  },
  successBox: {
    margin:     '20px 28px 4px',
    background: '#f0fff4',
    border:     '1.5px solid #9ae6b4',
    borderRadius: 12,
    padding:    '20px',
    textAlign:  'center',
  },
  successIcon: {
    fontSize:   40,
    marginBottom: 8,
    display:    'block',
  },
  successTitle: {
    fontSize:   16,
    fontWeight: 700,
    color:      '#276749',
    marginBottom: 6,
  },
  successDesc: {
    fontSize:   13,
    color:      '#2f855a',
    marginBottom: 14,
  },
  downloadBtn: {
    display:      'inline-block',
    padding:      '12px 28px',
    background:   'linear-gradient(135deg, #38a169, #276749)',
    color:        '#fff',
    borderRadius: 8,
    fontSize:     15,
    fontWeight:   700,
    border:       'none',
    cursor:       'pointer',
    width:        '100%',
  },
  footer: {
    padding:    '10px 28px 22px',
    textAlign:  'center',
  },
  footerLink: {
    fontSize:   13,
    color:      '#718096',
    cursor:     'pointer',
    textDecoration: 'underline',
    background: 'none',
    border:     'none',
    padding:    0,
  },
  closeBtn: {
    position:   'absolute',
    top:        12,
    right:      16,
    background: 'rgba(255,255,255,0.2)',
    border:     'none',
    borderRadius: 8,
    color:      '#fff',
    fontSize:   20,
    lineHeight: 1,
    cursor:     'pointer',
    padding:    '4px 8px',
  },
  stripeLoadError: {
    padding:    '12px 28px',
    fontSize:   13,
    color:      '#e53e3e',
    background: '#fff5f5',
    margin:     '0 28px 12px',
    borderRadius: 8,
    border:     '1px solid #fed7d7',
  },
};

// ── Inner payment form (needs stripe + elements context) ─────────────────────

function InlinePaymentForm({ tier, highlighted, onConfirmPayment, loading, error, onBack }) {
  const stripe   = useStripe();
  const elements = useElements();

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    onConfirmPayment(stripe, elements);
  }, [stripe, elements, onConfirmPayment]);

  return (
    <form onSubmit={handleSubmit}>
      <div style={s.cardBox}>
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>
      {error && <div style={s.errorMsg} role="alert">{error}</div>}
      <button
        type="submit"
        style={s.payBtn(loading, highlighted)}
        disabled={loading || !stripe}
        aria-busy={loading}
      >
        {loading ? '⏳ Processing payment…' : `Pay & Unlock Report`}
      </button>
      <button type="button" style={s.backBtn} onClick={onBack} disabled={loading}>
        ← Back to options
      </button>
    </form>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function UnlockReportModal({
  results,
  onClose,
  onUnlockSuccess,
  // Legacy props kept for backward compatibility (redirect-to-checkout fallback):
  onUnlock,
  checkoutLoading,
}) {
  const {
    stripePromise,
    stripeLoadError,
    selectedTier,
    clientSecret,
    loading,
    error,
    paymentSuccess,
    selectTier,
    confirmPayment,
    backToTiers,
    reset,
  } = useUnlockPayment({ results, onUnlockSuccess });

  const overall      = results ? (results.overall ?? 0) : 0;
  const dominantType = results ? (results.dominantType || '') : '';

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  return (
    <div
      style={s.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="unlockModalTitle"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div style={s.modal}>
        {/* ── Header ── */}
        <div style={s.header}>
          <button
            type="button"
            style={s.closeBtn}
            onClick={handleClose}
            aria-label="Close unlock modal"
          >
            ×
          </button>
          <span style={s.headerIcon} aria-hidden="true">
            {paymentSuccess ? '✅' : '🔓'}
          </span>
          <h2 id="unlockModalTitle" style={s.headerTitle}>
            {paymentSuccess ? 'Report Unlocked!' : 'Unlock Your Report'}
          </h2>
          <p style={s.headerSub}>
            {paymentSuccess
              ? 'Your payment was successful. Download your full PDF report now.'
              : 'Taking the assessment is always free. Unlock the PDF and gamification below.'
            }
          </p>
        </div>

        {/* ── Brief Results Summary ── */}
        {results && !paymentSuccess && (
          <div style={s.briefResults}>
            <div style={s.briefTitle}>📊 Your Results Preview</div>
            <div style={s.scoreRow}>
              <div style={s.scoreBadge}>
                <span style={s.scoreValue}>{Math.round(overall)}%</span>
                <span style={s.scoreLabel}>Overall Score</span>
              </div>
            </div>
            {dominantType && (
              <div style={s.dimType}>
                🧭 Dominant Dimension: <strong>{dominantType}</strong>
              </div>
            )}
          </div>
        )}

        {!paymentSuccess && <div style={s.divider} />}

        {/* ── Success State ── */}
        {paymentSuccess && (
          <div style={s.successBox} role="status">
            <span style={s.successIcon} aria-hidden="true">🎉</span>
            <div style={s.successTitle}>Payment Successful!</div>
            <p style={s.successDesc}>
              Your report is now unlocked. Click below to download your full PDF.
            </p>
            <button
              type="button"
              style={s.downloadBtn}
              onClick={handleClose}
            >
              ⬇ Download PDF Report
            </button>
          </div>
        )}

        {/* ── Unlock Options / Payment Form ── */}
        {!paymentSuccess && (
          <>
            <div style={s.optionsTitle}>Choose your access level:</div>
            <div style={s.optionsDesc}>
              Select a plan and pay securely below to unlock your PDF report.
            </div>

            {stripeLoadError && (
              <div style={s.stripeLoadError} role="alert">{stripeLoadError}</div>
            )}

            <div style={s.optionsList}>
              {UNLOCK_TIERS.map(({ tier, name, price, badge, description, highlighted }) => {
                const isThisSelected = selectedTier === tier && clientSecret;
                const anySelected    = Boolean(selectedTier && clientSecret);

                return (
                  <div key={tier} style={s.optionCard(isThisSelected, highlighted)}>
                    <div style={s.optionHeader}>
                      <span style={s.optionName}>{name}</span>
                      <span style={s.optionBadge(highlighted)}>{badge}</span>
                    </div>
                    <div style={s.optionPrice}>{price}</div>
                    <div style={s.optionDesc}>{description}</div>

                    {/* Payment form (shown after this tier is selected) */}
                    {isThisSelected && stripePromise ? (
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <InlinePaymentForm
                          tier={tier}
                          highlighted={highlighted}
                          onConfirmPayment={confirmPayment}
                          loading={loading}
                          error={error}
                          onBack={backToTiers}
                        />
                      </Elements>
                    ) : (
                      /* Tier selection button */
                      !anySelected && (
                        <button
                          type="button"
                          style={s.selectBtn(highlighted)}
                          disabled={loading}
                          aria-busy={loading && selectedTier === tier}
                          onClick={() => selectTier(tier)}
                        >
                          {loading && selectedTier === tier
                            ? '⏳ Preparing checkout…'
                            : `Unlock with ${name}`
                          }
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>

            {/* Loading state while creating payment intent */}
            {loading && !clientSecret && (
              <div style={{ padding: '10px 28px', fontSize: 13, color: '#718096', textAlign: 'center' }}>
                ⏳ Preparing secure checkout…
              </div>
            )}
            {/* Top-level error (e.g. network failure before payment form shown) */}
            {error && !clientSecret && (
              <div style={{ ...s.stripeLoadError, margin: '0 28px 12px' }} role="alert">{error}</div>
            )}
          </>
        )}

        {/* ── Footer ── */}
        <div style={s.footer}>
          {!paymentSuccess ? (
            <button type="button" style={s.footerLink} onClick={handleClose}>
              View my brief results without unlocking
            </button>
          ) : (
            <button type="button" style={s.footerLink} onClick={handleClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
