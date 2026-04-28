/**
 * SharedFamilyDashboard.jsx
 * Family-level overview that shows all child profiles and their current
 * progress at a glance.  Intended for the Family tier parent view.
 *
 * Props: (none — reads from ProfileContext)
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfiles } from '../../../contexts/ProfileContext.jsx';
import AddChildProfileModal from './AddChildProfileModal.jsx';
import {
  getIATLASTier,
  getMaxProfiles,
} from '../../../utils/iatlasGating.js';

const AGE_LABELS = {
  '5-7':   'Ages 5–7',
  '8-10':  'Ages 8–10',
  '11-14': 'Ages 11–14',
  '15-18': 'Ages 15–18',
};

const STYLES = `
.sfd-root { padding: 1.5rem 0; }
.sfd-header {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: .75rem; margin-bottom: 1.5rem;
}
.sfd-title {
  font-size: 1.4rem; font-weight: 800; color: #0f172a; margin: 0;
}
.dark-mode .sfd-title { color: #f1f5f9; }
.sfd-subtitle { font-size: .9rem; color: #64748b; margin: .25rem 0 0; }
.dark-mode .sfd-subtitle { color: #94a3b8; }
.sfd-add-btn {
  display: flex; align-items: center; gap: .4rem;
  padding: .55rem 1.1rem; border-radius: 12px;
  background: #6366f1; color: #fff; border: none;
  font-size: .88rem; font-weight: 700; cursor: pointer;
  transition: background .15s;
}
.sfd-add-btn:hover:not(:disabled) { background: #4f46e5; }
.sfd-add-btn:disabled { opacity: .45; cursor: not-allowed; }
.sfd-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.1rem;
}
.sfd-card {
  background: #fff; border-radius: 16px;
  padding: 1.4rem 1.2rem; text-align: center;
  box-shadow: 0 2px 12px rgba(0,0,0,.06);
  cursor: pointer;
  transition: transform .15s, box-shadow .15s;
  border: 2px solid transparent;
}
.sfd-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(99,102,241,.15);
}
.sfd-card.active { border-color: #6366f1; }
.dark-mode .sfd-card { background: #1e293b; }
.sfd-avatar { font-size: 2.8rem; line-height: 1; margin-bottom: .6rem; }
.sfd-name {
  font-size: 1.05rem; font-weight: 800; color: #0f172a; margin: 0 0 .25rem;
}
.dark-mode .sfd-name { color: #f1f5f9; }
.sfd-age { font-size: .82rem; color: #64748b; margin: 0 0 .85rem; }
.dark-mode .sfd-age { color: #94a3b8; }
.sfd-quick-stats {
  display: flex; justify-content: center; gap: .85rem;
  font-size: .85rem; color: #475569; margin-bottom: 1rem;
}
.dark-mode .sfd-quick-stats { color: #94a3b8; }
.sfd-view-link {
  display: inline-block; padding: .4rem .9rem;
  border-radius: 20px; background: #eef2ff; color: #6366f1;
  font-size: .82rem; font-weight: 700; text-decoration: none;
  transition: background .15s;
}
.sfd-view-link:hover { background: #e0e7ff; }
.sfd-empty {
  text-align: center; padding: 3rem 1rem; color: #64748b;
}
.dark-mode .sfd-empty { color: #94a3b8; }
.sfd-empty-icon { font-size: 3rem; margin-bottom: .75rem; }
.sfd-empty-msg { font-size: .95rem; margin: 0 0 1.25rem; }
`;

export default function SharedFamilyDashboard() {
  const { profiles, activeProfileId, switchProfile, loading } = useProfiles();
  const tier        = getIATLASTier();
  const maxProfiles = getMaxProfiles(tier);

  const [showAddModal, setShowAddModal] = useState(false);

  const atLimit = maxProfiles > 0 && profiles.length >= maxProfiles;

  function handleCardClick(profileId) {
    switchProfile(profileId);
  }

  if (loading) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="sfd-root">
          <div className="sfd-empty">
            <div className="sfd-empty-icon">⏳</div>
            <p className="sfd-empty-msg">Loading profiles…</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="sfd-root">
        <div className="sfd-header">
          <div>
            <h2 className="sfd-title">Family Progress Overview</h2>
            {maxProfiles > 0 && (
              <p className="sfd-subtitle">
                {profiles.length} of {maxProfiles} profile
                {maxProfiles !== 1 ? 's' : ''} active
              </p>
            )}
          </div>

          {maxProfiles > 0 && (
            <button
              className="sfd-add-btn"
              onClick={() => setShowAddModal(true)}
              disabled={atLimit}
              title={atLimit ? `Profile limit reached (${profiles.length}/${maxProfiles})` : 'Add a child profile'}
            >
              ＋ Add Child
            </button>
          )}
        </div>

        {profiles.length === 0 ? (
          <div className="sfd-empty">
            <div className="sfd-empty-icon"><img src="/icons/network.svg" alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>
            <p className="sfd-empty-msg">
              No child profiles yet. Create one to get started!
            </p>
            {maxProfiles > 0 && (
              <button className="sfd-add-btn" onClick={() => setShowAddModal(true)}>
                ＋ Add First Child
              </button>
            )}
          </div>
        ) : (
          <div className="sfd-grid">
            {profiles.map((profile) => {
              const xp      = profile.progress?.totalXP     ?? 0;
              const streak  = profile.progress?.streaks?.current ?? 0;

              return (
                <div
                  key={profile.profileId}
                  className={`sfd-card${profile.profileId === activeProfileId ? ' active' : ''}`}
                  onClick={() => handleCardClick(profile.profileId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleCardClick(profile.profileId)}
                  aria-label={`Switch to ${profile.name}'s profile`}
                >
                  <div className="sfd-avatar"><img src={profile.avatar || '/icons/kids-spark.svg'} alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>
                  <h3 className="sfd-name">{profile.name}</h3>
                  {profile.ageGroup && (
                    <p className="sfd-age">
                      {AGE_LABELS[profile.ageGroup] || profile.ageGroup}
                    </p>
                  )}
                  <div className="sfd-quick-stats">
                    <span><img src="/icons/star.svg" alt="" aria-hidden="true" className="icon icon-sm" /> {xp} XP</span>
                    <span><img src="/icons/fire.svg" alt="" aria-hidden="true" className="icon icon-sm" /> {streak} day{streak !== 1 ? 's' : ''}</span>
                  </div>
                  {profile.ageGroup && (
                    <Link
                      to={`/iatlas/kids/${profile.ageGroup}`}
                      className="sfd-view-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Progress
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddChildProfileModal onClose={() => setShowAddModal(false)} />
      )}
    </>
  );
}
