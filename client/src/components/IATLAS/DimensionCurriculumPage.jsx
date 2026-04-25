/**
 * DimensionCurriculumPage.jsx
 * Lists all skill modules for a given dimension, organized by level.
 * Route: /iatlas/curriculum/:dimensionKey
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SiteHeader from '../SiteHeader.jsx';
import DarkModeHint from '../DarkModeHint.jsx';
import ProgressTracker from './ProgressTracker.jsx';
import {
  ALL_MODULES_BY_DIMENSION,
  DIMENSION_META,
  LEVEL_META,
  getModulesByLevel,
} from '../../data/iatlas/index.js';
import { loadProgress } from './ProgressTracker.jsx';
import IATLASComingSoonModal from './ComingSoonModal.jsx';

const PAGE_STYLES = `
  .dcp-page {
    background: #f8fafc;
    min-height: 100vh;
  }

  .dark-mode .dcp-page {
    background: #0f172a;
  }

  .dcp-wrap {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 1.25rem 4rem;
  }

  /* Breadcrumb */
  .dcp-breadcrumb {
    display: flex;
    align-items: center;
    gap: .4rem;
    font-size: .8rem;
    color: #6b7280;
    padding: 1.25rem 0 .5rem;
    flex-wrap: wrap;
  }

  .dcp-breadcrumb a {
    color: inherit;
    text-decoration: none;
  }

  .dcp-breadcrumb a:hover {
    color: #4f46e5;
    text-decoration: underline;
  }

  .dcp-breadcrumb-sep {
    color: #d1d5db;
  }

  /* Hero */
  .dcp-hero {
    border-radius: 16px;
    padding: 2rem;
    margin: .75rem 0 2rem;
    color: #ffffff;
    position: relative;
    overflow: hidden;
  }

  .dcp-hero::before {
    content: '';
    position: absolute;
    top: -40px;
    right: -40px;
    width: 180px;
    height: 180px;
    background: rgba(255,255,255,.07);
    border-radius: 50%;
    pointer-events: none;
  }

  .dcp-hero-kicker {
    display: flex;
    align-items: center;
    gap: .4rem;
    font-size: .75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .08em;
    opacity: .8;
    margin-bottom: .6rem;
  }

  .dcp-hero-title {
    font-size: 1.75rem;
    font-weight: 800;
    margin: 0 0 .5rem;
    line-height: 1.2;
  }

  .dcp-hero-tagline {
    font-size: .95rem;
    opacity: .9;
    margin: 0 0 1.25rem;
    line-height: 1.5;
  }

  .dcp-hero-stats {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .dcp-stat {
    background: rgba(255,255,255,.15);
    border-radius: 8px;
    padding: .4rem .8rem;
    font-size: .8rem;
    font-weight: 600;
  }

  /* Level tabs */
  .dcp-tabs {
    display: flex;
    gap: .5rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .dcp-tab {
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: 100px;
    padding: .45rem 1rem;
    font-size: .85rem;
    font-weight: 600;
    color: #6b7280;
    cursor: pointer;
    transition: border-color .15s, color .15s, background .15s;
  }

  .dcp-tab:hover {
    border-color: var(--dcp-color, #4f46e5);
    color: var(--dcp-color, #4f46e5);
  }

  .dcp-tab--active {
    background: var(--dcp-color, #4f46e5);
    border-color: var(--dcp-color, #4f46e5);
    color: #ffffff;
  }

  .dark-mode .dcp-tab {
    background: #1e293b;
    border-color: #334155;
    color: #94a3b8;
  }

  .dark-mode .dcp-tab--active {
    background: var(--dcp-color, #4f46e5);
    border-color: var(--dcp-color, #4f46e5);
    color: #ffffff;
  }

  /* Level description */
  .dcp-level-desc {
    background: #f1f5f9;
    border-radius: 10px;
    padding: .75rem 1rem;
    font-size: .85rem;
    color: #6b7280;
    margin-bottom: 1.25rem;
    display: flex;
    align-items: center;
    gap: .5rem;
  }

  .dark-mode .dcp-level-desc {
    background: #1e293b;
    color: #94a3b8;
  }

  /* Skill card grid */
  .dcp-skill-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  @media (max-width: 600px) {
    .dcp-skill-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Skill card */
  .dcp-skill-card {
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: 14px;
    padding: 1.25rem;
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
    gap: .6rem;
    transition: border-color .15s, box-shadow .15s, transform .1s;
    position: relative;
  }

  .dcp-skill-card:hover {
    border-color: var(--dcp-color, #4f46e5);
    box-shadow: 0 4px 16px rgba(0,0,0,.08);
    transform: translateY(-2px);
  }

  .dark-mode .dcp-skill-card {
    background: #1e293b;
    border-color: #334155;
  }

  .dcp-skill-card--completed {
    border-color: #6ee7b7;
    background: #f0fdf4;
  }

  .dark-mode .dcp-skill-card--completed {
    border-color: #065f46;
    background: #022c22;
  }

  .dcp-skill-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: .5rem;
  }

  .dcp-skill-num {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--dcp-color, #4f46e5);
    color: #ffffff;
    font-size: .78rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .dcp-skill-num--completed {
    background: #059669;
  }

  .dcp-skill-meta {
    display: flex;
    gap: .4rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .dcp-skill-xp {
    background: #fef3c7;
    color: #92400e;
    border-radius: 100px;
    padding: .1rem .4rem;
    font-size: .72rem;
    font-weight: 700;
  }

  .dark-mode .dcp-skill-xp {
    background: #1c1200;
    color: #fbbf24;
  }

  .dcp-skill-duration {
    font-size: .72rem;
    color: #9ca3af;
  }

  .dcp-skill-title {
    font-size: .95rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
    line-height: 1.35;
  }

  .dark-mode .dcp-skill-title {
    color: #f1f5f9;
  }

  .dcp-skill-objective {
    font-size: .82rem;
    color: #6b7280;
    margin: 0;
    line-height: 1.5;
  }

  .dark-mode .dcp-skill-objective {
    color: #94a3b8;
  }

  .dcp-skill-badge {
    font-size: .78rem;
    color: #78350f;
    display: flex;
    align-items: center;
    gap: .3rem;
    margin-top: .1rem;
  }

  .dark-mode .dcp-skill-badge {
    color: #d97706;
  }

  .dcp-completed-check {
    position: absolute;
    top: .75rem;
    right: .75rem;
    color: #059669;
    font-size: .85rem;
    font-weight: 700;
  }

  /* Progress section */
  .dcp-progress-section {
    margin-bottom: 1.75rem;
  }

  /* Empty state */
  .dcp-empty {
    text-align: center;
    padding: 2rem;
    color: #9ca3af;
    font-size: .9rem;
  }
`;

const LEVELS = ['foundation', 'building', 'mastery'];

export default function DimensionCurriculumPage() {
  const { dimensionKey } = useParams();
  const [activeLevel, setActiveLevel] = useState('foundation');
  const [progress, setProgress] = useState({});
  const [showSkillModal, setShowSkillModal] = useState(false);

  const dimMeta = DIMENSION_META[dimensionKey];
  const allModules = ALL_MODULES_BY_DIMENSION[dimensionKey] || [];

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  if (!dimMeta) {
    return (
      <>
        <SiteHeader />
        <main className="dcp-page">
          <div className="dcp-wrap" style={{ paddingTop: '2rem', textAlign: 'center' }}>
            <p style={{ color: '#6b7280' }}>Dimension not found.</p>
            <Link to="/iatlas" style={{ color: '#4f46e5' }}>← Back to IATLAS</Link>
          </div>
        </main>
      </>
    );
  }

  const dimProgress = progress[dimensionKey] || {};
  const completedCount = allModules.filter(m => dimProgress[m.id]).length;
  const totalXp = allModules
    .filter(m => dimProgress[m.id])
    .reduce((sum, m) => sum + (dimProgress[m.id]?.xpEarned || 0), 0);

  const levelModules = getModulesByLevel(dimensionKey, activeLevel)
    .sort((a, b) => a.order - b.order);

  const levelMeta = LEVEL_META[activeLevel];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />
      <SiteHeader activePage="iatlas" />
      <DarkModeHint />
      {showSkillModal && (
        <IATLASComingSoonModal
          title="Full Skill Modules Launching Soon!"
          message="Full skill modules are launching soon! Join the waitlist for Atlas Navigator access and be first to explore the complete curriculum."
          onClose={() => setShowSkillModal(false)}
        />
      )}

      <main
        className="dcp-page"
        id="main-content"
        style={{ '--dcp-color': dimMeta.color }}
      >
        <div className="dcp-wrap">

          {/* Breadcrumb */}
          <nav className="dcp-breadcrumb" aria-label="Breadcrumb">
            <Link to="/iatlas">IATLAS</Link>
            <span className="dcp-breadcrumb-sep" aria-hidden="true">›</span>
            <span>{dimMeta.title}</span>
          </nav>

          {/* Hero */}
          <div className="dcp-hero" style={{ background: dimMeta.color }}>
            <div className="dcp-hero-kicker">
              <img src={dimMeta.icon} alt="" width={14} height={14} aria-hidden="true" />
              IATLAS Curriculum
            </div>
            <h1 className="dcp-hero-title">{dimMeta.title}</h1>
            <p className="dcp-hero-tagline">{dimMeta.tagline}</p>
            <div className="dcp-hero-stats">
              <span className="dcp-stat">{allModules.length} Skills</span>
              <span className="dcp-stat">{completedCount} Completed</span>
              {totalXp > 0 && <span className="dcp-stat">{totalXp} XP Earned</span>}
            </div>
          </div>

          {/* Progress tracker */}
          {completedCount > 0 && (
            <div className="dcp-progress-section">
              <ProgressTracker compact />
            </div>
          )}

          {/* Level tabs */}
          <div className="dcp-tabs" role="tablist" aria-label="Skill levels">
            {LEVELS.map(level => {
              const lm = LEVEL_META[level];
              const count = getModulesByLevel(dimensionKey, level).length;
              return (
                <button
                  key={level}
                  role="tab"
                  aria-selected={activeLevel === level}
                  className={`dcp-tab${activeLevel === level ? ' dcp-tab--active' : ''}`}
                  onClick={() => setActiveLevel(level)}
                >
                  {lm.icon} {lm.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Level description */}
          {levelMeta && (
            <div className="dcp-level-desc" role="note">
              <span aria-hidden="true">{levelMeta.icon}</span>
              <span><strong>{levelMeta.label}:</strong> {levelMeta.description}</span>
            </div>
          )}

          {/* Skill cards */}
          {levelModules.length === 0 ? (
            <div className="dcp-empty">No skills available at this level yet.</div>
          ) : (
            <div
              className="dcp-skill-grid"
              role="tabpanel"
              aria-label={`${levelMeta?.label || activeLevel} skills`}
            >
              {levelModules.map((mod, idx) => {
                const completed = !!dimProgress[mod.id];
                return (
                  <div
                    key={mod.id}
                    className={`dcp-skill-card${completed ? ' dcp-skill-card--completed' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${mod.title}${completed ? ' (completed)' : ''} — coming soon`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setShowSkillModal(true)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowSkillModal(true); } }}
                  >
                    {completed && (
                      <span className="dcp-completed-check" aria-hidden="true">✓</span>
                    )}
                    <div className="dcp-skill-card-header">
                      <span className={`dcp-skill-num${completed ? ' dcp-skill-num--completed' : ''}`} aria-hidden="true">
                        {completed ? '✓' : idx + 1}
                      </span>
                      <div className="dcp-skill-meta">
                        <span className="dcp-skill-xp">+{mod.xpReward} XP</span>
                        <span className="dcp-skill-duration">{mod.duration}</span>
                      </div>
                    </div>
                    <p className="dcp-skill-title">{mod.title}</p>
                    <p className="dcp-skill-objective">{mod.learningObjective}</p>
                    {mod.badge && (
                      <p className="dcp-skill-badge">
                        <span aria-hidden="true">{mod.badge.icon}</span>
                        Earn: {mod.badge.name}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>
    </>
  );
}
