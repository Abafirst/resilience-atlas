import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';

// ── Dimension colours & icons (mirrors ResultsPage) ────────────────────────
const DIM_COLORS = {
  'Cognitive-Narrative':   '#4F46E5',
  'Relational-Connective': '#059669',
  'Agentic-Generative':    '#D97706',
  'Emotional-Adaptive':    '#DC2626',
  'Spiritual-Reflective':  '#7C3AED',
  'Somatic-Regulative':    '#0891B2',
};

const DIM_ICONS = {
  'Cognitive-Narrative':   '/icons/cognitive-narrative.svg',
  'Relational-Connective': '/icons/relational-connective.svg',
  'Agentic-Generative':    '/icons/agentic-generative.svg',
  'Emotional-Adaptive':    '/icons/emotional-adaptive.svg',
  'Spiritual-Reflective':  '/icons/spiritual-reflective.svg',
  'Somatic-Regulative':    '/icons/somatic-regulative.svg',
};

const DIMS = [
  'Agentic-Generative',
  'Relational-Connective',
  'Spiritual-Reflective',
  'Emotional-Adaptive',
  'Somatic-Regulative',
  'Cognitive-Narrative',
];

// Short labels for compact display
const DIM_SHORT = {
  'Cognitive-Narrative':   'Cognitive',
  'Relational-Connective': 'Relational',
  'Agentic-Generative':    'Agentic',
  'Emotional-Adaptive':    'Emotional',
  'Spiritual-Reflective':  'Spiritual',
  'Somatic-Regulative':    'Somatic',
};

// ── Branded SVG Icon set (mirrors ResultsPage) ─────────────────────────────
const BRAND_ICONS = {
  compass: (
    <><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></>
  ),
  chart: (
    <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>
  ),
  map: (
    <><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></>
  ),
  star: (
    <><path d="M12 2l2.4 7.4H22l-6.2 4.5L18.2 22 12 17.8 5.8 22l2.4-8.1L2 9.4h7.6z"/></>
  ),
  clock: (
    <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>
  ),
  arrowRight: (
    <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>
  ),
  trending: (
    <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>
  ),
};

function BrandIcon({ name, size = 18, color = 'currentColor', style: extraStyle }) {
  const paths = BRAND_ICONS[name];
  if (!paths) return null;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...extraStyle }}
    >
      {paths}
    </svg>
  );
}

