/* =============================================================
   dashboard.js — Business-tier Team Dashboard client logic
   The Resilience Atlas™
   ============================================================= */

(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────

  var DIMENSION_LABELS = {
    relational: 'Relational',
    cognitive:  'Cognitive',
    somatic:    'Somatic',
    emotional:  'Emotional',
    spiritual:  'Spiritual',
    agentic:    'Agentic',
  };

  var DIMENSION_COLORS = {
    relational: '#4C9BE8',
    cognitive:  '#7B68EE',
    somatic:    '#FF8C69',
    emotional:  '#66CDAA',
    spiritual:  '#FFD700',
    agentic:    '#FF6B9D',
  };

  var TOKEN_KEY = 'token';

  // ── Utilities ──────────────────────────────────────────────────────────────

  function getAuthToken() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
  }

  function getOrgId() {
    return localStorage.getItem('org_id') || new URLSearchParams(window.location.search).get('orgId') || null;
  }

  function apiFetch(url, options) {
    var opts = options || {};
    var token = getAuthToken();
    var headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return fetch(url, Object.assign({}, opts, { headers: headers }));
  }

  function $(id) { return document.getElementById(id); }

  function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '—';
  }

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function scorePillClass(score) {
    if (score === null || score === undefined) return '';
    if (score >= 75) return 'score-pill--high';
    if (score >= 55) return 'score-pill--medium';
    return 'score-pill--low';
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (_) { return '—'; }
  }

  // ── Dashboard state ────────────────────────────────────────────────────────

  var state = {
    orgId:    null,
    summary:  null,
    members:  [],
    teams:    [],
    radarChart: null,
  };

  // ── Init ───────────────────────────────────────────────────────────────────

  function init() {
    if (!getAuthToken()) {
      showError('You must be logged in to view the dashboard. <a href="/index.html#login">Log in</a>');
      return;
    }

    // Wire up invite modal
    var btnInvite  = $('btn-invite');
    var btnCancel  = $('invite-cancel');
    var btnSend    = $('invite-send');
    var modal      = $('invite-modal');
    var exportBtn  = $('btn-export-csv');

    if (btnInvite) btnInvite.addEventListener('click', function () {
      modal.style.display = 'flex';
      $('invite-emails').focus();
    });
    if (btnCancel) btnCancel.addEventListener('click', closeModal);
    if (modal)     modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
    if (btnSend)   btnSend.addEventListener('click', sendInvitations);
    if (exportBtn) exportBtn.addEventListener('click', exportCSV);

    // Search
    var searchInput = $('members-search');
    if (searchInput) searchInput.addEventListener('input', function () {
      renderMembersTable(state.members, this.value.toLowerCase());
    });

    loadDashboard();
  }

  function closeModal() {
    var modal = $('invite-modal');
    if (modal) modal.style.display = 'none';
    $('invite-status').textContent = '';
  }

  // ── Load all data ──────────────────────────────────────────────────────────

  async function loadDashboard() {
    try {
      var [summaryRes, membersRes, teamsRes] = await Promise.all([
        apiFetch('/api/dashboard/org-summary'),
        apiFetch('/api/dashboard/members'),
        apiFetch('/api/dashboard/team-breakdown'),
      ]);

      // Handle auth/org errors
      if (summaryRes.status === 401 || summaryRes.status === 403) {
        var errData = await summaryRes.json().catch(function () { return {}; });
        showError(errData.error || 'Access denied. Please check that your account belongs to an organization.');
        return;
      }

      if (!summaryRes.ok) {
        showError('Failed to load dashboard data. Please try again later.');
        return;
      }

      var summaryData = await summaryRes.json();
      state.summary   = summaryData;
      state.orgId     = summaryData.organization && summaryData.organization.id;

      if (membersRes.ok) {
        var membersData = await membersRes.json();
        state.members = membersData.members || [];
      }

      if (teamsRes.ok) {
        var teamsData = await teamsRes.json();
        state.teams = teamsData.teams || [];
      }

      renderDashboard();

    } catch (err) {
      console.error('[Dashboard] Load error:', err);
      showError('Unable to connect to the server. Please try again.');
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  function renderDashboard() {
    $('dashboard-loading').style.display = 'none';
    $('dashboard-content').style.display = 'block';

    var org     = state.summary.organization;
    var summary = state.summary.summary;

    // Org name in header
    if (org && org.name) {
      $('org-name').textContent = 'Team Dashboard — ' + org.name;
      document.title = 'Dashboard — ' + org.name + ' | The Resilience Atlas™';
    }

    // Summary cards
    $('stat-avg-score').textContent = summary.avg_overall_score !== null
      ? summary.avg_overall_score + '%' : '—';

    $('stat-strongest').textContent    = capitalize(summary.strongest_dimension) || '—';
    $('stat-strongest-pct').textContent = summary.dimension_averages && summary.strongest_dimension
      ? (summary.dimension_averages[summary.strongest_dimension] || '—') + '%'
      : '—';

    $('stat-weakest').textContent     = capitalize(summary.weakest_dimension) || '—';
    $('stat-weakest-pct').textContent  = summary.dimension_averages && summary.weakest_dimension
      ? (summary.dimension_averages[summary.weakest_dimension] || '—') + '%'
      : '—';

    var completionPct = summary.completion_rate !== null
      ? Math.round(summary.completion_rate * 100) + '%' : '—';
    $('stat-completion').textContent = completionPct;
    $('stat-completion-detail').textContent = summary.completed_assessments + ' / ' + summary.total_members + ' members';

    // Radar + dimension bars
    renderRadarChart(summary.dimension_averages);
    renderDimensionBars(summary.dimension_averages);

    // Teams
    if (state.teams && state.teams.length > 1) {
      renderTeams(state.teams);
      $('team-section').style.display = 'block';
    }

    // Member table
    renderMembersTable(state.members, '');
  }

  function renderRadarChart(dimAverages) {
    var canvas = $('radar-canvas');
    if (!canvas || !window.Chart) return;

    var labels = Object.values(DIMENSION_LABELS);
    var data   = Object.keys(DIMENSION_LABELS).map(function (k) {
      return dimAverages && dimAverages[k] !== null ? dimAverages[k] : 0;
    });

    if (state.radarChart) {
      state.radarChart.destroy();
    }

    state.radarChart = new window.Chart(canvas, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Team Average',
          data: data,
          backgroundColor: 'rgba(44,95,138,0.18)',
          borderColor:     'rgba(44,95,138,0.9)',
          pointBackgroundColor: 'rgba(44,95,138,1)',
          pointBorderColor:     '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor:     'rgba(44,95,138,1)',
          borderWidth: 2,
          pointRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20,
              font: { size: 10 },
              color: '#6b7a8d',
            },
            pointLabels: {
              font: { size: 12, weight: '600' },
              color: '#1a2533',
            },
            grid:   { color: 'rgba(44,95,138,0.12)' },
            angleLines: { color: 'rgba(44,95,138,0.12)' },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) { return ctx.raw + '%'; },
            },
          },
        },
      },
    });
  }

  function renderDimensionBars(dimAverages) {
    var list = $('dim-bar-list');
    if (!list) return;

    list.innerHTML = Object.keys(DIMENSION_LABELS).map(function (key) {
      var pct   = (dimAverages && dimAverages[key] !== null) ? dimAverages[key] : 0;
      var label = DIMENSION_LABELS[key];
      var color = DIMENSION_COLORS[key] || 'var(--brand-primary)';
      return [
        '<li class="dim-bar-item">',
        '  <span class="dim-bar-item__label">' + escHtml(label) + '</span>',
        '  <div class="dim-bar-item__track" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="' + escHtml(label) + '">',
        '    <div class="dim-bar-item__fill" style="width:' + pct + '%;background:' + color + '"></div>',
        '  </div>',
        '  <span class="dim-bar-item__pct">' + pct + '%</span>',
        '</li>',
      ].join('');
    }).join('');
  }

  function renderTeams(teams) {
    var list = $('team-list');
    if (!list) return;

    var sorted = teams.slice().sort(function (a, b) {
      return (b.avg_score || 0) - (a.avg_score || 0);
    });

    list.innerHTML = sorted.map(function (t) {
      return [
        '<li class="team-list__item">',
        '  <span class="team-list__name">' + escHtml(t.team_name) + '</span>',
        '  <span>',
        '    <span class="team-list__score">' + (t.avg_score !== null ? t.avg_score + '%' : '—') + '</span>',
        '    <span class="team-list__count">· ' + t.member_count + ' member' + (t.member_count !== 1 ? 's' : '') + '</span>',
        '  </span>',
        '</li>',
      ].join('');
    }).join('');
  }

  function renderMembersTable(members, filter) {
    var tbody = $('members-tbody');
    var empty = $('members-empty');
    if (!tbody) return;

    var filtered = filter
      ? members.filter(function (m) {
          return (m.name || '').toLowerCase().includes(filter) ||
                 (m.team || '').toLowerCase().includes(filter) ||
                 (m.email || '').toLowerCase().includes(filter);
        })
      : members;

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = filtered.map(function (m) {
      var score     = m.overall_score;
      var pillClass = scorePillClass(score);
      var scoreStr  = score !== null && score !== undefined ? score + '%' : '—';

      return [
        '<tr>',
        '  <td>' + escHtml(m.name || '—') + '</td>',
        '  <td>' + escHtml(m.team || '—') + '</td>',
        '  <td>' + formatDate(m.completed_at) + '</td>',
        '  <td><span class="score-pill ' + pillClass + '">' + escHtml(scoreStr) + '</span></td>',
        '  <td>' + capitalize(m.dominant_dimension) + '</td>',
        '</tr>',
      ].join('');
    }).join('');
  }

  // ── Invite ─────────────────────────────────────────────────────────────────

  async function sendInvitations() {
    var emailsRaw = ($('invite-emails') || {}).value || '';
    var role      = ($('invite-role') || {}).value || 'member';
    var teamName  = (($('invite-team') || {}).value || '').trim() || null;
    var statusEl  = $('invite-status');
    var sendBtn   = $('invite-send');

    var emails = emailsRaw.split(/[\n,;]+/)
      .map(function (e) { return e.trim().toLowerCase(); })
      .filter(function (e) { return e.includes('@'); });

    if (emails.length === 0) {
      statusEl.textContent = '⚠️ Please enter at least one valid email address.';
      statusEl.style.color = '#c0392b';
      return;
    }

    sendBtn.disabled    = true;
    sendBtn.textContent = 'Sending…';
    statusEl.textContent = '';
    statusEl.style.color = '';

    // We need the org ID
    var orgId = state.orgId;
    if (!orgId) {
      statusEl.textContent = 'Error: Organization ID not found. Please reload the page.';
      statusEl.style.color = '#c0392b';
      sendBtn.disabled    = false;
      sendBtn.textContent = 'Send Invitations';
      return;
    }

    try {
      var res  = await apiFetch('/api/org/' + orgId + '/invite', {
        method: 'POST',
        body:   JSON.stringify({ emails: emails, role: role, team_name: teamName }),
      });
      var data = await res.json();

      if (res.ok && data.success) {
        statusEl.textContent = '✅ ' + (data.message || 'Invitations sent!');
        statusEl.style.color = '#1e7e4a';
        $('invite-emails').value = '';
      } else {
        statusEl.textContent = '❌ ' + (data.error || 'Failed to send invitations.');
        statusEl.style.color = '#c0392b';
      }
    } catch (err) {
      statusEl.textContent = '❌ Network error. Please try again.';
      statusEl.style.color = '#c0392b';
    }

    sendBtn.disabled    = false;
    sendBtn.textContent = 'Send Invitations';
  }

  // ── CSV Export ─────────────────────────────────────────────────────────────

  async function exportCSV() {
    var btn = $('btn-export-csv');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Exporting…'; }

    try {
      var res = await apiFetch('/api/dashboard/export/csv');

      if (res.status === 403) {
        var errData = await res.json().catch(function () { return {}; });
        alert(errData.error || 'Only admins can export CSV.');
        return;
      }

      if (!res.ok) {
        alert('Failed to export CSV. Please try again.');
        return;
      }

      var blob = await res.blob();
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement('a');
      var cd   = res.headers.get('Content-Disposition') || '';
      var m    = cd.match(/filename="?([^"]+)"?/);
      a.download = m ? m[1] : 'resilience-results.csv';
      a.href   = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[Dashboard] CSV export error:', err);
      alert('Export failed. Please try again.');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '⬇ Export CSV'; }
    }
  }

  // ── Error state ────────────────────────────────────────────────────────────

  function showError(msg) {
    $('dashboard-loading').style.display = 'none';
    $('dashboard-content').style.display = 'none';
    var errEl = $('dashboard-error');
    if (errEl) {
      errEl.innerHTML = '<div class="status-msg status-msg--error" role="alert">' + msg + '</div>';
      errEl.style.display = 'block';
    }
  }

  // ── Business tier checkout ─────────────────────────────────────────────────

  window.startBusinessCheckout = function () {
    if (window.PaymentGating && window.PaymentGating.startCheckout) {
      window.PaymentGating.startCheckout('business');
    } else {
      alert('Upgrade functionality is not available right now. Please contact support.');
    }
  };

  // ── Boot ───────────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
