/* =============================================================
   org-dashboard.js
   Client-side logic for the Organisation Dashboard page.
   Reads ?orgId=<id> from the URL and populates the dashboard
   with leadership report summary data.
   ============================================================= */

(function () {
  'use strict';

  // ── Utilities ─────────────────────────────────────────────────

  function qp(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token') || null;
  }

  function apiFetch(url, options = {}) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { ...options, headers });
  }

  function $(id) { return document.getElementById(id); }

  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'className') node.className = v;
      else if (k === 'innerHTML') node.innerHTML = v;
      else node.setAttribute(k, v);
    }
    for (const child of children) {
      if (typeof child === 'string') node.appendChild(document.createTextNode(child));
      else if (child) node.appendChild(child);
    }
    return node;
  }

  // ── Render helpers ────────────────────────────────────────────

  function renderKpis(ov) {
    const row = $('kpi-row');
    row.innerHTML = '';
    const items = [
      { val: ov.totalRespondents ?? '—', lbl: 'Participants' },
      { val: ov.responseRate != null ? `${ov.responseRate}%` : '—', lbl: 'Response Rate' },
      { val: ov.averageOverallScore != null ? `${ov.averageOverallScore}` : '—', lbl: 'Avg Score' },
      { val: ov.resilienceLevel ? ov.resilienceLevel.charAt(0).toUpperCase() + ov.resilienceLevel.slice(1) : '—', lbl: 'Level' },
    ];
    for (const { val, lbl } of items) {
      row.appendChild(el('div', { className: 'kpi-box', role: 'listitem' },
        el('div', { className: 'kpi-box__val' }, String(val)),
        el('div', { className: 'kpi-box__lbl' }, lbl)
      ));
    }
  }

  function renderDimChart(dimAnalysis) {
    const container = $('dim-chart');
    container.innerHTML = '';
    if (!dimAnalysis) return;

    const dims = Object.entries(dimAnalysis).sort((a, b) => b[1].average - a[1].average);

    for (const [dim, data] of dims) {
      const avg = data.average ?? 0;
      const row = el('div', { className: 'dim-bar-row' },
        el('span', { className: 'dim-bar-label', title: dim }, dim),
        (() => {
          const t = el('div', { className: 'dim-bar-track', role: 'progressbar', 'aria-valuenow': avg, 'aria-valuemin': '0', 'aria-valuemax': '100' });
          const f = el('div', { className: 'dim-bar-fill' });
          f.style.width = `${avg}%`;
          t.appendChild(f);
          return t;
        })(),
        el('span', { className: 'dim-bar-pct' }, `${avg}%`)
      );
      container.appendChild(row);
    }
  }

  function renderObservations(obs) {
    const ICONS = { strength: '💪', risk: '⚠️', opportunity: '🌱', balance: '⚖️', demographic: '👥' };

    $('observations-section').style.display = 'block';
    const preview = $('obs-preview');
    const full = $('obs-full');
    preview.innerHTML = '';
    full.innerHTML = '';

    const first2 = obs.slice(0, 2);
    const rest = obs.slice(2);

    for (const o of first2) {
      preview.appendChild(el('p', {}, `${ICONS[o.type] || '📝'} ${o.observation}`));
    }
    for (const o of rest) {
      full.appendChild(el('p', {}, `${ICONS[o.type] || '📝'} ${o.observation}`));
    }
  }

  function renderRecommendations(recs) {
    $('recs-section').style.display = 'block';
    const preview = $('recs-preview');
    const full = $('recs-full');
    preview.innerHTML = '';
    full.innerHTML = '';

    const first2 = recs.slice(0, 2);
    const rest = recs.slice(2);

    for (const r of first2) {
      preview.appendChild(el('p', {},
        el('strong', {}, `${r.title || r.action}: `),
      ));
      const p = preview.lastElementChild;
      p.appendChild(document.createTextNode(r.rationale || ''));
    }
    for (const r of rest) {
      full.appendChild(el('p', {},
        el('strong', {}, `${r.title || r.action}: `),
      ));
      const p = full.lastElementChild;
      p.appendChild(document.createTextNode(r.rationale || ''));
    }
  }

  function renderOrgStats(ov) {
    $('stat-invited').textContent = ov.totalInvited ?? '—';
    $('stat-responded').textContent = ov.totalRespondents ?? '—';
    $('stat-rate').textContent = ov.responseRate != null ? `${ov.responseRate}%` : '—';
  }

  // ── Report history ────────────────────────────────────────────

  async function loadHistory(orgId) {
    const list = $('history-list');
    try {
      const res = await apiFetch(`/api/org/${orgId}/leadership-report/history`);
      if (!res.ok) throw new Error();
      const { history } = await res.json();

      list.innerHTML = '';
      if (!history || !history.length) {
        list.innerHTML = '<li style="color:var(--text-muted);font-size:0.88rem">No reports yet.</li>';
        return;
      }

      for (const item of history) {
        const date = new Date(item.reportDate).toLocaleDateString('en-GB', {
          year: 'numeric', month: 'short', day: 'numeric',
        });
        const li = el('li', { className: 'history-item' },
          el('span', { className: 'history-date' }, date),
          el('span', { className: 'history-meta' }, `${item.respondents} respondents · ${item.averageScore}%`)
        );
        list.appendChild(li);
      }
    } catch (_) {
      list.innerHTML = '<li style="color:var(--text-muted);font-size:0.88rem">Unable to load history.</li>';
    }
  }

  // ── Full report link ──────────────────────────────────────────

  function wireFullReportButtons(orgId) {
    const url = `/pages/leadership-report.html?orgId=${encodeURIComponent(orgId)}`;
    const btn1 = $('btn-full-report');
    const btn2 = $('btn-full-report-2');
    if (btn1) btn1.addEventListener('click', () => { window.location.href = url; });
    if (btn2) btn2.addEventListener('click', () => { window.location.href = url; });
  }

  // ── Generate report ───────────────────────────────────────────

  async function generateReport(orgId) {
    const status = $('generate-status');
    status.textContent = 'Generating…';
    try {
      const res = await apiFetch(`/api/org/${orgId}/leadership-report/generate`, { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed.');
      status.textContent = '✅ Report generated!';
      await loadDashboard(orgId);
    } catch (err) {
      status.textContent = `❌ ${err.message}`;
    }
  }

  // ── Main load ─────────────────────────────────────────────────

  async function loadDashboard(orgId) {
    try {
      const res = await apiFetch(`/api/org/${orgId}/leadership-report`);
      const loading = $('insights-loading');
      const content = $('insights-content');
      const empty = $('insights-empty');

      if (res.status === 404) {
        loading.style.display = 'none';
        empty.style.display = 'block';
        return;
      }
      if (!res.ok) throw new Error();

      const { report } = await res.json();
      loading.style.display = 'none';
      content.style.display = 'block';

      renderOrgStats(report.teamOverview || {});
      renderKpis(report.teamOverview || {});
      renderDimChart(report.dimensionAnalysis || {});

      if (report.keyObservations && report.keyObservations.length) {
        renderObservations(report.keyObservations);
      }
      if (report.recommendations && report.recommendations.length) {
        renderRecommendations(report.recommendations);
      }
    } catch (_) {
      $('insights-loading').textContent = 'Unable to load report. Please try again.';
    }
  }

  // ── Init ──────────────────────────────────────────────────────

  function init() {
    const orgId = qp('orgId');
    if (!orgId) {
      $('insights-loading').textContent = 'No organisation ID specified (?orgId=…).';
      return;
    }

    // Load org name if possible
    apiFetch(`/api/org/${orgId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && data.organization) {
          $('org-name').textContent = data.organization.name || 'Organisation Dashboard';
        }
      })
      .catch(() => {});

    wireFullReportButtons(orgId);
    $('btn-generate').addEventListener('click', () => generateReport(orgId));

    loadHistory(orgId);
    loadDashboard(orgId);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
