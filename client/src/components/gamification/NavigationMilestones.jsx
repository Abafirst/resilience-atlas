import React from 'react';
import { NAVIGATION_MILESTONES } from '../../data/gamificationContent.js';

const s = {
  widget: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: '20px 24px',
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#e8f0fe',
    margin: '0 0 6px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  subtitle: {
    color: '#7aafc8',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 16,
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  milestone: (completed) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    borderRadius: 8,
    background: completed
      ? 'rgba(14,165,233,0.12)'
      : 'rgba(255,255,255,0.03)',
    border: `1px solid ${completed ? 'rgba(14,165,233,0.3)' : 'rgba(255,255,255,0.07)'}`,
    transition: 'background 0.2s',
  }),
  icon: {
    fontSize: 22,
    lineHeight: 1,
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: (completed) => ({
    fontSize: 13,
    fontWeight: 600,
    color: completed ? '#93c5fd' : '#e2e8f0',
    marginBottom: 2,
  }),
  desc: {
    fontSize: 11,
    color: '#718096',
    lineHeight: 1.4,
  },
  check: (completed) => ({
    fontSize: 16,
    color: completed ? '#38bdf8' : '#4a5568',
    flexShrink: 0,
  }),
  progressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    paddingTop: 14,
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    background: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: (pct) => ({
    width: `${pct}%`,
    height: '100%',
    background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
    borderRadius: 3,
    transition: 'width 0.4s ease',
  }),
  progressLabel: {
    fontSize: 12,
    color: '#7aafc8',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
};

/**
 * NavigationMilestones — Atlas Starter feature.
 * Shows resilience checkpoint milestones. Completed milestones are derived
 * from the assessment scores if provided.
 *
 * Props:
 *   scores — object mapping dimension name → score (0–100), optional
 */
export default function NavigationMilestones({ scores }) {
  // Determine which milestones are completed based on assessment scores.
  // "First assessment" is always complete if this component is shown.
  const completedIds = new Set(['first-assessment']);
  if (scores && typeof scores === 'object') {
    NAVIGATION_MILESTONES.forEach(m => {
      if (m.dimension && scores[m.dimension] !== undefined) {
        completedIds.add(m.id);
      }
    });
  }

  const completed = completedIds.size;
  const total = NAVIGATION_MILESTONES.length;
  const pct = Math.round((completed / total) * 100);

  return (
    <div style={s.widget} role="region" aria-label="Navigation Milestones">
      <div style={s.subtitle}>Atlas Starter</div>
      <h3 style={s.widgetTitle}>
        🧭 Navigation Milestones
      </h3>

      <ul style={s.list} aria-label="Resilience milestones">
        {NAVIGATION_MILESTONES.map(m => {
          const done = completedIds.has(m.id);
          return (
            <li key={m.id} style={s.milestone(done)}>
              <span style={s.icon} aria-hidden="true">{m.icon}</span>
              <div style={s.info}>
                <div style={s.name(done)}>{m.title}</div>
                <div style={s.desc}>{m.description}</div>
              </div>
              <span
                style={s.check(done)}
                aria-label={done ? 'Completed' : 'Pending'}
              >
                {done ? '✓' : '○'}
              </span>
            </li>
          );
        })}
      </ul>

      <div style={s.progressRow} aria-label={`${completed} of ${total} milestones completed`}>
        <div style={s.progressBar} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div style={s.progressFill(pct)} />
        </div>
        <span style={s.progressLabel}>{completed}/{total} Complete</span>
      </div>
    </div>
  );
}
