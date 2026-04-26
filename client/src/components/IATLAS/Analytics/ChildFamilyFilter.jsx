/**
 * ChildFamilyFilter.jsx
 * Child / family selector for the Analytics Dashboard.
 *
 * Props:
 *   profiles         {Array}           All available profiles
 *   selectedId       {string|'all'}    Currently selected profile id or 'all'
 *   onChange         {Function}        Called with profileId or 'all'
 */

import React from 'react';

const PROFILE_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6',
];

const STYLES = `
.cff-root {
  display: flex;
  align-items: center;
  gap: .35rem;
  flex-wrap: wrap;
}
.cff-label {
  font-size: .8rem;
  font-weight: 600;
  color: #64748b;
  margin-right: .25rem;
}
[data-theme="dark"] .cff-label { color: #94a3b8; }
.cff-btn {
  display: flex;
  align-items: center;
  gap: .35rem;
  padding: .3rem .75rem;
  border-radius: 999px;
  border: 1.5px solid #e2e8f0;
  background: none;
  font-size: .8rem;
  color: #475569;
  cursor: pointer;
  transition: background .15s, color .15s, border-color .15s;
  font-weight: 500;
}
.cff-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}
.cff-btn.cff-active {
  border-color: var(--cff-color, #6366f1);
  background: var(--cff-color, #6366f1);
  color: #fff;
  font-weight: 700;
}
[data-theme="dark"] .cff-btn {
  border-color: #334155;
  color: #94a3b8;
}
[data-theme="dark"] .cff-btn:hover {
  background: #334155;
  color: #f1f5f9;
}
.cff-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.cff-empty {
  font-size: .85rem;
  color: #94a3b8;
  font-style: italic;
}
`;

export default function ChildFamilyFilter({ profiles = [], selectedId, onChange }) {
  if (!profiles.length) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: STYLES }} />
        <div className="cff-empty">No child profiles yet.</div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="cff-root" role="group" aria-label="Child / family filter">
        <span className="cff-label">Child:</span>

        <button
          className={`cff-btn${selectedId === 'all' ? ' cff-active' : ''}`}
          style={{ '--cff-color': '#6366f1' }}
          onClick={() => onChange('all')}
          aria-pressed={selectedId === 'all'}
        >
          All Children
        </button>

        {profiles.map((profile, i) => {
          const color = PROFILE_COLORS[i % PROFILE_COLORS.length];
          const active = selectedId === profile.id;
          return (
            <button
              key={profile.id}
              className={`cff-btn${active ? ' cff-active' : ''}`}
              style={{ '--cff-color': color }}
              onClick={() => onChange(profile.id)}
              aria-pressed={active}
            >
              {!active && (
                <span className="cff-dot" style={{ background: color }} aria-hidden="true" />
              )}
              {profile.name}
            </button>
          );
        })}
      </div>
    </>
  );
}
