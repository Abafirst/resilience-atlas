/**
 * LevelUpModal.jsx
 * Full-screen celebration modal for level-up events.
 * Keyboard accessible, respects prefers-reduced-motion.
 */

import React, { useEffect, useRef } from 'react';

const STYLES = `
  @keyframes lum-overlay-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes lum-title-zoom {
    0%   { opacity: 0; transform: scale(0.5); }
    70%  { transform: scale(1.08); }
    100% { opacity: 1; transform: scale(1); }
  }

  @keyframes lum-badge-in {
    0%   { opacity: 0; transform: scale(0) rotate(-15deg); }
    70%  { transform: scale(1.15) rotate(3deg); }
    100% { opacity: 1; transform: scale(1) rotate(0deg); }
  }

  @keyframes lum-float {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-8px); }
  }

  @keyframes lum-arrow-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.5; }
  }

  @media (prefers-reduced-motion: reduce) {
    .lum-overlay    { animation: none !important; }
    .lum-title      { animation: none !important; }
    .lum-new-badge  { animation: none !important; }
  }

  .lum-overlay {
    position: fixed;
    inset: 0;
    z-index: 9100;
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    box-sizing: border-box;
    animation: lum-overlay-in 0.3s ease;
    overflow-y: auto;
  }

  .lum-stars {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 0;
  }

  .lum-star {
    position: absolute;
    width: 3px;
    height: 3px;
    background: #fff;
    border-radius: 50%;
    opacity: 0.5;
  }

  .lum-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    text-align: center;
    max-width: 420px;
    width: 100%;
  }

  .lum-title {
    font-size: 3rem;
    font-weight: 900;
    color: #fbbf24;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    line-height: 1;
    text-shadow: 0 0 30px rgba(251,191,36,0.6);
    animation: lum-title-zoom 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both;
  }

  .lum-subtitle {
    font-size: 1.1rem;
    color: #a5b4fc;
    font-weight: 500;
  }

  .lum-transition-row {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .lum-old-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    opacity: 0.6;
  }

  .lum-badge-circle {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    font-weight: 700;
    box-shadow: 0 4px 16px rgba(0,0,0,0.35);
  }

  .lum-badge-label {
    font-size: 0.7rem;
    color: #94a3b8;
    font-weight: 600;
  }

  .lum-arrow {
    font-size: 2rem;
    color: #fbbf24;
    animation: lum-arrow-pulse 1s ease infinite;
  }

  .lum-new-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    animation: lum-badge-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both;
  }

  .lum-new-badge .lum-badge-circle {
    width: 88px;
    height: 88px;
    font-size: 2.4rem;
    box-shadow: 0 0 30px var(--lum-new-color, rgba(255,255,255,0.3));
  }

  .lum-new-title {
    font-size: 1.6rem;
    font-weight: 800;
    color: #f1f5f9;
    line-height: 1.2;
  }

  .lum-new-label {
    font-size: 0.72rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
  }

  .lum-awesome-btn {
    margin-top: 8px;
    padding: 14px 36px;
    border-radius: 12px;
    border: none;
    background: #fbbf24;
    color: #1e1b4b;
    font-size: 1.1rem;
    font-weight: 800;
    cursor: pointer;
    letter-spacing: 0.04em;
    transition: opacity 0.15s, transform 0.15s;
    box-shadow: 0 4px 16px rgba(251,191,36,0.4);
  }

  .lum-awesome-btn:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }

  .lum-awesome-btn:active {
    transform: translateY(0);
  }

  @media (max-width: 640px) {
    .lum-title { font-size: 2.2rem; }
    .lum-new-badge .lum-badge-circle { width: 72px; height: 72px; font-size: 2rem; }
    .lum-new-title { font-size: 1.3rem; }
    .lum-badge-circle { width: 52px; height: 52px; font-size: 1.4rem; }
  }
`;

const STAR_POSITIONS = Array.from({ length: 30 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top:  `${(i * 29 + 7) % 100}%`,
  opacity: (((i * 13) % 7) + 3) / 10,
}));

export default function LevelUpModal({ levelUp, onClose }) {
  const btnRef = useRef(null);

  useEffect(() => {
    if (!levelUp) return;
    const prev = document.activeElement;
    setTimeout(() => btnRef.current?.focus(), 100);

    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus();
    };
  }, [levelUp, onClose]);

  if (!levelUp) return null;

  const { from, to } = levelUp;

  return (
    <div className="lum-overlay" role="dialog" aria-modal="true" aria-labelledby="lum-title">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="lum-stars" aria-hidden="true">
        {STAR_POSITIONS.map((pos, i) => (
          <div key={i} className="lum-star" style={pos} />
        ))}
      </div>

      <div className="lum-content">
        <div id="lum-title" className="lum-title">⬆ Level Up!</div>
        <div className="lum-subtitle">You've reached a new level of resilience</div>

        <div className="lum-transition-row">
          <div className="lum-old-badge">
            <div
              className="lum-badge-circle"
              style={{ background: from.color }}
              aria-label={`Previous level: ${from.title}`}
            >
              {from.icon}
            </div>
            <span className="lum-badge-label">Lv.{from.level} {from.title}</span>
          </div>

          <div className="lum-arrow" aria-hidden="true">→</div>

          <div className="lum-new-badge" style={{ '--lum-new-color': `${to.color}60` }}>
            <div
              className="lum-badge-circle"
              style={{ background: to.color, boxShadow: `0 0 30px ${to.color}80` }}
              aria-label={`New level: ${to.title}`}
            >
              {to.icon}
            </div>
            <span className="lum-new-label">New Level</span>
            <div className="lum-new-title">{to.title}</div>
          </div>
        </div>

        {!to.isMax && to.xpToNext > 0 && (
          <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            Next level: <strong style={{ color: '#cbd5e1' }}>{to.xpToNext.toLocaleString()} XP</strong> needed
          </div>
        )}

        <button
          className="lum-awesome-btn"
          ref={btnRef}
          onClick={onClose}
        >
          Awesome! 🎉
        </button>
      </div>
    </div>
  );
}
