import React, { useEffect, useRef } from 'react';

/**
 * BrandCompass — Animated brand-aligned resilience compass built on HTML5 Canvas.
 * Ported from public/js/brand-compass.js to a React component.
 *
 * Design basis: Resilience Atlas brand symbol
 *   • Outer boundary ring  (#1565C0, Deep Navy)
 *   • Inner structural ring (#0097A7, Soft Teal)
 *   • Subtle hexagonal geometry (teal, 6 dimensions)
 *   • Cardinal & ordinal tick marks
 *   • Central radial-gradient focal point
 *   • Diamond-shaped needle that rotates smoothly to highest dimension
 *
 * Props:
 *   scores  — object mapping dimension name → { percentage: number } or number
 *   darkMode — boolean, force dark palette (auto-detects if omitted)
 */

// ── Brand palette ────────────────────────────────────────────────────────────
const BRAND = {
  white: '#FFFFFF',
};

const LIGHT_PAL = {
  bg:               'transparent',
  outerRing:        'rgba(21,101,192,0.75)',
  innerRing:        'rgba(0,151,167,0.35)',
  hexStroke:        'rgba(0,151,167,0.25)',
  cardinalTick:     'rgba(21,101,192,0.70)',
  ordinalDot:       'rgba(21,101,192,0.35)',
  gridRing:         'rgba(21,101,192,0.10)',
  dimLabel:         '#1565C0',
  dimLabelDom:      '#0D1B2A',
  polygonFill:      'rgba(0,151,167,0.12)',
  polygonStroke:    'rgba(0,151,167,0.65)',
  polygonDomFill:   'rgba(21,101,192,0.18)',
  polygonDomStroke: 'rgba(21,101,192,0.85)',
  needleFwd:        '#1565C0',
  needleMid:        '#5C8FD6',
  needleBack:       '#0097A7',
  needleGlow:       'rgba(21,101,192,0.5)',
  hubGrad0:         '#5C8FD6',
  hubGrad1:         '#1565C0',
  hubHighlight:     'rgba(255,255,255,0.4)',
  domBand:          'rgba(21,101,192,0.15)',
  scoreText:        '#1565C0',
};

const DARK_PAL = {
  bg:               'transparent',
  outerRing:        'rgba(92,143,214,0.80)',
  innerRing:        'rgba(77,208,225,0.35)',
  hexStroke:        'rgba(77,208,225,0.20)',
  cardinalTick:     'rgba(92,143,214,0.80)',
  ordinalDot:       'rgba(92,143,214,0.45)',
  gridRing:         'rgba(92,143,214,0.10)',
  dimLabel:         '#9BBEF5',
  dimLabelDom:      '#E8F4FF',
  polygonFill:      'rgba(77,208,225,0.10)',
  polygonStroke:    'rgba(77,208,225,0.60)',
  polygonDomFill:   'rgba(92,143,214,0.18)',
  polygonDomStroke: 'rgba(92,143,214,0.90)',
  needleFwd:        '#5C8FD6',
  needleMid:        '#4DD0E1',
  needleBack:       '#0097A7',
  needleGlow:       'rgba(77,208,225,0.55)',
  hubGrad0:         '#7EB3FF',
  hubGrad1:         '#1565C0',
  hubHighlight:     'rgba(255,255,255,0.25)',
  domBand:          'rgba(92,143,214,0.18)',
  scoreText:        '#4DD0E1',
};

// ── Dimensions ───────────────────────────────────────────────────────────────
const DIMENSIONS = [
  'Agentic-Generative',
  'Relational-Connective',
  'Spiritual-Reflective',
  'Emotional-Adaptive',
  'Somatic-Regulative',
  'Cognitive-Narrative',
];

const DIM_SHORT = [
  'Agentic',
  'Relational',
  'Spiritual',
  'Emotional',
  'Somatic',
  'Cognitive',
];

const ICON_SRCS = [
  '/icons/agentic-generative.svg',
  '/icons/relational-connective.svg',
  '/icons/spiritual-reflective.svg',
  '/icons/emotional-adaptive.svg',
  '/icons/somatic-regulative.svg',
  '/icons/cognitive-narrative.svg',
];

// Preload icons once (outside component so they persist across renders)
const _icons = ICON_SRCS.map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

