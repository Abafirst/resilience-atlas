import React, { useState, useEffect, useRef, useCallback } from 'react';
import ResultsHistory from '../components/ResultsHistory.jsx';
import BrandCompass from '../components/BrandCompass.jsx';

// ── Dimension accent colours (mirror results.js / scoring.js) ─────────────
const DIM_COLORS = {
  'Cognitive-Narrative':   '#4F46E5',
  'Relational-Connective': '#059669',
  'Agentic-Generative':    '#D97706',
  'Emotional-Adaptive':    '#DC2626',
  'Spiritual-Reflective':  '#7C3AED',
  'Somatic-Regulative':    '#0891B2',
};

const TIER_FEATURES = {
  'atlas-starter': [
    'Full PDF summary report',
    'Overall resilience score',
    'Top dimension highlights',
    'Actionable starter practices',
  ],
  'atlas-navigator': [
    'Detailed explanation of all 6 resilience dimensions',
    'Deeper interpretation of your strengths',
    'Personalized narrative analysis',
    'Recommended growth strategies',
    'Expanded micro-practices for each dimension',
    'Downloadable PDF report',
  ],
  'atlas-premium': [
    'Everything in Atlas Navigator',
    'Resilience evolution tracking (historical comparison)',
    'Unlimited reassessments',
    'Personalized growth pathway',
    'Micro-practice progress tracking',
  ],
};

// ── Type descriptions (ported from legacy results.js) ─────────────────────
const TYPE_DESCRIPTIONS = {
  'Cognitive-Narrative':
    'Your resilience is driven by meaning-making and reframing life experiences. ' +
    'You find strength in narrative coherence and the ability to construct meaningful ' +
    'stories from challenging events.',
  'Relational-Connective':
    'Your resilience is strengthened through connection, trust, and supportive ' +
    'relationships. You thrive when you have people to lean on and meaningful bonds ' +
    'that sustain you.',
  'Agentic-Generative':
    'You demonstrate resilience through purposeful action and forward momentum. ' +
    'You are energized by taking charge, creating change, and generating new ' +
    'possibilities even in difficulty.',
  'Emotional-Adaptive':
    'You show flexibility in managing emotions and adapting to stress. You can ' +
    'recognize, tolerate, and work skillfully with a wide range of emotional experiences.',
  'Spiritual-Reflective':
    'Your resilience is grounded in purpose, values, and a sense of meaning beyond ' +
    'yourself. You draw strength from a coherent worldview and connection to something larger.',
  'Somatic-Regulative':
    'You rely on body awareness and behavioral habits to stabilize and recover from ' +
    'stress. Your physical practices and consistent routines provide a reliable foundation.',
};

// ── Personalized next steps per dimension (ported from legacy results.js) ──
const DIMENSION_NEXT_STEPS = {
  'Agentic-Generative': [
    { icon: '🎯', title: 'Set a Micro-Goal', desc: 'Identify one small, concrete action you can take this week toward a goal that matters to you.' },
    { icon: '📋', title: 'Action Planning', desc: 'Write down 3 steps you can take in the next 30 days to move forward on a challenge.' },
    { icon: '💪', title: 'Practice Agency', desc: 'Each morning, choose one thing you have control over and take action on it intentionally.' },
  ],
  'Relational-Connective': [
    { icon: '🤝', title: 'Reach Out', desc: "Connect with one trusted person this week — share something real about how you're doing." },
    { icon: '🌐', title: 'Strengthen Bonds', desc: 'Schedule a regular check-in with a colleague, friend, or family member to deepen connection.' },
    { icon: '💬', title: 'Vulnerable Conversation', desc: 'Practice asking for support in a low-stakes situation to build comfort with relying on others.' },
  ],
  'Spiritual-Reflective': [
    { icon: '🧘', title: 'Values Reflection', desc: 'Spend 5 minutes writing about what gives your life meaning and how a recent challenge relates to your values.' },
    { icon: '📖', title: 'Gratitude Practice', desc: "Each evening, note 3 things you're grateful for — include at least one thing from a difficult moment." },
    { icon: '🌅', title: 'Purpose Meditation', desc: 'Try a 10-minute guided meditation focused on purpose and what you want to contribute to the world.' },
  ],
  'Emotional-Adaptive': [
    { icon: '🌊', title: 'Emotion Naming', desc: 'When you notice a strong emotion, pause and name it specifically — this activates your prefrontal cortex and reduces intensity.' },
    { icon: '🌱', title: 'RAIN Practice', desc: 'Use the RAIN technique: Recognize, Allow, Investigate, Nurture. Apply it to one difficult emotion today.' },
    { icon: '📓', title: 'Emotional Journal', desc: 'Write for 5 minutes daily about your emotional experiences — what triggered them and what they may be communicating.' },
  ],
  'Somatic-Regulative': [
    { icon: '🌬️', title: 'Mindful Breathing', desc: 'Practice 4-7-8 breathing: inhale 4 counts, hold 7, exhale 8. Do this for 3 cycles when stressed.' },
    { icon: '🚶', title: 'Movement as Medicine', desc: 'Add a 15-minute intentional walk to your daily routine — notice how your body and mood shift.' },
    { icon: '😴', title: 'Sleep Hygiene', desc: 'Establish a consistent sleep-wake schedule this week. A regular rhythm boosts resilience significantly.' },
  ],
  'Cognitive-Narrative': [
    { icon: '✍️', title: 'Morning Pages', desc: 'Write 3 pages of stream-of-consciousness every morning to process your experiences and reframe challenges.' },
    { icon: '🔄', title: 'Reframing Exercise', desc: 'When facing a setback, ask: "What is one alternative way to interpret this?" Write down 3 possibilities.' },
    { icon: '📚', title: 'Story Integration', desc: 'Reflect on a past difficulty: What did you learn? How did it shape who you are? Write your "resilience story."' },
  ],
};

