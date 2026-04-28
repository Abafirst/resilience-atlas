/**
 * ProtocolCard.jsx
 * Displays a single ABA protocol in card format with expandable details.
 */

import React, { useState } from 'react';
import { DIMENSION_META } from '../../../data/abaProtocols.js';

export default function ProtocolCard({ protocol }) {
  const [expanded, setExpanded] = useState(false);
  const dimMeta = DIMENSION_META[protocol.dimension] || {};

  return (
    <article
      className={`ppl-card${expanded ? ' ppl-card--expanded' : ''}`}
      aria-label={`${protocol.title} — ${dimMeta.label || protocol.dimension}`}
    >
      {/* Card header */}
      <div className="ppl-card-header">
        <span
          className="ppl-dimension-badge"
          style={{ background: dimMeta.bgColor, color: dimMeta.color, borderColor: dimMeta.color }}
        >
          <span aria-hidden="true">{dimMeta.icon}</span> {dimMeta.label || protocol.dimension}
        </span>
        <h3 className="ppl-card-title">{protocol.title}</h3>
      </div>

      {/* Purpose summary */}
      <p className="ppl-card-purpose">{protocol.purpose}</p>

      {/* Expand/collapse button */}
      <button
        className="ppl-view-btn"
        style={{ borderColor: dimMeta.color, color: dimMeta.color }}
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
      >
        {expanded ? 'Hide Details ↑' : 'View Protocol ↓'}
      </button>

      {/* Full protocol details */}
      {expanded && (
        <div className="ppl-card-details">
          {protocol.theoreticalBasis && (
            <section className="ppl-detail-section">
              <h4 className="ppl-detail-heading" style={{ color: dimMeta.color }}>Theoretical Basis</h4>
              <p>{protocol.theoreticalBasis}</p>
            </section>
          )}

          {protocol.procedure && protocol.procedure.length > 0 && (
            <section className="ppl-detail-section">
              <h4 className="ppl-detail-heading" style={{ color: dimMeta.color }}>Procedure</h4>
              <ol className="ppl-procedure-list">
                {protocol.procedure.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </section>
          )}

          {protocol.dataCollection && (
            <section className="ppl-detail-section">
              <h4 className="ppl-detail-heading" style={{ color: dimMeta.color }}>Data Collection</h4>
              <p>{protocol.dataCollection}</p>
            </section>
          )}

          {protocol.expectedOutcomes && (
            <section className="ppl-detail-section">
              <h4 className="ppl-detail-heading" style={{ color: dimMeta.color }}>Expected Outcomes</h4>
              <p>{protocol.expectedOutcomes}</p>
            </section>
          )}

          {protocol.troubleshooting && (
            <section className="ppl-detail-section">
              <h4 className="ppl-detail-heading" style={{ color: dimMeta.color }}>Troubleshooting</h4>
              <p>{protocol.troubleshooting}</p>
            </section>
          )}

          <button
            className="ppl-print-btn"
            onClick={() => window.print()}
            aria-label={`Print ${protocol.title} protocol`}
          >
            <img src="/icons/print.svg" alt="" aria-hidden="true" style={{ width: '1rem', height: '1rem', objectFit: 'contain' }} /> Print Protocol
          </button>
        </div>
      )}
    </article>
  );
}
