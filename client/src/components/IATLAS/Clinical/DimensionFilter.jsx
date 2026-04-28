/**
 * DimensionFilter.jsx
 * Filter buttons for the 6 IATLAS resilience dimensions.
 * Used by the ABA Protocol Library.
 */

import React from 'react';
import { DIMENSION_META } from '../../../data/abaProtocols.js';

const DIMENSIONS = [
  { key: 'all', label: 'All Dimensions', color: '#64748b', bgColor: '#f1f5f9', icon: '/icons/journal.svg' },
  ...Object.entries(DIMENSION_META).map(([key, meta]) => ({ key, ...meta })),
];

export default function DimensionFilter({ selectedDimension, onChange }) {
  return (
    <div className="ppl-dimension-filter" role="group" aria-label="Filter by dimension">
      {DIMENSIONS.map((dim) => {
        const isActive = selectedDimension === dim.key;
        return (
          <button
            key={dim.key}
            className={`ppl-dim-btn${isActive ? ' ppl-dim-btn--active' : ''}`}
            onClick={() => onChange(dim.key)}
            aria-pressed={isActive}
            style={
              isActive
                ? { background: dim.color, borderColor: dim.color, color: '#fff' }
                : { borderColor: dim.color, color: dim.color }
            }
          >
            <span className="ppl-dim-btn-icon" aria-hidden="true">
              {dim.icon && typeof dim.icon === 'string' && dim.icon.startsWith('/')
                ? <img src={dim.icon} alt="" aria-hidden="true" style={{ width: '1rem', height: '1rem', objectFit: 'contain' }} />
                : dim.icon}
            </span>
            <span className="ppl-dim-btn-label">{dim.label}</span>
          </button>
        );
      })}
    </div>
  );
}
