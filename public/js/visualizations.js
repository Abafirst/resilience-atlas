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

window.renderProfileBars = renderProfileBars;
window.getStrengthTier   = getStrengthTier;
window.escapeHtml        = escapeHtml;

/**
 * Render a radar chart for 6 resilience dimensions.
 * @param {HTMLElement} container - Element to render into
 * @param {Object} scores - Scores object with { type: { percentage } }
 */
function renderRadarChart(container, scores) {
  if (!container || !scores) return;

  container.innerHTML = '';

  const types = Object.keys(scores);
  const percentages = Object.values(scores).map(s => s.percentage);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 400 400');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '400');

  const center = 200;
  const maxRadius = 150;
  const numAxes = types.length;

  // Draw concentric circles (20%, 40%, 60%, 80%, 100%)
  for (let level = 1; level <= 5; level++) {
    const radius = (maxRadius / 5) * level;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', center);
    circle.setAttribute('cy', center);
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', '#e0e7ff');
    circle.setAttribute('stroke-width', '1');
    svg.appendChild(circle);
  }

  // Draw axes and labels
  const angles = [];
  for (let i = 0; i < numAxes; i++) {
    const angle = (i * 360 / numAxes) - 90;
    angles.push(angle);

    const rad = (angle * Math.PI) / 180;
    const x = center + maxRadius * Math.cos(rad);
    const y = center + maxRadius * Math.sin(rad);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', center);
    line.setAttribute('y1', center);
    line.setAttribute('x2', x);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', '#ccc');
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);

    const labelDist = maxRadius + 28;
    const labelX = center + labelDist * Math.cos(rad);
    const labelY = center + labelDist * Math.sin(rad);
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', labelX);
    text.setAttribute('y', labelY);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('font-size', '11');
    text.setAttribute('fill', '#555');
    text.textContent = types[i];
    svg.appendChild(text);
  }

  // Compute data polygon points
  const points = [];
  for (let i = 0; i < numAxes; i++) {
    const rad = (angles[i] * Math.PI) / 180;
    const radius = (maxRadius / 100) * percentages[i];
    points.push([center + radius * Math.cos(rad), center + radius * Math.sin(rad)]);
  }

  // Draw filled polygon
  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  const pointStr = [...points, points[0]].map(p => `${p[0]},${p[1]}`).join(' ');
  polygon.setAttribute('points', pointStr);
  polygon.setAttribute('fill', 'rgba(102, 126, 234, 0.3)');
  polygon.setAttribute('stroke', '#667eea');
  polygon.setAttribute('stroke-width', '2');
  svg.appendChild(polygon);

  // Draw data points
  for (let i = 0; i < numAxes; i++) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', points[i][0]);
    circle.setAttribute('cy', points[i][1]);
    circle.setAttribute('r', '4');
    circle.setAttribute('fill', '#667eea');
    svg.appendChild(circle);
  }

  container.appendChild(svg);
}

window.renderRadarChart = renderRadarChart;
