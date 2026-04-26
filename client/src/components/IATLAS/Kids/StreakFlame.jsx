/**
 * StreakFlame.jsx
 * Visual streak indicator showing current streak count with a flame icon.
 */

import React from 'react';

const STYLES = `
  .sf-root {
    display: inline-flex;
    align-items: center;
    gap: .45rem;
    padding: .35rem .85rem;
    border-radius: 20px;
    background: #fff7ed;
    border: 1.5px solid #fed7aa;
    font-size: .9rem;
    font-weight: 700;
    color: #c2410c;
    user-select: none;
    transition: transform .15s;
  }

  .sf-root.sf-lg {
    padding: .55rem 1.1rem;
    font-size: 1.05rem;
    border-radius: 24px;
  }

  .sf-root.sf-active {
    background: #fff7ed;
    border-color: #f97316;
    color: #c2410c;
  }

  .sf-root.sf-inactive {
    background: #f8fafc;
    border-color: #e2e8f0;
    color: #94a3b8;
  }

  .dark-mode .sf-root.sf-active {
    background: #431407;
    border-color: #f97316;
    color: #fdba74;
  }

  .dark-mode .sf-root.sf-inactive {
    background: #1e293b;
    border-color: #334155;
    color: #64748b;
  }

  .sf-icon {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
  }

  .sf-lg .sf-icon {
    width: 26px;
    height: 26px;
  }

  .sf-text {
    line-height: 1;
  }

  .sf-label {
    font-size: .72em;
    font-weight: 600;
    opacity: .75;
    margin-left: .15rem;
    text-transform: uppercase;
    letter-spacing: .03em;
  }

  .sf-longest {
    font-size: .78rem;
    color: #64748b;
    margin-top: .15rem;
    font-weight: 500;
  }

  .dark-mode .sf-longest {
    color: #94a3b8;
  }
`;

/**
 * StreakFlame
 *
 * Props:
 *   current  {number}  Current streak in days
 *   longest  {number}  Longest streak ever
 *   size     {'sm'|'lg'}  Visual size (default 'sm')
 *   showLongest {boolean}  Show longest streak below (default false)
 */
export default function StreakFlame({ current = 0, longest = 0, size = 'sm', showLongest = false }) {
  const isActive = current > 0;

  return (
    <>
      <style>{STYLES}</style>
      <div>
        <div
          className={`sf-root ${size === 'lg' ? 'sf-lg' : ''} ${isActive ? 'sf-active' : 'sf-inactive'}`}
          aria-label={`Current streak: ${current} day${current !== 1 ? 's' : ''}. Longest streak: ${longest} day${longest !== 1 ? 's' : ''}.`}
          role="status"
        >
          <img
            src="/icons/fire.svg"
            alt=""
            aria-hidden="true"
            className="sf-icon"
            style={{ opacity: isActive ? 1 : 0.4 }}
          />
          <span className="sf-text">
            {current}
            <span className="sf-label"> day{current !== 1 ? 's' : ''}</span>
          </span>
        </div>

        {showLongest && longest > 0 && (
          <p className="sf-longest">
            Best: {longest} day{longest !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </>
  );
}
