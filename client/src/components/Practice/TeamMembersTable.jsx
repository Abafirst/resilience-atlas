/**
 * TeamMembersTable.jsx
 * Displays a sortable table of practice team members with role badges,
 * client counts, join dates, and admin action buttons.
 *
 * Props:
 *   members         {Array}   List of member objects
 *   currentUserId   {string}  The logged-in user's ID (used to disable self-remove)
 *   currentUserRole {string}  The logged-in user's practice role
 *   onEditRole      {fn}      (member) => open edit-role flow
 *   onRemove        {fn}      (member) => confirm + remove member
 *   loading         {bool}
 */

import React from 'react';

const ROLE_BADGE = {
  owner:     { label: 'Owner',     bg: '#fef3c7', color: '#92400e' },
  admin:     { label: 'Admin',     bg: '#ede9fe', color: '#7c3aed' },
  clinician: { label: 'Clinician', bg: '#dbeafe', color: '#2563eb' },
  therapist: { label: 'Therapist', bg: '#d1fae5', color: '#059669' },
  observer:  { label: 'Observer',  bg: '#f3f4f6', color: '#6b7280' },
};

const CAN_EDIT_ROLES = new Set(['owner', 'admin']);
const CAN_REMOVE     = new Set(['owner', 'admin']);

function Badge({ bg, color, children }) {
  return (
    <span style={{ display: 'inline-block', background: bg, color, borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
      {children}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

export default function TeamMembersTable({ members = [], currentUserId, currentUserRole, onEditRole, onRemove, loading }) {
  const canEditRoles = CAN_EDIT_ROLES.has(currentUserRole);
  const canRemove    = CAN_REMOVE.has(currentUserRole);

  if (loading) {
    return (
      <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', textAlign: 'center', color: '#9ca3af', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        Loading team members…
      </div>
    );
  }

  if (!members.length) {
    return (
      <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', textAlign: 'center', color: '#9ca3af', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        No team members yet. Invite your first practitioner!
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
            {['Name', 'Email', 'Role', 'Clients', 'Joined', 'Actions'].map(h => (
              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((m, i) => {
            const roleBadge = ROLE_BADGE[m.practiceRole || m.role] || ROLE_BADGE.observer;
            const isSelf    = currentUserId && (m.userId === currentUserId || m.id === currentUserId);

            return (
              <tr key={m.userId || m.id || i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>
                    {m.name || m.fullName || '—'}
                    {isSelf && <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 6 }}>(you)</span>}
                  </div>
                </td>
                <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: 13 }}>{m.email || '—'}</td>
                <td style={{ padding: '14px 16px' }}>
                  <Badge bg={roleBadge.bg} color={roleBadge.color}>{roleBadge.label}</Badge>
                </td>
                <td style={{ padding: '14px 16px', color: '#374151', fontSize: 13, textAlign: 'center' }}>
                  {m.clientCount ?? '—'}
                </td>
                <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: 13, whiteSpace: 'nowrap' }}>
                  {formatDate(m.joinedAt || m.acceptedAt)}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {canEditRoles && !isSelf && (
                      <button
                        onClick={() => onEditRole && onEditRole(m)}
                        style={{ background: '#ede9fe', color: '#7c3aed', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        Edit Role
                      </button>
                    )}
                    {canRemove && !isSelf && (
                      <button
                        onClick={() => onRemove && onRemove(m)}
                        style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        Remove
                      </button>
                    )}
                    {(isSelf || (!canEditRoles && !canRemove)) && (
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
