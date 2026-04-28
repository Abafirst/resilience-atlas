/**
 * IntegratedResilienceWheel.jsx
 *
 * Unified resilience visualization that merges:
 *   - RadarChart  → score hexagon, diamond needle, compass styling
 *   - AdultSkillsWheel → skill proficiency rings (Foundation/Building/Mastery)
 *
 * Visual hierarchy (innermost → outermost):
 *   Center Hub → Diamond Needle → Proficiency Rings → Score Hexagon
 *   → Compass Styling → Dimension Icons & Labels
 *
 * Coordinate system: viewBox="-100 0 1200 1000", center at (500,500).
 * Sectors are centered on RadarChart spoke angles so polygon vertices
 * point to the middle of each dimension's skill ring sector.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSkillLevel } from '../utils/skillLevelMapping.js';
import '../styles/integratedResilienceWheel.css';

// ── Brand palette (from RadarChart) ──────────────────────────────────────────
const PAL = {
  outerRing:     'rgba(21,101,192,0.75)',
  innerRing:     'rgba(0,151,167,0.35)',
  hexStroke:     'rgba(0,151,167,0.25)',
  cardinalTick:  'rgba(21,101,192,0.70)',
  ordinalDot:    'rgba(21,101,192,0.35)',
  gridRing:      'rgba(21,101,192,0.10)',
  dimLabel:      '#1565C0',
  dimLabelDom:   '#0D1B2A',
  polygonFill:   'rgba(0,151,167,0.12)',
  polygonStroke: 'rgba(0,151,167,0.65)',
  nodeFill:      '#0097A7',
  nodeStroke:    '#FFFFFF',
  needleFwd:     '#1565C0',
  needleMid:     '#5C8FD6',
  needleBack:    '#0097A7',
  needleGlow:    'rgba(21,101,192,0.5)',
  hubGrad0:      '#5C8FD6',
  hubGrad1:      '#1565C0',
  hubGlow:       'rgba(21,101,192,0.25)',
  hubHighlight:  'rgba(255,255,255,0.4)',
  scoreText:     '#1565C0',
  spokeStroke:   'rgba(21,101,192,0.18)',
};

// ── Dimension metadata (canonical order from RadarChart) ──────────────────────
// Sectors are centered on these spokes, aligning polygon vertices with sector midpoints.
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

// ── Dimension color config (from AdultSkillsWheel) ────────────────────────────
const DIMENSION_COLOR = {
  'Agentic-Generative':    '#f59e0b',
  'Relational-Connective': '#ec4899',
  'Spiritual-Reflective':  '#06b6d4',
  'Emotional-Adaptive':    '#a855f7',
  'Somatic-Regulative':    '#10b981',
  'Cognitive-Narrative':   '#3b82f6',
};

const RING_LABELS = { 1: 'Foundation', 2: 'Building', 3: 'Mastery' };
const RING_ACHIEVED_OPACITY  = { 1: 0.40, 2: 0.60, 3: 0.85 };
const RING_UNACHIEVED_OPACITY = 0.10;

// ── Geometry constants ────────────────────────────────────────────────────────
const CX            = 500;
const CY            = 500;
const BASE_RADIUS   = 80;    // inner hub radius
const RING_WIDTH    = 80;    // each proficiency ring width
const NUM_RINGS     = 3;
const OUTER_RING_R  = BASE_RADIUS + NUM_RINGS * RING_WIDTH; // 320 = R_DATA
const R_OUTER       = 355;   // compass outer boundary ring (outside skill rings)
const R_INNER       = OUTER_RING_R; // inner hexagon ring = outer edge of skill rings
const R_ICON        = R_OUTER + 28; // icon orbit radius
const R_LABEL       = R_OUTER + 52; // label orbit radius
const ICON_SZ       = 22;
const GRID_RADII    = [OUTER_RING_R * 0.25, OUTER_RING_R * 0.5, OUTER_RING_R * 0.75, OUTER_RING_R];

// Needle geometry
const LEN_FWD  = R_OUTER * 0.78;
const LEN_BACK = R_OUTER * 0.45;
const HALF_W   = 9;

// Cardinal / ordinal / minor tick angles
const CARD_ANGLES  = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
const ORD_ANGLES   = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];
const MINOR_TICK_ANGLES = (() => {
  const r = [];
  for (let deg = 0; deg < 360; deg += 30) {
    if (deg % 90 !== 0) r.push((deg * Math.PI) / 180 - Math.PI / 2);
  }
  return r;
})();

// ── Helpers ───────────────────────────────────────────────────────────────────
function dimAngle(i) {
  // Same as RadarChart: -90° + i*60° (radians). 0-indexed in DIMENSIONS order.
  return -Math.PI / 2 + (i * Math.PI * 2) / 6;
}

function polarToCartesian(cx, cy, r, angleRad) {
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function pointsStr(pts) {
  return pts.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
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

/**
 * Generates an SVG arc path for one skill ring sector.
 *
 * Sectors are centered on RadarChart spokes:
 *   dimension i  → center at i*60° from north → spans (i*60-30)° to (i*60+30)°
 *
 * @param {number} ring        1=Foundation, 2=Building, 3=Mastery
 * @param {number} dimIndex    0-5 (DIMENSIONS order)
 */
