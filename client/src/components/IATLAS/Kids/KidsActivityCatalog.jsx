/**
 * KidsActivityCatalog.jsx
 * Searchable, filterable catalog of all 96+ IATLAS Kids activities.
 * Route: /iatlas/kids/catalog
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../../SiteHeader.jsx';
import DarkModeHint from '../../DarkModeHint.jsx';
import KidsActivityCard from './KidsActivityCard.jsx';
import ActivityCompleteModal from './ActivityCompleteModal.jsx';
import ActivitySearch from '../ActivitySearch.jsx';
import FavoriteButton from '../FavoriteButton.jsx';
import useKidsProgress from '../../../hooks/useKidsProgress.js';
import useFavorites from '../../../hooks/useFavorites.js';
import { makeActivityId } from '../../../utils/kidsProgressHelpers.js';
import {
  KIDS_AGE_GROUPS,
  KIDS_ACTIVITIES_BY_DIMENSION,
  ACTIVITY_TYPES,
  getAllActivities,
  countTotalActivities,
} from '../../../data/iatlas/kidsActivities.js';

const PAGE_STYLES = `
  .kac-page {
    background: #f8fafc;
    min-height: 100vh;
  }

  .dark-mode .kac-page {
    background: #0f172a;
  }

  .kac-wrap {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 1.25rem 5rem;
  }

  .kac-breadcrumb {
    display: flex;
    align-items: center;
    gap: .4rem;
    font-size: .8rem;
    color: #6b7280;
    padding: 1.25rem 0 .5rem;
    flex-wrap: wrap;
  }

  .kac-breadcrumb a {
    color: inherit;
    text-decoration: none;
  }

  .kac-breadcrumb a:hover {
    color: #4f46e5;
    text-decoration: underline;
  }

  .kac-breadcrumb-sep { color: #d1d5db; }

  /* ── Hero ── */
  .kac-hero {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #0891b2 100%);
    border-radius: 20px;
    padding: 2.5rem 2rem 2rem;
    margin: .75rem 0 2rem;
    color: #ffffff;
    position: relative;
    overflow: hidden;
  }

  .kac-hero::before {
    content: '';
    position: absolute;
    top: -50px; right: -50px;
    width: 200px; height: 200px;
    background: rgba(255,255,255,.06);
    border-radius: 50%;
    pointer-events: none;
  }

  .kac-hero-kicker {
    font-size: .78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .08em;
    opacity: .85;
    margin-bottom: .5rem;
    display: flex;
    align-items: center;
    gap: .35rem;
  }

  .kac-hero-title {
    font-size: 2rem;
    font-weight: 900;
    margin: 0 0 .5rem;
    line-height: 1.15;
  }

  .kac-hero-sub {
    font-size: .95rem;
    opacity: .88;
    margin: 0 0 1rem;
    max-width: 540px;
  }

  .kac-hero-stats {
    display: flex;
    flex-wrap: wrap;
    gap: .75rem;
  }

  .kac-hero-stat {
    background: rgba(255,255,255,.18);
    border-radius: 20px;
    padding: .3rem .8rem;
    font-size: .8rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: .35rem;
  }

  /* ── Filter bar ── */
  .kac-filters {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 1rem 1.25rem;
    margin-bottom: 1.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: .75rem;
    align-items: flex-end;
  }

  .dark-mode .kac-filters {
    background: #1e293b;
    border-color: #334155;
  }

  .kac-filter-group {
    display: flex;
    flex-direction: column;
    gap: .3rem;
    flex: 1 1 160px;
  }

  .kac-filter-label {
    font-size: .72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: #64748b;
  }

  .dark-mode .kac-filter-label {
    color: #94a3b8;
  }

  .kac-filter-search-wrap {
    position: relative;
    flex: 2 1 260px;
  }

  .kac-filter-search-icon {
    position: absolute;
    left: .65rem;
    top: 50%;
    transform: translateY(-50%);
    width: 14px;
    height: 14px;
    opacity: .45;
    pointer-events: none;
  }

  .kac-filter-input {
    width: 100%;
    padding: .5rem .75rem .5rem 2.1rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: .84rem;
    background: #f8fafc;
    color: #0f172a;
    outline: none;
    box-sizing: border-box;
    transition: border-color .15s;
  }

  .kac-filter-input:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79,70,229,.1);
  }

  .dark-mode .kac-filter-input {
    background: #0f172a;
    border-color: #334155;
    color: #f1f5f9;
  }

  .dark-mode .kac-filter-input:focus {
    border-color: #6366f1;
  }

  .kac-filter-select {
    width: 100%;
    padding: .5rem .75rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: .82rem;
    background: #f8fafc;
    color: #374151;
    cursor: pointer;
    outline: none;
    transition: border-color .15s;
  }

  .kac-filter-select:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79,70,229,.1);
  }

  .dark-mode .kac-filter-select {
    background: #0f172a;
    border-color: #334155;
    color: #f1f5f9;
  }

  .kac-filter-clear {
    background: none;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: .5rem .85rem;
    font-size: .82rem;
    color: #64748b;
    cursor: pointer;
    transition: background .15s;
    align-self: flex-end;
    white-space: nowrap;
  }

  .kac-filter-clear:hover {
    background: #f1f5f9;
    color: #1e293b;
  }

  .dark-mode .kac-filter-clear {
    border-color: #334155;
    color: #94a3b8;
  }

  .dark-mode .kac-filter-clear:hover {
    background: #0f172a;
    color: #f1f5f9;
  }

  /* ── Result count ── */
  .kac-result-count {
    font-size: .85rem;
    color: #64748b;
    margin-bottom: 1rem;
  }

  .dark-mode .kac-result-count {
    color: #94a3b8;
  }

  /* ── Grid ── */
  .kac-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }

  /* ── Empty state ── */
  .kac-empty {
    background: #ffffff;
    border: 1px dashed #e2e8f0;
    border-radius: 14px;
    padding: 3rem 2rem;
    text-align: center;
    color: #94a3b8;
    font-size: .9rem;
  }

  .dark-mode .kac-empty {
    background: #1e293b;
    border-color: #334155;
  }

  /* ── Pagination ── */
  .kac-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .5rem;
    margin-top: 2rem;
    flex-wrap: wrap;
  }

  .kac-page-btn {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: .45rem .85rem;
    font-size: .82rem;
    color: #374151;
    cursor: pointer;
    transition: background .15s;
    min-width: 38px;
    text-align: center;
  }

  .kac-page-btn:hover:not(:disabled) {
    background: #f1f5f9;
  }

  .kac-page-btn--active {
    background: #4f46e5;
    color: #ffffff;
    border-color: #4f46e5;
  }

  .kac-page-btn--active:hover {
    background: #4338ca !important;
  }

  .kac-page-btn:disabled {
    opacity: .4;
    cursor: default;
  }

  .dark-mode .kac-page-btn {
    background: #1e293b;
    border-color: #334155;
    color: #cbd5e1;
  }

  .dark-mode .kac-page-btn:hover:not(:disabled) {
    background: #0f172a;
  }
