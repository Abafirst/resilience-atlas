/**
 * TTFDashboardPage.jsx
 * Student dashboard for the Train the Facilitator program.
 * Route: /iatlas/ttf/dashboard
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import SiteHeader from '../../components/SiteHeader.jsx';
import DarkModeHint from '../../components/DarkModeHint.jsx';
import ModuleCard from '../../components/ttf/ModuleCard.jsx';
import ProgressBar from '../../components/ttf/ProgressBar.jsx';
import { apiFetch } from '../../lib/apiFetch.js';

const MODULE_COLORS = ['#4f46e5','#059669','#db2777','#d97706','#0891b2','#7c3aed'];
const MODULE_BG     = ['#eef2ff','#d1fae5','#fce7f3','#fef3c7','#e0f2fe','#f5f3ff'];
const MODULE_PREREQS = [[], [1], [1,2], [1,2,3], [1,2,3,4], [1,2,3,4,5]];

export default function TTFDashboardPage() {
  const navigate = useNavigate();
  const { getAccessTokenSilently, isAuthenticated, loginWithRedirect } = useAuth0();
  const [data,    setData]    = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    document.title = 'TTF Dashboard | IATLAS';
    if (!isAuthenticated) { loginWithRedirect(); return; }
    loadDashboard();
  }, [isAuthenticated]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [dashRes, modRes] = await Promise.all([
        apiFetch('/api/ttf/dashboard', {}, getAccessTokenSilently),
        apiFetch('/api/ttf/modules',   {}, getAccessTokenSilently),
      ]);

      if (dashRes.status === 404) {
        navigate('/iatlas/ttf/enroll');
        return;
      }
      if (!dashRes.ok) throw new Error('Failed to load dashboard.');

      const dashData = await dashRes.json();
      const modData  = modRes.ok ? await modRes.json() : { modules: [] };

      setData(dashData);
      setModules(modData.modules || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <SiteHeader activePage="iatlas" />
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
          Loading your dashboard…
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
          <Link to="/iatlas/ttf/enroll" style={{ color: '#4f46e5' }}>Enroll in TTF →</Link>
        </main>
      </>
    );
  }

  const { enrollment, cohort, completedModules, totalModules, approvedPracticum, requiredPracticum } = data || {};
  const moduleProgress = enrollment?.moduleProgress || {};

  function getModuleStatus(moduleNumber) {
    const key    = `module${moduleNumber}`;
    const prog   = moduleProgress[key] || {};
    const prereqs = MODULE_PREREQS[moduleNumber - 1] || [];
    const prereqsMet = prereqs.every(n => moduleProgress[`module${n}`]?.completed);

    if (!prereqsMet && moduleNumber > 1) return 'locked';
    if (prog.completed)                  return 'completed';
    if ((prog.sectionsCompleted || []).length > 0) return 'in-progress';
    return 'not-started';
  }

  const certStatus = enrollment?.status;
  const nextStep = (() => {
    for (let i = 1; i <= 6; i++) {
      if (!moduleProgress[`module${i}`]?.completed) return `Complete Module ${i}`;
    }
    if (!enrollment?.personalAssessmentCompleted) return 'Complete your personal resilience assessment';
    if (approvedPracticum < requiredPracticum) return `Submit Practicum Session ${approvedPracticum + 1}`;
    if (!enrollment?.competencyAssessment?.completed) return 'Schedule your competency assessment';
    return 'You\'re certified! 🎉';
  })();

  return (
    <>
      <SiteHeader activePage="iatlas" />
      <DarkModeHint />
      <main style={{ minHeight: '100vh', background: '#f8fafc', padding: '0 0 60px' }}>

        {/* Welcome banner */}
        <div style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', padding: '36px 24px', color: '#fff' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800 }}>
              Welcome back, {enrollment?.userName?.split(' ')[0] || 'Facilitator'}! 👋
            </h1>
            {cohort && (
              <p style={{ margin: '0 0 20px', opacity: 0.85, fontSize: 15 }}>
                {cohort.cohortName} · {new Date(cohort.startDate).toLocaleDateString()} – {new Date(cohort.endDate).toLocaleDateString()}
              </p>
            )}
            <ProgressBar
              value={completedModules}
              max={totalModules}
              color="#a78bfa"
              height={10}
              label={`${completedModules}/${totalModules} modules completed`}
            />
          </div>
        </div>

        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
          {/* Status + Next Step */}
          <div style={{
            background: '#fff', borderRadius: 12, padding: 20,
            border: '1px solid #e5e7eb', marginBottom: 32,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</p>
              <p style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 700, color: '#1f2937' }}>
                {certStatus === 'certified' ? '🏆 Certified' :
                 certStatus === 'in-progress' ? '📚 In Progress' : '✨ Enrolled'}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>Next Step</p>
              <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 600, color: '#4f46e5' }}>{nextStep}</p>
            </div>
            {certStatus === 'certified' && (
              <Link
                to="/iatlas/ttf/certificate"
                style={{ background: '#4f46e5', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600 }}
              >
                View Certificate →
              </Link>
            )}
          </div>

          {/* Modules grid */}
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>Your Modules</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginBottom: 40 }}>
            {modules.map((mod, idx) => {
              const key    = `module${mod.moduleNumber}`;
              const prog   = moduleProgress[key] || {};
              const status = getModuleStatus(mod.moduleNumber);
              return (
                <ModuleCard
                  key={mod.moduleNumber}
                  moduleNumber={mod.moduleNumber}
                  moduleName={mod.moduleName}
                  moduleDescription={mod.moduleDescription}
                  color={MODULE_COLORS[idx % MODULE_COLORS.length]}
                  bg={MODULE_BG[idx % MODULE_BG.length]}
                  estimatedDuration={mod.estimatedDuration}
                  sectionCount={(mod.sections || []).length}
                  completedSections={(prog.sectionsCompleted || []).length}
                  status={status}
                  onStart={status !== 'locked' ? () => navigate(`/iatlas/ttf/module/${mod.moduleNumber}`) : undefined}
                />
              );
            })}
          </div>

          {/* Bottom row: Practicum + Assessment + Community */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>

            {/* Personal Assessment */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#1f2937' }}>🧭 Personal Assessment</h3>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>
                Required before Module 2. Take the IATLAS Dimensional Assessment to understand your own resilience profile.
              </p>
              {enrollment?.personalAssessmentCompleted ? (
                <span style={{ color: '#059669', fontWeight: 600, fontSize: 14 }}>✓ Completed</span>
              ) : (
                <Link
                  to="/quiz"
                  style={{ display: 'inline-block', background: '#059669', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600 }}
                >
                  Take Assessment →
                </Link>
              )}
            </div>

            {/* Practicum tracker */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#1f2937' }}>🎬 Practicum</h3>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6b7280' }}>
                {approvedPracticum}/{requiredPracticum} sessions approved
              </p>
              <ProgressBar value={approvedPracticum} max={requiredPracticum} color="#0891b2" label="" showPct={false} />
              <Link
                to="/iatlas/ttf/practicum"
                style={{ display: 'inline-block', marginTop: 14, color: '#0891b2', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
              >
                Manage Practicum →
              </Link>
            </div>

            {/* Cohort community */}
            {cohort && (
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#1f2937' }}>👥 Cohort Community</h3>
                {cohort.communityChannelUrl && (
                  <a
                    href={cohort.communityChannelUrl}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-block', marginBottom: 12, color: '#4f46e5', fontSize: 13, fontWeight: 600 }}
                  >
                    Join Community Channel →
                  </a>
                )}
                {(cohort.liveSessionSchedule || []).length > 0 && (
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Upcoming Sessions</p>
                    {cohort.liveSessionSchedule.slice(0, 3).map((s, i) => (
                      <div key={i} style={{ marginBottom: 8, padding: '8px 12px', background: '#f9fafb', borderRadius: 6 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#374151' }}>{s.topic}</p>
                        <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{new Date(s.date).toLocaleDateString()}</p>
                        {s.zoomLink && (
                          <a href={s.zoomLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#4f46e5' }}>Join Zoom →</a>
                        )}
                      </div>
                    ))}
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
