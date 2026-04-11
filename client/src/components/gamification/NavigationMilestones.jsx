import React from 'react';
import { NAVIGATION_MILESTONES } from '../../data/gamificationContent.js';

// ── Dimension colour config ───────────────────────────────────────────────────
const DIM_CONFIG = {
  'Agentic-Generative':    { color: '#8b5cf6', light: '#f5f3ff', border: 'rgba(139,92,246,0.28)',  glow: 'rgba(139,92,246,0.35)', gradient: 'linear-gradient(135deg,#8b5cf6,#6366f1)',  label: 'Agentic' },
  'Relational-Connective': { color: '#14b8a6', light: '#f0fdfa', border: 'rgba(20,184,166,0.28)',  glow: 'rgba(20,184,166,0.35)', gradient: 'linear-gradient(135deg,#14b8a6,#22c55e)',  label: 'Relational' },
  'Spiritual-Reflective':  { color: '#f59e0b', light: '#fffbeb', border: 'rgba(245,158,11,0.28)',  glow: 'rgba(245,158,11,0.35)', gradient: 'linear-gradient(135deg,#f59e0b,#f97316)',  label: 'Spiritual' },
  'Emotional-Adaptive':    { color: '#ec4899', light: '#fdf2f8', border: 'rgba(236,72,153,0.28)',  glow: 'rgba(236,72,153,0.35)', gradient: 'linear-gradient(135deg,#ec4899,#f43f5e)',  label: 'Emotional' },
  'Somatic-Regulative':    { color: '#06b6d4', light: '#ecfeff', border: 'rgba(6,182,212,0.28)',   glow: 'rgba(6,182,212,0.35)',  gradient: 'linear-gradient(135deg,#06b6d4,#14b8a6)',  label: 'Somatic' },
  'Cognitive-Narrative':   { color: '#4f46e5', light: '#eef2ff', border: 'rgba(79,70,229,0.28)',   glow: 'rgba(79,70,229,0.35)',  gradient: 'linear-gradient(135deg,#4f46e5,#3b82f6)',  label: 'Cognitive' },
};
const DEFAULT_CONFIG = { color: '#1565C0', light: '#eff6ff', border: 'rgba(21,101,192,0.25)', glow: 'rgba(21,101,192,0.35)', gradient: 'linear-gradient(135deg,#1565C0,#0097A7)', label: 'Journey' };

// ── SVG circular progress ring ────────────────────────────────────────────────
function CircleProgress({ pct = 0, size = 64, strokeWidth = 5, color = '#1565C0', trackColor = 'rgba(0,0,0,0.07)' }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(100, Math.max(0, pct)) / 100);
  return (
    <svg width={size} height={size} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  );
}

function getMotivation(pct) {
  if (pct === 0)   return 'Your resilience journey awaits!';
  if (pct < 30)   return "You've taken your first steps!";
  if (pct < 60)   return "You're making real progress!";
  if (pct < 90)   return 'Almost there — keep going!';
  return '🎉 Journey complete!';
}

/**
 * Returns the set of dimensions in which the user has completed at least one
 * practice (micro-quest, reinforcement practice, or skill pathway level).
 */
function getPracticeDimensions(progress) {
  if (!progress || typeof progress !== 'object') return new Set();
  const dims = new Set();
  (Array.isArray(progress.microQuests) ? progress.microQuests : [])
    .forEach(q => { if (q && q.dimension) dims.add(q.dimension); });
  (Array.isArray(progress.reinforcementHistory) ? progress.reinforcementHistory : [])
    .forEach(r => { if (r && r.dimension) dims.add(r.dimension); });
  (Array.isArray(progress.skillPathways) ? progress.skillPathways : [])
    .forEach(p => { if (p && p.dimension) dims.add(p.dimension); });
  return dims;
}

/**
 * Returns true when the user has completed at least one practice of any kind.
 */
function hasAnyCompletedPractice(progress) {
  if (!progress || typeof progress !== 'object') return false;
  return (
    (Array.isArray(progress.microQuests) && progress.microQuests.length > 0) ||
    (Array.isArray(progress.reinforcementHistory) && progress.reinforcementHistory.length > 0) ||
    (Array.isArray(progress.skillPathways) && progress.skillPathways.length > 0)
  );
}

/**
 * NavigationMilestones — Atlas Starter feature.
 * Displays a card-based grid of achievement milestones with circular progress
 * rings, dimension-specific colours, and motivational copy.
 *
 * Props:
 *   progress — GamificationProgress object (from useGamification hook), optional
 */
