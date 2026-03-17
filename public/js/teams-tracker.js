/**
 * Resilience Atlas — Teams Activity Tracker
 * Manages activity completion logging in the team dashboard.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'ra_team_activity_log';

  /* ── Persistence ─────────────────────────────────────────────────────────── */
  function loadLog() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveLog(log) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
    } catch (e) { /* storage unavailable */ }
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Log entry ───────────────────────────────────────────────────────────── */
  function addEntry(entry) {
    var log = loadLog();
    entry.id = 'entry-' + Date.now();
    entry.timestamp = new Date().toISOString();
    log.unshift(entry);
    saveLog(log);
    renderLog();
    updateStats();
  }

  function removeEntry(id) {
    var log = loadLog().filter(function (e) { return e.id !== id; });
    saveLog(log);
    renderLog();
    updateStats();
  }

  /* ── Render log ──────────────────────────────────────────────────────────── */
  function renderLog() {
    var container = document.getElementById('activity-log-list');
    if (!container) return;
    var log = loadLog();

    if (!log.length) {
      container.innerHTML = '<p class="at-empty">No activities logged yet. Complete your first activity to start tracking!</p>';
      return;
    }

    container.innerHTML = log.map(function (e) {
      var date = new Date(e.timestamp);
      var formatted = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      return '<div class="at-entry" data-id="' + escHtml(e.id) + '">' +
        '<div class="at-entry__info">' +
          '<span class="at-entry__title">' + escHtml(e.activityTitle || 'Activity') + '</span>' +
          '<span class="at-entry__meta">' +
            escHtml(e.dimension || '') +
            (e.attendees ? ' · ' + escHtml(String(e.attendees)) + ' attendees' : '') +
            ' · ' + escHtml(formatted) +
          '</span>' +
          (e.notes ? '<p class="at-entry__notes">' + escHtml(e.notes) + '</p>' : '') +
        '</div>' +
        '<button class="at-entry__remove" type="button" aria-label="Remove log entry" data-id="' + escHtml(e.id) + '">×</button>' +
      '</div>';
    }).join('');

    container.querySelectorAll('.at-entry__remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        removeEntry(this.dataset.id);
      });
    });
  }

  /* ── Stats ───────────────────────────────────────────────────────────────── */
  function updateStats() {
    var log = loadLog();
    var countEl = document.getElementById('at-total-count');
    var dimEl   = document.getElementById('at-top-dimension');
    var streakEl = document.getElementById('at-this-month');

    if (countEl) countEl.textContent = log.length;

    if (dimEl) {
      var dimCounts = {};
      log.forEach(function (e) {
        if (e.dimension) dimCounts[e.dimension] = (dimCounts[e.dimension] || 0) + 1;
      });
      var topDim = Object.keys(dimCounts).sort(function (a, b) { return dimCounts[b] - dimCounts[a]; })[0];
      dimEl.textContent = topDim ? (topDim.charAt(0).toUpperCase() + topDim.slice(1)) : '—';
    }

    if (streakEl) {
      var now = new Date();
      var monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      var thisMonth = log.filter(function (e) { return new Date(e.timestamp).getTime() >= monthStart; });
      streakEl.textContent = thisMonth.length;
    }
  }

  /* ── Log form ────────────────────────────────────────────────────────────── */
  function initLogForm() {
    var form = document.getElementById('log-activity-form');
    if (!form) return;

    // Populate activity dropdown from TEAMS_CONTENT if available
    var actSelect = document.getElementById('log-activity-select');
    if (actSelect && typeof TEAMS_CONTENT !== 'undefined' && TEAMS_CONTENT.activities) {
      TEAMS_CONTENT.activities.forEach(function (act) {
        var opt = document.createElement('option');
        opt.value = act.id;
        opt.textContent = act.title + ' (' + act.dimensionLabel + ')';
        opt.dataset.dimension = act.dimension;
        opt.dataset.dimensionLabel = act.dimensionLabel;
        actSelect.appendChild(opt);
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var selected = actSelect ? actSelect.options[actSelect.selectedIndex] : null;
      var attendees = document.getElementById('log-attendees');
      var notes = document.getElementById('log-notes');

      var entry = {
        activityTitle: selected ? selected.text.split(' (')[0] : 'Custom Activity',
        activityId: selected ? selected.value : '',
        dimension: selected ? (selected.dataset.dimensionLabel || '') : '',
        attendees: attendees ? (parseInt(attendees.value, 10) || null) : null,
        notes: notes ? notes.value.trim() : ''
      };

      addEntry(entry);
      form.reset();

      var successMsg = document.getElementById('log-success-msg');
      if (successMsg) {
        successMsg.hidden = false;
        setTimeout(function () { successMsg.hidden = true; }, 3000);
      }
    });
  }

  /* ── Init ────────────────────────────────────────────────────────────────── */
  function init() {
    renderLog();
    updateStats();
    initLogForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for external use
  window.TeamsTracker = { addEntry: addEntry, loadLog: loadLog };
}());
