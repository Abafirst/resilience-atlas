import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AFFIRMATIONS_BY_DIMENSION, getDailyAffirmationAny } from '../data/affirmations';

const DIMENSIONS = [
  { key: 'Agentic',    label: 'Agentic',    iconSrc: '/icons/agentic-generative.svg',    description: 'Self-direction & initiative' },
  { key: 'Relational', label: 'Relational',  iconSrc: '/icons/relational-connective.svg', description: 'Connection & support' },
  { key: 'Spiritual',  label: 'Spiritual',   iconSrc: '/icons/spiritual-reflective.svg',  description: 'Meaning & purpose' },
  { key: 'Emotional',  label: 'Emotional',   iconSrc: '/icons/emotional-adaptive.svg',    description: 'Feeling & adapting' },
  { key: 'Somatic',    label: 'Somatic',     iconSrc: '/icons/somatic-regulative.svg',    description: 'Body awareness & regulation' },
  { key: 'Cognitive',  label: 'Cognitive',   iconSrc: '/icons/cognitive-narrative.svg',   description: 'Thought & narrative' },
];

// Map from localStorage score keys (long form) to dashboard dimension keys (short form)
const SCORE_KEY_MAP = {
  'Agentic-Generative':    'Agentic',
  'Relational-Connective': 'Relational',
  'Spiritual-Reflective':  'Spiritual',
  'Emotional-Adaptive':    'Emotional',
  'Somatic-Regulative':    'Somatic',
  'Cognitive-Narrative':   'Cognitive',
};

/**
 * Parse resilience_results from localStorage and return a normalized score map:
 * { Agentic, Relational, Spiritual, Emotional, Somatic, Cognitive } (numbers 0–100).
 * Handles both score shapes:
 *   1) Plain numeric map  – { "Agentic-Generative": 78, ... }
 *   2) Object map         – { "Agentic-Generative": { percentage: 78, ... }, ... }
 * Returns null when no valid data is present.
 */
function loadScoresFromStorage() {
  try {
    const raw = localStorage.getItem('resilience_results');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const rawScores = parsed.scores;
    if (!rawScores || typeof rawScores !== 'object') return null;

    const normalized = {};
    for (const [longKey, shortKey] of Object.entries(SCORE_KEY_MAP)) {
      const val = rawScores[longKey];
      let score = null;
      if (typeof val === 'number' && isFinite(val)) {
        score = val;
      } else if (val !== null && typeof val === 'object' && isFinite(val.percentage)) {
        score = val.percentage;
      }
      normalized[shortKey] = score;
    }

    // Return null only when every score is null (storage has no usable data)
    if (Object.values(normalized).every((v) => v === null)) return null;
    return normalized;
  } catch {
    return null;
  }
}

export default function DashboardPage() {
  useEffect(() => {
    document.title = 'My Dashboard — The Resilience Atlas™';
  }, []);

  // Load scores from localStorage (computed once per mount)
  const scores = useMemo(() => loadScoresFromStorage(), []);

  const hasScores = scores !== null;

  const dailyAffirmation = useMemo(() => getDailyAffirmationAny(), []);

  return (
    <main id="main-content" className="dash-layout about-page dashboard-story" aria-live="polite">

      {/* ── Page heading ──────────────────────────────────────────── */}
      <div className="dash-card soft-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>My Resilience Dashboard</h1>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted, #666)', fontSize: '0.95rem' }}>
              Your personal resilience snapshot
            </p>
          </div>
          <Link to="/quiz" className="btn btn--primary">
            {hasScores ? 'Retake Assessment' : 'Take Assessment'}
          </Link>
        </div>

        {!hasScores && (
          <p
            role="status"
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: 'var(--surface-alt, #f5f5f5)',
              borderRadius: '6px',
              fontSize: '0.9rem',
              color: 'var(--text-muted, #555)',
            }}
          >
            Connect your assessment results to see your scores.
          </p>
        )}
      </div>

      {/* ── Dimension score cards ─────────────────────────────────── */}
      <section aria-labelledby="dim-scores-heading">
        <h2 id="dim-scores-heading" className="dash-card__title" style={{ marginBottom: '1rem' }}>
          Dimension Scores
        </h2>
        <div className="dim-cards">
          {DIMENSIONS.map(({ key, label, iconSrc, description }) => {
            const score = hasScores ? scores[key] : null;
            const affirmations = AFFIRMATIONS_BY_DIMENSION[key] || [];
            const sampleAffirmation = affirmations.find(a => a.difficulty === 'foundational');

            return (
              <div key={key} className="dim-card soft-card" aria-label={`${label} resilience dimension`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <img src={iconSrc} alt="" aria-hidden="true" width="24" height="24" style={{ flexShrink: 0 }} />
                  <span className="dim-card__name">{label}</span>
                </div>
                <div
                  className="dim-card__val"
                  aria-label={score !== null ? `${score}%` : 'No score yet'}
                >
                  {score !== null ? `${score}%` : '—'}
                </div>
                {score !== null && (
                  <>
                    <div className="dim-bar-track" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}>
                      <div className="dim-bar-fill" style={{ width: `${score}%` }} />
                    </div>
                    <span className="dim-badge">{label}</span>
                  </>
                )}
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #666)' }}>
                  {description}
                </p>
                {sampleAffirmation && (
                  <blockquote style={{ margin: '0.6rem 0 0', padding: 0, border: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.78rem', fontStyle: 'italic', color: 'var(--text-muted, #777)' }}>
                      "{sampleAffirmation.text}"
                    </p>
                  </blockquote>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Daily Affirmation ─────────────────────────────────────── */}
      {dailyAffirmation && (
        <section
          className="dash-card soft-card"
          aria-labelledby="daily-aff-heading"
          style={{ marginTop: '2rem' }}
        >
          <h2 id="daily-aff-heading" className="dash-card__title">Daily Affirmation</h2>
          <blockquote
            style={{
              margin: '0.75rem 0 0',
              padding: '1rem 1.25rem',
              borderLeft: '4px solid var(--brand-accent, #7c3aed)',
              background: 'var(--surface-alt, #f9f9ff)',
              borderRadius: '0 6px 6px 0',
            }}
          >
            <p style={{ margin: 0, fontSize: '1.05rem', fontStyle: 'italic' }}>
              &ldquo;{dailyAffirmation.text}&rdquo;
            </p>
            <footer style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted, #666)' }}>
              — {dailyAffirmation.resilience_type} Resilience
            </footer>
          </blockquote>
          <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted, #888)' }}>
            Framework: {dailyAffirmation.actPrinciple} (ACT) · {dailyAffirmation.difficulty}
          </p>
        </section>
      )}

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section
        className="dash-card soft-card"
        aria-labelledby="cta-heading"
        style={{ marginTop: '2rem', textAlign: 'center' }}
      >
        <h2 id="cta-heading" className="dash-card__title">
          {hasScores ? 'Ready to grow?' : 'Get your resilience scores'}
        </h2>
        <p style={{ color: 'var(--text-muted, #555)', marginBottom: '1.25rem' }}>
          {hasScores
            ? 'Retake the assessment to track your progress over time.'
            : 'Complete the Resilience Atlas assessment to unlock your full dimension breakdown.'}
        </p>
        <Link to="/quiz" className="btn btn--primary" style={{ fontSize: '1rem', padding: '0.75rem 2rem' }}>
          {hasScores ? 'Retake Assessment' : 'Take Assessment'}
        </Link>
      </section>

    </main>
  );
}
