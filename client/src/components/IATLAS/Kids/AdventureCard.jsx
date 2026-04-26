/**
 * AdventureCard.jsx
 * Displays a single adventure with progress indicator and status.
 */

import React from 'react';

const STYLES = `
  .adc-card {
    background: #ffffff;
    border-radius: 14px;
    border: 1.5px solid #e2e8f0;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: .75rem;
    transition: box-shadow .18s, transform .18s;
  }

  .dark-mode .adc-card {
    background: #1e293b;
    border-color: #334155;
  }

  .adc-card:hover {
    box-shadow: 0 6px 24px rgba(0,0,0,.08);
    transform: translateY(-1px);
  }

  .adc-card.adc-complete {
    border-color: #86efac;
    background: #f0fdf4;
  }

  .dark-mode .adc-card.adc-complete {
    border-color: #166534;
    background: #052e16;
  }

  .adc-card.adc-coming-soon {
    opacity: .7;
  }

  .adc-header {
    display: flex;
    align-items: flex-start;
    gap: .75rem;
  }

  .adc-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .adc-icon {
    width: 26px;
    height: 26px;
  }

  .adc-title-area {
    flex: 1;
  }

  .adc-title {
    font-size: .95rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 .2rem;
    line-height: 1.3;
  }

  .dark-mode .adc-title {
    color: #f1f5f9;
  }

  .adc-desc {
    font-size: .8rem;
    color: #475569;
    margin: 0;
    line-height: 1.45;
  }

  .dark-mode .adc-desc {
    color: #94a3b8;
  }

  .adc-status-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: .5rem;
    flex-wrap: wrap;
  }

  .adc-progress-label {
    font-size: .75rem;
    color: #64748b;
    font-weight: 600;
  }

  .dark-mode .adc-progress-label {
    color: #94a3b8;
  }

  .adc-badge {
    display: inline-flex;
    align-items: center;
    gap: .3rem;
    padding: .2rem .6rem;
    border-radius: 20px;
    font-size: .72rem;
    font-weight: 700;
    letter-spacing: .02em;
  }

  .adc-badge.adc-complete-badge {
    background: #dcfce7;
    color: #15803d;
  }

  .adc-badge.adc-started-badge {
    background: #eff6ff;
    color: #1d4ed8;
  }

  .adc-badge.adc-new-badge {
    background: #f1f5f9;
    color: #475569;
  }

  .adc-badge.adc-soon-badge {
    background: #fef9c3;
    color: #854d0e;
  }

  .dark-mode .adc-badge.adc-complete-badge {
    background: #052e16;
    color: #86efac;
  }

  .dark-mode .adc-badge.adc-started-badge {
    background: #0c2040;
    color: #93c5fd;
  }

  .dark-mode .adc-badge.adc-new-badge {
    background: #1e293b;
    color: #94a3b8;
  }

  .adc-progress-bar-wrap {
    height: 7px;
    background: #f1f5f9;
    border-radius: 10px;
    overflow: hidden;
  }

  .dark-mode .adc-progress-bar-wrap {
    background: #334155;
  }

  .adc-progress-bar-fill {
    height: 100%;
    border-radius: 10px;
    transition: width .4s ease;
  }

  .adc-steps {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: .3rem;
  }

  .adc-step {
    display: flex;
    align-items: center;
    gap: .55rem;
    font-size: .8rem;
    color: #475569;
  }

  .dark-mode .adc-step {
    color: #94a3b8;
  }

  .adc-step.adc-step-done {
    color: #16a34a;
    text-decoration: line-through;
    opacity: .75;
  }

  .dark-mode .adc-step.adc-step-done {
    color: #4ade80;
  }

  .adc-step-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #e2e8f0;
    flex-shrink: 0;
  }

  .adc-step-dot.done {
    background: #22c55e;
  }

  .adc-step-dot.current {
    background: #6366f1;
  }

  .dark-mode .adc-step-dot { background: #334155; }
  .dark-mode .adc-step-dot.done { background: #4ade80; }
  .dark-mode .adc-step-dot.current { background: #818cf8; }

  .adc-reward-row {
    display: flex;
    align-items: center;
    gap: .5rem;
    flex-wrap: wrap;
    padding-top: .25rem;
    border-top: 1px solid #f1f5f9;
  }

  .dark-mode .adc-reward-row {
    border-top-color: #334155;
  }

  .adc-reward-label {
    font-size: .72rem;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .04em;
  }

  .adc-reward-star {
    display: inline-flex;
    align-items: center;
    gap: .25rem;
    font-size: .78rem;
    font-weight: 700;
    color: #d97706;
    background: #fef9c3;
    padding: .15rem .5rem;
    border-radius: 20px;
  }

  .dark-mode .adc-reward-star {
    background: #2d2008;
    color: #fcd34d;
  }
`;

