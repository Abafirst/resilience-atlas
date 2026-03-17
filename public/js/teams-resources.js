/**
 * Resilience Atlas — Teams Resources Page Logic
 * Handles display and filtering for /teams-resources.html
 */
(function () {
  'use strict';

  var state = {
    category: 'all',
    dimension: 'all',
    search: ''
  };

  /* ── Helpers ─────────────────────────────────────────────────────────────── */
  var TYPE_LABELS = {
    'workshop-guide': 'Workshop Guide',
    'template':       'Template',
    'prompt-sheet':   'Discussion Prompts',
    'activity-cards': 'Activity Cards',
    'facilitation':   'Facilitation Resource',
    'dimension-card': 'Reference Cards',
    'infographic':    'Infographic',
    'timeline':       'Planning Timeline',
    'pathway':        'Development Map',
    'matrix':         'Decision Matrix',
    'poster':         'Workshop Poster',
    'reference-card': 'Quick Reference',
    'culture-poster': 'Culture Poster'
  };

  var TYPE_COLORS = {
    'workshop-guide': '#3b82f6',
    'template':       '#22c55e',
    'prompt-sheet':   '#a855f7',
    'activity-cards': '#f59e0b',
    'facilitation':   '#ef4444',
    'dimension-card': '#06b6d4',
    'infographic':    '#8b5cf6',
    'timeline':       '#f97316',
    'pathway':        '#14b8a6',
    'matrix':         '#64748b',
    'poster':         '#ec4899',
    'reference-card': '#0ea5e9',
    'culture-poster': '#ec4899'
  };

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function matchesFilters(item) {
    if (state.category !== 'all' && item.type !== state.category) return false;
    if (state.dimension !== 'all' && item.dimension !== state.dimension && item.dimension !== 'all') return false;
    if (state.search) {
      var q = state.search.toLowerCase();
      if (
        item.title.toLowerCase().indexOf(q) === -1 &&
        item.description.toLowerCase().indexOf(q) === -1
      ) return false;
    }
    return true;
  }

  /* ── Render resource card ────────────────────────────────────────────────── */
  function renderHandoutCard(item) {
    var color = TYPE_COLORS[item.type] || '#64748b';
    var typeLabel = item.typeLabel || TYPE_LABELS[item.type] || item.type;
    var pagesInfo = item.pages ? item.pages + ' pages' : '';
    var pagesHtml = pagesInfo
      ? '<span class="tr-card__meta-item">📄 ' + escHtml(pagesInfo) + '</span>'
      : '';
    var dimHtml = item.dimensionLabel
      ? '<span class="tr-card__meta-item">🔷 ' + escHtml(item.dimensionLabel) + '</span>'
      : '';

    return '<div class="tr-card">' +
      '<div class="tr-card__icon" aria-hidden="true">' + escHtml(item.icon || '📄') + '</div>' +
      '<div class="tr-card__body">' +
        '<span class="tr-card__type-badge" style="background:' + color + '20;color:' + color + ';border-color:' + color + '">' +
          escHtml(typeLabel) +
        '</span>' +
        '<h3 class="tr-card__title">' + escHtml(item.title) + '</h3>' +
        '<p class="tr-card__desc">' + escHtml(item.description) + '</p>' +
        '<div class="tr-card__meta">' + dimHtml + pagesHtml +
          '<span class="tr-card__meta-item">📁 ' + escHtml(item.format || 'PDF') + '</span>' +
        '</div>' +
        '<a href="' + escHtml(item.downloadUrl || '#') + '" class="tr-card__download-btn" ' +
          (item.downloadUrl && item.downloadUrl !== '#'
            ? 'download aria-label="Download ' + escHtml(item.title) + '"'
            : 'aria-label="Coming soon: ' + escHtml(item.title) + '" class="tr-card__download-btn tr-card__download-btn--soon"') +
        '>⬇ Download</a>' +
      '</div>' +
    '</div>';
  }

  function renderVisualCard(item) {
    var color = TYPE_COLORS[item.type] || '#64748b';
    var typeLabel = item.typeLabel || TYPE_LABELS[item.type] || item.type;

    return '<div class="tr-card">' +
      '<div class="tr-card__icon" aria-hidden="true">' + escHtml(item.icon || '🖼️') + '</div>' +
      '<div class="tr-card__body">' +
        '<span class="tr-card__type-badge" style="background:' + color + '20;color:' + color + ';border-color:' + color + '">' +
          escHtml(typeLabel) +
        '</span>' +
        '<h3 class="tr-card__title">' + escHtml(item.title) + '</h3>' +
        '<p class="tr-card__desc">' + escHtml(item.description) + '</p>' +
        '<div class="tr-card__meta">' +
          '<span class="tr-card__meta-item">📐 ' + escHtml(item.printSize || '') + '</span>' +
          '<span class="tr-card__meta-item">📁 ' + escHtml(item.format || 'PDF') + '</span>' +
        '</div>' +
        '<a href="' + escHtml(item.downloadUrl || '#') + '" class="tr-card__download-btn" ' +
          (item.downloadUrl && item.downloadUrl !== '#'
            ? 'download aria-label="Download ' + escHtml(item.title) + '"'
            : 'aria-label="Coming soon: ' + escHtml(item.title) + '"') +
        '>⬇ Download</a>' +
      '</div>' +
    '</div>';
  }

  /* ── Render ──────────────────────────────────────────────────────────────── */
  function renderResources() {
    var handoutsGrid = document.getElementById('tr-handouts-grid');
    var visualsGrid  = document.getElementById('tr-visuals-grid');
    var countEl      = document.getElementById('tr-count');
    var emptyEl      = document.getElementById('tr-empty');

    var handouts = (TEAMS_CONTENT.handouts || []).filter(matchesFilters);
    var visuals  = (TEAMS_CONTENT.visuals  || []).filter(matchesFilters);
    var total = handouts.length + visuals.length;

    if (countEl) countEl.textContent = total;

    if (total === 0) {
      if (handoutsGrid) handoutsGrid.innerHTML = '';
      if (visualsGrid)  visualsGrid.innerHTML  = '';
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;

    if (handoutsGrid) {
      handoutsGrid.innerHTML = handouts.length
        ? handouts.map(renderHandoutCard).join('')
        : '<p class="tr-none">No handouts match the current filters.</p>';
    }
    if (visualsGrid) {
      visualsGrid.innerHTML = visuals.length
        ? visuals.map(renderVisualCard).join('')
        : '<p class="tr-none">No visuals match the current filters.</p>';
    }

    // Update section visibility
    var handoutSection = document.getElementById('tr-handouts-section');
    var visualSection  = document.getElementById('tr-visuals-section');
    if (handoutSection) handoutSection.hidden = handouts.length === 0;
    if (visualSection)  visualSection.hidden  = visuals.length  === 0;
  }

  /* ── Filter bindings ─────────────────────────────────────────────────────── */
  function bindFilters() {
    var catEl = document.getElementById('tr-filter-category');
    var dimEl = document.getElementById('tr-filter-dimension');
    var searchEl = document.getElementById('tr-search');

    if (catEl) {
      catEl.addEventListener('change', function () {
        state.category = this.value;
        renderResources();
      });
    }
    if (dimEl) {
      dimEl.addEventListener('change', function () {
        state.dimension = this.value;
        renderResources();
      });
    }
    if (searchEl) {
      searchEl.addEventListener('input', function () {
        state.search = this.value.trim();
        renderResources();
      });
    }

    var clearBtn = document.getElementById('tr-clear-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        state = { category: 'all', dimension: 'all', search: '' };
        if (catEl) catEl.value = 'all';
        if (dimEl) dimEl.value = 'all';
        if (searchEl) searchEl.value = '';
        renderResources();
      });
    }
  }

  /* ── Init ────────────────────────────────────────────────────────────────── */
  function init() {
    if (typeof TEAMS_CONTENT === 'undefined') {
      console.error('teams-content.js must be loaded before teams-resources.js');
      return;
    }
    bindFilters();
    renderResources();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
