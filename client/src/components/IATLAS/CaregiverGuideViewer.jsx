/**
 * CaregiverGuideViewer.jsx
 * Full reading view for a single parent guide.
 * Rendered inside CaregiverLearningPage when a guide is selected.
 */

import React, { useEffect, useState } from 'react';
import { isGuideRead, markGuideRead } from '../../data/iatlas/caregiverGuides.js';

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

const VIEWER_STYLES = `
  .cgv-wrap {
    max-width: 720px;
    margin: 0 auto;
  }

  /* ── Back button ── */
  .cgv-back-btn {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    background: none;
    border: none;
    color: #6366f1;
    font-size: .875rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    padding: .5rem 0;
    margin-bottom: 1rem;
  }

  .cgv-back-btn:hover {
    text-decoration: underline;
  }

  .dark-mode .cgv-back-btn {
    color: #a5b4fc;
  }

  /* ── Hero ── */
  .cgv-hero {
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 1.75rem;
  }

  .cgv-hero-banner {
    height: 8px;
  }

  .cgv-hero-body {
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-top: none;
    border-radius: 0 0 16px 16px;
    padding: 1.5rem 1.75rem;
  }

  .dark-mode .cgv-hero-body {
    background: #1e293b;
    border-color: #334155;
  }

  .cgv-dim-badge {
    display: inline-flex;
    align-items: center;
    gap: .35rem;
    font-size: .72rem;
    font-weight: 700;
    border-radius: 20px;
    padding: .2rem .65rem;
    color: #ffffff;
    text-transform: capitalize;
    margin-bottom: .75rem;
  }

  .cgv-dim-icon {
    width: 14px;
    height: 14px;
    vertical-align: middle;
    filter: brightness(0) invert(1);
  }

  .cgv-title {
    font-size: 1.55rem;
    font-weight: 900;
    color: #0f172a;
    margin: 0 0 .5rem;
    line-height: 1.2;
  }

  .dark-mode .cgv-title {
    color: #f1f5f9;
  }

  .cgv-meta-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: .75rem;
    font-size: .8rem;
    color: #64748b;
    margin-top: .5rem;
  }

  .cgv-meta-item {
    display: flex;
    align-items: center;
    gap: .3rem;
  }

  /* ── Key takeaways ── */
  .cgv-takeaways {
    background: #eff6ff;
    border: 1.5px solid #bfdbfe;
    border-radius: 12px;
    padding: 1rem 1.25rem;
    margin-bottom: 1.75rem;
  }

  .dark-mode .cgv-takeaways {
    background: #172554;
    border-color: #1d4ed8;
  }

  .cgv-takeaways-title {
    font-size: .8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: #1d4ed8;
    margin: 0 0 .6rem;
  }

  .dark-mode .cgv-takeaways-title {
    color: #93c5fd;
  }

  .cgv-takeaways-list {
    margin: 0;
    padding: 0 0 0 1.2rem;
    display: flex;
    flex-direction: column;
    gap: .3rem;
  }

  .cgv-takeaways-list li {
    font-size: .875rem;
    color: #1e40af;
    line-height: 1.45;
  }

  .dark-mode .cgv-takeaways-list li {
    color: #bfdbfe;
  }

  /* ── Sections ── */
  .cgv-sections {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .cgv-section h2 {
    font-size: 1.1rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 .6rem;
    padding-bottom: .4rem;
    border-bottom: 2px solid #e2e8f0;
  }

  .dark-mode .cgv-section h2 {
    color: #f1f5f9;
    border-bottom-color: #334155;
  }

  .cgv-section-body {
    font-size: .9rem;
    line-height: 1.7;
    color: #374151;
    white-space: pre-line;
  }

  .dark-mode .cgv-section-body {
    color: #cbd5e1;
  }

  /* ── References ── */
  .cgv-references {
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    padding: 1rem 1.25rem;
    margin-bottom: 2rem;
  }

  .dark-mode .cgv-references {
    background: #1e293b;
    border-color: #334155;
  }

  .cgv-references-title {
    font-size: .8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: #64748b;
    margin: 0 0 .6rem;
  }

  .cgv-references-list {
    margin: 0;
    padding: 0 0 0 1.2rem;
    display: flex;
    flex-direction: column;
    gap: .25rem;
  }

  .cgv-references-list li {
    font-size: .8rem;
    color: #64748b;
    line-height: 1.5;
    font-style: italic;
  }

  .dark-mode .cgv-references-list li {
    color: #94a3b8;
  }

  /* ── Mark as Read button ── */
  .cgv-read-btn {
    display: inline-flex;
    align-items: center;
    gap: .5rem;
    background: #6366f1;
    color: #ffffff;
    border: none;
    border-radius: 10px;
    padding: .7rem 1.4rem;
    font-size: .875rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: background .15s;
    margin-bottom: 2rem;
  }

  .cgv-read-btn:hover {
    background: #4f46e5;
  }

  .cgv-read-btn.read {
    background: #10b981;
    cursor: default;
  }

  .cgv-read-btn.read:hover {
    background: #059669;
  }

  /* ── Print-specific styles ── */
  @media print {
    .cgv-back-btn,
    .cgv-read-btn {
      display: none !important;
    }

    .cgv-hero-body,
    .cgv-takeaways,
    .cgv-references {
      border: 1px solid #ccc;
      box-shadow: none;
    }

    .cgv-section h2 {
      border-bottom: 1px solid #ccc;
    }

    .cgv-title {
      font-size: 18pt;
    }
  }
`;

