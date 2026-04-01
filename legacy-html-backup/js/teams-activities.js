/**
 * Resilience Atlas — Teams Activities Page Logic
 * Handles filtering, display, and interaction for /teams-activities.html
 */
(function () {
  'use strict';

  var state = {
    dimension:   'all',
    teamSize:    'all',
    duration:    'all',
    difficulty:  'all',
    search:      ''
  };

  /* ── Helpers ─────────────────────────────────────────────────────────────── */
  var DIMENSION_COLORS = {
    connection: { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8' },
    thinking:   { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' },
    action:     { bg: '#fff7ed', border: '#f97316', text: '#c2410c' },
    feeling:    { bg: '#fdf4ff', border: '#a855f7', text: '#7e22ce' },
    hope:       { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
    meaning:    { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' }
  };

  var DIFFICULTY_LABELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
  var DIFFICULTY_COLORS = { beginner: '#16a34a', intermediate: '#d97706', advanced: '#dc2626' };

  function getColor(dimension, part) {
    return (DIMENSION_COLORS[dimension] || { bg: '#f8fafc', border: '#94a3b8', text: '#475569' })[part];
  }

  function matchesFilters(act) {
    if (state.dimension !== 'all' && act.dimension !== state.dimension) return false;
    if (state.teamSize !== 'all' && !act.teamSize.includes(state.teamSize)) return false;
    if (state.duration !== 'all' && act.durationCategory !== state.duration) return false;
    if (state.difficulty !== 'all' && act.difficulty !== state.difficulty) return false;
    if (state.search) {
      var q = state.search.toLowerCase();
      if (
        act.title.toLowerCase().indexOf(q) === -1 &&
        act.objective.toLowerCase().indexOf(q) === -1 &&
        act.dimensionLabel.toLowerCase().indexOf(q) === -1
      ) return false;
    }
    return true;
  }

  /* ── Card rendering ──────────────────────────────────────────────────────── */
  function renderCard(act) {
    var c = getColor(act.dimension, 'bg');
    var border = getColor(act.dimension, 'border');
    var textColor = getColor(act.dimension, 'text');
    var diffColor = DIFFICULTY_COLORS[act.difficulty] || '#64748b';
    var diffLabel = DIFFICULTY_LABELS[act.difficulty] || act.difficulty;

    var instructionLines = act.instructions.split('. ').slice(0, 2).join('. ') + (act.instructions.split('. ').length > 2 ? '…' : '');

    var materialsHtml = '';
    if (act.materials && act.materials.length) {
      materialsHtml = '<ul class="ta-card__materials">' +
        act.materials.map(function (m) { return '<li>' + escHtml(m) + '</li>'; }).join('') +
        '</ul>';
    }

    var tipsHtml = '';
    if (act.facilitationTips && act.facilitationTips.length) {
      tipsHtml = '<div class="ta-card__tips"><strong>Facilitation Tips:</strong><ul>' +
        act.facilitationTips.map(function (t) { return '<li>' + escHtml(t) + '</li>'; }).join('') +
        '</ul></div>';
    }

    var promptsHtml = '';
    if (act.reflectionPrompts && act.reflectionPrompts.length) {
      promptsHtml = '<div class="ta-card__prompts"><strong>Reflection Prompts:</strong><ol>' +
        act.reflectionPrompts.map(function (p) { return '<li>' + escHtml(p) + '</li>'; }).join('') +
        '</ol></div>';
    }

    var variationsHtml = '';
    if (act.variations && act.variations.length) {
      variationsHtml = '<div class="ta-card__variations"><strong>Variations:</strong><ul>' +
        act.variations.map(function (v) { return '<li><em>' + escHtml(v.size) + ':</em> ' + escHtml(v.note) + '</li>'; }).join('') +
        '</ul></div>';
    }

    var sizeList = act.teamSize.join(', ');

    return '<article class="ta-card" data-id="' + act.id + '" style="border-left-color:' + border + '">' +
      '<div class="ta-card__header">' +
        '<span class="ta-badge" style="background:' + c + ';color:' + textColor + ';border-color:' + border + '">' +
          escHtml(act.dimensionLabel) +
        '</span>' +
        '<span class="ta-diff-badge" style="color:' + diffColor + '">' + diffLabel + '</span>' +
      '</div>' +
      '<h3 class="ta-card__title">' + escHtml(act.title) + '</h3>' +
      '<p class="ta-card__objective">' + escHtml(act.objective) + '</p>' +
      '<div class="ta-card__meta">' +
        '<span class="ta-meta-item">⏱ ' + escHtml(act.duration) + '</span>' +
        '<span class="ta-meta-item">👥 ' + escHtml(sizeList) + '</span>' +
      '</div>' +
      '<button class="ta-card__toggle" type="button" aria-expanded="false" aria-controls="detail-' + act.id + '">' +
        'View Details <span class="ta-toggle-arrow" aria-hidden="true">▾</span>' +
      '</button>' +
      '<div class="ta-card__detail" id="detail-' + act.id + '" hidden>' +
        '<div class="ta-card__section">' +
          '<strong>Instructions:</strong>' +
          '<p>' + escHtml(act.instructions) + '</p>' +
        '</div>' +
        '<div class="ta-card__section">' +
          '<strong>Materials Needed:</strong>' +
          materialsHtml +
        '</div>' +
        tipsHtml +
        promptsHtml +
        variationsHtml +
      '</div>' +
    '</article>';
  }

  /* ── Security helper ─────────────────────────────────────────────────────── */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Render activities ───────────────────────────────────────────────────── */
  function renderActivities() {
    var grid = document.getElementById('ta-grid');
    var countEl = document.getElementById('ta-count');
    var emptyEl = document.getElementById('ta-empty');
    if (!grid) return;

    var filtered = (TEAMS_CONTENT.activities || []).filter(matchesFilters);

    if (countEl) countEl.textContent = filtered.length;

    if (filtered.length === 0) {
      grid.innerHTML = '';
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;
    grid.innerHTML = filtered.map(renderCard).join('');

    // Attach toggle listeners
    grid.querySelectorAll('.ta-card__toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.closest('.ta-card').dataset.id;
        var detail = document.getElementById('detail-' + id);
        if (!detail) return;
        var open = detail.hidden === false;
        detail.hidden = open;
        this.setAttribute('aria-expanded', String(!open));
        this.querySelector('.ta-toggle-arrow').textContent = open ? '▾' : '▴';
      });
    });
  }

  /* ── Filter event listeners ──────────────────────────────────────────────── */
  function bindFilters() {
    var filterIds = ['filter-dimension', 'filter-size', 'filter-duration', 'filter-difficulty'];
    var stateKeys = ['dimension', 'teamSize', 'duration', 'difficulty'];

    filterIds.forEach(function (id, i) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', function () {
        state[stateKeys[i]] = this.value;
        renderActivities();
      });
    });

    var searchEl = document.getElementById('ta-search');
    if (searchEl) {
      searchEl.addEventListener('input', function () {
        state.search = this.value.trim();
        renderActivities();
      });
    }

    var clearBtn = document.getElementById('ta-clear-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        state = { dimension: 'all', teamSize: 'all', duration: 'all', difficulty: 'all', search: '' };
        filterIds.forEach(function (id) {
          var el = document.getElementById(id);
          if (el) el.value = 'all';
        });
        if (searchEl) searchEl.value = '';
        renderActivities();
      });
    }
  }

  /* ── Init ────────────────────────────────────────────────────────────────── */
  function init() {
    if (typeof TEAMS_CONTENT === 'undefined') {
      console.error('teams-content.js must be loaded before teams-activities.js');
      return;
    }
    bindFilters();
    renderActivities();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
