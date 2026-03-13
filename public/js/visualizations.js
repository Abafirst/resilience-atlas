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
 * Render a premium Chart.js radar chart for 6 resilience dimensions.
 *
 * Features:
 *  - Animated entrance (1200 ms, easeOutQuart)
 *  - Dominant dimension glow label via canvas plugin
 *  - Atlas Compass overlay (crosshairs, direction markers, center hub)
 *  - Balance/equilibrium ring (green / blue / amber by score variance)
 *  - Updates #primaryDimensionLabel with dominant dimension name
 *
 * @param {HTMLElement} container - Wrapper element (e.g. #radarChartContainer)
 * @param {Object}      scores    - { typeName: { percentage: number } }
 */
function renderRadarChart(container, scores) {
  if (!container || !scores) return;

  // ── Dimension metadata ────────────────────────────
  var TYPES = [
    'Agentic-Generative',
    'Relational',
    'Spiritual-Existential',
    'Emotional-Adaptive',
    'Somatic-Regulative',
    'Cognitive-Narrative',
  ];

  var percentages = TYPES.map(function(type) {
    var s = scores[type];
    if (!s) return 0;
    return Math.round(typeof s === 'object' ? s.percentage : s);
  });

  // ── Dominant dimension ────────────────────────────
  var maxPct       = Math.max.apply(null, percentages);
  var dominantIdx  = percentages.indexOf(maxPct);
  var dominantName = TYPES[dominantIdx];

  // Update the DOM label
  var labelEl = document.getElementById('primaryDimensionLabel');
  if (labelEl) {
    labelEl.textContent = dominantName;
  }

  // ── Balance ring colour (variance-based) ─────────
  // Thresholds are calibrated for 0–100 percentage scores across 6 dimensions.
  // With a max possible variance of ~2500 (all scores at extremes), the bands are:
  //   < 200  → std-dev < ~14 pts  → well-balanced profile   → green
  //   < 600  → std-dev < ~24 pts  → moderately varied       → blue
  //   ≥ 600  → std-dev ≥ ~24 pts  → strongly peaked/spiky   → amber
  var VARIANCE_BALANCED  = 200;
  var VARIANCE_MODERATE  = 600;

  var mean = percentages.reduce(function(a, b) { return a + b; }, 0) / percentages.length;
  var variance = percentages.reduce(function(acc, v) {
    return acc + Math.pow(v - mean, 2);
  }, 0) / percentages.length;

  var ringColor;
  if (variance < VARIANCE_BALANCED) {
    ringColor = 'rgba(16, 185, 129, 0.22)';   // green  — balanced
  } else if (variance < VARIANCE_MODERATE) {
    ringColor = 'rgba(59, 130, 246, 0.20)';   // blue   — moderate
  } else {
    ringColor = 'rgba(245, 158, 11, 0.22)';   // amber  — spiky
  }

  // ── Canvas setup ──────────────────────────────────
  // Remove any legacy SVG siblings; keep the canvas element.
  Array.from(container.querySelectorAll('svg')).forEach(function(el) {
    el.remove();
  });

  var canvas = document.getElementById('radarChart');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'radarChart';
    container.appendChild(canvas);
  }

  // Destroy previous Chart.js instance to avoid duplicate overlays.
  if (window._resilienceRadarChart) {
    window._resilienceRadarChart.destroy();
    window._resilienceRadarChart = null;
  }

  // ── Chart.js custom plugins ───────────────────────

  /**
   * Balance ring drawn BEHIND the radar polygon.
   */
  var balanceRingPlugin = {
    id: 'balanceRing',
    beforeDraw: function(chart) {
      var area = chart.chartArea;
      if (!area) return;
      var c  = chart.ctx;
      var cx = (area.left + area.right)  / 2;
      var cy = (area.top  + area.bottom) / 2;
      var r  = Math.min(area.right - area.left, area.bottom - area.top) / 2;

      c.save();
      c.beginPath();
      c.arc(cx, cy, r * 0.97, 0, Math.PI * 2);
      c.strokeStyle = ringColor;
      c.lineWidth   = 14;
      c.stroke();
      c.restore();
    },
  };

  /**
   * Compass crosshairs + direction markers + center hub drawn OVER the chart.
   */
  var compassPlugin = {
    id: 'compassOverlay',
    afterDraw: function(chart) {
      var area = chart.chartArea;
      if (!area) return;
      var c  = chart.ctx;
      var cx = (area.left + area.right)  / 2;
      var cy = (area.top  + area.bottom) / 2;
      var r  = Math.min(area.right - area.left, area.bottom - area.top) / 2;

      c.save();

      // Subtle dashed crosshair lines
      c.strokeStyle = 'rgba(148, 163, 184, 0.18)';
      c.lineWidth   = 1;
      c.setLineDash([5, 5]);

      c.beginPath();
      c.moveTo(cx, cy - r - 10);
      c.lineTo(cx, cy + r + 10);
      c.stroke();

      c.beginPath();
      c.moveTo(cx - r - 10, cy);
      c.lineTo(cx + r + 10, cy);
      c.stroke();

      c.setLineDash([]);

      // Compass direction labels — 6 directions chosen to avoid overlapping
      // the 6 axis labels of the radar chart (which sit at 0°, 60°, 120°, …).
      // E (0°) and W (180°) are omitted because they coincide with axis labels.
      var dirs = [
        { label: 'N',  angle: -90  },
        { label: 'NE', angle: -30  },
        { label: 'SE', angle:  30  },
        { label: 'S',  angle:  90  },
        { label: 'SW', angle:  150 },
        { label: 'NW', angle: -150 },
      ];

      c.font         = '9px Inter, Segoe UI, system-ui, sans-serif';
      c.textAlign    = 'center';
      c.textBaseline = 'middle';
      c.fillStyle    = 'rgba(148, 163, 184, 0.55)';

      dirs.forEach(function(d) {
        var rad = (d.angle * Math.PI) / 180;
        var dx  = cx + (r + 16) * Math.cos(rad);
        var dy  = cy + (r + 16) * Math.sin(rad);
        c.fillText(d.label, dx, dy);
      });

      // Center hub — radial glow
      var grad = c.createRadialGradient(cx, cy, 0, cx, cy, 10);
      grad.addColorStop(0, 'rgba(79, 70, 229, 0.9)');
      grad.addColorStop(1, 'rgba(79, 70, 229, 0)');
      c.beginPath();
      c.arc(cx, cy, 10, 0, Math.PI * 2);
      c.fillStyle = grad;
      c.fill();

      c.beginPath();
      c.arc(cx, cy, 4, 0, Math.PI * 2);
      c.fillStyle = '#4f46e5';
      c.fill();

      c.restore();
    },
  };

  /**
   * Overdraw the dominant dimension's axis label with a canvas glow effect.
   */
  var glowLabelPlugin = {
    id: 'glowLabel',
    afterDraw: function(chart) {
      var scale = chart.scales && chart.scales.r;
      if (!scale || typeof scale.getPointLabelPosition !== 'function') return;

      var pos = scale.getPointLabelPosition(dominantIdx);
      if (!pos) return;

      var c  = chart.ctx;
      var px = (pos.left + pos.right)  / 2;
      var py = (pos.top  + pos.bottom) / 2;

      c.save();
      c.font         = '700 12px Inter, Segoe UI, system-ui, sans-serif';
      c.textAlign    = 'center';
      c.textBaseline = 'middle';
      c.shadowBlur   = 14;
      c.shadowColor  = 'rgba(80, 120, 255, 0.65)';
      c.fillStyle    = '#4f46e5';
      c.fillText(dominantName, px, py);
      c.restore();
    },
  };

  // ── Per-point styling (dominant vertex brighter + larger) ─
  var pointBgColors = TYPES.map(function(_, i) {
    return i === dominantIdx ? '#f43f5e' : '#4f46e5';
  });
  var pointRadii = TYPES.map(function(_, i) {
    return i === dominantIdx ? 7 : 4;
  });
  var pointHoverRadii = TYPES.map(function(_, i) {
    return i === dominantIdx ? 9 : 6;
  });

  // ── Render Chart.js radar ─────────────────────────
  var ctx = canvas.getContext('2d');

  /* global Chart */
  window._resilienceRadarChart = new Chart(ctx, {
    type: 'radar',
    plugins: [balanceRingPlugin, compassPlugin, glowLabelPlugin],
    data: {
      labels: TYPES,
      datasets: [{
        label:                'Your Resilience Profile',
        data:                 percentages,
        backgroundColor:      'rgba(79, 70, 229, 0.25)',
        borderColor:          '#4f46e5',
        borderWidth:          3,
        borderJoinStyle:      'round',
        pointBackgroundColor: pointBgColors,
        pointBorderColor:     '#fff',
        pointBorderWidth:     2,
        pointRadius:          pointRadii,
        pointHoverRadius:     pointHoverRadii,
        fill:                 true,
        tension:              0.35,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: true,
      animation: {
        duration:      1200,
        easing:        'easeOutQuart',
        animateScale:  true,
        animateRotate: true,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding:         12,
          titleFont: {
            size: 13, weight: '600',
            family: 'Inter, Segoe UI, system-ui, sans-serif',
          },
          bodyFont: {
            size: 12,
            family: 'Inter, Segoe UI, system-ui, sans-serif',
          },
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              return ' ' + context.label + ': ' + context.parsed.r + '%';
            },
          },
        },
      },
      scales: {
        r: {
          min:         0,
          max:         100,
          beginAtZero: true,
          ticks: {
            stepSize:      20,
            font:          { size: 10 },
            color:         'rgba(100, 116, 139, 0.55)',
            backdropColor: 'transparent',
            callback: function(value) {
              return value + '%';
            },
          },
          grid: {
            circular:  true,
            color:     'rgba(100, 116, 139, 0.15)',
            lineWidth: 1,
          },
          angleLines: {
            color:     'rgba(100, 116, 139, 0.15)',
            lineWidth: 1,
          },
          pointLabels: {
            font: {
              size: 12, weight: '600',
              family: 'Inter, Segoe UI, system-ui, sans-serif',
            },
            color: function(context) {
              return context.index === dominantIdx ? '#4f46e5' : '#475569';
            },
            padding: 14,
          },
        },
      },
    },
  });

  // Trigger CSS entrance animation on the container
  container.classList.add('radar-animated');
}

window.renderRadarChart = renderRadarChart;
