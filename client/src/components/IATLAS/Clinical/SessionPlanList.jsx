/**
 * SessionPlanList.jsx
 * Table listing all session plans for the authenticated practitioner.
 *
 * Props:
 *   plans        {Array}    — array of session plan objects
 *   loading      {boolean}
 *   onView       {function} — called with plan object to open read-only view
 *   onEdit       {function} — called with plan object to open edit form
 *   onDelete     {function} — called with sessionPlanId to archive a plan
 *   onNew        {function} — called to open the create form
 */

import React, { useState, useMemo } from 'react';

const DIMENSION_LABELS = {
  'agentic-generative':    'Agentic-Generative',
  'somatic-regulative':    'Somatic-Regulative',
  'cognitive-interpretive':'Cognitive-Interpretive',
  'emotional-adaptive':    'Emotional-Adaptive',
  'relational-integrative':'Relational-Integrative',
  'spiritual-existential': 'Spiritual-Existential',
};

const TREND_BADGES = {
  'making-progress': { label: 'Progress', color: '#059669', bg: '#d1fae5' },
  flat:              { label: 'Flat',     color: '#d97706', bg: '#fef3c7' },
  regression:        { label: 'Regress',  color: '#dc2626', bg: '#fee2e2' },
  mastered:          { label: 'Mastered', color: '#7c3aed', bg: '#ede9fe' },
};

