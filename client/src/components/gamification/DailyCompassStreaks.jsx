import React, { useState, useEffect, useRef } from 'react';
import { playStreakMilestoneSound } from '../../utils/soundEffects.js';

const STREAK_MILESTONES = [
  { days: 7,   label: '7-Day Navigator',  icon: '/icons/star.svg' },
  { days: 30,  label: '30-Day Voyager',   icon: '/icons/streaks.svg' },
  { days: 100, label: '100-Day Pioneer',  icon: '/icons/kids-spark.svg' },
];

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
  },
  streakRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  compassIcon: {
    fontSize: 48,
    lineHeight: 1,
  },
  streakInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  streakCount: {
    fontSize: 44,
    fontWeight: 800,
    color: '#e2e8f0',
    lineHeight: 1,
    background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  streakLabel: {
    fontSize: 13,
    color: '#7aafc8',
    fontWeight: 500,
  },
  bestRow: {
    fontSize: 12,
    color: '#4a5568',
    marginBottom: 16,
  },
  milestonesLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#4a5568',
    marginBottom: 10,
  },
  milestones: {
    display: 'flex',
    gap: 8,
  },
  milestone: (reached) => ({
    flex: 1,
    textAlign: 'center',
    padding: '10px 6px',
    borderRadius: 8,
    background: reached
      ? 'rgba(14,165,233,0.12)'
      : 'rgba(255,255,255,0.03)',
    border: `1px solid ${reached ? 'rgba(14,165,233,0.3)' : 'rgba(255,255,255,0.07)'}`,
    transition: 'all 0.2s',
  }),
  milestoneIcon: (reached) => ({
    fontSize: 20,
    opacity: reached ? 1 : 0.3,
    display: 'block',
    marginBottom: 4,
  }),
  milestoneDays: (reached) => ({
    fontSize: 11,
    fontWeight: 700,
    color: reached ? '#38bdf8' : '#4a5568',
    display: 'block',
  }),
  divider: {
    height: 1,
    background: 'rgba(255,255,255,0.08)',
    margin: '14px 0',
  },
  pointsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 13,
  },
  pointsLabel: {
    color: '#718096',
  },
  pointsValue: {
    color: '#fcd34d',
    fontWeight: 700,
    fontSize: 15,
  },
};

/**
 * DailyCompassStreaks — Atlas Navigator feature.
 * Shows the user's daily compass streak with milestone badges.
 *
 * Props:
 *   progress — gamification progress object (from useGamification)
 */
export default function DailyCompassStreaks({ progress }) {
  const days       = progress?.currentStreak?.days ?? 0;
  const longest    = progress?.longestStreak ?? 0;
  const points     = progress?.totalPoints ?? 0;
  const compassIcon = days >= 30 ? '/icons/kids-spark.svg' : days > 0 ? '/icons/compass.svg' : '/icons/goal.svg';

  // Track which milestone was just reached so we can celebrate it once
  const prevDaysRef = useRef(days);
  const [milestoneMsg, setMilestoneMsg] = useState(null);

  useEffect(() => {
    const prev = prevDaysRef.current;
    prevDaysRef.current = days;
    if (days <= prev) return; // streak decreased or unchanged — no celebration
    const newMilestone = STREAK_MILESTONES.slice().reverse().find(m => days >= m.days && prev < m.days);
    if (newMilestone) {
      playStreakMilestoneSound();
      setMilestoneMsg(`🔥 ${newMilestone.label} — ${newMilestone.days}-day streak reached!`);
      const t = setTimeout(() => setMilestoneMsg(null), 5000);
      return () => clearTimeout(t);
    }
  }, [days]);

  return (
    <div style={s.widget} role="region" aria-label="Daily Compass Streak">
      <div style={s.subtitle}>Atlas Navigator</div>
      <h3 style={s.widgetTitle}>
        <img src="/icons/streaks.svg" alt="" aria-hidden="true" width={18} height={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
        Build Your Compass Streak
      </h3>

      {/* Milestone celebration banner */}
      {milestoneMsg && (
        <div
          role="status"
          aria-live="polite"
          style={{
            marginBottom: 14,
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(14,165,233,0.18)',
            border: '1px solid rgba(14,165,233,0.45)',
            color: '#38bdf8',
            fontSize: 13,
            fontWeight: 700,
            animation: 'gam-toast-in 0.3s ease',
          }}
        >
          {milestoneMsg}
        </div>
      )}

      <div style={s.streakRow}>
        <span style={s.compassIcon} aria-hidden="true">
          <img src={compassIcon} alt="" width={24} height={24} style={{ verticalAlign: 'middle' }} />
        </span>
        <div style={s.streakInfo}>
          <span style={s.streakCount} aria-label={`${days} day streak`}>
            {days}
          </span>
          <span style={s.streakLabel}>{days === 1 ? 'day' : 'days'} compass streak</span>
        </div>
      </div>

      <div style={s.bestRow}>
        Best: <strong style={{ color: '#94a3b8' }}>{longest}</strong> days &nbsp;·&nbsp;
        Check in daily to build your streak
      </div>

      <div style={s.milestonesLabel}>Streak Milestones</div>
      <div style={s.milestones} aria-label="Streak milestone badges">
        {STREAK_MILESTONES.map(m => {
          const reached = days >= m.days;
          return (
            <div
              key={m.days}
              style={s.milestone(reached)}
              aria-label={`${m.label}${reached ? ' (achieved)' : ' (locked)'}`}
            >
              <span style={s.milestoneIcon(reached)} aria-hidden="true">
                <img src={m.icon} alt="" width={16} height={16} style={{ verticalAlign: 'middle' }} />
              </span>
              <span style={s.milestoneDays(reached)}>{m.days} days</span>
            </div>
          );
        })}
      </div>

      <div style={s.divider} />

      <div style={s.pointsRow}>
        <span style={s.pointsLabel}>Resilience Points</span>
        <span style={s.pointsValue}>⚡ {points.toLocaleString()} pts</span>
      </div>
    </div>
  );
}
