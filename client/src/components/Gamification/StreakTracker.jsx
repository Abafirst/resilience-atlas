/**
 * StreakTracker.jsx
 * Streak visualization component showing current streak, milestones, and dimension streaks.
 */

import React, { useMemo } from 'react';

const STYLES = `
  .st-root {
    font-family: inherit;
  }

  .st-hero {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 16px;
  }

  .st-fire {
    width: 3rem;
    height: 3rem;
    line-height: 1;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .st-hero-text {
    flex: 1;
  }

  .st-current {
    font-size: 1.6rem;
    font-weight: 800;
    color: #1e293b;
    line-height: 1.1;
  }

  .st-current-num {
    color: #f97316;
  }

  .st-longest {
    font-size: 0.8rem;
    color: #64748b;
    margin-top: 2px;
  }

  .st-milestone-section {
    margin-bottom: 16px;
  }

  .st-milestone-label {
    font-size: 0.78rem;
    color: #64748b;
    font-weight: 600;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .st-progress-track {
    width: 100%;
    height: 8px;
    background: #e2e8f0;
    border-radius: 999px;
    overflow: hidden;
    margin-bottom: 4px;
  }

  .st-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #f97316, #eab308);
    border-radius: 999px;
    transition: width 0.7s ease;
  }

  .st-milestone-footer {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    color: #94a3b8;
  }

  .st-days-section {
    margin-bottom: 16px;
  }

  .st-days-title {
    font-size: 0.78rem;
    font-weight: 600;
    color: #64748b;
    margin-bottom: 8px;
  }

  .st-dots {
    display: flex;
    gap: 6px;
  }

  .st-dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    font-weight: 600;
    color: #94a3b8;
    flex-direction: column;
    transition: background 0.2s;
    flex-shrink: 0;
  }

  .st-dot.st-dot-active {
    background: #f97316;
    color: #fff;
  }

  .st-dot-day {
    font-size: 0.55rem;
    margin-top: 1px;
    opacity: 0.75;
  }

  .st-dim-section {}

  .st-dim-title {
    font-size: 0.78rem;
    font-weight: 600;
    color: #64748b;
    margin-bottom: 8px;
  }

  .st-dim-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
  }

  .st-dim-card {
    background: #f8fafc;
    border-radius: 8px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid #e2e8f0;
  }

  .st-dim-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  .st-dim-body {
    min-width: 0;
    flex: 1;
  }

  .st-dim-name {
    font-size: 0.68rem;
    font-weight: 600;
    color: #334155;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .st-dim-streak {
    font-size: 0.72rem;
    color: #f97316;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 3px;
  }

  /* Dark mode */
  .dark-mode .st-current { color: #f1f5f9; }
  .dark-mode .st-longest { color: #94a3b8; }
  .dark-mode .st-milestone-label { color: #94a3b8; }
  .dark-mode .st-milestone-footer { color: #64748b; }
  .dark-mode .st-days-title { color: #94a3b8; }
  .dark-mode .st-progress-track { background: #334155; }
  .dark-mode .st-dot { background: #334155; color: #64748b; }
  .dark-mode .st-dot.st-dot-active { background: #f97316; color: #fff; }
  .dark-mode .st-dim-card { background: #1e293b; border-color: #334155; }
  .dark-mode .st-dim-name { color: #cbd5e1; }
  .dark-mode .st-dim-title { color: #94a3b8; }

  @media (max-width: 640px) {
    .st-current { font-size: 1.3rem; }
    .st-fire { width: 2.4rem; height: 2.4rem; }
    .st-dots { gap: 4px; }
    .st-dot { width: 24px; height: 24px; font-size: 0.55rem; }
    .st-dim-grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
  }
`;

const DAY_ABBRS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days.push({
      dateStr: d.toDateString(),
      label: DAY_ABBRS[d.getDay()],
    });
  }
  return days;
}

