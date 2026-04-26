/**
 * ProfileManager.jsx
 * Grid of child profiles with quick-stats.
 * Lets parents view, switch to, edit, or add profiles.
 * Clicking a profile card navigates to the individual profile detail view.
 *
 * Props: (none — reads from ProfileContext)
 */

import React, { useState } from 'react';
import { useProfiles } from '../../../contexts/ProfileContext.jsx';
import AddChildModal     from './AddChildModal.jsx';
import EditProfileModal  from './EditProfileModal.jsx';
import ChildProfileDetail from './ChildProfileDetail.jsx';
import {
  getIATLASTier,
  getMaxProfiles,
} from '../../../utils/iatlasGating.js';

const STYLES = `
.pm-root { padding: 0; }
.pm-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: .5rem; }
.pm-title { font-size: 1.2rem; font-weight: 800; color: #0f172a; margin: 0; }
.dark-mode .pm-title { color: #f1f5f9; }
.pm-add-btn {
  display: flex; align-items: center; gap: .4rem;
  padding: .55rem 1.1rem; background: linear-gradient(135deg,#6366f1,#8b5cf6);
  color: #fff; border: none; border-radius: 10px; font-size: .88rem; font-weight: 700;
  cursor: pointer; transition: opacity .15s;
}
.pm-add-btn:hover:not(:disabled) { opacity: .88; }
.pm-add-btn:disabled { opacity: .4; cursor: not-allowed; }
.pm-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;
}
.pm-card {
  background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px;
  padding: 1.25rem; display: flex; flex-direction: column; align-items: center;
  gap: .6rem; transition: box-shadow .15s, border-color .15s; position: relative;
  cursor: pointer;
}
.pm-card:hover { box-shadow: 0 4px 20px rgba(99,102,241,.12); border-color: #c7d2fe; }
.pm-card.active { border-color: #6366f1; box-shadow: 0 4px 20px rgba(99,102,241,.2); }
.dark-mode .pm-card { background: #1e293b; border-color: #334155; }
.dark-mode .pm-card.active { border-color: #818cf8; }
.pm-card-avatar { font-size: 2.8rem; line-height: 1; }
.pm-card-name { font-size: 1rem; font-weight: 800; color: #0f172a; text-align: center; }
.dark-mode .pm-card-name { color: #f1f5f9; }
.pm-card-age { font-size: .78rem; color: #64748b; }
.pm-card-badge {
  position: absolute; top: .6rem; right: .6rem;
  background: #6366f1; color: #fff; font-size: .65rem; font-weight: 700;
  padding: .15rem .5rem; border-radius: 20px;
}
.pm-card-actions { display: flex; gap: .4rem; margin-top: .25rem; width: 100%; }
.pm-switch-btn {
  flex: 1; padding: .5rem; background: #eef2ff; border: none; border-radius: 8px;
  color: #4338ca; font-size: .83rem; font-weight: 700; cursor: pointer; transition: background .15s;
}
.pm-switch-btn:hover { background: #e0e7ff; }
.pm-card.active .pm-switch-btn { background: #6366f1; color: #fff; }
.pm-card.active .pm-switch-btn:hover { background: #4f46e5; }
.pm-edit-btn {
  padding: .5rem .7rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
  color: #64748b; font-size: .83rem; cursor: pointer; transition: all .15s;
}
.pm-edit-btn:hover { background: #f1f5f9; color: #374151; }
.pm-view-btn {
  padding: .5rem .7rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
  color: #64748b; font-size: .83rem; cursor: pointer; transition: all .15s;
}
.pm-view-btn:hover { background: #f1f5f9; color: #374151; }
.dark-mode .pm-switch-btn { background: #1e1b4b; color: #a5b4fc; }
.dark-mode .pm-card.active .pm-switch-btn { background: #6366f1; color: #fff; }
.dark-mode .pm-edit-btn { background: #0f172a; border-color: #334155; color: #94a3b8; }
.dark-mode .pm-edit-btn:hover { background: #1e293b; color: #cbd5e1; }
.dark-mode .pm-view-btn { background: #0f172a; border-color: #334155; color: #94a3b8; }
.dark-mode .pm-view-btn:hover { background: #1e293b; color: #cbd5e1; }
.pm-empty { text-align: center; padding: 2.5rem 1rem; color: #64748b; }
.pm-empty-icon { font-size: 2.5rem; margin-bottom: .75rem; }
.pm-empty-text { font-size: .92rem; }
.pm-limit-note { font-size: .8rem; color: #94a3b8; text-align: center; margin-top: .5rem; }
.pm-card-dob { font-size: .75rem; color: #94a3b8; }
`;

