'use strict';

/**
 * analytics.js — Client-side chart rendering and dimension aggregation utilities
 * for the Business tier Team Dashboard.
 *
 * Exposed as window.Analytics.
 * Depends on Chart.js being loaded before this script.
 */
(function (window) {

  // ── Dimension configuration ─────────────────────────────────────────────────

  var DIMENSIONS = [
    { key: 'relational', label: 'Relational',  color: 'rgba(99, 102, 241, 0.8)' },
    { key: 'cognitive',  label: 'Cognitive',   color: 'rgba(16, 185, 129, 0.8)' },
    { key: 'somatic',    label: 'Somatic',     color: 'rgba(245, 158, 11, 0.8)' },
    { key: 'emotional',  label: 'Emotional',   color: 'rgba(239, 68, 68, 0.8)'  },
    { key: 'spiritual',  label: 'Spiritual',   color: 'rgba(139, 92, 246, 0.8)' },
    { key: 'agentic',    label: 'Agentic',     color: 'rgba(59, 130, 246, 0.8)' },
  ];

  // ── Radar chart ────────────────────────────────────────────────────────────

  var _radarChart = null;

  /**
   * Render (or update) the team radar chart.
   *
   * @param {HTMLCanvasElement} canvas
   * @param {Object} averages  – { relational, cognitive, somatic, emotional, spiritual, agentic }
   */
  function renderRadar(canvas, averages) {
    if (!canvas || typeof Chart === 'undefined') return;

    var labels = DIMENSIONS.map(function (d) { return d.label; });
    var data   = DIMENSIONS.map(function (d) { return averages[d.key] || 0; });

    var cfg = {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Team Averages',
          data: data,
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          borderColor: 'rgba(99, 102, 241, 0.9)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(99, 102, 241, 0.9)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(99, 102, 241, 1)',
          pointRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: { duration: 800, easing: 'easeOutQuart' },
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20,
              backdropColor: 'transparent',
              font: { size: 10 },
            },
            grid: { color: 'rgba(0,0,0,0.08)' },
            angleLines: { color: 'rgba(0,0,0,0.08)' },
            pointLabels: { font: { size: 13, weight: 'bold' } },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return ctx.dataset.label + ': ' + ctx.parsed.r + '%';
              },
            },
          },
        },
      },
    };

    if (_radarChart) {
      _radarChart.data.datasets[0].data = data;
      _radarChart.update();
    } else {
      _radarChart = new Chart(canvas, cfg);
    }
  }

  // ── Dimension cards ────────────────────────────────────────────────────────

  /**
   * Render dimension average cards into a container element.
   *
   * @param {HTMLElement} container
   * @param {Object} averages
   */
  function renderDimCards(container, averages) {
    if (!container) return;
    container.innerHTML = '';

    // Find max for highlighting
    var max = 0;
    DIMENSIONS.forEach(function (d) { if ((averages[d.key] || 0) > max) max = averages[d.key] || 0; });

    DIMENSIONS.forEach(function (d) {
      var val    = averages[d.key] != null ? Math.round(averages[d.key]) : 0;
      var isTop  = val === Math.round(max) && max > 0;
      var card   = document.createElement('div');
      card.className = 'dim-card' + (isTop ? ' dim-card--top' : '');
      card.setAttribute('role', 'listitem');

      card.innerHTML =
        '<div class="dim-card__name">' + d.label + (isTop ? ' <span class="dim-badge">Top</span>' : '') + '</div>' +
        '<div class="dim-card__val">' + val + '%</div>' +
        '<div class="dim-bar-track" role="progressbar" aria-valuenow="' + val + '" aria-valuemin="0" aria-valuemax="100">' +
        '  <div class="dim-bar-fill" style="width:' + val + '%;background:' + d.color + '"></div>' +
        '</div>';

      container.appendChild(card);
    });
  }

  // ── Top dimension ──────────────────────────────────────────────────────────

  /**
   * Return the key of the highest-scoring dimension.
   * @param {Object} averages
   * @returns {string}
   */
  function topDimension(averages) {
    var best = null;
    var bestVal = -1;
    DIMENSIONS.forEach(function (d) {
      if ((averages[d.key] || 0) > bestVal) {
        bestVal = averages[d.key] || 0;
        best = d;
      }
    });
    return best ? best.label : '—';
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  window.Analytics = {
    DIMENSIONS:     DIMENSIONS,
    renderRadar:    renderRadar,
    renderDimCards: renderDimCards,
    topDimension:   topDimension,
  };

})(window);