`;

const PAGE_SIZE = 18;

export default function KidsActivityCatalog() {
  const [page,          setPage]          = useState(1);
  const [completeModal, setCompleteModal] = useState(null);
  const [filtered,      setFiltered]      = useState(null); // controlled by ActivitySearch

  const { completeActivity, isCompleted } = useKidsProgress();
  const { favoriteIds, isFavorited, toggleFavorite } = useFavorites();

  const allActivities = useMemo(() => getAllActivities(), []);

  // ActivitySearch controls filtering; fall back to full list until initialized
  const displayList  = filtered ?? allActivities;
  const totalPages   = Math.max(1, Math.ceil(displayList.length / PAGE_SIZE));
  const currentPage  = Math.min(page, totalPages);
  const pageStart    = (currentPage - 1) * PAGE_SIZE;
  const pageItems    = displayList.slice(pageStart, pageStart + PAGE_SIZE);

  // Reset to page 1 when the filtered list changes
  const handleResults = useCallback((results) => {
    setFiltered(results);
    setPage(1);
  }, []);

  const handleComplete = useCallback((act) => {
    const result = completeActivity({
      activityId: makeActivityId(act.ageGroupId, act.title),
      title:      act.title,
      ageGroup:   act.ageGroupId,
      dimension:  act.dimensionKey,
      complete:   true,
    });
    setCompleteModal(result || { starsEarned: 3, extraStars: 0, dimComplete: false });
  }, [completeActivity]);

  const dimensions   = Object.values(KIDS_ACTIVITIES_BY_DIMENSION);
  const total        = countTotalActivities();

  return (
    <>
      <style>{PAGE_STYLES}</style>
      <a href="#main-content" className="iatlas-skip">Skip to activity catalog</a>
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

      <main className="kac-page" id="main-content">
        <div className="kac-wrap">

          {/* Breadcrumb */}
          <nav className="kac-breadcrumb" aria-label="Breadcrumb">
            <a href="/iatlas">IATLAS</a>
            <span className="kac-breadcrumb-sep" aria-hidden="true">›</span>
            <Link to="/iatlas/kids">Kids Curriculum</Link>
            <span className="kac-breadcrumb-sep" aria-hidden="true">›</span>
            <span aria-current="page">Activity Catalog</span>
          </nav>

          {/* Hero */}
          <div className="kac-hero">
            <p className="kac-hero-kicker">
              <img src="/icons/movement.svg" alt="" width={14} height={14} aria-hidden="true"
                style={{ filter: 'brightness(0) invert(1)', opacity: .85 }} />
              IATLAS Kids
            </p>
            <h1 className="kac-hero-title">Activity Catalog</h1>
            <p className="kac-hero-sub">
              Browse, search, and filter all {total}+ activities. Designed for ages 5–18 across
              all six resilience dimensions.
            </p>
            <div className="kac-hero-stats" aria-label="Curriculum statistics">
              <span className="kac-hero-stat">
                <img src="/icons/movement.svg" alt="" width={13} height={13} aria-hidden="true"
                  style={{ filter: 'brightness(0) invert(1)', opacity: .8 }} />
                {total}+ activities
              </span>
              <span className="kac-hero-stat">
                <img src="/icons/kids-spark.svg" alt="" width={13} height={13} aria-hidden="true"
                  style={{ filter: 'brightness(0) invert(1)', opacity: .8 }} />
                4 age groups
              </span>
              <span className="kac-hero-stat">
                <img src="/icons/compass.svg" alt="" width={13} height={13} aria-hidden="true"
                  style={{ filter: 'brightness(0) invert(1)', opacity: .8 }} />
                6 dimensions
              </span>
            </div>
          </div>

          {/* Search & Filters (replaces previous inline filter bar) */}
          <ActivitySearch
            activities={allActivities}
            ageGroups={KIDS_AGE_GROUPS}
            dimensions={dimensions}
            activityTypes={ACTIVITY_TYPES}
            favoriteIds={favoriteIds}
            onResults={handleResults}
          />

          {/* Activity grid */}
          {pageItems.length > 0 ? (
            <div className="kac-grid" role="list" aria-label="Activities">
              {pageItems.map(act => {
                const actId = makeActivityId(act.ageGroupId, act.title);
                const done  = isCompleted(actId);
                return (
                  <div key={`${act.dimensionKey}-${act.ageGroupId}-${act.id}`} role="listitem"
                    style={{ position: 'relative' }}>
                    {/* Favorite button overlay */}
                    <div style={{ position: 'absolute', top: '.6rem', right: '.6rem', zIndex: 2 }}>
                      <FavoriteButton
                        activityId={act.id}
                        isFavorited={isFavorited(act.id)}
                        onToggle={toggleFavorite}
                        size="medium"
                      />
                    </div>
                    <KidsActivityCard
                      activity={act}
                      accentColor={act.dimensionColor}
                      onComplete={() => handleComplete(act)}
                      isCompleted={done}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="kac-empty" role="status">
              <p style={{ margin: 0, fontWeight: 600, color: '#475569' }}>No activities match your filters.</p>
              <p style={{ margin: '.5rem 0 0', fontSize: '.85rem' }}>Try adjusting your search or clearing some filters.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="kac-pagination" aria-label="Activity catalog pages">
              <button
                className="kac-page-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                aria-label="Previous page"
              >
                ←
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`kac-page-btn${p === currentPage ? ' kac-page-btn--active' : ''}`}
                  onClick={() => setPage(p)}
                  aria-label={`Page ${p}`}
                  aria-current={p === currentPage ? 'page' : undefined}
                >
                  {p}
                </button>
              ))}
              <button
                className="kac-page-btn"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                aria-label="Next page"
              >
                →
              </button>
            </nav>
          )}

        </div>
      </main>
    </>
  );
}