function generateSectorPath(ring, dimIndex) {
  const innerR     = BASE_RADIUS + (ring - 1) * RING_WIDTH;
  const outerR     = BASE_RADIUS + ring * RING_WIDTH;
  const toRad      = (deg) => (deg * Math.PI) / 180;
  // sector centered on spoke: (i*60 - 30)° to (i*60 + 30)° (0°=north, CW)
  const angleStart = dimIndex * 60 - 30;
  const angleEnd   = dimIndex * 60 + 30;
  const p2c        = (r, angleDeg) => ({
    x: CX + r * Math.cos(toRad(angleDeg - 90)),
    y: CY + r * Math.sin(toRad(angleDeg - 90)),
  });

  const is = p2c(innerR, angleStart);
  const ie = p2c(innerR, angleEnd);
  const os = p2c(outerR, angleStart);
  const oe = p2c(outerR, angleEnd);
  const largeArcFlag = angleEnd - angleStart > 180 ? 1 : 0;

  return [
    `M ${is.x.toFixed(2)} ${is.y.toFixed(2)}`,
    `L ${os.x.toFixed(2)} ${os.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${oe.x.toFixed(2)} ${oe.y.toFixed(2)}`,
    `L ${ie.x.toFixed(2)} ${ie.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${is.x.toFixed(2)} ${is.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

// ── Helpers shared within the component scope ─────────────────────────────────

/** Maps a skill level string to the curriculum URL slug. */
function skillLevelToSlug(level) {
  if (level === 'Mastery')  return 'advanced';
  if (level === 'Building') return 'intermediate';
  return 'foundation';
}

// ── Component ─────────────────────────────────────────────────────────────────
/**
 * @param {Object}   props
 * @param {Object}   props.scores             — dimension name → { percentage } | number
 * @param {boolean}  [props.interactive]      — enable hover/click (default true)
 * @param {boolean}  [props.showLabels]       — show dimension labels (default true)
 * @param {boolean}  [props.showSkillRings]   — show proficiency rings (default true)
 * @param {boolean}  [props.showScorePolygon] — show score hexagon (default true)
 * @param {boolean}  [props.showNeedle]       — show diamond needle (default true)
 * @param {Function} [props.onDimensionClick] — called with dimension name on click
 */
export default function IntegratedResilienceWheel({
  scores        = {},
  interactive   = true,
  showLabels    = true,
  showSkillRings    = true,
  showScorePolygon  = true,
  showNeedle        = true,
  onDimensionClick,
}) {
  const navigate     = useNavigate();
  const [hoveredDim, setHoveredDim] = useState(null);
  const [tooltip,    setTooltip]    = useState(null);
  const [isMobile,   setIsMobile]   = useState(
    typeof window !== 'undefined' && window.innerWidth < 768
  );
  const containerRef = useRef(null);

  useEffect(() => {
    const mq      = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Map DIMENSIONS → normalized score values
  const values = DIMENSIONS.map(name => {
    const normName = name.toLowerCase().replace(/[-_ ]/g, '');
    const key = Object.keys(scores).find(
      k => k.toLowerCase().replace(/[-_ ]/g, '') === normName
    );
    return key !== undefined ? normalizeScore(scores[key]) : 0;
  });

  // Find dominant dimension (highest score)
  let dominantIdx = 0;
  let maxVal = -1;
  for (let i = 0; i < values.length; i++) {
    if (values[i] > maxVal) { maxVal = values[i]; dominantIdx = i; }
  }

  // Needle angle
  const needleAngle = dimAngle(dominantIdx);
  const needleDeg   = (needleAngle * 180) / Math.PI + 90;

  // Data polygon points
  const dataPoints = DIMENSIONS.map((_, i) => {
    const r = (values[i] / 100) * OUTER_RING_R;
    return polarToCartesian(CX, CY, r, dimAngle(i));
  });

  const isClickable = typeof onDimensionClick === 'function';

  /** Updates tooltip position from a mouse event (for enter/move handlers). */
  function updateTooltip(e, dim, skillInfo, score) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, dim, skillInfo, score: Math.round(score) });
    }
  }

  // ── SVG <defs> ─────────────────────────────────────────────────────────────
  function renderDefs() {
    const gradInnerOffset = `${Math.round((BASE_RADIUS / OUTER_RING_R) * 100)}%`;
    return (
      <defs>
        {/* Drop shadow for skill rings */}
        <filter id="irw-shadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="8" stdDeviation="14" floodColor="rgba(0,0,0,0.18)" />
        </filter>

        {/* Radial gradients for each dimension's rings */}
        {DIMENSIONS.map((dim) => (
          <radialGradient
            key={`irw-grad-${dim}`}
            id={`irw-grad-${dim}`}
            cx={CX}
            cy={CY}
            r={OUTER_RING_R}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset={gradInnerOffset} stopColor={DIMENSION_COLOR[dim]} stopOpacity={0.25} />
            <stop offset="100%"           stopColor={DIMENSION_COLOR[dim]} stopOpacity={0.95} />
          </radialGradient>
        ))}

        {/* Score polygon fill gradient */}
        <radialGradient id="irw-polyFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0097A7" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#0097A7" stopOpacity="0.06" />
        </radialGradient>

        {/* Needle forward gradient (tip → center) */}
        <linearGradient id="irw-needleFwd" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={PAL.needleFwd} />
          <stop offset="100%" stopColor={PAL.needleMid} />
        </linearGradient>

        {/* Needle back gradient (center → tail) */}
        <linearGradient id="irw-needleBack" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={PAL.needleMid} />
          <stop offset="100%" stopColor={PAL.needleBack} />
        </linearGradient>

        {/* Hub radial gradient */}
        <radialGradient id="irw-hubGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor={PAL.hubGrad0} />
          <stop offset="100%" stopColor={PAL.hubGrad1} />
        </radialGradient>
      </defs>
    );
  }

  // ── Skill proficiency rings ────────────────────────────────────────────────
  function renderSkillRings() {
    const segments = [];
    DIMENSIONS.forEach((dim, dimIndex) => {
      // Use the already-normalized value computed at component top level
      const score     = values[dimIndex];
      const skillInfo = getSkillLevel(score);
      const isHov     = hoveredDim === dim;

      for (let ring = 1; ring <= NUM_RINGS; ring++) {
        const achieved  = ring <= skillInfo.ring;
        const baseOp    = achieved ? RING_ACHIEVED_OPACITY[ring] : RING_UNACHIEVED_OPACITY;
        const fillOp    = isHov ? Math.min(baseOp + 0.20, 1) : baseOp;
        const strokeW   = isHov ? 2.5 : 1.5;
        const segFilter = isHov ? 'brightness(1.18) saturate(1.12)' : 'none';
        const path      = generateSectorPath(ring, dimIndex);

        const levelSlug = skillLevelToSlug(skillInfo.level);

        segments.push(
          <path
            key={`irw-seg-${dim}-r${ring}`}
            d={path}
            fill={`url(#irw-grad-${dim})`}
            fillOpacity={fillOp}
            stroke="#fff"
            strokeWidth={strokeW}
            className="irw-wheel-segment"
            style={{
              cursor:     interactive ? 'pointer' : 'default',
              transition: 'fill-opacity 0.2s ease, filter 0.2s ease',
              filter:     segFilter,
            }}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={`${dim}: ${skillInfo.label} ${skillInfo.icon}`}
            onMouseEnter={(e) => {
              if (!interactive) return;
              setHoveredDim(dim);
              updateTooltip(e, dim, skillInfo, score);
            }}
            onMouseMove={(e) => {
              if (!interactive) return;
              updateTooltip(e, dim, skillInfo, score);
            }}
            onMouseLeave={() => {
              setHoveredDim(null);
              setTooltip(null);
            }}
            onClick={() => {
              if (!interactive) return;
              const dimSlug = dim.toLowerCase();
              navigate(`/iatlas/curriculum/${encodeURIComponent(dimSlug)}?level=${levelSlug}`);
            }}
            onKeyDown={(e) => {
              if (!interactive) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const dimSlug = dim.toLowerCase();
                navigate(`/iatlas/curriculum/${encodeURIComponent(dimSlug)}?level=${levelSlug}`);
              }
            }}
          />
        );
      }
    });
    return segments;
  }

  // ── Ring level labels along the innermost (top) spoke ─────────────────────
  function renderRingLabels() {
    return [1, 2, 3].map((ring) => {
      const radius = BASE_RADIUS + (ring - 0.5) * RING_WIDTH;
      return (
        <text
          key={`irw-ring-label-${ring}`}
          data-label-type="ring-level"
          x={CX}
          y={CY - radius}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize={13}
          fontWeight="600"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={3}
          paintOrder="stroke"
          pointerEvents="none"
        >
          {RING_LABELS[ring]}
        </text>
      );
    });
  }

  // ── Compass grid rings (overlaid on skill rings as reference) ─────────────
  function renderGridRings() {
    return GRID_RADII.map((r, i) => (
      <circle
        key={`irw-grid-${i}`}
        cx={CX} cy={CY} r={r}
        fill="none"
        stroke={PAL.gridRing}
        strokeWidth="1"
        opacity={0.4 + i * 0.15}
        pointerEvents="none"
      />
    ));
  }

  // ── Spoke lines ────────────────────────────────────────────────────────────
  function renderSpokes() {
    return DIMENSIONS.map((_, i) => {
      const outer = polarToCartesian(CX, CY, R_OUTER, dimAngle(i));
      return (
        <line
          key={`irw-spoke-${i}`}
          x1={CX} y1={CY}
          x2={outer.x.toFixed(2)} y2={outer.y.toFixed(2)}
          stroke={PAL.spokeStroke}
          strokeWidth="0.8"
          pointerEvents="none"
        />
      );
    });
  }

  // ── Compass styling: rings, ticks, dominant band ───────────────────────────
  function renderCompass() {
    const needleAng = dimAngle(dominantIdx);
    return (
      <>
        {/* Inner hexagon ring (teal) at outer edge of skill rings */}
        <polygon
          points={pointsStr(DIMENSIONS.map((_, i) => polarToCartesian(CX, CY, R_INNER, dimAngle(i))))}
          fill="none"
          stroke={PAL.hexStroke}
          strokeWidth="1"
          opacity="0.55"
          pointerEvents="none"
        />

        {/* Outer boundary ring (navy) */}
        <circle
          cx={CX} cy={CY} r={R_OUTER}
          fill="none"
          stroke={PAL.outerRing}
          strokeWidth="2.5"
          pointerEvents="none"
        />

        {/* Inner teal ring */}
        <circle
          cx={CX} cy={CY} r={R_INNER}
          fill="none"
          stroke={PAL.innerRing}
          strokeWidth="1.5"
          opacity="0.85"
          pointerEvents="none"
        />

        {/* Cardinal tick marks (N/S/E/W) */}
        {CARD_ANGLES.map((a, i) => {
          const x1 = CX + Math.cos(a) * (R_OUTER - 2);
          const y1 = CY + Math.sin(a) * (R_OUTER - 2);
          const x2 = CX + Math.cos(a) * (R_OUTER - 22);
          const y2 = CY + Math.sin(a) * (R_OUTER - 22);
          return (
            <line
              key={`irw-card-${i}`}
              x1={x1.toFixed(2)} y1={y1.toFixed(2)}
              x2={x2.toFixed(2)} y2={y2.toFixed(2)}
              stroke={PAL.cardinalTick}
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.70"
              pointerEvents="none"
            />
          );
        })}

        {/* Ordinal dots (NE/NW/SE/SW) */}
        {ORD_ANGLES.map((a, i) => (
          <circle
            key={`irw-ord-${i}`}
            cx={(CX + Math.cos(a) * (R_OUTER - 10)).toFixed(2)}
            cy={(CY + Math.sin(a) * (R_OUTER - 10)).toFixed(2)}
            r="3"
            fill={PAL.ordinalDot}
            opacity="0.55"
            pointerEvents="none"
          />
        ))}

        {/* Minor tick marks (every 30°, non-cardinal) */}
        {MINOR_TICK_ANGLES.map((a, i) => (
          <line
            key={`irw-minor-${i}`}
            x1={(CX + Math.cos(a) * (R_OUTER - 2)).toFixed(2)}
            y1={(CY + Math.sin(a) * (R_OUTER - 2)).toFixed(2)}
            x2={(CX + Math.cos(a) * (R_OUTER - 12)).toFixed(2)}
            y2={(CY + Math.sin(a) * (R_OUTER - 12)).toFixed(2)}
            stroke={PAL.cardinalTick}
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.40"
            pointerEvents="none"
          />
        ))}

        {/* Dominant dimension band arc */}
        <path
          d={(() => {
            const span = 0.22;
            const a1 = needleAng - span;
            const a2 = needleAng + span;
            const x1 = (CX + Math.cos(a1) * R_OUTER).toFixed(2);
            const y1 = (CY + Math.sin(a1) * R_OUTER).toFixed(2);
            const x2 = (CX + Math.cos(a2) * R_OUTER).toFixed(2);
            const y2 = (CY + Math.sin(a2) * R_OUTER).toFixed(2);
            return `M ${x1} ${y1} A ${R_OUTER.toFixed(2)} ${R_OUTER.toFixed(2)} 0 0 1 ${x2} ${y2}`;
          })()}
          fill="none"
          stroke={PAL.polygonStroke}
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.75"
          pointerEvents="none"
        />
      </>
    );
  }

  // ── Score polygon ──────────────────────────────────────────────────────────
  function renderPolygon() {
    return (
      <>
        <polygon
          points={pointsStr(dataPoints)}
          fill="url(#irw-polyFill)"
          stroke={PAL.polygonStroke}
          strokeWidth="2"
          strokeLinejoin="round"
          pointerEvents="none"
        >
          <animate attributeName="opacity" from="0" to="1" dur="0.8s" fill="freeze" />
        </polygon>

        {/* Nodes at each data point */}
        {dataPoints.map((pt, i) => {
          const isDom = i === dominantIdx;
          return (
            <circle
              key={`irw-node-${i}`}
              cx={pt.x.toFixed(2)}
              cy={pt.y.toFixed(2)}
              r={isDom ? 7 : 5}
              fill={isDom ? PAL.polygonStroke : PAL.nodeFill}
              stroke={PAL.nodeStroke}
              strokeWidth="1.5"
              opacity={isDom ? 1 : 0.75}
              pointerEvents="none"
            />
          );
        })}
      </>
    );
  }

  // ── Diamond needle ─────────────────────────────────────────────────────────
  function renderNeedle() {
    return (
      <g transform={`translate(${CX},${CY})`}>
        <g key={dominantIdx} transform={`rotate(${needleDeg.toFixed(2)})`}>
          {/* Glow ellipse */}
          <ellipse
            cx="0" cy={(-LEN_FWD * 0.5).toFixed(2)}
            rx="16" ry={(LEN_FWD * 0.55).toFixed(2)}
            fill={PAL.needleGlow}
            opacity="0.25"
          />
          {/* Forward half */}
          <polygon
            points={`0,${(-LEN_FWD).toFixed(2)} ${HALF_W},0 0,5 ${-HALF_W},0`}
            fill="url(#irw-needleFwd)"
            filter="drop-shadow(0 0 6px rgba(21,101,192,0.5))"
          />
          {/* Back half */}
          <polygon
            points={`0,${LEN_BACK.toFixed(2)} ${HALF_W},0 0,5 ${-HALF_W},0`}
            fill="url(#irw-needleBack)"
            opacity="0.90"
          />
          {/* Outline */}
          <polygon
            points={`0,${(-LEN_FWD).toFixed(2)} ${HALF_W},0 0,${LEN_BACK.toFixed(2)} ${-HALF_W},0`}
            fill="none"
            stroke="rgba(255,255,255,0.30)"
            strokeWidth="1.5"
          />
          {/* Sweep animation */}
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
              keySplines="0.68,0,0.265,1"
              additive="replace"
            />
          )}
        </g>
      </g>
    );
  }

  // ── Center hub ─────────────────────────────────────────────────────────────
  function renderHub() {
    return (
      <>
        {/* Outer glow ring */}
        <circle cx={CX} cy={CY} r="20" fill={PAL.hubGlow} opacity="0.25" pointerEvents="none" />
        {/* Main hub */}
        <circle
          cx={CX} cy={CY} r="14"
          fill="url(#irw-hubGrad)"
          filter="drop-shadow(0 0 8px rgba(21,101,192,0.5))"
          pointerEvents="none"
        />
        {/* Highlight */}
        <circle
          cx={(CX - 3.5).toFixed(2)} cy={(CY - 3.5).toFixed(2)} r="4"
          fill={PAL.hubHighlight}
          pointerEvents="none"
        />
      </>
    );
  }

  // ── Dimension icons and labels ─────────────────────────────────────────────
  function renderLabels() {
    return DIMENSIONS.map((dim, i) => {
      const a     = dimAngle(i);
      const ptIcon  = polarToCartesian(CX, CY, R_ICON, a);
      const ptLabel = polarToCartesian(CX, CY, R_LABEL, a);
      const isDom   = i === dominantIdx;
      const score   = Math.round(values[i]);
      const skillInfo = getSkillLevel(values[i]);

      // Text anchor based on x position
      const cosVal = Math.cos(a);
      let anchor = 'middle';
      if (cosVal > 0.25)       anchor = 'start';
      else if (cosVal < -0.25) anchor = 'end';

      // Hit-target geometry
      const hitW = 90;
      const hitH = 54;
      const hitX = anchor === 'start'  ? ptLabel.x - 2
                 : anchor === 'end'    ? ptLabel.x - hitW + 2
                 : ptLabel.x - hitW / 2;
      const hitY = ptLabel.y - hitH / 2;

      const pillPad = 5;
      const pillW   = hitW + pillPad * 2;
      const pillH   = hitH + pillPad;
      const pillX   = hitX - pillPad;

      const iconX = anchor === 'start'  ? ptLabel.x + 42
                  : anchor === 'end'    ? ptLabel.x - 42
                  : ptLabel.x;

      const handleClick = () => {
        if (isClickable) {
          onDimensionClick(dim);
        } else if (interactive) {
          navigate(`/iatlas/curriculum/${encodeURIComponent(dim.toLowerCase())}?level=${skillLevelToSlug(skillInfo.level)}`);
        }
      };

      return (
        <g key={`irw-label-${i}`} opacity={isDom ? 1 : 0.82} className={(isClickable || interactive) ? 'irw-label-group' : undefined}>
          {isClickable && <title>{`Click to learn more about ${dim}`}</title>}

          {/* Dimension icon */}
          <image
            href={ICON_SRCS[i]}
            x={(ptIcon.x - ICON_SZ / 2).toFixed(2)}
            y={(ptIcon.y - ICON_SZ / 2).toFixed(2)}
            width={ICON_SZ}
            height={ICON_SZ}
            opacity={isDom ? 1.0 : 0.70}
            aria-label={`${DIM_SHORT[i]} dimension icon`}
            role="img"
          />

          {/* Background pill for clickable labels */}
          {(isClickable || interactive) && (
            <rect
              data-label-type="background-pill"
              x={(pillX).toFixed(2)}
              y={(hitY - pillPad / 2).toFixed(2)}
              width={pillW}
              height={pillH}
              rx="6" ry="6"
              fill="rgba(21,101,192,0.06)"
              stroke="rgba(21,101,192,0.18)"
              strokeWidth="1"
              style={{ pointerEvents: 'none' }}
            />
          )}

          {/* Dimension short name */}
          <text
            data-label-type="dimension-name"
            x={ptLabel.x.toFixed(2)}
            y={(ptLabel.y - 12).toFixed(2)}
            fontSize={isDom ? 15 : 13}
            fontWeight={isDom ? '700' : '600'}
            fill={isDom ? PAL.dimLabelDom : PAL.dimLabel}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontFamily="Inter,system-ui,sans-serif"
            className="irw-label-text"
            style={(isClickable || interactive) ? { textDecoration: 'underline', textDecorationColor: PAL.dimLabel, textUnderlineOffset: '2px' } : undefined}
          >
            {DIM_SHORT[i]}
          </text>

          {/* Score percentage */}
          <text
            data-label-type="score-percentage"
            x={ptLabel.x.toFixed(2)}
            y={(ptLabel.y + 3).toFixed(2)}
            fontSize={isDom ? 13 : 11}
            fontWeight={isDom ? '700' : '400'}
            fill={PAL.scoreText}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontFamily="Inter,system-ui,sans-serif"
          >
            {score}%
          </text>

          {/* Skill level row */}
          <text
            data-label-type="skill-level"
            x={ptLabel.x.toFixed(2)}
            y={(ptLabel.y + 18).toFixed(2)}
            fontSize={11}
            fontWeight="500"
            fill={DIMENSION_COLOR[dim]}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontFamily="Inter,system-ui,sans-serif"
          >
            {skillInfo.icon} {skillInfo.label}
          </text>

          {/* ⓘ icon for clickable labels */}
          {isClickable && (
            <g
              className="irw-info-icon"
              data-label-type="info-icon"
              transform={`translate(${iconX.toFixed(2)},${(ptLabel.y - 22).toFixed(2)})`}
              style={{ pointerEvents: 'none' }}
            >
              <circle r="7" fill={PAL.dimLabel} opacity="0.85" />
              <text
                fontSize="9"
                fill="#ffffff"
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="Inter,system-ui,sans-serif"
                fontWeight="700"
              >
                i
              </text>
            </g>
          )}

          {/* Transparent hit target */}
          {(isClickable || interactive) && (
            <rect
              x={hitX.toFixed(2)}
              y={hitY.toFixed(2)}
              width={hitW}
              height={hitH}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              aria-label={`${dim}: ${score}% — ${skillInfo.label}. ${isClickable ? 'Click to learn more' : 'Click to explore curriculum'}`}
              onClick={handleClick}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
            />
          )}
        </g>
      );
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="irw-container"
      ref={containerRef}
      style={{ position: 'relative' }}
    >
      <svg
        id="resilience-radar-chart"
        viewBox="-100 0 1200 1000"
        className="irw-svg"
        style={{ maxWidth: '100%', height: 'auto' }}
        role="img"
        aria-label="Integrated resilience wheel showing scores, proficiency levels, and developmental roadmap"
      >
        <title>Integrated Resilience Wheel</title>
        <desc>
          Combined visualization showing resilience dimension scores as a hexagonal polygon
          and skill proficiency levels (Foundation, Building, Mastery) as concentric rings.
          A compass needle points to the dominant dimension. Click any segment or label
          to explore skill-building resources.
        </desc>

        {renderDefs()}

        {/* Soft background halo */}
        <circle
          cx={CX} cy={CY}
          r={R_OUTER + 18}
          fill="rgba(248,250,252,0.40)"
          stroke="none"
        />

        {/* Layer 1: Skill proficiency rings (base layer) */}
        {showSkillRings && (
          <g filter="url(#irw-shadow)">
            {renderSkillRings()}
          </g>
        )}

        {/* Ring level labels */}
        {showSkillRings && renderRingLabels()}

        {/* Layer 2: Concentric grid rings (reference lines) */}
        {renderGridRings()}

        {/* Layer 2b: Spoke lines */}
        {renderSpokes()}

        {/* Layer 3: Compass styling (rings, ticks, dominant band) */}
        {renderCompass()}

        {/* Layer 4: Score hexagon polygon */}
        {showScorePolygon && renderPolygon()}

        {/* Layer 5: Diamond needle */}
        {showNeedle && renderNeedle()}

        {/* Layer 6: Center hub */}
        {renderHub()}

        {/* Layer 7: Dimension icons and labels (outermost) */}
        {showLabels && (
          <g className="irw-labels">
            {renderLabels()}
          </g>
        )}
      </svg>

      {/* Hover tooltip */}
      {tooltip && (
        <div
          className="irw-tooltip"
          style={{ left: tooltip.x + 16, top: Math.max(tooltip.y - 70, 8) }}
          role="tooltip"
        >
          <div className="irw-tooltip-title">
            {tooltip.skillInfo.icon}&nbsp;
            {tooltip.dim}
          </div>
          <div style={{
            fontWeight: 600,
            fontSize: '0.8rem',
            marginBottom: '0.25rem',
            color: DIMENSION_COLOR[tooltip.dim] || '#fff',
          }}>
            {tooltip.skillInfo.label}
          </div>
          <div className="irw-tooltip-score">
            Score: {tooltip.score}%
          </div>
          <div className="irw-tooltip-desc">
            {tooltip.skillInfo.description}
          </div>
        </div>
      )}
    </div>
  );
}