// ── Compass drawing (SVG-based, no canvas) ────────────────────────────────
function EvolutionCompass({ scores, previousScores }) {
  const cx = 130, cy = 130, R = 100;

  // Map dimensions to evenly-spaced angles (0° = North/top, clockwise, 60° apart)
  const dimAngles = {
    'Cognitive-Narrative':   0,    // N  (12 o'clock)
    'Agentic-Generative':    60,   // NE (2 o'clock)
    'Relational-Connective': 120,  // SE (4 o'clock)
    'Somatic-Regulative':    180,  // S  (6 o'clock)
    'Emotional-Adaptive':    240,  // SW (8 o'clock)
    'Spiritual-Reflective':  300,  // NW (10 o'clock)
  };

  const toRad = (deg) => (deg - 90) * Math.PI / 180;
  const pct = (dim) => ((scores && scores[dim]) || 0) / 100;

  // Build polygon points for current scores
  const points = Object.entries(dimAngles).map(([dim, angle]) => {
    const r = R * pct(dim);
    const rad = toRad(angle);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  });

  // Build polygon points for previous scores (if any)
  const prevPoints = previousScores ? Object.entries(dimAngles).map(([dim, angle]) => {
    const r = R * ((previousScores[dim] || 0) / 100);
    const rad = toRad(angle);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }) : null;

  const toSvgPoly = (pts) => pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Grid rings at 25%, 50%, 75%, 100%
  const rings = [25, 50, 75, 100];

  const dimEntries = Object.entries(dimAngles);

  return (
    <svg
      viewBox="0 0 260 260"
      role="img"
      aria-label="Resilience compass showing current dimension scores"
      style={{ width: '100%', maxWidth: 260, display: 'block', margin: '0 auto' }}
    >
      {/* Grid rings */}
      {rings.map(pctVal => {
        const r = R * pctVal / 100;
        return (
          <circle key={pctVal} cx={cx} cy={cy} r={r}
            fill="none" stroke="#e2e8f0" strokeWidth="1"
            strokeDasharray={pctVal === 100 ? 'none' : '3,3'} />
        );
      })}

      {/* Axis lines */}
      {dimEntries.map(([dim, angle]) => {
        const rad = toRad(angle);
        return (
          <line key={dim}
            x1={cx} y1={cy}
            x2={(cx + R * Math.cos(rad)).toFixed(1)}
            y2={(cy + R * Math.sin(rad)).toFixed(1)}
            stroke="#e2e8f0" strokeWidth="1" />
        );
      })}

      {/* Previous scores polygon (faded) */}
      {prevPoints && (
        <polygon
          points={toSvgPoly(prevPoints)}
          fill="rgba(107,114,128,0.12)"
          stroke="rgba(107,114,128,0.3)"
          strokeWidth="1.5"
        />
      )}

      {/* Current scores polygon */}
      <polygon
        points={toSvgPoly(points)}
        fill="rgba(79,70,229,0.15)"
        stroke="#4F46E5"
        strokeWidth="2"
      />

      {/* Score dots */}
      {dimEntries.map(([dim, angle]) => {
        const r = R * pct(dim);
        const rad = toRad(angle);
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);
        const color = DIM_COLORS[dim] || '#4F46E5';
        return (
          <circle key={dim} cx={x.toFixed(1)} cy={y.toFixed(1)} r="5"
            fill={color} stroke="#fff" strokeWidth="2" />
        );
      })}

      {/* Axis labels */}
      {dimEntries.map(([dim, angle]) => {
        const rad = toRad(angle);
        const labelR = R + 22;
        const lx = cx + labelR * Math.cos(rad);
        const ly = cy + labelR * Math.sin(rad);
        const anchor = lx < cx - 4 ? 'end' : lx > cx + 4 ? 'start' : 'middle';
        const color = DIM_COLORS[dim] || '#4F46E5';
        return (
          <text key={dim} x={lx.toFixed(1)} y={ly.toFixed(1)}
            textAnchor={anchor} dominantBaseline="middle"
            fontSize="9" fill={color} fontWeight="600">
            {DIM_SHORT[dim]}
          </text>
        );
      })}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r="3" fill="#94a3b8" />
    </svg>
  );
}

