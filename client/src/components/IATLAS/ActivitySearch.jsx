/**
 * ActivitySearch.jsx
 * Comprehensive search and filtering system for IATLAS activities.
 *
 * Features:
 *   - Keyword search (title, learningGoal, dimension name, type)
 *   - Age group filter
 *   - Dimension filter
 *   - Difficulty filter
 *   - Activity type filter
 *   - Favorites-only toggle
 *   - Sort (relevance, a-z, duration-asc, duration-desc)
 *   - Active filter chips with individual & clear-all removal
 *   - URL state persistence via useSearchParams
 *   - Result count display
 *
 * Props:
 *   activities        {Array}   – Full flat activity list (from getAllActivities())
 *   ageGroups         {Array}   – KIDS_AGE_GROUPS array
 *   dimensions        {Array}   – Dimension objects from KIDS_ACTIVITIES_BY_DIMENSION
 *   activityTypes     {Object}  – ACTIVITY_TYPES map
 *   favoriteIds       {string[]}– Array of favorited activityIds
 *   onResults         {fn}      – Called with filtered+sorted activity array
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

// ── Constants ─────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'relevance',     label: 'Relevance' },
  { value: 'a-z',           label: 'A–Z' },
  { value: 'duration-asc',  label: 'Duration (shortest first)' },
  { value: 'duration-desc', label: 'Duration (longest first)' },
];

const DIFFICULTY_OPTIONS = ['beginner', 'intermediate', 'advanced'];

// ── Duration helpers ──────────────────────────────────────────────────────────

/**
 * Parse a duration string like "10 min", "15 min", "5 min/day", "30 days"
 * into a numeric minute value for sorting.  Returns 0 if unparseable.
 */
function parseDurationMinutes(duration) {
  if (!duration) return 0;
  const s = String(duration).toLowerCase();
  // "N min" or "N min/day" or "N min setup"
  const minMatch = s.match(/(\d+)\s*min/);
  if (minMatch) return parseInt(minMatch[1], 10);
  // "N days" → approximate as N * 30 min
  const dayMatch = s.match(/(\d+)\s*day/);
  if (dayMatch) return parseInt(dayMatch[1], 10) * 30;
  return 0;
}

// ── Filter logic ──────────────────────────────────────────────────────────────

function applyFilters(activities, {
  query,
  ageFilter,
  dimFilter,
  diffFilter,
  typeFilter,
  favFilter,
  favoriteIds,
}) {
  let results = activities;

  // Keyword search across title, learningGoal, dimensionTitle, kidsName, type
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(act =>
      act.title.toLowerCase().includes(q) ||
      (act.learningGoal || '').toLowerCase().includes(q) ||
      (act.dimensionTitle || '').toLowerCase().includes(q) ||
      (act.kidsName || '').toLowerCase().includes(q) ||
      (act.type || '').toLowerCase().includes(q) ||
      (act.materials || []).some(m => m.toLowerCase().includes(q))
    );
  }

  if (ageFilter  !== 'all') results = results.filter(a => a.ageGroupId    === ageFilter);
  if (dimFilter  !== 'all') results = results.filter(a => a.dimensionKey  === dimFilter);
  if (diffFilter !== 'all') results = results.filter(a => a.difficulty    === diffFilter);
  if (typeFilter !== 'all') results = results.filter(a => a.type          === typeFilter);

  if (favFilter) {
    results = results.filter(a => favoriteIds.includes(a.id));
  }

  return results;
}

