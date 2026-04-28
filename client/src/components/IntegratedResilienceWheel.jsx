/**
 * IntegratedResilienceWheel.jsx
 * Unified SVG visualization that merges RadarChart compass styling (needle,
 * hub, cardinal ticks, outer ring) with AdultSkillsWheel skill proficiency
 * rings (Foundation / Building / Mastery) into a single cohesive display.
 *
 * CRITICAL: NO numeric scores or percentages are shown in the UI.
 * Only skill-based language is displayed (Foundation / Building / Mastery).
 *
 * Props:
 *   scores            — map of dimension name → { percentage: N } or number
 *   interactive       — enable hover/click (default true)
 *   showLabels        — show dimension labels (default true)
 *   onDimensionClick  — callback(dimensionKey) to open a modal/detail view
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSkillLevel } from '../utils/skillLevelMapping.js';
import '../styles/integratedResilienceWheel.css';

// ── Brand palette (from RadarChart) ──────────────────────────────────────────
const PAL = {
  outerRing:    'rgba(21,101,192,0.75)',
  innerRing:    'rgba(0,151,167,0.35)',
  cardinalTick: 'rgba(21,101,192,0.70)',
  ordinalDot:   'rgba(21,101,192,0.35)',
  dimLabel:     '#1565C0',
  dimLabelDom:  '#0D1B2A',
  needleFwd:    '#1565C0',
  needleMid:    '#5C8FD6',
  needleBack:   '#0097A7',
  needleGlow:   'rgba(21,101,192,0.5)',
  hubGrad0:     '#5C8FD6',
  hubGrad1:     '#1565C0',
  hubGlow:      'rgba(21,101,192,0.25)',
  hubHighlight: 'rgba(255,255,255,0.4)',
  polygonStroke:'rgba(0,151,167,0.65)',
};

// ── Dimension configuration (from AdultSkillsWheel) ───────────────────────────
// The `angle` value is the center of each segment in clock-degrees (0° = top, CW).
const DIMENSION_CONFIG = {
  'Agentic-Generative': {
    color:     '#f59e0b',
    angle:     30,
    name:      'Agentic / Generative',
    shortName: 'Agentic',
    icon:      '/icons/agentic-generative.svg',
  },
  'Somatic-Regulative': {
    color:     '#10b981',
    angle:     90,
    name:      'Somatic / Regulative',
    shortName: 'Somatic',
    icon:      '/icons/somatic-regulative.svg',
  },
  'Cognitive-Narrative': {
    color:     '#3b82f6',
    angle:     150,
    name:      'Cognitive / Narrative',
    shortName: 'Cognitive',
    icon:      '/icons/cognitive-narrative.svg',
  },
  'Relational-Connective': {
    color:     '#ec4899',
    angle:     210,
    name:      'Relational / Connective',
    shortName: 'Relational',
    icon:      '/icons/relational-connective.svg',
  },
  'Emotional-Adaptive': {
    color:     '#a855f7',
    angle:     270,
    name:      'Emotional / Adaptive',
    shortName: 'Emotional',
    icon:      '/icons/emotional-adaptive.svg',
  },
  'Spiritual-Reflective': {
    color:     '#06b6d4',
    angle:     330,
    name:      'Spiritual / Reflective',
    shortName: 'Spiritual',
    icon:      '/icons/spiritual-reflective.svg',
  },
};

const DIMENSIONS = Object.keys(DIMENSION_CONFIG);

const RING_LABELS = { 1: 'Foundation', 2: 'Building', 3: 'Mastery' };
const RING_ACHIEVED_OPACITY   = { 1: 0.40, 2: 0.60, 3: 0.85 };
const RING_UNACHIEVED_OPACITY = 0.10;

// ── SVG geometry (coordinate space from AdultSkillsWheel) ─────────────────────
const CX              = 500;   // center X in viewBox coords
const CY              = 500;   // center Y in viewBox coords
const BASE_RADIUS     = 80;    // inner hub radius
const RING_WIDTH      = 80;    // width of each concentric skill ring
const NUM_RINGS       = 3;
const OUTER_R         = BASE_RADIUS + NUM_RINGS * RING_WIDTH; // 320 — outer edge of rings
const R_ICON          = OUTER_R + 28;   // icon orbit radius
const R_LABEL         = OUTER_R + 95;   // label orbit radius
const ICON_SZ         = 24;

// ── Compass tick constants (standard cartesian radians: 0 = right, CCW) ──────
const CARD_ANGLES = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
const ORD_ANGLES  = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];
const MINOR_TICK_ANGLES = (() => {
  const res = [];
  for (let deg = 0; deg < 360; deg += 30) {
    if (deg % 90 !== 0) res.push((deg * Math.PI) / 180 - Math.PI / 2);
  }
  return res;
})();

// ── Helper: extract numeric percentage from score value ───────────────────────
function toPercent(val) {
  if (val == null) return 50;
  if (typeof val === 'object' && val.percentage != null) return val.percentage;
  return Number(val) || 50;
}

// ── Helper: SVG arc path for one wheel segment ────────────────────────────────
function generateSegmentPath(ring, angleStart, angleEnd) {
  const innerR = BASE_RADIUS + (ring - 1) * RING_WIDTH;
  const outerR = BASE_RADIUS + ring * RING_WIDTH;
  const toRad  = (deg) => (deg * Math.PI) / 180;
  // Convert clock-degrees (0=top, CW) to SVG cartesian coords
  const p2c    = (r, angle) => ({
    x: CX + r * Math.cos(toRad(angle - 90)),
    y: CY + r * Math.sin(toRad(angle - 90)),
  });

  const is = p2c(innerR, angleStart);
  const ie = p2c(innerR, angleEnd);
  const os = p2c(outerR, angleStart);
  const oe = p2c(outerR, angleEnd);
  const la = angleEnd - angleStart > 180 ? 1 : 0;

  return [
    `M ${is.x} ${is.y}`,
    `L ${os.x} ${os.y}`,
    `A ${outerR} ${outerR} 0 ${la} 1 ${oe.x} ${oe.y}`,
    `L ${ie.x} ${ie.y}`,
    `A ${innerR} ${innerR} 0 ${la} 0 ${is.x} ${is.y}`,
    'Z',
  ].join(' ');
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function IntegratedResilienceWheel({
  scores = {},
  interactive = true,
  showLabels = true,
  onDimensionClick,
}) {
  const navigate = useNavigate();
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

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const isClickable = typeof onDimensionClick === 'function';

  // ── Dominant dimension (used internally for needle angle — never displayed) ──
  let dominantIdx = 0;
  let maxScore    = -1;
  DIMENSIONS.forEach((key, i) => {
    const s = toPercent(scores[key]);
    if (s > maxScore) { maxScore = s; dominantIdx = i; }
  });

  // Needle rotation: center clock-angle of dominant segment → CW degrees from north
  const needleDeg      = dominantIdx * 60 + 30;
  // Same angle in standard cartesian radians (for the dominant arc highlight)
  const needleAngleRad = (needleDeg - 90) * Math.PI / 180;

  // Needle geometry (proportional to OUTER_R, matching RadarChart ratios)
  const lenFwd = OUTER_R * 0.78;  // 249.6
  const lenBack = OUTER_R * 0.45; // 144
  const halfW  = 14;

  // ── SVG <defs> ───────────────────────────────────────────────────────────────
  function renderDefs() {
    const gradInnerPct = `${Math.round((BASE_RADIUS / OUTER_R) * 100)}%`;
    return (
      <defs>
        {isClickable && (
          <style>{`
            .irw-label-group { cursor: pointer; }
            .irw-label-group:hover .irw-label-text { fill: #4752e8; }
            .irw-label-group:hover .irw-info-icon circle { fill: #4752e8; }
          `}</style>
        )}

        {/* Drop shadow for skill rings */}
        <filter id="irw-shadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="8" stdDeviation="14" floodColor="rgba(0,0,0,0.18)" />
        </filter>

        {/* Per-dimension radial gradient fills */}
        {Object.entries(DIMENSION_CONFIG).map(([key, cfg]) => (
          <radialGradient
            key={`irw-grad-${key}`}
            id={`irw-grad-${key}`}
            cx={CX}
            cy={CY}
            r={OUTER_R}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset={gradInnerPct} stopColor={cfg.color} stopOpacity={0.25} />
            <stop offset="100%"        stopColor={cfg.color} stopOpacity={0.95} />
          </radialGradient>
        ))}

        {/* Needle forward gradient (tip → center) */}
        <linearGradient id="irw-needleFwd" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor={PAL.needleFwd} />
          <stop offset="100%" stopColor={PAL.needleMid} />
        </linearGradient>

        {/* Needle back gradient (center → tail) */}
        <linearGradient id="irw-needleBack" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor={PAL.needleMid} />
          <stop offset="100%" stopColor={PAL.needleBack} />
        </linearGradient>

        {/* Center hub radial gradient */}
        <radialGradient id="irw-hubGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%"   stopColor={PAL.hubGrad0} />
          <stop offset="100%" stopColor={PAL.hubGrad1} />
        </radialGradient>
      </defs>
    );
  }

  // ── Skill proficiency rings ───────────────────────────────────────────────────
  function renderWheelSegments() {
    const segments  = [];
    const angleStep = 360 / DIMENSIONS.length;

    DIMENSIONS.forEach((dimKey, dimIndex) => {
      const score      = toPercent(scores[dimKey]);
      const skillInfo  = getSkillLevel(score);
      const angleStart = dimIndex * angleStep;
      const angleEnd   = (dimIndex + 1) * angleStep;
      const isHov      = hoveredDim === dimKey;

      for (let ring = 1; ring <= NUM_RINGS; ring++) {
        const achieved  = ring <= skillInfo.ring;
        const baseOp    = achieved ? RING_ACHIEVED_OPACITY[ring] : RING_UNACHIEVED_OPACITY;
        const fillOp    = isHov ? Math.min(baseOp + 0.20, 1) : baseOp;
        const strokeW   = isHov ? 2.5 : 1.5;
        const segFilter = isHov ? 'brightness(1.18) saturate(1.12)' : 'none';
        const path      = generateSegmentPath(ring, angleStart, angleEnd);

        segments.push(
          <path
            key={`${dimKey}-ring${ring}`}
            d={path}
            fill={`url(#irw-grad-${dimKey})`}
            fillOpacity={fillOp}
            stroke="#fff"
            strokeWidth={strokeW}
            className="irw-segment"
            style={{
              cursor: interactive ? 'pointer' : 'default',
              filter: segFilter,
            }}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={`${DIMENSION_CONFIG[dimKey].name}: ${skillInfo.label} ${skillInfo.icon}`}
            onMouseEnter={(e) => {
              if (!interactive) return;
              setHoveredDim(dimKey);
              const rect = containerRef.current?.getBoundingClientRect();
              if (rect) {
                setTooltip({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                  dim: dimKey,
                  skillInfo,
                });
              }
            }}
            onMouseMove={(e) => {
              if (!interactive) return;
              const rect = containerRef.current?.getBoundingClientRect();
              if (rect) {
                setTooltip((prev) =>
                  prev
                    ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top }
                    : null
                );
              }
            }}
            onMouseLeave={() => {
              setHoveredDim(null);
              setTooltip(null);
            }}
            onClick={() => {
              if (!interactive) return;
              const dimSlug   = dimKey.toLowerCase();
              const levelSlug =
                skillInfo.level === 'Mastery'   ? 'advanced'
                : skillInfo.level === 'Building' ? 'intermediate'
                : 'foundation';
              navigate(`/iatlas/curriculum/${encodeURIComponent(dimSlug)}?level=${levelSlug}`);
            }}
            onKeyDown={(e) => {
              if (!interactive) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const dimSlug   = dimKey.toLowerCase();
                const levelSlug =
                  skillInfo.level === 'Mastery'   ? 'advanced'
                  : skillInfo.level === 'Building' ? 'intermediate'
                  : 'foundation';
                navigate(`/iatlas/curriculum/${encodeURIComponent(dimSlug)}?level=${levelSlug}`);
              }
            }}
          />
        );
      }
    });

    return segments;
  }

  // ── Ring labels along the topmost spoke ──────────────────────────────────────
  function renderRingLabels() {
    return [1, 2, 3].map((ring) => {
      const radius = BASE_RADIUS + (ring - 0.5) * RING_WIDTH;
      return (
        <text
          key={`irw-ring-label-${ring}`}
          x={CX}
          y={CY - radius}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize={11}
          fontWeight="600"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={2.5}
          paintOrder="stroke"
          pointerEvents="none"
        >
          {RING_LABELS[ring]}
        </text>
      );
    });
  }

  // ── Dimension icons and labels ─────────────────────────────────────────────
  function renderDimensionLabels() {
    const LINE_H = 18;

    return DIMENSIONS.flatMap((dimKey, dimIndex) => {
      const cfg       = DIMENSION_CONFIG[dimKey];
      const score     = toPercent(scores[dimKey]);
      const skillInfo = getSkillLevel(score);
      const isDom     = dimIndex === dominantIdx;

      // Convert clock-angle to standard cartesian radians
      const rad  = (cfg.angle - 90) * Math.PI / 180;
      const cosA = Math.cos(rad);
      const sinA = Math.sin(rad);

      // Leader line endpoints
      const lx1 = CX + (OUTER_R + 10) * cosA;
      const ly1 = CY + (OUTER_R + 10) * sinA;
      const lx2 = CX + (OUTER_R + 58) * cosA;
      const ly2 = CY + (OUTER_R + 58) * sinA;

      // Icon and label positions
      const ix = CX + R_ICON  * cosA;
      const iy = CY + R_ICON  * sinA;
      const tx = CX + R_LABEL * cosA;
      const ty = CY + R_LABEL * sinA;

      const anchor      = Math.abs(cosA) < 0.15 ? 'middle' : cosA >= 0 ? 'start' : 'end';
      const displayName = isMobile ? cfg.shortName : cfg.name;
      const [line1, line2] = displayName.split(' / ');

      // Interactive hit-target geometry
      const hitW = 86;
      const hitH = 42;
      const hitX =
        anchor === 'start'  ? tx - 2 :
        anchor === 'end'    ? tx - hitW + 2 :
        tx - hitW / 2;
      const hitY = ty - hitH / 2;

      const infoIconX =
        anchor === 'start'  ? tx + 42 :
        anchor === 'end'    ? tx - 42 :
        tx;

      return [
        // Leader line
        <line
          key={`irw-leader-${dimKey}`}
          x1={lx1} y1={ly1}
          x2={lx2} y2={ly2}
          stroke={cfg.color}
          strokeWidth={1.5}
          opacity={0.55}
        />,

        // Dimension icon
        <image
          key={`irw-icon-${dimKey}`}
          href={cfg.icon}
          x={(ix - ICON_SZ / 2).toFixed(2)}
          y={(iy - ICON_SZ / 2).toFixed(2)}
          width={ICON_SZ}
          height={ICON_SZ}
          opacity={isDom ? 1.0 : 0.7}
          aria-label={`${cfg.shortName} dimension icon`}
          role="img"
        />,

        // Label group (name + skill level badge, NO score)
        <g
          key={`irw-label-group-${dimKey}`}
          opacity={isDom ? 1 : 0.88}
          className={isClickable ? 'irw-label-group' : undefined}
        >
          {isClickable && (
            <title>{`Click to learn more about ${cfg.name}`}</title>
          )}

          {/* Subtle background pill for clickable labels */}
          {isClickable && (
            <rect
              x={(hitX - 4).toFixed(2)}
              y={(hitY - 2).toFixed(2)}
              width={hitW + 8}
              height={hitH + 4}
              rx="5"
              ry="5"
              fill="rgba(21,101,192,0.06)"
              stroke="rgba(21,101,192,0.18)"
              strokeWidth="0.75"
              style={{ pointerEvents: 'none' }}
            />
          )}

          {/* Dimension name + skill level (NO score percentage) */}
          <text
            fill={isDom ? PAL.dimLabelDom : PAL.dimLabel}
            fontSize={isDom ? 9.5 : 8.5}
            fontWeight={isDom ? '700' : '600'}
            letterSpacing="0.03em"
            textAnchor={anchor}
            fontFamily="Inter,system-ui,sans-serif"
            className="irw-label-text"
            style={
              isClickable
                ? {
                    textDecoration:      'underline',
                    textDecorationColor: PAL.dimLabel,
                    textUnderlineOffset: '2px',
                  }
                : undefined
            }
          >
            <tspan x={tx} y={line2 ? ty - LINE_H * 0.5 : ty}>
              {line1}
            </tspan>
            {line2 && (
              <tspan x={tx} dy={LINE_H}>
                {line2}
              </tspan>
            )}
            {/* Skill level icon + label — skill-based language only */}
            <tspan
              x={tx}
              dy={LINE_H}
              fontSize={isDom ? 9 : 8}
              fontWeight="500"
              fill={cfg.color}
            >
              {skillInfo.icon} {skillInfo.label}
            </tspan>
          </text>

          {/* ⓘ info icon shown when onDimensionClick is provided */}
          {isClickable && (
            <g
              className="irw-info-icon"
              transform={`translate(${infoIconX.toFixed(2)},${(ty - 24).toFixed(2)})`}
              style={{ pointerEvents: 'none' }}
            >
              <circle r="5.5" fill={PAL.dimLabel} opacity="0.85" />
              <text
                fontSize="6.5"
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

          {/* Transparent hit target for click/keyboard interaction */}
          {isClickable && (
            <rect
              x={hitX.toFixed(2)}
              y={hitY.toFixed(2)}
              width={hitW}
              height={hitH}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              aria-label={`Learn more about ${cfg.name}`}
              onClick={() => onDimensionClick(dimKey)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onDimensionClick(dimKey);
                }
              }}
            />
          )}
        </g>,
      ];
    });
  }

  // ── Main render ───────────────────────────────────────────────────────────────
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
        aria-label="Integrated resilience wheel showing skill proficiency levels and developmental roadmap"
        role="img"
      >
        <title>Integrated Resilience Wheel</title>
        <desc>
          Unified circular visualization combining skill proficiency rings
          (Foundation, Building, Mastery) with a compass needle pointing to
          your dominant resilience dimension across six dimensions.
          Click any segment to explore skill-building modules.
        </desc>

        {renderDefs()}

        {/* ── Soft background halo ─────────────────────────────────────── */}
        <circle
          cx={CX}
          cy={CY}
          r={OUTER_R + 18}
          fill="rgba(248,250,252,0.45)"
          stroke="none"
        />

        {/* ── Skill proficiency rings ───────────────────────────────────── */}
        <g filter="url(#irw-shadow)">
          {renderWheelSegments()}
        </g>

        {/* ── Outer boundary ring (brand compass) ──────────────────────── */}
        <circle
          cx={CX}
          cy={CY}
          r={OUTER_R}
          fill="none"
          stroke={PAL.outerRing}
          strokeWidth="2"
        />

        {/* ── Inner teal accent ring ────────────────────────────────────── */}
        <circle
          cx={CX}
          cy={CY}
          r={BASE_RADIUS + 2}
          fill="none"
          stroke={PAL.innerRing}
          strokeWidth="1.5"
          opacity="0.85"
        />

        {/* ── Cardinal tick marks (N / S / E / W) ──────────────────────── */}
        {CARD_ANGLES.map((a, i) => {
          const x1 = CX + Math.cos(a) * (OUTER_R - 2);
          const y1 = CY + Math.sin(a) * (OUTER_R - 2);
          const x2 = CX + Math.cos(a) * (OUTER_R - 24);
          const y2 = CY + Math.sin(a) * (OUTER_R - 24);
          return (
            <line
              key={`irw-card-${i}`}
              x1={x1.toFixed(2)} y1={y1.toFixed(2)}
              x2={x2.toFixed(2)} y2={y2.toFixed(2)}
              stroke={PAL.cardinalTick}
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.70"
            />
          );
        })}

        {/* ── Ordinal dots (NE / NW / SE / SW) ─────────────────────────── */}
        {ORD_ANGLES.map((a, i) => (
          <circle
            key={`irw-ord-${i}`}
            cx={(CX + Math.cos(a) * (OUTER_R - 11)).toFixed(2)}
            cy={(CY + Math.sin(a) * (OUTER_R - 11)).toFixed(2)}
            r="3"
            fill={PAL.ordinalDot}
            opacity="0.55"
          />
        ))}

        {/* ── Minor tick marks (every 30°, excluding cardinals) ────────── */}
        {MINOR_TICK_ANGLES.map((a, i) => (
          <line
            key={`irw-minor-${i}`}
            x1={(CX + Math.cos(a) * (OUTER_R - 2)).toFixed(2)}
            y1={(CY + Math.sin(a) * (OUTER_R - 2)).toFixed(2)}
            x2={(CX + Math.cos(a) * (OUTER_R - 13)).toFixed(2)}
            y2={(CY + Math.sin(a) * (OUTER_R - 13)).toFixed(2)}
            stroke={PAL.cardinalTick}
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.40"
          />
        ))}

        {/* ── Dominant dimension arc highlight ─────────────────────────── */}
        <path
          d={(() => {
            const span = 0.22;
            const a1 = needleAngleRad - span;
            const a2 = needleAngleRad + span;
            const x1 = (CX + Math.cos(a1) * OUTER_R).toFixed(2);
            const y1 = (CY + Math.sin(a1) * OUTER_R).toFixed(2);
            const x2 = (CX + Math.cos(a2) * OUTER_R).toFixed(2);
            const y2 = (CY + Math.sin(a2) * OUTER_R).toFixed(2);
            return `M ${x1} ${y1} A ${OUTER_R} ${OUTER_R} 0 0 1 ${x2} ${y2}`;
          })()}
          fill="none"
          stroke={PAL.polygonStroke}
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.75"
        />

        {/* ── Ring level labels (Foundation / Building / Mastery) ───────── */}
        {renderRingLabels()}

        {/* ── Diamond needle ────────────────────────────────────────────── */}
        {/* Outer <g> translates to center; inner <g> handles rotation */}
        <g transform={`translate(${CX},${CY})`}>
          {/* key tied to dominantIdx so animateTransform restarts on change */}
          <g key={dominantIdx} transform={`rotate(${needleDeg.toFixed(2)})`}>
            {/* Needle glow halo */}
            <ellipse
              cx="0"
              cy={(-lenFwd * 0.5).toFixed(2)}
              rx="18"
              ry={(lenFwd * 0.55).toFixed(2)}
              fill={PAL.needleGlow}
              opacity="0.22"
            />
            {/* Forward half (tip to pivot) */}
            <polygon
              points={`0,${(-lenFwd).toFixed(2)} ${halfW},0 0,6 ${-halfW},0`}
              fill="url(#irw-needleFwd)"
              filter="drop-shadow(0 0 8px rgba(21,101,192,0.5))"
            />
            {/* Back half (pivot to tail) */}
            <polygon
              points={`0,${lenBack.toFixed(2)} ${halfW},0 0,6 ${-halfW},0`}
              fill="url(#irw-needleBack)"
              opacity="0.90"
            />
            {/* White outline for contrast */}
            <polygon
              points={`0,${(-lenFwd).toFixed(2)} ${halfW},0 0,${lenBack.toFixed(2)} ${-halfW},0`}
              fill="none"
              stroke="rgba(255,255,255,0.30)"
              strokeWidth="1"
            />
            {/* Sweep animation — skipped when prefers-reduced-motion is active */}
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

        {/* ── Center hub ────────────────────────────────────────────────── */}
        <circle cx={CX} cy={CY} r="22" fill={PAL.hubGlow} opacity="0.25" />
        <circle
          cx={CX}
          cy={CY}
          r="14"
          fill="url(#irw-hubGrad)"
          filter="drop-shadow(0 0 8px rgba(21,101,192,0.5))"
        />
        <circle
          cx={(CX - 3.5).toFixed(2)}
          cy={(CY - 3.5).toFixed(2)}
          r="4"
          fill={PAL.hubHighlight}
        />

        {/* ── Dimension icons and labels ────────────────────────────────── */}
        {showLabels && (
          <g className="irw-labels">
            {renderDimensionLabels()}
          </g>
        )}
      </svg>

      {/* ── Hover tooltip ─────────────────────────────────────────────────── */}
      {tooltip && (
        <div
          className="irw-tooltip"
          style={{ left: tooltip.x + 15, top: Math.max(tooltip.y - 60, 8) }}
          role="tooltip"
        >
          <div className="irw-tooltip-title">
            {tooltip.skillInfo.icon}{' '}
            {DIMENSION_CONFIG[tooltip.dim]?.name}
          </div>
          <div
            style={{
              fontWeight:    600,
              fontSize:      '0.8rem',
              marginBottom:  '0.3rem',
              color:         DIMENSION_CONFIG[tooltip.dim]?.color || '#fff',
            }}
          >
            {tooltip.skillInfo.label}
          </div>
          <div className="irw-tooltip-desc">
            {tooltip.skillInfo.description}
          </div>
        </div>
      )}
    </div>
  );
}
