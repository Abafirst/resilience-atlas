import React, { useState, useEffect, useRef } from 'react';

/**
 * ResilienceDimensionViz — Interactive SVG hexagon constellation visualization
 * showing the 6 resilience dimensions with custom icons, hover effects, and
 * animated entrance.
 *
 * Props:
 *   size        — number, SVG canvas diameter in px (default 500)
 *   compact     — boolean, smaller compact mode for embed use (default false)
 *   showLines   — boolean, draw connecting lines to center (default true)
 *   className   — string, extra class name for outer wrapper
 *   style       — object, extra inline styles for outer wrapper
 */

const DIMENSIONS = [
  {
    key: 'Cognitive-Narrative',
    label: 'Cognitive',
    fullLabel: 'Cognitive-Narrative',
    color: '#4F46E5',
    icon: '/icons/cognitive-narrative.svg',
    description: 'The stories you tell yourself and the mental frameworks that shape how you interpret experience.',
  },
  {
    key: 'Relational-Connective',
    label: 'Relational',
    fullLabel: 'Relational-Connective',
    color: '#059669',
    icon: '/icons/relational-connective.svg',
    description: 'Your bonds, sense of belonging, and the relationships that anchor and sustain you.',
  },
  {
    key: 'Agentic-Generative',
    label: 'Agentic',
    fullLabel: 'Agentic-Generative',
    color: '#D97706',
    icon: '/icons/agentic-generative.svg',
    description: 'Your capacity to act, create change, and generate meaningful outcomes in your world.',
  },
  {
    key: 'Emotional-Adaptive',
    label: 'Emotional',
    fullLabel: 'Emotional-Adaptive',
    color: '#DC2626',
    icon: '/icons/emotional-adaptive.svg',
    description: 'Your emotional intelligence, flexibility, and ability to navigate feelings with skill.',
  },
  {
    key: 'Spiritual-Reflective',
    label: 'Spiritual',
    fullLabel: 'Spiritual-Reflective',
    color: '#7C3AED',
    icon: '/icons/spiritual-reflective.svg',
    description: 'Your inner compass, sense of purpose, and connection to something greater than yourself.',
  },
  {
    key: 'Somatic-Regulative',
    label: 'Somatic',
    fullLabel: 'Somatic-Regulative',
    color: '#0891B2',
    icon: '/icons/somatic-regulative.svg',
    description: "Your body's wisdom and capacity to self-regulate, recover, and restore balance.",
  },
];

