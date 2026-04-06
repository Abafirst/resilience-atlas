import React, { useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import ConfettiCelebration from './ConfettiCelebration.jsx';
import { playBadgeUnlockSound } from '../../utils/soundEffects.js';

/* ── Rarity styling ──────────────────────────────────────────────────────── */
const RARITY_CONFIG = {
  common:    { label: 'Bronze',   accent: '#92400e', bg: '#fef3c7', glow: 'rgba(180,120,0,0.35)'   },
  uncommon:  { label: 'Silver',   accent: '#475569', bg: '#f1f5f9', glow: 'rgba(100,116,139,0.4)'  },
  rare:      { label: 'Gold',     accent: '#1d4ed8', bg: '#eff6ff', glow: 'rgba(59,130,246,0.4)'   },
  legendary: { label: 'Platinum', accent: '#7e22ce', bg: '#fdf4ff', glow: 'rgba(168,85,247,0.5)'   },
};

const KEYFRAMES = `
  @keyframes gam-badge-pop {
    0%   { transform: scale(0.3) rotate(-10deg); opacity: 0; }
    60%  { transform: scale(1.15) rotate(3deg);  opacity: 1; }
    80%  { transform: scale(0.95) rotate(-1deg); }
    100% { transform: scale(1) rotate(0deg); }
  }
  @keyframes gam-overlay-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes gam-card-in {
    from { opacity: 0; transform: translateY(40px) scale(0.92); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
`;

/**
 * AchievementNotification — modal overlay shown when a badge is unlocked.
 * Plays a celebration sound and renders confetti in the background.
 *
 * Props:
 *   badge    — badge object { name, icon, rarity, description } (required)
 *   onClose  — callback to dismiss the modal (required)
 */
export default function AchievementNotification({ badge, onClose }) {
  /* Inject animation keyframes once */
  useEffect(() => {
    if (!document.getElementById('gam-achievement-styles')) {
      const style = document.createElement('style');
      style.id = 'gam-achievement-styles';
      style.textContent = KEYFRAMES;
      document.head.appendChild(style);
    }
  }, []);

  /* Play celebration sound on mount */
  useEffect(() => {
    if (badge) playBadgeUnlockSound();
  }, [badge]);

  /* Close on Escape key */
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  if (!badge) return null;

  const cfg = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.common;

  return ReactDOM.createPortal(
    <>
      {/* Confetti behind everything */}
      <ConfettiCelebration active={!!badge} />

      {/* Modal overlay */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Achievement unlocked: ${badge.name}`}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.72)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9995,
          animation: 'gam-overlay-in 0.25s ease',
          padding: '16px',
        }}
      >
        {/* Card */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: cfg.bg,
            border: `2px solid ${cfg.accent}44`,
            borderRadius: 20,
            padding: '36px 32px 28px',
            maxWidth: 360,
            width: '100%',
            textAlign: 'center',
            boxShadow: `0 20px 60px ${cfg.glow}, 0 4px 24px rgba(0,0,0,0.25)`,
            animation: 'gam-card-in 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
          }}
        >
          {/* Rarity badge */}
          <div style={{
            display: 'inline-block',
            background: `${cfg.accent}18`,
            color: cfg.accent,
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            padding: '3px 12px',
            borderRadius: 999,
            marginBottom: 20,
          }}>
            {cfg.label} Tier
          </div>

          {/* Badge icon */}
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: `${cfg.accent}1a`,
            border: `3px solid ${cfg.accent}44`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: `0 0 32px ${cfg.glow}`,
            animation: 'gam-badge-pop 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.1s both',
          }} aria-hidden="true">
            <img src={badge.icon} alt="" width={44} height={44} />
          </div>

          {/* Text */}
          <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: cfg.accent }}>
            🎉 Badge Unlocked!
          </p>
          <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
            {badge.name}
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: 13, color: '#475569', lineHeight: 1.55 }}>
            {badge.description}
          </p>

          {/* Close button */}
          <button
            autoFocus
            onClick={onClose}
            style={{
              background: `linear-gradient(135deg, ${cfg.accent}, ${cfg.accent}cc)`,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '11px 32px',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: `0 4px 14px ${cfg.glow}`,
              width: '100%',
            }}
          >
            Awesome! 🏆
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
