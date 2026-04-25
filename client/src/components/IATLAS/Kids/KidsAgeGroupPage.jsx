/**
 * KidsAgeGroupPage.jsx
 * Shows all 6 dimensions for a specific age group.
 * Route: /iatlas/kids/:ageGroup
 */

import React from 'react';
import { Link, useParams } from 'react-router-dom';
import SiteHeader from '../../SiteHeader.jsx';
import DarkModeHint from '../../DarkModeHint.jsx';
import {
  KIDS_AGE_GROUPS,
  KIDS_ACTIVITIES_BY_DIMENSION,
} from '../../../data/iatlas/kidsActivities.js';

const PAGE_STYLES = `
  .kagp-page {
    background: #f8fafc;
    min-height: 100vh;
  }

  .dark-mode .kagp-page {
    background: #0f172a;
  }

  .kagp-wrap {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 1.25rem 4rem;
  }

  .kagp-breadcrumb {
    display: flex;
    align-items: center;
    gap: .4rem;
    font-size: .8rem;
    color: #6b7280;
    padding: 1.25rem 0 .5rem;
    flex-wrap: wrap;
  }

  .kagp-breadcrumb a {
    color: inherit;
    text-decoration: none;
  }

  .kagp-breadcrumb a:hover {
    color: #4f46e5;
    text-decoration: underline;
  }

  .kagp-breadcrumb-sep {
    color: #d1d5db;
  }

  .kagp-hero {
    border-radius: 16px;
    padding: 2.25rem 2rem;
    margin: .75rem 0 2rem;
    color: #ffffff;
    position: relative;
    overflow: hidden;
  }

  .kagp-hero::before {
    content: '';
    position: absolute;
    top: -50px;
    right: -50px;
    width: 200px;
    height: 200px;
    background: rgba(255,255,255,.06);
    border-radius: 50%;
    pointer-events: none;
  }

  .kagp-hero-kicker {
    display: flex;
    align-items: center;
    gap: .45rem;
    font-size: .8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .06em;
    opacity: .85;
    margin-bottom: .5rem;
  }

  .kagp-hero-icon {
    width: 18px;
    height: 18px;
    filter: brightness(0) invert(1);
  }

  .kagp-hero-title {
    font-size: 2rem;
    font-weight: 800;
    margin: 0 0 .5rem;
    line-height: 1.2;
  }

  .kagp-hero-sub {
    font-size: .95rem;
    opacity: .88;
    margin: 0 0 1rem;
    max-width: 540px;
  }

  .kagp-hero-meta {
    display: flex;
    flex-wrap: wrap;
    gap: .75rem;
    margin-top: 1rem;
  }

  .kagp-meta-pill {
    background: rgba(255,255,255,.18);
    border-radius: 20px;
    padding: .3rem .8rem;
    font-size: .8rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: .35rem;
  }

  .kagp-meta-pill-icon {
    width: 13px;
    height: 13px;
    filter: brightness(0) invert(1);
    opacity: .8;
  }

  .kagp-section-header {
    margin-bottom: 1.25rem;
  }

  .kagp-section-kicker {
    font-size: .78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: #6366f1;
    display: flex;
    align-items: center;
    gap: .35rem;
    margin-bottom: .35rem;
  }

  .kagp-section-kicker-icon {
    width: 14px;
    height: 14px;
  }

  .kagp-section-title {
    font-size: 1.5rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 .4rem;
  }

  .dark-mode .kagp-section-title {
    color: #f1f5f9;
  }

  .kagp-section-sub {
    font-size: .9rem;
    color: #64748b;
  }

  .dark-mode .kagp-section-sub {
    color: #94a3b8;
  }

  .kagp-dim-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1rem;
  }

  .kagp-dim-card {
    background: #ffffff;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    padding: 1.25rem;
    transition: box-shadow .18s, transform .18s;
    display: flex;
    flex-direction: column;
    gap: .75rem;
    text-decoration: none;
    color: inherit;
  }

  .dark-mode .kagp-dim-card {
    background: #1e293b;
    border-color: #334155;
  }

  .kagp-dim-card:hover {
    box-shadow: 0 6px 24px rgba(0,0,0,.08);
    transform: translateY(-2px);
    text-decoration: none;
  }

  .kagp-dim-card-header {
    display: flex;
    align-items: center;
    gap: .75rem;
  }

  .kagp-dim-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .kagp-dim-icon {
    width: 26px;
    height: 26px;
  }

  .kagp-dim-name {
    font-size: .72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .05em;
    opacity: .6;
    margin-bottom: .2rem;
  }

  .kagp-dim-kids-name {
    font-size: 1rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    line-height: 1.2;
  }

  .dark-mode .kagp-dim-kids-name {
    color: #f1f5f9;
  }

  .kagp-dim-count {
    font-size: .82rem;
    color: #64748b;
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .dark-mode .kagp-dim-count {
    color: #94a3b8;
  }

  .kagp-dim-arrow {
    font-size: 1.1rem;
    opacity: .4;
    transition: opacity .15s, transform .15s;
  }

  .kagp-dim-card:hover .kagp-dim-arrow {
    opacity: .8;
    transform: translateX(3px);
  }

  .kagp-back-link {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    color: #4f46e5;
    font-size: .85rem;
    font-weight: 600;
    text-decoration: none;
    padding: .45rem .85rem;
    border-radius: 8px;
    border: 1px solid #e0e7ff;
    margin-bottom: 1.5rem;
    transition: background .15s;
  }

  .kagp-back-link:hover {
    background: #eef2ff;
    text-decoration: none;
  }

  .dark-mode .kagp-back-link {
    color: #818cf8;
    border-color: #334155;
  }

  .dark-mode .kagp-back-link:hover {
    background: #1e2a40;
  }
`;