// ── Radar chart for a single assessment ───────────────────────────────────
function RadarChart({ scores }) {
  const cx = 110, cy = 110, R = 80;
  const n = DIMS.length;
  const toRad = (i) => ((i / n) * 2 * Math.PI) - Math.PI / 2;
  const pct = (dim) => ((scores && scores[dim]) || 0) / 100;

  const points = DIMS.map((dim, i) => {
    const r = R * pct(dim);
    return { x: cx + r * Math.cos(toRad(i)), y: cy + r * Math.sin(toRad(i)) };
  });

  const rings = [25, 50, 75, 100];

  return (
    <svg
      viewBox="0 0 220 220"
      role="img"
      aria-label="Dimension radar chart for this assessment"
      style={{ width: '100%', maxWidth: 220, display: 'block', margin: '0 auto' }}
    >
      {rings.map(pctVal => {
        const r = R * pctVal / 100;
        const pts = DIMS.map((_, i) => {
          const x = cx + r * Math.cos(toRad(i));
          const y = cy + r * Math.sin(toRad(i));
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');
        return (
          <polygon key={pctVal} points={pts}
            fill="none" stroke="#e2e8f0" strokeWidth="1"
            strokeDasharray={pctVal === 100 ? 'none' : '3,3'} />
        );
      })}

      {DIMS.map((_, i) => {
        const rad = toRad(i);
        return (
          <line key={i} x1={cx} y1={cy}
            x2={(cx + R * Math.cos(rad)).toFixed(1)}
            y2={(cy + R * Math.sin(rad)).toFixed(1)}
            stroke="#e2e8f0" strokeWidth="1" />
        );
      })}

      <polygon
        points={points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
        fill="rgba(79,70,229,0.15)" stroke="#4F46E5" strokeWidth="2"
      />

      {DIMS.map((dim, i) => {
        const color = DIM_COLORS[dim] || '#4F46E5';
        return (
          <circle key={dim} cx={points[i].x.toFixed(1)} cy={points[i].y.toFixed(1)} r="4"
            fill={color} stroke="#fff" strokeWidth="1.5" />
        );
      })}

      {DIMS.map((dim, i) => {
        const rad = toRad(i);
        const labelR = R + 18;
        const lx = cx + labelR * Math.cos(rad);
        const ly = cy + labelR * Math.sin(rad);
        const anchor = lx < cx - 4 ? 'end' : lx > cx + 4 ? 'start' : 'middle';
        const color = DIM_COLORS[dim] || '#4F46E5';
        return (
          <text key={dim} x={lx.toFixed(1)} y={ly.toFixed(1)}
            textAnchor={anchor} dominantBaseline="middle"
            fontSize="8" fill={color} fontWeight="600">
            {DIM_SHORT[dim]}
          </text>
        );
      })}
    </svg>
  );
}

// ── Helper: format date ────────────────────────────────────────────────────
function fmtDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch (_) { return dateStr; }
}

// ── Helper: get score colour based on value ───────────────────────────────
function scoreColor(pct) {
  if (pct >= 75) return '#059669';
  if (pct >= 50) return '#D97706';
  return '#DC2626';
}

// ── Helper: delta arrow ────────────────────────────────────────────────────
function DeltaBadge({ delta }) {
  if (delta == null || Math.abs(delta) < 0.5) {
    return <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>;
  }
  const up = delta > 0;
  return (
    <span style={{ color: up ? '#059669' : '#DC2626', fontWeight: 700, fontSize: 12 }}>
      {up ? '▲' : '▼'} {Math.abs(delta).toFixed(0)}
    </span>
  );
}

// ── Inline styles ─────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: '#1a202c',
  },
  hero: {
    background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5986 100%)',
    color: '#fff',
    padding: '3rem 1.5rem 2rem',
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
    fontWeight: 800,
    margin: '0 0 0.5rem',
    color: '#7ec8e3',
  },
  heroSub: {
    color: '#a8c4d8',
    maxWidth: 560,
    margin: '0 auto',
    fontSize: 15,
    lineHeight: 1.6,
  },
  periodBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    padding: '1rem 1.5rem 0',
    maxWidth: 1100,
    margin: '0 auto',
  },
  periodBtn: (active) => ({
    padding: '6px 18px',
    borderRadius: 20,
    border: '1px solid',
    borderColor: active ? '#4a9eca' : '#c4d4e0',
    background: active ? '#4a9eca' : '#fff',
    color: active ? '#fff' : '#4a6a82',
    fontSize: 13,
    cursor: 'pointer',
    fontWeight: active ? 600 : 400,
    transition: 'all 0.15s',
  }),
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 20,
    padding: '1.5rem',
    maxWidth: 1100,
    margin: '0 auto',
  },
  // Left column
  leftCol: {},
  // Right column
  rightCol: {},
  card: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '24px 28px',
    marginBottom: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#1a202c',
    marginBottom: 4,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  cardSub: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 16,
    marginTop: 2,
  },
  // Timeline
  tlList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    position: 'relative',
  },
  tlListLine: {
    position: 'absolute',
    left: 10,
    top: 0,
    bottom: 0,
    width: 2,
    background: '#e2e8f0',
    borderRadius: 2,
  },
  tlItem: (selected) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '12px 8px 12px 0',
    borderBottom: '1px solid #edf2f7',
    cursor: 'pointer',
    borderRadius: 8,
    background: selected ? '#eff6ff' : 'transparent',
    transition: 'background 0.15s',
    position: 'relative',
  }),
  tlDot: (color) => ({
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: color,
    border: '3px solid #fff',
    boxShadow: `0 0 0 2px ${color}`,
    flexShrink: 0,
    marginTop: 2,
    zIndex: 1,
  }),
  tlBody: { flex: 1, minWidth: 0 },
  tlScore: (color) => ({
    fontSize: 22,
    fontWeight: 800,
    color,
    lineHeight: 1,
  }),
  tlType: { fontSize: 13, color: '#4a9eca', marginTop: 2 },
  tlDate: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  tlTop3: { fontSize: 12, color: '#718096', marginTop: 3 },
  tlBadge: {
    display: 'inline-block',
    fontSize: 11,
    padding: '2px 10px',
    borderRadius: 12,
    background: '#fef3c7',
    color: '#92400e',
    border: '1px solid #f0c060',
    marginTop: 4,
  },
  // Milestone badges
  milestoneStrip: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  milestoneBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 14px',
    background: 'linear-gradient(135deg, #fef9e7, #fef3c7)',
    border: '1px solid #f0c060',
    borderRadius: 20,
    fontSize: 13,
    color: '#92400e',
    fontWeight: 500,
  },
  // Growth narrative
  narrative: {
    background: '#eff6ff',
    borderLeft: '4px solid #4a9eca',
    padding: '14px 18px',
    borderRadius: '0 10px 10px 0',
    marginBottom: 20,
  },
  narrativeTitle: { fontWeight: 700, color: '#1e3a5f', marginBottom: 8, fontSize: 14 },
  narrativeList: {
    margin: 0,
    paddingLeft: 20,
    fontSize: 14,
    color: '#2c4a6a',
    lineHeight: 1.75,
  },
  // Compass card
  compassCard: {
    background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5986 100%)',
    borderRadius: 14,
    padding: '24px 20px',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  compassTitle: {
    color: '#7ec8e3',
    fontWeight: 700,
    fontSize: 16,
    marginBottom: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  compassSub: { color: '#a8c4d8', fontSize: 13, marginBottom: 16, lineHeight: 1.5 },
  // Evolution text
  evolutionBox: {
    background: '#f0f4f8',
    borderLeft: '4px solid #4a9eca',
    padding: '12px 16px',
    borderRadius: '0 8px 8px 0',
    fontSize: 14,
    color: '#2c3e50',
    marginTop: 16,
  },
  // Retake card
  retakeCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '20px 24px',
    textAlign: 'center',
    marginBottom: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  retakeTitle: { fontWeight: 700, fontSize: 16, color: '#1a202c', marginBottom: 6 },
  retakeSub: { fontSize: 13, color: '#718096', marginBottom: 16, lineHeight: 1.5 },
  retakeBtn: {
    display: 'inline-block',
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #4a9eca, #2d5986)',
    color: '#fff',
    borderRadius: 8,
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  // Detail panel
  detailPanel: {
    background: '#fff',
    border: '1px solid #d0dce8',
    borderRadius: 12,
    padding: '20px 24px',
    marginBottom: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  detailTitle: { fontWeight: 700, fontSize: 16, color: '#1a202c', marginBottom: 4 },
  detailDate: { fontSize: 13, color: '#94a3b8', marginBottom: 16 },
  dimScoresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: 10,
    marginBottom: 20,
  },
  dimScoreItem: (color) => ({
    background: '#f8fafc',
    border: `1px solid ${color}30`,
    borderRadius: 8,
    padding: '10px 8px',
    textAlign: 'center',
  }),
  dimScoreLabel: { fontSize: 11, color: '#718096', marginBottom: 4 },
  dimScoreValue: (color) => ({ fontSize: 20, fontWeight: 800, color }),
  dimScoreDelta: { fontSize: 11, marginTop: 2, height: 16 },
  noteLabel: { fontSize: 13, color: '#4a6a82', display: 'block', marginBottom: 6, marginTop: 16 },
  noteArea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #c8d8e8',
    borderRadius: 8,
    fontFamily: 'inherit',
    fontSize: 13,
    resize: 'vertical',
    boxSizing: 'border-box',
    outline: 'none',
    color: '#374151',
    background: '#fafcff',
  },
  saveNoteBtn: {
    marginTop: 8,
    padding: '7px 18px',
    background: '#4a9eca',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  },
  noteStatus: { fontSize: 12, marginLeft: 10, color: '#059669' },
  viewReportLink: {
    display: 'inline-block',
    marginTop: 14,
    color: '#4a9eca',
    fontSize: 13,
    textDecoration: 'none',
    fontWeight: 500,
  },
  // Changes table in compass
  changesTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: 14,
    fontSize: 13,
    textAlign: 'left',
  },
  // Loading / empty states
  loading: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: '#718096',
    fontSize: 15,
  },
  empty: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: '#718096',
  },
  emptyTitle: { fontSize: 22, fontWeight: 700, color: '#1e3a5f', marginBottom: 12 },
  emptySub: { maxWidth: 480, margin: '0 auto 24px', fontSize: 14, lineHeight: 1.7 },
  emptyBtn: {
    display: 'inline-block',
    padding: '12px 28px',
    background: 'linear-gradient(135deg, #4a9eca, #2d5986)',
    color: '#fff',
    borderRadius: 10,
    border: 'none',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  // Sign-in banner
  signInBanner: {
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: 12,
    padding: '16px 24px',
    textAlign: 'center',
    margin: '24px auto',
    maxWidth: 560,
  },
  signInText: { fontSize: 14, color: '#1e40af', marginBottom: 12 },
  signInBtn: {
    padding: '10px 24px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  // Privacy note
  privacyNote: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 10,
    padding: '12px 18px',
    fontSize: 13,
    color: '#166534',
    margin: '0 1.5rem 0',
    maxWidth: 1040,
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: '1.5rem',
  },
  footer: {
    background: '#1e293b',
    color: '#94a3b8',
    textAlign: 'center',
    padding: '28px 24px',
    fontSize: 13,
    marginTop: 40,
    lineHeight: 1.8,
  },
  footerLink: { color: '#7ec8e3', textDecoration: 'none' },
};

