import React, { useState } from 'react';
import { EXPLORER_ACHIEVEMENTS } from '../../data/gamificationContent.js';

// ── Rarity config ─────────────────────────────────────────────────────────────
const RARITY_CONFIG = {
  rare:      { color: '#3b82f6', light: '#eff6ff', border: 'rgba(59,130,246,0.25)',  glow: 'rgba(59,130,246,0.3)',  label: 'Gold',     ring: '#3b82f6' },
  legendary: { color: '#f59e0b', light: '#fffbeb', border: 'rgba(245,158,11,0.3)',   glow: 'rgba(245,158,11,0.35)', label: 'Platinum', ring: '#f59e0b' },
};
const DEFAULT_RARITY = RARITY_CONFIG.rare;

// ── SVG circular progress (full or empty) ─────────────────────────────────────
function CircleProgress({ pct = 0, size = 52, strokeWidth = 4, color, trackColor = 'rgba(0,0,0,0.07)' }) {
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

/**
 * ExplorerAchievements — Atlas Navigator exclusive feature.
 * Displays rare/legendary achievements in a visually rich card grid.
 *
 * Props:
 *   earnedIds — Set<string> of earned achievement IDs (from gamification progress)
 */
export default function ExplorerAchievements({ earnedIds = new Set() }) {
  const [hoveredId, setHoveredId] = useState(null);
  const earnedSet = earnedIds instanceof Set ? earnedIds : new Set();
  const earnedCount = EXPLORER_ACHIEVEMENTS.filter(a => earnedSet.has(a.id)).length;

  return (
    <div
      style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid #e2e8f0' }}
      role="region"
      aria-label="Explorer Achievements"
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12,
          background: 'linear-gradient(135deg, #d97706, #f59e0b)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <img src="/icons/star.svg" alt="" aria-hidden="true" width={24} height={24}
            style={{ filter: 'brightness(0) invert(1)' }} />
        </div>
        <div>
          <h3 style={{ margin: '0 0 3px', fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
            Explorer Achievements
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
            Rare &amp; legendary milestones for dedicated navigators ·{' '}
            <strong style={{ color: '#d97706' }}>{earnedCount}/{EXPLORER_ACHIEVEMENTS.length}</strong> achieved
          </p>
        </div>
      </div>

      <p style={{ margin: '0 0 20px', fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>
        Complete the most challenging resilience milestones to earn exclusive achievements.
      </p>

      {/* ── Achievement cards grid ──────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 14,
      }}>
        {EXPLORER_ACHIEVEMENTS.map(a => {
          const earned = earnedSet.has(a.id);
          const cfg = RARITY_CONFIG[a.rarity] || DEFAULT_RARITY;
          const isHovered = hoveredId === a.id;

          return (
            <div
              key={a.id}
              aria-label={`${a.title}${earned ? ' — achieved' : ' — locked'}`}
              onMouseEnter={() => setHoveredId(a.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                background: earned ? cfg.light : '#f8fafc',
                border: `1px solid ${earned ? cfg.border : '#e2e8f0'}`,
                borderRadius: 14,
                padding: '20px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                opacity: earned ? 1 : 0.6,
                transition: 'all 0.22s ease',
                transform: isHovered ? 'translateY(-4px)' : 'none',
                boxShadow: isHovered ? `0 10px 28px ${earned ? cfg.glow : 'rgba(0,0,0,0.08)'}` : 'none',
                cursor: 'default',
              }}
            >
              {/* Icon + rarity row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                {/* Icon with progress ring */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <CircleProgress
                    pct={earned ? 100 : 0}
                    size={60} strokeWidth={4}
                    color={earned ? cfg.ring : '#cbd5e1'}
                    trackColor={earned ? `${cfg.ring}1a` : 'rgba(0,0,0,0.06)'}
                  />
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)',
                  }}>
                    <img
                      src={a.icon} alt="" aria-hidden="true" width={26} height={26}
                      style={{ filter: earned ? 'none' : 'grayscale(1) opacity(0.4)', display: 'block' }}
                    />
                  </div>
                </div>

                {/* Rarity pill */}
                <span style={{
                  fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                  padding: '3px 8px', borderRadius: 999,
                  background: earned ? `${cfg.color}18` : 'rgba(0,0,0,0.05)',
                  color: earned ? cfg.color : '#94a3b8',
                  whiteSpace: 'nowrap',
                }}>
                  {cfg.label}
                </span>
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 14, fontWeight: 800,
                  color: earned ? '#0f172a' : '#94a3b8',
                  marginBottom: 6, lineHeight: 1.3,
                }}>
                  {a.title}
                </div>
                <p style={{
                  fontSize: 12, color: '#64748b', lineHeight: 1.5, margin: '0 0 8px',
                }}>
                  {a.description}
                </p>
                <div style={{
                  fontSize: 11, color: earned ? cfg.color : '#94a3b8',
                  display: 'flex', alignItems: 'flex-start', gap: 5,
                  paddingTop: 8, borderTop: '1px solid #e2e8f0',
                }}>
                  <img
                    src={earned ? '/icons/checkmark.svg' : '/icons/lock.svg'}
                    alt="" aria-hidden="true" width={11} height={11}
                    style={{ marginTop: 1, flexShrink: 0, filter: earned ? `none` : 'opacity(0.35)' }}
                  />
                  <span>{earned ? 'Achievement unlocked!' : `Requires: ${a.requirement}`}</span>
                </div>
              </div>

              {/* Earned badge */}
              {earned && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: '#dcfce7', border: '1px solid rgba(21,128,61,0.2)',
                  color: '#15803d', borderRadius: 999,
                  padding: '4px 10px', fontSize: 11, fontWeight: 700,
                  alignSelf: 'flex-start',
                }}>
                  <img src="/icons/checkmark.svg" alt="" aria-hidden="true" width={10} height={10}
                    style={{ filter: 'none' }} />
                  Achieved
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