export default function StreakTracker({ overallStreak, dimensionStreaks = {}, nextMilestone }) {
  const streak = overallStreak || { current: 0, longest: 0, lastDate: null };

  const last7 = useMemo(() => {
    const days = getLast7Days();
    const { current, lastDate } = streak;
    if (!lastDate || current === 0) return days.map(d => ({ ...d, active: false }));

    const lastD = new Date(lastDate);
    const today = new Date();
    const diffDays = Math.round((today - lastD) / 86400000);
    const streakStartOffset = current - 1 + diffDays;

    return days.map((d, i) => {
      const daysAgo = 6 - i;
      const active = daysAgo <= streakStartOffset && daysAgo >= diffDays;
      return { ...d, active };
    });
  }, [streak]);

  const milestoneProgress = useMemo(() => {
    if (!nextMilestone) return 100;
    const prev = nextMilestone.days - (nextMilestone.days <= 7 ? nextMilestone.days - 1 : Math.floor(nextMilestone.days / 2));
    return Math.min(100, Math.round(((streak.current - prev) / (nextMilestone.days - prev)) * 100));
  }, [nextMilestone, streak.current]);

  const dimEntries = Object.entries(dimensionStreaks);

  return (
    <div className="st-root">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="st-hero">
        <div className="st-fire" aria-hidden="true">
          <img src="/icons/fire.svg" alt="" width={48} height={48} />
        </div>
        <div className="st-hero-text">
          <div className="st-current">
            Current Streak: <span className="st-current-num">{streak.current}</span>{' '}
            <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>
              {streak.current === 1 ? 'day' : 'days'}
            </span>
          </div>
          <div className="st-longest">
            Longest: {streak.longest} {streak.longest === 1 ? 'day' : 'days'}
          </div>
        </div>
      </div>

      {nextMilestone && (
        <div className="st-milestone-section">
          <div className="st-milestone-label">
            <img src={nextMilestone.icon} alt="" width={16} height={16} aria-hidden="true" />
            Next milestone: {nextMilestone.label} ({nextMilestone.days} days)
          </div>
          <div className="st-progress-track">
            <div className="st-progress-fill" style={{ width: `${milestoneProgress}%` }} />
          </div>
          <div className="st-milestone-footer">
            <span>{streak.current} days</span>
            <span>{nextMilestone.days - streak.current} days to go</span>
          </div>
        </div>
      )}

      <div className="st-days-section">
        <div className="st-days-title">Last 7 days</div>
        <div className="st-dots" role="list" aria-label="7-day activity">
          {last7.map((d, i) => (
            <div
              key={i}
              className={`st-dot${d.active ? ' st-dot-active' : ''}`}
              role="listitem"
              aria-label={`${d.label}: ${d.active ? 'practiced' : 'no activity'}`}
              title={`${d.label}: ${d.active ? 'practiced' : 'no activity'}`}
            >
              {d.active ? <img src="/icons/fire.svg" alt="active" width={14} height={14} aria-hidden="true" /> : '·'}
              <span className="st-dot-day">{d.label.slice(0, 2)}</span>
            </div>
          ))}
        </div>
      </div>

      {dimEntries.length > 0 && (
        <div className="st-dim-section">
          <div className="st-dim-title">Dimension Streaks</div>
          <div className="st-dim-grid">
            {dimEntries.map(([dimKey, dimStreak]) => (
              <div className="st-dim-card" key={dimKey}>
                <img
                  src={
                    dimKey.includes('agentic') ? '/icons/agentic-generative.svg'
                      : dimKey.includes('somatic') ? '/icons/somatic-regulative.svg'
                      : dimKey.includes('cognitive') ? '/icons/cognitive-narrative.svg'
                      : dimKey.includes('relational') ? '/icons/relational-connective.svg'
                      : dimKey.includes('emotional') ? '/icons/emotional-adaptive.svg'
                      : '/icons/spiritual-reflective.svg'
                  }
                  alt=""
                  width={20}
                  height={20}
                  className="st-dim-icon"
                  aria-hidden="true"
                />
                <div className="st-dim-body">
                  <div className="st-dim-name" title={dimKey}>
                    {dimKey.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </div>
                  <div className="st-dim-streak">
                    <img src="/icons/fire.svg" alt="" width={12} height={12} aria-hidden="true" /> {dimStreak.current || 0} days
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
