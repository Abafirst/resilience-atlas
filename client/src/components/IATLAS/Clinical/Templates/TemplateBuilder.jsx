/**
 * TemplateBuilder.jsx
 * Create or edit a session template.
 *
 * Props:
 *   template     {object|null}  — existing template for edit mode; null for create
 *   onSave       {function}     — called with the saved template object
 *   onCancel     {function}     — called when the user cancels
 *   getTokenFn   {function}     — Auth0 getAccessTokenSilently
 *   userTier     {string}       — current user's subscription tier
 */

import React, { useState, useCallback } from 'react';
import { apiUrl } from '../../../../api/baseUrl.js';

const CATEGORIES = [
  { value: 'intake',     label: 'Intake' },
  { value: 'ongoing',    label: 'Ongoing' },
  { value: 'closure',    label: 'Closure' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'custom',     label: 'Custom' },
];

const SECTION_TYPES = [
  { value: 'text',      label: 'Text' },
  { value: 'checklist', label: 'Checklist' },
  { value: 'scale',     label: 'Scale' },
  { value: 'dropdown',  label: 'Dropdown' },
];

const PRACTITIONER_TIERS = new Set(['practitioner', 'practice', 'enterprise']);

function emptySection(order = 0) {
  return { title: '', type: 'text', content: '', required: false, order };
}

function emptyForm() {
  return {
    name:                '',
    description:         '',
    category:            'custom',
    tags:                [],
    sections:            [],
    isPublic:            false,
    metadata: {
      estimatedDuration:   '',
      targetPopulation:    '',
      therapeuticApproach: '',
    },
  };
}

