/**
 * BadgeGallery.jsx
 * Badge collection display with filtering capabilities.
 */

import React, { useState, useMemo } from 'react';
import BadgeCard from './BadgeCard.jsx';

const RARITIES = ['legendary', 'epic', 'rare', 'uncommon', 'common'];

const STYLES = `
  .bg-root {
    font-family: inherit;
  }

  .bg-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .bg-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1e293b;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .bg-count {
    font-size: 0.82rem;
    color: #64748b;
    background: #f1f5f9;
    padding: 3px 10px;
    border-radius: 999px;
    font-weight: 600;
  }

  .bg-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 14px;
    align-items: center;
  }

  .bg-filter-btn {
    padding: 4px 12px;
    border-radius: 999px;
    border: 1px solid #cbd5e1;
    background: #fff;
    color: #475569;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
    line-height: 1.5;
  }

  .bg-filter-btn:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
  }

  .bg-filter-btn.bg-active {
    background: #4f46e5;
    border-color: #4f46e5;
    color: #fff;
  }

  .bg-filter-sep {
    width: 1px;
    height: 20px;
    background: #e2e8f0;
    margin: 0 2px;
  }

  .bg-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: flex-start;
  }

  .bg-empty {
    padding: 24px;
    text-align: center;
    color: #94a3b8;
    font-size: 0.9rem;
  }

  /* Dark mode */
  .dark-mode .bg-title { color: #f1f5f9; }
  .dark-mode .bg-count { background: #334155; color: #94a3b8; }
  .dark-mode .bg-filter-btn {
    background: #1e293b;
    border-color: #334155;
    color: #94a3b8;
  }
  .dark-mode .bg-filter-btn:hover {
    background: #334155;
    border-color: #475569;
  }
  .dark-mode .bg-filter-btn.bg-active {
    background: #4f46e5;
    border-color: #4f46e5;
    color: #fff;
  }
  .dark-mode .bg-filter-sep { background: #334155; }

  @media (max-width: 640px) {
    .bg-filters { gap: 4px; }
    .bg-filter-btn { font-size: 0.7rem; padding: 3px 8px; }
    .bg-grid { gap: 7px; }
  }
`;

const ALL_FILTER = 'all';
const EARNED_FILTER = 'earned';

export default function BadgeGallery({ allBadges = [], onBadgeClick }) {
  const [filter, setFilter] = useState(ALL_FILTER);
  const [rarityFilter, setRarityFilter] = useState(null);

  const earnedCount = useMemo(() => allBadges.filter(b => b.earned).length, [allBadges]);

  const dimensions = useMemo(() => {
    const dims = new Set(allBadges.map(b => b.dimension).filter(Boolean));
    return [...dims];
  }, [allBadges]);

  const filtered = useMemo(() => {
    let list = allBadges;
    if (filter === EARNED_FILTER) list = list.filter(b => b.earned);
    else if (filter !== ALL_FILTER) list = list.filter(b => b.dimension === filter);
    if (rarityFilter) list = list.filter(b => b.rarity === rarityFilter);
    return list;
  }, [allBadges, filter, rarityFilter]);

  function toggleRarity(r) {
    setRarityFilter(prev => (prev === r ? null : r));
  }

  return (
    <div className="bg-root">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="bg-header">
        <span className="bg-title">
          <img src="/icons/badges.svg" alt="" width={16} height={16} aria-hidden="true" />
          Badge Collection
        </span>
        <span className="bg-count">{earnedCount} / {allBadges.length} Earned</span>
      </div>

      <div className="bg-filters">
        <button
          className={`bg-filter-btn${filter === ALL_FILTER ? ' bg-active' : ''}`}
          onClick={() => setFilter(ALL_FILTER)}
        >
          All
        </button>
        <button
          className={`bg-filter-btn${filter === EARNED_FILTER ? ' bg-active' : ''}`}
          onClick={() => setFilter(EARNED_FILTER)}
        >
          Earned
        </button>

        {dimensions.length > 0 && (
          <>
            <div className="bg-filter-sep" />
            {dimensions.map(dim => (
              <button
                key={dim}
                className={`bg-filter-btn${filter === dim ? ' bg-active' : ''}`}
                onClick={() => setFilter(dim)}
              >
                {dim.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </button>
            ))}
          </>
        )}

        <div className="bg-filter-sep" />
        {RARITIES.map(r => (
          <button
            key={r}
            className={`bg-filter-btn${rarityFilter === r ? ' bg-active' : ''}`}
            onClick={() => toggleRarity(r)}
            style={rarityFilter === r ? undefined : { textTransform: 'capitalize' }}
          >
            {r}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-empty">No badges match this filter.</div>
      ) : (
        <div className="bg-grid" role="list" aria-label="Badge collection">
          {filtered.map(badge => (
            <div key={badge.id} role="listitem">
              <BadgeCard
                badge={badge}
                onClick={onBadgeClick}
                showDetails
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
