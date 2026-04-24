/* brand-compass.js
 * Animated brand-aligned resilience compass built on HTML5 Canvas.
 * Exposes window.renderBrandCompass(canvas, scores) — completely independent
 * of resilience-compass.js; no shared code, no shared globals.
 *
 * Design basis: Resilience Atlas brand symbol (brand/symbol/svg/symbol.svg)
 *   • Outer boundary ring  (#1565C0, Deep Navy)
 *   • Inner structural ring (#0097A7, Soft Teal)
 *   • Subtle hexagonal geometry (teal, 6 dimensions)
 *   • Cardinal & ordinal tick marks
 *   • Central radial-gradient focal point
 *   • Diamond-shaped needle that rotates smoothly to highest dimension
 */
(function () {
  'use strict';

  // ── Brand palette ──────────────────────────────────────────────────────────
  var BRAND = {
    navy:         '#1565C0',
    navyLight:    '#5C8FD6',
    teal:         '#0097A7',
    tealLight:    '#4DD0E1',
    purple:       '#6A4C93',
    purpleLight:  '#9C73C8',
    white:        '#FFFFFF',
    nearWhite:    '#F0F7FF',
    offBlack:     '#0D1B2A',
  };

  // Theme palettes (auto-selected based on background brightness)
  var LIGHT_PAL = {
    bg:            'transparent',
    outerRing:     'rgba(21,101,192,0.75)',     // navy
    innerRing:     'rgba(0,151,167,0.35)',       // teal
    hexStroke:     'rgba(0,151,167,0.25)',       // teal subtle
    cardinalTick:  'rgba(21,101,192,0.70)',
    ordinalDot:    'rgba(21,101,192,0.35)',
    gridRing:      'rgba(21,101,192,0.10)',
    dimLabel:      '#1565C0',
    dimLabelDom:   '#0D1B2A',
    polygonFill:   'rgba(0,151,167,0.12)',
    polygonStroke: 'rgba(0,151,167,0.65)',
    polygonDomFill:'rgba(21,101,192,0.18)',
    polygonDomStroke:'rgba(21,101,192,0.85)',
    needleFwd:     '#1565C0',
    needleMid:     '#5C8FD6',
    needleBack:    '#0097A7',
    needleGlow:    'rgba(21,101,192,0.5)',
    hubGrad0:      '#5C8FD6',
    hubGrad1:      '#1565C0',
    hubHighlight:  'rgba(255,255,255,0.4)',
    domBand:       'rgba(21,101,192,0.15)',
    scoreText:     '#1565C0',
  };

  var DARK_PAL = {
    bg:            'transparent',
    outerRing:     'rgba(92,143,214,0.80)',
    innerRing:     'rgba(77,208,225,0.35)',
    hexStroke:     'rgba(77,208,225,0.20)',
    cardinalTick:  'rgba(92,143,214,0.80)',
    ordinalDot:    'rgba(92,143,214,0.45)',
    gridRing:      'rgba(92,143,214,0.10)',
    dimLabel:      '#9BBEF5',
    dimLabelDom:   '#E8F4FF',
    polygonFill:   'rgba(77,208,225,0.10)',
    polygonStroke: 'rgba(77,208,225,0.60)',
    polygonDomFill:'rgba(92,143,214,0.18)',
    polygonDomStroke:'rgba(92,143,214,0.90)',
    needleFwd:     '#5C8FD6',
    needleMid:     '#4DD0E1',
    needleBack:    '#0097A7',
    needleGlow:    'rgba(77,208,225,0.55)',
    hubGrad0:      '#7EB3FF',
    hubGrad1:      '#1565C0',
    hubHighlight:  'rgba(255,255,255,0.25)',
    domBand:       'rgba(92,143,214,0.18)',
    scoreText:     '#4DD0E1',
  };

  // ── Dimensions ─────────────────────────────────────────────────────────────
  var DIMENSIONS = [
    'Agentic-Generative',
    'Relational-Connective',
    'Spiritual-Reflective',
    'Emotional-Adaptive',
    'Somatic-Regulative',
    'Cognitive-Narrative',
  ];

  var DIM_SHORT = [
    'Agentic',
    'Relational',
    'Spiritual',
    'Emotional',
    'Somatic',
    'Cognitive',
  ];

  var ICON_SRCS = [
    '/icons/agentic-generative.svg',
    '/icons/relational-connective.svg',
    '/icons/spiritual-reflective.svg',
    '/icons/emotional-adaptive.svg',
    '/icons/somatic-regulative.svg',
    '/icons/cognitive-narrative.svg',
  ];

  // Preload icons once
  var _icons = ICON_SRCS.map(function (src) {
    var img = new Image();
    img.src = src;
    return img;
  });

  // ── Layout constants ────────────────────────────────────────────────────────
  // Canvas is drawn at CW × CH logical pixels; CSS may scale the element.
  var CW = 380;
  var CH = 420;
  var CX = CW / 2;          // centre x
  var CY = CH / 2 - 10;     // centre y (slight upward offset for label space)

  var R_OUTER  = 130;        // outer boundary ring radius
  var R_INNER  = 72;         // inner structural ring radius
  var R_DATA   = 90;         // max data polygon radius
  var R_ICON   = R_OUTER + 22;  // icon / label orbit
  var R_LABEL  = R_OUTER + 42; // dimension label orbit
  var ICON_SZ  = 20;

  // Six hexagon vertices — same angles used for dimension positions
  // Starting at top (−90°) and going clockwise, one per dimension.
  function dimAngle(i) {
    return -Math.PI / 2 + (i * Math.PI * 2) / 6;
  }

  // ── Animation timing ────────────────────────────────────────────────────────
  var NEEDLE_SWEEP_DURATION = 1100; // ms — initial sweep to target
  var NEEDLE_OSC_FREQ       = 0.008;
  var NEEDLE_OSC_AMP        = 0.010;
  var NEEDLE_OSC_DECAY      = 2000;
  var BREATHING_PERIOD      = 5500;
  var BREATHING_FREQ        = (Math.PI * 2) / BREATHING_PERIOD;
  var PULSE_PERIOD          = 2600;
  var PULSE_FREQ            = (Math.PI * 2) / PULSE_PERIOD;
  var MAX_FPS               = 30;
  var FRAME_INTERVAL_MS     = 1000 / MAX_FPS;
  var NEEDLE_RENDER_PADDING = 34;
  var NEEDLE_RENDER_RADIUS  = R_OUTER + 22;

  var PHASE_GRID_START    = 0;
  var PHASE_GRID_DUR      = 300;
  var PHASE_POLY_START    = 220;
  var PHASE_POLY_DUR      = 450;
  var PHASE_HUB_START     = 550;
  var PHASE_HUB_DUR       = 220;

  // ── Utility ─────────────────────────────────────────────────────────────────
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function phaseProgress(elapsed, start, dur) {
    return clamp((elapsed - start) / dur, 0, 1);
  }

  var activeCompassCanvases = [];
  var lifecycleBound = false;

  function trackCompassCanvas(canvas) {
    if (activeCompassCanvases.indexOf(canvas) === -1) {
      activeCompassCanvases.push(canvas);
    }
  }

  function untrackCompassCanvas(canvas) {
    var idx = activeCompassCanvases.indexOf(canvas);
    if (idx !== -1) {
      activeCompassCanvases.splice(idx, 1);
    }
  }

  function forEachActiveCompassControl(method) {
    activeCompassCanvases.slice().forEach(function (canvas) {
      if (canvas && canvas._brandCompassControl && typeof canvas._brandCompassControl[method] === 'function') {
        canvas._brandCompassControl[method]();
      }
    });
  }

  function isAppPaused() {
    return !!(window && window.__RA_APP_PAUSED) || !!(document && document.hidden);
  }

  function bindLifecycleControls() {
    if (lifecycleBound || typeof window === 'undefined') { return; }
    lifecycleBound = true;
    window.addEventListener('ra-app-pause', function () {
      window.__RA_APP_PAUSED = true;
      forEachActiveCompassControl('pause');
    });
    window.addEventListener('ra-app-resume', function () {
      window.__RA_APP_PAUSED = false;
      forEachActiveCompassControl('resume');
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        forEachActiveCompassControl('pause');
        return;
      }
      forEachActiveCompassControl('resume');
    });
  }

  function clampRect(rect) {
    var x1 = clamp(rect.x, 0, CW);
    var y1 = clamp(rect.y, 0, CH);
    var x2 = clamp(rect.x + rect.w, 0, CW);
    var y2 = clamp(rect.y + rect.h, 0, CH);
    return { x: x1, y: y1, w: Math.max(0, x2 - x1), h: Math.max(0, y2 - y1) };
  }

  function getNeedleDirtyRect(angle) {
    var tipX = CX + Math.cos(angle) * NEEDLE_RENDER_RADIUS;
    var tipY = CY + Math.sin(angle) * NEEDLE_RENDER_RADIUS;
    return clampRect({
      x: Math.min(CX, tipX) - NEEDLE_RENDER_PADDING,
      y: Math.min(CY, tipY) - NEEDLE_RENDER_PADDING,
      w: Math.abs(tipX - CX) + NEEDLE_RENDER_PADDING * 2,
      h: Math.abs(tipY - CY) + NEEDLE_RENDER_PADDING * 2,
    });
  }

  // Ease-out cubic
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  // Ease-out-back (slight overshoot)
  function easeOutBack(t) {
    var c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  // Shortest angular delta (radians)
  function shortestDelta(from, to) {
    var d = ((to - from) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    return d;
  }

  // Normalise input scores to 0–100.
  // Accepts:  number | { score } | { percentage } | { value }
  function normalizeScore(raw) {
    if (raw === null || raw === undefined) return 0;
    if (typeof raw === 'number') return clamp(raw, 0, 100);
    if (typeof raw === 'object') {
      var v = raw.score !== undefined ? raw.score
            : raw.percentage !== undefined ? raw.percentage
            : raw.value !== undefined ? raw.value
            : 0;
      return clamp(Number(v) || 0, 0, 100);
    }
    return 0;
  }

  // Detect whether the canvas sits on a light background.
  function detectBackground(canvas) {
    try {
      var parent = canvas.parentElement;
      while (parent) {
        var bg = window.getComputedStyle(parent).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          var m = bg.match(/\d+/g);
          if (m && m.length >= 3) {
            var r = +m[0], g = +m[1], b = +m[2];
            // Perceived brightness (ITU-R BT.601)
            return (r * 0.299 + g * 0.587 + b * 0.114) > 128;
          }
        }
        parent = parent.parentElement;
      }
    } catch (e) { /* ignore */ }
    // Fallback: check html/body data-theme
    var root = document.documentElement;
    var theme = root && root.getAttribute('data-theme');
    if (theme === 'dark') return false;
    if (theme === 'light') return true;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return false;
    }
    return true; // default light
  }

  // Per-canvas state storage (avoid WeakMap polyfill concerns)
  var _stateKey = '__brandCompassState';

  function getState(canvas) {
    return canvas[_stateKey] || null;
  }

  function setState(canvas, state) {
    canvas[_stateKey] = state;
  }

  // ── Drawing helpers ─────────────────────────────────────────────────────────

  function drawBackground(ctx, pal) {
    // Clear with transparent background so the page bg shows through
    ctx.clearRect(0, 0, CW, CH);
  }

  // Outer boundary ring (matches logo outer circle)
  function drawOuterRing(ctx, pal, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(CX, CY, R_OUTER, 0, Math.PI * 2);
    ctx.strokeStyle = pal.outerRing;
    ctx.lineWidth = 1.75;
    ctx.stroke();
    ctx.restore();
  }

  // Inner structural ring (matches logo inner teal circle)
  function drawInnerRing(ctx, pal, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha * 0.85;
    ctx.beginPath();
    ctx.arc(CX, CY, R_INNER, 0, Math.PI * 2);
    ctx.strokeStyle = pal.innerRing;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  // Subtle concentric grid rings for depth
  function drawGridRings(ctx, pal, alpha) {
    ctx.save();
    var radii = [R_DATA * 0.25, R_DATA * 0.5, R_DATA * 0.75, R_DATA];
    for (var i = 0; i < radii.length; i++) {
      ctx.beginPath();
      ctx.arc(CX, CY, radii[i], 0, Math.PI * 2);
      ctx.strokeStyle = pal.gridRing;
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = alpha * (0.4 + i * 0.15);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Hexagonal geometry (matches logo hexagon, teal subtle)
  function drawHexagon(ctx, pal, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha * 0.55;
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var a = dimAngle(i);
      var x = CX + Math.cos(a) * R_INNER;
      var y = CY + Math.sin(a) * R_INNER;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = pal.hexStroke;
    ctx.lineWidth = 0.75;
    ctx.stroke();
    ctx.restore();
  }

  // Axis lines from centre to each dimension (subtle spokes)
  function drawAxes(ctx, pal, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha * 0.18;
    ctx.strokeStyle = pal.cardinalTick;
    ctx.lineWidth = 0.6;
    for (var i = 0; i < 6; i++) {
      var a = dimAngle(i);
      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.lineTo(CX + Math.cos(a) * R_OUTER, CY + Math.sin(a) * R_OUTER);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Cardinal tick marks N/E/S/W (logo cardinal markers — inside the outer ring)
  function drawCardinalTicks(ctx, pal, alpha) {
    ctx.save();
    ctx.strokeStyle = pal.cardinalTick;
    ctx.lineCap = 'round';
    var cardAngles = [0, Math.PI / 2, Math.PI, -Math.PI / 2]; // E, S, W, N
    for (var i = 0; i < 4; i++) {
      var a = cardAngles[i];
      // Ticks start just inside the outer ring boundary and point inward
      var outerR = R_OUTER - 2;
      var innerR = R_OUTER - 18;
      var x1 = CX + Math.cos(a) * outerR;
      var y1 = CY + Math.sin(a) * outerR;
      var x2 = CX + Math.cos(a) * innerR;
      var y2 = CY + Math.sin(a) * innerR;
      ctx.globalAlpha = alpha * 0.70;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    // Ordinal dots (NE / SE / SW / NW — logo ordinal markers, inside the outer ring)
    var ordAngles = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];
    for (var j = 0; j < 4; j++) {
      var oa = ordAngles[j];
      var ox = CX + Math.cos(oa) * (R_OUTER - 8);
      var oy = CY + Math.sin(oa) * (R_OUTER - 8);
      ctx.globalAlpha = alpha * 0.55;
      ctx.fillStyle = pal.ordinalDot;
      ctx.beginPath();
      ctx.arc(ox, oy, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Minor tick marks around the outer ring (every 30°) — pointing inward
  function drawMinorTicks(ctx, pal, alpha) {
    ctx.save();
    ctx.strokeStyle = pal.cardinalTick;
    ctx.lineCap = 'round';
    ctx.lineWidth = 1;
    for (var deg = 0; deg < 360; deg += 30) {
      var a = (deg * Math.PI) / 180 - Math.PI / 2;
      // Skip cardinal positions (already drawn as major ticks)
      if (deg % 90 === 0) continue;
      // Ticks start just inside the outer ring boundary and point inward
      var i1 = R_OUTER - 2;
      var i2 = R_OUTER - 9;
      ctx.globalAlpha = alpha * 0.40;
      ctx.beginPath();
      ctx.moveTo(CX + Math.cos(a) * i1, CY + Math.sin(a) * i1);
      ctx.lineTo(CX + Math.cos(a) * i2, CY + Math.sin(a) * i2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Semi-transparent fill alpha for each rainbow compass segment
  var SEGMENT_FILL_ALPHA = 0.18;

  // Dimension accent colors for the rainbow compass segments
  var DIM_SEGMENT_COLORS = [
    '#D97706',  // Agentic-Generative    — Amber
    '#059669',  // Relational-Connective — Green
    '#7C3AED',  // Spiritual-Reflective  — Purple
    '#DC2626',  // Emotional-Adaptive    — Red
    '#0891B2',  // Somatic-Regulative    — Cyan
    '#4F46E5',  // Cognitive-Narrative   — Indigo
  ];

  // Data polygon — maps dimension scores onto the hexagonal axes with rainbow segments
  function drawDataPolygon(ctx, values, dominantIdx, pal, alpha) {
    if (alpha <= 0) return;
    ctx.save();

    // Draw six colored triangular segments radiating from the center
    for (var i = 0; i < 6; i++) {
      var a     = dimAngle(i);
      var r     = (values[i] / 100) * R_DATA;
      var x     = CX + Math.cos(a) * r;
      var y     = CY + Math.sin(a) * r;

      var nextI = (i + 1) % 6;
      var na    = dimAngle(nextI);
      var nr    = (values[nextI] / 100) * R_DATA;
      var nx    = CX + Math.cos(na) * nr;
      var ny    = CY + Math.sin(na) * nr;

      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.lineTo(x, y);
      ctx.lineTo(nx, ny);
      ctx.closePath();

      ctx.globalAlpha = alpha * SEGMENT_FILL_ALPHA;
      ctx.fillStyle   = DIM_SEGMENT_COLORS[i];
      ctx.fill();

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = DIM_SEGMENT_COLORS[i];
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  // Dominant dimension glow band along the outer ring
  function drawDominantBand(ctx, dominantIdx, pal, alpha) {
    if (alpha <= 0) return;
    var a     = dimAngle(dominantIdx);
    var span  = 0.22; // radians (~12.5°) each side
    ctx.save();
    ctx.globalAlpha = alpha * 0.75;
    ctx.beginPath();
    ctx.arc(CX, CY, R_OUTER, a - span, a + span);
    ctx.strokeStyle = pal.polygonDomStroke;
    ctx.lineWidth   = 6;
    ctx.lineCap     = 'round';
    ctx.stroke();
    ctx.restore();
  }

  // Dimension score nodes (dots on each axis)
  function drawDimensionNodes(ctx, values, dominantIdx, pal, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    for (var i = 0; i < 6; i++) {
      var a = dimAngle(i);
      var r = (values[i] / 100) * R_DATA;
      var x = CX + Math.cos(a) * r;
      var y = CY + Math.sin(a) * r;
      var isDom = (i === dominantIdx);
      ctx.globalAlpha = alpha * (isDom ? 1.0 : 0.75);
      ctx.beginPath();
      ctx.arc(x, y, isDom ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle   = isDom ? pal.polygonDomStroke : pal.polygonStroke;
      ctx.fill();
      ctx.strokeStyle = BRAND.white;
      ctx.lineWidth   = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  // Icons + labels around the outer ring for each dimension
  function drawDimensionLabels(ctx, values, dominantIdx, pal, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    for (var i = 0; i < 6; i++) {
      var a    = dimAngle(i);
      var isDom = (i === dominantIdx);

      // Icon position
      var ix = CX + Math.cos(a) * R_ICON;
      var iy = CY + Math.sin(a) * R_ICON;

      // Label position (a bit further out)
      var lx = CX + Math.cos(a) * R_LABEL;
      var ly = CY + Math.sin(a) * R_LABEL;

      ctx.globalAlpha = alpha * (isDom ? 1.0 : 0.70);

      // Draw icon if loaded
      var img = _icons[i];
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save();
        if (!isDom) ctx.filter = 'saturate(0.5) opacity(0.8)';
        ctx.drawImage(img, ix - ICON_SZ / 2, iy - ICON_SZ / 2, ICON_SZ, ICON_SZ);
        ctx.restore();
      } else {
        // Fallback circle
        ctx.beginPath();
        ctx.arc(ix, iy, 8, 0, Math.PI * 2);
        ctx.fillStyle = isDom ? pal.polygonDomStroke : pal.polygonStroke;
        ctx.fill();
      }

      // Short label
      ctx.font        = isDom ? 'bold 9px Inter,system-ui,sans-serif'
                               : '8px Inter,system-ui,sans-serif';
      ctx.fillStyle   = isDom ? pal.dimLabelDom : pal.dimLabel;
      ctx.globalAlpha = alpha * (isDom ? 1.0 : 0.75);
      ctx.fillText(DIM_SHORT[i], lx, ly);

      // Score value
      ctx.font      = isDom ? 'bold 8px Inter,system-ui,sans-serif'
                             : '7px Inter,system-ui,sans-serif';
      ctx.fillStyle = pal.scoreText;
      ctx.globalAlpha = alpha * (isDom ? 1.0 : 0.6);
      ctx.fillText(Math.round(values[i]), lx, ly + 10);
    }
    ctx.restore();
  }

  // Diamond-shaped needle that points toward the dominant dimension.
  // Matches the logo's compass needle aesthetic (deep navy forward tip, teal back tip).
  // Elongated on both ends to echo the logo's prominent diamond design.
  function drawNeedle(ctx, angle, pal, pulse) {
    ctx.save();
    ctx.translate(CX, CY);
    // angle 0 = East; adding PI/2 rotates so that angle -PI/2 (North) points up
    ctx.rotate(angle + Math.PI / 2);

    var lenFwd  = R_OUTER * 0.78;  // forward tip — elongated to match logo
    var lenBack = R_OUTER * 0.45;  // back tip — elongated tail
    var halfW   = 9;               // half-width at widest point (wider for prominence)

    // Subtle breathing scale on the needle
    var breathScale = 1 + 0.02 * Math.sin(pulse);

    ctx.scale(breathScale, breathScale);

    // Glow / shadow — stronger for prominence
    ctx.shadowColor   = pal.needleGlow;
    ctx.shadowBlur    = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Forward half of diamond (navy — primary)
    ctx.beginPath();
    ctx.moveTo(0, -lenFwd);     // forward tip
    ctx.lineTo(halfW, 0);       // right equator
    ctx.lineTo(0, 5);           // slight notch at centre
    ctx.lineTo(-halfW, 0);      // left equator
    ctx.closePath();
    var gradFwd = ctx.createLinearGradient(0, -lenFwd, 0, 5);
    gradFwd.addColorStop(0, pal.needleFwd);
    gradFwd.addColorStop(1, pal.needleMid);
    ctx.fillStyle = gradFwd;
    ctx.fill();

    // Back half of diamond (teal — secondary)
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(0, lenBack);     // back tip
    ctx.lineTo(halfW, 0);       // right equator
    ctx.lineTo(0, 5);           // slight notch at centre
    ctx.lineTo(-halfW, 0);      // left equator
    ctx.closePath();
    var gradBack = ctx.createLinearGradient(0, 5, 0, lenBack);
    gradBack.addColorStop(0, pal.needleMid);
    gradBack.addColorStop(1, pal.needleBack);
    ctx.fillStyle = gradBack;
    ctx.globalAlpha = 0.90;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Thin outline over the whole diamond
    ctx.beginPath();
    ctx.moveTo(0, -lenFwd);
    ctx.lineTo(halfW, 0);
    ctx.lineTo(0, lenBack);
    ctx.lineTo(-halfW, 0);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.30)';
    ctx.lineWidth   = 1;
    ctx.stroke();

    ctx.restore();
  }

  // Central hub (matches logo central gradient focal point)
  function drawCenterHub(ctx, pal, hubAlpha, pulse) {
    if (hubAlpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = hubAlpha;

    // Outer glow pulse ring
    var pulseR = 14 + 3 * Math.sin(pulse);
    ctx.beginPath();
    ctx.arc(CX, CY, pulseR, 0, Math.PI * 2);
    ctx.fillStyle = pal.needleGlow;
    ctx.globalAlpha = hubAlpha * 0.25;
    ctx.fill();
    ctx.globalAlpha = hubAlpha;

    // Main hub circle with radial gradient
    var grad = ctx.createRadialGradient(CX - 2.5, CY - 2.5, 1, CX, CY, 9);
    grad.addColorStop(0, pal.hubGrad0);
    grad.addColorStop(1, pal.hubGrad1);
    ctx.beginPath();
    ctx.arc(CX, CY, 9, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.shadowColor  = pal.needleGlow;
    ctx.shadowBlur   = 8;
    ctx.fill();

    // Specular highlight (logo has a small white dot)
    ctx.shadowBlur = 0;
    ctx.globalAlpha = hubAlpha * 0.35;
    ctx.beginPath();
    ctx.arc(CX - 2.5, CY - 2.5, 2.8, 0, Math.PI * 2);
    ctx.fillStyle = BRAND.white;
    ctx.fill();

    ctx.restore();
  }

  // Dominant dimension label at the bottom
  function drawDominantLabel(ctx, dominantIdx, values, pal, alpha) {
    if (alpha <= 0) return;
    var name  = DIMENSIONS[dominantIdx];
    var score = Math.round(values[dominantIdx]);
    var ly    = CH - 22;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = 'bold 11px Inter,system-ui,sans-serif';
    ctx.fillStyle    = pal.dimLabelDom;
    ctx.fillText(name + '  ' + score, CX, ly);
    ctx.restore();
  }

  // ── Main render function ────────────────────────────────────────────────────

  /**
   * Render an animated brand compass onto a <canvas> element.
   *
   * @param {HTMLCanvasElement} canvas  — Target canvas.
   * @param {Object}            scores  — { dimensionName: value, … }
   *                                       Value may be a number 0–100, or
   *                                       an object with .score/.percentage/.value.
   */
  function renderBrandCompass(canvas, scores) {
    if (!canvas || typeof canvas.getContext !== 'function') return;

    // Cancel any previous animation loop.
    // canvas._bcRafId stores the requestAnimationFrame handle for this canvas
    // so that re-renders cleanly cancel the prior loop before starting a new one.
    if (canvas._brandCompassControl && typeof canvas._brandCompassControl.destroy === 'function') {
      canvas._brandCompassControl.destroy();
    } else if (canvas._bcRafId) {
      cancelAnimationFrame(canvas._bcRafId);
      canvas._bcRafId = null;
    }
    untrackCompassCanvas(canvas);

    // Set physical canvas size, scaled for high-DPI displays.
    var dpr = Math.min(Math.max(1, Math.round(window.devicePixelRatio || 1)), 3);
    canvas.width  = Math.round(CW * dpr);
    canvas.height = Math.round(CH * dpr);
    canvas.style.width  = CW + 'px';
    canvas.style.height = CH + 'px';

    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    if (ctx.imageSmoothingQuality !== undefined) { ctx.imageSmoothingQuality = 'high'; }

    // Detect light/dark background
    var isLight = detectBackground(canvas);
    var pal     = isLight ? LIGHT_PAL : DARK_PAL;

    // Normalise scores
    scores = scores || {};
    var values = DIMENSIONS.map(function (name) {
      var normName = name.toLowerCase().replace(/[-_ ]/g, '');
      var keys = Object.keys(scores);
      var matched = null;
      for (var ki = 0; ki < keys.length; ki++) {
        if (keys[ki].toLowerCase().replace(/[-_ ]/g, '') === normName) {
          matched = keys[ki];
          break;
        }
      }
      return matched !== null ? normalizeScore(scores[matched]) : 0;
    });

    // Find dominant dimension (highest score)
    var dominantIdx = 0;
    var maxVal = -1;
    for (var i = 0; i < values.length; i++) {
      if (values[i] > maxVal) { maxVal = values[i]; dominantIdx = i; }
    }

    // Target angle = angle of dominant dimension
    var targetAngle = dimAngle(dominantIdx);

    // Previous needle angle (persist across renders)
    var prevState   = getState(canvas);
    var startAngle  = prevState ? prevState.needleAngle : -Math.PI / 2;
    var angleDelta  = shortestDelta(startAngle, targetAngle);
    var staticCanvas = document.createElement('canvas');
    staticCanvas.width = Math.round(CW * dpr);
    staticCanvas.height = Math.round(CH * dpr);
    var staticCtx = staticCanvas.getContext('2d');
    staticCtx.scale(dpr, dpr);
    staticCtx.imageSmoothingEnabled = true;
    if (staticCtx.imageSmoothingQuality !== undefined) { staticCtx.imageSmoothingQuality = 'high'; }
    drawBackground(staticCtx, pal);
    drawGridRings(staticCtx, pal, 1);
    drawAxes(staticCtx, pal, 1);
    drawHexagon(staticCtx, pal, 1);
    drawOuterRing(staticCtx, pal, 1);
    drawInnerRing(staticCtx, pal, 1);
    drawCardinalTicks(staticCtx, pal, 1);
    drawMinorTicks(staticCtx, pal, 1);
    drawDataPolygon(staticCtx, values, dominantIdx, pal, 1);
    drawDominantBand(staticCtx, dominantIdx, pal, 1);
    drawDimensionNodes(staticCtx, values, dominantIdx, pal, 1);
    drawDimensionLabels(staticCtx, values, dominantIdx, pal, 1);
    drawDominantLabel(staticCtx, dominantIdx, values, pal, 1);
    ctx.drawImage(staticCanvas, 0, 0, CW * dpr, CH * dpr, 0, 0, CW, CH);

    var currentAngle = startAngle;
    var startTime = null;
    var lastFrameTs = 0;
    var disposed = false;

    function pauseAnimation() {
      if (canvas._bcRafId) {
        cancelAnimationFrame(canvas._bcRafId);
        canvas._bcRafId = null;
      }
    }

    function scheduleFrame() {
      if (disposed || canvas._bcRafId || isAppPaused()) { return; }
      canvas._bcRafId = requestAnimationFrame(frame);
    }

    function frame(ts) {
      canvas._bcRafId = null;
      if (disposed || isAppPaused()) { return; }
      if ((ts - lastFrameTs) < FRAME_INTERVAL_MS) {
        scheduleFrame();
        return;
      }
      lastFrameTs = ts;

      if (!startTime) startTime = ts;
      var elapsed = ts - startTime;

      var t = clamp(elapsed / NEEDLE_SWEEP_DURATION, 0, 1);
      var te = easeOutBack(t);
      if (t < 1) {
        currentAngle = startAngle + angleDelta * te;
      } else {
        var settle = elapsed - NEEDLE_SWEEP_DURATION;
        currentAngle = targetAngle +
          Math.sin(settle * NEEDLE_OSC_FREQ) *
          NEEDLE_OSC_AMP *
          Math.exp(-settle / NEEDLE_OSC_DECAY);
      }

      var hubAlpha = phaseProgress(elapsed, PHASE_HUB_START, PHASE_HUB_DUR);
      var pulse = elapsed * PULSE_FREQ;
      ctx.clearRect(0, 0, CW, CH);
      ctx.drawImage(staticCanvas, 0, 0, CW * dpr, CH * dpr, 0, 0, CW, CH);
      drawNeedle(ctx, currentAngle, pal, pulse);
      drawCenterHub(ctx, pal, hubAlpha, pulse);

      setState(canvas, { needleAngle: currentAngle });
      scheduleFrame();
    }

    canvas._brandCompassControl = {
      pause: pauseAnimation,
      resume: scheduleFrame,
      destroy: function () {
        disposed = true;
        pauseAnimation();
        untrackCompassCanvas(canvas);
      },
    };
    bindLifecycleControls();
    trackCompassCanvas(canvas);
    scheduleFrame();
  }

  // ── Expose global API ───────────────────────────────────────────────────────
  if (typeof window !== 'undefined') {
    window.renderBrandCompass = renderBrandCompass;
  }

})();
