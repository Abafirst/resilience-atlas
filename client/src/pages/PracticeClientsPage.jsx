/**
 * PracticeClientsPage.jsx
 * Client & family management page — list, search, and manage client profiles.
 * Route: /iatlas/practice/clients
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';
import PaywallModal from '../components/PaywallModal.jsx';
import { requireActiveSubscription } from '../utils/iatlasGating.js';
import { getAuth0CachedToken } from '../lib/apiFetch.js';

const PRACTICE_NAV = [
  { to: '/iatlas/practice/dashboard',  label: 'Dashboard',  key: 'dashboard' },
  { to: '/iatlas/practice/clients',    label: 'Clients',    key: 'clients' },
  { to: '/iatlas/practice/schedule',   label: 'Schedule',   key: 'schedule' },
  { to: '/iatlas/practice/billing',    label: 'Billing',    key: 'billing' },
  { to: '/iatlas/practice/team',       label: 'Team',       key: 'team' },
  { to: '/iatlas/practice/analytics',  label: 'Analytics',  key: 'analytics' },
];

const MOCK_CLIENTS = [
  {
    id: 1, family: 'Johnson Family', contact: 'Angela Johnson', email: 'ajohnson@email.com',
    participants: ['Amir (age 9)', 'Zoe (age 6)'], practitioners: ['Dr. Chen', 'M. Williams'],
    status: 'active', intake: '2024-02-10', insurance: 'Blue Cross', sessions: 24,
    dimensions: { agentic: 72, somatic: 58, emotional: 65, cognitive: 81, relational: 70, spiritual: 55 },
    activityCounts: { agentic: 5, somatic: 3, emotional: 7, cognitive: 4, relational: 6, spiritual: 2 },
  },
  {
    id: 2, family: 'Torres Family', contact: 'Maria Torres', email: 'mtorres@email.com',
    participants: ['Lily (age 7)'], practitioners: ['P. Patel'],
    status: 'active', intake: '2024-03-15', insurance: 'Aetna', sessions: 18,
    dimensions: { agentic: 60, somatic: 74, emotional: 55, cognitive: 68, relational: 62, spiritual: 70 },
    activityCounts: { agentic: 4, somatic: 6, emotional: 3, cognitive: 5, relational: 8, spiritual: 4 },
  },
  {
    id: 3, family: 'Park Family', contact: 'David Park', email: 'dpark@email.com',
    participants: ['Owen (age 11)'], practitioners: ['P. Patel', 'Dr. Chen'],
    status: 'active', intake: '2024-01-08', insurance: 'United', sessions: 31,
    dimensions: { agentic: 85, somatic: 90, emotional: 78, cognitive: 88, relational: 75, spiritual: 80 },
    activityCounts: { agentic: 9, somatic: 11, emotional: 8, cognitive: 10, relational: 7, spiritual: 6 },
  },
  {
    id: 4, family: 'Osei Family', contact: 'Grace Osei', email: 'gosei@email.com',
    participants: ['Maya (age 13)'], practitioners: ['J. Rodriguez'],
    status: 'active', intake: '2024-04-01', insurance: 'Cigna', sessions: 12,
    dimensions: { agentic: 45, somatic: 50, emotional: 40, cognitive: 55, relational: 48, spiritual: 42 },
    activityCounts: { agentic: 2, somatic: 3, emotional: 2, cognitive: 4, relational: 3, spiritual: 1 },
  },
  {
    id: 5, family: 'Nguyen Family', contact: 'Thanh Nguyen', email: 'tnguyen@email.com',
    participants: ['Leo (age 8)'], practitioners: ['Dr. Chen'],
    status: 'active', intake: '2024-05-20', insurance: 'Medicaid', sessions: 9,
    dimensions: { agentic: 55, somatic: 62, emotional: 58, cognitive: 60, relational: 65, spiritual: 50 },
    activityCounts: { agentic: 3, somatic: 4, emotional: 3, cognitive: 3, relational: 5, spiritual: 2 },
  },
  {
    id: 6, family: 'Smith Family', contact: 'Rachel Smith', email: 'rsmith@email.com',
    participants: ['Noah (age 5)'], practitioners: ['M. Williams'],
    status: 'on_hold', intake: '2023-11-12', insurance: 'Blue Cross', sessions: 40,
    dimensions: { agentic: 78, somatic: 82, emotional: 75, cognitive: 79, relational: 83, spiritual: 76 },
    activityCounts: { agentic: 12, somatic: 14, emotional: 10, cognitive: 11, relational: 13, spiritual: 8 },
  },
  {
    id: 7, family: 'Martinez Family', contact: 'Rosa Martinez', email: 'rmartinez@email.com',
    participants: ['Rosa Martinez (age 34)'], practitioners: ['Dr. Chen'],
    status: 'active', intake: '2024-01-15', insurance: 'Blue Cross', sessions: 16,
    dimensions: { agentic: 68, somatic: 75, emotional: 70, cognitive: 80, relational: 72, spiritual: 65 },
    activityCounts: null,
    lastAssessmentDate: '2024-02-09',
  },
  {
    id: 8, family: 'Williams Family', contact: 'James Williams', email: 'jwilliams@email.com',
    participants: ['James Williams (age 29)', 'Sara Williams (age 27)'], practitioners: ['M. Williams', 'J. Rodriguez'],
    status: 'active', intake: '2024-03-01', insurance: 'Aetna', sessions: 20,
    dimensions: { agentic: 55, somatic: 60, emotional: 52, cognitive: 65, relational: 48, spiritual: 58 },
    activityCounts: null,
    lastAssessmentDate: '2024-03-22',
  },
];

const DIM_SHORT = {
  agentic: { label: 'Ag', color: '#4f46e5' },
  somatic:   { label: 'So', color: '#059669' },
  emotional: { label: 'Em', color: '#db2777' },
  cognitive: { label: 'Co', color: '#d97706' },
  relational:{ label: 'Re', color: '#0891b2' },
  spiritual: { label: 'Sp', color: '#7c3aed' },
};

/**
 * Returns true if any participant in the list is 18 or older.
 * When a participant entry does not include an age tag (e.g. "(age N)"), they
 * are assumed to be an adult — this is the safe default because adult clients
 * should see assessment score bars, and a missing age should not silently hide
 * clinically relevant data. Practitioners should add explicit ages to avoid
 * ambiguity.
 */