// ── Confetti animation (ported from legacy results.js) ──────────────────────
function runConfetti(canvas) {
  if (!canvas) return;
  canvas.style.display = 'block';
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = Array.from({ length: 120 }, () => ({
    x:         Math.random() * canvas.width,
    y:         Math.random() * canvas.height - canvas.height,
    r:         4 + Math.random() * 6,
    d:         2 + Math.random() * 3,
    color:     ['#4F46E5','#059669','#D97706','#DC2626','#7C3AED','#0891B2','#f59e0b','#10b981'][Math.floor(Math.random() * 8)],
    tilt:      Math.random() * 10 - 10,
    tiltAngle: 0,
    tiltSpeed: 0.05 + Math.random() * 0.05,
  }));

  let angle = 0;
  let frame;
  const duration = 3000;
  const start = Date.now();

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    angle += 0.01;
    pieces.forEach(p => {
      p.tiltAngle += p.tiltSpeed;
      p.y += p.d;
      p.x += Math.sin(angle) * 0.6;
      p.tilt = Math.sin(p.tiltAngle) * 12;
      if (p.y > canvas.height) {
        p.y = -10;
        p.x = Math.random() * canvas.width;
      }
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.ellipse(p.x + p.tilt, p.y, p.r, p.r * 0.5, p.tilt * 0.1, 0, 2 * Math.PI);
      ctx.fill();
    });
    if (Date.now() - start < duration) {
      frame = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(frame);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none';
    }
  }

  draw();
  return () => { cancelAnimationFrame(frame); };
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: '#e8f0fe',
    padding: '40px 20px 80px',
  },
  container: {
    maxWidth: 800,
    margin: '0 auto',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    color: '#a0aec0',
    textDecoration: 'none',
    fontSize: 14,
    marginBottom: 28,
  },
  // ── No-results state ──
  emptyCard: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: '48px 32px',
    textAlign: 'center',
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: 700, marginBottom: 12 },
  emptyDesc: { color: '#a0aec0', fontSize: 15, marginBottom: 28, lineHeight: 1.6 },
  // ── Banner ──
  banner: (type) => ({
    borderRadius: 10,
    padding: '14px 18px',
    marginBottom: 24,
    fontSize: 14,
    lineHeight: 1.5,
    background: type === 'success'
      ? 'rgba(16,185,129,0.15)'
      : type === 'warning'
        ? 'rgba(245,158,11,0.15)'
        : 'rgba(252,129,129,0.12)',
    border: `1px solid ${type === 'success' ? 'rgba(16,185,129,0.4)' : type === 'warning' ? 'rgba(245,158,11,0.4)' : 'rgba(252,129,129,0.4)'}`,
    color: type === 'success' ? '#6ee7b7' : type === 'warning' ? '#fcd34d' : '#fc8181',
  }),
  // ── Score hero ──
  scoreHero: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: '32px',
    marginBottom: 24,
    display: 'flex',
    alignItems: 'center',
    gap: 28,
    flexWrap: 'wrap',
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4a90d9, #7c3aed)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  scoreNum: { fontSize: 30, fontWeight: 800, lineHeight: 1 },
  scorePct: { fontSize: 13, opacity: 0.75 },
  scoreInfo: { flex: 1 },
  scoreName: { fontSize: 22, fontWeight: 700, marginBottom: 6 },
  scoreSub: { color: '#a0aec0', fontSize: 14, lineHeight: 1.5 },
  // ── Dimension bars ──
  dimSection: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: '24px 28px',
    marginBottom: 24,
  },
  dimHeading: { fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#c7d9f0' },
  dimRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  dimLabel: { minWidth: 190, fontSize: 13, color: '#c7d9f0' },
  dimBarWrap: {
    flex: 1,
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    height: 10,
    overflow: 'hidden',
  },
  dimBarFill: (color, pct) => ({
    width: `${pct}%`,
    height: '100%',
    background: color,
    borderRadius: 4,
    transition: 'width 0.6s ease',
  }),
  dimPct: { minWidth: 38, textAlign: 'right', fontSize: 13, color: '#a0aec0' },
  // ── Upgrade section ──
  upgradeHeading: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 6,
    textAlign: 'center',
  },
  upgradeSubheading: {
    color: '#a0aec0',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 1.6,
  },
  upgradeCards: {
    display: 'flex',
    gap: 20,
    flexWrap: 'wrap',
    marginBottom: 32,
  },
  upgradeCard: (highlight) => ({
    flex: '1 1 240px',
    background: highlight ? 'rgba(124,58,237,0.12)' : 'rgba(74,144,217,0.1)',
    border: `1px solid ${highlight ? 'rgba(124,58,237,0.4)' : 'rgba(74,144,217,0.3)'}`,
    borderRadius: 14,
    padding: '24px 22px',
  }),
  tierIcon: { fontSize: 28, marginBottom: 10 },
  tierBadge: (color) => ({
    display: 'inline-block',
    background: color,
    color: '#fff',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.06em',
    marginBottom: 10,
    textTransform: 'uppercase',
  }),
  tierName: { fontSize: 17, fontWeight: 700, marginBottom: 4 },
  tierPrice: { fontSize: 26, fontWeight: 800, marginBottom: 2 },
  tierBilling: { color: '#a0aec0', fontSize: 12, marginBottom: 14 },
  featureList: { listStyle: 'none', padding: 0, margin: '0 0 20px', fontSize: 13, color: '#c7d9f0', lineHeight: 1.9 },
  checkmark: { color: '#10b981', marginRight: 6 },
  buyBtn: (color, disabled) => ({
    display: 'block',
    width: '100%',
    padding: '11px 0',
    background: disabled ? 'rgba(255,255,255,0.08)' : color,
    color: disabled ? '#a0aec0' : '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    textAlign: 'center',
  }),
  // ── PDF download section ──
  downloadSection: {
    background: 'rgba(16,185,129,0.1)',
    border: '1px solid rgba(16,185,129,0.3)',
    borderRadius: 14,
    padding: '24px 28px',
    marginBottom: 28,
    textAlign: 'center',
  },
  downloadHeading: { fontSize: 18, fontWeight: 700, marginBottom: 8 },
  downloadDesc: { color: '#a0aec0', fontSize: 13, marginBottom: 20, lineHeight: 1.5 },
  downloadBtn: (loading) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 28px',
    background: loading ? 'rgba(16,185,129,0.4)' : '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 700,
    cursor: loading ? 'not-allowed' : 'pointer',
  }),
  // ── Primary CTA (quiz) button ──
  primaryBtn: {
    display: 'inline-block',
    padding: '13px 36px',
    background: '#4a90d9',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'none',
    boxShadow: '0 4px 20px rgba(74,144,217,0.35)',
  },
  retakeRow: {
    textAlign: 'center',
    marginTop: 12,
  },
  retakeLink: {
    color: '#a0aec0',
    fontSize: 13,
    textDecoration: 'underline',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
  },
  // ── Narrative / guidance section ──
  narrativeSection: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: '24px 28px',
    marginBottom: 24,
  },
  narrativeHeading: { fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#c7d9f0' },
  strengthRow: (color) => ({
    borderLeft: `3px solid ${color}`,
    paddingLeft: 14,
    marginBottom: 18,
  }),
  strengthLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#a0aec0',
    marginBottom: 2,
  },
  strengthName: (color) => ({
    fontSize: 15,
    fontWeight: 700,
    color,
    marginBottom: 4,
  }),
  strengthDesc: {
    fontSize: 13,
    color: '#c7d9f0',
    lineHeight: 1.6,
    margin: 0,
  },
  // ── Next steps section ──
  nextStepsSection: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: '24px 28px',
    marginBottom: 24,
  },
  nextStepsHeading: { fontSize: 15, fontWeight: 700, marginBottom: 6, color: '#c7d9f0' },
  nextStepsIntro: { color: '#a0aec0', fontSize: 13, marginBottom: 16, lineHeight: 1.5 },
  nextStepsCard: (color) => ({
    borderLeft: `4px solid ${color}`,
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    padding: '14px 16px',
    marginBottom: 14,
  }),
  nextStepsCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  nextStepsDimName: (color) => ({ fontSize: 14, fontWeight: 700, color }),
  nextStepsDimScore: { fontSize: 12, color: '#a0aec0' },
  nextStepsList: { listStyle: 'none', padding: 0, margin: 0 },
  nextStepItem: {
    display: 'flex',
    gap: 10,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  nextStepIcon: { fontSize: 18, flexShrink: 0, lineHeight: 1.4 },
  nextStepTitle: { fontSize: 13, fontWeight: 600, color: '#e8f0fe', display: 'block', marginBottom: 2 },
  nextStepDesc: { fontSize: 12, color: '#a0aec0', lineHeight: 1.5, margin: 0 },
  // ── Reminder opt-in section ──
  reminderSection: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: '24px 28px',
    marginBottom: 24,
  },
  reminderHeading: { fontSize: 15, fontWeight: 700, marginBottom: 8, color: '#c7d9f0' },
  reminderDesc: { color: '#a0aec0', fontSize: 13, marginBottom: 14, lineHeight: 1.5 },
  reminderCheckRow: { display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  reminderCheckbox: { marginTop: 2, accentColor: '#10b981', width: 16, height: 16, cursor: 'pointer', flexShrink: 0 },
  reminderCheckLabel: { fontSize: 13, color: '#c7d9f0', lineHeight: 1.5, cursor: 'pointer' },
  reminderBtn: (disabled) => ({
    padding: '10px 22px',
    background: disabled ? 'rgba(16,185,129,0.3)' : '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }),
  reminderStatus: (success) => ({
    marginTop: 10,
    fontSize: 13,
    color: success ? '#6ee7b7' : '#fc8181',
    lineHeight: 1.5,
  }),
  // ── Confetti canvas ──
  confettiCanvas: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 9999,
    display: 'none',
  },
};

// ── PDF download helper ────────────────────────────────────────────────────
const MAX_POLLING_ATTEMPTS = 60;   // 2 minutes at 2 s intervals
const POLLING_INTERVAL_MS  = 2000; // 2 seconds between status checks

async function triggerPdfDownload(results) {
  const scoresStr = JSON.stringify(results.scores);
  const params = new URLSearchParams({
    overall: String(results.overall),
    dominantType: results.dominantType,
    scores: scoresStr,
  });

  const genRes = await fetch(`/api/report/generate?${params.toString()}`);
  if (!genRes.ok) {
    const body = await genRes.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to start report generation');
  }
  const { hash } = await genRes.json();

  for (let i = 0; i < MAX_POLLING_ATTEMPTS; i++) {
    await new Promise(r => setTimeout(r, POLLING_INTERVAL_MS));
    const statusRes = await fetch(`/api/report/status?hash=${encodeURIComponent(hash)}`);
    const statusData = await statusRes.json();
    if (statusData.status === 'ready') {
      window.location.href = `/api/report/download?hash=${encodeURIComponent(hash)}`;
      return;
    }
    if (statusData.status === 'failed') {
      throw new Error(statusData.error || 'Report generation failed');
    }
  }
  throw new Error('Report generation timed out. Please try again.');
}

// ── Resilience level label ─────────────────────────────────────────────────
function resilienceLevel(overall) {
  if (overall >= 80) return 'strong';
  if (overall >= 60) return 'solid';
  if (overall >= 40) return 'developing';
  return 'emerging';
}

// ── Get stored email (from results object or resilience_email key) ─────────
function getStoredEmail() {
  try {
    const r = JSON.parse(localStorage.getItem('resilience_results') || '{}');
    return r.email || localStorage.getItem('resilience_email') || '';
  } catch (_) { return ''; }
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ResultsPage() {
  const params = new URLSearchParams(window.location.search);
  const upgradeParam  = params.get('upgrade');   // 'success' | 'cancelled'
  const sessionId     = params.get('session_id');

  // ── State ──────────────────────────────────────────────────────────────
  const [results, setResults]         = useState(null);
  const [tier, setTier]               = useState('free'); // 'free' | 'atlas-starter' | 'atlas-navigator' | 'atlas-premium'
  const [tierLoading, setTierLoading] = useState(false);
  const [tiers, setTiers]             = useState([]);     // pricing from API
  const [banner, setBanner]           = useState(null);   // { type, message }
  const [checkoutLoading, setCheckoutLoading] = useState(''); // tier id being purchased
  const [pdfLoading, setPdfLoading]   = useState(false);
  const [pdfError, setPdfError]       = useState('');
  const [priorAccess, setPriorAccess] = useState(false);  // true if /api/report/access confirms prior purchase

  // ── Reminder opt-in state ──────────────────────────────────────────────
  const [reminderChecked, setReminderChecked]   = useState(false);
  const [reminderLoading, setReminderLoading]   = useState(false);
  const [reminderStatus, setReminderStatus]     = useState('');  // '' | 'success' | 'error'
  const [reminderMessage, setReminderMessage]   = useState('');
  const [reminderDone, setReminderDone]         = useState(false);

  // ── Confetti canvas ref ────────────────────────────────────────────────
  const confettiRef = useRef(null);

  // ── Load results from localStorage ────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem('resilience_results');
      if (raw) setResults(JSON.parse(raw));
    } catch (_) { /* ignore parse errors */ }
  }, []);

  // ── Confetti celebration — fire 600 ms after results load ─────────────
  useEffect(() => {
    if (!results) return;
    let confettiCleanup;
    const timer = setTimeout(() => {
      confettiCleanup = runConfetti(confettiRef.current);
    }, 600);
    return () => {
      clearTimeout(timer);
      if (confettiCleanup) confettiCleanup();
    };
  }, [results]);

  // ── Load tier pricing from API ─────────────────────────────────────────
  useEffect(() => {
    fetch('/api/payments/tiers')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data.tiers)) setTiers(data.tiers); })
      .catch(() => { /* use fallback prices */ });
  }, []);

  // ── Handle return from Stripe checkout ────────────────────────────────
  useEffect(() => {
    if (upgradeParam === 'cancelled') {
      setBanner({ type: 'warning', message: 'Payment was cancelled. Your free results are still available below.' });
      // Clean query string without reloading
      window.history.replaceState({}, '', '/results');
      return;
    }

    if (upgradeParam === 'success' && sessionId) {
      setTierLoading(true);
      setBanner({ type: 'success', message: '✅ Payment successful! Verifying your purchase…' });
      fetch(`/api/payments/verify?session_id=${encodeURIComponent(sessionId)}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.tier) {
            setTier(data.tier);
            // Persist tier to localStorage so the upgrade cards stay hidden on reload
            try { localStorage.setItem('resilience_tier', data.tier); } catch (_) { /* ignore */ }
            setBanner({ type: 'success', message: `✅ Purchase confirmed! You now have ${data.tier === 'atlas-premium' ? 'Atlas Premium (Lifetime)' : data.tier === 'atlas-starter' ? 'Atlas Starter' : 'Atlas Navigator'} access.` });
          } else {
            setBanner({ type: 'error', message: data.error || 'Could not verify payment. Please contact support.' });
          }
        })
        .catch(() => {
          setBanner({ type: 'error', message: 'Failed to verify payment. Please contact support or refresh.' });
        })
        .finally(() => {
          setTierLoading(false);
          window.history.replaceState({}, '', '/results');
        });
      return;
    }

    // ── Check persisted tier from prior payment ──────────────────────────
    try {
      const stored = localStorage.getItem('resilience_tier');
      if (stored && stored !== 'free') {
        setTier(stored);
      }
    } catch (_) { /* ignore */ }

    // ── Also check server-side status for signed-in users ─────────────────
    const email = getStoredEmail();

    if (email) {
      fetch(`/api/payments/status?email=${encodeURIComponent(email)}`)
        .then(r => r.json())
        .then(data => {
          if (data.tier && data.tier !== 'free') {
            setTier(data.tier);
            try { localStorage.setItem('resilience_tier', data.tier); } catch (_) { /* ignore */ }
          }
        })
        .catch(() => { /* non-fatal */ });
    }
  }, [upgradeParam, sessionId]);

  // ── Check prior report access (/api/report/access) ────────────────────
  // Permanently unlock download for users who previously purchased, even if
  // their localStorage tier is stale or cleared (mirrors legacy results.js).
  useEffect(() => {
    const email = getStoredEmail();
    if (!email) return;
    fetch(`/api/report/access?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(data => {
        if (data.hasAccess) {
          setPriorAccess(true);
        }
      })
      .catch(err => {
        console.warn('[ResultsPage] Prior access check failed:', err.message);
      });
  }, []);

  // ── Stripe checkout ────────────────────────────────────────────────────
  const handleUpgrade = useCallback(async (tierId) => {
    const email = (results && results.email) || localStorage.getItem('resilience_email') || '';
    if (!email) {
      setBanner({ type: 'error', message: 'Please complete the assessment first so we know where to send your report.' });
      return;
    }
    setCheckoutLoading(tierId);
    try {
      const body = {
        tier: tierId,
        email,
        ...(results && {
          overall:      results.overall,
          dominantType: results.dominantType,
          scores:       results.scores,
        }),
      };
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Checkout failed');
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned from server');
      }
    } catch (err) {
      setBanner({ type: 'error', message: err.message || 'Could not start checkout. Please try again.' });
      setCheckoutLoading('');
    }
  }, [results]);

  // ── PDF download ───────────────────────────────────────────────────────
  const handleDownloadPdf = useCallback(async () => {
    if (!results) return;
    setPdfLoading(true);
    setPdfError('');
    try {
      await triggerPdfDownload(results);
    } catch (err) {
      setPdfError(err.message || 'Download failed. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  }, [results]);

  // ── Reminder opt-in handler (ported from legacy results.js) ───────────
  const handleReminderOptIn = useCallback(async () => {
    if (!reminderChecked) {
      setReminderStatus('error');
      setReminderMessage('Please check the box to opt in.');
      return;
    }
    const email     = (results && results.email) || localStorage.getItem('resilience_email') || '';
    const firstName = (results && (results.firstName || results.name)) || localStorage.getItem('resilience_name') || '';
    const lastScore = results ? results.overall : 0;
    setReminderLoading(true);
    setReminderMessage('Saving your preference…');
    setReminderStatus('');
    try {
      const res = await fetch('/api/quiz/reminder-optin', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, firstName, lastScore }),
      });
      const data = await res.json();
      if (res.ok) {
        setReminderStatus('success');
        setReminderMessage("✅ Done! We'll remind you in 30 days.");
        setReminderDone(true);
      } else {
        setReminderStatus('error');
        setReminderMessage(data.error || 'Could not save preference.');
        setReminderLoading(false);
      }
    } catch (_) {
      setReminderStatus('error');
      setReminderMessage('Network error. Please try again.');
      setReminderLoading(false);
    }
  }, [results, reminderChecked]);

  // ── Derived values ─────────────────────────────────────────────────────
  const hasPremiumAccess = tier === 'atlas-starter' || tier === 'atlas-navigator' || tier === 'atlas-premium' || priorAccess;
  const isAtlasPremium   = tier === 'atlas-premium';

  const rankedDims = results
    ? Object.entries(results.scores).sort((a, b) => b[1].percentage - a[1].percentage)
    : [];

  const getPrice = (tierId) => {
    const t = tiers.find(t => t.id === tierId);
    if (!t) {
      if (tierId === 'atlas-starter') return '$4.99';
      if (tierId === 'atlas-navigator') return '$9.99';
      if (tierId === 'atlas-premium') return '$49.99';
      return '$49.99';
    }
    return `$${Number(t.price).toFixed(2)}`;
  };

  // ── Render: no results ─────────────────────────────────────────────────
  if (!results) {
    const isReturnFromPayment = upgradeParam === 'success';
    return (
      <div style={s.page}>
        <div style={s.container}>
          <a href="/" style={s.backLink}>← Home</a>
          <div style={s.emptyCard}>
            <div style={s.emptyIcon}>{isReturnFromPayment ? '✅' : '🧭'}</div>
            <div style={s.emptyTitle}>
              {isReturnFromPayment ? 'Payment confirmed!' : 'No assessment results found'}
            </div>
            <p style={s.emptyDesc}>
              {isReturnFromPayment
                ? 'Thank you! Your payment was successful. Your results could not be found in this browser — please re-take the assessment to generate your PDF report.'
                : 'Complete the free assessment to see your personalised resilience profile.'
              }
            </p>
            <a href="/quiz.html" style={s.primaryBtn}>
              {isReturnFromPayment ? 'Re-take Assessment' : 'Start Free Assessment'}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: results ────────────────────────────────────────────────────
  const level = resilienceLevel(results.overall);
  const name  = results.firstName || results.name || '';

  return (
    <div style={s.page}>
      {/* Confetti canvas — positioned fixed, above all content */}
      <canvas ref={confettiRef} style={s.confettiCanvas} aria-hidden="true" />

      <div style={s.container}>

        <a href="/" style={s.backLink}>← Home</a>

        {/* Banner */}
        {banner && (
          <div style={s.banner(banner.type)} role="alert">
            {banner.message}
          </div>
        )}

        {/* Score hero */}
        <div style={s.scoreHero}>
          <div style={s.scoreCircle} aria-label={`Overall resilience score ${results.overall}%`}>
            <span style={s.scoreNum}>{results.overall}</span>
            <span style={s.scorePct}>%</span>
          </div>
          <div style={s.scoreInfo}>
            <div style={s.scoreName}>
              {name ? `${name}'s Resilience Profile` : 'Your Resilience Profile'}
            </div>
            <p style={s.scoreSub}>
              You demonstrate a <strong style={{ color: '#e8f0fe' }}>{level}</strong> resilience
              foundation.{' '}
              {rankedDims[0] && (
                <>
                  Your primary strength is{' '}
                  <strong style={{ color: DIM_COLORS[rankedDims[0][0]] || '#e8f0fe' }}>
                    {rankedDims[0][0]}
                  </strong>
                  {' '}({Math.round(rankedDims[0][1].percentage)}%).
                </>
              )}
            </p>
          </div>
        </div>

        {/* Brand Compass — animated compass chart, always visible after score summary */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 16,
          padding: '28px 20px 20px',
          marginBottom: 24,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 16, letterSpacing: 0.3 }}>
            🧭 Your Resilience Atlas Map
          </div>
          <BrandCompass scores={results.scores} darkMode={true} />
        </div>

        {/* Dimension bars */}
        <div style={s.dimSection}>
          <div style={s.dimHeading}>Six Resilience Dimensions</div>
          {rankedDims.map(([dim, score]) => {
            const pct   = Math.round(score.percentage);
            const color = DIM_COLORS[dim] || '#667eea';
            return (
              <div key={dim} style={s.dimRow}>
                <span style={s.dimLabel}>{dim}</span>
                <div style={s.dimBarWrap}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${dim} ${pct}%`}
                >
                  <div style={s.dimBarFill(color, pct)} />
                </div>
                <span style={s.dimPct}>{pct}%</span>
              </div>
            );
          })}
        </div>

        {/* Narrative / guidance section — primary, solid, and emerging strengths */}
        {rankedDims.length >= 3 && (
          <div style={s.narrativeSection}>
            <div style={s.narrativeHeading}>🗺️ Your Resilience Guidance</div>
            {[
              { label: 'Primary Strength', dimEntry: rankedDims[0] },
              { label: 'Solid Strength',   dimEntry: rankedDims[1] },
              { label: 'Growth Opportunity', dimEntry: rankedDims[rankedDims.length - 1] },
            ].map(({ label, dimEntry }) => {
              const [dim, score] = dimEntry;
              const color = DIM_COLORS[dim] || '#667eea';
              const desc  = TYPE_DESCRIPTIONS[dim] || '';
              return (
                <div key={dim} style={s.strengthRow(color)}>
                  <div style={s.strengthLabel}>{label}</div>
                  <div style={s.strengthName(color)}>
                    {dim} ({Math.round(score.percentage)}%)
                  </div>
                  {desc && <p style={s.strengthDesc}>{desc}</p>}
                </div>
              );
            })}
            <p style={{ margin: '16px 0 0', fontSize: 12, color: '#718096', lineHeight: 1.5 }}>
              Leverage your primary strength as a foundation. Develop your growth opportunity to significantly
              expand your overall resilience capacity.
            </p>
          </div>
        )}

        {/* Personalized next steps — focus on lowest-scoring dimensions */}
        {rankedDims.length > 0 && (
          <div style={s.nextStepsSection}>
            <div style={s.nextStepsHeading}>🎯 Your Personalized Next Steps</div>
            <p style={s.nextStepsIntro}>
              {rankedDims.length === 1
                ? 'Here are actionable practices to build your resilience:'
                : 'Based on your lowest-scoring dimensions, here are actionable practices to build your resilience:'
              }
            </p>
            {rankedDims.slice(-Math.min(2, rankedDims.length)).reverse().map(([dim, score]) => {
              const color = DIM_COLORS[dim] || '#667eea';
              const steps = DIMENSION_NEXT_STEPS[dim] || [];
              const pct   = Math.round(score.percentage);
              return (
                <div key={dim} style={s.nextStepsCard(color)}>
                  <div style={s.nextStepsCardHeader}>
                    <span style={s.nextStepsDimName(color)}>{dim}</span>
                    <span style={s.nextStepsDimScore}>{pct}% — Growth Focus</span>
                  </div>
                  <ul style={s.nextStepsList} aria-label={`Next steps for ${dim}`}>
                    {steps.map(step => (
                      <li key={step.title} style={s.nextStepItem}>
                        <span style={s.nextStepIcon} aria-hidden="true">{step.icon}</span>
                        <div>
                          <strong style={s.nextStepTitle}>{step.title}</strong>
                          <p style={s.nextStepDesc}>{step.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {/* Reminder opt-in section (ported from legacy results.js) */}
        {results && (results.email || localStorage.getItem('resilience_email')) && !reminderDone && (
          <div style={s.reminderSection} aria-labelledby="reminderOptInHeading">
            <div style={s.reminderHeading} id="reminderOptInHeading">🔔 Stay on Track</div>
            <p style={s.reminderDesc}>
              Would you like a reminder to reassess your resilience in 30 days?
              Tracking progress over time reveals real growth.
            </p>
            <div style={s.reminderCheckRow}>
              <input
                id="reminderOptInCheckbox"
                type="checkbox"
                style={s.reminderCheckbox}
                checked={reminderChecked}
                onChange={e => setReminderChecked(e.target.checked)}
              />
              <label htmlFor="reminderOptInCheckbox" style={s.reminderCheckLabel}>
                Yes, remind me to reassess in 30 days
              </label>
            </div>
            <button
              type="button"
              style={s.reminderBtn(reminderLoading)}
              onClick={handleReminderOptIn}
              disabled={reminderLoading}
            >
              {reminderLoading ? 'Saving…' : 'Set Reminder'}
            </button>
            {reminderMessage && (
              <div style={s.reminderStatus(reminderStatus === 'success')} role="status">
                {reminderMessage}
              </div>
            )}
          </div>
        )}

        {/* PDF Download — shown after purchase */}
        {hasPremiumAccess && (
          <div style={s.downloadSection}>
            <div style={s.downloadHeading}>
              🎉 Your Full Report is Ready
            </div>
            <p style={s.downloadDesc}>
              {isAtlasPremium
                ? 'Your Atlas Premium lifetime access lets you download this report any time.'
                : tier === 'atlas-starter'
                  ? 'Your Atlas Starter report is ready. Download your personalised PDF summary now.'
                  : 'Your Atlas Navigator report is ready. Download your personalised PDF now.'
              }
            </p>
            {pdfError && (
              <div style={{ color: '#fc8181', fontSize: 13, marginBottom: 12 }}>{pdfError}</div>
            )}
            <button
              type="button"
              style={s.downloadBtn(pdfLoading || tierLoading)}
              onClick={handleDownloadPdf}
              disabled={pdfLoading || tierLoading}
              aria-busy={pdfLoading}
            >
              {pdfLoading ? '⏳ Generating PDF…' : '⬇ Download PDF Report'}
            </button>
          </div>
        )}

        {/* Upgrade cards — hidden after purchase */}
        {!hasPremiumAccess && (
          <>
            <div style={s.upgradeHeading}>Unlock Your Full Report</div>
            <p style={s.upgradeSubheading}>
              Go deeper with personalised insights, evidence-based strategies, and a
              downloadable PDF report tailored to your resilience profile.
            </p>

            <div style={s.upgradeCards}>
              {/* Atlas Starter */}
              <div style={s.upgradeCard(false)}>
                <div style={s.tierIcon}>🌱</div>
                <span style={s.tierBadge('#38a169')}>STARTER</span>
                <div style={s.tierName}>Atlas Starter</div>
                <div style={s.tierPrice}>{getPrice('atlas-starter')}</div>
                <div style={s.tierBilling}>one-time payment · USD</div>
                <ul style={s.featureList}>
                  {TIER_FEATURES['atlas-starter'].map(f => (
                    <li key={f}><span style={s.checkmark}>✓</span>{f}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  style={s.buyBtn('#38a169', checkoutLoading === 'atlas-starter')}
                  onClick={() => handleUpgrade('atlas-starter')}
                  disabled={!!checkoutLoading}
                  aria-busy={checkoutLoading === 'atlas-starter'}
                >
                  {checkoutLoading === 'atlas-starter' ? '⏳ Redirecting…' : `Upgrade to Starter · ${getPrice('atlas-starter')}`}
                </button>
              </div>

              {/* Atlas Navigator */}
              <div style={s.upgradeCard(true)}>
                <div style={s.tierIcon}>🗺️</div>
                <span style={s.tierBadge('#4a90d9')}>POPULAR</span>
                <div style={s.tierName}>Atlas Navigator</div>
                <div style={s.tierPrice}>{getPrice('atlas-navigator')}</div>
                <div style={s.tierBilling}>one-time payment · USD</div>
                <ul style={s.featureList}>
                  {TIER_FEATURES['atlas-navigator'].map(f => (
                    <li key={f}><span style={s.checkmark}>✓</span>{f}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  style={s.buyBtn('#4a90d9', checkoutLoading === 'atlas-navigator')}
                  onClick={() => handleUpgrade('atlas-navigator')}
                  disabled={!!checkoutLoading}
                  aria-busy={checkoutLoading === 'atlas-navigator'}
                >
                  {checkoutLoading === 'atlas-navigator' ? '⏳ Redirecting…' : `Upgrade to Navigator · ${getPrice('atlas-navigator')}`}
                </button>
              </div>

              {/* Atlas Premium */}
              <div style={s.upgradeCard(false)}>
                <div style={s.tierIcon}>⭐</div>
                <span style={s.tierBadge('#7C3AED')}>LIFETIME</span>
                <div style={s.tierName}>Atlas Premium</div>
                <div style={s.tierPrice}>{getPrice('atlas-premium')}</div>
                <div style={s.tierBilling}>one-time payment · USD</div>
                <ul style={s.featureList}>
                  {TIER_FEATURES['atlas-premium'].map(f => (
                    <li key={f}><span style={s.checkmark}>✓</span>{f}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  style={s.buyBtn('#7C3AED', checkoutLoading === 'atlas-premium')}
                  onClick={() => handleUpgrade('atlas-premium')}
                  disabled={!!checkoutLoading}
                  aria-busy={checkoutLoading === 'atlas-premium'}
                >
                  {checkoutLoading === 'atlas-premium' ? '⏳ Redirecting…' : `Upgrade to Premium · ${getPrice('atlas-premium')}`}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Re-take / retake row */}
        <div style={s.retakeRow}>
          <button
            type="button"
            style={s.retakeLink}
            onClick={() => { window.location.href = '/quiz.html'; }}
          >
            ↺ Re-take the assessment
          </button>
        </div>

        {/* Prior purchases — always available for paid users */}
        <ResultsHistory
          email={(results && results.email) || getStoredEmail()}
        />

      </div>
    </div>
  );
}
