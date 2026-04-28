/**
 * SeasonalActivityPack.jsx
 * Browser for seasonal and holiday activity packs.
 */

import React, { useState } from 'react';
import { SEASONAL_PACKS, HOLIDAY_PACKS } from '../../data/iatlas/seasonalActivities.js';

const STYLES = `
  .sap-page { max-width: 860px; margin: 0 auto; padding: 1.5rem 1rem; }

  .sap-tabs {
    display: flex;
    gap: .5rem;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: .5rem;
  }
  .dark-mode .sap-tabs { border-color: #334155; }
  .sap-tab {
    padding: .45rem 1.1rem;
    border-radius: 8px 8px 0 0;
    border: none;
    font-size: .85rem;
    font-weight: 700;
    cursor: pointer;
    background: transparent;
    color: #64748b;
    transition: all .15s;
  }
  .sap-tab.active { background: #0f172a; color: #fff; }
  .dark-mode .sap-tab.active { background: #f1f5f9; color: #0f172a; }

  .sap-pack-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: .75rem; margin-bottom: 1.5rem; }

  .sap-pack-card {
    border-radius: 12px;
    border: 2px solid #e2e8f0;
    padding: 1rem;
    cursor: pointer;
    text-align: center;
    transition: all .15s;
    background: #ffffff;
  }
  .dark-mode .sap-pack-card { background: #1e293b; border-color: #334155; }
  .sap-pack-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.08); }
  .sap-pack-card.selected { border-width: 2.5px; }

  .sap-pack-emoji { font-size: 2rem; margin-bottom: .4rem; }
  .sap-pack-name { font-size: .85rem; font-weight: 700; color: #0f172a; }
  .dark-mode .sap-pack-name { color: #f1f5f9; }
  .sap-pack-theme { font-size: .72rem; color: #64748b; margin-top: .2rem; }

  .sap-activities { display: flex; flex-direction: column; gap: .85rem; }

  .sap-act-card {
    background: #ffffff;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    padding: 1.1rem 1.25rem;
    transition: box-shadow .15s;
  }
  .dark-mode .sap-act-card { background: #1e293b; border-color: #334155; }
  .sap-act-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.06); }

  .sap-act-header { display: flex; align-items: flex-start; justify-content: space-between; gap: .75rem; margin-bottom: .6rem; }
  .sap-act-title { font-size: .95rem; font-weight: 700; color: #0f172a; margin: 0; }
  .dark-mode .sap-act-title { color: #f1f5f9; }
  .sap-act-dim {
    font-size: .72rem;
    font-weight: 700;
    padding: .2rem .65rem;
    border-radius: 12px;
    white-space: nowrap;
  }

  .sap-act-desc { font-size: .85rem; color: #475569; margin-bottom: .75rem; }
  .dark-mode .sap-act-desc { color: #94a3b8; }

  .sap-act-meta { display: flex; flex-wrap: wrap; gap: .4rem; align-items: center; }
  .sap-chip {
    padding: .2rem .6rem;
    border-radius: 12px;
    font-size: .72rem;
    font-weight: 600;
    background: #f1f5f9;
    color: #475569;
  }
  .dark-mode .sap-chip { background: #334155; color: #94a3b8; }

  .sap-instructions { margin-top: .85rem; padding-top: .85rem; border-top: 1px solid #e2e8f0; }
  .dark-mode .sap-instructions { border-color: #334155; }
  .sap-instructions-title { font-size: .75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .05em; margin-bottom: .5rem; }
  .sap-instructions-list { padding-left: 1.2rem; margin: 0; }
  .sap-instructions-list li { font-size: .83rem; color: #475569; margin-bottom: .3rem; }
  .dark-mode .sap-instructions-list li { color: #94a3b8; }

  .sap-seasonal-note {
    font-size: .8rem;
    color: #64748b;
    font-style: italic;
    margin-top: .6rem;
    padding-left: .75rem;
    border-left: 3px solid #e2e8f0;
  }
  .dark-mode .sap-seasonal-note { border-color: #334155; }

  .sap-expand-btn {
    font-size: .75rem;
    font-weight: 600;
    color: #6366f1;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    margin-top: .5rem;
  }
  .sap-expand-btn:hover { text-decoration: underline; }

  .sap-empty { text-align: center; padding: 2rem; color: #94a3b8; }
`;

