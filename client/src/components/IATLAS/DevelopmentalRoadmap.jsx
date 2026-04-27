/**
 * DevelopmentalRoadmap.jsx
 * Interactive journey map showing resilience skill progression by age group.
 * Embedded in DevelopmentalRoadmapPage at /iatlas/developmental-roadmap.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DEVELOPMENTAL_MILESTONES,
  MILESTONE_AGE_KEYS,
} from '../../data/iatlas/developmentalRoadmap.js';

const COMPONENT_STYLES = `
  /* ── Roadmap shell ───────────────────────────────────────────────────────── */
  .dr-root {
    font-family: inherit;
  }

  /* ── Age selector ────────────────────────────────────────────────────────── */
  .dr-age-selector {
    display: flex;
    gap: .75rem;
    flex-wrap: wrap;
    margin-bottom: 1.75rem;
  }

  .dr-age-btn {
    display: flex;
    align-items: center;
    gap: .5rem;
    padding: .6rem 1.1rem;
    border-radius: 10px;
    border: 2px solid #e2e8f0;
    background: #ffffff;
    cursor: pointer;
    font-size: .85rem;
    font-weight: 600;
    color: #374151;
    transition: border-color .15s, background .15s, color .15s;
    line-height: 1.3;
  }

  .dr-age-btn:hover {
    border-color: currentColor;
  }

  .dr-age-btn.active {
    color: #ffffff;
    border-color: transparent;
  }

  .dark-mode .dr-age-btn {
    background: #1e293b;
    border-color: #334155;
    color: #cbd5e1;
  }

  .dark-mode .dr-age-btn.active {
    border-color: transparent;
  }

  /* ── Overview card ───────────────────────────────────────────────────────── */
  .dr-overview {
    border-left: 4px solid #10b981;
    background: #ffffff;
    border-radius: 0 12px 12px 0;
    padding: 1.25rem 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 1px 4px rgba(0,0,0,.06);
  }

  .dark-mode .dr-overview {
    background: #1e293b;
  }

  .dr-overview h2 {
    margin: 0 0 .4rem;
    font-size: 1.2rem;
    font-weight: 800;
    color: #1e293b;
  }

  .dark-mode .dr-overview h2 {
    color: #f1f5f9;
  }

  .dr-overview p {
    margin: 0;
    font-size: .92rem;
    color: #475569;
    line-height: 1.55;
  }

  .dark-mode .dr-overview p {
    color: #94a3b8;
  }

  /* ── Dimension grid ──────────────────────────────────────────────────────── */
  .dr-dimensions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  /* ── Dimension card ──────────────────────────────────────────────────────── */
  .dr-dim-card {
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: 14px;
    padding: 1.25rem;
    cursor: pointer;
    transition: box-shadow .15s, border-color .15s, transform .1s;
  }

  .dr-dim-card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,.1);
    transform: translateY(-1px);
  }

  .dr-dim-card.expanded {
    border-color: #4f46e5;
    box-shadow: 0 4px 20px rgba(79,70,229,.12);
  }

  .dark-mode .dr-dim-card {
    background: #1e293b;
    border-color: #334155;
  }

  .dark-mode .dr-dim-card.expanded {
    border-color: #6366f1;
  }

  .dr-dim-header {
    display: flex;
    align-items: center;
    gap: .65rem;
    margin-bottom: .5rem;
  }

  .dr-dim-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .dark-mode .dr-dim-icon {
    background: #0f172a;
  }

  .dr-dim-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.3;
  }

  .dark-mode .dr-dim-header h3 {
    color: #f1f5f9;
  }

  .dr-dim-desc {
    margin: 0 0 .75rem;
    font-size: .82rem;
    color: #64748b;
    line-height: 1.5;
  }

  .dark-mode .dr-dim-desc {
    color: #94a3b8;
  }

  .dr-dim-toggle {
    display: flex;
    align-items: center;
    gap: .35rem;
    font-size: .78rem;
    font-weight: 600;
    color: #4f46e5;
    margin-top: .25rem;
  }

  .dark-mode .dr-dim-toggle {
    color: #818cf8;
  }

  /* ── Expanded section ────────────────────────────────────────────────────── */
  .dr-dim-expanded {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #f1f5f9;
  }

  .dark-mode .dr-dim-expanded {
    border-top-color: #334155;
  }

  .dr-section-label {
    font-size: .72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .07em;
    color: #94a3b8;
    margin: 0 0 .5rem;
  }

  .dr-skills-list {
    list-style: none;
    margin: 0 0 1rem;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: .35rem;
  }

  .dr-skills-list li {
    display: flex;
    align-items: flex-start;
    gap: .4rem;
    font-size: .82rem;
    color: #374151;
    line-height: 1.45;
  }

  .dark-mode .dr-skills-list li {
    color: #cbd5e1;
  }

  .dr-skill-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10b981;
    margin-top: .42em;
    flex-shrink: 0;
  }

  .dr-activities-row {
    display: flex;
    flex-wrap: wrap;
    gap: .4rem;
    margin-bottom: 1rem;
  }

  .dr-activity-chip {
    display: inline-block;
    padding: .25rem .6rem;
    background: #eef2ff;
    color: #4f46e5;
    border-radius: 6px;
    font-size: .75rem;
    font-weight: 600;
    text-decoration: none;
    transition: background .15s;
  }

  .dr-activity-chip:hover {
    background: #e0e7ff;
  }

  .dark-mode .dr-activity-chip {
    background: #1e1b4b;
    color: #a5b4fc;
  }

  .dark-mode .dr-activity-chip:hover {
    background: #312e81;
  }

  .dr-badges-row {
    display: flex;
    flex-wrap: wrap;
    gap: .4rem;
  }

  .dr-badge-chip {
    display: inline-flex;
    align-items: center;
    gap: .3rem;
    padding: .25rem .6rem;
    background: #fef9c3;
    color: #854d0e;
    border-radius: 6px;
    font-size: .72rem;
    font-weight: 600;
  }

  .dark-mode .dr-badge-chip {
    background: #422006;
    color: #fcd34d;
  }

  /* ── Responsive tweaks ───────────────────────────────────────────────────── */
  @media (max-width: 600px) {
    .dr-age-btn {
      font-size: .78rem;
      padding: .5rem .85rem;
    }

    .dr-dimensions-grid {
      grid-template-columns: 1fr;
    }
  }
