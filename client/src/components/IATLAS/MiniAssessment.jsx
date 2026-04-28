/**
 * MiniAssessment.jsx
 * IATLAS Mini Check-In Assessment component.
 * Displays a 3-question pulse-check for a single resilience dimension,
 * calculates score, shows interpretation, and saves results.
 */

import React, { useState, useCallback } from 'react';
import { MINI_ASSESSMENTS, calculateMiniAssessmentScore, getMiniAssessmentInterpretation, getRecommendedActivities } from '../../data/iatlas/miniAssessments.js';

const STYLES = `
  .ma-container {
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    padding: 1.75rem;
    max-width: 640px;
    margin: 0 auto;
  }
  .dark-mode .ma-container { background: #1e293b; border-color: #334155; }

  .ma-header {
    display: flex;
    align-items: center;
    gap: .75rem;
    margin-bottom: 1.25rem;
  }
  .ma-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
  .ma-title { font-size: 1.2rem; font-weight: 700; color: #0f172a; margin: 0; }
  .dark-mode .ma-title { color: #f1f5f9; }
  .ma-subtitle { font-size: .85rem; color: #64748b; margin: 0; }

  .ma-version-toggle {
    display: flex;
    gap: .5rem;
    margin-bottom: 1.5rem;
    background: #f8fafc;
    border-radius: 8px;
    padding: .25rem;
  }
  .dark-mode .ma-version-toggle { background: #0f172a; }
  .ma-version-btn {
    flex: 1;
    padding: .45rem;
    border-radius: 6px;
    border: none;
    font-size: .8rem;
    font-weight: 600;
    cursor: pointer;
    background: transparent;
    color: #64748b;
    transition: all .15s;
  }
  .ma-version-btn.active {
    background: #ffffff;
    color: #0f172a;
    box-shadow: 0 1px 4px rgba(0,0,0,.08);
  }
  .dark-mode .ma-version-btn.active { background: #1e293b; color: #f1f5f9; }

  .ma-instructions {
    font-size: .875rem;
    color: #475569;
    margin-bottom: 1.25rem;
    padding: .75rem 1rem;
    background: #f8fafc;
    border-radius: 8px;
    border-left: 3px solid #e2e8f0;
  }
  .dark-mode .ma-instructions { background: #0f172a; border-color: #334155; color: #94a3b8; }

  .ma-questions { display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 1.5rem; }

  .ma-question { }
  .ma-question-text {
    font-size: .9rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: .75rem;
  }
  .dark-mode .ma-question-text { color: #e2e8f0; }

  .ma-scale {
    display: flex;
    gap: .35rem;
    flex-wrap: wrap;
  }
  .ma-scale-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: .2rem;
    padding: .45rem .6rem;
    border-radius: 8px;
    border: 1.5px solid #e2e8f0;
    background: #ffffff;
    cursor: pointer;
    transition: all .15s;
    min-width: 52px;
    flex: 1;
  }
  .dark-mode .ma-scale-btn { background: #1e293b; border-color: #334155; }
  .ma-scale-btn:hover { border-color: #94a3b8; }
  .ma-scale-btn.selected { color: #ffffff; }
  .ma-scale-num { font-size: .9rem; font-weight: 700; }
  .ma-scale-label { font-size: .62rem; font-weight: 500; text-align: center; line-height: 1.2; color: #64748b; }
  .ma-scale-btn.selected .ma-scale-label { color: rgba(255,255,255,.85); }

  .ma-submit-btn {
    width: 100%;
    padding: .8rem;
    border-radius: 10px;
    border: none;
    font-size: .95rem;
    font-weight: 700;
    cursor: pointer;
    transition: opacity .15s;
  }
  .ma-submit-btn:disabled { opacity: .45; cursor: not-allowed; }

  .ma-result {
    text-align: center;
    padding: 1.5rem 1rem;
  }
  .ma-result-score {
    font-size: 2.5rem;
    font-weight: 900;
    margin-bottom: .25rem;
  }
  .ma-result-label {
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: .5rem;
  }
  .ma-result-message {
    font-size: .9rem;
    color: #475569;
    margin-bottom: 1.25rem;
    max-width: 380px;
    margin-left: auto;
    margin-right: auto;
  }
  .dark-mode .ma-result-message { color: #94a3b8; }

  .ma-recommended {
    text-align: left;
    background: #f8fafc;
    border-radius: 10px;
    padding: 1rem;
    margin-top: 1rem;
  }
  .dark-mode .ma-recommended { background: #0f172a; }
  .ma-recommended-title { font-size: .8rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .05em; margin-bottom: .6rem; }
  .ma-recommended-list { display: flex; flex-wrap: wrap; gap: .4rem; }
  .ma-activity-chip {
    padding: .3rem .7rem;
    border-radius: 20px;
    font-size: .75rem;
    font-weight: 600;
    background: #e2e8f0;
    color: #475569;
  }
  .dark-mode .ma-activity-chip { background: #1e293b; color: #94a3b8; }

  .ma-reset-btn {
    margin-top: 1rem;
    padding: .6rem 1.25rem;
    border-radius: 8px;
    border: 1.5px solid #e2e8f0;
    background: transparent;
    font-size: .85rem;
    font-weight: 600;
    cursor: pointer;
    color: #475569;
    transition: all .15s;
  }
  .ma-reset-btn:hover { background: #f1f5f9; }
  .dark-mode .ma-reset-btn { border-color: #334155; color: #94a3b8; }

  .ma-saved-badge {
    display: inline-flex;
    align-items: center;
    gap: .35rem;
    font-size: .8rem;
    font-weight: 600;
    color: #10b981;
    background: #d1fae5;
    padding: .3rem .75rem;
    border-radius: 20px;
    margin-top: .75rem;
  }

  @media (max-width: 480px) {
    .ma-scale { gap: .25rem; }
    .ma-scale-btn { min-width: 44px; padding: .4rem .3rem; }
    .ma-scale-label { display: none; }
  }
`;

