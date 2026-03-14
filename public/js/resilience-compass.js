/* ============================================================
   resilience-compass.js — Native Canvas Resilience Compass
   for The Resilience Atlas™

   Single entry point: window.renderCompass(canvas, scores)
   No Chart.js dependency — pure canvas rendering only.
   ============================================================ */

'use strict';

(function (global) {

  // ── Dimension metadata — clockwise from top ─────────────────────────────────
  var DIMENSIONS = [
    { key: 'Relational',            label: ['Relational'],               color: '#3B82F6' },
    { key: 'Cognitive-Narrative',   label: ['Cognitive', 'Narrative'],   color: '#6366F1' },
    { key: 'Somatic-Regulative',    label: ['Somatic', 'Regulative'],    color: '#10B981' },
    { key: 'Emotional-Adaptive',    label: ['Emotional', 'Adaptive'],    color: '#EF4444' },
    { key: 'Spiritual-Existential', label: ['Spiritual', 'Existential'], color: '#8B5CF6' },
    { key: 'Agentic-Generative',    label: ['Agentic', 'Generative'],    color: '#F59E0B' },
  ];

  var N = DIMENSIONS.length;

  // Axis angle: index 0 → top (−90°), clockwise
  function axisAngle(i) {
    return (i * 2 * Math.PI / N) - Math.PI / 2;
  }

  // Hex color → rgba string with given opacity
  function hexAlpha(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  /**
   * Render the Resilience Compass onto a canvas element.
   *
   * @param {HTMLCanvasElement} canvas
   * @param {Object} scores  { dimensionName: { percentage: number } | number }
   */
  function renderCompass(canvas, scores) {
    if (!canvas || !canvas.getContext) {
      if (canvas && canvas.parentNode) {
        canvas.insertAdjacentText('beforebegin', 'Compass visualization unavailable');
      }
      return;
    }

    var ctx = canvas.getContext('2d');

    // Size the canvas — fixed smaller size for landing page
    var size = 280;
    canvas.width  = size;
    canvas.height = size;

    var cx   = size / 2;
    var cy   = size / 2;
    var maxR = size * 0.38;   // radius = 100%

    // ── Extract percentages ───────────────────────────────────────────────────
    var percentages = DIMENSIONS.map(function (dim) {
      var s = scores[dim.key];
      if (s == null) return 0;
      var val = (typeof s === 'object') ? s.percentage : s;
      return Math.min(100, Math.max(0, Math.round(val)));
    });

    // ── Dominant dimension ────────────────────────────────────────────────────
    var maxPct      = Math.max.apply(null, percentages);
    var dominantIdx = percentages.indexOf(maxPct);

    // ── Clear transparent background ──────────────────────────────────────────
    ctx.clearRect(0, 0, size, size);

    // ── Concentric circles (purple hue) ──────────────────────────────────────
    var scales = [0.2, 0.4, 0.6, 0.8, 1.0];
    scales.forEach(function (frac) {
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * frac, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(139,92,246,0.3)';  // Purple circles
      ctx.lineWidth   = 1;
      ctx.stroke();
      // NO percentage labels
    });

    // ── Tick marks around the outer ring ─────────────────────────────────────
    var tickCount = 24;
    for (var t = 0; t < tickCount; t++) {
      var tickAngle  = (t * 2 * Math.PI / tickCount) - Math.PI / 2;
      var isMajor    = (t % 2 === 0);  // major tick every 30°
      var tickInner  = maxR;
      var tickOuter  = maxR + (isMajor ? 10 : 6);
      ctx.beginPath();
      ctx.moveTo(cx + tickInner * Math.cos(tickAngle), cy + tickInner * Math.sin(tickAngle));
      ctx.lineTo(cx + tickOuter * Math.cos(tickAngle), cy + tickOuter * Math.sin(tickAngle));
      ctx.strokeStyle = isMajor ? 'rgba(100,116,139,0.55)' : 'rgba(148,163,184,0.4)';
      ctx.lineWidth   = isMajor ? 1.5 : 1;
      ctx.stroke();
    }

    // ── Axis lines ────────────────────────────────────────────────────────────
    for (var i = 0; i < N; i++) {
      var ang  = axisAngle(i);
      var xEnd = cx + maxR * Math.cos(ang);
      var yEnd = cy + maxR * Math.sin(ang);
      var col  = DIMENSIONS[i].color;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(xEnd, yEnd);
      ctx.strokeStyle = (i === dominantIdx) ? hexAlpha(col, 0.6) : hexAlpha(col, 0.25);
      ctx.lineWidth   = (i === dominantIdx) ? 2 : 1;
      ctx.stroke();
    }

    // ── User profile polygon (purple/blue gradient) ──────────────────────────
    ctx.beginPath();
    for (var j = 0; j < N; j++) {
      var a  = axisAngle(j);
      var r  = maxR * (percentages[j] / 100);
      var px = cx + r * Math.cos(a);
      var py = cy + r * Math.sin(a);
      if (j === 0) ctx.moveTo(px, py);
      else         ctx.lineTo(px, py);
    }
    ctx.closePath();
    
    // Purple to blue gradient fill
    var polyGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
    polyGrad.addColorStop(0, 'rgba(168,85,247,0.25)');  // Purple center
    polyGrad.addColorStop(1, 'rgba(59,130,246,0.15)');  // Blue edge
    ctx.fillStyle = polyGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(168,85,247,0.8)';  // Purple stroke
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';
    ctx.stroke();

    // ── Data points ───────────────────────────────────────────────────────────
    for (var k = 0; k < N; k++) {
      var a2  = axisAngle(k);
      var r2  = maxR * (percentages[k] / 100);
      var dpx = cx + r2 * Math.cos(a2);
      var dpy = cy + r2 * Math.sin(a2);
      var dc  = DIMENSIONS[k].color;

      ctx.save();
      if (k === dominantIdx) {
        ctx.shadowBlur  = 24;
        ctx.shadowColor = hexAlpha(dc, 0.55);
      }
      ctx.beginPath();
      ctx.arc(dpx, dpy, k === dominantIdx ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle   = dc;
      ctx.fill();
      ctx.shadowBlur  = 0;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth   = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // ── Dimension labels (outside compass) ────────────────────────────────────
    var labelR = maxR + 28;
    for (var m = 0; m < N; m++) {
      var a3    = axisAngle(m);
      var lx    = cx + labelR * Math.cos(a3);
      var ly    = cy + labelR * Math.sin(a3);
      var dim   = DIMENSIONS[m];
      var lines = dim.label;
      var isDom = (m === dominantIdx);

      ctx.save();
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      if (isDom) {
        ctx.shadowBlur  = 10;
        ctx.shadowColor = hexAlpha(dim.color, 0.5);
        ctx.font        = 'bold 13px system-ui, sans-serif';
        ctx.fillStyle   = dim.color;
      } else {
        ctx.font      = '12px system-ui, sans-serif';
        ctx.fillStyle = DIMENSIONS[m].color;
      }

      var lineH  = 15;
      var startY = ly - ((lines.length - 1) * lineH) / 2;
      lines.forEach(function (line, li) {
        ctx.fillText(line, lx, startY + li * lineH);
      });
      ctx.restore();
    }

    // ── Dial needle pointing toward the dominant dimension ────────────────────
    var needleAngle     = axisAngle(dominantIdx);
    var needleLength    = maxR * 0.70;   // tip reaches 70% of max radius
    var needleTail      = maxR * 0.18;   // counter-weight tail
    var needleHalfWidth = 5;             // half-width at the pivot
    var domColor        = DIMENSIONS[dominantIdx].color;
    var perpAngle       = needleAngle + Math.PI / 2;

    ctx.save();
    ctx.shadowBlur  = 14;
    ctx.shadowColor = hexAlpha(domColor, 0.45);

    // Pointed body (tip → base left → tail → base right)
    ctx.beginPath();
    ctx.moveTo(
      cx + needleLength * Math.cos(needleAngle),
      cy + needleLength * Math.sin(needleAngle)
    );
    ctx.lineTo(
      cx + needleHalfWidth * Math.cos(perpAngle),
      cy + needleHalfWidth * Math.sin(perpAngle)
    );
    ctx.lineTo(
      cx - needleTail * Math.cos(needleAngle),
      cy - needleTail * Math.sin(needleAngle)
    );
    ctx.lineTo(
      cx - needleHalfWidth * Math.cos(perpAngle),
      cy - needleHalfWidth * Math.sin(perpAngle)
    );
    ctx.closePath();
    ctx.fillStyle = domColor;
    ctx.fill();
    ctx.shadowBlur  = 0;
    ctx.strokeStyle = hexAlpha(domColor, 0.75);
    ctx.lineWidth   = 1;
    ctx.stroke();
    ctx.restore();

    // ── Center equilibrium point (drawn on top of needle) ────────────────────
    var hubGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 10);
    hubGrad.addColorStop(0, 'rgba(79,70,229,0.9)');
    hubGrad.addColorStop(1, 'rgba(79,70,229,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle   = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = DIMENSIONS[dominantIdx].color;
    ctx.lineWidth   = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#4f46e5';
    ctx.fill();

    return dominantIdx;
  }

  // ── Public API ──────────────────────────────────────────────────────────────
  global.renderCompass = renderCompass;

  // Legacy alias kept for backward compatibility
  global.ResilienceCompassCanvas = {
    dimensions: DIMENSIONS,
    render: renderCompass,
  };

}(typeof window !== 'undefined' ? window : this));
