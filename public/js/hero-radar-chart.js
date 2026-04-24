/* hero-radar-chart.js – Animated resilience compass for the hero/landing page.
 * Delegates to window.renderBrandCompass (brand-compass.js).
 * Ensure brand-compass.js is loaded before this file.
 */
(function () {
  'use strict';

  var DIMENSIONS = [
    'Agentic-Generative',
    'Relational-Connective',
    'Spiritual-Reflective',
    'Emotional-Adaptive',
    'Somatic-Regulative',
    'Cognitive-Narrative'
  ];

  var HERO_SCORES = {
    'Relational-Connective':            78,
    'Cognitive-Narrative':   65,
    'Somatic-Regulative':    58,
    'Emotional-Adaptive':    72,
    'Spiritual-Reflective': 82,
    'Agentic-Generative':    69
  };

  var EXAMPLE_SCORES = {
    'Relational-Connective':            85,
    'Cognitive-Narrative':   60,
    'Somatic-Regulative':    52,
    'Emotional-Adaptive':    70,
    'Spiritual-Reflective': 80,
    'Agentic-Generative':    64
  };

  function init() {
    var render = typeof window.renderBrandCompass === 'function'
      ? window.renderBrandCompass
      : null;

    if (!render) {
      console.warn('[hero-radar-chart] window.renderBrandCompass not available. ' +
        'Ensure brand-compass.js is loaded before hero-radar-chart.js ' +
        'in your <script> tags.');
      return;
    }

    ['heroRadar', 'exampleRadar'].forEach(function (id) {
      var canvas = document.getElementById(id);
      if (!canvas) { return; }
      var scores = id === 'heroRadar' ? HERO_SCORES : EXAMPLE_SCORES;
      try {
        render(canvas, scores);
      } catch (err) {
        console.warn('[hero-radar-chart] Render failed for #' + id + '. ' +
          'Check that scores are numeric (0-100) values and the canvas is visible:', err);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export dimension list for external use
  window.ResilienceCompassDimensions = DIMENSIONS;
}());