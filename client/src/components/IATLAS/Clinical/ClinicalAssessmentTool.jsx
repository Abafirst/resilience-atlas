/**
 * ClinicalAssessmentTool.jsx
 * Validated clinical rating scale interface for IATLAS Practitioner tier.
 *
 * Supports:
 *   PHQ-9  — Patient Health Questionnaire-9 (depression severity)
 *   GAD-7  — Generalized Anxiety Disorder-7 (anxiety severity)
 *
 * Results are saved to /api/clinical/scales which stores them in the
 * ClinicalScale MongoDB model.
 *
 * Usage:
 *   <ClinicalAssessmentTool clientProfileId="abc123" onSaved={fn} />
 */

import React, { useState } from 'react';
import apiFetch, { getAuth0CachedToken } from '../../../lib/apiFetch.js';

// ── Scale definitions ─────────────────────────────────────────────────────────

const RESPONSE_OPTIONS = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
];

const SCALES = {
  'PHQ-9': {
    name:        'PHQ-9',
    fullName:    'Patient Health Questionnaire-9',
    description: 'Measures depression severity over the past 2 weeks.',
    citation:    'Kroenke K, Spitzer RL, Williams JBW. JAMA Intern Med. 2001.',
    instructions: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
    questions: [
      { id: 'phq1',  text: 'Little interest or pleasure in doing things' },
      { id: 'phq2',  text: 'Feeling down, depressed, or hopeless' },
      { id: 'phq3',  text: 'Trouble falling or staying asleep, or sleeping too much' },
      { id: 'phq4',  text: 'Feeling tired or having little energy' },
      { id: 'phq5',  text: 'Poor appetite or overeating' },
      { id: 'phq6',  text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down' },
      { id: 'phq7',  text: 'Trouble concentrating on things, such as reading the newspaper or watching television' },
      { id: 'phq8',  text: 'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual' },
      { id: 'phq9',  text: 'Thoughts that you would be better off dead, or of hurting yourself in some way' },
    ],
    severityBands: [
      { max: 4,  band: 'minimal',           label: 'Minimal depression',          color: '#10b981', bg: '#d1fae5' },
      { max: 9,  band: 'mild',              label: 'Mild depression',             color: '#f59e0b', bg: '#fef3c7' },
      { max: 14, band: 'moderate',          label: 'Moderate depression',         color: '#f97316', bg: '#ffedd5' },
      { max: 19, band: 'moderately_severe', label: 'Moderately severe depression', color: '#ef4444', bg: '#fee2e2' },
      { max: 27, band: 'severe',            label: 'Severe depression',           color: '#7f1d1d', bg: '#fecaca' },
    ],
    maxScore: 27,
  },
  'GAD-7': {
    name:        'GAD-7',
    fullName:    'Generalized Anxiety Disorder-7',
    description: 'Measures generalised anxiety severity over the past 2 weeks.',
    citation:    'Spitzer RL, Kroenke K, Williams JBW, Löwe B. Arch Intern Med. 2006.',
    instructions: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
    questions: [
      { id: 'gad1', text: 'Feeling nervous, anxious, or on edge' },
      { id: 'gad2', text: 'Not being able to stop or control worrying' },
      { id: 'gad3', text: 'Worrying too much about different things' },
      { id: 'gad4', text: 'Trouble relaxing' },
      { id: 'gad5', text: 'Being so restless that it is hard to sit still' },
      { id: 'gad6', text: 'Becoming easily annoyed or irritable' },
      { id: 'gad7', text: 'Feeling afraid, as if something awful might happen' },
    ],
    severityBands: [
      { max: 4,  band: 'minimal',  label: 'Minimal anxiety',  color: '#10b981', bg: '#d1fae5' },
      { max: 9,  band: 'mild',     label: 'Mild anxiety',     color: '#f59e0b', bg: '#fef3c7' },
      { max: 14, band: 'moderate', label: 'Moderate anxiety', color: '#f97316', bg: '#ffedd5' },
      { max: 21, band: 'severe',   label: 'Severe anxiety',   color: '#ef4444', bg: '#fee2e2' },
    ],
    maxScore: 21,
  },
};

// ── Styles ────────────────────────────────────────────────────────────────────

const STYLES = `
.cat-wrap {
  max-width: 740px;
  margin: 0 auto;
  font-family: inherit;
}
.cat-tabs {
  display: flex;
  gap: .4rem;
  margin-bottom: 1.25rem;
}
.cat-tab {
  flex: 1;
  padding: .65rem 1rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  font-size: .88rem;
  font-weight: 700;
  color: #374151;
  cursor: pointer;
  text-align: center;
  transition: all .15s;
}
.cat-tab:hover { background: #f8fafc; }
.cat-tab.cat-tab-active {
  background: #eef2ff;
  border-color: #6366f1;
  color: #4f46e5;
}
.cat-meta {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: .9rem 1.1rem;
  margin-bottom: 1.25rem;
  font-size: .83rem;
  color: #475569;
  line-height: 1.55;
}
.cat-meta strong { color: #1e293b; }
.cat-instructions {
  font-size: .9rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1.1rem;
  padding: .6rem .85rem;
  background: #eff6ff;
  border-left: 3px solid #6366f1;
  border-radius: 0 8px 8px 0;
}
.cat-question {
  margin-bottom: 1.1rem;
  padding: 1rem 1.1rem;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
}
.cat-question.cat-q-answered { border-color: #a5b4fc; background: #fafaff; }
.cat-question.cat-q-warning  { border-color: #fca5a5; background: #fff5f5; }
.cat-q-num  { font-size: .72rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; margin-bottom: .3rem; }
.cat-q-text { font-size: .9rem; font-weight: 600; color: #1e293b; margin-bottom: .8rem; line-height: 1.45; }
.cat-options { display: flex; flex-wrap: wrap; gap: .4rem; }
.cat-option {
  flex: 1 1 140px;
  display: flex; align-items: center; gap: .45rem;
  padding: .45rem .75rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: .82rem;
  font-weight: 500;
  color: #374151;
  background: #fff;
  transition: all .12s;
  user-select: none;
}
.cat-option:hover { background: #f1f5f9; border-color: #c7d2fe; }
.cat-option.cat-option-selected {
  background: #eef2ff;
  border-color: #6366f1;
  color: #4f46e5;
  font-weight: 700;
}
.cat-option input[type="radio"] { accent-color: #6366f1; }
.cat-score-bar {
  margin: 1.5rem 0;
  padding: 1rem 1.1rem;
  border-radius: 12px;
  border: 2px solid transparent;
}
.cat-score-bar p { margin: 0; }
.cat-score-label { font-size: .78rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; margin-bottom: .2rem; }
.cat-score-value { font-size: 2rem; font-weight: 900; }
.cat-score-band  { font-size: .88rem; font-weight: 600; margin-top: .2rem; }
.cat-progress-bg { height: 10px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin-top: .6rem; }
.cat-progress-fill { height: 100%; border-radius: 999px; transition: width .5s ease; }
.cat-notes-label { font-size: .78rem; font-weight: 700; color: #374151; margin-bottom: .35rem; }
.cat-notes-input {
  width: 100%;
  padding: .55rem .75rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: .88rem;
  resize: vertical;
  box-sizing: border-box;
  outline: none;
}
.cat-notes-input:focus { border-color: #6366f1; }
.cat-actions { display: flex; gap: .75rem; justify-content: flex-end; margin-top: 1.25rem; flex-wrap: wrap; }
.cat-btn {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .6rem 1.4rem;
  border: none; border-radius: 8px;
  font-size: .88rem; font-weight: 700; cursor: pointer;
  transition: background .15s;
}
.cat-btn-primary  { background: #6366f1; color: #fff; }
.cat-btn-primary:hover { background: #4f46e5; }
.cat-btn-primary:disabled { background: #a5b4fc; cursor: not-allowed; }
.cat-btn-secondary { background: #f1f5f9; color: #374151; }
.cat-btn-secondary:hover { background: #e2e8f0; }
.cat-alert {
  padding: .55rem .85rem;
  border-radius: 8px;
  font-size: .83rem;
  margin-bottom: .75rem;
}
.cat-alert-error   { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }
.cat-alert-success { background: #f0fdf4; color: #15803d; border: 1px solid #86efac; }
.cat-warning-note {
  background: #fff7ed;
  border: 1.5px solid #fed7aa;
  border-radius: 10px;
  padding: .75rem 1rem;
  margin: 1rem 0;
  font-size: .83rem;
  color: #92400e;
}
@media (max-width: 480px) {
  .cat-option { flex: 1 1 100%; }
}
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeScore(scale, answers) {
  return scale.questions.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0);
}

function getSeverity(scale, score) {
  return scale.severityBands.find(b => score <= b.max) || scale.severityBands[scale.severityBands.length - 1];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ClinicalAssessmentTool({ clientProfileId, onSaved }) {
  const [activeScale, setActiveScale] = useState('PHQ-9');
  const [answers,     setAnswers]     = useState({});
  const [notes,       setNotes]       = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState(null);
  const [savedResult, setSavedResult] = useState(null);

  const scale      = SCALES[activeScale];
  const totalScore = computeScore(scale, answers);
  const severity   = getSeverity(scale, totalScore);
  const answeredAll = scale.questions.every(q => answers[q.id] !== undefined);
  const progressPct = (totalScore / scale.maxScore) * 100;

  function switchScale(key) {
    setActiveScale(key);
    setAnswers({});
    setNotes('');
    setError(null);
    setSavedResult(null);
  }

  function setAnswer(questionId, value) {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!answeredAll) {
      return setError('Please answer all questions before saving.');
    }
    setError(null);
    setSubmitting(true);

    const responses = scale.questions.map(q => ({
      questionId: q.id,
      score:      answers[q.id],
    }));

    try {
      const token = getAuth0CachedToken();
      const res = await apiFetch(
        '/api/clinical/scales',
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            clientProfileId,
            scaleType:  activeScale,
            responses,
            notes:      notes.trim(),
          }),
        },
        () => Promise.resolve(token),
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save assessment.');

      setSavedResult(data.clinicalScale);
      setAnswers({});
      setNotes('');
      if (typeof onSaved === 'function') onSaved(data.clinicalScale);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  }

  // PHQ-9 item 9 (suicidal ideation) warning
  const phq9SuicidalScore = activeScale === 'PHQ-9' ? (answers['phq9'] ?? 0) : 0;
  const showSuicidalWarning = activeScale === 'PHQ-9' && phq9SuicidalScore >= 1;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="cat-wrap">

        {/* Scale selector tabs */}
        <div className="cat-tabs" role="tablist" aria-label="Select assessment scale">
          {Object.values(SCALES).map(s => (
            <button
              key={s.name}
              role="tab"
              aria-selected={activeScale === s.name}
              className={`cat-tab${activeScale === s.name ? ' cat-tab-active' : ''}`}
              onClick={() => switchScale(s.name)}
              type="button"
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* Scale metadata */}
        <div className="cat-meta">
          <strong>{scale.fullName}</strong><br />
          {scale.description}<br />
          <em style={{ fontSize: '.78rem', color: '#94a3b8' }}>{scale.citation}</em>
        </div>

        {savedResult && (
          <div className="cat-alert cat-alert-success" role="status">
            <img src="/icons/success.svg" alt="" aria-hidden="true" style={{ width: '1rem', height: '1rem', objectFit: 'contain', verticalAlign: 'middle' }} /> Assessment saved — Score: {savedResult.totalScore} ({savedResult.severityBand?.replace('_', ' ')})
          </div>
        )}

        {error && (
          <div className="cat-alert cat-alert-error" role="alert">{error}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          <p className="cat-instructions">{scale.instructions}</p>

          {/* Question list */}
          {scale.questions.map((q, idx) => {
            const answered = answers[q.id] !== undefined;
            const isWarning = q.id === 'phq9' && phq9SuicidalScore >= 1;
            return (
              <div
                key={q.id}
                className={`cat-question${answered ? ' cat-q-answered' : ''}${isWarning ? ' cat-q-warning' : ''}`}
              >
                <p className="cat-q-num">Question {idx + 1}</p>
                <p className="cat-q-text">{q.text}</p>
                <div className="cat-options" role="radiogroup" aria-label={q.text}>
                  {RESPONSE_OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      className={`cat-option${answers[q.id] === opt.value ? ' cat-option-selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.value}
                        checked={answers[q.id] === opt.value}
                        onChange={() => setAnswer(q.id, opt.value)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Score summary */}
          {Object.keys(answers).length > 0 && (
            <div
              className="cat-score-bar"
              style={{ background: severity.bg, borderColor: severity.color }}
            >
              <p className="cat-score-label" style={{ color: severity.color }}>
                {answeredAll ? 'Total Score' : `Score so far (${Object.keys(answers).length}/${scale.questions.length} answered)`}
              </p>
              <p className="cat-score-value" style={{ color: severity.color }}>{totalScore}</p>
              <p className="cat-score-band"  style={{ color: severity.color }}>{severity.label}</p>
              <div className="cat-progress-bg">
                <div
                  className="cat-progress-fill"
                  style={{ width: `${progressPct}%`, background: severity.color }}
                />
              </div>
            </div>
          )}

          {/* PHQ-9 item 9 suicidal ideation clinical alert */}
          {showSuicidalWarning && (
            <div className="cat-warning-note" role="alert">
              <img src="/icons/warning.svg" alt="" aria-hidden="true" style={{ width: '1rem', height: '1rem', objectFit: 'contain', verticalAlign: 'middle' }} /> <strong>Clinical Note:</strong> The client has endorsed item 9 (suicidal ideation).
              Per standard clinical practice, further risk assessment is indicated.
              Follow your organisation's safety protocol.
            </div>
          )}

          {/* Clinician notes */}
          <div style={{ marginTop: '1rem' }}>
            <p className="cat-notes-label">Clinician Notes</p>
            <textarea
              className="cat-notes-input"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observations, context, follow-up plans…"
              rows={3}
              maxLength={5000}
            />
          </div>

          <div className="cat-actions">
            <button
              type="button"
              className="cat-btn cat-btn-secondary"
              onClick={() => { setAnswers({}); setNotes(''); setError(null); setSavedResult(null); }}
            >
              Clear
            </button>
            <button
              type="submit"
              className="cat-btn cat-btn-primary"
              disabled={!answeredAll || submitting}
            >
              {submitting ? 'Saving…' : `Save ${activeScale} Result`}
            </button>
          </div>

        </form>
      </div>
    </>
  );
}
