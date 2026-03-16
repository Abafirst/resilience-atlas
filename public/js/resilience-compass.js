/* resilience-compass.js – Animated canvas-based resilience compass
 * Exposes window.renderCompass(canvas, scores) for use on any page.
 */
(function () {
  'use strict';

  // ── Configuration ──────────────────────────────────────────────────────────
  var DIMENSIONS = (typeof window !== 'undefined' &&
    Array.isArray(window.ResilienceCompassDimensions) &&
    window.ResilienceCompassDimensions.length)
    ? window.ResilienceCompassDimensions.slice()
    : [
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
  if (typeof window !== 'undefined') {
    window.ResilienceCompassDimensions = DIMENSIONS.slice();
  }

  // Canvas dimensions (physical pixels – CSS scales the element)
  var CW = 360; // canvas width
  var CH = 400; // canvas height (extra 40 px for dominant-dimension label)
  var CX = 180; // compass centre x
  var CY = 185; // compass centre y (slight upward offset)
  var R  = 75; // max chart data radius

  // Derived radii (all relative to R)
  var OUTER_R     = R * 1.11; // outer compass ring
  var TICK_START  = OUTER_R - 1;
  var MAJOR_TICK  = 10;
  var MINOR_TICK  = 4;
  var LABEL_R     = OUTER_R + 18;
  var ICON_R      = R * 1.06;
  var ICON_SIZE   = 20;
  var ICON_OPACITY = 0.4;
  var BAND_INSET   = 1;
  var DOMINANT_BAND_DEGREES = 8;
  var DOMINANT_BAND_ARC_ANGLE = DOMINANT_BAND_DEGREES * Math.PI / 180;
  var ACCENT_CYAN = '#22d3ee';
  var ACCENT_CYAN_RGBA = 'rgba(34,211,238,';

  var NEEDLE_DURATION        = 900;
  var NEEDLE_SMOOTHING_RATE  = 0.1;
  var NEEDLE_OSC_FREQ        = 0.010;
  var NEEDLE_OSC_AMP         = 0.012;
  var NEEDLE_OSC_DECAY       = 1800;
  var NEEDLE_HALF_WIDTH      = 5;
  var BREATHING_PERIOD_MS    = 6000;
  var PULSE_PERIOD_MS        = 2800;
  var BREATHING_FREQ         = (Math.PI * 2) / BREATHING_PERIOD_MS;
  var PULSE_FREQ             = (Math.PI * 2) / PULSE_PERIOD_MS;

  // Grid ring positions (fraction of R). Also used for crosshair arm length.
  var GRID_RINGS = [0.2, 0.4, 0.6, 0.8, 1.0];
  var GRID_OPACITY = [0.03, 0.03, 0.08, 0.03, 0.12];
  var GRID_OPACITY_FALLBACK = 0.05;
  var GRID_BASE_COLOR = 'rgba(0,0,0,';
  var CROSSHAIR_COLOR = 'rgba(0,0,0,0.08)';
  var LABEL_LETTER_SPACING_RATIO = 0.08;
  var EQUILIBRIUM_PULSE_THRESHOLD = 0.75;
  var EQUILIBRIUM_PULSE_FREQ_MULTIPLIER = 2;
  var EQUILIBRIUM_PULSE_AMPLITUDE = 0.08;
  var EQUILIBRIUM_RING_MAX_ALPHA = 0.6;
  var EQUILIBRIUM_DASH_PATTERN = [4, 6];

  var GRID_FADE_START    = 0;
  var GRID_FADE_DURATION = 240;
  var FIELD_FADE_START   = 120;
  var FIELD_FADE_DURATION = 360;
  var POLYGON_START      = 180;
  var POLYGON_DURATION   = 420;
  var RING_START         = 420;
  var RING_DURATION      = 240;
  var BAND_START         = 520;
  var BAND_DURATION      = 240;
  var HUB_START          = 600;
  var HUB_DURATION       = 200;
  var SPLINE_TENSION    = 6;      // Catmull-Rom tension divisor (higher = tighter curves)
  var BG_BLEED          = 6;      // px – navy background extends beyond outer ring

  var DEGREE_LABEL_R = R * 1.44;
  var BEZEL_R        = R * 1.62;
  var DOUBLE_RING_GAP = 7;

  // ── Helpers ────────────────────────────────────────────────────────────────
  /** Quadratic ease-in-out: slow start, fast middle, slow end. */
  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function easeOutBack(t) {
    // Standard overshoot constant for back easing.
    var c1 = 1.70158;
    var c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
  }

  function phaseProgress(elapsed, start, duration) {
    if (duration <= 0) {
      return elapsed >= start ? 1 : 0;
    }
    return clamp((elapsed - start) / duration, 0, 1);
  }

  /**
   * Normalize score inputs into a 0–100 numeric value.
   * Accepts numbers or objects with percentage/score/value/raw+max.
   */
  function normalizeScore(value) {
    if (value === null || value === undefined) { return 0; }
    if (typeof value === 'object') {
      if (typeof value.percentage === 'number') { return value.percentage; }
      if (typeof value.score === 'number') { return value.score; }
      if (typeof value.value === 'number') { return value.value; }
      if (typeof value.raw === 'number' && typeof value.max === 'number' && value.max > 0) {
        return (value.raw / value.max) * 100;
      }
    }
    return parseFloat(value) || 0;
  }

  var needleAnglesMap = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  var needleAnglesFallbackIsMap = false;
  var needleAnglesFallback = null;
  if (!needleAnglesMap && typeof Map !== 'undefined') {
    needleAnglesFallback = new Map();
    needleAnglesFallbackIsMap = true;
  } else if (!needleAnglesMap) {
    needleAnglesFallback = [];
  }

  function getStoredNeedleAngle(canvas) {
    if (needleAnglesMap) {
      return needleAnglesMap.has(canvas) ? needleAnglesMap.get(canvas) : null;
    }
    if (needleAnglesFallbackIsMap) {
      return needleAnglesFallback.has(canvas) ? needleAnglesFallback.get(canvas) : null;
    }
    for (var i = 0; i < needleAnglesFallback.length; i++) {
      if (needleAnglesFallback[i].canvas === canvas) {
        return needleAnglesFallback[i].angle;
      }
    }
    return null;
  }

  function setStoredNeedleAngle(canvas, angle) {
    if (needleAnglesMap) {
      needleAnglesMap.set(canvas, angle);
      return;
    }
    if (needleAnglesFallbackIsMap) {
      needleAnglesFallback.set(canvas, angle);
      return;
    }
    for (var i = 0; i < needleAnglesFallback.length; i++) {
      if (needleAnglesFallback[i].canvas === canvas) {
        needleAnglesFallback[i].angle = angle;
        return;
      }
    }
    needleAnglesFallback.push({ canvas: canvas, angle: angle });
  }

  /**
   * Draw text centered at (x, y) with optional letter spacing.
   */
  function drawSpacedText(ctx, text, x, y, spacing) {
    if (!spacing || spacing <= 0) {
      ctx.fillText(text, x, y);
      return;
    }
    var chars = text.split('');
    var totalWidth = 0;
    chars.forEach(function (char) {
      totalWidth += ctx.measureText(char).width + spacing;
    });
    totalWidth -= spacing;
    var start = x - totalWidth / 2;
    chars.forEach(function (char) {
      var w = ctx.measureText(char).width;
      ctx.fillText(char, start + w / 2, y);
      start += w + spacing;
    });
  }

  /** Angle (radians) for dimension i, clockwise from North (top). */
  function dimAngle(i) {
    return (i / DIMENSIONS.length) * Math.PI * 2 - Math.PI / 2;
  }

  // ── Background brightness detection ────────────────────────────────────────
  var _isLightBackground = false;

  /**
   * Relative luminance using ITU-R BT.601 luma coefficients (0–1).
   * Values > 0.5 are perceived as "light".
   */
  function calcLuminance(r, g, b) {
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  /** Returns true if the canvas sits on a light (white/near-white) background. */
  function detectBackground(canvas) {
    var el = canvas && canvas.parentElement;
    while (el) {
      var bg = window.getComputedStyle(el).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        var m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (m) {
          return calcLuminance(+m[1], +m[2], +m[3]) > 0.5;
        }
      }
      el = el.parentElement;
    }
    // Fallback: check document.body
    var bodyBg = window.getComputedStyle(document.body).backgroundColor;
    var bm = bodyBg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (bm) {
      return calcLuminance(+bm[1], +bm[2], +bm[3]) > 0.5;
    }
    return false;
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  /**
   * Render an animated resilience compass onto a <canvas> element.
   * @param {HTMLCanvasElement} canvas
   * @param {Object} scores  Key: dimension name, value: 0–100
   */
  function renderCompass(canvas, scores) {
    if (!canvas || typeof canvas.getContext !== 'function') { return; }

    // Detect background brightness once so drawing helpers can adapt colors
    _isLightBackground = detectBackground(canvas);

    // Cancel any previous animation loop on this canvas element
    if (canvas._compassRafId) {
      cancelAnimationFrame(canvas._compassRafId);
      canvas._compassRafId = null;
    }

    canvas.width  = CW;
    canvas.height = CH;

    var ctx = canvas.getContext('2d');

    var rawValues = DIMENSIONS.map(function (d) {
      var scoreValue = normalizeScore(scores && scores[d]);
      return Math.min(100, Math.max(0, scoreValue));
    });
    var values = rawValues.map(function (v) { return v / 100; });

    var maxVal      = Math.max.apply(null, values);
    var dominantIdx = values.indexOf(maxVal);
    if (scores && typeof scores === 'object') {
      var sorted = Object.entries(scores)
        .filter(function (entry) { return DIMENSIONS.indexOf(entry[0]) !== -1; })
        .map(function (entry) { return [entry[0], normalizeScore(entry[1])]; })
        .sort(function (a, b) { return b[1] - a[1]; });
      if (sorted.length) {
        dominantIdx = DIMENSIONS.indexOf(sorted[0][0]);
        maxVal = clamp(sorted[0][1] / 100, 0, 1);
      }
    }
    if (dominantIdx < 0) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[resilience-compass] Dominant dimension could not be determined from the provided scores. Defaulting to first dimension.');
      }
      dominantIdx = 0;
    }

    // Needle travels from North (start) to dominant dimension (target)
    var targetAngle = dimAngle(dominantIdx);
    var previousAngle = getStoredNeedleAngle(canvas);
    var startAngle  = (typeof previousAngle === 'number') ? previousAngle : -Math.PI / 2;

    // Shortest-path angle delta
    var angleDiff = ((targetAngle - startAngle) % (Math.PI * 2));
    if (angleDiff >  Math.PI) { angleDiff -= Math.PI * 2; }
    if (angleDiff < -Math.PI) { angleDiff += Math.PI * 2; }

    // Equilibrium: 1.0 = perfectly balanced, 0.0 = very uneven
    var avg      = values.reduce(function (s, v) { return s + v; }, 0) / values.length;
    var variance = values.reduce(function (s, v) { return s + (v - avg) * (v - avg); }, 0) / values.length;
    var equilibrium = Math.max(0, 1 - Math.sqrt(variance) * 2.5);

    var startTime = null;
    var currentAngle = startAngle;

    function frame(ts) {
      if (!startTime) { startTime = ts; }
      var elapsed = ts - startTime;

      var sweepProgress = Math.min(1, elapsed / NEEDLE_DURATION);
      if (sweepProgress < 1) {
        currentAngle = startAngle + angleDiff * easeOutBack(sweepProgress);
      } else {
        currentAngle += (targetAngle - currentAngle) * NEEDLE_SMOOTHING_RATE;
        var oscillation = Math.sin(elapsed * NEEDLE_OSC_FREQ) * NEEDLE_OSC_AMP;
        currentAngle += oscillation * Math.exp(-elapsed / NEEDLE_OSC_DECAY);
      }

      var pulse = elapsed * PULSE_FREQ;
      var breathing = (Math.sin(elapsed * BREATHING_FREQ - Math.PI / 2) + 1) / 2;

      var gridIn       = phaseProgress(elapsed, GRID_FADE_START, GRID_FADE_DURATION);
      var fieldIn      = phaseProgress(elapsed, FIELD_FADE_START, FIELD_FADE_DURATION);
      var polygonIn    = phaseProgress(elapsed, POLYGON_START, POLYGON_DURATION);
      var ringIn       = phaseProgress(elapsed, RING_START, RING_DURATION);
      var bandIn       = phaseProgress(elapsed, BAND_START, BAND_DURATION);
      var hubIn        = phaseProgress(elapsed, HUB_START, HUB_DURATION);

      ctx.clearRect(0, 0, CW, CH);

      drawBackground(ctx, pulse);
      drawBezel(ctx);
      drawDoubleRing(ctx);
      drawCompassNub(ctx);
      drawTicks(ctx);
      drawDegreeMarkers(ctx);
      drawGrid(ctx, gridIn);
      drawAxes(ctx, dominantIdx, pulse, gridIn);
      drawEnergyField(ctx, breathing, fieldIn);
      drawDataPolygon(ctx, values, dominantIdx, pulse, polygonIn);
      drawDimensionNodes(ctx, values, dominantIdx, polygonIn);
      drawIcons(ctx);
      drawEquilibriumRing(ctx, equilibrium, ringIn, pulse);
      drawDominantGlowBand(ctx, dominantIdx, bandIn);
      drawCompassRose(ctx);
      drawNeedle(ctx, currentAngle);
      drawCenterHub(ctx, hubIn, pulse);
      drawDominantLabel(ctx, dominantIdx, maxVal);

      setStoredNeedleAngle(canvas, currentAngle);
      canvas._compassRafId = requestAnimationFrame(frame);
    }

    canvas._compassRafId = requestAnimationFrame(frame);
  }

  // ── Drawing helpers ────────────────────────────────────────────────────────

  function drawBackground(ctx, pulse) {

    // Subtle radial gradient: lighter center → darker edges (depth / 3-D effect)
    var depthGrad = ctx.createRadialGradient(CX, CY, 0, CX, CY, OUTER_R + BG_BLEED);
    depthGrad.addColorStop(0,   'rgba(255,255,255,0.25)');
    depthGrad.addColorStop(0.5, 'rgba(0,0,0,0)');
    depthGrad.addColorStop(1,   'rgba(0,0,0,0.05)');
    ctx.beginPath();
    ctx.arc(CX, CY, OUTER_R + BG_BLEED, 0, Math.PI * 2);
    ctx.fillStyle = depthGrad;
    ctx.fill();

    var gAlpha   = 0.08 + 0.04 * Math.sin(pulse);
    var glowGrad = ctx.createRadialGradient(CX, CY, 0, CX, CY, R * 0.9);
    glowGrad.addColorStop(0,   'rgba(139,92,246,' + (gAlpha + 0.06) + ')');
    glowGrad.addColorStop(0.6, 'rgba(139,92,246,' + gAlpha + ')');
    glowGrad.addColorStop(1,   'rgba(139,92,246,0)');
    ctx.beginPath();
    ctx.arc(CX, CY, OUTER_R, 0, Math.PI * 2);
    ctx.fillStyle = glowGrad;
    ctx.fill();
 }
  function drawTicks(ctx) {
    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    for (var deg = 0; deg < 360; deg += 10) {
      var isMajor = deg % 45 === 0;
      var isCardinal = deg % 90 === 0;
      var len = isMajor ? MAJOR_TICK : MINOR_TICK;
      var angle = (deg * Math.PI / 180) - Math.PI / 2;

      ctx.beginPath();
      ctx.moveTo(
        CX + TICK_START * Math.cos(angle),
        CY + TICK_START * Math.sin(angle)
      );
      ctx.lineTo(
        CX + (TICK_START + len) * Math.cos(angle),
        CY + (TICK_START + len) * Math.sin(angle)
      );
      var tickAlpha = isMajor ? 0.35 : 0.2;
      if (isCardinal) { tickAlpha = 0.55; }
      ctx.strokeStyle = 'rgba(0,0,0,' + tickAlpha + ')';
      ctx.lineWidth   = isMajor ? 1 : 0.7;
      ctx.stroke();
    }

    for (var i = 0; i < 8; i++) {
      var labelAngle = (i / 8) * Math.PI * 2 - Math.PI / 2;
      var isMain = i % 2 === 0;
      var fontSize = isMain ? 12 : 10;
      var spacing = fontSize * LABEL_LETTER_SPACING_RATIO;
      ctx.font      = '600 ' + fontSize + 'px Inter,system-ui,sans-serif';
      ctx.fillStyle = '#444';
      drawSpacedText(
        ctx,
        CARDINALS[i],
        CX + LABEL_R * Math.cos(labelAngle),
        CY + LABEL_R * Math.sin(labelAngle),
        spacing
      );
    }

    ctx.restore();
  }
  function drawGrid(ctx, fade) {
    ctx.save();
    ctx.globalAlpha = fade;

    GRID_RINGS.forEach(function (pct, idx) {
      ctx.beginPath();
      ctx.arc(CX, CY, R * pct, 0, Math.PI * 2);
      var opacity = typeof GRID_OPACITY[idx] === 'number' ? GRID_OPACITY[idx] : GRID_OPACITY_FALLBACK;
      ctx.strokeStyle = GRID_BASE_COLOR + opacity + ')';
      ctx.lineWidth = pct === 1.0 ? 0.9 : 0.6;
      ctx.stroke();
    });

    drawCrosshairs(ctx);
    ctx.restore();
  } 
  function drawCrosshairs(ctx) {
    ctx.save();
    ctx.strokeStyle = CROSSHAIR_COLOR;
    ctx.lineWidth = 0.6;

    var arm = R * GRID_RINGS[0];

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

  function drawAxes(ctx, dominantIdx, pulse, fade) {
    ctx.save();
    ctx.globalAlpha = fade;

    var pulseVal = (Math.sin(pulse) + 1) / 2;
    for (var i = 0; i < DIMENSIONS.length; i++) {
      var angle = dimAngle(i);
      var isDom = (i === dominantIdx);
      var baseAlpha = isDom ? 0.16 + 0.04 * pulseVal : 0.08;

      ctx.shadowBlur  = 0;
      ctx.strokeStyle = 'rgba(0,0,0,' + baseAlpha + ')';
      ctx.lineWidth   = isDom ? 0.9 : 0.6;

      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.lineTo(CX + R * Math.cos(angle), CY + R * Math.sin(angle));
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawEnergyField(ctx, breathing, progress) {
    if (progress <= 0) { return; }
    ctx.save();
    var scale = 0.95 + breathing * 0.1;
    var opacity = (0.7 + breathing * 0.3) * progress;

    ctx.translate(CX, CY);
    ctx.scale(scale, scale);
    ctx.globalAlpha = opacity;

    var grad = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.1);
    grad.addColorStop(0,   'rgba(139,92,246,0.25)');
    grad.addColorStop(0.55,'rgba(139,92,246,0.10)');
    grad.addColorStop(1,   'rgba(139,92,246,0)');
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.05, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.restore();
  }

  function drawEquilibriumRing(ctx, equilibrium, progress, pulse) {
    if (equilibrium <= 0 || progress <= 0) { return; }
    ctx.save();
    ctx.globalAlpha = progress;

    var ringR = R * 0.7;
    var pulseBoost = equilibrium > EQUILIBRIUM_PULSE_THRESHOLD
      ? EQUILIBRIUM_PULSE_AMPLITUDE * Math.sin(pulse * EQUILIBRIUM_PULSE_FREQ_MULTIPLIER)
      : 0;
    var alpha = 0.08 + 0.32 * equilibrium + pulseBoost;

    ctx.beginPath();
    ctx.arc(CX, CY, ringR, 0, Math.PI * 2);
    if (equilibrium < 0.5) {
      ctx.setLineDash(EQUILIBRIUM_DASH_PATTERN);
    }
    ctx.strokeStyle = ACCENT_CYAN_RGBA + clamp(alpha, 0, EQUILIBRIUM_RING_MAX_ALPHA) + ')';
    ctx.lineWidth   = 3;
    ctx.shadowBlur  = 8;
    ctx.shadowColor = ACCENT_CYAN_RGBA + '0.35)';
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  function drawDominantGlowBand(ctx, dominantIdx, progress) {
    if (progress <= 0) { return; }
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(dimAngle(dominantIdx));

    var dominantBandRadius = OUTER_R + DOUBLE_RING_GAP - BAND_INSET;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, dominantBandRadius, -DOMINANT_BAND_ARC_ANGLE / 2, DOMINANT_BAND_ARC_ANGLE / 2);
    ctx.closePath();

    ctx.globalAlpha = progress;
    ctx.fillStyle   = 'rgba(139,92,246,0.35)';
    ctx.shadowColor = 'rgba(139,92,246,0.6)';
    ctx.shadowBlur  = 16;
    ctx.fill();

    ctx.restore();
  }

  function drawDataPolygon(ctx, values, dominantIdx, pulse, progress) {
    if (progress <= 0) { return; }
    ctx.save();
    ctx.globalAlpha = progress;

    var scale = easeInOut(progress);
    var points = [];
    for (var i = 0; i < DIMENSIONS.length; i++) {
      var a = dimAngle(i);
      var value = values[i] * scale;
      points.push({
        x: CX + R * value * Math.cos(a),
        y: CY + R * value * Math.sin(a)
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

    ctx.shadowColor = 'rgba(124,58,237,0.35)';
    ctx.shadowBlur  = 12;
    var alpha    = 0.45 + 0.04 * Math.sin(pulse);
    var fillGrad = ctx.createRadialGradient(CX, CY, 0, CX, CY, R);
    fillGrad.addColorStop(0, 'rgba(124,58,237,' + alpha + ')');
    fillGrad.addColorStop(1, 'rgba(124,58,237,0.05)');
    ctx.fillStyle = fillGrad;
    ctx.fill();

    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth   = 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawDimensionNodes(ctx, values, dominantIdx, progress) {
    if (progress <= 0) { return; }
    ctx.save();
    ctx.globalAlpha = progress;

    var scale = easeInOut(progress);
    for (var j = 0; j < DIMENSIONS.length; j++) {
      var a  = dimAngle(j);
      var px = CX + R * values[j] * scale * Math.cos(a);
      var py = CY + R * values[j] * scale * Math.sin(a);
      var isDom = (j === dominantIdx);

      ctx.beginPath();
      ctx.arc(px, py, isDom ? 4.5 : 3, 0, Math.PI * 2);

      ctx.shadowColor = isDom ? ACCENT_CYAN_RGBA + '0.5)' : 'rgba(124,58,237,0.25)';
      ctx.shadowBlur  = isDom ? 10 : 6;
      ctx.fillStyle   = isDom ? ACCENT_CYAN : '#7c3aed';
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth   = 0.8;
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawCompassNub(ctx) {
    ctx.save();

    // Small semi-ellipse dome at the very top of the compass, centered on CX.
    // It sits above the bezel ring – minimalistic and semi-transparent.
    var bezelTop = CY - BEZEL_R;
    var nubW     = 24;  // total width of the nub
    var nubH     = 16;   // how many px it protrudes above the bezel top

    ctx.beginPath();
    ctx.moveTo(CX - nubW / 2, bezelTop);
    // Upper semi-ellipse: anticlockwise from Math.PI → 0 passes through the top
ctx.ellipse(CX, bezelTop, nubW / 2, nubH, 0, Math.PI, Math.PI * 2, false);
    ctx.closePath();

    var nubGrad = ctx.createLinearGradient(CX, bezelTop - nubH, CX, bezelTop);
    nubGrad.addColorStop(0, 'rgba(224,231,255,0.5)');
    nubGrad.addColorStop(1, 'rgba(147,51,234,0.3)');
    ctx.fillStyle = nubGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(40,40,40,0.35)';
    ctx.lineWidth   = 0.75;
    ctx.stroke();

    ctx.restore();
  }

  function drawDoubleRing(ctx) {
    ctx.save();

    // Thin inner ring at OUTER_R
    ctx.beginPath();
    ctx.arc(CX, CY, OUTER_R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(40,40,40,0.25)';
    ctx.lineWidth   = 0.5;
    ctx.stroke();

    // Outer ring just beyond OUTER_R – creates double-line border effect
    ctx.beginPath();
    ctx.arc(CX, CY, OUTER_R + DOUBLE_RING_GAP, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(40,40,40,0.35)';
    ctx.lineWidth   = 1.0;
    ctx.stroke();

    ctx.restore();
  }

  function drawBezel(ctx) {
    ctx.save();

    // Outer ring of decorative bezel frame
    ctx.beginPath();
    ctx.arc(CX, CY, BEZEL_R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(40,40,40,0.30)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Subtle inner highlight ring for framed appearance
    ctx.beginPath();
    ctx.arc(CX, CY, BEZEL_R - 5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth   = 1.0;
    ctx.stroke();

    ctx.restore();
  }

  function drawDegreeMarkers(ctx) {
    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = '6px Inter,system-ui,sans-serif';
    ctx.fillStyle    = 'rgba(40,40,40,0.65)';

    var degrees = [0, 45, 90, 135, 180, 225, 270, 315];
    for (var i = 0; i < degrees.length; i++) {
      var angle = (degrees[i] * Math.PI / 180) - Math.PI / 2; // clockwise from North
      ctx.fillText(
        degrees[i] + '\u00B0',
        CX + DEGREE_LABEL_R * Math.cos(angle),
        CY + DEGREE_LABEL_R * Math.sin(angle)
      );
    }

    ctx.restore();
  }

  function drawCompassRose(ctx) {
    ctx.save();
    ctx.translate(CX, CY);

    var outerPt = 9;   // outer point radius of 8-pointed star
    var innerPt = 3.5; // inner valley radius

    ctx.beginPath();
    for (var i = 0; i < 16; i++) {
      var r     = (i % 2 === 0) ? outerPt : innerPt;
      var angle = (i / 16) * Math.PI * 2 - Math.PI / 2;
      if (i === 0) {
        ctx.moveTo(r * Math.cos(angle), r * Math.sin(angle));
      } else {
        ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
      }
    }
    ctx.closePath();

    var roseGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, outerPt);
    roseGrad.addColorStop(0,   'rgba(255,255,255,1.0)');
    roseGrad.addColorStop(0.5, 'rgba(224,242,254,0.95)');
    roseGrad.addColorStop(1,   'rgba(6,182,212,0.90)');
    ctx.fillStyle = roseGrad;

    ctx.shadowColor   = 'rgba(0,0,0,0.40)';
    ctx.shadowBlur    = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fill();

    ctx.shadowBlur    = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = 'rgba(124,58,237,0.55)';
    ctx.lineWidth   = 0.75;
    ctx.stroke();

    ctx.restore();
  }

  function drawNeedle(ctx, angle) {
    ctx.save();

    var lenFwd  = R * 0.65;
    var lenBack = R * 0.28;
    var maxHW   = NEEDLE_HALF_WIDTH;

    // Rotate canvas so forward tip points toward target angle
    ctx.translate(CX, CY);
    ctx.rotate(angle + Math.PI / 2);

    // Needle glow / drop shadow
    ctx.shadowColor   = ACCENT_CYAN_RGBA + '0.45)';
    ctx.shadowBlur    = 14;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.beginPath();
    ctx.moveTo(0, -lenFwd);
    ctx.lineTo(maxHW, 0);
    ctx.lineTo(-maxHW, 0);
    ctx.closePath();
    ctx.fillStyle = ACCENT_CYAN;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, lenBack);
    ctx.lineTo(maxHW, 0);
    ctx.lineTo(-maxHW, 0);
    ctx.closePath();
    ctx.fillStyle = '#0891b2';
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(0, -lenFwd);
    ctx.lineTo(maxHW, 0);
    ctx.lineTo(0, lenBack);
    ctx.lineTo(-maxHW, 0);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth   = 0.4;
    ctx.stroke();

    ctx.restore();
  }

  function drawCenterHub(ctx, progress, pulse) {
    if (progress <= 0) { return; }
    ctx.save();
    ctx.globalAlpha = progress;
    ctx.translate(CX, CY);

    var pulseScale = 1 + 0.04 * Math.sin(pulse) * progress;
    ctx.scale(pulseScale, pulseScale);

    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fillStyle = ACCENT_CYAN;
    ctx.fill();

    ctx.restore();
  }

  function drawIcons(ctx) {
    var size = ICON_SIZE;
    for (var i = 0; i < DIMENSIONS.length; i++) {
      var img = _iconImages[i];
      if (!img || !img.complete || !img.naturalWidth) { continue; }
      var a = dimAngle(i);
      ctx.globalAlpha = ICON_OPACITY;
      ctx.drawImage(
        img,
        CX + ICON_R * Math.cos(a) - size / 2,
        CY + ICON_R * Math.sin(a) - size / 2,
        size,
        size
      );
      ctx.globalAlpha = 1.0;
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
})();