export default function KidsAgeGroupPage() {
  const { ageGroup: ageGroupId } = useParams();

  const ageGroup = KIDS_AGE_GROUPS.find(ag => ag.id === ageGroupId);

  if (!ageGroup) {
    return (
      <>
        <SiteHeader activePage="iatlas" />
        <main id="main-content" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
          <p>Age group not found. <Link to="/iatlas/kids">Return to Kids Curriculum</Link></p>
        </main>
      </>
    );
  }

  const dimensions = Object.values(KIDS_ACTIVITIES_BY_DIMENSION);

  return (
    <>
      <style>{PAGE_STYLES}</style>
      <a href="#main-content" className="iatlas-skip">Skip to curriculum</a>
      <SiteHeader activePage="iatlas" />
      <DarkModeHint />

      <main className="kagp-page" id="main-content">
        <div className="kagp-wrap">

          {/* Breadcrumb */}
          <nav className="kagp-breadcrumb" aria-label="Breadcrumb">
            <a href="/iatlas">IATLAS</a>
            <span className="kagp-breadcrumb-sep" aria-hidden="true">›</span>
            <Link to="/iatlas/kids">Kids Curriculum</Link>
            <span className="kagp-breadcrumb-sep" aria-hidden="true">›</span>
            <span aria-current="page">{ageGroup.label}</span>
          </nav>

          {/* Hero */}
          <div
            className="kagp-hero"
            style={{ background: `linear-gradient(135deg, ${ageGroup.color}, ${ageGroup.color}cc)` }}
          >
            <div className="kagp-hero-kicker">
              <img src={ageGroup.icon} alt="" className="kagp-hero-icon" aria-hidden="true" />
              IATLAS Kids
            </div>
            <h1 className="kagp-hero-title">{ageGroup.nickname}</h1>
            <p className="kagp-hero-sub">{ageGroup.description}</p>
            <div className="kagp-hero-meta">
              <span className="kagp-meta-pill">
                <img src="/icons/streaks.svg" alt="" className="kagp-meta-pill-icon" aria-hidden="true" />
                {ageGroup.attentionSpan}
              </span>
              <span className="kagp-meta-pill">
                <img src="/icons/strength.svg" alt="" className="kagp-meta-pill-icon" aria-hidden="true" />
                {ageGroup.learningStyle}
              </span>
            </div>
          </div>

          {/* Back */}
          <Link to="/iatlas/kids" className="kagp-back-link">
            ← All Age Groups
          </Link>

          {/* Dimensions grid */}
          <div className="kagp-section-header">
            <span className="kagp-section-kicker">
              <img src="/icons/compass.svg" alt="" className="kagp-section-kicker-icon" aria-hidden="true" />
              Choose a Dimension
            </span>
            <h2 className="kagp-section-title">6 Resilience Dimensions</h2>
            <p className="kagp-section-sub">
              Each dimension has age-appropriate activities specially designed for {ageGroup.label}.
            </p>
          </div>

          <div className="kagp-dim-grid" role="list">
            {dimensions.map(dim => {
              const acts = dim.activities[ageGroupId] || [];
              return (
                <Link
                  key={dim.dimensionKey}
                  to={`/iatlas/kids/${ageGroupId}/${dim.dimensionKey}`}
                  className="kagp-dim-card"
                  role="listitem"
                  aria-label={`${dim.kidsName} — ${acts.length} activities`}
                  style={{ borderTopColor: dim.color, borderTopWidth: 3 }}
                >
                  <div className="kagp-dim-card-header">
                    <div
                      className="kagp-dim-icon-wrap"
                      style={{ background: dim.colorLight }}
                      aria-hidden="true"
                    >
                      <img src={dim.icon} alt="" className="kagp-dim-icon" />
                    </div>
                    <div>
                      <p className="kagp-dim-name" style={{ color: dim.color }}>{dim.dimensionTitle}</p>
                      <p className="kagp-dim-kids-name">{dim.kidsName}</p>
                    </div>
                  </div>

                  <div className="kagp-dim-count">
                    <span>{acts.length} {acts.length === 1 ? 'activity' : 'activities'}</span>
                    <span className="kagp-dim-arrow" aria-hidden="true">→</span>
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </main>
    </>
  );
}
