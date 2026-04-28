/**
 * EditProfileModal.jsx
 * Modal for editing an existing child profile.
 * Includes basic info, clinical details, preferences, and soft-delete.
 *
 * Props:
 *   profile       — the ChildProfile object to edit
 *   onClose()     — dismiss the modal
 *   onUpdated(p)  — called after a successful update
 *   onDeleted(id) — called after the profile is archived
 */

import React, { useState } from 'react';
import { useProfiles } from '../../../contexts/ProfileContext.jsx';

const AVATAR_OPTIONS = [
  '/icons/kids-spark.svg', '/icons/star.svg', '/icons/compass.svg',
  '/icons/game-shield.svg', '/icons/trophy.svg', '/icons/game-mountain.svg',
  '/icons/growth.svg', '/icons/strength.svg', '/icons/quest.svg',
  '/icons/game-scroll.svg', '/icons/connection.svg', '/icons/game-diamond.svg',
  '/icons/star-burst.svg', '/icons/game-map.svg', '/icons/game-target.svg',
  '/icons/emotion.svg', '/icons/reflection.svg', '/icons/mindfulness.svg',
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
  { value: 'low',       label: 'Low'       },
  { value: 'moderate',  label: 'Moderate'  },
  { value: 'high',      label: 'High'      },
  { value: 'intensive', label: 'Intensive' },
];

const COMMON_DIAGNOSES = [
  'Autism Spectrum Disorder (ASD)', 'ADHD / ADD', 'Anxiety', 'Down Syndrome',
  'Intellectual Disability', 'Developmental Delay', 'Speech/Language Disorder',
  'Sensory Processing Disorder', 'Cerebral Palsy', 'Other',
];

const COMMON_GOALS = [
  'Improve social skills', 'Build emotional regulation', 'Develop communication skills',
  'Strengthen academic skills', 'Increase independence', 'Reduce challenging behavior',
  'Build self-confidence', 'Improve motor skills',
];

const COMMON_ACTIVITIES = [
  'Arts & Crafts', 'Music', 'Sports / Physical activity', 'Reading / Storytelling',
  'Role play / Pretend play', 'Outdoor exploration', 'Building / Construction', 'Screen time / Games',
];

