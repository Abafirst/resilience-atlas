/**
 * PracticeDashboardPage.jsx
 * Main practice management dashboard — overview of clients, caseloads, and metrics.
 * Route: /iatlas/practice/dashboard
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';

const PRACTICE_NAV = [
  { to: '/iatlas/practice/dashboard',  label: '🏠 Dashboard',  key: 'dashboard' },
  { to: '/iatlas/practice/clients',    label: '👥 Clients',    key: 'clients' },
  { to: '/iatlas/practice/schedule',   label: '📅 Schedule',   key: 'schedule' },
  { to: '/iatlas/practice/billing',    label: '💳 Billing',    key: 'billing' },
  { to: '/iatlas/practice/team',       label: '💬 Team',       key: 'team' },
  { to: '/iatlas/practice/analytics',  label: '📊 Analytics',  key: 'analytics' },
];

const MOCK_METRICS = [
  { label: 'Active Clients',      value: '24',  sub: '+3 this month',     color: '#4f46e5', bg: '#eef2ff' },
  { label: 'Sessions This Week',  value: '18',  sub: '6 remaining today', color: '#059669', bg: '#d1fae5' },
  { label: 'Protocol Completion', value: '73%', sub: 'Across all clients', color: '#d97706', bg: '#fef3c7' },
  { label: 'Pending Invoices',    value: '$4.2k', sub: '8 invoices',       color: '#db2777', bg: '#fce7f3' },
];

const MOCK_CASELOAD = [
  { name: 'Dr. Sarah Chen',      specialty: 'SLP',         clients: 9,  max: 12, color: '#4f46e5' },
  { name: 'Marcus Williams',     specialty: 'ABA',         clients: 11, max: 12, color: '#059669' },
  { name: 'Priya Patel',         specialty: 'OT',          clients: 7,  max: 10, color: '#d97706' },
  { name: 'James Rodriguez',     specialty: 'Social Skills', clients: 5, max: 8, color: '#db2777' },
];

const MOCK_SESSIONS_TODAY = [
  { time: '9:00 AM',  client: 'Amir Johnson',    practitioner: 'Dr. Chen',   type: 'Therapy',    status: 'completed' },
  { time: '10:30 AM', client: 'Lily Torres',     practitioner: 'M. Williams', type: 'ABA',       status: 'completed' },
  { time: '12:00 PM', client: 'Owen Park',       practitioner: 'P. Patel',   type: 'OT',         status: 'in-progress' },
  { time: '2:00 PM',  client: 'Maya Osei',       practitioner: 'J. Rodriguez', type: 'Social',  status: 'scheduled' },
  { time: '3:30 PM',  client: 'Leo Nguyen',      practitioner: 'Dr. Chen',   type: 'Therapy',    status: 'scheduled' },
];

const STATUS_STYLES = {
  completed:    { bg: '#d1fae5', color: '#059669', label: 'Completed' },
  'in-progress':{ bg: '#fef3c7', color: '#d97706', label: 'In Progress' },
  scheduled:    { bg: '#eef2ff', color: '#4f46e5', label: 'Scheduled' },
};

const ALERTS = [
  { icon: '⚠️', text: 'Owen Park — IEP review due in 3 days', type: 'warning' },
  { icon: '📋', text: '3 session notes pending documentation', type: 'info' },
  { icon: '💳', text: 'Johnson family — payment overdue 14 days', type: 'urgent' },
];

export default function PracticeDashboardPage() {
  const [showAddClient, setShowAddClient] = useState(false);

  return (
    <>
      <SiteHeader activePage="iatlas" />
      <main style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <style>{`
          .pm-layout { display: flex; min-height: calc(100vh - 64px); }

          /* Sidebar */
          .pm-sidebar {
            width: 220px; flex-shrink: 0;
            background: #1e293b; color: #e2e8f0;
            padding: 1.5rem 0;
            display: flex; flex-direction: column;
          }
          .pm-sidebar-brand {
            padding: .75rem 1.25rem 1.25rem;
            font-size: 1rem; font-weight: 800; color: #f1f5f9;
            border-bottom: 1px solid rgba(255,255,255,.08);
            margin-bottom: .5rem;
          }
          .pm-sidebar-brand span {
            display: block; font-size: .7rem; font-weight: 500;
            color: #64748b; margin-top: .15rem; text-transform: uppercase; letter-spacing: .08em;
          }
          .pm-nav-link {
            display: flex; align-items: center; gap: .6rem;
            padding: .65rem 1.25rem; font-size: .88rem; font-weight: 500;
            color: #94a3b8; text-decoration: none;
            transition: background .15s, color .15s;
            border-left: 3px solid transparent;
          }
          .pm-nav-link:hover { background: rgba(255,255,255,.06); color: #f1f5f9; }
          .pm-nav-link.active {
            background: rgba(99,102,241,.15); color: #a5b4fc;
            border-left-color: #6366f1;
          }
          .pm-sidebar-footer {
            margin-top: auto; padding: 1rem 1.25rem;
            border-top: 1px solid rgba(255,255,255,.08);
          }
          .pm-sidebar-footer a {
            font-size: .8rem; color: #64748b; text-decoration: none;
          }
          .pm-sidebar-footer a:hover { color: #94a3b8; }

          /* Main content */
          .pm-content {
            flex: 1; padding: 2rem 1.5rem;
            overflow-y: auto; max-width: 1100px;
          }
          .pm-page-header {
            display: flex; justify-content: space-between; align-items: flex-start;
            margin-bottom: 1.75rem; flex-wrap: wrap; gap: 1rem;
          }
          .pm-page-title {
            font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0;
          }
          .pm-page-sub {
            font-size: .88rem; color: #64748b; margin: .2rem 0 0;
          }
          .pm-btn {
            display: inline-flex; align-items: center; gap: .4rem;
            background: #6366f1; color: #fff; border: none;
            border-radius: 8px; padding: .6rem 1.2rem;
            font-size: .88rem; font-weight: 600; cursor: pointer;
            text-decoration: none; transition: background .15s;
          }
          .pm-btn:hover { background: #4f46e5; }
          .pm-btn-outline {
            background: #fff; color: #374151;
            border: 1.5px solid #e5e7eb;
          }
          .pm-btn-outline:hover { background: #f9fafb; }

          /* Metrics */
          .pm-metrics { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
          .pm-metric-card {
            background: #fff; border: 1px solid #e5e7eb;
            border-radius: 14px; padding: 1.25rem;
          }
          .pm-metric-label { font-size: .78rem; font-weight: 600; color: #6b7280; margin-bottom: .35rem; text-transform: uppercase; letter-spacing: .05em; }
          .pm-metric-value { font-size: 2rem; font-weight: 800; color: #1e293b; margin: 0; }
          .pm-metric-sub { font-size: .78rem; color: #9ca3af; margin-top: .2rem; }

          /* Alerts */
          .pm-alerts { display: flex; flex-direction: column; gap: .5rem; margin-bottom: 2rem; }
          .pm-alert {
            display: flex; align-items: center; gap: .75rem;
            background: #fff; border: 1px solid #e5e7eb;
            border-radius: 10px; padding: .75rem 1rem;
            font-size: .85rem; color: #374151;
          }
          .pm-alert.urgent { border-color: #fca5a5; background: #fff5f5; }
          .pm-alert.warning { border-color: #fcd34d; background: #fffbeb; }

          /* Two-column grid */
          .pm-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 2rem; }

          /* Cards */
          .pm-card {
            background: #fff; border: 1px solid #e5e7eb;
            border-radius: 14px; padding: 1.25rem;
          }
          .pm-card-title {
            font-size: .95rem; font-weight: 700; color: #1e293b;
            margin: 0 0 1rem;
          }

          /* Caseload bars */
          .pm-caseload-row { display: flex; flex-direction: column; gap: .35rem; margin-bottom: .85rem; }
          .pm-caseload-meta { display: flex; justify-content: space-between; align-items: baseline; }
          .pm-caseload-name { font-size: .88rem; font-weight: 600; color: #374151; }
          .pm-caseload-specialty { font-size: .75rem; color: #9ca3af; }
          .pm-caseload-count { font-size: .8rem; font-weight: 700; color: #374151; }
          .pm-caseload-bar-bg {
            height: 8px; background: #f1f5f9; border-radius: 999px; overflow: hidden;
          }
          .pm-caseload-bar-fill { height: 100%; border-radius: 999px; transition: width .4s ease; }

          /* Sessions table */
          .pm-session-row {
            display: flex; align-items: center; gap: .75rem;
            padding: .65rem 0; border-bottom: 1px solid #f1f5f9;
            font-size: .85rem;
          }
          .pm-session-row:last-child { border-bottom: none; }
          .pm-session-time { width: 68px; flex-shrink: 0; font-weight: 600; color: #374151; }
          .pm-session-client { flex: 1; color: #1e293b; font-weight: 500; }
          .pm-session-prac { flex: 1; color: #64748b; }
          .pm-session-type { width: 80px; flex-shrink: 0; color: #64748b; }
          .pm-status-badge {
            padding: .2rem .65rem; border-radius: 999px;
            font-size: .72rem; font-weight: 700; flex-shrink: 0;
          }

          /* Quick actions */
          .pm-quick-actions { display: flex; flex-wrap: wrap; gap: .75rem; margin-bottom: 2rem; }

          @media (max-width: 900px) {
            .pm-sidebar { display: none; }
            .pm-two-col { grid-template-columns: 1fr; }
          }
          @media (max-width: 640px) {
            .pm-metrics { grid-template-columns: 1fr 1fr; }
            .pm-session-prac, .pm-session-type { display: none; }
          }
        `}</style>

        <div className="pm-layout">
          {/* ── Sidebar ─────────────────────────────────────────────── */}
          <nav className="pm-sidebar" aria-label="Practice navigation">
            <div className="pm-sidebar-brand">
              Practice Hub
              <span>IATLAS Management</span>
            </div>
            {PRACTICE_NAV.map(item => (
              <Link
                key={item.key}
                to={item.to}
                className={`pm-nav-link${item.key === 'dashboard' ? ' active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
            <div className="pm-sidebar-footer">
              <Link to="/practice-settings">⚙️ Practice Settings</Link><br />
              <Link to="/iatlas" style={{ marginTop: '.4rem', display: 'block' }}>← IATLAS Home</Link>
            </div>
          </nav>

          {/* ── Main ───────────────────────────────────────────────── */}
          <div className="pm-content">
            <div className="pm-page-header">
              <div>
                <h1 className="pm-page-title">Practice Dashboard</h1>
                <p className="pm-page-sub">Welcome back — here's your practice at a glance.</p>
              </div>
              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                <button className="pm-btn pm-btn-outline" onClick={() => setShowAddClient(true)}>
                  + Add Client
                </button>
                <Link to="/iatlas/practice/schedule" className="pm-btn">
                  📅 Schedule Session
                </Link>
              </div>
            </div>

            {/* Alerts */}
            {ALERTS.length > 0 && (
              <div className="pm-alerts" role="alert" aria-live="polite">
                {ALERTS.map((a, i) => (
                  <div key={i} className={`pm-alert ${a.type}`}>
                    <span aria-hidden="true">{a.icon}</span>
                    {a.text}
                  </div>
                ))}
              </div>
            )}

            {/* Metrics */}
            <div className="pm-metrics">
              {MOCK_METRICS.map(m => (
                <div key={m.label} className="pm-metric-card">
                  <p className="pm-metric-label">{m.label}</p>
                  <p className="pm-metric-value" style={{ color: m.color }}>{m.value}</p>
                  <p className="pm-metric-sub">{m.sub}</p>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="pm-quick-actions">
              <Link to="/iatlas/practice/clients" className="pm-btn pm-btn-outline" style={{ border: '1.5px solid #e5e7eb' }}>👥 View All Clients</Link>
              <Link to="/iatlas/practice/billing" className="pm-btn pm-btn-outline" style={{ border: '1.5px solid #e5e7eb' }}>💳 Generate Invoice</Link>
              <Link to="/iatlas/practice/analytics" className="pm-btn pm-btn-outline" style={{ border: '1.5px solid #e5e7eb' }}>📊 Practice Report</Link>
              <Link to="/iatlas/practice/team" className="pm-btn pm-btn-outline" style={{ border: '1.5px solid #e5e7eb' }}>💬 Team Messages</Link>
              <Link to="/iatlas/org/dashboard" className="pm-btn pm-btn-outline" style={{ border: '1.5px solid #e5e7eb', color: '#4f46e5' }}>🏢 Org Dashboard</Link>
              <Link to="/iatlas/ml/insights" className="pm-btn pm-btn-outline" style={{ border: '1.5px solid #e5e7eb', color: '#7c3aed' }}>🤖 AI Insights</Link>
            </div>

            {/* Two-column layout */}
            <div className="pm-two-col">
              {/* Today's sessions */}
              <div className="pm-card">
                <h2 className="pm-card-title">📅 Today's Sessions</h2>
                {MOCK_SESSIONS_TODAY.map((s, i) => {
                  const st = STATUS_STYLES[s.status];
                  return (
                    <div key={i} className="pm-session-row">
                      <span className="pm-session-time">{s.time}</span>
                      <span className="pm-session-client">{s.client}</span>
                      <span className="pm-session-prac">{s.practitioner}</span>
                      <span className="pm-session-type">{s.type}</span>
                      <span
                        className="pm-status-badge"
                        style={{ background: st.bg, color: st.color }}
                      >
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Caseload */}
              <div className="pm-card">
                <h2 className="pm-card-title">👥 Caseload Distribution</h2>
                {MOCK_CASELOAD.map((p, i) => (
                  <div key={i} className="pm-caseload-row">
                    <div className="pm-caseload-meta">
                      <span>
                        <span className="pm-caseload-name">{p.name}</span>
                        <span className="pm-caseload-specialty"> · {p.specialty}</span>
                      </span>
                      <span className="pm-caseload-count">{p.clients}/{p.max}</span>
                    </div>
                    <div className="pm-caseload-bar-bg">
                      <div
                        className="pm-caseload-bar-fill"
                        style={{
                          width: `${(p.clients / p.max) * 100}%`,
                          background: p.clients / p.max >= 0.9 ? '#ef4444' : p.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
                <Link
                  to="/iatlas/practice/clients"
                  style={{ display: 'block', marginTop: '.75rem', fontSize: '.82rem', color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}
                >
                  Manage caseloads →
                </Link>
              </div>
            </div>

            {/* Coming Soon notice */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              borderRadius: 16, padding: '1.5rem',
              color: '#94a3b8', fontSize: '.88rem', lineHeight: 1.65,
              display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '1.5rem' }} aria-hidden="true">🚧</span>
              <div>
                <p style={{ color: '#f1f5f9', fontWeight: 700, margin: '0 0 .2rem', fontSize: '.95rem' }}>
                  Full Practice Management — Coming 2026
                </p>
                <p style={{ margin: 0 }}>
                  Live data sync, drag-and-drop scheduling, real billing integration, and team
                  communication are actively in development. This dashboard shows a preview of
                  what's coming.{' '}
                  <a href="#" style={{ color: '#a5b4fc', fontWeight: 600 }}>Join the waitlist →</a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Client Modal placeholder */}
        {showAddClient && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-client-title"
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            }}
            onClick={e => { if (e.target === e.currentTarget) setShowAddClient(false); }}
          >
            <div style={{
              background: '#fff', borderRadius: 16, padding: '2rem',
              width: '100%', maxWidth: 480, margin: '0 1rem',
            }}>
              <h2 id="add-client-title" style={{ margin: '0 0 .5rem', fontSize: '1.2rem', fontWeight: 700 }}>
                Add New Client
              </h2>
              <p style={{ color: '#64748b', fontSize: '.88rem', marginBottom: '1.5rem' }}>
                Full client intake form coming soon. Visit the Clients page to manage your caseload.
              </p>
              <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowAddClient(false)}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '.6rem 1.2rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Close
                </button>
                <Link to="/iatlas/practice/clients" className="pm-btn" style={{ textDecoration: 'none' }}>
                  Go to Clients →
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
