/**
 * AddChildModal.jsx
 * Modal form for creating a new child profile.
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

const STYLES = `
.acm-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.55);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 1rem;
}
.acm-modal {
  background: #fff; border-radius: 20px;
  padding: 2rem; max-width: 460px; width: 100%;
  box-shadow: 0 20px 60px rgba(0,0,0,.25);
  animation: acm-in .2s ease;
}
@keyframes acm-in { from { transform: scale(.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.dark-mode .acm-modal { background: #1e293b; color: #f1f5f9; }
.acm-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.acm-title { font-size: 1.2rem; font-weight: 800; color: #0f172a; margin: 0; }
.dark-mode .acm-title { color: #f1f5f9; }
.acm-close { background: none; border: none; cursor: pointer; font-size: 1.4rem; color: #94a3b8; padding: 0.2rem; }
.acm-close:hover { color: #0f172a; }
.dark-mode .acm-close:hover { color: #f1f5f9; }
.acm-label { font-size: .8rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #64748b; display: block; margin-bottom: .5rem; }
.dark-mode .acm-label { color: #94a3b8; }
.acm-input {
  width: 100%; padding: .65rem .9rem; border: 1.5px solid #e2e8f0;
  border-radius: 10px; font-size: .95rem; background: #f8fafc;
  color: #0f172a; box-sizing: border-box; outline: none;
  transition: border-color .15s;
}
.acm-input:focus { border-color: #6366f1; background: #fff; }
.dark-mode .acm-input { background: #0f172a; border-color: #334155; color: #f1f5f9; }
.dark-mode .acm-input:focus { border-color: #818cf8; background: #1e293b; }
.acm-field { margin-bottom: 1.25rem; }
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
.acm-avatar-grid { display: flex; flex-wrap: wrap; gap: .4rem; }
.acm-avatar-btn {
  width: 40px; height: 40px; border: 2px solid transparent; border-radius: 10px;
  background: #f1f5f9; cursor: pointer; font-size: 1.3rem;
  display: flex; align-items: center; justify-content: center;
  transition: all .15s;
}
.acm-avatar-btn:hover { border-color: #6366f1; background: #eef2ff; transform: scale(1.1); }
.acm-avatar-btn.active { border-color: #6366f1; background: #eef2ff; transform: scale(1.1); }
.dark-mode .acm-avatar-btn { background: #0f172a; }
.dark-mode .acm-avatar-btn.active { background: #1e1b4b; border-color: #818cf8; }
.acm-error { color: #ef4444; font-size: .83rem; margin-bottom: .75rem; }
.acm-submit {
  width: 100%; padding: .75rem; background: linear-gradient(135deg,#6366f1,#8b5cf6);
  color: #fff; border: none; border-radius: 12px; font-size: .95rem; font-weight: 700;
  cursor: pointer; transition: opacity .15s; margin-top: .25rem;
}
.acm-submit:hover:not(:disabled) { opacity: .9; }
.acm-submit:disabled { opacity: .5; cursor: not-allowed; }
`;

export default function AddChildModal({ onClose, onCreated, currentCount }) {
  const { createProfile } = useProfiles();
  const tier = getIATLASTier();
  const maxProfiles = getMaxProfiles(tier);

  const [name,      setName]      = useState('');
  const [ageGroup,  setAgeGroup]  = useState('');
  const [avatar,    setAvatar]    = useState('🧒');
  const [submitting, setSubmitting] = useState(false);
  const [error,     setError]     = useState('');

  const atLimit = currentCount >= maxProfiles;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter a name for this child.');
      return;
    }

    setSubmitting(true);
    try {
      const profile = await createProfile({ name: name.trim(), ageGroup: ageGroup || undefined, avatar });
      if (onCreated) onCreated(profile);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not create profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <style>{STYLES}</style>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
      <div className="acm-overlay" role="dialog" aria-modal="true" aria-labelledby="acm-title" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="acm-modal">
          <div className="acm-header">
            <h2 className="acm-title" id="acm-title">Add Child Profile</h2>
            <button className="acm-close" onClick={onClose} aria-label="Close">×</button>
          </div>

          {atLimit ? (
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
                <button
                  onClick={onClose}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontWeight: 700, fontSize: '.9rem' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="acm-field">
                <label className="acm-label" htmlFor="acm-name">Child's Name</label>
                <input
                  id="acm-name"
                  className="acm-input"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alex"
                  maxLength={64}
                  autoFocus
                />
              </div>

              <div className="acm-field">
                <span className="acm-label">Age Group</span>
                <div className="acm-age-grid">
                  {AGE_GROUPS.map(ag => (
                    <button
                      key={ag.value}
                      type="button"
                      className={`acm-age-btn${ageGroup === ag.value ? ' active' : ''}`}
                      onClick={() => setAgeGroup(ag.value)}
                    >
                      {ag.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="acm-field">
                <span className="acm-label">Avatar</span>
                <div className="acm-avatar-grid">
                  {AVATAR_OPTIONS.map(em => (
                    <button
                      key={em}
                      type="button"
                      className={`acm-avatar-btn${avatar === em ? ' active' : ''}`}
                      onClick={() => setAvatar(em)}
                      aria-label={`Avatar ${em}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="acm-error" role="alert">{error}</p>}

              <button type="submit" className="acm-submit" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Profile'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
