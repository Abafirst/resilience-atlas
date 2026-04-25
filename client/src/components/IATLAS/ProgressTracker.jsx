/**
 * ProgressTracker.jsx
 * Displays per-dimension progress, XP earned, badges unlocked, and streak.
 * All state is persisted to localStorage.
 */

import React, { useState, useEffect } from 'react';
import { ALL_MODULES_BY_DIMENSION, DIMENSION_META, LEVEL_META } from '../../data/iatlas/index.js';

const PROGRESS_KEY = 'iatlas_progress';
const STREAK_KEY = 'iatlas_streak';

export function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Silently fail
  }
}

export function markSkillComplete(dimensionKey, skillId, xpReward) {
  const progress = loadProgress();
  if (!progress[dimensionKey]) progress[dimensionKey] = {};
  if (!progress[dimensionKey][skillId]) {
    progress[dimensionKey][skillId] = {
      completedAt: new Date().toISOString(),
      xpEarned: xpReward || 0,
    };
    // Update streak
    updateStreak(dimensionKey);
  }
  saveProgress(progress);
  return progress;
}

function updateStreak(dimensionKey) {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    const streaks = raw ? JSON.parse(raw) : {};
    const today = new Date().toDateString();
    const dim = streaks[dimensionKey] || { current: 0, longest: 0, lastDate: null };
    if (dim.lastDate === today) return; // Already counted today
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (dim.lastDate === yesterday) {
      dim.current += 1;
    } else {
      dim.current = 1;
    }
    dim.longest = Math.max(dim.longest, dim.current);
    dim.lastDate = today;
    streaks[dimensionKey] = dim;
    localStorage.setItem(STREAK_KEY, JSON.stringify(streaks));
  } catch {
    // Silently fail
  }
}

