'use strict';

/**
 * dashboard.js — Main logic for the Business Tier Team Dashboard.
 *
 * Reads orgId from localStorage (set after org creation / login).
 * Fetches analytics, results, and org details from the API, then
 * delegates rendering to analytics.js.
 *
 * Exposed as window.Dashboard.
 */
(function (window) {

  var ORG_ID_KEY  = 'resilience_org_id';
  var TOKEN_KEY   = 'token';

  // ── Utilities ───────────────────────────────────────────────────────────────

  function getToken()  { return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null; }
  function getOrgId()  { return localStorage.getItem(ORG_ID_KEY) || new URLSearchParams(window.location.search).get('orgId') || null; }

  function apiFetch(url, options) {
    options = options || {};
    var token   = getToken();
    var headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return fetch(url, Object.assign({}, options, { headers: headers }));
  }

  function $(id) { return document.getElementById(id); }

  function setText(id, val) {
    var el = $(id);
    if (el) el.textContent = val;
  }

  function show(id) { var el = $(id); if (el) el.hidden = false; }
  function hide(id) { var el = $(id); if (el) el.hidden = true;  }

  // ── State ────────────────────────────────────────────────────────────────────

  var _results  = [];
  var _sortCol  = 'createdAt';
  var _sortAsc  = false;
  var _filter   = '';

  // ── Load ────────────────────────────────────────────────────────────────────

  async function load() {
    hide('dash-error');
    show('dash-loading');
    hide('kpi-section');
    hide('charts-section');
    hide('members-section');
    hide('admin-section');

    // Gate check — only show dashboard content for business tier users
    if (typeof PaymentGating === 'undefined' || !PaymentGating.isBusiness()) {
      hide('dash-loading');
      // The gating section already shows the upgrade prompt via payment-gating.js
      return;
    }

    var orgId = getOrgId();
    if (!orgId) {
      _showError('No organisation found. Please create or join an organisation.');
      return;
    }

    try {
      var [analyticsRes, resultsRes, orgRes] = await Promise.all([
        apiFetch('/api/organizations/' + orgId + '/analytics'),
        apiFetch('/api/organizations/' + orgId + '/results'),
        apiFetch('/api/organizations/' + orgId),
      ]);

      if (!analyticsRes.ok) throw new Error('Failed to load analytics');
      if (!resultsRes.ok)   throw new Error('Failed to load results');

      var analyticsData = await analyticsRes.json();
      var resultsData   = await resultsRes.json();
      var orgData       = orgRes.ok ? await orgRes.json() : { organization: {} };

      hide('dash-loading');
      _render(analyticsData.analytics, resultsData.results, orgData.organization);
    } catch (err) {
      console.error('[Dashboard] load error:', err);
      _showError(err.message || 'Unable to load team data.');
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  function _render(analytics, results, org) {
    _results = results || [];

    // Org name
    var orgName = (org && (org.company_name || org.name)) || 'Your Organisation';
    setText('org-name', orgName);

    // KPIs
    var avg = analytics && analytics.averages ? analytics.averages : {};
    setText('kpi-members', analytics ? analytics.team_count : '—');
    setText('kpi-overall', avg.overall != null ? Math.round(avg.overall) + '%' : '—');
    setText('kpi-top-dim-val', Analytics.topDimension(avg));
    show('kpi-section');

    // Radar chart
    var canvas = $('teamRadarChart');
    Analytics.renderRadar(canvas, avg);

    // Dimension cards
    var dimContainer = $('dim-cards');
    Analytics.renderDimCards(dimContainer, avg);
    show('charts-section');

    // Members table
    _renderTable();
    show('members-section');

    // Admin panel (shown to all business tier admins for now)
    _renderAdminPanel(org);
    show('admin-section');
  }

  // ── Members table ────────────────────────────────────────────────────────────

  function _renderTable() {
    var tbody = $('members-tbody');
    if (!tbody) return;

    var rows = _results.slice();

    // Filter
    if (_filter) {
      var q = _filter.toLowerCase();
      rows = rows.filter(function (r) {
        return (r.firstName || '').toLowerCase().includes(q) ||
               (r.email    || '').toLowerCase().includes(q);
      });
    }

    // Sort
    rows.sort(function (a, b) {
      var av = _cellVal(a, _sortCol);
      var bv = _cellVal(b, _sortCol);
      if (av < bv) return _sortAsc ? -1 :  1;
      if (av > bv) return _sortAsc ?  1 : -1;
      return 0;
    });

    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No results yet.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(function (r) {
      var date = r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
      var overall = r.overall != null ? Math.round(r.overall) + '%' : '—';
      return '<tr>' +
        '<td>' + _esc(r.firstName || '—') + '</td>' +
        '<td>' + _esc(r.email    || '—') + '</td>' +
        '<td>' + overall + '</td>' +
        '<td>' + _esc(r.dominantType || '—') + '</td>' +
        '<td>' + date + '</td>' +
        '<td><a href="/results.html?resultId=' + _esc(r._id || '') + '" class="table-action-link">View</a></td>' +
      '</tr>';
    }).join('');
  }

  function _cellVal(r, col) {
    if (col === 'name')        return (r.firstName || '').toLowerCase();
    if (col === 'email')       return (r.email     || '').toLowerCase();
    if (col === 'overall')     return r.overall || 0;
    if (col === 'dominantType') return (r.dominantType || '').toLowerCase();
    if (col === 'createdAt')   return r.createdAt || '';
    return '';
  }

  // ── Admin panel ─────────────────────────────────────────────────────────────

  function _renderAdminPanel(org) {
    if (!org) return;
    setText('sub-plan',      org.plan              || '—');
    setText('sub-status',    org.subscription_status || '—');
    setText('sub-team-name', org.settings && org.settings.team_name ? org.settings.team_name : '—');
    setText('sub-max-users', org.settings && org.settings.max_users != null ? org.settings.max_users : '—');
  }

  // ── Exports ──────────────────────────────────────────────────────────────────

  async function exportCsv() {
    var orgId = getOrgId();
    if (!orgId) return;
    try {
      var res = await apiFetch('/api/organizations/' + orgId + '/export/csv', { method: 'POST' });
      if (!res.ok) { alert('Export failed. Please try again.'); return; }
      var blob = await res.blob();
      _downloadBlob(blob, 'team-results.csv', 'text/csv');
    } catch (err) {
      console.error('[Dashboard] CSV export error:', err);
      alert('Export failed. Please try again.');
    }
  }

  async function exportPdf() {
    var orgId = getOrgId();
    if (!orgId) return;
    try {
      var res = await apiFetch('/api/organizations/' + orgId + '/export/pdf', { method: 'POST' });
      if (!res.ok) { alert('PDF export failed. Please try again.'); return; }
      var blob = await res.blob();
      _downloadBlob(blob, 'team-report.pdf', 'application/pdf');
    } catch (err) {
      console.error('[Dashboard] PDF export error:', err);
      alert('PDF export failed. Please try again.');
    }
  }

  function _downloadBlob(blob, filename, mimeType) {
    var url  = URL.createObjectURL(new Blob([blob], { type: mimeType }));
    var link = document.createElement('a');
    link.href     = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // ── Invite ───────────────────────────────────────────────────────────────────

  async function sendInvites() {
    var orgId = getOrgId();
    var textarea = $('invite-email');
    var statusEl = $('invite-status');
    if (!orgId || !textarea) return;

    var raw    = textarea.value.trim();
    var emails = raw.split(/[\s,;]+/).filter(function (e) { return e.includes('@'); });

    if (emails.length === 0) {
      if (statusEl) { statusEl.textContent = 'Please enter at least one valid email.'; statusEl.className = 'status-msg status-msg--error'; }
      return;
    }

    try {
      var res  = await apiFetch('/api/organizations/' + orgId + '/invite', {
        method: 'POST',
        body: JSON.stringify({ emails: emails }),
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invite failed.');
      if (statusEl) {
        statusEl.textContent = data.message || 'Invites sent!';
        statusEl.className   = 'status-msg status-msg--success';
      }
      textarea.value = '';
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = err.message;
        statusEl.className   = 'status-msg status-msg--error';
      }
    }
  }

  // ── Error helper ─────────────────────────────────────────────────────────────

  function _showError(msg) {
    hide('dash-loading');
    setText('dash-error-msg', msg);
    show('dash-error');
  }

  // ── Escape ───────────────────────────────────────────────────────────────────

  function _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Init ────────────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    // Sort headers
    document.querySelectorAll('th.sortable').forEach(function (th) {
      th.addEventListener('click', function () {
        var col = th.getAttribute('data-col');
        if (_sortCol === col) { _sortAsc = !_sortAsc; }
        else { _sortCol = col; _sortAsc = true; }
        _renderTable();
      });
      th.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { th.click(); }
      });
    });

    // Search
    var searchInput = $('member-search');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        _filter = searchInput.value;
        _renderTable();
      });
    }

    // Export buttons
    var csvBtn = $('btn-export-csv');
    if (csvBtn) csvBtn.addEventListener('click', exportCsv);

    var pdfBtn = $('btn-export-pdf');
    if (pdfBtn) pdfBtn.addEventListener('click', exportPdf);

    // Invite
    var inviteBtn = $('btn-invite');
    if (inviteBtn) inviteBtn.addEventListener('click', sendInvites);

    // Sign out
    var logoutBtn = $('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        window.location.href = '/index.html';
      });
    }

    // Wait for PaymentGating to be ready, then load
    if (typeof PaymentGating !== 'undefined' && PaymentGating.isBusiness()) {
      load();
    } else {
      // PaymentGating handles gating visuals; no data to load
      hide('dash-loading');
    }
  });

  // ── Public API ───────────────────────────────────────────────────────────────

  window.Dashboard = {
    load:       load,
    exportCsv:  exportCsv,
    exportPdf:  exportPdf,
    sendInvites: sendInvites,
  };

})(window);
