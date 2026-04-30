import React from 'react';
import { ROLE_COLORS } from '../../constants/progressCircles.js';

/**
 * TeamMemberCard — displays a single circle member with their role badge.
 *
 * Props:
 *   member    {Object}   Member data (id, email, role, status, acceptedAt, …)
 *   isAdmin   {boolean}  Whether the current user has admin rights
 *   onRemove  {Function} Called when the admin clicks "Remove"
 */
export default function TeamMemberCard({ member, isAdmin, onRemove }) {
  const roleInfo = ROLE_COLORS[member.role] || { bg: '#f9fafb', color: '#6b7280', label: member.role || 'Unknown', icon: '👤' };
  const isPending = member.status === 'pending';

  return (
    <div
      style={{
        display:       'flex',
        alignItems:    'center',
        gap:           12,
        padding:       '12px 16px',
        background:    '#fff',
        borderRadius:  10,
        border:        '1px solid #e5e7eb',
        boxShadow:     '0 1px 3px rgba(0,0,0,0.06)',
        opacity:       isPending ? 0.7 : 1,
      }}
    >
      {/* Avatar / icon */}
      <div
        style={{
          width:        40,
          height:       40,
          borderRadius: '50%',
          background:   roleInfo.bg,
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          fontSize:     20,
          flexShrink:   0,
        }}
      >
        {roleInfo.icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {member.email || 'Unknown'}
          </span>
          {/* Role badge */}
          <span
            style={{
              padding:      '2px 8px',
              borderRadius: 12,
              background:   roleInfo.bg,
              color:        roleInfo.color,
              fontSize:     11,
              fontWeight:   700,
              whiteSpace:   'nowrap',
            }}
          >
            {roleInfo.label}
          </span>
          {/* Pending badge */}
          {isPending && (
            <span style={{ padding: '2px 8px', borderRadius: 12, background: '#fef3c7', color: '#d97706', fontSize: 11, fontWeight: 700 }}>
              Pending
            </span>
          )}
        </div>
        {member.acceptedAt && (
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af' }}>
            Joined {new Date(member.acceptedAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Remove button (admin only) */}
      {isAdmin && onRemove && (
        <button
          onClick={() => onRemove(member.id || member._id)}
          style={{
            padding:      '4px 10px',
            border:       '1px solid #fca5a5',
            borderRadius: 6,
            background:   '#fff',
            color:        '#dc2626',
            cursor:       'pointer',
            fontSize:     12,
            flexShrink:   0,
          }}
        >
          Remove
        </button>
      )}
    </div>
  );
}
