/**
 * ConsentModal.jsx — Data sharing consent modal shown after quiz submission
 * when the user belongs to an organization.
 *
 * Allows users to independently opt-in to:
 *   1. Assessment scores sharing
 *   2. Curriculum progress sharing
 *
 * Props:
 *   orgName           {string}  Organization display name
 *   defaultScores     {boolean} Pre-fill from user's saved defaults
 *   defaultCurriculum {boolean} Pre-fill from user's saved defaults
 *   onSave            {function({ scores, scoresGoals, curriculum, curriculumGoals, remember })}
 *   onSkip            {function}
 */

import React, { useState } from 'react';

const overlayStyle = {
  position:        'fixed',
  inset:           0,
  background:      'rgba(0,0,0,0.55)',
  zIndex:          9999,
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'center',
  padding:         '1rem',
};

const modalStyle = {
  background:    '#fff',
  borderRadius:  '1rem',
  padding:       '2rem',
  maxWidth:      600,
  width:         '100%',
  maxHeight:     '90vh',
  overflowY:     'auto',
  boxShadow:     '0 20px 60px rgba(0,0,0,0.25)',
  position:      'relative',
};

const sectionStyle = {
  border:       '1px solid #e2e8f0',
  borderRadius: '.75rem',
  padding:      '1.25rem',
  marginBottom: '1rem',
  background:   '#f8fafc',
};

const checkboxRowStyle = {
  display:     'flex',
  alignItems:  'flex-start',
  gap:         '.75rem',
  marginBottom: '.75rem',
};

const checkboxStyle = {
  marginTop:   '2px',
  width:       '18px',
  height:      '18px',
  flexShrink:  0,
  cursor:      'pointer',
  accentColor: '#4f46e5',
};

const textareaStyle = {
  width:        '100%',
  minHeight:    68,
  padding:      '.5rem .75rem',
  border:       '1px solid #cbd5e1',
  borderRadius: '.5rem',
  fontSize:     '.85rem',
  resize:       'vertical',
  fontFamily:   'inherit',
  marginTop:    '.25rem',
};

const btnPrimaryStyle = {
  background:   '#4f46e5',
  color:        '#fff',
  border:       'none',
  borderRadius: '.5rem',
  padding:      '.65rem 1.4rem',
  fontWeight:   700,
  fontSize:     '.9rem',
  cursor:       'pointer',
};

const btnSecondaryStyle = {
  background:   'transparent',
  color:        '#64748b',
  border:       '1px solid #cbd5e1',
  borderRadius: '.5rem',
  padding:      '.65rem 1.4rem',
  fontWeight:   600,
  fontSize:     '.9rem',
  cursor:       'pointer',
};

