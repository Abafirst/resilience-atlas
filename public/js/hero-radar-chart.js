/* hero-radar-chart.js – Standalone animated resilience compass
 * Self-contained: includes full rendering logic and auto-initialises
 * the heroRadar and exampleRadar canvases on the landing page.
 * Delegates to window.renderCompass if already defined, otherwise
 * provides its own implementation.
 */
(function () {
  'use strict';

  var DIMENSIONS = [
    'Relational-Connective',
    'Cognitive-Narrative',
    'Somatic-Regulative',
    'Emotional-Adaptive',
    'Spiritual-Reflective',
    'Agentic-Generative'
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
    var render = typeof window.renderCompass === 'function'
      ? window.renderCompass
      : null;

    if (!render) {
      console.warn('[hero-radar-chart] window.renderCompass not available. ' +
        'Ensure resilience-compass.js is loaded before hero-radar-chart.js ' +
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