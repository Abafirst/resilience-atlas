/**
 * AtlasPage.jsx — Resilience Atlas longitudinal tracking hub.
 *
 * Displays a user's full assessment history, an evolution compass,
 * per-assessment detail panels, growth narrative, and milestone badges.
 * Styled to match ResultsPage.jsx exactly (inline `s` object, DIM_COLORS,
 * DIM_ICONS, card patterns, header).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

// ── Dimension accent colours (mirror ResultsPage.jsx) ───────────────────────
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

// Milestone badge display config
const MILESTONE_META = {
  first_assessment:         { icon: '🗺️', label: 'First Assessment',        color: '#4F46E5' },
  '3_month_streak':         { icon: '🔥', label: '3-Month Streak',           color: '#D97706' },
  '100pt_improvement':      { icon: '🚀', label: '100-Point Growth',         color: '#059669' },
  consistent_high_performer:{ icon: '⭐', label: 'Consistent High Performer', color: '#7C3AED' },
};
function milestoneDisplay(type) {
  if (MILESTONE_META[type]) return MILESTONE_META[type];
  if (type.startsWith('perfect_')) {
    const dim = type.replace('perfect_', '');
    return { icon: '💎', label: `Perfect: ${dim}`, color: DIM_COLORS[dim] || '#4a90d9' };
  }
  return { icon: '🏅', label: type, color: '#4a90d9' };
}

// ── Evolution Compass helpers ────────────────────────────────────────────────
/**
 * Compute a compass bearing (0–360°) from dimension deltas.
 * Mapping (per spec):
 *   North (0°)   = Cognitive-Narrative
 *   East  (90°)  = Relational-Connective
 *   South (180°) = Somatic-Regulative
 *   West  (270°) = Emotional-Adaptive + Spiritual-Reflective (avg)
 * Agentic-Generative adds NE pressure.
 */
function computeCompass(latest, previous) {
  if (!latest || !previous) return { angle: 0, magnitude: 0, label: 'N', description: 'No change data yet' };

  const delta = (dim) => ((latest.scores?.[dim] ?? 0) - (previous.scores?.[dim] ?? 0));

  const north  = delta('Cognitive-Narrative');
  const east   = delta('Relational-Connective');
  const south  = -(delta('Somatic-Regulative'));   // south = increase in somatic grounds downward
  const west   = -((delta('Emotional-Adaptive') + delta('Spiritual-Reflective')) / 2);
  const ne     = delta('Agentic-Generative') * 0.5;

  // Convert to x/y (east=+x, north=+y)
  const x = east - west + ne * 0.707;
  const y = north - south + ne * 0.707;

  const magnitude = Math.min(10, Math.round(Math.sqrt(x * x + y * y) * 0.3));

  // Angle: 0° = North, 90° = East
  let angle = Math.atan2(x, y) * (180 / Math.PI);
  if (angle < 0) angle += 360;
  angle = Math.round(angle);

  // Direction label
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  const label = dirs[Math.round(angle / 45) % 8];

  const descriptions = {
    N:  'Growth in cognitive clarity and narrative strength',
    NE: 'Expanding cognitive insight with relational connection',
    E:  'Expansion in relational and social resilience',
    SE: 'Relational growth with somatic grounding',
    S:  'Deepening somatic regulation and physical grounding',
    SW: 'Integrating emotional and somatic capacities',
    W:  'Emotional and spiritual integration deepening',
    NW: 'Spiritual depth blending with cognitive clarity',
  };

  return { angle, magnitude, label, description: descriptions[label] || '' };
}

// ── Utility ──────────────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function timeSince(d) {
  if (!d) return '';
  const ms = Date.now() - new Date(d).getTime();
  const days = Math.floor(ms / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30)  return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  if (months < 12)  return `${months} months ago`;
  const years = Math.floor(months / 12);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

function topDims(scores, n = 3) {
  if (!scores) return [];
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([dim]) => dim);
}

