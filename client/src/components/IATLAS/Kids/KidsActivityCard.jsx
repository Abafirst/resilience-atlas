/**
 * KidsActivityCard.jsx
 * Single activity card for the IATLAS Kids curriculum.
 */

import React, { useState } from 'react';
import { ACTIVITY_TYPES } from '../../../data/iatlas/kidsActivities.js';

const CARD_STYLES = `
  .kac-card {
    background: #ffffff;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    padding: 1.25rem;
    transition: box-shadow .18s, transform .18s;
    display: flex;
    flex-direction: column;
    gap: .75rem;
  }

  .dark-mode .kac-card {
    background: #1e293b;
    border-color: #334155;
  }

  .kac-card:hover {
    box-shadow: 0 6px 24px rgba(0,0,0,.08);
    transform: translateY(-2px);
  }

  .kac-header {
    display: flex;
    align-items: flex-start;
    gap: .75rem;
  }

  .kac-type-badge {
    display: inline-flex;
    align-items: center;
    gap: .3rem;
    padding: .2rem .6rem;
    border-radius: 20px;
    font-size: .72rem;
    font-weight: 600;
    letter-spacing: .02em;
    white-space: nowrap;
  }

  .kac-type-icon {
    width: 12px;
    height: 12px;
  }

  .kac-title {
    font-size: 1rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
    line-height: 1.3;
    flex: 1;
  }

  .dark-mode .kac-title {
    color: #f1f5f9;
  }

  .kac-meta {
    display: flex;
    align-items: center;
    gap: .75rem;
    flex-wrap: wrap;
  }

  .kac-duration {
    display: flex;
    align-items: center;
    gap: .3rem;
    font-size: .78rem;
    color: #64748b;
  }

  .kac-duration-icon {
    width: 13px;
    height: 13px;
    opacity: .6;
  }

  .kac-goal {
    font-size: .83rem;
    color: #475569;
    line-height: 1.5;
    font-style: italic;
  }

  .dark-mode .kac-goal {
    color: #94a3b8;
  }

  .kac-expand-btn {
    background: none;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: .45rem .85rem;
    font-size: .8rem;
    color: #4f46e5;
    cursor: pointer;
    transition: background .15s, border-color .15s;
    display: flex;
    align-items: center;
    gap: .35rem;
    align-self: flex-start;
    font-weight: 600;
  }

  .kac-expand-btn:hover {
    background: #eef2ff;
    border-color: #a5b4fc;
  }

  .dark-mode .kac-expand-btn {
    border-color: #334155;
    color: #818cf8;
  }

  .dark-mode .kac-expand-btn:hover {
    background: #1e2a40;
    border-color: #4f46e5;
  }

  .kac-chevron {
    display: inline-block;
    transition: transform .18s;
    font-size: .9rem;
  }

  .kac-chevron--up {
    transform: rotate(90deg);
  }

  .kac-details {
    border-top: 1px solid #f1f5f9;
    padding-top: .75rem;
    display: flex;
    flex-direction: column;
    gap: .85rem;
  }

  .dark-mode .kac-details {
    border-top-color: #334155;
  }

  .kac-section-title {
    font-size: .78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: #64748b;
    margin-bottom: .4rem;
  }

  .kac-materials {
    display: flex;
    flex-wrap: wrap;
    gap: .35rem;
  }

  .kac-material-tag {
    background: #f1f5f9;
    border-radius: 6px;
    padding: .2rem .55rem;
    font-size: .78rem;
    color: #475569;
  }

  .dark-mode .kac-material-tag {
    background: #1e293b;
    color: #94a3b8;
  }

  .kac-steps {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: .45rem;
  }

  .kac-step {
    display: flex;
    align-items: flex-start;
    gap: .6rem;
    font-size: .84rem;
    color: #374151;
    line-height: 1.5;
  }

  .dark-mode .kac-step {
    color: #cbd5e1;
  }

  .kac-step-num {
    background: #eef2ff;
    color: #4f46e5;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    min-width: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: .72rem;
    font-weight: 700;
    margin-top: .1rem;
  }

  .dark-mode .kac-step-num {
    background: #1e2a40;
    color: #818cf8;
  }

  .kac-parent-note {
    background: #fef3c7;
    border-left: 3px solid #f59e0b;
    padding: .6rem .85rem;
    border-radius: 0 8px 8px 0;
    font-size: .8rem;
    color: #78350f;
    line-height: 1.5;
  }

  .dark-mode .kac-parent-note {
    background: #2d2008;
    border-left-color: #d97706;
    color: #fcd34d;
  }

  .kac-note-label {
    font-weight: 700;
    margin-right: .3rem;
  }

  .kac-difficulty {
    display: inline-flex;
    align-items: center;
    gap: .25rem;
    padding: .18rem .5rem;
    border-radius: 20px;
    font-size: .7rem;
    font-weight: 700;
    letter-spacing: .02em;
    text-transform: capitalize;
  }

  .kac-difficulty--beginner     { background: #d1fae5; color: #065f46; }
  .kac-difficulty--intermediate { background: #fef3c7; color: #78350f; }
  .kac-difficulty--advanced     { background: #ede9fe; color: #5b21b6; }

  .kac-complete-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .4rem;
    padding: .5rem .9rem;
    border-radius: 8px;
    font-size: .82rem;
    font-weight: 700;
    cursor: pointer;
    transition: background .15s, transform .12s, opacity .15s;
    border: none;
    margin-top: .25rem;
  }

  .kac-complete-btn--done {
    background: #d1fae5;
    color: #065f46;
  }

  .kac-complete-btn--todo {
    background: #4f46e5;
    color: #ffffff;
  }

  .kac-complete-btn--todo:hover {
    background: #4338ca;
    transform: scale(1.02);
  }

  .kac-complete-btn--todo:active {
    transform: scale(.98);
  }

  .dark-mode .kac-complete-btn--done {
    background: #064e3b;
    color: #6ee7b7;
  }
`;

