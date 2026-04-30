/**
 * PracticeDashboardPage.jsx
 * Main practice management dashboard — overview of clients, caseloads, and metrics.
 * Route: /iatlas/practice/dashboard
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';
import PaywallModal from '../components/PaywallModal.jsx';
import apiFetch, { getAuth0CachedToken } from '../lib/apiFetch.js';
import { requireActiveSubscription } from '../utils/iatlasGating.js';

const VALID_DIMENSIONS = [
  { value: 'emotional-adaptive',    label: 'Emotional-Adaptive' },
  { value: 'agentic-generative',    label: 'Agentic-Generative' },
  { value: 'somatic-regulative',    label: 'Somatic-Regulative' },
  { value: 'cognitive-narrative',   label: 'Cognitive-Narrative' },
  { value: 'relational-connective', label: 'Relational-Connective' },
  { value: 'spiritual-existential', label: 'Spiritual-Existential' },
];

const PRACTICE_NAV = [
  { to: '/iatlas/practice/dashboard',  label: 'Dashboard',  key: 'dashboard',  icon: '/icons/planning.svg' },
  { to: '/iatlas/practice/clients',    label: 'Clients',    key: 'clients',    icon: '/icons/organization.svg' },
  { to: '/iatlas/practice/schedule',   label: 'Schedule',   key: 'schedule',   icon: '/icons/time.svg' },
  { to: '/iatlas/practice/billing',    label: 'Billing',    key: 'billing',    icon: '/icons/currency.svg' },
  { to: '/iatlas/practice/team',       label: 'Team',       key: 'team',       icon: '/icons/team.svg' },
  { to: '/iatlas/practice/analytics',  label: 'Analytics',  key: 'analytics',  icon: '/icons/growth.svg' },
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
  { icon: '/icons/warning.svg', text: 'Owen Park — IEP review due in 3 days', type: 'warning' },
  { icon: '/icons/journal.svg', text: '3 session notes pending documentation', type: 'info' },
  { icon: '/icons/certification.svg', text: 'Johnson family — payment overdue 14 days', type: 'urgent' },
];

export default function PracticeDashboardPage() {
  const [showAddClient, setShowAddClient] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallInfo, setPaywallInfo] = useState({ currentTier: 'free', requiredTier: 'practice' });

  useEffect(() => {
    async function checkAccess() {
      const token = getAuth0CachedToken();
      const check = await requireActiveSubscription('practice', token);
      if (!check.allowed) {
        setPaywallInfo({ currentTier: check.currentTier, requiredTier: check.requiredTier });
        setShowPaywall(true);
      }
    }
    checkAccess();
  }, []);

  return (
    <>
      {showPaywall && (
        <PaywallModal
          requiredTier={paywallInfo.requiredTier}
          currentTier={paywallInfo.currentTier}
          onClose={() => setShowPaywall(false)}
        />
      )}
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
          .nav-icon { opacity: .85; flex-shrink: 0; }
          .pm-nav-link.active .nav-icon { opacity: 1; }
          button img[aria-hidden="true"] { vertical-align: text-bottom; margin-right: 6px; flex-shrink: 0; }
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
                <img src={item.icon} alt="" aria-hidden="true" className="nav-icon" width={16} height={16} />
                <span>{item.label}</span>
              </Link>
            ))}
            <div className="pm-sidebar-footer">
              <Link to="/practice-settings"><img src="/icons/compass.svg" alt="" aria-hidden="true" className="icon icon-sm" /> Practice Settings</Link><br />
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
                  <img src="/icons/organization.svg" alt="" width={14} height={14} aria-hidden="true" />
                  <span>Add Client</span>
                </button>
                <Link to="/iatlas/practice/schedule" className="pm-btn"><img src="/icons/planning.svg" alt="" aria-hidden="true" className="icon icon-sm" /> Schedule Session
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
              <Link to="/iatlas/practice/clients" className="pm-btn pm-btn-outline" style={{ border: '1.5px solid #e5e7eb' }}><img src="/icons/network.svg" alt="" aria-hidden="true" className="icon icon-sm" /> View All Clients</Link>
              <Link to="/iatlas/practice/billing" className="pm-btn pm-btn-outline" style={{ border: '1.5px solid #e5e7eb' }}><img src="/icons/certification.svg" alt="" aria-hidden="true" className="icon icon-sm" /> Generate Invoice</Link>
              <Link to="/iatlas/practice/analytics" className="pm-btn pm-btn-outline" style={{ border: '1.5px solid #e5e7eb' }}><img src="/icons/org-leaderboards.svg" alt="" aria-hidden="true" className="icon icon-sm" /> Practice Report</Link>
              <Link to="/iatlas/practice/team" className="pm-btn pm-btn-outline" style={{ border: '1.5px solid #e5e7eb' }}><img src="/icons/dialog.svg" alt="" aria-hidden="true" className="icon icon-sm" /> Team Messages</Link>
              <Link to="/iatlas/org/dashboard" className="pm-btn pm-btn-outline" style={{ border: '1.5px solid #e5e7eb', color: '#4f46e5' }}><img src="/icons/organization.svg" alt="" aria-hidden="true" className="icon icon-sm" /> Org Dashboard</Link>
              <Link to="/iatlas/ml/insights" className="pm-btn pm-btn-outline" style={{ border: '1.5px solid #e5e7eb', color: '#7c3aed' }}><img src="/icons/agentic-generative.svg" alt="" aria-hidden="true" className="icon icon-sm" /> AI Insights</Link>
            </div>

            {/* Two-column layout */}
            <div className="pm-two-col">
              {/* Today's sessions */}
              <div className="pm-card">
                <h2 className="pm-card-title"><img src="/icons/planning.svg" alt="" aria-hidden="true" className="icon icon-sm" /> Today's Sessions</h2>
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
                <h2 className="pm-card-title"><img src="/icons/network.svg" alt="" aria-hidden="true" className="icon icon-sm" /> Caseload Distribution</h2>
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

            {/* Live data notice */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              borderRadius: 16, padding: '1.5rem',
              color: '#94a3b8', fontSize: '.88rem', lineHeight: 1.65,
              display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
            }}>
              <img src="/icons/info.svg" aria-hidden="true" className="icon icon-sm" alt="" />
              <div>
                <p style={{ color: '#f1f5f9', fontWeight: 700, margin: '0 0 .2rem', fontSize: '.95rem' }}>
                  Practice Hub — Live Mode
                </p>
                <p style={{ margin: 0 }}>
                  Metrics above reflect mock data. As you add clients and log sessions the
                  dashboard will populate with live data.{' '}
                  <Link to="/iatlas/practice/clients" style={{ color: '#a5b4fc', fontWeight: 600 }}>
                    Manage clients →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Client Modal */}
        {showAddClient && (
          <AddClientModal onClose={() => setShowAddClient(false)} />
        )}
      </main>
    </>
  );
}

