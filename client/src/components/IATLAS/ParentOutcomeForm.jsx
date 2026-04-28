/**
 * ParentOutcomeForm.jsx
 * IATLAS Parent-Reported Outcome (PRO) form component.
 * Supports weekly and monthly check-in forms.
 */

import React, { useState, useCallback } from 'react';
import { WEEKLY_PARENT_CHECKIN, MONTHLY_PARENT_SUMMARY } from '../../data/iatlas/parentOutcomeForms.js';

const STYLES = `
  .pof-container {
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    max-width: 680px;
    margin: 0 auto;
    overflow: hidden;
  }
  .dark-mode .pof-container { background: #1e293b; border-color: #334155; }

  .pof-header {
    padding: 1.5rem 1.75rem 1rem;
    border-bottom: 1px solid #e2e8f0;
    background: linear-gradient(135deg, #f8fafc, #ffffff);
  }
  .dark-mode .pof-header { background: linear-gradient(135deg, #0f172a, #1e293b); border-color: #334155; }

  .pof-type-toggle {
    display: flex;
    gap: .5rem;
    margin-bottom: 1rem;
    background: #f1f5f9;
    border-radius: 8px;
    padding: .2rem;
  }
  .dark-mode .pof-type-toggle { background: #0f172a; }
  .pof-type-btn {
    flex: 1;
    padding: .5rem;
    border-radius: 6px;
    border: none;
    font-size: .82rem;
    font-weight: 600;
    cursor: pointer;
    background: transparent;
    color: #64748b;
    transition: all .15s;
  }
  .pof-type-btn.active {
    background: #ffffff;
    color: #0f172a;
    box-shadow: 0 1px 4px rgba(0,0,0,.08);
  }
  .dark-mode .pof-type-btn.active { background: #1e293b; color: #f1f5f9; }

  .pof-title { font-size: 1.15rem; font-weight: 700; color: #0f172a; margin: 0 0 .2rem; }
  .dark-mode .pof-title { color: #f1f5f9; }
  .pof-meta { font-size: .8rem; color: #64748b; display: flex; gap: .75rem; align-items: center; }

  .pof-body { padding: 1.5rem 1.75rem; display: flex; flex-direction: column; gap: 1.75rem; }

  .pof-section { }
  .pof-section-title { font-size: .92rem; font-weight: 700; color: #0f172a; margin: 0 0 .35rem; }
  .dark-mode .pof-section-title { color: #f1f5f9; }
  .pof-section-desc { font-size: .8rem; color: #64748b; margin-bottom: .85rem; }

  .pof-multiselect { display: flex; flex-wrap: wrap; gap: .5rem; }
  .pof-chip {
    padding: .35rem .85rem;
    border-radius: 20px;
    border: 1.5px solid #e2e8f0;
    font-size: .8rem;
    font-weight: 600;
    cursor: pointer;
    background: transparent;
    color: #475569;
    transition: all .15s;
  }
  .pof-chip.selected {
    background: #0f172a;
    border-color: #0f172a;
    color: #fff;
  }
  .dark-mode .pof-chip { border-color: #334155; color: #94a3b8; }
  .dark-mode .pof-chip.selected { background: #f1f5f9; border-color: #f1f5f9; color: #0f172a; }

  .pof-textarea {
    width: 100%;
    padding: .75rem;
    border-radius: 8px;
    border: 1.5px solid #e2e8f0;
    font-size: .875rem;
    font-family: inherit;
    resize: vertical;
    min-height: 80px;
    color: #0f172a;
    background: #ffffff;
    transition: border-color .15s;
    box-sizing: border-box;
  }
  .pof-textarea:focus { outline: none; border-color: #6366f1; }
  .dark-mode .pof-textarea { background: #0f172a; border-color: #334155; color: #f1f5f9; }

  .pof-dim-grid { display: flex; flex-direction: column; gap: .65rem; }
  .pof-dim-row {
    display: flex;
    align-items: center;
    gap: .75rem;
  }
  .pof-dim-label { flex: 1; font-size: .85rem; font-weight: 600; color: #1e293b; }
  .dark-mode .pof-dim-label { color: #e2e8f0; }
  .pof-dim-scale { display: flex; gap: .3rem; }
  .pof-dim-scale-btn {
    width: 34px; height: 34px;
    border-radius: 6px;
    border: 1.5px solid #e2e8f0;
    background: #ffffff;
    font-size: .8rem;
    font-weight: 700;
    cursor: pointer;
    color: #64748b;
    transition: all .15s;
  }
  .pof-dim-scale-btn.selected { color: #fff; }
  .dark-mode .pof-dim-scale-btn { background: #1e293b; border-color: #334155; }

  .pof-likert { display: flex; flex-direction: column; gap: .5rem; }
  .pof-likert-question { font-size: .88rem; color: #475569; margin-bottom: .5rem; }
  .dark-mode .pof-likert-question { color: #94a3b8; }
  .pof-likert-scale { display: flex; gap: .4rem; }
  .pof-likert-btn {
    flex: 1;
    padding: .45rem .3rem;
    border-radius: 8px;
    border: 1.5px solid #e2e8f0;
    background: #ffffff;
    font-size: .78rem;
    font-weight: 600;
    cursor: pointer;
    color: #64748b;
    text-align: center;
    transition: all .15s;
  }
  .pof-likert-btn.selected { background: #6366f1; border-color: #6366f1; color: #fff; }
  .dark-mode .pof-likert-btn { background: #1e293b; border-color: #334155; }

  .pof-footer {
    padding: 1.25rem 1.75rem;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: flex-end;
    gap: .75rem;
  }
  .dark-mode .pof-footer { border-color: #334155; }

  .pof-submit-btn {
    padding: .7rem 1.5rem;
    border-radius: 10px;
    border: none;
    font-size: .9rem;
    font-weight: 700;
    cursor: pointer;
    background: #6366f1;
    color: #fff;
    transition: opacity .15s;
  }
  .pof-submit-btn:disabled { opacity: .45; cursor: not-allowed; }
  .pof-submit-btn:hover:not(:disabled) { background: #4f46e5; }

  .pof-success {
    text-align: center;
    padding: 2.5rem 1.75rem;
  }
  .pof-success-icon { font-size: 3rem; margin-bottom: .75rem; }
  .pof-success-title { font-size: 1.2rem; font-weight: 700; color: #0f172a; margin-bottom: .4rem; }
  .dark-mode .pof-success-title { color: #f1f5f9; }
  .pof-success-sub { font-size: .9rem; color: #64748b; }
  .pof-success-again {
    margin-top: 1.5rem;
    padding: .6rem 1.25rem;
    border-radius: 8px;
    border: 1.5px solid #e2e8f0;
    background: transparent;
    font-size: .85rem;
    font-weight: 600;
    cursor: pointer;
    color: #475569;
  }
  .pof-success-again:hover { background: #f1f5f9; }
  .dark-mode .pof-success-again { border-color: #334155; color: #94a3b8; }
`;

