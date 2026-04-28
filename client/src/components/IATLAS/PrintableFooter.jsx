/**
 * PrintableFooter.jsx
 * Trademark footer for IATLAS printable/downloadable pages.
 * Renders in the browser and is visible in print preview.
 *
 * Props:
 *   compact  {boolean}  — Use compact single-line layout (default: false)
 *   className {string}  — Additional CSS class names
 */

import React from 'react';

const FOOTER_STYLES = `
.iatlas-printable-footer {
  border-top: 2px solid #e2e8f0;
  padding-top: 1rem;
  margin-top: 2rem;
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;
}

.iatlas-printable-footer p {
  margin: 0.25rem 0;
}

.iatlas-printable-footer .iatlas-footer-title {
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.iatlas-printable-footer .iatlas-footer-disclaimer {
  font-style: italic;
}

/* Compact variant */
.iatlas-printable-footer--compact {
  border-top: 1px solid #cbd5e1;
}

/* Print styles — ensure footer prints on every page */
@media print {
  .iatlas-printable-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 0.5rem 1rem;
    border-top: 1px solid #cbd5e1;
    font-size: 9pt;
    color: #475569;
    text-align: center;
    page-break-inside: avoid;
    background: white;
  }

  .iatlas-printable-footer p {
    margin: 0.125rem 0;
  }
}
`;

export default function PrintableFooter({ compact = false, className = '' }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FOOTER_STYLES }} />
      <footer
        className={`iatlas-printable-footer${compact ? ' iatlas-printable-footer--compact' : ''}${className ? ` ${className}` : ''}`}
        aria-label="IATLAS trademark footer"
      >
        {compact ? (
          <>
            <p className="iatlas-footer-title">
              The Resilience Atlas™ IATLAS Kids Curriculum | © 2026 Janeen Molchany Ph.D., BCBA
            </p>
            <p className="iatlas-footer-disclaimer">
              For educational use only. Not a clinical or diagnostic tool.
            </p>
          </>
        ) : (
          <>
            <p className="iatlas-footer-title">
              The Resilience Atlas™ — IATLAS Kids Curriculum
            </p>
            <p>
              © 2026 The Resilience Atlas™ — a trademark of Janeen Molchany Ph.D., BCBA
            </p>
            <p className="iatlas-footer-disclaimer">
              For educational use only. Not a clinical or diagnostic tool.
            </p>
          </>
        )}
      </footer>
    </>
  );
}
