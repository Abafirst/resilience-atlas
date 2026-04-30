/**
 * ClientOutcomeReportPage.jsx
 * IATLAS Clinical — Client Outcome Report generator.
 *
 * Route: /iatlas/clinical/outcome-reports/:clientId
 *
 * Allows Practitioner-tier users to:
 *   • View baseline vs current dimensional progress (radar chart)
 *   • See session-by-session outcome trends (line chart)
 *   • Review treatment goal statuses
 *   • Download a formatted PDF outcome report
 *
 * Access: Practitioner, Practice, Enterprise tiers only.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';
import IATLASUnlockModal from '../components/IATLAS/IATLASUnlockModal.jsx';
import ProgressRadarChart from '../components/IATLAS/Clinical/ProgressRadarChart.jsx';
import SessionTrendChart from '../components/IATLAS/Clinical/SessionTrendChart.jsx';
import { hasProfessionalAccess } from '../utils/iatlasGating.js';
import {
  getClientProgressData,
  generateClientOutcomeReport,
} from '../api/clinical.js';

// ── Status badge ──────────────────────────────────────────────────────────────

function GoalStatusBadge({ status }) {
  const styles = {
    'in-progress':   { background: '#dbeafe', color: '#1e40af', label: 'In Progress' },
    achieved:        { background: '#d1fae5', color: '#065f46', label: 'Achieved' },
    discontinued:    { background: '#fee2e2', color: '#991b1b', label: 'Discontinued' },
  };
  const s = styles[status] || { background: '#f1f5f9', color: '#374151', label: status };
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px',
      borderRadius: 999, background: s.background, color: s.color,
    }}>
      {s.label}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ClientOutcomeReportPage() {
  const { clientId } = useParams();
  const { getAccessTokenSilently } = useAuth0();

  const [hasPro, setHasPro]             = useState(null);
  const [showUpgrade, setShowUpgrade]   = useState(false);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfError, setPdfError]         = useState('');

  // ── Dark mode ─────────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const t = localStorage.getItem('ra-theme');
      if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
      else if (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.setAttribute('data-theme', 'dark');
    } catch (_) {}
  }, []);

  // ── Tier check ────────────────────────────────────────────────────────────

  useEffect(() => {
    const pro = hasProfessionalAccess();
    setHasPro(pro);
    if (!pro) setShowUpgrade(true);
  }, []);

  // ── Load progress data ────────────────────────────────────────────────────

  const loadProgress = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError('');
    try {
      const data = await getClientProgressData(getAccessTokenSilently, clientId);
      setProgressData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [clientId, getAccessTokenSilently]);

  useEffect(() => {
    if (hasPro) loadProgress();
  }, [hasPro, loadProgress]);

  // ── PDF download ──────────────────────────────────────────────────────────

  async function handleGenerateReport() {
    setIsGenerating(true);
    setPdfError('');
    try {
      await generateClientOutcomeReport(getAccessTokenSilently, clientId);
    } catch (err) {
      setPdfError(err.message || 'Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const baseline = progressData?.baselineAssessment?.dimensionScores || {};
  const current  = progressData?.currentAssessment?.dimensionScores  || {};

  return (
    <>
      <SiteHeader activePage="iatlas" />
      <DarkModeHint />
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

      {showUpgrade && (
        <IATLASUnlockModal
          variant="professional"
          onClose={() => setShowUpgrade(false)}
        />
      )}

      <main id="main-content" className="cor-page">
        {/* ── Breadcrumb ── */}
        <nav className="cor-breadcrumb" aria-label="Breadcrumb">
          <Link to="/iatlas">IATLAS</Link>
          <span> › </span>
          <Link to="/iatlas/clinical/session-plans">Clinical</Link>
          <span> › </span>
          <span>Outcome Report</span>
          {clientId && <><span> › </span><span>{clientId}</span></>}
        </nav>

        {/* ── Page header ── */}
        <div className="cor-header">
          <div>
            <h1 className="cor-title">Client Outcome Report</h1>
            <p className="cor-subtitle">
              Assessment scores, session trends, and goal summaries for insurance
              documentation and clinical records. Assessment data is for adult clients (18+) only.
            </p>
          </div>
          {hasPro && progressData && (
            <button
              className="cor-btn-primary"
              onClick={handleGenerateReport}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating PDF…' : 'Download PDF Report'}
            </button>
          )}
        </div>

        <div className="cor-content">
          {/* Tier paywall */}
          {hasPro === false && !showUpgrade && (
            <div className="cor-upgrade-banner">
              <p>
                Outcome reports are available for <strong>Practitioner</strong>,{' '}
                <strong>Practice</strong>, and <strong>Enterprise</strong> tiers.
              </p>
              <button className="cor-btn-primary" onClick={() => setShowUpgrade(true)}>
                Upgrade to Practitioner
              </button>
            </div>
          )}

          {/* No clientId */}
          {hasPro && !clientId && (
            <div className="cor-empty">
              <p>No client selected. Navigate here from a client&rsquo;s session plan.</p>
              <Link to="/iatlas/clinical/session-plans" className="cor-link">
                ← Go to Session Plans
              </Link>
            </div>
          )}

          {/* Loading */}
          {hasPro && clientId && loading && (
            <div className="cor-loading">Loading client progress data…</div>
          )}

          {/* Error */}
          {hasPro && error && (
            <div className="cor-error">
              <strong>Error:</strong> {error}
              <button className="cor-retry-btn" onClick={loadProgress}>Retry</button>
            </div>
          )}

          {/* PDF error */}
          {pdfError && (
            <div className="cor-error" style={{ marginBottom: '1rem' }}>
              <strong>PDF Error:</strong> {pdfError}
            </div>
          )}

          {/* Progress content */}
          {hasPro && progressData && !loading && (
            <>
              {/* ── Summary cards ── */}
              <div className="cor-cards">
                <div className="cor-card">
                  <div className="cor-card-label">Total Sessions</div>
                  <div className="cor-card-value">
                    {progressData.sessionHistory?.length ?? 0}
                  </div>
                </div>
                <div className="cor-card">
                  <div className="cor-card-label">Treatment Start</div>
                  <div className="cor-card-value">
                    {progressData.createdAt
                      ? new Date(progressData.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        })
                      : '—'}
                  </div>
                </div>
                <div className="cor-card">
                  <div className="cor-card-label">Active Goals</div>
                  <div className="cor-card-value">
                    {(progressData.treatmentGoals || []).filter(g => g.status === 'in-progress').length}
                  </div>
                </div>
                <div className="cor-card">
                  <div className="cor-card-label">Goals Achieved</div>
                  <div className="cor-card-value cor-card-value--green">
                    {(progressData.treatmentGoals || []).filter(g => g.status === 'achieved').length}
                  </div>
                </div>
              </div>

              {/* ── Dimensional progress ── */}
              <section className="cor-section">
                <h2 className="cor-section-title">Dimensional Assessment Scores</h2>
                <p className="cor-section-desc">
                  Scores from the 72-question Resilience Atlas assessment (adults 18+ only).
                  Radar chart comparing baseline (intake) scores to current scores across
                  all six resilience dimensions.
                </p>
                <div className="cor-chart-wrap">
                  <ProgressRadarChart baseline={baseline} current={current} />
                </div>

                {/* Dimension table */}
                <table className="cor-dim-table">
                  <thead>
                    <tr>
                      <th>Dimension</th>
                      <th>Baseline</th>
                      <th>Current</th>
                      <th>Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DIMENSION_KEYS.map((dim) => {
                      const b = baseline[dim] ?? 0;
                      const c = current[dim]  ?? 0;
                      const delta = c - b;
                      return (
                        <tr key={dim}>
                          <td>{DIMENSION_LABELS[dim]}</td>
                          <td>{b}</td>
                          <td>{c}</td>
                          <td className={delta > 0 ? 'cor-pos' : delta < 0 ? 'cor-neg' : ''}>
                            {delta > 0 ? `+${delta}` : delta}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>

              {/* ── Session trend ── */}
              <section className="cor-section">
                <h2 className="cor-section-title">Session Outcome Trends</h2>
                <p className="cor-section-desc">
                  Subjective (client self-report, 1–10) and Objective (clinician
                  observation, 1–10) scores across all recorded sessions.
                </p>
                <div className="cor-chart-wrap">
                  <SessionTrendChart sessions={progressData.sessionHistory || []} />
                </div>
              </section>

              {/* ── Treatment goals ── */}
              <section className="cor-section">
                <h2 className="cor-section-title">Treatment Goals</h2>
                {(progressData.treatmentGoals || []).length === 0 ? (
                  <p className="cor-empty-text">No treatment goals recorded yet.</p>
                ) : (
                  <ul className="cor-goals-list">
                    {progressData.treatmentGoals.map((goal, idx) => (
                      <li key={goal.goalId || idx} className="cor-goal-item">
                        <div className="cor-goal-header">
                          <span className="cor-goal-desc">{goal.description}</span>
                          <GoalStatusBadge status={goal.status} />
                        </div>
                        <div className="cor-goal-meta">
                          {goal.dimension && (
                            <span className="cor-goal-dim">{goal.dimension}</span>
                          )}
                          <div className="cor-progress-bar-wrap">
                            <div
                              className="cor-progress-bar-fill"
                              style={{ width: `${goal.progressPercent ?? 0}%` }}
                            />
                          </div>
                          <span className="cor-progress-pct">{goal.progressPercent ?? 0}%</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* ── Recent sessions ── */}
              <section className="cor-section">
                <h2 className="cor-section-title">Recent Sessions</h2>
                {(progressData.sessionHistory || []).length === 0 ? (
                  <p className="cor-empty-text">No sessions recorded yet.</p>
                ) : (
                  <div className="cor-sessions-list">
                    {[...(progressData.sessionHistory || [])].reverse().slice(0, 10).map((s, idx) => (
                      <div key={s.sessionId || idx} className="cor-session-item">
                        <div className="cor-session-head">
                          <strong>
                            Session {s.sessionNumber ?? '—'}
                          </strong>
                          <span className="cor-session-date">
                            {s.sessionDate
                              ? new Date(s.sessionDate).toLocaleDateString('en-US', {
                                  year: 'numeric', month: 'short', day: 'numeric',
                                })
                              : 'Date unknown'}
                          </span>
                        </div>
                        {s.focus && (
                          <div className="cor-session-focus">Focus: {s.focus}</div>
                        )}
                        <div className="cor-session-scores">
                          <span>Subjective: {s.outcomeMeasures?.subjective ?? '—'}/10</span>
                          <span>Objective: {s.outcomeMeasures?.objective ?? '—'}/10</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ── Bottom PDF button ── */}
              <div className="cor-pdf-footer">
                <div className="cor-pdf-info">
                  <h3>Export for Insurance Documentation</h3>
                  <p>
                    Download a formatted PDF report suitable for insurance documentation,
                    clinical supervision, and client records.
                  </p>
                  <ul className="cor-pdf-includes">
                    <li>Baseline vs. current dimensional scores</li>
                    <li>Treatment goal progress summary</li>
                    <li>Session-by-session outcome measures</li>
                    <li>Protocols used and clinical notes</li>
                  </ul>
                </div>
                <button
                  className="cor-btn-primary cor-btn-large"
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating PDF…' : 'Generate Outcome Report (PDF)'}
                </button>
              </div>
            </>
          )}

          {/* Empty state when no data yet */}
          {hasPro && clientId && !loading && !error && !progressData && (
            <div className="cor-empty">
              <p>No progress data found for client <strong>{clientId}</strong>.</p>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                Create a progress record from a session plan to start tracking outcomes.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DIMENSION_KEYS = [
  'agenticGenerative',
  'somaticRegulative',
  'cognitiveNarrative',
  'relationalConnective',
  'emotionalAdaptive',
  'spiritualExistential',
];

const DIMENSION_LABELS = {
  agenticGenerative:    'Agentic-Generative',
  somaticRegulative:    'Somatic-Regulative',
  cognitiveNarrative:   'Cognitive-Interpretive',
  relationalConnective: 'Relational-Connective',
  emotionalAdaptive:    'Emotional-Adaptive',
  spiritualExistential: 'Spiritual-Existential',
};

// ── Styles ────────────────────────────────────────────────────────────────────

const PAGE_CSS = `
.cor-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 0 0 4rem;
}

.cor-breadcrumb {
  padding: 1rem 1.5rem 0;
  font-size: 0.82rem;
  color: #94a3b8;
}
.cor-breadcrumb a { color: #059669; text-decoration: none; }
.cor-breadcrumb a:hover { text-decoration: underline; }

.cor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1.5rem 1.5rem 1rem;
  max-width: 1000px;
  margin: 0 auto;
}

.cor-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}
.cor-subtitle {
  color: #64748b;
  font-size: 0.95rem;
  margin: 0.25rem 0 0;
  max-width: 600px;
}

.cor-btn-primary {
  background: #059669;
  color: #fff;
  border: none;
  padding: 0.65rem 1.4rem;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}
.cor-btn-primary:hover:not(:disabled) { background: #047857; }
.cor-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.cor-btn-large { padding: 0.85rem 2rem; font-size: 1rem; }

.cor-content {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.cor-upgrade-banner {
  background: #d1fae5;
  border: 1.5px solid #6ee7b7;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}
.cor-upgrade-banner p { margin: 0; color: #065f46; }

.cor-loading {
  text-align: center;
  color: #64748b;
  padding: 3rem;
  font-size: 0.95rem;
}

.cor-error {
  background: #fee2e2;
  border: 1.5px solid #fca5a5;
  border-radius: 10px;
  padding: 1rem;
  color: #991b1b;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}
.cor-retry-btn {
  background: #dc2626; color: #fff; border: none;
  padding: 0.4rem 0.9rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem;
}
.cor-retry-btn:hover { background: #b91c1c; }

.cor-empty {
  text-align: center;
  color: #64748b;
  padding: 3rem;
}
.cor-empty-text { color: #94a3b8; font-size: 0.9rem; }
.cor-link { color: #059669; text-decoration: none; font-weight: 600; }
.cor-link:hover { text-decoration: underline; }

/* ── Summary cards ── */
.cor-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}
.cor-card {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.2rem 1.4rem;
  text-align: center;
}
.cor-card-label { font-size: 0.78rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
.cor-card-value { font-size: 1.8rem; font-weight: 800; color: #0f172a; margin-top: 0.25rem; }
.cor-card-value--green { color: #059669; }

/* ── Section ── */
.cor-section {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem 1.75rem;
  margin-bottom: 1.5rem;
}
.cor-section-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.35rem;
}
.cor-section-desc {
  color: #64748b;
  font-size: 0.88rem;
  margin: 0 0 1.25rem;
}
.cor-chart-wrap {
  margin-bottom: 1.25rem;
}

/* ── Dimension table ── */
.cor-dim-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}
.cor-dim-table th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  border-bottom: 2px solid #e2e8f0;
  color: #374151;
  font-weight: 700;
}
.cor-dim-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  color: #374151;
}
.cor-pos { color: #059669; font-weight: 700; }
.cor-neg { color: #dc2626; font-weight: 700; }

/* ── Goals ── */
.cor-goals-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.85rem; }
.cor-goal-item {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.9rem 1.1rem;
}
.cor-goal-header { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
.cor-goal-desc { font-weight: 600; color: #0f172a; flex: 1; font-size: 0.92rem; }
.cor-goal-meta { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.cor-goal-dim { font-size: 0.78rem; color: #94a3b8; }
.cor-progress-bar-wrap { flex: 1; min-width: 80px; height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
.cor-progress-bar-fill { height: 100%; background: #059669; border-radius: 999px; transition: width 0.4s ease; }
.cor-progress-pct { font-size: 0.82rem; font-weight: 700; color: #374151; white-space: nowrap; }

/* ── Sessions ── */
.cor-sessions-list { display: flex; flex-direction: column; gap: 0.75rem; }
.cor-session-item {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.85rem 1.1rem;
}
.cor-session-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.3rem; }
.cor-session-head strong { color: #0f172a; font-size: 0.92rem; }
.cor-session-date { font-size: 0.82rem; color: #94a3b8; }
.cor-session-focus { font-size: 0.85rem; color: #374151; margin-bottom: 0.3rem; }
.cor-session-scores { display: flex; gap: 1.5rem; font-size: 0.82rem; color: #64748b; }

/* ── PDF footer ── */
.cor-pdf-footer {
  background: #f0fdf4;
  border: 1.5px solid #bbf7d0;
  border-radius: 16px;
  padding: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
  margin-top: 2rem;
}
.cor-pdf-info h3 { font-size: 1rem; font-weight: 800; color: #065f46; margin: 0 0 0.4rem; }
.cor-pdf-info p { font-size: 0.88rem; color: #047857; margin: 0 0 0.75rem; }
.cor-pdf-includes { list-style: none; padding: 0; margin: 0; }
.cor-pdf-includes li { font-size: 0.85rem; color: #047857; padding: 0.15rem 0; }
.cor-pdf-includes li::before { content: "✓  "; font-weight: 700; }

/* ── Dark mode ── */
[data-theme="dark"] .cor-page { background: #0f172a; }
[data-theme="dark"] .cor-title { color: #f8fafc; }
[data-theme="dark"] .cor-subtitle { color: #94a3b8; }
[data-theme="dark"] .cor-card { background: #1e293b; border-color: #334155; }
[data-theme="dark"] .cor-card-label { color: #94a3b8; }
[data-theme="dark"] .cor-card-value { color: #f1f5f9; }
[data-theme="dark"] .cor-section { background: #1e293b; border-color: #334155; }
[data-theme="dark"] .cor-section-title { color: #f1f5f9; }
[data-theme="dark"] .cor-section-desc { color: #94a3b8; }
[data-theme="dark"] .cor-dim-table th { color: #cbd5e1; border-color: #334155; }
[data-theme="dark"] .cor-dim-table td { color: #cbd5e1; border-color: #1e293b; }
[data-theme="dark"] .cor-goal-item { background: #0f172a; border-color: #334155; }
[data-theme="dark"] .cor-goal-desc { color: #f1f5f9; }
[data-theme="dark"] .cor-session-item { background: #0f172a; border-color: #334155; }
[data-theme="dark"] .cor-session-head strong { color: #f1f5f9; }
[data-theme="dark"] .cor-pdf-footer { background: #042f2e; border-color: #065f46; }

@media (max-width: 640px) {
  .cor-header { padding: 1rem; }
  .cor-content { padding: 0 1rem; }
  .cor-title { font-size: 1.35rem; }
  .cor-section { padding: 1.25rem; border-radius: 12px; }
  .cor-pdf-footer { flex-direction: column; }
  .cor-dim-table th, .cor-dim-table td { padding: 0.4rem 0.5rem; }
}
`;
