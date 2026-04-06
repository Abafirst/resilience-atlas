import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { REINFORCEMENT_MENU, DIMENSION_COLORS, REENTRY_PATHWAYS } from '../../data/adultGames.js';
import { getAuth0CachedToken } from '../../lib/apiFetch.js';

const s = {
  intro: { marginBottom: 24 },
  introTitle: { fontSize: 16, fontWeight: 700, color: '#e2e8f0', margin: '0 0 6px' },
  introSub: { fontSize: 13, color: '#718096', margin: 0, lineHeight: 1.5 },
  dimTabs: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 },
  dimTab: (active, dim) => ({
    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'all 0.15s',
    background: active ? (DIMENSION_COLORS[dim]?.bg || 'rgba(79,70,229,0.15)') : 'rgba(255,255,255,0.04)',
    color: active ? (DIMENSION_COLORS[dim]?.accent || '#818cf8') : '#718096',
    outline: active ? `1px solid ${DIMENSION_COLORS[dim]?.border || 'rgba(79,70,229,0.3)'}` : 'none',
  }),
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 },
  card: (done) => ({
    background: done ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${done ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 10, padding: '16px', opacity: done ? 0.65 : 1,
  }),
  cardType: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7aafc8', marginBottom: 6 },
  cardTitle: { fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: '0 0 4px' },
  duration: { fontSize: 11, color: '#6b7280', marginBottom: 8 },
  cardDesc: { fontSize: 12, color: '#94a3b8', lineHeight: 1.6, marginBottom: 10 },
  framework: { fontSize: 11, color: '#6b7280', marginBottom: 10 },
  btn: (done) => ({
    width: '100%', padding: '8px 12px', borderRadius: 6, border: 'none',
    background: done ? 'rgba(16,185,129,0.08)' : 'rgba(79,70,229,0.15)',
    color: done ? '#34d399' : '#818cf8', cursor: done ? 'default' : 'pointer',
    fontSize: 12, fontWeight: 600,
  }),
  reentryBox: {
    background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.15)',
    borderRadius: 12, padding: '20px', marginBottom: 24,
  },
  reentryTitle: { fontSize: 14, fontWeight: 700, color: '#fbbf24', margin: '0 0 6px' },
  reentryText: { fontSize: 13, color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.6 },
};

const DIMENSIONS = Object.keys(REINFORCEMENT_MENU);
const DIM_SHORT = {
  'Agentic-Generative': 'Agentic',
  'Relational-Connective': 'Relational',
  'Emotional-Adaptive': 'Emotional',
  'Spiritual-Reflective': 'Spiritual',
  'Somatic-Regulative': 'Somatic',
  'Cognitive-Narrative': 'Cognitive',
};

export default function ReinforcementMenu({ progress, showReentry = false }) {
  const { getAccessTokenSilently } = useAuth0();
  const [activeDim, setActiveDim]       = useState(DIMENSIONS[0]);
  const [localDone, setLocalDone]       = useState(new Set());
  const [reentryStep, setReentryStep]   = useState(showReentry ? 0 : null);
  const [submitting, setSubmitting]     = useState(false);

  const completedIds = new Set([
    ...(progress?.reinforcementHistory?.map(r => r.practiceId) || []),
    ...localDone,
  ]);

  // Determine if reentry is needed (streak gap > 3 days)
  const needsReentry = showReentry || (() => {
    if (!progress?.currentStreak?.lastPracticeDate) return false;
    const last     = new Date(progress.currentStreak.lastPracticeDate);
    const now      = new Date();
    const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
    return diffDays > 3;
  })();

  async function handlePracticeComplete(practice, dim) {
    if (completedIds.has(practice.id) || submitting) return;
    setSubmitting(true);
    try {
      let headers = { 'Content-Type': 'application/json' };
      try {
        const token = await getAccessTokenSilently();
        headers.Authorization = `Bearer ${token}`;
      } catch (authErr) {
        console.warn('Auth0 token unavailable, falling back to stored token:', authErr?.message);
        const stored = getAuth0CachedToken();
        if (stored) headers.Authorization = `Bearer ${stored}`;
      }
      await fetch('/api/gamification/practice', {
        method: 'POST',
        headers,
        body: JSON.stringify({ practiceId: practice.id, dimension: dim }),
      });
      setLocalDone(prev => new Set([...prev, practice.id]));
    } catch {
      setLocalDone(prev => new Set([...prev, practice.id]));
    } finally {
      setSubmitting(false);
    }
  }

  const practices = REINFORCEMENT_MENU[activeDim] || [];

  return (
    <div>
      {needsReentry && reentryStep !== null && (
        <div style={s.reentryBox}>
          <div style={s.reentryTitle}>🔄 Return-to-Practice</div>
          <p style={s.reentryText}>{REENTRY_PATHWAYS[reentryStep].message}</p>
          <p style={{ fontSize: 13, color: '#fbbf24', fontStyle: 'italic', marginBottom: 12 }}>
            {REENTRY_PATHWAYS[reentryStep].prompt}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            {reentryStep < REENTRY_PATHWAYS.length - 1 ? (
              <button
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'rgba(251,191,36,0.15)', color: '#fbbf24', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                onClick={() => setReentryStep(prevStep => prevStep + 1)}
              >
                Continue ({reentryStep + 1}/{REENTRY_PATHWAYS.length})
              </button>
            ) : (
              <button
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'rgba(16,185,129,0.15)', color: '#34d399', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                onClick={() => setReentryStep(null)}
              >
                Return to Practice ✓
              </button>
            )}
            <button
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#6b7280', cursor: 'pointer', fontSize: 12 }}
              onClick={() => setReentryStep(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div style={s.intro}>
        <h3 style={s.introTitle}>Reinforcement Practice Menu</h3>
        <p style={s.introSub}>
          Evidence-based micro-practices organized by dimension. Select any practice — practices are designed for 1–10 minute engagement. Completed practices are tracked in your reinforcement history.
        </p>
      </div>

      <div style={s.dimTabs} role="tablist" aria-label="Dimension selector">
        {DIMENSIONS.map(dim => (
          <button
            key={dim}
            style={s.dimTab(activeDim === dim, dim)}
            onClick={() => setActiveDim(dim)}
            role="tab"
            aria-selected={activeDim === dim}
            aria-label={dim}
          >
            {DIM_SHORT[dim] || dim}
          </button>
        ))}
      </div>

      <div style={s.grid}>
        {practices.map(practice => {
          const done = completedIds.has(practice.id);
          return (
            <div key={practice.id} style={s.card(done)}>
              <div style={s.cardType}>{practice.type.replace(/-/g, ' ')}</div>
              <div style={s.cardTitle}>{practice.title}</div>
              <div style={s.duration}>{practice.duration}</div>
              <p style={s.cardDesc}>{practice.description}</p>
              <div style={s.framework}>
                <span style={{ color: '#818cf8' }}>ABA:</span> {practice.abaPrinciple} &nbsp;·&nbsp;
                <span style={{ color: '#34d399' }}>ACT:</span> {practice.actPrinciple}
              </div>
              <button
                style={s.btn(done)}
                onClick={() => !done && handlePracticeComplete(practice, activeDim)}
                disabled={done || submitting}
                aria-label={done ? `${practice.title} completed` : `Mark ${practice.title} complete`}
              >
                {done ? '✓ Completed' : 'Mark Complete'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
