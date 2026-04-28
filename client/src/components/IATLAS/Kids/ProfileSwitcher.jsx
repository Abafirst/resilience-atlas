/**
 * ProfileSwitcher.jsx  (Kids section)
 * Compact inline switcher for selecting the active child profile while
 * browsing Kids activities.  Renders inside the Kids page header.
 *
 * Props: (none — reads from ProfileContext)
 */

import React, { useState } from 'react';
import { useProfiles } from '../../../contexts/ProfileContext.jsx';
import {
  getIATLASTier,
  getMaxProfiles,
} from '../../../utils/iatlasGating.js';
import AddChildProfileModal from './AddChildProfileModal.jsx';

const AGE_LABELS = {
  '5-7':   'Ages 5–7',
  '8-10':  'Ages 8–10',
  '11-14': 'Ages 11–14',
  '15-18': 'Ages 15–18',
};

const STYLES = `
.kps-root {
  display: flex; align-items: center; gap: .6rem; flex-wrap: wrap;
}
.kps-label {
  font-size: .82rem; font-weight: 700; color: rgba(255,255,255,.7);
  text-transform: uppercase; letter-spacing: .04em;
}
.kps-select-wrap { position: relative; }
.kps-select {
  appearance: none; -webkit-appearance: none;
  padding: .45rem 2rem .45rem .9rem;
  border-radius: 20px; border: 1.5px solid rgba(255,255,255,.3);
  background: rgba(255,255,255,.15); backdrop-filter: blur(6px);
  color: #fff; font-size: .9rem; font-weight: 700; cursor: pointer;
  transition: background .15s;
}
.kps-select:hover { background: rgba(255,255,255,.25); }
.kps-select:focus { outline: 2px solid rgba(255,255,255,.5); outline-offset: 2px; }
.kps-select option { background: #1e293b; color: #f1f5f9; }
.kps-caret {
  position: absolute; right: .7rem; top: 50%; transform: translateY(-50%);
  font-size: .65rem; color: rgba(255,255,255,.75); pointer-events: none;
}
.kps-add-btn {
  display: flex; align-items: center; gap: .3rem;
  padding: .4rem .9rem; border-radius: 20px;
  border: 1.5px solid rgba(255,255,255,.3);
  background: rgba(255,255,255,.12); color: #fff;
  font-size: .82rem; font-weight: 700; cursor: pointer;
  transition: background .15s;
}
.kps-add-btn:hover:not(:disabled) { background: rgba(255,255,255,.22); }
.kps-add-btn:disabled { opacity: .4; cursor: not-allowed; }
`;

export default function ProfileSwitcher() {
  const { profiles, activeProfileId, switchProfile, loading } = useProfiles();
  const tier        = getIATLASTier();
  const maxProfiles = getMaxProfiles(tier);

  const [showAddModal, setShowAddModal] = useState(false);

  // Don't render if the user has no profiles (they haven't set any up yet)
  // or if profiles are still loading.
  if (loading || profiles.length === 0) return null;

  const atLimit = maxProfiles > 0 && profiles.length >= maxProfiles;

  function handleChange(e) {
    switchProfile(e.target.value);
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="kps-root">
        <span className="kps-label">Viewing:</span>

        <div className="kps-select-wrap">
          <select
            className="kps-select"
            value={activeProfileId || ''}
            onChange={handleChange}
            aria-label="Select child profile"
          >
            {profiles.map((p) => (
              <option key={p.profileId} value={p.profileId}>
                {p.name}
                {p.ageGroup ? ` · ${AGE_LABELS[p.ageGroup] || p.ageGroup}` : ''}
              </option>
            ))}
          </select>
          <span className="kps-caret" aria-hidden="true">▼</span>
        </div>

        {maxProfiles > 0 && (
          <button
            className="kps-add-btn"
            onClick={() => setShowAddModal(true)}
            disabled={atLimit}
            title={
              atLimit
                ? `Profile limit reached (${profiles.length}/${maxProfiles})`
                : 'Add a child profile'
            }
          >
            ＋ Add Child
          </button>
        )}
      </div>

      {showAddModal && (
        <AddChildProfileModal onClose={() => setShowAddModal(false)} />
      )}
    </>
  );
}
