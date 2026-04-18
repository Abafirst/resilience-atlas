import React, { useState } from 'react';
import { STARTER_BADGES, NAVIGATOR_BADGES } from '../../data/gamificationContent.js';

// ── Rarity tier config ────────────────────────────────────────────────────────
const RARITY_CONFIG = {
  common:    { label: 'Bronze',   bg: '#fef3c7', color: '#92400e', border: 'rgba(146,64,14,0.22)',  glow: 'rgba(180,120,0,0.32)',   gradient: 'linear-gradient(135deg,#d97706,#f59e0b)', icon: '/icons/games/star-locked.svg' },
  uncommon:  { label: 'Silver',   bg: '#f0f9ff', color: '#0369a1', border: 'rgba(3,105,161,0.25)',  glow: 'rgba(14,165,233,0.35)',  gradient: 'linear-gradient(135deg,#0369a1,#0ea5e9)', icon: '/icons/games/star-earned.svg' },
  rare:      { label: 'Gold',     bg: '#eff6ff', color: '#1d4ed8', border: 'rgba(29,78,216,0.25)',  glow: 'rgba(59,130,246,0.35)',  gradient: 'linear-gradient(135deg,#1d4ed8,#6366f1)', icon: '/icons/trophy.svg' },
  legendary: { label: 'Platinum', bg: '#fdf4ff', color: '#7e22ce', border: 'rgba(126,34,206,0.28)', glow: 'rgba(168,85,247,0.45)',  gradient: 'linear-gradient(135deg,#7e22ce,#a855f7)', icon: '/icons/kids-trophy.svg' },
};

/**
 * Individual badge card component.
 * Shows icon, name, rarity tier badge, and a hover tooltip with description.
 */
function BadgeCard({ badge }) {
  const [hovered, setHovered] = useState(false);
  const cfg = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.common;

  return (
    <div
      role="article"
      aria-label={`${badge.name}${badge.earned ? ' — earned' : ' — locked'}`}
      className="gam-badge-card"
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: badge.earned ? cfg.bg : '#f8fafc',
        border: `1px solid ${badge.earned ? cfg.border : '#e2e8f0'}`,
        borderRadius: 14,
        padding: '16px 12px 14px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        textAlign: 'center',
        cursor: 'default',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        opacity: badge.earned ? 1 : 0.55,
        boxShadow: hovered && badge.earned ? `0 8px 28px ${cfg.glow}` : (badge.earned ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'),
        transform: hovered && badge.earned ? 'translateY(-4px)' : 'none',
        filter: badge.earned ? 'none' : 'grayscale(0.4)',
      }}
    >
      {/* Rarity tier pill */}
      <div style={{
        position: 'absolute', top: 8, right: 8,
        fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
        padding: '2px 6px', borderRadius: 999,
        background: badge.earned ? `${cfg.color}18` : 'rgba(0,0,0,0.05)',
        color: badge.earned ? cfg.color : '#94a3b8',
      }}>
        {cfg.label}
      </div>

      {/* Icon container */}
      <div style={{
        width: 54, height: 54, borderRadius: 14,
        position: 'relative',
        background: badge.earned ? cfg.gradient : 'rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: badge.earned ? (hovered ? `0 0 20px ${cfg.glow}` : `0 4px 12px ${cfg.glow}`) : 'none',
        transition: 'box-shadow 0.2s ease',
      }}>
        {badge.earned && (
          <span style={{
            position: 'absolute', inset: -3, borderRadius: 17,
            border: '2px solid #34d399',
            boxShadow: '0 0 8px rgba(52,211,153,0.5)',
          }} aria-hidden="true" />
        )}
        {badge.earned
          ? <img src={badge.icon} alt="" aria-hidden="true" width={30} height={30}
              style={{ filter: 'brightness(0) invert(1)' }} />
          : <img src="/icons/lock.svg" alt="" aria-hidden="true" width={22} height={22} style={{ opacity: 0.35 }} />
        }
      </div>

      {/* Badge name */}
      <div style={{
        fontSize: 12, fontWeight: 700,
        color: badge.earned ? '#0f172a' : '#94a3b8',
        lineHeight: 1.3,
      }}>
        {badge.name}
      </div>

      {/* Earned indicator */}
      {badge.earned && (
        <div style={{
          fontSize: 10, fontWeight: 700,
          color: cfg.color, display: 'flex', alignItems: 'center', gap: 3,
        }}>
          <span style={{
            width: 13, height: 13, borderRadius: '50%',
            background: cfg.color, display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <img src="/icons/checkmark.svg" alt="" aria-hidden="true" width={7} height={7}
              style={{ filter: 'brightness(0) invert(1)' }} />
          </span>
          Earned
        </div>
      )}

      {/* Hover tooltip */}
      {hovered && (
        <div role="tooltip" style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
          transform: 'translateX(-50%)',
          background: '#1e293b', color: '#f1f5f9',
          fontSize: 11, lineHeight: 1.45, padding: '8px 12px',
          borderRadius: 8, zIndex: 20,
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          maxWidth: 200, width: 'max-content', textAlign: 'center',
          whiteSpace: 'normal',
          pointerEvents: 'none',
        }}>
          {badge.earned ? badge.description : badge.description}
          {/* Arrow */}
          <div style={{
            position: 'absolute', top: '100%', left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid #1e293b',
          }} />
        </div>
      )}
    </div>
  );
}

