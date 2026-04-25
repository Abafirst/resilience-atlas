import React from 'react';

/**
 * RadarChart — SVG-based radar/compass chart for the 6 resilience dimensions.
 * Matches the brand compass design: navy outer ring, cardinal ticks, concentric
 * grid rings, teal hexagon polygon, dimension icons, diamond needle, center hub.
 *
 * Props:
 *   scores  — object mapping dimension name → { percentage: number } or number
 *   size    — number, chart diameter in px (default 380)
 */

// ── Brand palette ─────────────────────────────────────────────────────────────
const PAL = {
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
  nodeFill:         '#0097A7',
  nodeStroke:       '#FFFFFF',
  needleFwd:        '#1565C0',
  needleMid:        '#5C8FD6',
  needleBack:       '#0097A7',
  needleGlow:       'rgba(21,101,192,0.5)',
  hubGrad0:         '#5C8FD6',
  hubGrad1:         '#1565C0',
  hubGlow:          'rgba(21,101,192,0.25)',
  hubHighlight:     'rgba(255,255,255,0.4)',
  scoreText:        '#1565C0',
  spokeStroke:      'rgba(21,101,192,0.18)',
};

// ── Canonical dimension order and metadata ────────────────────────────────────
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

// ── Static constants (computed once, outside component) ───────────────────────
const CARD_ANGLES  = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
const ORD_ANGLES   = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];
const MINOR_TICK_ANGLES = (() => {
  const result = [];
  for (let deg = 0; deg < 360; deg += 30) {
    if (deg % 90 !== 0) result.push((deg * Math.PI) / 180 - Math.PI / 2);
  }
  return result;
})();

// ── Helpers ───────────────────────────────────────────────────────────────────
function polarToCartesian(cx, cy, r, angleRad) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function pointsStr(pts) {
  return pts.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
}

function dimAngle(i) {
  return -Math.PI / 2 + (i * Math.PI * 2) / 6;
}

function normalizeScore(raw) {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === 'number') return Math.min(100, Math.max(0, raw));
  if (typeof raw === 'object') {
    const v = raw.percentage !== undefined ? raw.percentage
            : raw.score !== undefined      ? raw.score
            : raw.value !== undefined      ? raw.value
            : 0;
    return Math.min(100, Math.max(0, Number(v) || 0));
  }
  return 0;
}

