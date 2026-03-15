/* resilience-compass.js – Animated canvas-based resilience compass
 * Exposes window.renderCompass(canvas, scores) for use on any page.
 */
(function () {
  'use strict';

  // ── Configuration ──────────────────────────────────────────────────────────
  var DIMENSIONS = [
    'Relational-Connective',
    'Cognitive-Narrative',
    'Somatic-Regulative',
    'Emotional-Adaptive',
    'Spiritual-Reflective',
    'Agentic-Generative'
  ];

  var ICONS = ['👥', '🧠', '💪', '❤️', '✨', '⚡'];

  var CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

  // Canvas dimensions (physical pixels – CSS scales the element)
  var CW = 360; // canvas width
  var CH = 400; // canvas height (extra 40 px for dominant-dimension label)
  var CX = 180; // compass centre x
  var CY = 185; // compass centre y (slight upward offset)
  var R  = 115; // max chart data radius

  // Derived radii (all relative to R)
  var OUTER_R    = R * 1.09; // 139 – outer compass ring
  var TICK_IN    = R * 1.09; // 139 – tick mark inner edge (at ring)
  var TICK_OUT_S = R * 1.17; // 150 – inter-cardinal tick outer edge
  var TICK_OUT_L = R * 1.22; // 156 – cardinal tick outer edge
  var LABEL_R    = R * 1.32; // 169 – cardinal / inter-cardinal label radius
  var ICON_R     = R * 1.06; // 136 – dimension-icon radius (inside ring)

  var NEEDLE_DURATION   = 2500;  // ms – needle travel time
  var WOBBLE_FREQ       = 0.0012; // rad/ms – subtle post-settle needle wobble
  var WOBBLE_AMP        = 0.018;  // rad   – wobble amplitude (~1 degree)
  var PULSE_FREQ        = 0.0021; // rad/ms – gradient pulse cycle rate

  // ── Helpers ────────────────────────────────────────────────────────────────
  /** Quadratic ease-in-out: slow start, fast middle, slow end. */
  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  /** Angle (radians) for dimension i, clockwise from North (top). */
  function dimAngle(i) {
    return (i / DIMENSIONS.length) * Math.PI * 2 - Math.PI / 2;
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  /**
   * Render an animated resilience compass onto a <canvas> element.
   * @param {HTMLCanvasElement} canvas
   * @param {Object} scores  Key: dimension name, value: 0–100
   */
  function renderCompass(canvas, scores) {
    if (!canvas || typeof canvas.getContext !== 'function') { return; }

    // Cancel any previous animation loop on this canvas element
    if (canvas._compassRafId) {
      cancelAnimationFrame(canvas._compassRafId);
      canvas._compassRafId = null;
    }

    canvas.width  = CW;
    canvas.height = CH;

    var ctx = canvas.getContext('2d');

    // Normalise scores to [0, 1]
    var values = DIMENSIONS.map(function (d) {
      var v = parseFloat(scores[d]) || 0;
      return Math.min(1, Math.max(0, v / 100));
    });

    var maxVal      = Math.max.apply(null, values);
    var dominantIdx = values.indexOf(maxVal);

    // Needle travels from North (start) to dominant dimension (target)
    var targetAngle = dimAngle(dominantIdx);
    var startAngle  = -Math.PI / 2; // North

    // Shortest-path angle delta
    var angleDiff = ((targetAngle - startAngle) % (Math.PI * 2));
    if (angleDiff >  Math.PI) { angleDiff -= Math.PI * 2; }
    if (angleDiff < -Math.PI) { angleDiff += Math.PI * 2; }

    // Equilibrium: 1.0 = perfectly balanced, 0.0 = very uneven
    var avg      = values.reduce(function (s, v) { return s + v; }, 0) / values.length;
    var variance = values.reduce(function (s, v) { return s + (v - avg) * (v - avg); }, 0) / values.length;
    var equilibrium = Math.max(0, 1 - Math.sqrt(variance) * 2.5);

    var startTime = null;

    function frame(ts) {
      if (!startTime) { startTime = ts; }
      var elapsed = ts - startTime;

      // Needle position
      var p           = Math.min(1, elapsed / NEEDLE_DURATION);
      var needleAngle = startAngle + angleDiff * easeInOut(p);
      // Subtle wobble once the needle has settled
      if (p >= 1) {
        needleAngle = targetAngle + Math.sin(elapsed * WOBBLE_FREQ) * WOBBLE_AMP;
      }

      var pulse = elapsed * PULSE_FREQ;

      ctx.clearRect(0, 0, CW, CH);

      drawBackground(ctx, pulse);
      drawTicks(ctx);
      drawGrid(ctx);
      drawAxes(ctx, dominantIdx, pulse);
      drawEquilibriumRing(ctx, avg, equilibrium);
      drawDataPolygon(ctx, values, dominantIdx, pulse);
      drawNeedle(ctx, needleAngle);
      drawIcons(ctx);
      drawDominantLabel(ctx, dominantIdx, maxVal);

      canvas._compassRafId = requestAnimationFrame(frame);
    }

    canvas._compassRafId = requestAnimationFrame(frame);
  }

  // ── Drawing helpers ────────────────────────────────────────────────────────

  function drawBackground(ctx, pulse) {
    // Softly pulsing inner glow (transparent background – no dark fill)
    var gAlpha   = 0.10 + 0.05 * Math.sin(pulse);
    var glowGrad = ctx.createRadialGradient(CX, CY, 0, CX, CY, R * 0.75);
    glowGrad.addColorStop(0,   'rgba(21,101,192,' + (gAlpha + 0.14) + ')');
    glowGrad.addColorStop(0.6, 'rgba(21,101,192,' + gAlpha + ')');
    glowGrad.addColorStop(1,   'rgba(21,101,192,0)');
    ctx.beginPath();
    ctx.arc(CX, CY, OUTER_R, 0, Math.PI * 2);
    ctx.fillStyle = glowGrad;
    ctx.fill();

    // Outer border ring
    ctx.beginPath();
    ctx.arc(CX, CY, OUTER_R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(21,101,192,0.55)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();
  }

  function drawTicks(ctx) {
    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    for (var i = 0; i < 8; i++) {
      var angle  = (i / 8) * Math.PI * 2 - Math.PI / 2;
      var isMain = (i % 2 === 0); // N, E, S, W

      // Tick line
      var outerTick = isMain ? TICK_OUT_L : TICK_OUT_S;
      ctx.beginPath();
      ctx.moveTo(CX + TICK_IN    * Math.cos(angle), CY + TICK_IN    * Math.sin(angle));
      ctx.lineTo(CX + outerTick  * Math.cos(angle), CY + outerTick  * Math.sin(angle));
      ctx.strokeStyle = isMain ? 'rgba(21,101,192,0.85)' : 'rgba(21,101,192,0.4)';
      ctx.lineWidth   = isMain ? 1.5 : 1;
      ctx.stroke();

      // Label
      ctx.font      = isMain ? 'bold 9px Inter,system-ui,sans-serif'
                              : '8px Inter,system-ui,sans-serif';
      ctx.fillStyle = isMain ? 'rgba(21,101,192,0.92)' : 'rgba(21,101,192,0.55)';
      ctx.fillText(
        CARDINALS[i],
        CX + LABEL_R * Math.cos(angle),
        CY + LABEL_R * Math.sin(angle)
      );
    }

    ctx.restore();
  }

  function drawGrid(ctx) {
    ctx.save();
    ctx.lineWidth = 1;

    [0.25, 0.5, 0.75, 1.0].forEach(function (pct) {
      ctx.beginPath();
      for (var i = 0; i <= 6; i++) {
        var a = dimAngle(i % 6);
        var x = CX + R * pct * Math.cos(a);
        var y = CY + R * pct * Math.sin(a);
        if (i === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
      }
      ctx.strokeStyle = pct === 1.0
        ? 'rgba(21,101,192,0.35)'
        : 'rgba(21,101,192,0.18)';
      ctx.stroke();
    });

    ctx.restore();
  }

  function drawAxes(ctx, dominantIdx, pulse) {
    ctx.save();

    for (var i = 0; i < 6; i++) {
      var angle = dimAngle(i);
      var isDom = (i === dominantIdx);

      if (isDom) {
        var glowAlpha   = 0.55 + 0.30 * Math.sin(pulse * 1.6);
        ctx.shadowColor = 'rgba(21,101,192,' + glowAlpha + ')';
        ctx.shadowBlur  = 12;
        ctx.strokeStyle = 'rgba(21,101,192,0.95)';
        ctx.lineWidth   = 2.5;
      } else {
        ctx.shadowBlur  = 0;
        ctx.strokeStyle = 'rgba(21,101,192,0.45)';
        ctx.lineWidth   = 1;
      }

      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.lineTo(CX + R * Math.cos(angle), CY + R * Math.sin(angle));
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawEquilibriumRing(ctx, avg, equilibrium) {
    if (avg <= 0) { return; }
    ctx.save();

    var ringR = R * avg * (0.65 + 0.35 * equilibrium);

    ctx.beginPath();
    ctx.arc(CX, CY, ringR, 0, Math.PI * 2);
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(52,211,153,' + (0.25 + 0.5 * equilibrium) + ')';
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  function drawDataPolygon(ctx, values, dominantIdx, pulse) {
    ctx.save();

    // Build polygon path
    ctx.beginPath();
    for (var i = 0; i <= 6; i++) {
      var idx = i % 6;
      var a   = dimAngle(idx);
      var x   = CX + R * values[idx] * Math.cos(a);
      var y   = CY + R * values[idx] * Math.sin(a);
      if (i === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
    }

    // Animated gradient fill
    var alpha    = 0.28 + 0.08 * Math.sin(pulse);
    var fillGrad = ctx.createRadialGradient(CX, CY, 0, CX, CY, R);
    fillGrad.addColorStop(0,    'rgba(91,155,213,' + (alpha + 0.18) + ')');
    fillGrad.addColorStop(0.55, 'rgba(21,101,192,'  + alpha + ')');
    fillGrad.addColorStop(1,    'rgba(13,62,122,'  + (alpha * 0.55) + ')');
    ctx.fillStyle = fillGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(21,101,192,0.8)';
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Data-point dots
    for (var j = 0; j < 6; j++) {
      var a2  = dimAngle(j);
      var px  = CX + R * values[j] * Math.cos(a2);
      var py  = CY + R * values[j] * Math.sin(a2);
      var isDom = (j === dominantIdx);

      ctx.beginPath();
      ctx.arc(px, py, isDom ? 5.5 : 3.5, 0, Math.PI * 2);

      if (isDom) {
        ctx.shadowColor = 'rgba(21,101,192,0.9)';
        ctx.shadowBlur  = 12;
        ctx.fillStyle   = '#1565C0';
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle  = '#4a90d9';
      }

      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth   = 1;
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawNeedle(ctx, angle) {
    ctx.save();

    var len = R * 0.65; // needle forward length

    // Arrow proportions matching compass-icon.svg arrow shape
    var wb  = len * (14 / 78); // how far back from tip the wings flare
    var ww  = len * (7  / 78); // half-width at wings
    var iw  = len * (3  / 78); // half-width of shaft
    var sb  = len * (43 / 78); // total depth from tip to shaft base

    // Needle glow
    ctx.shadowColor = 'rgba(21,101,192,0.65)';
    ctx.shadowBlur  = 10;

    // Rotate canvas so arrow points toward target angle
    // (local coords have tip at (0, -len), i.e., pointing "up")
    ctx.translate(CX, CY);
    ctx.rotate(angle + Math.PI / 2);

    ctx.beginPath();
    ctx.moveTo(0,  -len);         // tip
    ctx.lineTo(ww, -(len - wb));  // right wing outer
    ctx.lineTo(iw, -(len - wb));  // right wing inner
    ctx.lineTo(iw, -(len - sb));  // right shaft base
    ctx.lineTo(-iw, -(len - sb)); // left shaft base
    ctx.lineTo(-iw, -(len - wb)); // left wing inner
    ctx.lineTo(-ww, -(len - wb)); // left wing outer
    ctx.closePath();

    ctx.fillStyle = '#1565C0';
    ctx.fill();

    // Centre pivot circle
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle   = '#1565C0';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth   = 1;
    ctx.stroke();

    ctx.restore();
  }

  function drawIcons(ctx) {
    ctx.save();
    ctx.font         = '14px sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    for (var i = 0; i < 6; i++) {
      var a  = dimAngle(i);
      ctx.fillText(ICONS[i], CX + ICON_R * Math.cos(a), CY + ICON_R * Math.sin(a));
    }

    ctx.restore();
  }

  function drawDominantLabel(ctx, dominantIdx, maxVal) {
    ctx.save();

    var labelY = CH - 20;
    var pct    = Math.round(maxVal * 100);
    var text   = ICONS[dominantIdx] + '  Dominant: ' + DIMENSIONS[dominantIdx] + '  (' + pct + '%)';

    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = '500 12px Inter,system-ui,sans-serif';
    ctx.fillStyle    = 'rgba(21,101,192,0.92)';
    ctx.fillText(text, CX, labelY);

    ctx.restore();
  }

  // ── Expose globally ────────────────────────────────────────────────────────
  window.renderCompass = renderCompass;

}());