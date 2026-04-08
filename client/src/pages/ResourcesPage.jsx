import React, { useState, useEffect, useCallback, useRef } from 'react';
import DarkModeHint from '../components/DarkModeHint.jsx';

// ── Branded icon maps (no generic emojis) ─────────────────────────────────────
const DIMENSION_ICONS = {
  'Cognitive-Narrative':  '/icons/cognitive-narrative.svg',
  // Uses emotional-adaptive.svg — the closest branded asset for this dimension
  'Emotional-Somatic':    '/icons/emotional-adaptive.svg',
  'Relational-Social':    '/icons/relational-connective.svg',
  'Agentic-Generative':   '/icons/agentic-generative.svg',
  'Somatic-Regulative':   '/icons/somatic-regulative.svg',
  'Spiritual-Reflective': '/icons/spiritual-reflective.svg',
};

const CATEGORY_ICONS = {
  nutrition:     '/icons/movement.svg',
  exercise:      '/icons/movement.svg',
  meditation:    '/icons/meditation.svg',
  sleep:         '/icons/sleep.svg',
  relationships: '/icons/connection.svg',
  career:        '/icons/goal.svg',
  general:       '/icons/growth.svg',
};

const TYPE_ICONS = {
  article: '/icons/story.svg',
  video:   '/icons/growth.svg',
  pdf:     '/icons/writing.svg',
  podcast: '/icons/dialogue.svg',
  quiz:    '/icons/compass.svg',
  expert:  '/icons/network.svg',
};

// ── Small helpers ─────────────────────────────────────────────────────────────
function BrandIcon({ src, alt = '', size = 16 }) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    />
  );
}

function StarRating({ rating = 0, count = 0 }) {
  const full = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <span>
      <span style={{ color: '#f59e0b' }}>{'★'.repeat(full)}</span>
      <span style={{ color: '#cbd5e1' }}>{'★'.repeat(5 - full)}</span>
      {count > 0 && <span style={{ marginLeft: '.3rem', color: '#94a3b8' }}>({count})</span>}
    </span>
  );
}

function ResourceCard({ resource, onClick }) {
  const typeIcon = TYPE_ICONS[resource.type];
  const diffClass = resource.difficulty || 'beginner';
  return (
    <article
      className="rc"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      aria-label={resource.title}
    >
      <div className="rc-thumb">
        {resource.thumbnailUrl
          ? <img src={resource.thumbnailUrl} alt="" loading="lazy" />
          : typeIcon && <BrandIcon src={typeIcon} alt={resource.type || ''} size={56} />
        }
        <span className="rc-type-badge">{resource.type || 'resource'}</span>
      </div>
      <div className="rc-body">
        {resource.category && <p className="rc-category">{resource.category}</p>}
        <h3 className="rc-title">{resource.title}</h3>
        {resource.description && <p className="rc-desc">{resource.description}</p>}
        <div className="rc-meta">
          <span className="stars">
            <StarRating rating={resource.averageRating || 0} count={resource.reviewCount || 0} />
          </span>
          {resource.difficulty && (
            <span className={`rc-difficulty ${diffClass}`}>{resource.difficulty}</span>
          )}
        </div>
        {resource.progress > 0 && (
          <div className="rc-progress-bar">
            <div className="rc-progress-fill" style={{ width: `${resource.progress}%` }} />
          </div>
        )}
      </div>
    </article>
  );
}

const PAGE_LIMIT = 12;

