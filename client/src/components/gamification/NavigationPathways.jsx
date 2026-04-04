import React, { useState } from 'react';
import { NAVIGATION_PATHWAYS } from '../../data/gamificationContent.js';

const DIFF_STYLES = {
  easy:   { bg: 'rgba(16,185,129,0.15)',  text: '#6ee7b7' },
  medium: { bg: 'rgba(245,158,11,0.15)',  text: '#fcd34d' },
  hard:   { bg: 'rgba(239,68,68,0.15)',   text: '#fca5a5' },
};

const s = {
  widget: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: '20px 24px',
  },
  subtitle: {
    color: '#7aafc8',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 6,
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#e8f0fe',
    margin: '0 0 16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 10,
  },
  pathwayCard: (active) => ({
    background: active
      ? 'rgba(14,165,233,0.12)'
      : 'rgba(255,255,255,0.03)',
    border: `1px solid ${active ? 'rgba(14,165,233,0.3)' : 'rgba(255,255,255,0.07)'}`,
    borderRadius: 10,
    padding: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }),
  pathwayHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  pathwayIcon: {
    fontSize: 20,
    lineHeight: 1,
  },
  pathwayTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#e2e8f0',
    flex: 1,
    minWidth: 0,
  },
  pathwayDesc: {
    fontSize: 11,
    color: '#718096',
    lineHeight: 1.4,
    marginBottom: 8,
  },
  diffBadge: (difficulty) => {
    const d = DIFF_STYLES[difficulty] || DIFF_STYLES.medium;
    return {
      display: 'inline-block',
      background: d.bg,
      color: d.text,
      fontSize: 10,
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: 10,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      marginRight: 6,
    };
  },
  rewardText: {
    fontSize: 11,
    color: '#7aafc8',
  },
  detail: {
    marginTop: 14,
    padding: '14px',
    background: 'rgba(14,165,233,0.08)',
    border: '1px solid rgba(14,165,233,0.2)',
    borderRadius: 10,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#93c5fd',
    marginBottom: 6,
  },
  detailDesc: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 12,
    lineHeight: 1.5,
  },
  startBtn: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
    padding: '8px 20px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(14,165,233,0.3)',
  },
  closeBtn: {
    fontSize: 12,
    color: '#64748b',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    marginLeft: 10,
  },
};

/**
 * NavigationPathways — Atlas Navigator feature.
 * Shows interactive resilience challenges/quests.
 *
 * Props:
 *   progress      — gamification progress object (from useGamification)
 *   onSetChallenge — function(dimension, difficulty) → Promise
 */
export default function NavigationPathways({ progress, onSetChallenge }) {
  const [selected, setSelected] = useState(null);
  const [starting, setStarting] = useState(false);

  const active = progress?.currentChallenge;

  const handleStart = async (pathway) => {
    if (!onSetChallenge) return;
    setStarting(true);
    try {
      await onSetChallenge(pathway.dimension, pathway.difficulty);
      setSelected(null);
    } catch (_) {
      // handled by parent
    } finally {
      setStarting(false);
    }
  };

  return (
    <div style={s.widget} role="region" aria-label="Navigation Pathways">
      <div style={s.subtitle}>Atlas Navigator</div>
      <h3 style={s.widgetTitle}>🧭 Navigate Resilience Pathways</h3>

      {active && active.dimension && (
        <div style={s.detail} aria-live="polite">
          <div style={s.detailTitle}>
            Active Pathway: {active.dimension}
          </div>
          <div style={s.detailDesc}>
            {Array.from({ length: active.totalDays || 3 }, (_, i) => (
              <span key={i} style={{ fontSize: 18, marginRight: 4 }} aria-hidden="true">
                {i < (active.completedDays || 0) ? '✅' : '⬜'}
              </span>
            ))}
            <span style={{ fontSize: 12, color: '#7aafc8', marginLeft: 6 }}>
              {active.completedDays || 0}/{active.totalDays || 3} days
            </span>
          </div>
        </div>
      )}

      <div style={s.grid}>
        {NAVIGATION_PATHWAYS.map(p => {
          const isActive = active && active.dimension === p.dimension;
          const isSelected = selected === p.id;
          return (
            <div key={p.id}>
              <div
                style={s.pathwayCard(isActive || isSelected)}
                onClick={() => setSelected(isSelected ? null : p.id)}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onKeyDown={e => e.key === 'Enter' && setSelected(isSelected ? null : p.id)}
                aria-label={`${p.title} pathway`}
              >
                <div style={s.pathwayHeader}>
                  <span style={s.pathwayIcon} aria-hidden="true">
                    <img src={p.icon} alt="" width={18} height={18} style={{ verticalAlign: 'middle' }} />
                  </span>
                  <span style={s.pathwayTitle}>{p.title}</span>
                </div>
                <p style={s.pathwayDesc}>{p.description}</p>
                <span style={s.diffBadge(p.difficulty)}>{p.difficulty}</span>
                <span style={s.rewardText}>+{p.reward} pts</span>
              </div>

              {isSelected && (
                <div style={{ marginTop: 4, textAlign: 'right' }}>
                  <button
                    style={s.startBtn}
                    onClick={() => handleStart(p)}
                    disabled={starting}
                    aria-label={`Start ${p.title} pathway`}
                  >
                    {starting ? 'Starting…' : 'Start Pathway 🧭'}
                  </button>
                  <button style={s.closeBtn} onClick={() => setSelected(null)} aria-label="Cancel">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
