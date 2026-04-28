/**
 * AdultSkillsWheel.jsx
 * Interactive SVG circular skills wheel for adult resilience assessment.
 * Shows skill proficiency levels (Foundation / Building / Mastery) for each
 * of the six resilience dimensions. Numeric scores are intentionally hidden
 * from the UI — only skills-based language is displayed.
 *
 * Base structure mirrors DevelopmentalWheel.jsx (kids roadmap) but adapted
 * for adult skill proficiency levels and a professional muted palette.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSkillLevel } from '../utils/skillLevelMapping.js';
import '../styles/adultSkillsWheel.css';

// ── Dimension configuration ──────────────────────────────────────────────
// Keys must match the dimension names used in ResultsPage / assessment results.
const DIMENSION_CONFIG = {
  'Agentic-Generative': {
    color: '#f59e0b',   // amber-500
    angle: 30,
    name: 'Agentic / Generative',
    shortName: 'Agentic',
  },
  'Somatic-Regulative': {
    color: '#10b981',   // emerald-500
    angle: 90,
    name: 'Somatic / Regulative',
    shortName: 'Somatic',
  },
  'Cognitive-Narrative': {
    color: '#3b82f6',   // blue-500
    angle: 150,
    name: 'Cognitive / Narrative',
    shortName: 'Cognitive',
  },
  'Relational-Connective': {
    color: '#ec4899',   // pink-500
    angle: 210,
    name: 'Relational / Connective',
    shortName: 'Relational',
  },
  'Emotional-Adaptive': {
    color: '#a855f7',   // purple-500
    angle: 270,
    name: 'Emotional / Adaptive',
    shortName: 'Emotional',
  },
  'Spiritual-Reflective': {
    color: '#06b6d4',   // cyan-500
    angle: 330,
    name: 'Spiritual / Reflective',
    shortName: 'Spiritual',
  },
};

const RING_LABELS = { 1: 'Foundation', 2: 'Building', 3: 'Mastery' };

// Base fill-opacity for each ring when it has been "achieved"
const RING_ACHIEVED_OPACITY  = { 1: 0.40, 2: 0.60, 3: 0.85 };
// Fill-opacity for rings not yet achieved (shown dimly to indicate potential)
const RING_UNACHIEVED_OPACITY = 0.10;

// ── Helper: extract percentage from score value ──────────────────────────
function toPercent(val) {
  if (val == null) return 50;
  if (typeof val === 'object' && val.percentage != null) return val.percentage;
  return Number(val) || 50;
}

// ── Component ────────────────────────────────────────────────────────────
/**
 * @param {Object}  props
 * @param {Object}  props.dimensionScores  — map of dimension name → score ({percentage:N} or raw number)
 * @param {boolean} [props.interactive]    — enable hover/click (default true)
 * @param {boolean} [props.showLabels]     — show dimension labels outside wheel (default true)
 */
