/**
 * confettiAnimation.js
 * Canvas-based confetti burst utility.
 * Respects prefers-reduced-motion.
 */

const COLORS = ['#4f46e5', '#7c3aed', '#db2777', '#f97316', '#eab308', '#059669', '#0891b2'];

/**
 * Launch a confetti burst on a full-screen canvas overlay.
 * @param {Object} opts
 * @param {number} [opts.count=120]     - Number of particles
 * @param {number} [opts.duration=2500] - Animation duration in ms
 * @param {number} [opts.originY=0.7]   - Vertical origin (0=top, 1=bottom)
 */
export function launchConfetti({ count = 120, duration = 2500, originY = 0.7 } = {}) {
  // Respect reduced motion preference
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = [
    'position:fixed', 'inset:0', 'width:100%', 'height:100%',
    'pointer-events:none', 'z-index:99999',
  ].join(';');
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = Array.from({ length: count }, () => ({
    x: canvas.width * (0.3 + Math.random() * 0.4),
    y: canvas.height * originY,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    r: 4 + Math.random() * 4,
    vx: (Math.random() - 0.5) * 14,
    vy: -(8 + Math.random() * 10),
    gravity: 0.35 + Math.random() * 0.15,
    alpha: 1,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.2,
    shape: Math.random() > 0.5 ? 'rect' : 'circle',
    w: 6 + Math.random() * 6,
    h: 3 + Math.random() * 4,
  }));

  const startTime = performance.now();

  function draw(now) {
    const elapsed = now - startTime;
    if (elapsed > duration) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const fadeStart = duration * 0.65;
    const globalAlpha = elapsed > fadeStart
      ? 1 - (elapsed - fadeStart) / (duration - fadeStart)
      : 1;

    for (const p of particles) {
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.99;
      p.rotation += p.rotationSpeed;

      ctx.save();
      ctx.globalAlpha = Math.max(0, globalAlpha * p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      if (p.shape === 'rect') {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}
