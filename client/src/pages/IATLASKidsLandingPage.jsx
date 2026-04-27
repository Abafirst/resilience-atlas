/**
 * IATLASKidsLandingPage.jsx
 * IATLAS Kids curriculum landing page — age group selector.
 * Route: /iatlas/kids
 */

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';
import ProfileSwitcher from '../components/IATLAS/Profiles/ProfileSwitcher.jsx';
import { useProfiles } from '../contexts/ProfileContext.jsx';
import {
  KIDS_AGE_GROUPS,
  KIDS_ACTIVITIES_BY_DIMENSION,
  countTotalActivities,
} from '../data/iatlas/kidsActivities.js';

const PAGE_STYLES = `
  /* ── Page shell ───────────────────────────────────────────────────────────── */
  .ikids-page {
    background:
      radial-gradient(circle at 5% 0%, rgba(245,158,11,.09) 0%, transparent 36%),
      radial-gradient(circle at 95% 5%, rgba(99,102,241,.07) 0%, transparent 32%),
      #f8fafc;
    min-height: 100vh;
  }

  .dark-mode .ikids-page {
    background:
      radial-gradient(circle at 5% 0%, rgba(245,158,11,.08) 0%, transparent 36%),
      radial-gradient(circle at 95% 5%, rgba(99,102,241,.06) 0%, transparent 32%),
      #0f172a;
  }

  .ikids-wrap {
    max-width: 960px;
    margin: 0 auto;
    padding: 0 1.25rem 5rem;
  }

  /* ── Breadcrumb ──────────────────────────────────────────────────────────── */
  .ikids-breadcrumb {
    display: flex;
    align-items: center;
    gap: .4rem;
    font-size: .8rem;
    color: #6b7280;
    padding: 1.25rem 0 .5rem;
    flex-wrap: wrap;
  }

  .ikids-breadcrumb a {
    color: inherit;
    text-decoration: none;
  }

  .ikids-breadcrumb a:hover {
    color: #4f46e5;
    text-decoration: underline;
  }

  .ikids-breadcrumb-sep { color: #d1d5db; }

  /* ── Hero ────────────────────────────────────────────────────────────────── */
  .ikids-hero {
    background: linear-gradient(135deg, #f59e0b 0%, #ef4444 60%, #8b5cf6 100%);
    border-radius: 20px;
    padding: 3rem 2rem 2.5rem;
    margin: .75rem 0 2.5rem;
    color: #ffffff;
    position: relative;
    overflow: hidden;
  }

  .ikids-hero::before {
    content: '';
    position: absolute;
    top: -60px;
    right: -60px;
    width: 240px;
    height: 240px;
    background: rgba(255,255,255,.06);
    border-radius: 50%;
    pointer-events: none;
  }

  .ikids-hero::after {
    content: '';
    position: absolute;
    bottom: -40px;
    left: 30%;
    width: 160px;
    height: 160px;
    background: rgba(255,255,255,.04);
    border-radius: 50%;
    pointer-events: none;
  }

  .ikids-hero-kicker {
    display: inline-flex;
    align-items: center;
    gap: .45rem;
    background: rgba(255,255,255,.18);
    border-radius: 20px;
    padding: .3rem .9rem;
    font-size: .78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
    margin-bottom: 1rem;
  }

  .ikids-hero-kicker-icon {
    width: 14px;
    height: 14px;
    filter: brightness(0) invert(1);
  }

  .ikids-hero-title {
    font-size: 2.5rem;
    font-weight: 900;
    margin: 0 0 .75rem;
    line-height: 1.15;
    max-width: 560px;
  }

  .ikids-hero-sub {
    font-size: 1.05rem;
    opacity: .9;
    margin: 0 0 1.75rem;
    max-width: 500px;
    line-height: 1.6;
  }

  .ikids-hero-stats {
    display: flex;
    flex-wrap: wrap;
    gap: .75rem;
  }

  .ikids-stat-pill {
    background: rgba(255,255,255,.18);
    border-radius: 20px;
    padding: .35rem .9rem;
    font-size: .83rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: .4rem;
  }

  .ikids-stat-icon {
    width: 14px;
    height: 14px;
    filter: brightness(0) invert(1);
    opacity: .85;
  }

  /* ── What is IATLAS Kids ─────────────────────────────────────────────────── */
  .ikids-intro {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 2.5rem;
  }

  .dark-mode .ikids-intro {
    background: #1e293b;
    border-color: #334155;
  }

  .ikids-intro-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 .6rem;
  }

  .dark-mode .ikids-intro-title {
    color: #f1f5f9;
  }

  .ikids-intro-text {
    font-size: .92rem;
    color: #475569;
    line-height: 1.7;
    margin: 0 0 1rem;
  }

  .dark-mode .ikids-intro-text {
    color: #94a3b8;
  }

  .ikids-pillars {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: .75rem;
    margin-top: .75rem;
  }

  .ikids-pillar {
    background: #f8fafc;
    border-radius: 10px;
    padding: .75rem 1rem;
    display: flex;
    align-items: center;
    gap: .6rem;
    font-size: .83rem;
    font-weight: 600;
    color: #374151;
  }

  .dark-mode .ikids-pillar {
    background: #0f172a;
    color: #cbd5e1;
  }

  .ikids-pillar-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  /* ── Section header ──────────────────────────────────────────────────────── */
  .ikids-section-header {
    margin-bottom: 1.5rem;
  }

  .ikids-section-kicker {
    font-size: .78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: #f59e0b;
    display: flex;
    align-items: center;
    gap: .35rem;
    margin-bottom: .4rem;
  }

  .ikids-section-kicker-icon {
    width: 14px;
    height: 14px;
  }

  .ikids-section-title {
    font-size: 1.6rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 .5rem;
  }

  .dark-mode .ikids-section-title {
    color: #f1f5f9;
  }

  .ikids-section-sub {
    font-size: .9rem;
    color: #64748b;
    max-width: 580px;
    line-height: 1.6;
  }

  .dark-mode .ikids-section-sub {
    color: #94a3b8;
  }

  /* ── Age group cards ─────────────────────────────────────────────────────── */
  .ikids-age-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 3rem;
  }

  .ikids-age-card {
    background: #ffffff;
    border-radius: 16px;
    border: 2px solid #e2e8f0;
    padding: 1.5rem 1.25rem;
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: .75rem;
    transition: box-shadow .2s, transform .2s, border-color .2s;
  }

  .dark-mode .ikids-age-card {
    background: #1e293b;
    border-color: #334155;
  }

  .ikids-age-card:hover {
    box-shadow: 0 8px 30px rgba(0,0,0,.1);
    transform: translateY(-3px);
    text-decoration: none;
  }

  .ikids-age-icon-wrap {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ikids-age-icon {
    width: 32px;
    height: 32px;
  }

  .ikids-age-label {
    font-size: 1rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    line-height: 1.2;
  }

  .dark-mode .ikids-age-label {
    color: #f1f5f9;
  }

  .ikids-age-nickname {
    font-size: .78rem;
    font-weight: 600;
    margin: 0;
    opacity: .7;
  }

  .ikids-age-meta {
    font-size: .75rem;
    color: #64748b;
    line-height: 1.4;
  }

  .dark-mode .ikids-age-meta {
    color: #94a3b8;
  }

  .ikids-age-count {
    font-size: .8rem;
    font-weight: 700;
    padding: .25rem .7rem;
    border-radius: 20px;
    margin-top: auto;
  }

  .ikids-age-cta {
    font-size: .82rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: .25rem;
    opacity: .5;
    transition: opacity .15s;
  }

  .ikids-age-card:hover .ikids-age-cta {
    opacity: .9;
  }

  /* ── Dimensions overview ─────────────────────────────────────────────────── */
  .ikids-dims-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: .85rem;
    margin-bottom: 3rem;
  }

  .ikids-dim-row {
    background: #ffffff;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    padding: 1rem 1.25rem;
    display: flex;
    align-items: center;
    gap: .85rem;
  }

  .dark-mode .ikids-dim-row {
    background: #1e293b;
    border-color: #334155;
  }

  .ikids-dim-icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .ikids-dim-icon {
    width: 22px;
    height: 22px;
  }

  .ikids-dim-name {
    font-size: .72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .05em;
    opacity: .6;
    margin: 0 0 .15rem;
  }

  .ikids-dim-kids-name {
    font-size: .95rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }

  .dark-mode .ikids-dim-kids-name {
    color: #f1f5f9;
  }

  /* ── Parent guide banner ─────────────────────────────────────────────────── */
  .ikids-parent-banner {
    background: linear-gradient(135deg, #1e293b, #0f172a);
    border-radius: 16px;
    padding: 2rem;
    color: #ffffff;
    display: flex;
    align-items: flex-start;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .ikids-parent-icon-wrap {
    width: 56px;
    height: 56px;
    background: rgba(255,255,255,.1);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .ikids-parent-icon {
    width: 28px;
    height: 28px;
    filter: brightness(0) invert(1);
  }

  .ikids-parent-content {
    flex: 1;
  }

  .ikids-parent-title {
    font-size: 1.2rem;
    font-weight: 800;
    margin: 0 0 .5rem;
  }

  .ikids-parent-text {
    font-size: .88rem;
    opacity: .8;
    line-height: 1.6;
    margin: 0 0 1rem;
  }

  .ikids-parent-tips {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: .4rem;
  }

  .ikids-parent-tip {
    font-size: .83rem;
    display: flex;
    align-items: flex-start;
    gap: .5rem;
    opacity: .85;
  }

  .ikids-parent-tip-check {
    color: #34d399;
    font-weight: 700;
    flex-shrink: 0;
  }

  @media (max-width: 600px) {
    .ikids-hero-title { font-size: 1.75rem; }
    .ikids-age-grid { grid-template-columns: 1fr 1fr; }
  }
`;

