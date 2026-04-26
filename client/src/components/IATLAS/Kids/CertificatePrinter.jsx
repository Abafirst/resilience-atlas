/**
 * CertificatePrinter.jsx
 * Generates printable/downloadable achievement certificates for kids.
 */

import React, { useState, useRef } from 'react';

const STYLES = `
  .cert-root {}

  .cert-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .cert-card {
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: 14px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: .65rem;
    transition: box-shadow .18s;
  }

  .dark-mode .cert-card {
    background: #1e293b;
    border-color: #334155;
  }

  .cert-card:hover {
    box-shadow: 0 6px 20px rgba(0,0,0,.08);
  }

  .cert-card.cert-locked {
    opacity: .55;
  }

  .cert-card-header {
    display: flex;
    align-items: center;
    gap: .75rem;
  }

  .cert-icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .cert-icon {
    width: 24px;
    height: 24px;
  }

  .cert-name {
    font-size: .9rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }

  .dark-mode .cert-name {
    color: #f1f5f9;
  }

  .cert-desc {
    font-size: .78rem;
    color: #475569;
    margin: 0;
    line-height: 1.45;
  }

  .dark-mode .cert-desc {
    color: #94a3b8;
  }

  .cert-print-btn {
    background: #4f46e5;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    padding: .45rem .85rem;
    font-size: .8rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: .4rem;
    align-self: flex-start;
    transition: background .15s;
  }

  .cert-print-btn:hover {
    background: #4338ca;
  }

  .cert-print-btn:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  .cert-locked-label {
    font-size: .72rem;
    color: #94a3b8;
    font-weight: 600;
    font-style: italic;
  }

  /* ── Print template (hidden from screen, visible only during print) ── */
  @media print {
    body > *:not(.cert-print-frame) {
      display: none !important;
    }
    .cert-print-frame {
      display: block !important;
    }
  }

  .cert-print-frame {
    display: none;
    position: fixed;
    inset: 0;
    background: #ffffff;
    z-index: 9999;
    padding: 3rem;
    text-align: center;
    font-family: Georgia, serif;
  }

  .cert-print-frame.cert-visible {
    display: block;
  }

  .cert-doc {
    max-width: 680px;
    margin: 0 auto;
    padding: 3rem;
    border: 6px double #4f46e5;
    border-radius: 16px;
  }

  .cert-doc-seal {
    width: 72px;
    height: 72px;
    margin: 0 auto 1rem;
  }

  .cert-doc-org {
    font-size: .85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: #6366f1;
    margin: 0 0 1rem;
  }

  .cert-doc-title {
    font-size: 1.6rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 .5rem;
    font-family: Georgia, serif;
  }

  .cert-doc-subtitle {
    font-size: .9rem;
    color: #64748b;
    margin: 0 0 1.5rem;
  }

  .cert-doc-awarded {
    font-size: .85rem;
    color: #475569;
    margin: 0 0 .5rem;
  }

  .cert-doc-name {
    font-size: 1.8rem;
    font-weight: 700;
    color: #4f46e5;
    border-bottom: 2px solid #a5b4fc;
    display: inline-block;
    padding: 0 1rem .25rem;
    margin: 0 0 1.5rem;
    font-family: Georgia, serif;
  }

  .cert-doc-achievement {
    font-size: 1rem;
    color: #0f172a;
    margin: 0 0 1rem;
    font-style: italic;
  }

  .cert-doc-date {
    font-size: .82rem;
    color: #64748b;
    margin: 1.5rem 0 0;
  }

  .cert-name-input-wrap {
    margin-bottom: 1rem;
  }

  .cert-name-input {
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    padding: .4rem .75rem;
    font-size: .85rem;
    width: 100%;
    max-width: 300px;
    outline: none;
    transition: border-color .15s;
  }

  .cert-name-input:focus {
    border-color: #6366f1;
  }

  .cert-name-label {
    font-size: .78rem;
    font-weight: 600;
    color: #475569;
    display: block;
    margin-bottom: .35rem;
  }

  .dark-mode .cert-name-label {
    color: #94a3b8;
  }
`;

