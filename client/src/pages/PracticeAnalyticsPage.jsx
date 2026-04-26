/**
 * PracticeAnalyticsPage.jsx
 * Practice analytics — client outcomes, practitioner performance, revenue trends,
 * and practitioner resilience dashboard.
 * Route: /iatlas/practice/analytics
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

const DIMENSIONS = [
  { key: 'agentic',    label: 'Agentic',    color: '#4f46e5' },
  { key: 'somatic',    label: 'Somatic',    color: '#059669' },
  { key: 'emotional',  label: 'Emotional',  color: '#db2777' },
  { key: 'cognitive',  label: 'Cognitive',  color: '#d97706' },
  { key: 'relational', label: 'Relational', color: '#0891b2' },
  { key: 'spiritual',  label: 'Spiritual',  color: '#7c3aed' },
];

const MOCK_PRACTICE_DIMS = {
  agentic: 66, somatic: 72, emotional: 62, cognitive: 75, relational: 70, spiritual: 58,
};

const MOCK_PRACTITIONER_RESILIENCE = [
  { name: 'Dr. Sarah Chen',   dims: { agentic: 82, somatic: 78, emotional: 85, cognitive: 90, relational: 88, spiritual: 75 }, burnout: 'low' },
  { name: 'Marcus Williams',  dims: { agentic: 70, somatic: 65, emotional: 68, cognitive: 72, relational: 75, spiritual: 60 }, burnout: 'moderate' },
  { name: 'Priya Patel',      dims: { agentic: 85, somatic: 90, emotional: 80, cognitive: 82, relational: 88, spiritual: 79 }, burnout: 'low' },
  { name: 'James Rodriguez',  dims: { agentic: 55, somatic: 60, emotional: 52, cognitive: 58, relational: 65, spiritual: 48 }, burnout: 'high' },
];

const MOCK_PRACTITIONER_PERF = [
  { name: 'Dr. Sarah Chen',   sessions: 38, clients: 9,  docRate: '94%', retention: '89%', specialty: 'SLP' },
  { name: 'Marcus Williams',  sessions: 44, clients: 11, docRate: '81%', retention: '92%', specialty: 'ABA' },
  { name: 'Priya Patel',      sessions: 28, clients: 7,  docRate: '97%', retention: '95%', specialty: 'OT' },
  { name: 'James Rodriguez',  sessions: 20, clients: 5,  docRate: '76%', retention: '80%', specialty: 'Social Skills' },
];

const MONTHLY_REVENUE = [
  { month: 'Nov', revenue: 14200 },
  { month: 'Dec', revenue: 12800 },
  { month: 'Jan', revenue: 15400 },
  { month: 'Feb', revenue: 16200 },
  { month: 'Mar', revenue: 18100 },
  { month: 'Apr', revenue: 19400 },
];

const MAX_REVENUE = Math.max(...MONTHLY_REVENUE.map(m => m.revenue));

function BarChart({ data, colorFn }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '.5rem', height: 100, padding: '0 .25rem' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.3rem' }}>
          <div style={{
            width: '100%', borderRadius: '4px 4px 0 0',
            height: `${(d.revenue / MAX_REVENUE) * 85}px`,
            background: colorFn ? colorFn(i) : '#6366f1',
            transition: 'height .3s ease',
          }} />
          <span style={{ fontSize: '.65rem', color: '#9ca3af', fontWeight: 600 }}>{d.month}</span>
        </div>
      ))}
    </div>
  );
}

function DimRadar({ dims }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
      {DIMENSIONS.map(d => (
        <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <span style={{ fontSize: '.75rem', color: '#6b7280', width: 72, flexShrink: 0 }}>{d.label}</span>
          <div style={{ flex: 1, height: 10, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 999,
              width: `${dims[d.key] || 0}%`,
              background: d.color,
              transition: 'width .4s ease',
            }} />
          </div>
          <span style={{ fontSize: '.75rem', fontWeight: 700, color: '#374151', width: 28, textAlign: 'right' }}>
            {dims[d.key]}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function PracticeAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('outcomes');

  const burnoutStyles = {
    low:      { bg: '#d1fae5', color: '#059669', label: 'Low Risk' },
    moderate: { bg: '#fef3c7', color: '#d97706', label: 'Moderate Risk' },
    high:     { bg: '#fee2e2', color: '#dc2626', label: 'At Risk' },
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
          .an-tabs { display: flex; gap: 0; border-bottom: 2px solid #e5e7eb; margin-bottom: 1.5rem; overflow-x: auto; }
          .an-tab {
            background: none; border: none; padding: .65rem 1.1rem;
            font-size: .85rem; font-weight: 600; color: #6b7280; cursor: pointer;
            border-bottom: 2px solid transparent; margin-bottom: -2px; white-space: nowrap;
            transition: color .15s, border-color .15s;
          }
          .an-tab.active { color: #6366f1; border-bottom-color: #6366f1; }

          /* Cards */
          .an-card {
            background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 1.35rem;
          }
          .an-card-title { font-size: .95rem; font-weight: 700; color: #1e293b; margin: 0 0 1rem; }
          .an-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; }
          .an-three-col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.25rem; }

          /* Metric cards */
          .an-metric-label { font-size: .72rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; margin-bottom: .25rem; }
          .an-metric-value { font-size: 1.75rem; font-weight: 800; color: #1e293b; }
          .an-metric-sub { font-size: .78rem; color: #9ca3af; margin-top: .15rem; }

          /* Table */
          .an-table { width: 100%; border-collapse: collapse; font-size: .85rem; }
          .an-table th { background: #f8fafc; padding: .7rem .9rem; text-align: left; font-size: .73rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .04em; border-bottom: 1px solid #e5e7eb; }
          .an-table td { padding: .8rem .9rem; border-bottom: 1px solid #f1f5f9; color: #374151; }
          .an-table tr:last-child td { border-bottom: none; }

          /* Practitioner resilience cards */
          .prac-res-card {
            background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 1.25rem;
          }
          .prac-res-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
          .prac-res-name { font-size: .95rem; font-weight: 700; color: #1e293b; }
          .burnout-badge { padding: .2rem .65rem; border-radius: 999px; font-size: .72rem; font-weight: 700; }

          @media (max-width: 900px) { .pm-sidebar { display: none; } }
          @media (max-width: 640px) { .an-two-col, .an-three-col { grid-template-columns: 1fr; } }
        `}</style>

        <div className="pm-layout">
          {/* Sidebar */}
          <nav className="pm-sidebar" aria-label="Practice navigation">
            <div className="pm-sidebar-brand">Practice Hub<span>IATLAS Management</span></div>
            {PRACTICE_NAV.map(item => (
              <Link
                key={item.key}
                to={item.to}
                className={`pm-nav-link${item.key === 'analytics' ? ' active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
            <div className="pm-sidebar-footer">
              <Link to="/practice-settings">⚙️ Practice Settings</Link><br />
              <Link to="/iatlas" style={{ marginTop: '.4rem', display: 'block' }}>← IATLAS Home</Link>
            </div>
          </nav>

          {/* Main */}
          <div className="pm-content">
            <div className="pm-page-header">
              <div>
                <h1 className="pm-page-title">Practice Analytics</h1>
                <p className="pm-page-sub">April 2026 · Practice-wide insights</p>
              </div>
              <button className="pm-btn" style={{ background: '#059669' }}>
                📥 Export Report
              </button>
            </div>

            {/* Tabs */}
            <div className="an-tabs" role="tablist">
              {[
                { key: 'outcomes',     label: '📈 Client Outcomes' },
                { key: 'practitioners',label: '👩‍⚕️ Practitioners' },
                { key: 'revenue',      label: '💰 Revenue' },
                { key: 'resilience',   label: '🌱 Practitioner Resilience' },
              ].map(t => (
                <button
                  key={t.key}
                  className={`an-tab${activeTab === t.key ? ' active' : ''}`}
                  role="tab"
                  aria-selected={activeTab === t.key}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Client Outcomes */}
            {activeTab === 'outcomes' && (
              <div role="tabpanel">
                <div className="an-three-col">
                  {[
                    { label: 'Active Clients',      value: '24',  sub: '+3 vs last month', color: '#4f46e5' },
                    { label: 'Avg Protocol Completion', value: '73%', sub: 'Across all clients', color: '#059669' },
                    { label: 'Avg Sessions to Progress', value: '8.4', sub: 'Dimensional gain', color: '#d97706' },
                  ].map(m => (
                    <div key={m.label} className="an-card">
                      <p className="an-metric-label">{m.label}</p>
                      <p className="an-metric-value" style={{ color: m.color }}>{m.value}</p>
                      <p className="an-metric-sub">{m.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="an-two-col">
                  <div className="an-card">
                    <h2 className="an-card-title">Average Dimensional Progress (All Clients)</h2>
                    <DimRadar dims={MOCK_PRACTICE_DIMS} />
                    <p style={{ fontSize: '.78rem', color: '#9ca3af', marginTop: '1rem' }}>
                      Average scores across all 24 active clients. Higher = stronger dimension.
                    </p>
                  </div>
                  <div className="an-card">
                    <h2 className="an-card-title">Client Status Distribution</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', marginTop: '.5rem' }}>
                      {[
                        { label: 'Active',      count: 24, pct: 80, color: '#059669', bg: '#d1fae5' },
                        { label: 'On Hold',     count: 3,  pct: 10, color: '#d97706', bg: '#fef3c7' },
                        { label: 'Discharged (This Year)', count: 3, pct: 10, color: '#64748b', bg: '#f1f5f9' },
                      ].map(s => (
                        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                          <span style={{ width: 120, fontSize: '.82rem', color: '#374151', fontWeight: 500 }}>{s.label}</span>
                          <div style={{ flex: 1, height: 16, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 999 }} />
                          </div>
                          <span style={{ width: 28, fontSize: '.8rem', fontWeight: 700, color: s.color, textAlign: 'right' }}>{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Practitioners */}
            {activeTab === 'practitioners' && (
              <div role="tabpanel">
                <div className="an-card" style={{ marginBottom: '1.25rem' }}>
                  <h2 className="an-card-title">Practitioner Performance — April 2026</h2>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="an-table" aria-label="Practitioner performance">
                      <thead>
                        <tr>
                          <th>Practitioner</th>
                          <th>Specialty</th>
                          <th>Sessions</th>
                          <th>Clients</th>
                          <th>Doc Rate</th>
                          <th>Retention</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MOCK_PRACTITIONER_PERF.map(p => (
                          <tr key={p.name}>
                            <td style={{ fontWeight: 600 }}>{p.name}</td>
                            <td>
                              <span style={{ background: '#eef2ff', color: '#4f46e5', borderRadius: 6, padding: '.15rem .5rem', fontSize: '.75rem', fontWeight: 600 }}>
                                {p.specialty}
                              </span>
                            </td>
                            <td>{p.sessions}</td>
                            <td>{p.clients}</td>
                            <td style={{ color: parseFloat(p.docRate) >= 90 ? '#059669' : '#d97706' }}>{p.docRate}</td>
                            <td style={{ color: parseFloat(p.retention) >= 90 ? '#059669' : '#d97706' }}>{p.retention}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Revenue */}
            {activeTab === 'revenue' && (
              <div role="tabpanel">
                <div className="an-three-col" style={{ marginBottom: '1.25rem' }}>
                  {[
                    { label: 'Revenue This Month', value: '$19,400', sub: '+7% vs March', color: '#059669' },
                    { label: 'Outstanding Balance', value: '$4,760', sub: '8 invoices', color: '#d97706' },
                    { label: 'Avg Revenue / Client', value: '$808', sub: 'This month', color: '#4f46e5' },
                  ].map(m => (
                    <div key={m.label} className="an-card">
                      <p className="an-metric-label">{m.label}</p>
                      <p className="an-metric-value" style={{ color: m.color }}>{m.value}</p>
                      <p className="an-metric-sub">{m.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="an-card">
                  <h2 className="an-card-title">Monthly Revenue — Last 6 Months</h2>
                  <div style={{ marginBottom: '.5rem' }}>
                    <BarChart
                      data={MONTHLY_REVENUE}
                      colorFn={i => i === MONTHLY_REVENUE.length - 1 ? '#6366f1' : '#c7d2fe'}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 .25rem', marginTop: '.5rem' }}>
                    {MONTHLY_REVENUE.map(m => (
                      <span key={m.month} style={{ flex: 1, textAlign: 'center', fontSize: '.72rem', color: '#9ca3af', fontWeight: 600 }}>
                        ${(m.revenue / 1000).toFixed(1)}k
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Practitioner Resilience */}
            {activeTab === 'resilience' && (
              <div role="tabpanel">
                <div style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  borderRadius: 16, padding: '1.25rem 1.5rem',
                  color: '#fff', marginBottom: '1.5rem',
                  display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
                }}>
                  <span style={{ fontSize: '1.5rem' }} aria-hidden="true">🌱</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>
                      Practice-Wide Resilience Philosophy
                    </p>
                    <p style={{ margin: '.2rem 0 0', fontSize: '.85rem', color: 'rgba(255,255,255,.8)' }}>
                      IATLAS is built on the principle that everyone grows — including the people
                      who deliver care. Practitioners track their own 6-dimensional resilience
                      alongside their clients, ensuring sustainable, high-quality service delivery.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', grid: 'auto / repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {MOCK_PRACTITIONER_RESILIENCE.map(p => {
                    const bs = burnoutStyles[p.burnout];
                    const avgScore = Math.round(Object.values(p.dims).reduce((s, v) => s + v, 0) / 6);
                    return (
                      <div key={p.name} className="prac-res-card">
                        <div className="prac-res-header">
                          <p className="prac-res-name">{p.name}</p>
                          <span className="burnout-badge" style={{ background: bs.bg, color: bs.color }}>
                            {bs.label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.85rem' }}>
                          <span style={{ fontSize: '.8rem', color: '#6b7280' }}>Overall Resilience</span>
                          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: avgScore >= 75 ? '#059669' : avgScore >= 60 ? '#d97706' : '#dc2626' }}>
                            {avgScore}
                          </span>
                        </div>
                        <DimRadar dims={p.dims} />
                      </div>
                    );
                  })}
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  borderRadius: 16, padding: '1.25rem 1.5rem',
                  color: '#94a3b8', fontSize: '.85rem',
                  display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
                  marginTop: '1.5rem',
                }}>
                  <span style={{ fontSize: '1.25rem' }} aria-hidden="true">🚧</span>
                  <p style={{ margin: 0 }}>
                    <span style={{ color: '#f1f5f9', fontWeight: 700 }}>Practitioner wellness dashboard — Coming 2026.</span>{' '}
                    Live dimensional tracking for practitioners, burnout early-warning alerts,
                    peer support matching, and professional development recommendations are in development.{' '}
                    <Link to="/iatlas/train-the-facilitator" style={{ color: '#a5b4fc', fontWeight: 600 }}>
                      Learn about TTF →
                    </Link>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
