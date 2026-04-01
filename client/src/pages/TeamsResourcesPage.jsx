import React, { useState, useMemo } from 'react';
import { TEAMS_CONTENT } from '../data/teamsContent';

/* TODO: add tier-gating logic */

const TYPE_LABELS = {
  'workshop-guide': 'Workshop Guide',
  'template': 'Template',
  'prompt-sheet': 'Discussion Prompts',
  'activity-cards': 'Activity Cards',
  'facilitation': 'Facilitation Resources',
  'dimension-card': 'Reference Cards',
  'infographic': 'Infographic',
  'timeline': 'Planning Timeline',
  'pathway': 'Development Map',
  'matrix': 'Decision Matrix',
  'poster': 'Workshop Poster',
  'reference-card': 'Quick Reference',
  'culture-poster': 'Culture Poster',
};

const TYPE_COLORS = {
  'workshop-guide': '#3b82f6',
  'template': '#22c55e',
  'prompt-sheet': '#a855f7',
  'activity-cards': '#f59e0b',
  'facilitation': '#ef4444',
  'dimension-card': '#06b6d4',
  'infographic': '#8b5cf6',
  'timeline': '#f97316',
  'pathway': '#14b8a6',
  'matrix': '#64748b',
  'poster': '#ec4899',
  'reference-card': '#0ea5e9',
  'culture-poster': '#ec4899',
};

function ResourceCard({ item, isVisual }) {
  const color = TYPE_COLORS[item.type] || '#64748b';
  const typeLabel = item.typeLabel || TYPE_LABELS[item.type] || item.type;

  return (
    <div className="tr-card">
      <div className="tr-card__icon" aria-hidden="true">{item.icon || (isVisual ? '🖼️' : '📄')}</div>
      <div className="tr-card__body">
        <span
          className="tr-card__type-badge"
          style={{ background: `${color}20`, color, borderColor: color }}
        >
          {typeLabel}
        </span>
        <h3 className="tr-card__title">{item.title}</h3>
        <p className="tr-card__desc">{item.description}</p>
        <div className="tr-card__meta">
          {item.dimensionLabel && (
            <span className="tr-card__meta-item">🔷 {item.dimensionLabel}</span>
          )}
          {isVisual && item.printSize && (
            <span className="tr-card__meta-item">📐 {item.printSize}</span>
          )}
          {!isVisual && item.pages && (
            <span className="tr-card__meta-item">📄 {item.pages} pages</span>
          )}
          <span className="tr-card__meta-item">📁 {item.format || 'PDF'}</span>
        </div>
        <a
          href="#"
          className="tr-card__download-btn"
          aria-label={`Download ${item.title}`}
          onClick={e => e.preventDefault()}
        >
          ⬇ Download
        </a>
      </div>
    </div>
  );
}