// ── Nav items for the Atlas page ──────────────────────────────────────────
const NAV_ITEMS = [
  { href: '/',              label: 'Home',               key: 'home' },
  { href: '/results',       label: 'My Results',         key: 'results' },
  { href: '/atlas',         label: 'Atlas',              key: 'atlas' },
  { href: '/gamification',  label: 'Resilience Journey', key: 'gamification' },
];

// ── Main component ─────────────────────────────────────────────────────────
export default function AtlasJourneyPage() {
  const { isAuthenticated, isLoading: authLoading, loginWithRedirect, getAccessTokenSilently } = useAuth0();

  const [period, setPeriod]                     = useState('all');
  const [data, setData]                         = useState(null);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState(null);
  const [selectedIdx, setSelectedIdx]           = useState(0);
  const [noteValue, setNoteValue]               = useState('');
  const [noteStatus, setNoteStatus]             = useState('');
  const [isMobile, setIsMobile]                 = useState(() => typeof window !== 'undefined' && window.innerWidth < 800);
  const noteStatusTimer                          = useRef(null);

  // ── Responsive layout ────────────────────────────────────────────────────
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 800);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Auth header ──────────────────────────────────────────────────────────
  const getHeaders = useCallback(async () => {
    const headers = { 'Content-Type': 'application/json' };
    try {
      const token = await getAccessTokenSilently();
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch (_) {
      const stored = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (stored) headers.Authorization = `Bearer ${stored}`;
    }
    return headers;
  }, [getAccessTokenSilently]);

  // ── Fetch timeline ────────────────────────────────────────────────────────
  const fetchTimeline = useCallback(async (p) => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/history/timeline?period=${p || 'all'}`, { headers });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const json = await res.json();
      setData(json);
      setSelectedIdx(0);
      const first = (json.assessments || [])[0];
      setNoteValue(first?.notes || first?.userNote || '');
    } catch (err) {
      setError('Unable to load your assessment history. Please try again.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTimeline(period);
    }
  }, [isAuthenticated, period, fetchTimeline]);

  // ── Select assessment ────────────────────────────────────────────────────
  function selectAssessment(idx) {
    setSelectedIdx(idx);
    const a = assessments[idx];
    setNoteValue(a?.notes || a?.userNote || '');
    setNoteStatus('');
  }

  // ── Save note ────────────────────────────────────────────────────────────
  async function saveNote() {
    const a = assessments[selectedIdx];
    if (!a?._id) return;
    setNoteStatus('Saving…');
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/history/${a._id}/note`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ note: noteValue }),
      });
      if (res.ok) {
        // Update in-memory
        if (data) {
          const updated = data.assessments.map((x, i) =>
            i === selectedIdx ? { ...x, notes: noteValue, userNote: noteValue } : x
          );
          setData({ ...data, assessments: updated });
        }
        if (noteStatusTimer.current) clearTimeout(noteStatusTimer.current);
        setNoteStatus('Saved!');
        noteStatusTimer.current = setTimeout(() => setNoteStatus(''), 3000);
      } else {
        setNoteStatus('Could not save.');
      }
    } catch (_) {
      setNoteStatus('Network error.');
    }
  }

  // ── Derived data ─────────────────────────────────────────────────────────
  const assessments  = data?.assessments || [];
  const timeline     = data?.timeline    || {};
  const narrative    = data?.narrative   || [];
  const milestones   = timeline?.milestones || [];

  const selected   = assessments[selectedIdx] || null;
  const prevAssmt  = assessments[selectedIdx + 1] || null;

  // Compass: overall direction
  function getEvolutionText() {
    if (!selected) return null;
    if (!prevAssmt) return "You've mapped the first point on The Resilience Atlas™. Return in 30 days to see how your resilience evolves.";
    const delta = ((selected.overall || 0) - (prevAssmt.overall || 0)).toFixed(1);
    if (Math.abs(parseFloat(delta)) < 0.5) return 'Your overall score was stable between these two assessments.';
    const sign = delta > 0 ? '+' : '';
    return `Overall change: ${sign}${delta} points since the previous assessment.`;
  }

  const evolutionText = getEvolutionText();

  // Loading state
  if (authLoading) {
    return (
      <div style={s.page}>
        <SiteHeader activePage="atlas" navItems={NAV_ITEMS} />
        <DarkModeHint />
        <div style={s.loading}><p>Loading…</p></div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div style={s.page}>
        <SiteHeader activePage="atlas" navItems={NAV_ITEMS} />
        <DarkModeHint />
        <section style={s.hero}>
          <h1 style={s.heroTitle}>🗺 The Resilience Atlas™</h1>
          <p style={s.heroSub}>Navigate your resilience journey. Each assessment marks a new point on your personal atlas.</p>
        </section>
        <div style={s.signInBanner}>
          <p style={s.signInText}>🔐 Sign in to view your assessment history and track your resilience journey over time.</p>
          <button
            style={s.signInBtn}
            onClick={() => loginWithRedirect({ appState: { returnTo: '/atlas' } })}
          >
            Sign In to View Your Atlas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <SiteHeader activePage="atlas" navItems={NAV_ITEMS} />
      <DarkModeHint />

      {/* Hero */}
      <section style={s.hero} role="banner">
        <h1 style={s.heroTitle}>🗺 The Resilience Atlas™</h1>
        <p style={s.heroSub}>
          Navigate your resilience journey. Each assessment marks a new point on your
          personal atlas — tracking how your resilience evolves over time.
        </p>
      </section>

      {/* Period filter */}
      {!loading && assessments.length > 0 && (
        <div style={s.periodBar} role="group" aria-label="Filter by time period">
          {[
            { label: 'Last 30 Days', value: '30d' },
            { label: 'Last 90 Days', value: '90d' },
            { label: 'Last Year',    value: '1y'  },
            { label: 'All Time',     value: 'all' },
          ].map(({ label, value }) => (
            <button
              key={value}
              style={s.periodBtn(period === value)}
              onClick={() => setPeriod(value)}
              aria-pressed={period === value}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <main>
        {/* Loading */}
        {loading && (
          <div style={s.loading} role="status" aria-live="polite">
            <p>Loading your resilience history…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ ...s.loading, color: '#DC2626' }} role="alert">
            <p>{error}</p>
            <button
              style={{ ...s.retakeBtn, marginTop: 16 }}
              onClick={() => fetchTimeline(period)}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && assessments.length === 0 && (
          <div style={s.empty} role="region" aria-label="No assessments found">
            <h2 style={s.emptyTitle}>Your Atlas Awaits</h2>
            <p style={s.emptySub}>
              Complete your first assessment to map the first point on The Resilience Atlas™.
              Every retake adds a new data point to your longitudinal resilience journey.
            </p>
            <a href="/quiz" style={s.emptyBtn}>Take the Assessment</a>
          </div>
        )}

        {/* Main content */}
        {!loading && !error && assessments.length > 0 && (
          <div
            style={{
              ...s.grid,
              gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,2fr) minmax(0,1fr)',
            }}
            role="region"
            aria-label="Atlas journey content"
          >
            {/* ── Left column ───────────────────────────────────── */}
            <div style={s.leftCol}>

              {/* Milestone badges */}
              {milestones.length > 0 && (
                <div style={s.card} role="region" aria-label="Your milestones">
                  <div style={s.cardTitle}>
                    <BrandIcon name="star" size={17} color="#D97706" />
                    Your Milestones
                  </div>
                  <div style={s.milestoneStrip}>
                    {milestones.map((m, i) => (
                      <span key={i} style={s.milestoneBadge}>
                        <img src="/icons/badge.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        {m.title || m.type || String(m)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Growth narrative */}
              {narrative.length > 0 && (
                <div style={s.narrative} role="region" aria-label="Growth narrative">
                  <div style={s.narrativeTitle}>📖 Your Growth Story</div>
                  <ul style={s.narrativeList}>
                    {narrative.map((item, i) => (
                      <li key={i}>
                        {typeof item === 'object'
                          ? (item.text || item.message || item.dimension || JSON.stringify(item))
                          : String(item)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Assessment history timeline */}
              <div style={s.card} role="region" aria-label="Assessment history">
                <div style={s.cardTitle}>
                  <BrandIcon name="clock" size={17} color="#4a9eca" />
                  Assessment History
                </div>
                <p style={s.cardSub}>
                  Your {assessments.length} assessment{assessments.length !== 1 ? 's' : ''},
                  newest first. Click any entry to view details.
                </p>
                <ul style={s.tlList} aria-label="Assessment timeline">
                  <div style={s.tlListLine} aria-hidden="true" />
                  {assessments.map((a, idx) => {
                    const overall = Math.round(a.overall || 0);
                    const color   = scoreColor(overall);
                    const topDim  = DIMS.filter(d => a.scores?.[d] != null)
                      .sort((x, y) => (a.scores[y] || 0) - (a.scores[x] || 0))
                      .slice(0, 3)
                      .map(d => DIM_SHORT[d])
                      .join(', ');
                    const isSelected = idx === selectedIdx;
                    const prev = assessments[idx + 1];
                    const overallDelta = prev
                      ? Math.round((a.overall || 0) - (prev.overall || 0))
                      : null;

                    return (
                      <li
                        key={a._id || idx}
                        style={s.tlItem(isSelected)}
                        onClick={() => selectAssessment(idx)}
                        role="button"
                        tabIndex={0}
                        aria-selected={isSelected}
                        aria-label={`Assessment ${idx + 1}: score ${overall}% on ${fmtDate(a.assessmentDate)}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            selectAssessment(idx);
                          }
                        }}
                      >
                        <span style={s.tlDot(color)} aria-hidden="true" />
                        <div style={s.tlBody}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={s.tlScore(color)}>{overall}%</span>
                            {overallDelta !== null && <DeltaBadge delta={overallDelta} />}
                            {idx === 0 && assessments.length === 1 && (
                              <span style={s.tlBadge}>First Assessment 🎯</span>
                            )}
                          </div>
                          {a.dominantType && (
                            <div style={s.tlType}>{a.dominantType}</div>
                          )}
                          <div style={s.tlDate}>{fmtDate(a.assessmentDate)}</div>
                          {topDim && <div style={s.tlTop3}>Top: {topDim}</div>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Detail panel for selected assessment */}
              {selected && (
                <div style={s.detailPanel} role="region" aria-live="polite" aria-label="Assessment details">
                  <div style={s.detailTitle}>
                    Assessment — {fmtDate(selected.assessmentDate)}
                    {selected.dominantType && ` · ${selected.dominantType}`}
                  </div>
                  <div style={s.detailDate}>
                    Overall score: <strong style={{ color: scoreColor(Math.round(selected.overall || 0)) }}>
                      {Math.round(selected.overall || 0)}%
                    </strong>
                  </div>

                  {/* Dimension scores grid */}
                  <div style={s.dimScoresGrid}>
                    {DIMS.map(dim => {
                      const score = selected.scores?.[dim];
                      const prevScore = prevAssmt?.scores?.[dim];
                      const delta = prevScore != null && score != null
                        ? Math.round(score - prevScore)
                        : null;
                      const color = DIM_COLORS[dim] || '#4F46E5';
                      if (score == null) return null;
                      return (
                        <div key={dim} style={s.dimScoreItem(color)}>
                          <div style={s.dimScoreLabel}>
                            {DIM_ICONS[dim] && (
                              <img src={DIM_ICONS[dim]} alt="" aria-hidden="true"
                                width="12" height="12"
                                style={{ verticalAlign: 'middle', marginRight: 2 }} />
                            )}
                            {DIM_SHORT[dim]}
                          </div>
                          <div style={s.dimScoreValue(color)}>{Math.round(score)}%</div>
                          <div style={s.dimScoreDelta}>
                            <DeltaBadge delta={delta} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Radar chart */}
                  {selected.scores && (
                    <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#4a6a82', marginBottom: 8 }}>
                        Dimension Profile
                      </div>
                      <RadarChart scores={selected.scores} />
                    </div>
                  )}

                  {/* Note */}
                  <label htmlFor="assessmentNote" style={s.noteLabel}>
                    Personal note (optional):
                  </label>
                  <textarea
                    id="assessmentNote"
                    style={s.noteArea}
                    rows={3}
                    maxLength={2000}
                    placeholder="Jot down how you were feeling, what was going on in your life…"
                    value={noteValue}
                    onChange={e => setNoteValue(e.target.value)}
                    aria-describedby="noteCharCount"
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                    <span id="noteCharCount" style={{ fontSize: 11, color: noteValue.length >= 1800 ? '#DC2626' : '#94a3b8' }}>
                      {noteValue.length}/2000
                    </span>
                  </div>
                  <div>
                    <button style={s.saveNoteBtn} onClick={saveNote}>Save Note</button>
                    {noteStatus && (
                      <span
                        style={{
                          ...s.noteStatus,
                          color: noteStatus === 'Saved!' ? '#059669' : '#DC2626',
                        }}
                        aria-live="polite"
                      >
                        {noteStatus}
                      </span>
                    )}
                  </div>

                  {selected._id && (
                    <a
                      href={`/results?id=${selected._id}`}
                      style={s.viewReportLink}
                    >
                      View full report ↗
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* ── Right column ──────────────────────────────────── */}
            <div style={s.rightCol}>

              {/* Evolution Compass */}
              <div style={s.compassCard} role="region" aria-label="Resilience compass">
                <div style={s.compassTitle}>
                  <BrandIcon name="compass" size={18} color="#7ec8e3" />
                  Resilience Compass
                </div>
                <p style={s.compassSub}>
                  Your current resilience profile across all six dimensions.
                  {prevAssmt && ' Faint outline shows your previous assessment.'}
                </p>

                {selected?.scores && (
                  <EvolutionCompass
                    scores={selected.scores}
                    previousScores={prevAssmt?.scores}
                  />
                )}

                {/* Per-dimension changes */}
                {selected?.scores && (
                  <table style={s.changesTable} aria-label="Dimension score changes">
                    <tbody>
                      {DIMS.map(dim => {
                        const curr = selected.scores?.[dim];
                        const prev = prevAssmt?.scores?.[dim];
                        const delta = prev != null && curr != null ? Math.round(curr - prev) : null;
                        const color = DIM_COLORS[dim] || '#4F46E5';
                        if (curr == null) return null;
                        return (
                          <tr key={dim}>
                            <td style={{ color: '#a8c4d8', fontSize: 12, padding: '3px 0', width: '65%' }}>
                              {DIM_SHORT[dim]}
                            </td>
                            <td style={{ fontWeight: 700, fontSize: 13, color, textAlign: 'right', padding: '3px 0' }}>
                              {Math.round(curr)}%
                            </td>
                            <td style={{ textAlign: 'right', paddingLeft: 8, fontSize: 12, minWidth: 36 }}>
                              {delta !== null ? (
                                <span style={{ color: delta > 0 ? '#7fba8f' : delta < 0 ? '#e07060' : '#a8c4d8', fontWeight: 700 }}>
                                  {delta > 0 ? `+${delta}` : delta < 0 ? String(delta) : '—'}
                                </span>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {evolutionText && (
                  <div style={s.evolutionBox} role="status">
                    {evolutionText}
                  </div>
                )}
              </div>

              {/* Retake encouragement */}
              <div style={s.retakeCard} role="complementary" aria-label="Retake encouragement">
                <div style={s.retakeTitle}>Continue Your Journey</div>
                <p style={s.retakeSub}>
                  Retake the assessment in 30 days to track how your resilience evolves.
                </p>
                <a href="/quiz" style={s.retakeBtn}>Retake Assessment</a>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Privacy note */}
      <div style={s.privacyNote} role="note" aria-label="Data privacy guarantee">
        <span aria-hidden="true">
          <img src="/icons/lock.svg" alt="" width={14} height={14} style={{ verticalAlign: 'middle' }} />
        </span>
        <span>
          <strong>You control your data.</strong>{' '}
          Delete your account and results anytime —{' '}
          <a href="/about" style={{ color: '#059669', fontWeight: 500 }}>learn more</a>.
        </span>
      </div>

      {/* Footer */}
      <footer style={s.footer} role="contentinfo">
        <p style={{ margin: 0 }}>
          &copy; {new Date().getFullYear()} The Resilience Atlas&#8482;
          {' '}·{' '}
          <a href="/about" style={s.footerLink}>About</a>
          {' '}·{' '}
          <a href="/results" style={s.footerLink}>My Results</a>
        </p>
        <p style={{ margin: '4px 0 0' }}>
          The Resilience Atlas&#8482; is a trademark of Janeen Molchany Ph.D., BCBA.
          For educational and self-reflection purposes only. Not a clinical assessment.
        </p>
      </footer>
    </div>
  );
}
