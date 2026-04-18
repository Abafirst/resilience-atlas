import React from 'react';

const RARITY_COLORS = {
  common:     { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569' },
  uncommon:   { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46' },
  rare:       { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af' },
  legendary:  { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
};

const s = {
  widget: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '20px 24px',
  },
  widgetTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1a1a2e',
    margin: '0 0 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  count: {
    display: 'inline-block',
    background: '#e2e8f0',
    color: '#475569',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 700,
    padding: '1px 8px',
  },
  empty: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    margin: 0,
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: (rarity) => {
    const c = RARITY_COLORS[rarity] || RARITY_COLORS.common;
    return {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
      borderRadius: 20,
      padding: '4px 12px',
      fontSize: 12,
      fontWeight: 600,
    };
  },
  badgeIcon: {
    fontSize: 16,
    lineHeight: 1,
  },
};

/**
 * Displays the user's earned badges.
 */
export default function BadgesWidget({ progress }) {
  const badges = progress?.badges ?? [];

  return (
    <div style={s.widget} role="region" aria-label={`Badges (${badges.length} earned)`}>
      <h3 style={s.widgetTitle}>
        Badges
        <span style={s.count}>{badges.length}</span>
      </h3>

      {badges.length === 0 ? (
        <p style={s.empty}>Complete your first practice to earn badges!</p>
      ) : (
        <ul style={s.list} aria-label="Earned badges">
          {badges
            .slice(-12)
            .reverse()
            .map((b, i) => (
              <li
                key={`${b.name}-${i}`}
                style={s.badge(b.rarity)}
                title={b.name}
              >
                <span style={s.badgeIcon} aria-hidden="true">
                  <img
                    src={b.icon && b.icon.startsWith('/icons/') ? b.icon : '/icons/badge.svg'}
                    alt=""
                    width={16}
                    height={16}
                    style={{ verticalAlign: 'middle' }}
                  />
                </span>
                <span>{b.name}</span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
