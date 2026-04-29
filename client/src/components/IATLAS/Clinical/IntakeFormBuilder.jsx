/**
 * IntakeFormBuilder.jsx
 * IATLAS Clinical — Clinical Intake Assessment Form.
 *
 * Allows a practitioner to create or edit a clinical intake assessment
 * for a new or existing client.  Captures:
 *  - Client demographics (identifier, DOB, pronouns, guardian contact)
 *  - Resilience dimension self-ratings (1–10)
 *  - Current stressors checklist
 *  - Support system assessment
 *  - Therapy goals
 *
 * Props:
 *   intake       {object|null}  — existing intake for edit mode; null = create
 *   onSave       {function}     — called with saved intake object
 *   onCancel     {function}     — called when user cancels
 *   getTokenFn   {function}     — Auth0 getAccessTokenSilently
 */

import React, { useState, useEffect, useRef } from 'react';
import { apiUrl } from '../../../api/baseUrl.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const DIMENSIONS = [
  { key: 'agentic-generative',    label: 'Agentic-Generative',    color: '#7c3aed', icon: '🎯' },
  { key: 'somatic-regulative',    label: 'Somatic-Regulative',    color: '#059669', icon: '🌿' },
  { key: 'cognitive-narrative',   label: 'Cognitive-Narrative',   color: '#0369a1', icon: '💡' },
  { key: 'relational-connective', label: 'Relational-Connective', color: '#dc2626', icon: '❤️' },
  { key: 'emotional-adaptive',    label: 'Emotional-Adaptive',    color: '#d97706', icon: '🌊' },
  { key: 'spiritual-existential', label: 'Spiritual-Existential', color: '#6b7280', icon: '✨' },
];

const STRESSOR_OPTIONS = [
  { value: 'work',          label: 'Work / Career' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'health',        label: 'Health / Medical' },
  { value: 'finances',      label: 'Finances' },
  { value: 'family',        label: 'Family' },
  { value: 'school',        label: 'School / Education' },
  { value: 'other',         label: 'Other' },
];

const SUPPORT_FIELDS = [
  { key: 'family',       label: 'Family Support' },
  { key: 'friends',      label: 'Friend / Peer Support' },
  { key: 'professional', label: 'Professional Support' },
  { key: 'community',    label: 'Community Resources' },
];

const SUPPORT_OPTIONS = [
  { value: '',        label: '— Select —' },
  { value: 'yes',     label: '✅ Yes' },
  { value: 'no',      label: '❌ No' },
  { value: 'partial', label: '⚡ Partial' },
];

const DRAFT_KEY = 'iatlas_intake_form_draft';

function emptyForm() {
  return {
    clientIdentifier: '',
    dateOfBirth:      '',
    pronouns:         '',
    guardianName:     '',
    guardianPhone:    '',
    guardianEmail:    '',
    dimensionRatings: {
      'agentic-generative':    5,
      'somatic-regulative':    5,
      'cognitive-narrative':   5,
      'relational-connective': 5,
      'emotional-adaptive':    5,
      'spiritual-existential': 5,
    },
    currentStressors: [],
    supportSystem: {
      family: '', friends: '', professional: '', community: '',
    },
    therapyGoals:    ['', '', ''],
    additionalNotes: '',
  };
}