export default function CaregiverGuideViewer({ guide, onBack }) {
  const [read, setRead] = useState(() => isGuideRead(guide.id));
  const color = DIMENSION_COLORS[guide.dimension] || '#6366f1';
  const icon  = DIMENSION_ICONS[guide.dimension]  || '/icons/compass.svg';

  // Scroll to top when a new guide opens
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [guide.id]);

  function handleMarkRead() {
    markGuideRead(guide.id);
    setRead(true);
  }

  return (
    <>
      <style>{VIEWER_STYLES}</style>
      <div className="cgv-wrap">

        <button className="cgv-back-btn no-print" onClick={onBack} aria-label="Back to guide catalog">
          ‹ Back to Caregiver Learning
        </button>

        {/* Hero */}
        <div className="cgv-hero">
          <div className="cgv-hero-banner" style={{ background: color }} />
          <div className="cgv-hero-body">
            <div
              className="cgv-dim-badge"
              style={{ background: color }}
            >
              <img
                src={icon}
                alt=""
                aria-hidden="true"
                className="cgv-dim-icon"
              />
              {guide.dimension.replace(/-/g, ' ')}
            </div>

            <h1 className="cgv-title">{guide.title}</h1>

            <div className="cgv-meta-row">
              <span className="cgv-meta-item">
                <img src="/icons/planning.svg" alt="" aria-hidden="true" className="icon icon-sm" />
                {guide.readingTime} read
              </span>
              <span className="cgv-meta-item">
                <img src="/icons/kids-spark.svg" alt="" aria-hidden="true" className="icon icon-sm" />
                Ages: {guide.ageRange === 'all' ? 'All ages' : guide.ageRange}
              </span>
              {read && (
                <span
                  className="cgv-meta-item"
                  style={{ color: '#15803d', fontWeight: 700 }}
                >
                  ✓ Read
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Key takeaways */}
        <div className="cgv-takeaways" role="region" aria-label="Key takeaways">
          <p className="cgv-takeaways-title">Key Takeaways</p>
          <ul className="cgv-takeaways-list">
            {guide.keyTakeaways.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>

        {/* Sections */}
        <div className="cgv-sections">
          {guide.sections.map((section, i) => (
            <div key={i} className="cgv-section">
              <h2>{section.heading}</h2>
              <p className="cgv-section-body">{section.content}</p>
            </div>
          ))}
        </div>

        {/* Mark as Read */}
        <button
          className={`cgv-read-btn no-print${read ? ' read' : ''}`}
          onClick={handleMarkRead}
          disabled={read}
          aria-label={read ? 'Guide marked as read' : 'Mark this guide as read'}
        >
          {read ? '✓ Marked as Read' : 'Mark as Read'}
        </button>

        {/* References */}
        {guide.references && guide.references.length > 0 && (
          <div className="cgv-references" role="region" aria-label="References">
            <p className="cgv-references-title">References</p>
            <ul className="cgv-references-list">
              {guide.references.map((ref, i) => (
                <li key={i}>{ref}</li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </>
  );
}
