/**
 * DevelopmentalRoadmapPage.jsx
 * IATLAS Developmental Roadmap — interactive circular evolution wheel.
 * Shows how resilience skills evolve across ages 5-18 across 6 dimensions.
 * Route: /iatlas/developmental-roadmap
 */

import React from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';
import DevelopmentalWheel from '../components/IATLAS/DevelopmentalWheel.jsx';
import '../styles/developmentalWheel.css';

export default function DevelopmentalRoadmapPage() {
  return (
    <>
      <SiteHeader activePage="iatlas" />
      <DarkModeHint />
      <div className="developmental-roadmap-page">
        <header className="drp-header">
          <nav className="drp-breadcrumb" aria-label="Breadcrumb">
            <Link to="/iatlas">IATLAS</Link>
            <span className="drp-breadcrumb-sep" aria-hidden="true">›</span>
            <span aria-current="page">Developmental Roadmap</span>
          </nav>
          <h1 className="drp-title">IATLAS Developmental Roadmap</h1>
          <p className="drp-subtitle">
            An interactive visual guide to resilience-building skills across ages 5–18
          </p>
        </header>

        <div className="drp-instructions">
          <h3 className="drp-instructions-title">How to Use the Roadmap:</h3>
          <ol className="drp-instructions-list">
            <li>
              🎯 <strong>Inner rings</strong> = Younger ages (5-7),{' '}
              <strong>outer rings</strong> = Older ages (15-18)
            </li>
            <li>
              🌈 <strong>6 colored spokes</strong> = 6 dimensions of resilience
            </li>
            <li>
              👆 <strong>Click any segment</strong> to see skills, activities, and badges
              for that age + dimension
            </li>
            <li>
              ⌨️ <strong>Keyboard accessible</strong>: Tab to navigate, Enter to select
            </li>
          </ol>
        </div>

        <DevelopmentalWheel />

        <div className="drp-actions">
          {/* Placeholder: backend endpoint /api/iatlas/roadmap/printable.pdf to be implemented */}
          <a
            href="/api/iatlas/roadmap/printable.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="drp-btn-secondary"
          >
            📄 Download Printable Roadmap (PDF)
          </a>
        </div>
      </div>
    </>
  );
}