// ── Component ─────────────────────────────────────────────────────────────────
function RadarChart({ scores, size = 380 }) {
  if (!scores || typeof scores !== 'object') return null;

  // Map canonical dimension order → normalized values
  const values = DIMENSIONS.map(name => {
    const normName = name.toLowerCase().replace(/[-_ ]/g, '');
    const key = Object.keys(scores).find(
      k => k.toLowerCase().replace(/[-_ ]/g, '') === normName
    );
    return key !== undefined ? normalizeScore(scores[key]) : 0;
  });

  // Find dominant dimension
  let dominantIdx = 0;
  let maxVal = -1;
  for (let i = 0; i < values.length; i++) {
    if (values[i] > maxVal) { maxVal = values[i]; dominantIdx = i; }
  }

  // Layout
  const cx = size / 2;
  const cy = size / 2 + 5;   // slight downward offset for visual balance
  const R_OUTER = size * 0.342;   // outer boundary ring radius
  const R_INNER = size * 0.189;   // inner hexagon ring radius
  const R_DATA  = size * 0.237;   // 100% data radius
  const R_ICON  = R_OUTER + 24;   // icon orbit radius
  const R_LABEL = R_OUTER + 44;   // label orbit radius
  const ICON_SZ = 20;

  const gridRadii = [R_DATA * 0.25, R_DATA * 0.5, R_DATA * 0.75, R_DATA];

  // Data polygon points
  const dataPoints = DIMENSIONS.map((_, i) => {
    const r = (values[i] / 100) * R_DATA;
    return polarToCartesian(cx, cy, r, dimAngle(i));
  });

  // Needle angle: points at dominant dimension
  const needleAngle = dimAngle(dominantIdx);
  const needleDeg   = (needleAngle * 180) / Math.PI + 90;
  const lenFwd  = R_OUTER * 0.78;
  const lenBack = R_OUTER * 0.45;
  const halfW   = 9;

  // Cardinal and ordinal tick angles (module-level constants)
  const cardAngles = CARD_ANGLES;
  const ordAngles  = ORD_ANGLES;
  const minorTickAngles = MINOR_TICK_ANGLES;

  // SVG viewBox height is taller to accommodate labels below
  const svgW = size;
  const svgH = size + 20;

  // Respect prefers-reduced-motion
  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      aria-label="Resilience dimension radar chart"
      role="img"
      style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}
    >
      <defs>
        {/* Data polygon fill gradient */}
        <radialGradient id="rc-polyFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0097A7" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#0097A7" stopOpacity="0.06" />
        </radialGradient>

        {/* Needle forward gradient (tip → center) */}
        <linearGradient id="rc-needleFwd" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={PAL.needleFwd} />
          <stop offset="100%" stopColor={PAL.needleMid} />
        </linearGradient>

        {/* Needle back gradient (center → tail) */}
        <linearGradient id="rc-needleBack" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={PAL.needleMid} />
          <stop offset="100%" stopColor={PAL.needleBack} />
        </linearGradient>

        {/* Hub radial gradient */}
        <radialGradient id="rc-hubGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor={PAL.hubGrad0} />
          <stop offset="100%" stopColor={PAL.hubGrad1} />
        </radialGradient>
      </defs>

      {/* ── Concentric grid rings ──────────────────────────────────────────── */}
      {gridRadii.map((r, i) => (
        <circle
          key={`grid-${i}`}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={PAL.gridRing}
          strokeWidth="0.8"
          opacity={0.4 + i * 0.15}
        />
      ))}

      {/* ── Spoke lines (center → outer ring) ─────────────────────────────── */}
      {DIMENSIONS.map((_, i) => {
        const outer = polarToCartesian(cx, cy, R_OUTER, dimAngle(i));
        return (
          <line
            key={`spoke-${i}`}
            x1={cx.toFixed(2)}
            y1={cy.toFixed(2)}
            x2={outer.x.toFixed(2)}
            y2={outer.y.toFixed(2)}
            stroke={PAL.spokeStroke}
            strokeWidth="0.6"
          />
        );
      })}

      {/* ── Inner hexagon ring ────────────────────────────────────────────── */}
      <polygon
        points={pointsStr(DIMENSIONS.map((_, i) => polarToCartesian(cx, cy, R_INNER, dimAngle(i))))}
        fill="none"
        stroke={PAL.hexStroke}
        strokeWidth="0.75"
        opacity="0.55"
      />

      {/* ── Outer boundary ring ───────────────────────────────────────────── */}
      <circle
        cx={cx}
        cy={cy}
        r={R_OUTER}
        fill="none"
        stroke={PAL.outerRing}
        strokeWidth="1.75"
      />

      {/* ── Inner teal ring ───────────────────────────────────────────────── */}
      <circle
        cx={cx}
        cy={cy}
        r={R_INNER}
        fill="none"
        stroke={PAL.innerRing}
        strokeWidth="1"
        opacity="0.85"
      />

      {/* ── Cardinal tick marks (N/S/E/W) ────────────────────────────────── */}
      {cardAngles.map((a, i) => {
        const outerR = R_OUTER - 2;
        const innerR = R_OUTER - 18;
        const x1 = cx + Math.cos(a) * outerR;
        const y1 = cy + Math.sin(a) * outerR;
        const x2 = cx + Math.cos(a) * innerR;
        const y2 = cy + Math.sin(a) * innerR;
        return (
          <line
            key={`card-${i}`}
            x1={x1.toFixed(2)} y1={y1.toFixed(2)}
            x2={x2.toFixed(2)} y2={y2.toFixed(2)}
            stroke={PAL.cardinalTick}
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.70"
          />
        );
      })}

      {/* ── Ordinal dots (NE/NW/SE/SW) ────────────────────────────────────── */}
      {ordAngles.map((a, i) => {
        const ox = cx + Math.cos(a) * (R_OUTER - 8);
        const oy = cy + Math.sin(a) * (R_OUTER - 8);
        return (
          <circle
            key={`ord-${i}`}
            cx={ox.toFixed(2)}
            cy={oy.toFixed(2)}
            r="2.2"
            fill={PAL.ordinalDot}
            opacity="0.55"
          />
        );
      })}

      {/* ── Minor tick marks (every 30°, not cardinal) ───────────────────── */}
      {minorTickAngles.map((a, i) => {
        const i1 = R_OUTER - 2;
        const i2 = R_OUTER - 9;
        return (
          <line
            key={`minor-${i}`}
            x1={(cx + Math.cos(a) * i1).toFixed(2)}
            y1={(cy + Math.sin(a) * i1).toFixed(2)}
            x2={(cx + Math.cos(a) * i2).toFixed(2)}
            y2={(cy + Math.sin(a) * i2).toFixed(2)}
            stroke={PAL.cardinalTick}
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.40"
          />
        );
      })}

      {/* ── Dominant dimension band ───────────────────────────────────────── */}
      <path
        d={(() => {
          const span = 0.22;
          const a1 = needleAngle - span;
          const a2 = needleAngle + span;
          const x1 = (cx + Math.cos(a1) * R_OUTER).toFixed(2);
          const y1 = (cy + Math.sin(a1) * R_OUTER).toFixed(2);
          const x2 = (cx + Math.cos(a2) * R_OUTER).toFixed(2);
          const y2 = (cy + Math.sin(a2) * R_OUTER).toFixed(2);
          return `M ${x1} ${y1} A ${R_OUTER.toFixed(2)} ${R_OUTER.toFixed(2)} 0 0 1 ${x2} ${y2}`;
        })()}
        fill="none"
        stroke={PAL.polygonStroke}
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.75"
      />

      {/* ── Data polygon ──────────────────────────────────────────────────── */}
      <polygon
        points={pointsStr(dataPoints)}
        fill="url(#rc-polyFill)"
        stroke={PAL.polygonStroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      >
        <animate attributeName="opacity" from="0" to="1" dur="0.8s" fill="freeze" />
      </polygon>

      {/* ── Dimension nodes (dots at data points) ────────────────────────── */}
      {dataPoints.map((pt, i) => {
        const isDom = i === dominantIdx;
        return (
          <circle
            key={`node-${i}`}
            cx={pt.x.toFixed(2)}
            cy={pt.y.toFixed(2)}
            r={isDom ? 5 : 3.5}
            fill={isDom ? PAL.polygonStroke : PAL.nodeFill}
            stroke={PAL.nodeStroke}
            strokeWidth="1"
            opacity={isDom ? 1 : 0.75}
          />
        );
      })}

      {/* ── Diamond needle ────────────────────────────────────────────────── */}
      {/* Outer <g> handles the translate to chart center; inner <g> handles rotation */}
      <g transform={`translate(${cx.toFixed(2)},${cy.toFixed(2)})`}>
        <g transform={`rotate(${needleDeg.toFixed(2)})`}>
          {/* Needle glow */}
          <ellipse
            cx="0" cy={(-lenFwd * 0.5).toFixed(2)}
            rx="12" ry={(lenFwd * 0.55).toFixed(2)}
            fill={PAL.needleGlow}
            opacity="0.25"
          />
          {/* Forward half (tip to center) */}
          <polygon
            points={`0,${(-lenFwd).toFixed(2)} ${halfW},0 0,5 ${-halfW},0`}
            fill="url(#rc-needleFwd)"
            filter="drop-shadow(0 0 6px rgba(21,101,192,0.5))"
          />
          {/* Back half (center to tail) */}
          <polygon
            points={`0,${lenBack.toFixed(2)} ${halfW},0 0,5 ${-halfW},0`}
            fill="url(#rc-needleBack)"
            opacity="0.90"
          />
          {/* Outline */}
          <polygon
            points={`0,${(-lenFwd).toFixed(2)} ${halfW},0 0,${lenBack.toFixed(2)} ${-halfW},0`}
            fill="none"
            stroke="rgba(255,255,255,0.30)"
            strokeWidth="1"
          />
          {/* Needle sweep animation — skipped when prefers-reduced-motion is set */}
          {!reducedMotion && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0"
              to={needleDeg.toFixed(2)}
              dur="1.1s"
              fill="freeze"
              calcMode="spline"
              keyTimes="0;1"
              keySplines="0.68,-0.55,0.265,1.55"
              additive="replace"
            />
          )}
        </g>
      </g>

      {/* ── Center hub ────────────────────────────────────────────────────── */}
      {/* Outer glow ring */}
      <circle cx={cx} cy={cy} r="14" fill={PAL.hubGlow} opacity="0.25" />
      {/* Main hub circle */}
      <circle
        cx={cx} cy={cy} r="9"
        fill="url(#rc-hubGrad)"
        filter="drop-shadow(0 0 8px rgba(21,101,192,0.5))"
      />
      {/* Highlight spot */}
      <circle cx={(cx - 2.5).toFixed(2)} cy={(cy - 2.5).toFixed(2)} r="2.8" fill={PAL.hubHighlight} />

      {/* ── Dimension icons ───────────────────────────────────────────────── */}
      {DIMENSIONS.map((_, i) => {
        const a   = dimAngle(i);
        const pt  = polarToCartesian(cx, cy, R_ICON, a);
        const isDom = i === dominantIdx;
        return (
          <image
            key={`icon-${i}`}
            href={ICON_SRCS[i]}
            x={(pt.x - ICON_SZ / 2).toFixed(2)}
            y={(pt.y - ICON_SZ / 2).toFixed(2)}
            width={ICON_SZ}
            height={ICON_SZ}
            opacity={isDom ? 1.0 : 0.7}
            aria-label={`${DIM_SHORT[i]} dimension icon`}
            role="img"
          />
        );
      })}

      {/* ── Dimension labels + scores ─────────────────────────────────────── */}
      {DIMENSIONS.map((dim, i) => {
        const a     = dimAngle(i);
        const pt    = polarToCartesian(cx, cy, R_LABEL, a);
        const isDom = i === dominantIdx;
        const score = Math.round(values[i]);

        // Text anchor based on horizontal position
        let anchor = 'middle';
        const cosVal = Math.cos(a);
        if (cosVal > 0.3)       anchor = 'start';
        else if (cosVal < -0.3) anchor = 'end';

        return (
          <g key={`label-${i}`} opacity={isDom ? 1 : 0.75}>
            <text
              x={pt.x.toFixed(2)}
              y={(pt.y - 5).toFixed(2)}
              fontSize={isDom ? '9.5' : '8.5'}
              fontWeight={isDom ? '700' : '500'}
              fill={isDom ? PAL.dimLabelDom : PAL.dimLabel}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontFamily="Inter,system-ui,sans-serif"
            >
              {DIM_SHORT[i]}
            </text>
            <text
              x={pt.x.toFixed(2)}
              y={(pt.y + 7).toFixed(2)}
              fontSize={isDom ? '8.5' : '7.5'}
              fontWeight={isDom ? '700' : '400'}
              fill={PAL.scoreText}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontFamily="Inter,system-ui,sans-serif"
            >
              {score}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default RadarChart;
