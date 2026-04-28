/**
 * CrisisToolkit.jsx
 * Emergency SOS activity browser for acute stress moments.
 */

import React, { useState } from 'react';
import { CRISIS_ACTIVITIES, WHEN_TO_SEEK_HELP, SAFETY_PLANNING_TEMPLATE, CRISIS_DISCLAIMER } from '../../data/iatlas/crisisActivities.js';

const STYLES = `
  .ct-page { max-width: 800px; margin: 0 auto; padding: 1.5rem 1rem; }

  .ct-disclaimer {
    background: #fef2f2;
    border: 1.5px solid #fca5a5;
    border-radius: 10px;
    padding: .9rem 1rem;
    margin-bottom: 1.5rem;
    font-size: .82rem;
    color: #991b1b;
    line-height: 1.5;
  }
  .dark-mode .ct-disclaimer { background: #1e0000; border-color: #7f1d1d; color: #fca5a5; }
  .ct-disclaimer strong { display: block; margin-bottom: .3rem; }

  .ct-header { margin-bottom: 1.25rem; }
  .ct-title { font-size: 1.4rem; font-weight: 900; color: #0f172a; margin: 0 0 .25rem; }
  .dark-mode .ct-title { color: #f1f5f9; }
  .ct-subtitle { font-size: .875rem; color: #64748b; }

  .ct-type-tabs {
    display: flex;
    gap: .5rem;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
  }
  .ct-type-btn {
    padding: .45rem 1rem;
    border-radius: 20px;
    border: 2px solid #e2e8f0;
    font-size: .82rem;
    font-weight: 700;
    cursor: pointer;
    background: transparent;
    color: #475569;
    transition: all .15s;
  }
  .ct-type-btn.active { color: #fff; }
  .dark-mode .ct-type-btn { border-color: #334155; color: #94a3b8; }
  .dark-mode .ct-type-btn.active { color: #fff; }

  .ct-activities { display: flex; flex-direction: column; gap: 1rem; }

  .ct-act-card {
    background: #ffffff;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    padding: 1.25rem;
    transition: box-shadow .15s;
  }
  .dark-mode .ct-act-card { background: #1e293b; border-color: #334155; }

  .ct-act-header { display: flex; align-items: flex-start; gap: .75rem; margin-bottom: .75rem; }
  .ct-act-icon { font-size: 1.5rem; flex-shrink: 0; }
  .ct-act-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0; }
  .dark-mode .ct-act-title { color: #f1f5f9; }
  .ct-act-meta-row { display: flex; gap: .4rem; flex-wrap: wrap; margin-top: .3rem; }
  .ct-chip {
    padding: .18rem .55rem;
    border-radius: 10px;
    font-size: .7rem;
    font-weight: 600;
    background: #f1f5f9;
    color: #475569;
  }
  .dark-mode .ct-chip { background: #334155; color: #94a3b8; }
  .ct-chip.urgent { background: #fef2f2; color: #dc2626; }

  .ct-instructions { margin-bottom: .75rem; }
  .ct-instructions-list { padding-left: 1.25rem; margin: 0; }
  .ct-instructions-list li { font-size: .85rem; color: #475569; margin-bottom: .35rem; line-height: 1.5; }
  .dark-mode .ct-instructions-list li { color: #94a3b8; }

  .ct-notes { display: flex; flex-direction: column; gap: .4rem; }
  .ct-note {
    font-size: .8rem;
    color: #64748b;
    padding: .5rem .75rem;
    background: #f8fafc;
    border-radius: 6px;
    border-left: 3px solid #e2e8f0;
  }
  .dark-mode .ct-note { background: #0f172a; border-color: #334155; color: #94a3b8; }
  .ct-note-label { font-weight: 700; color: #475569; }
  .dark-mode .ct-note-label { color: #64748b; }

  .ct-expand-btn {
    font-size: .75rem;
    font-weight: 600;
    color: #6366f1;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    margin-bottom: .75rem;
  }

  .ct-seek-help {
    background: #ffffff;
    border-radius: 14px;
    border: 2px solid #dc2626;
    padding: 1.25rem;
    margin-top: 1.5rem;
  }
  .dark-mode .ct-seek-help { background: #1e293b; }
  .ct-seek-title { font-size: 1rem; font-weight: 700; color: #dc2626; margin: 0 0 .75rem; }
  .ct-seek-signs { padding-left: 1.25rem; margin: 0 0 1rem; }
  .ct-seek-signs li { font-size: .83rem; color: #475569; margin-bottom: .3rem; }
  .dark-mode .ct-seek-signs li { color: #94a3b8; }
  .ct-resources { display: flex; flex-direction: column; gap: .4rem; }
  .ct-resource {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: .45rem .75rem;
    background: #fef2f2;
    border-radius: 6px;
    font-size: .8rem;
  }
  .dark-mode .ct-resource { background: #1e0000; }
  .ct-resource-name { font-weight: 700; color: #991b1b; }
  .dark-mode .ct-resource-name { color: #fca5a5; }
  .ct-resource-contact { color: #b91c1c; }
  .dark-mode .ct-resource-contact { color: #ef4444; }
`;