// ── Add Client Intake Modal ───────────────────────────────────────────────────

const EMPTY_FORM = {
  clientIdentifier:      '',
  dateOfBirth:           '',
  pronouns:              '',
  targetDimensions:      [],
  clinicalGoals:         '',
  guardianContactName:   '',
  guardianContactPhone:  '',
  guardianContactEmail:  '',
  intakeNotes:           '',
  firstSessionDate:      '',
};

function AddClientModal({ onClose }) {
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState(null);
  const [success,     setSuccess]     = useState(false);

  function setField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function toggleDimension(dim) {
    setForm(prev => {
      const already = prev.targetDimensions.includes(dim);
      return {
        ...prev,
        targetDimensions: already
          ? prev.targetDimensions.filter(d => d !== dim)
          : [...prev.targetDimensions, dim],
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.clientIdentifier.trim()) {
      return setError('Client identifier is required.');
    }
    if (!form.dateOfBirth) {
      return setError('Date of birth is required.');
    }
    if (form.targetDimensions.length === 0) {
      return setError('Select at least one target dimension.');
    }

    const payload = {
      clientIdentifier:      form.clientIdentifier.trim(),
      dateOfBirth:           form.dateOfBirth,
      pronouns:              form.pronouns.trim(),
      targetDimensions:      form.targetDimensions,
      clinicalGoals:         form.clinicalGoals
        ? form.clinicalGoals.split('\n').map(g => g.trim()).filter(Boolean)
        : [],
      guardianContact:
        form.guardianContactName.trim()
          ? {
              name:  form.guardianContactName.trim(),
              phone: form.guardianContactPhone.trim(),
              email: form.guardianContactEmail.trim(),
            }
          : null,
      intakeNotes:     form.intakeNotes.trim(),
      firstSessionDate: form.firstSessionDate || null,
    };

    setSubmitting(true);
    try {
      const token = getAuth0CachedToken();
      const res = await apiFetch(
        '/api/clinical/clients',
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        },
        () => Promise.resolve(token),
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to create client.');
      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '.55rem .75rem',
    border: '1.5px solid #e2e8f0', borderRadius: 8,
    fontSize: '.88rem', outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle = {
    display: 'block', fontSize: '.78rem', fontWeight: 600,
    color: '#374151', marginBottom: '.3rem',
  };
  const fieldStyle = { marginBottom: '1rem' };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="aci-title"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        zIndex: 1000, overflowY: 'auto', padding: '2rem 1rem',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 16,
        width: '100%', maxWidth: 560, padding: '2rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <h2 id="aci-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
            New Client Intake
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#64748b', padding: 0, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}><img src="/icons/success.svg" alt="" aria-hidden="true" className="icon icon-sm" /> </div>
            <p style={{ fontWeight: 700, color: '#059669', margin: 0 }}>Client profile created!</p>
            <p style={{ fontSize: '.85rem', color: '#6b7280', marginTop: '.35rem' }}>
              Redirecting to the dashboard…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {/* Client identifier */}
            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="aci-id">
                Client Identifier <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="aci-id"
                type="text"
                style={inputStyle}
                value={form.clientIdentifier}
                onChange={e => setField('clientIdentifier', e.target.value)}
                placeholder="e.g. First name or initials (not full legal name)"
                maxLength={50}
                required
              />
              <p style={{ fontSize: '.73rem', color: '#9ca3af', margin: '.25rem 0 0' }}>
                Use a pseudonym or initials to protect client privacy.
              </p>
            </div>

            {/* Date of birth */}
            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="aci-dob">
                Date of Birth <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="aci-dob"
                type="date"
                style={inputStyle}
                value={form.dateOfBirth}
                onChange={e => setField('dateOfBirth', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            {/* Pronouns */}
            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="aci-pronouns">Pronouns</label>
              <input
                id="aci-pronouns"
                type="text"
                style={inputStyle}
                value={form.pronouns}
                onChange={e => setField('pronouns', e.target.value)}
                placeholder="e.g. she/her, he/him, they/them"
                maxLength={30}
              />
            </div>

            {/* Target dimensions */}
            <div style={fieldStyle}>
              <label style={labelStyle}>
                Target Dimensions <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
                {VALID_DIMENSIONS.map(dim => {
                  const selected = form.targetDimensions.includes(dim.value);
                  return (
                    <button
                      key={dim.value}
                      type="button"
                      onClick={() => toggleDimension(dim.value)}
                      style={{
                        padding: '.3rem .75rem',
                        borderRadius: 20,
                        border: `1.5px solid ${selected ? '#6366f1' : '#e2e8f0'}`,
                        background: selected ? '#eef2ff' : '#fff',
                        color: selected ? '#4f46e5' : '#374151',
                        fontSize: '.78rem', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      {dim.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clinical goals */}
            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="aci-goals">Clinical Goals</label>
              <textarea
                id="aci-goals"
                style={{ ...inputStyle, resize: 'vertical' }}
                value={form.clinicalGoals}
                onChange={e => setField('clinicalGoals', e.target.value)}
                placeholder="One goal per line…"
                rows={3}
                maxLength={2000}
              />
            </div>

            {/* Guardian contact */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Guardian / Caregiver Contact</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                <input
                  type="text"
                  style={inputStyle}
                  value={form.guardianContactName}
                  onChange={e => setField('guardianContactName', e.target.value)}
                  placeholder="Name"
                  maxLength={100}
                />
                <input
                  type="tel"
                  style={inputStyle}
                  value={form.guardianContactPhone}
                  onChange={e => setField('guardianContactPhone', e.target.value)}
                  placeholder="Phone"
                  maxLength={30}
                />
              </div>
              <input
                type="email"
                style={{ ...inputStyle, marginTop: '.5rem' }}
                value={form.guardianContactEmail}
                onChange={e => setField('guardianContactEmail', e.target.value)}
                placeholder="Email"
                maxLength={254}
              />
            </div>

            {/* First session date */}
            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="aci-first-session">First Session Date</label>
              <input
                id="aci-first-session"
                type="date"
                style={inputStyle}
                value={form.firstSessionDate}
                onChange={e => setField('firstSessionDate', e.target.value)}
              />
            </div>

            {/* Intake notes */}
            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="aci-notes">Intake Notes</label>
              <textarea
                id="aci-notes"
                style={{ ...inputStyle, resize: 'vertical' }}
                value={form.intakeNotes}
                onChange={e => setField('intakeNotes', e.target.value)}
                placeholder="Background, referral source, initial observations…"
                rows={3}
                maxLength={3000}
              />
            </div>

            {error && (
              <p role="alert" style={{ color: '#dc2626', fontSize: '.83rem', marginBottom: '.75rem', background: '#fef2f2', padding: '.5rem .75rem', borderRadius: 8 }}>
                {error}
              </p>
            )}

            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '.6rem 1.2rem', cursor: 'pointer', fontWeight: 600, fontSize: '.88rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: submitting ? '#818cf8' : '#6366f1',
                  color: '#fff', border: 'none', borderRadius: 8,
                  padding: '.6rem 1.4rem', cursor: submitting ? 'not-allowed' : 'pointer',
                  fontWeight: 700, fontSize: '.88rem',
                }}
              >
                {submitting ? 'Creating…' : 'Create Client'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
