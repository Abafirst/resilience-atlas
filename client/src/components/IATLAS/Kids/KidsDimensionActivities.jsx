/**
 * KidsDimensionActivities.jsx
 * Shows all activities for a given dimension + age group.
 * Route: /iatlas/kids/:ageGroup/:dimension
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import SiteHeader from '../../SiteHeader.jsx';
import DarkModeHint from '../../DarkModeHint.jsx';
import KidsActivityCard from './KidsActivityCard.jsx';
import ActivityCompleteModal from './ActivityCompleteModal.jsx';
import useKidsProgress from '../../../hooks/useKidsProgress.js';
import { makeActivityId } from '../../../utils/kidsProgressHelpers.js';
import {
  KIDS_AGE_GROUPS,
  KIDS_ACTIVITIES_BY_DIMENSION,
  getActivitiesForDimension,
  getDifficultyForActivity,
} from '../../../data/iatlas/kidsActivities.js';

const PAGE_STYLES = `
  .kda-page {
    background: #f8fafc;
    min-height: 100vh;
  }

  .dark-mode .kda-page {
    background: #0f172a;
  }

  .kda-wrap {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 1.25rem 4rem;
  }

  .kda-breadcrumb {
    display: flex;
    align-items: center;
    gap: .4rem;
    font-size: .8rem;
    color: #6b7280;
    padding: 1.25rem 0 .5rem;
    flex-wrap: wrap;
  }

  .kda-breadcrumb a {
    color: inherit;
    text-decoration: none;
  }

  .kda-breadcrumb a:hover {
    color: #4f46e5;
    text-decoration: underline;
  }

  .kda-breadcrumb-sep {
    color: #d1d5db;
  }

  .kda-hero {
    border-radius: 16px;
    padding: 2rem;
    margin: .75rem 0 2rem;
    color: #ffffff;
    position: relative;
    overflow: hidden;
  }

  .kda-hero::before {
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

  .kda-hero-kicker {
    display: flex;
    align-items: center;
    gap: .45rem;
    font-size: .8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .06em;
    opacity: .85;
    margin-bottom: .5rem;
  }

  .kda-hero-icon {
    width: 18px;
    height: 18px;
    filter: brightness(0) invert(1);
  }

  .kda-hero-title {
    font-size: 1.75rem;
    font-weight: 800;
    margin: 0 0 .5rem;
    line-height: 1.2;
  }

  .kda-hero-sub {
    font-size: .95rem;
    opacity: .88;
    margin: 0;
    max-width: 540px;
  }

  .kda-hero-badge {
    position: absolute;
    bottom: 1.25rem;
    right: 1.5rem;
    background: rgba(255,255,255,.15);
    border-radius: 8px;
    padding: .4rem .75rem;
    font-size: .8rem;
    font-weight: 700;
  }

  .kda-count {
    font-size: .88rem;
    color: #64748b;
    margin-bottom: 1.25rem;
  }

  .dark-mode .kda-count {
    color: #94a3b8;
  }

  .kda-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  .kda-empty {
    background: #ffffff;
    border: 1px dashed #e2e8f0;
    border-radius: 14px;
    padding: 3rem 2rem;
    text-align: center;
    color: #94a3b8;
    font-size: .9rem;
  }

  .dark-mode .kda-empty {
    background: #1e293b;
    border-color: #334155;
    color: #64748b;
  }

  .kda-back-link {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    color: #4f46e5;
    font-size: .85rem;
    font-weight: 600;
    text-decoration: none;
    padding: .45rem .85rem;
    border-radius: 8px;
    border: 1px solid #e0e7ff;
    margin-bottom: 1.5rem;
    transition: background .15s;
  }

  .kda-back-link:hover {
    background: #eef2ff;
  }

  .dark-mode .kda-back-link {
    color: #818cf8;
    border-color: #334155;
  }

  .dark-mode .kda-back-link:hover {
    background: #1e2a40;
  }

  /* ── Filter bar ── */
  .kda-filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: .65rem;
    align-items: center;
    margin-bottom: 1.25rem;
  }

  .kda-search-wrap {
    position: relative;
    flex: 1 1 200px;
  }

  .kda-search-icon {
    position: absolute;
    left: .65rem;
    top: 50%;
    transform: translateY(-50%);
    width: 14px;
    height: 14px;
    opacity: .45;
    pointer-events: none;
  }

  .kda-search {
    width: 100%;
    padding: .5rem .75rem .5rem 2.1rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: .84rem;
    background: #ffffff;
    color: #0f172a;
    outline: none;
    box-sizing: border-box;
    transition: border-color .15s;
  }

  .kda-search:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79,70,229,.1);
  }

  .dark-mode .kda-search {
    background: #1e293b;
    border-color: #334155;
    color: #f1f5f9;
  }

  .dark-mode .kda-search:focus {
    border-color: #6366f1;
  }

  .kda-filter-select {
    padding: .5rem .75rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: .82rem;
    background: #ffffff;
    color: #374151;
    cursor: pointer;
    outline: none;
    transition: border-color .15s;
    flex: 0 0 auto;
  }

  .kda-filter-select:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79,70,229,.1);
  }

  .dark-mode .kda-filter-select {
    background: #1e293b;
    border-color: #334155;
    color: #f1f5f9;
  }
