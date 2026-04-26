/**
 * ActivityCompleteModal.jsx
 * Celebration modal shown when a kid completes an activity.
 * Includes confetti animation, stars earned, and optional badge notification.
 */

import React, { useEffect, useRef, useCallback } from 'react';

/* ── Confetti (same palette as BadgeUnlockModal) ──────────────────────────── */
const CONFETTI_COLORS = [
  '#7c3aed', '#a855f7', '#06b6d4', '#0891b2',
  '#16a34a', '#22c55e', '#fbbf24', '#f59e0b',
  '#e879f9', '#34d399',
];

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function ConfettiCanvas() {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const prefersReduced = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  useEffect(() => {
    if (prefersReduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles = Array.from({ length: 80 }, () => ({
      x:        randomBetween(0, canvas.width),
      y:        randomBetween(-canvas.height * 0.5, 0),
      w:        randomBetween(7, 13),
      h:        randomBetween(5, 9),
      color:    CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rot:      randomBetween(0, 360),
      rotSpeed: randomBetween(-4, 4),
      vy:       randomBetween(3, 7),
      vx:       randomBetween(-1.5, 1.5),
    }));

    let frame = 0;
    const TOTAL_FRAMES = 140;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.save();
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = frame < TOTAL_FRAMES ? 1 : Math.max(0, 1 - (frame - TOTAL_FRAMES) / 20);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
        p.y += p.vy;
        p.x += p.vx;
        p.rot += p.rotSpeed;
        if (p.y > canvas.height + 20 && frame < TOTAL_FRAMES) {
          p.y = randomBetween(-60, -10);
          p.x = randomBetween(0, canvas.width);
        }
      });
      frame++;
      rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [prefersReduced]);

  if (prefersReduced) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        borderRadius: 'inherit',
      }}
    />
  );
}

/* ── Celebration sound ────────────────────────────────────────────────────── */
function playCelebrationSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx   = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type            = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch (_) {}
}

/* ── Styles ───────────────────────────────────────────────────────────────── */
const STYLES = `
  .acm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15,23,42,.65);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1200;
    padding: 1rem;
  }

  .acm-card {
    background: #ffffff;
    border-radius: 20px;
    padding: 2rem 1.75rem 1.75rem;
    max-width: 380px;
    width: 100%;
    text-align: center;
    position: relative;
    overflow: hidden;
    box-shadow: 0 24px 48px rgba(0,0,0,.18);
    animation: acm-pop .3s cubic-bezier(.34,1.56,.64,1);
  }

  .dark-mode .acm-card {
    background: #1e293b;
  }

  @keyframes acm-pop {
    from { transform: scale(.85); opacity: 0; }
    to   { transform: scale(1);   opacity: 1; }
  }

  .acm-congrats {
    font-size: .78rem;
    font-weight: 700;
    color: #059669;
    text-transform: uppercase;
    letter-spacing: .08em;
    margin: 0 0 .25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .3rem;
  }

  .acm-title {
    font-size: 1.35rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 .75rem;
    line-height: 1.2;
  }

  .dark-mode .acm-title {
    color: #f1f5f9;
  }

  .acm-stars-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .6rem;
    margin: 0 0 .75rem;
  }

  .acm-star-count {
    font-size: 2.2rem;
    font-weight: 900;
    color: #d97706;
    line-height: 1;
  }

  .acm-star-label {
    font-size: .82rem;
    font-weight: 600;
    color: #64748b;
  }

  .dark-mode .acm-star-label {
    color: #94a3b8;
  }

  .acm-message {
    font-size: .9rem;
    color: #475569;
    line-height: 1.55;
    margin: 0 0 1rem;
  }

  .dark-mode .acm-message {
    color: #94a3b8;
  }

  .acm-badge-unlock {
    background: #ede9fe;
    border-radius: 10px;
    padding: .65rem .9rem;
    margin: 0 0 1rem;
    display: flex;
    align-items: center;
    gap: .65rem;
    text-align: left;
  }

  .dark-mode .acm-badge-unlock {
    background: #1e1a3f;
  }

  .acm-badge-icon-wrap {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: #7c3aed22;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .acm-badge-icon {
    width: 22px;
    height: 22px;
  }

  .acm-badge-unlock-text {
    flex: 1;
  }

  .acm-badge-unlock-label {
    font-size: .68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: #7c3aed;
    margin-bottom: .15rem;
  }

  .acm-badge-name {
    font-size: .85rem;
    font-weight: 700;
    color: #0f172a;
  }

  .dark-mode .acm-badge-name {
    color: #f1f5f9;
  }

  .acm-keep-going {
    width: 100%;
    padding: .75rem;
    border: none;
    border-radius: 12px;
    background: #4f46e5;
    color: #ffffff;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: background .15s, transform .12s;
    margin-top: .25rem;
  }

  .acm-keep-going:hover {
    background: #4338ca;
    transform: scale(1.02);
  }

  .acm-keep-going:active {
    transform: scale(.98);
  }

  .acm-close-btn {
    position: absolute;
    top: .75rem;
    right: .75rem;
    background: none;
    border: none;
    font-size: 1.2rem;
    color: #94a3b8;
    cursor: pointer;
    padding: .2rem .4rem;
    border-radius: 6px;
    line-height: 1;
  }

  .acm-close-btn:hover {
    color: #0f172a;
    background: #f1f5f9;
  }

  .dark-mode .acm-close-btn:hover {
    color: #f1f5f9;
    background: #334155;
  }
`;