export default function TeamsResourcesPage() {
  const [category, setCategory] = useState('all');
  const [dimension, setDimension] = useState('all');
  const [search, setSearch] = useState('');

  const handouts = useMemo(
    () => (TEAMS_CONTENT.handouts || []).filter(item => {
      if (category !== 'all' && item.type !== category) return false;
      if (dimension !== 'all' && item.dimension !== dimension && item.dimension !== 'all') return false;
      if (search) {
        const q = search.toLowerCase();
        if (!item.title.toLowerCase().includes(q) && !item.description.toLowerCase().includes(q)) return false;
      }
      return true;
    }),
    [category, dimension, search]
  );
  const visuals = useMemo(
    () => (TEAMS_CONTENT.visuals || []).filter(item => {
      if (category !== 'all' && item.type !== category) return false;
      if (dimension !== 'all' && item.dimension !== dimension && item.dimension !== 'all') return false;
      if (search) {
        const q = search.toLowerCase();
        if (!item.title.toLowerCase().includes(q) && !item.description.toLowerCase().includes(q)) return false;
      }
      return true;
    }),
    [category, dimension, search]
  );

  const total = handouts.length + visuals.length;

  function clearFilters() {
    setCategory('all');
    setDimension('all');
    setSearch('');
  }

  return (
    <>
      <section
        className="tr-hero"
        aria-label="Page hero"
        style={{
          background: 'linear-gradient(135deg, #0f2942 0%, #1a3a5c 50%, #1e3a8a 100%)',
          color: '#fff',
          padding: '4.5rem 1.5rem 3.5rem',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            color: '#818cf8',
            fontSize: '.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '.1em',
            display: 'block',
            marginBottom: '.6rem',
          }}
        >
          Teams Resource Library
        </span>
        <h1 style={{ color: '#fff', fontSize: 'clamp(1.8rem,4vw,2.6rem)', marginBottom: '.6rem' }}>
          Handouts &amp; Visual Resources
        </h1>
        <p
          style={{
            color: '#94a3b8',
            fontSize: '1.05rem',
            maxWidth: 580,
            margin: '0 auto 1.5rem',
            lineHeight: 1.65,
          }}
        >
          Workshop guides, activity cards, templates, posters, and infographics — everything you
          need to run great team resilience sessions.
        </p>
        <nav
          className="tr-hero__nav"
          role="navigation"
          aria-label="Team resources navigation"
          style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}
        >
          {[
            { href: '/teams/activities', label: '🎯 Activities' },
            { href: '/teams/resources', label: '📥 Handouts & Visuals', active: true },
            { href: '/teams/facilitation', label: '📋 Facilitation Guide' },
            { href: '/team', label: '← Team Home' },
          ].map(({ href, label, active }) => (
            <a
              key={href}
              href={href}
              style={{
                background: active ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.12)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,.2)',
                borderRadius: 8,
                padding: '.5rem 1.1rem',
                fontSize: '.9rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              {label}
            </a>
          ))}
        </nav>
      </section>

      {/* Filters */}
      <div
        className="tr-filters"
        role="search"
        aria-label="Filter resources"
        style={{
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          padding: '1.25rem 1.5rem',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 2px 8px rgba(0,0,0,.06)',
        }}
      >
        <div
          className="tr-filters__inner"
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#475569', display: 'flex', flexDirection: 'column', gap: '.25rem', flex: 1, minWidth: 160 }}>
            Search
            <input
              type="search"
              placeholder="Search resources…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search resources"
              style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '.5rem .75rem', fontSize: '.9rem', background: '#f8fafc', color: '#1e293b', outline: 'none', fontFamily: 'inherit' }}
            />
          </label>
          <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#475569', display: 'flex', flexDirection: 'column', gap: '.25rem', flex: 1, minWidth: 160 }}>
            Category
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              aria-label="Filter by category"
              style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '.5rem .75rem', fontSize: '.9rem', background: '#f8fafc', color: '#1e293b', outline: 'none', fontFamily: 'inherit' }}
            >
              <option value="all">All Types</option>
              <optgroup label="Handouts">
                <option value="workshop-guide">Workshop Guides</option>
                <option value="template">Templates</option>
                <option value="prompt-sheet">Discussion Prompts</option>
                <option value="activity-cards">Activity Cards</option>
                <option value="facilitation">Facilitation Resources</option>
              </optgroup>
              <optgroup label="Visual Resources">
                <option value="dimension-card">Dimension Cards</option>
                <option value="infographic">Infographics</option>
                <option value="timeline">Planning Timelines</option>
                <option value="pathway">Development Maps</option>
                <option value="matrix">Decision Matrices</option>
                <option value="poster">Workshop Posters</option>
                <option value="reference-card">Quick Reference Cards</option>
              </optgroup>
            </select>
          </label>
          <label style={{ fontSize: '.8rem', fontWeight: 600, color: '#475569', display: 'flex', flexDirection: 'column', gap: '.25rem', flex: 1, minWidth: 160 }}>
            Dimension
            <select
              value={dimension}
              onChange={e => setDimension(e.target.value)}
              aria-label="Filter by dimension"
              style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '.5rem .75rem', fontSize: '.9rem', background: '#f8fafc', color: '#1e293b', outline: 'none', fontFamily: 'inherit' }}
            >
              <option value="all">All Dimensions</option>
              <option value="connection">🤝 Connection</option>
              <option value="thinking">🧠 Thinking</option>
              <option value="action">⚡ Action</option>
              <option value="feeling">💙 Feeling</option>
              <option value="hope">🌟 Hope</option>
              <option value="meaning">✨ Meaning</option>
            </select>
          </label>
          <span style={{ fontSize: '.85rem', color: '#64748b', alignSelf: 'flex-end', whiteSpace: 'nowrap' }}>
            {total} resource{total !== 1 ? 's' : ''}
          </span>
          <button
            type="button"
            onClick={clearFilters}
            style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: 8, padding: '.5rem 1rem', fontSize: '.85rem', color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap', alignSelf: 'flex-end' }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Main content */}
      <main
        id="main-content"
        style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}
      >
        {total === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#334155', marginBottom: '.5rem' }}>No resources found</h3>
            <p>Try adjusting your filters or clearing the search to see all resources.</p>
            <button
              type="button"
              onClick={clearFilters}
              style={{ marginTop: '1rem', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 8, padding: '.65rem 1.5rem', fontSize: '.95rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            {handouts.length > 0 && (
              <section style={{ marginBottom: '3rem' }} aria-labelledby="handouts-heading">
                <h2
                  id="handouts-heading"
                  style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', paddingBottom: '.6rem', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '.6rem' }}
                >
                  📄 Handouts &amp; Templates
                  <span style={{ fontSize: '.85rem', fontWeight: 400, color: '#64748b', marginLeft: 'auto' }}>Workshop guides, templates, cards</span>
                </h2>
                <div
                  className="tr-grid"
                  aria-live="polite"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}
                >
                  {handouts.map(item => (
                    <ResourceCard key={item.id} item={item} isVisual={false} />
                  ))}
                </div>
              </section>
            )}

            {visuals.length > 0 && (
              <section style={{ marginBottom: '3rem' }} aria-labelledby="visuals-heading">
                <h2
                  id="visuals-heading"
                  style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', paddingBottom: '.6rem', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '.6rem' }}
                >
                  🖼️ Visual Resources
                  <span style={{ fontSize: '.85rem', fontWeight: 400, color: '#64748b', marginLeft: 'auto' }}>Infographics, posters, reference cards</span>
                </h2>
                <div
                  className="tr-grid"
                  aria-live="polite"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}
                >
                  {visuals.map(item => (
                    <ResourceCard key={item.id} item={item} isVisual />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
