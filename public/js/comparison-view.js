/**
 * comparison-view.js
 *
 * Client-side rendering for the Resilience Profile Comparison page.
 * Handles tab navigation, API calls, radar chart rendering and result display.
 */
(function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────────

  const API_BASE = '/api/comparisons';

  const DIMENSIONS = ['emotional', 'mental', 'physical', 'social', 'spiritual', 'financial'];

  const DIMENSION_LABELS = {
    emotional:  'Emotional',
    mental:     'Mental',
    physical:   'Physical',
    social:     'Social',
    spiritual:  'Spiritual',
    financial:  'Financial',
  };

  const RADAR_COLOR_1 = 'rgba(37, 99, 235, 0.7)';
  const RADAR_COLOR_2 = 'rgba(234, 108, 0, 0.7)';

  // Charts instances — kept so they can be destroyed on re-render
  let chart1Instance = null;
  let chart2Instance = null;
  let growthChartInstance = null;

  // Current active comparison id
  let currentComparisonId = null;

  // Auth token from localStorage (set by auth.js / app.js)
  function getToken() {
    return localStorage.getItem('token') || localStorage.getItem('jwt') || '';
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setStatus(elId, msg, type) {
    var el = document.getElementById(elId);
    if (!el) return;
    el.textContent = msg;
    el.className = 'form-status ' + (type || '');
  }

  async function apiFetch(path, opts) {
    const token = getToken();
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts && opts.headers);
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const res = await fetch(path, Object.assign({}, opts, { headers }));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  // ── Tab navigation ────────────────────────────────────────────────────────

  function initTabs() {
    var tabs = document.querySelectorAll('.comparison-tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.tab-panel').forEach(function (p) {
          p.classList.remove('active');
        });

        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        var panel = document.getElementById('panel-' + tab.dataset.panel);
        if (panel) panel.classList.add('active');

        // Lazy-load panel content
        if (tab.dataset.panel === 'growth') loadGrowth('all');
        if (tab.dataset.panel === 'history') loadHistory();
      });
    });
  }

  // ── Radar chart ───────────────────────────────────────────────────────────

  function drawRadar(canvasId, scores, label, color, existingChart) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    if (existingChart) {
      existingChart.destroy();
    }

    var data = DIMENSIONS.map(function (d) { return scores[d] || 0; });

    return new Chart(canvas, {
      type: 'radar',
      data: {
        labels: DIMENSIONS.map(function (d) { return DIMENSION_LABELS[d]; }),
        datasets: [{
          label: label,
          data: data,
          fill: true,
          backgroundColor: color.replace('0.7', '0.15'),
          borderColor: color,
          pointBackgroundColor: color,
          pointRadius: 4,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return ctx.raw + '%';
              },
            },
          },
        },
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { stepSize: 25, font: { size: 10 } },
            pointLabels: { font: { size: 11, weight: '600' } },
          },
        },
      },
    });
  }

  // ── Dimension table ───────────────────────────────────────────────────────

  function renderDimensionTable(scores1, scores2, name1, name2) {
    var tbody = document.getElementById('dimensionTableBody');
    if (!tbody) return;

    document.getElementById('thName1').textContent = name1;
    document.getElementById('thName2').textContent = name2;

    var rows = DIMENSIONS.map(function (dim) {
      var v1 = scores1[dim] || 0;
      var v2 = scores2[dim] || 0;
      var diff = v1 - v2;
      var diffClass = diff > 0 ? 'delta-positive' : diff < 0 ? 'delta-negative' : 'delta-neutral';
      var diffLabel = diff > 0 ? '+' + diff + '%' : diff + '%';

      return '<tr>' +
        '<td><strong>' + esc(DIMENSION_LABELS[dim]) + '</strong></td>' +
        '<td>' + v1 + '%</td>' +
        '<td>' + v2 + '%</td>' +
        '<td class="' + diffClass + '">' + diffLabel + '</td>' +
        '</tr>';
    });

    tbody.innerHTML = rows.join('');
  }

  // ── Analysis cards ────────────────────────────────────────────────────────

  function renderAnalysisList(listId, items, emptyMsg) {
    var el = document.getElementById(listId);
    if (!el) return;
    if (!items || items.length === 0) {
      el.innerHTML = '<li>' + esc(emptyMsg || 'None identified.') + '</li>';
      return;
    }
    el.innerHTML = items.map(function (s) {
      return '<li>' + esc(s) + '</li>';
    }).join('');
  }

  function renderAnalysis(analysis) {
    renderAnalysisList('synergiesList',  analysis.synergies,         'No shared strengths identified.');
    renderAnalysisList('complementList', analysis.complementarities, 'No complementarities identified.');
    renderAnalysisList('gapsList',       analysis.gaps,              'No joint growth areas identified.');
    renderAnalysisList('recsList',       analysis.recommendations,   'No recommendations at this time.');
  }

  // ── Individual comparison ─────────────────────────────────────────────────

  function showIndividualResults(comparison) {
    currentComparisonId = comparison._id;

    // Score cards
    document.getElementById('ind-name1').textContent  = comparison.user1.displayName;
    document.getElementById('ind-score1').textContent = comparison.user1.overall + '%';
    document.getElementById('ind-type1').textContent  = comparison.user1.dominantType || '';
    document.getElementById('ind-name2').textContent  = comparison.user2.displayName;
    document.getElementById('ind-score2').textContent = comparison.user2.overall + '%';
    document.getElementById('ind-type2').textContent  = comparison.user2.dominantType || '';

    // Radar chart labels
    document.getElementById('radarLabel1').textContent = comparison.user1.displayName + "'s Profile";
    document.getElementById('radarLabel2').textContent = comparison.user2.displayName + "'s Profile";

    // Team score banner
    document.getElementById('ind-teamScore').textContent =
      (comparison.comparisonAnalysis.teamScore || 0) + '%';

    // Radar charts
    chart1Instance = drawRadar('radarChart1', comparison.user1.scores,
      comparison.user1.displayName, RADAR_COLOR_1, chart1Instance);
    chart2Instance = drawRadar('radarChart2', comparison.user2.scores,
      comparison.user2.displayName, RADAR_COLOR_2, chart2Instance);

    // Dimension table
    renderDimensionTable(
      comparison.user1.scores, comparison.user2.scores,
      comparison.user1.displayName, comparison.user2.displayName
    );

    // Analysis
    renderAnalysis(comparison.comparisonAnalysis);

    // Share bar
    var shareUrl = window.location.origin + '/comparison.html?token=' + comparison.shareToken;
    document.getElementById('shareUrlInput').value = shareUrl;
    document.getElementById('chkPublic').checked = comparison.isPublic;

    document.getElementById('individualResults').style.display = 'block';
    document.getElementById('individualFormCard').style.display = 'none';
  }

  function initIndividual() {
    var btn    = document.getElementById('btnCreateIndividual');
    var copyBtn = document.getElementById('btnCopyLink');
    var chk    = document.getElementById('chkPublic');

    if (btn) {
      btn.addEventListener('click', async function () {
        var assessmentId = (document.getElementById('colleagueAssessmentId').value || '').trim();
        var name2        = (document.getElementById('colleagueName').value || '').trim();

        if (!assessmentId) {
          return setStatus('individualStatus', 'Please enter a colleague's assessment ID.', 'error');
        }

        btn.disabled = true;
        setStatus('individualStatus', 'Creating comparison…', '');
        try {
          var data = await apiFetch(API_BASE, {
            method: 'POST',
            body: JSON.stringify({ type: 'individual', user2AssessmentId: assessmentId, user2Name: name2 }),
          });
          setStatus('individualStatus', '', '');
          showIndividualResults(data.comparison);
        } catch (err) {
          setStatus('individualStatus', err.message || 'Failed to create comparison.', 'error');
        } finally {
          btn.disabled = false;
        }
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var input = document.getElementById('shareUrlInput');
        if (!input) return;
        var url = input.value;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () {
            copyBtn.textContent = 'Copied!';
            setTimeout(function () { copyBtn.textContent = 'Copy Link'; }, 2000);
          }).catch(function () {
            input.select();
            copyBtn.textContent = 'Copy Link';
          });
        } else {
          input.select();
          copyBtn.textContent = 'Copy Link';
        }
      });
    }

    if (chk) {
      chk.addEventListener('change', async function () {
        if (!currentComparisonId) return;
        try {
          await apiFetch(API_BASE + '/' + currentComparisonId + '/share', {
            method: 'POST',
            body: JSON.stringify({ isPublic: chk.checked }),
          });
        } catch (err) {
          chk.checked = !chk.checked; // revert
        }
      });
    }
  }

  // ── Growth tracking ───────────────────────────────────────────────────────

  async function loadGrowth(period) {
    var container = document.getElementById('growthContent');
    if (!container) return;
    container.innerHTML = '<div class="loading-spinner">Loading growth data…</div>';

    try {
      var data = await apiFetch(API_BASE + '/growth?period=' + (period || 'all'));
      renderGrowth(data, container);
    } catch (err) {
      container.innerHTML = '<div class="empty-state"><p>' + esc(err.message) + '</p></div>';
    }
  }

  function renderGrowth(data, container) {
    var history = data.history || [];
    var report  = data.report  || {};

    if (history.length === 0) {
      container.innerHTML = '<div class="empty-state">' +
        '<p>No assessment history found. Complete the quiz to start tracking your growth!</p>' +
        '<a href="/quiz.html" class="btn btn-primary" style="margin-top:1rem">Take the Assessment</a>' +
        '</div>';
      return;
    }

    // Milestones
    var milestonesHtml = '';
    if (report.milestones && report.milestones.length > 0) {
      milestonesHtml = '<div class="milestone-list">' +
        report.milestones.map(function (m) {
          return '<span class="milestone-badge">🏆 ' + esc(m) + '</span>';
        }).join('') +
        '</div>';
    }

    // Overall trend
    var trend = report.overallTrend || 0;
    var trendStr = trend > 0 ? '📈 +' + trend + '% overall since first assessment'
                : trend < 0 ? '📉 ' + trend + '% overall since first assessment'
                : '➡️ Stable since first assessment';

    // Growth dimension table
    var dimRows = '';
    if (report.dimensionTrends) {
      dimRows = DIMENSIONS.map(function (dim) {
        var t = report.dimensionTrends[dim];
        if (!t) return '';
        var arrow = t.direction === 'improved' ? '▲' : t.direction === 'declined' ? '▼' : '—';
        var cls   = t.direction === 'improved' ? 'delta-positive' : t.direction === 'declined' ? 'delta-negative' : 'delta-neutral';
        return '<tr>' +
          '<td><strong>' + esc(DIMENSION_LABELS[dim]) + '</strong></td>' +
          '<td>' + t.previous + '%</td>' +
          '<td>' + t.current  + '%</td>' +
          '<td class="' + cls + '">' + arrow + ' ' + (t.delta >= 0 ? '+' : '') + t.delta + '%</td>' +
          '</tr>';
      }).join('');
    }

    // Recommendations
    var recsHtml = '';
    if (report.recommendations && report.recommendations.length > 0) {
      recsHtml = '<div class="analysis-card" style="margin-bottom:1.5rem;">' +
        '<div class="analysis-icon">💡</div>' +
        '<h3>Focus Areas</h3><ul>' +
        report.recommendations.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') +
        '</ul></div>';
    }

    container.innerHTML =
      '<div class="team-score-banner" style="margin-bottom:1.5rem;">' +
        '<div class="ts-label">Overall Growth Trend</div>' +
        '<div class="ts-number" style="font-size:1.5rem;">' + esc(trendStr) + '</div>' +
        '<div class="ts-desc">' + history.length + ' assessment(s) on record</div>' +
      '</div>' +
      milestonesHtml +
      '<div class="growth-chart-wrap">' +
        '<h2>Progress Over Time</h2>' +
        '<canvas id="growthChart" height="120" aria-label="Growth progress chart"></canvas>' +
      '</div>' +
      (dimRows ? '<div class="dimension-table-wrap"><h2>Dimension Growth</h2>' +
        '<table class="dimension-table">' +
        '<thead><tr><th>Dimension</th><th>First</th><th>Latest</th><th>Change</th></tr></thead>' +
        '<tbody>' + dimRows + '</tbody></table></div>' : '') +
      recsHtml;

    // Draw line chart of overall score over time
    var checkpoints = report.checkpoints || history.map(function (h) {
      return { date: h.date, overall: h.overall };
    });

    var labels = checkpoints.map(function (c) {
      return new Date(c.date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    });
    var values = checkpoints.map(function (c) { return c.overall; });

    var gCanvas = document.getElementById('growthChart');
    if (gCanvas && typeof Chart !== 'undefined') {
      if (growthChartInstance) growthChartInstance.destroy();
      growthChartInstance = new Chart(gCanvas, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Overall Score',
            data: values,
            fill: true,
            backgroundColor: 'rgba(37,99,235,0.1)',
            borderColor: 'rgba(37,99,235,0.8)',
            tension: 0.35,
            pointRadius: 5,
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: { label: function (ctx) { return ctx.raw + '%'; } },
            },
          },
          scales: {
            y: { min: 0, max: 100, ticks: { stepSize: 25, callback: function (v) { return v + '%'; } } },
          },
        },
      });
    }
  }

  function initGrowthPeriodButtons() {
    document.querySelectorAll('.growth-period-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.growth-period-btn').forEach(function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        loadGrowth(btn.dataset.period);
      });
    });
  }

  // ── Team benchmark ────────────────────────────────────────────────────────

  function initTeam() {
    var btn = document.getElementById('btnCreateTeam');
    if (!btn) return;
    btn.addEventListener('click', async function () {
      btn.disabled = true;
      setStatus('teamStatus', 'Generating team comparison…', '');
      try {
        var data = await apiFetch(API_BASE, {
          method: 'POST',
          body: JSON.stringify({ type: 'team' }),
        });
        renderTeamResults(data.comparison);
        setStatus('teamStatus', '', '');
      } catch (err) {
        setStatus('teamStatus', err.message || 'Failed to generate team comparison.', 'error');
      } finally {
        btn.disabled = false;
      }
    });
  }

  function renderTeamResults(comparison) {
    var container = document.getElementById('teamResults');
    if (!container) return;

    var u1 = comparison.user1;
    var u2 = comparison.user2;
    var a  = comparison.comparisonAnalysis;

    var dimRows = DIMENSIONS.map(function (dim) {
      var v1   = u1.scores[dim] || 0;
      var v2   = u2.scores[dim] || 0;
      var diff = v1 - v2;
      var cls  = diff > 0 ? 'delta-positive' : diff < 0 ? 'delta-negative' : 'delta-neutral';
      return '<tr>' +
        '<td><strong>' + esc(DIMENSION_LABELS[dim]) + '</strong></td>' +
        '<td>' + v1 + '%</td>' +
        '<td>' + v2 + '%</td>' +
        '<td class="' + cls + '">' + (diff >= 0 ? '+' : '') + diff + '%</td>' +
        '</tr>';
    }).join('');

    container.innerHTML =
      '<div class="score-row">' +
        '<div class="score-card"><div class="score-name">' + esc(u1.displayName) + '</div>' +
          '<div class="score-number">' + u1.overall + '%</div></div>' +
        '<div class="score-vs">VS</div>' +
        '<div class="score-card"><div class="score-name">Team Average</div>' +
          '<div class="score-number">' + u2.overall + '%</div></div>' +
      '</div>' +
      '<div class="dimension-table-wrap"><h2>You vs. Team Average</h2>' +
        '<table class="dimension-table">' +
        '<thead><tr><th>Dimension</th><th>' + esc(u1.displayName) + '</th><th>Team Avg</th><th>Difference</th></tr></thead>' +
        '<tbody>' + dimRows + '</tbody></table></div>' +
      '<div class="analysis-grid">' +
        '<div class="analysis-card"><div class="analysis-icon">✨</div><h3>Above Team Average</h3><ul>' +
          (a.synergies.concat(a.complementarities.filter(function (c) { return c.indexOf(u1.displayName) === 0; }))
            .map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') || '<li>No strengths above average.</li>') +
        '</ul></div>' +
        '<div class="analysis-card"><div class="analysis-icon">💡</div><h3>Development Areas</h3><ul>' +
          (a.recommendations.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') || '<li>None identified.</li>') +
        '</ul></div>' +
      '</div>';

    container.style.display = 'block';
  }

  // ── History ───────────────────────────────────────────────────────────────

  async function loadHistory() {
    var container = document.getElementById('historyContent');
    if (!container) return;
    container.innerHTML = '<div class="loading-spinner">Loading history…</div>';

    try {
      var data = await apiFetch(API_BASE);
      renderHistory(data.comparisons || [], container);
    } catch (err) {
      container.innerHTML = '<div class="empty-state"><p>' + esc(err.message) + '</p></div>';
    }
  }

  function renderHistory(comparisons, container) {
    if (comparisons.length === 0) {
      container.innerHTML = '<div class="empty-state">' +
        '<p>No comparisons yet. Create one using the Compare Profiles tab.</p></div>';
      return;
    }

    var items = comparisons.map(function (c) {
      var badge = '<span class="hi-type hi-type-' + c.comparisonType + '">' + c.comparisonType + '</span>';
      var desc  = c.user1.displayName + ' vs. ' + c.user2.displayName;
      var date  = new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      var deleteBtn = '<button class="btn btn-outline btn-sm" data-id="' + esc(c._id) + '" data-action="delete">Delete</button>';
      return '<li class="history-item">' + badge +
        '<span class="hi-info">' + esc(desc) + '</span>' +
        '<span class="hi-date">' + date + '</span>' +
        deleteBtn + '</li>';
    }).join('');

    container.innerHTML = '<ul class="history-list">' + items + '</ul>';

    container.querySelector('.history-list').addEventListener('click', async function (e) {
      var btn = e.target.closest('button[data-action="delete"]');
      if (!btn) return;
      var id = btn.dataset.id;
      if (!id || !confirm('Delete this comparison?')) return;
      btn.disabled = true;
      try {
        await apiFetch(API_BASE + '/' + id, { method: 'DELETE' });
        btn.closest('li').remove();
      } catch (err) {
        btn.disabled = false;
        alert(err.message || 'Failed to delete.');
      }
    });
  }

  // ── Public share token view ───────────────────────────────────────────────

  async function loadSharedComparison(token) {
    try {
      var data = await apiFetch(API_BASE + '/share/' + token);
      var c    = data.comparison;

      document.getElementById('pageTitle').textContent =
        c.user1.displayName + ' vs. ' + c.user2.displayName;
      document.getElementById('pageSubtitle').textContent =
        'Resilience profile comparison — shared view';

      // Switch to individual panel and show results
      document.querySelectorAll('.comparison-tabs, .compare-form-card, #individualShareBar').forEach(function (el) {
        el.style.display = 'none';
      });

      document.getElementById('panel-individual').classList.add('active');
      showIndividualResults(c);

      // Hide the share bar in public view
      var shareBar = document.getElementById('individualShareBar');
      if (shareBar) shareBar.style.display = 'none';
    } catch (err) {
      document.querySelector('.comparison-page').innerHTML =
        '<div class="empty-state" style="padding:4rem;">' +
        '<h2>Comparison not found</h2>' +
        '<p>' + esc(err.message) + '</p>' +
        '<a href="/" class="btn btn-primary" style="margin-top:1rem">Go Home</a>' +
        '</div>';
    }
  }

  // ── Boot ──────────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    // If a share token is in the URL, load the public comparison view
    var params = new URLSearchParams(window.location.search);
    var token  = params.get('token');

    if (token) {
      loadSharedComparison(token);
      return;
    }

    initTabs();
    initIndividual();
    initGrowthPeriodButtons();
    initTeam();

    // Activate a specific tab if ?tab= is in the URL
    var tabParam = params.get('tab');
    if (tabParam) {
      var targetTab = document.querySelector('[data-panel="' + tabParam + '"]');
      if (targetTab) {
        targetTab.click();
      }
    }
  });

})();
