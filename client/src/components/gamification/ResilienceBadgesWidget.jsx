import React from 'react';
import { ALL_BADGES, STARTER_BADGES, NAVIGATOR_BADGES } from '../../data/gamificationContent.js';

const RARITY_STYLES = {
  common:    { bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.3)', text: '#94a3b8', glow: 'none' },
  uncommon:  { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  text: '#6ee7b7', glow: '0 0 8px rgba(16,185,129,0.25)' },
  rare:      { bg: 'rgba(14,165,233,0.12)',  border: 'rgba(14,165,233,0.3)',  text: '#93c5fd', glow: '0 0 8px rgba(14,165,233,0.3)' },
  legendary: { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.35)', text: '#fcd34d', glow: '0 0 12px rgba(245,158,11,0.35)' },
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
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  count: {
    display: 'inline-block',
    background: 'rgba(14,165,233,0.2)',
    color: '#38bdf8',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 8px',
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#4a5568',
    marginBottom: 10,
  },
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: (rarity, earned) => {
    const r = RARITY_STYLES[rarity] || RARITY_STYLES.common;
    return {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      background: earned ? r.bg : 'rgba(255,255,255,0.03)',
      border: `1px solid ${earned ? r.border : 'rgba(255,255,255,0.06)'}`,
      color: earned ? r.text : '#4a5568',
      borderRadius: 20,
      padding: '5px 12px',
      fontSize: 12,
      fontWeight: 600,
      boxShadow: earned ? r.glow : 'none',
      transition: 'all 0.2s',
      opacity: earned ? 1 : 0.5,
    };
  },
  badgeIcon: {
    fontSize: 15,
    lineHeight: 1,
  },
  empty: {
    fontSize: 13,
    color: '#4a5568',
    fontStyle: 'italic',
  },
};

/**
 * ResilienceBadgesWidget — displays earned and locked/preview resilience badges.
 * Shows Starter badges (always visible), plus Navigator badges if tier allows.
 *
 * Props:
 *   earnedBadges   — array of earned badge objects from gamification progress
 *   showNavigator  — boolean: whether to show Navigator badge section (even locked)
 */
export default function ResilienceBadgesWidget({ earnedBadges = [], showNavigator = true }) {
  const earnedNames = new Set((earnedBadges || []).map(b => b.name));

  // Map definition badges to earned state
  const starterWithState = STARTER_BADGES.map(b => ({
    ...b,
    earned: earnedNames.has(b.name),
  }));
  const navigatorWithState = NAVIGATOR_BADGES.map(b => ({
    ...b,
    earned: earnedNames.has(b.name),
  }));

  const totalEarned = earnedBadges.length;

  return (
    <div style={s.widget} role="region" aria-label={`Resilience Badges (${totalEarned} earned)`}>
      <div style={s.subtitle}>Atlas Starter &amp; Navigator</div>
      <h3 style={s.widgetTitle}>
        🏅 Resilience Badges
        <span style={s.count}>{totalEarned} earned</span>
      </h3>

      <div style={s.section}>
        <div style={s.sectionLabel}>Starter Badges</div>
        {starterWithState.length === 0 ? (
          <p style={s.empty}>Complete your first practice to earn badges! 🌱</p>
        ) : (
          <div style={s.grid} aria-label="Starter badges">
            {starterWithState.map(b => (
              <div
                key={b.id}
                style={s.badge(b.rarity, b.earned)}
                title={b.earned ? b.description : `${b.description} — Not yet earned`}
                aria-label={`${b.name}${b.earned ? ' (earned)' : ' (locked)'}`}
              >
                <span style={s.badgeIcon} aria-hidden="true">
                  {b.earned ? b.icon : '🔒'}
                </span>
                <span>{b.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showNavigator && (
        <div style={s.section}>
          <div style={s.sectionLabel}>Navigator Badges</div>
          <div style={s.grid} aria-label="Navigator badges">
            {navigatorWithState.map(b => (
              <div
                key={b.id}
                style={s.badge(b.rarity, b.earned)}
                title={b.earned ? b.description : `${b.description} — Requires Atlas Navigator`}
                aria-label={`${b.name}${b.earned ? ' (earned)' : ' (locked)'}`}
              >
                <span style={s.badgeIcon} aria-hidden="true">
                  {b.earned ? b.icon : '🔒'}
                </span>
                <span>{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
