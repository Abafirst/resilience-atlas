/**
 * BadgeUnlockModal.jsx
 * Full-screen celebration modal shown when one or more badges are unlocked.
 * Uses the same confetti animation pattern as ActivityCompleteModal.jsx.
 */

import React, { useEffect, useRef, useCallback } from 'react';

// ── Confetti ──────────────────────────────────────────────────────────────────

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
  const prefersReduced =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  useEffect(() => {
    if (prefersReduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles = Array.from({ length: 90 }, () => ({
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
    const TOTAL_FRAMES = 150;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.save();
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle   = p.color;
        ctx.globalAlpha = frame < TOTAL_FRAMES ? 1 : Math.max(0, 1 - (frame - TOTAL_FRAMES) / 20);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
        p.y   += p.vy;
        p.x   += p.vx;
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

// ── Celebration sound ─────────────────────────────────────────────────────────

let _sharedAudioCtx = null;

function getAudioContext() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!_sharedAudioCtx || _sharedAudioCtx.state === 'closed') {
      _sharedAudioCtx = new AudioCtx();
    }
    return _sharedAudioCtx;
  } catch (_) {
    return null;
  }
}

function playCelebrationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
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

// ── Styles ────────────────────────────────────────────────────────────────────

const STYLES = `
  .bum-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15,23,42,.72);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1300;
    padding: 1rem;
  }

  .bum-card {
    background: #ffffff;
    border-radius: 22px;
    padding: 2.25rem 2rem 2rem;
    max-width: 400px;
    width: 100%;
    text-align: center;
    position: relative;
    overflow: hidden;
    box-shadow: 0 28px 56px rgba(0,0,0,.2);
    animation: bum-pop .35s cubic-bezier(.34,1.56,.64,1);
  }

  .dark-mode .bum-card {
    background: #1e293b;
  }

  @keyframes bum-pop {
    from { transform: scale(.8); opacity: 0; }
    to   { transform: scale(1);  opacity: 1; }
  }

  .bum-kicker {
    font-size: .75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: #7c3aed;
    margin: 0 0 .35rem;
  }

  .bum-title {
    font-size: 1.5rem;
    font-weight: 900;
    color: #0f172a;
    margin: 0 0 .2rem;
    line-height: 1.15;
  }

  .dark-mode .bum-title {
    color: #f1f5f9;
  }

  .bum-badge-icon-wrap {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    background: #ede9fe;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 1.25rem auto .9rem;
    animation: bum-bounce .5s cubic-bezier(.34,1.56,.64,1) .15s both;
  }

  .dark-mode .bum-badge-icon-wrap {
    background: #2e1a5c;
  }

  @keyframes bum-bounce {
    from { transform: scale(.5) rotate(-12deg); opacity: 0; }
    to   { transform: scale(1)  rotate(0deg);   opacity: 1; }
  }

  .bum-badge-icon {
    width: 52px;
    height: 52px;
  }

  .bum-badge-name {
    font-size: 1.15rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 .35rem;
  }

  .dark-mode .bum-badge-name {
    color: #f1f5f9;
  }

  .bum-badge-desc {
    font-size: .88rem;
    color: #475569;
    line-height: 1.55;
    margin: 0 0 1rem;
    max-width: 300px;
    margin-left: auto;
    margin-right: auto;
  }

  .dark-mode .bum-badge-desc {
    color: #94a3b8;
  }

  .bum-xp-pill {
    display: inline-flex;
    align-items: center;
    gap: .35rem;
    background: #fef3c7;
    color: #92400e;
    border-radius: 20px;
    padding: .35rem .85rem;
    font-size: .85rem;
    font-weight: 700;
    margin-bottom: 1.25rem;
  }

  .dark-mode .bum-xp-pill {
    background: #3d2806;
    color: #fcd34d;
  }

  .bum-counter {
    font-size: .78rem;
    color: #94a3b8;
    margin-bottom: 1rem;
  }

  .bum-btn {
    width: 100%;
    padding: .8rem;
    border: none;
    border-radius: 14px;
    background: #7c3aed;
    color: #ffffff;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: background .15s, transform .12s;
  }

  .bum-btn:hover  { background: #6d28d9; transform: scale(1.02); }
  .bum-btn:active { transform: scale(.98); }

  .bum-close-btn {
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

  .bum-close-btn:hover {
    color: #0f172a;
    background: #f1f5f9;
  }

  .dark-mode .bum-close-btn:hover {
    color: #f1f5f9;
    background: #334155;
  }
`;

/**
 * BadgeUnlockModal
 *
 * Props:
 *   badges   {Array}    Array of badge objects: { badgeId, name, description, icon, xpReward }
 *   onClose  {Function} Called when the modal is dismissed
 */
export default function BadgeUnlockModal({ badges = [], onClose }) {
  const [index, setIndex] = React.useState(0);

  const badge = badges[index] || null;

  useEffect(() => {
    playCelebrationSound();
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [index]);

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

  function handleNext() {
    if (index < badges.length - 1) {
      setIndex(i => i + 1);
    } else {
      onClose();
    }
  }

  if (!badge) return null;

  return (
    <>
      <style>{STYLES}</style>
      <div
        className="bum-overlay"
        role="dialog"
        aria-modal="true"
        aria-label={`Badge unlocked: ${badge.name || badge.badgeId}`}
        onClick={handleBackdrop}
      >
        <div className="bum-card" onClick={e => e.stopPropagation()}>
          <ConfettiCanvas />

          <button className="bum-close-btn" onClick={onClose} aria-label="Close">&#x2715;</button>

          <p className="bum-kicker">🏆 Badge Unlocked!</p>
          <h2 className="bum-title">You earned a badge!</h2>

          <div className="bum-badge-icon-wrap" role="img" aria-label={badge.name || badge.badgeId}>
            <img
              src={badge.icon || `/icons/badges/${badge.badgeId}.svg`}
              alt=""
              aria-hidden="true"
              className="bum-badge-icon"
            />
          </div>

          <p className="bum-badge-name">{badge.name || badge.badgeId}</p>

          {badge.description && (
            <p className="bum-badge-desc">{badge.description}</p>
          )}

          {badge.xpReward > 0 && (
            <div className="bum-xp-pill" aria-label={`${badge.xpReward} XP earned`}>
              ⭐ +{badge.xpReward} XP
            </div>
          )}

          {badges.length > 1 && (
            <p className="bum-counter" aria-live="polite">
              Badge {index + 1} of {badges.length}
            </p>
          )}

          <button className="bum-btn" onClick={handleNext} autoFocus>
            {index < badges.length - 1 ? 'Next Badge →' : 'Awesome!'}
          </button>
        </div>
      </div>
    </>
  );
}
