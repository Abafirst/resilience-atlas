/**
 * PracticeBillingPage.jsx
 * Billing and invoicing management page.
 * Route: /iatlas/practice/billing
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';

const PRACTICE_NAV = [
  { to: '/iatlas/practice/dashboard',  label: 'Dashboard',  key: 'dashboard',  icon: '/icons/planning.svg' },
  { to: '/iatlas/practice/clients',    label: 'Clients',    key: 'clients',    icon: '/icons/organization.svg' },
  { to: '/iatlas/practice/schedule',   label: 'Schedule',   key: 'schedule',   icon: '/icons/time.svg' },
  { to: '/iatlas/practice/billing',    label: 'Billing',    key: 'billing',    icon: '/icons/currency.svg' },
  { to: '/iatlas/practice/team',       label: 'Team',       key: 'team',       icon: '/icons/team.svg' },
  { to: '/iatlas/practice/analytics',  label: 'Analytics',  key: 'analytics',  icon: '/icons/growth.svg' },
];

const MOCK_BILLING = [
  { id: 1, invoice: 'INV-2026-041', client: 'Johnson Family', date: '2026-04-15', code: '97153', units: 4, rate: 45, total: 180, insAmt: 144, clientAmt: 36, status: 'paid', paidDate: '2026-04-18' },
  { id: 2, invoice: 'INV-2026-042', client: 'Torres Family',  date: '2026-04-16', code: '97530', units: 2, rate: 55, total: 110, insAmt: 88,  clientAmt: 22, status: 'paid', paidDate: '2026-04-20' },
  { id: 3, invoice: 'INV-2026-043', client: 'Park Family',    date: '2026-04-17', code: '97110', units: 3, rate: 60, total: 180, insAmt: 144, clientAmt: 36, status: 'pending', paidDate: null },
  { id: 4, invoice: 'INV-2026-044', client: 'Osei Family',    date: '2026-04-18', code: '97153', units: 4, rate: 45, total: 180, insAmt: 144, clientAmt: 36, status: 'pending', paidDate: null },
  { id: 5, invoice: 'INV-2026-045', client: 'Nguyen Family',  date: '2026-04-19', code: '97530', units: 2, rate: 55, total: 110, insAmt: 88,  clientAmt: 22, status: 'overdue', paidDate: null },
  { id: 6, invoice: 'INV-2026-038', client: 'Johnson Family', date: '2026-04-01', code: '97153', units: 8, rate: 45, total: 360, insAmt: 288, clientAmt: 72, status: 'overdue', paidDate: null },
  { id: 7, invoice: 'INV-2026-035', client: 'Park Family',    date: '2026-03-22', code: '97110', units: 6, rate: 60, total: 360, insAmt: 288, clientAmt: 72, status: 'paid', paidDate: '2026-03-28' },
];

const STATUS_STYLES = {
  paid:    { bg: '#d1fae5', color: '#059669', label: 'Paid' },
  pending: { bg: '#fef3c7', color: '#d97706', label: 'Pending' },
  overdue: { bg: '#fee2e2', color: '#dc2626', label: 'Overdue' },
};

const CPT_CODES = {
  '97153': 'Adaptive Behavior Treatment (ABA)',
  '97530': 'Therapeutic Activities (OT)',
  '97110': 'Therapeutic Exercise (PT/OT)',
  '92507': 'Speech-Language Treatment (SLP)',
  '90837': 'Psychotherapy (60 min)',
};

export default function PracticeBillingPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [records, setRecords] = useState(MOCK_BILLING);

  const filtered = statusFilter === 'all'
    ? records
    : records.filter(r => r.status === statusFilter);

  const totals = {
    paid:    records.filter(r => r.status === 'paid').reduce((s, r) => s + r.total, 0),
    pending: records.filter(r => r.status === 'pending').reduce((s, r) => s + r.total, 0),
    overdue: records.filter(r => r.status === 'overdue').reduce((s, r) => s + r.total, 0),
  };

  function markPaid(id) {
    setRecords(prev => prev.map(r =>
      r.id === id ? { ...r, status: 'paid', paidDate: new Date().toISOString().slice(0, 10) } : r
    ));
  }

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
          .nav-icon { opacity: .85; flex-shrink: 0; }
          .pm-nav-link.active .nav-icon { opacity: 1; }
          button img[aria-hidden="true"] { vertical-align: text-bottom; margin-right: 6px; flex-shrink: 0; }
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
          .pm-btn-sm {
            padding: .3rem .7rem; font-size: .75rem; border-radius: 6px;
          }

          /* Summary cards */
          .bill-summary { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
          .bill-summary-card {
            background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 1.25rem;
          }
          .bill-summary-label { font-size: .75rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; margin-bottom: .3rem; }
          .bill-summary-value { font-size: 1.75rem; font-weight: 800; color: #1e293b; }

          /* Toolbar */
          .bill-toolbar { display: flex; gap: .75rem; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; }
          .bill-filter-btn {
            padding: .5rem 1rem; font-size: .82rem; font-weight: 600;
            border: 1.5px solid #e5e7eb; border-radius: 8px;
            background: #fff; cursor: pointer; color: #374151; transition: all .15s;
          }
          .bill-filter-btn.active { background: #6366f1; color: #fff; border-color: #6366f1; }

          /* Table */
          .bill-table-wrap { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; margin-bottom: 1.5rem; }
          .bill-table { width: 100%; border-collapse: collapse; font-size: .85rem; }
          .bill-table th {
            background: #f8fafc; padding: .8rem 1rem;
            text-align: left; font-size: .75rem; font-weight: 700;
            color: #6b7280; text-transform: uppercase; letter-spacing: .05em;
            border-bottom: 1px solid #e5e7eb;
          }
          .bill-table td { padding: .85rem 1rem; border-bottom: 1px solid #f1f5f9; color: #374151; vertical-align: middle; }
          .bill-table tr:last-child td { border-bottom: none; }
          .bill-table tr:hover td { background: #f8fafc; }
          .status-badge {
            padding: .2rem .65rem; border-radius: 999px;
            font-size: .72rem; font-weight: 700; display: inline-block;
          }
          .cpt-tooltip { cursor: help; border-bottom: 1px dashed #94a3b8; }

          /* Modal */
          .modal-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,.5);
            display: flex; align-items: center; justify-content: center; z-index: 1000;
          }
          .modal-box { background: #fff; border-radius: 16px; padding: 2rem; width: 100%; max-width: 480px; margin: 0 1rem; }
          .modal-title { font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 0 0 1.25rem; }
          .modal-field { margin-bottom: 1rem; }
          .modal-label { display: block; font-size: .82rem; font-weight: 600; color: #374151; margin-bottom: .35rem; }
          .modal-input, .modal-select {
            width: 100%; padding: .6rem .9rem; font-size: .9rem;
            border: 1.5px solid #e5e7eb; border-radius: 8px; outline: none; box-sizing: border-box;
          }
          .modal-input:focus, .modal-select:focus { border-color: #6366f1; }
          .modal-actions { display: flex; gap: .75rem; justify-content: flex-end; margin-top: 1.25rem; }
          .modal-cancel { background: #f1f5f9; border: none; border-radius: 8px; padding: .6rem 1.2rem; font-size: .9rem; font-weight: 600; cursor: pointer; }

          @media (max-width: 900px) { .pm-sidebar { display: none; } }
          @media (max-width: 768px) {
            .bill-table th:nth-child(n+5), .bill-table td:nth-child(n+5) { display: none; }
          }
        `}</style>

        <div className="pm-layout">
          {/* Sidebar */}
          <nav className="pm-sidebar" aria-label="Practice navigation">
            <div className="pm-sidebar-brand">Practice Hub<span>IATLAS Management</span></div>
            {PRACTICE_NAV.map(item => (
              <Link
                key={item.key}
                to={item.to}
                className={`pm-nav-link${item.key === 'billing' ? ' active' : ''}`}
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

          {/* Main */}
          <div className="pm-content">
            <div className="pm-page-header">
              <div>
                <h1 className="pm-page-title">Billing & Invoices</h1>
                <p className="pm-page-sub">{records.length} billing records · April 2026</p>
              </div>
              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                <button className="pm-btn" style={{ background: '#059669' }} onClick={() => {}}><img src="/icons/journal.svg" alt="" width={14} height={14} aria-hidden="true" /> <span>Export CSV</span>
                </button>
                <button className="pm-btn" onClick={() => setShowCreateModal(true)}>
                  + New Record
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="bill-summary">
              <div className="bill-summary-card">
                <p className="bill-summary-label">Paid This Month</p>
                <p className="bill-summary-value" style={{ color: '#059669' }}>
                  ${totals.paid.toLocaleString()}
                </p>
              </div>
              <div className="bill-summary-card">
                <p className="bill-summary-label">Pending</p>
                <p className="bill-summary-value" style={{ color: '#d97706' }}>
                  ${totals.pending.toLocaleString()}
                </p>
              </div>
              <div className="bill-summary-card">
                <p className="bill-summary-label">Overdue</p>
                <p className="bill-summary-value" style={{ color: '#dc2626' }}>
                  ${totals.overdue.toLocaleString()}
                </p>
              </div>
              <div className="bill-summary-card">
                <p className="bill-summary-label">Total Billed</p>
                <p className="bill-summary-value">
                  ${(totals.paid + totals.pending + totals.overdue).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Toolbar */}
            <div className="bill-toolbar">
              {['all', 'paid', 'pending', 'overdue'].map(f => (
                <button
                  key={f}
                  className={`bill-filter-btn${statusFilter === f ? ' active' : ''}`}
                  onClick={() => setStatusFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f !== 'all' && (
                    <span style={{ marginLeft: '.35rem', opacity: .7 }}>
                      ({records.filter(r => r.status === f).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="bill-table-wrap">
              <table className="bill-table" aria-label="Billing records">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>CPT Code</th>
                    <th>Units</th>
                    <th>Total</th>
                    <th>Insurance</th>
                    <th>Client Resp.</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => {
                    const st = STATUS_STYLES[r.status];
                    return (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600, color: '#4f46e5', fontSize: '.82rem' }}>{r.invoice}</td>
                        <td style={{ fontWeight: 500 }}>{r.client}</td>
                        <td style={{ color: '#9ca3af' }}>{r.date}</td>
                        <td>
                          <span className="cpt-tooltip" title={CPT_CODES[r.code] || r.code}>
                            {r.code}
                          </span>
                        </td>
                        <td>{r.units}</td>
                        <td style={{ fontWeight: 700 }}>${r.total}</td>
                        <td style={{ color: '#059669' }}>${r.insAmt}</td>
                        <td>${r.clientAmt}</td>
                        <td>
                          <span className="status-badge" style={{ background: st.bg, color: st.color }}>
                            {st.label}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '.4rem' }}>
                            {r.status !== 'paid' && (
                              <button
                                className="pm-btn pm-btn-sm"
                                style={{ background: '#059669' }}
                                onClick={() => markPaid(r.id)}
                              >
                                Mark Paid
                              </button>
                            )}
                            <button className="pm-btn pm-btn-sm" style={{ background: '#64748b' }}>
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Coming soon */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              borderRadius: 16, padding: '1.25rem 1.5rem',
              color: '#94a3b8', fontSize: '.85rem',
              display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
            }}>
              <img src="/icons/warning.svg" aria-hidden="true" className="icon icon-sm" alt="" />
              <p style={{ margin: 0 }}>
                <span style={{ color: '#f1f5f9', fontWeight: 700 }}>Full billing integration — Coming 2026.</span>{' '}
                Automatic invoice generation from completed sessions, insurance claim submission,
                payment tracking, and revenue reporting are in development.
              </p>
            </div>
          </div>
        </div>

        {/* New Record Modal */}
        {showCreateModal && (
          <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="billing-modal-title"
            onClick={e => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
          >
            <div className="modal-box">
              <h2 className="modal-title" id="billing-modal-title">New Billing Record</h2>
              <form onSubmit={e => { e.preventDefault(); setShowCreateModal(false); }}>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="bill-client">Client / Family</label>
                  <input id="bill-client" className="modal-input" type="text" placeholder="Search client…" required />
                </div>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="bill-code">CPT / Service Code</label>
                  <select id="bill-code" className="modal-select">
                    {Object.entries(CPT_CODES).map(([code, desc]) => (
                      <option key={code} value={code}>{code} — {desc}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                  <div className="modal-field">
                    <label className="modal-label" htmlFor="bill-units">Units</label>
                    <input id="bill-units" className="modal-input" type="number" min="1" defaultValue="4" required />
                  </div>
                  <div className="modal-field">
                    <label className="modal-label" htmlFor="bill-rate">Rate/Unit ($)</label>
                    <input id="bill-rate" className="modal-input" type="number" min="1" defaultValue="45" required />
                  </div>
                </div>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="bill-date">Service Date</label>
                  <input id="bill-date" className="modal-input" type="date" required />
                </div>
                <div className="modal-actions">
                  <button type="button" className="modal-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="pm-btn">Create Record</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
