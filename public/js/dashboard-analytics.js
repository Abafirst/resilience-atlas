/* dashboard-analytics.js — Render advanced analytics charts for Teams dashboard */
'use strict';

/**
 * DashboardAnalytics — Renders distribution charts, heatmap, trend indicators,
 * and benchmark comparisons using Chart.js.
 *
 * Depends on: Chart.js (loaded globally), teams-enhanced.css
 * Exposed as window.DashboardAnalytics
 */
(function (window) {

  const DIMENSION_LABELS = {
    relational: 'Relational',
    cognitive:  'Cognitive',
    somatic:    'Somatic',
    emotional:  'Emotional',
    spiritual:  'Spiritual',
    agentic:    'Agentic',
  };

  const DIMS = Object.keys(DIMENSION_LABELS);

  // ── Chart Color Palette ────────────────────────────────────────────────────

  const COLORS = {
    high:     '#16a34a',
    medium:   '#d97706',
    low:      '#dc2626',
    primary:  '#1a2e5a',
    accent:   '#3b82f6',
    baseline: '#94a3b8',
  };

  // ── Registered Chart instances (to allow destroy/re-render) ─────────────────
  const _charts = {};

  function destroyChart(id) {
    if (_charts[id]) {
      _charts[id].destroy();
      delete _charts[id];
    }
  }

  // ── Distribution Chart (stacked bar) ────────────────────────────────────────

  /**
   * Render a stacked horizontal bar chart showing % of team in each score band.
   *
   * @param {string} canvasId    – id of <canvas> element
   * @param {Object} distribution – { relational: { high, medium, low }, … }
   */
  function renderDistributionChart(canvasId, distribution) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !distribution) return;

    destroyChart(canvasId);

    const labels = DIMS.map((d) => DIMENSION_LABELS[d]);
    const highData   = DIMS.map((d) => (distribution[d] || {}).high   || 0);
    const mediumData = DIMS.map((d) => (distribution[d] || {}).medium || 0);
    const lowData    = DIMS.map((d) => (distribution[d] || {}).low    || 0);

    _charts[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'High (≥70%)',
            data: highData,
            backgroundColor: COLORS.high,
            borderRadius: 4,
          },
          {
            label: 'Medium (40–69%)',
            data: mediumData,
            backgroundColor: COLORS.medium,
            borderRadius: 4,
          },
          {
            label: 'Low (<40%)',
            data: lowData,
            backgroundColor: COLORS.low,
            borderRadius: 4,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 12 }, boxWidth: 12, padding: 16 },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.x}% of team`,
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            max: 100,
            ticks: {
              callback: (v) => `${v}%`,
              font: { size: 11 },
            },
            grid: { color: 'rgba(0,0,0,0.05)' },
          },
          y: {
            stacked: true,
            ticks: { font: { size: 12 } },
            grid: { display: false },
          },
        },
      },
    });
  }

  // ── Heatmap (rendered with DOM, not canvas) ──────────────────────────────────

  /**
   * Render a CSS heatmap of dimension scores.
   *
   * @param {string} containerId – id of container element
   * @param {Object[]} heatmap   – [{ dim, label, score, strength }, …]
   */
  function renderHeatmap(containerId, heatmap) {
    const container = document.getElementById(containerId);
    if (!container || !heatmap) return;

    container.innerHTML = '';
    container.className = 'teams-heatmap';
    container.setAttribute('role', 'list');

    for (const item of heatmap) {
      const row = document.createElement('div');
      row.className = 'teams-heatmap__row';
      row.setAttribute('role', 'listitem');
      row.setAttribute('aria-label', `${item.label}: ${item.score}% — ${item.strength}`);

      row.innerHTML = `
        <span class="teams-heatmap__label">${escHtml(item.label)}</span>
        <div class="teams-heatmap__bar-wrap" aria-hidden="true">
          <div class="teams-heatmap__bar teams-heatmap__bar--${escHtml(item.strength)}"
               style="width:${Math.min(item.score, 100)}%">
            ${item.score}%
          </div>
        </div>
        <span class="teams-heatmap__score" aria-hidden="true">${item.score}%</span>
      `;

      container.appendChild(row);
    }
  }

  // ── Trend Section (DOM render) ───────────────────────────────────────────────

  /**
   * Render a trend summary with delta indicators per dimension.
   *
   * @param {string} containerId
   * @param {Object} trend – Output from advancedAnalytics.computeTrend()
   */
  function renderTrend(containerId, trend) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!trend || !trend.hasData) {
      container.innerHTML = '<p class="text-muted text-sm">Trend data available after the second assessment cycle.</p>';
      return;
    }

    const rows = DIMS.map((dim) => {
      const delta = trend.delta[dim];
      if (delta == null) return '';

      const dir   = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
      const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '▶';
      const sign  = delta > 0 ? '+' : '';

      return `
        <div class="teams-heatmap__row">
          <span class="teams-heatmap__label">${escHtml(DIMENSION_LABELS[dim] || dim)}</span>
          <span class="teams-trend-arrow teams-trend-arrow--${dir}">
            ${arrow} ${sign}${delta}%
          </span>
        </div>
      `;
    }).join('');

    const overallDelta = trend.delta.overall;
    const overallHtml = overallDelta != null
      ? `<p class="text-sm mt-4">
          Overall change: 
          <span class="teams-trend-arrow teams-trend-arrow--${overallDelta >= 0 ? 'up' : 'down'} font-bold">
            ${overallDelta >= 0 ? '▲' : '▼'} ${overallDelta >= 0 ? '+' : ''}${overallDelta}%
          </span>
         </p>`
      : '';

    container.innerHTML = `<div class="teams-heatmap">${rows}</div>${overallHtml}`;
  }

  // ── Benchmark Section (DOM render) ──────────────────────────────────────────

  /**
   * Render benchmark comparisons.
   *
   * @param {string} containerId
   * @param {Object[]} benchmarks – [{ dim, label, teamScore, baseline, delta, direction }, …]
   */
  function renderBenchmarks(containerId, benchmarks) {
    const container = document.getElementById(containerId);
    if (!container || !benchmarks) return;

    container.innerHTML = benchmarks.map((b) => {
      const cls   = b.direction === 'above' ? 'above' : 'below';
      const sign  = b.delta >= 0 ? '+' : '';

      return `
        <div class="teams-benchmark-item">
          <div class="teams-benchmark-item__header">
            <span class="teams-benchmark-item__label">${escHtml(b.label)}</span>
            <span class="teams-benchmark-item__delta teams-benchmark-item__delta--${cls}">
              ${sign}${b.delta}% vs baseline
            </span>
          </div>
          <div class="text-sm text-muted">
            Team: <strong>${b.teamScore}%</strong> &nbsp;|&nbsp; Industry avg: <strong>${b.baseline}%</strong>
          </div>
        </div>
      `;
    }).join('');
  }

  // ── Risk Summary ─────────────────────────────────────────────────────────────

  /**
   * Render at-risk count summary.
   *
   * @param {string} containerId
   * @param {Object[]} atRisk
   * @param {number}   memberCount
   */
  function renderRiskSummary(containerId, atRisk, memberCount) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!atRisk || atRisk.length === 0) {
      container.innerHTML = `
        <div class="teams-empty">
          <div class="teams-empty__icon">✅</div>
          <div class="teams-empty__title">No members flagged at this threshold</div>
          <p class="text-sm text-muted">Continue monitoring across assessment cycles.</p>
        </div>
      `;
      return;
    }

    const pct = memberCount ? Math.round((atRisk.length / memberCount) * 100) : 0;

    container.innerHTML = `
      <div class="risk-badge" style="font-size:1.1rem;padding:0.5rem 1.25rem;margin-bottom:1rem;">
        ⚠️ ${atRisk.length} member${atRisk.length !== 1 ? 's' : ''} flagged (${pct}% of team)
      </div>
      <p class="text-sm text-muted">
        These individuals scored below the risk threshold and may benefit from additional 
        support or coaching. Individual identities are anonymised in this view.
      </p>
    `;
  }

  // ── Discussion Prompts (based on team pattern) ───────────────────────────────

  const PROMPTS = {
    relational: [
      'When do you feel most connected to your teammates — and what contributes to that?',
      'What gets in the way of asking for support when you need it most?',
      'How do we celebrate each other's wins and milestones as a team?',
      'What does belonging feel like in our team, and how can we strengthen it?',
      'Who in our network outside this team do we lean on, and do we have enough of those connections?',
    ],
    cognitive: [
      'What stories do we tell ourselves about challenges — are they empowering or limiting?',
      'When facing a setback, how do we reframe the situation constructively as a team?',
      'What assumptions do we hold about ourselves that might be limiting our potential?',
      'How do we build and share knowledge that helps us navigate uncertainty?',
      'What does "growth mindset" actually look like in day-to-day team behaviour?',
    ],
    somatic: [
      'How do we know when we're operating in stress response vs. grounded presence?',
      'What physical signals tell us we\'re approaching burnout, and what do we do about it?',
      'How does our physical environment affect our energy and focus?',
      'What collective habits or rituals support our physical wellbeing as a team?',
      'How do we create space for recovery and rest — not just productivity?',
    ],
    emotional: [
      'What emotions are "acceptable" in our team culture — and which ones do we suppress?',
      'How do we support each other when someone is struggling emotionally?',
      'What does psychological safety look and feel like in our day-to-day interactions?',
      'How do we express appreciation and care for one another?',
      'What would change if we had more honest conversations about how we're really feeling?',
    ],
    spiritual: [
      'What is the deeper "why" behind the work we do together?',
      'How aligned are our individual values with the team's mission and culture?',
      'When do we feel most purposeful in our work — and what conditions enable that?',
      'How do we find meaning in difficult or monotonous periods?',
      'What legacy do we want to leave — as a team and as individuals?',
    ],
    agentic: [
      'Where do we feel most empowered to take initiative — and where do we hold back?',
      'What would we do differently if we knew we couldn't fail?',
      'How do we support each other to step into leadership moments?',
      'What resources or permissions do we need that we don't currently have?',
      'How do we celebrate effort and learning, not just outcomes?',
    ],
  };

  /**
   * Generate discussion prompts based on the team's weakest dimensions.
   *
   * @param {string}   containerId
   * @param {Object}   heatmap   – output from buildHeatmap()
   * @param {number}  [count=3]  – number of dimensions to focus on
   */
  function renderDiscussionPrompts(containerId, heatmap, count = 3) {
    const container = document.getElementById(containerId);
    if (!container || !heatmap) return;

    // Sort by score ascending (weakest first)
    const sorted = [...heatmap].sort((a, b) => a.score - b.score);
    const focus  = sorted.slice(0, count);

    const sections = focus.map((item) => {
      const prompts = (PROMPTS[item.dim] || []).slice(0, 3);
      return `
        <div class="resource-dim-section">
          <h4 class="resource-dim-section__title">${escHtml(item.label)} 
            <span class="text-sm text-muted font-normal">(score: ${item.score}%)</span>
          </h4>
          <ul class="prompt-list">
            ${prompts.map((p) => `<li class="prompt-item">"${escHtml(p)}"</li>`).join('')}
          </ul>
        </div>
      `;
    }).join('');

    container.innerHTML = sections ||
      '<p class="text-muted text-sm">Complete an assessment to generate personalised prompts.</p>';
  }

  // ── Radar Chart (team overview) ──────────────────────────────────────────────

  /**
   * Render or update the team radar chart.
   *
   * @param {string} canvasId
   * @param {Object} teamAverages – { relational, cognitive, … }
   * @param {Object} [previous]   – previous cycle averages for comparison
   */
  function renderRadarChart(canvasId, teamAverages, previous) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !teamAverages) return;

    destroyChart(canvasId);

    const labels   = DIMS.map((d) => DIMENSION_LABELS[d]);
    const current  = DIMS.map((d) => teamAverages[d] || 0);
    const datasets = [
      {
        label:           'Current cycle',
        data:            current,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderColor:     COLORS.accent,
        borderWidth:     2,
        pointBackgroundColor: COLORS.accent,
        pointRadius:     4,
      },
    ];

    if (previous) {
      datasets.push({
        label:           'Previous cycle',
        data:            DIMS.map((d) => previous[d] || 0),
        backgroundColor: 'transparent',
        borderColor:     COLORS.baseline,
        borderWidth:     2,
        borderDash:      [5, 5],
        pointBackgroundColor: COLORS.baseline,
        pointRadius:     3,
      });
    }

    _charts[canvasId] = new Chart(canvas, {
      type: 'radar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: !!previous,
            position: 'bottom',
            labels: { font: { size: 11 }, boxWidth: 12 },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.r}%`,
            },
          },
        },
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20,
              font: { size: 10 },
              callback: (v) => `${v}%`,
            },
            pointLabels: { font: { size: 12 } },
            grid: { color: 'rgba(0,0,0,0.07)' },
          },
        },
      },
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ── Public API ────────────────────────────────────────────────────────────────

  window.DashboardAnalytics = {
    renderDistributionChart,
    renderHeatmap,
    renderTrend,
    renderBenchmarks,
    renderRiskSummary,
    renderDiscussionPrompts,
    renderRadarChart,
  };

})(window);
