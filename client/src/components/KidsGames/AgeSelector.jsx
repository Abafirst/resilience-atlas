import React from 'react';

const AGE_GROUPS = [
  { id: 'young',  label: '🎉 Ages 5–8',  sublabel: 'Simple & fun' },
  { id: 'middle', label: '🗺️ Ages 8–12', sublabel: 'Story-driven' },
  { id: 'older',  label: '🏆 Ages 12+',  sublabel: 'Competitive' },
];

/**
 * AgeSelector — Age group tab selector for the KidsGamesHub.
 */
export default function AgeSelector({ selected, onChange }) {
  return (
    <div className="kg-age-selector" role="tablist" aria-label="Select age group">
      {AGE_GROUPS.map(group => (
        <button
          key={group.id}
          className={`kg-age-tab${selected === group.id ? ' active' : ''}`}
          role="tab"
          aria-selected={selected === group.id}
          onClick={() => onChange(group.id)}
        >
          <span className="kg-age-tab-label">{group.label}</span>
          <span className="kg-age-tab-sub">{group.sublabel}</span>
        </button>
      ))}
    </div>
  );
}
