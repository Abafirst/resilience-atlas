/**
 * DateRangeFilter.jsx
 * Date range selection component for the Analytics Dashboard.
 *
 * Props:
 *   value     {string}    Current range key (e.g. '30d')
 *   onChange  {Function}  Called with new range key
 */

import React from 'react';
import { DATE_RANGE_OPTIONS } from '../../../utils/analyticsHelpers.js';

const STYLES = `
.drf-root {
  display: flex;
  align-items: center;
  gap: .35rem;
  flex-wrap: wrap;
}
.drf-label {
  font-size: .8rem;
  font-weight: 600;
  color: #64748b;
  margin-right: .25rem;
}
[data-theme="dark"] .drf-label { color: #94a3b8; }
.drf-btn {
  padding: .3rem .75rem;
  border-radius: 999px;
  border: 1.5px solid #e2e8f0;
  background: none;
  font-size: .8rem;
  color: #475569;
  cursor: pointer;
  transition: background .15s, color .15s, border-color .15s;
  font-weight: 500;
}
.drf-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}
.drf-btn.drf-active {
  background: #6366f1;
  border-color: #6366f1;
  color: #fff;
  font-weight: 700;
}
[data-theme="dark"] .drf-btn {
  border-color: #334155;
  color: #94a3b8;
}
[data-theme="dark"] .drf-btn:hover {
  background: #334155;
  color: #f1f5f9;
}
[data-theme="dark"] .drf-btn.drf-active {
  background: #6366f1;
  border-color: #6366f1;
  color: #fff;
}
`;

export default function DateRangeFilter({ value, onChange }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="drf-root" role="group" aria-label="Date range filter">
        <span className="drf-label">Range:</span>
        {DATE_RANGE_OPTIONS.filter(o => o.value !== 'custom').map(opt => (
          <button
            key={opt.value}
            className={`drf-btn${value === opt.value ? ' drf-active' : ''}`}
            onClick={() => onChange(opt.value)}
            aria-pressed={value === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </>
  );
}
