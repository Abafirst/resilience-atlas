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

  var ICON_SRCS = [
    '/icons/relational-connective.svg',
    '/icons/cognitive-narrative.svg',
    '/icons/somatic-regulative.svg',
    '/icons/emotional-adaptive.svg',
    '/icons/spiritual-reflective.svg',
    '/icons/agentic-generative.svg',
  ];

  // Preload SVG icons so they are ready when the animation renders them
  var _iconImages = ICON_SRCS.map(function (src) {
    var img = new Image();
    img.onerror = function () {
      console.warn('[resilience-compass] Failed to load icon:', src);
    };
    img.src = src;
    return img;
  });

  var CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

  // Canvas dimensions (physical pixels – CSS scales the element)
  var CW = 360; // canvas width
  var CH = 400; // canvas height (extra 40 px for dominant-dimension label)
  var CX = 180; // compass centre x
  var CY = 185; // compass centre y (slight upward offset)
  var R  = 75; // max chart data radius

  // Derived radii (all relative to R)
  var OUTER_R    = R * 1.09; // 139 – outer compass ring
  var TICK_IN    = R * 1.09; // 139 – tick mark inner edge (at ring)
  var TICK_OUT_S = R * 1.17; // 150 – inter-cardinal tick outer edge
  var TICK_OUT_L = R * 1.22; // 156 – cardinal tick outer edge
  var LABEL_R    = R * 1.32; // 169 – cardinal / inter-cardinal label radius
  var ICON_R     = R * 1.06; // 136 – dimension-icon radius (inside ring)
  var ICON_SIZE  = 20;        // dimension-icon display size in canvas pixels

  var NEEDLE_DURATION   = 2500;  // ms – needle travel time
  var WOBBLE_FREQ       = 0.0012; // rad/ms – subtle post-settle needle wobble
  var WOBBLE_AMP        = 0.018;  // rad   – wobble amplitude (~1 degree)
  var PULSE_FREQ        = 0.0021; // rad/ms – gradient pulse cycle rate

  // Grid ring positions (fraction of R). Also used for crosshair arm length.
