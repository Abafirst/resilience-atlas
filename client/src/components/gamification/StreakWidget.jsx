import React from 'react';

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
    marginBottom: 14,
    margin: '0 0 14px',
  },
  streakRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  icon: {
    fontSize: 40,
    lineHeight: 1,
  },
  count: {
    fontSize: 42,
    fontWeight: 800,
    color: '#1a1a2e',
    lineHeight: 1,
  },
  label: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  best: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748b',
  },
};

/**
 * Displays the user's current streak and longest streak.
 */
export default function StreakWidget({ progress }) {
  const days    = progress?.currentStreak?.days ?? 0;
  const longest = progress?.longestStreak ?? 0;
  const flameIcon = days > 0 ? '/icons/streaks.svg' : '/icons/goal.svg';

  return (
    <div style={s.widget} role="region" aria-label="Streak counter">
      <h3 style={s.widgetTitle}>Daily Streak</h3>
      <div style={s.streakRow}>
        <span style={s.icon} aria-hidden="true">
          <img src={flameIcon} alt="" width={24} height={24} style={{ verticalAlign: 'middle' }} />
        </span>
        <div>
          <div style={s.count}>{days}</div>
          <div style={s.label}>{days === 1 ? 'day' : 'days'} streak</div>
        </div>
      </div>
      <div style={s.best}>
        Best: <strong>{longest}</strong> days
      </div>
    </div>
  );
}
