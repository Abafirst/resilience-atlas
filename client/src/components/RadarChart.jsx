import React, { useEffect, useRef } from 'react';

/**
 * RadarChart — SVG-based radar/compass chart for the 6 resilience dimensions.
 * Pure SVG, no external library required.
 *
 * Props:
 *   scores  — object mapping dimension name → { percentage: number }
 *   colors  — object mapping dimension name → hex color (optional)
 *   size    — number, chart diameter in px (default 340)
 */

const DEFAULT_COLORS = {
  'Cognitive-Narrative':   '#4F46E5',
  'Relational-Connective': '#059669',
  'Agentic-Generative':    '#D97706',
  'Emotional-Adaptive':    '#DC2626',
  'Spiritual-Reflective':  '#7C3AED',
  'Somatic-Regulative':    '#0891B2',
};

const CHART_COLORS = {
  polygonFill:   'rgba(0,151,167,0.12)',
  polygonStroke: 'rgba(0,151,167,0.65)',
  outerRing:     '#1565C0',
  innerRing:     '#0097A7',
};

// Convert polar coordinates to Cartesian
function polarToCartesian(cx, cy, r, angleRad) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

// Build SVG polygon points string from an array of {x,y}
function pointsStr(pts) {
  return pts.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
}

function RadarChart({ scores, colors = DEFAULT_COLORS, size = 340 }) {
  const svgRef = useRef(null);

  if (!scores || typeof scores !== 'object') return null;

  const dims = Object.keys(scores);
  const n = dims.length;
  if (n === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38; // radius for 100%
  const labelR = maxR + 26;  // label offset from center
  const rings = [20, 40, 60, 80, 100];

  // Angles: start at top (-π/2), evenly spaced clockwise
  const angles = dims.map((_, i) => -Math.PI / 2 + (2 * Math.PI * i) / n);

  // Data polygon points
  const dataPoints = dims.map((dim, i) => {
    const pct = (scores[dim] && typeof scores[dim].percentage === 'number')
      ? scores[dim].percentage
      : (typeof scores[dim] === 'number' ? scores[dim] : 0);
    const r = (Math.min(100, Math.max(0, pct)) / 100) * maxR;
    return polarToCartesian(cx, cy, r, angles[i]);
  });

  // Label positions
  const labelPositions = dims.map((_, i) => polarToCartesian(cx, cy, labelR, angles[i]));

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label="Resilience dimension radar chart"
      role="img"
      style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}
    >
      <defs>
        <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0097A7" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#0097A7" stopOpacity="0.06" />
        </radialGradient>
      </defs>

      {/* Concentric grid rings */}
      {rings.map((pct, idx) => {
        const r = (pct / 100) * maxR;
        const ringPts = angles.map(a => polarToCartesian(cx, cy, r, a));
        const isOuter = idx === rings.length - 1;
        return (
          <polygon
            key={pct}
            points={pointsStr(ringPts)}
            fill="none"
            stroke={isOuter ? CHART_COLORS.outerRing : CHART_COLORS.innerRing}
            strokeOpacity={isOuter ? 0.7 : 0.3}
            strokeWidth={isOuter ? 1.5 : 1}
          />
        );
      })}

      {/* Spoke lines from center to each vertex */}
      {angles.map((angle, i) => {
        const outer = polarToCartesian(cx, cy, maxR, angle);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={outer.x.toFixed(2)}
            y2={outer.y.toFixed(2)}
            stroke="rgba(160,174,192,0.4)"
            strokeWidth="1"
          />
        );
      })}

      {/* Ring percentage labels (inside) */}
      {[40, 80].map(pct => {
        const r = (pct / 100) * maxR;
        return (
          <text
            key={pct}
            x={(cx + 4).toFixed(1)}
            y={(cy - r + 4).toFixed(1)}
            fontSize="9"
            fill="rgba(160,174,192,0.8)"
            textAnchor="start"
          >
            {pct}%
          </text>
        );
      })}

      {/* Data polygon (filled) */}
      <polygon
        points={pointsStr(dataPoints)}
        fill="url(#radarFill)"
        stroke={CHART_COLORS.polygonStroke}
        strokeWidth="2.5"
        strokeLinejoin="round"
        opacity="0.9"
      >
        <animate
          attributeName="opacity"
          from="0"
          to="0.9"
          dur="0.8s"
          fill="freeze"
        />
      </polygon>

      {/* Data points (dots) */}
      {dataPoints.map((pt, i) => {
        const dim = dims[i];
        const color = colors[dim] || '#4F46E5';
        return (
          <circle
            key={dim}
            cx={pt.x.toFixed(2)}
            cy={pt.y.toFixed(2)}
            r="5"
            fill={color}
            stroke="#fff"
            strokeWidth="2"
          />
        );
      })}

      {/* Dimension labels */}
      {labelPositions.map((pt, i) => {
        const dim = dims[i];
        const angle = angles[i];
        const color = colors[dim] || '#4F46E5';
        const pct = (scores[dim] && typeof scores[dim].percentage === 'number')
          ? Math.round(scores[dim].percentage)
          : (typeof scores[dim] === 'number' ? Math.round(scores[dim]) : 0);

        // Shorten long dimension names to two lines
        const parts = dim.split('-');
        const line1 = parts[0] || dim;
        const line2 = parts[1] || '';

        // Text anchor based on angle
        let anchor = 'middle';
        const cosVal = Math.cos(angle);
        if (cosVal > 0.3) anchor = 'start';
        else if (cosVal < -0.3) anchor = 'end';

        const lineH = 12;

        return (
          <g key={dim}>
            <text
              x={pt.x.toFixed(2)}
              y={(pt.y - (line2 ? lineH / 2 : 0)).toFixed(2)}
              fontSize="10"
              fontWeight="600"
              fill={color}
              textAnchor={anchor}
              dominantBaseline="middle"
            >
              {line1}
            </text>
            {line2 && (
              <text
                x={pt.x.toFixed(2)}
                y={(pt.y + lineH / 2).toFixed(2)}
                fontSize="10"
                fontWeight="600"
                fill={color}
                textAnchor={anchor}
                dominantBaseline="middle"
              >
                {line2}
              </text>
            )}
            <text
              x={pt.x.toFixed(2)}
              y={(pt.y + (line2 ? lineH * 1.4 : lineH * 0.9)).toFixed(2)}
              fontSize="9"
              fill="rgba(203,213,224,0.9)"
              textAnchor={anchor}
              dominantBaseline="middle"
            >
              {pct}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default RadarChart;