export default function KidsActivityCard({ activity, accentColor, onComplete, isCompleted }) {
  const [expanded, setExpanded] = useState(false);

  const typeInfo = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.activity;
  const badgeStyle = {
    background: `${typeInfo.color}18`,
    color: typeInfo.color,
  };

  const difficulty = activity.difficulty || 'beginner';
  const completed  = !!isCompleted;

  return (
    <>
      <style>{CARD_STYLES}</style>
      <div className="kac-card" style={{ borderTopColor: accentColor, borderTopWidth: 3 }}>
        {/* Header */}
        <div className="kac-header">
          <div style={{ flex: 1 }}>
            <span className="kac-type-badge" style={badgeStyle}>
              <img src={typeInfo.icon} alt="" className="kac-type-icon" aria-hidden="true" />
              {typeInfo.label}
            </span>
            <h4 className="kac-title" style={{ marginTop: '.4rem' }}>{activity.title}</h4>
          </div>
        </div>

        {/* Meta */}
        <div className="kac-meta">
          <span className="kac-duration">
            <img src="/icons/streaks.svg" alt="" className="kac-duration-icon" aria-hidden="true" />
            {activity.duration}
          </span>
          <span className={`kac-difficulty kac-difficulty--${difficulty}`}>
            {difficulty}
          </span>
        </div>

        {/* Learning goal */}
        {activity.learningGoal && (
          <p className="kac-goal">{activity.learningGoal}</p>
        )}

        {/* Expand/collapse */}
        <button
          className="kac-expand-btn"
          aria-expanded={expanded}
          onClick={() => setExpanded(e => !e)}
        >
          {expanded ? 'Hide steps' : 'Show steps'}
          <span className={`kac-chevron${expanded ? ' kac-chevron--up' : ''}`} aria-hidden="true">›</span>
        </button>

        {/* Expanded details */}
        {expanded && (
          <div className="kac-details">
            {activity.materials && activity.materials.length > 0 && (
              <div>
                <p className="kac-section-title">You'll need</p>
                <div className="kac-materials">
                  {activity.materials.map((m, i) => (
                    <span key={i} className="kac-material-tag">{m}</span>
                  ))}
                </div>
              </div>
            )}

            {activity.instructions && activity.instructions.length > 0 && (
              <div>
                <p className="kac-section-title">Steps</p>
                <ol className="kac-steps">
                  {activity.instructions.map((step, i) => (
                    <li key={i} className="kac-step">
                      <span className="kac-step-num" aria-hidden="true">{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {activity.parentNote && (
              <div className="kac-parent-note">
                <span className="kac-note-label">Parent/teacher note:</span>
                {activity.parentNote}
              </div>
            )}
          </div>
        )}

        {/* Mark complete */}
        {onComplete && (
          <button
            className={`kac-complete-btn ${completed ? 'kac-complete-btn--done' : 'kac-complete-btn--todo'}`}
            onClick={completed ? undefined : onComplete}
            aria-label={completed ? `${activity.title} completed` : `Mark ${activity.title} as complete`}
            aria-pressed={completed}
            disabled={completed}
          >
            {completed ? '✓ Completed' : 'Mark Complete'}
          </button>
        )}
      </div>
    </>
  );
}