const DIM_COLORS = {
  'agentic-generative':   { bg: '#eef2ff', color: '#4f46e5' },
  'somatic-regulative':   { bg: '#d1fae5', color: '#059669' },
  'cognitive-narrative':  { bg: '#fef3c7', color: '#b45309' },
  'relational-connective':{ bg: '#fef2f2', color: '#dc2626' },
  'emotional-adaptive':   { bg: '#fdf2f8', color: '#db2777' },
  'spiritual-existential':{ bg: '#f5f3ff', color: '#7c3aed' },
};

function ActivityCard({ activity }) {
  const [expanded, setExpanded] = useState(false);
  const dimStyle = DIM_COLORS[activity.dimension] || { bg: '#f1f5f9', color: '#475569' };

  return (
    <div className="sap-act-card">
      <div className="sap-act-header">
        <h3 className="sap-act-title">{activity.title}</h3>
        <span className="sap-act-dim" style={{ background: dimStyle.bg, color: dimStyle.color }}>
          {activity.dimension?.replace(/-/g, ' ')}
        </span>
      </div>

      {activity.description && <p className="sap-act-desc">{activity.description}</p>}

      <div className="sap-act-meta">
        {activity.type && <span className="sap-chip">{activity.type}</span>}
        {activity.duration && <span className="sap-chip">⏱ {activity.duration}</span>}
        {activity.ageGroups?.map(ag => (
          <span key={ag} className="sap-chip">{ag.replace('ages-', 'Ages ').replace('-', '–')}</span>
        ))}
      </div>

      {activity.seasonalConnection && (
        <p className="sap-seasonal-note"><img src="/icons/growth.svg" alt="" aria-hidden="true" className="icon icon-sm" /> {activity.seasonalConnection}</p>
      )}

      {activity.instructions && (
        <>
          <button className="sap-expand-btn" onClick={() => setExpanded(prev => !prev)} type="button">
            {expanded ? '▲ Hide Instructions' : '▼ Show Instructions'}
          </button>
          {expanded && (
            <div className="sap-instructions">
              <p className="sap-instructions-title">Instructions</p>
              <ol className="sap-instructions-list">
                {activity.instructions.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SeasonalActivityPack() {
  const [activeTab, setActiveTab]   = useState('seasonal');
  const [selectedPack, setSelected] = useState('spring');

  const packs   = activeTab === 'seasonal' ? SEASONAL_PACKS : HOLIDAY_PACKS;
  const current = packs[selectedPack];

  return (
    <>
      <style>{STYLES}</style>
      <div className="sap-page">
        <div className="sap-tabs" role="tablist">
          {['seasonal', 'holiday'].map(t => (
            <button
              key={t}
              role="tab"
              aria-selected={activeTab === t}
              className={`sap-tab${activeTab === t ? ' active' : ''}`}
              onClick={() => {
                setActiveTab(t);
                const first = Object.keys(t === 'seasonal' ? SEASONAL_PACKS : HOLIDAY_PACKS)[0];
                setSelected(first);
              }}
            >
              {t === 'seasonal' ? 'Seasonal Packs' : 'Holiday Packs'}
            </button>
          ))}
        </div>

        <div className="sap-pack-grid" role="list">
          {Object.values(packs).map(pack => (
            <div
              key={pack.id}
              role="listitem"
              className={`sap-pack-card${selectedPack === pack.id ? ' selected' : ''}`}
              style={selectedPack === pack.id ? { borderColor: pack.color, boxShadow: `0 0 0 2px ${pack.color}22` } : {}}
              onClick={() => setSelected(pack.id)}
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setSelected(pack.id)}
              aria-pressed={selectedPack === pack.id}
            >
              <div className="sap-pack-emoji">{pack.emoji}</div>
              <div className="sap-pack-name">{pack.name}</div>
              <div className="sap-pack-theme">{pack.theme}</div>
            </div>
          ))}
        </div>

        {current ? (
          <>
            <p style={{ fontSize: '.88rem', color: '#64748b', marginBottom: '1rem' }}>
              {current.description || current.theme}
              {current.culturalAdaptationNote && (
                <span style={{ display: 'block', marginTop: '.35rem', fontStyle: 'italic' }}>
                  <img src="/icons/reflection.svg" alt="" aria-hidden="true" className="icon icon-sm" /> {current.culturalAdaptationNote}
                </span>
              )}
            </p>
            {current.activities && current.activities.length > 0 ? (
              <div className="sap-activities">
                {current.activities.map(act => (
                  <ActivityCard key={act.id} activity={act} />
                ))}
              </div>
            ) : (
              <div className="sap-empty">Activities for this pack are being developed. Check back soon!</div>
            )}
          </>
        ) : (
          <div className="sap-empty">Select a pack to view activities.</div>
        )}
      </div>
    </>
  );
}
