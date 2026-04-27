/**
 * ApplyTemplateModal.jsx
 * Modal/drawer to select a session template and apply it to a session note form.
 *
 * Props:
 *   isOpen       {boolean}   — whether the modal is visible
 *   onClose      {function}  — called when the modal is dismissed
 *   onApply      {function}  — called with the selected template object
 *   getTokenFn   {function}  — Auth0 getAccessTokenSilently
 *   userTier     {string}    — current user's subscription tier
 *   hasContent   {boolean}   — true when the session form already has content (show warning)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../../../../api/baseUrl.js';

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
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize', background: style.bg, color: style.color }}>
      {category}
    </span>
  );
}

export default function ApplyTemplateModal({ isOpen, onClose, onApply, getTokenFn, userTier, hasContent }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(null);
  const [showWarn, setShowWarn]   = useState(false);

  const canAccess = PRACTITIONER_TIERS.has(userTier);

  // ── Load templates when modal opens ───────────────────────────────────────

  useEffect(() => {
    if (!isOpen || !canAccess) return;
    setSelected(null);
    setSearch('');
    setError(null);
    loadTemplates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const loadTemplates = useCallback(async (q = '') => {
    setLoading(true);
    setError(null);
    try {
      const token = await getTokenFn();
      const url   = q.trim()
        ? apiUrl(`/api/templates/search?q=${encodeURIComponent(q.trim())}`)
        : apiUrl('/api/templates?limit=50');
      const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data  = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load templates.');
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getTokenFn]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadTemplates(search);
  };

  // ── Apply ─────────────────────────────────────────────────────────────────

  const handleApplyClick = () => {
    if (!selected) return;
    if (hasContent) { setShowWarn(true); return; }
    applyTemplate();
  };

  const applyTemplate = useCallback(async () => {
    if (!selected) return;
    setShowWarn(false);
    // Increment usage count (fire-and-forget).
    try {
      const token = await getTokenFn();
      await fetch(apiUrl(`/api/templates/${selected._id}`), {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ usageCount: (selected.usageCount || 0) + 1 }),
      });
    } catch { /* non-critical */ }
    if (onApply) onApply(selected);
  }, [selected, getTokenFn, onApply]);

  // ── Keyboard close ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  return (
    <div style={s.overlay} role="dialog" aria-modal="true" aria-label="Apply Template">
      <div style={s.modal}>
        <div style={s.header}>
          <h2 style={s.heading}>Use a Template</h2>
          <button type="button" onClick={onClose} style={s.closeBtn} aria-label="Close">✕</button>
        </div>

        {!canAccess ? (
          <div style={s.upgradeWrap}>
            <p>Session templates require a Practitioner tier or above.</p>
            <a href="/pricing" style={s.upgradeBtn}>View Pricing</a>
          </div>
        ) : (
          <>
            {/* Search */}
            <form onSubmit={handleSearch} style={s.searchForm}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or tag…"
                style={s.searchInput}
              />
              <button type="submit" style={s.btnSecondary}>Search</button>
              {search && (
                <button type="button" onClick={() => { setSearch(''); loadTemplates(''); }} style={s.btnSecondary}>Clear</button>
              )}
            </form>

            {error && <p style={s.errorMsg}>{error}</p>}

            {/* Template list */}
            <div style={s.listWrap}>
              {loading ? (
                <p style={s.loading}>Loading…</p>
              ) : templates.length === 0 ? (
                <p style={s.empty}>No templates found.</p>
              ) : (
                templates.map((tmpl) => (
                  <button
                    key={tmpl._id}
                    type="button"
                    onClick={() => setSelected(tmpl)}
                    style={{ ...s.item, ...(selected?._id === tmpl._id ? s.itemSelected : {}) }}
                  >
                    <div style={s.itemTop}>
                      <CategoryBadge category={tmpl.category} />
                      <span style={s.usageCount}>{tmpl.usageCount} use{tmpl.usageCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div style={s.itemTitle}>{tmpl.name}</div>
                    {tmpl.description && <div style={s.itemDesc}>{tmpl.description}</div>}
                    {tmpl.sections?.length > 0 && (
                      <div style={s.itemSections}>
                        {tmpl.sections.length} section{tmpl.sections.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Preview of selected */}
            {selected && (
              <div style={s.preview}>
                <h4 style={s.previewHeading}>Preview: {selected.name}</h4>
                {selected.sections?.length > 0 ? (
                  <ol style={s.previewList}>
                    {selected.sections.map((sec, i) => (
                      <li key={i} style={s.previewItem}>
                        <strong>{sec.title}</strong>
                        {sec.required && <span style={s.reqBadge}> required</span>}
                        <span style={s.secType}> [{sec.type}]</span>
                        {sec.content && <p style={s.secContent}>{sec.content}</p>}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p style={{ color: '#6b7280', fontSize: '0.8rem' }}>No sections defined.</p>
                )}
              </div>
            )}

            {/* Existing content warning */}
            {showWarn && (
              <div style={s.warnBox}>
                <p style={s.warnText}>
                  ⚠️ The session form already has content. Applying this template will
                  pre-fill the sections but you will be able to edit them afterwards.
                  Existing content will not be removed.
                </p>
                <div style={s.warnActions}>
                  <button type="button" onClick={() => setShowWarn(false)} style={s.btnSecondary}>Cancel</button>
                  <button type="button" onClick={applyTemplate} style={s.btnPrimary}>Apply Anyway</button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={s.footer}>
              <button type="button" onClick={onClose} style={s.btnSecondary}>Close</button>
              <button
                type="button"
                onClick={handleApplyClick}
                style={s.btnPrimary}
                disabled={!selected}
              >
                Apply Template
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  overlay:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 },
  modal:        { background: '#fff', borderRadius: 12, padding: '1.5rem', maxWidth: 560, width: '95vw', maxHeight: '85vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  heading:      { fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 },
  closeBtn:     { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#6b7280' },
  searchForm:   { display: 'flex', gap: 8 },
  searchInput:  { flex: 1, padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.875rem' },
  listWrap:     { maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 },
  loading:      { textAlign: 'center', color: '#6b7280', padding: '1.5rem' },
  empty:        { textAlign: 'center', color: '#6b7280', padding: '1.5rem' },
  errorMsg:     { color: '#dc2626', background: '#fee2e2', padding: '0.6rem', borderRadius: 6, fontSize: '0.8rem' },
  item:         { textAlign: 'left', border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.75rem', background: '#fff', cursor: 'pointer', width: '100%' },
  itemSelected: { border: '2px solid #2563eb', background: '#eff6ff' },
  itemTop:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  usageCount:   { fontSize: '0.7rem', color: '#9ca3af' },
  itemTitle:    { fontWeight: 700, fontSize: '0.9rem', color: '#111827' },
  itemDesc:     { fontSize: '0.75rem', color: '#6b7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  itemSections: { fontSize: '0.7rem', color: '#9ca3af', marginTop: 4 },
  preview:      { border: '1px solid #e0f2fe', borderRadius: 8, padding: '1rem', background: '#f0f9ff' },
  previewHeading:{ margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: 700, color: '#1e3a5f' },
  previewList:  { margin: 0, paddingLeft: '1.25rem' },
  previewItem:  { fontSize: '0.8rem', color: '#374151', marginBottom: '0.35rem' },
  reqBadge:     { color: '#dc2626', fontWeight: 700, fontSize: '0.7rem' },
  secType:      { color: '#9ca3af', fontStyle: 'italic', fontSize: '0.7rem' },
  secContent:   { color: '#6b7280', margin: '2px 0 0', fontSize: '0.75rem' },
  warnBox:      { background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '1rem' },
  warnText:     { color: '#92400e', fontSize: '0.85rem', marginBottom: '0.75rem' },
  warnActions:  { display: 'flex', justifyContent: 'flex-end', gap: 8 },
  footer:       { display: 'flex', justifyContent: 'flex-end', gap: 10 },
  btnPrimary:   { padding: '0.5rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' },
  btnSecondary: { padding: '0.5rem 1rem', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' },
  upgradeWrap:  { textAlign: 'center', padding: '2rem', color: '#374151' },
  upgradeBtn:   { display: 'inline-block', marginTop: '0.75rem', padding: '0.5rem 1.25rem', background: '#f59e0b', color: '#fff', textDecoration: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.875rem' },
};
