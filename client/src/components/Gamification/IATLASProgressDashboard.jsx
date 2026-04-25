/**
 * IATLASProgressDashboard.jsx
 * Main IATLAS gamification dashboard - reads all data from localStorage hooks.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';

import useXP from '../../hooks/useXP.js';
import useBadges from '../../hooks/useBadges.js';
import useStreaks from '../../hooks/useStreaks.js';
import useQuests from '../../hooks/useQuests.js';

import XPProgressBar from './XPProgressBar.jsx';
import StatsCard from './StatsCard.jsx';
import BadgeGallery from './BadgeGallery.jsx';
import BadgeUnlockModal from './BadgeUnlockModal.jsx';
import LevelUpModal from './LevelUpModal.jsx';
import ActivityFeed from './ActivityFeed.jsx';
import CelebrationConfetti from './CelebrationConfetti.jsx';
import QuestBoard from './QuestBoard.jsx';
import StreakTracker from './StreakTracker.jsx';

import { ALL_MODULES_BY_DIMENSION, DIMENSION_META } from '../../data/iatlas/index.js';
import { getNextStreakMilestone } from '../../data/gamification/streakMilestones.js';
import {
  loadProgress,
  computeSkillCounts,
  loadActivityFeed,
} from '../../utils/gamificationHelpers.js';

const STYLES = `
  .ipd-root {
    font-family: inherit;
    max-width: 1100px;
    margin: 0 auto;
    padding: 24px 16px 48px;
    box-sizing: border-box;
  }

  .ipd-header {
    margin-bottom: 24px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  .ipd-header-text {}

  .ipd-title {
    font-size: 1.8rem;
    font-weight: 900;
    color: #1e293b;
    line-height: 1.15;
    margin: 0 0 4px;
  }

  .ipd-tagline {
    font-size: 0.9rem;
    color: #64748b;
    margin: 0;
  }

  .ipd-header-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .ipd-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 18px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    border: none;
    text-decoration: none;
    transition: opacity 0.15s, transform 0.15s;
    line-height: 1.4;
    white-space: nowrap;
  }

  .ipd-btn:hover {
    opacity: 0.88;
    transform: translateY(-1px);
  }

  .ipd-btn-primary {
    background: #4f46e5;
    color: #fff;
  }

  .ipd-btn-secondary {
    background: #f1f5f9;
    color: #334155;
    border: 1px solid #e2e8f0;
  }

  .ipd-section {
    margin-bottom: 28px;
  }

  .ipd-section-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ipd-stats-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 10px;
  }

  .ipd-two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .ipd-card {
    background: #fff;
    border-radius: 14px;
    padding: 20px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    box-sizing: border-box;
  }

  /* Dimension Progress */
  .ipd-dim-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ipd-dim-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ipd-dim-header {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: space-between;
  }

  .ipd-dim-name-group {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .ipd-dim-emoji {
    font-size: 1rem;
    flex-shrink: 0;
  }

  .ipd-dim-name {
    font-size: 0.82rem;
    font-weight: 600;
    color: #334155;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-decoration: none;
  }

  .ipd-dim-name:hover {
    text-decoration: underline;
  }

  .ipd-dim-count {
    font-size: 0.7rem;
    color: #94a3b8;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .ipd-dim-bar-track {
    height: 6px;
    background: #e2e8f0;
    border-radius: 999px;
    overflow: hidden;
  }

  .ipd-dim-bar-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.7s ease;
    min-width: 3px;
  }

  /* Dark mode */
  .dark-mode .ipd-title { color: #f1f5f9; }
  .dark-mode .ipd-tagline { color: #94a3b8; }
  .dark-mode .ipd-section-title { color: #f1f5f9; }
  .dark-mode .ipd-card { background: #1e293b; box-shadow: 0 1px 4px rgba(0,0,0,0.3); }
  .dark-mode .ipd-btn-secondary { background: #1e293b; color: #cbd5e1; border-color: #334155; }
  .dark-mode .ipd-dim-name { color: #cbd5e1; }
  .dark-mode .ipd-dim-count { color: #64748b; }
  .dark-mode .ipd-dim-bar-track { background: #334155; }

  /* Responsive */
  @media (max-width: 900px) {
    .ipd-stats-grid { grid-template-columns: repeat(3, 1fr); }
    .ipd-two-col { grid-template-columns: 1fr; }
  }

  @media (max-width: 640px) {
    .ipd-root { padding: 16px 12px 40px; }
    .ipd-title { font-size: 1.4rem; }
    .ipd-stats-grid { grid-template-columns: repeat(2, 1fr); }
    .ipd-header { flex-direction: column; }
    .ipd-card { padding: 14px; }
  }
`;

function computeAllStats({ progress, earnedBadges, overallStreak, activeQuests, levelInfo, totalXP }) {
  const { total: totalSkills } = computeSkillCounts(progress);
  return {
    totalXP,
    totalSkills,
    badgesEarned: earnedBadges.length,
    currentStreak: overallStreak?.current || 0,
    activeQuestsCount: activeQuests.length,
    levelNum: levelInfo.level,
    levelTitle: levelInfo.title,
    levelColor: levelInfo.color,
    levelIcon: levelInfo.icon,
  };
}

function getDimensionStats(progress) {
  const stats = {};
  for (const [dimKey, dimMeta] of Object.entries(DIMENSION_META)) {
    const modules = ALL_MODULES_BY_DIMENSION[dimKey] || [];
    const totalSkills = modules.length;
    const dimProgress = progress[dimKey] || {};
    const completedSkills = modules.filter(m => dimProgress[m.id]).length;
    stats[dimKey] = {
      ...dimMeta,
      total: totalSkills,
      completed: completedSkills,
      pct: totalSkills > 0 ? Math.round((completedSkills / totalSkills) * 100) : 0,
    };
  }
  return stats;
}


export default function IATLASProgressDashboard() {
  const { totalXP, levelInfo, levelUp, clearLevelUp } = useXP();
  const { earnedBadges, allBadges, newBadges, clearNewBadges } = useBadges();
  const { overallStreak, dimensionStreaks } = useStreaks();
  const { activeQuests, completedQuests, startQuest, abandonQuest } = useQuests();

  const [activities, setActivities] = useState([]);
  const [dimStats, setDimStats] = useState({});
  const [currentBadgeModal, setCurrentBadgeModal] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const questBoardRef = useRef(null);

  const progress = loadProgress();

  useEffect(() => {
    setActivities(loadActivityFeed());
    setDimStats(getDimensionStats(progress));
  }, [totalXP, earnedBadges.length]);

  // Show first new badge in queue
  useEffect(() => {
    if (newBadges.length > 0 && !currentBadgeModal) {
      setCurrentBadgeModal(newBadges[0]);
      setShowConfetti(true);
    }
  }, [newBadges, currentBadgeModal]);

  // Trigger confetti on level-up
  useEffect(() => {
    if (levelUp) setShowConfetti(true);
  }, [levelUp]);

  const handleBadgeModalClose = useCallback(() => {
    setCurrentBadgeModal(null);
    if (newBadges.length <= 1) {
      clearNewBadges();
    } else {
      // Shift queue: let next badge appear
      setTimeout(() => {
        const remaining = newBadges.slice(1);
        if (remaining.length > 0) setCurrentBadgeModal(remaining[0]);
        else clearNewBadges();
      }, 300);
    }
  }, [newBadges, clearNewBadges]);

  const handleLevelUpClose = useCallback(() => {
    clearLevelUp();
  }, [clearLevelUp]);

  function scrollToQuestBoard() {
    questBoardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const stats = computeAllStats({
    progress,
    earnedBadges,
    overallStreak,
    activeQuests,
    levelInfo,
    totalXP,
  });

  const nextMilestone = getNextStreakMilestone(stats.currentStreak);

  return (
    <div className="ipd-root">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <CelebrationConfetti
        active={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />

      <LevelUpModal levelUp={levelUp} onClose={handleLevelUpClose} />
      <BadgeUnlockModal badge={currentBadgeModal} onClose={handleBadgeModalClose} />

      {/* Header */}
      <div className="ipd-header">
        <div className="ipd-header-text">
          <h1 className="ipd-title">Your IATLAS Journey</h1>
          <p className="ipd-tagline">
            Track your resilience skills, earn badges, and build daily streaks.
          </p>
        </div>
        <div className="ipd-header-actions">
          <Link to="/iatlas" className="ipd-btn ipd-btn-primary">
            📚 View Full Curriculum
          </Link>
          <button className="ipd-btn ipd-btn-secondary" onClick={scrollToQuestBoard}>
            🎯 Start a Quest
          </button>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="ipd-section">
        <XPProgressBar totalXP={totalXP} levelInfo={levelInfo} />
      </div>

      {/* Stats Row */}
      <div className="ipd-section">
        <div className="ipd-stats-grid">
          <StatsCard icon="⭐" label="Total XP" value={totalXP.toLocaleString()} color="#eab308" />
          <StatsCard icon="✅" label="Skills Completed" value={stats.totalSkills} color="#059669" />
          <StatsCard icon="🏅" label="Badges Earned" value={stats.badgesEarned} color="#7c3aed" />
          <StatsCard icon="🔥" label="Current Streak" value={`${stats.currentStreak}d`} color="#f97316" />
          <StatsCard icon="🎯" label="Active Quests" value={stats.activeQuestsCount} color="#4f46e5" />
          <StatsCard
            icon={levelInfo.icon}
            label="Level"
            value={`${levelInfo.level}`}
            color={levelInfo.color}
            subtitle={levelInfo.title}
          />
        </div>
      </div>

      {/* Two-column: Dimension Progress + Activity Feed */}
      <div className="ipd-section ipd-two-col">
        <div className="ipd-card">
          <h2 className="ipd-section-title">🧭 Dimension Progress</h2>
          <div className="ipd-dim-list">
            {Object.values(dimStats).map(dim => (
              <div className="ipd-dim-row" key={dim.key}>
                <div className="ipd-dim-header">
                  <div className="ipd-dim-name-group">
                    <span className="ipd-dim-emoji" aria-hidden="true">{dim.emoji}</span>
                    <Link
                      to={`/iatlas/curriculum/${dim.key}`}
                      className="ipd-dim-name"
                      title={dim.title}
                    >
                      {dim.title}
                    </Link>
                  </div>
                  <span className="ipd-dim-count">
                    {dim.completed}/{dim.total}
                  </span>
                </div>
                <div className="ipd-dim-bar-track">
                  <div
                    className="ipd-dim-bar-fill"
                    style={{ width: `${dim.pct}%`, background: dim.color }}
                    role="progressbar"
                    aria-valuenow={dim.pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${dim.title} progress: ${dim.pct}%`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ipd-card">
          <ActivityFeed activities={activities} maxItems={10} />
        </div>
      </div>

      {/* Badge Gallery */}
      <div className="ipd-section ipd-card">
        <BadgeGallery
          allBadges={allBadges}
          onBadgeClick={badge => setCurrentBadgeModal(badge)}
        />
      </div>

      {/* Quest Board */}
      <div className="ipd-section" ref={questBoardRef}>
        <h2 className="ipd-section-title">📋 Quest Board</h2>
        <QuestBoard
          activeQuests={activeQuests}
          completedQuests={completedQuests}
          onStartQuest={startQuest}
          onAbandonQuest={abandonQuest}
        />
      </div>

      {/* Streak Tracker */}
      <div className="ipd-section ipd-card">
        <h2 className="ipd-section-title">🔥 Streak Tracker</h2>
        <StreakTracker
          overallStreak={overallStreak}
          dimensionStreaks={dimensionStreaks}
          nextMilestone={nextMilestone}
        />
      </div>
    </div>
  );
}
