/**
 * EditProfileModal.jsx
 * Modal for editing an existing child profile (name, avatar, age group).
 * Also handles soft-deletion (archive) with a confirmation step.
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
.epm-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.55);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 1rem;
}
.epm-modal {
  background: #fff; border-radius: 20px;
  padding: 2rem; max-width: 460px; width: 100%;
  box-shadow: 0 20px 60px rgba(0,0,0,.25);
  animation: epm-in .2s ease;
}
@keyframes epm-in { from { transform: scale(.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.dark-mode .epm-modal { background: #1e293b; color: #f1f5f9; }
.epm-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.epm-title { font-size: 1.2rem; font-weight: 800; color: #0f172a; margin: 0; }
.dark-mode .epm-title { color: #f1f5f9; }
.epm-close { background: none; border: none; cursor: pointer; font-size: 1.4rem; color: #94a3b8; padding: 0.2rem; }
.epm-close:hover { color: #0f172a; }
.dark-mode .epm-close:hover { color: #f1f5f9; }
.epm-label { font-size: .8rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #64748b; display: block; margin-bottom: .5rem; }
.dark-mode .epm-label { color: #94a3b8; }
.epm-input {
  width: 100%; padding: .65rem .9rem; border: 1.5px solid #e2e8f0;
  border-radius: 10px; font-size: .95rem; background: #f8fafc;
  color: #0f172a; box-sizing: border-box; outline: none; transition: border-color .15s;
}
.epm-input:focus { border-color: #6366f1; background: #fff; }
.dark-mode .epm-input { background: #0f172a; border-color: #334155; color: #f1f5f9; }
.dark-mode .epm-input:focus { border-color: #818cf8; background: #1e293b; }
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

  const [name,         setName]         = useState(profile.name);
  const [ageGroup,     setAgeGroup]     = useState(profile.ageGroup || '');
  const [avatar,       setAvatar]       = useState(profile.avatar || '🧒');
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,     setDeleting]     = useState(false);

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
        name: name.trim(),
        ageGroup: ageGroup || undefined,
        avatar,
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

          <form onSubmit={handleSave} noValidate>
            <div className="epm-field">
              <label className="epm-label" htmlFor="epm-name">Name</label>
              <input
                id="epm-name"
                className="epm-input"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={64}
                autoFocus
              />
            </div>

            <div className="epm-field">
              <span className="epm-label">Age Group</span>
              <div className="epm-age-grid">
                {AGE_GROUPS.map(ag => (
                  <button
                    key={ag.value}
                    type="button"
                    className={`epm-age-btn${ageGroup === ag.value ? ' active' : ''}`}
                    onClick={() => setAgeGroup(ag.value)}
                  >
                    {ag.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="epm-field">
              <span className="epm-label">Avatar</span>
              <div className="epm-avatar-grid">
                {AVATAR_OPTIONS.map(em => (
                  <button
                    key={em}
                    type="button"
                    className={`epm-avatar-btn${avatar === em ? ' active' : ''}`}
                    onClick={() => setAvatar(em)}
                    aria-label={`Avatar ${em}`}
                  >
                    {em}
                  </button>
                ))}
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
                🗑 Delete
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
