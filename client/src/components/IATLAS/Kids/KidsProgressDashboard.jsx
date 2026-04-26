/**
 * KidsProgressDashboard.jsx
 * Main progress view for kids — level, stars, dimension progress,
 * badge gallery, active adventures, and streak indicator.
 */

import React, { useState, useEffect, useCallback } from 'react';

import useKidsProgress   from '../../../hooks/useKidsProgress.js';
import useKidsBadges     from '../../../hooks/useKidsBadges.js';
import useKidsStreaks     from '../../../hooks/useKidsStreaks.js';
import useKidsAdventures from '../../../hooks/useKidsAdventures.js';

import StreakFlame      from './StreakFlame.jsx';
import DimensionProgress from './DimensionProgress.jsx';
import BadgeGallery     from './BadgeGallery.jsx';
import AdventureCard    from './AdventureCard.jsx';
import ActivityCompleteModal from './ActivityCompleteModal.jsx';

import { KIDS_LEVELS, AGE_GROUP_COLORS, AGE_GROUP_LABELS } from '../../../data/kidsGamification.js';
import { makeActivityId, normalizeDimensionKey, KIDS_STORAGE_KEYS } from '../../../utils/kidsProgressHelpers.js';
import { KIDS_ACTIVITIES, KIDS_DIMENSION_ICON_MAP } from '../../../data/kidsActivities.js';

const STYLES = `
  .kpd-root {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 1.25rem 4rem;
  }

  /* ── Level card ── */
  .kpd-level-card {
    border-radius: 18px;
    padding: 1.5rem 1.75rem;
    color: #ffffff;
    margin-bottom: 1.5rem;
    position: relative;
    overflow: hidden;
  }

  .kpd-level-title {
    font-size: .72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .1em;
    opacity: .85;
    margin: 0 0 .25rem;
  }

  .kpd-level-name {
    font-size: 1.75rem;
    font-weight: 900;
    margin: 0 0 .15rem;
    line-height: 1.1;
  }

  .kpd-level-message {
    font-size: .82rem;
    opacity: .9;
    margin: 0 0 1rem;
  }

  .kpd-level-bar-wrap {
    background: rgba(255,255,255,.25);
    border-radius: 10px;
    height: 10px;
    overflow: hidden;
    margin-bottom: .4rem;
  }

  .kpd-level-bar-fill {
    height: 100%;
    border-radius: 10px;
    background: rgba(255,255,255,.9);
    transition: width .6s ease;
  }

  .kpd-level-bar-label {
    display: flex;
    justify-content: space-between;
    font-size: .72rem;
    opacity: .85;
  }

  /* ── Stats row ── */
  .kpd-stats-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: .75rem;
    margin-bottom: 1.5rem;
  }

  @media (min-width: 500px) {
    .kpd-stats-row {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .kpd-stat-card {
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    padding: .9rem .75rem .75rem;
    text-align: center;
  }

  .dark-mode .kpd-stat-card {
    background: #1e293b;
    border-color: #334155;
  }

  .kpd-stat-icon {
    width: 24px;
    height: 24px;
    margin: 0 auto .35rem;
    display: block;
  }

  .kpd-stat-value {
    font-size: 1.4rem;
    font-weight: 800;
    color: #0f172a;
    line-height: 1;
    margin-bottom: .2rem;
  }

  .dark-mode .kpd-stat-value {
    color: #f1f5f9;
  }

  .kpd-stat-label {
    font-size: .7rem;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .04em;
  }

  /* ── Section cards ── */
  .kpd-card {
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: 16px;
    padding: 1.25rem;
    margin-bottom: 1.25rem;
  }

  .dark-mode .kpd-card {
    background: #1e293b;
    border-color: #334155;
  }

  .kpd-section-title {
    font-size: .95rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 1rem;
    display: flex;
    align-items: center;
    gap: .5rem;
  }

  .dark-mode .kpd-section-title {
    color: #f1f5f9;
  }

  .kpd-section-icon {
    width: 20px;
    height: 20px;
  }

  /* ── Age group tabs ── */
  .kpd-age-tabs {
    display: flex;
    gap: .4rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .kpd-age-tab {
    padding: .3rem .75rem;
    border-radius: 20px;
    font-size: .78rem;
    font-weight: 700;
    border: 1.5px solid #e2e8f0;
    background: #f8fafc;
    color: #475569;
    cursor: pointer;
    transition: background .15s, border-color .15s, color .15s;
  }

  .kpd-age-tab:hover {
    background: #eef2ff;
    border-color: #a5b4fc;
    color: #4338ca;
  }

  .kpd-age-tab.kpd-age-active {
    color: #ffffff;
    border-color: transparent;
  }

  .dark-mode .kpd-age-tab {
    background: #1e293b;
    border-color: #334155;
    color: #94a3b8;
  }

  .dark-mode .kpd-age-tab:hover {
    background: #1e2a40;
    border-color: #4f46e5;
    color: #818cf8;
  }

  /* ── Adventure grid ── */
  .kpd-adventure-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: .85rem;
  }

  /* ── Parent zone link ── */
  .kpd-parent-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #f0fdf4;
    border: 1.5px solid #86efac;
    border-radius: 14px;
    padding: 1rem 1.25rem;
    cursor: pointer;
    gap: .75rem;
    text-decoration: none;
    transition: background .15s;
    margin-bottom: 1.25rem;
  }

  .kpd-parent-link:hover {
    background: #dcfce7;
  }

  .dark-mode .kpd-parent-link {
    background: #052e16;
    border-color: #166534;
  }

  .dark-mode .kpd-parent-link:hover {
    background: #14532d;
  }

  .kpd-parent-link-text h3 {
    font-size: .9rem;
    font-weight: 700;
    color: #15803d;
    margin: 0 0 .2rem;
  }

  .kpd-parent-link-text p {
    font-size: .78rem;
    color: #166534;
    margin: 0;
  }

  .dark-mode .kpd-parent-link-text h3 { color: #4ade80; }
  .dark-mode .kpd-parent-link-text p  { color: #86efac; }

  .kpd-parent-arrow {
    font-size: 1.2rem;
    color: #15803d;
    flex-shrink: 0;
  }

  .dark-mode .kpd-parent-arrow { color: #4ade80; }

  /* ── Mark done button (quick-complete from dashboard) ── */
  .kpd-quick-activity-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: .6rem;
  }

  .kpd-quick-activity {
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    padding: .65rem .85rem;
    display: flex;
    align-items: center;
    gap: .6rem;
    font-size: .8rem;
    color: #374151;
  }

  .dark-mode .kpd-quick-activity {
    background: #1e293b;
    border-color: #334155;
    color: #cbd5e1;
  }

  .kpd-quick-activity.kpd-done {
    opacity: .55;
    text-decoration: line-through;
    color: #94a3b8;
  }

  .kpd-quick-check {
    background: none;
    border: 1.5px solid #e2e8f0;
    border-radius: 50%;
    width: 22px;
    height: 22px;
    min-width: 22px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: background .15s, border-color .15s;
    flex-shrink: 0;
  }

  .kpd-quick-check:hover {
    background: #eef2ff;
    border-color: #6366f1;
  }

  .kpd-quick-check.kpd-checked {
    background: #059669;
    border-color: #059669;
  }

  .dark-mode .kpd-quick-check {
    border-color: #334155;
  }

  .dark-mode .kpd-quick-check:hover {
    background: #1e2a40;
    border-color: #6366f1;
  }

  .kpd-activity-name {
    flex: 1;
    font-weight: 600;
    line-height: 1.3;
  }

  .kpd-activity-dim {
    font-size: .68rem;
    color: #64748b;
  }
`;

