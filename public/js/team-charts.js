/* team-charts.js — Team Analytics Dashboard UI logic & Chart.js rendering
 *
 * Exposes a single global object: TeamAnalytics
 *
 * Dependencies: Chart.js (loaded before this script via defer)
 */

/* global Chart */
'use strict';

const TeamAnalytics = (() => {

  // ── Dimension display labels (matches backend) ──────────────────────────
  const DIM_LABELS = [
    'Cognitive-Narrative',
    'Relational-Connective',
    'Agentic-Generative',
    'Emotional-Adaptive',
    'Spiritual-Reflective',
    'Somatic-Regulative',
  ];

  // Short keys used in dimensionScores objects
  const DIM_KEYS = ['cognitive', 'relational', 'agentic', 'emotional', 'spiritual', 'somatic'];

  const DIM_COLORS = [
    'rgba(59, 130, 246, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)',
  ];

  let _orgId = null;
  let _state = { analytics: null, members: null, risk: null };
  let _trendCharts = {};

  // ── API helpers ─────────────────────────────────────────────────────────

  function authHeaders() {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function apiFetch(url, opts = {}) {
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...authHeaders() }, ...opts });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // ── Score category helper ───────────────────────────────────────────────

  function scoreCategory(score) {
    if (score == null) return 'na';
    if (score >= 80) return 'strong';
    if (score >= 65) return 'solid';
    if (score >= 45) return 'developing';
    return 'emerging';
  }

  function scoreCssClass(score) {
    return `score-${scoreCategory(score)}`;
  }

  function heatmapCssClass(score) {
    return `hm-${scoreCategory(score)}`;
  }

  // ── Initials helper ─────────────────────────────────────────────────────

  function initials(name) {
    if (!name) return '?';
    return name.split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase();
  }

  // ── Show / hide helpers ─────────────────────────────────────────────────

  function showLoading() {
    document.getElementById('ta-loading').hidden = false;
    document.getElementById('ta-error').hidden   = true;
    document.getElementById('ta-content').hidden  = true;
  }

  function showError(msg) {
    document.getElementById('ta-loading').hidden = true;
    document.getElementById('ta-error').hidden   = false;
    document.getElementById('ta-content').hidden  = true;
    document.getElementById('ta-error-msg').textContent = msg;
  }

  function showContent() {
    document.getElementById('ta-loading').hidden = true;
    document.getElementById('ta-error').hidden   = true;
    document.getElementById('ta-content').hidden  = false;
  }

  // ── KPI cards ───────────────────────────────────────────────────────────

  function renderKPIs(analytics) {
    const tp = analytics.teamProfile || {};
    const overallScore = tp.overallScore ?? analytics.overallScore ?? null;
    const memberCount  = tp.memberCount  ?? analytics.memberCount  ?? 0;
    const atRiskCount  = analytics.atRiskCount ?? 0;
    const lastDate     = tp.assessmentDate
      ? new Date(tp.assessmentDate).toLocaleDateString()
      : 'N/A';

    const cards = [
      { val: overallScore != null ? `${overallScore}%` : '—', label: 'Overall Resilience' },
      { val: memberCount,  label: 'Team Members' },
      { val: atRiskCount,  label: 'Members at Risk' },
      { val: lastDate,     label: 'Last Assessment' },
    ];

    document.getElementById('kpi-grid').innerHTML = cards.map((c) => `
      <div class="kpi-card">
        <div class="kpi-card__val">${c.val}</div>
        <div class="kpi-card__label">${c.label}</div>
      </div>`).join('');

    // Update header org name
    const orgName = tp.name || analytics.org?.name || 'Team Analytics';
    document.getElementById('header-org-name').textContent = orgName;
  }

  // ── Member grid ─────────────────────────────────────────────────────────

  function renderMembers(members) {
    const grid = document.getElementById('member-grid');
    if (!members || !members.length) {
      grid.innerHTML = '<p style="color:#718096;grid-column:1/-1;">No member data available.</p>';
      return;
    }

    grid.innerHTML = members.map((m) => {
      const cat   = scoreCategory(m.score);
      const score = m.score != null ? `${m.score}%` : '—';
      const date  = m.assessmentDate ? new Date(m.assessmentDate).toLocaleDateString() : 'N/A';
      const flags = m.riskFlags && m.riskFlags.length
        ? `<div class="member-card__flags">⚠️ ${m.riskFlags.slice(0, 2).join('<br>')}</div>`
        : '';

      return `
        <div class="member-card">
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <div class="member-card__avatar">${initials(m.name)}</div>
            <div>
              <div class="member-card__name">${escapeHtml(m.name || 'Team Member')}</div>
              <div class="member-card__role">${escapeHtml(m.role || 'member')}</div>
            </div>
          </div>
          <div class="member-card__score ${scoreCssClass(m.score)}">${score}</div>
          <div style="font-size:0.75rem;color:#718096;">Last: ${date}</div>
          <span class="status-badge status-${m.status || 'pending'}">${m.status || 'pending'}</span>
          ${flags}
        </div>`;
    }).join('');
  }

  // ── Heatmap ─────────────────────────────────────────────────────────────

  function renderHeatmap(members, dimAverages) {
    const table = document.getElementById('heatmap-table');

    // Build short-key averages from display-label averages
    const avgByKey = {};
    if (dimAverages) {
      DIM_LABELS.forEach((label, i) => {
        avgByKey[DIM_KEYS[i]] = dimAverages[label] ?? null;
      });
    }

    const assessed = (members || []).filter((m) => m.status === 'assessed');

    // Header row
    const headerCols = DIM_LABELS.map((l) => `<th title="${l}">${l.split('-')[0]}</th>`).join('');
    let html = `<thead><tr><th class="name-col">Member</th>${headerCols}</tr></thead><tbody>`;

    // Member rows
    for (const m of assessed) {
      const ds = m.dimensionScores || {};
      const cells = DIM_KEYS.map((k) => {
        const val = ds[k];
        return `<td class="${heatmapCssClass(val)}" title="${val != null ? val + '%' : 'N/A'}">${val != null ? val + '%' : '—'}</td>`;
      }).join('');
      html += `<tr><td class="name-col">${escapeHtml(m.name || 'Member')}</td>${cells}</tr>`;
    }

    // Average row
    if (assessed.length > 0) {
      const avgCells = DIM_KEYS.map((k) => {
        const v = avgByKey[k];
        return `<td class="${heatmapCssClass(v)}">${v != null ? v + '%' : '—'}</td>`;
      }).join('');
      html += `<tr class="heatmap-avg-row"><td class="name-col">⌀ Team Avg</td>${avgCells}</tr>`;
    }

    html += '</tbody>';
    table.innerHTML = html;
  }

  // ── Trend charts ────────────────────────────────────────────────────────

  function renderTrends(trends) {
    const grid = document.getElementById('trends-grid');

    // Destroy any existing Chart instances
    Object.values(_trendCharts).forEach((c) => c.destroy && c.destroy());
    _trendCharts = {};

    if (!trends) {
      grid.innerHTML = '<p style="color:#718096;">Trend data will appear after multiple analytics runs.</p>';
      return;
    }

    grid.innerHTML = DIM_LABELS.map((label, i) => {
      const canvasId = `trend-canvas-${i}`;
      return `
        <div class="trend-chart-wrap">
          <h4>${label}</h4>
          <canvas id="${canvasId}" class="trend-canvas"></canvas>
        </div>`;
    }).join('');

    // Render after DOM update
    requestAnimationFrame(() => {
      DIM_LABELS.forEach((label, i) => {
        const entries = (trends[label] || []);
        const canvasEl = document.getElementById(`trend-canvas-${i}`);
        if (!canvasEl) return;

        const labels  = entries.map((e) => new Date(e.date).toLocaleDateString());
        const avgData = entries.map((e) => e.average);
        const minData = entries.map((e) => e.min);
        const maxData = entries.map((e) => e.max);

        if (!entries.length) {
          canvasEl.parentElement.innerHTML += '<p style="font-size:0.75rem;color:#a0aec0;text-align:center;">No trend data yet</p>';
          return;
        }

        const color = DIM_COLORS[i];
        _trendCharts[label] = new Chart(canvasEl, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'Average',
                data: avgData,
                borderColor: color,
                backgroundColor: color.replace('0.8', '0.15'),
                tension: 0.3,
                fill: true,
                pointRadius: 3,
              },
              {
                label: 'Min',
                data: minData,
                borderColor: 'rgba(160,174,192,0.6)',
                borderDash: [4, 4],
                pointRadius: 0,
                fill: false,
              },
              {
                label: 'Max',
                data: maxData,
                borderColor: 'rgba(160,174,192,0.6)',
                borderDash: [4, 4],
                pointRadius: 0,
                fill: false,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { min: 0, max: 100, ticks: { font: { size: 10 } } },
              x: { ticks: { font: { size: 10 }, maxTicksLimit: 6 } },
            },
          },
        });
      });
    });
  }

  // ── Risk panel ──────────────────────────────────────────────────────────

  function renderRisk(riskData, members) {
    const summary = document.getElementById('risk-summary');
    const list    = document.getElementById('risk-list');

    // Derive at-risk members from local member data if API risk endpoint not available
    const atRisk = riskData
      ? riskData.members
      : (members || []).filter((m) => m.riskFlags && m.riskFlags.length > 0);

    if (!atRisk || !atRisk.length) {
      summary.innerHTML = '<p style="color:#38a169;">✅ No members are currently at risk. Keep up the great work!</p>';
      list.innerHTML = '';
      return;
    }

    summary.innerHTML = `<p style="color:#e53e3e;font-weight:600;">⚠️ ${atRisk.length} member(s) flagged for support.</p>`;

    list.innerHTML = atRisk.map((m) => `
      <li class="risk-item">
        <div class="risk-item__name">${escapeHtml(m.name || 'Member')} — Score: ${m.score != null ? m.score + '%' : 'N/A'}</div>
        <div class="risk-item__flags">${(m.riskFlags || []).map(escapeHtml).join('<br>')}</div>
      </li>`).join('');
  }

  // ── Strength panel ──────────────────────────────────────────────────────

  function renderStrengths(dimAverages) {
    const grid = document.getElementById('strength-grid');

    if (!dimAverages) {
      grid.innerHTML = '<p style="color:#718096;">No data available.</p>';
      return;
    }

    const sorted = DIM_LABELS
      .map((label) => ({ label, score: dimAverages[label] ?? 0 }))
      .sort((a, b) => b.score - a.score);

    const top3    = sorted.slice(0, 3);
    const bottom3 = sorted.slice(-3).reverse();

    grid.innerHTML = `
      <div>
        <h3 style="font-size:0.9rem;color:#4a5568;margin:0 0 0.5rem;">🏆 Top Strengths</h3>
        <ul class="strength-list">
          ${top3.map((d) => `<li>✅ <strong>${d.label}</strong> — ${d.score}%</li>`).join('')}
        </ul>
      </div>
      <div>
        <h3 style="font-size:0.9rem;color:#4a5568;margin:0 0 0.5rem;">🌱 Growth Areas</h3>
        <ul class="strength-list">
          ${bottom3.map((d) => `<li>📈 <strong>${d.label}</strong> — ${d.score}%</li>`).join('')}
        </ul>
      </div>`;
  }

  // ── Recommendations panel ───────────────────────────────────────────────

  function renderRecommendations(recommendations) {
    const container = document.getElementById('recommendations-content');
    const pairsList = document.getElementById('pairs-list');

    if (!recommendations) {
      container.innerHTML = '<p style="color:#718096;">No recommendations available.</p>';
      return;
    }

    const { strengthFocus = [], riskIntervention = [], workshopSuggestions = [], peerMentoringPairs = [] } = recommendations;

    container.innerHTML = `
      ${strengthFocus.length ? `
        <h3 style="font-size:0.875rem;color:#2f855a;margin:0 0 0.4rem;">💡 Leverage Team Strengths</h3>
        <ul style="margin:0 0 1rem;padding-left:1.25rem;font-size:0.875rem;line-height:1.8;">
          ${strengthFocus.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}
        </ul>` : ''}
      ${riskIntervention.length ? `
        <h3 style="font-size:0.875rem;color:#c05621;margin:0 0 0.4rem;">🛠 Risk Interventions</h3>
        <ul style="margin:0 0 1rem;padding-left:1.25rem;font-size:0.875rem;line-height:1.8;">
          ${riskIntervention.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}
        </ul>` : ''}
      ${workshopSuggestions.length ? `
        <h3 style="font-size:0.875rem;color:#2b6cb0;margin:0 0 0.4rem;">🎓 Suggested Workshops</h3>
        <ul style="margin:0 0 1rem;padding-left:1.25rem;font-size:0.875rem;line-height:1.8;">
          ${workshopSuggestions.map((w) => `<li>${escapeHtml(w)}</li>`).join('')}
        </ul>` : ''}`;

    pairsList.innerHTML = peerMentoringPairs.length
      ? peerMentoringPairs.map((p) =>
          `<li>🤝 <strong>${escapeHtml(p.mentor)}</strong> → <strong>${escapeHtml(p.mentee)}</strong> in <em>${escapeHtml(p.dimension)}</em></li>`
        ).join('')
      : '<li style="color:#718096;">No mentoring pairs identified yet.</li>';
  }

  // ── XSS safe helper ────────────────────────────────────────────────────

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  // ── Render full dashboard ───────────────────────────────────────────────

  function render(analytics, members, riskData) {
    const tp = analytics.teamProfile || {};
    const dimAverages     = tp.dimensionAverages || {};
    const trends          = tp.trends || null;
    const recommendations = analytics.recommendations || null;

    renderKPIs(analytics);
    renderMembers(members);
    renderHeatmap(members, dimAverages);
    renderTrends(trends);
    renderRisk(riskData, members);
    renderStrengths(dimAverages);
    renderRecommendations(recommendations);
    showContent();
  }

  // ── Load data ───────────────────────────────────────────────────────────

  async function load() {
    showLoading();
    try {
      const base = `/api/team-analytics/${_orgId}`;

      // Fetch analytics snapshot
      let analytics;
      try {
        const data = await apiFetch(base);
        analytics = data.analytics;
      } catch (err) {
        if (err.message.includes('No analytics snapshot')) {
          // Auto-generate on first visit
          await apiFetch(`${base}/generate`, { method: 'POST' });
          const data = await apiFetch(base);
          analytics = data.analytics;
        } else {
          throw err;
        }
      }

      // Fetch members (full detail for admins)
      let members = [];
      try {
        const mData = await apiFetch(`${base}/members`);
        members = mData.members || [];
      } catch (_) { /* non-critical */ }

      // Fetch risk data
      let riskData = null;
      try {
        riskData = await apiFetch(`${base}/risk`);
      } catch (_) { /* non-critical */ }

      _state = { analytics, members, riskData };

      // Merge recommendations from analytics if present in full profile
      if (!analytics.recommendations && analytics._id) {
        // recommendations are in the full TeamProfile doc, not the summary
        // use what we have from memberStatus-derived data above
      }

      render(analytics, members, riskData);
    } catch (err) {
      showError(err.message || 'Failed to load team analytics.');
    }
  }

  // ── Trigger generate ────────────────────────────────────────────────────

  async function generate() {
    const btn = document.getElementById('btn-generate');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Generating…'; }
    try {
      await apiFetch(`/api/team-analytics/${_orgId}/generate`, { method: 'POST' });
      await load();
    } catch (err) {
      alert('Failed to generate analytics: ' + err.message);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '🔄 Refresh Analytics'; }
    }
  }

  // ── Download report ─────────────────────────────────────────────────────

  function downloadReport() {
    window.open(`/api/team-analytics/${_orgId}/report`, '_blank');
  }

  // ── Public init ─────────────────────────────────────────────────────────

  function init(orgId) {
    _orgId = orgId;

    document.getElementById('btn-generate').addEventListener('click', generate);
    document.getElementById('btn-report').addEventListener('click', downloadReport);

    load();
  }

  return { init, load, generate, downloadReport };
})();
