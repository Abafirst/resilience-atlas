/**
 * PractitionerProtocolLibrary.jsx
 *
 * ABA Protocol Library for IATLAS Practitioner tier.
 * Route: /iatlas/clinical/aba-protocols
 *
 * Features:
 *  - Dimension filter buttons (6 resilience dimensions + "All")
 *  - Keyword search (title, purpose, procedure)
 *  - Protocol cards (expandable with full details)
 *  - Tier gating (requires Practitioner+ tier)
 *  - Print-friendly protocol view
 */

import React, { useState, useEffect, useMemo } from 'react';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';
import DimensionFilter from '../components/IATLAS/Clinical/DimensionFilter.jsx';
import ProtocolCard from '../components/IATLAS/Clinical/ProtocolCard.jsx';
import IATLASUnlockModal from '../components/IATLAS/IATLASUnlockModal.jsx';
import { ABA_PROTOCOLS } from '../data/abaProtocols.js';
import { hasProfessionalAccess } from '../utils/iatlasGating.js';
import '../components/IATLAS/Clinical/ProtocolLibrary.css';

export default function PractitionerProtocolLibrary() {
  const [selectedDimension, setSelectedDimension] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const hasAccess = hasProfessionalAccess();

  // Apply dark mode preference
  useEffect(() => {
    try {
      const t = localStorage.getItem('ra-theme');
      if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
      else if (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.setAttribute('data-theme', 'dark');
    } catch (_) {}
  }, []);

  // Filter protocols by dimension and search query
  const filteredProtocols = useMemo(() => {
    return ABA_PROTOCOLS.filter((p) => {
      const matchesDimension =
        selectedDimension === 'all' || p.dimension === selectedDimension;

      if (!searchQuery.trim()) return matchesDimension;

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        p.title.toLowerCase().includes(q) ||
        p.purpose.toLowerCase().includes(q) ||
        (p.theoreticalBasis || '').toLowerCase().includes(q) ||
        (p.procedure || []).join(' ').toLowerCase().includes(q) ||
        (p.dataCollection || '').toLowerCase().includes(q) ||
        (p.expectedOutcomes || '').toLowerCase().includes(q);

      return matchesDimension && matchesSearch;
    });
  }, [selectedDimension, searchQuery]);

  return (
    <>
      <SiteHeader activePage="iatlas" />
      <DarkModeHint />

      <main className="ppl-page" id="main-content">
        <div className="ppl-wrap">

          {/* Breadcrumb */}
          <nav className="ppl-breadcrumb" aria-label="Breadcrumb">
            <a href="/iatlas">IATLAS</a>
            <span className="ppl-breadcrumb-sep" aria-hidden="true">›</span>
            <a href="/iatlas">Clinical</a>
            <span className="ppl-breadcrumb-sep" aria-hidden="true">›</span>
            <span aria-current="page">ABA Protocol Library</span>
          </nav>

          {/* Hero */}
          <header className="ppl-hero">
            <span className="ppl-hero-kicker">🩺 Practitioner Resource</span>
            <h1 className="ppl-hero-title">ABA Protocol Library</h1>
            <p className="ppl-hero-sub">
              Evidence-based Applied Behavior Analysis protocols for resilience intervention
              across all 6 IATLAS dimensions. {ABA_PROTOCOLS.length}+ protocols, fully indexed
              and searchable.
            </p>
          </header>

          {/* Tier gate: show paywall for non-Practitioner users */}
          {!hasAccess ? (
            <div className="ppl-paywall">
              <div className="ppl-paywall-icon">🔒</div>
              <h2>Practitioner Access Required</h2>
              <p>
                The ABA Protocol Library is included with the IATLAS Practitioner tier
                ($149/mo). Subscribe to access {ABA_PROTOCOLS.length}+ evidence-based
                protocols across all 6 resilience dimensions.
              </p>
              <button
                className="ppl-paywall-btn"
                onClick={() => setShowPaywall(true)}
              >
                Unlock Practitioner Access
              </button>
            </div>
          ) : (
            <>
              {/* Controls: search + dimension filter */}
              <div className="ppl-controls">
                <div className="ppl-search-row">
                  <div className="ppl-search-wrap">
                    <span className="ppl-search-icon" aria-hidden="true">🔍</span>
                    <input
                      type="search"
                      className="ppl-search-input"
                      placeholder="Search protocols by title, purpose, or keyword…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="Search protocols"
                    />
                  </div>
                  <span className="ppl-result-count" aria-live="polite">
                    {filteredProtocols.length} of {ABA_PROTOCOLS.length} protocols
                  </span>
                </div>

                <DimensionFilter
                  selectedDimension={selectedDimension}
                  onChange={setSelectedDimension}
                />
              </div>

              {/* Protocol grid */}
              <div
                className="ppl-grid"
                role="list"
                aria-label="Protocol list"
              >
                {filteredProtocols.length > 0 ? (
                  filteredProtocols.map((protocol) => (
                    <div key={protocol.id} role="listitem">
                      <ProtocolCard protocol={protocol} />
                    </div>
                  ))
                ) : (
                  <div className="ppl-empty">
                    <div className="ppl-empty-icon">🔍</div>
                    <h3>No protocols found</h3>
                    <p>Try adjusting your search or dimension filter.</p>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </main>

      {/* Paywall modal */}
      {showPaywall && (
        <IATLASUnlockModal
          feature="professional"
          onClose={() => setShowPaywall(false)}
        />
      )}
    </>
  );
}