`;

const DIMENSION_ICONS = {
  'agentic-generative':  '/icons/agentic-generative.svg',
  'somatic-regulative':  '/icons/somatic-regulative.svg',
  'cognitive-narrative': '/icons/cognitive-narrative.svg',
  'relational-connective': '/icons/relational-connective.svg',
  'emotional-adaptive':  '/icons/emotional-adaptive.svg',
  'spiritual-existential': '/icons/spiritual-existential.svg',
};

export default function DevelopmentalRoadmap({ selectedAge = null }) {
  const [activeAgeGroup, setActiveAgeGroup]   = useState(selectedAge || 'ages-5-7');
  const [activeDimension, setActiveDimension] = useState(null);

  const currentMilestone = DEVELOPMENTAL_MILESTONES[activeAgeGroup];

  function handleAgeSelect(key) {
    setActiveAgeGroup(key);
    setActiveDimension(null);
  }

  function handleDimToggle(dimKey) {
    setActiveDimension(prev => (prev === dimKey ? null : dimKey));
  }

  return (
    <div className="dr-root">
      <style>{COMPONENT_STYLES}</style>

      {/* ── Age Group Selector ──────────────────────────────────────────────── */}
      <div className="dr-age-selector" role="tablist" aria-label="Select age group">
        {MILESTONE_AGE_KEYS.map(key => {
          const ms = DEVELOPMENTAL_MILESTONES[key];
          return (
            <button
              key={key}
              role="tab"
              aria-selected={activeAgeGroup === key}
              onClick={() => handleAgeSelect(key)}
              className={`dr-age-btn${activeAgeGroup === key ? ' active' : ''}`}
              style={activeAgeGroup === key ? { backgroundColor: ms.color } : {}}
            >
              <img
                src={ms.icon}
                alt=""
                width={18}
                height={18}
                aria-hidden="true"
                style={{ filter: activeAgeGroup === key ? 'brightness(0) invert(1)' : undefined }}
              />
              {ms.label}
            </button>
          );
        })}
      </div>

      {/* ── Overview ───────────────────────────────────────────────────────── */}
      <div
        className="dr-overview"
        style={{ borderLeftColor: currentMilestone.color }}
        role="tabpanel"
        aria-label={currentMilestone.label}
      >
        <h2>{currentMilestone.label}</h2>
        <p>{currentMilestone.overview}</p>
      </div>

      {/* ── Dimension Cards ────────────────────────────────────────────────── */}
      <div className="dr-dimensions-grid">
        {Object.entries(currentMilestone.dimensions).map(([dimKey, dim]) => {
          const isExpanded = activeDimension === dimKey;
          return (
            <div
              key={dimKey}
              className={`dr-dim-card${isExpanded ? ' expanded' : ''}`}
              onClick={() => handleDimToggle(dimKey)}
              role="button"
              aria-expanded={isExpanded}
              tabIndex={0}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleDimToggle(dimKey)}
            >
              <div className="dr-dim-header">
                <div className="dr-dim-icon">
                  <img
                    src={DIMENSION_ICONS[dimKey] ?? '/icons/compass.svg'}
                    alt=""
                    width={22}
                    height={22}
                    aria-hidden="true"
                  />
                </div>
                <h3>{dim.title}</h3>
              </div>
              <p className="dr-dim-desc">{dim.description}</p>
              <span className="dr-dim-toggle" aria-hidden="true">
                {isExpanded ? '▲ Hide details' : '▼ Explore skills & activities'}
              </span>

              {isExpanded && (
                <div className="dr-dim-expanded" onClick={e => e.stopPropagation()}>
                  {/* Key Skills */}
                  <p className="dr-section-label">Key Skills</p>
                  <ul className="dr-skills-list" aria-label="Key skills">
                    {dim.keySkills.map((skill, idx) => (
                      <li key={idx}>
                        <span className="dr-skill-dot" aria-hidden="true" />
                        {skill}
                      </li>
                    ))}
                  </ul>

                  {/* Activities */}
                  <p className="dr-section-label">
                    Activities ({dim.activities.length})
                  </p>
                  <div className="dr-activities-row" aria-label="Related activities">
                    {dim.activities.map(actId => (
                      <Link
                        key={actId}
                        to={`/iatlas/kids/${activeAgeGroup}/${dimKey}`}
                        className="dr-activity-chip"
                        onClick={e => e.stopPropagation()}
                        aria-label={`Go to ${dimKey} activities for ${currentMilestone.label}`}
                      >
                        {actId}
                      </Link>
                    ))}
                  </div>

                  {/* Badges */}
                  <p className="dr-section-label" style={{ marginTop: '.75rem' }}>
                    Badges to Unlock
                  </p>
                  <div className="dr-badges-row" aria-label="Badges to earn">
                    {dim.badges.map(badgeId => (
                      <span key={badgeId} className="dr-badge-chip">
                        🏅 {badgeId.replace(/-badge$/, '').replace(/-/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