`;

export default function KidsDimensionActivities() {
  const { ageGroup: ageGroupId, dimension: dimensionKey } = useParams();

  const [search,     setSearch]     = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [completeModal, setCompleteModal] = useState(null); // { starsEarned, extraStars, dimComplete }

  const ageGroup  = KIDS_AGE_GROUPS.find(ag => ag.id === ageGroupId);
  const dimData   = KIDS_ACTIVITIES_BY_DIMENSION[dimensionKey];
  const allActs   = getActivitiesForDimension(dimensionKey, ageGroupId);

  const { completeActivity, isCompleted } = useKidsProgress();

  const handleComplete = useCallback((activity) => {
    const result = completeActivity({
      activityId: makeActivityId(ageGroupId, activity.title),
      title:      activity.title,
      ageGroup:   ageGroupId,
      dimension:  dimensionKey,
      complete:   true,
    });
    setCompleteModal(result || { starsEarned: 3, extraStars: 0, dimComplete: false });
  }, [ageGroupId, dimensionKey, completeActivity]);

  const activities = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allActs.filter(act => {
      const matchSearch = !q ||
        act.title.toLowerCase().includes(q) ||
        (act.learningGoal || '').toLowerCase().includes(q);
      const actDiff = getDifficultyForActivity(ageGroupId, act.type);
      const matchDiff = difficulty === 'all' || actDiff === difficulty;
      return matchSearch && matchDiff;
    });
  }, [allActs, search, difficulty, ageGroupId]);

  if (!ageGroup || !dimData) {
    return (
      <>
        <SiteHeader activePage="iatlas" />
        <main id="main-content" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
          <p>Content not found. <Link to="/iatlas/kids">Return to Kids Curriculum</Link></p>
        </main>
      </>
    );
  }

  return (
    <>
      <style>{PAGE_STYLES}</style>
      <a href="#main-content" className="iatlas-skip">Skip to activities</a>
      <SiteHeader activePage="iatlas" />
      <DarkModeHint />

      {completeModal && (
        <ActivityCompleteModal
          starsEarned={completeModal.starsEarned}
          extraStars={completeModal.extraStars}
          dimComplete={completeModal.dimComplete}
          onClose={() => setCompleteModal(null)}
        />
      )}

      <main className="kda-page" id="main-content">
        <div className="kda-wrap">

          {/* Breadcrumb */}
          <nav className="kda-breadcrumb" aria-label="Breadcrumb">
            <a href="/iatlas">IATLAS</a>
            <span className="kda-breadcrumb-sep" aria-hidden="true">›</span>
            <a href="/iatlas/kids">Kids Curriculum</a>
            <span className="kda-breadcrumb-sep" aria-hidden="true">›</span>
            <Link to={`/iatlas/kids/${ageGroupId}`}>{ageGroup.label}</Link>
            <span className="kda-breadcrumb-sep" aria-hidden="true">›</span>
            <span aria-current="page">{dimData.kidsName}</span>
          </nav>

          {/* Hero */}
          <div
            className="kda-hero"
            style={{ background: `linear-gradient(135deg, ${dimData.color}, ${dimData.color}cc)` }}
          >
            <div className="kda-hero-kicker">
              <img src={dimData.icon} alt="" className="kda-hero-icon" aria-hidden="true" />
              {ageGroup.nickname}
            </div>
            <h1 className="kda-hero-title">
              {dimData.kidsName}
            </h1>
            <p className="kda-hero-sub">
              {dimData.dimensionTitle} activities for {ageGroup.label}
            </p>
            <span className="kda-hero-badge" aria-hidden="true">
              {allActs.length} {allActs.length === 1 ? 'activity' : 'activities'}
            </span>
          </div>

          {/* Back link */}
          <Link
            to={`/iatlas/kids/${ageGroupId}`}
            className="kda-back-link"
            aria-label={`Back to ${ageGroup.label} curriculum`}
          >
            ← Back to {ageGroup.label}
          </Link>

          {/* Filter bar */}
          {allActs.length > 0 && (
            <div className="kda-filter-bar" role="search" aria-label="Filter activities">
              <div className="kda-search-wrap">
                <img src="/icons/compass.svg" alt="" className="kda-search-icon" aria-hidden="true" />
                <input
                  className="kda-search"
                  type="search"
                  placeholder="Search activities…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label="Search activities"
                />
              </div>
              <select
                className="kda-filter-select"
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
                aria-label="Filter by difficulty"
              >
                <option value="all">All difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          )}

          {/* Activity count */}
          {allActs.length > 0 && (
            <p className="kda-count">
              {activities.length === allActs.length
                ? `${allActs.length} ${allActs.length === 1 ? 'activity' : 'activities'} for ${ageGroup.label} · ${ageGroup.attentionSpan} each`
                : `${activities.length} of ${allActs.length} activities matching filters`
              }
            </p>
          )}

          {/* Activity grid */}
          {activities.length > 0 ? (
            <div className="kda-grid" role="list">
              {activities.map(activity => {
                const actId    = makeActivityId(ageGroupId, activity.title);
                const done     = isCompleted(actId);
                const withDiff = { ...activity, difficulty: getDifficultyForActivity(ageGroupId, activity.type) };
                return (
                  <div key={activity.id} role="listitem">
                    <KidsActivityCard
                      activity={withDiff}
                      accentColor={dimData.color}
                      onComplete={() => handleComplete(activity)}
                      isCompleted={done}
                    />
                  </div>
                );
              })}
            </div>
          ) : allActs.length > 0 ? (
            <div className="kda-empty" role="status">
              No activities match your filters. Try a different search or difficulty.
            </div>
          ) : (
            <div className="kda-empty" role="status">
              Activities for this dimension are coming soon!
            </div>
          )}

        </div>
      </main>
    </>
  );
}
