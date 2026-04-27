/**
 * ProgressDashboard.jsx
 * IATLAS completion-based progress dashboard.
 *
 * Displays:
 *   - XP total, streak, activity count, badge count
 *   - SVG circular progress per dimension (counts, not percentages)
 *   - Badge gallery (unlocked badges)
 *
 * Philosophy: "Skills, not scores" — no percentages shown, no grade-like
 * metrics. Progress is shown as completion counts (e.g. "3/8 activities").
 */

import React, { useEffect, useState, useCallback } from 'react';

const DIMENSION_COLORS = {
  'agentic-generative':    '#4f46e5',
  'somatic-regulative':    '#059669',
  'cognitive-narrative':   '#0891b2',
  'relational-connective': '#3b82f6',
  'emotional-adaptive':    '#8b5cf6',
  'spiritual-existential': '#ec4899',
};

const DIMENSION_LABELS = {
  'agentic-generative':    'Agentic',
  'somatic-regulative':    'Somatic',
  'cognitive-narrative':   'Cognitive',
  'relational-connective': 'Relational',
  'emotional-adaptive':    'Emotional',
  'spiritual-existential': 'Spiritual',
};

const DIMENSION_ICONS = {
  'agentic-generative':    '/icons/agentic-generative.svg',
  'somatic-regulative':    '/icons/somatic-regulative.svg',
  'cognitive-narrative':   '/icons/cognitive-narrative.svg',
  'relational-connective': '/icons/relational-connective.svg',
  'emotional-adaptive':    '/icons/emotional-adaptive.svg',
  'spiritual-existential': '/icons/spiritual-existential.svg',
};

// Activities per dimension per age group (used for the ring denominator)
const ACTIVITIES_PER_DIMENSION = 8;

// ── Styles ────────────────────────────────────────────────────────────────────

const STYLES = `
  .ipd-root {
    max-width: 860px;
    margin: 0 auto;
    padding: 0 1.25rem 4rem;
  }

  /* ── Overview cards ── */
  .ipd-overview {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: .75rem;
    margin-bottom: 1.75rem;
  }

  @media (min-width: 480px) {
    .ipd-overview {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .ipd-stat-card {
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: 14px;
    padding: 1rem .85rem .85rem;
    text-align: center;
  }

  .dark-mode .ipd-stat-card {
    background: #1e293b;
    border-color: #334155;
  }

  .ipd-stat-icon {
    font-size: 1.6rem;
    line-height: 1;
    margin-bottom: .35rem;
    display: block;
  }

  .ipd-stat-value {
    font-size: 1.55rem;
    font-weight: 900;
    color: #0f172a;
    line-height: 1;
    margin-bottom: .2rem;
  }

  .dark-mode .ipd-stat-value {
    color: #f1f5f9;
  }

  .ipd-stat-label {
    font-size: .68rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: .05em;
  }

  /* ── Section card ── */
  .ipd-card {
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: 16px;
    padding: 1.35rem 1.25rem;
    margin-bottom: 1.25rem;
  }

  .dark-mode .ipd-card {
    background: #1e293b;
    border-color: #334155;
  }

  .ipd-section-title {
    font-size: .95rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 1.1rem;
  }

  .dark-mode .ipd-section-title {
    color: #f1f5f9;
  }

  /* ── Dimension grid ── */
  .ipd-dim-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  @media (min-width: 540px) {
    .ipd-dim-grid {
      grid-template-columns: repeat(6, 1fr);
    }
  }

  .ipd-dim-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: .45rem;
  }

  .ipd-circle-wrap {
    position: relative;
    width: 72px;
    height: 72px;
  }

  .ipd-svg {
    width: 72px;
    height: 72px;
    transform: rotate(-90deg);
  }

  .ipd-track {
    fill: none;
    stroke: #e2e8f0;
    stroke-width: 6;
  }

  .dark-mode .ipd-track {
    stroke: #334155;
  }

  .ipd-fill {
    fill: none;
    stroke-width: 6;
    stroke-linecap: round;
    transition: stroke-dashoffset .5s ease;
  }

  .ipd-icon-wrap {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ipd-dim-icon {
    width: 26px;
    height: 26px;
  }

  .ipd-dim-label {
    font-size: .7rem;
    font-weight: 600;
    color: #475569;
    text-align: center;
    line-height: 1.25;
    max-width: 72px;
  }

  .dark-mode .ipd-dim-label {
    color: #94a3b8;
  }

  .ipd-dim-count {
    font-size: .68rem;
    color: #64748b;
    text-align: center;
    font-weight: 700;
  }

  /* ── Badge grid ── */
  .ipd-badge-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
    gap: .75rem;
  }

  .ipd-badge-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: .4rem;
    text-align: center;
  }

  .ipd-badge-icon-wrap {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dark-mode .ipd-badge-icon-wrap {
    background: #334155;
  }

  .ipd-badge-icon {
    width: 34px;
    height: 34px;
  }

  .ipd-badge-name {
    font-size: .68rem;
    font-weight: 600;
    color: #475569;
    line-height: 1.25;
  }

  .dark-mode .ipd-badge-name {
    color: #94a3b8;
  }

  /* ── Empty state ── */
  .ipd-empty {
    font-size: .85rem;
    color: #94a3b8;
    padding: .75rem 0;
  }

  /* ── Streak row ── */
  .ipd-streak-row {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .ipd-streak-stat {
    display: flex;
    flex-direction: column;
    gap: .15rem;
  }

  .ipd-streak-value {
    font-size: 2rem;
    font-weight: 900;
    color: #f59e0b;
    line-height: 1;
  }

  .ipd-streak-label {
    font-size: .72rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: .05em;
  }

  /* ── Loading / error ── */
  .ipd-status {
    font-size: .9rem;
    color: #64748b;
    padding: 2rem 0;
    text-align: center;
  }
`;

