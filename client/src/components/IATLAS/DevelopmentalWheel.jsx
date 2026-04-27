/**
 * DevelopmentalWheel.jsx
 * Interactive SVG circular evolution wheel showing how resilience skills
 * evolve across ages 5-18 across 6 dimensions.
 * Route: used by DevelopmentalRoadmapPage at /iatlas/developmental-roadmap
 */

import React, { useState, useRef, useEffect } from 'react';
import { DEVELOPMENTAL_MILESTONES, DIMENSION_CONFIG } from '../../data/iatlas/developmentalRoadmap.js';

export default function DevelopmentalWheel() {
  const [selectedSegment, setSelectedSegment] = useState(null); // { ageGroup, dimension }
  const [hoveredSegment, setHoveredSegment] = useState(null);
  // Detect mobile to use short dimension names and avoid label overlap
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );
  const svgRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Expanded viewBox (-100 0 1200 1000) gives labels ~140 SVG-units of breathing room on
  // left and right sides, eliminating the "Regulative" / "Emotional" truncation.
  const centerX = 500;
  const centerY = 500;
  const baseRadius = 80;
  const ringWidth = 70;
  const NUM_RINGS = 4; // one per age group
  const outerRingRadius = baseRadius + NUM_RINGS * ringWidth; // 360

  // Gradient appearance constants
  const GRAD_INNER_STOP_OFFSET = `${Math.round((baseRadius / outerRingRadius) * 100)}%`; // ~22%
  const GRAD_INNER_OPACITY = 0.25;
  const GRAD_OUTER_OPACITY = 0.95;

  // Per-ring fill-opacity: inner rings lighter, outer rings more vivid
  const RING_OPACITY_MIN   = 0.45;
  const RING_OPACITY_RANGE = 0.45;

  // External label geometry constants
  const LABEL_LINE_OFFSET_HALF = 10; // half of line-height for two-line labels
  const LABEL_LINE_HEIGHT      = 20; // vertical distance between label lines

  // Generate SVG path for a wheel segment
  function generateSegmentPath(ring, angleStart, angleEnd) {
    const innerRadius = baseRadius + (ring - 1) * ringWidth;
    const segOuterRadius = baseRadius + ring * ringWidth;

    const toRadians = (deg) => (deg * Math.PI) / 180;
    const polarToCartesian = (r, angle) => ({
      x: centerX + r * Math.cos(toRadians(angle - 90)),
      y: centerY + r * Math.sin(toRadians(angle - 90)),
    });

    const innerStart = polarToCartesian(innerRadius, angleStart);
    const innerEnd = polarToCartesian(innerRadius, angleEnd);
    const outerStart = polarToCartesian(segOuterRadius, angleStart);
    const outerEnd = polarToCartesian(segOuterRadius, angleEnd);

    const largeArc = angleEnd - angleStart > 180 ? 1 : 0;

    return [
      `M ${innerStart.x} ${innerStart.y}`,
      `L ${outerStart.x} ${outerStart.y}`,
      `A ${segOuterRadius} ${segOuterRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
      'Z',
    ].join(' ');
  }

  // Render SVG <defs>: radial gradients per dimension + drop shadow filter
  function renderDefs() {
    return (
      <defs>
        {/* Drop shadow filter applied to the wheel segment group */}
        <filter id="wheel-shadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="8" stdDeviation="14" floodColor="rgba(0,0,0,0.18)" />
        </filter>
        {/* Per-dimension radial gradient: lighter at wheel center, vivid at outer edge */}
        {Object.entries(DIMENSION_CONFIG).map(([key, config]) => (
          <radialGradient
            key={`grad-${key}`}
            id={`grad-${key}`}
            cx={centerX}
            cy={centerY}
            r={outerRingRadius}
            gradientUnits="userSpaceOnUse"
          >
            {/* offset ≈ baseRadius/outerRingRadius — starts at inner ring */}
            <stop offset={GRAD_INNER_STOP_OFFSET} stopColor={config.color} stopOpacity={GRAD_INNER_OPACITY} />
            <stop offset="100%" stopColor={config.color} stopOpacity={GRAD_OUTER_OPACITY} />
          </radialGradient>
        ))}
      </defs>
    );
  }

  // Render wheel segments
  function renderWheelSegments() {
    const segments = [];
    const dimensionKeys = Object.keys(DIMENSION_CONFIG);
    const angleStep = 360 / dimensionKeys.length;

    Object.entries(DEVELOPMENTAL_MILESTONES).forEach(([ageKey, ageData]) => {
      dimensionKeys.forEach((dimKey, dimIndex) => {
        const angleStart = dimIndex * angleStep;
        const angleEnd = (dimIndex + 1) * angleStep;
        const path = generateSegmentPath(ageData.ring, angleStart, angleEnd);

        const isSelected =
          selectedSegment?.ageGroup === ageKey && selectedSegment?.dimension === dimKey;
        const isHovered =
          hoveredSegment?.ageGroup === ageKey && hoveredSegment?.dimension === dimKey;

        // Inner rings lighter, outer rings more vivid
        const ringOpacity = RING_OPACITY_MIN + (ageData.ring / NUM_RINGS) * RING_OPACITY_RANGE;
        const fillOpacity = isSelected ? 1 : isHovered ? 0.97 : ringOpacity;
        const strokeWidth = isSelected ? 3 : isHovered ? 2.5 : 2;
        const segFilter = isSelected
          ? 'brightness(1.35)'
          : isHovered
          ? 'brightness(1.22) saturate(1.15)'
          : 'none';

        segments.push(
          <path
            key={`${ageKey}-${dimKey}`}
            d={path}
            fill={`url(#grad-${dimKey})`}
            fillOpacity={fillOpacity}
            stroke="#fff"
            strokeWidth={strokeWidth}
            className="wheel-segment"
            onClick={() => setSelectedSegment({ ageGroup: ageKey, dimension: dimKey })}
            onMouseEnter={() => setHoveredSegment({ ageGroup: ageKey, dimension: dimKey })}
            onMouseLeave={() => setHoveredSegment(null)}
            style={{
              cursor: 'pointer',
              transition: 'fill-opacity 0.25s ease, stroke-width 0.25s ease, filter 0.25s ease',
              filter: segFilter,
            }}
            role="button"
            tabIndex={0}
            aria-label={`${ageData.label} - ${DIMENSION_CONFIG[dimKey].name}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedSegment({ ageGroup: ageKey, dimension: dimKey });
              }
            }}
          />
        );
      });
    });

    return segments;
  }

  // Render dimension labels outside the wheel with leader lines
  function renderDimensionLabels() {
    const lineStartR = outerRingRadius + 10;
    // Leader line and label pushed further out so text clears the outer ring with room to spare
    const lineEndR   = outerRingRadius + 70;
    const labelR     = outerRingRadius + 100;

    return Object.entries(DIMENSION_CONFIG).flatMap(([key, config]) => {
      const svgAngle = config.angle - 90; // convert compass → SVG coordinate angle
      const rad  = (svgAngle * Math.PI) / 180;
      const cosA = Math.cos(rad);
      const sinA = Math.sin(rad);

      // Leader line endpoints
      const lx1 = centerX + lineStartR * cosA;
      const ly1 = centerY + lineStartR * sinA;
      const lx2 = centerX + lineEndR   * cosA;
      const ly2 = centerY + lineEndR   * sinA;

      // Label anchor position
      const tx = centerX + labelR * cosA;
      const ty = centerY + labelR * sinA;

      // Text-anchor: right hemisphere → start, left → end, top/bottom → middle
      const textAnchor = Math.abs(cosA) < 0.15 ? 'middle' : cosA >= 0 ? 'start' : 'end';

      // On mobile, use the short single-word name to avoid overlap on small viewports.
      // On desktop, split "Word / Word" into two stacked lines.
      const displayName = isMobile ? config.shortName : config.name;
      const [line1, line2] = displayName.split(' / ');

      return [
        <line
          key={`leader-${key}`}
          x1={lx1} y1={ly1}
          x2={lx2} y2={ly2}
          stroke={config.color}
          strokeWidth={1.5}
          opacity={0.55}
        />,
        <text
          key={key}
          textAnchor={textAnchor}
          dominantBaseline="middle"
          fill={config.color}
          fontSize={14}
          fontWeight="700"
          letterSpacing="0.03em"
        >
          <tspan x={tx} y={line2 ? ty - LABEL_LINE_OFFSET_HALF : ty}>{line1}</tspan>
          {line2 && <tspan x={tx} dy={LABEL_LINE_HEIGHT}>{line2}</tspan>}
        </text>,
      ];
    });
  }

  // Render age ring labels along the top spoke of each ring
  function renderAgeLabels() {
    return Object.entries(DEVELOPMENTAL_MILESTONES).map(([key, data]) => {
      const radius = baseRadius + (data.ring - 0.5) * ringWidth;
      const y = centerY - radius;

      return (
        <text
          key={key}
          x={centerX}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize={12}
          fontWeight="700"
          stroke="rgba(0,0,0,0.25)"
          strokeWidth={3}
          paintOrder="stroke"
          pointerEvents="none"
        >
          {data.ageRange}
        </text>
      );
    });
  }

  return (
    <div className="developmental-wheel-container">
      <svg
        ref={svgRef}
        viewBox="-100 0 1200 1000"
        className="developmental-wheel-svg"
        style={{ maxWidth: '100%', height: 'auto' }}
        aria-label="IATLAS Developmental Roadmap Wheel"
        role="img"
      >
        <title>IATLAS Developmental Roadmap — Circular Evolution Wheel</title>
        <desc>
          Interactive circular wheel showing resilience skills across 4 age groups (5-7, 8-10,
          11-14, 15-18) and 6 dimensions. Click or press Enter on any segment for details.
        </desc>

        {renderDefs()}

        {/* Soft background halo behind the wheel */}
        <circle
          cx={centerX}
          cy={centerY}
          r={outerRingRadius + 15}
          fill="rgba(248,250,252,0.45)"
          stroke="none"
        />

        {/* Wheel segments with drop shadow */}
        <g filter="url(#wheel-shadow)">
          {renderWheelSegments()}
        </g>

        {/* Center circle (rendered above segments so it stays crisp) */}
        <circle
          cx={centerX}
          cy={centerY}
          r={baseRadius}
          fill="#f3f4f6"
          stroke="#d1d5db"
          strokeWidth={2}
        />
        <text
          x={centerX}
          y={centerY - 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={16}
          fontWeight="700"
          fill="#1e293b"
        >
          IATLAS
        </text>
        <text
          x={centerX}
          y={centerY + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={11}
          fill="#6b7280"
        >
          Ages 5-18
        </text>

        {/* Dimension labels with leader lines (outside outermost ring) */}
        <g className="wheel-labels">
          {renderDimensionLabels()}
        </g>

        {/* Age range labels along the top spoke */}
        {renderAgeLabels()}
      </svg>

      {/* Selected segment details panel */}
      {selectedSegment && (
        <SegmentDetailsPanel
          ageGroup={selectedSegment.ageGroup}
          dimension={selectedSegment.dimension}
          onClose={() => setSelectedSegment(null)}
        />
      )}
    </div>
  );
}

// Details panel component
function SegmentDetailsPanel({ ageGroup, dimension, onClose }) {
  const ageData = DEVELOPMENTAL_MILESTONES[ageGroup];
  const dimData = ageData.dimensions[dimension];
  const dimConfig = DIMENSION_CONFIG[dimension];

  return (
    <div className="segment-details-panel" role="dialog" aria-modal="true" aria-label={`${dimData.title} — ${ageData.label}`}>
      <button className="close-btn" onClick={onClose} aria-label="Close details">
        ✕
      </button>

      <div className="panel-header" style={{ borderLeftColor: dimConfig.color }}>
        <h3>{dimData.title}</h3>
        <p className="age-label">{ageData.label}</p>
      </div>

      <p className="description">{dimData.description}</p>

      <h4>Key Skills:</h4>
      <ul className="skills-list">
        {dimData.keySkills.map((skill) => (
          <li key={skill}>{skill}</li>
        ))}
      </ul>

      <div className="activities-info">
        <strong>{dimData.activities?.length || 0} activities</strong> available in this segment
      </div>

      <div className="badges-info">
        <h4>Badges to Unlock:</h4>
        <div className="badge-list">
          {dimData.badges.map((badge) => (
            <span key={badge} className="badge-tag">
              {badge.replace(/-/g, ' ')}
            </span>
          ))}
        </div>
      </div>

      <a
        href={`/iatlas/kids/activities?${new URLSearchParams({ age: ageGroup, dimension }).toString()}`}
        className="btn-primary"
      >
        View Activities →
      </a>
    </div>
  );
}
