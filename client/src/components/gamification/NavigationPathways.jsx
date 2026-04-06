import React, { useState } from 'react';
import { NAVIGATION_PATHWAYS } from '../../data/gamificationContent.js';

// ── Dimension colour config (mirrors NavigationMilestones) ────────────────────
const DIM_CONFIG = {
  'Agentic-Generative':    { color: '#f97316', light: '#fff7ed', border: 'rgba(249,115,22,0.25)',  label: 'Agentic' },
  'Relational-Connective': { color: '#ec4899', light: '#fdf2f8', border: 'rgba(236,72,153,0.25)',  label: 'Relational' },
  'Spiritual-Reflective':  { color: '#8b5cf6', light: '#faf5ff', border: 'rgba(139,92,246,0.25)',  label: 'Spiritual' },
  'Emotional-Adaptive':    { color: '#a855f7', light: '#f5f3ff', border: 'rgba(168,85,247,0.25)',  label: 'Emotional' },
  'Somatic-Regulative':    { color: '#10b981', light: '#f0fdf4', border: 'rgba(16,185,129,0.25)',  label: 'Somatic' },
  'Cognitive-Narrative':   { color: '#3b82f6', light: '#eff6ff', border: 'rgba(59,130,246,0.25)',  label: 'Cognitive' },
};
const DEFAULT_DIM = { color: '#4f46e5', light: '#eef2ff', border: 'rgba(79,70,229,0.25)', label: 'Journey' };

const DIFF_STYLES = {
  easy:   { bg: '#dcfce7', text: '#15803d' },
  medium: { bg: '#fef9c3', text: '#a16207' },
  hard:   { bg: '#fee2e2', text: '#b91c1c' },
};

const s = {
  widget: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: '24px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: '#eef2ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#4f46e5',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 2,
  },
  widgetTitle: {
    fontSize: 17,
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 12,
  },
  pathwayCard: (active, cfg) => ({
    background: active ? cfg.light : '#f8fafc',
    border: `1px solid ${active ? cfg.border : '#e2e8f0'}`,
    borderTop: `3px solid ${active ? cfg.color : '#e2e8f0'}`,
    borderRadius: 12,
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  }),
  iconBox: (cfg, active) => ({
    width: 44,
    height: 44,
    borderRadius: 10,
    background: active ? `${cfg.color}22` : 'rgba(0,0,0,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }),
  pathwayTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#0f172a',
    lineHeight: 1.3,
    marginBottom: 2,
  },
  pathwayDesc: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 1.5,
    margin: 0,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
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
    };
  },
  rewardText: {
    fontSize: 11,
    fontWeight: 600,
    color: '#475569',
  },
  detail: {
    marginBottom: 20,
    padding: '16px',
    background: '#eff6ff',
    border: '1px solid rgba(21,101,192,0.2)',
    borderRadius: 12,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1565C0',
    marginBottom: 8,
  },
  detailDesc: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 10,
    lineHeight: 1.5,
  },
  startBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
    padding: '8px 20px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
  },
  closeBtn: {
    fontSize: 12,
    color: '#64748b',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    marginLeft: 8,
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
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerIcon} aria-hidden="true">
          <img src="/icons/compass.svg" alt="" width={26} height={26} />
        </div>
        <div>
          <div style={s.subtitle}>Atlas Navigator</div>
          <h3 style={s.widgetTitle}>Navigate Resilience Pathways</h3>
        </div>
      </div>

      {/* Active pathway progress banner */}
      {active && active.dimension && (
        <div style={s.detail} aria-live="polite">
          <div style={s.detailTitle}>
            Active Pathway: {active.dimension}
          </div>
          <div style={s.detailDesc}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              {Array.from({ length: active.totalDays || 3 }, (_, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, borderRadius: 6,
                    background: i < (active.completedDays || 0) ? '#1565C0' : '#e2e8f0',
                    color: i < (active.completedDays || 0) ? '#fff' : '#94a3b8',
                    fontSize: 13, fontWeight: 700,
                  }}
                >
                  {i < (active.completedDays || 0) ? '✓' : i + 1}
                </span>
              ))}
              <span style={{ fontSize: 12, color: '#1565C0', fontWeight: 700, marginLeft: 6 }}>
                {active.completedDays || 0}/{active.totalDays || 3} days complete
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{
            height: 6, borderRadius: 3, background: 'rgba(21,101,192,0.12)', overflow: 'hidden',
          }} role="progressbar"
            aria-valuenow={Math.round(((active.completedDays || 0) / (active.totalDays || 3)) * 100)}
            aria-valuemin={0} aria-valuemax={100}
          >
            <div style={{
              width: `${Math.round(((active.completedDays || 0) / (active.totalDays || 3)) * 100)}%`,
              height: '100%', background: 'linear-gradient(90deg, #1565C0, #5C8FD6)',
              borderRadius: 3, transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      )}

      <div style={s.grid}>
        {NAVIGATION_PATHWAYS.map(p => {
          const cfg = DIM_CONFIG[p.dimension] || DEFAULT_DIM;
          const isActive = active && active.dimension === p.dimension;
          const isSelected = selected === p.id;
          const highlighted = isActive || isSelected;
          return (
            <div key={p.id}>
              <div
                style={{
                  ...s.pathwayCard(highlighted, cfg),
                  boxShadow: highlighted ? `0 4px 16px ${cfg.border}` : '0 1px 4px rgba(0,0,0,0.05)',
                }}
                onClick={() => setSelected(isSelected ? null : p.id)}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onKeyDown={e => e.key === 'Enter' && setSelected(isSelected ? null : p.id)}
                aria-label={`${p.title} pathway`}
                onMouseEnter={e => {
                  if (!highlighted) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 6px 20px ${cfg.border}`;
                    e.currentTarget.style.borderTopColor = cfg.color;
                  }
                }}
                onMouseLeave={e => {
                  if (!highlighted) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)';
                    e.currentTarget.style.borderTopColor = '#e2e8f0';
                  }
                }}
              >
                {/* Icon box */}
                <div style={s.iconBox(cfg, highlighted)} aria-hidden="true">
                  <img src={p.icon} alt="" width={24} height={24}
                    style={{ filter: highlighted ? 'none' : 'grayscale(0.2) opacity(0.8)' }}
                  />
                </div>

                {/* Title + description */}
                <div>
                  <div style={s.pathwayTitle}>{p.title}</div>
                  <p style={s.pathwayDesc}>{p.description}</p>
                </div>

                {/* Badges row */}
                <div style={s.footer}>
                  <span style={s.diffBadge(p.difficulty)}>{p.difficulty}</span>
                  <span style={s.rewardText}>+{p.reward} pts</span>
                  {isActive && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px',
                      borderRadius: 10, background: cfg.light,
                      color: cfg.color, border: `1px solid ${cfg.border}`,
                    }}>
                      Active
                    </span>
                  )}
                </div>
              </div>

              {isSelected && (
                <div style={{ marginTop: 6, textAlign: 'right' }}>
                  <button
                    style={s.startBtn}
                    onClick={() => handleStart(p)}
                    disabled={starting}
                    aria-label={`Start ${p.title} pathway`}
                  >
                    {starting ? 'Starting…' : (
                      <>Start Pathway <img src="/icons/compass.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginLeft: 3, filter: 'brightness(0) invert(1)' }} /></>
                    )}
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
