import React, { useEffect, useRef, useCallback } from 'react';

/* ── Confetti colours (branded: purples, teals, greens) ── */
const CONFETTI_COLORS = [
  '#7c3aed', '#a855f7', '#06b6d4', '#0891b2',
  '#16a34a', '#22c55e', '#fbbf24', '#f59e0b',
  '#e879f9', '#34d399',
];

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

/**
 * ConfettiCanvas — draws animated confetti particles on a canvas overlay.
 * Respects prefers-reduced-motion.
 */
function ConfettiCanvas() {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (prefersReduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const PARTICLE_COUNT = 90;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x:     randomBetween(0, canvas.width),
      y:     randomBetween(-canvas.height * 0.5, 0),
      w:     randomBetween(7, 14),
      h:     randomBetween(5, 10),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rot:   randomBetween(0, 360),
      rotSpeed: randomBetween(-4, 4),
      vy:    randomBetween(3, 7),
      vx:    randomBetween(-1.5, 1.5),
    }));

    let frame = 0;
    const TOTAL_FRAMES = 150; // ~5 s at 30 fps

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

        p.y   += p.vy;
        p.x   += p.vx;
        p.rot += p.rotSpeed;

        // Loop particles that fall off the bottom
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
      className="kg-confetti-canvas"
      aria-hidden="true"
    />
  );
}

/**
 * playCelebrationSound — generates a short celebratory chime via Web Audio API.
 * No external audio file required.
 */
function playCelebrationSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type      = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.35, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch (_) {
    // Silently ignore — audio is optional
  }
}

/**
 * BadgeUnlockModal
 *
 * Props:
 *   badge      — badge object { emoji, label, desc, color, border }
 *   nextHint   — string describing the next badge to earn (optional)
 *   onClose    — callback to dismiss the modal
 *   soundOn    — boolean (default true): whether to play the celebration sound
 */
export default function BadgeUnlockModal({ badge, nextHint, onClose, soundOn = true }) {
  // Play sound once on mount
  useEffect(() => {
    if (soundOn) playCelebrationSound();
  }, [soundOn]);

  // Close on Escape key
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  if (!badge) return null;

  return (
    <div
      className="kg-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Badge unlocked: ${badge.label}`}
      onClick={onClose}
    >
      {/* Confetti behind modal */}
      <ConfettiCanvas />

      <div
        className="kg-modal-card"
        onClick={e => e.stopPropagation()}
        style={{ borderColor: badge.border }}
      >
        {/* Animated badge icon */}
        <div
          className="kg-modal-badge-icon"
          style={{ background: badge.color, borderColor: badge.border }}
          aria-hidden="true"
        >
          {badge.emoji}
        </div>

        <p className="kg-modal-congrats">🎉 Congratulations!</p>
        <h2 className="kg-modal-title">You earned:</h2>
        <p className="kg-modal-badge-name" style={{ color: badge.border }}>
          {badge.label}
        </p>
        <p className="kg-modal-desc">{badge.desc}</p>

        {nextHint && (
          <div className="kg-modal-next-hint">
            <span aria-hidden="true">🎯</span> Next badge: {nextHint}
          </div>
        )}

        <button
          className="kg-modal-close-btn"
          onClick={onClose}
          autoFocus
          style={{ background: badge.border }}
        >
          Awesome! ✨
        </button>
      </div>
    </div>
  );
}
