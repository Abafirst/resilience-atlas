import React from 'react';
import { PERMISSION_LABELS } from '../../constants/progressCircles.js';

/**
 * PermissionCustomizer — toggles for customising what a circle member can access.
 *
 * Props:
 *   permissions {Object}   Current permission values (canViewProgress, etc.)
 *   onChange    {Function} Called with the updated permissions object
 *   disabled    {boolean}  When true, all toggles are read-only
 */
export default function PermissionCustomizer({ permissions = {}, onChange, disabled = false }) {
  const FIELDS = Object.keys(PERMISSION_LABELS);

  function toggle(field) {
    if (disabled) return;
    onChange({ ...permissions, [field]: !permissions[field] });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {FIELDS.map((field) => {
        const { label, description } = PERMISSION_LABELS[field];
        const checked = Boolean(permissions[field]);
        return (
          <label
            key={field}
            style={{
              display:      'flex',
              alignItems:   'flex-start',
              gap:          12,
              cursor:       disabled ? 'default' : 'pointer',
              padding:      '10px 12px',
              borderRadius: 8,
              background:   checked ? '#f0fdf4' : '#f9fafb',
              border:       `1px solid ${checked ? '#86efac' : '#e5e7eb'}`,
              transition:   'background 0.15s, border-color 0.15s',
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(field)}
              disabled={disabled}
              style={{ marginTop: 2, accentColor: '#16a34a', width: 16, height: 16 }}
            />
            <div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{label}</span>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>{description}</p>
            </div>
          </label>
        );
      })}
    </div>
  );
}