export default function TemplateBuilder({ template, onSave, onCancel, getTokenFn, userTier }) {
  const isEdit = Boolean(template);

  const [form, setForm] = useState(() => {
    if (template) {
      return {
        name:        template.name        || '',
        description: template.description || '',
        category:    template.category    || 'custom',
        tags:        Array.isArray(template.tags) ? [...template.tags] : [],
        sections:    Array.isArray(template.sections)
          ? template.sections.map((s) => ({ ...s }))
          : [],
        isPublic:    template.isPublic    || false,
        metadata: {
          estimatedDuration:   template.metadata?.estimatedDuration   ?? '',
          targetPopulation:    template.metadata?.targetPopulation    || '',
          therapeuticApproach: template.metadata?.therapeuticApproach || '',
        },
      };
    }
    return emptyForm();
  });

  const [tagInput, setTagInput]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [errors, setErrors]       = useState({});

  // ── Tier gate ──────────────────────────────────────────────────────────────

  if (!PRACTITIONER_TIERS.has(userTier)) {
    return (
      <div style={styles.upgradePrompt}>
        <h3 style={styles.upgradeTitle}>Practitioner Tier Required</h3>
        <p style={styles.upgradeText}>
          Session templates are available on the Practitioner, Practice, and
          Enterprise tiers. Upgrade your plan to create and manage templates.
        </p>
        <a href="/pricing" style={styles.upgradeBtn}>View Pricing</a>
      </div>
    );
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (form.name.trim().length > 100) errs.name = 'Name must be at most 100 characters.';
    if (form.description.length > 500) errs.description = 'Description must be at most 500 characters.';
    form.sections.forEach((section, i) => {
      if (!section.title.trim()) errs[`section_${i}_title`] = 'Section title is required.';
    });
    return errs;
  }

  // ── Field handlers ─────────────────────────────────────────────────────────

  const handleField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  }, []);

  const handleMetaField = useCallback((field, value) => {
    setForm((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, [field]: value },
    }));
  }, []);

  // ── Tags ───────────────────────────────────────────────────────────────────

  const addTag = useCallback(() => {
    const tag = tagInput.trim();
    if (!tag) return;
    if (form.tags.includes(tag)) { setTagInput(''); return; }
    setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    setTagInput('');
  }, [tagInput, form.tags]);

  const removeTag = useCallback((tag) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  }, []);

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(); }
  };

  // ── Sections ───────────────────────────────────────────────────────────────

  const addSection = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      sections: [...prev.sections, emptySection(prev.sections.length)],
    }));
  }, []);

  const removeSection = useCallback((idx) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i })),
    }));
  }, []);

  const updateSection = useCallback((idx, field, value) => {
    setForm((prev) => {
      const sections = prev.sections.map((s, i) =>
        i === idx ? { ...s, [field]: value } : s
      );
      return { ...prev, sections };
    });
    setErrors((prev) => {
      const e = { ...prev };
      delete e[`section_${idx}_title`];
      return e;
    });
  }, []);

  const moveSection = useCallback((idx, direction) => {
    setForm((prev) => {
      const sections = [...prev.sections];
      const target   = idx + direction;
      if (target < 0 || target >= sections.length) return prev;
      [sections[idx], sections[target]] = [sections[target], sections[idx]];
      return { ...prev, sections: sections.map((s, i) => ({ ...s, order: i })) };
    });
  }, []);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    try {
      const token   = await getTokenFn();
      const url     = isEdit ? apiUrl(`/api/templates/${template._id}`) : apiUrl('/api/templates');
      const method  = isEdit ? 'PUT' : 'POST';
      const payload = {
        ...form,
        metadata: {
          ...form.metadata,
          estimatedDuration: form.metadata.estimatedDuration !== ''
            ? Number(form.metadata.estimatedDuration)
            : null,
        },
      };

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save template.');
      if (onSave) onSave(data);
    } catch (err) {
      setErrors({ _global: err.message });
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} style={styles.form} noValidate>
      <h2 style={styles.heading}>{isEdit ? 'Edit Template' : 'Create Session Template'}</h2>

      {errors._global && <p style={styles.globalError}>{errors._global}</p>}

      {/* Name */}
      <div style={styles.field}>
        <label style={styles.label}>
          Name <span style={styles.required}>*</span>
          <span style={styles.counter}>{form.name.length}/100</span>
        </label>
        <input
          type="text"
          value={form.name}
          maxLength={100}
          onChange={(e) => handleField('name', e.target.value)}
          style={{ ...styles.input, ...(errors.name ? styles.inputError : {}) }}
          placeholder="Template name"
        />
        {errors.name && <span style={styles.error}>{errors.name}</span>}
      </div>

      {/* Description */}
      <div style={styles.field}>
        <label style={styles.label}>
          Description
          <span style={styles.counter}>{form.description.length}/500</span>
        </label>
        <textarea
          value={form.description}
          maxLength={500}
          rows={3}
          onChange={(e) => handleField('description', e.target.value)}
          style={{ ...styles.input, ...styles.textarea, ...(errors.description ? styles.inputError : {}) }}
          placeholder="Optional description"
        />
        {errors.description && <span style={styles.error}>{errors.description}</span>}
      </div>

      {/* Category */}
      <div style={styles.field}>
        <label style={styles.label}>Category</label>
        <select
          value={form.category}
          onChange={(e) => handleField('category', e.target.value)}
          style={styles.select}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div style={styles.field}>
        <label style={styles.label}>Tags</label>
        <div style={styles.tagInput}>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            style={{ ...styles.input, flex: 1 }}
            placeholder="Add tag and press Enter"
          />
          <button type="button" onClick={addTag} style={styles.btnSecondary}>Add</button>
        </div>
        <div style={styles.chips}>
          {form.tags.map((tag) => (
            <span key={tag} style={styles.chip}>
              {tag}
              <button type="button" onClick={() => removeTag(tag)} style={styles.chipRemove}>×</button>
            </span>
          ))}
        </div>
      </div>

      {/* Metadata */}
      <fieldset style={styles.fieldset}>
        <legend style={styles.legend}>Metadata</legend>
        <div style={styles.metaGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Estimated Duration (min)</label>
            <input
              type="number"
              min={0}
              value={form.metadata.estimatedDuration}
              onChange={(e) => handleMetaField('estimatedDuration', e.target.value)}
              style={styles.input}
              placeholder="e.g. 50"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Target Population</label>
            <input
              type="text"
              value={form.metadata.targetPopulation}
              onChange={(e) => handleMetaField('targetPopulation', e.target.value)}
              style={styles.input}
              placeholder="e.g. Children, Adults"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Therapeutic Approach</label>
            <input
              type="text"
              value={form.metadata.therapeuticApproach}
              onChange={(e) => handleMetaField('therapeuticApproach', e.target.value)}
              style={styles.input}
              placeholder="e.g. CBT, DBT"
            />
          </div>
        </div>
      </fieldset>

      {/* Sections */}
      <fieldset style={styles.fieldset}>
        <legend style={styles.legend}>Sections</legend>
        {form.sections.length === 0 && (
          <p style={styles.emptySections}>No sections yet. Click &ldquo;Add Section&rdquo; to begin.</p>
        )}
        {form.sections.map((section, idx) => (
          <div key={idx} style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionNum}>Section {idx + 1}</span>
              <div style={styles.sectionActions}>
                <button type="button" onClick={() => moveSection(idx, -1)} disabled={idx === 0} style={styles.btnIcon}>↑</button>
                <button type="button" onClick={() => moveSection(idx, 1)} disabled={idx === form.sections.length - 1} style={styles.btnIcon}>↓</button>
                <button type="button" onClick={() => removeSection(idx)} style={{ ...styles.btnIcon, color: '#dc2626' }}>✕</button>
              </div>
            </div>

            <div style={styles.sectionRow}>
              <div style={{ flex: 2 }}>
                <label style={styles.label}>
                  Title <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => updateSection(idx, 'title', e.target.value)}
                  style={{ ...styles.input, ...(errors[`section_${idx}_title`] ? styles.inputError : {}) }}
                  placeholder="Section title"
                />
                {errors[`section_${idx}_title`] && (
                  <span style={styles.error}>{errors[`section_${idx}_title`]}</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Type</label>
                <select
                  value={section.type}
                  onChange={(e) => updateSection(idx, 'type', e.target.value)}
                  style={styles.select}
                >
                  {SECTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Default Content</label>
              <textarea
                value={section.content}
                rows={2}
                onChange={(e) => updateSection(idx, 'content', e.target.value)}
                style={{ ...styles.input, ...styles.textarea }}
                placeholder="Default template content for this section"
              />
            </div>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={section.required}
                onChange={(e) => updateSection(idx, 'required', e.target.checked)}
              />
              {' '}Required section
            </label>
          </div>
        ))}
        <button type="button" onClick={addSection} style={styles.btnSecondary}>+ Add Section</button>
      </fieldset>

      {/* Sharing */}
      <div style={styles.field}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={form.isPublic}
            onChange={(e) => handleField('isPublic', e.target.checked)}
          />
          {' '}Share with all practitioners in my Practice (Practice tier and above)
        </label>
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        <button type="button" onClick={onCancel} style={styles.btnSecondary} disabled={saving}>
          Cancel
        </button>
        <button type="submit" style={styles.btnPrimary} disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Template'}
        </button>
      </div>
    </form>
  );
}

