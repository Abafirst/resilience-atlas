/**
 * BadgeGallery.jsx (Kids version)
 * Displays all kids badges grouped by category, showing earned vs locked state.
 */

import React, { useState } from 'react';
import { AGE_GROUP_LABELS } from '../../../data/kidsGamification.js';

const STYLES = `
  .kbg-root {}

  .kbg-category {
    margin-bottom: 2rem;
  }

  .kbg-category-title {
    font-size: .8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: #64748b;
    margin: 0 0 .75rem;
    display: flex;
    align-items: center;
    gap: .4rem;
  }

  .dark-mode .kbg-category-title {
    color: #94a3b8;
  }

  .kbg-category-count {
    background: #f1f5f9;
    border-radius: 20px;
    padding: .1rem .45rem;
    font-size: .72rem;
    color: #64748b;
    font-weight: 600;
  }

  .dark-mode .kbg-category-count {
    background: #1e293b;
    color: #94a3b8;
  }

  .kbg-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: .6rem;
  }

  .kbg-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: .35rem;
    padding: .75rem .4rem .6rem;
    border-radius: 12px;
    border: 1.5px solid;
    cursor: default;
    transition: transform .15s, box-shadow .15s;
    text-align: center;
    position: relative;
  }

  .kbg-badge.kbg-earned:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0,0,0,.1);
  }

  .kbg-badge.kbg-locked {
    opacity: .45;
    filter: grayscale(0.6);
  }

  .kbg-badge-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .kbg-badge-icon {
    width: 26px;
    height: 26px;
  }

  .kbg-badge-name {
    font-size: .7rem;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.25;
    word-break: break-word;
  }

  .dark-mode .kbg-badge-name {
    color: #f1f5f9;
  }

  .kbg-badge-date {
    font-size: .62rem;
    color: #64748b;
    margin-top: .1rem;
  }

  .dark-mode .kbg-badge-date {
    color: #94a3b8;
  }

  .kbg-lock-icon {
    position: absolute;
    top: .35rem;
    right: .35rem;
    width: 13px;
    height: 13px;
    opacity: .5;
  }

  .kbg-filter-bar {
    display: flex;
    gap: .5rem;
    flex-wrap: wrap;
    margin-bottom: 1.25rem;
  }

  .kbg-filter-btn {
    background: #f1f5f9;
    border: 1.5px solid #e2e8f0;
    border-radius: 20px;
    padding: .3rem .8rem;
    font-size: .78rem;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
    transition: background .15s, border-color .15s, color .15s;
  }

  .kbg-filter-btn:hover,
  .kbg-filter-btn.kbg-active {
    background: #eef2ff;
    border-color: #a5b4fc;
    color: #4338ca;
  }

  .dark-mode .kbg-filter-btn {
    background: #1e293b;
    border-color: #334155;
    color: #94a3b8;
  }

  .dark-mode .kbg-filter-btn:hover,
  .dark-mode .kbg-filter-btn.kbg-active {
    background: #1e2a40;
    border-color: #4f46e5;
    color: #818cf8;
  }
`;

const CATEGORY_LABELS = {
  dimension: 'Dimension Badges',
  milestone: 'Milestone Badges',
  character: 'Character Badges',
};

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

/**
 * BadgeGallery (Kids)
 *
 * Props:
 *   allBadges   {Array}   from getAllKidsBadgesWithStatus()
 *   onBadgeClick {fn}     optional click handler
 */
export default function BadgeGallery({ allBadges = [], onBadgeClick }) {
  const [filter, setFilter] = useState('all');

  const grouped = {};
  for (const badge of allBadges) {
    const cat = badge.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(badge);
  }

  const categories = ['dimension', 'milestone', 'character'].filter(c => grouped[c]?.length);
  const totalEarned = allBadges.filter(b => b.earned).length;

  const filters = [
    { id: 'all',       label: 'All' },
    { id: 'earned',    label: 'Earned' },
    { id: 'locked',    label: 'Locked' },
    { id: 'dimension', label: 'Dimension' },
    { id: 'milestone', label: 'Milestone' },
    { id: 'character', label: 'Character' },
  ];

  const filteredGrouped = {};
  for (const cat of categories) {
    const badges = (grouped[cat] || []).filter(badge => {
      if (filter === 'earned')    return badge.earned;
      if (filter === 'locked')    return !badge.earned;
      if (filter === 'all')       return true;
      return badge.category === filter;
    });
    if (badges.length > 0) filteredGrouped[cat] = badges;
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="kbg-root">
        {/* Summary */}
        <p style={{ fontSize: '.85rem', color: '#64748b', marginBottom: '.75rem' }}>
          {totalEarned} of {allBadges.length} badges earned
        </p>

        {/* Filter bar */}
        <div className="kbg-filter-bar" role="group" aria-label="Filter badges">
          {filters.map(f => (
            <button
              key={f.id}
              className={`kbg-filter-btn${filter === f.id ? ' kbg-active' : ''}`}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Badge groups */}
        {Object.entries(filteredGrouped).map(([cat, badges]) => {
          const earnedInCat = badges.filter(b => b.earned).length;
          return (
            <div key={cat} className="kbg-category">
              <p className="kbg-category-title">
                {CATEGORY_LABELS[cat] || cat}
                <span className="kbg-category-count">{earnedInCat}/{badges.length}</span>
              </p>
              <div className="kbg-grid">
                {badges.map(badge => (
                  <button
                    key={badge.id}
                    className={`kbg-badge ${badge.earned ? 'kbg-earned' : 'kbg-locked'}`}
                    style={{
                      background:   badge.color  || '#f8fafc',
                      borderColor:  badge.earned ? (badge.border || '#a5b4fc') : '#e2e8f0',
                    }}
                    onClick={() => onBadgeClick && onBadgeClick(badge)}
                    aria-label={`${badge.name}${badge.earned ? ` — earned ${formatDate(badge.earnedAt)}` : ' — locked'}`}
                    aria-pressed={undefined}
                  >
                    {!badge.earned && (
                      <img
                        src="/icons/lock.svg"
                        alt="Locked"
                        className="kbg-lock-icon"
                        aria-hidden="true"
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <div
                      className="kbg-badge-icon-wrap"
                      style={{ background: badge.earned ? (badge.border || '#6366f1') + '22' : '#f1f5f9' }}
                    >
                      <img
                        src={badge.icon}
                        alt=""
                        aria-hidden="true"
                        className="kbg-badge-icon"
                      />
                    </div>
                    <span className="kbg-badge-name">{badge.name}</span>
                    {badge.earned && badge.earnedAt && (
                      <span className="kbg-badge-date">{formatDate(badge.earnedAt)}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {Object.keys(filteredGrouped).length === 0 && (
          <p style={{ color: '#64748b', fontSize: '.85rem', textAlign: 'center', padding: '2rem 0' }}>
            No badges match this filter yet.
          </p>
        )}
      </div>
    </>
  );
}
