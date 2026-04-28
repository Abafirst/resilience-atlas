/**
 * CaregiverLearningPage.jsx
 * Caregiver Learning curriculum — 15 structured parent guides organised
 * by the six IATLAS resilience dimensions.
 *
 * Route: /iatlas/caregiver-learning
 * Access: Family tier ($39.99/mo) and above via hasCaregiverAccess()
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';
import {
  CAREGIVER_GUIDES,
  CAREGIVER_GUIDE_DIMENSIONS,
  getCaregiverGuidesByDimension,
  isGuideRead,
} from '../data/iatlas/caregiverGuides.js';
import { hasCaregiverAccess } from '../utils/iatlasGating.js';
import IATLASUnlockModal from '../components/IATLAS/IATLASUnlockModal.jsx';
import CaregiverGuideViewer from '../components/IATLAS/CaregiverGuideViewer.jsx';

const DIMENSION_COLORS = {
  'agentic-generative':    '#6366f1',
  'somatic-regulative':    '#10b981',
  'cognitive-narrative':   '#f59e0b',
  'relational-connective': '#ec4899',
  'emotional-adaptive':    '#f97316',
  'spiritual-existential': '#8b5cf6',
  'cross-cutting':         '#0ea5e9',
};

const DIMENSION_ICONS = {
  'agentic-generative':    '/icons/agentic-generative.svg',
  'somatic-regulative':    '/icons/somatic-regulative.svg',
  'cognitive-narrative':   '/icons/cognitive-narrative.svg',
  'relational-connective': '/icons/relational-connective.svg',
  'emotional-adaptive':    '/icons/emotional-adaptive.svg',
  'spiritual-existential': '/icons/spiritual-reflective.svg',
  'cross-cutting':         '/icons/compass.svg',
};

const PAGE_STYLES = `
  .clp-page {
    background: #f8fafc;
    min-height: 100vh;
    padding-bottom: 4rem;
  }

  .dark-mode .clp-page {
    background: #0f172a;
  }

  .clp-wrap {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 1.25rem;
  }

  /* ── Breadcrumb ── */
  .clp-breadcrumb {
    padding: 1.25rem 0 .5rem;
    font-size: .8rem;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: .4rem;
    flex-wrap: wrap;
  }

  .clp-breadcrumb a {
    color: #6366f1;
    text-decoration: none;
    font-weight: 600;
  }

  .clp-breadcrumb a:hover {
    text-decoration: underline;
  }

  /* ── Hero ── */
  .clp-hero {
    background: linear-gradient(135deg, #0891b2 0%, #0e7490 55%, #155e75 100%);
    border-radius: 20px;
    padding: 2rem 1.75rem;
    margin: 1rem 0 1.75rem;
    color: #ffffff;
  }

  .clp-hero-label {
    font-size: .72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .08em;
    opacity: .8;
    margin: 0 0 .4rem;
  }

  .clp-hero-title {
    font-size: 1.8rem;
    font-weight: 900;
    margin: 0 0 .5rem;
    line-height: 1.1;
  }

  .clp-hero-desc {
    font-size: .95rem;
    opacity: .9;
    margin: 0 0 1.25rem;
    max-width: 600px;
  }

  .clp-hero-stats {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .clp-hero-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .clp-hero-stat-value {
    font-size: 1.6rem;
    font-weight: 900;
    line-height: 1;
  }

  .clp-hero-stat-label {
    font-size: .72rem;
    opacity: .8;
    margin-top: .2rem;
  }

  /* ── Dimension filter ── */
  .clp-filter-row {
    display: flex;
    gap: .5rem;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
  }

  .clp-filter-btn {
    border: 1.5px solid #e2e8f0;
    background: #ffffff;
    border-radius: 20px;
    padding: .4rem .85rem;
    font-size: .8rem;
    font-weight: 600;
    cursor: pointer;
    transition: background .15s, color .15s, border-color .15s;
    color: #475569;
    font-family: inherit;
  }

  .dark-mode .clp-filter-btn {
    background: #1e293b;
    border-color: #334155;
    color: #94a3b8;
  }

  .clp-filter-btn.active {
    background: #0891b2;
    border-color: #0891b2;
    color: #ffffff;
  }

  .clp-filter-btn:hover:not(.active) {
    background: #f1f5f9;
    border-color: #0891b2;
  }

  .dark-mode .clp-filter-btn:hover:not(.active) {
    background: #334155;
  }

  /* ── Guide grid ── */
  .clp-guides-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }

  /* ── Guide card ── */
  .clp-guide-card {
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: 16px;
    overflow: hidden;
    transition: box-shadow .15s, transform .15s;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    text-align: left;
    font-family: inherit;
    width: 100%;
  }

  .dark-mode .clp-guide-card {
    background: #1e293b;
    border-color: #334155;
  }

  .clp-guide-card:hover {
    box-shadow: 0 6px 24px rgba(0,0,0,.12);
    transform: translateY(-3px);
  }

  .clp-guide-card.locked {
    opacity: .7;
    cursor: pointer;
  }

  .clp-card-top {
    height: 6px;
  }

  .clp-card-body {
    padding: 1rem 1.1rem;
    display: flex;
    flex-direction: column;
    gap: .45rem;
    flex: 1;
  }

  .clp-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: .5rem;
  }

  .clp-card-title {
    font-size: .95rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    line-height: 1.25;
  }

  .dark-mode .clp-card-title {
    color: #f1f5f9;
  }

  .clp-card-read-badge {
    font-size: .68rem;
    font-weight: 700;
    color: #15803d;
    background: #dcfce7;
    border-radius: 20px;
    padding: .2rem .6rem;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .clp-card-dim-badge {
    display: inline-flex;
    align-items: center;
    gap: .3rem;
    font-size: .68rem;
    font-weight: 700;
    border-radius: 20px;
    padding: .15rem .5rem;
    color: #ffffff;
    text-transform: capitalize;
    width: fit-content;
  }

  .clp-card-dim-icon {
    width: 12px;
    height: 12px;
    filter: brightness(0) invert(1);
    flex-shrink: 0;
  }

  .clp-card-takeaways {
    margin: .1rem 0 0;
    padding: 0 0 0 1.1rem;
    font-size: .78rem;
    color: #64748b;
    line-height: 1.45;
  }

  .dark-mode .clp-card-takeaways {
    color: #94a3b8;
  }

  .clp-card-takeaways li {
    margin-bottom: .15rem;
  }

  .clp-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    padding-top: .5rem;
    font-size: .72rem;
    color: #94a3b8;
  }

  .clp-card-meta {
    display: flex;
    align-items: center;
    gap: .3rem;
  }

  .clp-card-lock {
    font-size: .72rem;
    color: #94a3b8;
    display: flex;
    align-items: center;
    gap: .3rem;
  }

  /* ── Upgrade gate ── */
  .clp-upgrade {
    text-align: center;
    padding: 3rem 1rem;
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 20px;
    margin: 2rem 0;
  }

  .dark-mode .clp-upgrade {
    background: #1e293b;
    border-color: #334155;
  }

  .clp-upgrade-title {
    font-size: 1.3rem;
    font-weight: 800;
    color: #0f172a;
    margin: .75rem 0 .5rem;
  }

  .dark-mode .clp-upgrade-title {
    color: #f1f5f9;
  }

  .clp-upgrade-sub {
    font-size: .9rem;
    color: #64748b;
    margin: 0 0 1.25rem;
    max-width: 480px;
    margin-left: auto;
    margin-right: auto;
  }

  .clp-upgrade-btn {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    background: #0891b2;
    color: #fff;
    border-radius: 10px;
    padding: .7rem 1.4rem;
    font-weight: 700;
    text-decoration: none;
    font-size: .875rem;
  }

  .clp-upgrade-btn:hover {
    background: #0e7490;
  }