const AGE_LABELS = {
  '5-7':   'Ages 5–7',
  '8-10':  'Ages 8–10',
  '11-14': 'Ages 11–14',
  '15-18': 'Ages 15–18',
};

function getAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const age = Math.floor((Date.now() - new Date(dateOfBirth)) / (365.25 * 24 * 3600 * 1000));
  return isNaN(age) ? null : age;
}

export default function ProfileManager() {
  const { profiles, activeProfileId, switchProfile, loading, refreshProfiles } = useProfiles();
  const tier        = getIATLASTier();
  const maxProfiles = getMaxProfiles(tier);

  const [showAddModal,    setShowAddModal]    = useState(false);
  const [editingProfile,  setEditingProfile]  = useState(null);
  const [viewingProfile,  setViewingProfile]  = useState(null);

  const atLimit = profiles.length >= maxProfiles;

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading profiles…</div>;
  }

  function getFreshProfile(profileId) {
    return profiles.find(p => p.profileId === profileId) || viewingProfile;
  }

  // ── Detail view ──
  if (viewingProfile) {
    return (
      <ChildProfileDetail
        profile={getFreshProfile(viewingProfile.profileId)}
        onBack={() => setViewingProfile(null)}
        onEdit={() => {
          refreshProfiles();
          setViewingProfile(getFreshProfile(viewingProfile.profileId));
        }}
      />
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="pm-root">
        <div className="pm-header">
          <h2 className="pm-title">Child Profiles</h2>
          <button
            className="pm-add-btn"
            onClick={() => setShowAddModal(true)}
            disabled={atLimit || maxProfiles === 0}
            title={atLimit ? `Limit of ${maxProfiles} profiles reached` : 'Add a child profile'}
          >
            ＋ Add Child
          </button>
        </div>

        {profiles.length === 0 ? (
          <div className="pm-empty">
            <div className="pm-empty-icon">👶</div>
            <p className="pm-empty-text">No child profiles yet.<br />Create one to start tracking progress!</p>
          </div>
        ) : (
          <div className="pm-grid">
            {profiles.map(p => {
              const isActive = p.profileId === activeProfileId;
              const age = getAge(p.dateOfBirth);
              return (
                <div
                  key={p.profileId}
                  className={`pm-card${isActive ? ' active' : ''}`}
                  onClick={() => setViewingProfile(p)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${p.name}'s profile`}
                  onKeyDown={e => e.key === 'Enter' && setViewingProfile(p)}
                >
                  {isActive && <span className="pm-card-badge">Active</span>}
                  <div className="pm-card-avatar">{p.avatar}</div>
                  <div className="pm-card-name">{p.name}</div>
                  {age != null
                    ? <div className="pm-card-dob">{age} yrs old</div>
                    : p.ageGroup && <div className="pm-card-age">{AGE_LABELS[p.ageGroup] || p.ageGroup}</div>
                  }
                  <div className="pm-card-actions" onClick={e => e.stopPropagation()}>
                    <button
                      className="pm-switch-btn"
                      onClick={() => switchProfile(p.profileId)}
                      aria-label={isActive ? `${p.name} is the active profile` : `Switch to ${p.name}`}
                    >
                      {isActive ? '✓ Active' : 'Switch'}
                    </button>
                    <button
                      className="pm-view-btn"
                      onClick={() => setViewingProfile(p)}
                      aria-label={`View ${p.name}'s full profile`}
                      title="View profile"
                    >
                      👁
                    </button>
                    <button
                      className="pm-edit-btn"
                      onClick={() => setEditingProfile(p)}
                      aria-label={`Edit ${p.name}'s profile`}
                      title="Edit profile"
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {maxProfiles > 0 && (
          <p className="pm-limit-note">
            {profiles.length} / {maxProfiles} profiles used
            {tier === 'individual' && profiles.length >= maxProfiles && ' — Upgrade to Family for up to 5 profiles.'}
          </p>
        )}
      </div>

      {showAddModal && (
        <AddChildModal
          onClose={() => setShowAddModal(false)}
          currentCount={profiles.length}
        />
      )}

      {editingProfile && (
        <EditProfileModal
          profile={editingProfile}
          onClose={() => setEditingProfile(null)}
          onUpdated={() => setEditingProfile(null)}
          onDeleted={() => setEditingProfile(null)}
        />
      )}
    </>
  );
}