// ── Inline styles ─────────────────────────────────────────────────────────────

const styles = {
  form:          { maxWidth: 700, margin: '0 auto', padding: '1.5rem', fontFamily: 'inherit' },
  heading:       { fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#111827' },
  field:         { marginBottom: '1rem' },
  label:         { display: 'block', fontWeight: 600, marginBottom: '0.25rem', color: '#374151', fontSize: '0.875rem' },
  required:      { color: '#dc2626', marginLeft: 2 },
  counter:       { float: 'right', fontWeight: 400, color: '#9ca3af', fontSize: '0.75rem' },
  input:         { display: 'block', width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none' },
  inputError:    { borderColor: '#dc2626' },
  textarea:      { resize: 'vertical' },
  select:        { display: 'block', width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.875rem', boxSizing: 'border-box' },
  error:         { color: '#dc2626', fontSize: '0.75rem', marginTop: 2 },
  globalError:   { color: '#dc2626', background: '#fee2e2', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem', fontSize: '0.875rem' },
  fieldset:      { border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem', marginBottom: '1rem' },
  legend:        { fontWeight: 700, color: '#374151', padding: '0 0.5rem', fontSize: '0.875rem' },
  metaGrid:      { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' },
  emptySections: { color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.75rem' },
  sectionCard:   { border: '1px solid #e5e7eb', borderRadius: 6, padding: '1rem', marginBottom: '0.75rem', background: '#f9fafb' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
  sectionNum:    { fontWeight: 600, color: '#374151', fontSize: '0.875rem' },
  sectionActions:{ display: 'flex', gap: 4 },
  sectionRow:    { display: 'flex', gap: '1rem', marginBottom: '0.5rem' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: '#374151' },
  tagInput:      { display: 'flex', gap: 8 },
  chips:         { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip:          { display: 'inline-flex', alignItems: 'center', background: '#dbeafe', color: '#1d4ed8', borderRadius: 12, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600 },
  chipRemove:    { background: 'none', border: 'none', cursor: 'pointer', marginLeft: 4, color: '#1d4ed8', fontWeight: 700, fontSize: '1rem', lineHeight: 1 },
  actions:       { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: '1.5rem' },
  btnPrimary:    { padding: '0.6rem 1.5rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' },
  btnSecondary:  { padding: '0.6rem 1.25rem', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' },
  btnIcon:       { background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', color: '#6b7280', fontSize: '1rem' },
  upgradePrompt: { maxWidth: 460, margin: '3rem auto', padding: '2rem', textAlign: 'center', border: '1px solid #fde68a', borderRadius: 12, background: '#fffbeb' },
  upgradeTitle:  { fontSize: '1.25rem', fontWeight: 700, color: '#92400e', marginBottom: '0.75rem' },
  upgradeText:   { color: '#78350f', marginBottom: '1.5rem', fontSize: '0.9rem' },
  upgradeBtn:    { display: 'inline-block', padding: '0.6rem 1.5rem', background: '#f59e0b', color: '#fff', textDecoration: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.875rem' },
};
