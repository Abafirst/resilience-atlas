import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import SiteHeader from '../components/SiteHeader.jsx';
import { apiFetch } from '../lib/apiFetch.js';

/**
 * OrgGamificationPage — Enterprise Full Gamification Suite UI.
 *
 * Features:
 *  - Org-wide leaderboard (all members)
 *  - Custom badges: admin creates/awards, members view their awards
 *  - Challenges: admin creates, members complete
 *
 * Route: /org-gamification/:orgId
 * Requires: Auth0 login + Enterprise org plan with 'org-gamification' gate
 */

const styles = `
  .og-page {
    min-height: 100vh;
    background: #f8fafc;
    padding-bottom: 3rem;
  }
  .og-container {
    max-width: 960px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }
  .og-hero {
    background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
    color: #fff;
    padding: 2.5rem 1.5rem;
    text-align: center;
    margin-bottom: 2rem;
  }
  .og-hero h1 { font-size: 2rem; font-weight: 800; color: #fff; margin-bottom: 0.25rem; }
  .og-hero p { color: rgba(255,255,255,0.8); font-size: 1rem; }
  .og-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid #e2e8f0;
    overflow-x: auto;
  }
  .og-tab {
    padding: 0.65rem 1.25rem;
    font-size: 0.9rem;
    font-weight: 600;
    border: none;
    background: none;
    cursor: pointer;
    color: #64748b;
    border-bottom: 3px solid transparent;
    margin-bottom: -2px;
    white-space: nowrap;
    transition: color 150ms;
  }
  .og-tab.active {
    color: #4F46E5;
    border-bottom-color: #4F46E5;
  }
  .og-tab:hover { color: #4F46E5; }
  .og-section {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.25rem;
  }
  .og-section h2 {
    font-size: 1.1rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 1rem;
  }
  .og-form-row { margin-bottom: 0.9rem; }
  .og-form-row label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    color: #334155;
    margin-bottom: 0.3rem;
  }
  .og-input,
  .og-select,
  .og-textarea {
    width: 100%;
    padding: 0.6rem 0.85rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.92rem;
    font-family: inherit;
    color: #0f172a;
    background: #fff;
  }
  .og-input:focus, .og-select:focus, .og-textarea:focus {
    outline: none;
    border-color: #4F46E5;
  }
  .og-textarea { resize: vertical; min-height: 70px; }
  .og-btn {
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: background 150ms;
  }
  .og-btn-primary { background: #4F46E5; color: #fff; }
  .og-btn-primary:hover { background: #4338CA; }
  .og-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .og-btn-danger { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
  .og-btn-danger:hover { background: #fee2e2; }
  .og-btn-secondary { background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; }
  .og-btn-secondary:hover { background: #e2e8f0; }
  .og-btn-success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
  .og-btn-success:hover { background: #dcfce7; }

  .og-alert {
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.88rem;
    margin-bottom: 1rem;
  }
  .og-alert-success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
  .og-alert-error   { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

  .og-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1rem;
  }
  .og-card {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 1.25rem;
    background: #fff;
  }
  .og-card-icon { font-size: 2rem; margin-bottom: 0.5rem; }
  .og-card h3 { font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.25rem; }
  .og-card p { font-size: 0.85rem; color: #64748b; margin-bottom: 0.75rem; line-height: 1.5; }
  .og-card-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

  .og-leaderboard-table {
    width: 100%;
    border-collapse: collapse;
  }
  .og-leaderboard-table th {
    text-align: left;
    padding: 0.6rem 0.75rem;
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
    border-bottom: 2px solid #e2e8f0;
  }
  .og-leaderboard-table td {
    padding: 0.7rem 0.75rem;
    border-bottom: 1px solid #f1f5f9;
    font-size: 0.9rem;
    color: #374151;
  }
  .og-leaderboard-table tr:last-child td { border-bottom: none; }
  .og-rank-1 { color: #ca8a04; font-weight: 800; font-size: 1rem; }
  .og-rank-2 { color: #6b7280; font-weight: 700; }
  .og-rank-3 { color: #b45309; font-weight: 700; }

  .og-empty {
    text-align: center;
    padding: 2rem;
    color: #94a3b8;
    font-size: 0.9rem;
  }
  .og-badge-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    background: #ede9fe;
    color: #5b21b6;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
    margin: 0.2rem;
  }
  .og-points-pill {
    display: inline-block;
    background: #fef3c7;
    color: #92400e;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 600;
    margin-left: 0.3rem;
  }
  .og-completed-tag {
    display: inline-block;
    background: #f0fdf4;
    color: #15803d;
    padding: 0.1rem 0.45rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-left: 0.4rem;
  }
  .og-form-inline {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    align-items: flex-end;
  }
  .og-form-inline .og-form-row { flex: 1; min-width: 160px; }
  @media (max-width: 640px) {
    .og-card-grid { grid-template-columns: 1fr; }
    .og-form-inline { flex-direction: column; }
  }
`;