const INTERPRETATION_COLORS = {
  low:    '#f59e0b',
  medium: '#3b82f6',
  high:   '#10b981',
};

const STORAGE_KEY_PREFIX = 'iatlas_mini_assessment_';

/**
 * MiniAssessment
 *
 * Props:
 *   dimensionKey  {string}   — Which dimension to assess (default: 'emotional-adaptive')
 *   onComplete    {function} — Called with { score, interpretation, responses, recommendedActivities }
 *   clientProfileId {string} — Optional child profile ID
 */
export default function MiniAssessment({ dimensionKey = 'emotional-adaptive', onComplete, clientProfileId }) {
  const assessment = MINI_ASSESSMENTS[dimensionKey];

  const [version, setVersion] = useState('parent');
  const [responses, setResponses] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const questions = assessment?.[`${version}Version`]?.questions || [];
  const instructions = assessment?.[`${version}Version`]?.instructions || '';

  const allAnswered = questions.length > 0 && questions.every(q => responses[q.id] !== undefined);

  const handleSelect = useCallback((questionId, score) => {
    setResponses(prev => ({ ...prev, [questionId]: score }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!allAnswered || !assessment) return;

    const responseArr = questions.map(q => ({ questionId: q.id, score: responses[q.id] }));
    const totalScore  = calculateMiniAssessmentScore(responseArr);
    const interp      = getMiniAssessmentInterpretation(dimensionKey, totalScore);
    const recommended = getRecommendedActivities(dimensionKey, totalScore);

    const resultData = {
      dimensionKey,
      responses:             responseArr,
      totalScore,
      interpretation:        interp?.label || '',
      interpretationBand:    Object.keys(assessment.scoring).find(k => {
        const [min, max] = assessment.scoring[k].range;
        return totalScore >= min && totalScore <= max;
      }),
      message:               interp?.message || '',
      recommendedActivities: recommended,
    };

    setResult(resultData);
    setSubmitted(true);

    // Save to localStorage
    try {
      const key  = `${STORAGE_KEY_PREFIX}${dimensionKey}`;
      const hist = JSON.parse(localStorage.getItem(key) || '[]');
      hist.unshift({ ...resultData, completedAt: new Date().toISOString(), clientProfileId });
      localStorage.setItem(key, JSON.stringify(hist.slice(0, 20))); // keep last 20
    } catch {
      // Ignore storage errors
    }

    if (onComplete) onComplete(resultData);
  }, [allAnswered, assessment, questions, responses, dimensionKey, onComplete, clientProfileId]);

  const handleSaveToServer = useCallback(async () => {
    if (!result) return;
    setSaving(true);
    try {
      // Save via API if available
      const token = localStorage.getItem('iatlas_access_token');
      if (token) {
        await fetch('/api/iatlas/mini-assessments', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body:    JSON.stringify({
            dimension:    dimensionKey,
            versionUsed:  version,
            responses:    result.responses,
            totalScore:   result.totalScore,
            interpretation: result.interpretationBand,
            recommendedActivities: result.recommendedActivities,
            clientProfileId,
          }),
        });
      }
      setSaved(true);
    } catch {
      setSaved(true); // Already saved to localStorage — treat as success
    } finally {
      setSaving(false);
    }
  }, [result, dimensionKey, version, clientProfileId]);

  const handleReset = useCallback(() => {
    setResponses({});
    setSubmitted(false);
    setResult(null);
    setSaved(false);
  }, []);

  if (!assessment) {
    return <div className="ma-container"><p>Assessment not found for dimension: {dimensionKey}</p></div>;
  }

  const accentColor = assessment.color;

  return (
    <>
      <style>{STYLES}</style>
      <div className="ma-container">
        <div className="ma-header">
          <div className="ma-icon" style={{ background: assessment.colorLight }}>
            <img src={assessment.icon} alt="" width={20} height={20} />
          </div>
          <div>
            <p className="ma-title">{assessment.name}</p>
            <p className="ma-subtitle">{assessment.dimension} · Quick Check-In</p>
          </div>
        </div>

        {!submitted && (
          <>
            <div className="ma-version-toggle" role="tablist" aria-label="Assessment version">
              {['parent', 'practitioner'].map(v => (
                <button
                  key={v}
                  role="tab"
                  aria-selected={version === v}
                  className={`ma-version-btn${version === v ? ' active' : ''}`}
                  onClick={() => { setVersion(v); setResponses({}); }}
                >
                  {v === 'parent' ? 'Parent' : 'Practitioner'}
                </button>
              ))}
            </div>

            <p className="ma-instructions">{instructions}</p>

            <div className="ma-questions">
              {questions.map((q, qi) => (
                <div key={q.id} className="ma-question">
                  <p className="ma-question-text">{qi + 1}. {q.text}</p>
                  <div className="ma-scale" role="group" aria-label={`Rating for question ${qi + 1}`}>
                    {q.scale.map((val, i) => {
                      const isSelected = responses[q.id] === val;
                      return (
                        <button
                          key={val}
                          className={`ma-scale-btn${isSelected ? ' selected' : ''}`}
                          style={isSelected ? { background: accentColor, borderColor: accentColor } : {}}
                          onClick={() => handleSelect(q.id, val)}
                          aria-pressed={isSelected}
                          aria-label={`${val} — ${q.labels[i]}`}
                        >
                          <span className="ma-scale-num">{val}</span>
                          <span className="ma-scale-label">{q.labels[i]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              className="ma-submit-btn"
              style={{ background: allAnswered ? accentColor : '#e2e8f0', color: allAnswered ? '#fff' : '#94a3b8' }}
              onClick={handleSubmit}
              disabled={!allAnswered}
            >
              {allAnswered ? 'See My Results →' : `Answer all ${questions.length} questions to continue`}
            </button>
          </>
        )}

        {submitted && result && (
          <div className="ma-result">
            <div className="ma-result-score" style={{ color: INTERPRETATION_COLORS[result.interpretationBand] || accentColor }}>
              {result.totalScore}<span style={{ fontSize: '1rem', fontWeight: 600, color: '#94a3b8' }}>/15</span>
            </div>
            <p className="ma-result-label" style={{ color: INTERPRETATION_COLORS[result.interpretationBand] || accentColor }}>
              {result.interpretation}
            </p>
            <p className="ma-result-message">{result.message}</p>

            {result.recommendedActivities.length > 0 && (
              <div className="ma-recommended">
                <p className="ma-recommended-title">Recommended Activities</p>
                <div className="ma-recommended-list">
                  {result.recommendedActivities.map(actId => (
                    <span key={actId} className="ma-activity-chip">{actId.replace(/-/g, ' ')}</span>
                  ))}
                </div>
              </div>
            )}

            {!saved && (
              <button
                className="ma-submit-btn"
                style={{ background: accentColor, color: '#fff', marginTop: '1rem' }}
                onClick={handleSaveToServer}
                disabled={saving}
              >
                {saving ? 'Saving…' : <><img src="/icons/certification.svg" alt="" aria-hidden="true" className="icon icon-sm" /> Save Result</>}
              </button>
            )}

            {saved && (
              <div className="ma-saved-badge">
                <span>✓</span> Result saved
              </div>
            )}

            <br />
            <button className="ma-reset-btn" onClick={handleReset}>
              ↺ Take Again
            </button>
          </div>
        )}
      </div>
    </>
  );
}
