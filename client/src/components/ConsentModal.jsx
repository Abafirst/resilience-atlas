/**
 * ConsentModal.jsx — Assessment sharing consent modal.
 *
 * Shown to authenticated users who are part of an organization before
 * they submit their assessment. Lets them opt in or out of sharing
 * their dimension scores with the organization's team dashboard.
 *
 * Props:
 *   organizationName  {string}   — Name of the user's organization
 *   defaultConsent    {boolean}  — User's saved default preference
 *   onSubmit          {function} — Called with { consent, goals, rememberPreference }
 *   onClose           {function} — Called when the modal is dismissed without submitting
 */

import React, { useState, useEffect, useRef } from 'react';

export default function ConsentModal({
  organizationName,
  defaultConsent = false,
  onSubmit,
  onClose,
}) {
  const [consent, setConsent]                   = useState(defaultConsent);
  const [goals, setGoals]                       = useState('');
  const [rememberPreference, setRemember]       = useState(false);
  const dialogRef                               = useRef(null);

  // Trap focus inside the modal while it's open
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    el.focus();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function handleSubmit() {
    onSubmit({ consent, goals: goals.trim(), rememberPreference });
  }

  const orgDisplay = organizationName || 'your organization';

  return (
    <div
      style={overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        style={modal}
        tabIndex={-1}
        aria-describedby="consent-modal-desc"
      >
        {/* Header */}
        <div style={header}>
          <h2 id="consent-modal-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            Share Your Results?
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={closeBtn}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div id="consent-modal-desc" style={body}>
          <p style={{ marginTop: 0, color: '#4a5568' }}>
            <strong>{orgDisplay}</strong> uses the Resilience Atlas to support
            team wellbeing and professional development.
          </p>

          <div style={infoGrid}>
            {/* What's shared */}
            <div style={infoBox('#f0fdf4', '#166534')}>
              <strong>✓ What&apos;s shared:</strong>
              <ul style={list}>
                <li>Your dimension scores and overall resilience score</li>
                <li>Completion date</li>
              </ul>
            </div>

            {/* What stays private */}
            <div style={infoBox('#eff6ff', '#1e40af')}>
              <strong>🔒 What stays private:</strong>
              <ul style={list}>
                <li>Individual question responses</li>
                <li>Detailed narrative interpretations</li>
                <li>Your name (visible only to admins)</li>
              </ul>
            </div>
          </div>

          <p style={{ color: '#4a5568', fontSize: '0.9rem' }}>
            Your data helps create anonymous team-level insights, identify
            professional development opportunities, and track team resilience
            trends over time.
          </p>

          {/* Goals text area — shown only when opting in */}
          {consent && (
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="consent-goals"
                style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: '0.9rem' }}
              >
                Why are you sharing? <span style={{ fontWeight: 400, color: '#718096' }}>(optional)</span>
              </label>
              <p style={{ margin: '0 0 6px', fontSize: '0.8rem', color: '#718096' }}>
                This helps your organization understand how to support your goals.
              </p>
              <textarea
                id="consent-goals"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="e.g., I want to improve my stress management skills…"
                style={textarea}
              />
            </div>
          )}

          {/* Consent radio / checkbox */}
          <fieldset style={{ border: 'none', padding: 0, margin: '0 0 1rem' }}>
            <legend style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.95rem' }}>
              Choose your preference:
            </legend>

            <label style={radioLabel}>
              <input
                type="radio"
                name="sharing-consent"
                value="share"
                checked={consent === true}
                onChange={() => setConsent(true)}
                style={{ marginRight: 8 }}
              />
              ☑️ Share my scores with <strong>{orgDisplay}</strong> to support
              team resilience initiatives
            </label>

            <label style={radioLabel}>
              <input
                type="radio"
                name="sharing-consent"
                value="private"
                checked={consent === false}
                onChange={() => setConsent(false)}
                style={{ marginRight: 8 }}
              />
              🔒 Keep my results private (only I can see them)
            </label>
          </fieldset>

          <label style={{ ...radioLabel, fontSize: '0.875rem', color: '#4a5568' }}>
            <input
              type="checkbox"
              checked={rememberPreference}
              onChange={(e) => setRemember(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            Remember my preference for future assessments
          </label>
        </div>

        {/* Footer */}
        <div style={footer}>
          <button
            type="button"
            onClick={() => {
              // "Keep Private" always saves preference as false when rememberPreference is checked,
              // regardless of the current consent radio selection.
              onSubmit({ consent: false, goals: '', rememberPreference });
            }}
            style={btnSecondary}
          >
            Keep Private
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            style={btnPrimary}
          >
            {consent ? 'Share My Results' : 'Submit Without Sharing'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inline styles ─────────────────────────────────────────────────────────────

const overlay = {
  position:        'fixed',
  inset:           0,
  background:      'rgba(0, 0, 0, 0.5)',
  zIndex:          9999,
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'center',
  padding:         '1rem',
  boxSizing:       'border-box',
};

const modal = {
  background:    '#fff',
  borderRadius:  12,
  maxWidth:      560,
  width:         '100%',
  maxHeight:     '90vh',
  overflowY:     'auto',
  boxShadow:     '0 20px 60px rgba(0,0,0,0.3)',
  outline:       'none',
};

const header = {
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'space-between',
  padding:         '1.25rem 1.5rem 1rem',
  borderBottom:    '1px solid #e2e8f0',
};

const body = {
  padding: '1.25rem 1.5rem',
};

const footer = {
  display:         'flex',
  justifyContent:  'flex-end',
  gap:             '0.75rem',
  padding:         '1rem 1.5rem',
  borderTop:       '1px solid #e2e8f0',
};

const closeBtn = {
  background:  'none',
  border:      'none',
  cursor:      'pointer',
  fontSize:    '1.1rem',
  color:       '#718096',
  padding:     '4px 8px',
  borderRadius: 4,
  lineHeight:  1,
};

const infoGrid = {
  display:             'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap:                 '0.75rem',
  marginBottom:        '1rem',
};

function infoBox(bg, color) {
  return {
    background:   bg,
    border:       `1px solid ${color}33`,
    borderRadius: 8,
    padding:      '0.75rem 1rem',
    fontSize:     '0.875rem',
    color,
  };
}

const list = {
  margin:      '6px 0 0',
  paddingLeft: 18,
  lineHeight:  1.7,
};

const radioLabel = {
  display:      'flex',
  alignItems:   'flex-start',
  marginBottom: '0.5rem',
  cursor:       'pointer',
  fontSize:     '0.95rem',
  lineHeight:   1.5,
};

const textarea = {
  width:        '100%',
  borderRadius: 6,
  border:       '1px solid #cbd5e0',
  padding:      '0.6rem 0.75rem',
  fontSize:     '0.9rem',
  resize:       'vertical',
  boxSizing:    'border-box',
  fontFamily:   'inherit',
};

const btnPrimary = {
  background:   '#3182ce',
  color:        '#fff',
  border:       'none',
  borderRadius: 8,
  padding:      '0.6rem 1.25rem',
  cursor:       'pointer',
  fontSize:     '0.95rem',
  fontWeight:   600,
};

const btnSecondary = {
  background:   '#fff',
  color:        '#4a5568',
  border:       '1px solid #cbd5e0',
  borderRadius: 8,
  padding:      '0.6rem 1.25rem',
  cursor:       'pointer',
  fontSize:     '0.95rem',
};
