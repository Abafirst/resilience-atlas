import React, { useState, useMemo } from 'react';
import { TEAMS_CONTENT } from '../data/teamsContent';

/* TODO: add tier-gating logic */

const DIMENSION_COLORS = {
  connection: { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8' },
  thinking:   { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' },
  action:     { bg: '#fff7ed', border: '#f97316', text: '#c2410c' },
  feeling:    { bg: '#fdf4ff', border: '#a855f7', text: '#7e22ce' },
  hope:       { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
  meaning:    { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
};

const DIFFICULTY_LABELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
const DIFFICULTY_COLORS = { beginner: '#16a34a', intermediate: '#d97706', advanced: '#dc2626' };

function dimColor(dimension, part) {
  return (DIMENSION_COLORS[dimension] || { bg: '#f8fafc', border: '#94a3b8', text: '#475569' })[part];
}

function ActivityCard({ act }) {
  const [open, setOpen] = useState(false);
  const border = dimColor(act.dimension, 'border');
  const bg     = dimColor(act.dimension, 'bg');
  const text   = dimColor(act.dimension, 'text');
  const diffColor = DIFFICULTY_COLORS[act.difficulty] || '#64748b';
  const diffLabel = DIFFICULTY_LABELS[act.difficulty] || act.difficulty;

  return (
    <article
      className="ta-card"
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderLeft: `4px solid ${border}`,
        borderRadius: 12,
        padding: '1.5rem',
        boxShadow: '0 1px 4px rgba(0,0,0,.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '.75rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.4rem' }}>
        <span
          className="ta-badge"
          style={{ background: bg, color: text, borderColor: border, fontSize: '.75rem', fontWeight: 700, padding: '.2rem .7rem', borderRadius: 999, border: '1px solid', textTransform: 'uppercase', letterSpacing: '.04em' }}
        >
          {act.dimensionLabel}
        </span>
        <span style={{ fontSize: '.78rem', fontWeight: 600, color: diffColor }}>{diffLabel}</span>
      </div>

      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{act.title}</h3>
      <p style={{ fontSize: '.9rem', color: '#475569', lineHeight: 1.55, margin: 0 }}>{act.objective}</p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '.83rem', color: '#64748b' }}>⏱ {act.duration}</span>
        <span style={{ fontSize: '.83rem', color: '#64748b' }}>👥 {(act.teamSize || []).join(', ')}</span>
      </div>

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{ background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 8, padding: '.55rem 1.1rem', fontSize: '.88rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.4rem', alignSelf: 'flex-start', marginTop: '.25rem' }}
      >
        {open ? 'Hide Details' : 'View Details'} <span aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div style={{ marginTop: '.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '.9rem', color: '#334155', lineHeight: 1.6 }}>
            <strong style={{ display: 'block', color: '#0f172a', fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.35rem' }}>Instructions:</strong>
            <p style={{ margin: 0 }}>{act.instructions}</p>
          </div>

          {act.materials && act.materials.length > 0 && (
            <div style={{ fontSize: '.9rem', color: '#334155', lineHeight: 1.6 }}>
              <strong style={{ display: 'block', color: '#0f172a', fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.35rem' }}>Materials Needed:</strong>
              <ul style={{ margin: '.35rem 0 0 1.2rem', padding: 0 }}>
                {act.materials.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          )}

          {act.facilitationTips && act.facilitationTips.length > 0 && (
            <div style={{ fontSize: '.9rem', color: '#334155', lineHeight: 1.6 }}>
              <strong style={{ display: 'block', color: '#0f172a', fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.35rem' }}>Facilitation Tips:</strong>
              <ul style={{ margin: '.35rem 0 0 1.2rem', padding: 0 }}>
                {act.facilitationTips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}

          {act.reflectionPrompts && act.reflectionPrompts.length > 0 && (
            <div style={{ fontSize: '.9rem', color: '#334155', lineHeight: 1.6 }}>
              <strong style={{ display: 'block', color: '#0f172a', fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.35rem' }}>Reflection Prompts:</strong>
              <ol style={{ margin: '.35rem 0 0 1.2rem', padding: 0 }}>
                {act.reflectionPrompts.map((p, i) => <li key={i}>{p}</li>)}
              </ol>
            </div>
          )}

          {act.variations && act.variations.length > 0 && (
            <div style={{ fontSize: '.9rem', color: '#334155', lineHeight: 1.6 }}>
              <strong style={{ display: 'block', color: '#0f172a', fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.35rem' }}>Variations:</strong>
              <ul style={{ margin: '.35rem 0 0 1.2rem', padding: 0 }}>
                {act.variations.map((v, i) => (
                  <li key={i}><em>{v.size}:</em> {v.note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function TeamsActivitiesPage() {
  const [dimension, setDimension]   = useState('all');
  const [teamSize, setTeamSize]     = useState('all');
  const [duration, setDuration]     = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [search, setSearch]         = useState('');

  const filtered = useMemo(
    () => (TEAMS_CONTENT.activities || []).filter(act => {
      if (dimension !== 'all' && act.dimension !== dimension) return false;
      if (teamSize !== 'all' && !(act.teamSize || []).includes(teamSize)) return false;
      if (duration !== 'all' && act.durationCategory !== duration) return false;
      if (difficulty !== 'all' && act.difficulty !== difficulty) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !act.title.toLowerCase().includes(q) &&
          !act.objective.toLowerCase().includes(q) &&
          !(act.dimensionLabel || '').toLowerCase().includes(q)
        ) return false;
      }
      return true;
    }),
    [dimension, teamSize, duration, difficulty, search]
  );

  function clearFilters() {
    setDimension('all');
    setTeamSize('all');
    setDuration('all');
    setDifficulty('all');
    setSearch('');
  }

  const filterSelectStyle = {
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    padding: '.5rem .75rem',
    fontSize: '.9rem',
    background: '#f8fafc',
    color: '#1e293b',
    outline: 'none',
    fontFamily: 'inherit',
  };

  const filterLabelStyle = {
    fontSize: '.8rem',
    fontWeight: 600,
    color: '#475569',
    display: 'flex',
    flexDirection: 'column',
    gap: '.25rem',
    flex: 1,
    minWidth: 130,
  };

  return (
    <>
      {/* Hero */}
      <section
        aria-label="Page hero"
        style={{
          background: 'linear-gradient(135deg, #0f2942 0%, #1a3a5c 50%, #1e3a8a 100%)',
          color: '#fff',
          padding: '4.5rem 1.5rem 3.5rem',
          textAlign: 'center',
        }}
      >
        <span style={{ color: '#818cf8', fontSize: '.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', display: 'block', marginBottom: '.6rem' }}>
          Teams Resource Library
        </span>
        <h1 style={{ color: '#fff', fontSize: 'clamp(1.8rem,4vw,2.6rem)', marginBottom: '.6rem' }}>
          Team-Building Activities
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: 580, margin: '0 auto 1.5rem', lineHeight: 1.65 }}>
          Evidence-informed activities across all six resilience dimensions — designed for real teams in real workplaces.
        </p>
        <nav
          role="navigation"
          aria-label="Team resources navigation"
          style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}
        >
          {[
            { href: '/teams/activities', label: '🎯 Activities', active: true },
            { href: '/teams/resources', label: '📥 Handouts & Visuals' },
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
        role="search"
        aria-label="Filter activities"
        style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '1.25rem 1.5rem', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ ...filterLabelStyle, flex: 2, minWidth: 200 }}>
            Search
            <input
              type="search"
              placeholder="Search activities…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search activities"
              style={filterSelectStyle}
            />
          </label>
          <label style={filterLabelStyle}>
            Dimension
            <select value={dimension} onChange={e => setDimension(e.target.value)} aria-label="Filter by dimension" style={filterSelectStyle}>
              <option value="all">All Dimensions</option>
              <option value="connection">🤝 Connection</option>
              <option value="thinking">🧠 Thinking</option>
              <option value="action">⚡ Action</option>
              <option value="feeling">💙 Feeling</option>
              <option value="hope">🌟 Hope</option>
              <option value="meaning">✨ Meaning</option>
            </select>
          </label>
          <label style={filterLabelStyle}>
            Team Size
            <select value={teamSize} onChange={e => setTeamSize(e.target.value)} aria-label="Filter by team size" style={filterSelectStyle}>
              <option value="all">Any Size</option>
              <option value="5-10">5–10 people</option>
              <option value="10-30">10–30 people</option>
              <option value="30-50">30–50 people</option>
            </select>
          </label>
          <label style={filterLabelStyle}>
            Duration
            <select value={duration} onChange={e => setDuration(e.target.value)} aria-label="Filter by duration" style={filterSelectStyle}>
              <option value="all">Any Duration</option>
              <option value="short">Short (≤25 min)</option>
              <option value="medium">Medium (26–39 min)</option>
              <option value="long">Long (40+ min)</option>
            </select>
          </label>
          <label style={filterLabelStyle}>
            Difficulty
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} aria-label="Filter by difficulty" style={filterSelectStyle}>
              <option value="all">Any Difficulty</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <span style={{ fontSize: '.85rem', color: '#64748b', alignSelf: 'flex-end', whiteSpace: 'nowrap' }}>
            {filtered.length} activit{filtered.length !== 1 ? 'ies' : 'y'}
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
      <main id="main-content" style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#334155', marginBottom: '.5rem' }}>No activities found</h3>
            <p>Try adjusting your filters or clearing the search to see all activities.</p>
            <button
              type="button"
              onClick={clearFilters}
              style={{ marginTop: '1rem', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 8, padding: '.65rem 1.5rem', fontSize: '.95rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div
            aria-live="polite"
            aria-label="Activity list"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}
          >
            {filtered.map(act => <ActivityCard key={act.id} act={act} />)}
          </div>
        )}
      </main>
    </>
  );
}
