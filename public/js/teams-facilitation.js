/**
 * Resilience Atlas — Teams Facilitation Page Logic
 * Handles expandable sections and interactive elements for /teams-facilitation.html
 */
(function () {
  'use strict';

  /* ── Expandable sections ─────────────────────────────────────────────────── */
  function initExpandables() {
    document.querySelectorAll('.tf-expandable__trigger').forEach(function (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
      trigger.addEventListener('click', function () {
        var section = this.closest('.tf-expandable');
        if (!section) return;
        var body = section.querySelector('.tf-expandable__body');
        if (!body) return;
        var open = body.hidden === false;
        body.hidden = open;
        this.setAttribute('aria-expanded', String(!open));
        var icon = this.querySelector('.tf-expand-icon');
        if (icon) icon.textContent = open ? '▾' : '▴';
      });
    });
  }

  /* ── Smooth scroll from anchor links ────────────────────────────────────── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ── Active section highlight in sidebar nav ────────────────────────────── */
  function initSidebarHighlight() {
    var sections = document.querySelectorAll('.tf-section[id]');
    var navLinks = document.querySelectorAll('.tf-sidebar-nav a[href^="#"]');
    if (!sections.length || !navLinks.length) return;

    function highlight() {
      var scrollY = window.scrollY || window.pageYOffset;
      var active = null;
      sections.forEach(function (s) {
        if (s.offsetTop - 80 <= scrollY) active = s;
      });
      navLinks.forEach(function (a) {
        a.classList.remove('active');
        if (active && a.getAttribute('href') === '#' + active.id) {
          a.classList.add('active');
        }
      });
    }

    window.addEventListener('scroll', highlight, { passive: true });
    highlight();
  }

  /* ── Print quick-reference card ─────────────────────────────────────────── */
  function initPrintButtons() {
    document.querySelectorAll('.tf-print-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.print();
      });
    });
  }

  /* ── Init ────────────────────────────────────────────────────────────────── */
  function init() {
    initExpandables();
    initSmoothScroll();
    initSidebarHighlight();
    initPrintButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
