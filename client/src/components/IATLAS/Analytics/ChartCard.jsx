/**
 * ChartCard.jsx
 * Reusable wrapper card for charts in the Analytics Dashboard.
 *
 * Props:
 *   title     {string}   Card heading
 *   subtitle  {string}   Optional description
 *   children  {node}     Chart content
 *   loading   {boolean}  Show skeleton while loading
 *   error     {string}   Error message to display
 *   onExport  {Function} Optional export callback (shows export button)
 *   minHeight {string}   CSS min-height for the chart area (default: '260px')
 */

import React from 'react';

const STYLES = `
.cc-root {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: .75rem;
}
[data-theme="dark"] .cc-root {
  background: #1e293b;
  border-color: #334155;
}
.cc-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: .5rem;
}
.cc-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
[data-theme="dark"] .cc-title { color: #f1f5f9; }
.cc-subtitle {
  font-size: .8rem;
  color: #64748b;
  margin: .15rem 0 0;
}
[data-theme="dark"] .cc-subtitle { color: #94a3b8; }
.cc-export-btn {
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: .25rem .6rem;
  font-size: .75rem;
  color: #64748b;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background .15s, color .15s;
}
.cc-export-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}
[data-theme="dark"] .cc-export-btn {
  border-color: #334155;
  color: #94a3b8;
}
[data-theme="dark"] .cc-export-btn:hover {
  background: #334155;
  color: #f1f5f9;
}
/* Skeleton */
.cc-skeleton {
  border-radius: 8px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 400% 100%;
  animation: cc-shimmer 1.4s ease-in-out infinite;
}
[data-theme="dark"] .cc-skeleton {
  background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
  background-size: 400% 100%;
}
@keyframes cc-shimmer {
  0%   { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
/* Error state */
.cc-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  color: #ef4444;
  font-size: .9rem;
  text-align: center;
  padding: 1.5rem 0;
}
.cc-error-icon { font-size: 1.75rem; }
`;

export default function ChartCard({ title, subtitle, children, loading, error, onExport, minHeight = '260px' }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="cc-root" role="region" aria-label={title}>
        <div className="cc-header">
          <div>
            <h3 className="cc-title">{title}</h3>
            {subtitle && <p className="cc-subtitle">{subtitle}</p>}
          </div>
          {onExport && !loading && !error && (
            <button className="cc-export-btn" onClick={onExport} aria-label={`Export ${title} chart`}>
              ⬇ Export
            </button>
          )}
        </div>

        <div style={{ minHeight, display: 'flex', alignItems: 'stretch' }}>
          {loading ? (
            <div className="cc-skeleton" style={{ flex: 1, minHeight }} aria-label="Loading chart data" aria-busy="true" />
          ) : error ? (
            <div className="cc-error" role="alert">
              <span className="cc-error-icon" aria-hidden="true"><img src="/icons/warning.svg" alt="" aria-hidden="true" style={{ width: '1.75rem', height: '1.75rem', objectFit: 'contain' }} /></span>
              <span>{error}</span>
            </div>
          ) : (
            <div style={{ flex: 1, width: '100%' }}>
              {children}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
