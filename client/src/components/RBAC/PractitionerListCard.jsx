/**
 * PractitionerListCard.jsx
 * Displays a list of practitioners with role/status badges and action buttons.
 *
 * Props:
 *   practitioners    {Array}   List of practitioner objects
 *   currentUserRole  {string}  Role of the currently logged-in user
 *   onEditRole       {fn}      Called with (practitioner) to open edit-role flow
 *   onRemove         {fn}      Called with (practitioner) to remove them
 */

import React from 'react';
import { hasPermission } from './PermissionGate.jsx';

const ROLE_BADGE = {
  admin:     { label: 'Admin',     bg: '#ede9fe', color: '#7c3aed' },
  clinician: { label: 'Clinician', bg: '#dbeafe', color: '#2563eb' },
  therapist: { label: 'Therapist', bg: '#d1fae5', color: '#059669' },
  observer:  { label: 'Observer',  bg: '#f3f4f6', color: '#6b7280' },
};

const STATUS_BADGE = {
  active:    { label: 'Active',    bg: '#d1fae5', color: '#059669' },
  pending:   { label: 'Pending',   bg: '#fef3c7', color: '#d97706' },
  suspended: { label: 'Suspended', bg: '#fee2e2', color: '#dc2626' },
  removed:   { label: 'Removed',   bg: '#f3f4f6', color: '#9ca3af' },
};

function Badge({ style, children }) {
  return (
    <span style={{ display: 'inline-block', borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 600, ...style }}>
      {children}
    </span>
  );
}

export default function PractitionerListCard({ practitioners = [], currentUserRole, onEditRole, onRemove }) {
  const canEditRoles = hasPermission(currentUserRole, 'practitioners', 'edit_roles');
  const canRemove    = hasPermission(currentUserRole, 'practitioners', 'remove');

  if (!practitioners.length) {
    return (
      <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center', color: '#9ca3af' }}>
        No practitioners found.
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
            {['Name / Email', 'Role', 'Status', 'Actions'].map(h => (
              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {practitioners.map((p, i) => {
            const roleBadge   = ROLE_BADGE[p.role]   || ROLE_BADGE.observer;
            const statusBadge = STATUS_BADGE[p.status] || STATUS_BADGE.pending;
            return (
              <tr key={p.id || i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>{p.name || p.fullName || '—'}</div>
                  <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>{p.email}</div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <Badge style={{ bg: roleBadge.bg, color: roleBadge.color, background: roleBadge.bg }}>
                    {roleBadge.label}
                  </Badge>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <Badge style={{ background: statusBadge.bg, color: statusBadge.color }}>
                    {statusBadge.label}
                  </Badge>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {canEditRoles && (
                      <button
                        onClick={() => onEditRole && onEditRole(p)}
                        style={{ background: '#ede9fe', color: '#7c3aed', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Edit Role
                      </button>
                    )}
                    {canRemove && (
                      <button
                        onClick={() => onRemove && onRemove(p)}
                        style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    )}
                    {!canEditRoles && !canRemove && (
                      <span style={{ color: '#d1d5db', fontSize: 13 }}>—</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