const AGE_GROUPS = [
  { id: 'age-5-7',   label: 'Ages 5–7'   },
  { id: 'age-8-10',  label: 'Ages 8–10'  },
  { id: 'age-11-14', label: 'Ages 11–14' },
  { id: 'age-15-18', label: 'Ages 15–18' },
];

export default function KidsProgressDashboard({ onParentZone }) {
  const { totalStars, levelInfo, getDimensionCounts, getTotals, completeActivity, isCompleted, refresh: refreshProgress } = useKidsProgress();
  const { allBadges, earnedCount, newBadges, checkBadges, clearNewBadges } = useKidsBadges();
  const { current: streakCurrent, longest: streakLongest, recordActivity: recordStreak } = useKidsStreaks();
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('age-5-7');
  const { getAdventures } = useKidsAdventures(selectedAgeGroup);

  const [completionResult, setCompletionResult] = useState(null);
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  const adventures    = getAdventures();
  const dimCounts     = getDimensionCounts(selectedAgeGroup);
  const dimTotals     = getTotals(selectedAgeGroup);
  const ageColor      = AGE_GROUP_COLORS[selectedAgeGroup] || '#6366f1';

  // Show badge notification queue
  useEffect(() => {
    if (newBadges.length > 0 && !showBadgeModal) {
      setCurrentBadgeIndex(0);
      setShowBadgeModal(true);
    }
  }, [newBadges, showBadgeModal]);

  const handleActivityComplete = useCallback((activity) => {
    const actId  = makeActivityId(selectedAgeGroup, activity.title);
    if (isCompleted(actId)) return;

    const result = completeActivity({
      activityId: actId,
      title:      activity.title,
      ageGroup:   selectedAgeGroup,
      dimension:  activity.dimension,
      complete:   true,
    });
    const { streakData: updatedStreak } = recordStreak();
    const newlyUnlocked = checkBadges({ currentStreak: updatedStreak?.current ?? streakCurrent });
    setCompletionResult({ ...result, newBadge: newlyUnlocked[0] || null });
  }, [selectedAgeGroup, completeActivity, isCompleted, recordStreak, checkBadges, streakCurrent]);

  const handleCloseCompletion = useCallback(() => {
    setCompletionResult(null);
    clearNewBadges();
  }, [clearNewBadges]);

  // Activities for the selected age group
  const activities = (KIDS_ACTIVITIES[selectedAgeGroup] || []).slice(0, 12);

  return (
    <>
      <style>{STYLES}</style>

      <div className="kpd-root">

        {/* ── Level Card ───────────────────────────────────────────────────── */}
        <div
          className="kpd-level-card"
          style={{ background: `linear-gradient(135deg, ${levelInfo.color} 0%, ${levelInfo.color}cc 100%)` }}
          role="region"
          aria-label="Current level"
        >
          <p className="kpd-level-title">Level {levelInfo.level}</p>
          <h2 className="kpd-level-name">{levelInfo.title}</h2>
          <p className="kpd-level-message">{levelInfo.message}</p>

          <div className="kpd-level-bar-wrap">
            <div
              className="kpd-level-bar-fill"
              style={{ width: `${levelInfo.progress}%` }}
              role="progressbar"
              aria-valuenow={levelInfo.progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Level progress: ${levelInfo.progress}%`}
            />
          </div>
          <div className="kpd-level-bar-label">
            <span>{levelInfo.minStars} stars</span>
            <span>
              {levelInfo.isMax
                ? 'Max level!'
                : `${levelInfo.starsToNext} stars to ${KIDS_LEVELS[levelInfo.level]?.title || 'next level'}`}
            </span>
          </div>
        </div>

        {/* ── Stats Row ────────────────────────────────────────────────────── */}
        <div className="kpd-stats-row" role="region" aria-label="Progress statistics">
          <div className="kpd-stat-card">
            <img src="/icons/star.svg" alt="" aria-hidden="true" className="kpd-stat-icon" />
            <div className="kpd-stat-value" aria-label={`${totalStars} total stars`}>{totalStars}</div>
            <div className="kpd-stat-label">Stars</div>
          </div>
          <div className="kpd-stat-card">
            <img src="/icons/badges.svg" alt="" aria-hidden="true" className="kpd-stat-icon" />
            <div className="kpd-stat-value" aria-label={`${earnedCount} badges earned`}>{earnedCount}</div>
            <div className="kpd-stat-label">Badges</div>
          </div>
          <div className="kpd-stat-card">
            <img src="/icons/fire.svg" alt="" aria-hidden="true" className="kpd-stat-icon" />
            <div className="kpd-stat-value" aria-label={`${streakCurrent} day streak`}>{streakCurrent}</div>
            <div className="kpd-stat-label">Streak</div>
          </div>
          <div className="kpd-stat-card">
            <img src="/icons/checkmark.svg" alt="" aria-hidden="true" className="kpd-stat-icon" />
            <div className="kpd-stat-value">
              {Object.keys(dimCounts).reduce((s, k) => s + (dimCounts[k] || 0), 0)}
            </div>
            <div className="kpd-stat-label">Done</div>
          </div>
        </div>

        {/* ── Age Group Selector ───────────────────────────────────────────── */}
        <div
          className="kpd-age-tabs"
          role="tablist"
          aria-label="Select age group to view progress"
        >
          {AGE_GROUPS.map(ag => (
            <button
              key={ag.id}
              className={`kpd-age-tab${selectedAgeGroup === ag.id ? ' kpd-age-active' : ''}`}
              style={selectedAgeGroup === ag.id ? { background: AGE_GROUP_COLORS[ag.id] } : {}}
              role="tab"
              aria-selected={selectedAgeGroup === ag.id}
              onClick={() => setSelectedAgeGroup(ag.id)}
            >
              {ag.label}
            </button>
          ))}
        </div>

        {/* ── Dimension Progress ───────────────────────────────────────────── */}
        <div className="kpd-card" role="region" aria-label="Dimension progress">
          <h3 className="kpd-section-title">
            <img src="/icons/compass.svg" alt="" aria-hidden="true" className="kpd-section-icon" />
            {AGE_GROUP_LABELS[selectedAgeGroup]} — Dimension Progress
          </h3>
          <DimensionProgress
            ageGroup={selectedAgeGroup}
            completed={dimCounts}
            totals={dimTotals}
          />
        </div>

        {/* ── Activities Quick-Complete ─────────────────────────────────────── */}
        <div className="kpd-card" role="region" aria-label="Activities">
          <h3 className="kpd-section-title">
            <img src="/icons/movement.svg" alt="" aria-hidden="true" className="kpd-section-icon" />
            Activities — {AGE_GROUP_LABELS[selectedAgeGroup]}
          </h3>
          <p style={{ fontSize: '.8rem', color: '#64748b', marginBottom: '.85rem' }}>
            Check off activities you've completed to earn stars and track your progress.
          </p>
          <div className="kpd-quick-activity-grid">
            {activities.map((activity) => {
              const actId = makeActivityId(selectedAgeGroup, activity.title);
              const done  = isCompleted(actId);
              return (
                <div
                  key={actId}
                  className={`kpd-quick-activity${done ? ' kpd-done' : ''}`}
                >
                  <button
                    className={`kpd-quick-check${done ? ' kpd-checked' : ''}`}
                    onClick={() => !done && handleActivityComplete(activity)}
                    aria-label={done ? `${activity.title} — completed` : `Mark ${activity.title} as complete`}
                    aria-pressed={done}
                    disabled={done}
                  >
                    {done && (
                      <img src="/icons/checkmark.svg" alt="" aria-hidden="true" width={12} height={12} style={{ filter: 'invert(1)' }} />
                    )}
                  </button>
                  <div>
                    <div className="kpd-activity-name">{activity.title}</div>
                    <div className="kpd-activity-dim">{activity.dimension}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {(KIDS_ACTIVITIES[selectedAgeGroup] || []).length > 12 && (
            <p style={{ fontSize: '.78rem', color: '#64748b', marginTop: '.75rem' }}>
              Showing 12 of {(KIDS_ACTIVITIES[selectedAgeGroup] || []).length} activities.
            </p>
          )}
        </div>

        {/* ── Streak ───────────────────────────────────────────────────────── */}
        <div className="kpd-card" role="region" aria-label="Activity streak">
          <h3 className="kpd-section-title">
            <img src="/icons/fire.svg" alt="" aria-hidden="true" className="kpd-section-icon" />
            Streak
          </h3>
          <StreakFlame
            current={streakCurrent}
            longest={streakLongest}
            size="lg"
            showLongest
          />
        </div>

        {/* ── Adventures ───────────────────────────────────────────────────── */}
        <div className="kpd-card" role="region" aria-label="Adventures">
          <h3 className="kpd-section-title">
            <img src="/icons/game-target.svg" alt="" aria-hidden="true" className="kpd-section-icon" />
            Adventures
          </h3>
          {adventures.length > 0 ? (
            <div className="kpd-adventure-grid">
              {adventures.map(adv => (
                <AdventureCard key={adv.id} adventure={adv} showSteps={false} />
              ))}
            </div>
          ) : (
            <p style={{ color: '#64748b', fontSize: '.85rem' }}>
              No adventures available for this age group yet.
            </p>
          )}
        </div>

        {/* ── Badge Gallery ─────────────────────────────────────────────────── */}
        <div className="kpd-card" role="region" aria-label="Badge collection">
          <h3 className="kpd-section-title">
            <img src="/icons/badges.svg" alt="" aria-hidden="true" className="kpd-section-icon" />
            My Badges
          </h3>
          <BadgeGallery allBadges={allBadges} />
        </div>

        {/* ── Parent Zone link ─────────────────────────────────────────────── */}
        {onParentZone && (
          <button
            className="kpd-parent-link"
            onClick={onParentZone}
            aria-label="Open parent dashboard"
          >
            <div>
              <img
                src="/icons/relational-connective.svg"
                alt=""
                aria-hidden="true"
                style={{ width: 36, height: 36 }}
              />
            </div>
            <div className="kpd-parent-link-text">
              <h3>Parent Zone</h3>
              <p>View your child's full progress, add celebration notes, and print certificates.</p>
            </div>
            <span className="kpd-parent-arrow" aria-hidden="true">›</span>
          </button>
        )}
      </div>

      {/* Celebration modal */}
      {completionResult && (
        <ActivityCompleteModal
          starsEarned={completionResult.starsEarned}
          extraStars={completionResult.extraStars}
          dimComplete={completionResult.dimComplete}
          newBadge={completionResult.newBadge}
          onClose={handleCloseCompletion}
        />
      )}
    </>
  );
}