function applySorting(results, sortBy) {
  const arr = [...results];
  if (sortBy === 'a-z') {
    arr.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === 'duration-asc') {
    arr.sort((a, b) => parseDurationMinutes(a.duration) - parseDurationMinutes(b.duration));
  } else if (sortBy === 'duration-desc') {
    arr.sort((a, b) => parseDurationMinutes(b.duration) - parseDurationMinutes(a.duration));
  }
  // 'relevance' keeps original order
  return arr;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const SEARCH_STYLES = `
  .as-wrap {
    margin-bottom: 1rem;
  }

  /* ── Top bar: search + sort ── */
  .as-top-bar {
    display: flex;
    gap: .75rem;
    flex-wrap: wrap;
    align-items: flex-end;
    margin-bottom: .75rem;
  }

  .as-search-group {
    position: relative;
    flex: 2 1 260px;
  }

  .as-search-icon {
    position: absolute;
    left: .65rem;
    top: 50%;
    transform: translateY(-50%);
    width: 14px;
    height: 14px;
    opacity: .45;
    pointer-events: none;
  }

  .as-search-input {
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

  .as-search-input:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79,70,229,.1);
  }

  .dark-mode .as-search-input {
    background: #0f172a;
    border-color: #334155;
    color: #f1f5f9;
  }

  .dark-mode .as-search-input:focus {
    border-color: #6366f1;
  }

  /* ── Sort ── */
  .as-sort-group {
    display: flex;
    flex-direction: column;
    gap: .3rem;
    flex: 1 1 160px;
  }

  .as-label {
    font-size: .72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: #64748b;
  }

  .dark-mode .as-label { color: #94a3b8; }

  .as-select {
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

  .as-select:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79,70,229,.1);
  }

  .dark-mode .as-select {
    background: #0f172a;
    border-color: #334155;
    color: #f1f5f9;
  }

  /* ── Filter row ── */
  .as-filter-row {
    display: flex;
    gap: .75rem;
    flex-wrap: wrap;
    align-items: flex-end;
    margin-bottom: .75rem;
  }

  .as-filter-group {
    display: flex;
    flex-direction: column;
    gap: .3rem;
    flex: 1 1 140px;
  }

  /* ── Favorites toggle ── */
  .as-fav-btn {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    padding: .45rem .9rem;
    border-radius: 8px;
    font-size: .82rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    color: #64748b;
    transition: background .15s, border-color .15s, color .15s;
    align-self: flex-end;
    white-space: nowrap;
  }

  .as-fav-btn--active {
    background: #fef2f2;
    border-color: #fca5a5;
    color: #dc2626;
  }

  .dark-mode .as-fav-btn {
    background: #1e293b;
    border-color: #334155;
    color: #94a3b8;
  }

  .dark-mode .as-fav-btn--active {
    background: #3f1515;
    border-color: #991b1b;
    color: #fca5a5;
  }

  /* ── Active filter chips ── */
  .as-chips {
    display: flex;
    flex-wrap: wrap;
    gap: .4rem;
    margin-bottom: .5rem;
    align-items: center;
  }

  .as-chip {
    display: inline-flex;
    align-items: center;
    gap: .3rem;
    padding: .2rem .6rem .2rem .7rem;
    background: #eef2ff;
    border: 1px solid #c7d2fe;
    border-radius: 20px;
    font-size: .75rem;
    font-weight: 600;
    color: #4338ca;
    cursor: pointer;
    transition: background .12s;
  }

  .as-chip:hover { background: #e0e7ff; }

  .dark-mode .as-chip {
    background: #1e2a4a;
    border-color: #3730a3;
    color: #a5b4fc;
  }

  .as-chip-x {
    font-size: .9rem;
    line-height: 1;
    opacity: .7;
  }

  .as-clear-all {
    font-size: .75rem;
    color: #64748b;
    background: none;
    border: none;
    cursor: pointer;
    padding: .15rem .4rem;
    border-radius: 4px;
    text-decoration: underline;
  }

  .as-clear-all:hover { color: #1e293b; }
  .dark-mode .as-clear-all { color: #94a3b8; }
  .dark-mode .as-clear-all:hover { color: #e2e8f0; }

  /* ── Results count ── */
  .as-count {
    font-size: .84rem;
    color: #64748b;
    margin-bottom: .75rem;
  }

  .dark-mode .as-count { color: #94a3b8; }
`;

// ── Component ─────────────────────────────────────────────────────────────────

export default function ActivitySearch({
  activities   = [],
  ageGroups    = [],
  dimensions   = [],
  activityTypes = {},
  favoriteIds  = [],
  onResults,
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filter state from URL params
  const [query,      setQuery]      = useState(searchParams.get('search') || '');
  const [ageFilter,  setAgeFilter]  = useState(searchParams.get('age')   || 'all');
  const [dimFilter,  setDimFilter]  = useState(searchParams.get('dim')   || 'all');
  const [diffFilter, setDiffFilter] = useState(searchParams.get('diff')  || 'all');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type')  || 'all');
  const [sortBy,     setSortBy]     = useState(searchParams.get('sort')  || 'relevance');
  const [favFilter,  setFavFilter]  = useState(searchParams.get('favs') === 'true');

  // Debounce ref for search URL update
  const debounceRef = useRef(null);

  // Clean up debounce timer on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // ── URL sync ───────────────────────────────────────────────────────────────

  const updateURL = useCallback((updates) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === 'all' || value === 'relevance' || value === 'false' || value === false) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      return params;
    }, { replace: true });
  }, [setSearchParams]);

  // ── Filtered + sorted results ──────────────────────────────────────────────

  const results = useMemo(() => {
    const filtered = applyFilters(activities, {
      query,
      ageFilter,
      dimFilter,
      diffFilter,
      typeFilter,
      favFilter,
      favoriteIds,
    });
    return applySorting(filtered, sortBy);
  }, [activities, query, ageFilter, dimFilter, diffFilter, typeFilter, favFilter, favoriteIds, sortBy]);

  // Notify parent
  useEffect(() => {
    if (onResults) onResults(results);
  }, [results, onResults]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleSearch(e) {
    const val = e.target.value;
    setQuery(val);
    // Debounce URL update
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateURL({ search: val });
    }, 300);
  }

  function handleAge(e)  { setAgeFilter(e.target.value);  updateURL({ age: e.target.value }); }
  function handleDim(e)  { setDimFilter(e.target.value);  updateURL({ dim: e.target.value }); }
  function handleDiff(e) { setDiffFilter(e.target.value); updateURL({ diff: e.target.value }); }
  function handleType(e) { setTypeFilter(e.target.value); updateURL({ type: e.target.value }); }
  function handleSort(e) { setSortBy(e.target.value);     updateURL({ sort: e.target.value }); }

  function handleFavToggle() {
    const next = !favFilter;
    setFavFilter(next);
    updateURL({ favs: next ? 'true' : 'false' });
  }

  function removeFilter(key) {
    const setters = {
      search: () => { setQuery('');         updateURL({ search: '' }); },
      age:    () => { setAgeFilter('all');  updateURL({ age: 'all' }); },
      dim:    () => { setDimFilter('all');  updateURL({ dim: 'all' }); },
      diff:   () => { setDiffFilter('all'); updateURL({ diff: 'all' }); },
      type:   () => { setTypeFilter('all'); updateURL({ type: 'all' }); },
      favs:   () => { setFavFilter(false);  updateURL({ favs: 'false' }); },
    };
    setters[key]?.();
  }

  function clearAll() {
    setQuery('');
    setAgeFilter('all');
    setDimFilter('all');
    setDiffFilter('all');
    setTypeFilter('all');
    setSortBy('relevance');
    setFavFilter(false);
    setSearchParams({}, { replace: true });
  }

  // ── Active chips ───────────────────────────────────────────────────────────

  const chips = [];
  if (query)              chips.push({ key: 'search', label: `"${query}"` });
  if (ageFilter  !== 'all') {
    const ag = ageGroups.find(a => a.id === ageFilter);
    chips.push({ key: 'age', label: ag ? ag.label : ageFilter });
  }
  if (dimFilter  !== 'all') {
    const dim = dimensions.find(d => d.dimensionKey === dimFilter);
    chips.push({ key: 'dim', label: dim ? dim.kidsName : dimFilter });
  }
  if (diffFilter !== 'all') chips.push({ key: 'diff', label: diffFilter });
  if (typeFilter !== 'all') {
    const tp = activityTypes[typeFilter];
    chips.push({ key: 'type', label: tp ? tp.label : typeFilter });
  }
  if (favFilter)            chips.push({ key: 'favs', label: 'Favorites only' });

  const hasFilters = chips.length > 0;

  return (
    <>
      <style>{SEARCH_STYLES}</style>
      <div className="as-wrap" role="search" aria-label="Search and filter activities">

        {/* Top bar: search + sort */}
        <div className="as-top-bar">
          {/* Search */}
          <div className="as-search-group">
            <svg className="as-search-icon" aria-hidden="true" viewBox="0 0 20 20" fill="none">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.75"/>
              <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
            <input
              id="as-search"
              type="search"
              className="as-search-input"
              placeholder="Search by title, goal, dimension, materials…"
              value={query}
              onChange={handleSearch}
              aria-label="Search activities"
            />
          </div>

          {/* Sort */}
          <div className="as-sort-group">
            <label className="as-label" htmlFor="as-sort">Sort</label>
            <select
              id="as-sort"
              className="as-select"
              value={sortBy}
              onChange={handleSort}
              aria-label="Sort activities"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter row */}
        <div className="as-filter-row">
          {/* Age group */}
          <div className="as-filter-group">
            <label className="as-label" htmlFor="as-age">Age Group</label>
            <select id="as-age" className="as-select" value={ageFilter} onChange={handleAge} aria-label="Filter by age group">
              <option value="all">All ages</option>
              {ageGroups.map(ag => (
                <option key={ag.id} value={ag.id}>{ag.label}</option>
              ))}
            </select>
          </div>

          {/* Dimension */}
          <div className="as-filter-group">
            <label className="as-label" htmlFor="as-dim">Dimension</label>
            <select id="as-dim" className="as-select" value={dimFilter} onChange={handleDim} aria-label="Filter by dimension">
              <option value="all">All dimensions</option>
              {dimensions.map(dim => (
                <option key={dim.dimensionKey} value={dim.dimensionKey}>{dim.kidsName}</option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div className="as-filter-group">
            <label className="as-label" htmlFor="as-diff">Difficulty</label>
            <select id="as-diff" className="as-select" value={diffFilter} onChange={handleDiff} aria-label="Filter by difficulty">
              <option value="all">All levels</option>
              {DIFFICULTY_OPTIONS.map(d => (
                <option key={d} value={d} style={{ textTransform: 'capitalize' }}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Activity type */}
          <div className="as-filter-group">
            <label className="as-label" htmlFor="as-type">Type</label>
            <select id="as-type" className="as-select" value={typeFilter} onChange={handleType} aria-label="Filter by type">
              <option value="all">All types</option>
              {Object.entries(activityTypes).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>

          {/* Favorites toggle */}
          <button
            type="button"
            className={`as-fav-btn${favFilter ? ' as-fav-btn--active' : ''}`}
            onClick={handleFavToggle}
            aria-pressed={favFilter}
            aria-label={favFilter ? 'Showing favorites only — click to show all' : 'Show favorites only'}
          >
            <img src="/icons/connection.svg" alt="" aria-hidden="true" className="icon icon-sm" /> Favorites
          </button>
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="as-chips" role="list" aria-label="Active filters">
            {chips.map(chip => (
              <button
                key={chip.key}
                type="button"
                className="as-chip"
                role="listitem"
                onClick={() => removeFilter(chip.key)}
                aria-label={`Remove filter: ${chip.label}`}
              >
                {chip.label}
                <span className="as-chip-x" aria-hidden="true">✕</span>
              </button>
            ))}
            <button type="button" className="as-clear-all" onClick={clearAll} aria-label="Clear all filters">
              Clear all
            </button>
          </div>
        )}

        {/* Result count */}
        <p className="as-count" aria-live="polite" aria-atomic="true">
          {results.length === activities.length
            ? `Showing all ${activities.length} activities`
            : `${results.length} of ${activities.length} activities`
          }
        </p>

      </div>
    </>
  );
}