const ENCOURAGING_MESSAGES = [
  "Every activity makes you stronger!",
  "You're building your resilience, one step at a time.",
  "Amazing work — keep it up!",
  "You did something hard today. That's real courage.",
  "Look at you go! Another step on your resilience journey.",
  "You showed up today. That matters.",
];

/**
 * ActivityCompleteModal
 *
 * Props:
 *   starsEarned  {number}   Stars awarded for this activity
 *   extraStars   {number}   Bonus stars (e.g. dimension complete)
 *   dimComplete  {boolean}  Whether a dimension was just completed
 *   newBadge     {object}   Optional newly unlocked badge { name, icon, description }
 *   onClose      {function} Dismiss handler
 *   soundOn      {boolean}  Whether to play sound (default true)
 */
export default function ActivityCompleteModal({
  starsEarned  = 3,
  extraStars   = 0,
  dimComplete  = false,
  newBadge     = null,
  onClose,
  soundOn      = true,
}) {
  const message = ENCOURAGING_MESSAGES[Math.floor(Math.random() * ENCOURAGING_MESSAGES.length)];
  const totalStars = starsEarned + extraStars;

  useEffect(() => {
    if (soundOn) playCelebrationSound();
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [soundOn]);

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <>
      <style>{STYLES}</style>
      <div
        className="acm-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Activity completed!"
        onClick={handleBackdrop}
      >
        <div className="acm-card" onClick={e => e.stopPropagation()}>
          <ConfettiCanvas />

          <button className="acm-close-btn" onClick={onClose} aria-label="Close">&#x2715;</button>

          <p className="acm-congrats">
            <img src="/icons/success.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle' }} />
            {dimComplete ? 'Dimension Complete!' : 'Activity Complete!'}
          </p>

          <h2 className="acm-title">
            {dimComplete ? 'You finished a whole dimension!' : 'You did it!'}
          </h2>

          {/* Stars earned */}
          <div className="acm-stars-row" aria-live="polite">
            <img src="/icons/star.svg" alt="" aria-hidden="true" width={36} height={36} />
            <div>
              <div className="acm-star-count">+{totalStars}</div>
              <div className="acm-star-label">stars earned</div>
            </div>
          </div>

          {extraStars > 0 && (
            <p style={{ fontSize: '.78rem', color: '#059669', fontWeight: 600, margin: '0 0 .5rem' }}>
              <img src="/icons/badges.svg" alt="" aria-hidden="true" width={13} height={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Includes +{extraStars} bonus stars for completing a dimension!
            </p>
          )}

          <p className="acm-message">{message}</p>

          {/* Badge unlock notification */}
          {newBadge && (
            <div className="acm-badge-unlock" aria-live="assertive">
              <div className="acm-badge-icon-wrap" style={{ background: (newBadge.border || '#7c3aed') + '22' }}>
                <img
                  src={newBadge.icon}
                  alt=""
                  aria-hidden="true"
                  className="acm-badge-icon"
                />
              </div>
              <div className="acm-badge-unlock-text">
                <p className="acm-badge-unlock-label">Badge Unlocked!</p>
                <p className="acm-badge-name">{newBadge.name}</p>
              </div>
            </div>
          )}

          <button className="acm-keep-going" onClick={onClose} autoFocus>
            Keep Going!
          </button>
        </div>
      </div>
    </>
  );
}
