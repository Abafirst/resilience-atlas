/**
 * AddChildProfileModal.jsx
 * Lightweight modal for creating a new child profile from within the Kids
 * section.  Uses ProfileContext for data management and mirrors the age-group
 * identifiers used by KidsAgeGroupPage.
 *
 * Props:
 *   onClose()  — dismiss the modal
 */

import React, { useState } from 'react';
import { useProfiles } from '../../../contexts/ProfileContext.jsx';
import {
  getIATLASTier,
  getMaxProfiles,
} from '../../../utils/iatlasGating.js';

const AGE_GROUPS = [
  { value: '5-7',   label: 'Ages 5–7'   },
  { value: '8-10',  label: 'Ages 8–10'  },
  { value: '11-14', label: 'Ages 11–14' },
  { value: '15-18', label: 'Ages 15–18' },
];

const AVATAR_OPTIONS = [
  '/icons/kids-spark.svg', '/icons/star.svg', '/icons/compass.svg',
  '/icons/game-shield.svg', '/icons/trophy.svg', '/icons/game-mountain.svg',
  '/icons/growth.svg', '/icons/strength.svg', '/icons/quest.svg',
  '/icons/game-scroll.svg', '/icons/connection.svg', '/icons/game-diamond.svg',
  '/icons/star-burst.svg', '/icons/game-map.svg', '/icons/game-target.svg',
  '/icons/emotion.svg', '/icons/reflection.svg', '/icons/mindfulness.svg',
];

const STYLES = `
.acpm-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,.55); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}
.acpm-card {
  background: #fff; border-radius: 20px;
  padding: 2rem; width: 100%; max-width: 440px;
  box-shadow: 0 24px 60px rgba(0,0,0,.25);
  animation: acpm-in .2s ease;
}
.dark-mode .acpm-card { background: #1e293b; color: #f1f5f9; }
@keyframes acpm-in { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: none; } }
.acpm-title {
  margin: 0 0 1.25rem; font-size: 1.3rem; font-weight: 800;
  color: #0f172a;
}
.dark-mode .acpm-title { color: #f1f5f9; }
.acpm-field { margin-bottom: 1rem; }
.acpm-label {
  display: block; font-size: .82rem; font-weight: 700;
  color: #475569; margin-bottom: .35rem;
  text-transform: uppercase; letter-spacing: .04em;
}
.dark-mode .acpm-label { color: #94a3b8; }
.acpm-input, .acpm-select {
  width: 100%; padding: .6rem .85rem; border-radius: 10px;
  border: 1.5px solid #e2e8f0; font-size: .95rem;
  background: #f8fafc; color: #0f172a;
  transition: border-color .15s;
  box-sizing: border-box;
}
.acpm-input:focus, .acpm-select:focus {
  outline: none; border-color: #6366f1;
}
.dark-mode .acpm-input, .dark-mode .acpm-select {
  background: #0f172a; border-color: #334155; color: #f1f5f9;
}
.acpm-avatar-grid {
  display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .35rem;
}
.acpm-avatar-btn {
  font-size: 1.5rem; width: 2.6rem; height: 2.6rem;
  border-radius: 10px; border: 2px solid transparent;
  background: #f1f5f9; cursor: pointer; display: flex;
  align-items: center; justify-content: center;
  transition: border-color .15s, background .15s;
}
.acpm-avatar-btn:hover { background: #e2e8f0; }
.acpm-avatar-btn.selected { border-color: #6366f1; background: #eef2ff; }
.dark-mode .acpm-avatar-btn { background: #1e293b; }
.dark-mode .acpm-avatar-btn.selected { background: #1e1b4b; }
.acpm-error {
  font-size: .85rem; color: #ef4444;
  margin: .5rem 0 0; padding: .5rem .75rem;
  background: #fef2f2; border-radius: 8px;
}
.acpm-actions {
  display: flex; gap: .75rem; justify-content: flex-end; margin-top: 1.5rem;
}
.acpm-btn {
  padding: .6rem 1.2rem; border-radius: 10px; font-size: .9rem;
  font-weight: 700; cursor: pointer; border: none;
  transition: opacity .15s;
}
.acpm-btn:disabled { opacity: .5; cursor: not-allowed; }
.acpm-btn-cancel {
  background: #f1f5f9; color: #475569;
}
.dark-mode .acpm-btn-cancel { background: #334155; color: #cbd5e1; }
.acpm-btn-primary {
  background: #6366f1; color: #fff;
}
.acpm-btn-primary:hover:not(:disabled) { background: #4f46e5; }
`;

export default function AddChildProfileModal({ onClose }) {
  const { profiles, createProfile } = useProfiles();
  const tier        = getIATLASTier();
  const maxProfiles = getMaxProfiles(tier);

  const [name,     setName]     = useState('');
  const [ageGroup, setAgeGroup] = useState('5-7');
  const [avatar,   setAvatar]   = useState('/icons/kids-spark.svg');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // Guard: prevent creating beyond tier limit.
  if (maxProfiles > 0 && profiles.length >= maxProfiles) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="acpm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
          <div className="acpm-card">
            <h2 className="acpm-title">Profile Limit Reached</h2>
            <p style={{ color: '#64748b', fontSize: '.95rem' }}>
              Your <strong>{tier}</strong> plan allows up to{' '}
              <strong>{maxProfiles}</strong> child profile
              {maxProfiles !== 1 ? 's' : ''}. Upgrade to add more.
            </p>
            <div className="acpm-actions">
              <button className="acpm-btn acpm-btn-cancel" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter a name.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await createProfile({ name: trimmed, ageGroup, avatar });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{STYLES}</style>
      <div
        className="acpm-overlay"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="acpm-heading"
      >
        <div className="acpm-card">
          <h2 className="acpm-title" id="acpm-heading">Add Child Profile</h2>

          <form onSubmit={handleSubmit} noValidate>
            {/* Name */}
            <div className="acpm-field">
              <label className="acpm-label" htmlFor="acpm-name">Name *</label>
              <input
                id="acpm-name"
                className="acpm-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter child's name"
                maxLength={64}
                required
                autoFocus
              />
            </div>

            {/* Age Group */}
            <div className="acpm-field">
              <label className="acpm-label" htmlFor="acpm-age">Age Group *</label>
              <select
                id="acpm-age"
                className="acpm-select"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
              >
                {AGE_GROUPS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Avatar */}
            <div className="acpm-field">
              <label className="acpm-label">Choose Avatar</label>
              <div className="acpm-avatar-grid" role="radiogroup" aria-label="Avatar options">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    className={`acpm-avatar-btn${avatar === av ? ' selected' : ''}`}
                    onClick={() => setAvatar(av)}
                    role="radio"
                    aria-checked={avatar === av}
                    title={av}
                  >
                    <img src={av} alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="acpm-error" role="alert">{error}</p>}

            <div className="acpm-actions">
              <button
                type="button"
                className="acpm-btn acpm-btn-cancel"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="acpm-btn acpm-btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating…' : 'Create Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
