/**
 * DevelopmentalRoadmapPage.jsx
 * IATLAS Developmental Roadmap — visual guide to resilience skills across ages 5-18.
 * Route: /iatlas/developmental-roadmap
 */

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';
import DevelopmentalRoadmap from '../components/IATLAS/DevelopmentalRoadmap.jsx';
import DevelopmentalWheel from '../components/IATLAS/DevelopmentalWheel.jsx';
import '../styles/developmentalWheel.css';

const PAGE_STYLES = `
  .drp-page {
    background: #f8fafc;
    min-height: 100vh;
  }

  .dark-mode .drp-page {
    background: #0f172a;
  }

  .drp-wrap {
    max-width: 960px;
    margin: 0 auto;
    padding: 0 1.25rem 5rem;
  }

  /* ── Breadcrumb ──────────────────────────────────────────────────────────── */
  .drp-breadcrumb {
    display: flex;
    align-items: center;
    gap: .4rem;
    font-size: .8rem;
    color: #6b7280;
    padding: 1.25rem 0 .5rem;
    flex-wrap: wrap;
  }

  .drp-breadcrumb a {
    color: inherit;
    text-decoration: none;
  }

  .drp-breadcrumb a:hover {
    color: #4f46e5;
    text-decoration: underline;
  }

  .drp-breadcrumb-sep {
    color: #d1d5db;
  }

  /* ── Hero ────────────────────────────────────────────────────────────────── */
  .drp-hero {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    border-radius: 20px;
    padding: 2.5rem 2rem;
    margin: .75rem 0 2.5rem;
    color: #ffffff;
  }

  .drp-hero-kicker {
    display: flex;
    align-items: center;
    gap: .4rem;
    font-size: .75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .08em;
    opacity: .85;
    margin: 0 0 .6rem;
  }

  .drp-hero h1 {
    margin: 0 0 .6rem;
    font-size: 1.85rem;
    font-weight: 900;
    line-height: 1.15;
  }

  .drp-hero p {
    margin: 0 0 .5rem;
    font-size: .95rem;
    line-height: 1.6;
    opacity: .9;
  }

  .drp-hero p:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 600px) {
    .drp-hero h1 {
      font-size: 1.4rem;
    }
  }

  /* ── Actions bar ─────────────────────────────────────────────────────────── */
  .drp-actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    margin-top: 2.5rem;
    padding-top: 2rem;
    border-top: 1px solid #e2e8f0;
  }

  .dark-mode .drp-actions {
    border-top-color: #334155;
  }

  .drp-btn-pdf {
    display: inline-flex;
    align-items: center;
    gap: .45rem;
    padding: .65rem 1.25rem;
    background: #4f46e5;
    color: #ffffff;
    border-radius: 10px;
    text-decoration: none;
    font-weight: 700;
    font-size: .88rem;
    transition: background .15s;
  }

  .drp-btn-pdf:hover {
    background: #4338ca;
  }

  .drp-btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: .45rem;
    padding: .65rem 1.25rem;
    background: #f1f5f9;
    color: #374151;
    border-radius: 10px;
    text-decoration: none;
    font-weight: 600;
    font-size: .88rem;
    transition: background .15s;
  }

  .drp-btn-secondary:hover {
    background: #e2e8f0;
  }

  .dark-mode .drp-btn-secondary {
    background: #1e293b;
    color: #cbd5e1;
  }

  .dark-mode .drp-btn-secondary:hover {
    background: #0f172a;
  }

  /* ── Section divider ─────────────────────────────────────────────────────── */
  .drp-section-divider {
    margin: 3rem 0 2rem;
    text-align: center;
  }

  .drp-section-divider h2 {
    font-size: 1.3rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: .5rem;
  }

  .dark-mode .drp-section-divider h2 {
    color: #f1f5f9;
  }

  .drp-section-divider p {
    font-size: .9rem;
    color: #64748b;
    margin: 0;
  }

  .dark-mode .drp-section-divider p {
    color: #94a3b8;
  }
`;

export default function DevelopmentalRoadmapPage() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'instant' : 'smooth' });
  }, []);

  return (
    <>
      <style>{PAGE_STYLES}</style>
      <a href="#main-content" className="iatlas-skip">Skip to developmental roadmap</a>
      <SiteHeader activePage="iatlas" />
      <DarkModeHint />

      <main className="drp-page" id="main-content">
        <div className="drp-wrap">

          {/* Breadcrumb */}
          <nav className="drp-breadcrumb" aria-label="Breadcrumb">
            <Link to="/iatlas">IATLAS</Link>
            <span className="drp-breadcrumb-sep" aria-hidden="true">›</span>
            <span aria-current="page">Developmental Roadmap</span>
          </nav>

          {/* Hero */}
          <div className="drp-hero" role="banner">
            <p className="drp-hero-kicker">
              <img
                src="/icons/compass.svg"
                alt=""
                width={13}
                height={13}
                aria-hidden="true"
                style={{ filter: 'brightness(0) invert(1)', opacity: .85 }}
              />
              IATLAS Kids Curriculum
            </p>
            <h1>Developmental Roadmap</h1>
            <p>
              A visual guide to resilience-building skills across ages 5–18. Use the interactive
              circular wheel to explore how skills evolve across dimensions, or browse by age group
              below to see detailed milestones, activities, and badges.
            </p>
            <p>
              Click any segment on the wheel to view details, or select an age group below to see
              dimension milestones, then expand a dimension to view key skills, activities, and badges.
            </p>
          </div>

          {/* Interactive Circular Wheel */}
          <section aria-label="Interactive circular roadmap wheel">
            <DevelopmentalWheel />
          </section>

          {/* Divider */}
          <div className="drp-section-divider">
            <h2>Explore by Age Group</h2>
            <p>Select an age range to see detailed milestones, skills, and activities</p>
          </div>

          {/* Interactive Roadmap */}
          <DevelopmentalRoadmap />

          {/* Actions */}
          <div className="drp-actions">
            <a
              href="/api/iatlas/roadmap/printable.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="drp-btn-pdf"
            >
              📄 Download Printable Roadmap (PDF)
            </a>
            <Link to="/iatlas/kids/catalog" className="drp-btn-secondary">
              🎯 Browse Activity Catalog
            </Link>
            <Link to="/iatlas/kids" className="drp-btn-secondary">
              👦 Back to Kids Curriculum
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
