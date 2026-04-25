/**
 * DimensionalBalanceWheel.jsx
 *
 * Animated SVG radar chart showing real-time balance across all 6 IARF resilience dimensions.
 * Uses CSS animations and respects prefers-reduced-motion.
 *
 * Features:
 *   - Animated radar chart with color-coded growth indicators
 *   - Balance Bonus indicator (all 6 dims within 15% of each other)
 *   - Specialist Path indicator (one dim at 90%+)
 *   - Renaissance Path indicator (all dims at 70%+)
 *   - Before/After comparison mode
 *   - Responsive and accessible (ARIA labels)
 */
import React, { useState, useEffect, useRef } from 'react';
import { IARF_DIMENSION_META } from '../../data/iarf-skill-trees.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const DIMENSIONS = [
  'Agentic-Generative',
  'Somatic-Regulative',
  'Cognitive-Narrative',
  'Relational-Connective',
  'Emotional-Adaptive',
  'Spiritual-Reflective',
];

const CHART_SIZE = 260;
const CENTER     = CHART_SIZE / 2;
const MAX_RADIUS = 100;
const GRID_LEVELS = [25, 50, 75, 100];

// Respect prefers-reduced-motion
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Geometry helpers ──────────────────────────────────────────────────────────

/** Convert polar coords (angle in radians, radius) to Cartesian (x, y). */
function polarToCartesian(angle, radius) {
  return {
    x: CENTER + radius * Math.sin(angle),
    y: CENTER - radius * Math.cos(angle),
  };
}

/** Build an SVG polygon points string from an array of {x,y} points. */
function buildPolygonPoints(points) {
  return points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
}

/**
 * Compute the polygon points for a set of dimension scores.
 * @param {number[]} scores  — ordered array matching DIMENSIONS
 * @returns {{x,y}[]}
 */
function computePolygonPoints(scores) {
  const n = DIMENSIONS.length;
  return scores.map((score, i) => {
    const angle  = (2 * Math.PI * i) / n;
    const radius = (Math.min(Math.max(score, 0), 100) / 100) * MAX_RADIUS;
    return polarToCartesian(angle, radius);
  });
}

// ── Balance logic ─────────────────────────────────────────────────────────────

/** Returns true when all non-zero scores are within 15% of each other. */
function isBalanced(scores) {
  const active = scores.filter(s => s > 0);
  if (active.length < 6) return false;
  const min = Math.min(...active);
  const max = Math.max(...active);
  return (max - min) <= 15;
}

/** Returns the dimension name where score is 90%+ (Specialist Path). */
function getSpecialistDimension(scores) {
  const idx = scores.findIndex(s => s >= 90);
  return idx >= 0 ? DIMENSIONS[idx] : null;
}

/** Returns true when all scores are 70%+ (Renaissance Path). */
function isRenaissancePath(scores) {
  return scores.every(s => s >= 70);
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  container: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            16,
    padding:        '20px 16px',
    background:     'rgba(255,255,255,0.02)',
    border:         '1px solid rgba(255,255,255,0.08)',
    borderRadius:   14,
  },
  header: {
    width:      '100%',
    display:    'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap:   'wrap',
    gap:        8,
  },
  title: {
    fontSize:   15,
    fontWeight: 700,
    color:      '#e2e8f0',
    margin:     0,
  },
  subtitle: {
    fontSize: 12,
    color:    '#718096',
    margin:   '2px 0 0',
  },
  toggleBtn: (active) => ({
    fontSize:     11,
    fontWeight:   600,
    padding:      '4px 12px',
    borderRadius: 6,
    border:       `1px solid ${active ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`,
    background:   active ? 'rgba(99,102,241,0.15)' : 'transparent',
    color:        active ? '#818cf8' : '#6b7280',
    cursor:       'pointer',
  }),
  badgesRow: {
    display:    'flex',
    gap:        8,
    flexWrap:   'wrap',
    justifyContent: 'center',
    marginTop:  -4,
  },
  pathBadge: (color, glow) => ({
    display:      'inline-flex',
    alignItems:   'center',
    gap:          4,
    fontSize:     11,
    fontWeight:   700,
    padding:      '4px 10px',
    borderRadius: 999,
    border:       `1px solid ${color}`,
    background:   `${glow}`,
    color:        color,
  }),
  dimLabels: {
    display:    'flex',
    gap:        8,
    flexWrap:   'wrap',
    justifyContent: 'center',
    marginTop:  -8,
  },
  dimLabel: (accent) => ({
    display:    'inline-flex',
    alignItems: 'center',
    gap:        4,
    fontSize:   11,
    color:      '#94a3b8',
  }),
  dimDot: (accent) => ({
    width:        8,
    height:       8,
    borderRadius: '50%',
    background:   accent,
    flexShrink:   0,
  }),
  scoreText: (accent) => ({
    fontWeight: 700,
    color:      accent,
  }),
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * DimensionalBalanceWheel
 *
 * @param {object}   props
 * @param {object}   props.scores          — { dimensionName: score (0-100), ... }
 * @param {object}   [props.baselineScores] — optional baseline for before/after view
 * @param {boolean}  [props.animated]       — animate the chart drawing (default: true)
 * @param {string}   [props.title]          — optional title override
 */