export default function ConsentModal({
  orgName = 'your organization',
  defaultScores = false,
  defaultCurriculum = false,
  onSave,
  onSkip,
}) {
  const [scores,          setScores]          = useState(defaultScores);
  const [scoresGoals,     setScoresGoals]     = useState('');
  const [curriculum,      setCurriculum]      = useState(defaultCurriculum);
  const [curriculumGoals, setCurriculumGoals] = useState('');
  const [remember,        setRemember]        = useState(false);

  function handleSave() {
    if (typeof onSave === 'function') {
      onSave({ scores, scoresGoals, curriculum, curriculumGoals, remember });
    }
  }

  function handleSkip() {
    if (typeof onSkip === 'function') onSkip();
  }

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-labelledby="consent-modal-title">
      <div style={modalStyle}>
        <h2 id="consent-modal-title" style={{ marginTop: 0, fontSize: '1.25rem', color: '#1e293b' }}>
          Share Your Results with {orgName}?
        </h2>
        <p style={{ color: '#475569', fontSize: '.9rem', marginBottom: '1.25rem' }}>
          <strong>{orgName}</strong> uses the Resilience Atlas to support team wellbeing
          and professional development. Choose what to share — you can change these
          settings at any time in your privacy dashboard.
        </p>

        {/* ── Assessment Scores Section ─────────────────────────────────── */}
        <div style={sectionStyle}>
          <div style={checkboxRowStyle}>
            <input
              id="consent-scores"
              type="checkbox"
              style={checkboxStyle}
              checked={scores}
              onChange={(e) => setScores(e.target.checked)}
            />
            <label htmlFor="consent-scores" style={{ fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
              Share my assessment scores
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem 1.5rem', marginBottom: '.75rem', fontSize: '.83rem' }}>
            <div>
              <p style={{ margin: '0 0 .3rem', fontWeight: 600, color: '#374151' }}>What's included:</p>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#475569' }}>
                <li>Dimension scores (Cognitive, Relational, etc.)</li>
                <li>Overall resilience score</li>
                <li>Assessment completion dates</li>
              </ul>
            </div>
            <div>
              <p style={{ margin: '0 0 .3rem', fontWeight: 600, color: '#374151' }}>What stays private:</p>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#475569' }}>
                <li>Individual question responses</li>
                <li>Detailed narrative interpretations</li>
              </ul>
            </div>
          </div>

          {scores && (
            <div>
              <label htmlFor="scores-goals" style={{ fontSize: '.83rem', color: '#475569', fontWeight: 600 }}>
                Why I&rsquo;m sharing <span style={{ fontWeight: 400 }}>(optional — helps {orgName} support your goals)</span>
              </label>
              <textarea
                id="scores-goals"
                style={textareaStyle}
                placeholder="e.g., I want my manager to understand my professional development priorities…"
                value={scoresGoals}
                onChange={(e) => setScoresGoals(e.target.value)}
                maxLength={500}
              />
            </div>
          )}
        </div>

        {/* ── Curriculum Progress Section ───────────────────────────────── */}
        <div style={sectionStyle}>
          <div style={checkboxRowStyle}>
            <input
              id="consent-curriculum"
              type="checkbox"
              style={checkboxStyle}
              checked={curriculum}
              onChange={(e) => setCurriculum(e.target.checked)}
            />
            <label htmlFor="consent-curriculum" style={{ fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
              Share my curriculum progress
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem 1.5rem', marginBottom: '.75rem', fontSize: '.83rem' }}>
            <div>
              <p style={{ margin: '0 0 .3rem', fontWeight: 600, color: '#374151' }}>What's included:</p>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#475569' }}>
                <li>Modules and activities completed</li>
                <li>Skills practiced and developed</li>
                <li>Completion dates and streaks</li>
              </ul>
            </div>
            <div>
              <p style={{ margin: '0 0 .3rem', fontWeight: 600, color: '#374151' }}>What stays private:</p>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#475569' }}>
                <li>Detailed activity content</li>
                <li>Personal reflections and notes</li>
                <li>Quiz/assessment answers</li>
              </ul>
            </div>
          </div>

          {curriculum && (
            <div>
              <label htmlFor="curriculum-goals" style={{ fontSize: '.83rem', color: '#475569', fontWeight: 600 }}>
                Why I&rsquo;m sharing <span style={{ fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                id="curriculum-goals"
                style={textareaStyle}
                placeholder="e.g., I want to show my commitment to professional growth…"
                value={curriculumGoals}
                onChange={(e) => setCurriculumGoals(e.target.value)}
                maxLength={500}
              />
            </div>
          )}
        </div>

        {/* ── Remember preference ───────────────────────────────────────── */}
        <div style={{ ...checkboxRowStyle, marginBottom: '1.5rem' }}>
          <input
            id="consent-remember"
            type="checkbox"
            style={checkboxStyle}
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <label htmlFor="consent-remember" style={{ fontSize: '.85rem', color: '#475569', cursor: 'pointer' }}>
            Remember my preferences for future assessments
          </label>
        </div>

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button type="button" style={btnSecondaryStyle} onClick={handleSkip}>
            Keep All Private
          </button>
          <button type="button" style={btnPrimaryStyle} onClick={handleSave}>
            Save Preferences &amp; Continue
          </button>
        </div>

        <p style={{ marginTop: '1rem', fontSize: '.78rem', color: '#94a3b8', textAlign: 'center' }}>
          Your name is only visible to organization administrators. You can update these
          settings at any time in <a href="/settings/privacy" style={{ color: '#4f46e5' }}>Privacy Settings</a>.
        </p>
      </div>
    </div>
  );
}
