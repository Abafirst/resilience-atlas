import React from 'react';

const AGE_GROUPS = [
  { id: 'young',  label: 'Ages 5–8',  icon: './icons/kids-spark.svg',  sublabel: 'Simple & fun' },
  { id: 'middle', label: 'Ages 8–12', icon: './icons/compass.svg',     sublabel: 'Story-driven' },
  { id: 'older',  label: 'Ages 12+',  icon: './icons/kids-trophy.svg', sublabel: 'Competitive' },
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
          <img src={group.icon} alt="" aria-hidden="true" className="kg-age-tab-icon" />
          <span className="kg-age-tab-label">{group.label}</span>
          <span className="kg-age-tab-sub">{group.sublabel}</span>
        </button>
      ))}
    </div>
  );
}