export default function DimensionalBalanceWheel({
  scores        = {},
  baselineScores = null,
  animated       = true,
  title          = 'Dimensional Balance Wheel',
}) {
  const [showBaseline, setShowBaseline] = useState(false);
  const [drawProgress, setDrawProgress] = useState(prefersReducedMotion || !animated ? 1 : 0);
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(null);

  const ANIMATION_DURATION = 900; // ms

  // Animate chart drawing on mount
  useEffect(() => {
    if (prefersReducedMotion || !animated) return;
    startTimeRef.current = null;

    function step(timestamp) {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed  = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      // Ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDrawProgress(eased);
      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      }
    }

    animFrameRef.current = requestAnimationFrame(step);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [animated, scores]);

  // Build score arrays
  const currentScores  = DIMENSIONS.map(d => (scores[d] || 0) * drawProgress);
  const previousScores = baselineScores
    ? DIMENSIONS.map(d => (baselineScores[d] || 0))
    : null;

  const displayScores  = showBaseline && previousScores ? previousScores : currentScores;
  const rawScores      = DIMENSIONS.map(d => scores[d] || 0);

  // Compute path indicators
  const balanced    = isBalanced(rawScores);
  const specialist  = getSpecialistDimension(rawScores);
  const renaissance = isRenaissancePath(rawScores);

  // Build polygon
  const currentPoints  = computePolygonPoints(displayScores);
  const baselinePoints = previousScores && !showBaseline
    ? computePolygonPoints(previousScores)
    : null;

  const n = DIMENSIONS.length;

  return (
    <div style={s.container} role="figure" aria-label={title}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h3 style={s.title}>{title}</h3>
          <p style={s.subtitle}>Your resilience balance across all 6 dimensions</p>
        </div>
        {baselineScores && (
          <button
            style={s.toggleBtn(showBaseline)}
            onClick={() => setShowBaseline(b => !b)}
            aria-pressed={showBaseline}
          >
            {showBaseline ? '🔙 Baseline' : '📊 Current'}
          </button>
        )}
      </div>

      {/* Path badges */}
      {(balanced || specialist || renaissance) && (
        <div style={s.badgesRow}>
          {balanced && (
            <span style={s.pathBadge('#22c55e', 'rgba(34,197,94,0.08)')}>
              ⚖️ Balance Bonus Active
            </span>
          )}
          {renaissance && (
            <span style={s.pathBadge('#f59e0b', 'rgba(245,158,11,0.08)')}>
              🌈 Renaissance Path
            </span>
          )}
          {specialist && !renaissance && (
            <span style={s.pathBadge('#8b5cf6', 'rgba(139,92,246,0.08)')}>
              🎯 Specialist: {IARF_DIMENSION_META[specialist]?.shortName}
            </span>
          )}
        </div>
      )}

      {/* SVG Radar Chart */}
      <svg
        width={CHART_SIZE}
        height={CHART_SIZE}
        viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
        aria-hidden="true"
        style={{ overflow: 'visible' }}
      >
        {/* Grid rings */}
        {GRID_LEVELS.map(level => {
          const r = (level / 100) * MAX_RADIUS;
          const pts = DIMENSIONS.map((_, i) => {
            const angle = (2 * Math.PI * i) / n;
            return polarToCartesian(angle, r);
          });
          return (
            <polygon
              key={level}
              points={buildPolygonPoints(pts)}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />
          );
        })}

        {/* Grid level labels */}
        {GRID_LEVELS.map(level => {
          const r = (level / 100) * MAX_RADIUS;
          const { x, y } = polarToCartesian(0, r);
          return (
            <text
              key={`label-${level}`}
              x={x + 3}
              y={y}
              fontSize={8}
              fill="rgba(255,255,255,0.3)"
              dominantBaseline="middle"
            >
              {level}
            </text>
          );
        })}

        {/* Axis lines */}
        {DIMENSIONS.map((dim, i) => {
          const angle = (2 * Math.PI * i) / n;
          const end   = polarToCartesian(angle, MAX_RADIUS);
          return (
            <line
              key={dim}
              x1={CENTER}
              y1={CENTER}
              x2={end.x}
              y2={end.y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
            />
          );
        })}

        {/* Baseline overlay (if showing current with baseline ghost) */}
        {baselinePoints && !showBaseline && (
          <polygon
            points={buildPolygonPoints(baselinePoints)}
            fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        )}

        {/* Main data polygon */}
        <polygon
          points={buildPolygonPoints(currentPoints)}
          fill={balanced ? 'rgba(34,197,94,0.12)' : renaissance ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.12)'}
          stroke={balanced ? 'rgba(34,197,94,0.7)' : renaissance ? 'rgba(245,158,11,0.7)' : 'rgba(99,102,241,0.7)'}
          strokeWidth={1.5}
          style={{ transition: prefersReducedMotion ? 'none' : 'all 0.3s ease' }}
        />

        {/* Data points with dimension colors */}
        {currentPoints.map((pt, i) => {
          const dim    = DIMENSIONS[i];
          const accent = IARF_DIMENSION_META[dim]?.accent || '#818cf8';
          const score  = rawScores[i];
          return (
            <g key={dim}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={4}
                fill={accent}
                stroke="#0f172a"
                strokeWidth={1.5}
              />
              {/* Score tooltip on hover (via title element) */}
              <title>{dim}: {score.toFixed(0)}</title>
            </g>
          );
        })}

        {/* Axis labels */}
        {DIMENSIONS.map((dim, i) => {
          const angle     = (2 * Math.PI * i) / n;
          const labelR    = MAX_RADIUS + 18;
          const { x, y } = polarToCartesian(angle, labelR);
          const meta      = IARF_DIMENSION_META[dim];
          const score     = rawScores[i];
          const isTop     = angle < 0.3 || angle > 2 * Math.PI - 0.3;
          const isLeft    = x < CENTER - 5;
          const anchor    = isLeft ? 'end' : isTop ? 'middle' : 'start';

          return (
            <g key={`axis-label-${dim}`}>
              <text
                x={x}
                y={y - 5}
                textAnchor={anchor}
                fontSize={9}
                fontWeight={600}
                fill="#94a3b8"
              >
                {meta?.shortName || dim}
              </text>
              <text
                x={x}
                y={y + 7}
                textAnchor={anchor}
                fontSize={10}
                fontWeight={800}
                fill={meta?.accent || '#818cf8'}
              >
                {score > 0 ? score.toFixed(0) : '—'}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={s.dimLabels}>
        {DIMENSIONS.map(dim => {
          const meta  = IARF_DIMENSION_META[dim];
          const score = rawScores[DIMENSIONS.indexOf(dim)];
          return (
            <div key={dim} style={s.dimLabel(meta?.accent)}>
              <span style={s.dimDot(meta?.accent)} />
              <span>{meta?.emoji} {meta?.shortName}</span>
              {score > 0 && <span style={s.scoreText(meta?.accent)}>{score.toFixed(0)}</span>}
            </div>
          );
        })}
      </div>

      {/* Balance status message */}
      <div style={{ fontSize: 11, color: '#6b7280', textAlign: 'center', maxWidth: 280 }}>
        {balanced
          ? '✅ All 6 dimensions are within 15% of each other — Balance Bonus active! (+30 XP on next practice)'
          : renaissance
          ? '🌈 All dimensions at 70%+ — Renaissance Path achieved!'
          : specialist
          ? `🎯 Specialist Path: ${IARF_DIMENSION_META[specialist]?.shortName} dimension at elite level`
          : 'Complete practices across dimensions to build your balanced resilience profile.'}
      </div>
    </div>
  );
}