const STYLES = `
.epm-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.55);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 1rem;
}
.epm-modal {
  background: #fff; border-radius: 20px;
  padding: 2rem; max-width: 520px; width: 100%;
  box-shadow: 0 20px 60px rgba(0,0,0,.25);
  animation: epm-in .2s ease;
  max-height: 90vh; overflow-y: auto;
}
@keyframes epm-in { from { transform: scale(.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.dark-mode .epm-modal { background: #1e293b; color: #f1f5f9; }
.epm-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.epm-title { font-size: 1.2rem; font-weight: 800; color: #0f172a; margin: 0; }
.dark-mode .epm-title { color: #f1f5f9; }
.epm-close { background: none; border: none; cursor: pointer; font-size: 1.4rem; color: #94a3b8; padding: 0.2rem; }
.epm-close:hover { color: #0f172a; }
.dark-mode .epm-close:hover { color: #f1f5f9; }

/* Tabs */
.epm-tabs { display: flex; gap: .25rem; margin-bottom: 1.5rem; border-bottom: 2px solid #e2e8f0; }
.dark-mode .epm-tabs { border-color: #334155; }
.epm-tab {
  padding: .5rem .9rem; background: none; border: none; cursor: pointer;
  font-size: .85rem; font-weight: 600; color: #94a3b8;
  border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all .15s;
}
.epm-tab:hover { color: #374151; }
.epm-tab.active { color: #6366f1; border-bottom-color: #6366f1; }
.dark-mode .epm-tab { color: #64748b; }
.dark-mode .epm-tab.active { color: #818cf8; border-bottom-color: #818cf8; }
.dark-mode .epm-tab:hover { color: #cbd5e1; }

.epm-label { font-size: .8rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #64748b; display: block; margin-bottom: .5rem; }
.dark-mode .epm-label { color: #94a3b8; }
.epm-sublabel { font-size: .78rem; color: #94a3b8; margin-bottom: .5rem; display: block; }
.epm-input {
  width: 100%; padding: .65rem .9rem; border: 1.5px solid #e2e8f0;
  border-radius: 10px; font-size: .95rem; background: #f8fafc;
  color: #0f172a; box-sizing: border-box; outline: none; transition: border-color .15s;
}
.epm-input:focus { border-color: #6366f1; background: #fff; }
.dark-mode .epm-input { background: #0f172a; border-color: #334155; color: #f1f5f9; }
.dark-mode .epm-input:focus { border-color: #818cf8; background: #1e293b; }
.epm-textarea {
  width: 100%; padding: .65rem .9rem; border: 1.5px solid #e2e8f0;
  border-radius: 10px; font-size: .9rem; background: #f8fafc; color: #0f172a;
  box-sizing: border-box; outline: none; resize: vertical; min-height: 80px;
  font-family: inherit; transition: border-color .15s;
}
.epm-textarea:focus { border-color: #6366f1; background: #fff; }
.dark-mode .epm-textarea { background: #0f172a; border-color: #334155; color: #f1f5f9; }
.dark-mode .epm-textarea:focus { border-color: #818cf8; background: #1e293b; }
.epm-field { margin-bottom: 1.25rem; }
.epm-age-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: .5rem; }
.epm-age-btn {
  border: 1.5px solid #e2e8f0; border-radius: 10px; padding: .55rem .75rem;
  background: #f8fafc; cursor: pointer; font-size: .88rem; font-weight: 600;
  color: #374151; transition: all .15s; text-align: center;
}
.epm-age-btn:hover { border-color: #6366f1; background: #eef2ff; color: #4338ca; }
.epm-age-btn.active { border-color: #6366f1; background: #eef2ff; color: #4338ca; }
.dark-mode .epm-age-btn { background: #0f172a; border-color: #334155; color: #cbd5e1; }
.dark-mode .epm-age-btn.active { background: #1e1b4b; border-color: #818cf8; color: #a5b4fc; }
.epm-avatar-grid { display: flex; flex-wrap: wrap; gap: .4rem; }
.epm-avatar-btn {
  width: 40px; height: 40px; border: 2px solid transparent; border-radius: 10px;
  background: #f1f5f9; cursor: pointer; font-size: 1.3rem;
  display: flex; align-items: center; justify-content: center; transition: all .15s;
}
.epm-avatar-btn:hover { border-color: #6366f1; background: #eef2ff; transform: scale(1.1); }
.epm-avatar-btn.active { border-color: #6366f1; background: #eef2ff; transform: scale(1.1); }
.dark-mode .epm-avatar-btn { background: #0f172a; }
.dark-mode .epm-avatar-btn.active { background: #1e1b4b; border-color: #818cf8; }
.epm-chip-grid { display: flex; flex-wrap: wrap; gap: .4rem; }
.epm-chip {
  border: 1.5px solid #e2e8f0; border-radius: 20px; padding: .35rem .75rem;
  background: #f8fafc; cursor: pointer; font-size: .82rem; font-weight: 600;
  color: #374151; transition: all .15s;
}
.epm-chip:hover { border-color: #6366f1; background: #eef2ff; color: #4338ca; }
.epm-chip.active { border-color: #6366f1; background: #eef2ff; color: #4338ca; }
.dark-mode .epm-chip { background: #0f172a; border-color: #334155; color: #cbd5e1; }
.dark-mode .epm-chip.active { background: #1e1b4b; border-color: #818cf8; color: #a5b4fc; }
.epm-error { color: #ef4444; font-size: .83rem; margin-bottom: .75rem; }
.epm-actions { display: flex; gap: .75rem; margin-top: .25rem; }
.epm-save {
  flex: 1; padding: .75rem; background: linear-gradient(135deg,#6366f1,#8b5cf6);
  color: #fff; border: none; border-radius: 12px; font-size: .95rem; font-weight: 700;
  cursor: pointer; transition: opacity .15s;
}
.epm-save:hover:not(:disabled) { opacity: .9; }
.epm-save:disabled { opacity: .5; cursor: not-allowed; }
.epm-delete {
  padding: .75rem 1rem; background: none; border: 1.5px solid #fca5a5;
  color: #ef4444; border-radius: 12px; font-size: .9rem; font-weight: 700;
  cursor: pointer; transition: all .15s;
}
.epm-delete:hover { background: #fef2f2; }
.epm-confirm-box { background: #fef2f2; border: 1.5px solid #fca5a5; border-radius: 12px; padding: 1rem; margin-top: 1rem; }
.dark-mode .epm-confirm-box { background: #3b0000; border-color: #7f1d1d; }
.epm-confirm-text { font-size: .9rem; font-weight: 600; color: #b91c1c; margin: 0 0 .75rem; }
.dark-mode .epm-confirm-text { color: #fca5a5; }
.epm-confirm-actions { display: flex; gap: .5rem; }
.epm-confirm-yes { flex: 1; padding: .6rem; background: #ef4444; color: #fff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: .88rem; }
.epm-confirm-yes:hover { background: #dc2626; }
.epm-confirm-no { flex: 1; padding: .6rem; background: none; border: 1.5px solid #e2e8f0; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: .88rem; color: #374151; }
.dark-mode .epm-confirm-no { color: #cbd5e1; border-color: #334155; }
`;

