/**
 * PredictiveAnalyticsDashboardPage.jsx
 * Task #23b: Predictive Analytics & ML-Powered Insights
 *
 * Tabs:
 *   1. Activity Predictor   — rank activities by predicted effectiveness per dimension
 *   2. Regression Alerts    — flag at-risk clients with declining trends
 *   3. Session Frequency    — optimal cadence recommendations
 *   4. Goal Probability     — probability scoring when creating/reviewing goals
 *   5. Treatment Plans      — generate week-by-week AI treatment plans
 *
 * Route: /iatlas/ml/insights
 *
 * Note: All predictions are displayed as decision-support suggestions and
 * require practitioner review before application (human-in-the-loop).
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import SiteHeader from '../components/SiteHeader.jsx';
import * as mlService from '../services/mlService.js';

// ── Navigation ────────────────────────────────────────────────────────────────

const NAV = [
  { to: '/iatlas/ml/insights',          label: '🤖 AI Insights',     key: 'ml' },
  { to: '/iatlas/practice/dashboard',   label: '🏠 Practice',        key: 'practice' },
  { to: '/iatlas/practice/clients',     label: '👥 Clients',         key: 'clients' },
  { to: '/iatlas/practice/analytics',   label: '📈 Analytics',       key: 'analytics' },
  { to: '/iatlas/org/dashboard',        label: '🏢 Org Dashboard',   key: 'org' },
];

// ── Dimensions ────────────────────────────────────────────────────────────────

const DIMENSIONS = [
  { key: 'agenticGenerative',    label: 'Agentic',    color: '#4f46e5', bg: '#eef2ff' },
  { key: 'relationalConnective', label: 'Relational', color: '#0891b2', bg: '#e0f2fe' },
  { key: 'somaticRegulative',    label: 'Somatic',    color: '#059669', bg: '#d1fae5' },
  { key: 'cognitiveNarrative',   label: 'Cognitive',  color: '#d97706', bg: '#fef3c7' },
  { key: 'emotionalAdaptive',    label: 'Emotional',  color: '#db2777', bg: '#fce7f3' },
  { key: 'spiritualExistential', label: 'Spiritual',  color: '#7c3aed', bg: '#ede9fe' },
];

const TABS = [
  { key: 'activity',   icon: '🎯', label: 'Activity Predictor' },
  { key: 'regression', icon: '⚠️', label: 'Regression Alerts' },
  { key: 'frequency',  icon: '📅', label: 'Session Frequency' },
  { key: 'goal',       icon: '🎲', label: 'Goal Probability' },
  { key: 'plan',       icon: '🧠', label: 'Treatment Plans' },
];



// ── Mini UI components ────────────────────────────────────────────────────────

const AI_DISCLAIMER = 'AI recommendations are decision-support tools. All clinical decisions require practitioner review and approval.';

function DisclaimerBanner() {
  return (
    <div style={{
      background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10,
      padding: '.65rem 1rem', marginBottom: '1.25rem',
      display: 'flex', alignItems: 'center', gap: '.6rem', fontSize: '.82rem', color: '#92400e',
    }}>
      <span style={{ fontSize: '1rem' }}>🔬</span>
      <span><strong>Human-in-the-Loop:</strong> {AI_DISCLAIMER}</span>
    </div>
  );
}

function ConfidenceMeter({ value }) {
  const color = value >= 70 ? '#059669' : value >= 50 ? '#d97706' : '#dc2626';
  const bg    = value >= 70 ? '#d1fae5' : value >= 50 ? '#fef3c7' : '#fee2e2';
  const icon  = value >= 70 ? '🟢' : value >= 50 ? '🟡' : '🔴';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '.3rem',
      background: bg, color, borderRadius: 999,
      padding: '.2rem .55rem', fontSize: '.73rem', fontWeight: 700,
    }}>
      {icon} {value}% conf
    </span>
  );
}

function SeverityBadge({ severity }) {
  const map = {
    high:   { bg: '#fee2e2', color: '#991b1b', icon: '🔴', label: 'High' },
    medium: { bg: '#fef3c7', color: '#92400e', icon: '🟡', label: 'Medium' },
    low:    { bg: '#d1fae5', color: '#065f46', icon: '🟢', label: 'Low' },
  };
  const s = map[severity] || map.low;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '.25rem',
      background: s.bg, color: s.color, borderRadius: 999,
      padding: '.18rem .5rem', fontSize: '.72rem', fontWeight: 700,
    }}>
      {s.icon} {s.label}
    </span>
  );
}

function ProbabilityRing({ probability }) {
  const color = probability >= 75 ? '#059669' : probability >= 50 ? '#d97706' : '#dc2626';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem' }}>
      <div style={{
        width: 100, height: 100, borderRadius: '50%',
        background: `conic-gradient(${color} ${probability}%, #f1f5f9 0)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{
          width: 76, height: 76, borderRadius: '50%', background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '1.3rem', fontWeight: 800, color }}>{probability}%</span>
        </div>
      </div>
      <span style={{ fontSize: '.78rem', color: '#6b7280' }}>Achievement probability</span>
    </div>
  );
}

// ── Tab: Activity Predictor ──────────────────────────────────────────────────

function ActivityPredictorTab({ selectedClient, selectedDim, setSelectedDim, getTokenFn }) {
  const [loading, setLoading]         = useState(false);
  const [results, setResults]         = useState(null);
  const [error, setError]             = useState(null);
  const [errorExtra, setErrorExtra]   = useState(null);
  const [feedback, setFeedback]       = useState({});
  const [feedbackMsg, setFeedbackMsg] = useState({});
  const [predictionId, setPredictionId] = useState(null);

  const handlePredict = useCallback(async () => {
    if (!selectedClient) return;
    setLoading(true);
    setError(null);
    setErrorExtra(null);
    try {
      const data = await mlService.predictActivityEffectiveness(
        selectedClient, selectedDim, undefined, getTokenFn
      );
      setResults(data.predictions || []);
      setPredictionId(data.predictionId || null);
    } catch (err) {
      const e = mlService.handleMLError(err);
      setError(e.message);
      setErrorExtra(e);
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedDim, getTokenFn]);

  const handleFeedback = useCallback(async (activityId, rating) => {
    setFeedback(f => ({ ...f, [activityId]: rating }));
    if (!predictionId) return;
    try {
      await mlService.submitFeedback(predictionId, rating, getTokenFn);
      setFeedbackMsg(m => ({ ...m, [activityId]: rating === 'helpful' ? '✅ Logged' : '📝 Logged' }));
    } catch {
      setFeedbackMsg(m => ({ ...m, [activityId]: '⚠️ Could not save' }));
    }
  }, [predictionId, getTokenFn]);

  return (
    <div>
      <h3 style={styles.sectionTitle}>🎯 Activity Effectiveness Predictor</h3>
      <p style={styles.sectionDesc}>
        The AI ranks activities by predicted score improvement for the selected client and dimension,
        using historical effectiveness data and client profile features.
      </p>

      <div style={styles.controlRow}>
        <label style={styles.label}>Target Dimension</label>
        <select
          style={styles.select}
          value={selectedDim}
          onChange={e => setSelectedDim(e.target.value)}
        >
          {DIMENSIONS.map(d => (
            <option key={d.key} value={d.key}>{d.label}</option>
          ))}
        </select>
        <button
          style={{ ...styles.btn, ...styles.btnPrimary, marginLeft: 'auto' }}
          onClick={handlePredict}
          disabled={loading || !selectedClient}
        >
          {loading ? '⏳ Predicting…' : '🔮 Predict Effectiveness'}
        </button>
      </div>

      {error && (
        <div style={styles.errorBox}>
          {error}
          {errorExtra?.upgradeButton && (
            <div style={{ marginTop: '.5rem' }}>
              <a
                href="/pricing"
                style={{
                  display: 'inline-block', padding: '.4rem .85rem', borderRadius: 7,
                  background: '#4f46e5', color: '#fff', fontWeight: 700,
                  fontSize: '.82rem', textDecoration: 'none',
                }}
              >
                Upgrade to Practitioner
              </a>
            </div>
          )}
        </div>
      )}

      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', marginTop: '1rem' }}>
          {results.map((r, i) => (
            <div key={r.activityId} style={{
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
              padding: '1rem 1.1rem', display: 'flex', alignItems: 'flex-start', gap: '1rem',
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: i === 0 ? '#fef3c7' : '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '.9rem', fontWeight: 800, color: i === 0 ? '#92400e' : '#6b7280',
                flexShrink: 0,
              }}>
                {i === 0 ? '⭐' : i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.35rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '.95rem', color: '#111827' }}>
                    {r.activityTitle}
                  </span>
                  <ConfidenceMeter value={r.confidence} />
                </div>
                <div style={{ fontSize: '.83rem', color: '#374151', marginBottom: '.3rem' }}>
                  <strong style={{ color: '#059669' }}>
                    +{r.predictedImprovement} pts
                  </strong>
                  {' '}predicted improvement
                </div>
                <div style={{ fontSize: '.78rem', color: '#6b7280' }}>
                  💡 {r.explanation}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem', alignItems: 'flex-end' }}>
                {!feedback[r.activityId] ? (
                  <>
                    <button
                      style={{ ...styles.btnSm, background: '#d1fae5', color: '#065f46' }}
                      onClick={() => handleFeedback(r.activityId, 'helpful')}
                    >👍 Helpful</button>
                    <button
                      style={{ ...styles.btnSm, background: '#fee2e2', color: '#991b1b' }}
                      onClick={() => handleFeedback(r.activityId, 'not_helpful')}
                    >👎 Not Helpful</button>
                  </>
                ) : (
                  <span style={{ fontSize: '.75rem', color: '#6b7280' }}>
                    {feedbackMsg[r.activityId] || (feedback[r.activityId] === 'helpful' ? '✅ Logged' : '📝 Logged')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!results && !loading && (
        <div style={styles.emptyState}>
          <span style={{ fontSize: '2rem' }}>🎯</span>
          <p>Select a client and dimension, then click <strong>Predict Effectiveness</strong> to see AI-ranked activity recommendations.</p>
        </div>
      )}
    </div>
  );
}

// ── Tab: Regression Alerts ───────────────────────────────────────────────────

function RegressionAlertsTab({ selectedClient, getTokenFn }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError]     = useState(null);
  const [errorExtra, setErrorExtra] = useState(null);
  const [reviewed, setReviewed] = useState({});

  const handleDetect = useCallback(async () => {
    if (!selectedClient) return;
    setLoading(true);
    setError(null);
    setErrorExtra(null);
    try {
      const data = await mlService.detectRegressionRisk(selectedClient, getTokenFn);
      setResults(data.risks || []);
    } catch (err) {
      const e = mlService.handleMLError(err);
      setError(e.message);
      setErrorExtra(e);
    } finally {
      setLoading(false);
    }
  }, [selectedClient, getTokenFn]);

  const dimLabel = key => DIMENSIONS.find(d => d.key === key)?.label || key;

  return (
    <div>
      <h3 style={styles.sectionTitle}>⚠️ Early Regression Detection</h3>
      <p style={styles.sectionDesc}>
        The AI monitors dimension score trends and attendance patterns to flag clients at risk of
        regression before it becomes clinically significant.
      </p>

      <div style={styles.controlRow}>
        <button
          style={{ ...styles.btn, ...styles.btnWarning }}
          onClick={handleDetect}
          disabled={loading || !selectedClient}
        >
          {loading ? '⏳ Analyzing…' : '🔍 Detect Regression Risks'}
        </button>
      </div>

      {error && (
        <div style={styles.errorBox}>
          {error}
          {errorExtra?.upgradeButton && (
            <div style={{ marginTop: '.5rem' }}>
              <a
                href="/pricing"
                style={{
                  display: 'inline-block', padding: '.4rem .85rem', borderRadius: 7,
                  background: '#4f46e5', color: '#fff', fontWeight: 700,
                  fontSize: '.82rem', textDecoration: 'none',
                }}
              >
                Upgrade to Practitioner
              </a>
            </div>
          )}
        </div>
      )}

      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', marginTop: '1rem' }}>
          {results.length === 0 ? (
            <div style={{ ...styles.emptyState, background: '#d1fae5', border: '1px solid #a7f3d0' }}>
              <span style={{ fontSize: '1.5rem' }}>✅</span>
              <p style={{ color: '#065f46' }}>No regression risks detected for this client.</p>
            </div>
          ) : results.map((r, i) => !reviewed[i] && (
            <div key={i} style={{
              background: '#fff', border: `1px solid ${r.severity === 'high' ? '#fecaca' : '#fde68a'}`,
              borderRadius: 12, padding: '1rem 1.1rem',
              borderLeft: `4px solid ${r.severity === 'high' ? '#dc2626' : '#f59e0b'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.4rem' }}>
                <SeverityBadge severity={r.severity} />
                {r.dimension && (
                  <span style={{ fontSize: '.82rem', fontWeight: 700, color: '#374151' }}>
                    {dimLabel(r.dimension)}
                  </span>
                )}
                {r.type === 'attendance' && (
                  <span style={{ fontSize: '.82rem', fontWeight: 700, color: '#374151' }}>Attendance</span>
                )}
              </div>
              <p style={{ fontSize: '.88rem', color: '#374151', margin: '0 0 .6rem' }}>{r.message}</p>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <button
                  style={{ ...styles.btnSm, background: '#e0f2fe', color: '#0369a1' }}
                >📋 View Client</button>
                <button
                  style={{ ...styles.btnSm, background: '#f1f5f9', color: '#374151' }}
                  onClick={() => setReviewed(rv => ({ ...rv, [i]: true }))}
                >✓ Mark Reviewed</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!results && !loading && (
        <div style={styles.emptyState}>
          <span style={{ fontSize: '2rem' }}>⚠️</span>
          <p>Run regression detection to identify clients at risk based on recent session and scoring trends.</p>
        </div>
      )}
    </div>
  );
}

// ── Tab: Session Frequency ────────────────────────────────────────────────────

function SessionFrequencyTab({ selectedClient, getTokenFn }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);
  const [errorExtra, setErrorExtra] = useState(null);

  const handleRecommend = useCallback(async () => {
    if (!selectedClient) return;
    setLoading(true);
    setError(null);
    setErrorExtra(null);
    try {
      const data = await mlService.recommendSessionFrequency(selectedClient, undefined, getTokenFn);
      setResult(data);
    } catch (err) {
      const e = mlService.handleMLError(err);
      setError(e.message);
      setErrorExtra(e);
    } finally {
      setLoading(false);
    }
  }, [selectedClient, getTokenFn]);

  return (
    <div>
      <h3 style={styles.sectionTitle}>📅 Optimal Session Frequency</h3>
      <p style={styles.sectionDesc}>
        Analyses historical progress rate to recommend the most effective session cadence
        while respecting scheduling and budget constraints.
      </p>

      <div style={styles.controlRow}>
        <button
          style={{ ...styles.btn, ...styles.btnPrimary }}
          onClick={handleRecommend}
          disabled={loading || !selectedClient}
        >
          {loading ? '⏳ Analyzing…' : '📊 Get Frequency Recommendation'}
        </button>
      </div>

      {error && (
        <div style={styles.errorBox}>
          {error}
          {errorExtra?.upgradeButton && (
            <div style={{ marginTop: '.5rem' }}>
              <a
                href="/pricing"
                style={{
                  display: 'inline-block', padding: '.4rem .85rem', borderRadius: 7,
                  background: '#4f46e5', color: '#fff', fontWeight: 700,
                  fontSize: '.82rem', textDecoration: 'none',
                }}
              >
                Upgrade to Practitioner
              </a>
            </div>
          )}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem',
          }}>
            <div style={{ ...styles.kpiCard, borderColor: '#bae6fd' }}>
              <span style={styles.kpiLabel}>Current Frequency</span>
              <span style={{ ...styles.kpiValue, color: '#0369a1' }}>
                {result.currentFrequency}× / week
              </span>
            </div>
            <div style={{ ...styles.kpiCard, borderColor: '#a7f3d0', background: '#f0fdf4' }}>
              <span style={styles.kpiLabel}>Recommended Frequency</span>
              <span style={{ ...styles.kpiValue, color: '#059669' }}>
                {result.recommendedFrequency}× / week
              </span>
              {result.expectedImprovementDelta && (
                <span style={{ fontSize: '.75rem', color: '#059669', marginTop: '.15rem' }}>
                  {result.expectedImprovementDelta}
                </span>
              )}
            </div>
          </div>

          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '1rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '.88rem', color: '#374151' }}>Evidence</span>
              <ConfidenceMeter value={result.confidenceScore} />
            </div>
            <p style={{ fontSize: '.85rem', color: '#374151', margin: 0 }}>{result.rationale}</p>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div style={styles.emptyState}>
          <span style={{ fontSize: '2rem' }}>📅</span>
          <p>Analyse progress data to get an evidence-based session frequency recommendation.</p>
        </div>
      )}
    </div>
  );
}

// ── Tab: Goal Probability ─────────────────────────────────────────────────────

function GoalProbabilityTab({ selectedClient, selectedDim, getTokenFn }) {
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);
  const [errorExtra, setErrorExtra] = useState(null);
  const [targetScore, setTarget]  = useState(75);

  const handleScore = useCallback(async () => {
    if (!selectedClient) return;
    setLoading(true);
    setError(null);
    setErrorExtra(null);
    try {
      const goal = {
        dimension:   selectedDim,
        targetScore: Math.min(100, Math.max(0, targetScore)),
      };
      const data = await mlService.scoreGoalProbability(selectedClient, goal, getTokenFn);
      setResult(data);
    } catch (err) {
      const e = mlService.handleMLError(err);
      setError(e.message);
      setErrorExtra(e);
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedDim, targetScore, getTokenFn]);

  return (
    <div>
      <h3 style={styles.sectionTitle}>🎲 Goal Achievement Probability</h3>
      <p style={styles.sectionDesc}>
        When setting a treatment goal, the AI calculates the probability it will be achieved by the target date
        based on current progress rates, attendance, and session frequency.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', marginBottom: '1rem' }}>
        <div style={styles.controlRow}>
          <label style={styles.label}>Target Score (0–100)</label>
          <input
            type="number" min={0} max={100}
            style={{ ...styles.select, width: 100 }}
            value={targetScore}
            onChange={e => setTarget(Number(e.target.value))}
          />
          <button
            style={{ ...styles.btn, ...styles.btnPrimary, marginLeft: 'auto' }}
            onClick={handleScore}
            disabled={loading || !selectedClient}
          >
            {loading ? '⏳ Scoring…' : '🎲 Score Goal Probability'}
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.errorBox}>
          {error}
          {errorExtra?.upgradeButton && (
            <div style={{ marginTop: '.5rem' }}>
              <a
                href="/pricing"
                style={{
                  display: 'inline-block', padding: '.4rem .85rem', borderRadius: 7,
                  background: '#4f46e5', color: '#fff', fontWeight: 700,
                  fontSize: '.82rem', textDecoration: 'none',
                }}
              >
                Upgrade to Practitioner
              </a>
            </div>
          )}
        </div>
      )}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            <ProbabilityRing probability={result.probability} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
              <div style={styles.kpiCard}>
                <span style={styles.kpiLabel}>Expected Completion</span>
                <span style={{ ...styles.kpiValue, color: '#374151', fontSize: '1rem' }}>
                  {result.expectedCompletionDate}
                </span>
                <span style={{ fontSize: '.75rem', color: '#6b7280' }}>
                  ~{result.weeksToCompletion} weeks from now
                </span>
              </div>
            </div>
          </div>

          {result.riskFactors.length > 0 && (
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '1rem' }}>
              <span style={{ fontWeight: 700, fontSize: '.88rem', color: '#9a3412', display: 'block', marginBottom: '.5rem' }}>
                ⚠️ Risk Factors
              </span>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#9a3412', fontSize: '.83rem' }}>
                {result.riskFactors.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          {result.suggestions.length > 0 && (
            <div style={{ background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 10, padding: '1rem' }}>
              <span style={{ fontWeight: 700, fontSize: '.88rem', color: '#065f46', display: 'block', marginBottom: '.5rem' }}>
                💡 Suggestions to Improve Odds
              </span>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#065f46', fontSize: '.83rem' }}>
                {result.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <div style={styles.emptyState}>
          <span style={{ fontSize: '2rem' }}>🎲</span>
          <p>Enter a goal target score and click <strong>Score Goal Probability</strong> to see the AI prediction.</p>
        </div>
      )}
    </div>
  );
}

// ── Tab: Treatment Plan ───────────────────────────────────────────────────────

function TreatmentPlanTab({ selectedClient, selectedDim, getTokenFn }) {
  const [loading, setLoading]   = useState(false);
  const [plan, setPlan]         = useState(null);
  const [error, setError]       = useState(null);
  const [errorExtra, setErrorExtra] = useState(null);
  const [totalWeeks, setWeeks]  = useState(12);
  const [expanded, setExpanded] = useState({});

  const handleGenerate = useCallback(async () => {
    if (!selectedClient) return;
    setLoading(true);
    setError(null);
    setErrorExtra(null);
    try {
      const data = await mlService.generateTreatmentPlan(
        selectedClient, undefined, totalWeeks, undefined, getTokenFn
      );
      setPlan(data);
    } catch (err) {
      const e = mlService.handleMLError(err);
      setError(e.message);
      setErrorExtra(e);
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedDim, totalWeeks, getTokenFn]);

  const PHASE_COLORS = ['#eef2ff', '#fce7f3', '#d1fae5', '#fef3c7', '#e0f2fe', '#ede9fe'];

  return (
    <div>
      <h3 style={styles.sectionTitle}>🧠 AI Treatment Plan Generator</h3>
      <p style={styles.sectionDesc}>
        Generates a week-by-week treatment plan that prioritises the most-deficient dimensions,
        selects activities with the highest predicted effectiveness, and forecasts expected outcomes.
      </p>

      <div style={styles.controlRow}>
        <label style={styles.label}>Plan Duration (weeks)</label>
        <select
          style={{ ...styles.select, width: 120 }}
          value={totalWeeks}
          onChange={e => setWeeks(Number(e.target.value))}
        >
          {[4, 6, 8, 12, 16, 24].map(w => (
            <option key={w} value={w}>{w} weeks</option>
          ))}
        </select>
        <button
          style={{ ...styles.btn, ...styles.btnPrimary, marginLeft: 'auto' }}
          onClick={handleGenerate}
          disabled={loading || !selectedClient}
        >
          {loading ? '⏳ Generating…' : '🧠 Generate Treatment Plan'}
        </button>
      </div>

      {error && (
        <div style={styles.errorBox}>
          {error}
          {errorExtra?.upgradeButton && (
            <div style={{ marginTop: '.5rem' }}>
              <a
                href="/pricing"
                style={{
                  display: 'inline-block', padding: '.4rem .85rem', borderRadius: 7,
                  background: '#4f46e5', color: '#fff', fontWeight: 700,
                  fontSize: '.82rem', textDecoration: 'none',
                }}
              >
                Upgrade to Practitioner
              </a>
            </div>
          )}
        </div>
      )}

      {plan && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          {/* Summary */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem',
          }}>
            <div style={{ ...styles.kpiCard, background: '#f0fdf4', borderColor: '#a7f3d0' }}>
              <span style={styles.kpiLabel}>Success Probability</span>
              <span style={{ ...styles.kpiValue, color: '#059669' }}>{plan.successProbability}%</span>
            </div>
            <div style={styles.kpiCard}>
              <span style={styles.kpiLabel}>Plan Duration</span>
              <span style={{ ...styles.kpiValue, color: '#374151' }}>{plan.totalWeeks} weeks</span>
            </div>
            <div style={styles.kpiCard}>
              <span style={styles.kpiLabel}>Focus Areas</span>
              <span style={{ ...styles.kpiValue, color: '#374151', fontSize: '.9rem' }}>
                {[...new Set(plan.weeks.slice(0, 4).map(w => w.focusDimensionLabel))].slice(0, 2).join(', ')}
              </span>
            </div>
          </div>

          {/* Week-by-week plan */}
          <div>
            <h4 style={{ fontSize: '.9rem', fontWeight: 700, color: '#374151', margin: '0 0 .75rem' }}>
              Week-by-Week Plan
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {plan.weeks.map((w, i) => (
                <div key={w.week} style={{
                  background: PHASE_COLORS[i % PHASE_COLORS.length],
                  borderRadius: 10, overflow: 'hidden',
                  border: '1px solid #e5e7eb',
                }}>
                  <button
                    style={{
                      width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                      padding: '.7rem 1rem', display: 'flex', alignItems: 'center', gap: '.8rem', textAlign: 'left',
                    }}
                    onClick={() => setExpanded(ex => ({ ...ex, [w.week]: !ex[w.week] }))}
                    aria-expanded={!!expanded[w.week]}
                  >
                    <span style={{ fontWeight: 700, fontSize: '.85rem', color: '#374151', width: 52 }}>
                      Week {w.week}
                    </span>
                    <span style={{ flex: 1, fontSize: '.85rem', color: '#4b5563' }}>
                      {w.focusDimensionLabel}
                    </span>
                    <span style={{ fontSize: '.8rem', color: '#059669', fontWeight: 700 }}>
                      +{w.expectedWeeklyGain} pts
                    </span>
                    <span style={{ fontSize: '.75rem', color: '#9ca3af' }}>
                      {expanded[w.week] ? '▲' : '▼'}
                    </span>
                  </button>
                  {expanded[w.week] && (
                    <div style={{ padding: '.6rem 1rem 1rem', borderTop: '1px solid #e5e7eb' }}>
                      <span style={{ fontSize: '.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '.4rem' }}>
                        Suggested Activities:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
                        {w.suggestedActivities.map((a, j) => (
                          <span key={j} style={{
                            background: '#fff', border: '1px solid #d1d5db',
                            borderRadius: 999, padding: '.2rem .65rem',
                            fontSize: '.78rem', color: '#374151',
                          }}>
                            {a.activityTitle}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Forecasted scores */}
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '1rem', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '.88rem', fontWeight: 700, color: '#374151', margin: '0 0 .75rem' }}>
              📊 Forecasted Final Scores
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
              {DIMENSIONS.map(d => {
                const val = plan.forecastedScores[d.key] || 0;
                return (
                  <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                    <span style={{ fontSize: '.78rem', color: '#6b7280', width: 80, flexShrink: 0 }}>
                      {d.label}
                    </span>
                    <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${val}%`, background: d.color, borderRadius: 999 }} />
                    </div>
                    <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#374151', width: 28 }}>{val}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!plan && !loading && (
        <div style={styles.emptyState}>
          <span style={{ fontSize: '2rem' }}>🧠</span>
          <p>Select a client, set the plan duration, and click <strong>Generate Treatment Plan</strong> to create an AI-powered week-by-week treatment roadmap.</p>
        </div>
      )}
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const styles = {
  sectionTitle: {
    fontSize: '1.05rem', fontWeight: 800, color: '#111827', margin: '0 0 .35rem',
  },
  sectionDesc: {
    fontSize: '.85rem', color: '#6b7280', margin: '0 0 1.1rem',
  },
  controlRow: {
    display: 'flex', alignItems: 'center', gap: '.75rem',
    flexWrap: 'wrap', marginBottom: '.75rem',
  },
  label: {
    fontSize: '.84rem', fontWeight: 600, color: '#374151',
  },
  select: {
    padding: '.45rem .75rem', borderRadius: 8, border: '1.5px solid #d1d5db',
    fontSize: '.85rem', color: '#374151', background: '#fff', outline: 'none',
  },
  btn: {
    padding: '.5rem 1.1rem', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontWeight: 700, fontSize: '.84rem', transition: 'opacity .15s',
  },
  btnPrimary: {
    background: '#4f46e5', color: '#fff',
  },
  btnWarning: {
    background: '#f59e0b', color: '#fff',
  },
  btnSm: {
    padding: '.25rem .65rem', borderRadius: 6, border: 'none', cursor: 'pointer',
    fontWeight: 600, fontSize: '.75rem',
  },
  errorBox: {
    background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8,
    padding: '.65rem .9rem', color: '#991b1b', fontSize: '.85rem',
  },
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: '.6rem', padding: '2.5rem 1.5rem', background: '#f8fafc',
    border: '1.5px dashed #d1d5db', borderRadius: 12, textAlign: 'center',
    color: '#6b7280', fontSize: '.88rem',
  },
  kpiCard: {
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
    padding: '.9rem 1rem', display: 'flex', flexDirection: 'column', gap: '.15rem',
  },
  kpiLabel: {
    fontSize: '.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em',
  },
  kpiValue: {
    fontSize: '1.15rem', fontWeight: 800,
  },
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PredictiveAnalyticsDashboardPage() {
  const { getAccessTokenSilently } = useAuth0();

  const [activeTab,      setActiveTab]    = useState('activity');
  const [selectedClient, setClient]       = useState('');
  const [selectedDim,    setSelectedDim]  = useState('emotionalAdaptive');
  const [modelStatus,    setModelStatus]  = useState(null);
  const [clients,        setClients]      = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);

  // ── Load real client list on mount ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadClients() {
      try {
        const data = await mlService.fetchClients(getAccessTokenSilently);
        if (cancelled) return;
        const list = data.clients || [];
        setClients(list);
        if (list.length > 0) setClient(list[0]._id);
      } catch {
        // Non-fatal — leave the selector empty; individual tabs will show errors.
      } finally {
        if (!cancelled) setClientsLoading(false);
      }
    }
    loadClients();
    return () => { cancelled = true; };
  }, [getAccessTokenSilently]);

  // ── Load real model status on mount ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadModelStatus() {
      try {
        const data = await mlService.getModelStatus(getAccessTokenSilently);
        if (!cancelled) setModelStatus(data);
      } catch {
        // Non-fatal — header badge simply won't appear.
      }
    }
    loadModelStatus();
    return () => { cancelled = true; };
  }, [getAccessTokenSilently]);

  const selectedClientName = (() => {
    const c = clients.find(cl => cl._id === selectedClient);
    if (!c) return '—';
    return c.clientIdentifier || `${c.firstName || ''} ${c.lastName || ''}`.trim() || '—';
  })();

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      <SiteHeader />

      {/* Top Nav */}
      <nav style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '.5rem 1.5rem', display: 'flex', gap: '.25rem', flexWrap: 'wrap',
      }}>
        {NAV.map(n => (
          <Link
            key={n.key}
            to={n.to}
            style={{
              padding: '.4rem .85rem', borderRadius: 8, textDecoration: 'none',
              fontSize: '.83rem', fontWeight: 600,
              background: n.key === 'ml' ? '#eef2ff' : 'transparent',
              color: n.key === 'ml' ? '#4f46e5' : '#6b7280',
            }}
          >
            {n.label}
          </Link>
        ))}
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Page header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111827', margin: 0 }}>
                🤖 Predictive Analytics &amp; ML Insights
              </h1>
              <p style={{ fontSize: '.85rem', color: '#6b7280', margin: '.3rem 0 0' }}>
                AI-powered clinical decision support — treatment planning, regression alerts, and effectiveness predictions
              </p>
            </div>
            {modelStatus && (
              <div style={{
                background: '#d1fae5', border: '1px solid #a7f3d0', borderRadius: 8,
                padding: '.4rem .85rem', fontSize: '.78rem', color: '#065f46', fontWeight: 600,
              }}>
                ✅ Engine v{modelStatus.engineVersion} · {modelStatus.totalPredictionsMade} predictions made
              </div>
            )}
          </div>
        </div>

        {/* Client selector */}
        <div style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
          padding: '1rem 1.25rem', marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '.85rem', fontWeight: 700, color: '#374151' }}>👤 Active Client:</span>
          {clientsLoading ? (
            <span style={{ fontSize: '.83rem', color: '#9ca3af' }}>Loading clients…</span>
          ) : (
            <select
              style={{ ...styles.select, minWidth: 200 }}
              value={selectedClient}
              onChange={e => setClient(e.target.value)}
            >
              {clients.length === 0 && (
                <option value="">No clients found</option>
              )}
              {clients.map(c => {
                const label = c.clientIdentifier || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c._id;
                const dob   = c.dateOfBirth ? new Date(c.dateOfBirth) : null;
                const age   = dob ? Math.floor((Date.now() - dob) / (365.25 * 24 * 3600 * 1000)) : null;
                return (
                  <option key={c._id} value={c._id}>
                    {label}{age != null ? ` · ${age}y` : ''}
                  </option>
                );
              })}
            </select>
          )}
          <span style={{ fontSize: '.82rem', color: '#9ca3af' }}>
            Predictions are calculated for <strong style={{ color: '#374151' }}>{selectedClientName}</strong>
          </span>
        </div>

        {/* Disclaimer */}
        <DisclaimerBanner />

        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: '.3rem', marginBottom: '1rem',
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
          padding: '.4rem', flexWrap: 'wrap',
        }}>
          {TABS.map(t => (
            <button
              key={t.key}
              style={{
                flex: '1 1 auto', padding: '.55rem .75rem', borderRadius: 8, border: 'none',
                cursor: 'pointer', fontWeight: 700, fontSize: '.82rem',
                background: activeTab === t.key ? '#4f46e5' : 'transparent',
                color: activeTab === t.key ? '#fff' : '#6b7280',
                transition: 'all .15s',
              }}
              onClick={() => setActiveTab(t.key)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
          padding: '1.5rem',
        }}>
          {activeTab === 'activity' && (
            <ActivityPredictorTab
              selectedClient={selectedClient}
              selectedDim={selectedDim}
              setSelectedDim={setSelectedDim}
              getTokenFn={getAccessTokenSilently}
            />
          )}
          {activeTab === 'regression' && (
            <RegressionAlertsTab
              selectedClient={selectedClient}
              getTokenFn={getAccessTokenSilently}
            />
          )}
          {activeTab === 'frequency' && (
            <SessionFrequencyTab
              selectedClient={selectedClient}
              getTokenFn={getAccessTokenSilently}
            />
          )}
          {activeTab === 'goal' && (
            <GoalProbabilityTab
              selectedClient={selectedClient}
              selectedDim={selectedDim}
              getTokenFn={getAccessTokenSilently}
            />
          )}
          {activeTab === 'plan' && (
            <TreatmentPlanTab
              selectedClient={selectedClient}
              selectedDim={selectedDim}
              getTokenFn={getAccessTokenSilently}
            />
          )}
        </div>

        {/* Model health footer */}
        <div style={{
          marginTop: '1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0',
          borderRadius: 10, padding: '1rem 1.25rem',
        }}>
          <h4 style={{ fontSize: '.85rem', fontWeight: 700, color: '#374151', margin: '0 0 .6rem' }}>
            🔬 Model Health &amp; Transparency
          </h4>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '.8rem', color: '#6b7280' }}>
            <span>Engine: <strong style={{ color: '#374151' }}>v{modelStatus?.engineVersion || '1.0.0'}</strong></span>
            <span>Status: <strong style={{ color: '#059669' }}>✅ Operational</strong></span>
            <span>Approach: <strong style={{ color: '#374151' }}>Statistical heuristic (evidence-based)</strong></span>
            <span>Privacy: <strong style={{ color: '#374151' }}>No PII in model inputs</strong></span>
            <Link
              to="/iatlas/ml/insights"
              style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}
              onClick={() => setActiveTab('activity')}
            >
              📊 View full model status →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