export default function OrgGamificationPage() {
  const { getAccessTokenSilently, isAuthenticated, isLoading } = useAuth0();

  // Derive orgId from URL path parameter
  const orgId = window.location.pathname.split('/org-gamification/')[1]?.split('/')[0] || '';

  const [activeTab, setActiveTab] = useState('leaderboard');
  const [isAdmin, setIsAdmin] = useState(false);
  const [orgName, setOrgName] = useState('');

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState([]);

  // Badges state
  const [badges, setBadges] = useState([]);
  const [myAwards, setMyAwards] = useState([]);
  const [newBadge, setNewBadge] = useState({ name: '', description: '', icon: '/icons/badges.svg' });
  const [awardModal, setAwardModal] = useState(null); // { badgeId, badgeName }
  const [awardForm, setAwardForm] = useState({ userId: '', email: '', note: '' });

  // Challenges state
  const [challenges, setChallenges] = useState([]);
  const [newChallenge, setNewChallenge] = useState({ title: '', description: '', dimension: '', points: 10, startDate: '', endDate: '' });
  const [completingId, setCompletingId] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const clearMessages = () => { setError(''); setSuccessMsg(''); };

  const loadAll = useCallback(async () => {
    if (!orgId || !isAuthenticated) return;
    try {
      setLoading(true);
      setError('');
      const [orgRes, lbRes, badgesRes, myBadgesRes, challengesRes] = await Promise.all([
        apiFetch(`/api/organizations/${orgId}`, {}, getAccessTokenSilently).catch(() => null),
        apiFetch(`/api/org-gamification/${orgId}/leaderboard`, {}, getAccessTokenSilently).catch(() => null),
        apiFetch(`/api/org-gamification/${orgId}/badges`, {}, getAccessTokenSilently).catch(() => null),
        apiFetch(`/api/org-gamification/${orgId}/my-badges`, {}, getAccessTokenSilently).catch(() => null),
        apiFetch(`/api/org-gamification/${orgId}/challenges`, {}, getAccessTokenSilently).catch(() => null),
      ]);

      if (orgRes) {
        const org = orgRes.organization || orgRes;
        setOrgName(org.company_name || org.name || 'Your Organization');
        // Detect if current user is admin — the GET /api/organizations/:id endpoint
        // only succeeds for admins, so if it returned a result, user is likely admin.
        setIsAdmin(true);
      }

      setLeaderboard(lbRes?.leaderboard || []);
      setBadges(badgesRes?.badges || []);
      setMyAwards(myBadgesRes?.awards || []);
      setChallenges(challengesRes?.challenges || []);
    } catch (err) {
      if (err?.status === 403) {
        setError('This feature requires Atlas Enterprise plan.');
      } else {
        setError('Failed to load gamification data.');
      }
    } finally {
      setLoading(false);
    }
  }, [orgId, isAuthenticated, getAccessTokenSilently]);

  useEffect(() => {
    if (!isLoading) loadAll();
  }, [isLoading, loadAll]);

  // ── Badge actions ──────────────────────────────────────────────────────────

  const createBadge = async () => {
    if (!newBadge.name.trim()) { setError('Badge name is required.'); return; }
    clearMessages();
    setSaving(true);
    try {
      await apiFetch(
        `/api/org-gamification/${orgId}/badges`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newBadge),
        },
        getAccessTokenSilently
      );
      setSuccessMsg('Badge created.');
      setNewBadge({ name: '', description: '', icon: '/icons/badges.svg' });
      loadAll();
    } catch (err) {
      setError('Failed to create badge: ' + (err?.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const retireBadge = async (badgeId) => {
    if (!window.confirm('Retire this badge? It will no longer be awarded to new users.')) return;
    clearMessages();
    try {
      await apiFetch(
        `/api/org-gamification/${orgId}/badges/${badgeId}`,
        { method: 'DELETE' },
        getAccessTokenSilently
      );
      setSuccessMsg('Badge retired.');
      loadAll();
    } catch (err) {
      setError('Failed to retire badge.');
    }
  };

  const awardBadge = async () => {
    if (!awardForm.userId.trim() && !awardForm.email.trim()) {
      setError('Please enter a user ID or email to award the badge to.');
      return;
    }
    clearMessages();
    setSaving(true);
    try {
      await apiFetch(
        `/api/org-gamification/${orgId}/badges/${awardModal.badgeId}/award`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(awardForm),
        },
        getAccessTokenSilently
      );
      setSuccessMsg(`Badge "${awardModal.badgeName}" awarded successfully.`);
      setAwardModal(null);
      setAwardForm({ userId: '', email: '', note: '' });
      loadAll();
    } catch (err) {
      const msg = err?.message || '';
      setError(msg.includes('already') ? 'This badge was already awarded to that user.' : 'Failed to award badge.');
    } finally {
      setSaving(false);
    }
  };

  // ── Challenge actions ──────────────────────────────────────────────────────

  const createChallenge = async () => {
    if (!newChallenge.title.trim()) { setError('Challenge title is required.'); return; }
    clearMessages();
    setSaving(true);
    try {
      await apiFetch(
        `/api/org-gamification/${orgId}/challenges`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newChallenge),
        },
        getAccessTokenSilently
      );
      setSuccessMsg('Challenge created.');
      setNewChallenge({ title: '', description: '', dimension: '', points: 10, startDate: '', endDate: '' });
      loadAll();
    } catch (err) {
      setError('Failed to create challenge: ' + (err?.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const completeChallenge = async (challengeId) => {
    clearMessages();
    setCompletingId(challengeId);
    try {
      const res = await apiFetch(
        `/api/org-gamification/${orgId}/challenges/${challengeId}/complete`,
        { method: 'POST' },
        getAccessTokenSilently
      );
      setSuccessMsg(`Challenge completed! You earned ${res.pointsEarned || 0} points.`);
      loadAll();
    } catch (err) {
      const msg = err?.message || '';
      setError(msg.includes('already') ? 'You have already completed this challenge.' : 'Failed to complete challenge.');
    } finally {
      setCompletingId(null);
    }
  };

  const deactivateChallenge = async (challengeId) => {
    if (!window.confirm('Deactivate this challenge?')) return;
    clearMessages();
    try {
      await apiFetch(
        `/api/org-gamification/${orgId}/challenges/${challengeId}`,
        { method: 'DELETE' },
        getAccessTokenSilently
      );
      setSuccessMsg('Challenge deactivated.');
      loadAll();
    } catch (err) {
      setError('Failed to deactivate challenge.');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading || loading) {
    return (
      <>
        <style>{styles}</style>
        <SiteHeader />
        <div className="og-page">
          <div className="og-container">
            <div className="og-empty">Loading gamification suite…</div>
          </div>
        </div>
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <style>{styles}</style>
        <SiteHeader />
        <div className="og-page">
          <div className="og-container">
            <div className="og-alert og-alert-error">Please log in to access the gamification suite.</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <SiteHeader />
      <div className="og-page">
        <div className="og-hero">
          <h1><img src="/icons/trophy.svg" alt="" aria-hidden="true" width={28} height={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Full Gamification Suite</h1>
          <p>{orgName} · Enterprise</p>
        </div>

        <div className="og-container">
          {error && <div className="og-alert og-alert-error">{error}</div>}
          {successMsg && <div className="og-alert og-alert-success">{successMsg}</div>}

          {/* Award Modal */}
          {awardModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', maxWidth: 420, width: '90%' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.05rem', fontWeight: 700 }}>
                  Award &ldquo;{awardModal.badgeName}&rdquo;
                </h3>
                <div className="og-form-row">
                  <label>User ID (Auth0 sub)</label>
                  <input className="og-input" value={awardForm.userId} onChange={(e) => setAwardForm({ ...awardForm, userId: e.target.value })} placeholder="auth0|..." />
                </div>
                <div className="og-form-row">
                  <label>Or Email</label>
                  <input className="og-input" value={awardForm.email} onChange={(e) => setAwardForm({ ...awardForm, email: e.target.value })} placeholder="user@example.com" />
                </div>
                <div className="og-form-row">
                  <label>Note (optional)</label>
                  <input className="og-input" value={awardForm.note} onChange={(e) => setAwardForm({ ...awardForm, note: e.target.value })} placeholder="Why you're awarding this badge" />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button className="og-btn og-btn-primary" onClick={awardBadge} disabled={saving} type="button">
                    {saving ? 'Awarding…' : 'Award Badge'}
                  </button>
                  <button className="og-btn og-btn-secondary" onClick={() => { setAwardModal(null); clearMessages(); }} type="button">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* ── Tabs ─────────────────────────────────────────────────────────── */}
          <div className="og-tabs" role="tablist">
            {['leaderboard', 'badges', 'challenges', 'my-badges'].map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                className={`og-tab${activeTab === tab ? ' active' : ''}`}
                onClick={() => { setActiveTab(tab); clearMessages(); }}
                type="button"
              >
                {tab === 'leaderboard' && <><img src="/icons/leaderboards.svg" alt="" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Leaderboard</>}
                {tab === 'badges' && <><img src="/icons/badges.svg" alt="" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Badges</>}
                {tab === 'challenges' && <><img src="/icons/challenges.svg" alt="" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Challenges</>}
                {tab === 'my-badges' && <><img src="/icons/badges.svg" alt="" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />My Badges</>}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              LEADERBOARD TAB
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'leaderboard' && (
            <div className="og-section">
              <h2>Org-Wide Leaderboard</h2>
              {leaderboard.length === 0 ? (
                <div className="og-empty">No challenge completions yet. Create challenges and invite members to get started.</div>
              ) : (
                <table className="og-leaderboard-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>User</th>
                      <th>Points</th>
                      <th>Challenges</th>
                      <th>Badges</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry) => (
                      <tr key={entry.userId}>
                        <td>
                          <span className={entry.rank <= 3 ? `og-rank-${entry.rank}` : ''}>
                            {entry.rank <= 3 ? <img src="/icons/trophy.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'text-bottom' }} /> : `#${entry.rank}`}
                          </span>
                        </td>
                        <td>{entry.email || entry.userId}</td>
                        <td><strong>{entry.totalPoints.toLocaleString()}</strong></td>
                        <td>{entry.completions}</td>
                        <td>{entry.badgeCount > 0 ? entry.badgeCount : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              BADGES TAB
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'badges' && (
            <>
              {isAdmin && (
                <div className="og-section">
                  <h2>Create Custom Badge</h2>
                  <div className="og-form-inline">
                    <div className="og-form-row" style={{ flex: '0 0 70px' }}>
                      <label>Icon</label>
                      <input className="og-input" value={newBadge.icon} onChange={(e) => setNewBadge({ ...newBadge, icon: e.target.value })} placeholder="/icons/badges.svg" maxLength={64} />
                    </div>
                    <div className="og-form-row" style={{ flex: '1', minWidth: '160px' }}>
                      <label>Badge Name *</label>
                      <input className="og-input" value={newBadge.name} onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })} placeholder="e.g. Resilience Champion" />
                    </div>
                    <div className="og-form-row" style={{ flex: '2', minWidth: '200px' }}>
                      <label>Description</label>
                      <input className="og-input" value={newBadge.description} onChange={(e) => setNewBadge({ ...newBadge, description: e.target.value })} placeholder="What this badge represents" />
                    </div>
                    <div className="og-form-row" style={{ alignSelf: 'flex-end' }}>
                      <label style={{ visibility: 'hidden' }}>Create</label>
                      <button className="og-btn og-btn-primary" onClick={createBadge} disabled={saving} type="button">
                        {saving ? 'Creating…' : 'Create Badge'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="og-section">
                <h2>All Badges ({badges.length})</h2>
                {badges.length === 0 ? (
                  <div className="og-empty">No badges yet. Create your first custom badge above.</div>
                ) : (
                  <div className="og-card-grid">
                    {badges.map((badge) => (
                      <div key={badge._id} className="og-card">
                        <div className="og-card-icon">
                          {(badge.icon && badge.icon.startsWith('/')) ? (
                            <img src={badge.icon} alt="" width={32} height={32} />
                          ) : (badge.icon || null)}
                        </div>
                        <h3>{badge.name}</h3>
                        <p>{badge.description || 'No description.'}</p>
                        {isAdmin && (
                          <div className="og-card-actions">
                            <button
                              className="og-btn og-btn-success"
                              style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }}
                              onClick={() => { clearMessages(); setAwardModal({ badgeId: badge._id, badgeName: badge.name }); setAwardForm({ userId: '', email: '', note: '' }); }}
                              type="button"
                            >
                              Award
                            </button>
                            <button
                              className="og-btn og-btn-danger"
                              style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }}
                              onClick={() => retireBadge(badge._id)}
                              type="button"
                            >
                              Retire
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              CHALLENGES TAB
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'challenges' && (
            <>
              {isAdmin && (
                <div className="og-section">
                  <h2>Create Challenge</h2>
                  <div className="og-form-row">
                    <label>Title *</label>
                    <input className="og-input" value={newChallenge.title} onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })} placeholder="e.g. Complete a 5-minute grounding exercise" />
                  </div>
                  <div className="og-form-row">
                    <label>Description</label>
                    <textarea className="og-textarea" value={newChallenge.description} onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })} placeholder="Describe what participants need to do" />
                  </div>
                  <div className="og-form-inline">
                    <div className="og-form-row">
                      <label>Dimension (optional)</label>
                      <select className="og-select" value={newChallenge.dimension} onChange={(e) => setNewChallenge({ ...newChallenge, dimension: e.target.value })}>
                        <option value="">Any dimension</option>
                        <option value="cognitive">Cognitive</option>
                        <option value="emotional">Emotional</option>
                        <option value="relational">Relational-Connective</option>
                        <option value="somatic">Somatic</option>
                        <option value="spiritual">Spiritual</option>
                        <option value="agentic">Agentic</option>
                      </select>
                    </div>
                    <div className="og-form-row" style={{ maxWidth: 100 }}>
                      <label>Points</label>
                      <input className="og-input" type="number" min="0" max="10000" value={newChallenge.points} onChange={(e) => setNewChallenge({ ...newChallenge, points: Number(e.target.value) || 0 })} />
                    </div>
                    <div className="og-form-row">
                      <label>Start Date</label>
                      <input className="og-input" type="date" value={newChallenge.startDate} onChange={(e) => setNewChallenge({ ...newChallenge, startDate: e.target.value })} />
                    </div>
                    <div className="og-form-row">
                      <label>End Date</label>
                      <input className="og-input" type="date" value={newChallenge.endDate} onChange={(e) => setNewChallenge({ ...newChallenge, endDate: e.target.value })} />
                    </div>
                    <div className="og-form-row" style={{ alignSelf: 'flex-end' }}>
                      <label style={{ visibility: 'hidden' }}>Create</label>
                      <button className="og-btn og-btn-primary" onClick={createChallenge} disabled={saving} type="button">
                        {saving ? 'Creating…' : 'Create Challenge'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="og-section">
                <h2>Active Challenges ({challenges.filter((c) => c.active).length})</h2>
                {challenges.filter((c) => c.active).length === 0 ? (
                  <div className="og-empty">No active challenges. Create one to get started!</div>
                ) : (
                  <div className="og-card-grid">
                    {challenges.filter((c) => c.active).map((challenge) => (
                      <div key={challenge._id} className="og-card">
                        <h3>
                          {challenge.title}
                          {challenge.completedByMe && <span className="og-completed-tag">✓ Completed</span>}
                          <span className="og-points-pill">{challenge.points} pts</span>
                        </h3>
                        {challenge.dimension && (
                          <div style={{ fontSize: '0.78rem', color: '#6366f1', fontWeight: 600, marginBottom: '0.3rem' }}>
                            {challenge.dimension}
                          </div>
                        )}
                        <p>{challenge.description || 'No description.'}</p>
                        {challenge.endDate && (
                          <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                            Ends: {new Date(challenge.endDate).toLocaleDateString()}
                          </p>
                        )}
                        <div className="og-card-actions">
                          {!challenge.completedByMe && (
                            <button
                              className="og-btn og-btn-success"
                              style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }}
                              onClick={() => completeChallenge(challenge._id)}
                              disabled={completingId === challenge._id}
                              type="button"
                            >
                              {completingId === challenge._id ? '…' : 'Mark Complete'}
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              className="og-btn og-btn-danger"
                              style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }}
                              onClick={() => deactivateChallenge(challenge._id)}
                              type="button"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              MY BADGES TAB
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'my-badges' && (
            <div className="og-section">
              <h2>My Badges ({myAwards.length})</h2>
              {myAwards.length === 0 ? (
                <div className="og-empty">You haven&apos;t received any badges yet. Complete challenges to earn points and watch for badge awards from your admin!</div>
              ) : (
                <div className="og-card-grid">
                  {myAwards.map((award) => {
                    const badge = award.badgeId || {};
                    return (
                      <div key={award._id} className="og-card">
                        <div className="og-card-icon">
                          {(badge.icon && badge.icon.startsWith('/')) ? (
                            <img src={badge.icon} alt="" width={32} height={32} />
                          ) : (badge.icon || null)}
                        </div>
                        <h3>{badge.name || 'Badge'}</h3>
                        <p>{badge.description || ''}</p>
                        {award.note && (
                          <p style={{ fontStyle: 'italic', color: '#64748b', fontSize: '0.82rem' }}>
                            &ldquo;{award.note}&rdquo;
                          </p>
                        )}
                        <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          Awarded {new Date(award.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
