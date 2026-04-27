/**
 * TemplateLibrary.jsx
 * Grid/list view of all session templates owned by the practitioner.
 *
 * Props:
 *   getTokenFn     {function}  — Auth0 getAccessTokenSilently
 *   userTier       {string}    — current user's subscription tier
 *   onEdit         {function}  — called with template object to open edit view
 *   onUse          {function}  — called with template object to apply to session
 */

import React, { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../../../../api/baseUrl.js';

const CATEGORIES = ['intake', 'ongoing', 'closure', 'assessment', 'custom'];
const PRACTITIONER_TIERS = new Set(['practitioner', 'practice', 'enterprise']);

function CategoryBadge({ category }) {
  const colours = {
    intake:     { bg: '#dbeafe', color: '#1d4ed8' },
    ongoing:    { bg: '#d1fae5', color: '#065f46' },
    closure:    { bg: '#ede9fe', color: '#5b21b6' },
    assessment: { bg: '#fef3c7', color: '#92400e' },
    custom:     { bg: '#f3f4f6', color: '#374151' },
  };
  const style = colours[category] || colours.custom;
  return (
    <span style={{ ...badgeStyle, background: style.bg, color: style.color }}>
      {category}
    </span>
  );
}

function formatDate(val) {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

export default function TemplateLibrary({ getTokenFn, userTier, onEdit, onUse }) {
  const [templates, setTemplates]   = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [viewMode, setViewMode]     = useState('grid'); // 'grid' | 'list'
  const [search, setSearch]         = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy]         = useState('recent');
  const [page, setPage]             = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const LIMIT = 12;

  // ── Tier gate ────────────────────────────────────────────────────────────

  if (!PRACTITIONER_TIERS.has(userTier)) {
    return (
      <div style={upgradeStyle.wrap}>
        <h3 style={upgradeStyle.title}>Practitioner Tier Required</h3>
        <p style={upgradeStyle.text}>
          Session templates are available on the Practitioner, Practice, and
          Enterprise tiers.
        </p>
        <a href="/pricing" style={upgradeStyle.btn}>View Pricing</a>
      </div>
    );
  }

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchTemplates = useCallback(async (opts = {}) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getTokenFn();
      const skip  = (opts.page ?? page) * LIMIT;
      const params = new URLSearchParams({
        sort:  opts.sort  ?? sortBy,
        limit: LIMIT,
        skip,
      });
      if (opts.category ?? filterCategory) params.set('category', opts.category ?? filterCategory);

      const res  = await fetch(apiUrl(`/api/templates?${params}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load templates.');
      setTemplates(data.templates || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getTokenFn, page, sortBy, filterCategory]);

  useEffect(() => {
    fetchTemplates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, filterCategory]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) { fetchTemplates(); return; }
    setLoading(true);
    setError(null);
    try {
      const token = await getTokenFn();
      const params = new URLSearchParams({ q: search.trim() });
      if (filterCategory) params.set('category', filterCategory);
      const res  = await fetch(apiUrl(`/api/templates/search?${params}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed.');
      setTemplates(data.templates || []);
      setTotal(data.templates?.length || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (tmpl) => {
    try {
      const token = await getTokenFn();
      const res   = await fetch(apiUrl(`/api/templates/${tmpl._id}/duplicate`), {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data  = await res.json();
      if (!res.ok) throw new Error(data.error || 'Duplicate failed.');
      fetchTemplates();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = await getTokenFn();
      const res   = await fetch(apiUrl(`/api/templates/${id}`), {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed.');
      }
      setConfirmDelete(null);
      fetchTemplates();
    } catch (err) {
      setError(err.message);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div style={s.wrap}>
      {/* Toolbar */}
      <div style={s.toolbar}>
        <form onSubmit={handleSearch} style={s.searchForm}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates…"
            style={s.searchInput}
          />
          <button type="submit" style={s.btnPrimary}>Search</button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); fetchTemplates(); }} style={s.btnSecondary}>
              Clear
            </button>
          )}
        </form>
        <div style={s.controls}>
          <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(0); }} style={s.select}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(0); }} style={s.select}>
            <option value="recent">Most Recent</option>
            <option value="usage">Most Used</option>
            <option value="name">Name A–Z</option>
          </select>
          <button
            type="button"
            onClick={() => setViewMode((v) => v === 'grid' ? 'list' : 'grid')}
            style={s.btnIcon}
            title="Toggle view"
          >
            {viewMode === 'grid' ? '☰' : '⊞'}
          </button>
        </div>
      </div>

      {error && <p style={s.errorMsg}>{error}</p>}

      {/* Content */}
      {loading ? (
        <p style={s.loading}>Loading templates…</p>
      ) : templates.length === 0 ? (
        <div style={s.empty}>
          <p style={s.emptyText}>No templates found.</p>
          <p style={s.emptyHint}>Create your first template to get started.</p>
        </div>
      ) : (
        <div style={viewMode === 'grid' ? s.grid : s.list}>
          {templates.map((tmpl) => (
            <div key={tmpl._id} style={viewMode === 'grid' ? s.card : s.row}>
              <div style={s.cardTop}>
                <CategoryBadge category={tmpl.category} />
                {tmpl.isPublic && <span style={s.publicBadge}>Shared</span>}
              </div>
              <h3 style={s.cardTitle}>{tmpl.name}</h3>
              {tmpl.description && <p style={s.cardDesc}>{tmpl.description}</p>}
              <div style={s.cardMeta}>
                <span>Used {tmpl.usageCount} time{tmpl.usageCount !== 1 ? 's' : ''}</span>
                <span>Updated {formatDate(tmpl.updatedAt)}</span>
              </div>
              {tmpl.tags?.length > 0 && (
                <div style={s.tags}>
                  {tmpl.tags.map((t) => <span key={t} style={s.tag}>{t}</span>)}
                </div>
              )}
              <div style={s.cardActions}>
                {onUse && (
                  <button type="button" onClick={() => onUse(tmpl)} style={s.btnPrimary}>Use</button>
                )}
                {onEdit && (
                  <button type="button" onClick={() => onEdit(tmpl)} style={s.btnSecondary}>Edit</button>
                )}
                <button type="button" onClick={() => handleDuplicate(tmpl)} style={s.btnSecondary}>Duplicate</button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(tmpl._id)}
                  style={{ ...s.btnSecondary, color: '#dc2626', borderColor: '#fca5a5' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={s.pagination}>
          <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} style={s.btnSecondary}>← Prev</button>
          <span style={s.pageInfo}>Page {page + 1} of {totalPages}</span>
          <button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)} style={s.btnSecondary}>Next →</button>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div style={s.overlay}>
          <div style={s.dialog}>
            <h3 style={{ marginBottom: '0.75rem' }}>Delete Template?</h3>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" onClick={() => setConfirmDelete(null)} style={s.btnSecondary}>Cancel</button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDelete)}
                style={{ ...s.btnPrimary, background: '#dc2626' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const badgeStyle = { display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize' };

const upgradeStyle = {
  wrap:  { maxWidth: 460, margin: '3rem auto', padding: '2rem', textAlign: 'center', border: '1px solid #fde68a', borderRadius: 12, background: '#fffbeb' },
  title: { fontSize: '1.25rem', fontWeight: 700, color: '#92400e', marginBottom: '0.75rem' },
  text:  { color: '#78350f', marginBottom: '1.5rem', fontSize: '0.9rem' },
  btn:   { display: 'inline-block', padding: '0.6rem 1.5rem', background: '#f59e0b', color: '#fff', textDecoration: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.875rem' },
};

const s = {
  wrap:        { padding: '1.5rem', fontFamily: 'inherit' },
  toolbar:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 },
  searchForm:  { display: 'flex', gap: 8, flex: 1, minWidth: 260 },
  searchInput: { flex: 1, padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.875rem' },
  controls:    { display: 'flex', gap: 8, alignItems: 'center' },
  select:      { padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.875rem' },
  btnPrimary:  { padding: '0.5rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' },
  btnSecondary:{ padding: '0.5rem 1rem', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' },
  btnIcon:     { padding: '0.5rem', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: '1rem' },
  loading:     { textAlign: 'center', color: '#6b7280', padding: '3rem' },
  errorMsg:    { color: '#dc2626', background: '#fee2e2', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem', fontSize: '0.875rem' },
  empty:       { textAlign: 'center', padding: '3rem' },
  emptyText:   { fontSize: '1.125rem', fontWeight: 600, color: '#374151' },
  emptyHint:   { color: '#6b7280', marginTop: '0.5rem' },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' },
  list:        { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  card:        { border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.25rem', background: '#fff' },
  row:         { border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem', background: '#fff', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' },
  cardTop:     { display: 'flex', gap: 6, marginBottom: '0.5rem' },
  publicBadge: { display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 700, background: '#d1fae5', color: '#065f46' },
  cardTitle:   { fontWeight: 700, fontSize: '1rem', margin: '0 0 0.25rem', color: '#111827' },
  cardDesc:    { fontSize: '0.8rem', color: '#6b7280', margin: '0 0 0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardMeta:    { display: 'flex', gap: 12, fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem' },
  tags:        { display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: '0.75rem' },
  tag:         { background: '#dbeafe', color: '#1d4ed8', borderRadius: 10, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 600 },
  cardActions: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  pagination:  { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: '1.5rem' },
  pageInfo:    { color: '#6b7280', fontSize: '0.875rem' },
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  dialog:      { background: '#fff', borderRadius: 12, padding: '2rem', maxWidth: 400, width: '90%' },
};
