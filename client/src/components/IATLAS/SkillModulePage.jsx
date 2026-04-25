/**
 * SkillModulePage.jsx
 * Full-page view for an individual IATLAS skill module.
 * Route: /iatlas/skills/:dimensionKey/:skillId
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SiteHeader from '../SiteHeader.jsx';
import DarkModeHint from '../DarkModeHint.jsx';
import WorksheetComponent from './WorksheetComponent.jsx';
import LevelUpModal from '../Gamification/LevelUpModal.jsx';
import BadgeUnlockModal from '../Gamification/BadgeUnlockModal.jsx';
import CelebrationConfetti from '../Gamification/CelebrationConfetti.jsx';
import { findModule, ALL_MODULES_BY_DIMENSION, DIMENSION_META, LEVEL_META } from '../../data/iatlas/index.js';
import { loadProgress, markSkillComplete } from './ProgressTracker.jsx';
import { computeTotalXP, addActivityEntry, updateOverallStreak } from '../../utils/gamificationHelpers.js';
import { calculateLevel } from '../../data/gamification/levels.js';
import { checkAndUnlockBadges } from '../../utils/badgeUnlockChecker.js';

const PAGE_STYLES = `
  .smp-page {
    background: #f8fafc;
    min-height: 100vh;
  }

  .dark-mode .smp-page {
    background: #0f172a;
  }

  .smp-wrap {
    max-width: 780px;
    margin: 0 auto;
    padding: 0 1.25rem 4rem;
  }

  /* Breadcrumb */
  .smp-breadcrumb {
    display: flex;
    align-items: center;
    gap: .4rem;
    font-size: .8rem;
    color: #6b7280;
    padding: 1.25rem 0 .5rem;
    flex-wrap: wrap;
  }

  .smp-breadcrumb a {
    color: inherit;
    text-decoration: none;
  }

  .smp-breadcrumb a:hover {
    color: #4f46e5;
    text-decoration: underline;
  }

  .smp-breadcrumb-sep {
    color: #d1d5db;
  }

  /* Header card */
  .smp-header-card {
    background: var(--smp-color, #4f46e5);
    border-radius: 16px;
    padding: 1.75rem;
    margin: .75rem 0 2rem;
    color: #ffffff;
    position: relative;
    overflow: hidden;
  }

  .smp-header-card::before {
    content: '';
    position: absolute;
    top: -30px;
    right: -30px;
    width: 140px;
    height: 140px;
    background: rgba(255,255,255,.08);
    border-radius: 50%;
    pointer-events: none;
  }

  .smp-header-meta {
    display: flex;
    align-items: center;
    gap: .6rem;
    margin-bottom: .75rem;
    flex-wrap: wrap;
  }

  .smp-level-badge {
    background: rgba(255,255,255,.2);
    border-radius: 100px;
    padding: .2rem .65rem;
    font-size: .75rem;
    font-weight: 700;
    letter-spacing: .03em;
  }

  .smp-duration {
    font-size: .8rem;
    opacity: .85;
  }

  .smp-xp {
    background: rgba(255,255,255,.2);
    border-radius: 100px;
    padding: .2rem .65rem;
    font-size: .75rem;
    font-weight: 700;
  }

  .smp-title {
    font-size: 1.5rem;
    font-weight: 800;
    margin: 0 0 .5rem;
    line-height: 1.25;
  }

  .smp-objective {
    font-size: .925rem;
    opacity: .9;
    margin: 0;
    line-height: 1.5;
  }

  /* Sections */
  .smp-section {
    background: #ffffff;
    border-radius: 14px;
    padding: 1.5rem;
    margin-bottom: 1.25rem;
    border: 1px solid #e2e8f0;
  }

  .dark-mode .smp-section {
    background: #1e293b;
    border-color: #334155;
  }

  .smp-section-title {
    font-size: .8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .07em;
    color: #6b7280;
    margin: 0 0 .9rem;
  }

  .dark-mode .smp-section-title {
    color: #94a3b8;
  }

  /* Why it matters */
  .smp-why-trigger {
    width: 100%;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-align: left;
  }

  .smp-why-trigger-text {
    font-size: .8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .07em;
    color: #6b7280;
  }

  .dark-mode .smp-why-trigger-text {
    color: #94a3b8;
  }

  .smp-why-chevron {
    font-size: .85rem;
    color: #9ca3af;
    transition: transform .2s;
    display: inline-block;
  }

  .smp-why-chevron--open {
    transform: rotate(90deg);
  }

  .smp-why-body {
    margin-top: .85rem;
    font-size: .9rem;
    color: #4b5563;
    line-height: 1.65;
  }

  .dark-mode .smp-why-body {
    color: #94a3b8;
  }

  .smp-framework-tag {
    display: inline-block;
    background: #eef2ff;
    color: #4f46e5;
    border-radius: 100px;
    padding: .15rem .55rem;
    font-size: .72rem;
    font-weight: 700;
    margin-bottom: .6rem;
  }

  .dark-mode .smp-framework-tag {
    background: #1e1b4b;
    color: #818cf8;
  }

  /* Instructions */
  .smp-steps {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: .7rem;
  }

  .smp-step {
    display: flex;
    gap: .75rem;
    align-items: flex-start;
  }

  .smp-step-num {
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--smp-color, #4f46e5);
    color: #ffffff;
    font-size: .75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: .05rem;
  }

  .smp-step-text {
    font-size: .9rem;
    color: #374151;
    line-height: 1.55;
    padding-top: .15rem;
  }

  .dark-mode .smp-step-text {
    color: #d1d5db;
  }

  /* Reflection */
  .smp-reflections {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: .6rem;
  }

  .smp-reflection-item {
    display: flex;
    gap: .6rem;
    align-items: flex-start;
    font-size: .9rem;
    color: #374151;
    line-height: 1.55;
  }

  .dark-mode .smp-reflection-item {
    color: #d1d5db;
  }

  .smp-reflection-dot {
    color: var(--smp-color, #4f46e5);
    font-size: 1rem;
    flex-shrink: 0;
    margin-top: .05rem;
  }

  /* Badge preview */
  .smp-badge-preview {
    display: flex;
    align-items: center;
    gap: .85rem;
    background: #fef3c7;
    border: 1px solid #fde68a;
    border-radius: 12px;
    padding: .85rem 1rem;
  }

  .dark-mode .smp-badge-preview {
    background: #1c1200;
    border-color: #78350f;
  }

  .smp-badge-icon {
    font-size: 2rem;
    flex-shrink: 0;
  }

  .smp-badge-info {
    flex: 1;
  }

  .smp-badge-name {
    font-size: .9rem;
    font-weight: 700;
    color: #78350f;
    margin: 0 0 .15rem;
  }

  .dark-mode .smp-badge-name {
    color: #fbbf24;
  }

  .smp-badge-req {
    font-size: .8rem;
    color: #92400e;
    margin: 0;
  }

  .dark-mode .smp-badge-req {
    color: #d97706;
  }

  /* Complete button */
  .smp-complete-btn {
    width: 100%;
    background: var(--smp-color, #4f46e5);
    color: #ffffff;
    border: none;
    border-radius: 12px;
    padding: .9rem 1.5rem;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: opacity .15s, transform .1s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .5rem;
    margin-bottom: 1.25rem;
  }

  .smp-complete-btn:hover:not(:disabled) {
    opacity: .9;
    transform: translateY(-1px);
  }

  .smp-complete-btn:disabled {
    opacity: .6;
    cursor: default;
  }

  .smp-complete-success {
    background: #d1fae5;
    border: 1px solid #6ee7b7;
    color: #065f46;
    border-radius: 12px;
    padding: .9rem 1.5rem;
    text-align: center;
    font-weight: 700;
    font-size: .95rem;
    margin-bottom: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .5rem;
  }

  /* Next skill */
  .smp-next-link {
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    padding: 1rem 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-decoration: none;
    color: inherit;
    transition: border-color .15s, box-shadow .15s;
  }

  .smp-next-link:hover {
    border-color: var(--smp-color, #4f46e5);
    box-shadow: 0 2px 8px rgba(0,0,0,.06);
  }

  .dark-mode .smp-next-link {
    background: #1e293b;
    border-color: #334155;
  }

  .smp-next-label {
    font-size: .72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: #9ca3af;
    margin-bottom: .25rem;
  }

  .smp-next-title {
    font-size: .9rem;
    font-weight: 700;
    color: #1e293b;
  }

  .dark-mode .smp-next-title {
    color: #f1f5f9;
  }

  .smp-next-arrow {
    font-size: 1.25rem;
    color: var(--smp-color, #4f46e5);
  }

  /* Not found */
  .smp-not-found {
    text-align: center;
    padding: 4rem 1rem;
  }

  .smp-not-found h2 {
    font-size: 1.25rem;
    color: #374151;
    margin-bottom: .75rem;
  }

  .dark-mode .smp-not-found h2 {
    color: #d1d5db;
  }
`;

export default function SkillModulePage() {
  const { dimensionKey, skillId } = useParams();
  const navigate = useNavigate();
  const [whyOpen, setWhyOpen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [levelUp, setLevelUp] = useState(null);
  const [pendingBadges, setPendingBadges] = useState([]);
  const [currentBadge, setCurrentBadge] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const module = findModule(dimensionKey, skillId);
  const dimMeta = DIMENSION_META[dimensionKey];
  const allDimModules = (ALL_MODULES_BY_DIMENSION[dimensionKey] || []).sort((a, b) => a.order - b.order);
  const currentIdx = allDimModules.findIndex(m => m.id === skillId);
  const nextModule = currentIdx >= 0 && currentIdx < allDimModules.length - 1
    ? allDimModules[currentIdx + 1]
    : null;

  useEffect(() => {
    if (!module) return;
    const progress = loadProgress();
    const dimProgress = progress[dimensionKey] || {};
    setIsCompleted(!!dimProgress[skillId]);
  }, [dimensionKey, skillId, module]);

  if (!module || !dimMeta) {
    return (
      <>
        <SiteHeader />
        <main className="smp-page">
          <div className="smp-wrap">
            <div className="smp-not-found">
              <h2>Skill module not found</h2>
              <Link to="/iatlas">← Back to IATLAS</Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const levelMeta = LEVEL_META[module.level] || {};

  function handleMarkComplete() {
    const progressBefore = loadProgress();
    const xpBefore = computeTotalXP(progressBefore);
    const levelBefore = calculateLevel(xpBefore);

    markSkillComplete(dimensionKey, skillId, module.xpReward);
    setIsCompleted(true);
    setJustCompleted(true);

    const progressAfter = loadProgress();
    const xpAfter = computeTotalXP(progressAfter);
    const levelAfter = calculateLevel(xpAfter);

    // Update overall streak
    updateOverallStreak();

    // Add activity entry
    addActivityEntry({
      type: 'skill_complete',
      skillId: module.id,
      skillTitle: module.title,
      dimensionKey,
      xp: module.xpReward,
    });

    // Check for level-up
    if (levelAfter.level > levelBefore.level) {
      setLevelUp({ from: levelBefore, to: levelAfter });
      setShowConfetti(true);
      addActivityEntry({ type: 'level_up', levelTitle: levelAfter.title, level: levelAfter.level });
    }

    // Check badge unlocks
    const newBadges = checkAndUnlockBadges(progressAfter, ALL_MODULES_BY_DIMENSION, {
      activeDimension: dimensionKey,
      currentLevel: levelAfter.level,
    });
    if (newBadges.length > 0) {
      setPendingBadges(newBadges);
      setCurrentBadge(newBadges[0]);
      if (!(levelAfter.level > levelBefore.level)) {
        setShowConfetti(true);
      }
    }
  }

  function handleBadgeClose() {
    const remaining = pendingBadges.slice(1);
    setPendingBadges(remaining);
    setCurrentBadge(remaining[0] || null);
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />
      <SiteHeader activePage="iatlas" />
      <DarkModeHint />

      {/* Gamification overlays */}
      <CelebrationConfetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
      <LevelUpModal levelUp={levelUp} onClose={() => setLevelUp(null)} />
      <BadgeUnlockModal badge={currentBadge} onClose={handleBadgeClose} />

      <main
        className="smp-page"
        id="main-content"
        style={{ '--smp-color': dimMeta.color }}
      >
        <div className="smp-wrap">

          {/* Breadcrumb */}
          <nav className="smp-breadcrumb" aria-label="Breadcrumb">
            <Link to="/iatlas">IATLAS</Link>
            <span className="smp-breadcrumb-sep" aria-hidden="true">›</span>
            <Link to={`/iatlas/curriculum/${dimensionKey}`}>{dimMeta.title}</Link>
            <span className="smp-breadcrumb-sep" aria-hidden="true">›</span>
            <span>{module.title}</span>
          </nav>

          {/* Header card */}
          <div className="smp-header-card" style={{ background: dimMeta.color }}>
            <div className="smp-header-meta">
              <span className="smp-level-badge">
                {levelMeta.icon} {levelMeta.label}
              </span>
              <span className="smp-duration">⏱ {module.duration}</span>
              <span className="smp-xp">+{module.xpReward} XP</span>
            </div>
            <h1 className="smp-title">{module.title}</h1>
            <p className="smp-objective">{module.learningObjective}</p>
          </div>

          {/* Badge preview */}
          {module.badge && (
            <div className="smp-badge-preview" style={{ marginBottom: '1.25rem' }}>
              <span className="smp-badge-icon" aria-hidden="true">{module.badge.icon}</span>
              <div className="smp-badge-info">
                <p className="smp-badge-name">🏅 Earn: {module.badge.name}</p>
                <p className="smp-badge-req">{module.badge.requirement}</p>
              </div>
            </div>
          )}

          {/* Why it matters */}
          {module.whyItMatters && (
            <section className="smp-section" aria-labelledby="smp-why-heading">
              <button
                className="smp-why-trigger"
                aria-expanded={whyOpen}
                aria-controls="smp-why-body"
                onClick={() => setWhyOpen(o => !o)}
              >
                <span className="smp-why-trigger-text" id="smp-why-heading">Why This Matters</span>
                <span className={`smp-why-chevron${whyOpen ? ' smp-why-chevron--open' : ''}`} aria-hidden="true">›</span>
              </button>
              {whyOpen && (
                <div id="smp-why-body">
                  {module.whyItMatters.framework && (
                    <span className="smp-framework-tag">{module.whyItMatters.framework}</span>
                  )}
                  <p className="smp-why-body">{module.whyItMatters.rationale}</p>
                </div>
              )}
            </section>
          )}

          {/* Instructions */}
          {module.instructions && module.instructions.length > 0 && (
            <section className="smp-section" aria-labelledby="smp-instr-heading">
              <h2 className="smp-section-title" id="smp-instr-heading">How to Do This Practice</h2>
              <ol className="smp-steps" aria-label="Step-by-step instructions">
                {module.instructions.map((step, i) => (
                  <li key={i} className="smp-step">
                    <span className="smp-step-num" aria-hidden="true">{i + 1}</span>
                    <span className="smp-step-text">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Activity / Worksheet */}
          {module.activity && module.activity.fields && module.activity.fields.length > 0 && (
            <section className="smp-section" aria-labelledby="smp-activity-heading">
              <h2 className="smp-section-title" id="smp-activity-heading">Your Activity Worksheet</h2>
              <WorksheetComponent
                skillId={module.id}
                fields={module.activity.fields}
                valueSuggestions={module.activity.valueSuggestions || module.valueSuggestions}
              />
            </section>
          )}

          {/* Reflection prompts */}
          {module.reflectionPrompts && module.reflectionPrompts.length > 0 && (
            <section className="smp-section" aria-labelledby="smp-reflect-heading">
              <h2 className="smp-section-title" id="smp-reflect-heading">Reflection Prompts</h2>
              <ul className="smp-reflections" aria-label="Reflection questions">
                {module.reflectionPrompts.map((prompt, i) => (
                  <li key={i} className="smp-reflection-item">
                    <span className="smp-reflection-dot" aria-hidden="true">●</span>
                    {prompt}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Mark complete */}
          {isCompleted ? (
            <div className="smp-complete-success" role="status">
              ✓ Completed — {module.xpReward} XP earned
              {justCompleted && module.badge && (
                <span style={{ marginLeft: '.5rem' }}>
                  {module.badge.icon} {module.badge.name} unlocked!
                </span>
              )}
              <div style={{ marginTop: '.75rem' }}>
                <Link to="/iatlas/dashboard" style={{ fontSize: '.82rem', color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}>
                  View your progress dashboard →
                </Link>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="smp-complete-btn"
              onClick={handleMarkComplete}
              aria-label={`Mark "${module.title}" as complete and earn ${module.xpReward} XP`}
            >
              ✓ Mark as Complete &amp; Earn {module.xpReward} XP
            </button>
          )}

          {/* Next skill */}
          {nextModule && (
            <Link
              to={`/iatlas/skills/${dimensionKey}/${nextModule.id}`}
              className="smp-next-link"
              aria-label={`Next skill: ${nextModule.title}`}
            >
              <div>
                <div className="smp-next-label">Up Next</div>
                <div className="smp-next-title">{nextModule.title}</div>
              </div>
              <span className="smp-next-arrow" aria-hidden="true">→</span>
            </Link>
          )}

        </div>
      </main>
    </>
  );
}