export default function AdultSkillsWheel({
  dimensionScores = {},
  interactive = true,
  showLabels = true,
}) {
  const navigate = useNavigate();
  const [hoveredDim, setHoveredDim]   = useState(null);
  const [tooltip,    setTooltip]      = useState(null);
  const [isMobile,   setIsMobile]     = useState(
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

  // ── SVG geometry ───────────────────────────────────────────────────────
  const centerX        = 500;
  const centerY        = 500;
  const baseRadius     = 80;   // inner hub radius
  const ringWidth      = 80;   // width of each concentric ring
  const NUM_RINGS      = 3;
  const outerRingRadius = baseRadius + NUM_RINGS * ringWidth; // 320

  // ── Path generator for one wheel segment ──────────────────────────────
  function generateSegmentPath(ring, angleStart, angleEnd) {
    const innerR = baseRadius + (ring - 1) * ringWidth;
    const outerR = baseRadius + ring * ringWidth;
    const toRad  = (deg) => (deg * Math.PI) / 180;
    const p2c    = (r, angle) => ({
      x: centerX + r * Math.cos(toRad(angle - 90)),
      y: centerY + r * Math.sin(toRad(angle - 90)),
    });

    const is  = p2c(innerR, angleStart);
    const ie  = p2c(innerR, angleEnd);
    const os  = p2c(outerR, angleStart);
    const oe  = p2c(outerR, angleEnd);
    const la  = angleEnd - angleStart > 180 ? 1 : 0;

    return [
      `M ${is.x} ${is.y}`,
      `L ${os.x} ${os.y}`,
      `A ${outerR} ${outerR} 0 ${la} 1 ${oe.x} ${oe.y}`,
      `L ${ie.x} ${ie.y}`,
      `A ${innerR} ${innerR} 0 ${la} 0 ${is.x} ${is.y}`,
      'Z',
    ].join(' ');
  }

  // ── SVG <defs>: radial gradients + drop shadow ─────────────────────────
  function renderDefs() {
    const gradInnerOffset = `${Math.round((baseRadius / outerRingRadius) * 100)}%`;
    return (
      <defs>
        <filter id="asw-shadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="8" stdDeviation="14" floodColor="rgba(0,0,0,0.18)" />
        </filter>
        {Object.entries(DIMENSION_CONFIG).map(([key, cfg]) => (
          <radialGradient
            key={`asw-grad-${key}`}
            id={`asw-grad-${key}`}
            cx={centerX}
            cy={centerY}
            r={outerRingRadius}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset={gradInnerOffset} stopColor={cfg.color} stopOpacity={0.25} />
            <stop offset="100%"           stopColor={cfg.color} stopOpacity={0.95} />
          </radialGradient>
        ))}
      </defs>
    );
  }

  // ── Wheel segments ─────────────────────────────────────────────────────
  function renderWheelSegments() {
    const segments      = [];
    const dimensionKeys = Object.keys(DIMENSION_CONFIG);
    const angleStep     = 360 / dimensionKeys.length;

    dimensionKeys.forEach((dimKey, dimIndex) => {
      const score      = toPercent(dimensionScores[dimKey]);
      const skillInfo  = getSkillLevel(score);
      const angleStart = dimIndex * angleStep;
      const angleEnd   = (dimIndex + 1) * angleStep;
      const isHovDim   = hoveredDim === dimKey;

      for (let ring = 1; ring <= NUM_RINGS; ring++) {
        const achieved   = ring <= skillInfo.ring;
        const baseOp     = achieved ? RING_ACHIEVED_OPACITY[ring] : RING_UNACHIEVED_OPACITY;
        const fillOp     = isHovDim ? Math.min(baseOp + 0.20, 1) : baseOp;
        const strokeW    = isHovDim ? 2.5 : 1.5;
        const segFilter  = isHovDim ? 'brightness(1.18) saturate(1.12)' : 'none';
        const path       = generateSegmentPath(ring, angleStart, angleEnd);

        segments.push(
          <path
            key={`${dimKey}-ring${ring}`}
            d={path}
            fill={`url(#asw-grad-${dimKey})`}
            fillOpacity={fillOp}
            stroke="#fff"
            strokeWidth={strokeW}
            className="skills-wheel-segment"
            style={{
              cursor:     interactive ? 'pointer' : 'default',
              transition: 'fill-opacity 0.2s ease, filter 0.2s ease',
              filter:     segFilter,
            }}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={`${DIMENSION_CONFIG[dimKey].name}: ${skillInfo.label} ${skillInfo.icon}`}
            onMouseEnter={(e) => {
              if (!interactive) return;
              setHoveredDim(dimKey);
              const rect = containerRef.current?.getBoundingClientRect();
              if (rect) {
                setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, dim: dimKey, skillInfo });
              }
            }}
            onMouseMove={(e) => {
              if (!interactive) return;
              const rect = containerRef.current?.getBoundingClientRect();
              if (rect) {
                setTooltip((prev) => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
              }
            }}
            onMouseLeave={() => {
              setHoveredDim(null);
              setTooltip(null);
            }}
            onClick={() => {
              if (!interactive) return;
              const dimSlug   = dimKey.toLowerCase();
              const levelSlug = skillInfo.level === 'Mastery'
                ? 'advanced'
                : skillInfo.level === 'Building'
                  ? 'intermediate'
                  : 'foundation';
              navigate(`/iatlas/curriculum/${encodeURIComponent(dimSlug)}?level=${levelSlug}`);
            }}
            onKeyDown={(e) => {
              if (!interactive) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const dimSlug   = dimKey.toLowerCase();
                const levelSlug = skillInfo.level === 'Mastery'
                  ? 'advanced'
                  : skillInfo.level === 'Building'
                    ? 'intermediate'
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

  // ── Dimension labels with leader lines ────────────────────────────────
  function renderDimensionLabels() {
    const lineStartR         = outerRingRadius + 10;
    const lineEndR           = outerRingRadius + 65;
    const labelR             = outerRingRadius + 90;
    const LABEL_LINE_HEIGHT  = 20;
    const LABEL_LINE_OFFSET  = LABEL_LINE_HEIGHT / 2; // upward shift for first line of a two-line label

    return Object.entries(DIMENSION_CONFIG).flatMap(([key, cfg]) => {
      const score     = toPercent(dimensionScores[key]);
      const skillInfo = getSkillLevel(score);
      const svgAngle  = cfg.angle - 90;
      const rad       = (svgAngle * Math.PI) / 180;
      const cosA      = Math.cos(rad);
      const sinA      = Math.sin(rad);

      const lx1 = centerX + lineStartR * cosA;
      const ly1 = centerY + lineStartR * sinA;
      const lx2 = centerX + lineEndR   * cosA;
      const ly2 = centerY + lineEndR   * sinA;
      const tx  = centerX + labelR     * cosA;
      const ty  = centerY + labelR     * sinA;

      const textAnchor  = Math.abs(cosA) < 0.15 ? 'middle' : cosA >= 0 ? 'start' : 'end';
      const displayName = isMobile ? cfg.shortName : cfg.name;
      const [line1, line2] = displayName.split(' / ');

      return [
        <line
          key={`asw-leader-${key}`}
          x1={lx1} y1={ly1}
          x2={lx2} y2={ly2}
          stroke={cfg.color}
          strokeWidth={1.5}
          opacity={0.55}
        />,
        <text
          key={`asw-label-${key}`}
          fill={cfg.color}
          fontSize={13}
          fontWeight="700"
          letterSpacing="0.03em"
          textAnchor={textAnchor}
          dominantBaseline="middle"
        >
          <tspan x={tx} y={line2 ? ty - LABEL_LINE_OFFSET : ty}>{line1}</tspan>
          {line2 && <tspan x={tx} dy={LABEL_LINE_HEIGHT}>{line2}</tspan>}
          <tspan x={tx} dy={LABEL_LINE_HEIGHT} fontSize={12} fontWeight="400" opacity={0.85}>
            {skillInfo.icon} {skillInfo.label}
          </tspan>
        </text>,
      ];
    });
  }

  // ── Ring labels rendered along the topmost spoke ──────────────────────
  function renderRingLabels() {
    return [1, 2, 3].map((ring) => {
      const radius = baseRadius + (ring - 0.5) * ringWidth;
      return (
        <text
          key={`asw-ring-label-${ring}`}
          x={centerX}
          y={centerY - radius}
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

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div
      className="adult-skills-wheel-container"
      ref={containerRef}
      style={{ position: 'relative' }}
    >
      <svg
        viewBox="-100 0 1200 1000"
        className="skills-wheel-svg"
        style={{ maxWidth: '100%', height: 'auto' }}
        aria-label="Interactive resilience skills wheel showing your proficiency across six dimensions"
        role="img"
      >
        <title>Adult Resilience Skills Wheel</title>
        <desc>
          Interactive circular wheel showing skill proficiency (Foundation, Building, Mastery)
          across six resilience dimensions. Click any segment to explore skill-building modules.
        </desc>

        {renderDefs()}

        {/* Soft background halo */}
        <circle
          cx={centerX}
          cy={centerY}
          r={outerRingRadius + 15}
          fill="rgba(248,250,252,0.45)"
          stroke="none"
        />

        {/* Wheel segments with drop shadow */}
        <g filter="url(#asw-shadow)">
          {renderWheelSegments()}
        </g>

        {/* Center hub */}
        <circle
          cx={centerX}
          cy={centerY}
          r={baseRadius}
          fill="#f8fafc"
          stroke="#e2e8f0"
          strokeWidth={2}
        />
        <text
          x={centerX}
          y={centerY - 14}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={9}
          fontWeight="700"
          fill="#64748b"
          letterSpacing="0.08em"
          pointerEvents="none"
        >
          YOUR
        </text>
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={9}
          fontWeight="700"
          fill="#64748b"
          letterSpacing="0.08em"
          pointerEvents="none"
        >
          RESILIENCE
        </text>
        <text
          x={centerX}
          y={centerY + 14}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={9}
          fontWeight="700"
          fill="#64748b"
          letterSpacing="0.08em"
          pointerEvents="none"
        >
          LANDSCAPE
        </text>

        {/* Dimension labels + leader lines */}
        {showLabels && (
          <g className="wheel-labels">
            {renderDimensionLabels()}
          </g>
        )}

        {/* Ring labels along the top spoke */}
        {renderRingLabels()}
      </svg>

      {/* Hover tooltip (positioned absolutely inside container) */}
      {tooltip && (
        <div
          className="skills-wheel-tooltip"
          style={{ left: tooltip.x + 15, top: Math.max(tooltip.y - 60, 8) }}
          role="tooltip"
        >
          <div className="skills-wheel-tooltip-title">
            {tooltip.skillInfo.icon} {DIMENSION_CONFIG[tooltip.dim]?.name}
          </div>
          <div style={{
            fontWeight: 600,
            fontSize: '0.8rem',
            marginBottom: '0.3rem',
            color: DIMENSION_CONFIG[tooltip.dim]?.color || '#fff',
          }}>
            {tooltip.skillInfo.label}
          </div>
          <div className="skills-wheel-tooltip-desc">
            {tooltip.skillInfo.description}
          </div>
        </div>
      )}
    </div>
  );
}
