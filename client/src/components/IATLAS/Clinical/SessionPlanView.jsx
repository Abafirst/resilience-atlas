/**
 * SessionPlanView.jsx
 * Read-only view of a single session plan.
 *
 * Props:
 *   plan     {object}   — session plan to display
 *   onClose  {function} — close/back handler
 *   onEdit   {function} — open edit form
 */

import React from 'react';

const DIMENSION_LABELS = {
  'agentic-generative':    'Agentic-Generative',
  'somatic-regulative':    'Somatic-Regulative',
  'cognitive-interpretive':'Cognitive-Interpretive',
  'emotional-adaptive':    'Emotional-Adaptive',
  'relational-integrative':'Relational-Integrative',
  'spiritual-existential': 'Spiritual-Existential',
};

const TREND_DISPLAY = {
  'making-progress': { label: '📈 Making Progress', color: '#059669', bg: '#d1fae5' },
  flat:              { label: '➡️ Flat',             color: '#d97706', bg: '#fef3c7' },
  regression:        { label: '📉 Regression',       color: '#dc2626', bg: '#fee2e2' },
  mastered:          { label: '🏆 Mastered',         color: '#7c3aed', bg: '#ede9fe' },
};

function formatDate(val) {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function Section({ title, children, icon }) {
  return (
    <div className="spv-section">
      <h3 className="spv-section-title">{icon} {title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="spv-field">
      <span className="spv-label">{label}</span>
      <span className="spv-value">{value}</span>
    </div>
  );
}

export default function SessionPlanView({ plan, onClose, onEdit }) {
  if (!plan) return null;

  const goals = (plan.sessionGoals || []).filter(Boolean);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="spv-container">

        {/* ── Header ── */}
        <div className="spv-header">
          <div>
            <span className="spv-client-badge">{plan.clientIdentifier}</span>
            <h2 className="spv-title">
              Session{plan.sessionNumber ? ` #${plan.sessionNumber}` : ''}
              {plan.sessionDate ? ` — ${formatDate(plan.sessionDate)}` : ''}
            </h2>
            {plan.dimensionalFocus && (
              <span className="spv-dim-badge">
                {DIMENSION_LABELS[plan.dimensionalFocus] || plan.dimensionalFocus}
              </span>
            )}
          </div>
          <div className="spv-header-actions">
            <button className="spv-btn spv-btn--secondary" onClick={onClose}>← Back</button>
            <button className="spv-btn spv-btn--primary" onClick={() => onEdit(plan)}>✏️ Edit</button>
          </div>
        </div>

        {/* ── Session Goals ── */}
        {goals.length > 0 && (
          <Section title="Session Goals" icon="🎯">
            <ul className="spv-list">
              {goals.map((g, i) => <li key={i}>{g}</li>)}
            </ul>
          </Section>
        )}

        {/* ── Activities Selected ── */}
        {(plan.activitiesSelected || []).length > 0 && (
          <Section title="Activities / Protocols" icon="📚">
            {plan.activitiesSelected.map((act, i) => (
              <div key={i} className="spv-card">
                <div className="spv-card-row">
                  <strong>{act.title}</strong>
                  {act.type && <span className="spv-tag">{act.type}</span>}
                </div>
                {act.reference && <p className="spv-muted">Ref: {act.reference}</p>}
                {act.notes && <p className="spv-notes">{act.notes}</p>}
              </div>
            ))}
          </Section>
        )}

        {/* ── Data Collected ── */}
        {(plan.dataCollected || []).length > 0 && (
          <Section title="Data Collected" icon="📊">
            <div className="spv-table-wrap">
              <table className="spv-table">
                <thead>
                  <tr>
                    <th>Target</th>
                    <th>Measurement</th>
                    <th>Value</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.dataCollected.map((row, i) => (
                    <tr key={i}>
                      <td>{row.target || '—'}</td>
                      <td>{row.measurement || '—'}</td>
                      <td>{row.value || '—'}</td>
                      <td>{row.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* ── Progress Toward Objectives ── */}
        {(plan.progressTowardObjectives || []).length > 0 && (
          <Section title="Progress Toward Objectives" icon="📈">
            {plan.progressTowardObjectives.map((obj, i) => {
              const td = obj.trend ? TREND_DISPLAY[obj.trend] : null;
              return (
                <div key={i} className="spv-card">
                  <div className="spv-card-row">
                    <strong>{obj.objectiveId || `Objective ${i + 1}`}</strong>
                    {td && (
                      <span className="spv-trend-badge" style={{ background: td.bg, color: td.color }}>
                        {td.label}
                      </span>
                    )}
                  </div>
                  {obj.notes && <p className="spv-notes">{obj.notes}</p>}
                </div>
              );
            })}
          </Section>
        )}

        {/* ── Generalization ── */}
        {plan.generalizationObserved && (
          <Section title="Generalization Observed" icon="🌐">
            <p className="spv-text">{plan.generalizationObserved}</p>
          </Section>
        )}

        {/* ── Session Notes ── */}
        {plan.sessionNotes && (
          <Section title="Session Notes" icon="📝">
            <p className="spv-text">{plan.sessionNotes}</p>
          </Section>
        )}

        {/* ── Homework Assigned ── */}
        {(plan.homeworkAssigned || []).length > 0 && (
          <Section title="Homework Assigned" icon="📌">
            {plan.homeworkAssigned.map((hw, i) => (
              <div key={i} className="spv-card">
                <div className="spv-card-row">
                  <span>{hw.task}</span>
                  {hw.completed
                    ? <span className="spv-tag spv-tag--green">✓ Completed</span>
                    : <span className="spv-tag spv-tag--gray">Pending</span>}
                </div>
                {hw.due && <p className="spv-muted">Due: {formatDate(hw.due)}</p>}
              </div>
            ))}
          </Section>
        )}

        {/* ── Plan for Next Session ── */}
        {plan.planForNextSession && (
          <Section title="Plan for Next Session" icon="🔮">
            <p className="spv-text">{plan.planForNextSession}</p>
          </Section>
        )}

        {/* ── Clinical Notes ── */}
        {plan.clinicalNotes && (
          <Section title="Clinical Notes (Private)" icon="🔒">
            <div className="spv-private-box">
              <p className="spv-text">{plan.clinicalNotes}</p>
            </div>
          </Section>
        )}

        {/* ── Meta ── */}
        <div className="spv-meta">
          {plan.createdAt && <span>Created {formatDate(plan.createdAt)}</span>}
          {plan.updatedAt && plan.updatedAt !== plan.createdAt && (
            <span>Updated {formatDate(plan.updatedAt)}</span>
          )}
        </div>

      </div>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const CSS = `
.spv-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #1e293b;
  max-width: 800px;
}

.spv-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.75rem;
  padding-bottom: 1.25rem;
  border-bottom: 2px solid #e2e8f0;
}

.spv-client-badge {
  display: inline-block;
  background: #dbeafe;
  color: #1e40af;
  padding: 0.2rem 0.65rem;
  border-radius: 99px;
  font-size: 0.82rem;
  font-weight: 700;
  margin-bottom: 0.4rem;
}

.spv-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0.2rem 0 0.4rem;
  color: #0f172a;
}

.spv-dim-badge {
  display: inline-block;
  background: #d1fae5;
  color: #065f46;
  padding: 0.2rem 0.65rem;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
}

.spv-header-actions {
  display: flex;
  gap: 0.6rem;
  flex-shrink: 0;
  align-items: flex-start;
}

.spv-section {
  margin-bottom: 1.5rem;
}
.spv-section-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #374151;
  margin: 0 0 0.75rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid #f1f5f9;
}

.spv-field {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}
.spv-label { color: #64748b; min-width: 140px; flex-shrink: 0; }
.spv-value { color: #1e293b; font-weight: 500; }

.spv-list {
  margin: 0;
  padding-left: 1.25rem;
  color: #1e293b;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.spv-card {
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.85rem 1rem;
  margin-bottom: 0.6rem;
  background: #f8fafc;
}
.spv-card-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  font-size: 0.9rem;
}

.spv-tag {
  display: inline-block;
  background: #e2e8f0;
  color: #475569;
  padding: 0.15rem 0.5rem;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 600;
}
.spv-tag--green { background: #d1fae5; color: #065f46; }
.spv-tag--gray  { background: #f1f5f9; color: #94a3b8; }

.spv-trend-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 99px;
  font-size: 0.78rem;
  font-weight: 600;
}

.spv-table-wrap { overflow-x: auto; }
.spv-table {
  width: 100%; border-collapse: collapse;
  font-size: 0.875rem;
}
.spv-table th, .spv-table td {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
}
.spv-table th {
  background: #f1f5f9;
  font-weight: 600;
  color: #374151;
}

.spv-text  { font-size: 0.9rem; color: #374151; line-height: 1.6; white-space: pre-wrap; margin: 0; }
.spv-muted { font-size: 0.8rem; color: #94a3b8; margin: 0.25rem 0 0; }
.spv-notes { font-size: 0.85rem; color: #64748b; margin: 0.35rem 0 0; }

.spv-private-box {
  background: #fef9c3;
  border: 1.5px solid #fde047;
  border-radius: 8px;
  padding: 0.85rem 1rem;
}

.spv-meta {
  display: flex;
  gap: 1.25rem;
  color: #94a3b8;
  font-size: 0.78rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
  margin-top: 1.5rem;
}

.spv-btn {
  padding: 0.55rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s;
}
.spv-btn--primary   { background: #059669; color: #fff; }
.spv-btn--primary:hover { background: #047857; }
.spv-btn--secondary { background: #f1f5f9; color: #374151; border: 1.5px solid #cbd5e1; }
.spv-btn--secondary:hover { background: #e2e8f0; }

@media (max-width: 600px) {
  .spv-title { font-size: 1.15rem; }
  .spv-header { flex-direction: column-reverse; }
  .spv-header-actions { width: 100%; justify-content: flex-start; }
  .spv-field { flex-direction: column; gap: 0.1rem; }
  .spv-label { min-width: unset; }
}

[data-theme="dark"] .spv-container  { color: #e2e8f0; }
[data-theme="dark"] .spv-title      { color: #f8fafc; }
[data-theme="dark"] .spv-card       { background: #1e293b; border-color: #334155; }
[data-theme="dark"] .spv-text       { color: #cbd5e1; }
[data-theme="dark"] .spv-table th   { background: #1e293b; color: #94a3b8; }
[data-theme="dark"] .spv-table th, [data-theme="dark"] .spv-table td { border-color: #334155; }
[data-theme="dark"] .spv-private-box { background: #422006; border-color: #854d0e; }
[data-theme="dark"] .spv-header     { border-color: #334155; }
[data-theme="dark"] .spv-section-title { border-color: #1e293b; }
`;
