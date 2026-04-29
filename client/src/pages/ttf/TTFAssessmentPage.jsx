/**
 * TTFAssessmentPage.jsx
 * Competency assessment interface.
 * Route: /iatlas/ttf/assessment
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import SiteHeader from '../../components/SiteHeader.jsx';
import CompetencyRubric from '../../components/ttf/CompetencyRubric.jsx';
import { apiFetch } from '../../lib/apiFetch.js';

export default function TTFAssessmentPage() {
  const { getAccessTokenSilently, isAuthenticated, loginWithRedirect } = useAuth0();
  const [data,         setData]        = useState(null);
  const [loading,      setLoading]     = useState(true);
  const [error,        setError]       = useState('');
  const [portfolioUrls, setPortfolioUrls] = useState(['']);
  const [submitting,   setSubmitting]  = useState(false);
  const [portfolioSaved, setPortfolioSaved] = useState(false);

  useEffect(() => {
    document.title = 'Competency Assessment | TTF';
    if (!isAuthenticated) { loginWithRedirect(); return; }
    loadAssessment();
  }, [isAuthenticated]);

  async function loadAssessment() {
    setLoading(true);
    try {
      const res = await apiFetch('/api/ttf/assessment', {}, getAccessTokenSilently);
      if (!res.ok) throw new Error('Failed to load assessment.');
      setData(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePortfolioSubmit(e) {
    e.preventDefault();
    const urls = portfolioUrls.filter(u => u.trim());
    if (urls.length === 0) return;
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/ttf/assessment/submit-portfolio', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ portfolioUrls: urls }),
      }, getAccessTokenSilently);
      if (!res.ok) throw new Error('Failed to submit portfolio.');
      setPortfolioSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <>
        <SiteHeader activePage="iatlas" />
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
          Loading assessment…
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <SiteHeader activePage="iatlas" />
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <p style={{ color: '#dc2626' }}>{error}</p>
          <Link to="/iatlas/ttf/dashboard" style={{ color: '#4f46e5' }}>← Back to Dashboard</Link>
        </main>
      </>
    );
  }

  const { assessment, prereqsMet, prereqDetail } = data || {};

  return (
    <>
      <SiteHeader activePage="iatlas" />
      <main style={{ minHeight: '100vh', background: '#f8fafc', padding: '0 0 60px' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', padding: '32px 24px', color: '#fff' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <Link to="/iatlas/ttf/dashboard" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, textDecoration: 'none' }}>
              ← Dashboard
            </Link>
            <h1 style={{ margin: '10px 0 6px', fontSize: 26, fontWeight: 800 }}>🏅 Competency Assessment</h1>
            <p style={{ margin: 0, opacity: 0.85, fontSize: 15 }}>
              {assessment?.completed
                ? `Completed · Score: ${assessment.score}%`
                : 'Final step on your path to TTF Certification'}
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

          {/* Pre-assessment checklist */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 28, marginBottom: 32 }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#1f2937' }}>
              Pre-Assessment Checklist
            </h2>
            {[
              { label: 'All 6 modules completed (100%)',          done: prereqDetail?.allModulesDone },
              { label: 'Personal resilience assessment completed', done: prereqDetail?.personalAssessmentCompleted },
              { label: '3 supervised practicum sessions approved', done: (prereqDetail?.approvedPracticum || 0) >= 3 },
              { label: 'Portfolio submitted',                      done: (data?.assessment?.portfolioUrls || []).length > 0 || portfolioSaved },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <span style={{
                  width: 24, height: 24, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700,
                  background: item.done ? '#d1fae5' : '#f3f4f6',
                  color:      item.done ? '#059669' : '#9ca3af',
                  flexShrink: 0,
                }}>
                  {item.done ? '✓' : '○'}
                </span>
                <span style={{ fontSize: 14, color: item.done ? '#065f46' : '#374151' }}>{item.label}</span>
              </div>
            ))}

            {!prereqsMet && (
              <div style={{ marginTop: 16, padding: '12px 16px', background: '#fef3c7', borderRadius: 8, border: '1px solid #fde68a' }}>
                <p style={{ margin: 0, fontSize: 13, color: '#92400e' }}>
                  Complete all checklist items before your assessment can be scheduled. Your assessor will reach out once your prerequisites are verified.
                </p>
              </div>
            )}
          </div>

          {/* Portfolio submission */}
          {!assessment?.completed && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 28, marginBottom: 32 }}>
              <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#1f2937' }}>Portfolio Submission</h2>
              <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b7280' }}>
                Upload your portfolio documents (Google Drive, Dropbox, or direct links). Required components:
                reflection essay, growth plan, practicum summaries, intervention plan.
              </p>

              {portfolioSaved || (data?.assessment?.portfolioUrls || []).length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#059669' }}>
                  <span style={{ fontSize: 20 }}>✓</span>
                  <span style={{ fontWeight: 600 }}>Portfolio submitted successfully!</span>
                </div>
              ) : (
                <form onSubmit={handlePortfolioSubmit}>
                  {portfolioUrls.map((url, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                      <input
                        type="url"
                        value={url}
                        onChange={e => setPortfolioUrls(urls => urls.map((u, j) => j === i ? e.target.value : u))}
                        placeholder="https://drive.google.com/... or shared link"
                        style={{
                          flex: 1, padding: '10px 14px', border: '1px solid #d1d5db',
                          borderRadius: 8, fontSize: 14,
                        }}
                      />
                      {i > 0 && (
                        <button
                          type="button"
                          onClick={() => setPortfolioUrls(urls => urls.filter((_, j) => j !== i))}
                          style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: 8, padding: '8px 12px', color: '#dc2626', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPortfolioUrls(urls => [...urls, ''])}
                    style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', color: '#6b7280', marginBottom: 16 }}
                  >
                    + Add another document
                  </button>
                  <br />
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      background: '#7c3aed', color: '#fff', border: 'none',
                      borderRadius: 8, padding: '12px 24px',
                      fontSize: 14, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer',
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {submitting ? 'Saving…' : 'Submit Portfolio'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Assessment results (if completed) */}
          {assessment?.completed && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 28, marginBottom: 32 }}>
              <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#1f2937' }}>Assessment Results</h2>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 16 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: assessment.score >= 85 ? '#d1fae5' : '#fef3c7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, fontWeight: 800, color: assessment.score >= 85 ? '#059669' : '#d97706',
                }}>
                  {assessment.score}%
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1f2937' }}>
                    {assessment.score >= 85 ? '🎉 Assessment Passed!' : 'Assessment — Not Yet Passing'}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>
                    Completed {new Date(assessment.completedDate).toLocaleDateString()} · Passing score: 85%
                  </p>
                </div>
              </div>
              {assessment.feedback && (
                <div style={{ padding: '12px 16px', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd', fontSize: 14, color: '#0c4a6e' }}>
                  <strong>Assessor Feedback:</strong> {assessment.feedback}
                </div>
              )}
              {assessment.score >= 85 && (
                <Link
                  to="/iatlas/ttf/certificate"
                  style={{
                    display: 'inline-block', marginTop: 16, background: '#4f46e5', color: '#fff',
                    textDecoration: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 700,
                  }}
                >
                  View Your Certificate →
                </Link>
              )}
            </div>
          )}

          {/* Competency rubric preview */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 28 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#1f2937' }}>Competency Framework</h2>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b7280' }}>
              Your assessor will evaluate you on these seven competency areas using a 1–4 scale. A minimum average of 3.0 is required to pass.
            </p>
            <CompetencyRubric readOnly scores={assessment?.scores || {}} />
          </div>
        </div>
      </main>
    </>
  );
}