// ── Styles (inline, matching ResultsPage) ────────────────────────────────────
const s = {
  // ── Site Header ──
  siteHeader: {
    background: 'rgba(255,255,255,0.97)',
    borderBottom: '1px solid #e2e8f0',
    backdropFilter: 'blur(10px)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    padding: '0 24px',
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
  },
  headerInner: {
    maxWidth: 1100,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 62,
    gap: 16,
  },
  headerLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: '#1a202c',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: 15,
    flexShrink: 0,
  },
  headerNav: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'wrap',
  },
  navLink: {
    color: '#4a5568',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 500,
  },
  navLinkActive: {
    color: '#4F46E5',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 700,
    borderBottom: '2px solid #4F46E5',
    paddingBottom: 2,
  },
  retakeBtn: {
    padding: '7px 16px',
    background: 'rgba(79,70,229,0.1)',
    color: '#4F46E5',
    border: '1px solid rgba(79,70,229,0.4)',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
  },
  // ── Page layout ──
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #fafbff 60%, #f0fbff 100%)',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: '#1a202c',
    padding: '40px 20px 80px',
  },
  container: {
    maxWidth: 980,
    margin: '0 auto',
  },
  // ── Hero header ──
  heroCard: {
    background: 'linear-gradient(135deg, #4a90d9 0%, #4F46E5 60%, #7C3AED 100%)',
    borderRadius: 16,
    padding: '36px 32px 28px',
    marginBottom: 28,
    color: '#fff',
    position: 'relative',
    overflow: 'hidden',
  },
  heroEmoji: { fontSize: 36, marginBottom: 8, display: 'block' },
  heroTitle: { fontSize: 28, fontWeight: 700, marginBottom: 6, lineHeight: 1.2 },
  heroSub: { fontSize: 15, opacity: 0.85, lineHeight: 1.5, maxWidth: 560 },
  // ── Card ──
  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '24px 28px',
    marginBottom: 24,
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
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
  cardSubtitle: { fontSize: 13, color: '#718096', marginBottom: 16 },
  // ── Period filters ──
  periodBar: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  periodBtn: (active) => ({
    padding: '7px 16px',
    borderRadius: 8,
    border: active ? '1px solid #4F46E5' : '1px solid #e2e8f0',
    background: active ? '#4F46E5' : '#ffffff',
    color: active ? '#ffffff' : '#4a5568',
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    minHeight: 36,
  }),
  // ── Timeline ──
  timelineList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  timelineItem: (selected) => ({
    display: 'flex',
    gap: 14,
    padding: '14px 16px',
    borderRadius: 10,
    marginBottom: 8,
    cursor: 'pointer',
    background: selected ? '#f0f7ff' : 'transparent',
    border: selected ? '1px solid rgba(74,144,217,0.35)' : '1px solid transparent',
    transition: 'all 0.15s ease',
  }),
  timelineDot: (color) => ({
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
    marginTop: 4,
  }),
  timelineDate: { fontSize: 13, fontWeight: 600, color: '#1a202c', marginBottom: 2 },
  timelineScore: { fontSize: 22, fontWeight: 800, color: '#4F46E5', lineHeight: 1 },
  timelineScoreLabel: { fontSize: 11, color: '#718096', marginLeft: 4 },
  timelineMeta: { fontSize: 12, color: '#718096', marginTop: 4 },
  timelineDimChips: { display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 },
  dimChip: (color) => ({
    fontSize: 11,
    fontWeight: 600,
    color,
    background: `${color}18`,
    border: `1px solid ${color}40`,
    borderRadius: 4,
    padding: '2px 6px',
  }),
  // ── Detail panel ──
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  detailScore: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4a90d9, #4F46E5)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  detailScoreNum: { fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1 },
  detailScorePct: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  dimRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  dimIcon: { width: 18, height: 18, flexShrink: 0 },
  dimLabel: { minWidth: 180, fontSize: 13, color: '#374151', fontWeight: 500 },
  dimBarWrap: {
    flex: 1,
    background: '#e2e8f0',
    borderRadius: 4,
    height: 8,
    overflow: 'hidden',
    minWidth: 80,
  },
  dimBarFill: (color, pct) => ({
    width: `${Math.min(100, Math.max(0, pct))}%`,
    height: '100%',
    background: color,
    borderRadius: 4,
    transition: 'width 0.6s ease',
  }),
  dimPct: { minWidth: 36, textAlign: 'right', fontSize: 13, color: '#718096' },
  dimDelta: (delta) => ({
    minWidth: 42,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: 600,
    color: delta > 0 ? '#059669' : delta < 0 ? '#DC2626' : '#718096',
  }),
  // ── Compass ──
  compassWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 0',
  },
  compassLabel: {
    fontSize: 13,
    color: '#718096',
    marginTop: 12,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 1.5,
  },
  compassBearing: { fontSize: 22, fontWeight: 800, color: '#4F46E5', marginTop: 8 },
  compassMag: { fontSize: 13, color: '#718096' },
  // ── Notes ──
  noteArea: {
    width: '100%',
    minHeight: 80,
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 13,
    color: '#1a202c',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    resize: 'vertical',
    boxSizing: 'border-box',
    outline: 'none',
    marginBottom: 8,
  },
  saveBtn: {
    padding: '7px 18px',
    background: '#4F46E5',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  saveBtnDisabled: {
    padding: '7px 18px',
    background: '#a5b4fc',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'not-allowed',
  },
  // ── Narrative ──
  narrativeLine: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 1.7,
    padding: '8px 0',
    borderBottom: '1px solid #f0f4ff',
  },
  // ── Milestone badges ──
  badgeGrid: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  badge: (color) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    background: `${color}12`,
    border: `1px solid ${color}40`,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    color,
  }),
  // ── Empty state ──
  emptyCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '56px 32px',
    textAlign: 'center',
    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 24, fontWeight: 700, marginBottom: 12, color: '#1a202c' },
  emptyDesc: { color: '#718096', fontSize: 15, marginBottom: 32, lineHeight: 1.6, maxWidth: 440, margin: '0 auto 32px' },
  primaryBtn: {
    display: 'inline-block',
    padding: '12px 28px',
    background: '#4F46E5',
    color: '#fff',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    textDecoration: 'none',
    boxShadow: '0 4px 12px rgba(79,70,229,0.25)',
  },
  // ── Loading / error ──
  loadingWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    gap: 16,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #4F46E5',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { fontSize: 15, color: '#718096' },
  errorCard: {
    background: '#fff0f0',
    border: '1px solid #fecaca',
    borderRadius: 14,
    padding: '28px 24px',
    textAlign: 'center',
    color: '#991b1b',
    fontSize: 14,
    lineHeight: 1.6,
  },
  // ── Two-column layout ──
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: 24,
    alignItems: 'start',
  },
  gridSingle: {
    gridColumn: '1 / -1',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#4a90d9',
    marginBottom: 8,
  },
  promptCard: {
    background: '#f0f7ff',
    border: '1px solid rgba(74,144,217,0.25)',
    borderRadius: 10,
    padding: '14px 16px',
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 1.6,
  },
};

