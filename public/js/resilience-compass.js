/* ============================================================
   resilience-compass.js — Clean Compass Rose
   for The Resilience Atlas™
   ============================================================ */

'use strict';

(function (global) {

  var DIMENSIONS = [
    { key: 'Relational',            color: '#3B82F6' },
    { key: 'Cognitive-Narrative',   color: '#6366F1' },
    { key: 'Somatic-Regulative',    color: '#10B981' },
    { key: 'Emotional-Adaptive',    color: '#EF4444' },
    { key: 'Spiritual-Existential', color: '#8B5CF6' },
    { key: 'Agentic-Generative',    color: '#F59E0B' },
  ];

  var N = DIMENSIONS.length;

  function axisAngle(i) {
    return (i * 2 * Math.PI / N) - Math.PI / 2;
  }

  function hexAlpha(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  function renderCompass(canvas, scores) {
    if (!canvas || !canvas.getContext) {
      if (canvas && canvas.parentNode) {
        canvas.insertAdjacentText('beforebegin', 'Compass visualization unavailable');
      }
      return;
    }

    var ctx = canvas.getContext('2d');
    var size = Math.min(canvas.offsetWidth || 420, 520);
    canvas.width  = size;
    canvas.height = size;

    var cx   = size / 2;
    var cy   = size / 2;
    var maxR = size * 0.38;

    // Extract percentages
    var percentages = DIMENSIONS.map(function (dim) {
      var s = scores[dim.key];
      if (s == null) return 0;
      var val = (typeof s === 'object') ? s.percentage : s;
      return Math.min(100, Math.max(0, Math.round(val)));
    });

    // Find dominant dimension
    var maxPct      = Math.max.apply(null, percentages);
    var dominantIdx = percentages.indexOf(maxPct);

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Light background
    var bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 1.4);
    bgGrad.addColorStop(0, '#f8fafc');
    bgGrad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, maxR * 1.45, 0, Math.PI * 2);
    ctx.fill();

    // ── Concentric circles (20% steps) — NO LABELS ────────────────────────────
    var scales = [0.2, 0.4, 0.6, 0.8, 1.0];
    scales.forEach(function (frac) {
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * frac, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(148,163,184,0.35)';
      ctx.lineWidth   = 1;
      ctx.stroke();
    });

    // ── Tick marks around outer ring ──────────────────────────────────────────
    var tickCount = 24;
    for (var t = 0; t < tickCount; t++) {
      var tickAngle  = (t * 2 * Math.PI / tickCount) - Math.PI / 2;
      var isMajor    = (t % 2 === 0);
      var tickInner  = maxR;
      var tickOuter  = maxR + (isMajor ? 10 : 6);
      ctx.beginPath();
      ctx.moveTo(cx + tickInner * Math.cos(tickAngle), cy + tickInner * Math.sin(tickAngle));
      ctx.lineTo(cx + tickOuter * Math.cos(tickAngle), cy + tickOuter * Math.sin(tickAngle));
      ctx.strokeStyle = isMajor ? 'rgba(100,116,139,0.55)' : 'rgba(148,163,184,0.4)';
      ctx.lineWidth   = isMajor ? 1.5 : 1;
      ctx.stroke();
    }

    // ── Compass directions (N, NE, SE, S, SW, NW) ────────────────────────────
    var directions = ['N', 'NE', 'SE', 'S', 'SW', 'NW'];
    var dirLabelR = maxR + 35;
    for (var d = 0; d < directions.length; d++) {
      var dirAngle = (d * Math.PI / 3) - Math.PI / 2;
      var dirX = cx + dirLabelR * Math.cos(dirAngle);
      var dirY = cy + dirLabelR * Math.sin(dirAngle);
      ctx.save();
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(51,65,85,0.8)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(directions[d], dirX, dirY);
      ctx.restore();
    }

    // ── User profile polygon with gradient hue ────────────────────────────────
    var polyGrad = ctx.createLinearGradient(cx - maxR, cy - maxR, cx + maxR, cy + maxR);
    polyGrad.addColorStop(0, '#a78bfa');  // Purple
    polyGrad.addColorStop(0.5, '#60a5fa'); // Blue
    polyGrad.addColorStop(1, '#34d399');   // Green

    ctx.beginPath();
    for (var j = 0; j < N; j++) {
      var a = axisAngle(j);
      var r = maxR * (percentages[j] / 100);
      var px = cx + r * Math.cos(a);
      var py = cy + r * Math.sin(a);
      if (j === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = polyGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(79,70,229,0.6)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // ── Dynamic needle pointing to dominant dimension ────────────────────────
    var needleAngle     = axisAngle(dominantIdx);
    var needleLength    = maxR * 0.70;
    var needleTail      = maxR * 0.18;
    var needleHalfWidth = 5;
    var domColor        = DIMENSIONS[dominantIdx].color;
    var perpAngle       = needleAngle + Math.PI / 2;

    ctx.save();
    ctx.shadowBlur  = 14;
    ctx.shadowColor = hexAlpha(domColor, 0.45);

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

    // ── Center hub ────────────────────────────────────────────────────────────
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

  global.renderCompass = renderCompass;

  global.ResilienceCompassCanvas = {
    dimensions: DIMENSIONS,
    render: renderCompass,
  };

}(typeof window !== 'undefined' ? window : this));