const styles = `

    /* ── Page layout ─────────────────────────────────────────────────────── */
    body { background: #f8fafc; }

    .rl-hero {
      background: linear-gradient(135deg, #0f2942 0%, #1a3a5c 100%);
      color: #fff;
      padding: 4rem 1.5rem 3rem;
      text-align: center;
    }
    .rl-hero h1 { color: #fff; font-size: clamp(1.8rem, 4vw, 2.8rem); margin-bottom: .75rem; }
    .rl-hero p  { color: #94a3b8; font-size: 1.05rem; max-width: 560px; margin: 0 auto 2rem; line-height: 1.65; }

    /* ── Search bar ──────────────────────────────────────────────────────── */
    .rl-search-wrap {
      display: flex;
      align-items: center;
      max-width: 520px;
      margin: 0 auto;
      background: #fff;
      border-radius: 50px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,.15);
    }
    .rl-search-wrap input {
      flex: 1;
      border: none;
      outline: none;
      padding: .75rem 1.25rem;
      font-size: 1rem;
      color: #1e293b;
    }
    .rl-search-wrap button {
      background: #4F46E5;
      color: #fff;
      border: none;
      padding: .75rem 1.5rem;
      cursor: pointer;
      font-size: .95rem;
      font-weight: 600;
      transition: background 200ms;
    }
    .rl-search-wrap button:hover { background: #4338ca; }

    /* ── Main container ──────────────────────────────────────────────────── */
    .rl-main {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 2rem;
    }
    @media (max-width: 768px) {
      .rl-main { grid-template-columns: 1fr; }
    }

    /* ── Sidebar filters ─────────────────────────────────────────────────── */
    .rl-sidebar {
      position: sticky;
      top: 1rem;
      align-self: start;
    }
    .rl-filter-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.25rem;
      margin-bottom: 1rem;
    }
    .rl-filter-card h3 {
      font-size: .8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: #64748b;
      margin-bottom: .75rem;
    }
    .rl-filter-btn {
      display: block;
      width: 100%;
      text-align: left;
      background: none;
      border: none;
      padding: .45rem .6rem;
      border-radius: 8px;
      font-size: .9rem;
      cursor: pointer;
      color: #334155;
      transition: background 150ms;
    }
    .rl-filter-btn:hover  { background: #f1f5f9; }
    .rl-filter-btn.active { background: #ede9fe; color: #4F46E5; font-weight: 600; }
    .rl-filter-count {
      float: right;
      background: #e2e8f0;
      color: #475569;
      font-size: .72rem;
      padding: .1rem .45rem;
      border-radius: 10px;
    }
    .rl-filter-btn.active .rl-filter-count { background: #c7d2fe; color: #3730a3; }

    /* ── Content area ────────────────────────────────────────────────────── */
    .rl-content-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: .75rem;
    }
    .rl-results-count { font-size: .9rem; color: #64748b; }
    .rl-sort-select {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: .4rem .75rem;
      font-size: .9rem;
      color: #334155;
      background: #fff;
      cursor: pointer;
    }

    /* ── Tab bar (type filter) ───────────────────────────────────────────── */
    .rl-tabs {
      display: flex;
      gap: .5rem;
      margin-bottom: 1.25rem;
      overflow-x: auto;
      padding-bottom: .25rem;
    }
    .rl-tab {
      padding: .45rem 1rem;
      border-radius: 20px;
      border: 1px solid #e2e8f0;
      background: #fff;
      font-size: .85rem;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: all 150ms;
      color: #475569;
    }
    .rl-tab:hover  { border-color: #a5b4fc; color: #4F46E5; }
    .rl-tab.active { background: #4F46E5; border-color: #4F46E5; color: #fff; }

    /* ── Resource grid ───────────────────────────────────────────────────── */
    .rl-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
      gap: 1.5rem;
    }

    /* ── Resource card ───────────────────────────────────────────────────── */
    .rc {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,.05);
      transition: box-shadow 200ms, transform 200ms;
      display: flex;
      flex-direction: column;
      cursor: pointer;
    }
    .rc:hover { box-shadow: 0 6px 20px rgba(0,0,0,.09); transform: translateY(-2px); }

    .rc-thumb {
      height: 140px;
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, #4F46E5, #059669);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 2.5rem;
    }
    .rc-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      position: absolute;
      inset: 0;
    }
    .rc-type-badge {
      position: absolute;
      top: .6rem;
      left: .6rem;
      background: rgba(0,0,0,.55);
      color: #fff;
      font-size: .7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .06em;
      padding: .2rem .55rem;
      border-radius: 6px;
    }
    .rc-bookmark-btn {
      position: absolute;
      top: .5rem;
      right: .5rem;
      background: rgba(255,255,255,.9);
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1rem;
      transition: background 150ms;
      color: #94a3b8;
    }
    .rc-bookmark-btn:hover   { background: #fff; color: #f59e0b; }
    .rc-bookmark-btn.saved   { color: #f59e0b; }

    .rc-body { padding: 1rem; flex: 1; display: flex; flex-direction: column; }
    .rc-category {
      font-size: .72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: #4F46E5;
      margin-bottom: .4rem;
    }
    .rc-title {
      font-size: .97rem;
      font-weight: 700;
      color: #1e293b;
      line-height: 1.35;
      margin-bottom: .4rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .rc-desc {
      font-size: .83rem;
      color: #64748b;
      line-height: 1.45;
      flex: 1;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: .75rem;
    }
    .rc-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: .78rem;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: .6rem;
      margin-top: auto;
    }
    .rc-meta .stars { color: #f59e0b; letter-spacing: -.05em; }
    .rc-difficulty {
      padding: .15rem .5rem;
      border-radius: 6px;
      font-size: .72rem;
      font-weight: 600;
    }
    .rc-difficulty.beginner     { background: #dcfce7; color: #166534; }
    .rc-difficulty.intermediate { background: #fef9c3; color: #854d0e; }
    .rc-difficulty.advanced     { background: #fee2e2; color: #991b1b; }

    .rc-progress-bar {
      height: 4px;
      background: #e2e8f0;
      border-radius: 2px;
      overflow: hidden;
      margin-top: .4rem;
    }
    .rc-progress-fill { height: 100%; background: #4F46E5; border-radius: 2px; transition: width 400ms; }

    /* ── Loading / empty states ──────────────────────────────────────────── */
    .rl-loading, .rl-empty {
      grid-column: 1/-1;
      text-align: center;
      padding: 3rem 1rem;
      color: #64748b;
    }
    .rl-loading .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #4F46E5;
      border-radius: 50%;
      animation: spin 700ms linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Pagination ──────────────────────────────────────────────────────── */
    .rl-pagination {
      display: flex;
      gap: .5rem;
      justify-content: center;
      margin-top: 2rem;
      flex-wrap: wrap;
    }
    .rl-page-btn {
      padding: .45rem .9rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #fff;
      font-size: .87rem;
      cursor: pointer;
      transition: all 150ms;
      color: #475569;
    }
    .rl-page-btn:hover   { border-color: #a5b4fc; color: #4F46E5; }
    .rl-page-btn.current { background: #4F46E5; color: #fff; border-color: #4F46E5; }
    .rl-page-btn:disabled { opacity: .45; cursor: not-allowed; }

    /* ── Modal (resource detail) ─────────────────────────────────────────── */
    .rl-modal-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.55);
      z-index: 1000;
      align-items: flex-start;
      justify-content: center;
      padding: 2rem 1rem;
      overflow-y: auto;
    }
    .rl-modal-backdrop.open { display: flex; }
    .rl-modal {
      background: #fff;
      border-radius: 18px;
      max-width: 720px;
      width: 100%;
      position: relative;
      box-shadow: 0 20px 60px rgba(0,0,0,.18);
      animation: slideUp 250ms ease;
    }
    @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: none; opacity: 1; } }
    .rl-modal-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: #f1f5f9;
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      cursor: pointer;
      color: #475569;
      z-index: 10;
    }
    .rl-modal-hero {
      height: 200px;
      background: linear-gradient(135deg, #4F46E5, #059669);
      border-radius: 18px 18px 0 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 4rem;
      color: #fff;
      position: relative;
      overflow: hidden;
    }
    .rl-modal-hero img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
    .rl-modal-body { padding: 1.75rem; }
    .rl-modal-body h2 { font-size: 1.4rem; color: #1e293b; margin-bottom: .5rem; }
    .rl-modal-meta { display: flex; gap: .75rem; flex-wrap: wrap; margin-bottom: 1rem; font-size: .82rem; color: #64748b; }
    .rl-modal-meta span { display: flex; align-items: center; gap: .3rem; }
    .rl-modal-desc { font-size: .95rem; color: #475569; line-height: 1.65; margin-bottom: 1.5rem; }
    .rl-modal-actions { display: flex; gap: .75rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
    .rl-btn {
      padding: .55rem 1.2rem;
      border-radius: 8px;
      font-size: .9rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: opacity 150ms;
    }
    .rl-btn:hover { opacity: .85; }
    .rl-btn-primary  { background: #4F46E5; color: #fff; }
    .rl-btn-outline  { background: #fff; color: #4F46E5; border: 2px solid #4F46E5; }
    .rl-btn-ghost    { background: #f1f5f9; color: #475569; }
    .rl-modal-embed  { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 12px; margin-bottom: 1.5rem; background: #000; }
    .rl-modal-embed iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }

    /* ── Reviews section ─────────────────────────────────────────────────── */
    .rl-reviews-title { font-size: 1rem; font-weight: 700; color: #1e293b; margin-bottom: .75rem; }
    .rl-review-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: .85rem;
      margin-bottom: .75rem;
    }
    .rl-review-stars { color: #f59e0b; margin-bottom: .3rem; }
    .rl-review-text  { font-size: .87rem; color: #475569; line-height: 1.5; }
    .rl-review-date  { font-size: .75rem; color: #94a3b8; margin-top: .3rem; }

    .rl-rate-widget { display: flex; gap: .25rem; margin-bottom: 1rem; }
    .rl-star-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #cbd5e1;
      transition: color 150ms, transform 100ms;
    }
    .rl-star-btn.lit   { color: #f59e0b; }
    .rl-star-btn:hover { transform: scale(1.15); }
    .rl-review-input {
      width: 100%;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: .65rem .85rem;
      font-size: .9rem;
      color: #1e293b;
      resize: vertical;
      min-height: 80px;
      box-sizing: border-box;
      margin-bottom: .75rem;
    }
    .rl-review-input:focus { outline: none; border-color: #a5b4fc; }

    /* ── Toast notification ──────────────────────────────────────────────── */
    .rl-toast {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      background: #1e293b;
      color: #fff;
      padding: .75rem 1.25rem;
      border-radius: 10px;
      font-size: .9rem;
      z-index: 2000;
      box-shadow: 0 4px 16px rgba(0,0,0,.2);
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 250ms, transform 250ms;
      pointer-events: none;
    }
    .rl-toast.show { opacity: 1; transform: none; }

    /* ── My Library tabs ─────────────────────────────────────────────────── */
    .rl-my-library {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .rl-my-library h3 { font-size: .85rem; font-weight: 700; color: #1e293b; margin-bottom: .75rem; }
    .rl-my-btn {
      display: flex;
      align-items: center;
      gap: .5rem;
      padding: .45rem .75rem;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      background: #fff;
      font-size: .85rem;
      cursor: pointer;
      color: #475569;
      transition: all 150ms;
      margin-bottom: .5rem;
      width: 100%;
    }
    .rl-my-btn:hover { border-color: #a5b4fc; color: #4F46E5; background: #f5f3ff; }
`;