// Convert polar angle + radius to {x, y} from a center point
function polar(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * (Math.PI / 180); // start from top
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

export default function ResilienceDimensionViz({
  size = 500,
  compact = false,
  showLines = true,
  className = '',
  style = {},
}) {
  const [hovered, setHovered] = useState(null);
  const [visible, setVisible] = useState(false);
  const wrapRef = useRef(null);

  // Animate entrance via IntersectionObserver
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) { setVisible(true); return; }
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const s = compact ? Math.min(size, 360) : size;
  const cx = s / 2;
  const cy = s / 2;
  const iconR = s * 0.31;       // radius for icon placement
  const circleR = s * 0.09;     // radius of each dimension circle
  const iconSize = circleR * 1.1; // icon image width/height
  const centerIconSize = s * 0.1;

  const hoveredDim = DIMENSIONS.find(d => d.key === hovered);

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        userSelect: 'none',
        ...style,
      }}
    >
      <svg
        width={s}
        height={s}
        viewBox={`0 0 ${s} ${s}`}
        aria-label="The Resilience Atlas — 6 dimensions constellation"
        role="img"
        style={{
          overflow: 'visible',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.85)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
          maxWidth: '100%',
        }}
      >
        <defs>
          {/* Glow filter for hovered dimension */}
          <filter id="rdv-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Center radial gradient */}
          <radialGradient id="rdv-center-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e40af" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
          </radialGradient>

          {/* Subtle background gradient */}
          <radialGradient id="rdv-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(79,70,229,0.06)" />
            <stop offset="100%" stopColor="rgba(8,145,178,0.03)" />
          </radialGradient>

          {/* Per-dimension clip paths for icons */}
          {DIMENSIONS.map(d => {
            const pos = polar(cx, cy, iconR, DIMENSIONS.indexOf(d) * 60);
            return (
              <clipPath key={`clip-${d.key}`} id={`rdv-clip-${d.key}`}>
                <circle cx={pos.x} cy={pos.y} r={circleR * 0.72} />
              </clipPath>
            );
          })}

          {/* Center clip path */}
          <clipPath id="rdv-clip-center">
            <circle cx={cx} cy={cy} r={centerIconSize * 0.6} />
          </clipPath>
        </defs>

        {/* Subtle background circle */}
        <circle cx={cx} cy={cy} r={s * 0.46} fill="url(#rdv-bg)" />

        {/* Outer decorative ring */}
        <circle
          cx={cx} cy={cy} r={s * 0.46}
          fill="none"
          stroke="rgba(79,70,229,0.12)"
          strokeWidth="1"
        />

        {/* Inner ring */}
        <circle
          cx={cx} cy={cy} r={iconR * 0.55}
          fill="none"
          stroke="rgba(79,70,229,0.08)"
          strokeWidth="1"
        />

        {/* Hexagonal connecting lines to center */}
        {showLines && DIMENSIONS.map((d, i) => {
          const pos = polar(cx, cy, iconR, i * 60);
          const isHov = hovered === d.key;
          return (
            <line
              key={`line-${d.key}`}
              x1={cx} y1={cy}
              x2={pos.x} y2={pos.y}
              stroke={isHov ? d.color : 'rgba(148,163,184,0.25)'}
              strokeWidth={isHov ? 1.5 : 1}
              strokeDasharray={isHov ? 'none' : '4 4'}
              style={{ transition: 'stroke 0.25s, stroke-width 0.25s' }}
            />
          );
        })}

        {/* Hexagon outline (connecting all 6 nodes) */}
        <polygon
          points={DIMENSIONS.map((_, i) => {
            const p = polar(cx, cy, iconR, i * 60);
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
          }).join(' ')}
          fill="none"
          stroke="rgba(148,163,184,0.18)"
          strokeWidth="1"
        />

        {/* ── Center node ──────────────────────────────── */}
        <circle
          cx={cx} cy={cy} r={s * 0.085}
          fill="url(#rdv-center-grad)"
          stroke="rgba(79,70,229,0.5)"
          strokeWidth="2"
        />
        <image
          href="/icons/compass.svg"
          x={cx - centerIconSize * 0.6}
          y={cy - centerIconSize * 0.85}
          width={centerIconSize * 1.2}
          height={centerIconSize * 1.2}
          clipPath="url(#rdv-clip-center)"
          style={{ filter: 'brightness(0) invert(1) opacity(0.85)' }}
        />
        <text
          x={cx} y={cy + s * 0.062}
          textAnchor="middle"
          fontSize={s * 0.026}
          fontWeight="700"
          fill="rgba(255,255,255,0.9)"
          letterSpacing="0.03em"
        >
          The Resilience Atlas
        </text>

        {/* ── Dimension nodes ───────────────────────────── */}
        {DIMENSIONS.map((d, i) => {
          const pos = polar(cx, cy, iconR, i * 60);
          const isHov = hovered === d.key;
          const baseAlpha = visible ? 1 : 0;

          // Label anchor: left side → end, right side → start, top/bottom → middle
          const angleDeg = i * 60;
          let anchor = 'middle';
          if (angleDeg > 30 && angleDeg < 150) anchor = 'start';
          else if (angleDeg > 210 && angleDeg < 330) anchor = 'end';

          // Label offset
          const labelR = iconR + circleR + s * 0.035;
          const labelPos = polar(cx, cy, labelR, i * 60);

          return (
            <g
              key={d.key}
              style={{
                cursor: 'pointer',
                opacity: baseAlpha,
                transition: `opacity 0.6s ease ${i * 0.08}s`,
              }}
              onMouseEnter={() => setHovered(d.key)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(d.key)}
              onBlur={() => setHovered(null)}
              tabIndex={0}
              role="button"
              aria-label={`${d.fullLabel}: ${d.description}`}
            >
              {/* Outer glow ring on hover */}
              {isHov && (
                <circle
                  cx={pos.x} cy={pos.y} r={circleR + s * 0.012}
                  fill="none"
                  stroke={d.color}
                  strokeWidth="2"
                  opacity="0.45"
                  filter="url(#rdv-glow)"
                />
              )}

              {/* Pulsing ring on hover */}
              {isHov && (
                <circle cx={pos.x} cy={pos.y} r={circleR + s * 0.025} fill="none" stroke={d.color} strokeWidth="1" opacity="0.25">
                  <animate attributeName="r" from={circleR + s * 0.01} to={circleR + s * 0.045} dur="1.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.3" to="0" dur="1.2s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Main circle */}
              <circle
                cx={pos.x} cy={pos.y}
                r={circleR}
                fill={isHov ? d.color : `${d.color}22`}
                stroke={d.color}
                strokeWidth={isHov ? 2.5 : 1.5}
                style={{ transition: 'fill 0.25s, stroke-width 0.25s' }}
              />

              {/* SVG icon */}
              <image
                href={d.icon}
                x={pos.x - iconSize / 2}
                y={pos.y - iconSize / 2}
                width={iconSize}
                height={iconSize}
                style={{
                  filter: isHov
                    ? 'brightness(0) invert(1)'
                    : `brightness(0) saturate(100%) invert(30%) sepia(80%) hue-rotate(${getHue(d.color)}deg) saturate(600%)`,
                  transition: 'filter 0.25s',
                  opacity: 0.9,
                }}
              />

              {/* Dimension label */}
              <text
                x={labelPos.x} y={labelPos.y}
                textAnchor={anchor}
                dominantBaseline="middle"
                fontSize={s * 0.032}
                fontWeight="700"
                fill={isHov ? d.color : '#1e293b'}
                style={{ transition: 'fill 0.25s', pointerEvents: 'none' }}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Description panel below SVG */}
      <div
        aria-live="polite"
        style={{
          minHeight: compact ? 48 : 60,
          marginTop: 8,
          textAlign: 'center',
          maxWidth: Math.min(s, 420),
          padding: '0 12px',
        }}
      >
        {hoveredDim ? (
          <div style={{ animation: 'rdvFadeIn 0.2s ease' }}>
            <span style={{
              display: 'inline-block',
              fontWeight: 700,
              fontSize: compact ? 13 : 15,
              color: hoveredDim.color,
              marginBottom: 4,
            }}>
              {hoveredDim.fullLabel}
            </span>
            <p style={{
              margin: 0,
              fontSize: compact ? 12 : 14,
              color: '#475569',
              lineHeight: 1.5,
            }}>
              {hoveredDim.description}
            </p>
          </div>
        ) : (
          <p style={{
            margin: 0,
            fontSize: compact ? 12 : 14,
            color: '#94a3b8',
            fontStyle: 'italic',
          }}>
            Hover over a dimension to explore
          </p>
        )}
      </div>

      <style>{`
        @keyframes rdvFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/**
 * Rough hue rotation to tint a white SVG icon toward a given hex color.
 * Not perfect but gives a reasonable approximation for the non-hover state.
 */
function getHue(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  if (max !== min) {
    const d = max - min;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return Math.round(h * 360);
}