function loadStreaks() {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const TRACKER_STYLES = `
  .pt-root {
    font-family: inherit;
  }

  .pt-title {
    font-size: 1rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 1rem;
  }

  .dark-mode .pt-title {
    color: #f1f5f9;
  }

  .pt-dimensions {
    display: flex;
    flex-direction: column;
    gap: .75rem;
  }

  .pt-dim-row {
    background: #f8fafc;
    border-radius: 10px;
    padding: .8rem 1rem;
    border: 1px solid #e2e8f0;
  }

  .dark-mode .pt-dim-row {
    background: #1e293b;
    border-color: #334155;
  }

  .pt-dim-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: .5rem;
  }

  .pt-dim-info {
    display: flex;
    align-items: center;
    gap: .5rem;
  }

  .pt-dim-emoji {
    font-size: 1.1rem;
  }

  .pt-dim-name {
    font-size: .875rem;
    font-weight: 600;
    color: #374151;
  }

  .dark-mode .pt-dim-name {
    color: #d1d5db;
  }

  .pt-dim-stats {
    display: flex;
    align-items: center;
    gap: .75rem;
    font-size: .78rem;
    color: #6b7280;
  }

  .pt-xp-badge {
    background: #fef3c7;
    color: #92400e;
    border-radius: 100px;
    padding: .1rem .45rem;
    font-weight: 700;
    font-size: .75rem;
  }

  .dark-mode .pt-xp-badge {
    background: #451a03;
    color: #fbbf24;
  }

  .pt-streak {
    display: flex;
    align-items: center;
    gap: .25rem;
    font-size: .75rem;
    color: #f59e0b;
    font-weight: 600;
  }

  .pt-progress-bar-bg {
    background: #e2e8f0;
    border-radius: 100px;
    height: 6px;
    overflow: hidden;
  }

  .dark-mode .pt-progress-bar-bg {
    background: #334155;
  }

  .pt-progress-bar-fill {
    height: 100%;
    border-radius: 100px;
    transition: width .4s ease;
  }

  .pt-progress-label {
    font-size: .72rem;
    color: #9ca3af;
    margin-top: .2rem;
  }

  .pt-overall {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    border-radius: 12px;
    padding: 1rem 1.25rem;
    color: #ffffff;
    margin-bottom: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .pt-overall-label {
    font-size: .8rem;
    opacity: .85;
  }

  .pt-overall-xp {
    font-size: 1.5rem;
    font-weight: 800;
    line-height: 1;
  }

  .pt-overall-skills {
    font-size: .8rem;
    opacity: .85;
    margin-top: .15rem;
  }

  .pt-badges-section {
    margin-top: 1.25rem;
  }

  .pt-badges-title {
    font-size: .8rem;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: .06em;
    margin-bottom: .6rem;
  }

  .pt-badges-grid {
    display: flex;
    flex-wrap: wrap;
    gap: .4rem;
  }

  .pt-badge-chip {
    background: #fef3c7;
    border: 1px solid #fde68a;
    border-radius: 100px;
    padding: .2rem .6rem;
    font-size: .78rem;
    font-weight: 600;
    color: #78350f;
    display: flex;
    align-items: center;
    gap: .3rem;
  }

  .dark-mode .pt-badge-chip {
    background: #451a03;
    border-color: #78350f;
    color: #fbbf24;
  }
`;

export default function ProgressTracker({ compact = false }) {
  const [progress, setProgress] = useState({});
  const [streaks, setStreaks] = useState({});

  useEffect(() => {
    setProgress(loadProgress());
    setStreaks(loadStreaks());
  }, []);

  // Compute totals
  let totalXp = 0;
  let totalSkillsCompleted = 0;
  const badges = [];

  const dimStats = Object.entries(DIMENSION_META).map(([dimKey, meta]) => {
    const modules = ALL_MODULES_BY_DIMENSION[dimKey] || [];
    const dimProgress = progress[dimKey] || {};
    const completed = modules.filter(m => dimProgress[m.id]);
    const dimXp = completed.reduce((sum, m) => sum + (dimProgress[m.id]?.xpEarned || 0), 0);
    const pct = modules.length > 0 ? Math.round((completed.length / modules.length) * 100) : 0;
    totalXp += dimXp;
    totalSkillsCompleted += completed.length;

    // Collect badges
    completed.forEach(m => {
      if (m.badge) badges.push({ ...m.badge, dimColor: meta.color });
    });

    return {
      dimKey,
      meta,
      total: modules.length,
      completed: completed.length,
      xp: dimXp,
      pct,
      streak: streaks[dimKey] || { current: 0, longest: 0 },
    };
  });

  if (compact) {
    return (
      <div className="pt-root" aria-label="Your IATLAS progress">
        <style dangerouslySetInnerHTML={{ __html: TRACKER_STYLES }} />
        <div className="pt-overall">
          <div>
            <div className="pt-overall-label">Total XP Earned</div>
            <div className="pt-overall-xp">{totalXp} XP</div>
            <div className="pt-overall-skills">{totalSkillsCompleted} skills completed</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="pt-overall-label">Across all dimensions</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              {Object.keys(DIMENSION_META).length} dimensions
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-root" aria-label="Your IATLAS progress">
      <style dangerouslySetInnerHTML={{ __html: TRACKER_STYLES }} />

      <div className="pt-overall">
        <div>
          <div className="pt-overall-label">Total XP Earned</div>
          <div className="pt-overall-xp">{totalXp} XP</div>
          <div className="pt-overall-skills">{totalSkillsCompleted} skills completed</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="pt-overall-label">Keep building!</div>
          <div style={{ fontSize: '1.75rem' }}>🏆</div>
        </div>
      </div>

      <p className="pt-title">Progress by Dimension</p>

      <div className="pt-dimensions" role="list">
        {dimStats.map(({ dimKey, meta, total, completed, xp, pct, streak }) => (
          <div key={dimKey} className="pt-dim-row" role="listitem">
            <div className="pt-dim-header">
              <div className="pt-dim-info">
                <span className="pt-dim-emoji" aria-hidden="true">{meta.emoji}</span>
                <span className="pt-dim-name">{meta.title}</span>
              </div>
              <div className="pt-dim-stats">
                {xp > 0 && <span className="pt-xp-badge">{xp} XP</span>}
                {streak.current > 0 && (
                  <span className="pt-streak" title={`${streak.current}-day streak`}>
                    🔥 {streak.current}
                  </span>
                )}
                <span>{completed}/{total}</span>
              </div>
            </div>
            <div className="pt-progress-bar-bg" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${meta.title} completion`}>
              <div
                className="pt-progress-bar-fill"
                style={{ width: `${pct}%`, background: meta.color }}
              />
            </div>
            <div className="pt-progress-label">{pct}% complete</div>
          </div>
        ))}
      </div>

      {badges.length > 0 && (
        <div className="pt-badges-section">
          <div className="pt-badges-title">Badges Earned ({badges.length})</div>
          <div className="pt-badges-grid" role="list" aria-label="Earned badges">
            {badges.map((badge, i) => (
              <div key={`${badge.id}-${i}`} className="pt-badge-chip" role="listitem">
                <span aria-hidden="true">{badge.icon}</span>
                {badge.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
