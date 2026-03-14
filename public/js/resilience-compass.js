/* ============================================================
   resilience-compass.js — Canvas-based Resilience Compass
   for The Resilience Atlas™

   Renders an interactive canvas compass showing:
   - Six axes for the six resilience dimensions
   - A polygon representing the user's profile
   - A center equilibrium point
   - Glow effect on the dominant dimension
   - Soft gradient colors

   Attaches to: canvas#radarChart
   ============================================================ */

'use strict';

(function (global) {

  // ── Dimension metadata ──────────────────────────────────────────────────────
  // Order matches visualizations.js TYPES array for consistency

  var DIMENSIONS = [
    { key: 'Agentic-Generative',    label: ['Agentic', 'Generative'],   color: 'rgba(245, 158, 11, 0.8)',   glow: 'rgba(245, 158, 11, 0.6)'  },
    { key: 'Relational',            label: ['Relational'],              color: 'rgba(59, 130, 246, 0.8)',   glow: 'rgba(59, 130, 246, 0.6)'  },
    { key: 'Spiritual-Existential', label: ['Spiritual', 'Existential'], color: 'rgba(139, 92, 246, 0.8)', glow: 'rgba(139, 92, 246, 0.6)'  },
    { key: 'Emotional-Adaptive',    label: ['Emotional', 'Adaptive'],   color: 'rgba(239, 68, 68, 0.8)',    glow: 'rgba(239, 68, 68, 0.6)'   },
    { key: 'Somatic-Regulative',    label: ['Somatic', 'Regulative'],   color: 'rgba(16, 185, 129, 0.8)',   glow: 'rgba(16, 185, 129, 0.6)'  },
    { key: 'Cognitive-Narrative',   label: ['Cognitive', 'Narrative'],  color: 'rgba(99, 102, 241, 0.8)',   glow: 'rgba(99, 102, 241, 0.6)'  },
  ];

  // ── Rendering ───────────────────────────────────────────────────────────────

  /**
   * Render the Resilience Compass onto the given canvas element.
   *
   * @param {HTMLCanvasElement} canvas
   * @param {Object} scores - { typeName: { percentage: number } | number }
   */
  function renderCompass(canvas, scores) {
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    var size = Math.min(canvas.offsetWidth || 400, canvas.offsetHeight || 400, 480);
    canvas.width  = size;
    canvas.height = size;

    var cx = size / 2;
    var cy = size / 2;
    var maxR = size * 0.36;   // radius for 100%

    // ── Extract percentages ──────────────────────────────────────────────────
    var percentages = DIMENSIONS.map(function (dim) {
      var s = scores[dim.key];
      if (!s && s !== 0) return 0;
      return Math.min(100, Math.max(0, Math.round(typeof s === 'object' ? s.percentage : s)));
    });

    // ── Dominant index ───────────────────────────────────────────────────────
    var maxPct       = Math.max.apply(null, percentages);
    var dominantIdx  = percentages.indexOf(maxPct);

    // ── Clear ────────────────────────────────────────────────────────────────
    ctx.clearRect(0, 0, size, size);

    // ── Background ───────────────────────────────────────────────────────────
    var bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 1.5);
    bgGrad.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
    bgGrad.addColorStop(1, 'rgba(15, 23, 42, 0.75)');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, maxR * 1.55, 0, Math.PI * 2);
    ctx.fill();

    var n = DIMENSIONS.length;

    // ── Helper: axis angle (starting at top, going clockwise) ────────────────
    function axisAngle(i) {
      return (i * 2 * Math.PI / n) - Math.PI / 2;
    }

    // ── Concentric reference circles ─────────────────────────────────────────
    var rings = [0.25, 0.5, 0.75, 1.0];
    rings.forEach(function (frac) {
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * frac, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.lineWidth   = 1;
      ctx.stroke();

      if (frac < 1) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.font      = '10px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.round(frac * 100) + '%', cx + maxR * frac + 12, cy - 6);
      }
    });

    // ── Axis lines ────────────────────────────────────────────────────────────
    for (var i = 0; i < n; i++) {
      var ang = axisAngle(i);
      var xEnd = cx + maxR * Math.cos(ang);
      var yEnd = cy + maxR * Math.sin(ang);

      if (i === dominantIdx) {
        ctx.save();
        ctx.shadowBlur  = 18;
        ctx.shadowColor = DIMENSIONS[i].glow;
      }

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(xEnd, yEnd);
      ctx.strokeStyle = i === dominantIdx ? DIMENSIONS[i].color : 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth   = i === dominantIdx ? 2 : 1;
      ctx.stroke();

      if (i === dominantIdx) ctx.restore();
    }

    // ── Polygon (profile shape) ────────────────────────────────────────────────
    ctx.beginPath();
    for (var j = 0; j < n; j++) {
      var a  = axisAngle(j);
      var r  = maxR * (percentages[j] / 100);
      var px = cx + r * Math.cos(a);
      var py = cy + r * Math.sin(a);
      if (j === 0) ctx.moveTo(px, py);
      else         ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle   = 'rgba(91, 124, 255, 0.18)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(91, 124, 255, 0.75)';
    ctx.lineWidth   = 2.5;
    ctx.lineJoin    = 'round';
    ctx.stroke();

    // ── Data points ───────────────────────────────────────────────────────────
    for (var k = 0; k < n; k++) {
      var a2  = axisAngle(k);
      var r2  = maxR * (percentages[k] / 100);
      var dpx = cx + r2 * Math.cos(a2);
      var dpy = cy + r2 * Math.sin(a2);

      if (k === dominantIdx) {
        ctx.save();
        ctx.shadowBlur  = 20;
        ctx.shadowColor = DIMENSIONS[k].glow;
      }

      ctx.beginPath();
      ctx.arc(dpx, dpy, k === dominantIdx ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle   = DIMENSIONS[k].color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      if (k === dominantIdx) ctx.restore();
    }

    // ── Axis labels ────────────────────────────────────────────────────────────
    var labelR = maxR + 32;
    for (var m = 0; m < n; m++) {
      var a3  = axisAngle(m);
      var lx  = cx + labelR * Math.cos(a3);
      var ly  = cy + labelR * Math.sin(a3);
      var dim = DIMENSIONS[m];
      var lines = dim.label;

      ctx.save();
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';

      if (m === dominantIdx) {
        ctx.shadowBlur  = 14;
        ctx.shadowColor = dim.glow;
        ctx.font        = 'bold 12px Inter, system-ui, sans-serif';
        ctx.fillStyle   = dim.color;
      } else {
        ctx.font      = '11px Inter, system-ui, sans-serif';
        ctx.fillStyle = 'rgba(203, 213, 225, 0.9)';
      }

      var lineH = 14;
      var startY = ly - ((lines.length - 1) * lineH) / 2;
      lines.forEach(function (line, li) {
        ctx.fillText(line, lx, startY + li * lineH);
      });

      ctx.restore();
    }

    // ── Center equilibrium point ──────────────────────────────────────────────
    var hubGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12);
    hubGrad.addColorStop(0, 'rgba(79, 70, 229, 1)');
    hubGrad.addColorStop(1, 'rgba(79, 70, 229, 0)');
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    return dominantIdx;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  global.ResilienceCompassCanvas = {
    dimensions: DIMENSIONS,
    render: renderCompass,
  };

}(typeof window !== 'undefined' ? window : this));