function intakeToForm(intake) {
  const ratings = intake.dimensionRatings || {};
  return {
    clientIdentifier: intake.clientIdentifier || '',
    dateOfBirth:      intake.dateOfBirth ? intake.dateOfBirth.slice(0, 10) : '',
    pronouns:         intake.pronouns || '',
    guardianName:     intake.guardianContact?.name  || '',
    guardianPhone:    intake.guardianContact?.phone || '',
    guardianEmail:    intake.guardianContact?.email || '',
    dimensionRatings: {
      'agentic-generative':    ratings['agentic-generative']    ?? 5,
      'somatic-regulative':    ratings['somatic-regulative']    ?? 5,
      'cognitive-narrative':   ratings['cognitive-narrative']   ?? 5,
      'relational-connective': ratings['relational-connective'] ?? 5,
      'emotional-adaptive':    ratings['emotional-adaptive']    ?? 5,
      'spiritual-existential': ratings['spiritual-existential'] ?? 5,
    },
    currentStressors: intake.currentStressors || [],
    supportSystem:    {
      family:       intake.supportSystem?.family       || '',
      friends:      intake.supportSystem?.friends      || '',
      professional: intake.supportSystem?.professional || '',
      community:    intake.supportSystem?.community    || '',
    },
    therapyGoals: intake.therapyGoals?.length
      ? [...intake.therapyGoals, '', ''].slice(0, Math.max(3, intake.therapyGoals.length))
      : ['', '', ''],
    additionalNotes: intake.additionalNotes || '',
  };
}

// ── Main component ────────────────────────────────────────────────────────────

