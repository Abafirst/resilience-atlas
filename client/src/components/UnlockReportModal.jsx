import React, { useState } from 'react';

/**
 * UnlockReportModal — shown after an assessment is completed.
 *
 * Displays brief results summary and two unlock options:
 *   - Atlas Starter ($9.99) — unlocks this report only.
 *   - Atlas Navigator ($49.99) — unlocks all reports forever.
 *
 * Props:
 *   results       {object}   Assessment results (overall, dominantType, scores)
 *   onClose       {function} Called when the user dismisses the modal.
 *   onUnlock      {function} Called with the tier ID when the user selects an option.
 *   checkoutLoading {string}  Tier ID currently being checked out (or '').
 */

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
  },
  modal: {
    background:    '#ffffff',
    borderRadius:  16,
    boxShadow:     '0 20px 60px rgba(0,0,0,0.3)',
    maxWidth:      520,
    width:         '100%',
    overflow:      'hidden',
    position:      'relative',
  },
  header: {
    background:    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding:       '28px 28px 20px',
    color:         '#fff',
    textAlign:     'center',
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
    marginTop:   6,
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
  },
  dimType: {
    textAlign:    'center',
    fontSize:     14,
    color:        '#4a5568',
    marginBottom: 16,
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
    padding:    '20px 28px 8px',
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
  optionCard: (isLoading, isHighlighted) => ({
    border:       isHighlighted ? '2px solid #667eea' : '1.5px solid #e2e8f0',
    borderRadius: 12,
    padding:      '16px 18px',
    cursor:       isLoading ? 'not-allowed' : 'pointer',
    opacity:      isLoading ? 0.7 : 1,
    background:   isHighlighted ? '#f5f3ff' : '#fff',
    transition:   'border-color 0.15s, background 0.15s',
    position:     'relative',
  }),
  optionHeader: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   6,
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
    marginBottom: 4,
  },
  optionDesc: {
    fontSize:   13,
    color:      '#718096',
    lineHeight: 1.4,
  },
  optionBtn: (isLoading, isHighlighted) => ({
    marginTop:    10,
    width:        '100%',
    padding:      '10px 0',
    background:   isHighlighted ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f8fafc',
    color:        isHighlighted ? '#fff' : '#4a5568',
    border:       isHighlighted ? 'none' : '1.5px solid #e2e8f0',
    borderRadius: 8,
    fontSize:     14,
    fontWeight:   600,
    cursor:       isLoading ? 'not-allowed' : 'pointer',
    transition:   'all 0.15s',
  }),
  footer: {
    padding:    '12px 28px 24px',
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
};

const UNLOCK_OPTIONS = [
  {
    tier:        'atlas-starter',
    name:        'Atlas Starter',
    price:       '$9.99',
    badge:       '1 Report',
    description: 'Unlock this report only. Pay $9.99 each time you want to download a new report.',
    highlighted: false,
  },
  {
    tier:        'atlas-navigator',
    name:        'Atlas Navigator',
    price:       '$49.99',
    badge:       'Best Value',
    description: 'Lifetime access to unlimited PDF reports and gamification — one payment forever.',
    highlighted: true,
  },
];

export default function UnlockReportModal({ results, onClose, onUnlock, checkoutLoading }) {
  const [hoveredTier, setHoveredTier] = useState(null);

  const overall     = results ? results.overall : 0;
  const dominantType = results ? (results.dominantType || '') : '';

  return (
    <div style={s.overlay} role="dialog" aria-modal="true" aria-labelledby="unlockModalTitle">
      <div style={s.modal}>
        {/* ── Header ── */}
        <div style={s.header}>
          <button
            type="button"
            style={s.closeBtn}
            onClick={onClose}
            aria-label="Close unlock modal"
          >
            ×
          </button>
          <span style={s.headerIcon} aria-hidden="true">🔓</span>
          <h2 id="unlockModalTitle" style={s.headerTitle}>
            Your Brief Results are Ready
          </h2>
          <p style={s.headerSub}>
            Unlock the full PDF report to download and access gamification.
          </p>
        </div>

        {/* ── Brief Results Summary ── */}
        {results && (
          <div style={s.briefResults}>
            <div style={s.briefTitle}>Your Results Preview</div>
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

        <div style={s.divider} />

        {/* ── Unlock Options ── */}
        <div style={s.optionsTitle}>Unlock Your Full Report</div>
        <div style={s.optionsDesc}>
          Taking the assessment is always free. Choose a plan to download your PDF report and access gamification features.
        </div>
        <div style={s.optionsList}>
          {UNLOCK_OPTIONS.map(({ tier, name, price, badge, description, highlighted }) => {
            const isLoading = checkoutLoading === tier;
            return (
              <div
                key={tier}
                style={s.optionCard(isLoading, highlighted)}
                onMouseEnter={() => setHoveredTier(tier)}
                onMouseLeave={() => setHoveredTier(null)}
              >
                <div style={s.optionHeader}>
                  <span style={s.optionName}>{name}</span>
                  <span style={s.optionBadge(highlighted)}>{badge}</span>
                </div>
                <div style={s.optionPrice}>{price}</div>
                <div style={s.optionDesc}>{description}</div>
                <button
                  type="button"
                  style={s.optionBtn(isLoading, highlighted)}
                  disabled={!!checkoutLoading}
                  aria-busy={isLoading}
                  onClick={() => onUnlock(tier)}
                >
                  {isLoading ? '⏳ Redirecting to checkout…' : `Unlock with ${name}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div style={s.footer}>
          <button
            type="button"
            style={s.footerLink}
            onClick={onClose}
          >
            View my brief results without unlocking
          </button>
        </div>
      </div>
    </div>
  );
}
