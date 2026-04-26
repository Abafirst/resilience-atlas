/**
 * ProfileSwitcher.jsx
 * Compact dropdown/button for switching between child profiles.
 * Intended for the header of Kids pages.
 *
 * Props: (none — reads from ProfileContext)
 */

import React, { useState, useRef, useEffect } from 'react';
import { useProfiles } from '../../../contexts/ProfileContext.jsx';
import AddChildModal from './AddChildModal.jsx';
import {
  getIATLASTier,
  getMaxProfiles,
} from '../../../utils/iatlasGating.js';

const STYLES = `
.ps-root { position: relative; display: inline-block; }
.ps-trigger {
  display: flex; align-items: center; gap: .45rem;
  padding: .45rem .85rem; border-radius: 24px;
  background: rgba(255,255,255,.15); backdrop-filter: blur(6px);
  border: 1.5px solid rgba(255,255,255,.3);
  cursor: pointer; color: #fff; font-size: .88rem; font-weight: 700;
  transition: background .15s;
}
.ps-trigger:hover { background: rgba(255,255,255,.25); }
.ps-trigger-avatar { font-size: 1.1rem; line-height: 1; }
.ps-trigger-name { max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ps-trigger-caret { font-size: .65rem; opacity: .75; }
.ps-dropdown {
  position: absolute; top: calc(100% + .5rem); right: 0;
  background: #fff; border-radius: 16px; padding: .5rem;
  box-shadow: 0 10px 40px rgba(0,0,0,.2);
  min-width: 220px; z-index: 500;
  animation: ps-dd-in .15s ease;
}
@keyframes ps-dd-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
.dark-mode .ps-dropdown { background: #1e293b; border: 1px solid #334155; }
.ps-profile-row {
  display: flex; align-items: center; gap: .65rem;
  padding: .55rem .75rem; border-radius: 10px; cursor: pointer;
  transition: background .1s;
}
.ps-profile-row:hover { background: #f1f5f9; }
.ps-profile-row.active { background: #eef2ff; }
.dark-mode .ps-profile-row:hover { background: #0f172a; }
.dark-mode .ps-profile-row.active { background: #1e1b4b; }
.ps-row-avatar { font-size: 1.3rem; line-height: 1; }
.ps-row-info { flex: 1; min-width: 0; }
.ps-row-name { font-size: .9rem; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dark-mode .ps-row-name { color: #f1f5f9; }
.ps-row-age { font-size: .75rem; color: #64748b; }
.ps-row-check { color: #6366f1; font-weight: 900; }
.ps-divider { height: 1px; background: #e2e8f0; margin: .35rem 0; }
.dark-mode .ps-divider { background: #334155; }
.ps-add-btn {
  display: flex; align-items: center; gap: .55rem;
  width: 100%; padding: .55rem .75rem; border-radius: 10px;
  background: none; border: none; cursor: pointer;
  font-size: .88rem; font-weight: 600; color: #6366f1;
  transition: background .1s;
}
.ps-add-btn:hover:not(:disabled) { background: #eef2ff; }
.ps-add-btn:disabled { opacity: .45; cursor: not-allowed; }
.dark-mode .ps-add-btn { color: #818cf8; }
.dark-mode .ps-add-btn:hover:not(:disabled) { background: #1e1b4b; }
.ps-loading { font-size: .83rem; color: #94a3b8; padding: .5rem .75rem; }
`;

const AGE_LABELS = {
  '5-7':   'Ages 5–7',
  '8-10':  'Ages 8–10',
  '11-14': 'Ages 11–14',
  '15-18': 'Ages 15–18',
};

export default function ProfileSwitcher() {
  const { profiles, activeProfile, activeProfileId, switchProfile, loading } = useProfiles();
  const tier        = getIATLASTier();
  const maxProfiles = getMaxProfiles(tier);

  const [open,         setOpen]         = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const rootRef = useRef(null);

  // Close dropdown on outside click.
  useEffect(() => {
    function handler(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!profiles.length && !loading) return null;

  const atLimit = profiles.length >= maxProfiles;

  function handleSwitch(profileId) {
    switchProfile(profileId);
    setOpen(false);
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="ps-root" ref={rootRef}>
        <button
          className="ps-trigger"
          onClick={() => setOpen(o => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="ps-trigger-avatar">{activeProfile?.avatar || '🧒'}</span>
          <span className="ps-trigger-name">{activeProfile?.name || 'Select Profile'}</span>
          <span className="ps-trigger-caret" aria-hidden="true">▼</span>
        </button>

        {open && (
          <div className="ps-dropdown" role="listbox" aria-label="Child profiles">
            {loading ? (
              <p className="ps-loading">Loading profiles…</p>
            ) : (
              <>
                {profiles.map(p => (
                  <div
                    key={p.profileId}
                    className={`ps-profile-row${p.profileId === activeProfileId ? ' active' : ''}`}
                    onClick={() => handleSwitch(p.profileId)}
                    role="option"
                    aria-selected={p.profileId === activeProfileId}
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && handleSwitch(p.profileId)}
                  >
                    <span className="ps-row-avatar">{p.avatar}</span>
                    <div className="ps-row-info">
                      <div className="ps-row-name">{p.name}</div>
                      {p.ageGroup && <div className="ps-row-age">{AGE_LABELS[p.ageGroup] || p.ageGroup}</div>}
                    </div>
                    {p.profileId === activeProfileId && (
                      <span className="ps-row-check" aria-hidden="true">✓</span>
                    )}
                  </div>
                ))}

                {maxProfiles > 0 && (
                  <>
                    <div className="ps-divider" />
                    <button
                      className="ps-add-btn"
                      onClick={() => { setOpen(false); setShowAddModal(true); }}
                      disabled={atLimit}
                      title={atLimit ? `Limit of ${maxProfiles} profiles reached` : 'Add a child profile'}
                    >
                      ＋ Add Child
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddChildModal
          onClose={() => setShowAddModal(false)}
          currentCount={profiles.length}
        />
      )}
    </>
  );
}