function hasAdultParticipants(participants) {
  return participants.some(p => {
    const match = p.match(/\(age\s+(\d+)\)/);
    if (!match) return true; // no age listed → assume adult (see JSDoc above)
    return parseInt(match[1], 10) >= 18;
  });
}

function DimBar({ value, color }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{
        height: 32, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden',
        display: 'flex', alignItems: 'flex-end',
      }}>
        <div style={{
          width: '100%', height: `${value}%`,
          background: color, borderRadius: 4, opacity: .8,
          transition: 'height .3s ease',
        }} />
      </div>
      <span style={{ fontSize: '.6rem', color: '#9ca3af', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function ActivityBadge({ label, count, color }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: '#f8fafc', borderRadius: 8, padding: '.35rem .45rem', minWidth: 40,
      border: `1.5px solid ${color}33`,
    }}>
      <span style={{ fontSize: '.85rem', fontWeight: 800, color, lineHeight: 1 }}>{count}</span>
      <span style={{ fontSize: '.55rem', color: '#9ca3af', fontWeight: 600, marginTop: 2 }}>{label}</span>
    </div>
  );
}

function InfoTooltip({ children }) {
  const [show, setShow] = React.useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-block', verticalAlign: 'middle' }}>
      <button
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#9ca3af', fontSize: '.8rem', padding: '0 .2rem', lineHeight: 1,
        }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        aria-label="More information"
        type="button"
      >ⓘ</button>
      {show && (
        <div style={{
          position: 'absolute', bottom: '130%', left: '50%', transform: 'translateX(-50%)',
          background: '#1e293b', color: '#e2e8f0',
          borderRadius: 8, padding: '.6rem .75rem',
          fontSize: '.72rem', lineHeight: 1.5, width: 230,
          zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,.25)',
          pointerEvents: 'none',
        }}>
          {children}
        </div>
      )}
    </span>
  );
}

