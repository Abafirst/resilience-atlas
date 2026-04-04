import React from 'react';

const MILESTONES = [25, 50, 100, 200, 500, 1000];

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
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  icon: {
    fontSize: 28,
  },
  total: {
    fontSize: 32,
    fontWeight: 800,
    color: '#1a1a2e',
  },
  barWrap: {
    background: '#e2e8f0',
    borderRadius: 8,
    height: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  bar: (pct) => ({
    height: '100%',
    width: `${pct}%`,
    background: 'linear-gradient(90deg, #7aafc8, #2563eb)',
    borderRadius: 8,
    transition: 'width 0.6s ease',
  }),
  goal: {
    fontSize: 12,
    color: '#64748b',
  },
};

/**
 * Displays total points and a progress bar toward the next milestone reward.
 */
export default function PointsWidget({ progress }) {
  const points   = progress?.totalPoints ?? 0;
  const nextGoal = MILESTONES.find(m => m > points) || points + 100;
  const pct      = Math.min(Math.round((points / nextGoal) * 100), 100);

  return (
    <div style={s.widget} role="region" aria-label="Points total">
      <h3 style={s.widgetTitle}>Points</h3>
      <div style={s.header}>
        <span style={s.icon} aria-hidden="true">
          <img src="/icons/star.svg" alt="" width={20} height={20} style={{ verticalAlign: 'middle' }} />
        </span>
        <span style={s.total}>{points} pts</span>
      </div>
      <div
        style={s.barWrap}
        aria-label={`Progress to next reward: ${pct}%`}
      >
        <div
          style={s.bar(pct)}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <div style={s.goal}>{nextGoal - points} {nextGoal - points === 1 ? 'pt' : 'pts'} to next reward</div>
    </div>
  );
}
