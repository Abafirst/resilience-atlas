/**
 * PrintableActivitySheet.jsx
 * Print-optimised worksheet modal for a single IATLAS Kids activity.
 *
 * Renders the activity in a clean, parent/teacher-friendly layout with:
 *   – Activity name, age group, dimension, duration
 *   – Materials list
 *   – Step-by-step instructions
 *   – Parent/teacher notes
 *   – Reflection questions (with blank lines for writing)
 *   – "Print" button that calls window.print()
 *
 * Props:
 *   activity  {object}  — The activity data object (from kidsActivities.js)
 *   onClose() {func}    — Dismiss the modal
 */

import React from 'react';

const AGE_LABELS = {
  '5-7':   'Ages 5–7',
  '8-10':  'Ages 8–10',
  '11-14': 'Ages 11–14',
  '15-18': 'Ages 15–18',
};

const DIMENSION_LABELS = {
  'agentic-generative':    'Agentic & Generative',
  'somatic-regulative':    'Somatic & Regulative',
  'cognitive-narrative':   'Cognitive & Narrative',
  'relational-connective': 'Relational & Connective',
  'emotional-adaptive':    'Emotional & Adaptive',
  'spiritual-existential': 'Spiritual & Existential',
};

// ── Inline styles (used both on-screen and in the printed view) ──────────────

