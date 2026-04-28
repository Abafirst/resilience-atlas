/**
 * CaregiverLearningPage.jsx
 * Caregiver Learning curriculum — 15 topic-based parent guides.
 *
 * Route: /iatlas/caregiver-learning
 * Access: Family tier ($39.99/mo) and above via hasCaregiverAccess()
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';
import { hasCaregiverAccess } from '../utils/iatlasGating.js';
import IATLASUnlockModal from '../components/IATLAS/IATLASUnlockModal.jsx';
import CaregiverLearning from '../components/IATLAS/CaregiverLearning.jsx';

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
    margin: 0;
    max-width: 600px;
  }
`;

export default function CaregiverLearningPage() {
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const hasAccess = hasCaregiverAccess();

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
              Evidence-based parent guides to help you support your child&rsquo;s resilience journey.
              Each guide is grounded in research and designed for busy families.
            </p>
          </div>

          {/* Curriculum browser */}
          <CaregiverLearning
            hasAccess={hasAccess}
            onUnlockClick={() => setShowUnlockModal(true)}
          />

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
