import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import TeamMemberCard from '../components/ProgressCircle/TeamMemberCard.jsx';
import ActivityLogger from '../components/ProgressCircle/ActivityLogger.jsx';
import { ROLE_COLORS } from '../constants/progressCircles.js';

/**
 * ProgressCircleDashboardPage — shared progress dashboard for circle members.
 *
 * Displays:
 * - Hero header with circle name and the viewer's role badge
 * - Team members grid
 * - Progress overview (XP, level, streak, activities)
 * - 6-dimension breakdown
 * - Recent activities feed
 * - Log Activity / Invite buttons (permission-gated)
 */
export default function ProgressCircleDashboardPage() {
  const { id }            = useParams();
  const navigate          = useNavigate();
  const { getAccessTokenSilently } = useAuth0();

  const [dashboard,      setDashboard]      = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [showLogger,     setShowLogger]     = useState(false);
  const [removingId,     setRemovingId]     = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getAccessTokenSilently();
      const res   = await fetch(`/api/progress-circles/${id}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load dashboard.');
      setDashboard(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, getAccessTokenSilently]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  async function handleRemoveMember(memberId) {
    if (!window.confirm('Remove this member from the circle?')) return;
    setRemovingId(memberId);
    try {
      const token = await getAccessTokenSilently();
      const res   = await fetch(`/api/progress-circles/${id}/members/${memberId}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove member.');
      fetchDashboard();
    } catch (err) {
      alert(err.message);
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <span style={{ color: '#6b7280', fontSize: 15 }}>Loading dashboard…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <p style={{ fontSize: 40, margin: '0 0 12px' }}>⚠️</p>
          <p style={{ color: '#dc2626', fontSize: 15, marginBottom: 20 }}>{error}</p>
          <button onClick={() => navigate(-1)} style={{ padding: '8px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const { circle, child, userRole, permissions, members, progress, dimensions, recentActivities } = dashboard;
  const roleInfo   = ROLE_COLORS[userRole] || { bg: '#f3f4f6', color: '#6b7280', label: userRole, icon: '👤' };
  const isAdmin    = ['parent', 'guardian'].includes(userRole);
  const dimEntries = dimensions ? Object.entries(dimensions) : [];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '0 0 60px' }}>

      {/* Hero header */}
      <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: '#fff', padding: '32px 24px 28px', textAlign: 'center' }}>
        <p style={{ margin: '0 0 6px', fontSize: 36 }}>{child?.avatar || '🧒'}</p>
        <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800 }}>{circle?.name}</h1>
        <p style={{ margin: '0 0 16px', fontSize: 14, opacity: 0.85 }}>
          {child?.name}'s Progress Circle
        </p>
        {/* Role badge */}
        <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 700 }}>
          {roleInfo.icon} You are: {roleInfo.label}
        </span>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
          {permissions?.canAddActivities && (
            <button
              onClick={() => setShowLogger(true)}
              style={{ padding: '10px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
            >
              + Log Activity
            </button>
          )}
          {permissions?.canInviteOthers && (
            <Link
              to={`/iatlas/circles/${id}/invite`}
              style={{ padding: '10px 20px', background: '#fff', color: '#4f46e5', border: '1.5px solid #4f46e5', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}
            >
              Invite Stakeholder
            </Link>
          )}
          {isAdmin && (
            <Link
              to={`/iatlas/circles/${id}/settings`}
              style={{ padding: '10px 20px', background: '#fff', color: '#6b7280', border: '1.5px solid #e5e7eb', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}
            >
              ⚙️ Settings
            </Link>
          )}
        </div>

        {/* Activity logger modal */}
        {showLogger && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
              <ActivityLogger
                circleId={id}
                getAccessToken={getAccessTokenSilently}
                onSuccess={() => { setShowLogger(false); fetchDashboard(); }}
                onCancel={() => setShowLogger(false)}
              />
            </div>
          </div>
        )}

        {/* Progress overview */}
        {progress && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#374151' }}>📊 Progress Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
              {[
                { label: 'Total XP',   value: progress.totalXP  ?? 0, icon: '⚡' },
                { label: 'Level',      value: progress.level    ?? 1, icon: '🏆' },
                { label: 'Badges',     value: (progress.badges  ?? []).length, icon: '🎖️' },
              ].map((card) => (
                <div key={card.label} style={{ background: '#fff', borderRadius: 10, padding: '16px 14px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 24 }}>{card.icon}</p>
                  <p style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 800, color: '#111827' }}>{card.value}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>{card.label}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Dimension breakdown */}
        {dimEntries.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#374151' }}>🧩 Resilience Dimensions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {dimEntries.map(([dim, score]) => {
                const pct = Math.min(100, Math.max(0, Math.round(Number(score) || 0)));
                return (
                  <div key={dim}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: '#374151' }}>
                      <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{dim}</span>
                      <span>{pct}%</span>
                    </div>
                    <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#4f46e5', borderRadius: 4, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Recent activities */}
        {permissions?.canViewActivities && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#374151' }}>🕐 Recent Activities</h2>
            {recentActivities.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: 14 }}>No activities logged yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentActivities.map((a, i) => {
                  const byRole = a.completedByRole ? ROLE_COLORS[a.completedByRole] : null;
                  return (
                    <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', border: '1px solid #e5e7eb', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{byRole?.icon || '📝'}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#111827' }}>{a.activityId}</p>
                        <p style={{ margin: '0 0 2px', fontSize: 12, color: '#6b7280' }}>
                          {byRole?.label || a.completedByRole || 'Unknown role'}
                          {a.setting ? ` · ${a.setting}` : ''}
                          {a.dimension ? ` · ${a.dimension}` : ''}
                          {a.xpAwarded ? ` · +${a.xpAwarded} XP` : ''}
                        </p>
                        {a.notes && (
                          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>{a.notes}</p>
                        )}
                        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#d1d5db' }}>
                          {new Date(a.completedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Team members */}
        <section>
          <h2 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#374151' }}>👥 Team Members ({members.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {members.map((m) => (
              <TeamMemberCard
                key={m.id || m._id}
                member={m}
                isAdmin={isAdmin}
                onRemove={removingId ? null : handleRemoveMember}
              />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
