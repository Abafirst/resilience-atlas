import React, { useState, useMemo } from 'react';
import { TEAMS_CONTENT } from '../data/teamsContent';

/* ── Tier badge colors ───────────────────────────────────────────────────── */
const TIER_BADGE = {
  starter:    { bg: '#dbeafe', color: '#1d4ed8', label: 'Starter' },
  pro:        { bg: '#ede9fe', color: '#6d28d9', label: 'Pro' },
  enterprise: { bg: '#fce7f3', color: '#be185d', label: 'Enterprise' },
};

/* ── Gating modal ────────────────────────────────────────────────────────── */
function TierGateModal({ item, onClose }) {
  const tier = TIER_BADGE[item.minTier] || TIER_BADGE.pro;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-modal-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(15,23,42,.55)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, padding: '2.5rem 2rem',
        maxWidth: 460, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,.18)',
        position: 'relative',
      }}>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 16,
            background: 'none', border: 'none', fontSize: '1.4rem',
            color: '#94a3b8', cursor: 'pointer', lineHeight: 1,
          }}
        >×</button>

        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '2.5rem' }}>🔒</span>
        </div>

        <h2
          id="gate-modal-title"
          style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', textAlign: 'center', marginBottom: '.5rem' }}
        >
          {item.minTierLabel || 'Teams Tier'} Required
        </h2>

        <p style={{ color: '#475569', fontSize: '.95rem', textAlign: 'center', lineHeight: 1.65, marginBottom: '1rem' }}>
          <strong>{item.title}</strong> is available on the{' '}
          <span style={{ color: tier.color, fontWeight: 700 }}>{item.minTierLabel || 'Teams Pro'}</span>{' '}
          plan and above. Unlock this resource and the full library by upgrading your Teams tier.
        </p>

        <div style={{
          background: '#f8fafc', borderRadius: 10, padding: '.85rem 1rem',
          fontSize: '.85rem', color: '#334155', marginBottom: '1.25rem',
          border: '1px solid #e2e8f0',
        }}>
          <strong>Included in {item.minTierLabel}:</strong>
          {item.minTier === 'starter' && (
            <ul style={{ margin: '.4rem 0 0', paddingLeft: '1.25rem', lineHeight: 1.7 }}>
              <li>Basic discussion prompts &amp; reference cards</li>
              <li>Team dashboard &amp; radar chart</li>
              <li>CSV &amp; PDF export</li>
            </ul>
          )}
          {item.minTier === 'pro' && (
            <ul style={{ margin: '.4rem 0 0', paddingLeft: '1.25rem', lineHeight: 1.7 }}>
              <li>6 pre-built workshop guides</li>
              <li>Full facilitation resource library</li>
              <li>Dynamic discussion prompts, templates &amp; activity cards</li>
              <li>Dimension heatmap &amp; trend analysis</li>
            </ul>
          )}
          {item.minTier === 'enterprise' && (
            <ul style={{ margin: '.4rem 0 0', paddingLeft: '1.25rem', lineHeight: 1.7 }}>
              <li>All Pro features</li>
              <li>Custom branding (logo + colors)</li>
              <li>SSO / SAML, self-service data export</li>
              <li>Branded PDF reports</li>
            </ul>
          )}
        </div>

        <div style={{ display: 'flex', gap: '.75rem', flexDirection: 'column' }}>
          <a
            href="/pricing-teams"
            aria-label="Compare Teams tiers and unlock access"
            style={{
              display: 'block', textAlign: 'center',
              background: 'linear-gradient(135deg,#4F46E5,#7c3aed)',
              color: '#fff', borderRadius: 10, padding: '.75rem 1.5rem',
              fontWeight: 700, fontSize: '1rem', textDecoration: 'none',
            }}
          >
            <span aria-hidden="true">🚀</span> Compare &amp; Unlock Tiers
          </a>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid #cbd5e1', borderRadius: 10,
              padding: '.65rem 1.5rem', fontSize: '.95rem', color: '#64748b',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

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

function ResourceCard({ item, isVisual, onGate }) {
  const color = TYPE_COLORS[item.type] || '#64748b';
  const typeLabel = item.typeLabel || TYPE_LABELS[item.type] || item.type;
  const fallbackIcon = isVisual ? '/icons/compass.svg' : '/icons/checkmark.svg';
  const tierBadge = item.minTier ? TIER_BADGE[item.minTier] : null;

  return (
    <div className="tr-card">
      <div className="tr-card__icon" aria-hidden="true">
        {item.icon && item.icon.startsWith('/icons/') ? (
          <img src={item.icon} alt="" className="icon icon-md" />
        ) : (
          <img src={fallbackIcon} alt="" className="icon icon-md" />
        )}
      </div>
      <div className="tr-card__body">
        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '.25rem' }}>
          <span
            className="tr-card__type-badge"
            style={{ background: `${color}20`, color, borderColor: color }}
          >
            {typeLabel}
          </span>
          {tierBadge && (
            <span
              title={`Requires ${item.minTierLabel}`}
              aria-label={`Requires ${item.minTierLabel}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '.25rem',
                fontSize: '.7rem', fontWeight: 700, padding: '.15rem .55rem',
                borderRadius: 999, border: `1px solid ${tierBadge.color}40`,
                background: tierBadge.bg, color: tierBadge.color,
                textTransform: 'uppercase', letterSpacing: '.04em',
              }}
            >
              <span aria-hidden="true">🔒</span> {tierBadge.label}
            </span>
          )}
        </div>
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
        <button
          type="button"
          className="tr-card__download-btn"
          aria-label={`Unlock download of ${item.title} — requires ${item.minTierLabel || 'a Teams tier'}`}
          onClick={() => onGate(item)}
          style={{ cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <span aria-hidden="true">🔒</span> Unlock Download
        </button>
      </div>
    </div>
  );
}

export default function TeamsResourcesPage() {
  const [category, setCategory] = useState('all');
  const [dimension, setDimension] = useState('all');
  const [search, setSearch] = useState('');
  const [gateItem, setGateItem] = useState(null);

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
            { href: '/teams/activities', label: 'Activities' },
            { href: '/teams/resources', label: 'Handouts & Visuals', active: true },
            { href: '/teams/facilitation', label: 'Facilitation Guide' },
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
              <option value="connection">Connection (Relational)</option>
              <option value="thinking">Thinking (Cognitive)</option>
              <option value="action">Action (Agentic)</option>
              <option value="feeling">Feeling (Emotional)</option>
              <option value="hope">Hope (Spiritual)</option>
              <option value="meaning">Meaning (Somatic)</option>
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
                    <ResourceCard key={item.id} item={item} isVisual={false} onGate={setGateItem} />
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
                  <img src="/icons/compass.svg" alt="" aria-hidden="true" className="icon icon-sm" />
                  Visual Resources
                  <span style={{ fontSize: '.85rem', fontWeight: 400, color: '#64748b', marginLeft: 'auto' }}>Infographics, posters, reference cards</span>
                </h2>
                <div
                  className="tr-grid"
                  aria-live="polite"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}
                >
                  {visuals.map(item => (
                    <ResourceCard key={item.id} item={item} isVisual onGate={setGateItem} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {gateItem && <TierGateModal item={gateItem} onClose={() => setGateItem(null)} />}
    </>
  );
}
