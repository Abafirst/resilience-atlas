/**
 * SessionPlanBuilder.jsx
 * Create or edit an IATLAS clinical session plan.
 *
 * Props:
 *   plan           {object|null}   — existing plan for edit mode; null for create
 *   onSave         {function}      — called with the saved plan object
 *   onCancel       {function}      — called when the user cancels
 *   getTokenFn     {function}      — Auth0 getAccessTokenSilently
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiUrl } from '../../../api/baseUrl.js';

const DIMENSIONS = [
  { value: '',                        label: '— Select dimension —' },
  { value: 'agentic-generative',      label: 'Agentic-Generative' },
  { value: 'somatic-regulative',      label: 'Somatic-Regulative' },
  { value: 'cognitive-interpretive',  label: 'Cognitive-Interpretive' },
  { value: 'emotional-adaptive',      label: 'Emotional-Adaptive' },
  { value: 'relational-integrative',  label: 'Relational-Integrative' },
  { value: 'spiritual-existential',   label: 'Spiritual-Existential' },
];

const PROGRESS_TREND_OPTIONS = [
  { value: '',                label: '— Select —' },
  { value: 'making-progress', label: 'Making Progress' },
  { value: 'flat',            label: 'Flat' },
  { value: 'regression',      label: 'Regression' },
  { value: 'mastered',        label: 'Mastered' },
];

const DRAFT_KEY = 'iatlas_session_plan_draft';

function emptyPlan() {
  return {
    clientIdentifier:         '',
    sessionDate:              '',
    sessionNumber:            '',
    dimensionalFocus:         '',
    sessionGoals:             [''],
    activitiesSelected:       [],
    sessionNotes:             '',
    dataCollected:            [],
    progressTowardObjectives: [],
    generalizationObserved:   '',
    homeworkAssigned:         [],
    planForNextSession:       '',
    clinicalNotes:            '',
  };
}

export default function SessionPlanBuilder({ plan, onSave, onCancel, getTokenFn }) {
  const isEdit = Boolean(plan);
  const [activeTab, setActiveTab] = useState('overview');
  const [form, setForm] = useState(() => {
    if (plan) {
      return {
        clientIdentifier:         plan.clientIdentifier         || '',
        sessionDate:              plan.sessionDate ? plan.sessionDate.slice(0, 10) : '',
        sessionNumber:            plan.sessionNumber            != null ? String(plan.sessionNumber) : '',
        dimensionalFocus:         plan.dimensionalFocus         || '',
        sessionGoals:             plan.sessionGoals?.length     ? plan.sessionGoals : [''],
        activitiesSelected:       plan.activitiesSelected       || [],
        sessionNotes:             plan.sessionNotes             || '',
        dataCollected:            plan.dataCollected            || [],
        progressTowardObjectives: plan.progressTowardObjectives || [],
        generalizationObserved:   plan.generalizationObserved   || '',
        homeworkAssigned:         plan.homeworkAssigned         || [],
        planForNextSession:       plan.planForNextSession       || '',
        clinicalNotes:            plan.clinicalNotes            || '',
      };
    }
    // Restore draft from localStorage for create mode.
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return emptyPlan();
  });

  const [errors, setErrors]     = useState({});
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState('');
  const autoSaveTimer = useRef(null);

  // Auto-save draft to localStorage (create mode only).
  useEffect(() => {
    if (isEdit) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch (_) {}
    }, 1000);
    return () => clearTimeout(autoSaveTimer.current);
  }, [form, isEdit]);

  // ── Field helpers ────────────────────────────────────────────────────────────

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const setListItem = (field, index, updater) => {
    setForm(f => {
      const arr = [...f[field]];
      arr[index] = typeof updater === 'function' ? updater(arr[index]) : updater;
      return { ...f, [field]: arr };
    });
  };

  const addListItem = (field, template) =>
    setForm(f => ({ ...f, [field]: [...f[field], template] }));

  const removeListItem = (field, index) =>
    setForm(f => ({ ...f, [field]: f[field].filter((_, i) => i !== index) }));

  // ── Validation ───────────────────────────────────────────────────────────────

  const validate = useCallback(() => {
    const e = {};
    if (!form.clientIdentifier.trim()) e.clientIdentifier = 'Client identifier is required.';
    return e;
  }, [form]);

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setErrors({});
    setSaving(true);
    setSaveError('');

    try {
      let token = '';
      if (typeof getTokenFn === 'function') {
        try { token = await getTokenFn(); } catch (tokenErr) {
          console.warn('[SessionPlanBuilder] Could not get access token:', tokenErr?.message);
        }
      }

      const payload = {
        ...form,
        sessionNumber: form.sessionNumber !== '' ? Number(form.sessionNumber) : null,
        sessionGoals:  form.sessionGoals.filter(g => g.trim()),
      };

      const url    = isEdit
        ? apiUrl(`/api/iatlas/clinical/session-plans/${plan.sessionPlanId}`)
        : apiUrl('/api/iatlas/clinical/session-plans');
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save session plan.');
      }

      const saved = await res.json();
      // Clear draft on successful create.
      if (!isEdit) { try { localStorage.removeItem(DRAFT_KEY); } catch (_) {} }
      onSave(saved);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Tabs ──────────────────────────────────────────────────────────────────────

  const TABS = [
    { id: 'overview',   label: 'Overview' },
    { id: 'activities', label: 'Activities' },
    { id: 'data',       label: 'Data' },
    { id: 'progress',   label: 'Progress' },
    { id: 'notes',      label: 'Notes' },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <form className="spb-form" onSubmit={handleSubmit} noValidate>

        {/* ── Tabs ── */}
        <div className="spb-tabs" role="tablist">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              className={`spb-tab${activeTab === t.id ? ' spb-tab--active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <div className="spb-section">
            <div className="spb-row spb-row--2">
              <div className="spb-field">
                <label className="spb-label" htmlFor="clientIdentifier">
                  Client Identifier <span className="spb-req">*</span>
                </label>
                <input
                  id="clientIdentifier"
                  className={`spb-input${errors.clientIdentifier ? ' spb-input--error' : ''}`}
                  type="text"
                  placeholder="e.g. Client A or initials"
                  value={form.clientIdentifier}
                  onChange={e => set('clientIdentifier', e.target.value)}
                  maxLength={128}
                />
                {errors.clientIdentifier && (
                  <span className="spb-error">{errors.clientIdentifier}</span>
                )}
                <span className="spb-hint">Use initials or a non-identifying code — do not enter full names.</span>
              </div>

              <div className="spb-field">
                <label className="spb-label" htmlFor="sessionDate">Session Date</label>
                <input
                  id="sessionDate"
                  className="spb-input"
                  type="date"
                  value={form.sessionDate}
                  onChange={e => set('sessionDate', e.target.value)}
                />
              </div>
            </div>

            <div className="spb-row spb-row--2">
              <div className="spb-field">
                <label className="spb-label" htmlFor="sessionNumber">Session #</label>
                <input
                  id="sessionNumber"
                  className="spb-input"
                  type="number"
                  min="1"
                  placeholder="e.g. 5"
                  value={form.sessionNumber}
                  onChange={e => set('sessionNumber', e.target.value)}
                />
              </div>

              <div className="spb-field">
                <label className="spb-label" htmlFor="dimensionalFocus">Dimensional Focus</label>
                <select
                  id="dimensionalFocus"
                  className="spb-input"
                  value={form.dimensionalFocus}
                  onChange={e => set('dimensionalFocus', e.target.value)}
                >
                  {DIMENSIONS.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Session goals */}
            <div className="spb-field">
              <label className="spb-label">Session Goals</label>
              {form.sessionGoals.map((goal, i) => (
                <div key={i} className="spb-list-row">
                  <input
                    className="spb-input"
                    type="text"
                    placeholder={`Goal ${i + 1}`}
                    value={goal}
                    onChange={e => setListItem('sessionGoals', i, e.target.value)}
                  />
                  {form.sessionGoals.length > 1 && (
                    <button
                      type="button"
                      className="spb-btn-icon"
                      aria-label="Remove goal"
                      onClick={() => removeListItem('sessionGoals', i)}
                    >✕</button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="spb-btn-add"
                onClick={() => addListItem('sessionGoals', '')}
              >+ Add Goal</button>
            </div>
          </div>
        )}

        {/* ── Activities ── */}
        {activeTab === 'activities' && (
          <div className="spb-section">
            <p className="spb-hint">Add protocols or activities selected for this session.</p>
            {form.activitiesSelected.map((act, i) => (
              <div key={i} className="spb-card">
                <div className="spb-card-header">
                  <strong>Activity {i + 1}</strong>
                  <button
                    type="button"
                    className="spb-btn-icon"
                    aria-label="Remove activity"
                    onClick={() => removeListItem('activitiesSelected', i)}
                  >✕</button>
                </div>
                <div className="spb-row spb-row--2">
                  <div className="spb-field">
                    <label className="spb-label">Type</label>
                    <select
                      className="spb-input"
                      value={act.type || 'activity'}
                      onChange={e => setListItem('activitiesSelected', i, v => ({ ...v, type: e.target.value }))}
                    >
                      <option value="protocol">Protocol</option>
                      <option value="activity">Activity</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div className="spb-field">
                    <label className="spb-label">Title <span className="spb-req">*</span></label>
                    <input
                      className="spb-input"
                      type="text"
                      placeholder="e.g. Box Breathing Protocol"
                      value={act.title || ''}
                      onChange={e => setListItem('activitiesSelected', i, v => ({ ...v, title: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="spb-field">
                  <label className="spb-label">Reference / Path</label>
                  <input
                    className="spb-input"
                    type="text"
                    placeholder="e.g. aba-protocols/somatic-regulative/protocol-2"
                    value={act.reference || ''}
                    onChange={e => setListItem('activitiesSelected', i, v => ({ ...v, reference: e.target.value }))}
                  />
                </div>
                <div className="spb-field">
                  <label className="spb-label">Notes</label>
                  <textarea
                    className="spb-input spb-textarea"
                    rows={2}
                    value={act.notes || ''}
                    onChange={e => setListItem('activitiesSelected', i, v => ({ ...v, notes: e.target.value }))}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              className="spb-btn-add"
              onClick={() => addListItem('activitiesSelected', { type: 'activity', title: '', reference: '', notes: '' })}
            >+ Add Activity</button>
          </div>
        )}

        {/* ── Data Collection ── */}
        {activeTab === 'data' && (
          <div className="spb-section">
            <p className="spb-hint">Record data collected during the session.</p>
            {form.dataCollected.length > 0 && (
              <div className="spb-table-wrap">
                <table className="spb-table">
                  <thead>
                    <tr>
                      <th>Target</th>
                      <th>Measurement</th>
                      <th>Value</th>
                      <th>Notes</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.dataCollected.map((row, i) => (
                      <tr key={i}>
                        <td>
                          <input
                            className="spb-input spb-input--sm"
                            type="text"
                            value={row.target || ''}
                            onChange={e => setListItem('dataCollected', i, v => ({ ...v, target: e.target.value }))}
                          />
                        </td>
                        <td>
                          <input
                            className="spb-input spb-input--sm"
                            type="text"
                            placeholder="e.g. % correct"
                            value={row.measurement || ''}
                            onChange={e => setListItem('dataCollected', i, v => ({ ...v, measurement: e.target.value }))}
                          />
                        </td>
                        <td>
                          <input
                            className="spb-input spb-input--sm"
                            type="text"
                            value={row.value || ''}
                            onChange={e => setListItem('dataCollected', i, v => ({ ...v, value: e.target.value }))}
                          />
                        </td>
                        <td>
                          <input
                            className="spb-input spb-input--sm"
                            type="text"
                            value={row.notes || ''}
                            onChange={e => setListItem('dataCollected', i, v => ({ ...v, notes: e.target.value }))}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="spb-btn-icon"
                            aria-label="Remove row"
                            onClick={() => removeListItem('dataCollected', i)}
                          >✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button
              type="button"
              className="spb-btn-add"
              onClick={() => addListItem('dataCollected', { target: '', measurement: '', value: '', notes: '' })}
            >+ Add Data Row</button>

            <div className="spb-field" style={{ marginTop: '1.5rem' }}>
              <label className="spb-label">Generalization Observed</label>
              <textarea
                className="spb-input spb-textarea"
                rows={3}
                placeholder="Note any generalization of skills observed outside of the session context."
                value={form.generalizationObserved}
                onChange={e => set('generalizationObserved', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ── Progress ── */}
        {activeTab === 'progress' && (
          <div className="spb-section">
            <p className="spb-hint">Track progress toward treatment objectives.</p>
            {form.progressTowardObjectives.map((obj, i) => (
              <div key={i} className="spb-card">
                <div className="spb-card-header">
                  <strong>Objective {i + 1}</strong>
                  <button
                    type="button"
                    className="spb-btn-icon"
                    aria-label="Remove objective"
                    onClick={() => removeListItem('progressTowardObjectives', i)}
                  >✕</button>
                </div>
                <div className="spb-row spb-row--2">
                  <div className="spb-field">
                    <label className="spb-label">Objective ID / Label</label>
                    <input
                      className="spb-input"
                      type="text"
                      placeholder="e.g. OBJ-1 or Breath Regulation"
                      value={obj.objectiveId || ''}
                      onChange={e => setListItem('progressTowardObjectives', i, v => ({ ...v, objectiveId: e.target.value }))}
                    />
                  </div>
                  <div className="spb-field">
                    <label className="spb-label">Trend</label>
                    <select
                      className="spb-input"
                      value={obj.trend || ''}
                      onChange={e => setListItem('progressTowardObjectives', i, v => ({ ...v, trend: e.target.value }))}
                    >
                      {PROGRESS_TREND_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="spb-field">
                  <label className="spb-label">Notes</label>
                  <textarea
                    className="spb-input spb-textarea"
                    rows={2}
                    value={obj.notes || ''}
                    onChange={e => setListItem('progressTowardObjectives', i, v => ({ ...v, notes: e.target.value }))}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              className="spb-btn-add"
              onClick={() => addListItem('progressTowardObjectives', { objectiveId: '', trend: '', notes: '' })}
            >+ Add Objective</button>
          </div>
        )}

        {/* ── Notes ── */}
        {activeTab === 'notes' && (
          <div className="spb-section">
            <div className="spb-field">
              <label className="spb-label" htmlFor="sessionNotes">Session Notes</label>
              <textarea
                id="sessionNotes"
                className="spb-input spb-textarea"
                rows={5}
                placeholder="Narrative summary of what occurred during this session."
                value={form.sessionNotes}
                onChange={e => set('sessionNotes', e.target.value)}
              />
            </div>

            <div className="spb-field">
              <label className="spb-label">Homework Assigned</label>
              {form.homeworkAssigned.map((hw, i) => (
                <div key={i} className="spb-card">
                  <div className="spb-card-header">
                    <strong>Task {i + 1}</strong>
                    <button
                      type="button"
                      className="spb-btn-icon"
                      aria-label="Remove homework"
                      onClick={() => removeListItem('homeworkAssigned', i)}
                    >✕</button>
                  </div>
                  <div className="spb-row spb-row--2">
                    <div className="spb-field">
                      <label className="spb-label">Task Description <span className="spb-req">*</span></label>
                      <input
                        className="spb-input"
                        type="text"
                        value={hw.task || ''}
                        onChange={e => setListItem('homeworkAssigned', i, v => ({ ...v, task: e.target.value }))}
                      />
                    </div>
                    <div className="spb-field">
                      <label className="spb-label">Due Date</label>
                      <input
                        className="spb-input"
                        type="date"
                        value={hw.due ? hw.due.slice(0, 10) : ''}
                        onChange={e => setListItem('homeworkAssigned', i, v => ({ ...v, due: e.target.value || null }))}
                      />
                    </div>
                  </div>
                  <div className="spb-field">
                    <label className="spb-check-label">
                      <input
                        type="checkbox"
                        checked={hw.completed || false}
                        onChange={e => setListItem('homeworkAssigned', i, v => ({ ...v, completed: e.target.checked }))}
                      />
                      Completed
                    </label>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="spb-btn-add"
                onClick={() => addListItem('homeworkAssigned', { task: '', due: null, completed: false })}
              >+ Add Homework</button>
            </div>

            <div className="spb-field">
              <label className="spb-label" htmlFor="planForNextSession">Plan for Next Session</label>
              <textarea
                id="planForNextSession"
                className="spb-input spb-textarea"
                rows={4}
                placeholder="Outline what will be covered in the next session."
                value={form.planForNextSession}
                onChange={e => set('planForNextSession', e.target.value)}
              />
            </div>

            <div className="spb-field">
              <label className="spb-label" htmlFor="clinicalNotes">Clinical Notes (Private)</label>
              <textarea
                id="clinicalNotes"
                className="spb-input spb-textarea"
                rows={4}
                placeholder="Private clinical observations not shared with the client."
                value={form.clinicalNotes}
                onChange={e => set('clinicalNotes', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        {saveError && <p className="spb-save-error">{saveError}</p>}
        <div className="spb-footer">
          <button type="button" className="spb-btn spb-btn--secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="spb-btn spb-btn--primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update Plan' : 'Create Plan'}
          </button>
        </div>
      </form>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const CSS = `
.spb-form {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #1e293b;
}

.spb-tabs {
  display: flex;
  gap: 0.25rem;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.spb-tab {
  background: none;
  border: none;
  padding: 0.6rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  border-radius: 4px 4px 0 0;
  transition: color 0.15s, border-color 0.15s;
}
.spb-tab:hover { color: #0f172a; }
.spb-tab--active { color: #059669; border-bottom-color: #059669; }

.spb-section { padding: 0.25rem 0 1rem; }

.spb-row { display: flex; gap: 1rem; flex-wrap: wrap; }
.spb-row--2 > * { flex: 1; min-width: 200px; }

.spb-field { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1rem; }

.spb-label { font-size: 0.85rem; font-weight: 600; color: #374151; }
.spb-req   { color: #ef4444; }
.spb-hint  { font-size: 0.78rem; color: #94a3b8; }

.spb-input {
  padding: 0.55rem 0.75rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1e293b;
  background: #fff;
  transition: border-color 0.15s;
  width: 100%;
  box-sizing: border-box;
}
.spb-input:focus { outline: none; border-color: #059669; }
.spb-input--error { border-color: #ef4444; }
.spb-input--sm { padding: 0.4rem 0.55rem; font-size: 0.82rem; }
.spb-textarea { resize: vertical; min-height: 80px; font-family: inherit; }

.spb-error { color: #ef4444; font-size: 0.78rem; }

.spb-card {
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  background: #f8fafc;
}
.spb-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.spb-list-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.spb-table-wrap { overflow-x: auto; margin-bottom: 0.5rem; }
.spb-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.spb-table th, .spb-table td {
  padding: 0.5rem 0.5rem;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
}
.spb-table th { font-weight: 600; color: #374151; background: #f1f5f9; }

.spb-btn-add {
  background: none;
  border: 1.5px dashed #cbd5e1;
  border-radius: 8px;
  padding: 0.45rem 1rem;
  font-size: 0.85rem;
  color: #059669;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: border-color 0.15s;
}
.spb-btn-add:hover { border-color: #059669; }

.spb-btn-icon {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  flex-shrink: 0;
}
.spb-btn-icon:hover { color: #ef4444; background: #fee2e2; }

.spb-check-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; }

.spb-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1.25rem;
  border-top: 1.5px solid #e2e8f0;
  margin-top: 1.5rem;
}

.spb-btn {
  padding: 0.65rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s;
}
.spb-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.spb-btn--primary  { background: #059669; color: #fff; }
.spb-btn--primary:hover:not(:disabled) { background: #047857; }
.spb-btn--secondary { background: #f1f5f9; color: #374151; border: 1.5px solid #cbd5e1; }
.spb-btn--secondary:hover { background: #e2e8f0; }

.spb-save-error {
  color: #ef4444;
  font-size: 0.85rem;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  margin-top: 0.75rem;
}

@media (max-width: 600px) {
  .spb-row--2 > * { min-width: 100%; }
  .spb-tabs { gap: 0; }
  .spb-tab { padding: 0.5rem 0.6rem; font-size: 0.8rem; }
}

[data-theme="dark"] .spb-form,
[data-theme="dark"] .spb-input,
[data-theme="dark"] .spb-card {
  background: #1e293b;
  color: #e2e8f0;
  border-color: #334155;
}
[data-theme="dark"] .spb-input { background: #0f172a; color: #e2e8f0; }
[data-theme="dark"] .spb-label { color: #94a3b8; }
[data-theme="dark"] .spb-table th { background: #1e293b; color: #94a3b8; }
[data-theme="dark"] .spb-table th, [data-theme="dark"] .spb-table td { border-color: #334155; }
`;