`;

function GuideCard({ guide, onClick, locked }) {
  const read  = isGuideRead(guide.id);
  const color = DIMENSION_COLORS[guide.dimension] || '#0891b2';
  const icon  = DIMENSION_ICONS[guide.dimension]  || '/icons/compass.svg';

  return (
    <button
      className={`clp-guide-card${locked ? ' locked' : ''}`}
      onClick={onClick}
      aria-label={`${guide.title}${locked ? ' — locked, Family tier required' : ''}`}
    >
      <div className="clp-card-top" style={{ background: color }} />
      <div className="clp-card-body">
        <div className="clp-card-header">
          <h3 className="clp-card-title">{guide.title}</h3>
          {read && <span className="clp-card-read-badge">✓ Read</span>}
        </div>

        <span className="clp-card-dim-badge" style={{ background: color }}>
          <img
            src={icon}
            alt=""
            aria-hidden="true"
            className="clp-card-dim-icon"
          />
          {guide.dimension.replace(/-/g, ' ')}
        </span>

        <ul className="clp-card-takeaways" aria-label="Key takeaways preview">
          {guide.keyTakeaways.slice(0, 2).map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>

        <div className="clp-card-footer">
          <span className="clp-card-meta">
            <img src="/icons/planning.svg" alt="" aria-hidden="true" className="icon icon-sm" />
            {guide.readingTime} read
          </span>
          {locked && (
            <span className="clp-card-lock">
              <img src="/icons/lock.svg" alt="" aria-hidden="true" className="icon icon-sm" />
              Family tier
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function CaregiverLearningPage() {
  const [selectedDimension, setSelectedDimension] = useState('all');
  const [showUnlockModal,   setShowUnlockModal]   = useState(false);
  const [activeGuide,       setActiveGuide]       = useState(null);

  const hasAccess = hasCaregiverAccess();

  const filteredGuides = getCaregiverGuidesByDimension(selectedDimension);
  const readCount      = CAREGIVER_GUIDES.filter((g) => isGuideRead(g.id)).length;

  function handleGuideClick(guide) {
    if (!hasAccess) {
      setShowUnlockModal(true);
      return;
    }
    setActiveGuide(guide);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Individual guide view ─────────────────────────────────────────────────
  if (activeGuide) {
    return (
      <>
        <style>{PAGE_STYLES}</style>
        <a href="#main-content" className="iatlas-skip">Skip to guide</a>
        <SiteHeader activePage="iatlas" />
        <DarkModeHint />

        <main className="clp-page" id="main-content">
          <div className="clp-wrap">
            <nav className="clp-breadcrumb" aria-label="Breadcrumb">
              <Link to="/iatlas">IATLAS</Link>
              <span aria-hidden="true">›</span>
              <Link to="/iatlas/parent-dashboard">Parent Dashboard</Link>
              <span aria-hidden="true">›</span>
              <button
                onClick={() => setActiveGuide(null)}
                style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 600,
                  cursor: 'pointer', fontSize: '.8rem', padding: 0, fontFamily: 'inherit' }}
              >
                Caregiver Learning
              </button>
              <span aria-hidden="true">›</span>
              <span aria-current="page">{activeGuide.title}</span>
            </nav>

            <CaregiverGuideViewer
              guide={activeGuide}
              onBack={() => setActiveGuide(null)}
            />
          </div>
        </main>
      </>
    );
  }

  // ── Catalog view ──────────────────────────────────────────────────────────
  return (
    <>
      <style>{PAGE_STYLES}</style>
      <a href="#main-content" className="iatlas-skip">Skip to Caregiver Learning</a>
      <SiteHeader activePage="iatlas" />
      <DarkModeHint />

      <main className="clp-page" id="main-content">
        <div className="clp-wrap">

          {/* Breadcrumb */}
          <nav className="clp-breadcrumb" aria-label="Breadcrumb">
            <Link to="/iatlas">IATLAS</Link>
            <span aria-hidden="true">›</span>
            <Link to="/iatlas/parent-dashboard">Parent Dashboard</Link>
            <span aria-hidden="true">›</span>
            <span aria-current="page">Caregiver Learning</span>
          </nav>

          {/* Hero */}
          <div className="clp-hero" role="banner">
            <p className="clp-hero-label">
              <img src="/icons/story.svg" alt="" aria-hidden="true" className="icon icon-sm" /> Family Tier · Parent Guides
            </p>
            <h1 className="clp-hero-title">Caregiver Learning</h1>
            <p className="clp-hero-desc">
              Evidence-based parent guides to help you support your child's resilience journey.
              Each guide is grounded in research and designed for busy families.
            </p>
            <div className="clp-hero-stats" role="region" aria-label="Guide statistics">
              <div className="clp-hero-stat">
                <span className="clp-hero-stat-value">{CAREGIVER_GUIDES.length}</span>
                <span className="clp-hero-stat-label">Guides</span>
              </div>
              <div className="clp-hero-stat">
                <span className="clp-hero-stat-value">{readCount}</span>
                <span className="clp-hero-stat-label">Read</span>
              </div>
              <div className="clp-hero-stat">
                <span className="clp-hero-stat-value">6</span>
                <span className="clp-hero-stat-label">Dimensions</span>
              </div>
            </div>
          </div>

          {/* Upgrade gate */}
          {!hasAccess && (
            <div className="clp-upgrade" role="region" aria-label="Upgrade required">
              <img src="/icons/lock.svg" aria-hidden="true" className="icon icon-sm" alt="" />
              <h2 className="clp-upgrade-title">Family Tier Required</h2>
              <p className="clp-upgrade-sub">
                Caregiver Learning is available on the IATLAS Family plan ($39.99/mo) and above.
                Upgrade to access all 15 evidence-based parent guides.
              </p>
              <Link to="/iatlas" className="clp-upgrade-btn">
                <img src="/icons/unlock.svg" alt="" aria-hidden="true" className="icon icon-sm" />
                Upgrade to Family Plan
              </Link>
            </div>
          )}

          {/* Dimension filter */}
          <div
            className="clp-filter-row"
            role="group"
            aria-label="Filter by resilience dimension"
          >
            {CAREGIVER_GUIDE_DIMENSIONS.map((dim) => (
              <button
                key={dim.key}
                className={`clp-filter-btn${selectedDimension === dim.key ? ' active' : ''}`}
                onClick={() => setSelectedDimension(dim.key)}
                aria-pressed={selectedDimension === dim.key}
              >
                {dim.icon} {dim.label}
              </button>
            ))}
          </div>

          {/* Guide grid */}
          {filteredGuides.length > 0 ? (
            <div className="clp-guides-grid">
              {filteredGuides.map((guide) => (
                <GuideCard
                  key={guide.id}
                  guide={guide}
                  onClick={() => handleGuideClick(guide)}
                  locked={!hasAccess}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
              <img src="/icons/story.svg" aria-hidden="true" className="icon icon-sm" alt="" />
              <p>No guides found for this dimension.</p>
            </div>
          )}

        </div>
      </main>

      {showUnlockModal && (
        <IATLASUnlockModal
          variant="caregiver"
          onClose={() => setShowUnlockModal(false)}
        />
      )}
    </>
  );
}
