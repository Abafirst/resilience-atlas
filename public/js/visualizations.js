/* =====================================================
   visualizations.js — Resilience profile bar renderer
                        and radar chart
   ===================================================== */

'use strict';

/**
 * Determine the strength tier of a score (out of 30).
 * Primary: top tier, Solid: mid tier, Emerging: lower tier.
 */
function getStrengthTier(score, allScores) {
  const sorted = [...allScores].sort((a, b) => b - a);
  const rank   = sorted.indexOf(score);
  if (rank === 0)           return 'primary';
  if (rank <= 2)            return 'solid';
  return 'emerging';
}

/**
 * Render the resilience profile bar chart into `container`.
 *
 * @param {HTMLElement} container  - Element to render bars into
 * @param {Array<{label: string, score: number, maxScore: number, pct?: number}>} items
 */
function renderProfileBars(container, items) {
  if (!container || !items || !items.length) return;

  container.innerHTML = '';
  container.classList.add('profile-bar-list');

  const scores = items.map(i => i.score);

  items.forEach((item) => {
    const tier    = getStrengthTier(item.score, scores);
    const pct     = item.pct != null
      ? parseFloat(item.pct).toFixed(1)
      : Math.round((item.score / (item.maxScore || 30)) * 100);
    const fillCls = tier === 'primary' ? 'fill-primary'
                  : tier === 'solid'   ? 'fill-solid'
                  :                      'fill-emerging';
    const badgeTxt = tier === 'primary' ? 'Primary Strength'
                   : tier === 'solid'   ? 'Solid Strength'
                   :                      'Emerging Strength';
    const badgeCls = `badge-${tier}`;

    const barItem = document.createElement('div');
    barItem.className = 'profile-bar-item';
    barItem.innerHTML = `
      <div class="profile-bar-header">
        <span class="profile-bar-label">
          ${escapeHtml(item.label)}
          <span class="strength-badge ${badgeCls}">${badgeTxt}</span>
        </span>
        <span class="profile-bar-score">${pct}%</span>
      </div>
      <div class="profile-bar-track" role="progressbar"
           aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"
           aria-label="${escapeHtml(item.label)}: ${pct}%">
        <div class="profile-bar-fill ${fillCls}" style="width:0%"></div>
      </div>
    `;

    container.appendChild(barItem);

    // Animate bar in after paint
    requestAnimationFrame(() => {
      setTimeout(() => {
        const fill = barItem.querySelector('.profile-bar-fill');
        if (fill) fill.style.width = `${pct}%`;
      }, 60);
    });
  });
}

/**
 * Render a radar chart on a <canvas> element for the 6 resilience types.
 *
 * @param {HTMLCanvasElement} canvas - The canvas to draw on
 * @param {Array<{label: string, value: number}>} data - Types and percentage scores (0–100)
 */
function renderRadarChart(canvas, data) {
  if (!canvas || !data || !data.length) return;

  const ctx    = canvas.getContext('2d');
  const sides  = data.length;
  const cx     = canvas.width  / 2;
  const cy     = canvas.height / 2;
  const radius = Math.min(cx, cy) * 0.62;
  const labelR = Math.min(cx, cy) * 0.88;

  // Colours
  const FILL_COLOR   = 'rgba(37, 99, 235, 0.18)';   // blue with alpha
  const STROKE_COLOR = 'rgba(37, 99, 235, 0.85)';
  const GRID_COLOR   = 'rgba(148, 163, 184, 0.35)';
  const POINT_COLOR  = '#2563EB';
  const LABEL_COLOR  = '#1E293B';

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Helper: compute x,y for a given axis index and radial distance
  function point(i, r) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  }

  // Draw grid rings
  const rings = 5;
  for (let r = 1; r <= rings; r++) {
    const ringR = (radius * r) / rings;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const p = point(i, ringR);
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth   = 1;
    ctx.stroke();

    // % label on top axis
    if (r < rings) {
      const pctLabel = Math.round((r / rings) * 100) + '%';
      const tp = point(0, ringR);
      ctx.fillStyle  = '#94A3B8';
      ctx.font       = `${canvas.width < 400 ? 9 : 10}px system-ui, sans-serif`;
      ctx.textAlign  = 'center';
      ctx.fillText(pctLabel, tp.x + 14, tp.y + 3);
    }
  }

  // Draw axis spokes
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth   = 1;
  for (let i = 0; i < sides; i++) {
    const p = point(i, radius);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  // Draw filled data polygon
  ctx.beginPath();
  data.forEach(({ value }, i) => {
    const r = (Math.min(Math.max(value, 0), 100) / 100) * radius;
    const p = point(i, r);
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
  ctx.fillStyle   = FILL_COLOR;
  ctx.fill();
  ctx.strokeStyle = STROKE_COLOR;
  ctx.lineWidth   = 2.5;
  ctx.stroke();

  // Draw data points
  data.forEach(({ value }, i) => {
    const r = (Math.min(Math.max(value, 0), 100) / 100) * radius;
    const p = point(i, r);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = POINT_COLOR;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 2;
    ctx.stroke();
  });

  // Draw axis labels
  const fontSize = canvas.width < 400 ? 10 : 12;
  ctx.fillStyle  = LABEL_COLOR;
  ctx.font       = `600 ${fontSize}px system-ui, sans-serif`;

  data.forEach(({ label }, i) => {
    const p = point(i, labelR);
    ctx.textAlign = p.x < cx - 5 ? 'right'
                  : p.x > cx + 5 ? 'left'
                  :                 'center';
    ctx.textBaseline = p.y < cy - 5 ? 'bottom'
                     : p.y > cy + 5 ? 'top'
                     :                'middle';

    // Wrap long labels
    const words    = label.split('-');
    const lineH    = fontSize + 3;
    const startY   = p.y - ((words.length - 1) * lineH) / 2;
    words.forEach((word, wi) => ctx.fillText(word, p.x, startY + wi * lineH));
  });
}

/**
 * Minimal HTML escaping to avoid XSS when inserting dynamic text.
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

window.renderProfileBars = renderProfileBars;
window.getStrengthTier   = getStrengthTier;
window.escapeHtml        = escapeHtml;
window.renderRadarChart  = renderRadarChart;
