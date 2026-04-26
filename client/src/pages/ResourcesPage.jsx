import React, { useState, useEffect, useCallback, useRef } from 'react';
import SiteHeader from '../components/SiteHeader.jsx';
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
  podcast: '/icons/dialog.svg',
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
      data-type={resource.type || 'resource'}
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

export default function ResourcesPage() {
  // ── Theme ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.title = 'Resource Library — The Resilience Atlas™';
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

    let canceled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/resources?${params.toString()}`)
      .then(r => {
        if (!r.ok) return Promise.reject(new Error(`HTTP ${r.status}`));
        return r.json();
      })
      .then(data => {
        if (canceled) return;
        setResources(data.resources || []);
        setTotal(data.total   || 0);
        setPages(data.pages   || 1);
        setLoading(false);
      })
      .catch(() => {
        if (canceled) return;
        setError('Failed to load resources. Please try again.');
        setLoading(false);
      });

    return () => { canceled = true; };
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
    <div className="rl-page">
      <SiteHeader activePage="resources" />
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
  <div className="rl-suggestions">
    <span className="rl-suggestions-label">Popular:</span>
    {['Sleep', 'Stress', 'Beginner', '10 min', 'Relationships'].map(chip => (
      <button
        key={chip}
        className="rl-suggestion-chip"
        onClick={() => { setSearchInput(chip); setQuery(chip); setPage(1); }}
      >
        {chip}
      </button>
    ))}
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

    </div>
  );
}