var GRID_RINGS = [0.2, 0.4, 0.6, 0.8, 1.0];
  var SPLINE_TENSION    = 6;      // Catmull-Rom tension divisor (higher = tighter curves)
  var BG_BLEED          = 6;      // px – navy background extends beyond outer ring
  var INNER_RING_OFFSET = 4;      // px – inner decorative ring inset from outer ring
  var MINOR_TICK_RATIO  = 0.45;   // fraction of the gap [TICK_IN, TICK_OUT_S] for minor ticks
  var NEEDLE_WIDTH_RATIO = 0.09;  // half-width of needle at pivot, as fraction of forward length

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
      drawCrosshairs(ctx);
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

    // Softly pulsing inner glow – purple → turquoise
    var gAlpha   = 0.10 + 0.05 * Math.sin(pulse);
    var glowGrad = ctx.createRadialGradient(CX, CY, 0, CX, CY, R * 0.85);
    glowGrad.addColorStop(0,   'rgba(147,51,234,' + (gAlpha + 0.10) + ')');
    glowGrad.addColorStop(0.5, 'rgba(40,40,40,'  + gAlpha + ')');
    glowGrad.addColorStop(1,   'rgba(40,40,40,0)');
    ctx.beginPath();
    ctx.arc(CX, CY, OUTER_R, 0, Math.PI * 2);
    ctx.fillStyle = glowGrad;
    ctx.fill();

  function drawTicks(ctx) {
    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    // Minor tick marks (every 22.5° – 16 total, no labels)
    for (var m = 0; m < 16; m++) {
      if (m % 2 === 0) { continue; } // skip positions used by main ticks
      var mAngle   = (m / 16) * Math.PI * 2 - Math.PI / 2;
      var mOuter   = TICK_IN + (TICK_OUT_S - TICK_IN) * MINOR_TICK_RATIO;
      ctx.beginPath();
      ctx.moveTo(CX + TICK_IN  * Math.cos(mAngle), CY + TICK_IN  * Math.sin(mAngle));
      ctx.lineTo(CX + mOuter   * Math.cos(mAngle), CY + mOuter   * Math.sin(mAngle));
      ctx.strokeStyle = 'rgba(103,232,249,0.25)';
      ctx.lineWidth   = 0.25;
      ctx.stroke();
    }

    // Main 8 cardinal / inter-cardinal ticks + labels
    for (var i = 0; i < 8; i++) {
      var angle  = (i / 8) * Math.PI * 2 - Math.PI / 2;
      var isMain = (i % 2 === 0); // N, E, S, W

      // Tick line
      var outerTick = isMain ? TICK_OUT_L : TICK_OUT_S;
      ctx.beginPath();
      ctx.moveTo(CX + TICK_IN    * Math.cos(angle), CY + TICK_IN    * Math.sin(angle));
      ctx.lineTo(CX + outerTick  * Math.cos(angle), CY + outerTick  * Math.sin(angle));
      ctx.strokeStyle = isMain ? 'rgba(40,40,40,0.9)' : 'rgba(103,232,249,0.45)';
      ctx.lineWidth   = isMain ? .50 : 0.25;
      ctx.stroke();

      // Label
      ctx.font      = isMain ? 'bold 9px Inter,system-ui,sans-serif'
                              : '8px Inter,system-ui,sans-serif';
      ctx.fillStyle = isMain ? 'rgba(224,242,254,0.95)' : 'rgba(103,232,249,0.6)';
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
    ctx.lineWidth = 0.25;

    // Concentric circles at 25 %, 50 %, 75 %, 100 % of R (no polygons)
    GRID_RINGS.forEach(function (pct) {
      ctx.beginPath();
      ctx.arc(CX, CY, R * pct, 0, Math.PI * 2);
      ctx.strokeStyle = pct === 1.0
? 'rgba(40,40,40,0.7)'
: 'rgba(40,40,40,0.6)';
      ctx.stroke();
    });

    ctx.restore();
  }

  function drawCrosshairs(ctx) {
    // Clean + crosshairs at the compass centre, inside the innermost ring
    ctx.save();
ctx.strokeStyle = 'rgba(40,40,40,0.5)';
    ctx.lineWidth   = 0.5;

    var arm = R * GRID_RINGS[0]; // length matches innermost concentric ring

    ctx.beginPath();
    ctx.moveTo(CX - arm, CY);
    ctx.lineTo(CX + arm, CY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(CX, CY - arm);
    ctx.lineTo(CX, CY + arm);
    ctx.stroke();

    ctx.restore();
  }

  function drawAxes(ctx, dominantIdx, pulse) {
    ctx.save();

    for (var i = 0; i < 6; i++) {
      var angle = dimAngle(i);
      var isDom = (i === dominantIdx);

      if (isDom) {
        var glowAlpha   = 0.55 + 0.30 * Math.sin(pulse * 1.6);
        ctx.shadowColor = 'rgba(40,40,40,' + glowAlpha + ')';
        ctx.shadowBlur  = 10;
        ctx.strokeStyle = 'rgba(40,40,40,0.95)';
        ctx.lineWidth   = 1.5;
      } else {
        ctx.shadowBlur  = 0;
        ctx.strokeStyle = 'rgba(124,58,237,0.35)';
        ctx.lineWidth   = 0.75;
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
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = 'rgba(40,40,40,' + (0.2 + 0.45 * equilibrium) + ')';
    ctx.lineWidth   = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  function drawDataPolygon(ctx, values, dominantIdx, pulse) {
    ctx.save();

    // Compute the 6 radial data points
    var points = [];
    for (var i = 0; i < 6; i++) {
      var a = dimAngle(i);
      points.push({
        x: CX + R * values[i] * Math.cos(a),
        y: CY + R * values[i] * Math.sin(a)
      });
    }

    // Draw a smooth closed Catmull-Rom spline through the data points
    // (no straight-edged polygon – only curves)
    var n = points.length;
    ctx.beginPath();
    for (var k = 0; k < n; k++) {
      var p0 = points[(k - 1 + n) % n];
      var p1 = points[k];
      var p2 = points[(k + 1) % n];
      var p3 = points[(k + 2) % n];

      var cp1x = p1.x + (p2.x - p0.x) / SPLINE_TENSION;
      var cp1y = p1.y + (p2.y - p0.y) / SPLINE_TENSION;
      var cp2x = p2.x - (p3.x - p1.x) / SPLINE_TENSION;
      var cp2y = p2.y - (p3.y - p1.y) / SPLINE_TENSION;

      if (k === 0) { ctx.moveTo(p1.x, p1.y); }
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    ctx.closePath();

    // Animated gradient fill – purple (centre) → turquoise (edge)
    var alpha    = 0.28 + 0.08 * Math.sin(pulse);
    var fillGrad = ctx.createRadialGradient(CX, CY, 0, CX, CY, R);
    fillGrad.addColorStop(0,    'rgba(167,139,250,' + (alpha + 0.15) + ')'); // light purple
    fillGrad.addColorStop(0.45, 'rgba(124,58,237,'  + alpha + ')');          // purple
    fillGrad.addColorStop(1,    'rgba(40,40,40,'   + (alpha * 0.7) + ')');  // turquoise
    ctx.fillStyle = fillGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(40,40,40,0.7)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Data-point dots
    for (var j = 0; j < 6; j++) {
      var a2  = dimAngle(j);
      var px  = CX + R * values[j] * Math.cos(a2);
      var py  = CY + R * values[j] * Math.sin(a2);
      var isDom = (j === dominantIdx);

      ctx.beginPath();
      ctx.arc(px, py, isDom ? 5 : 3, 0, Math.PI * 2);

      if (isDom) {
        ctx.shadowColor = 'rgba(40,40,40,0.9)';
        ctx.shadowBlur  = 12;
        ctx.fillStyle   = '#06B6D4';
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle  = '#9333EA';
      }

      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth   = 0.75;
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawNeedle(ctx, angle) {
    ctx.save();

    var lenFwd  = R * 0.62; // forward needle length (points to dominant)
    var lenBack = R * 0.28; // backward tail length (opposite end)
    var maxHW   = lenFwd * NEEDLE_WIDTH_RATIO; // max half-width at the centre pivot

    // Rotate canvas so forward tip points toward target angle
    ctx.translate(CX, CY);
    ctx.rotate(angle + Math.PI / 2);

    // Needle glow
    ctx.shadowColor = 'rgba(124,58,237,0.75)';
    ctx.shadowBlur  = 14;

    // Linear gradient: turquoise at tail → purple at tip
    var grad = ctx.createLinearGradient(0, lenBack, 0, -lenFwd);
    grad.addColorStop(0,    '#06B6D4'); // turquoise tail
    grad.addColorStop(0.42, '#9333EA'); // purple mid-forward
    grad.addColorStop(1,    '#7C3AED'); // deep purple tip

    // Diamond (rhombus) needle body with two pointed ends
    ctx.beginPath();
    ctx.moveTo(0,      -lenFwd);   // forward tip
    ctx.lineTo(maxHW,  0);         // widest point right
    ctx.lineTo(0,      lenBack);   // backward tip
    ctx.lineTo(-maxHW, 0);         // widest point left
    ctx.closePath();

    ctx.fillStyle = grad;
    ctx.fill();

    ctx.shadowBlur  = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth   = 0.5;
    ctx.stroke();

    // Centre pivot circle – small bright dot
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    var pivotGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 3.5);
    pivotGrad.addColorStop(0, '#E0F2FE');
    pivotGrad.addColorStop(1, '#06B6D4');
    ctx.fillStyle   = pivotGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth   = 0.5;
    ctx.stroke();

    ctx.restore();
  }

  function drawIcons(ctx) {
    var size = ICON_SIZE;
    for (var i = 0; i < 6; i++) {
      var img = _iconImages[i];
      if (!img || !img.complete || !img.naturalWidth) { continue; }
      var a = dimAngle(i);
      ctx.drawImage(
        img,
        CX + ICON_R * Math.cos(a) - size / 2,
        CY + ICON_R * Math.sin(a) - size / 2,
        size,
        size
      );
    }
  }

  function drawDominantLabel(ctx, dominantIdx, maxVal) {
    ctx.save();

    var labelY = CH - 20;
    var pct    = Math.round(maxVal * 100);
    var text   = 'Dominant: ' + DIMENSIONS[dominantIdx] + '  (' + pct + '%)';

    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = '500 12px Inter,system-ui,sans-serif';
    ctx.fillStyle    = 'rgba(103,232,249,0.9)';
    ctx.fillText(text, CX, labelY);

    ctx.restore();
  }

  // ── Expose globally ────────────────────────────────────────────────────────
  window.renderCompass = renderCompass;

