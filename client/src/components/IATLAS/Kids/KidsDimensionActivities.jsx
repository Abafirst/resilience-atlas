/**
 * KidsDimensionActivities.jsx
 * Shows all activities for a given dimension + age group.
 * Route: /iatlas/kids/:ageGroup/:dimension
 */

import React from 'react';
import { Link, useParams } from 'react-router-dom';
import SiteHeader from '../../SiteHeader.jsx';
import DarkModeHint from '../../DarkModeHint.jsx';
import KidsActivityCard from './KidsActivityCard.jsx';
import {
  KIDS_AGE_GROUPS,
  KIDS_ACTIVITIES_BY_DIMENSION,
  getActivitiesForDimension,
} from '../../../data/iatlas/kidsActivities.js';

const PAGE_STYLES = `
  .kda-page {
    background: #f8fafc;
    min-height: 100vh;
  }

  .dark-mode .kda-page {
    background: #0f172a;
  }

  .kda-wrap {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 1.25rem 4rem;
  }

  .kda-breadcrumb {
    display: flex;
    align-items: center;
    gap: .4rem;
    font-size: .8rem;
    color: #6b7280;
    padding: 1.25rem 0 .5rem;
    flex-wrap: wrap;
  }

  .kda-breadcrumb a {
    color: inherit;
    text-decoration: none;
  }

  .kda-breadcrumb a:hover {
    color: #4f46e5;
    text-decoration: underline;
  }

  .kda-breadcrumb-sep {
    color: #d1d5db;
  }

  .kda-hero {
    border-radius: 16px;
    padding: 2rem;
    margin: .75rem 0 2rem;
    color: #ffffff;
    position: relative;
    overflow: hidden;
  }

  .kda-hero::before {
    content: '';
    position: absolute;
    top: -40px;
    right: -40px;
    width: 180px;
    height: 180px;
    background: rgba(255,255,255,.07);
    border-radius: 50%;
    pointer-events: none;
  }

  .kda-hero-kicker {
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

  .kda-hero-icon {
    width: 18px;
    height: 18px;
    filter: brightness(0) invert(1);
  }

  .kda-hero-title {
    font-size: 1.75rem;
    font-weight: 800;
    margin: 0 0 .5rem;
    line-height: 1.2;
  }

  .kda-hero-sub {
    font-size: .95rem;
    opacity: .88;
    margin: 0;
    max-width: 540px;
  }

  .kda-hero-badge {
    position: absolute;
    bottom: 1.25rem;
    right: 1.5rem;
    background: rgba(255,255,255,.15);
    border-radius: 8px;
    padding: .4rem .75rem;
    font-size: .8rem;
    font-weight: 700;
  }

  .kda-count {
    font-size: .88rem;
    color: #64748b;
    margin-bottom: 1.25rem;
  }

  .dark-mode .kda-count {
    color: #94a3b8;
  }

  .kda-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  .kda-empty {
    background: #ffffff;
    border: 1px dashed #e2e8f0;
    border-radius: 14px;
    padding: 3rem 2rem;
    text-align: center;
    color: #94a3b8;
    font-size: .9rem;
  }

  .dark-mode .kda-empty {
    background: #1e293b;
    border-color: #334155;
    color: #64748b;
  }

  .kda-back-link {
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

  .kda-back-link:hover {
    background: #eef2ff;
  }

  .dark-mode .kda-back-link {
    color: #818cf8;
    border-color: #334155;
  }

  .dark-mode .kda-back-link:hover {
    background: #1e2a40;
  }
`;

export default function KidsDimensionActivities() {
  const { ageGroup: ageGroupId, dimension: dimensionKey } = useParams();

  const ageGroup = KIDS_AGE_GROUPS.find(ag => ag.id === ageGroupId);
  const dimData = KIDS_ACTIVITIES_BY_DIMENSION[dimensionKey];
  const activities = getActivitiesForDimension(dimensionKey, ageGroupId);

  if (!ageGroup || !dimData) {
    return (
      <>
        <SiteHeader activePage="iatlas" />
        <main id="main-content" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
          <p>Content not found. <Link to="/iatlas/kids">Return to Kids Curriculum</Link></p>
        </main>
      </>
    );
  }

  return (
    <>
      <style>{PAGE_STYLES}</style>
      <a href="#main-content" className="iatlas-skip">Skip to activities</a>
      <SiteHeader activePage="iatlas" />
      <DarkModeHint />

      <main className="kda-page" id="main-content">
        <div className="kda-wrap">

          {/* Breadcrumb */}
          <nav className="kda-breadcrumb" aria-label="Breadcrumb">
            <a href="/iatlas">IATLAS</a>
            <span className="kda-breadcrumb-sep" aria-hidden="true">›</span>
            <a href="/iatlas/kids">Kids Curriculum</a>
            <span className="kda-breadcrumb-sep" aria-hidden="true">›</span>
            <Link to={`/iatlas/kids/${ageGroupId}`}>{ageGroup.label}</Link>
            <span className="kda-breadcrumb-sep" aria-hidden="true">›</span>
            <span aria-current="page">{dimData.kidsName}</span>
          </nav>

          {/* Hero */}
          <div
            className="kda-hero"
            style={{ background: `linear-gradient(135deg, ${dimData.color}, ${dimData.color}cc)` }}
          >
            <div className="kda-hero-kicker">
              <img src={dimData.icon} alt="" className="kda-hero-icon" aria-hidden="true" />
              {ageGroup.nickname}
            </div>
            <h1 className="kda-hero-title">
              {dimData.kidsName}
            </h1>
            <p className="kda-hero-sub">
              {dimData.dimensionTitle} activities for {ageGroup.label}
            </p>
            <span className="kda-hero-badge" aria-hidden="true">
              {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
            </span>
          </div>

          {/* Back link */}
          <Link
            to={`/iatlas/kids/${ageGroupId}`}
            className="kda-back-link"
            aria-label={`Back to ${ageGroup.label} curriculum`}
          >
            ← Back to {ageGroup.label}
          </Link>

          {/* Activity count */}
          {activities.length > 0 && (
            <p className="kda-count">
              {activities.length} {activities.length === 1 ? 'activity' : 'activities'} for {ageGroup.label} · {ageGroup.attentionSpan} each
            </p>
          )}

          {/* Activity grid */}
          {activities.length > 0 ? (
            <div className="kda-grid" role="list">
              {activities.map(activity => (
                <div key={activity.id} role="listitem">
                  <KidsActivityCard activity={activity} accentColor={dimData.color} />
                </div>
              ))}
            </div>
          ) : (
            <div className="kda-empty" role="status">
              Activities for this dimension are coming soon!
            </div>
          )}

        </div>
      </main>
    </>
  );
}
