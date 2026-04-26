import React, { useEffect, useRef } from 'react';

/* ── Branded confetti color palette ──────────────────────────────────────── */
const CONFETTI_COLORS = [
  '#7c3aed', '#a855f7', '#06b6d4', '#0891b2',
  '#16a34a', '#22c55e', '#fbbf24', '#f59e0b',
  '#e879f9', '#34d399',
];

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

/**
 * ConfettiCelebration — renders an animated confetti overlay in a portal-less
 * fixed canvas when `active` is true.  Automatically stops after ~6 s.
 *
 * Props:
 *   active — boolean: show confetti when true
 */
export default function ConfettiCelebration({ active }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  useEffect(() => {
    if (!active) return;

    /* Respect reduced-motion preference */
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const PARTICLE_COUNT = 100;
    const TOTAL_FRAMES   = 180; // ≈ 6 s at 30 fps
    let frame = 0;

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x:        randomBetween(0, canvas.width),
      y:        randomBetween(-canvas.height * 0.5, 0),
      w:        randomBetween(8, 15),
      h:        randomBetween(5, 11),
      color:    CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rot:      randomBetween(0, 360),
      rotSpeed: randomBetween(-4, 4),
      vy:       randomBetween(3, 7),
      vx:       randomBetween(-1.5, 1.5),
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const alpha = frame < TOTAL_FRAMES ? 1 : Math.max(0, 1 - (frame - TOTAL_FRAMES) / 30);

      particles.forEach(p => {
        ctx.save();
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle   = p.color;
        ctx.globalAlpha = alpha;
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
      if (alpha > 0) {
        rafRef.current = requestAnimationFrame(draw);
      }
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9990,
        display: active ? 'block' : 'none',
      }}
    />
  );
}