// ── SVG circular ring helper ──────────────────────────────────────────────────

function CircleRing({ count, total, color }) {
  const r            = 28;
  const circumference = 2 * Math.PI * r;
  const pct          = total > 0 ? Math.min(1, count / total) : 0;
  const offset       = circumference - pct * circumference;

  return (
    <svg className="ipd-svg" viewBox="0 0 72 72" aria-hidden="true">
      <circle className="ipd-track" cx="36" cy="36" r={r} />
      <circle
        className="ipd-fill"
        cx="36"
        cy="36"
        r={r}
        stroke={color}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

/**
 * ProgressDashboard
 *
 * Props:
 *   childProfileId  {string|null}  Optional child profile ID
 *   className       {string}       Optional extra CSS class
 */
export default function ProgressDashboard({ childProfileId = null, className = '' }) {
  const [progress, setProgress] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const qs    = childProfileId ? `?childProfileId=${encodeURIComponent(childProfileId)}` : '';
      const res   = await fetch(`/api/iatlas/progress${qs}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProgress(data.progress || data);
    } catch (err) {
      setError('Could not load progress. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [childProfileId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  if (loading) {
    return (
      <>
        <style>{STYLES}</style>
        <div className={`ipd-root ${className}`}>
          <p className="ipd-status">Loading progress…</p>
        </div>
      </>
    );
  }

  if (error || !progress) {
    return (
      <>
        <style>{STYLES}</style>
        <div className={`ipd-root ${className}`}>
          <p className="ipd-status">{error || 'No progress data found.'}</p>
        </div>
      </>
    );
  }

  const totalActivities = (progress.completedActivities || []).length;
  const totalBadges     = (progress.unlockedBadges || []).length;
  const dp              = progress.dimensionProgress || {};

  return (
    <>
      <style>{STYLES}</style>
      <div className={`ipd-root ${className}`}>

        {/* ── Overview stats ──────────────────────────────────────────────── */}
        <div className="ipd-overview" role="region" aria-label="Progress overview">
          <div className="ipd-stat-card">
            <span className="ipd-stat-icon" aria-hidden="true">⭐</span>
            <div className="ipd-stat-value" aria-label={`${progress.totalXP} total XP`}>
              {progress.totalXP}
            </div>
            <div className="ipd-stat-label">Total XP</div>
          </div>
          <div className="ipd-stat-card">
            <span className="ipd-stat-icon" aria-hidden="true">🔥</span>
            <div className="ipd-stat-value" aria-label={`${progress.currentStreak} day streak`}>
              {progress.currentStreak}
            </div>
            <div className="ipd-stat-label">Day Streak</div>
          </div>
          <div className="ipd-stat-card">
            <span className="ipd-stat-icon" aria-hidden="true">✅</span>
            <div className="ipd-stat-value" aria-label={`${totalActivities} activities completed`}>
              {totalActivities}
            </div>
            <div className="ipd-stat-label">Activities Done</div>
          </div>
          <div className="ipd-stat-card">
            <span className="ipd-stat-icon" aria-hidden="true">🏆</span>
            <div className="ipd-stat-value" aria-label={`${totalBadges} badges unlocked`}>
              {totalBadges}
            </div>
            <div className="ipd-stat-label">Badges</div>
          </div>
        </div>

        {/* ── Dimension progress ───────────────────────────────────────────── */}
        <div className="ipd-card" role="region" aria-label="Progress by dimension">
          <h3 className="ipd-section-title">Progress by Dimension</h3>
          <div className="ipd-dim-grid">
            {Object.entries(DIMENSION_LABELS).map(([key, label]) => {
              const count = dp[key] || 0;
              const total = ACTIVITIES_PER_DIMENSION;
              const color = DIMENSION_COLORS[key] || '#6b7280';
              const icon  = DIMENSION_ICONS[key];
              return (
                <div
                  key={key}
                  className="ipd-dim-item"
                  role="listitem"
                  aria-label={`${label}: ${count} of ${total} completed`}
                >
                  <div className="ipd-circle-wrap">
                    <CircleRing count={count} total={total} color={color} />
                    <div className="ipd-icon-wrap">
                      <img src={icon} alt="" aria-hidden="true" className="ipd-dim-icon" />
                    </div>
                  </div>
                  <span className="ipd-dim-label">{label}</span>
                  <span className="ipd-dim-count">{count}/{total}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Streak detail ────────────────────────────────────────────────── */}
        <div className="ipd-card" role="region" aria-label="Streak details">
          <h3 className="ipd-section-title">🔥 Streak</h3>
          <div className="ipd-streak-row">
            <div className="ipd-streak-stat">
              <span className="ipd-streak-value">{progress.currentStreak}</span>
              <span className="ipd-streak-label">Current streak</span>
            </div>
            <div className="ipd-streak-stat">
              <span className="ipd-streak-value" style={{ color: '#6366f1' }}>
                {progress.longestStreak}
              </span>
              <span className="ipd-streak-label">Longest streak</span>
            </div>
          </div>
        </div>

        {/* ── Badges unlocked ──────────────────────────────────────────────── */}
        <div className="ipd-card" role="region" aria-label="Badges unlocked">
          <h3 className="ipd-section-title">
            Badges Unlocked ({totalBadges})
          </h3>
          {totalBadges > 0 ? (
            <div className="ipd-badge-grid">
              {progress.unlockedBadges.map(badge => (
                <div key={badge.badgeId} className="ipd-badge-item">
                  <div className="ipd-badge-icon-wrap">
                    <img
                      src={`/icons/badges/${badge.badgeId}.svg`}
                      alt={badge.milestone || badge.badgeId || 'Badge icon'}
                      className="ipd-badge-icon"
                    />
                  </div>
                  <span className="ipd-badge-name">{badge.milestone || badge.badgeId}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="ipd-empty">
              Complete activities to unlock your first badge!
            </p>
          )}
        </div>

      </div>
    </>
  );
}
