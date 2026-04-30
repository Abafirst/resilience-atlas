import React from 'react';
import { ROLE_COLORS, ROLE_CATEGORIES, VALID_ROLES } from '../../constants/progressCircles.js';

/**
 * RoleSelector — categorised role selection UI for Progress Circle invitations.
 *
 * Props:
 *   value    {string}   Currently selected role key
 *   onChange {Function} Called with the new role key
 */
export default function RoleSelector({ value, onChange }) {
  return (
    <div>
      {Object.entries(ROLE_CATEGORIES).map(([category, roles]) => (
        <div key={category} style={{ marginBottom: 16 }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {category}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {roles.filter(r => VALID_ROLES.includes(r)).map((role) => {
              const info   = ROLE_COLORS[role] || { bg: '#f9fafb', color: '#6b7280', label: role, icon: '👤' };
              const active = value === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => onChange(role)}
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          6,
                    padding:      '6px 12px',
                    borderRadius: 20,
                    border:       active ? `2px solid ${info.color}` : '2px solid transparent',
                    background:   active ? info.bg : '#f9fafb',
                    color:        active ? info.color : '#374151',
                    cursor:       'pointer',
                    fontSize:     14,
                    fontWeight:   active ? 700 : 400,
                    transition:   'all 0.15s',
                  }}
                >
                  <span>{info.icon}</span>
                  <span>{info.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