// ── Compass SVG component ──────────────────────────────────────────────────────
function CompassSVG({ angle, magnitude }) {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r  = 70;

  // Needle tip pointing in `angle` degrees (0 = North = up)
  const rad = (angle - 90) * (Math.PI / 180);
  const nx  = cx + r * Math.cos(rad);
  const ny  = cy + r * Math.sin(rad);
  // Opposite tail
  const tx  = cx - (r * 0.45) * Math.cos(rad);
  const ty  = cy - (r * 0.45) * Math.sin(rad);

  // 8 tick marks
  const tickLabels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const ticks = tickLabels.map((lbl, i) => {
    const a = (i * 45 - 90) * (Math.PI / 180);
    const isCardinal = i % 2 === 0;
    const innerR = isCardinal ? r - 10 : r - 6;
    const outerR = r + 2;
    const lx = cx + (r + 16) * Math.cos(a);
    const ly = cy + (r + 16) * Math.sin(a);
    return { lbl, a, innerR, outerR, lx, ly, isCardinal };
  });

  // Magnitude ring (0–10)
  const magR = (magnitude / 10) * (r - 16);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`Evolution compass pointing ${tickLabels[Math.round(angle / 45) % 8]}, magnitude ${magnitude} out of 10`}
      role="img"
    >
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
      {/* Background circle */}
      <circle cx={cx} cy={cy} r={r} fill="#f8fafc" />
      {/* Magnitude ring */}
      {magR > 0 && (
        <circle cx={cx} cy={cy} r={magR} fill="rgba(79,70,229,0.08)" />
      )}
      {/* Tick marks and labels */}
      {ticks.map(({ lbl, a, innerR, outerR, lx, ly, isCardinal }) => (
        <g key={lbl}>
          <line
            x1={cx + innerR * Math.cos(a)}
            y1={cy + innerR * Math.sin(a)}
            x2={cx + outerR * Math.cos(a)}
            y2={cy + outerR * Math.sin(a)}
            stroke={isCardinal ? '#94a3b8' : '#cbd5e1'}
            strokeWidth={isCardinal ? 1.5 : 1}
          />
          <text
            x={lx}
            y={ly + 4}
            textAnchor="middle"
            fontSize={isCardinal ? 9 : 7}
            fill={isCardinal ? '#64748b' : '#94a3b8'}
            fontWeight={isCardinal ? 700 : 400}
            fontFamily="'Inter', sans-serif"
          >
            {lbl}
          </text>
        </g>
      ))}
      {/* Center cross */}
      <line x1={cx - 8} y1={cy} x2={cx + 8} y2={cy} stroke="#e2e8f0" strokeWidth="1" />
      <line x1={cx} y1={cy - 8} x2={cx} y2={cy + 8} stroke="#e2e8f0" strokeWidth="1" />
      {/* Needle tail (south side, gray) */}
      <line x1={cx} y1={cy} x2={tx} y2={ty} stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      {/* Needle head (indigo, pointing toward growth direction) */}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#4F46E5" strokeWidth="3" strokeLinecap="round" />
      {/* Arrowhead */}
      <circle cx={nx} cy={ny} r={4} fill="#4F46E5" />
      {/* Center hub */}
      <circle cx={cx} cy={cy} r={5} fill="#fff" stroke="#4F46E5" strokeWidth="2" />
    </svg>
  );
}