const STYLES = `
.pas-overlay {
  position: fixed; inset: 0; z-index: 1100;
  background: rgba(0,0,0,.55); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
  overflow-y: auto;
}
.pas-card {
  background: #fff; border-radius: 20px;
  padding: 2rem; width: 100%; max-width: 640px;
  box-shadow: 0 24px 60px rgba(0,0,0,.25);
  animation: pas-in .2s ease;
  position: relative;
}
.dark-mode .pas-card { background: #1e293b; color: #f1f5f9; }
@keyframes pas-in { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: none; } }

/* ── Worksheet header ────────────────────────────────────────────────────── */
.pas-header {
  border-bottom: 3px solid #4f46e5;
  padding-bottom: .85rem;
  margin-bottom: 1.25rem;
}
.pas-branding {
  font-size: .72rem; font-weight: 800; letter-spacing: .08em;
  color: #6366f1; text-transform: uppercase; margin-bottom: .3rem;
}
.pas-title {
  font-size: 1.35rem; font-weight: 800; color: #0f172a; margin: 0 0 .4rem;
  line-height: 1.25;
}
.dark-mode .pas-title { color: #f1f5f9; }
.pas-meta {
  display: flex; flex-wrap: wrap; gap: .5rem;
  font-size: .8rem; color: #64748b;
}
.dark-mode .pas-meta { color: #94a3b8; }
.pas-badge {
  display: inline-flex; align-items: center; gap: .25rem;
  padding: .18rem .6rem; border-radius: 20px;
  background: #f1f5f9; font-size: .75rem; font-weight: 600;
}
.dark-mode .pas-badge { background: #334155; color: #cbd5e1; }

/* ── Sections ────────────────────────────────────────────────────────────── */
.pas-section { margin-bottom: 1.1rem; }
.pas-section-title {
  font-size: .75rem; font-weight: 800; text-transform: uppercase;
  letter-spacing: .06em; color: #64748b; margin-bottom: .45rem;
}
.dark-mode .pas-section-title { color: #94a3b8; }

/* Learning goal */
.pas-goal {
  font-size: .9rem; font-style: italic; color: #475569; line-height: 1.5;
}
.dark-mode .pas-goal { color: #94a3b8; }

/* Materials */
.pas-materials { display: flex; flex-wrap: wrap; gap: .35rem; }
.pas-material-tag {
  background: #f1f5f9; border-radius: 6px;
  padding: .2rem .55rem; font-size: .8rem; color: #475569;
}
.dark-mode .pas-material-tag { background: #334155; color: #94a3b8; }

/* Steps */
.pas-steps { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: .45rem; }
.pas-step { display: flex; align-items: flex-start; gap: .6rem; font-size: .87rem; color: #374151; line-height: 1.55; }
.dark-mode .pas-step { color: #cbd5e1; }
.pas-step-num {
  background: #eef2ff; color: #4f46e5; border-radius: 50%;
  width: 22px; height: 22px; min-width: 22px;
  display: flex; align-items: center; justify-content: center;
  font-size: .72rem; font-weight: 700; margin-top: .1rem;
}
.dark-mode .pas-step-num { background: #1e2a40; color: #818cf8; }

/* Parent note */
.pas-parent-note {
  background: #fef3c7; border-left: 3px solid #f59e0b;
  padding: .6rem .85rem; border-radius: 0 8px 8px 0;
  font-size: .82rem; color: #78350f; line-height: 1.5;
}
.dark-mode .pas-parent-note { background: #2d2008; border-left-color: #d97706; color: #fcd34d; }
.pas-note-label { font-weight: 700; margin-right: .3rem; }

/* Reflection questions */
.pas-reflection-q { font-size: .87rem; color: #374151; margin-bottom: .25rem; font-weight: 600; }
.dark-mode .pas-reflection-q { color: #cbd5e1; }
.pas-reflection-line {
  border-bottom: 1px solid #cbd5e1; height: 1.6rem; margin: 0 0 .6rem;
}
.dark-mode .pas-reflection-line { border-bottom-color: #334155; }

/* ── Action bar ──────────────────────────────────────────────────────────── */
.pas-actions {
  display: flex; gap: .75rem; justify-content: flex-end; margin-top: 1.5rem;
  border-top: 1px solid #f1f5f9; padding-top: 1.1rem;
  flex-wrap: wrap;
}
.dark-mode .pas-actions { border-top-color: #334155; }
.pas-btn {
  padding: .6rem 1.2rem; border-radius: 10px; font-size: .9rem;
  font-weight: 700; cursor: pointer; border: none; transition: opacity .15s;
}
.pas-btn-cancel { background: #f1f5f9; color: #475569; }
.dark-mode .pas-btn-cancel { background: #334155; color: #cbd5e1; }
.pas-btn-print { background: #4f46e5; color: #fff; }
.pas-btn-print:hover { background: #4338ca; }

/* ── Print overrides (worksheet-specific) ────────────────────────────────── */
@media print {
  .pas-overlay {
    position: static; background: none; backdrop-filter: none;
    padding: 0; overflow: visible;
  }
  .pas-card {
    box-shadow: none; border-radius: 0;
    padding: 0; max-width: 100%; animation: none;
  }
  .pas-actions { display: none !important; }
  .pas-parent-note { background: #fffbeb; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

// ── Component ─────────────────────────────────────────────────────────────────

export default function PrintableActivitySheet({ activity, onClose }) {
  if (!activity) return null;

  function handlePrint() {
    window.print();
  }

  const ageLabel  = AGE_LABELS[activity.ageGroup] || activity.ageGroup || '';
  const dimLabel  = DIMENSION_LABELS[activity.dimension] || activity.dimension || '';
  const today     = new Date().toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <>
      <style>{STYLES}</style>
      <div
        className="pas-overlay"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pas-title"
      >
        <div className="pas-card">

          {/* ── Worksheet header ─────────────────────────────────────────── */}
          <div className="pas-header">
            <p className="pas-branding">IATLAS™ Activity Worksheet</p>
            <h2 className="pas-title" id="pas-title">{activity.title}</h2>
            <div className="pas-meta">
              {ageLabel  && <span className="pas-badge">{ageLabel}</span>}
              {dimLabel  && <span className="pas-badge">{dimLabel}</span>}
              {activity.duration && <span className="pas-badge">⏱ {activity.duration}</span>}
              {activity.difficulty && (
                <span className="pas-badge" style={{ textTransform: 'capitalize' }}>
                  {activity.difficulty}
                </span>
              )}
              <span className="pas-badge" style={{ marginLeft: 'auto' }}>{today}</span>
            </div>
          </div>

          {/* ── Learning goal ────────────────────────────────────────────── */}
          {activity.learningGoal && (
            <div className="pas-section">
              <p className="pas-section-title">Learning Goal</p>
              <p className="pas-goal">{activity.learningGoal}</p>
            </div>
          )}

          {/* ── Materials ────────────────────────────────────────────────── */}
          {activity.materials && activity.materials.length > 0 && (
            <div className="pas-section">
              <p className="pas-section-title">What You'll Need</p>
              <div className="pas-materials">
                {activity.materials.map((m, i) => (
                  <span key={i} className="pas-material-tag">{m}</span>
                ))}
              </div>
            </div>
          )}

          {/* ── Instructions ─────────────────────────────────────────────── */}
          {activity.instructions && activity.instructions.length > 0 && (
            <div className="pas-section">
              <p className="pas-section-title">Steps</p>
              <ol className="pas-steps">
                {activity.instructions.map((step, i) => (
                  <li key={i} className="pas-step">
                    <span className="pas-step-num" aria-hidden="true">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* ── Reflection questions ──────────────────────────────────────── */}
          {activity.reflectionQuestions && activity.reflectionQuestions.length > 0 && (
            <div className="pas-section">
              <p className="pas-section-title">Reflection Questions</p>
              {activity.reflectionQuestions.map((q, i) => (
                <div key={i}>
                  <p className="pas-reflection-q">{i + 1}. {q}</p>
                  <div className="pas-reflection-line" aria-hidden="true" />
                  <div className="pas-reflection-line" aria-hidden="true" />
                </div>
              ))}
            </div>
          )}

          {/* ── Parent / teacher note ─────────────────────────────────────── */}
          {activity.parentNote && (
            <div className="pas-section">
              <div className="pas-parent-note">
                <span className="pas-note-label">Parent / Teacher Note:</span>
                {activity.parentNote}
              </div>
            </div>
          )}

          {/* ── Actions ──────────────────────────────────────────────────── */}
          <div className="pas-actions no-print">
            <button
              type="button"
              className="pas-btn pas-btn-cancel"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="button"
              className="pas-btn pas-btn-print"
              onClick={handlePrint}
            >
              <img src="/icons/print.svg" alt="" aria-hidden="true" className="icon icon-sm" /> Print Worksheet
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