/** Horizontal section divider with label */
function SectionDivider({ label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      marginBottom: 14,
    }}>
      <span style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
      <span style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.07em', color: '#94a3b8', whiteSpace: 'nowrap',
      }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
    </div>
  );
}

/**
 * ResilienceBadgesWidget — displays earned and locked/preview resilience badges
 * in a gallery-style card grid.
 *
 * Props:
 *   earnedBadges   — array of earned badge objects from gamification progress
 *   showNavigator  — boolean: whether to show Navigator badge section
 */
export default function ResilienceBadgesWidget({ earnedBadges = [], showNavigator = true }) {
  const earnedNames = new Set((earnedBadges || []).map(b => b.name));

  const starterWithState   = STARTER_BADGES.map(b => ({ ...b, earned: earnedNames.has(b.name) }));
  const navigatorWithState = NAVIGATOR_BADGES.map(b => ({ ...b, earned: earnedNames.has(b.name) }));
  const totalEarned = earnedBadges.length;

  return (
    <div
      style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid #e2e8f0' }}
      role="region"
      aria-label={`Resilience Badges — ${totalEarned} earned`}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12,
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <img src="/icons/badge.svg" alt="" aria-hidden="true" width={24} height={24}
            style={{ filter: 'brightness(0) invert(1)' }} />
        </div>
        <div>
          <h3 style={{ margin: '0 0 3px', fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
            Resilience Badges
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
            <strong style={{ color: '#7c3aed' }}>{totalEarned}</strong> earned
            {' · '}Bronze, Silver, Gold &amp; Platinum tiers
          </p>
        </div>
      </div>

      {/* ── Starter badges ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: showNavigator ? 20 : 0 }}>
        <SectionDivider label="Starter Badges" />
        {starterWithState.length === 0 ? (
          <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
            Complete your first practice to earn badges!
          </p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
            gap: 10,
          }} aria-label="Starter badges">
            {starterWithState.map(b => <BadgeCard key={b.id} badge={b} />)}
          </div>
        )}
      </div>

      {/* ── Navigator badges ─────────────────────────────────────────────── */}
      {showNavigator && (
        <div>
          <SectionDivider label="Navigator Badges" />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
            gap: 10,
          }} aria-label="Navigator badges">
            {navigatorWithState.map(b => <BadgeCard key={b.id} badge={b} />)}
          </div>
        </div>
      )}
    </div>
  );
}
