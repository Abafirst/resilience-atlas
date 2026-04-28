/**
 * MiniAssessmentHistory.jsx
 * Timeline view of past mini assessment results for a dimension.
 */

import React, { useState, useEffect } from 'react';
import { MINI_ASSESSMENTS } from '../../data/iatlas/miniAssessments.js';

const STYLES = `
  .mah-container { max-width: 640px; margin: 0 auto; }

  .mah-header {
    margin-bottom: 1.25rem;
  }
  .mah-title { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0 0 .25rem; }
  .dark-mode .mah-title { color: #f1f5f9; }
  .mah-subtitle { font-size: .8rem; color: #64748b; }

  .mah-filter {
    display: flex;
    gap: .5rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }
  .mah-filter-btn {
    padding: .3rem .75rem;
    border-radius: 20px;
    border: 1.5px solid #e2e8f0;
    font-size: .78rem;
    font-weight: 600;
    cursor: pointer;
    background: transparent;
    color: #64748b;
    transition: all .15s;
  }
  .mah-filter-btn.active {
    background: #0f172a;
    color: #fff;
    border-color: #0f172a;
  }
  .dark-mode .mah-filter-btn.active { background: #f1f5f9; color: #0f172a; border-color: #f1f5f9; }

  .mah-timeline { display: flex; flex-direction: column; gap: .75rem; }

  .mah-item {
    display: flex;
    align-items: center;
    gap: .85rem;
    background: #ffffff;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    padding: .9rem 1rem;
  }
  .dark-mode .mah-item { background: #1e293b; border-color: #334155; }

  .mah-score-circle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 1.1rem;
    font-weight: 900;
    color: #fff;
  }

  .mah-info { flex: 1; }
  .mah-dimension { font-size: .78rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .04em; }
  .mah-interp { font-size: .92rem; font-weight: 700; color: #0f172a; }
  .dark-mode .mah-interp { color: #f1f5f9; }
  .mah-date { font-size: .75rem; color: #94a3b8; }

  .mah-empty {
    text-align: center;
    padding: 2rem 1rem;
    color: #94a3b8;
    font-size: .9rem;
  }
`;

const SCORE_COLORS = {
  low:    '#f59e0b',
  medium: '#3b82f6',
  high:   '#10b981',
};

const STORAGE_KEY_PREFIX = 'iatlas_mini_assessment_';

function loadHistory(dimensionKey) {
  if (!dimensionKey) {
    // Load all dimensions
    const all = [];
    Object.keys(MINI_ASSESSMENTS).forEach(k => {
      try {
        const items = JSON.parse(localStorage.getItem(`${STORAGE_KEY_PREFIX}${k}`) || '[]');
        all.push(...items);
      } catch {
        // ignore
      }
    });
    return all.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  }
  try {
    return JSON.parse(localStorage.getItem(`${STORAGE_KEY_PREFIX}${dimensionKey}`) || '[]');
  } catch {
    return [];
  }
}

/**
 * MiniAssessmentHistory
 *
 * Props:
 *   dimensionKey {string|null} — Filter to a specific dimension, or null for all
 */
export default function MiniAssessmentHistory({ dimensionKey = null }) {
  const [filter, setFilter]   = useState(dimensionKey || 'all');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(loadHistory(filter === 'all' ? null : filter));
  }, [filter]);

  const dimensions = Object.values(MINI_ASSESSMENTS);

  return (
    <>
      <style>{STYLES}</style>
      <div className="mah-container">
        <div className="mah-header">
          <h2 className="mah-title">Assessment History</h2>
          <p className="mah-subtitle">Your past mini check-in results</p>
        </div>

        <div className="mah-filter" role="group" aria-label="Filter by dimension">
          <button
            className={`mah-filter-btn${filter === 'all' ? ' active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          {dimensions.map(d => (
            <button
              key={d.id}
              className={`mah-filter-btn${filter === d.id ? ' active' : ''}`}
              onClick={() => setFilter(d.id)}
            >
              {d.name}
            </button>
          ))}
        </div>

        {history.length === 0 ? (
          <div className="mah-empty">No assessments yet. Complete a mini check-in to see your history here.</div>
        ) : (
          <div className="mah-timeline" role="list">
            {history.map((item, i) => {
              const assessment  = MINI_ASSESSMENTS[item.dimensionKey];
              const scoreColor  = SCORE_COLORS[item.interpretationBand] || '#64748b';
              const date        = item.completedAt
                ? new Date(item.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : '';
              return (
                <div key={i} className="mah-item" role="listitem">
                  <div className="mah-score-circle" style={{ background: scoreColor }}>
                    {item.totalScore}
                  </div>
                  <div className="mah-info">
                    <p className="mah-dimension">{assessment?.name || item.dimensionKey}</p>
                    <p className="mah-interp" style={{ color: scoreColor }}>{item.interpretation || item.interpretationBand}</p>
                    <p className="mah-date">{date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