export default function PracticeClientsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
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

  const filtered = MOCK_CLIENTS.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.family.toLowerCase().includes(q) || c.contact.toLowerCase().includes(q);
    const matchFilter = filter === 'all' || c.status === filter;
    return matchSearch && matchFilter;
  });

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
          .pm-sidebar {
            width: 220px; flex-shrink: 0;
            background: #1e293b; color: #e2e8f0;
            padding: 1.5rem 0; display: flex; flex-direction: column;
          }
          .pm-sidebar-brand {
            padding: .75rem 1.25rem 1.25rem;
            font-size: 1rem; font-weight: 800; color: #f1f5f9;
            border-bottom: 1px solid rgba(255,255,255,.08); margin-bottom: .5rem;
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
          .pm-nav-link.active { background: rgba(99,102,241,.15); color: #a5b4fc; border-left-color: #6366f1; }
          .pm-sidebar-footer {
            margin-top: auto; padding: 1rem 1.25rem;
            border-top: 1px solid rgba(255,255,255,.08);
          }
          .pm-sidebar-footer a { font-size: .8rem; color: #64748b; text-decoration: none; }
          .pm-sidebar-footer a:hover { color: #94a3b8; }
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
          .pm-toolbar {
            display: flex; gap: .75rem; align-items: center; margin-bottom: 1.25rem;
            flex-wrap: wrap;
          }
          .pm-search {
            flex: 1; min-width: 200px; max-width: 340px;
            padding: .6rem 1rem; font-size: .88rem;
            border: 1.5px solid #e5e7eb; border-radius: 8px;
            outline: none; background: #fff;
          }
          .pm-search:focus { border-color: #6366f1; }
          .pm-filter-btn {
            padding: .55rem 1rem; font-size: .82rem; font-weight: 600;
            border: 1.5px solid #e5e7eb; border-radius: 8px;
            background: #fff; cursor: pointer; color: #374151;
            transition: all .15s;
          }
          .pm-filter-btn.active { background: #6366f1; color: #fff; border-color: #6366f1; }
          .pm-clients-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 1rem;
          }
          .pm-client-card {
            background: #fff; border: 1px solid #e5e7eb;
            border-radius: 14px; padding: 1.25rem;
            cursor: pointer; transition: box-shadow .15s, border-color .15s;
          }
          .pm-client-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); border-color: #c7d2fe; }
          .pm-client-card.selected { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,.2); }
          .pm-client-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: .75rem; }
          .pm-client-family { font-size: 1rem; font-weight: 700; color: #1e293b; }
          .pm-client-contact { font-size: .8rem; color: #64748b; margin-top: .1rem; }
          .pm-status-pill {
            padding: .2rem .65rem; border-radius: 999px;
            font-size: .72rem; font-weight: 700;
          }
          .pm-client-meta { font-size: .78rem; color: #9ca3af; margin-bottom: .8rem; }
          .pm-client-meta span { margin-right: .75rem; }
          .pm-dim-bars { display: flex; gap: .3rem; align-items: flex-end; height: 42px; }
          .pm-client-practitioners {
            display: flex; flex-wrap: wrap; gap: .35rem; margin-top: .8rem;
          }
          .pm-prac-tag {
            background: #eef2ff; color: #4f46e5;
            border-radius: 6px; padding: .15rem .5rem;
            font-size: .72rem; font-weight: 600;
          }
          @media (max-width: 900px) { .pm-sidebar { display: none; } }
          @media (max-width: 640px) { .pm-clients-grid { grid-template-columns: 1fr; } }
        `}</style>

        <div className="pm-layout">
          {/* Sidebar */}
          <nav className="pm-sidebar" aria-label="Practice navigation">
            <div className="pm-sidebar-brand">Practice Hub<span>IATLAS Management</span></div>
            {PRACTICE_NAV.map(item => (
              <Link
                key={item.key}
                to={item.to}
                className={`pm-nav-link${item.key === 'clients' ? ' active' : ''}`}
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
                <h1 className="pm-page-title">Clients & Families</h1>
                <p className="pm-page-sub">{MOCK_CLIENTS.length} total clients · {MOCK_CLIENTS.filter(c => c.status === 'active').length} active</p>
              </div>
              <button className="pm-btn">+ Add Client</button>
            </div>

            {/* Toolbar */}
            <div className="pm-toolbar">
              <input
                className="pm-search"
                type="search"
                placeholder="Search clients…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search clients"
              />
              {['all', 'active', 'on_hold', 'discharged'].map(f => (
                <button
                  key={f}
                  className={`pm-filter-btn${filter === f ? ' active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f === 'on_hold' ? 'On Hold' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Client grid */}
            <div className="pm-clients-grid" role="list">
              {filtered.map(client => {
                const statusStyle = client.status === 'active'
                  ? { bg: '#d1fae5', color: '#059669' }
                  : client.status === 'on_hold'
                  ? { bg: '#fef3c7', color: '#d97706' }
                  : { bg: '#f1f5f9', color: '#64748b' };
                return (
                  <div
                    key={client.id}
                    className={`pm-client-card${selected === client.id ? ' selected' : ''}`}
                    role="listitem"
                    onClick={() => setSelected(selected === client.id ? null : client.id)}
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelected(selected === client.id ? null : client.id); }}
                    aria-expanded={selected === client.id}
                  >
                    <div className="pm-client-top">
                      <div>
                        <p className="pm-client-family">{client.family}</p>
                        <p className="pm-client-contact">{client.contact} · {client.email}</p>
                      </div>
                      <span
                        className="pm-status-pill"
                        style={{ background: statusStyle.bg, color: statusStyle.color }}
                      >
                        {client.status === 'on_hold' ? 'On Hold' : client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                      </span>
                    </div>

                    <div className="pm-client-meta">
                      <span><img src="/icons/planning.svg" alt="" aria-hidden="true" className="icon icon-sm" /> Intake: {new Date(client.intake).toLocaleDateString()}</span>
                      <span><img src="/icons/planning.svg" alt="" aria-hidden="true" className="icon icon-sm" /> {client.insurance}</span>
                      <span><img src="/icons/journal.svg" alt="" aria-hidden="true" className="icon icon-sm" /> {client.sessions} sessions</span>
                    </div>

                    {/* Participants */}
                    <div style={{ marginBottom: '.75rem' }}>
                      <span style={{ fontSize: '.75rem', fontWeight: 600, color: '#6b7280', marginRight: '.35rem' }}>Participants:</span>
                      {client.participants.map((p, i) => (
                        <span key={i} style={{ fontSize: '.78rem', color: '#374151', marginRight: '.4rem' }}>
                          {p}{i < client.participants.length - 1 ? ',' : ''}
                        </span>
                      ))}
                    </div>

                    {/* Dimension scores / activity completion */}
                    <div style={{ marginBottom: '.6rem' }}>
                      {hasAdultParticipants(client.participants) ? (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.25rem', marginBottom: '.4rem' }}>
                            <span style={{ fontSize: '.72rem', fontWeight: 600, color: '#6b7280' }}>
                              📊 Resilience Assessment Scores
                            </span>
                            <InfoTooltip>
                              <span>Assessment scores (0–100) from the 72-question Resilience Atlas. Higher scores = stronger dimensional capacity. Updates when client retakes the assessment (typically every 30–90 days).</span>
                              <br /><br />
                              <span>Note: Assessment scores are for adults (18+) only.</span>
                            </InfoTooltip>
                          </div>
                          {client.lastAssessmentDate && (
                            <span style={{ fontSize: '.65rem', color: '#9ca3af', display: 'block', marginBottom: '.3rem' }}>
                              Most recent assessment: {new Date(client.lastAssessmentDate).toLocaleDateString()}
                            </span>
                          )}
                          <div className="pm-dim-bars" aria-label="Resilience assessment scores">
                            {Object.entries(client.dimensions).map(([key, val]) => (
                              <DimBar key={key} value={val} color={DIM_SHORT[key].color} />
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.25rem', marginBottom: '.4rem' }}>
                            <span style={{ fontSize: '.72rem', fontWeight: 600, color: '#6b7280' }}>
                              ✨ Activity Completion Progress
                            </span>
                            <InfoTooltip>
                              <span>Total activities completed across each resilience dimension. Children are tracked via activity completion and behavioral observations — not assessment scores.</span>
                              <br /><br />
                              <span>Assessment scores (0–100) are for adults (18+) only.</span>
                            </InfoTooltip>
                          </div>
                          <span style={{ fontSize: '.65rem', color: '#9ca3af', display: 'block', marginBottom: '.35rem' }}>
                            Activities completed since curriculum start
                          </span>
                          <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }} aria-label="Activity completion progress">
                            {Object.entries(client.activityCounts || {}).map(([key, count]) => (
                              <ActivityBadge key={key} label={DIM_SHORT[key].label} count={count} color={DIM_SHORT[key].color} />
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Assigned practitioners */}
                    <div className="pm-client-practitioners">
                      {client.practitioners.map((p, i) => (
                        <span key={i} className="pm-prac-tag">{p}</span>
                      ))}
                    </div>

                    {/* Expanded detail */}
                    {selected === client.id && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                          <button className="pm-btn" style={{ fontSize: '.78rem', padding: '.4rem .85rem' }}>
                            View Full Profile
                          </button>
                          <Link
                            to="/iatlas/practice/schedule"
                            className="pm-btn"
                            style={{ background: '#059669', fontSize: '.78rem', padding: '.4rem .85rem' }}
                          >
                            Schedule Session
                          </Link>
                          <Link
                            to="/iatlas/practice/billing"
                            className="pm-btn"
                            style={{ background: '#d97706', fontSize: '.78rem', padding: '.4rem .85rem' }}
                          >
                            View Billing
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', fontSize: '.95rem' }}>
                No clients match your search.
              </div>
            )}

            {/* Coming soon notice */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              borderRadius: 16, padding: '1.25rem 1.5rem',
              color: '#94a3b8', fontSize: '.85rem',
              display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
              marginTop: '2rem',
            }}>
              <img src="/icons/warning.svg" aria-hidden="true" className="icon icon-sm" alt="" />
              <p style={{ margin: 0 }}>
                <span style={{ color: '#f1f5f9', fontWeight: 700 }}>Full client profiles — Coming 2026.</span>{' '}
                Live intake forms, caregiver portal access, SOAP notes, and full IATLAS curriculum
                integration are in development.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
