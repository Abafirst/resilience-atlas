/**
 * DevelopmentalWheel.jsx
 * Interactive SVG circular evolution wheel showing how resilience skills
 * evolve across ages 5-18 across 6 dimensions.
 * Route: used by DevelopmentalRoadmapPage at /iatlas/developmental-roadmap
 */

import React, { useState, useRef } from 'react';
import { DEVELOPMENTAL_MILESTONES, DIMENSION_CONFIG } from '../../data/iatlas/developmentalRoadmap.js';

export default function DevelopmentalWheel() {
  const [selectedSegment, setSelectedSegment] = useState(null); // { ageGroup, dimension }
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const svgRef = useRef(null);

  const centerX = 400;
  const centerY = 400;
  const baseRadius = 80;
  const ringWidth = 70;

  // Generate SVG path for a wheel segment
  function generateSegmentPath(ring, angleStart, angleEnd) {
    const innerRadius = baseRadius + (ring - 1) * ringWidth;
    const outerRadius = baseRadius + ring * ringWidth;

    const toRadians = (deg) => (deg * Math.PI) / 180;
    const polarToCartesian = (r, angle) => ({
      x: centerX + r * Math.cos(toRadians(angle - 90)),
      y: centerY + r * Math.sin(toRadians(angle - 90)),
    });

    const innerStart = polarToCartesian(innerRadius, angleStart);
    const innerEnd = polarToCartesian(innerRadius, angleEnd);
    const outerStart = polarToCartesian(outerRadius, angleStart);
    const outerEnd = polarToCartesian(outerRadius, angleEnd);

    const largeArc = angleEnd - angleStart > 180 ? 1 : 0;

    return [
      `M ${innerStart.x} ${innerStart.y}`,
      `L ${outerStart.x} ${outerStart.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
      'Z',
    ].join(' ');
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

        const baseColor = DIMENSION_CONFIG[dimKey].color;
        const opacity = isSelected ? 1 : isHovered ? 0.8 : 0.6;

        segments.push(
          <path
            key={`${ageKey}-${dimKey}`}
            d={path}
            fill={baseColor}
            fillOpacity={opacity}
            stroke="#fff"
            strokeWidth={2}
            className="wheel-segment"
            onClick={() => setSelectedSegment({ ageGroup: ageKey, dimension: dimKey })}
            onMouseEnter={() => setHoveredSegment({ ageGroup: ageKey, dimension: dimKey })}
            onMouseLeave={() => setHoveredSegment(null)}
            style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
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

  // Render dimension labels around the wheel
  function renderDimensionLabels() {
    const radius = baseRadius + 4 * ringWidth + 40;
    return Object.entries(DIMENSION_CONFIG).map(([key, config]) => {
      const angle = config.angle - 90; // Adjust for SVG coordinate system
      const x = centerX + radius * Math.cos((angle * Math.PI) / 180);
      const y = centerY + radius * Math.sin((angle * Math.PI) / 180);

      return (
        <g key={key}>
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={config.color}
            fontSize={14}
            fontWeight="600"
          >
            {config.shortName}
          </text>
        </g>
      );
    });
  }

  // Render age ring labels (placed along the top spoke of each ring)
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
          fill={data.color}
          fontSize={11}
          fontWeight="600"
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
        viewBox="0 0 800 800"
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

        {/* Center circle */}
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

        {/* Wheel segments */}
        {renderWheelSegments()}

        {/* Dimension labels */}
        {renderDimensionLabels()}

        {/* Age labels */}
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
        {dimData.keySkills.map((skill, idx) => (
          <li key={idx}>{skill}</li>
        ))}
      </ul>

      <div className="activities-info">
        <strong>{dimData.activitiesCount} activities</strong> available in this segment
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
        href={`/iatlas/kids/activities?age=${ageGroup}&dimension=${dimension}`}
        className="btn-primary"
      >
        View Activities →
      </a>
    </div>
  );
}