// ── Main AtlasPage component ──────────────────────────────────────────────────
export default function AtlasPage() {
  const { isLoading: authLoading, isAuthenticated, loginWithRedirect, getAccessTokenSilently } = useAuth0();

  const [period, setPeriod]               = useState('all');
  const [data, setData]                   = useState(null);   // { assessments, timeline, narrative }
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [selectedIdx, setSelectedIdx]     = useState(0);      // index into assessments[]
  const [note, setNote]                   = useState('');
  const [noteSaving, setNoteSaving]       = useState(false);
  const [noteSaved, setNoteSaved]         = useState(false);

  // ── Fetch timeline ──────────────────────────────────────────────────────────
  const fetchTimeline = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(`/api/history/timeline?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      setSelectedIdx(0);
      setNote('');
    } catch (err) {
      setError(err.message || 'Could not load your assessment history.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, period, getAccessTokenSilently]);

  useEffect(() => {
    if (!authLoading) fetchTimeline();
  }, [authLoading, fetchTimeline]);

  // ── Save note ───────────────────────────────────────────────────────────────
  const saveNote = async () => {
    if (!data?.assessments?.length) return;
    const assessment = data.assessments[selectedIdx];
    if (!assessment) return;
    setNoteSaving(true);
    setNoteSaved(false);
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(`/api/history/${assessment._id}/note`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not save note.');
      }
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 3000);
    } catch (err) {
      // Non-critical — show inline message
      setNoteSaved(false);
    } finally {
      setNoteSaving(false);
    }
  };

  // ── Redirect to login ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      loginWithRedirect({ appState: { returnTo: '/atlas' } });
    }
  }, [authLoading, isAuthenticated, loginWithRedirect]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (authLoading || (loading && !data)) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <header style={s.siteHeader} role="banner">
          <div style={s.headerInner}>
            <a href="/" style={s.headerLogo}>
              <img src="/assets/compass-icon.svg" alt="The Resilience Atlas™" width="32" height="32" />
              The Resilience Atlas&#8482;
            </a>
          </div>
        </header>
        <div style={s.loadingWrap}>
          <div style={s.loadingSpinner} aria-hidden="true" />
          <p style={s.loadingText}>Loading your resilience journey…</p>
        </div>
      </div>
    );
  }

  const assessments = data?.assessments ?? [];
  const timeline    = data?.timeline ?? {};
  const narrative   = data?.narrative ?? [];
  const milestones  = timeline.milestones ?? [];
  const selected    = assessments[selectedIdx] ?? null;
  const previous    = assessments[selectedIdx + 1] ?? null;
  const compass     = computeCompass(selected, previous);

  const PERIODS = [
    { key: '30d', label: 'Last 30 Days' },
    { key: '90d', label: 'Last 90 Days' },
    { key: '1y',  label: 'Last Year' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", color: '#1a202c' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 700px) {
          .atlas-grid { grid-template-columns: 1fr !important; }
          .atlas-header-nav { display: none !important; }
        }
      `}</style>

      {/* ── Site Header ── */}
      <header style={s.siteHeader} role="banner">
        <div style={s.headerInner}>
          <a href="/" style={s.headerLogo}>
            <img src="/assets/compass-icon.svg" alt="The Resilience Atlas™" width="32" height="32" />
            The Resilience Atlas&#8482;
          </a>
          <nav style={s.headerNav} className="atlas-header-nav" aria-label="Main navigation">
            <a href="/"              style={s.navLink}>Home</a>
            <a href="/results"       style={s.navLink}>My Results</a>
            <a href="/atlas"         style={s.navLinkActive} aria-current="page">Atlas</a>
            <a href="/gamification"  style={s.navLink}>Resilience Journey</a>
            <a href="/quiz"          style={s.retakeBtn}>Take Assessment</a>
          </nav>
        </div>
      </header>

      {/* ── Page body ── */}
      <div style={s.page}>
        <div style={s.container}>

          {/* ── Hero banner ── */}
          <section style={s.heroCard} aria-label="Atlas overview">
            <span style={s.heroEmoji} aria-hidden="true">🗺️</span>
            <h1 style={s.heroTitle}>Your Resilience Atlas</h1>
            <p style={s.heroSub}>
              Track how your resilience constellation evolves over time — see where you've grown,
              celebrate your milestones, and discover your next growth edge.
            </p>
            {timeline.totalAssessments > 0 && (
              <p style={{ marginTop: 12, fontSize: 13, opacity: 0.75 }}>
                📅 {timeline.totalAssessments} assessment{timeline.totalAssessments !== 1 ? 's' : ''}
                {timeline.firstAssessment && ` · first on ${formatDate(timeline.firstAssessment)}`}
                {timeline.lastAssessment  && ` · last on ${formatDate(timeline.lastAssessment)}`}
              </p>
            )}
          </section>

          {/* ── Error state ── */}
          {error && (
            <div style={s.errorCard} role="alert">
              <strong>Unable to load your history.</strong>
              <br />{error}
              <br />
              <button
                onClick={fetchTimeline}
                style={{ marginTop: 12, ...s.saveBtn }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* ── Empty state ── */}
          {!error && !loading && assessments.length === 0 && (
            <div style={s.emptyCard} role="region" aria-label="Your Atlas Awaits">
              <div style={s.emptyIcon} aria-hidden="true">🧭</div>
              <h2 style={s.emptyTitle}>Your Atlas Awaits</h2>
              <p style={s.emptyDesc}>
                Complete your first assessment to map the first point on The Resilience Atlas&#8482;.
                Every retake adds a new data point to your longitudinal resilience journey.
              </p>
              <a href="/quiz" style={s.primaryBtn}>Take the Assessment</a>
            </div>
          )}

          {/* ── Main content (has assessments) ── */}
          {!error && assessments.length > 0 && (
            <>
              {/* ── Period filter ── */}
              <nav style={s.periodBar} aria-label="Filter by time period">
                {PERIODS.map(p => (
                  <button
                    key={p.key}
                    style={s.periodBtn(period === p.key)}
                    onClick={() => setPeriod(p.key)}
                    aria-pressed={period === p.key}
                    aria-label={`Show ${p.label}`}
                  >
                    {p.label}
                  </button>
                ))}
              </nav>

              {/* ── Milestone badges ── */}
              {milestones.length > 0 && (
                <section style={s.card} aria-label="Your milestone badges">
                  <div style={s.sectionLabel}>✨ Milestones Reached</div>
                  <div style={s.badgeGrid}>
                    {milestones.map((m) => {
                      const meta = milestoneDisplay(m.type);
                      return (
                        <div key={m.type} style={s.badge(meta.color)} role="img" aria-label={`Milestone: ${meta.label}`} title={m.description || meta.label}>
                          <span aria-hidden="true">{meta.icon}</span>
                          {meta.label}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ── Growth narrative ── */}
              {narrative.length > 0 && (
                <section style={s.card} aria-label="Your growth narrative">
                  <div style={s.cardTitle}>
                    <span aria-hidden="true">✨</span> Your Growth Story
                  </div>
                  <div>
                    {narrative.map((line, i) => (
                      <p key={i} style={s.narrativeLine}>{line}</p>
                    ))}
                  </div>
                  {assessments.length > 0 && assessments.length < 2 && (
                    <p style={{ ...s.promptCard, marginTop: 16 }}>
                      🔁 <strong>Return in 30 days</strong> to add your next data point and see how your resilience constellation continues to evolve.
                    </p>
                  )}
                </section>
              )}

              {/* ── Two-column: timeline + compass/detail ── */}
              <div
                style={{ ...s.grid, gridTemplateColumns: '1fr 320px' }}
                className="atlas-grid"
              >
                {/* Left: Timeline */}
                <section style={s.card} aria-label="Assessment history timeline">
                  <div style={s.cardTitle}>
                    <span aria-hidden="true">📅</span> Assessment History
                  </div>
                  <p style={s.cardSubtitle}>
                    {assessments.length} assessment{assessments.length !== 1 ? 's' : ''} — click any entry to view details.
                  </p>
                  <ul style={s.timelineList} role="list" aria-label="Assessment timeline">
                    {assessments.map((a, i) => {
                      const topDimensions = topDims(a.scores, 3);
                      const dotColor = DIM_COLORS[topDimensions[0]] || '#4F46E5';
                      const isSelected = i === selectedIdx;
                      return (
                        <li
                          key={a._id || i}
                          style={s.timelineItem(isSelected)}
                          onClick={() => { setSelectedIdx(i); setNote(a.notes || a.note || ''); setNoteSaved(false); }}
                          role="button"
                          tabIndex={0}
                          aria-pressed={isSelected}
                          aria-label={`Assessment from ${formatDate(a.assessmentDate)}, overall score ${a.overall}`}
                          onKeyDown={(e) => e.key === 'Enter' && setSelectedIdx(i)}
                        >
                          <div style={s.timelineDot(dotColor)} aria-hidden="true" />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                              <span style={s.timelineScore}>{a.overall}</span>
                              <span style={s.timelineScoreLabel}>/ 600</span>
                              <span style={{ flex: 1 }} />
                              <span style={{ fontSize: 12, color: '#718096' }}>{timeSince(a.assessmentDate)}</span>
                            </div>
                            <div style={s.timelineDate}>{formatDate(a.assessmentDate)}</div>
                            <div style={s.timelineDimChips}>
                              {topDimensions.map(dim => (
                                <span key={dim} style={s.dimChip(DIM_COLORS[dim] || '#4a90d9')}>
                                  {dim.split('-')[0]}
                                </span>
                              ))}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>

                {/* Right: Compass + Detail */}
                <div>
                  {/* Evolution Compass */}
                  <section style={s.card} aria-label="Evolution compass">
                    <div style={s.cardTitle}>
                      <span aria-hidden="true">🧭</span> Evolution Compass
                    </div>
                    <p style={s.cardSubtitle}>
                      {previous
                        ? `Direction of growth since ${formatDate(previous.assessmentDate)}`
                        : 'Take a second assessment to reveal your growth direction'}
                    </p>
                    <div style={s.compassWrap}>
                      <CompassSVG angle={compass.angle} magnitude={compass.magnitude} />
                      <div style={s.compassBearing}>{compass.label}</div>
                      <div style={s.compassMag}>Magnitude: {compass.magnitude} / 10</div>
                      <p style={s.compassLabel}>{compass.description}</p>
                    </div>
                  </section>

                  {/* Return prompt (if only 1 assessment) */}
                  {assessments.length === 1 && (
                    <div style={{ ...s.card, background: '#f0f7ff', border: '1px solid rgba(74,144,217,0.25)' }}>
                      <p style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.6, margin: 0 }}>
                        🔁 <strong>Return in 30 days</strong> to map your second point and unlock your Evolution Compass direction.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Detail panel ── */}
              {selected && (
                <section style={s.card} aria-label={`Detail for assessment on ${formatDate(selected.assessmentDate)}`}>
                  <div style={s.cardTitle}>
                    <span aria-hidden="true">📊</span> Assessment Detail
                  </div>

                  <div style={s.detailHeader}>
                    <div>
                      <p style={{ fontSize: 13, color: '#718096', margin: '0 0 2px' }}>{formatDate(selected.assessmentDate)}</p>
                      <p style={{ fontSize: 13, color: '#718096', margin: 0 }}>{timeSince(selected.assessmentDate)}</p>
                    </div>
                    <div style={s.detailScore} aria-label={`Overall score ${selected.overall} out of 600`}>
                      <span style={s.detailScoreNum}>{selected.overall}</span>
                      <span style={s.detailScorePct}>/ 600</span>
                    </div>
                  </div>

                  {/* Dimension bars */}
                  <div style={{ marginBottom: 20 }} role="list" aria-label="Dimension scores">
                    {DIMS.map(dim => {
                      const pct   = Math.round(((selected.scores?.[dim] ?? 0) / 100) * 100);
                      const color = DIM_COLORS[dim] || '#4a90d9';
                      const prevPct = previous
                        ? Math.round(((previous.scores?.[dim] ?? 0) / 100) * 100)
                        : null;
                      const delta = prevPct !== null ? pct - prevPct : null;
                      return (
                        <div key={dim} style={s.dimRow} role="listitem">
                          {DIM_ICONS[dim] && (
                            <img src={DIM_ICONS[dim]} alt="" aria-hidden="true" width="18" height="18" style={s.dimIcon} />
                          )}
                          <span style={s.dimLabel}>{dim}</span>
                          <div
                            style={s.dimBarWrap}
                            role="progressbar"
                            aria-valuenow={pct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${dim} ${pct}%`}
                          >
                            <div style={s.dimBarFill(color, pct)} />
                          </div>
                          <span style={s.dimPct}>{pct}%</span>
                          {delta !== null && (
                            <span style={s.dimDelta(delta)} aria-label={`Change: ${delta > 0 ? '+' : ''}${delta}%`}>
                              {delta > 0 ? `+${delta}` : delta}%
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* User notes */}
                  <div>
                    <label
                      htmlFor={`note-${selected._id}`}
                      style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}
                    >
                      Your Notes
                    </label>
                    <textarea
                      id={`note-${selected._id}`}
                      style={s.noteArea}
                      placeholder="Add a personal reflection about this assessment…"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      maxLength={2000}
                      aria-label="Personal notes for this assessment"
                      aria-describedby={`note-count-${selected._id}`}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span id={`note-count-${selected._id}`} style={{ fontSize: 11, color: note.length > 1800 ? '#DC2626' : '#718096' }}>
                        {note.length} / 2000 characters
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button
                        onClick={saveNote}
                        disabled={noteSaving}
                        style={noteSaving ? s.saveBtnDisabled : s.saveBtn}
                        aria-label="Save notes"
                      >
                        {noteSaving ? 'Saving…' : 'Save Notes'}
                      </button>
                      {noteSaved && (
                        <span style={{ fontSize: 12, color: '#059669' }}>✓ Saved</span>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* ── Link to results ── */}
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <a href="/results" style={{ ...s.navLink, fontSize: 14 }}>
                  ← Back to My Results
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
import React from 'react';
import AtlasJourneyPage from './AtlasJourneyPage.jsx';

export default function AtlasPage() {
  return <AtlasJourneyPage />;
}