const CERTIFICATE_TYPES = [
  {
    id:          'dimension-master',
    name:        'Dimension Master',
    icon:        '/icons/badges.svg',
    color:       '#6366f1',
    description: 'Complete all activities in one resilience dimension.',
    achievement: 'has completed all activities in a resilience dimension',
  },
  {
    id:          'age-graduate',
    name:        'Age Group Graduate',
    icon:        '/icons/kids-trophy.svg',
    color:       '#059669',
    description: 'Complete all activities in your age group.',
    achievement: 'has completed all activities in their age group',
  },
  {
    id:          'adventure-complete',
    name:        'Adventure Complete',
    icon:        '/icons/compass.svg',
    color:       '#f59e0b',
    description: 'Finish any multi-day adventure.',
    achievement: 'has completed a resilience adventure',
  },
  {
    id:          'resilience-hero',
    name:        'Resilience Hero',
    icon:        '/icons/trophy.svg',
    color:       '#8b5cf6',
    description: 'Reach Level 5: Resilience Hero.',
    achievement: 'has reached Resilience Hero — the highest level!',
  },
];

/**
 * CertificatePrinter
 *
 * Props:
 *   earnedCertificates  {string[]}  Array of earned certificate IDs
 */
export default function CertificatePrinter({ earnedCertificates = [] }) {
  const [childName,   setChildName]   = useState('');
  const [printingId,  setPrintingId]  = useState(null);
  const printRef = useRef(null);

  const handlePrint = (cert) => {
    setPrintingId(cert.id);
    // Allow state to settle, then trigger print dialog
    setTimeout(() => {
      window.print();
      setPrintingId(null);
    }, 150);
  };

  const activeCert = CERTIFICATE_TYPES.find(c => c.id === printingId);
  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <style>{STYLES}</style>

      {/* Child name input */}
      <div className="cert-name-input-wrap">
        <label className="cert-name-label" htmlFor="cert-child-name">
          Child's name (appears on certificate):
        </label>
        <input
          id="cert-child-name"
          className="cert-name-input"
          type="text"
          placeholder="Enter name…"
          value={childName}
          onChange={e => setChildName(e.target.value)}
          aria-describedby="cert-name-hint"
        />
        <span id="cert-name-hint" style={{ fontSize: '.72rem', color: '#94a3b8', display: 'block', marginTop: '.2rem' }}>
          Leave blank to print a fill-in-the-blank version.
        </span>
      </div>

      {/* Certificate list */}
      <div className="cert-list">
        {CERTIFICATE_TYPES.map(cert => {
          const isEarned = earnedCertificates.includes(cert.id);
          return (
            <div
              key={cert.id}
              className={`cert-card${isEarned ? '' : ' cert-locked'}`}
              aria-label={`${cert.name} certificate${isEarned ? ' — earned, available to print' : ' — locked'}`}
            >
              <div className="cert-card-header">
                <div
                  className="cert-icon-wrap"
                  style={{ background: `${cert.color}22` }}
                  aria-hidden="true"
                >
                  <img src={cert.icon} alt="" className="cert-icon" />
                </div>
                <div>
                  <p className="cert-name">{cert.name}</p>
                </div>
              </div>
              <p className="cert-desc">{cert.description}</p>
              {isEarned ? (
                <button
                  className="cert-print-btn"
                  onClick={() => handlePrint(cert)}
                  aria-label={`Print ${cert.name} certificate`}
                >
                  <img src="/icons/compass.svg" alt="" aria-hidden="true" width={14} height={14} />
                  Print Certificate
                </button>
              ) : (
                <span className="cert-locked-label">Not earned yet</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Hidden print template */}
      {activeCert && (
        <div
          ref={printRef}
          className={`cert-print-frame${printingId ? ' cert-visible' : ''}`}
          aria-hidden="true"
        >
          <div className="cert-doc">
            <img src="/icons/trophy.svg" alt="" className="cert-doc-seal" />
            <p className="cert-doc-org">The Resilience Atlas — IATLAS Kids Program</p>
            <h1 className="cert-doc-title">Certificate of Achievement</h1>
            <p className="cert-doc-subtitle">{activeCert.name}</p>

            <p className="cert-doc-awarded">This certificate is proudly awarded to</p>
            <div className="cert-doc-name">
              {childName || '__________________________'}
            </div>

            <p className="cert-doc-achievement">
              who {activeCert.achievement}.
            </p>

            <p style={{ fontSize: '.85rem', color: '#475569', fontStyle: 'italic', margin: '0 0 1rem' }}>
              "Resilience isn't about being tough — it's about knowing your strengths
              and having people who get it."
            </p>

            <p className="cert-doc-date">Date: {today}</p>
          </div>
        </div>
      )}
    </>
  );
}