export default function IATLASKidsLandingPage() {
  const totalActivities = countTotalActivities();
  const dimensions = Object.values(KIDS_ACTIVITIES_BY_DIMENSION);
  const { activeProfile, profiles } = useProfiles();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'instant' : 'smooth' });
  }, []);

  function getAgeGroupActivityCount(ageGroupId) {
    return dimensions.reduce((total, dim) => {
      const acts = dim.activities[ageGroupId] || [];
      return total + acts.length;
    }, 0);
  }

  return (
    <>
      <style>{PAGE_STYLES}</style>
      <a href="#main-content" className="iatlas-skip">Skip to Kids curriculum</a>
      <SiteHeader activePage="iatlas" />
      <DarkModeHint />

      <main className="ikids-page" id="main-content">
        <div className="ikids-wrap">

          {/* Breadcrumb */}
          <nav className="ikids-breadcrumb" aria-label="Breadcrumb">
            <a href="/iatlas">IATLAS</a>
            <span className="ikids-breadcrumb-sep" aria-hidden="true">›</span>
            <span aria-current="page">Kids Curriculum</span>
          </nav>

          {/* Hero */}
          <section className="ikids-hero" aria-labelledby="ikids-hero-title">
            {profiles.length > 0 && (
              <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', zIndex: 10 }}>
                <ProfileSwitcher />
              </div>
            )}
            <span className="ikids-hero-kicker">
              <img src="/icons/kids-spark.svg" alt="" className="ikids-hero-kicker-icon" aria-hidden="true" />
              <span title="Integrated Applied Teaching and Learning Adaptive System">IATLAS™</span> Kids
            </span>
            <h1 className="ikids-hero-title" id="ikids-hero-title">
              Resilience for Kids:<br />Play-Based Learning
            </h1>
            <p className="ikids-hero-sub" style={{ fontStyle: 'italic', opacity: 0.85, marginBottom: '.5rem' }}>
              Resilience-building activities from the <strong>IATLAS</strong> (Integrated Applied Teaching and Learning Adaptive System) curriculum
            </p>
            {activeProfile && (
              <p style={{ fontSize: '.9rem', fontWeight: 700, opacity: .85, marginBottom: '.5rem', color: '#fff' }}>
                Viewing: {activeProfile.avatar} {activeProfile.name}'s Progress
              </p>
            )}
            <p className="ikids-hero-sub">
              Age-appropriate activities that teach the 6 dimensions of resilience through play,
              stories, games, and real-world challenges — from ages 5 to 18.
            </p>
            <div className="ikids-hero-stats" aria-label="Curriculum statistics">
              <span className="ikids-stat-pill">
                <img src="/icons/movement.svg" alt="" className="ikids-stat-icon" aria-hidden="true" />
                {totalActivities}+ activities
              </span>
              <span className="ikids-stat-pill">
                <img src="/icons/strength.svg" alt="" className="ikids-stat-icon" aria-hidden="true" />
                4 age groups
              </span>
              <span className="ikids-stat-pill">
                <img src="/icons/compass.svg" alt="" className="ikids-stat-icon" aria-hidden="true" />
                6 dimensions
              </span>
              <span className="ikids-stat-pill">
                <img src="/icons/reflection.svg" alt="" className="ikids-stat-icon" aria-hidden="true" />
                Evidence-based
              </span>
            </div>
          </section>

          {/* Intro */}
          <div className="ikids-intro" role="region" aria-label="About IATLAS Kids">
            <h2 className="ikids-intro-title">What is IATLAS Kids?</h2>
            <p className="ikids-intro-text">
              <strong>IATLAS</strong> (Integrated Applied Teaching and Learning Adaptive System) Kids brings the science of resilience into age-appropriate, play-based learning.
              Every activity is grounded in ABA and ACT research and designed to fit naturally into
              a child's day — at home, at school, or anywhere in between.
            </p>
            <div className="ikids-pillars" aria-label="Curriculum principles">
              {[
                { icon: '/icons/movement.svg',            label: 'Play-based learning' },
                { icon: '/icons/agentic-generative.svg',  label: 'Evidence-based' },
                { icon: '/icons/strength.svg',            label: 'Age-appropriate' },
                { icon: '/icons/relational-connective.svg', label: 'Family-friendly' },
                { icon: '/icons/reflection.svg',          label: 'Builds real skills' },
                { icon: '/icons/compass.svg',             label: 'Values-aligned' },
              ].map(p => (
                <div key={p.label} className="ikids-pillar">
                  <img src={p.icon} alt="" className="ikids-pillar-icon" aria-hidden="true" />
                  {p.label}
                </div>
              ))}
            </div>
          </div>

          {/* Age groups */}
          <section aria-labelledby="ikids-age-title">
            <div className="ikids-section-header">
              <span className="ikids-section-kicker">
                <img src="/icons/kids-spark.svg" alt="" className="ikids-section-kicker-icon" aria-hidden="true" />
                Choose Your Age Group
              </span>
              <h2 className="ikids-section-title" id="ikids-age-title">
                4 Developmental Tiers
              </h2>
              <p className="ikids-section-sub">
                Every age group has its own set of activities designed for that stage of development —
                different attention spans, learning styles, and life challenges.
              </p>
            </div>

            <div className="ikids-age-grid" role="list">
              {KIDS_AGE_GROUPS.map(ag => {
                const count = getAgeGroupActivityCount(ag.id);
                return (
                  <Link
                    key={ag.id}
                    to={`/iatlas/kids/${ag.id}`}
                    className="ikids-age-card"
                    role="listitem"
                    style={{ borderColor: ag.color }}
                    aria-label={`${ag.nickname} — ${ag.label} — ${count} activities`}
                  >
                    <div
                      className="ikids-age-icon-wrap"
                      style={{ background: ag.colorLight }}
                      aria-hidden="true"
                    >
                      <img src={ag.icon} alt="" className="ikids-age-icon" />
                    </div>
                    <p className="ikids-age-label">{ag.label}</p>
                    <p className="ikids-age-nickname" style={{ color: ag.color }}>{ag.nickname}</p>
                    <p className="ikids-age-meta">
                      {ag.attentionSpan}<br />
                      {ag.learningStyle}
                    </p>
                    <span
                      className="ikids-age-count"
                      style={{ background: ag.colorLight, color: ag.color }}
                    >
                      {count} activities
                    </span>
                    <span className="ikids-age-cta" style={{ color: ag.color }}>
                      Explore →
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Browse All Activities CTA */}
          <div style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            borderRadius: 16,
            padding: '1.75rem 2rem',
            marginBottom: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            color: '#ffffff',
          }} aria-label="Browse all activities">
            <div>
              <p style={{ margin: '0 0 .35rem', fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', opacity: .85 }}>
                Activity Catalog
              </p>
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                Browse, search & filter all {totalActivities}+ activities
              </p>
              <p style={{ margin: '.25rem 0 0', fontSize: '.85rem', opacity: .85 }}>
                Filter by age, dimension, difficulty, or activity type
              </p>
            </div>
            <Link
              to="/iatlas/kids/catalog"
              style={{
                background: 'rgba(255,255,255,.2)',
                color: '#ffffff',
                borderRadius: 10,
                padding: '.65rem 1.35rem',
                fontWeight: 700,
                fontSize: '.9rem',
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,.3)',
                whiteSpace: 'nowrap',
                transition: 'background .15s',
              }}
              aria-label="Open activity catalog"
            >
              Open Catalog →
            </Link>
          </div>

          {/* Dimensions overview */}
          <section aria-labelledby="ikids-dims-title">
            <div className="ikids-section-header">
              <span className="ikids-section-kicker">
                <img src="/icons/compass.svg" alt="" className="ikids-section-kicker-icon" aria-hidden="true" />
                6 Resilience Dimensions
              </span>
              <h2 className="ikids-section-title" id="ikids-dims-title">
                What Kids Will Learn
              </h2>
              <p className="ikids-section-sub">
                Each of the six IATLAS dimensions has a kid-friendly name and a set of activities
                for every age group.
              </p>
            </div>

            <div className="ikids-dims-grid" role="list">
              {dimensions.map(dim => (
                <div key={dim.dimensionKey} className="ikids-dim-row" role="listitem">
                  <div
                    className="ikids-dim-icon-wrap"
                    style={{ background: dim.colorLight }}
                    aria-hidden="true"
                  >
                    <img src={dim.icon} alt="" className="ikids-dim-icon" />
                  </div>
                  <div>
                    <p className="ikids-dim-name" style={{ color: dim.color }}>{dim.dimensionTitle}</p>
                    <p className="ikids-dim-kids-name">{dim.kidsName}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Parent/teacher guide */}
          <section aria-labelledby="ikids-parent-title">
            <div className="ikids-parent-banner">
              <div className="ikids-parent-icon-wrap" aria-hidden="true">
                <img src="/icons/story.svg" alt="" className="ikids-parent-icon" />
              </div>
              <div className="ikids-parent-content">
                <h2 className="ikids-parent-title" id="ikids-parent-title">
                  For Parents &amp; Teachers
                </h2>
                <p className="ikids-parent-text">
                  These activities are designed for easy implementation — no special training required.
                  Here's how to get the most from the IATLAS Kids curriculum:
                </p>
                <ul className="ikids-parent-tips" aria-label="Implementation tips">
                  {[
                    'Start with your child\'s age group and let them choose a dimension that interests them.',
                    'Short and frequent beats long and rare — even 5 minutes daily builds meaningful habits.',
                    'Do the activities alongside your child when possible — shared practice deepens connection.',
                    'Celebrate effort and reflection, not just completion.',
                    'Revisit activities: skills deepen with repetition across different life contexts.',
                    'Use the "Parent note" on each card for facilitator guidance and context.',
                  ].map((tip, i) => (
                    <li key={i} className="ikids-parent-tip">
                      <span className="ikids-parent-tip-check" aria-hidden="true">✓</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: '1rem' }}>
                  <Link
                    to="/iatlas/family-dashboard"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '.4rem',
                      padding: '.55rem 1.25rem',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,.2)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '.85rem',
                      textDecoration: 'none',
                      border: '1.5px solid rgba(255,255,255,.35)',
                      transition: 'background .15s',
                    }}
                    aria-label="Open Family Dashboard"
                  >
                    🏡 Family Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
    </>
  );
}