export default function IntakeFormBuilder({ intake, onSave, onCancel, getTokenFn }) {
  const isEdit = Boolean(intake);
  const firstFieldRef = useRef(null);

  const [form, setForm] = useState(() => {
    if (intake) return intakeToForm(intake);
    // Restore draft from localStorage for create mode.
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return emptyForm();
  });

  const [activeSection, setActiveSection] = useState('demographics');
  const [saving,        setSaving]         = useState(false);
  const [error,         setError]          = useState('');
  const [saved,         setSaved]          = useState(false);

  // Auto-save draft (create mode only).
  useEffect(() => {
    if (isEdit) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch (_) {}
  }, [form, isEdit]);

  // Focus first field on mount.
  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  // ── Form helpers ────────────────────────────────────────────────────────────

  function setField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function setDimensionRating(dim, value) {
    setForm(prev => ({
      ...prev,
      dimensionRatings: { ...prev.dimensionRatings, [dim]: Number(value) },
    }));
  }

  function toggleStressor(value) {
    setForm(prev => {
      const already = prev.currentStressors.includes(value);
      return {
        ...prev,
        currentStressors: already
          ? prev.currentStressors.filter(s => s !== value)
          : [...prev.currentStressors, value],
      };
    });
  }

  function setSupportField(key, value) {
    setForm(prev => ({
      ...prev,
      supportSystem: { ...prev.supportSystem, [key]: value },
    }));
  }

  function setGoal(index, value) {
    setForm(prev => {
      const goals = [...prev.therapyGoals];
      goals[index] = value;
      return { ...prev, therapyGoals: goals };
    });
  }

  function addGoalRow() {
    setForm(prev => ({ ...prev, therapyGoals: [...prev.therapyGoals, ''] }));
  }

  function removeGoalRow(index) {
    setForm(prev => ({
      ...prev,
      therapyGoals: prev.therapyGoals.filter((_, i) => i !== index),
    }));
  }

  // ── Validation ──────────────────────────────────────────────────────────────

  function validate() {
    if (!form.clientIdentifier.trim()) {
      return 'Client identifier is required.';
    }
    if (form.clientIdentifier.trim().length < 2) {
      return 'Client identifier must be at least 2 characters.';
    }
    const goals = form.therapyGoals.filter(g => g.trim());
    if (goals.length < 1) {
      return 'At least one therapy goal is required.';
    }
    if (form.dateOfBirth) {
      const dob = new Date(form.dateOfBirth);
      if (isNaN(dob.getTime()) || dob >= new Date()) {
        return 'Date of birth must be a valid past date.';
      }
    }
    return null;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setActiveSection('demographics');
      return;
    }

    setSaving(true);

    const payload = {
      clientIdentifier: form.clientIdentifier.trim(),
      dateOfBirth:      form.dateOfBirth || null,
      pronouns:         form.pronouns.trim(),
      guardianContact: (form.guardianName.trim() || form.guardianPhone.trim() || form.guardianEmail.trim())
        ? { name: form.guardianName.trim(), phone: form.guardianPhone.trim(), email: form.guardianEmail.trim() }
        : {},
      dimensionRatings: form.dimensionRatings,
      currentStressors: form.currentStressors,
      supportSystem:    form.supportSystem,
      therapyGoals:     form.therapyGoals.filter(g => g.trim()),
      additionalNotes:  form.additionalNotes.trim(),
    };

    try {
      let token = '';
      try { token = await getTokenFn(); } catch (_) {}

      const url    = isEdit
        ? apiUrl(`/api/iatlas/clinical/intakes/${intake._id}`)
        : apiUrl('/api/iatlas/clinical/intakes');
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save intake.');

      setSaved(true);
      if (!isEdit) {
        try { localStorage.removeItem(DRAFT_KEY); } catch (_) {}
      }
      setTimeout(() => onSave(data), 400);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  }

  // ── Print / PDF ──────────────────────────────────────────────────────────────

  function handlePrint() {
    window.print();
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const sections = [
    { id: 'demographics', label: '👤 Demographics' },
    { id: 'dimensions',   label: '🔵 Dimension Ratings' },
    { id: 'stressors',    label: '⚡ Stressors' },
    { id: 'support',      label: '🤝 Support System' },
    { id: 'goals',        label: '🎯 Therapy Goals' },
  ];

  return (
    <form onSubmit={handleSubmit} noValidate style={styles.form}>

      {/* Section nav */}
      <nav style={styles.sectionNav} aria-label="Form sections">
        {sections.map(sec => (
          <button
            key={sec.id}
            type="button"
            style={{
              ...styles.sectionTab,
              ...(activeSection === sec.id ? styles.sectionTabActive : {}),
            }}
            onClick={() => setActiveSection(sec.id)}
          >
            {sec.label}
          </button>
        ))}
      </nav>

      {/* Error banner */}
      {error && (
        <div role="alert" style={styles.errorBanner}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Demographics ── */}
      {activeSection === 'demographics' && (
        <section aria-labelledby="sec-demographics">
          <h3 id="sec-demographics" style={styles.sectionTitle}>Client Demographics</h3>

          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="ifb-clientId">
              Client Identifier <span style={styles.required}>*</span>
              <span style={styles.hint}> (use pseudonym or initials for privacy)</span>
            </label>
            <input
              id="ifb-clientId"
              ref={firstFieldRef}
              type="text"
              style={styles.input}
              value={form.clientIdentifier}
              onChange={e => setField('clientIdentifier', e.target.value)}
              placeholder="e.g. J.D. or Client-42"
              maxLength={128}
              required
              autoComplete="off"
            />
          </div>

          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <label style={styles.label} htmlFor="ifb-dob">Date of Birth</label>
              <input
                id="ifb-dob"
                type="date"
                style={styles.input}
                value={form.dateOfBirth}
                onChange={e => setField('dateOfBirth', e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label} htmlFor="ifb-pronouns">Pronouns</label>
              <input
                id="ifb-pronouns"
                type="text"
                style={styles.input}
                value={form.pronouns}
                onChange={e => setField('pronouns', e.target.value)}
                placeholder="e.g. she/her, he/him, they/them"
                maxLength={64}
              />
            </div>
          </div>

          <h4 style={styles.subheading}>Guardian / Caregiver Contact <span style={styles.hint}>(optional)</span></h4>
          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <label style={styles.label} htmlFor="ifb-gName">Name</label>
              <input
                id="ifb-gName"
                type="text"
                style={styles.input}
                value={form.guardianName}
                onChange={e => setField('guardianName', e.target.value)}
                placeholder="Guardian name"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label} htmlFor="ifb-gPhone">Phone</label>
              <input
                id="ifb-gPhone"
                type="tel"
                style={styles.input}
                value={form.guardianPhone}
                onChange={e => setField('guardianPhone', e.target.value)}
                placeholder="Phone number"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label} htmlFor="ifb-gEmail">Email</label>
              <input
                id="ifb-gEmail"
                type="email"
                style={styles.input}
                value={form.guardianEmail}
                onChange={e => setField('guardianEmail', e.target.value)}
                placeholder="Email address"
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="ifb-notes">Additional Notes</label>
            <textarea
              id="ifb-notes"
              style={{ ...styles.input, height: '100px', resize: 'vertical' }}
              value={form.additionalNotes}
              onChange={e => setField('additionalNotes', e.target.value)}
              placeholder="Any additional intake notes or observations…"
            />
          </div>
        </section>
      )}

      {/* ── Dimension Ratings ── */}
      {activeSection === 'dimensions' && (
        <section aria-labelledby="sec-dimensions">
          <h3 id="sec-dimensions" style={styles.sectionTitle}>Resilience Dimension Self-Ratings</h3>
          <p style={styles.sectionDesc}>
            Rate the client's current functioning in each resilience dimension on a scale of 1–10.
            These scores serve as the baseline for outcome tracking.
          </p>

          {DIMENSIONS.map(dim => (
            <div key={dim.key} style={styles.dimRow}>
              <div style={styles.dimLabel}>
                <span style={styles.dimIcon}>{dim.icon}</span>
                <span style={{ fontWeight: 600, color: dim.color }}>{dim.label}</span>
              </div>
              <div style={styles.dimSliderWrap}>
                <span style={styles.dimScale}>1</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={form.dimensionRatings[dim.key]}
                  onChange={e => setDimensionRating(dim.key, e.target.value)}
                  style={{ flex: 1, accentColor: dim.color }}
                  aria-label={`${dim.label} rating`}
                />
                <span style={styles.dimScale}>10</span>
                <span
                  style={{
                    ...styles.dimValue,
                    background: dim.color,
                  }}
                >
                  {form.dimensionRatings[dim.key]}
                </span>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── Stressors ── */}
      {activeSection === 'stressors' && (
        <section aria-labelledby="sec-stressors">
          <h3 id="sec-stressors" style={styles.sectionTitle}>Current Stressors</h3>
          <p style={styles.sectionDesc}>
            Check all areas where the client is currently experiencing significant stress.
          </p>

          <div style={styles.checkboxGrid}>
            {STRESSOR_OPTIONS.map(opt => (
              <label key={opt.value} style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={form.currentStressors.includes(opt.value)}
                  onChange={() => toggleStressor(opt.value)}
                  style={styles.checkbox}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </section>
      )}

      {/* ── Support System ── */}
      {activeSection === 'support' && (
        <section aria-labelledby="sec-support">
          <h3 id="sec-support" style={styles.sectionTitle}>Support System Assessment</h3>
          <p style={styles.sectionDesc}>
            Rate the availability and quality of the client's support network.
          </p>

          <div style={styles.supportGrid}>
            {SUPPORT_FIELDS.map(field => (
              <div key={field.key} style={styles.supportRow}>
                <label style={{ ...styles.label, marginBottom: 0 }} htmlFor={`ifb-sup-${field.key}`}>
                  {field.label}
                </label>
                <select
                  id={`ifb-sup-${field.key}`}
                  style={styles.select}
                  value={form.supportSystem[field.key]}
                  onChange={e => setSupportField(field.key, e.target.value)}
                >
                  {SUPPORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Therapy Goals ── */}
      {activeSection === 'goals' && (
        <section aria-labelledby="sec-goals">
          <h3 id="sec-goals" style={styles.sectionTitle}>Therapy Goals</h3>
          <p style={styles.sectionDesc}>
            Enter 1–10 specific therapy goals for this client. At least one goal is required.
          </p>

          {form.therapyGoals.map((goal, i) => (
            <div key={i} style={styles.goalRow}>
              <span style={styles.goalNum}>{i + 1}.</span>
              <input
                type="text"
                style={{ ...styles.input, flex: 1, marginBottom: 0 }}
                value={goal}
                onChange={e => setGoal(i, e.target.value)}
                placeholder={`Goal ${i + 1}…`}
                aria-label={`Therapy goal ${i + 1}`}
              />
              {form.therapyGoals.length > 1 && (
                <button
                  type="button"
                  style={styles.removeBtn}
                  onClick={() => removeGoalRow(i)}
                  aria-label={`Remove goal ${i + 1}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {form.therapyGoals.length < 10 && (
            <button type="button" style={styles.addGoalBtn} onClick={addGoalRow}>
              + Add Goal
            </button>
          )}
        </section>
      )}

      {/* ── Actions ── */}
      <div style={styles.actions}>
        <button type="button" style={styles.cancelBtn} onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button
          type="button"
          style={styles.printBtn}
          onClick={handlePrint}
          disabled={saving}
        >
          🖨 Print / PDF
        </button>
        <button
          type="submit"
          style={{ ...styles.saveBtn, ...(saved ? styles.saveBtnSuccess : {}) }}
          disabled={saving || saved}
        >
          {saved ? '✓ Saved!' : saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Intake'}
        </button>
      </div>
    </form>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  form: {
    display:  'flex',
    flexDirection: 'column',
    gap:    '1.5rem',
  },
  sectionNav: {
    display:  'flex',
    flexWrap: 'wrap',
    gap:      '0.5rem',
  },
  sectionTab: {
    background:   '#f1f5f9',
    border:       '1.5px solid #cbd5e1',
    borderRadius: '8px',
    padding:      '0.45rem 1rem',
    fontSize:     '0.85rem',
    fontWeight:   600,
    cursor:       'pointer',
    color:        '#374151',
    transition:   'all 0.15s',
  },
  sectionTabActive: {
    background:   '#059669',
    borderColor:  '#059669',
    color:        '#fff',
  },
  errorBanner: {
    background:   '#fee2e2',
    border:       '1.5px solid #fca5a5',
    borderRadius: '8px',
    padding:      '0.75rem 1rem',
    color:        '#991b1b',
    fontSize:     '0.9rem',
  },
  sectionTitle: {
    fontSize:     '1.05rem',
    fontWeight:   700,
    color:        '#0f172a',
    margin:       '0 0 0.5rem',
  },
  sectionDesc: {
    fontSize:     '0.88rem',
    color:        '#64748b',
    margin:       '0 0 1.25rem',
  },
  subheading: {
    fontSize:     '0.95rem',
    fontWeight:   600,
    color:        '#374151',
    margin:       '1.25rem 0 0.75rem',
  },
  fieldGroup: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '0.4rem',
    marginBottom:  '1rem',
  },
  row: {
    display:   'flex',
    gap:       '0.75rem',
    flexWrap:  'wrap',
    marginBottom: '1rem',
  },
  label: {
    fontSize:   '0.85rem',
    fontWeight: 600,
    color:      '#374151',
  },
  required: {
    color: '#dc2626',
  },
  hint: {
    fontWeight: 400,
    color:      '#94a3b8',
    fontSize:   '0.8rem',
  },
  input: {
    width:        '100%',
    padding:      '0.55rem 0.75rem',
    border:       '1.5px solid #e2e8f0',
    borderRadius: '8px',
    fontSize:     '0.9rem',
    color:        '#0f172a',
    background:   '#fff',
    boxSizing:    'border-box',
    marginBottom: '0.25rem',
    outline:      'none',
  },
  select: {
    padding:      '0.5rem 0.75rem',
    border:       '1.5px solid #e2e8f0',
    borderRadius: '8px',
    fontSize:     '0.9rem',
    color:        '#0f172a',
    background:   '#fff',
    cursor:       'pointer',
    minWidth:     '160px',
  },

  // Dimension sliders
  dimRow: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '0.4rem',
    marginBottom:  '1.1rem',
    padding:       '0.85rem 1rem',
    background:    '#f8fafc',
    borderRadius:  '10px',
    border:        '1px solid #e2e8f0',
  },
  dimLabel: {
    display:    'flex',
    alignItems: 'center',
    gap:        '0.5rem',
  },
  dimIcon: {
    fontSize: '1.15rem',
  },
  dimSliderWrap: {
    display:    'flex',
    alignItems: 'center',
    gap:        '0.75rem',
  },
  dimScale: {
    fontSize:   '0.8rem',
    color:      '#94a3b8',
    fontWeight: 600,
    minWidth:   '12px',
  },
  dimValue: {
    color:        '#fff',
    fontWeight:   800,
    fontSize:     '0.9rem',
    borderRadius: '6px',
    padding:      '2px 10px',
    minWidth:     '32px',
    textAlign:    'center',
  },

  // Stressors
  checkboxGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap:                 '0.6rem',
  },
  checkboxLabel: {
    display:     'flex',
    alignItems:  'center',
    gap:         '0.5rem',
    fontSize:    '0.9rem',
    color:       '#374151',
    cursor:      'pointer',
    padding:     '0.5rem 0.75rem',
    background:  '#f8fafc',
    borderRadius: '8px',
    border:      '1.5px solid #e2e8f0',
  },
  checkbox: {
    accentColor: '#059669',
    width:       '16px',
    height:      '16px',
  },

  // Support system
  supportGrid: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '0.75rem',
  },
  supportRow: {
    display:     'flex',
    alignItems:  'center',
    justifyContent: 'space-between',
    gap:         '1rem',
    padding:     '0.65rem 1rem',
    background:  '#f8fafc',
    borderRadius: '8px',
    border:      '1.5px solid #e2e8f0',
  },

  // Goals
  goalRow: {
    display:     'flex',
    alignItems:  'center',
    gap:         '0.5rem',
    marginBottom: '0.65rem',
  },
  goalNum: {
    fontWeight:  700,
    color:       '#059669',
    minWidth:    '20px',
    fontSize:    '0.95rem',
  },
  removeBtn: {
    background:   'transparent',
    border:       '1.5px solid #fca5a5',
    borderRadius: '6px',
    color:        '#dc2626',
    cursor:       'pointer',
    fontSize:     '0.8rem',
    padding:      '0.3rem 0.6rem',
    lineHeight:   1,
  },
  addGoalBtn: {
    background:   'transparent',
    border:       '1.5px dashed #059669',
    borderRadius: '8px',
    color:        '#059669',
    cursor:       'pointer',
    fontSize:     '0.88rem',
    fontWeight:   600,
    padding:      '0.5rem 1.1rem',
    marginTop:    '0.25rem',
  },

  // Actions bar
  actions: {
    display:        'flex',
    justifyContent: 'flex-end',
    gap:            '0.75rem',
    flexWrap:       'wrap',
    marginTop:      '0.5rem',
    paddingTop:     '1rem',
    borderTop:      '2px solid #e2e8f0',
  },
  cancelBtn: {
    background:   '#f1f5f9',
    border:       '1.5px solid #cbd5e1',
    borderRadius: '10px',
    color:        '#374151',
    cursor:       'pointer',
    fontSize:     '0.92rem',
    fontWeight:   600,
    padding:      '0.6rem 1.25rem',
  },
  printBtn: {
    background:   '#f0fdf4',
    border:       '1.5px solid #6ee7b7',
    borderRadius: '10px',
    color:        '#065f46',
    cursor:       'pointer',
    fontSize:     '0.92rem',
    fontWeight:   600,
    padding:      '0.6rem 1.25rem',
  },
  saveBtn: {
    background:   '#059669',
    border:       'none',
    borderRadius: '10px',
    color:        '#fff',
    cursor:       'pointer',
    fontSize:     '0.92rem',
    fontWeight:   700,
    padding:      '0.6rem 1.5rem',
    transition:   'background 0.15s',
  },
  saveBtnSuccess: {
    background: '#047857',
  },
};
