/**
 * XPProgressBar.jsx
 * Animated XP progress bar showing current level, XP progress, and next level info.
 */

import React from 'react';
import { calculateLevel } from '../../data/gamification/levels.js';

const STYLES = `
  .xpb-root {
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
  }

  .xpb-container {
    background: #f1f5f9;
    border-radius: 12px;
    padding: 16px 20px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  }

  .xpb-container.xpb-compact {
    padding: 8px 12px;
    border-radius: 8px;
  }

  .xpb-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    gap: 8px;
    flex-wrap: wrap;
  }

  .xpb-compact .xpb-header {
    margin-bottom: 6px;
  }

  .xpb-level-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .xpb-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    font-size: 1.3rem;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.18);
  }

  .xpb-compact .xpb-badge {
    width: 28px;
    height: 28px;
    font-size: 1rem;
  }

  .xpb-level-text {
    display: flex;
    flex-direction: column;
  }

  .xpb-level-num {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #64748b;
    font-weight: 600;
  }

  .xpb-level-title {
    font-size: 1rem;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.2;
  }

  .xpb-compact .xpb-level-title {
    font-size: 0.85rem;
  }

  .xpb-next-info {
    font-size: 0.78rem;
    color: #64748b;
    text-align: right;
    white-space: nowrap;
  }

  .xpb-compact .xpb-next-info {
    font-size: 0.7rem;
  }

  .xpb-next-info strong {
    color: #334155;
  }

  .xpb-bar-track {
    width: 100%;
    height: 12px;
    background: #e2e8f0;
    border-radius: 999px;
    overflow: hidden;
    position: relative;
  }

  .xpb-compact .xpb-bar-track {
    height: 8px;
  }

  .xpb-bar-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.8s ease;
    min-width: 4px;
    position: relative;
    overflow: hidden;
  }

  .xpb-bar-fill::after {
    content: '';
    position: absolute;
    top: 0; left: -100%;
    width: 60%;
    height: 100%;
    background: rgba(255,255,255,0.3);
    transform: skewX(-20deg);
    animation: xpb-shine 2.5s infinite;
  }

  .xpb-max .xpb-bar-fill::after {
    display: none;
  }

  @keyframes xpb-shine {
    0%   { left: -100%; }
    60%  { left: 160%;  }
    100% { left: 160%;  }
  }

  .xpb-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
    font-size: 0.7rem;
    color: #94a3b8;
  }

  .xpb-max-label {
    font-size: 0.72rem;
    font-weight: 700;
    color: #eab308;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-align: right;
    margin-top: 4px;
  }

  /* Dark mode */
  .dark-mode .xpb-container {
    background: #1e293b;
  }
  .dark-mode .xpb-level-num { color: #94a3b8; }
  .dark-mode .xpb-level-title { color: #f1f5f9; }
  .dark-mode .xpb-next-info { color: #94a3b8; }
  .dark-mode .xpb-next-info strong { color: #cbd5e1; }
  .dark-mode .xpb-bar-track { background: #334155; }
  .dark-mode .xpb-footer { color: #475569; }

  /* Mobile */
  @media (max-width: 640px) {
    .xpb-container { padding: 12px 14px; }
    .xpb-level-title { font-size: 0.9rem; }
    .xpb-next-info { font-size: 0.72rem; }
  }
`;

export default function XPProgressBar({ totalXP = 0, levelInfo, compact = false }) {
  const info = levelInfo || calculateLevel(totalXP);
  const { level, title, progress, color, icon, xpToNext, isMax } = info;

  return (
    <div className="xpb-root">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className={`xpb-container${compact ? ' xpb-compact' : ''}${isMax ? ' xpb-max' : ''}`}>
        <div className="xpb-header">
          <div className="xpb-level-info">
            <div
              className="xpb-badge"
              style={{ background: color }}
              title={`Level ${level}`}
            >
              {icon}
            </div>
            <div className="xpb-level-text">
              <span className="xpb-level-num">Level {level}</span>
              <span className="xpb-level-title">{title}</span>
            </div>
          </div>
          <div className="xpb-next-info">
            {isMax ? (
              <strong>Max Level!</strong>
            ) : (
              <>
                <strong>{xpToNext.toLocaleString()}</strong> XP to next level
              </>
            )}
          </div>
        </div>

        <div className="xpb-bar-track">
          <div
            className="xpb-bar-fill"
            style={{ width: `${progress}%`, background: color }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Level progress: ${progress}%`}
          />
        </div>

        {!compact && (
          isMax ? (
            <div className="xpb-max-label">✨ MAX LEVEL</div>
          ) : (
            <div className="xpb-footer">
              <span>{totalXP.toLocaleString()} XP total</span>
              <span>{progress}%</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