export default function NavigationMilestones({ progress }) {
  const practiceDims = getPracticeDimensions(progress);

  const completedIds = new Set();
  if (hasAnyCompletedPractice(progress)) completedIds.add('first-practice');
  NAVIGATION_MILESTONES.forEach(m => {
    if (m.dimension && practiceDims.has(m.dimension)) {
      completedIds.add(m.id);
    }
  });

  const completed = completedIds.size;
  const total = NAVIGATION_MILESTONES.length;
  const pct = Math.round((completed / total) * 100);

  const firstStep = NAVIGATION_MILESTONES.find(m => m.id === 'first-practice');
  const dimensionMilestones = NAVIGATION_MILESTONES.filter(m => m.dimension);

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid #e2e8f0' }}
      role="region" aria-label="Navigation Milestones"
    >
      {/* ── Summary header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <CircleProgress pct={pct} size={76} strokeWidth={6} color="#1565C0" trackColor="rgba(21,101,192,0.1)" />
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            fontSize: 14, fontWeight: 800, color: '#1565C0', lineHeight: 1,
          }}>
            {pct}%
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
            Navigation Milestones
          </h3>
          <p style={{ margin: '0 0 2px', fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>
            <strong style={{ color: '#1565C0' }}>{completed}/{total}</strong> complete
            {' · '}{getMotivation(pct)}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', lineHeight: 1.4, fontStyle: 'italic' }}>
            Milestones are earned by completing practices (micro-quests, pathways, or reinforcement practices).
          </p>
        </div>
      </div>

      {/* ── First Step banner ───────────────────────────────────────────── */}
      {firstStep && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', borderRadius: 10, marginBottom: 16,
          background: completedIds.has('first-practice')
            ? 'linear-gradient(135deg, #eff6ff, #dbeafe)'
            : '#f8fafc',
          border: `1px solid ${completedIds.has('first-practice') ? 'rgba(21,101,192,0.2)' : '#e2e8f0'}`,
          opacity: completedIds.has('first-practice') ? 1 : 0.65,
        }}>
          <img src={firstStep.icon} alt="" width={28} height={28} aria-hidden="true" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1565C0' }}>{firstStep.title}</div>
            <div style={{ fontSize: 11, color: '#475569' }}>{firstStep.description}</div>
          </div>
          {completedIds.has('first-practice') ? (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px',
              borderRadius: 999, background: '#dcfce7', color: '#15803d', whiteSpace: 'nowrap',
            }}>✓ Complete</span>
          ) : (
            <span style={{
              fontSize: 11, color: '#94a3b8',
              display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
            }}>
              <img src="/icons/lock.svg" alt="" aria-hidden="true" width={10} height={10} style={{ opacity: 0.35 }} />
              Complete a micro-quest
            </span>
          )}
        </div>
      )}

      {/* ── Dimension achievement cards ─────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
        gap: 12,
      }} aria-label="Resilience dimension milestones">
        {dimensionMilestones.map(m => {
          const cfg = DIM_CONFIG[m.dimension] || DEFAULT_CONFIG;
          const done = completedIds.has(m.id);
          const ringPct = done ? 100 : 0;

          return (
            <div
              key={m.id}
              aria-label={`${m.title}${done ? ' — completed' : ' — incomplete'}`}
              className="gam-milestone-card"
              style={{
                background: done ? cfg.light : '#f8fafc',
                border: `1px solid ${done ? cfg.border : '#e2e8f0'}`,
                borderRadius: 12,
                padding: '16px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                opacity: done ? 1 : 0.65,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 8px 24px ${cfg.glow}`;
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.opacity = done ? '1' : '0.65';
              }}
            >
              {/* Icon + progress ring row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 11,
                  background: done ? cfg.gradient : 'rgba(0,0,0,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                  boxShadow: done ? `0 4px 14px ${cfg.glow}` : 'none',
                  transition: 'box-shadow 0.2s ease',
                }}>
                  {done && (
                    <span style={{
                      position: 'absolute', inset: -3, borderRadius: 14,
                      border: '2px solid #34d399',
                      boxShadow: '0 0 8px rgba(52,211,153,0.5)',
                    }} aria-hidden="true" />
                  )}
                  <img
                    src={m.icon} alt="" width={22} height={22} aria-hidden="true"
                    style={{
                      filter: done ? 'brightness(0) invert(1)' : 'grayscale(1) opacity(0.4)',
                    }}
                  />
                </div>

                {/* Circular mini progress */}
                <div style={{ position: 'relative' }}>
                  <CircleProgress
                    pct={ringPct} size={42} strokeWidth={4}
                    color={done ? cfg.color : '#cbd5e1'}
                    trackColor="rgba(0,0,0,0.06)"
                  />
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)',
                    fontSize: 9, fontWeight: 800, color: done ? cfg.color : '#94a3b8',
                  }}>
                    {done ? '✓' : '—'}
                  </div>
                </div>
              </div>

              {/* Text */}
              <div>
                <div style={{
                  fontSize: 12, fontWeight: 700,
                  color: done ? '#0f172a' : '#94a3b8',
                  marginBottom: 3, lineHeight: 1.3,
                }}>
                  {m.title}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>
                  {m.description}
                </div>
              </div>

              {/* Status badge */}
              {done ? (
                <div style={{
                  fontSize: 10, fontWeight: 700, color: cfg.color,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <span style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: cfg.color, display: 'inline-flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <img src="/icons/checkmark.svg" alt="" aria-hidden="true" width={8} height={8}
                      style={{ filter: 'brightness(0) invert(1)' }} />
                  </span>
                  {cfg.label}
                </div>
              ) : (
                <div style={{
                  fontSize: 10, color: '#94a3b8',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <img src="/icons/lock.svg" alt="" aria-hidden="true" width={10} height={10} style={{ opacity: 0.35 }} />
                  Complete a micro-quest
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Bottom progress bar ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginTop: 20, paddingTop: 16,
        borderTop: '1px solid #e2e8f0',
      }} aria-label={`${completed} of ${total} milestones completed`}>
        <div style={{
          flex: 1, height: 6, borderRadius: 3,
          background: 'rgba(21,101,192,0.1)', overflow: 'hidden',
        }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: 'linear-gradient(90deg, #1565C0, #5C8FD6)',
            borderRadius: 3, transition: 'width 0.6s ease',
          }} />
        </div>
        <span style={{ fontSize: 12, color: '#1565C0', fontWeight: 700, whiteSpace: 'nowrap' }}>
          {completed}/{total} Complete
        </span>
      </div>
    </div>
  );
}
