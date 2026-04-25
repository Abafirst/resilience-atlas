/**
 * BadgeCard.jsx
 * Single badge display card with rarity glow and lock/unlock states.
 */

import React, { useState } from 'react';

const RARITY_STYLES = {
  legendary: { border: '2px solid #eab308', boxShadow: '0 0 10px rgba(234,179,8,0.45)', label: 'Legendary', color: '#eab308' },
  epic:      { border: '2px solid #7c3aed', boxShadow: '0 0 10px rgba(124,58,237,0.45)', label: 'Epic', color: '#7c3aed' },
  rare:      { border: '2px solid #3b82f6', boxShadow: '0 0 10px rgba(59,130,246,0.4)',  label: 'Rare', color: '#3b82f6' },
  uncommon:  { border: '2px solid #10b981', boxShadow: '0 0 8px rgba(16,185,129,0.35)',  label: 'Uncommon', color: '#10b981' },
  common:    { border: '1px solid #cbd5e1', boxShadow: 'none', label: 'Common', color: '#94a3b8' },
};

const STYLES = `
  .bc-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    background: #fff;
    border-radius: 10px;
    padding: 10px 6px 8px;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    position: relative;
    box-sizing: border-box;
    min-width: 90px;
    max-width: 120px;
    gap: 4px;
    outline: none;
  }

  .bc-card:hover,
  .bc-card:focus-visible {
    transform: translateY(-2px) scale(1.03);
  }

  .bc-card:focus-visible {
    outline: 2px solid #4f46e5;
    outline-offset: 2px;
  }

  .bc-locked {
    filter: grayscale(1);
    opacity: 0.4;
    cursor: default;
  }

  .bc-locked:hover {
    transform: none;
  }

  .bc-emoji {
    font-size: 2rem;
    line-height: 1;
    display: block;
    margin-bottom: 2px;
  }

  .bc-locked .bc-emoji {
    opacity: 0.5;
  }

  .bc-lock-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.65rem;
    color: #64748b;
    font-weight: 600;
    pointer-events: none;
    white-space: nowrap;
  }

  .bc-name {
    font-size: 0.65rem;
    font-weight: 600;
    color: #1e293b;
    text-align: center;
    line-height: 1.3;
    word-break: break-word;
    max-width: 100%;
  }

  .bc-rarity-label {
    font-size: 0.58rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-top: 2px;
  }

  .bc-detail-popup {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    background: #1e293b;
    color: #f1f5f9;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 0.72rem;
    width: 180px;
    z-index: 100;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    pointer-events: none;
    text-align: left;
  }

  .bc-detail-popup::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: #1e293b;
  }

  .bc-popup-name {
    font-weight: 700;
    margin-bottom: 3px;
    font-size: 0.78rem;
  }

  .bc-popup-desc {
    color: #cbd5e1;
    line-height: 1.4;
    margin-bottom: 4px;
  }

  .bc-popup-meta {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 4px;
  }

  .bc-popup-rarity {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .bc-popup-xp {
    font-size: 0.65rem;
    color: #86efac;
    font-weight: 600;
  }

  /* Dark mode */
  .dark-mode .bc-card {
    background: #1e293b;
  }
  .dark-mode .bc-name { color: #e2e8f0; }
  .dark-mode .bc-detail-popup {
    background: #0f172a;
  }
  .dark-mode .bc-detail-popup::after {
    border-top-color: #0f172a;
  }

  @media (max-width: 640px) {
    .bc-card {
      min-width: 76px;
      max-width: 100px;
      padding: 8px 4px 6px;
    }
    .bc-emoji { font-size: 1.6rem; }
  }
`;

export default function BadgeCard({ badge, onClick, showDetails = true }) {
  const [hovered, setHovered] = useState(false);
  if (!badge) return null;

  const { name, emoji, rarity = 'common', description, earned, earnedAt, xpBonus } = badge;
  const rs = RARITY_STYLES[rarity] || RARITY_STYLES.common;

  const cardStyle = earned
    ? { border: rs.border, boxShadow: rs.boxShadow }
    : { border: '1px solid #e2e8f0' };

  function handleClick() {
    if (earned && onClick) onClick(badge);
  }

  function handleKey(e) {
    if ((e.key === 'Enter' || e.key === ' ') && earned && onClick) {
      e.preventDefault();
      onClick(badge);
    }
  }

  return (
    <div
      className={`bc-card${earned ? '' : ' bc-locked'}`}
      style={cardStyle}
      onClick={handleClick}
      onKeyDown={handleKey}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      tabIndex={earned ? 0 : -1}
      role={earned ? 'button' : 'img'}
      aria-label={earned ? `${name} badge` : `Locked badge`}
      title={earned ? name : 'Locked'}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <span className="bc-emoji" aria-hidden="true">
        {earned
          ? emoji
          : <img src="/icons/lock.svg" alt="" width={24} height={24} style={{ opacity: 0.5 }} />}
      </span>
      {!earned && <span className="bc-lock-overlay">Locked</span>}

      {showDetails && (
        <>
          <span className="bc-name">{earned ? name : '???'}</span>
          <span className="bc-rarity-label" style={{ color: rs.color }}>
            {rs.label}
          </span>
        </>
      )}

      {hovered && earned && showDetails && (
        <div className="bc-detail-popup" role="tooltip">
          <div className="bc-popup-name">{name}</div>
          {description && <div className="bc-popup-desc">{description}</div>}
          <div className="bc-popup-meta">
            <span className="bc-popup-rarity" style={{ color: rs.color }}>{rs.label}</span>
            {xpBonus > 0 && <span className="bc-popup-xp">+{xpBonus} XP</span>}
            {earnedAt && (
              <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>
                {new Date(earnedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