export default function EditProfileModal({ profile, onClose, onUpdated, onDeleted }) {
  const { updateProfile, deleteProfile } = useProfiles();

  // Basic
  const [name,        setName]        = useState(profile.name);
  const [ageGroup,    setAgeGroup]    = useState(profile.ageGroup || '');
  const [avatar,      setAvatar]      = useState(profile.avatar || '/icons/kids-spark.svg');
  const [gender,      setGender]      = useState(profile.gender || '');
  const [dateOfBirth, setDateOfBirth] = useState(
    profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : ''
  );

  // Clinical
  const [diagnoses,    setDiagnoses]    = useState(profile.clinical?.diagnoses   || []);
  const [goals,        setGoals]        = useState(profile.clinical?.goals        || []);
  const [strengths,    setStrengths]    = useState(profile.clinical?.strengths    || '');
  const [challenges,   setChallenges]   = useState(profile.clinical?.challenges   || '');
  const [supportLevel, setSupportLevel] = useState(profile.clinical?.supportLevel || '');

  // Preferences
  const [activities,          setActivities]          = useState(profile.preferences?.activities          || []);
  const [sensoryPreferences,  setSensoryPreferences]  = useState(profile.preferences?.sensoryPreferences  || '');
  const [communicationStyle,  setCommunicationStyle]  = useState(profile.preferences?.communicationStyle  || '');
  const [learningPreferences, setLearningPreferences] = useState(profile.preferences?.learningPreferences || '');

  const [activeTab,    setActiveTab]    = useState('basic'); // 'basic' | 'clinical' | 'preferences'
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,     setDeleting]     = useState(false);

  function toggleItem(arr, setArr, value) {
    setArr(arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setSubmitting(true);
    try {
      const updated = await updateProfile(profile.profileId, {
        name:        name.trim(),
        ageGroup:    ageGroup    || undefined,
        avatar,
        gender:      gender      || '',
        dateOfBirth: dateOfBirth || undefined,
        clinical: {
          diagnoses,
          goals,
          strengths:    strengths    || '',
          challenges:   challenges   || '',
          supportLevel: supportLevel || '',
        },
        preferences: {
          activities,
          sensoryPreferences:  sensoryPreferences  || '',
          communicationStyle:  communicationStyle  || '',
          learningPreferences: learningPreferences || '',
        },
      });
      if (onUpdated) onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Update failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteProfile(profile.profileId);
      if (onDeleted) onDeleted(profile.profileId);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not delete profile. Please try again.');
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <style>{STYLES}</style>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
      <div className="epm-overlay" role="dialog" aria-modal="true" aria-labelledby="epm-title" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="epm-modal">
          <div className="epm-header">
            <h2 className="epm-title" id="epm-title">Edit Profile</h2>
            <button className="epm-close" onClick={onClose} aria-label="Close">×</button>
          </div>

          {/* Tab navigation */}
          <div className="epm-tabs" role="tablist" aria-label="Profile sections">
            {[
              { id: 'basic',       label: 'Basic'       },
              { id: 'clinical',    label: 'Clinical'    },
              { id: 'preferences', label: 'Preferences' },
            ].map(tab => (
              <button
                key={tab.id}
                className={`epm-tab${activeTab === tab.id ? ' active' : ''}`}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`epm-panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSave} noValidate>

            {/* ── BASIC TAB ── */}
            <div id="epm-panel-basic" role="tabpanel" aria-labelledby="tab-basic" hidden={activeTab !== 'basic'}>
              <div className="epm-field">
                <label className="epm-label" htmlFor="epm-name">Name <span aria-hidden="true" style={{ color: '#ef4444' }}>*</span></label>
                <input
                  id="epm-name"
                  className="epm-input"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={64}
                  autoFocus
                  required
                />
              </div>

              <div className="epm-field">
                <label className="epm-label" htmlFor="epm-dob">Date of Birth</label>
                <input
                  id="epm-dob"
                  className="epm-input"
                  type="date"
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="epm-field">
                <span className="epm-label">Gender <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#94a3b8' }}>(optional)</span></span>
                <div className="epm-chip-grid" role="group" aria-label="Gender options">
                  {GENDER_OPTIONS.map(g => (
                    <button
                      key={g.value}
                      type="button"
                      className={`epm-chip${gender === g.value ? ' active' : ''}`}
                      onClick={() => setGender(gender === g.value ? '' : g.value)}
                      aria-pressed={gender === g.value}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="epm-field">
                <span className="epm-label">Age Group</span>
                <div className="epm-age-grid" role="group" aria-label="Age group options">
                  {AGE_GROUPS.map(ag => (
                    <button
                      key={ag.value}
                      type="button"
                      className={`epm-age-btn${ageGroup === ag.value ? ' active' : ''}`}
                      onClick={() => setAgeGroup(ag.value)}
                      aria-pressed={ageGroup === ag.value}
                    >
                      {ag.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="epm-field">
                <span className="epm-label">Avatar</span>
                <div className="epm-avatar-grid" role="group" aria-label="Avatar options">
                  {AVATAR_OPTIONS.map(em => (
                    <button
                      key={em}
                      type="button"
                      className={`epm-avatar-btn${avatar === em ? ' active' : ''}`}
                      onClick={() => setAvatar(em)}
                      aria-label={`Avatar ${em}`}
                      aria-pressed={avatar === em}
                    >
                      <img src={em} alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── CLINICAL TAB ── */}
            <div id="epm-panel-clinical" role="tabpanel" aria-labelledby="tab-clinical" hidden={activeTab !== 'clinical'}>
              <div className="epm-field">
                <span className="epm-label">Diagnosis / Diagnoses</span>
                <div className="epm-chip-grid" role="group" aria-label="Diagnosis options">
                  {COMMON_DIAGNOSES.map(d => (
                    <button
                      key={d}
                      type="button"
                      className={`epm-chip${diagnoses.includes(d) ? ' active' : ''}`}
                      onClick={() => toggleItem(diagnoses, setDiagnoses, d)}
                      aria-pressed={diagnoses.includes(d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="epm-field">
                <span className="epm-label">Goals / Focus Areas</span>
                <div className="epm-chip-grid" role="group" aria-label="Goal options">
                  {COMMON_GOALS.map(g => (
                    <button
                      key={g}
                      type="button"
                      className={`epm-chip${goals.includes(g) ? ' active' : ''}`}
                      onClick={() => toggleItem(goals, setGoals, g)}
                      aria-pressed={goals.includes(g)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="epm-field">
                <label className="epm-label" htmlFor="epm-strengths">Strengths</label>
                <textarea
                  id="epm-strengths"
                  className="epm-textarea"
                  value={strengths}
                  onChange={e => setStrengths(e.target.value)}
                  placeholder="Describe the child's strengths..."
                  maxLength={500}
                />
              </div>

              <div className="epm-field">
                <label className="epm-label" htmlFor="epm-challenges">Challenges</label>
                <textarea
                  id="epm-challenges"
                  className="epm-textarea"
                  value={challenges}
                  onChange={e => setChallenges(e.target.value)}
                  placeholder="Describe areas of challenge..."
                  maxLength={500}
                />
              </div>

              <div className="epm-field">
                <span className="epm-label">Support Level Needed</span>
                <div className="epm-chip-grid" role="group" aria-label="Support level options">
                  {SUPPORT_LEVELS.map(sl => (
                    <button
                      key={sl.value}
                      type="button"
                      className={`epm-chip${supportLevel === sl.value ? ' active' : ''}`}
                      onClick={() => setSupportLevel(supportLevel === sl.value ? '' : sl.value)}
                      aria-pressed={supportLevel === sl.value}
                    >
                      {sl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── PREFERENCES TAB ── */}
            <div id="epm-panel-preferences" role="tabpanel" aria-labelledby="tab-preferences" hidden={activeTab !== 'preferences'}>
              <div className="epm-field">
                <span className="epm-label">Preferred Activities</span>
                <div className="epm-chip-grid" role="group" aria-label="Activity preference options">
                  {COMMON_ACTIVITIES.map(a => (
                    <button
                      key={a}
                      type="button"
                      className={`epm-chip${activities.includes(a) ? ' active' : ''}`}
                      onClick={() => toggleItem(activities, setActivities, a)}
                      aria-pressed={activities.includes(a)}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="epm-field">
                <label className="epm-label" htmlFor="epm-sensory">Sensory Preferences</label>
                <textarea
                  id="epm-sensory"
                  className="epm-textarea"
                  value={sensoryPreferences}
                  onChange={e => setSensoryPreferences(e.target.value)}
                  placeholder="e.g. prefers low noise, likes deep pressure..."
                  maxLength={500}
                />
              </div>

              <div className="epm-field">
                <label className="epm-label" htmlFor="epm-comm">Communication Style</label>
                <textarea
                  id="epm-comm"
                  className="epm-textarea"
                  value={communicationStyle}
                  onChange={e => setCommunicationStyle(e.target.value)}
                  placeholder="e.g. uses AAC device, prefers visual supports..."
                  maxLength={500}
                />
              </div>

              <div className="epm-field">
                <label className="epm-label" htmlFor="epm-learning">Learning Preferences</label>
                <textarea
                  id="epm-learning"
                  className="epm-textarea"
                  value={learningPreferences}
                  onChange={e => setLearningPreferences(e.target.value)}
                  placeholder="e.g. visual learner, hands-on activities..."
                  maxLength={500}
                />
              </div>
            </div>

            {error && <p className="epm-error" role="alert">{error}</p>}

            <div className="epm-actions">
              <button type="submit" className="epm-save" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="epm-delete"
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </button>
            </div>
          </form>

          {confirmDelete && (
            <div className="epm-confirm-box">
              <p className="epm-confirm-text">
                Are you sure you want to delete <strong>{profile.name}</strong>'s profile?
                Their progress will be archived and can't be recovered.
              </p>
              <div className="epm-confirm-actions">
                <button className="epm-confirm-yes" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting…' : 'Yes, Delete'}
                </button>
                <button className="epm-confirm-no" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
