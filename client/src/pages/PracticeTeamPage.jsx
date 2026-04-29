/**
 * PracticeTeamPage.jsx
 * Team communication and collaboration page.
 * Route: /iatlas/practice/team
 *
 * Includes:
 *  - Members tab: real API integration with TeamMembersTable + InvitePractitionerModal
 *  - Announcements, Discussions, Tasks tabs (collaborative workspace mock data)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import SiteHeader from '../components/SiteHeader.jsx';
import TeamMembersTable from '../components/Practice/TeamMembersTable.jsx';
import InvitePractitionerModal from '../components/Practice/InvitePractitionerModal.jsx';
import SeatUsageIndicator from '../components/Practice/SeatUsageIndicator.jsx';
import apiFetch from '../lib/apiFetch.js';

const PRACTICE_NAV = [
  { to: '/iatlas/practice/dashboard',  label: 'Dashboard',  key: 'dashboard' },
  { to: '/iatlas/practice/clients',    label: 'Clients',    key: 'clients' },
  { to: '/iatlas/practice/schedule',   label: 'Schedule',   key: 'schedule' },
  { to: '/iatlas/practice/billing',    label: 'Billing',    key: 'billing' },
  { to: '/iatlas/practice/team',       label: 'Team',       key: 'team' },
  { to: '/iatlas/practice/analytics',  label: 'Analytics',  key: 'analytics' },
];

const MOCK_ANNOUNCEMENTS = [
  {
    id: 1,
    author: 'Practice Admin',
    avatar: '/icons/professional.svg',
    date: '2026-04-21',
    text: 'Congratulations to Dr. Chen on completing the IATLAS Train the Facilitator certification! She is now our first certified TTF practitioner.',
    type: 'celebration',
  },
  {
    id: 2,
    author: 'Practice Admin',
    avatar: '/icons/professional.svg',
    date: '2026-04-19',
    text: 'Reminder: All session documentation must be completed within 24 hours. We\'re currently at 82% compliance — let\'s get to 100%!',
    type: 'info',
  },
];

const MOCK_THREADS = [
  {
    id: 1,
    title: 'Amir Johnson — Behavioral Support Strategy',
    client: 'Johnson Family',
    createdBy: 'Dr. Chen',
    messages: 4,
    lastMsg: '2026-04-21',
    resolved: false,
    tags: ['ABA', 'Behavioral'],
  },
  {
    id: 2,
    title: 'Owen Park — OT & SLP Collaboration',
    client: 'Park Family',
    createdBy: 'P. Patel',
    messages: 7,
    lastMsg: '2026-04-20',
    resolved: false,
    tags: ['OT', 'SLP', 'Collaboration'],
  },
  {
    id: 3,
    title: 'Maya Osei — Social Skills Group Placement',
    client: 'Osei Family',
    createdBy: 'J. Rodriguez',
    messages: 3,
    lastMsg: '2026-04-18',
    resolved: false,
    tags: ['Social Skills'],
  },
  {
    id: 4,
    title: 'Team Meeting — April Protocol Review',
    client: null,
    createdBy: 'Practice Admin',
    messages: 12,
    lastMsg: '2026-04-15',
    resolved: true,
    tags: ['Admin', 'Meeting'],
  },
];

const MOCK_MESSAGES = [
  {
    id: 1,
    threadId: 1,
    author: 'Dr. Chen',
    avatar: '/icons/professional.svg',
    time: '9:42 AM',
    text: 'Hi team — I\'m noticing Amir is showing increased emotional dysregulation during transitions. I think we need to coordinate our approach across ABA and SLP sessions.',
  },
  {
    id: 2,
    threadId: 1,
    author: 'M. Williams',
    avatar: '/icons/professional.svg',
    time: '10:15 AM',
    text: 'Agreed. In ABA sessions I\'ve been using a visual transition schedule — happy to share the materials. We could align the language we use across both services.',
  },
  {
    id: 3,
    threadId: 1,
    author: 'Practice Admin',
    avatar: '/icons/professional.svg',
    time: '11:30 AM',
    text: 'Let\'s schedule a 15-min case consult this week. @Dr.Chen @M.Williams — are you both free Thursday at 2pm?',
  },
  {
    id: 4,
    threadId: 1,
    author: 'Dr. Chen',
    avatar: '/icons/professional.svg',
    time: '11:45 AM',
    text: 'Thursday at 2pm works for me! I\'ll pull together a quick dimensional snapshot of Amir\'s emotional regulation scores to share.',
  },
];

const MOCK_TASKS = [
  { id: 1, title: 'Complete IEP review for Owen Park', assignee: 'Dr. Chen', due: '2026-04-24', priority: 'high', done: false },
  { id: 2, title: 'Update billing codes for SLP sessions', assignee: 'Practice Admin', due: '2026-04-23', priority: 'medium', done: false },
  { id: 3, title: 'Schedule team resilience check-in', assignee: 'Practice Admin', due: '2026-04-26', priority: 'low', done: false },
  { id: 4, title: 'Send Johnson family monthly progress report', assignee: 'M. Williams', due: '2026-04-22', priority: 'high', done: true },
];

export default function PracticeTeamPage() {
  const { getAccessTokenSilently, user } = useAuth0();
  const [activeSection, setActiveSection]   = useState('members');
  const [selectedThread, setSelectedThread] = useState(1);
  const [newMessage, setNewMessage]         = useState('');
  const [tasks, setTasks]                   = useState(MOCK_TASKS);
  const [showNewThread, setShowNewThread]   = useState(false);

  // Practice & members state
  const [practice, setPractice]           = useState(null);
  const [practitioners, setPractitioners] = useState([]);
  const [practiceRole, setPracticeRole]   = useState(null);
  const [loadingPractice, setLoadingPractice] = useState(true);
  const [practiceError, setPracticeError] = useState(null);

  // Invite modal state
  const [showInvite, setShowInvite]   = useState(false);
  const [inviting, setInviting]       = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState(null);
  const [inviteUrl, setInviteUrl]     = useState(null);

  // Edit role state
  const [editTarget, setEditTarget] = useState(null);
  const [editRole, setEditRole]     = useState('clinician');
  const [editLoading, setEditLoading] = useState(false);

  const loadPractice = useCallback(async () => {
    setLoadingPractice(true);
    setPracticeError(null);
    try {
      const res = await apiFetch('/api/practices/mine', {}, getAccessTokenSilently);
      if (res.ok) {
        const data = await res.json();
        setPractice(data.practice);
        setPracticeRole(data.role);

        // Load practitioners list
        const pId = data.practice._id;
        const pRes = await apiFetch(`/api/practices/${pId}/practitioners`, {}, getAccessTokenSilently);
        if (pRes.ok) {
          const pData = await pRes.json();
          setPractitioners(pData.practitioners || []);
        }
      } else {
        setPracticeError('Could not load practice information.');
      }
    } catch {
      setPracticeError('Failed to load practice data.');
    } finally {
      setLoadingPractice(false);
    }
  }, [getAccessTokenSilently]);

  useEffect(() => { loadPractice(); }, [loadPractice]);

  async function handleInvite(email, role) {
    if (!practice) return;
    setInviting(true);
    setInviteError(null);
    setInviteSuccess(null);
    setInviteUrl(null);
    try {
      const res = await apiFetch(`/api/practices/${practice._id}/practitioners/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      }, getAccessTokenSilently);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send invitation.');
      }
      setInviteSuccess(`Invitation sent to ${email}`);
      setInviteUrl(data.inviteUrl || null);
      loadPractice();
    } catch (err) {
      setInviteError(err.message);
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveMember(member) {
    if (!practice) return;
    const targetId = member.userId?._id || member.userId || member.id;
    if (!window.confirm(`Remove ${member.userId?.name || member.userId?.email || 'this practitioner'} from the practice?`)) return;
    try {
      await apiFetch(`/api/practices/${practice._id}/practitioners/${targetId}`, {
        method: 'DELETE',
      }, getAccessTokenSilently);
      loadPractice();
    } catch {
      // ignore
    }
  }

  async function handleEditRole(member) {
    setEditTarget(member);
    setEditRole(member.role || 'clinician');
  }

  async function submitEditRole() {
    if (!practice || !editTarget) return;
    const targetId = editTarget.userId?._id || editTarget.userId || editTarget.id;
    setEditLoading(true);
    try {
      await apiFetch(`/api/practices/${practice._id}/practitioners/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole }),
      }, getAccessTokenSilently);
      setEditTarget(null);
      loadPractice();
    } catch {
      // ignore
    } finally {
      setEditLoading(false);
    }
  }

  // Normalise practitioners for TeamMembersTable
  const members = practitioners.map(p => ({
    id:          p._id,
    userId:      p.userId?._id || p.userId,
    name:        p.userId?.name || p.userId?.email || '—',
    email:       p.userId?.email || '—',
    practiceRole: p.role,
    role:        p.role,
    joinedAt:    p.acceptedAt,
    status:      p.status,
    clientCount: undefined,
  }));

  const currentUserId = user?.sub || user?.email;

  const thread = MOCK_THREADS.find(t => t.id === selectedThread);
  const messages = MOCK_MESSAGES.filter(m => m.threadId === selectedThread);

  function handleSendMessage(e) {
    e.preventDefault();
    setNewMessage('');
  }

  function toggleTask(id) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  const PRIORITY_STYLES = {
    high:   { bg: '#fee2e2', color: '#dc2626' },
    medium: { bg: '#fef3c7', color: '#d97706' },
    low:    { bg: '#f1f5f9', color: '#64748b' },
  };

  return (
    <>
      <SiteHeader activePage="iatlas" />
      <main style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <style>{`
          .pm-layout { display: flex; min-height: calc(100vh - 64px); }
          .pm-sidebar {
            width: 220px; flex-shrink: 0; background: #1e293b; color: #e2e8f0;
            padding: 1.5rem 0; display: flex; flex-direction: column;
          }
          .pm-sidebar-brand {
            padding: .75rem 1.25rem 1.25rem; font-size: 1rem; font-weight: 800; color: #f1f5f9;
            border-bottom: 1px solid rgba(255,255,255,.08); margin-bottom: .5rem;
          }
          .pm-sidebar-brand span {
            display: block; font-size: .7rem; font-weight: 500; color: #64748b;
            margin-top: .15rem; text-transform: uppercase; letter-spacing: .08em;
          }
          .pm-nav-link {
            display: flex; align-items: center; gap: .6rem;
            padding: .65rem 1.25rem; font-size: .88rem; font-weight: 500;
            color: #94a3b8; text-decoration: none; transition: background .15s, color .15s;
            border-left: 3px solid transparent;
          }
          .pm-nav-link:hover { background: rgba(255,255,255,.06); color: #f1f5f9; }
          .pm-nav-link.active { background: rgba(99,102,241,.15); color: #a5b4fc; border-left-color: #6366f1; }
          .pm-sidebar-footer {
            margin-top: auto; padding: 1rem 1.25rem; border-top: 1px solid rgba(255,255,255,.08);
          }
          .pm-sidebar-footer a { font-size: .8rem; color: #64748b; text-decoration: none; }
          .pm-content { flex: 1; padding: 2rem 1.5rem; overflow-y: auto; }
          .pm-page-header {
            display: flex; justify-content: space-between; align-items: flex-start;
            margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;
          }
          .pm-page-title { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0; }
          .pm-page-sub { font-size: .88rem; color: #64748b; margin: .2rem 0 0; }
          .pm-btn {
            display: inline-flex; align-items: center; gap: .4rem;
            background: #6366f1; color: #fff; border: none; border-radius: 8px;
            padding: .6rem 1.2rem; font-size: .88rem; font-weight: 600;
            cursor: pointer; text-decoration: none; transition: background .15s;
          }
          .pm-btn:hover { background: #4f46e5; }

          /* Tabs */
          .team-tabs { display: flex; gap: 0; border-bottom: 2px solid #e5e7eb; margin-bottom: 1.5rem; }
          .team-tab {
            background: none; border: none; padding: .65rem 1.25rem;
            font-size: .88rem; font-weight: 600; color: #6b7280; cursor: pointer;
            border-bottom: 2px solid transparent; margin-bottom: -2px;
            transition: color .15s, border-color .15s;
          }
          .team-tab.active { color: #6366f1; border-bottom-color: #6366f1; }

          /* Announcements */
          .announce-card {
            background: #fff; border: 1px solid #e5e7eb; border-radius: 12px;
            padding: 1.1rem; margin-bottom: .75rem;
          }
          .announce-header { display: flex; align-items: center; gap: .65rem; margin-bottom: .6rem; }
          .announce-avatar { font-size: 1.4rem; }
          .announce-author { font-size: .9rem; font-weight: 700; color: #1e293b; }
          .announce-date { font-size: .78rem; color: #9ca3af; margin-top: .1rem; }
          .announce-text { font-size: .88rem; color: #374151; line-height: 1.6; }

          /* Thread + chat layout */
          .threads-layout { display: grid; grid-template-columns: 280px 1fr; gap: 1rem; height: 560px; }
          .thread-list { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; overflow-y: auto; }
          .thread-item {
            padding: .85rem 1rem; border-bottom: 1px solid #f1f5f9; cursor: pointer;
            transition: background .12s;
          }
          .thread-item:last-child { border-bottom: none; }
          .thread-item:hover { background: #f8fafc; }
          .thread-item.active { background: #eef2ff; }
          .thread-title { font-size: .88rem; font-weight: 700; color: #1e293b; margin-bottom: .2rem; }
          .thread-meta { font-size: .75rem; color: #9ca3af; }
          .thread-tags { display: flex; flex-wrap: wrap; gap: .25rem; margin-top: .35rem; }
          .thread-tag {
            background: #f1f5f9; color: #6b7280;
            border-radius: 4px; padding: .1rem .4rem;
            font-size: .68rem; font-weight: 600;
          }

          /* Chat */
          .chat-panel { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; display: flex; flex-direction: column; overflow: hidden; }
          .chat-header { padding: .85rem 1.1rem; border-bottom: 1px solid #f1f5f9; }
          .chat-header-title { font-size: .95rem; font-weight: 700; color: #1e293b; }
          .chat-header-meta { font-size: .78rem; color: #9ca3af; }
          .chat-messages { flex: 1; overflow-y: auto; padding: .85rem 1.1rem; display: flex; flex-direction: column; gap: .85rem; }
          .chat-msg { display: flex; gap: .65rem; }
          .chat-avatar { font-size: 1.4rem; flex-shrink: 0; margin-top: .1rem; }
          .chat-bubble-wrap {}
          .chat-msg-header { display: flex; align-items: baseline; gap: .5rem; margin-bottom: .25rem; }
          .chat-msg-author { font-size: .82rem; font-weight: 700; color: #1e293b; }
          .chat-msg-time { font-size: .72rem; color: #9ca3af; }
          .chat-msg-text { font-size: .85rem; color: #374151; line-height: 1.55; }
          .chat-input-row { padding: .75rem 1.1rem; border-top: 1px solid #f1f5f9; display: flex; gap: .5rem; }
          .chat-input {
            flex: 1; padding: .55rem .9rem; font-size: .88rem;
            border: 1.5px solid #e5e7eb; border-radius: 8px; outline: none;
          }
          .chat-input:focus { border-color: #6366f1; }

          /* Tasks */
          .task-item {
            background: #fff; border: 1px solid #e5e7eb; border-radius: 12px;
            padding: .9rem 1.1rem; margin-bottom: .6rem;
            display: flex; align-items: center; gap: .85rem;
          }
          .task-check {
            width: 18px; height: 18px; border-radius: 5px;
            border: 2px solid #6366f1; flex-shrink: 0; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
          }
          .task-check.done { background: #6366f1; border-color: #6366f1; }
          .task-title { font-size: .88rem; font-weight: 600; color: #1e293b; flex: 1; }
          .task-title.done { text-decoration: line-through; color: #9ca3af; }
          .task-meta { font-size: .75rem; color: #9ca3af; }
          .priority-badge {
            padding: .15rem .5rem; border-radius: 999px;
            font-size: .7rem; font-weight: 700;
          }

          /* Modal */
          .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
          .modal-box { background: #fff; border-radius: 16px; padding: 2rem; width: 100%; max-width: 460px; margin: 0 1rem; }
          .modal-title { font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 0 0 1.25rem; }
          .modal-field { margin-bottom: 1rem; }
          .modal-label { display: block; font-size: .82rem; font-weight: 600; color: #374151; margin-bottom: .35rem; }
          .modal-input { width: 100%; padding: .6rem .9rem; font-size: .9rem; border: 1.5px solid #e5e7eb; border-radius: 8px; outline: none; box-sizing: border-box; }
          .modal-input:focus { border-color: #6366f1; }
          .modal-actions { display: flex; gap: .75rem; justify-content: flex-end; margin-top: 1.25rem; }
          .modal-cancel { background: #f1f5f9; border: none; border-radius: 8px; padding: .6rem 1.2rem; font-size: .9rem; font-weight: 600; cursor: pointer; }

          @media (max-width: 900px) { .pm-sidebar { display: none; } }
          @media (max-width: 700px) { .threads-layout { grid-template-columns: 1fr; height: auto; } .thread-list { max-height: 220px; } }
        `}</style>

        <div className="pm-layout">
          {/* Sidebar */}
          <nav className="pm-sidebar" aria-label="Practice navigation">
            <div className="pm-sidebar-brand">Practice Hub<span>IATLAS Management</span></div>
            {PRACTICE_NAV.map(item => (
              <Link
                key={item.key}
                to={item.to}
                className={`pm-nav-link${item.key === 'team' ? ' active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
            <div className="pm-sidebar-footer">
              <Link to="/practice-settings"><img src="/icons/compass.svg" alt="" aria-hidden="true" className="icon icon-sm" /> Practice Settings</Link><br />
              <Link to="/iatlas" style={{ marginTop: '.4rem', display: 'block' }}>← IATLAS Home</Link>
            </div>
          </nav>

          {/* Main */}
          <div className="pm-content">
            <div className="pm-page-header">
              <div>
                <h1 className="pm-page-title">Team Communication</h1>
                <p className="pm-page-sub">Collaborate on client care and practice management.</p>
              </div>
              <button className="pm-btn" onClick={() => setShowNewThread(true)}>
                + New Discussion
              </button>
            </div>

            {/* Tabs */}
            <div className="team-tabs" role="tablist">
              {['members', 'announcements', 'threads', 'tasks'].map(s => (
                <button
                  key={s}
                  className={`team-tab${activeSection === s ? ' active' : ''}`}
                  role="tab"
                  aria-selected={activeSection === s}
                  onClick={() => setActiveSection(s)}
                >
                  {s === 'members' ? 'Members' : s === 'announcements' ? 'Announcements' : s === 'threads' ? 'Discussions' : 'Tasks'}
                </button>
              ))}
            </div>

            {/* Members */}
            {activeSection === 'members' && (
              <div role="tabpanel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {practice && (
                  <SeatUsageIndicator
                    seatsUsed={practice.seatsUsed || 0}
                    seatLimit={practice.seatLimit || 5}
                    plan={practice.plan || 'practice-5'}
                    onUpgrade={() => window.location.href = '/iatlas/practice/billing'}
                  />
                )}

                {practiceError && !loadingPractice && (
                  <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: 10, fontSize: 14 }}>
                    {practiceError}
                  </div>
                )}

                <TeamMembersTable
                  members={members}
                  currentUserId={currentUserId}
                  currentUserRole={practiceRole}
                  loading={loadingPractice}
                  onEditRole={handleEditRole}
                  onRemove={handleRemoveMember}
                />

                {/* Invite button for admins */}
                {(practiceRole === 'admin' || practiceRole === 'owner') && practice && (
                  <div>
                    <button
                      className="pm-btn"
                      onClick={() => { setInviteError(null); setInviteSuccess(null); setInviteUrl(null); setShowInvite(true); }}
                    >
                      + Invite Practitioner
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Announcements */}
            {activeSection === 'announcements' && (
              <div role="tabpanel">
                <div style={{ background: '#fef3c7', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400e', marginBottom: 16 }}>
                  📋 Demo content — announcements board and real-time messaging are coming in a future release.
                </div>
                {MOCK_ANNOUNCEMENTS.map(a => (
                  <div key={a.id} className="announce-card">
                    <div className="announce-header">
                      <span className="announce-avatar" aria-hidden="true">{a.avatar}</span>
                      <div>
                        <p className="announce-author">{a.author}</p>
                        <p className="announce-date">{a.date}</p>
                      </div>
                    </div>
                    <p className="announce-text">{a.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Discussion threads */}
            {activeSection === 'threads' && (
              <div role="tabpanel">
                <div className="threads-layout">
                  {/* Thread list */}
                  <div className="thread-list" aria-label="Discussion threads">
                    {MOCK_THREADS.map(t => (
                      <div
                        key={t.id}
                        className={`thread-item${selectedThread === t.id ? ' active' : ''}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedThread(t.id)}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedThread(t.id); }}
                        aria-selected={selectedThread === t.id}
                      >
                        <p className="thread-title">{t.resolved ? ' ' : ''}{t.title}</p>
                        <p className="thread-meta">
                          By {t.createdBy} · {t.messages} messages · {t.lastMsg}
                        </p>
                        {t.client && (
                          <p className="thread-meta" style={{ marginTop: '.15rem' }}><img src="/icons/network.svg" alt="" aria-hidden="true" className="icon icon-sm" /> {t.client}</p>
                        )}
                        <div className="thread-tags">
                          {t.tags.map(tag => (
                            <span key={tag} className="thread-tag">{tag}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chat panel */}
                  <div className="chat-panel" role="region" aria-label="Thread conversation">
                    {thread && (
                      <>
                        <div className="chat-header">
                          <p className="chat-header-title">{thread.title}</p>
                          <p className="chat-header-meta">
                            {thread.client ? `${thread.client} · ` : ''}
                            {thread.messages} messages
                          </p>
                        </div>
                        <div className="chat-messages" aria-live="polite">
                          {messages.map(msg => (
                            <div key={msg.id} className="chat-msg">
                              <span className="chat-avatar" aria-hidden="true">{msg.avatar}</span>
                              <div className="chat-bubble-wrap">
                                <div className="chat-msg-header">
                                  <span className="chat-msg-author">{msg.author}</span>
                                  <span className="chat-msg-time">{msg.time}</span>
                                </div>
                                <p className="chat-msg-text">{msg.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <form className="chat-input-row" onSubmit={handleSendMessage}>
                          <label htmlFor="chat-msg-input" style={{ position: 'absolute', left: '-9999px' }}>
                            Type a message
                          </label>
                          <input
                            id="chat-msg-input"
                            className="chat-input"
                            type="text"
                            placeholder="Type a message…"
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                          />
                          <button type="submit" className="pm-btn" style={{ padding: '.55rem 1rem' }}>
                            Send
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tasks */}
            {activeSection === 'tasks' && (
              <div role="tabpanel">
                {tasks.map(t => {
                  const ps = PRIORITY_STYLES[t.priority];
                  return (
                    <div key={t.id} className="task-item">
                      <div
                        className={`task-check${t.done ? ' done' : ''}`}
                        role="checkbox"
                        aria-checked={t.done}
                        tabIndex={0}
                        onClick={() => toggleTask(t.id)}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleTask(t.id); }}
                      >
                        {t.done && <span style={{ color: '#fff', fontSize: '.8rem', fontWeight: 900 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p className={`task-title${t.done ? ' done' : ''}`}>{t.title}</p>
                        <p className="task-meta">Assigned to {t.assignee} · Due {t.due}</p>
                      </div>
                      <span
                        className="priority-badge"
                        style={{ background: ps.bg, color: ps.color }}
                      >
                        {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Coming soon */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              borderRadius: 16, padding: '1.25rem 1.5rem',
              color: '#94a3b8', fontSize: '.85rem',
              display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
              marginTop: '1.5rem',
            }}>
              <img src="/icons/warning.svg" aria-hidden="true" className="icon icon-sm" alt="" />
              <p style={{ margin: 0 }}>
                <span style={{ color: '#f1f5f9', fontWeight: 700 }}>Real-time messaging — Coming 2026.</span>{' '}
                Live notifications, file attachments, @mentions, and integrated case consultation
                requests are in development.
              </p>
            </div>
          </div>
        </div>

        {/* New Thread Modal */}
        {showNewThread && (
          <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="thread-modal-title"
            onClick={e => { if (e.target === e.currentTarget) setShowNewThread(false); }}
          >
            <div className="modal-box">
              <h2 className="modal-title" id="thread-modal-title">New Discussion Thread</h2>
              <form onSubmit={e => { e.preventDefault(); setShowNewThread(false); }}>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="thread-title">Thread Title</label>
                  <input id="thread-title" className="modal-input" type="text" placeholder="e.g. Maya Osei — Transition Planning" required />
                </div>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="thread-client">Related Client (optional)</label>
                  <input id="thread-client" className="modal-input" type="text" placeholder="Search client…" />
                </div>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="thread-msg">Opening Message</label>
                  <textarea
                    id="thread-msg"
                    style={{ width: '100%', minHeight: 80, padding: '.6rem .9rem', fontSize: '.9rem', border: '1.5px solid #e5e7eb', borderRadius: 8, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                    placeholder="Describe what you'd like to discuss…"
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="modal-cancel" onClick={() => setShowNewThread(false)}>Cancel</button>
                  <button type="submit" className="pm-btn">Create Thread</button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Invite Practitioner Modal */}
        <InvitePractitionerModal
          isOpen={showInvite}
          onClose={() => setShowInvite(false)}
          onInvite={handleInvite}
          loading={inviting}
          error={inviteError}
          success={inviteSuccess}
          inviteUrl={inviteUrl}
          seatsUsed={practice?.seatsUsed}
          seatLimit={practice?.seatLimit}
        />

        {/* Edit Role Modal */}
        {editTarget && (
          <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-role-modal-title"
            onClick={e => { if (e.target === e.currentTarget) setEditTarget(null); }}
          >
            <div className="modal-box">
              <h2 className="modal-title" id="edit-role-modal-title">
                Edit Role — {editTarget.userId?.name || editTarget.userId?.email || '—'}
              </h2>
              <div className="modal-field">
                <label className="modal-label" htmlFor="edit-role-select">Role</label>
                <select
                  id="edit-role-select"
                  className="modal-input"
                  value={editRole}
                  onChange={e => setEditRole(e.target.value)}
                >
                  {['admin', 'clinician', 'therapist', 'observer'].map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="modal-cancel" onClick={() => setEditTarget(null)}>Cancel</button>
                <button
                  type="button"
                  className="pm-btn"
                  disabled={editLoading}
                  onClick={submitEditRole}
                >
                  {editLoading ? 'Saving…' : 'Save Role'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