// ── Layout constants ─────────────────────────────────────────────────────────
const CW = 380;
const CH = 420;
const CX = CW / 2;
const CY = CH / 2 - 10;

const R_OUTER = 130;
const R_INNER = 72;
const R_DATA  = 90;
const R_ICON  = R_OUTER + 22;
const R_LABEL = R_OUTER + 42;
const ICON_SZ = 20;

// ── Animation constants ──────────────────────────────────────────────────────
const NEEDLE_SWEEP_DURATION = 1100;
const NEEDLE_OSC_FREQ       = 0.008;
const NEEDLE_OSC_AMP        = 0.010;
const NEEDLE_OSC_DECAY      = 2000;
const PULSE_PERIOD          = 2600;
const PULSE_FREQ            = (Math.PI * 2) / PULSE_PERIOD;

const PHASE_GRID_START = 0;
const PHASE_GRID_DUR   = 300;
const PHASE_POLY_START = 220;
const PHASE_POLY_DUR   = 450;
const PHASE_HUB_START  = 550;
const PHASE_HUB_DUR    = 220;
const MAX_FPS = 30;
const FRAME_INTERVAL_MS = 1000 / MAX_FPS;
const NEEDLE_RENDER_PADDING = 24;
const NEEDLE_RENDER_RADIUS = R_OUTER + 22;

// ── Utilities ────────────────────────────────────────────────────────────────
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
function phaseProgress(elapsed, start, dur) { return clamp((elapsed - start) / dur, 0, 1); }
function easeOutBack(t) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
function shortestDelta(from, to) {
  const d = ((to - from) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
  return d;
}
function dimAngle(i) { return -Math.PI / 2 + (i * Math.PI * 2) / 6; }

function getNeedleDirtyRect(angle) {
  const tipX = CX + Math.cos(angle) * NEEDLE_RENDER_RADIUS;
  const tipY = CY + Math.sin(angle) * NEEDLE_RENDER_RADIUS;
  const x = Math.max(0, Math.min(CX, tipX) - NEEDLE_RENDER_PADDING);
  const y = Math.max(0, Math.min(CY, tipY) - NEEDLE_RENDER_PADDING);
  const w = Math.min(CW - x, Math.abs(tipX - CX) + NEEDLE_RENDER_PADDING * 2);
  const h = Math.min(CH - y, Math.abs(tipY - CY) + NEEDLE_RENDER_PADDING * 2);
  return { x, y, w: Math.max(0, w), h: Math.max(0, h) };
}

function normalizeScore(raw) {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === 'number') return clamp(raw, 0, 100);
  if (typeof raw === 'object') {
    const v = raw.score !== undefined ? raw.score
            : raw.percentage !== undefined ? raw.percentage
            : raw.value !== undefined ? raw.value
            : 0;
    return clamp(Number(v) || 0, 0, 100);
  }
  return 0;
}

// ── Drawing functions ────────────────────────────────────────────────────────
function drawGridRings(ctx, pal, alpha) {
  ctx.save();
  const radii = [R_DATA * 0.25, R_DATA * 0.5, R_DATA * 0.75, R_DATA];
  for (let i = 0; i < radii.length; i++) {
    ctx.beginPath();
    ctx.arc(CX, CY, radii[i], 0, Math.PI * 2);
    ctx.strokeStyle = pal.gridRing;
    ctx.lineWidth = 0.8;
    ctx.globalAlpha = alpha * (0.4 + i * 0.15);
    ctx.stroke();
  }
  ctx.restore();
}

