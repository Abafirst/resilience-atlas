/**
 * TTFModulePage.jsx
 * Individual module content delivery.
 * Route: /iatlas/ttf/module/:moduleNumber
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import SiteHeader from '../../components/SiteHeader.jsx';
import VideoPlayer from '../../components/ttf/VideoPlayer.jsx';
import QuizComponent from '../../components/ttf/QuizComponent.jsx';
import ProgressBar from '../../components/ttf/ProgressBar.jsx';
import { apiFetch } from '../../lib/apiFetch.js';

export default function TTFModulePage() {
  const { moduleNumber } = useParams();
  const navigate = useNavigate();
  const { getAccessTokenSilently, isAuthenticated, loginWithRedirect } = useAuth0();

  const [module,         setModule]         = useState(null);
  const [userProgress,   setUserProgress]   = useState({});
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [marking,        setMarking]        = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { loginWithRedirect(); return; }
    loadModule();
  }, [moduleNumber, isAuthenticated]);

  async function loadModule() {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/api/ttf/module/${moduleNumber}`, {}, getAccessTokenSilently);
      if (res.status === 403) {
        setError('You must complete previous modules before accessing this one.');
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error('Failed to load module.');
      const data = await res.json();
      setModule(data.module);
      setUserProgress(data.userProgress || {});
      document.title = `Module ${moduleNumber}: ${data.module.moduleName} | TTF`;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function markSectionComplete(sectionId) {
    if (marking) return;
    setMarking(true);
    try {
      const res = await apiFetch(
        `/api/ttf/module/${moduleNumber}/section/${sectionId}/complete`,
        { method: 'POST' },
        getAccessTokenSilently
      );
      if (res.ok) {
        const data = await res.json();
        setUserProgress(prev => ({
          ...prev,
          sectionsCompleted: data.completedSections || [],
          completed: data.moduleCompleted,
        }));
        // Auto-advance to next section
        if (activeSectionIdx < (module?.sections?.length || 1) - 1) {
          setActiveSectionIdx(i => i + 1);
        }
      }
    } catch (err) {
      console.error('Failed to mark section complete:', err);
    } finally {
      setMarking(false);
    }
  }

  if (loading) {
    return (
      <>
        <SiteHeader activePage="iatlas" />
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
          Loading module…
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <SiteHeader activePage="iatlas" />
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 32 }}>
          <p style={{ color: '#dc2626', fontSize: 16 }}>{error}</p>
          <Link to="/iatlas/ttf/dashboard" style={{ color: '#4f46e5' }}>← Back to Dashboard</Link>
        </main>
      </>
    );
  }

  if (!module) return null;

  const sections = module.sections || [];
  const activeSection = sections[activeSectionIdx];
  const completedSections = new Set(userProgress.sectionsCompleted || []);
  const totalSections = sections.length;
  const completedCount = completedSections.size;
  const isSectionComplete = activeSection && completedSections.has(activeSection.sectionId);

  return (
    <>
      <SiteHeader activePage="iatlas" />
      <main style={{ minHeight: '100vh', background: '#f8fafc' }}>

        {/* Module header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <Link to="/iatlas/ttf/dashboard" style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none' }}>
              ← Dashboard
            </Link>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1f2937' }}>
                  Module {moduleNumber}: {module.moduleName}
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
                  {completedCount}/{totalSections} sections complete · ⏱ {module.estimatedDuration} min
                </p>
              </div>
              <div style={{ width: 200 }}>
                <ProgressBar value={completedCount} max={totalSections} color="#4f46e5" label="" />
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24 }}>

          {/* Sidebar */}
          <aside>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Sections
                </p>
              </div>
              {sections.map((section, idx) => {
                const done = completedSections.has(section.sectionId);
                const active = idx === activeSectionIdx;
                return (
                  <button
                    key={section.sectionId}
                    onClick={() => setActiveSectionIdx(idx)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '12px 16px',
                      background: active ? '#eef2ff' : '#fff',
                      border: 'none', borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}
                  >
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700,
                      background: done ? '#d1fae5' : active ? '#4f46e5' : '#f3f4f6',
                      color:      done ? '#059669' : active ? '#fff' : '#9ca3af',
                    }}>
                      {done ? '✓' : idx + 1}
                    </span>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#4f46e5' : '#374151', lineHeight: 1.3 }}>
                        {section.sectionTitle}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', textTransform: 'capitalize' }}>
                        {section.contentType} · {section.duration} min
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main content */}
          <div>
            {activeSection && (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 32 }}>
                {/* Section header */}
                <div style={{ marginBottom: 24 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                    {activeSection.contentType} · {activeSection.duration} min
                  </p>
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1f2937' }}>
                    {activeSection.sectionTitle}
                  </h2>
                </div>

                {/* Content by type */}
                {activeSection.contentType === 'video' && (
                  <VideoPlayer url={activeSection.contentUrl} title={activeSection.sectionTitle} transcript={activeSection.transcript} />
                )}

                {(activeSection.contentType === 'reading' || activeSection.contentType === 'reflection') && (
                  <div
                    style={{
                      lineHeight: 1.8, color: '#374151', fontSize: 15,
                      maxWidth: 680,
                    }}
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(activeSection.content || '') }}
                  />
                )}

                {activeSection.contentType === 'quiz' && (
                  <QuizComponent
                    quiz={activeSection.quiz}
                    onPass={(result) => markSectionComplete(activeSection.sectionId)}
                  />
                )}

                {/* Key Takeaways */}
                {(activeSection.keyTakeaways || []).length > 0 && (
                  <div style={{ marginTop: 28, padding: 20, background: '#f0f9ff', borderRadius: 10, border: '1px solid #bae6fd' }}>
                    <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14, color: '#0369a1' }}>Key Takeaways</p>
                    <ul style={{ margin: 0, padding: '0 0 0 20px' }}>
                      {activeSection.keyTakeaways.map((t, i) => (
                        <li key={i} style={{ marginBottom: 6, fontSize: 14, color: '#0c4a6e' }}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Resources */}
                {(activeSection.resources || []).length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 14, color: '#374151' }}>Resources</p>
                    {activeSection.resources.map((r, i) => (
                      <a
                        key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'block', marginBottom: 6, color: '#4f46e5', fontSize: 14, textDecoration: 'none' }}
                      >
                        📄 {r.title}
                      </a>
                    ))}
                  </div>
                )}

                {/* Mark complete (for non-quiz sections) */}
                {activeSection.contentType !== 'quiz' && (
                  <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      onClick={() => activeSectionIdx > 0 && setActiveSectionIdx(i => i - 1)}
                      disabled={activeSectionIdx === 0}
                      style={{
                        background: 'none', border: '1px solid #e5e7eb',
                        borderRadius: 8, padding: '10px 20px', fontSize: 14,
                        cursor: activeSectionIdx === 0 ? 'default' : 'pointer',
                        color: activeSectionIdx === 0 ? '#d1d5db' : '#374151',
                      }}
                    >
                      ← Previous
                    </button>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {!isSectionComplete && (
                        <button
                          onClick={() => markSectionComplete(activeSection.sectionId)}
                          disabled={marking}
                          style={{
                            background: '#4f46e5', color: '#fff', border: 'none',
                            borderRadius: 8, padding: '10px 22px',
                            fontSize: 14, fontWeight: 600, cursor: marking ? 'wait' : 'pointer',
                          }}
                        >
                          {marking ? 'Saving…' : '✓ Mark Complete'}
                        </button>
                      )}
                      {isSectionComplete && activeSectionIdx < sections.length - 1 && (
                        <button
                          onClick={() => setActiveSectionIdx(i => i + 1)}
                          style={{
                            background: '#059669', color: '#fff', border: 'none',
                            borderRadius: 8, padding: '10px 22px',
                            fontSize: 14, fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          Next Section →
                        </button>
                      )}
                      {userProgress.completed && (
                        <Link
                          to="/iatlas/ttf/dashboard"
                          style={{
                            display: 'inline-block', background: '#d1fae5', color: '#065f46',
                            textDecoration: 'none', borderRadius: 8, padding: '10px 22px',
                            fontSize: 14, fontWeight: 600,
                          }}
                        >
                          🎉 Module Complete! Back to Dashboard
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

// Very basic markdown-to-HTML converter for reading content.
// Only handles headings, bold, lists, and line breaks.
function markdownToHtml(md) {
  return md
    .replace(/^### (.+)$/gm, '<h3 style="font-size:16px;font-weight:700;color:#1f2937;margin:20px 0 8px">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 style="font-size:18px;font-weight:800;color:#1f2937;margin:28px 0 10px">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 style="font-size:22px;font-weight:800;color:#1f2937;margin:0 0 16px">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/^- (.+)$/gm,    '<li style="margin-bottom:6px">$1</li>')
    .replace(/(<li.*<\/li>)/gs, '<ul style="padding-left:22px;margin:8px 0">$1</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li style="margin-bottom:6px">$1</li>')
    .replace(/\n\n/g, '<br/><br/>');
}