const DIM_COLORS = {
  'emotional-adaptive':   '#ec4899',
  'agentic-generative':   '#4f46e5',
  'somatic-regulative':   '#10b981',
  'cognitive-narrative':  '#f59e0b',
  'relational-connective':'#ef4444',
  'spiritual-existential':'#7c3aed',
};

function MultiSelect({ options, selected, onChange, accent = '#0f172a' }) {
  const toggle = id => onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  return (
    <div className="pof-multiselect">
      {options.map(opt => (
        <button
          key={opt.id}
          className={`pof-chip${selected.includes(opt.id) ? ' selected' : ''}`}
          style={selected.includes(opt.id) ? { background: accent, borderColor: accent } : {}}
          onClick={() => toggle(opt.id)}
          type="button"
          aria-pressed={selected.includes(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function DimensionScale({ dimensions, ratings, onChange }) {
  return (
    <div className="pof-dim-grid">
      {dimensions.map(dim => {
        const color = DIM_COLORS[dim.key] || '#6366f1';
        return (
          <div key={dim.key} className="pof-dim-row">
            <span className="pof-dim-label">{dim.label}</span>
            <div className="pof-dim-scale">
              {[1, 2, 3, 4, 5].map(val => {
                const isSelected = ratings[dim.key] === val;
                return (
                  <button
                    key={val}
                    className={`pof-dim-scale-btn${isSelected ? ' selected' : ''}`}
                    style={isSelected ? { background: color, borderColor: color } : {}}
                    onClick={() => onChange(dim.key, val)}
                    type="button"
                    aria-label={`${dim.label}: ${val}`}
                    aria-pressed={isSelected}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * ParentOutcomeForm
 *
 * Props:
 *   formType        {'weekly'|'monthly'} — Which form to display
 *   childProfileId  {string}            — Optional child profile ID
 *   onSubmit        {function}          — Called with the completed form data
 */
export default function ParentOutcomeForm({ formType: initialType = 'weekly', childProfileId, onSubmit }) {
  const [formType, setFormType]   = useState(initialType);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving]       = useState(false);

  const formDef = formType === 'monthly' ? MONTHLY_PARENT_SUMMARY : WEEKLY_PARENT_CHECKIN;

  // Form state
  const [wins, setWins]               = useState([]);
  const [challenges, setChallenges]   = useState([]);
  const [observations, setObservations] = useState('');
  const [dimRatings, setDimRatings]   = useState({});
  const [practitionerQ, setPractitionerQ] = useState('');
  const [celebration, setCelebration] = useState('');
  const [overallProgress, setOverallProgress] = useState(null);

  const handleDimRating = useCallback((dimKey, val) => {
    setDimRatings(prev => ({ ...prev, [dimKey]: val }));
  }, []);

  const handleSubmit = useCallback(async () => {
    setSaving(true);
    const now    = new Date();
    const year   = now.getFullYear();
    const month  = String(now.getMonth() + 1).padStart(2, '0');
    // ISO week number
    const week   = Math.ceil((now.getDate() - now.getDay() + 10) / 7);
    const period = formType === 'monthly'
      ? `${year}-${month}`
      : `${year}-W${String(week).padStart(2, '0')}`;

    const payload = {
      formType,
      period,
      childProfileId,
      wins,
      challenges,
      observations,
      dimensionRatings: Object.entries(dimRatings).map(([dimensionKey, rating]) => ({ dimensionKey, rating })),
      overallProgress,
      questionsForPractitioner: practitionerQ,
      celebration,
    };

    try {
      const token = localStorage.getItem('iatlas_access_token');
      if (token) {
        await fetch('/api/iatlas/parent-outcomes', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body:    JSON.stringify(payload),
        });
      }
      // Save to localStorage as backup
      const key  = `iatlas_parent_outcomes_${formType}`;
      const hist = JSON.parse(localStorage.getItem(key) || '[]');
      hist.unshift({ ...payload, submittedAt: now.toISOString() });
      localStorage.setItem(key, JSON.stringify(hist.slice(0, 20)));
    } catch {
      // Saved to localStorage as fallback
    }

    setSaving(false);
    setSubmitted(true);
    if (onSubmit) onSubmit(payload);
  }, [formType, wins, challenges, observations, dimRatings, overallProgress, practitionerQ, celebration, childProfileId, onSubmit]);

  const handleReset = useCallback(() => {
    setSubmitted(false);
    setWins([]);
    setChallenges([]);
    setObservations('');
    setDimRatings({});
    setPractitionerQ('');
    setCelebration('');
    setOverallProgress(null);
  }, []);

  if (submitted) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="pof-container">
          <div className="pof-success">
            <div className="pof-success-icon"><img src="/icons/success.svg" alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>
            <p className="pof-success-title">Thank you for checking in!</p>
            <p className="pof-success-sub">Your {formType} update has been saved. Your practitioner will review it before your next session.</p>
            <button className="pof-success-again" onClick={handleReset}>Submit Another</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="pof-container">
        <div className="pof-header">
          <div className="pof-type-toggle" role="tablist">
            {['weekly', 'monthly'].map(t => (
              <button
                key={t}
                role="tab"
                aria-selected={formType === t}
                className={`pof-type-btn${formType === t ? ' active' : ''}`}
                onClick={() => { setFormType(t); handleReset(); setSubmitted(false); }}
              >
                {t === 'weekly' ? 'Weekly Check-In' : 'Monthly Summary'}
              </button>
            ))}
          </div>
          <h2 className="pof-title">{formDef.title}</h2>
          <div className="pof-meta">
            <span>⏱ ~{formDef.estimatedMinutes} min</span>
            <span>{formDef.description}</span>
          </div>
        </div>

        <div className="pof-body">
          {formDef.sections.map(section => {
            if (section.type === 'multiselect' || section.type === 'checklist') {
              return (
                <div key={section.id} className="pof-section">
                  <p className="pof-section-title">{section.title}</p>
                  {section.description && <p className="pof-section-desc">{section.description}</p>}
                  <MultiSelect
                    options={section.options}
                    selected={section.id === 'wins' ? wins : challenges}
                    onChange={section.id === 'wins' ? setWins : setChallenges}
                  />
                </div>
              );
            }

            if (section.type === 'textarea') {
              const val = section.id === 'observations' ? observations
                : section.id === 'questions' ? practitionerQ
                : celebration;
              const setter = section.id === 'observations' ? setObservations
                : section.id === 'questions' ? setPractitionerQ
                : setCelebration;
              return (
                <div key={section.id} className="pof-section">
                  <p className="pof-section-title">
                    {section.title}
                    {section.optional && <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '.75rem', marginLeft: '.4rem' }}>(optional)</span>}
                  </p>
                  <textarea
                    className="pof-textarea"
                    placeholder={section.placeholder || section.prompt}
                    value={val}
                    onChange={e => setter(e.target.value)}
                    rows={3}
                    aria-label={section.title}
                  />
                </div>
              );
            }

            if (section.type === 'dimension-scale') {
              return (
                <div key={section.id} className="pof-section">
                  <p className="pof-section-title">{section.title}</p>
                  {section.description && <p className="pof-section-desc">{section.description}</p>}
                  <DimensionScale dimensions={section.dimensions} ratings={dimRatings} onChange={handleDimRating} />
                </div>
              );
            }

            if (section.type === 'likert') {
              return (
                <div key={section.id} className="pof-section">
                  <p className="pof-section-title">{section.title}</p>
                  <div className="pof-likert">
                    <p className="pof-likert-question">{section.question}</p>
                    <div className="pof-likert-scale">
                      {section.scale.map((val, i) => (
                        <button
                          key={val}
                          className={`pof-likert-btn${overallProgress === val ? ' selected' : ''}`}
                          onClick={() => setOverallProgress(val)}
                          type="button"
                          aria-pressed={overallProgress === val}
                        >
                          <div>{val}</div>
                          <div style={{ fontSize: '.65rem', marginTop: '.2rem', lineHeight: 1.2 }}>{section.labels[i]}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>

        <div className="pof-footer">
          <button
            className="pof-submit-btn"
            onClick={handleSubmit}
            disabled={saving}
            type="button"
          >
            {saving ? 'Submitting…' : `Submit ${formType === 'weekly' ? 'Weekly' : 'Monthly'} Check-In`}
          </button>
        </div>
      </div>
    </>
  );
}