const TYPE_ICONS = {
  panic:    '/icons/breathing.svg',
  anger:    '/icons/emotion.svg',
  grief:    '/icons/connection.svg',
  overwhelm:'/icons/mindfulness.svg',
};

function ActivityCard({ activity, accentColor }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="ct-act-card">
      <div className="ct-act-header">
        <span className="ct-act-icon"><img src={TYPE_ICONS[activity.crisisType] || '/icons/warning.svg'} alt="" aria-hidden="true" className="icon icon-sm" /></span>
        <div>
          <p className="ct-act-title">{activity.title}</p>
          <div className="ct-act-meta-row">
            <span className="ct-chip">⏱ {activity.duration}</span>
            <span className="ct-chip" style={{ background: `${accentColor}18`, color: accentColor }}>
              {activity.intensity}
            </span>
            {activity.ageGroups?.map(ag => (
              <span key={ag} className="ct-chip">{ag.replace('ages-', 'Ages ').replace('-', '–')}</span>
            ))}
          </div>
        </div>
      </div>

      <button className="ct-expand-btn" onClick={() => setExpanded(prev => !prev)} type="button">
        {expanded ? '▲ Hide Details' : '▼ Show Instructions'}
      </button>

      {expanded && (
        <>
          <div className="ct-instructions">
            <ol className="ct-instructions-list">
              {activity.instructions.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          </div>

          <div className="ct-notes">
            {activity.parentNote && (
              <div className="ct-note">
                <span className="ct-note-label">Parent Note: </span>{activity.parentNote}
              </div>
            )}
            {activity.scienceNote && (
              <div className="ct-note">
                <span className="ct-note-label">Science: </span>{activity.scienceNote}
              </div>
            )}
            {activity.whenToUse && (
              <div className="ct-note">
                <span className="ct-note-label">When to Use: </span>{activity.whenToUse}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function CrisisToolkit() {
  const [activeType, setActiveType] = useState('panic');
  const crisisType = CRISIS_ACTIVITIES[activeType];

  return (
    <>
      <style>{STYLES}</style>
      <div className="ct-page">
        <div className="ct-disclaimer">
          <strong><img src="/icons/warning.svg" alt="" aria-hidden="true" className="icon icon-sm" /> Important Safety Notice</strong>
          {CRISIS_DISCLAIMER}
        </div>

        <div className="ct-header">
          <h1 className="ct-title"><img src="/icons/warning.svg" alt="" aria-hidden="true" className="icon icon-sm" /> Crisis Toolkit</h1>
          <p className="ct-subtitle">Quick-access activities for acute stress moments. Select the type of distress below.</p>
        </div>

        <div className="ct-type-tabs" role="tablist">
          {Object.entries(CRISIS_ACTIVITIES).map(([type, data]) => (
            <button
              key={type}
              role="tab"
              aria-selected={activeType === type}
              className={`ct-type-btn${activeType === type ? ' active' : ''}`}
              style={activeType === type ? { background: data.color, borderColor: data.color } : {}}
              onClick={() => setActiveType(type)}
            >
              <img src={TYPE_ICONS[type]} alt="" aria-hidden="true" className="icon icon-sm" /> {data.label}
            </button>
          ))}
        </div>

        {crisisType && (
          <>
            <p style={{ fontSize: '.88rem', color: '#64748b', marginBottom: '1.25rem' }}>
              {crisisType.description}
            </p>
            <div className="ct-activities">
              {crisisType.activities.map(act => (
                <ActivityCard
                  key={act.id}
                  activity={{ ...act, crisisType: activeType }}
                  accentColor={crisisType.color}
                />
              ))}
            </div>
          </>
        )}

        <div className="ct-seek-help">
          <p className="ct-seek-title"><img src="/icons/warning.svg" alt="" aria-hidden="true" className="icon icon-sm" /> {WHEN_TO_SEEK_HELP.title}</p>
          <ul className="ct-seek-signs">
            {WHEN_TO_SEEK_HELP.urgentSigns.map((sign, i) => <li key={i}>{sign}</li>)}
          </ul>
          <div className="ct-resources">
            {WHEN_TO_SEEK_HELP.resources.map((r, i) => (
              <div key={i} className="ct-resource">
                <span className="ct-resource-name">{r.name}</span>
                <span className="ct-resource-contact">{r.contact}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