function drawAxes(ctx, pal, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha * 0.18;
  ctx.strokeStyle = pal.cardinalTick;
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 6; i++) {
    const a = dimAngle(i);
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(CX + Math.cos(a) * R_OUTER, CY + Math.sin(a) * R_OUTER);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHexagon(ctx, pal, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha * 0.55;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = dimAngle(i);
    const x = CX + Math.cos(a) * R_INNER;
    const y = CY + Math.sin(a) * R_INNER;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = pal.hexStroke;
  ctx.lineWidth = 0.75;
  ctx.stroke();
  ctx.restore();
}

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

function drawCardinalTicks(ctx, pal, alpha) {
  ctx.save();
  ctx.strokeStyle = pal.cardinalTick;
  ctx.lineCap = 'round';
  const cardAngles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
  for (let i = 0; i < 4; i++) {
    const a = cardAngles[i];
    const outerR = R_OUTER - 2;
    const innerR = R_OUTER - 18;
    const x1 = CX + Math.cos(a) * outerR;
    const y1 = CY + Math.sin(a) * outerR;
    const x2 = CX + Math.cos(a) * innerR;
    const y2 = CY + Math.sin(a) * innerR;
    ctx.globalAlpha = alpha * 0.70;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  const ordAngles = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];
  for (let j = 0; j < 4; j++) {
    const oa = ordAngles[j];
    const ox = CX + Math.cos(oa) * (R_OUTER - 8);
    const oy = CY + Math.sin(oa) * (R_OUTER - 8);
    ctx.globalAlpha = alpha * 0.55;
    ctx.fillStyle = pal.ordinalDot;
    ctx.beginPath();
    ctx.arc(ox, oy, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawMinorTicks(ctx, pal, alpha) {
  ctx.save();
  ctx.strokeStyle = pal.cardinalTick;
  ctx.lineCap = 'round';
  ctx.lineWidth = 1;
  for (let deg = 0; deg < 360; deg += 30) {
    const a = (deg * Math.PI) / 180 - Math.PI / 2;
    if (deg % 90 === 0) continue;
    const i1 = R_OUTER - 2;
    const i2 = R_OUTER - 9;
    ctx.globalAlpha = alpha * 0.40;
    ctx.beginPath();
    ctx.moveTo(CX + Math.cos(a) * i1, CY + Math.sin(a) * i1);
    ctx.lineTo(CX + Math.cos(a) * i2, CY + Math.sin(a) * i2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDataPolygon(ctx, values, dominantIdx, pal, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = dimAngle(i);
    const r = (values[i] / 100) * R_DATA;
    const x = CX + Math.cos(a) * r;
    const y = CY + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle   = pal.polygonFill;
  ctx.fill();
  ctx.strokeStyle = pal.polygonStroke;
  ctx.lineWidth   = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawDominantBand(ctx, dominantIdx, pal, alpha) {
  if (alpha <= 0) return;
  const a    = dimAngle(dominantIdx);
  const span = 0.22;
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

function drawDimensionNodes(ctx, values, dominantIdx, pal, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const a   = dimAngle(i);
    const r   = (values[i] / 100) * R_DATA;
    const x   = CX + Math.cos(a) * r;
    const y   = CY + Math.sin(a) * r;
    const isDom = (i === dominantIdx);
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

function drawDimensionLabels(ctx, values, dominantIdx, pal, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 6; i++) {
    const a     = dimAngle(i);
    const isDom = (i === dominantIdx);
    const ix    = CX + Math.cos(a) * R_ICON;
    const iy    = CY + Math.sin(a) * R_ICON;
    const lx    = CX + Math.cos(a) * R_LABEL;
    const ly    = CY + Math.sin(a) * R_LABEL;
    ctx.globalAlpha = alpha * (isDom ? 1.0 : 0.70);
    const img = _icons[i];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      if (!isDom) ctx.filter = 'saturate(0.5) opacity(0.8)';
      ctx.drawImage(img, ix - ICON_SZ / 2, iy - ICON_SZ / 2, ICON_SZ, ICON_SZ);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(ix, iy, 8, 0, Math.PI * 2);
      ctx.fillStyle = isDom ? pal.polygonDomStroke : pal.polygonStroke;
      ctx.fill();
    }
    ctx.font      = isDom ? 'bold 9px Inter,system-ui,sans-serif'
                          : '8px Inter,system-ui,sans-serif';
    ctx.fillStyle = isDom ? pal.dimLabelDom : pal.dimLabel;
    ctx.globalAlpha = alpha * (isDom ? 1.0 : 0.75);
    ctx.fillText(DIM_SHORT[i], lx, ly);
    ctx.font      = isDom ? 'bold 8px Inter,system-ui,sans-serif'
                          : '7px Inter,system-ui,sans-serif';
    ctx.fillStyle = pal.scoreText;
    ctx.globalAlpha = alpha * (isDom ? 1.0 : 0.6);
    ctx.fillText(Math.round(values[i]), lx, ly + 10);
  }
  ctx.restore();
}

function drawNeedle(ctx, angle, pal, pulse) {
  ctx.save();
  ctx.translate(CX, CY);
  ctx.rotate(angle + Math.PI / 2);
  const lenFwd  = R_OUTER * 0.78;
  const lenBack = R_OUTER * 0.45;
  const halfW   = 9;
  const breathScale = 1 + 0.02 * Math.sin(pulse);
  ctx.scale(breathScale, breathScale);
  ctx.shadowColor   = pal.needleGlow;
  ctx.shadowBlur    = 20;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.beginPath();
  ctx.moveTo(0, -lenFwd);
  ctx.lineTo(halfW, 0);
  ctx.lineTo(0, 5);
  ctx.lineTo(-halfW, 0);
  ctx.closePath();
  const gradFwd = ctx.createLinearGradient(0, -lenFwd, 0, 5);
  gradFwd.addColorStop(0, pal.needleFwd);
  gradFwd.addColorStop(1, pal.needleMid);
  ctx.fillStyle = gradFwd;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(0, lenBack);
  ctx.lineTo(halfW, 0);
  ctx.lineTo(0, 5);
  ctx.lineTo(-halfW, 0);
  ctx.closePath();
  const gradBack = ctx.createLinearGradient(0, 5, 0, lenBack);
  gradBack.addColorStop(0, pal.needleMid);
  gradBack.addColorStop(1, pal.needleBack);
  ctx.fillStyle = gradBack;
  ctx.globalAlpha = 0.90;
  ctx.fill();
  ctx.globalAlpha = 1;
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

function drawCenterHub(ctx, pal, hubAlpha, pulse) {
  if (hubAlpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = hubAlpha;
  const pulseR = 14 + 3 * Math.sin(pulse);
  ctx.beginPath();
  ctx.arc(CX, CY, pulseR, 0, Math.PI * 2);
  ctx.fillStyle = pal.needleGlow;
  ctx.globalAlpha = hubAlpha * 0.25;
  ctx.fill();
  ctx.globalAlpha = hubAlpha;
  const grad = ctx.createRadialGradient(CX - 2.5, CY - 2.5, 1, CX, CY, 9);
  grad.addColorStop(0, pal.hubGrad0);
  grad.addColorStop(1, pal.hubGrad1);
  ctx.beginPath();
  ctx.arc(CX, CY, 9, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.shadowColor  = pal.needleGlow;
  ctx.shadowBlur   = 8;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = hubAlpha * 0.35;
  ctx.beginPath();
  ctx.arc(CX - 2.5, CY - 2.5, 2.8, 0, Math.PI * 2);
  ctx.fillStyle = BRAND.white;
  ctx.fill();
  ctx.restore();
}

function drawDominantLabel(ctx, dominantIdx, values, pal, alpha) {
  if (alpha <= 0) return;
  const name  = DIMENSIONS[dominantIdx];
  const score = Math.round(values[dominantIdx]);
  const ly    = CH - 22;
  ctx.save();
  ctx.globalAlpha  = alpha;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = 'bold 11px Inter,system-ui,sans-serif';
  ctx.fillStyle    = pal.dimLabelDom;
  ctx.fillText(`${name}  ${score}`, CX, ly);
  ctx.restore();
}

// Detect dark mode preference when darkMode prop is not supplied
function detectDarkMode(canvas) {
  try {
    let el = canvas && canvas.parentElement;
    while (el) {
      const bg = window.getComputedStyle(el).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        const m = bg.match(/\d+/g);
        if (m && m.length >= 3) {
          const brightness = +m[0] * 0.299 + +m[1] * 0.587 + +m[2] * 0.114;
          return brightness <= 128;
        }
      }
      el = el.parentElement;
    }
  } catch (_) { /* ignore */ }
  const root  = document.documentElement;
  const theme = root && root.getAttribute('data-theme');
  if (theme === 'dark')  return true;
  if (theme === 'light') return false;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// ── React Component ──────────────────────────────────────────────────────────
function BrandCompass({ scores, darkMode }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !scores || typeof scores !== 'object' || Array.isArray(scores)) return;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    canvas.width  = CW;
    canvas.height = CH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pal = darkMode !== undefined ? (darkMode ? DARK_PAL : LIGHT_PAL)
                                       : (detectDarkMode(canvas) ? DARK_PAL : LIGHT_PAL);

    const values = DIMENSIONS.map(name => {
      const normName = name.toLowerCase().replace(/[-_ ]/g, '');
      const keys = Object.keys(scores);
      let matched = null;
      for (let ki = 0; ki < keys.length; ki++) {
        if (keys[ki].toLowerCase().replace(/[-_ ]/g, '') === normName) {
          matched = keys[ki];
          break;
        }
      }
      return matched !== null ? normalizeScore(scores[matched]) : 0;
    });

    let dominantIdx = 0;
    let maxVal = -1;
    for (let i = 0; i < values.length; i++) {
      if (values[i] > maxVal) { maxVal = values[i]; dominantIdx = i; }
    }

    const targetAngle  = dimAngle(dominantIdx);
    const startAngle   = -Math.PI / 2;
    const angleDelta   = shortestDelta(startAngle, targetAngle);
    let   currentAngle = startAngle;
    let   startTime    = null;
    let   lastFrameTs  = 0;
    let   lastDirtyRect = null;

    const staticCanvas = document.createElement('canvas');
    staticCanvas.width = CW;
    staticCanvas.height = CH;
    const staticCtx = staticCanvas.getContext('2d');
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
    ctx.drawImage(staticCanvas, 0, 0);

    const restoreDirtyRect = (rect) => {
      if (!rect || rect.w <= 0 || rect.h <= 0) return;
      ctx.drawImage(staticCanvas, rect.x, rect.y, rect.w, rect.h, rect.x, rect.y, rect.w, rect.h);
    };

    const isPaused = () => !!window.__RA_APP_PAUSED || document.hidden;
    const cancelFrame = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    const scheduleFrame = () => {
      if (rafRef.current || isPaused()) return;
      rafRef.current = requestAnimationFrame(frame);
    };

    function frame(ts) {
      rafRef.current = null;
      if (isPaused()) return;
      if ((ts - lastFrameTs) < FRAME_INTERVAL_MS) {
        scheduleFrame();
        return;
      }
      lastFrameTs = ts;

      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;

      const t  = clamp(elapsed / NEEDLE_SWEEP_DURATION, 0, 1);
      const te = easeOutBack(t);
      if (t < 1) {
        currentAngle = startAngle + angleDelta * te;
      } else {
        const settle = elapsed - NEEDLE_SWEEP_DURATION;
        currentAngle = targetAngle +
          Math.sin(settle * NEEDLE_OSC_FREQ) *
          NEEDLE_OSC_AMP *
          Math.exp(-settle / NEEDLE_OSC_DECAY);
      }

      const gridAlpha = phaseProgress(elapsed, PHASE_GRID_START, PHASE_GRID_DUR);
      const polyAlpha = phaseProgress(elapsed, PHASE_POLY_START, PHASE_POLY_DUR);
      const hubAlpha  = phaseProgress(elapsed, PHASE_HUB_START,  PHASE_HUB_DUR);
      const pulse     = elapsed * PULSE_FREQ;

      if (gridAlpha < 1 || polyAlpha < 1) {
        ctx.drawImage(staticCanvas, 0, 0);
      }

      const nextDirtyRect = getNeedleDirtyRect(currentAngle);
      restoreDirtyRect(lastDirtyRect);
      restoreDirtyRect(nextDirtyRect);
      drawNeedle(ctx, currentAngle, pal, pulse);
      drawCenterHub(ctx, pal, hubAlpha, pulse);
      lastDirtyRect = nextDirtyRect;

      scheduleFrame();
    }
    const onPause = () => cancelFrame();
    const onResume = () => scheduleFrame();
    window.addEventListener('ra-app-pause', onPause);
    window.addEventListener('ra-app-resume', onResume);
    document.addEventListener('visibilitychange', onResume);
    scheduleFrame();

    return () => {
      window.removeEventListener('ra-app-pause', onPause);
      window.removeEventListener('ra-app-resume', onResume);
      document.removeEventListener('visibilitychange', onResume);
      cancelFrame();
    };
  }, [scores, darkMode]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Animated resilience compass showing your six dimension scores"
      role="img"
      style={{ display: 'block', margin: '0 auto', maxWidth: '100%' }}
    />
  );
}

export default BrandCompass;
