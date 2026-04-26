/* =============================================================
   leadership-report.js
   Client-side logic for the Leadership Insights Report page.
   Reads ?orgId=<id> from the URL, fetches the latest report
   from the API, and renders all sections.
   ============================================================= */

(function () {
  'use strict';

  // ── Utilities ────────────────────────────────────────────────

  /**
   * Read a query-string parameter from the current URL.
   * @param {string} name
   * @returns {string|null}
   */
  function qp(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  /** Return the stored JWT token (if any). */
  function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token') || null;
  }

  /**
   * Authenticated fetch helper.
   * @param {string} url
   * @param {RequestInit} [options]
   * @returns {Promise<Response>}
   */
  function apiFetch(url, options = {}) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { ...options, headers });
  }

  // ── DOM helpers ──────────────────────────────────────────────

  function $(id) {
    return document.getElementById(id);
  }

  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'className') node.className = v;
      else if (k === 'innerHTML') node.innerHTML = v; // safe — we control the data
      else node.setAttribute(k, v);
    }
    for (const child of children) {
      if (typeof child === 'string') node.appendChild(document.createTextNode(child));
      else if (child) node.appendChild(child);
    }
    return node;
  }

  // ── Observation icons / colors ───────────────────────────────

  const OBS_META = {
    strength:    { icon: '💪', label: 'Strength' },
    risk:        { icon: '⚠️', label: 'Risk' },
    opportunity: { icon: '🌱', label: 'Opportunity' },
    balance:     { icon: '⚖️', label: 'Balance' },
    demographic: { icon: '👥', label: 'Demographic' },
  };

  // ── Resilience level badge ────────────────────────────────────

  function levelBadge(level) {
    const node = el('span', {
      className: `resilience-badge resilience-badge--${level}`,
      role: 'img',
      'aria-label': `Resilience level: ${level}`,
    }, level);
    return node;
  }

  // ── Trend chip ───────────────────────────────────────────────

  function trendChip(trend) {
    if (trend === null || trend === undefined) return document.createTextNode('—');
    const dir = trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat';
    const sign = trend > 0 ? '+' : '';
    return el('span', { className: `trend-chip trend-chip--${dir}` }, `${sign}${trend}%`);
  }

  // ── SECTION 1: Team overview ──────────────────────────────────

  function renderTeamOverview(report) {
    const ov = report.teamOverview || {};
    const grid = $('kpi-grid');
    grid.innerHTML = '';

    const kpis = [
      { value: ov.totalRespondents ?? '—', label: 'Participants' },
      { value: ov.responseRate != null ? `${ov.responseRate}%` : '—', label: 'Response Rate' },
      { value: ov.averageOverallScore != null ? `${ov.averageOverallScore}` : '—', label: 'Avg Resilience Score' },
    ];

    for (const { value, label } of kpis) {
      const card = el('div', { className: 'kpi-card', role: 'listitem' },
        el('div', { className: 'kpi-card__value' }, String(value)),
        el('div', { className: 'kpi-card__label' }, label)
      );
      grid.appendChild(card);
    }

    // Resilience level card
    const levelCard = el('div', { className: 'kpi-card', role: 'listitem' },
      levelBadge(ov.resilienceLevel || 'emerging'),
      el('div', { className: 'kpi-card__label' }, 'Resilience Level')
    );
    grid.appendChild(levelCard);

    // Trend card
    const trendCard = el('div', { className: 'kpi-card', role: 'listitem' });
    const chip = trendChip(ov.scoreTrend);
    trendCard.appendChild(chip);
    trendCard.appendChild(el('div', { className: 'kpi-card__label' }, 'Change vs Previous'));
    grid.appendChild(trendCard);

    // Strength distribution
    renderStrengthChart(report.strengthDistribution || {}, ov.totalRespondents || 1);
  }

  function renderStrengthChart(distribution, total) {
    const container = $('strength-chart');
    container.innerHTML = '';

    const entries = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
    const maxCount = Math.max(...entries.map(([, c]) => c), 1);

    for (const [dim, count] of entries) {
      const pct = Math.round((count / maxCount) * 100);
      const row = el('div', { className: 'strength-bar-row', role: 'listitem' });

      const label = el('span', { className: 'strength-bar-label', title: dim }, dim);
      const track = el('div', { className: 'strength-bar-track', role: 'progressbar', 'aria-valuenow': pct, 'aria-valuemin': '0', 'aria-valuemax': '100' });
      const fill  = el('div', { className: 'strength-bar-fill' });
      fill.style.width = `${pct}%`;
      track.appendChild(fill);

      const countEl = el('span', { className: 'strength-bar-count', 'aria-label': `${count} employees` }, String(count));

      row.append(label, track, countEl);
      container.appendChild(row);
    }
  }

  // ── SECTION 2: Dimension analysis ────────────────────────────

  const DIMENSION_LABELS = {
    'Cognitive-Narrative': 'Cognitive-Narrative',
    'Relational-Connective': 'Relational-Connective',
    'Agentic-Generative': 'Agentic-Generative',
    'Emotional-Adaptive': 'Emotional-Adaptive',
    'Spiritual-Reflective': 'Spiritual-Reflective',
    'Somatic-Regulative': 'Somatic-Regulative',
  };

  function renderDimensionAnalysis(dimensionAnalysis) {
    const grid = $('dimension-grid');
    grid.innerHTML = '';

    const dims = Object.keys(DIMENSION_LABELS);

    for (const dim of dims) {
      const data = dimensionAnalysis[dim];
      if (!data) continue;

      const avg = data.average ?? 0;
      const card = el('div', { className: 'dimension-card', role: 'listitem' });

      // Header
      const header = el('div', { className: 'dimension-card__header' },
        el('span', { className: 'dimension-card__name' }, dim),
        el('span', { className: 'dimension-card__score', 'aria-label': `Average score: ${avg}%` }, `${avg}%`)
      );

      // Progress bar
      const track = el('div', { className: 'dimension-progress-track', role: 'progressbar', 'aria-valuenow': avg, 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-label': `${dim} score: ${avg}%` });
      const fill  = el('div', { className: 'dimension-progress-fill' });
      fill.style.width = `${avg}%`;
      track.appendChild(fill);

      // Details
      const detailsHTML = [
        `<strong>Range:</strong> ${data.min}–${data.max}%`,
        `<strong>Std Dev:</strong> ${data.stdDev}`,
        `<strong>Percentile:</strong> ~${data.percentile}th`,
        `<strong>High scores:</strong> ${data.interpretation || '—'}`,
      ];

      const details = el('div', {});
      for (const html of detailsHTML) {
        details.appendChild(el('p', { className: 'dimension-detail', innerHTML: html }));
      }

      if (data.recommendation) {
        details.appendChild(
          el('p', { className: 'dimension-recommendation' }, `→ ${data.recommendation}`)
        );
      }

      card.append(header, track, details);
      grid.appendChild(card);
    }
  }

  // ── SECTION 3: Key observations ──────────────────────────────

  function renderObservations(observations) {
    const list = $('observation-list');
    list.innerHTML = '';

    if (!observations || !observations.length) {
      list.appendChild(el('li', {}, 'No observations available.'));
      return;
    }

    for (const obs of observations) {
      const meta = OBS_META[obs.type] || { icon: '📝', label: obs.type };
      const item = el('li', { className: `observation-item observation-item--${obs.type}` },
        el('span', { className: 'observation-icon', 'aria-hidden': 'true' }, meta.icon),
        el('span', { className: 'observation-text' }, obs.observation)
      );
      list.appendChild(item);
    }
  }

  // ── SECTION 4: Recommendations ──────────────────────────────

  function renderRecommendations(recommendations) {
    const container = $('recommendation-list');
    container.innerHTML = '';

    if (!recommendations || !recommendations.length) {
      container.appendChild(el('p', {}, 'No recommendations available.'));
      return;
    }

    for (let i = 0; i < recommendations.length; i++) {
      const rec = recommendations[i];
      const cardId = `rec-body-${i}`;
      const headerId = `rec-header-${i}`;

      // Difficulty badge
      const diff = (rec.difficulty || 'medium').toLowerCase();
      const diffBadge = el('span', { className: `difficulty-badge difficulty-badge--${diff}` }, diff);

      // Header (acts as accordion trigger)
      const header = el('div', {
        className: 'recommendation-card__header',
        role: 'button',
        tabindex: '0',
        id: headerId,
        'aria-expanded': i === 0 ? 'true' : 'false',
        'aria-controls': cardId,
      },
        el('span', { className: 'recommendation-card__title' }, rec.title || rec.action),
        el('div', { className: 'recommendation-card__badges' }, diffBadge)
      );

      // Body
      const body = el('div', {
        className: 'recommendation-card__body',
        id: cardId,
        role: 'region',
        'aria-labelledby': headerId,
      });

      const fields = [
        { label: 'Action', value: rec.action },
        { label: 'Rationale', value: rec.rationale },
        { label: 'Timeline', value: rec.timeline },
        { label: 'Impact', value: rec.expectedImpact },
      ];

      for (const { label, value } of fields) {
        if (!value) continue;
        const row = el('div', { className: 'rec-detail' },
          el('span', { className: 'rec-detail__label' }, `${label}:`),
          el('span', { className: 'rec-detail__value' }, value)
        );
        body.appendChild(row);
      }

      // Accordion behavior
      if (i !== 0) body.style.display = 'none';

      function toggleAccordion() {
        const expanded = header.getAttribute('aria-expanded') === 'true';
        header.setAttribute('aria-expanded', String(!expanded));
        body.style.display = expanded ? 'none' : 'block';
      }

      header.addEventListener('click', toggleAccordion);
      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleAccordion(); }
      });

      const card = el('div', { className: 'recommendation-card' });
      card.append(header, body);
      container.appendChild(card);
    }
  }

  // ── Render full report ────────────────────────────────────────

  function renderReport(report) {
    // Update subtitle
    const date = new Date(report.reportDate).toLocaleDateString('en-GB', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    $('report-subtitle').textContent = `Generated ${date}`;

    // Footer meta
    const orgId = qp('orgId') || '';
    $('report-footer-meta').textContent =
      `Report generated: ${date} | Organization ID: ${orgId} | Resilience Atlas for Teams`;

    renderTeamOverview(report);
    renderDimensionAnalysis(report.dimensionAnalysis || {});
    renderObservations(report.keyObservations || []);
    renderRecommendations(report.recommendations || []);

    // Show content
    $('state-loading').style.display = 'none';
    $('report-content').style.display = 'block';
  }

  // ── Generate first report ─────────────────────────────────────

  async function generateReport(orgId) {
    $('state-error').style.display = 'none';
    $('state-loading').style.display = 'block';
    $('state-loading').querySelector('p').textContent = 'Generating your report…';

    try {
      const res = await apiFetch(`/api/org/${orgId}/leadership-report/generate`, { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error || 'Generation failed.');
      await loadReport(orgId);
    } catch (err) {
      showError(err.message);
    }
  }

  // ── Load report ───────────────────────────────────────────────

  async function loadReport(orgId) {
    try {
      const res = await apiFetch(`/api/org/${orgId}/leadership-report`);
      if (res.status === 404) {
        // No report yet — show generate button
        $('state-loading').style.display = 'none';
        $('error-message').textContent = 'No report has been generated yet.';
        $('btn-generate-first').style.display = 'inline-flex';
        $('state-error').style.display = 'block';
        return;
      }
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load report.');

      const { report } = await res.json();
      renderReport(report);
    } catch (err) {
      showError(err.message);
    }
  }

  function showError(msg) {
    $('state-loading').style.display = 'none';
    $('error-message').textContent = msg || 'Unable to load the report.';
    $('btn-generate-first').style.display = 'none';
    $('state-error').style.display = 'block';
  }

  // ── Initialize ────────────────────────────────────────────────

  function init() {
    const orgId = qp('orgId');
    if (!orgId) {
      showError('No organization ID specified. Add ?orgId=<id> to the URL.');
      return;
    }

    // Wire up generate button
    $('btn-generate-first').addEventListener('click', () => generateReport(orgId));

    loadReport(orgId);
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
