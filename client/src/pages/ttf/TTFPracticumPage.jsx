/**
 * TTFPracticumPage.jsx
 * Practicum submission & supervision interface.
 * Route: /iatlas/ttf/practicum
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import SiteHeader from '../../components/SiteHeader.jsx';
import PracticumSessionCard from '../../components/ttf/PracticumSessionCard.jsx';
import { apiFetch } from '../../lib/apiFetch.js';

const REFLECTION_QUESTIONS = [
  { key: 'protocol',    label: 'What protocol did you deliver, and to whom?' },
  { key: 'wentWell',    label: 'What went well in this session?' },
  { key: 'different',   label: 'What would you do differently next time?' },
  { key: 'embodied',    label: 'How did you embody dimensional resilience during facilitation?' },
];

export default function TTFPracticumPage() {
  const navigate = useNavigate();
  const { getAccessTokenSilently, isAuthenticated, loginWithRedirect } = useAuth0();

  const [sessions,     setSessions]    = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [error,        setError]       = useState('');
  const [showForm,     setShowForm]    = useState(false);
  const [submitting,   setSubmitting]  = useState(false);
  const [submitError,  setSubmitError] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);

  const [form, setForm] = useState({
    sessionNumber: 1,
    videoUrl:      '',
    reflections:   { protocol: '', wentWell: '', different: '', embodied: '' },
  });

  useEffect(() => {
    document.title = 'Practicum | TTF';
    if (!isAuthenticated) { loginWithRedirect(); return; }
    loadSessions();
  }, [isAuthenticated]);

  async function loadSessions() {
    setLoading(true);
    try {
      const res = await apiFetch('/api/ttf/practicum', {}, getAccessTokenSilently);
      if (!res.ok) throw new Error('Failed to load practicum sessions.');
      const data = await res.json();
      setSessions(data.practicumSessions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const nextSessionNumber = Math.max(
    1,
    ...(sessions.map(s => s.sessionNumber + 1)),
    1
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    if (!form.videoUrl && !form.reflections.protocol) {
      setSubmitError('Please provide a video URL or at least your reflection answers.');
      return;
    }
    setSubmitting(true);
    try {
      const reflectionNotes = REFLECTION_QUESTIONS
        .map(q => `${q.label}\n${form.reflections[q.key] || '(not answered)'}`)
        .join('\n\n');

      const res = await apiFetch('/api/ttf/practicum/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          sessionNumber:  form.sessionNumber,
          videoUrl:       form.videoUrl,
          reflectionNotes,
          protocol:       form.reflections.protocol,
        }),
      }, getAccessTokenSilently);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Submission failed.');
      }
      setShowForm(false);
      setForm({ sessionNumber: nextSessionNumber + 1, videoUrl: '', reflections: { protocol: '', wentWell: '', different: '', embodied: '' } });
      await loadSessions();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <>
        <SiteHeader activePage="iatlas" />
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
          Loading practicum…
        </main>
      </>
    );
  }

  const approvedCount = sessions.filter(s => s.approved).length;

  return (
    <>
      <SiteHeader activePage="iatlas" />
      <main style={{ minHeight: '100vh', background: '#f8fafc', padding: '0 0 60px' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#0891b2,#4f46e5)', padding: '32px 24px', color: '#fff' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Link to="/iatlas/ttf/dashboard" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, textDecoration: 'none' }}>
              ← Dashboard
            </Link>
            <h1 style={{ margin: '10px 0 6px', fontSize: 26, fontWeight: 800 }}>🎬 Supervised Practicum</h1>
            <p style={{ margin: 0, opacity: 0.85 }}>
              {approvedCount}/3 sessions approved
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>

          {/* Requirements */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, marginBottom: 32 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700, color: '#1f2937' }}>Requirements</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { icon: '🎥', text: 'Deliver & record an IATLAS session' },
                { icon: '📝', text: 'Submit video + reflection notes' },
                { icon: '✅', text: 'Receive supervisor approval' },
                { icon: '🔄', text: 'Repeat for 3 total sessions' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20 }}>{r.icon}</span>
                  <p style={{ margin: 0, fontSize: 13, color: '#374151' }}>{r.text}</p>
                </div>
              ))}
            </div>
          </div>

          {error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{error}</p>}

          {/* Submitted sessions */}
          {sessions.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>Submitted Sessions</h2>
              {sessions.map(s => (
                <PracticumSessionCard
                  key={s._id}
                  session={s}
                  onViewFeedback={() => setSelectedSession(s)}
                />
              ))}
            </div>
          )}

          {/* Submit button */}
          {approvedCount < 3 && !showForm && (
            <button
              onClick={() => {
                setForm(f => ({ ...f, sessionNumber: nextSessionNumber }));
                setShowForm(true);
              }}
              style={{
                background: '#0891b2', color: '#fff', border: 'none',
                borderRadius: 10, padding: '14px 28px',
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
              }}
            >
              + Submit Practicum Session {nextSessionNumber}
            </button>
          )}

          {/* Submission form */}
          {showForm && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 32 }}>
              <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 700, color: '#1f2937' }}>
                Session {form.sessionNumber} Submission
              </h2>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#374151' }}>
                    Session Video URL
                  </label>
                  <input
                    type="url"
                    value={form.videoUrl}
                    onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
                    placeholder="https://vimeo.com/... or YouTube link"
                    style={{
                      width: '100%', padding: '10px 14px', border: '1px solid #d1d5db',
                      borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
                    }}
                  />
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: '#9ca3af' }}>
                    Please ensure participants have signed the practicum consent form before recording.
                  </p>
                </div>

                {REFLECTION_QUESTIONS.map(q => (
                  <div key={q.key} style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#374151' }}>
                      {q.label}
                    </label>
                    <textarea
                      rows={3}
                      value={form.reflections[q.key]}
                      onChange={e => setForm(f => ({ ...f, reflections: { ...f.reflections, [q.key]: e.target.value } }))}
                      style={{
                        width: '100%', padding: '10px 14px', border: '1px solid #d1d5db',
                        borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                ))}

                {submitError && (
                  <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{submitError}</p>
                )}

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      background: '#0891b2', color: '#fff', border: 'none',
                      borderRadius: 8, padding: '12px 24px',
                      fontSize: 14, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer',
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {submitting ? 'Submitting…' : 'Submit Session'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    style={{
                      background: 'none', border: '1px solid #e5e7eb',
                      borderRadius: 8, padding: '12px 24px', fontSize: 14,
                      cursor: 'pointer', color: '#6b7280',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Feedback modal */}
          {selectedSession && (
            <div
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, padding: 24,
              }}
              onClick={() => setSelectedSession(null)}
            >
              <div
                style={{ background: '#fff', borderRadius: 14, padding: 32, maxWidth: 540, width: '100%' }}
                onClick={e => e.stopPropagation()}
              >
                <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#1f2937' }}>
                  Session {selectedSession.sessionNumber} — Supervisor Feedback
                </h3>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {selectedSession.supervisorFeedback}
                </p>
                <button
                  onClick={() => setSelectedSession(null)}
                  style={{
                    marginTop: 20, background: '#4f46e5', color: '#fff', border: 'none',
                    borderRadius: 8, padding: '10px 22px', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
