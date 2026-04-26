/**
 * DimensionProgress.jsx
 * Six circular progress indicators — one per resilience dimension.
 */

import React from 'react';
import { KIDS_DIMENSIONS } from '../../../data/kidsBadges.js';

const STYLES = `
  .dp-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  @media (min-width: 600px) {
    .dp-grid {
      grid-template-columns: repeat(6, 1fr);
    }
  }

  .dp-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: .5rem;
  }

  .dp-circle-wrap {
    position: relative;
    width: 72px;
    height: 72px;
  }

  .dp-svg {
    width: 72px;
    height: 72px;
    transform: rotate(-90deg);
  }

  .dp-track {
    fill: none;
    stroke: #e2e8f0;
    stroke-width: 6;
  }

  .dark-mode .dp-track {
    stroke: #334155;
  }

  .dp-fill {
    fill: none;
    stroke-width: 6;
    stroke-linecap: round;
    transition: stroke-dashoffset .5s ease;
  }

  .dp-icon-wrap {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dp-icon {
    width: 26px;
    height: 26px;
  }

  .dp-label {
    font-size: .72rem;
    font-weight: 600;
    color: #475569;
    text-align: center;
    line-height: 1.25;
    max-width: 72px;
  }

  .dark-mode .dp-label {
    color: #94a3b8;
  }

  .dp-count {
    font-size: .68rem;
    color: #64748b;
    text-align: center;
  }

  .dark-mode .dp-count {
    color: #64748b;
  }
`;

/** Compute SVG circle props for a given percentage */
function circleProps(pct) {
  const r          = 28;
  const circumference = 2 * Math.PI * r;
  const offset     = circumference - (pct / 100) * circumference;
  return { r, circumference, offset };
}

/**
 * DimensionProgress
 *
 * Props:
 *   ageGroup    {string}  e.g. 'age-5-7'
 *   completed   {object}  { [dimensionKey]: count } — from getDimensionCounts
 *   totals      {object}  { [dimensionKey]: total } — from getTotals
 */
export default function DimensionProgress({ ageGroup, completed = {}, totals = {} }) {
  return (
    <>
      <style>{STYLES}</style>
      <div className="dp-grid" role="list" aria-label="Dimension progress">
        {KIDS_DIMENSIONS.map(({ key, label, archetype, icon, color }) => {
          const done  = completed[key] || 0;
          const total = totals[key]    || 0;
          const pct   = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
          const { r, circumference, offset } = circleProps(pct);

          return (
            <div
              key={key}
              className="dp-item"
              role="listitem"
              aria-label={`${label}: ${done} of ${total} completed (${pct}%)`}
            >
              <div className="dp-circle-wrap">
                <svg className="dp-svg" viewBox="0 0 72 72" aria-hidden="true">
                  <circle
                    className="dp-track"
                    cx="36"
                    cy="36"
                    r={r}
                  />
                  <circle
                    className="dp-fill"
                    cx="36"
                    cy="36"
                    r={r}
                    stroke={color}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                  />
                </svg>
                <div className="dp-icon-wrap">
                  <img src={icon} alt="" aria-hidden="true" className="dp-icon" />
                </div>
              </div>
              <span className="dp-label">{archetype}</span>
              <span className="dp-count">{done}/{total}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