function statusBadge(adventure) {
  if (adventure.comingSoon) return { cls: 'adc-soon-badge',     label: 'Coming Soon' };
  if (adventure.isComplete) return { cls: 'adc-complete-badge', label: 'Completed!'  };
  if (adventure.started)    return { cls: 'adc-started-badge',  label: 'In Progress' };
  return                           { cls: 'adc-new-badge',      label: 'New'          };
}

/**
 * AdventureCard
 *
 * Props:
 *   adventure  {object}  adventure object with stepsCompleted, isComplete, started
 *   showSteps  {boolean} whether to show step list (default false)
 */
export default function AdventureCard({ adventure, showSteps = false }) {
  if (!adventure) return null;

  const { cls: statusCls, label: statusLabel } = statusBadge(adventure);
  const pct = adventure.totalSteps > 0
    ? Math.round((adventure.stepsCompleted / adventure.totalSteps) * 100)
    : 0;
  const starRewards = (adventure.rewards || []).filter(r => r.type === 'stars');

  return (
    <>
      <style>{STYLES}</style>
      <div
        className={`adc-card${adventure.isComplete ? ' adc-complete' : ''}${adventure.comingSoon ? ' adc-coming-soon' : ''}`}
        aria-label={`${adventure.title}: ${adventure.isComplete ? 'completed' : `${adventure.stepsCompleted} of ${adventure.totalSteps} steps done`}`}
      >
        {/* Header */}
        <div className="adc-header">
          <div
            className="adc-icon-wrap"
            style={{ background: `${adventure.color}22` }}
            aria-hidden="true"
          >
            <img src={adventure.icon} alt="" className="adc-icon" />
          </div>
          <div className="adc-title-area">
            <h4 className="adc-title">{adventure.title}</h4>
            <p className="adc-desc">{adventure.description}</p>
          </div>
        </div>

        {/* Status + progress */}
        <div className="adc-status-row">
          <span className={`adc-badge ${statusCls}`}>{statusLabel}</span>
          <span className="adc-progress-label">
            {adventure.stepsCompleted}/{adventure.totalSteps} steps
          </span>
        </div>

        {/* Progress bar */}
        {!adventure.comingSoon && (
          <div className="adc-progress-bar-wrap" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Adventure progress">
            <div
              className="adc-progress-bar-fill"
              style={{ width: `${pct}%`, background: adventure.color }}
            />
          </div>
        )}

        {/* Optional step list */}
        {showSteps && !adventure.comingSoon && (
          <ul className="adc-steps" aria-label="Adventure steps">
            {adventure.steps.slice(0, 5).map((step, i) => {
              const done    = i < adventure.stepsCompleted;
              const current = i === adventure.stepsCompleted;
              return (
                <li
                  key={step.id}
                  className={`adc-step${done ? ' adc-step-done' : ''}`}
                  aria-label={`Step ${i + 1}: ${step.label}${done ? ' — done' : ''}`}
                >
                  <span className={`adc-step-dot${done ? ' done' : current ? ' current' : ''}`} aria-hidden="true" />
                  {step.label}
                </li>
              );
            })}
            {adventure.steps.length > 5 && (
              <li className="adc-step" style={{ color: '#94a3b8', fontSize: '.72rem' }}>
                + {adventure.steps.length - 5} more steps
              </li>
            )}
          </ul>
        )}

        {/* Rewards */}
        {starRewards.length > 0 && (
          <div className="adc-reward-row">
            <span className="adc-reward-label">Reward:</span>
            {starRewards.map((r, i) => (
              <span key={i} className="adc-reward-star">
                <img src="/icons/star.svg" alt="" width={13} height={13} aria-hidden="true" />
                {r.amount} stars
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
