/**
 * ClinicalIntakesPage.jsx
 * IATLAS Clinical — Client Intake Assessments management page.
 *
 * Route: /iatlas/clinical/intakes
 *
 * Access: Practitioner, Practice, Enterprise tiers only.
 *
 * Features:
 *  - List all intake assessments with search + sort
 *  - Create new intake (IntakeFormBuilder)
 *  - View / Edit existing intake (IntakeFormBuilder)
 *  - Archive / delete intake
 *  - Print individual intake as PDF
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';
import IntakeFormBuilder from '../components/IATLAS/Clinical/IntakeFormBuilder.jsx';
import IATLASUnlockModal from '../components/IATLAS/IATLASUnlockModal.jsx';
import { hasProfessionalAccess } from '../utils/iatlasGating.js';
import { apiUrl } from '../api/baseUrl.js';

// ── View modes ────────────────────────────────────────────────────────────────

const MODE_LIST   = 'list';
const MODE_CREATE = 'create';
const MODE_EDIT   = 'edit';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function DimensionPills({ ratings }) {
  if (!ratings) return null;
  const COLORS = {
    'agentic-generative':    '#7c3aed',
    'somatic-regulative':    '#059669',
    'cognitive-narrative':   '#0369a1',
    'relational-connective': '#dc2626',
    'emotional-adaptive':    '#d97706',
    'spiritual-existential': '#6b7280',
  };
  const SHORT = {
    'agentic-generative':    'AG',
    'somatic-regulative':    'SR',
    'cognitive-narrative':   'CN',
    'relational-connective': 'RC',
    'emotional-adaptive':    'EA',
    'spiritual-existential': 'SE',
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.4rem' }}>
      {Object.entries(ratings).map(([dim, score]) => {
        if (!score && score !== 0) return null;
        return (
          <span
            key={dim}
            title={dim}
            style={{
              background:   COLORS[dim] || '#64748b',
              color:        '#fff',
              borderRadius: '999px',
              padding:      '2px 8px',
              fontSize:     '0.72rem',
              fontWeight:   700,
            }}
          >
            {SHORT[dim] || dim.slice(0, 2).toUpperCase()}: {score}
          </span>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ClinicalIntakesPage() {
  const { getAccessTokenSilently } = useAuth0();

  const [mode,          setMode]          = useState(MODE_LIST);
  const [intakes,       setIntakes]       = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [fetchError,    setFetchError]    = useState('');
  const [selectedIntake, setSelectedIntake] = useState(null);
  const [showUpgrade,   setShowUpgrade]   = useState(false);
  const [hasPro,        setHasPro]        = useState(null);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [deleteError,   setDeleteError]   = useState('');

  // ── Dark mode ────────────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const t = localStorage.getItem('ra-theme');
      if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
      else if (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.setAttribute('data-theme', 'dark');
    } catch (_) {}
  }, []);

  // ── Tier check ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const pro = hasProfessionalAccess();
    setHasPro(pro);
    if (!pro) setShowUpgrade(true);
  }, []);

  // ── Fetch intakes ─────────────────────────────────────────────────────────────

  const fetchIntakes = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      let token = '';
      try { token = await getAccessTokenSilently(); } catch (_) {}

      const url = apiUrl('/api/iatlas/clinical/intakes?limit=100&sort=created');
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load intake assessments.');
      }
      const data = await res.json();
      setIntakes(data.intakes || []);
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently]);

  useEffect(() => {
    if (hasPro) fetchIntakes();
  }, [hasPro, fetchIntakes]);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleSave = useCallback((saved) => {
    setIntakes(prev => {
      const idx = prev.findIndex(i => i._id === saved._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setMode(MODE_LIST);
    setSelectedIntake(null);
  }, []);

  const handleDelete = useCallback(async (intakeId) => {
    if (!window.confirm('Archive this intake? It will no longer appear in your list.')) return;
    setDeleteError('');
    try {
      let token = '';
      try { token = await getAccessTokenSilently(); } catch (_) {}
      const res = await fetch(
        apiUrl(`/api/iatlas/clinical/intakes/${intakeId}`),
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to archive intake.');
      }
      setIntakes(prev => prev.filter(i => i._id !== intakeId));
    } catch (err) {
      setDeleteError(err.message);
    }
  }, [getAccessTokenSilently]);

  const handleNew    = () => { setSelectedIntake(null); setMode(MODE_CREATE); };
  const handleEdit   = (intake) => { setSelectedIntake(intake); setMode(MODE_EDIT); };
  const handleBack   = () => { setSelectedIntake(null); setMode(MODE_LIST); };

  // ── Filtered list ─────────────────────────────────────────────────────────────

  const filteredIntakes = searchQuery.trim()
    ? intakes.filter(i =>
        i.clientIdentifier?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : intakes;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      <SiteHeader activePage="iatlas" />
      <DarkModeHint />
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

      {showUpgrade && (
        <IATLASUnlockModal
          variant="professional"
          onClose={() => setShowUpgrade(false)}
        />
      )}

      <main id="main-content" className="cip-page">

        {/* Breadcrumb */}
        <nav className="cip-breadcrumb" aria-label="Breadcrumb">
          <Link to="/iatlas">IATLAS</Link>
          <span> › </span>
          <span>Clinical</span>
          <span> › </span>
          <span>Intake Assessments</span>
        </nav>

        {/* Header */}
        <div className="cip-header">
          <div>
            <h1 className="cip-title">📋 Intake Assessments</h1>
            <p className="cip-subtitle">
              Create and manage clinical intake assessments for your clients.
            </p>
          </div>
          <div className="cip-header-actions">
            {mode !== MODE_LIST && (
              <button className="cip-btn-back" onClick={handleBack}>
                ← Back to List
              </button>
            )}
            {mode === MODE_LIST && hasPro && (
              <button className="cip-btn-new" onClick={handleNew}>
                + New Intake
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="cip-content">

          {/* Tier paywall */}
          {hasPro === false && !showUpgrade && (
            <div className="cip-upgrade-banner">
              <p>
                Clinical Intake Assessments are available for{' '}
                <strong>Practitioner</strong>, <strong>Practice</strong>, and{' '}
                <strong>Enterprise</strong> tiers.
              </p>
              <button className="cip-btn-new" onClick={() => setShowUpgrade(true)}>
                Upgrade to Practitioner
              </button>
            </div>
          )}

          {/* Delete error */}
          {deleteError && (
            <div className="cip-error">
              <strong>Error:</strong> {deleteError}
              <button className="cip-dismiss-btn" onClick={() => setDeleteError('')}>✕</button>
            </div>
          )}

          {/* Fetch error */}
          {fetchError && (
            <div className="cip-error">
              <strong>Error:</strong> {fetchError}
              <button className="cip-retry-btn" onClick={fetchIntakes}>Retry</button>
            </div>
          )}

          {/* ── List mode ── */}
          {hasPro && mode === MODE_LIST && (
            <>
              {/* Search bar */}
              <div className="cip-controls">
                <div className="cip-search-wrap">
                  <span className="cip-search-icon" aria-hidden="true">🔍</span>
                  <input
                    type="search"
                    className="cip-search-input"
                    placeholder="Search by client identifier…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    aria-label="Search intakes"
                  />
                </div>
                <span className="cip-count" aria-live="polite">
                  {filteredIntakes.length} intake{filteredIntakes.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Loading */}
              {loading && (
                <div className="cip-loading">Loading intakes…</div>
              )}

              {/* Empty state */}
              {!loading && filteredIntakes.length === 0 && (
                <div className="cip-empty">
                  <div className="cip-empty-icon">📋</div>
                  <h3>{searchQuery ? 'No matching intakes found.' : 'No intake assessments yet.'}</h3>
                  <p>{searchQuery ? 'Try a different search term.' : 'Create your first intake assessment to track client baseline scores.'}</p>
                  {!searchQuery && (
                    <button className="cip-btn-new" onClick={handleNew}>
                      + New Intake
                    </button>
                  )}
                </div>
              )}

              {/* Intake cards */}
              {!loading && filteredIntakes.length > 0 && (
                <div className="cip-grid" role="list">
                  {filteredIntakes.map(intake => (
                    <article key={intake._id} className="cip-card" role="listitem">
                      <div className="cip-card-header">
                        <div>
                          <h3 className="cip-card-name">{intake.clientIdentifier}</h3>
                          <div className="cip-card-meta">
                            Created {formatDate(intake.createdAt)}
                            {intake.pronouns ? ` · ${intake.pronouns}` : ''}
                          </div>
                        </div>
                        <div className="cip-card-actions">
                          <button
                            className="cip-btn-edit"
                            onClick={() => handleEdit(intake)}
                            aria-label={`Edit intake for ${intake.clientIdentifier}`}
                          >
                            Edit
                          </button>
                          <button
                            className="cip-btn-delete"
                            onClick={() => handleDelete(intake._id)}
                            aria-label={`Archive intake for ${intake.clientIdentifier}`}
                          >
                            Archive
                          </button>
                        </div>
                      </div>

                      {/* Dimension ratings */}
                      {intake.dimensionRatings && (
                        <DimensionPills ratings={intake.dimensionRatings} />
                      )}

                      {/* Therapy goals preview */}
                      {intake.therapyGoals?.length > 0 && (
                        <ul className="cip-goals-preview">
                          {intake.therapyGoals.slice(0, 2).map((g, i) => (
                            <li key={i}>🎯 {g}</li>
                          ))}
                          {intake.therapyGoals.length > 2 && (
                            <li className="cip-goals-more">
                              +{intake.therapyGoals.length - 2} more…
                            </li>
                          )}
                        </ul>
                      )}

                      {/* Link to outcome report */}
                      <div className="cip-card-footer">
                        <Link
                          to={`/iatlas/clinical/outcome-reports/${encodeURIComponent(intake.clientIdentifier)}`}
                          className="cip-link-outcomes"
                        >
                          View Outcome Report →
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Create mode ── */}
          {hasPro && mode === MODE_CREATE && (
            <div className="cip-form-wrap">
              <h2 className="cip-form-title">New Intake Assessment</h2>
              <IntakeFormBuilder
                intake={null}
                onSave={handleSave}
                onCancel={handleBack}
                getTokenFn={getAccessTokenSilently}
              />
            </div>
          )}

          {/* ── Edit mode ── */}
          {hasPro && mode === MODE_EDIT && selectedIntake && (
            <div className="cip-form-wrap">
              <h2 className="cip-form-title">
                Edit Intake — {selectedIntake.clientIdentifier}
              </h2>
              <IntakeFormBuilder
                intake={selectedIntake}
                onSave={handleSave}
                onCancel={handleBack}
                getTokenFn={getAccessTokenSilently}
              />
            </div>
          )}

        </div>
      </main>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const PAGE_CSS = `
.cip-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 0 0 4rem;
}

.cip-breadcrumb {
  padding: 1rem 1.5rem 0;
  font-size: 0.82rem;
  color: #94a3b8;
}
.cip-breadcrumb a { color: #059669; text-decoration: none; }
.cip-breadcrumb a:hover { text-decoration: underline; }

.cip-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1.5rem 1.5rem 1rem;
  max-width: 960px;
  margin: 0 auto;
}

.cip-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}
.cip-subtitle {
  color: #64748b;
  font-size: 0.95rem;
  margin: 0.25rem 0 0;
}

.cip-header-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; }

.cip-btn-new {
  background: #059669;
  color: #fff;
  border: none;
  padding: 0.65rem 1.4rem;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}
.cip-btn-new:hover { background: #047857; }

.cip-btn-back {
  background: #f1f5f9;
  color: #374151;
  border: 1.5px solid #cbd5e1;
  padding: 0.6rem 1.25rem;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.cip-btn-back:hover { background: #e2e8f0; }

.cip-content {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.cip-form-wrap {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.75rem;
}
.cip-form-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.cip-error {
  background: #fee2e2;
  border: 1.5px solid #fca5a5;
  border-radius: 10px;
  padding: 0.85rem 1rem;
  color: #991b1b;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}
.cip-retry-btn {
  background: #dc2626; color: #fff; border: none;
  padding: 0.35rem 0.85rem; border-radius: 6px; cursor: pointer; font-size: 0.82rem;
}
.cip-retry-btn:hover { background: #b91c1c; }
.cip-dismiss-btn {
  background: transparent; border: none; color: #991b1b; cursor: pointer; font-size: 0.9rem; margin-left: auto;
}

.cip-upgrade-banner {
  background: #d1fae5;
  border: 1.5px solid #6ee7b7;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}
.cip-upgrade-banner p { margin: 0; color: #065f46; }

.cip-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.cip-search-wrap {
  position: relative;
  flex: 1;
  min-width: 200px;
}
.cip-search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.9rem;
  pointer-events: none;
}
.cip-search-input {
  width: 100%;
  padding: 0.55rem 0.75rem 0.55rem 2.25rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.9rem;
  background: #fff;
  box-sizing: border-box;
  outline: none;
}
.cip-count {
  font-size: 0.82rem;
  color: #94a3b8;
  white-space: nowrap;
}

.cip-loading {
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
  font-size: 0.95rem;
}

.cip-empty {
  text-align: center;
  padding: 4rem 2rem;
}
.cip-empty-icon { font-size: 3.5rem; margin-bottom: 1rem; }
.cip-empty h3 { color: #374151; margin: 0 0 0.5rem; font-size: 1.15rem; }
.cip-empty p  { color: #94a3b8; margin: 0 0 1.5rem; font-size: 0.9rem; }

.cip-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.cip-card {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  transition: box-shadow 0.15s;
}
.cip-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }

.cip-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.cip-card-name {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.cip-card-meta {
  font-size: 0.78rem;
  color: #94a3b8;
  margin-top: 0.2rem;
}

.cip-card-actions { display: flex; gap: 0.4rem; flex-shrink: 0; }

.cip-btn-edit {
  background: #f0fdf4; border: 1.5px solid #6ee7b7;
  border-radius: 7px; color: #065f46;
  cursor: pointer; font-size: 0.8rem; font-weight: 600;
  padding: 0.3rem 0.75rem;
}
.cip-btn-edit:hover { background: #d1fae5; }

.cip-btn-delete {
  background: #fff5f5; border: 1.5px solid #fca5a5;
  border-radius: 7px; color: #dc2626;
  cursor: pointer; font-size: 0.8rem; font-weight: 600;
  padding: 0.3rem 0.75rem;
}
.cip-btn-delete:hover { background: #fee2e2; }

.cip-goals-preview {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.84rem;
  color: #374151;
}
.cip-goals-preview li { margin-bottom: 0.25rem; }
.cip-goals-more { color: #94a3b8; font-style: italic; }

.cip-card-footer {
  margin-top: auto;
  padding-top: 0.5rem;
  border-top: 1px solid #f1f5f9;
}
.cip-link-outcomes {
  font-size: 0.82rem;
  color: #059669;
  text-decoration: none;
  font-weight: 600;
}
.cip-link-outcomes:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .cip-header { padding: 1rem; }
  .cip-content { padding: 0 1rem; }
  .cip-title { font-size: 1.35rem; }
  .cip-form-wrap { padding: 1.25rem; border-radius: 12px; }
  .cip-grid { grid-template-columns: 1fr; }
}

/* Dark mode */
[data-theme="dark"] .cip-page { background: #0f172a; }
[data-theme="dark"] .cip-title { color: #f8fafc; }
[data-theme="dark"] .cip-subtitle { color: #94a3b8; }
[data-theme="dark"] .cip-card { background: #1e293b; border-color: #334155; }
[data-theme="dark"] .cip-card-name { color: #f1f5f9; }
[data-theme="dark"] .cip-goals-preview { color: #cbd5e1; }
[data-theme="dark"] .cip-form-wrap { background: #1e293b; border-color: #334155; }
[data-theme="dark"] .cip-form-title { color: #f1f5f9; border-color: #334155; }
[data-theme="dark"] .cip-search-input { background: #1e293b; border-color: #334155; color: #f1f5f9; }

@media print {
  .cip-header-actions, .cip-controls, .cip-btn-new, .cip-btn-back,
  .cip-card-actions, nav { display: none !important; }
}
`;