export default function ResourcesPage() {
  // ── Theme ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const t = localStorage.getItem('ra-theme');
      if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
      else if (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.setAttribute('data-theme', 'dark');
    } catch(e) {}
  }, []);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [searchInput, setSearchInput]   = useState('');
  const [query,       setQuery]         = useState('');
  const [type,        setType]          = useState('');
  const [category,    setCategory]      = useState('');
  const [difficulty,  setDifficulty]    = useState('');
  const [dimension,   setDimension]     = useState('');
  const [sort,        setSort]          = useState('newest');
  const [page,        setPage]          = useState(1);

  // ── Data state ──────────────────────────────────────────────────────────────
  const [resources, setResources] = useState([]);
  const [total,     setTotal]     = useState(0);
  const [pages,     setPages]     = useState(1);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [selected,        setSelected]        = useState(null);
  const [showSubmitModal, setShowSubmitModal]  = useState(false);
  const [submitForm,      setSubmitForm]       = useState({ title: '', type: '', url: '', description: '' });
  const [submitMsg,       setSubmitMsg]        = useState('');
  const [submitLoading,   setSubmitLoading]    = useState(false);

  // ── Toast ───────────────────────────────────────────────────────────────────
  const [toastMsg,    setToastMsg]    = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 3000);
  }, []);

  // ── Fetch resources ─────────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams();
    if (query)      params.set('q',          query);
    if (type)       params.set('type',       type);
    if (category)   params.set('category',   category);
    if (difficulty) params.set('difficulty', difficulty);
    if (dimension)  params.set('dimension',  dimension);
    params.set('sort',  sort);
    params.set('page',  String(page));
    params.set('limit', String(PAGE_LIMIT));

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/resources?${params.toString()}`)
      .then(r => {
        if (!r.ok) return Promise.reject(new Error(`HTTP ${r.status}`));
        return r.json();
      })
      .then(data => {
        if (cancelled) return;
        setResources(data.resources || []);
        setTotal(data.total   || 0);
        setPages(data.pages   || 1);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Failed to load resources. Please try again.');
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [query, type, category, difficulty, dimension, sort, page, retryCount]);

  // ── Filter helpers ──────────────────────────────────────────────────────────
  const handleSearch = () => {
    setQuery(searchInput.trim());
    setPage(1);
  };

  const setFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  // ── Submit handler ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitMsg('');
    try {
      const res = await fetch('/api/resources/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitForm),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitMsg('Thank you! Your submission is under review.');
        setSubmitForm({ title: '', type: '', url: '', description: '' });
      } else {
        setSubmitMsg(data.error || 'Submission failed. Please try again.');
      }
    } catch {
      setSubmitMsg('Submission failed. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── Results label ───────────────────────────────────────────────────────────
  const resultsLabel = loading
    ? 'Loading…'
    : `${total} resource${total !== 1 ? 's' : ''} found`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <DarkModeHint />

{/* ── Hero / Search ──────────────────────────────────────────────────────── */}
<section className="rl-hero">
  <h1>
    <BrandIcon src="/icons/growth.svg" alt="" size={36} />{' '}
    Resource Library
  </h1>
  <p>Curated articles, videos, workbooks and expert guides to strengthen all six dimensions of your resilience.</p>
  <div className="rl-search-wrap">
    <input
      type="text"
      placeholder="Search resources…"
      autoComplete="off"
      value={searchInput}
      onChange={e => setSearchInput(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && handleSearch()}
    />
    <button onClick={handleSearch}>Search</button>
  </div>
</section>

{/* ── Main layout ────────────────────────────────────────────────────────── */}
<div className="rl-main">

  {/* Sidebar */}
  <aside className="rl-sidebar">

    {/* Categories */}
    <div className="rl-filter-card">
      <h3>Category</h3>
      {[
        { value: '',              label: 'All Categories' },
        { value: 'nutrition',     label: 'Nutrition',     icon: CATEGORY_ICONS.nutrition     },
        { value: 'exercise',      label: 'Exercise',      icon: CATEGORY_ICONS.exercise      },
        { value: 'meditation',    label: 'Meditation',    icon: CATEGORY_ICONS.meditation    },
        { value: 'sleep',         label: 'Sleep',         icon: CATEGORY_ICONS.sleep         },
        { value: 'relationships', label: 'Relationships', icon: CATEGORY_ICONS.relationships },
        { value: 'career',        label: 'Career',        icon: CATEGORY_ICONS.career        },
        { value: 'general',       label: 'General',       icon: CATEGORY_ICONS.general       },
      ].map(({ value, label, icon }) => (
        <button
          key={value}
          className={`rl-filter-btn${category === value ? ' active' : ''}`}
          onClick={() => setFilter(setCategory)(value)}
        >
          {icon && <BrandIcon src={icon} size={14} />}{' '}{label}
        </button>
      ))}
    </div>

    {/* Difficulty */}
    <div className="rl-filter-card">
      <h3>Difficulty</h3>
      {[
        { value: '',             label: 'Any Level'    },
        { value: 'beginner',     label: 'Beginner',     icon: '/icons/growth.svg'   },
        { value: 'intermediate', label: 'Intermediate', icon: '/icons/strength.svg' },
        { value: 'advanced',     label: 'Advanced',     icon: '/icons/goal.svg'     },
      ].map(({ value, label, icon }) => (
        <button
          key={value}
          className={`rl-filter-btn${difficulty === value ? ' active' : ''}`}
          onClick={() => setFilter(setDifficulty)(value)}
        >
          {icon && <BrandIcon src={icon} size={14} />}{' '}{label}
        </button>
      ))}
    </div>

    {/* Dimensions */}
    <div className="rl-filter-card">
      <h3>Dimension</h3>
      {[
        { value: '',                      label: 'All Dimensions' },
        { value: 'Cognitive-Narrative',   label: 'Cognitive',  icon: DIMENSION_ICONS['Cognitive-Narrative']  },
        { value: 'Emotional-Somatic',     label: 'Emotional',  icon: DIMENSION_ICONS['Emotional-Somatic']    },
        { value: 'Relational-Social',     label: 'Relational', icon: DIMENSION_ICONS['Relational-Social']    },
        { value: 'Agentic-Generative',    label: 'Agentic',    icon: DIMENSION_ICONS['Agentic-Generative']   },
        { value: 'Somatic-Regulative',    label: 'Somatic',    icon: DIMENSION_ICONS['Somatic-Regulative']   },
        { value: 'Spiritual-Reflective',  label: 'Spiritual',  icon: DIMENSION_ICONS['Spiritual-Reflective'] },
      ].map(({ value, label, icon }) => (
        <button
          key={value}
          className={`rl-filter-btn${dimension === value ? ' active' : ''}`}
          onClick={() => setFilter(setDimension)(value)}
        >
          {icon && <BrandIcon src={icon} size={14} />}{' '}{label}
        </button>
      ))}
    </div>

    {/* Utility links */}
    <div style={{ textAlign: 'center', marginTop: '.5rem' }}>
      <a href="/api/resources/rss" target="_blank" rel="noopener noreferrer" aria-label="RSS Feed (opens in new tab)" style={{ fontSize: '.8rem', color: '#64748b', textDecoration: 'none' }}>
        <BrandIcon src="/icons/network.svg" size={12} /> RSS Feed
      </a>
      &nbsp;·&nbsp;
      <button
        onClick={() => { setSubmitMsg(''); setShowSubmitModal(true); }}
        style={{ fontSize: '.8rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <BrandIcon src="/icons/goal.svg" size={12} /> Submit a resource
      </button>
    </div>
  </aside>

  {/* Content area */}
  <div className="rl-content">

    {/* Type tabs */}
    <div className="rl-tabs">
      {[
        { value: '',        label: 'All Types' },
        { value: 'article', label: 'Articles',  icon: TYPE_ICONS.article },
        { value: 'video',   label: 'Videos',    icon: TYPE_ICONS.video   },
        { value: 'pdf',     label: 'Workbooks', icon: TYPE_ICONS.pdf     },
        { value: 'podcast', label: 'Podcasts',  icon: TYPE_ICONS.podcast },
        { value: 'quiz',    label: 'Quizzes',   icon: TYPE_ICONS.quiz    },
        { value: 'expert',  label: 'Experts',   icon: TYPE_ICONS.expert  },
      ].map(({ value, label, icon }) => (
        <button
          key={value}
          className={`rl-tab${type === value ? ' active' : ''}`}
          onClick={() => setFilter(setType)(value)}
        >
          {icon && <BrandIcon src={icon} size={14} />}{' '}{label}
        </button>
      ))}
    </div>

    {/* Header */}
    <div className="rl-content-header">
      <p className="rl-results-count">{resultsLabel}</p>
      <select
        className="rl-sort-select"
        value={sort}
        onChange={e => { setSort(e.target.value); setPage(1); }}
      >
        <option value="newest">Newest first</option>
        <option value="popular">Most popular</option>
        <option value="rated">Top rated</option>
        <option value="shortest">Quickest to complete</option>
      </select>
    </div>

    {/* Grid */}
    <div className="rl-grid">
      {loading ? (
        <div className="rl-loading">
          <div className="spinner"></div>
          <p>Loading resources…</p>
        </div>
      ) : error ? (
        <div className="rl-empty">
          <BrandIcon src="/icons/strength.svg" size={40} />
          <p style={{ marginTop: '.75rem' }}>{error}</p>
          <button
            className="rl-btn rl-btn-outline"
            style={{ marginTop: '1rem' }}
            onClick={() => setRetryCount(c => c + 1)}
          >
            Try again
          </button>
        </div>
      ) : resources.length === 0 ? (
        <div className="rl-empty">
          <BrandIcon src="/icons/compass.svg" size={40} />
          <p style={{ marginTop: '.75rem' }}>No resources found matching your filters.</p>
          <button
            className="rl-btn rl-btn-outline"
            style={{ marginTop: '1rem' }}
            onClick={() => {
              setQuery(''); setSearchInput('');
              setType(''); setCategory('');
              setDifficulty(''); setDimension('');
              setSort('newest'); setPage(1);
            }}
          >
            Clear all filters
          </button>
        </div>
      ) : (
        resources.map(r => (
          <ResourceCard key={r._id} resource={r} onClick={() => setSelected(r)} />
        ))
      )}
    </div>

    {/* Pagination */}
    {!loading && !error && pages > 1 && (
      <div className="rl-pagination">
        <button
          className="rl-page-btn"
          disabled={page <= 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
        >
          Prev
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            className={`rl-page-btn${p === page ? ' current' : ''}`}
            onClick={() => setPage(p)}
          >
            {p}
          </button>
        ))}
        <button
          className="rl-page-btn"
          disabled={page >= pages}
          onClick={() => setPage(p => Math.min(pages, p + 1))}
        >
          Next
        </button>
      </div>
    )}
  </div>
</div>

{/* ── Resource detail modal ──────────────────────────────────────────────── */}
{selected && (
  <div
    className="rl-modal-backdrop open"
    onClick={e => e.target === e.currentTarget && setSelected(null)}
  >
    <div className="rl-modal" role="dialog" aria-modal="true" aria-labelledby="rlModalTitle">
      <button className="rl-modal-close" onClick={() => setSelected(null)} aria-label="Close">✕</button>
      <div className="rl-modal-hero">
        {selected.thumbnailUrl
          ? <img src={selected.thumbnailUrl} alt="" />
          : <BrandIcon src={TYPE_ICONS[selected.type] || '/icons/growth.svg'} alt="" size={80} />
        }
      </div>
      <div className="rl-modal-body">
        <h2 id="rlModalTitle">{selected.title}</h2>
        <div className="rl-modal-meta">
          {selected.type     && <span>{selected.type}</span>}
          {selected.category && <span>{selected.category}</span>}
          {selected.difficulty && <span>{selected.difficulty}</span>}
          {selected.averageRating > 0 && (
            <span><StarRating rating={selected.averageRating} count={selected.reviewCount} /></span>
          )}
          {selected.dimensions && selected.dimensions.length > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
              {selected.dimensions.slice(0, 2).map(d => (
                DIMENSION_ICONS[d]
                  ? <BrandIcon key={d} src={DIMENSION_ICONS[d]} size={16} alt={d} />
                  : <span key={d}>{d}</span>
              ))}
            </span>
          )}
        </div>
        <div className="rl-modal-actions">
          {selected.url && (
            <a
              href={selected.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rl-btn rl-btn-primary"
            >
              Open Resource
            </a>
          )}
          <button className="rl-btn rl-btn-ghost" onClick={() => setSelected(null)}>Close</button>
        </div>
        {selected.description && (
          <p className="rl-modal-desc">{selected.description}</p>
        )}
      </div>
    </div>
  </div>
)}

{/* ── Community submit modal ─────────────────────────────────────────────── */}
{showSubmitModal && (
  <div
    className="rl-modal-backdrop open"
    onClick={e => e.target === e.currentTarget && setShowSubmitModal(false)}
  >
    <div className="rl-modal" style={{ maxWidth: '520px' }} role="dialog" aria-modal="true" aria-labelledby="rlSubmitTitle">
      <button className="rl-modal-close" onClick={() => setShowSubmitModal(false)} aria-label="Close">✕</button>
      <div className="rl-modal-body" style={{ padding: '2rem' }}>
        <h2 id="rlSubmitTitle" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <BrandIcon src="/icons/goal.svg" size={24} /> Submit a Resource
        </h2>
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: '.5rem', fontSize: '.85rem', fontWeight: 600, color: '#374151' }}>Title *</label>
          <input
            type="text"
            required
            maxLength={200}
            value={submitForm.title}
            onChange={e => setSubmitForm(f => ({ ...f, title: e.target.value }))}
            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '.6rem .85rem', fontSize: '.9rem', boxSizing: 'border-box', marginBottom: '1rem' }}
          />

          <label style={{ display: 'block', marginBottom: '.5rem', fontSize: '.85rem', fontWeight: 600, color: '#374151' }}>Type *</label>
          <select
            required
            value={submitForm.type}
            onChange={e => setSubmitForm(f => ({ ...f, type: e.target.value }))}
            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '.6rem .85rem', fontSize: '.9rem', boxSizing: 'border-box', marginBottom: '1rem' }}
          >
            <option value="">Select type…</option>
            <option value="article">Article</option>
            <option value="video">Video</option>
            <option value="pdf">PDF / Workbook</option>
            <option value="podcast">Podcast</option>
            <option value="quiz">Quiz</option>
            <option value="expert">Expert Profile</option>
          </select>

          <label style={{ display: 'block', marginBottom: '.5rem', fontSize: '.85rem', fontWeight: 600, color: '#374151' }}>URL</label>
          <input
            type="url"
            value={submitForm.url}
            onChange={e => setSubmitForm(f => ({ ...f, url: e.target.value }))}
            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '.6rem .85rem', fontSize: '.9rem', boxSizing: 'border-box', marginBottom: '1rem' }}
          />

          <label style={{ display: 'block', marginBottom: '.5rem', fontSize: '.85rem', fontWeight: 600, color: '#374151' }}>Short description</label>
          <textarea
            maxLength={500}
            rows={3}
            value={submitForm.description}
            onChange={e => setSubmitForm(f => ({ ...f, description: e.target.value }))}
            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '.6rem .85rem', fontSize: '.9rem', boxSizing: 'border-box', resize: 'vertical', marginBottom: '1.25rem' }}
          />

          <button
            type="submit"
            className="rl-btn rl-btn-primary"
            style={{ width: '100%' }}
            disabled={submitLoading}
          >
            {submitLoading ? 'Submitting…' : 'Submit for Review'}
          </button>
        </form>
        {submitMsg && (
          <p style={{ marginTop: '.75rem', fontSize: '.87rem', color: '#059669' }}>{submitMsg}</p>
        )}
      </div>
    </div>
  </div>
)}

{/* ── Toast ──────────────────────────────────────────────────────────────── */}
<div className={`rl-toast${toastVisible ? ' show' : ''}`}>{toastMsg}</div>

    </>
  );
}
