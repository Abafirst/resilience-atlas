/**
 * TTFAdminPage.jsx
 * Admin panel for managing TTF cohorts, students, practicum queue, and analytics.
 * Route: /iatlas/ttf/admin
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import SiteHeader from '../../components/SiteHeader.jsx';
import CompetencyRubric from '../../components/ttf/CompetencyRubric.jsx';
import { apiFetch } from '../../lib/apiFetch.js';

const TABS = ['Analytics', 'Cohorts', 'Students', 'Practicum Queue', 'Assessment Queue'];

export default function TTFAdminPage() {
  const { getAccessTokenSilently, isAuthenticated, loginWithRedirect } = useAuth0();
  const [activeTab,  setActiveTab]  = useState('Analytics');
  const [analytics,  setAnalytics]  = useState(null);
  const [cohorts,    setCohorts]    = useState([]);
  const [students,   setStudents]   = useState([]);
  const [queue,      setQueue]      = useState([]);
  const [loading,    setLoading]    = useState({});
  const [error,      setError]      = useState('');

  // Create cohort form
  const [showCohortForm, setShowCohortForm] = useState(false);
  const [cohortForm,     setCohortForm]     = useState({ cohortName: '', startDate: '', endDate: '', maxCapacity: 30 });
  const [cohortSaving,   setCohortSaving]   = useState(false);

  // Practicum review
  const [reviewingSession, setReviewingSession] = useState(null);
  const [reviewForm,  setReviewForm]  = useState({ supervisorFeedback: '', approved: false, needsRevision: false });
  const [reviewSaving, setReviewSaving] = useState(false);

  // Assessment scoring
  const [scoringUser, setScoringUser] = useState(null);
  const [scores, setScores]           = useState({});
  const [scoreFeedback, setScoreFeedback] = useState('');
  const [scoreSaving,   setScoreSaving]   = useState(false);

  useEffect(() => {
    document.title = 'TTF Admin | IATLAS';
    if (!isAuthenticated) { loginWithRedirect(); return; }
    loadTab(activeTab);
  }, [isAuthenticated, activeTab]);

  async function load(key, url) {
    setLoading(l => ({ ...l, [key]: true }));
    try {
      const res = await apiFetch(url, {}, getAccessTokenSilently);
      if (!res.ok) throw new Error(`Failed to load ${key}`);
      return await res.json();
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(l => ({ ...l, [key]: false }));
    }
  }

  async function loadTab(tab) {
    setError('');
    if (tab === 'Analytics') {
      const data = await load('analytics', '/api/ttf/admin/analytics');
      if (data) setAnalytics(data);
    } else if (tab === 'Cohorts') {
      const data = await load('cohorts', '/api/ttf/admin/cohorts');
      if (data) setCohorts(data.cohorts || []);
    } else if (tab === 'Students') {
      const data = await load('students', '/api/ttf/admin/students');
      if (data) setStudents(data.enrollments || []);
    } else if (tab === 'Practicum Queue' || tab === 'Assessment Queue') {
      const data = await load('queue', '/api/ttf/admin/practicum-queue');
      if (data) setQueue(data.queue || []);
    }
  }

  async function createCohort(e) {
    e.preventDefault();
    setCohortSaving(true);
    try {
      const res = await apiFetch('/api/ttf/admin/cohort', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(cohortForm),
      }, getAccessTokenSilently);
      if (!res.ok) throw new Error('Failed to create cohort.');
      setShowCohortForm(false);
      setCohortForm({ cohortName: '', startDate: '', endDate: '', maxCapacity: 30 });
      const data = await load('cohorts', '/api/ttf/admin/cohorts');
      if (data) setCohorts(data.cohorts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCohortSaving(false);
    }
  }

  async function submitPracticumReview(sessionId) {
    setReviewSaving(true);
    try {
      const res = await apiFetch(`/api/ttf/practicum/${sessionId}/review`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(reviewForm),
      }, getAccessTokenSilently);
      if (!res.ok) throw new Error('Failed to submit review.');
      setReviewingSession(null);
      setReviewForm({ supervisorFeedback: '', approved: false, needsRevision: false });
      const data = await load('queue', '/api/ttf/admin/practicum-queue');
      if (data) setQueue(data.queue || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setReviewSaving(false);
    }
  }

  async function submitScore() {
    if (!scoringUser) return;
    setScoreSaving(true);
    try {
      const res = await apiFetch('/api/ttf/assessment/score', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ targetUserId: scoringUser.userId, scores, feedback: scoreFeedback }),
      }, getAccessTokenSilently);
      if (!res.ok) throw new Error('Failed to submit scores.');
      const data = await res.json();
      alert(`Score submitted. Overall: ${data.overallScore}%. ${data.passed ? '✓ Certification issued!' : 'Did not pass.'}`);
      setScoringUser(null);
      setScores({});
      setScoreFeedback('');
    } catch (err) {
      setError(err.message);
    } finally {
      setScoreSaving(false);
    }
  }

  const StatCard = ({ label, value, color = '#4f46e5' }) => (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, textAlign: 'center' }}>
      <p style={{ margin: '0 0 8px', fontSize: 38, fontWeight: 900, color }}>{value ?? '—'}</p>
      <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>{label}</p>
    </div>
  );

  return (
    <>
      <SiteHeader activePage="iatlas" />
      <main style={{ minHeight: '100vh', background: '#f8fafc', padding: '0 0 60px' }}>

        {/* Header */}
        <div style={{ background: '#1f2937', padding: '28px 24px', color: '#fff' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Link to="/iatlas/ttf/dashboard" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'none' }}>
                ← TTF Dashboard
              </Link>
              <h1 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800 }}>🛡️ TTF Admin Panel</h1>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 4 }}>
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'none', border: 'none', padding: '14px 18px',
                  fontSize: 14, fontWeight: activeTab === tab ? 700 : 400,
                  color:      activeTab === tab ? '#4f46e5' : '#6b7280',
                  borderBottom: activeTab === tab ? '2px solid #4f46e5' : '2px solid transparent',
                  cursor: 'pointer',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
          {error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{error}</p>}

          {/* Analytics */}
          {activeTab === 'Analytics' && analytics && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, marginBottom: 32 }}>
                <StatCard label="Total Enrollments" value={analytics.total}                color="#4f46e5" />
                <StatCard label="Certified"          value={analytics.certified}           color="#059669" />
                <StatCard label="In Progress"        value={analytics.inProgress}          color="#d97706" />
                <StatCard label="Completion Rate"    value={`${analytics.completionRate}%`} color="#7c3aed" />
              </div>
            </div>
          )}

          {/* Cohorts */}
          {activeTab === 'Cohorts' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1f2937' }}>Cohorts</h2>
                <button
                  onClick={() => setShowCohortForm(true)}
                  style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  + New Cohort
                </button>
              </div>

              {showCohortForm && (
                <form onSubmit={createCohort} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, marginBottom: 24 }}>
                  <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Create New Cohort</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {[
                      { label: 'Cohort Name', key: 'cohortName', type: 'text' },
                      { label: 'Max Capacity', key: 'maxCapacity', type: 'number' },
                      { label: 'Start Date', key: 'startDate', type: 'date' },
                      { label: 'End Date', key: 'endDate', type: 'date' },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600, color: '#374151' }}>{f.label}</label>
                        <input
                          type={f.type}
                          value={cohortForm[f.key]}
                          onChange={e => setCohortForm(p => ({ ...p, [f.key]: e.target.value }))}
                          required
                          style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                    <button type="submit" disabled={cohortSaving} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                      {cohortSaving ? 'Creating…' : 'Create Cohort'}
                    </button>
                    <button type="button" onClick={() => setShowCohortForm(false)} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer', color: '#6b7280' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {cohorts.map(cohort => (
                <div key={cohort._id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#1f2937' }}>{cohort.cohortName}</h3>
                      <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                        {new Date(cohort.startDate).toLocaleDateString()} – {new Date(cohort.endDate).toLocaleDateString()}
                        &nbsp;·&nbsp;{cohort.enrollmentCount || 0}/{cohort.maxCapacity} enrolled
                      </p>
                    </div>
                    <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: cohort.status === 'active' ? '#d1fae5' : '#f3f4f6', color: cohort.status === 'active' ? '#059669' : '#6b7280' }}>
                      {cohort.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Students */}
          {activeTab === 'Students' && (
            <div>
              <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#1f2937' }}>All Enrollments</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      {['Name', 'Email', 'Role', 'Status', 'Tier', 'Payment', 'Enrolled'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={s._id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                        <td style={{ padding: '10px 14px', color: '#1f2937', fontWeight: 500 }}>{s.userName || '—'}</td>
                        <td style={{ padding: '10px 14px', color: '#6b7280' }}>{s.userEmail || '—'}</td>
                        <td style={{ padding: '10px 14px', color: '#6b7280' }}>{s.userRole || '—'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.status === 'certified' ? '#d1fae5' : s.status === 'in-progress' ? '#fef3c7' : '#f3f4f6', color: s.status === 'certified' ? '#059669' : s.status === 'in-progress' ? '#d97706' : '#6b7280' }}>
                            {s.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#6b7280', textTransform: 'capitalize' }}>{s.tier}</td>
                        <td style={{ padding: '10px 14px', color: '#6b7280', textTransform: 'capitalize' }}>{s.paymentStatus}</td>
                        <td style={{ padding: '10px 14px', color: '#6b7280' }}>{new Date(s.enrollmentDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {students.length === 0 && <p style={{ color: '#6b7280', padding: 16 }}>No enrollments found.</p>}
              </div>
            </div>
          )}

          {/* Practicum Queue */}
          {activeTab === 'Practicum Queue' && (
            <div>
              <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#1f2937' }}>
                Practicum Review Queue ({queue.length})
              </h2>
              {queue.length === 0 && <p style={{ color: '#6b7280' }}>No practicum sessions pending review.</p>}
              {queue.map((item, idx) => (
                <div key={idx} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#1f2937' }}>
                        {item.userName || item.userId} — Session {item.session.sessionNumber}
                      </h3>
                      <p style={{ margin: '0 0 8px', fontSize: 13, color: '#6b7280' }}>
                        {item.userEmail} · Submitted {new Date(item.session.submittedDate).toLocaleDateString()}
                      </p>
                      {item.session.videoUrl && (
                        <a href={item.session.videoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#4f46e5', display: 'block', marginBottom: 8 }}>
                          ▶ View Video
                        </a>
                      )}
                      {item.session.reflectionNotes && (
                        <p style={{ margin: 0, fontSize: 13, color: '#374151', fontStyle: 'italic' }}>
                          {item.session.reflectionNotes.slice(0, 200)}…
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setReviewingSession(item);
                        setReviewForm({ supervisorFeedback: '', approved: false, needsRevision: false });
                      }}
                      style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Assessment Queue */}
          {activeTab === 'Assessment Queue' && (
            <div>
              <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#1f2937' }}>Assessment Queue</h2>
              {students.filter(s => {
                const prog = s.moduleProgress || {};
                return Object.values(prog).filter(p => p.completed).length === 6 && !s.competencyAssessment?.completed;
              }).map(s => (
                <div key={s._id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#1f2937' }}>{s.userName || s.userId}</p>
                    <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{s.userEmail}</p>
                  </div>
                  <button
                    onClick={() => { setScoringUser(s); setScores({}); setScoreFeedback(''); }}
                    style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Score Assessment
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Practicum review modal */}
        {reviewingSession && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
            onClick={() => setReviewingSession(null)}>
            <div style={{ background: '#fff', borderRadius: 14, padding: 32, maxWidth: 560, width: '100%' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>
                Review: {reviewingSession.userName} — Session {reviewingSession.session.sessionNumber}
              </h3>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#374151' }}>Supervisor Feedback *</label>
                <textarea
                  rows={5}
                  value={reviewForm.supervisorFeedback}
                  onChange={e => setReviewForm(f => ({ ...f, supervisorFeedback: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                  <input type="radio" checked={reviewForm.approved} onChange={() => setReviewForm(f => ({ ...f, approved: true, needsRevision: false }))} />
                  <span style={{ fontWeight: 600, color: '#059669' }}>✓ Approve</span>
                </label>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                  <input type="radio" checked={reviewForm.needsRevision} onChange={() => setReviewForm(f => ({ ...f, approved: false, needsRevision: true }))} />
                  <span style={{ fontWeight: 600, color: '#dc2626' }}>↺ Needs Revision</span>
                </label>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => submitPracticumReview(reviewingSession.session._id)}
                  disabled={reviewSaving || !reviewForm.supervisorFeedback}
                  style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: reviewSaving ? 'wait' : 'pointer', opacity: reviewSaving ? 0.7 : 1 }}
                >
                  {reviewSaving ? 'Saving…' : 'Submit Review'}
                </button>
                <button onClick={() => setReviewingSession(null)} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer', color: '#6b7280' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assessment scoring modal */}
        {scoringUser && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24, overflowY: 'auto' }}
            onClick={() => setScoringUser(null)}>
            <div style={{ background: '#fff', borderRadius: 14, padding: 32, maxWidth: 720, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>Score Assessment: {scoringUser.userName}</h3>
              <p style={{ margin: '0 0 24px', fontSize: 13, color: '#6b7280' }}>Minimum average 3.0 required to pass.</p>
              <CompetencyRubric scores={scores} onChange={setScores} readOnly={false} />
              <div style={{ marginTop: 24 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#374151' }}>Assessor Feedback</label>
                <textarea
                  rows={4}
                  value={scoreFeedback}
                  onChange={e => setScoreFeedback(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                <button
                  onClick={submitScore}
                  disabled={scoreSaving || Object.keys(scores).length === 0}
                  style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: scoreSaving ? 'wait' : 'pointer', opacity: scoreSaving ? 0.7 : 1 }}
                >
                  {scoreSaving ? 'Submitting…' : 'Submit Scores'}
                </button>
                <button onClick={() => setScoringUser(null)} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer', color: '#6b7280' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