function formatDate(val) {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default function SessionPlanList({
  plans = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
  onNew,
}) {
  const [search, setSearch]           = useState('');
  const [filterDimension, setFilterDimension] = useState('');
  const [filterClient, setFilterClient]       = useState('');
  const [dateFrom, setDateFrom]               = useState('');
  const [dateTo, setDateTo]                   = useState('');
  const [sortField, setSortField]             = useState('sessionDate');
  const [sortDir, setSortDir]                 = useState('desc');
  const [confirmDelete, setConfirmDelete]     = useState(null);

  const filtered = useMemo(() => {
    let result = [...plans];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(p =>
        p.clientIdentifier?.toLowerCase().includes(q) ||
        p.sessionNotes?.toLowerCase().includes(q) ||
        p.clinicalNotes?.toLowerCase().includes(q)
      );
    }
    if (filterDimension) {
      result = result.filter(p => p.dimensionalFocus === filterDimension);
    }
    if (filterClient.trim()) {
      const q = filterClient.trim().toLowerCase();
      result = result.filter(p => p.clientIdentifier?.toLowerCase().includes(q));
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter(p => p.sessionDate && new Date(p.sessionDate) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      result = result.filter(p => p.sessionDate && new Date(p.sessionDate) <= to);
    }

    result.sort((a, b) => {
      let va = a[sortField] ?? '';
      let vb = b[sortField] ?? '';
      if (sortField === 'sessionDate') {
        va = va ? new Date(va).getTime() : 0;
        vb = vb ? new Date(vb).getTime() : 0;
      } else {
        va = String(va).toLowerCase();
        vb = String(vb).toLowerCase();
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [plans, search, filterDimension, filterClient, dateFrom, dateTo, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span style={{ opacity: 0.3 }}> ⇅</span>;
    return <span>{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>;
  };

  const handleDeleteConfirm = () => {
    if (confirmDelete) {
      onDelete(confirmDelete);
      setConfirmDelete(null);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── Filters ── */}
      <div className="spl-filters">
        <input
          className="spl-input"
          type="search"
          placeholder="Search plans…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search session plans"
        />
        <input
          className="spl-input"
          type="text"
          placeholder="Filter by client…"
          value={filterClient}
          onChange={e => setFilterClient(e.target.value)}
        />
        <select
          className="spl-input"
          value={filterDimension}
          onChange={e => setFilterDimension(e.target.value)}
          aria-label="Filter by dimension"
        >
          <option value="">All dimensions</option>
          {Object.entries(DIMENSION_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <input
          className="spl-input"
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          aria-label="From date"
          title="From date"
        />
        <input
          className="spl-input"
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          aria-label="To date"
          title="To date"
        />
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="spl-empty">
          <span className="spl-spinner" aria-label="Loading" />
          <p>Loading session plans…</p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && filtered.length === 0 && (
        <div className="spl-empty">
          <div className="spl-empty-icon"><img src="/icons/journal.svg" alt="" aria-hidden="true" style={{ width: '3rem', height: '3rem', objectFit: 'contain' }} /></div>
          {plans.length === 0 ? (
            <>
              <h3>No session plans yet</h3>
              <p>Create your first session plan to get started.</p>
              <button className="spl-btn spl-btn--primary" onClick={onNew}>
                + New Session Plan
              </button>
            </>
          ) : (
            <>
              <h3>No plans match your filters</h3>
              <p>Try adjusting your search or filters.</p>
            </>
          )}
        </div>
      )}

      {/* ── Table ── */}
      {!loading && filtered.length > 0 && (
        <div className="spl-table-wrap">
          <table className="spl-table" aria-label="Session plans">
            <thead>
              <tr>
                <th>
                  <button className="spl-sort-btn" onClick={() => toggleSort('clientIdentifier')}>
                    Client <SortIcon field="clientIdentifier" />
                  </button>
                </th>
                <th>
                  <button className="spl-sort-btn" onClick={() => toggleSort('sessionDate')}>
                    Date <SortIcon field="sessionDate" />
                  </button>
                </th>
                <th>
                  <button className="spl-sort-btn" onClick={() => toggleSort('sessionNumber')}>
                    # <SortIcon field="sessionNumber" />
                  </button>
                </th>
                <th>
                  <button className="spl-sort-btn" onClick={() => toggleSort('dimensionalFocus')}>
                    Dimension <SortIcon field="dimensionalFocus" />
                  </button>
                </th>
                <th>Goals</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(plan => (
                <tr key={plan.sessionPlanId} className="spl-row">
                  <td className="spl-td-client">
                    <span className="spl-client-badge">{plan.clientIdentifier}</span>
                  </td>
                  <td className="spl-td-date">{formatDate(plan.sessionDate)}</td>
                  <td className="spl-td-num">{plan.sessionNumber ?? '—'}</td>
                  <td>
                    {plan.dimensionalFocus
                      ? <span className="spl-dim-badge">{DIMENSION_LABELS[plan.dimensionalFocus] || plan.dimensionalFocus}</span>
                      : <span className="spl-na">—</span>}
                  </td>
                  <td className="spl-td-goals">
                    {(() => {
                      const goalCount = plan.sessionGoals?.filter(Boolean).length ?? 0;
                      return goalCount > 0
                        ? <span className="spl-goal-count">{goalCount} goal{goalCount !== 1 ? 's' : ''}</span>
                        : <span className="spl-na">—</span>;
                    })()}
                  </td>
                  <td className="spl-td-actions">
                    <button
                      className="spl-action-btn spl-action-btn--view"
                      onClick={() => onView(plan)}
                      title="View plan"
                    ><img src="/icons/info.svg" alt="" aria-hidden="true" style={{ width: '1rem', height: '1rem', objectFit: 'contain' }} /> View</button>
                    <button
                      className="spl-action-btn spl-action-btn--edit"
                      onClick={() => onEdit(plan)}
                      title="Edit plan"
                    ><img src="/icons/writing.svg" alt="" aria-hidden="true" style={{ width: '1rem', height: '1rem', objectFit: 'contain' }} /> Edit</button>
                    <button
                      className="spl-action-btn spl-action-btn--delete"
                      onClick={() => setConfirmDelete(plan.sessionPlanId)}
                      title="Archive plan"
                    >✕ Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="spl-count">{filtered.length} plan{filtered.length !== 1 ? 's' : ''} shown</p>
        </div>
      )}

      {/* ── Delete confirm modal ── */}
      {confirmDelete && (
        <div className="spl-overlay" role="dialog" aria-modal="true" aria-label="Confirm delete">
          <div className="spl-confirm-box">
            <h3>Archive session plan?</h3>
            <p>This plan will be archived and removed from your list. This action cannot be undone.</p>
            <div className="spl-confirm-actions">
              <button className="spl-btn spl-btn--secondary" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button className="spl-btn spl-btn--danger" onClick={handleDeleteConfirm}>
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const CSS = `
.spl-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 1.25rem;
}

.spl-input {
  padding: 0.5rem 0.75rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1e293b;
  background: #fff;
  flex: 1;
  min-width: 160px;
  box-sizing: border-box;
}
.spl-input:focus { outline: none; border-color: #059669; }

.spl-table-wrap { overflow-x: auto; border-radius: 12px; border: 1.5px solid #e2e8f0; }
.spl-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  color: #1e293b;
}
.spl-table th {
  background: #f8fafc;
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1.5px solid #e2e8f0;
  white-space: nowrap;
}
.spl-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.spl-row:hover td { background: #f8fafc; }
.spl-row:last-child td { border-bottom: none; }

.spl-sort-btn {
  background: none; border: none; font-size: 0.875rem; font-weight: 600;
  color: #374151; cursor: pointer; padding: 0; white-space: nowrap;
}
.spl-sort-btn:hover { color: #059669; }

.spl-client-badge {
  display: inline-block;
  background: #dbeafe;
  color: #1e40af;
  padding: 0.2rem 0.55rem;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: 600;
}
.spl-dim-badge {
  display: inline-block;
  background: #d1fae5;
  color: #065f46;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 500;
}
.spl-goal-count {
  font-size: 0.8rem;
  color: #7c3aed;
  font-weight: 600;
}
.spl-na { color: #94a3b8; }
.spl-td-date { white-space: nowrap; color: #64748b; }
.spl-td-num  { text-align: center; color: #64748b; }

.spl-td-actions {
  display: flex;
  gap: 0.35rem;
  flex-wrap: nowrap;
}
.spl-action-btn {
  background: none;
  border: 1.5px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.3rem 0.6rem;
  font-size: 0.78rem;
  cursor: pointer;
  color: #374151;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s;
}
.spl-action-btn:hover { background: #f1f5f9; }
.spl-action-btn--delete:hover { background: #fee2e2; border-color: #fca5a5; color: #dc2626; }

.spl-count { font-size: 0.8rem; color: #94a3b8; text-align: right; margin-top: 0.5rem; }

.spl-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: #64748b;
  gap: 0.5rem;
}
.spl-empty-icon { font-size: 3rem; }
.spl-empty h3 { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0; }
.spl-empty p  { margin: 0; }

.spl-spinner {
  display: inline-block;
  width: 32px; height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #059669;
  border-radius: 50%;
  animation: spl-spin 0.8s linear infinite;
}
@keyframes spl-spin { to { transform: rotate(360deg); } }

.spl-overlay {
  position: fixed; inset: 0;
  background: rgba(15,23,42,0.6);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
}
.spl-confirm-box {
  background: #fff;
  border-radius: 16px;
  padding: 2rem;
  max-width: 420px;
  width: 90%;
  box-shadow: 0 20px 50px rgba(0,0,0,0.2);
  text-align: center;
}
.spl-confirm-box h3 { margin: 0 0 0.5rem; font-size: 1.1rem; }
.spl-confirm-box p  { color: #64748b; margin: 0 0 1.5rem; }
.spl-confirm-actions { display: flex; gap: 0.75rem; justify-content: center; }

.spl-btn {
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
}
.spl-btn--primary   { background: #059669; color: #fff; }
.spl-btn--primary:hover { background: #047857; }
.spl-btn--secondary { background: #f1f5f9; color: #374151; border: 1.5px solid #cbd5e1; }
.spl-btn--secondary:hover { background: #e2e8f0; }
.spl-btn--danger    { background: #dc2626; color: #fff; }
.spl-btn--danger:hover { background: #b91c1c; }

@media (max-width: 640px) {
  .spl-td-actions { flex-direction: column; }
  .spl-table th, .spl-table td { padding: 0.6rem 0.6rem; font-size: 0.8rem; }
}

[data-theme="dark"] .spl-table { color: #e2e8f0; }
[data-theme="dark"] .spl-table th { background: #1e293b; color: #94a3b8; border-color: #334155; }
[data-theme="dark"] .spl-table td { border-color: #1e293b; }
[data-theme="dark"] .spl-row:hover td { background: #1e293b; }
[data-theme="dark"] .spl-input { background: #0f172a; color: #e2e8f0; border-color: #334155; }
[data-theme="dark"] .spl-table-wrap { border-color: #334155; }
[data-theme="dark"] .spl-empty h3 { color: #e2e8f0; }
[data-theme="dark"] .spl-confirm-box { background: #1e293b; color: #e2e8f0; }
`;
