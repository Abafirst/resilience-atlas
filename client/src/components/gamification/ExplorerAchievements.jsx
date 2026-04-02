import React from 'react';
import { EXPLORER_ACHIEVEMENTS } from '../../data/gamificationContent.js';

const RARITY_STYLES = {
  rare:      { bg: 'rgba(14,165,233,0.12)',  border: 'rgba(14,165,233,0.3)',  text: '#93c5fd', badge: '#38bdf8' },
  legendary: { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.35)', text: '#fcd34d', badge: '#f59e0b' },
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
    margin: '0 0 4px',
  },
  tagline: {
    fontSize: 12,
    color: '#4a5568',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 10,
  },
  card: (rarity, earned) => {
    const r = RARITY_STYLES[rarity] || RARITY_STYLES.rare;
    return {
      background: earned ? r.bg : 'rgba(255,255,255,0.02)',
      border: `1px solid ${earned ? r.border : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 10,
      padding: '14px',
      opacity: earned ? 1 : 0.5,
      transition: 'all 0.2s',
    };
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  iconBox: (rarity, earned) => {
    const r = RARITY_STYLES[rarity] || RARITY_STYLES.rare;
    return {
      fontSize: 28,
      lineHeight: 1,
      filter: earned ? 'none' : 'grayscale(1)',
    };
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  rarityTag: (rarity) => {
    const r = RARITY_STYLES[rarity] || RARITY_STYLES.rare;
    return {
      display: 'inline-block',
      fontSize: 9,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: r.badge,
      marginBottom: 3,
    };
  },
  cardTitle: (earned) => ({
    fontSize: 13,
    fontWeight: 700,
    color: earned ? '#e2e8f0' : '#4a5568',
    marginBottom: 4,
    lineHeight: 1.3,
  }),
  cardDesc: {
    fontSize: 11,
    color: '#718096',
    lineHeight: 1.4,
    marginBottom: 6,
  },
  requirement: {
    fontSize: 10,
    color: '#4a5568',
    fontStyle: 'italic',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: 6,
    marginTop: 4,
  },
  earnedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: 'rgba(16,185,129,0.15)',
    border: '1px solid rgba(16,185,129,0.3)',
    color: '#6ee7b7',
    borderRadius: 10,
    padding: '2px 8px',
    fontSize: 10,
    fontWeight: 700,
    marginTop: 4,
  },
};

/**
 * ExplorerAchievements — Atlas Navigator exclusive feature.
 * Shows rare/legendary achievements only available to Navigator-tier users.
 *
 * Props:
 *   earnedIds — Set<string> of earned achievement IDs (from gamification progress)
 */
export default function ExplorerAchievements({ earnedIds = new Set() }) {
  return (
    <div style={s.widget} role="region" aria-label="Explorer Achievements">
      <div style={s.subtitle}>Atlas Navigator — Exclusive</div>
      <h3 style={s.widgetTitle}>🌟 Explorer Achievements</h3>
      <p style={s.tagline}>Rare &amp; legendary achievements for dedicated resilience navigators</p>

      <div style={s.grid}>
        {EXPLORER_ACHIEVEMENTS.map(a => {
          const earned = earnedIds instanceof Set ? earnedIds.has(a.id) : false;
          return (
            <div
              key={a.id}
              style={s.card(a.rarity, earned)}
              aria-label={`${a.title}${earned ? ' (achieved)' : ' (locked)'}`}
            >
              <div style={s.cardHeader}>
                <span style={s.iconBox(a.rarity, earned)} aria-hidden="true">{a.icon}</span>
                <div style={s.cardInfo}>
                  <span style={s.rarityTag(a.rarity)}>{a.rarity}</span>
                  <div style={s.cardTitle(earned)}>{a.title}</div>
                </div>
              </div>
              <p style={s.cardDesc}>{a.description}</p>
              <div style={s.requirement}>
                Requires: {a.requirement}
              </div>
              {earned && (
                <div style={s.earnedBadge}>✓ Achieved</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
