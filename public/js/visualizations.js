/* =====================================================
   visualizations.js — Resilience profile bar renderer
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
 * @param {Array<{label: string, score: number, maxScore: number}>} items
 */
function renderProfileBars(container, items) {
  if (!container || !items || !items.length) return;

  container.innerHTML = '';
  container.classList.add('profile-bar-list');

  const scores = items.map(i => i.score);

  items.forEach((item) => {
    const tier    = getStrengthTier(item.score, scores);
    const pct     = Math.round((item.score / (item.maxScore || 30)) * 100);
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
        <span class="profile-bar-score">${item.score}/${item.maxScore || 30}</span>
      </div>
      <div class="profile-bar-track" role="progressbar"
           aria-valuenow="${item.score}" aria-valuemin="0" aria-valuemax="${item.maxScore || 30}"
           aria-label="${escapeHtml(item.label)}: ${item.score} out of ${item.maxScore || 30}">
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
 * Minimal HTML escaping to avoid XSS when inserting dynamic text.
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Render an interactive radar chart for the 6 resilience dimensions.
 *
 * @param {HTMLElement} container  - Element to render the canvas into
 * @param {Object} scores          - { "TypeName": percentage (0-100), … }
 */
function renderRadarChart(container, scores) {
  if (!container || !scores || !Object.keys(scores).length) return;

  container.innerHTML = '';

  const labels = Object.keys(scores);
  const values = labels.map(l => scores[l]);
  const n      = labels.length;

  // Canvas sizing — responsive: fill container width up to 480 px
  const size   = Math.min(container.clientWidth || 480, 480);
  const cx     = size / 2;
  const cy     = size / 2;
  const radius = size * 0.36;
  const labelR = size * 0.47;

  const canvas = document.createElement('canvas');
  canvas.width  = size;
  canvas.height = size;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label',
    'Radar chart of 6 resilience dimensions: ' +
    labels.map((l, i) => `${l} ${values[i].toFixed(1)}%`).join(', '));
  canvas.style.maxWidth = '100%';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  // ── Helper: polygon point at angle / distance ──────────
  function polarPoint(angle, dist) {
    return {
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
    };
  }

  const angleStep = (Math.PI * 2) / n;
  // Start at top (-π/2)
  function axisAngle(i) { return -Math.PI / 2 + i * angleStep; }

  // ── Draw background grid rings ─────────────────────────
  const rings = [20, 40, 60, 80, 100];
  rings.forEach(pct => {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const angle = axisAngle(i);
      const dist  = (pct / 100) * radius;
      const p     = polarPoint(angle, dist);
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth   = 1;
    ctx.stroke();
    ctx.fillStyle   = pct % 40 === 0 ? 'rgba(241, 245, 249, 0.4)' : 'transparent';
    ctx.fill();

    // Ring label (right side)
    const labelPt = polarPoint(axisAngle(1) - angleStep / 2, (pct / 100) * radius);
    ctx.fillStyle   = '#94a3b8';
    ctx.font        = `${Math.round(size * 0.027)}px system-ui, sans-serif`;
    ctx.textAlign   = 'left';
    ctx.fillText(`${pct}%`, labelPt.x + 2, labelPt.y - 2);
  });

  // ── Draw axis lines ────────────────────────────────────
  for (let i = 0; i < n; i++) {
    const angle = axisAngle(i);
    const end   = polarPoint(angle, radius);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.lineWidth   = 1;
    ctx.stroke();
  }

  // ── Draw data polygon ──────────────────────────────────
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const angle = axisAngle(i);
    const dist  = (values[i] / 100) * radius;
    const p     = polarPoint(angle, dist);
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();

  // Gradient fill
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0, 'rgba(102, 126, 234, 0.55)');
  grad.addColorStop(1, 'rgba(118, 75, 162, 0.25)');
  ctx.fillStyle   = grad;
  ctx.fill();
  ctx.strokeStyle = '#667eea';
  ctx.lineWidth   = 2.5;
  ctx.stroke();

  // ── Data point dots ────────────────────────────────────
  for (let i = 0; i < n; i++) {
    const angle = axisAngle(i);
    const dist  = (values[i] / 100) * radius;
    const p     = polarPoint(angle, dist);
    ctx.beginPath();
    ctx.arc(p.x, p.y, size * 0.022, 0, Math.PI * 2);
    ctx.fillStyle   = '#764ba2';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 2;
    ctx.stroke();
  }

  // ── Axis labels ────────────────────────────────────────
  const fontSize = Math.round(size * 0.033);
  ctx.font     = `600 ${fontSize}px system-ui, sans-serif`;
  ctx.fillStyle = '#1e293b';

  labels.forEach((label, i) => {
    const angle = axisAngle(i);
    const p     = polarPoint(angle, labelR);

    // Wrap long labels
    const words = label.split('-');
    const line1 = words[0] || '';
    const line2 = words.slice(1).join('-') || '';
    const lineH = fontSize * 1.25;

    ctx.textAlign    = Math.abs(angle) < 0.01 || Math.abs(Math.abs(angle) - Math.PI) < 0.01
                         ? 'center'
                         : p.x < cx - 4 ? 'right' : p.x > cx + 4 ? 'left' : 'center';
    ctx.textBaseline = p.y < cy - 4 ? 'bottom' : p.y > cy + 4 ? 'top' : 'middle';

    if (line2) {
      ctx.fillText(line1, p.x, p.y - lineH / 2);
      ctx.fillText(line2, p.x, p.y + lineH / 2);
    } else {
      ctx.fillText(line1, p.x, p.y);
    }

    // Percentage below label
    ctx.font      = `${Math.round(fontSize * 0.85)}px system-ui, sans-serif`;
    ctx.fillStyle = '#667eea';
    const pctY = line2 ? p.y + lineH * 1.2 : p.y + lineH * 0.9;
    ctx.fillText(`${values[i].toFixed(1)}%`, p.x, pctY);
    ctx.font      = `600 ${fontSize}px system-ui, sans-serif`;
    ctx.fillStyle = '#1e293b';
  });
}

window.renderProfileBars = renderProfileBars;
window.getStrengthTier   = getStrengthTier;
window.escapeHtml        = escapeHtml;
window.renderRadarChart  = renderRadarChart;
