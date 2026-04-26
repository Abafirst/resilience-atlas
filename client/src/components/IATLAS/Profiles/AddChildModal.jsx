/**
 * AddChildModal.jsx
 * Multi-step wizard for creating a new child profile.
 *
 * Step 1 — Basic information (required: name; optional: DOB, gender, avatar)
 * Step 2 — Clinical details (optional; can skip)
 * Step 3 — Preferences      (optional; can skip)
 * Step 4 — Success confirmation with next steps
 *
 * Props:
 *   onClose()           — close/dismiss the modal
 *   onCreated(profile)  — called after a successful creation
 *   currentCount        — number of existing (non-archived) profiles
 */

import React, { useState } from 'react';
import { useProfiles } from '../../../contexts/ProfileContext.jsx';
import {
  getIATLASTier,
  getMaxProfiles,
} from '../../../utils/iatlasGating.js';

const AVATAR_OPTIONS = [
  '🧒', '👧', '👦', '🧒🏻', '👧🏼', '🧑🏽', '👦🏾', '👧🏿',
  '🦁', '🐶', '🐱', '🦊', '🐼', '🐨', '🦄', '🌟',
  '🚀', '🎨', '⚽', '🎮', '🌈', '🦋', '🌸', '🎵',
];

const AGE_GROUPS = [
  { value: '5-7',   label: 'Ages 5–7'   },
  { value: '8-10',  label: 'Ages 8–10'  },
  { value: '11-14', label: 'Ages 11–14' },
  { value: '15-18', label: 'Ages 15–18' },
];

