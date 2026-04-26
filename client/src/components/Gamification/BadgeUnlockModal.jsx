/**
 * BadgeUnlockModal.jsx
 * Animated modal for badge unlock celebration.
 * Accessible: role=dialog, aria-modal, focus trap, Escape key closes.
 */

import React, { useEffect, useRef } from 'react';

const RARITY_COLORS = {
  legendary: '#eab308',
  epic:      '#7c3aed',
  rare:      '#3b82f6',
  uncommon:  '#10b981',
  common:    '#64748b',
};

const STYLES = `
  @keyframes bum-overlay-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes bum-card-in {
    from { opacity: 0; transform: translateY(40px) scale(0.92); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes bum-emoji-zoom {
    0%   { transform: scale(0); }
    70%  { transform: scale(1.2); }
    100% { transform: scale(1); }
  }

  @keyframes bum-glow-pulse {
    0%, 100% { box-shadow: var(--bum-glow); }
    50%       { box-shadow: var(--bum-glow-strong); }
  }

  @media (prefers-reduced-motion: reduce) {
    .bum-overlay { animation: none !important; }
    .bum-card    { animation: none !important; }
    .bum-emoji   { animation: none !important; }
  }

  .bum-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.75);
    z-index: 9000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    box-sizing: border-box;
    animation: bum-overlay-in 0.25s ease;
  }

  .bum-card {
    background: #fff;
    border-radius: 20px;
    padding: 32px 24px 24px;
    max-width: 360px;
    width: 100%;
    text-align: center;
    position: relative;
    animation: bum-card-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-sizing: border-box;
  }

  .bum-subtitle-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-bottom: 12px;
  }

  .bum-unlock-label {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #64748b;
  }

  .bum-emoji {
    font-size: 4.5rem;
    line-height: 1;
    display: block;
    margin: 0 auto 12px;
    animation: bum-emoji-zoom 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
  }

  .bum-name {
    font-size: 1.4rem;
    font-weight: 800;
    color: #1e293b;
    margin-bottom: 6px;
    line-height: 1.2;
  }

  .bum-description {
    font-size: 0.9rem;
    color: #64748b;
    line-height: 1.5;
    margin-bottom: 12px;
  }

  .bum-meta {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 20px;
  }

  .bum-rarity-badge {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 3px 10px;
    border-radius: 999px;
    color: #fff;
  }

  .bum-xp-badge {
    font-size: 0.8rem;
    font-weight: 700;
    color: #059669;
    background: #ecfdf5;
    padding: 3px 10px;
    border-radius: 999px;
  }

  .bum-continue-btn {
    width: 100%;
    padding: 12px 0;
    border-radius: 10px;
    border: none;
    font-size: 1rem;
    font-weight: 700;
    color: #fff;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.15s;
    letter-spacing: 0.02em;
  }

  .bum-continue-btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .bum-continue-btn:active {
    transform: translateY(0);
  }

  .bum-close-btn {
    position: absolute;
    top: 12px;
    right: 14px;
    background: none;
    border: none;
    font-size: 1.2rem;
    color: #94a3b8;
    cursor: pointer;
    padding: 4px;
    line-height: 1;
    border-radius: 4px;
    transition: color 0.15s;
  }

  .bum-close-btn:hover { color: #475569; }

  /* Dark mode */
  .dark-mode .bum-card {
    background: #1e293b;
  }
  .dark-mode .bum-name { color: #f1f5f9; }
  .dark-mode .bum-description { color: #94a3b8; }
  .dark-mode .bum-unlock-label { color: #64748b; }
  .dark-mode .bum-close-btn { color: #64748b; }
  .dark-mode .bum-xp-badge { background: #064e3b; color: #6ee7b7; }

  @media (max-width: 640px) {
    .bum-card { padding: 24px 16px 20px; }
    .bum-emoji { font-size: 3.5rem; }
    .bum-name { font-size: 1.2rem; }
  }
`;

export default function BadgeUnlockModal({ badge, onClose }) {
  const cardRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!badge) return;
    const prev = document.activeElement;
    setTimeout(() => closeRef.current?.focus(), 50);

    function onKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && cardRef.current) {
        const focusable = cardRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus();
    };
  }, [badge, onClose]);

  if (!badge) return null;

  const { name, emoji, rarity = 'common', description, xpBonus } = badge;
  const color = RARITY_COLORS[rarity] || RARITY_COLORS.common;
  const rarityLabel = rarity.charAt(0).toUpperCase() + rarity.slice(1);

  return (
    <div className="bum-overlay" role="dialog" aria-modal="true" aria-labelledby="bum-title">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div
        className="bum-card"
        ref={cardRef}
        style={{
          '--bum-glow': `0 0 20px ${color}50`,
          '--bum-glow-strong': `0 0 36px ${color}80`,
          boxShadow: `0 0 24px ${color}55`,
          border: `2px solid ${color}`,
        }}
      >
        <button
          className="bum-close-btn"
          ref={closeRef}
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="bum-subtitle-row">
          <span className="bum-unlock-label">Badge Unlocked!</span>
        </div>

        <span className="bum-emoji" role="img" aria-label={name}>{emoji}</span>

        <div id="bum-title" className="bum-name">{name}</div>
        {description && <div className="bum-description">{description}</div>}

        <div className="bum-meta">
          <span className="bum-rarity-badge" style={{ background: color }}>
            {rarityLabel}
          </span>
          {xpBonus > 0 && (
            <span className="bum-xp-badge">+{xpBonus} XP Bonus</span>
          )}
        </div>

        <button
          className="bum-continue-btn"
          style={{ background: color }}
          onClick={onClose}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
