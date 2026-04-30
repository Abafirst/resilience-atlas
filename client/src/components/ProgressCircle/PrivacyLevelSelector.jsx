import React from 'react';
import { PRIVACY_LEVELS } from '../../constants/progressCircles.js';

/**
 * PrivacyLevelSelector — lets the parent/guardian choose how much detail is
 * shared with other circle members.
 *
 * Props:
 *   value    {string}   Current privacy level ('full' | 'aggregated' | 'minimal')
 *   onChange {Function} Called with the new privacy level string
 */
export default function PrivacyLevelSelector({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {PRIVACY_LEVELS.map((level) => {
        const active = value === level.value;
        return (
          <label
            key={level.value}
            style={{
              display:      'flex',
              alignItems:   'flex-start',
              gap:          14,
              padding:      '14px 16px',
              borderRadius: 10,
              border:       `2px solid ${active ? '#4f46e5' : '#e5e7eb'}`,
              background:   active ? '#eef2ff' : '#fff',
              cursor:       'pointer',
              transition:   'border-color 0.15s, background 0.15s',
            }}
          >
            <input
              type="radio"
              name="privacyLevel"
              value={level.value}
              checked={active}
              onChange={() => onChange(level.value)}
              style={{ marginTop: 3, accentColor: '#4f46e5' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{level.icon}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: active ? '#4f46e5' : '#111827' }}>
                  {level.label}
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
                {level.description}
              </p>
            </div>
          </label>
        );
      })}
    </div>
  );
}