const GENDER_OPTIONS = [
  { value: 'male',             label: 'Male'           },
  { value: 'female',           label: 'Female'         },
  { value: 'non-binary',       label: 'Non-binary'     },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

const SUPPORT_LEVELS = [
  { value: 'low',       label: 'Low — minimal support'     },
  { value: 'moderate',  label: 'Moderate support'          },
  { value: 'high',      label: 'High support'              },
  { value: 'intensive', label: 'Intensive support'         },
];

const COMMON_DIAGNOSES = [
  'Autism Spectrum Disorder (ASD)',
  'ADHD / ADD',
  'Anxiety',
  'Down Syndrome',
  'Intellectual Disability',
  'Developmental Delay',
  'Speech/Language Disorder',
  'Sensory Processing Disorder',
  'Cerebral Palsy',
  'Other',
];

const COMMON_GOALS = [
  'Improve social skills',
  'Build emotional regulation',
  'Develop communication skills',
  'Strengthen academic skills',
  'Increase independence',
  'Reduce challenging behaviour',
  'Build self-confidence',
  'Improve motor skills',
];

const COMMON_ACTIVITIES = [
  'Arts & Crafts',
  'Music',
  'Sports / Physical activity',
  'Reading / Storytelling',
  'Role play / Pretend play',
  'Outdoor exploration',
  'Building / Construction',
  'Screen time / Games',
];

const STYLES = `
/* ── Overlay & Modal ───────────────────────────────────────────────────────── */
.acm-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.55);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 1rem;
}
.acm-modal {
  background: #fff; border-radius: 20px;
  padding: 2rem; max-width: 520px; width: 100%;
  box-shadow: 0 20px 60px rgba(0,0,0,.25);
  animation: acm-in .2s ease;
  max-height: 90vh; overflow-y: auto;
}
@keyframes acm-in { from { transform: scale(.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.dark-mode .acm-modal { background: #1e293b; color: #f1f5f9; }

/* ── Header ────────────────────────────────────────────────────────────────── */
.acm-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: .75rem; }
.acm-title { font-size: 1.2rem; font-weight: 800; color: #0f172a; margin: 0; }
.dark-mode .acm-title { color: #f1f5f9; }
.acm-close { background: none; border: none; cursor: pointer; font-size: 1.4rem; color: #94a3b8; padding: 0.2rem; }
.acm-close:hover { color: #0f172a; }
.dark-mode .acm-close:hover { color: #f1f5f9; }

/* ── Progress bar ──────────────────────────────────────────────────────────── */
.acm-progress { display: flex; align-items: center; gap: .35rem; margin-bottom: 1.5rem; }
.acm-step-dot {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: .72rem; font-weight: 800;
  border: 2px solid #e2e8f0; background: #f8fafc; color: #94a3b8;
  transition: all .2s;
}
.acm-step-dot.done { background: #6366f1; border-color: #6366f1; color: #fff; }
.acm-step-dot.active { background: #fff; border-color: #6366f1; color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.15); }
.dark-mode .acm-step-dot { background: #0f172a; border-color: #334155; color: #64748b; }
.dark-mode .acm-step-dot.active { background: #1e293b; border-color: #818cf8; color: #818cf8; }
.acm-step-line { flex: 1; height: 2px; background: #e2e8f0; border-radius: 2px; }
.acm-step-line.done { background: #6366f1; }
.dark-mode .acm-step-line { background: #334155; }
.dark-mode .acm-step-line.done { background: #6366f1; }
.acm-step-label { font-size: .72rem; font-weight: 600; color: #94a3b8; margin-bottom: 1rem; }
.dark-mode .acm-step-label { color: #64748b; }

/* ── Fields ────────────────────────────────────────────────────────────────── */
.acm-label { font-size: .8rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #64748b; display: block; margin-bottom: .5rem; }
.dark-mode .acm-label { color: #94a3b8; }
.acm-sublabel { font-size: .78rem; color: #94a3b8; margin-bottom: .5rem; display: block; }
.acm-input {
  width: 100%; padding: .65rem .9rem; border: 1.5px solid #e2e8f0;
  border-radius: 10px; font-size: .95rem; background: #f8fafc;
  color: #0f172a; box-sizing: border-box; outline: none; transition: border-color .15s;
}
.acm-input:focus { border-color: #6366f1; background: #fff; }
.dark-mode .acm-input { background: #0f172a; border-color: #334155; color: #f1f5f9; }
.dark-mode .acm-input:focus { border-color: #818cf8; background: #1e293b; }
.acm-textarea {
  width: 100%; padding: .65rem .9rem; border: 1.5px solid #e2e8f0;
  border-radius: 10px; font-size: .9rem; background: #f8fafc; color: #0f172a;
  box-sizing: border-box; outline: none; resize: vertical; min-height: 80px;
  font-family: inherit; transition: border-color .15s;
}
.acm-textarea:focus { border-color: #6366f1; background: #fff; }
.dark-mode .acm-textarea { background: #0f172a; border-color: #334155; color: #f1f5f9; }
.dark-mode .acm-textarea:focus { border-color: #818cf8; background: #1e293b; }
.acm-field { margin-bottom: 1.25rem; }

/* ── Toggle chip grids ─────────────────────────────────────────────────────── */
.acm-chip-grid { display: flex; flex-wrap: wrap; gap: .4rem; }
.acm-chip {
  border: 1.5px solid #e2e8f0; border-radius: 20px; padding: .35rem .75rem;
  background: #f8fafc; cursor: pointer; font-size: .82rem; font-weight: 600;
  color: #374151; transition: all .15s;
}
.acm-chip:hover { border-color: #6366f1; background: #eef2ff; color: #4338ca; }
.acm-chip.active { border-color: #6366f1; background: #eef2ff; color: #4338ca; }
.dark-mode .acm-chip { background: #0f172a; border-color: #334155; color: #cbd5e1; }
.dark-mode .acm-chip.active { background: #1e1b4b; border-color: #818cf8; color: #a5b4fc; }

/* ── Age / support level grid ──────────────────────────────────────────────── */
.acm-age-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: .5rem; }
.acm-age-btn {
  border: 1.5px solid #e2e8f0; border-radius: 10px; padding: .55rem .75rem;
  background: #f8fafc; cursor: pointer; font-size: .88rem; font-weight: 600;
  color: #374151; transition: all .15s; text-align: center;
}
.acm-age-btn:hover { border-color: #6366f1; background: #eef2ff; color: #4338ca; }
.acm-age-btn.active { border-color: #6366f1; background: #eef2ff; color: #4338ca; }
.dark-mode .acm-age-btn { background: #0f172a; border-color: #334155; color: #cbd5e1; }
.dark-mode .acm-age-btn.active { background: #1e1b4b; border-color: #818cf8; color: #a5b4fc; }

/* ── Avatar grid ───────────────────────────────────────────────────────────── */
.acm-avatar-grid { display: flex; flex-wrap: wrap; gap: .4rem; }
.acm-avatar-btn {
  width: 40px; height: 40px; border: 2px solid transparent; border-radius: 10px;
  background: #f1f5f9; cursor: pointer; font-size: 1.3rem;
  display: flex; align-items: center; justify-content: center; transition: all .15s;
}
.acm-avatar-btn:hover { border-color: #6366f1; background: #eef2ff; transform: scale(1.1); }
.acm-avatar-btn.active { border-color: #6366f1; background: #eef2ff; transform: scale(1.1); }
.dark-mode .acm-avatar-btn { background: #0f172a; }
.dark-mode .acm-avatar-btn.active { background: #1e1b4b; border-color: #818cf8; }

/* ── Error ─────────────────────────────────────────────────────────────────── */
.acm-error { color: #ef4444; font-size: .83rem; margin-bottom: .75rem; }

/* ── Action row ────────────────────────────────────────────────────────────── */
.acm-actions { display: flex; gap: .75rem; margin-top: .5rem; }
.acm-submit {
  flex: 1; padding: .75rem; background: linear-gradient(135deg,#6366f1,#8b5cf6);
  color: #fff; border: none; border-radius: 12px; font-size: .95rem; font-weight: 700;
  cursor: pointer; transition: opacity .15s;
}
.acm-submit:hover:not(:disabled) { opacity: .9; }
.acm-submit:disabled { opacity: .5; cursor: not-allowed; }
.acm-skip {
  padding: .75rem 1rem; background: none; border: 1.5px solid #e2e8f0;
  color: #64748b; border-radius: 12px; font-size: .9rem; font-weight: 600;
  cursor: pointer; transition: all .15s;
}
.acm-skip:hover { background: #f8fafc; color: #374151; }
.dark-mode .acm-skip { border-color: #334155; color: #94a3b8; }
.dark-mode .acm-skip:hover { background: #0f172a; }
.acm-back {
  padding: .75rem .9rem; background: none; border: 1.5px solid #e2e8f0;
  color: #64748b; border-radius: 12px; font-size: .88rem; cursor: pointer; transition: all .15s;
}
.acm-back:hover { background: #f8fafc; }
.dark-mode .acm-back { border-color: #334155; color: #94a3b8; }

/* ── Success ───────────────────────────────────────────────────────────────── */
.acm-success { text-align: center; padding: 1rem 0; }
.acm-success-avatar { font-size: 4rem; margin-bottom: .5rem; }
.acm-success-title { font-size: 1.4rem; font-weight: 800; color: #0f172a; margin: 0 0 .5rem; }
.dark-mode .acm-success-title { color: #f1f5f9; }
.acm-success-sub { font-size: .9rem; color: #64748b; margin: 0 0 1.5rem; }
.acm-success-actions { display: flex; flex-direction: column; gap: .6rem; }
.acm-success-btn {
  padding: .7rem 1.2rem; background: linear-gradient(135deg,#6366f1,#8b5cf6);
  color: #fff; border: none; border-radius: 12px; font-size: .95rem; font-weight: 700;
  cursor: pointer; transition: opacity .15s;
}
.acm-success-btn:hover { opacity: .9; }
.acm-success-btn-sec {
  padding: .7rem 1.2rem; background: none; border: 1.5px solid #e2e8f0;
  color: #374151; border-radius: 12px; font-size: .9rem; font-weight: 600;
  cursor: pointer; transition: all .15s;
}
.acm-success-btn-sec:hover { background: #f8fafc; }
.dark-mode .acm-success-btn-sec { border-color: #334155; color: #cbd5e1; }
`;

const TOTAL_STEPS = 3; // steps 1-3; step 4 is success

export default function AddChildModal({ onClose, onCreated, currentCount }) {
  const { createProfile } = useProfiles();
  const tier        = getIATLASTier();
  const maxProfiles = getMaxProfiles(tier);

  const atLimit = currentCount >= maxProfiles;

  // ── Wizard state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);  // 1, 2, 3, or 'success'

  // Step 1 — Basic info
  const [name,        setName]        = useState('');
  const [avatar,      setAvatar]      = useState('🧒');
  const [ageGroup,    setAgeGroup]    = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender,      setGender]      = useState('');

  // Step 2 — Clinical details
  const [diagnoses,    setDiagnoses]    = useState([]);
  const [goals,        setGoals]        = useState([]);
  const [strengths,    setStrengths]    = useState('');
  const [challenges,   setChallenges]   = useState('');
  const [supportLevel, setSupportLevel] = useState('');

  // Step 3 — Preferences
  const [activities,          setActivities]          = useState([]);
  const [sensoryPreferences,  setSensoryPreferences]  = useState('');
  const [communicationStyle,  setCommunicationStyle]  = useState('');
  const [learningPreferences, setLearningPreferences] = useState('');

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [createdProfile, setCreatedProfile] = useState(null);

  // ── Helpers ───────────────────────────────────────────────────────────────

  function toggleItem(arr, setArr, value) {
    setArr(arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]);
  }

  // ── Step navigation ───────────────────────────────────────────────────────

  function handleStep1Next(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Please enter a name for this child.');
      return;
    }
    setStep(2);
  }

  function handleStep2Next(e) {
    e.preventDefault();
    setStep(3);
  }

  function handleStep2Skip() {
    setStep(3);
  }

  async function submitProfile() {
    setError('');
    setSubmitting(true);
    try {
      const data = {
        name:   name.trim(),
        avatar,
        ageGroup: ageGroup  || undefined,
        gender:   gender    || undefined,
        dateOfBirth: dateOfBirth || undefined,
      };

      const clinicalData = {
        diagnoses,
        goals,
        strengths:    strengths    || undefined,
        challenges:   challenges   || undefined,
        supportLevel: supportLevel || undefined,
      };
      if (
        clinicalData.diagnoses.length ||
        clinicalData.goals.length ||
        clinicalData.strengths ||
        clinicalData.challenges ||
        clinicalData.supportLevel
      ) {
        data.clinical = clinicalData;
      }

      const prefData = {
        activities,
        sensoryPreferences:  sensoryPreferences  || undefined,
        communicationStyle:  communicationStyle  || undefined,
        learningPreferences: learningPreferences || undefined,
      };
      if (
        prefData.activities.length ||
        prefData.sensoryPreferences ||
        prefData.communicationStyle ||
        prefData.learningPreferences
      ) {
        data.preferences = prefData;
      }

      const profile = await createProfile(data);
      setCreatedProfile(profile);
      if (onCreated) onCreated(profile);
      setStep('success');
    } catch (err) {
      setError(err.message || 'Could not create profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleStep3Submit(e) {
    e.preventDefault();
    submitProfile();
  }

  function handleStep3Skip() {
    submitProfile();
  }

  // ── Step progress indicator ───────────────────────────────────────────────

  function StepProgress() {
    const current = typeof step === 'number' ? step : TOTAL_STEPS + 1;
    return (
      <div className="acm-progress" role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-label={`Step ${current} of ${TOTAL_STEPS}`}>
        {[1, 2, 3].map((s, idx) => (
          <React.Fragment key={s}>
            {idx > 0 && <div className={`acm-step-line${current > s ? ' done' : ''}`} />}
            <div className={`acm-step-dot${current === s ? ' active' : current > s ? ' done' : ''}`}>
              {current > s ? '✓' : s}
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{STYLES}</style>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
      <div
        className="acm-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="acm-title"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="acm-modal">
          <div className="acm-header">
            <h2 className="acm-title" id="acm-title">
              {step === 'success' ? '🎉 Profile Created!' : 'Add Child Profile'}
            </h2>
            <button className="acm-close" onClick={onClose} aria-label="Close">×</button>
          </div>

          {/* ── Plan limit gate ── */}
          {atLimit && step !== 'success' ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>🔒</div>
              <p style={{ fontWeight: 700, marginBottom: '.5rem' }}>Profile limit reached</p>
              <p style={{ fontSize: '.88rem', color: '#64748b', marginBottom: '1rem' }}>
                Your <strong>{tier}</strong> plan allows up to {maxProfiles} child profile{maxProfiles !== 1 ? 's' : ''}.
                {tier === 'individual' && ' Upgrade to Family to add up to 5 profiles.'}
              </p>
              {tier === 'individual' && (
                <a
                  href="/iatlas#pricing"
                  style={{ display: 'inline-block', padding: '.65rem 1.4rem', background: '#0891b2', color: '#fff', borderRadius: '10px', fontWeight: 700, textDecoration: 'none', fontSize: '.9rem' }}
                >
                  Upgrade to Family →
                </a>
              )}
              <div style={{ marginTop: '1rem' }}>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontWeight: 700, fontSize: '.9rem' }}>Cancel</button>
              </div>
            </div>
          ) : step === 1 ? (
            /* ── STEP 1: Basic information ── */
            <>
              <StepProgress />
              <p className="acm-step-label">Step 1 of 3 — Basic Information</p>
              <form onSubmit={handleStep1Next} noValidate>

                <div className="acm-field">
                  <label className="acm-label" htmlFor="acm-name">Child's Name <span aria-hidden="true" style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    id="acm-name"
                    className="acm-input"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Alex"
                    maxLength={64}
                    autoFocus
                    required
                  />
                </div>

                <div className="acm-field">
                  <label className="acm-label" htmlFor="acm-dob">Date of Birth</label>
                  <input
                    id="acm-dob"
                    className="acm-input"
                    type="date"
                    value={dateOfBirth}
                    onChange={e => setDateOfBirth(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="acm-field">
                  <span className="acm-label">Gender <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#94a3b8' }}>(optional)</span></span>
                  <div className="acm-chip-grid" role="group" aria-label="Gender options">
                    {GENDER_OPTIONS.map(g => (
                      <button
                        key={g.value}
                        type="button"
                        className={`acm-chip${gender === g.value ? ' active' : ''}`}
                        onClick={() => setGender(gender === g.value ? '' : g.value)}
                        aria-pressed={gender === g.value}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="acm-field">
                  <span className="acm-label">Age Group</span>
                  <div className="acm-age-grid" role="group" aria-label="Age group options">
                    {AGE_GROUPS.map(ag => (
                      <button
                        key={ag.value}
                        type="button"
                        className={`acm-age-btn${ageGroup === ag.value ? ' active' : ''}`}
                        onClick={() => setAgeGroup(ag.value)}
                        aria-pressed={ageGroup === ag.value}
                      >
                        {ag.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="acm-field">
                  <span className="acm-label">Avatar</span>
                  <div className="acm-avatar-grid" role="group" aria-label="Avatar options">
                    {AVATAR_OPTIONS.map(em => (
                      <button
                        key={em}
                        type="button"
                        className={`acm-avatar-btn${avatar === em ? ' active' : ''}`}
                        onClick={() => setAvatar(em)}
                        aria-label={`Avatar ${em}`}
                        aria-pressed={avatar === em}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p className="acm-error" role="alert">{error}</p>}

                <div className="acm-actions">
                  <button type="submit" className="acm-submit">Next →</button>
                </div>
              </form>
            </>

          ) : step === 2 ? (
            /* ── STEP 2: Clinical details (optional) ── */
            <>
              <StepProgress />
              <p className="acm-step-label">Step 2 of 3 — Clinical Details <span style={{ color: '#94a3b8' }}>(optional)</span></p>
              <form onSubmit={handleStep2Next} noValidate>

                <div className="acm-field">
                  <span className="acm-label">Diagnosis / Diagnoses</span>
                  <span className="acm-sublabel">Select all that apply, or add your own below.</span>
                  <div className="acm-chip-grid" role="group" aria-label="Diagnosis options">
                    {COMMON_DIAGNOSES.map(d => (
                      <button
                        key={d}
                        type="button"
                        className={`acm-chip${diagnoses.includes(d) ? ' active' : ''}`}
                        onClick={() => toggleItem(diagnoses, setDiagnoses, d)}
                        aria-pressed={diagnoses.includes(d)}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="acm-field">
                  <span className="acm-label">Current Goals / Focus Areas</span>
                  <div className="acm-chip-grid" role="group" aria-label="Goal options">
                    {COMMON_GOALS.map(g => (
                      <button
                        key={g}
                        type="button"
                        className={`acm-chip${goals.includes(g) ? ' active' : ''}`}
                        onClick={() => toggleItem(goals, setGoals, g)}
                        aria-pressed={goals.includes(g)}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="acm-field">
                  <label className="acm-label" htmlFor="acm-strengths">Strengths</label>
                  <textarea
                    id="acm-strengths"
                    className="acm-textarea"
                    value={strengths}
                    onChange={e => setStrengths(e.target.value)}
                    placeholder="Describe the child's strengths..."
                    maxLength={500}
                  />
                </div>

                <div className="acm-field">
                  <label className="acm-label" htmlFor="acm-challenges">Challenges</label>
                  <textarea
                    id="acm-challenges"
                    className="acm-textarea"
                    value={challenges}
                    onChange={e => setChallenges(e.target.value)}
                    placeholder="Describe areas of challenge..."
                    maxLength={500}
                  />
                </div>

                <div className="acm-field">
                  <span className="acm-label">Support Level Needed</span>
                  <div className="acm-chip-grid" role="group" aria-label="Support level options">
                    {SUPPORT_LEVELS.map(sl => (
                      <button
                        key={sl.value}
                        type="button"
                        className={`acm-chip${supportLevel === sl.value ? ' active' : ''}`}
                        onClick={() => setSupportLevel(supportLevel === sl.value ? '' : sl.value)}
                        aria-pressed={supportLevel === sl.value}
                      >
                        {sl.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="acm-actions">
                  <button type="button" className="acm-back" onClick={() => setStep(1)} aria-label="Back to step 1">← Back</button>
                  <button type="button" className="acm-skip" onClick={handleStep2Skip}>Skip</button>
                  <button type="submit" className="acm-submit">Next →</button>
                </div>
              </form>
            </>

          ) : step === 3 ? (
            /* ── STEP 3: Preferences (optional) ── */
            <>
              <StepProgress />
              <p className="acm-step-label">Step 3 of 3 — Preferences <span style={{ color: '#94a3b8' }}>(optional)</span></p>
              <form onSubmit={handleStep3Submit} noValidate>

                <div className="acm-field">
                  <span className="acm-label">Preferred Activities</span>
                  <div className="acm-chip-grid" role="group" aria-label="Activity preference options">
                    {COMMON_ACTIVITIES.map(a => (
                      <button
                        key={a}
                        type="button"
                        className={`acm-chip${activities.includes(a) ? ' active' : ''}`}
                        onClick={() => toggleItem(activities, setActivities, a)}
                        aria-pressed={activities.includes(a)}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="acm-field">
                  <label className="acm-label" htmlFor="acm-sensory">Sensory Preferences</label>
                  <textarea
                    id="acm-sensory"
                    className="acm-textarea"
                    value={sensoryPreferences}
                    onChange={e => setSensoryPreferences(e.target.value)}
                    placeholder="e.g. prefers low noise environments, likes deep pressure..."
                    maxLength={500}
                  />
                </div>

                <div className="acm-field">
                  <label className="acm-label" htmlFor="acm-comm">Communication Style</label>
                  <textarea
                    id="acm-comm"
                    className="acm-textarea"
                    value={communicationStyle}
                    onChange={e => setCommunicationStyle(e.target.value)}
                    placeholder="e.g. uses AAC device, prefers visual supports, verbal..."
                    maxLength={500}
                  />
                </div>

                <div className="acm-field">
                  <label className="acm-label" htmlFor="acm-learning">Learning Preferences</label>
                  <textarea
                    id="acm-learning"
                    className="acm-textarea"
                    value={learningPreferences}
                    onChange={e => setLearningPreferences(e.target.value)}
                    placeholder="e.g. visual learner, learns best with hands-on activities..."
                    maxLength={500}
                  />
                </div>

                {error && <p className="acm-error" role="alert">{error}</p>}

                <div className="acm-actions">
                  <button type="button" className="acm-back" onClick={() => setStep(2)} aria-label="Back to step 2">← Back</button>
                  <button type="button" className="acm-skip" onClick={handleStep3Skip} disabled={submitting}>Skip & Create</button>
                  <button type="submit" className="acm-submit" disabled={submitting}>
                    {submitting ? 'Creating…' : 'Create Profile ✓'}
                  </button>
                </div>
              </form>
            </>

          ) : (
            /* ── SUCCESS ── */
            <div className="acm-success">
              <div className="acm-success-avatar">{createdProfile?.avatar || '🎉'}</div>
              <h3 className="acm-success-title">{createdProfile?.name || 'Your child'}'s profile is ready!</h3>
              <p className="acm-success-sub">
                You can now track {createdProfile?.name || 'their'} progress, assign activities, and build personalised learning plans.
              </p>
              <div className="acm-success-actions">
                <a href="/iatlas/kids" className="acm-success-btn" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                  🎯 Start Activities
                </a>
                <a href="/iatlas/profiles" className="acm-success-btn-sec" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                  View All Profiles
                </a>
                <button className="acm-success-btn-sec" onClick={onClose}>Done</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
