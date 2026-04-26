/**
 * CaseAssignmentManager.jsx
 * Shows available child profiles with checkboxes to assign/unassign
 * to the selected practitioner.
 *
 * Props:
 *   practitioner     {object}  The practitioner being edited
 *   assignedCases    {Array}   Array of childProfileIds currently assigned
 *   availableChildren {Array}  Full list of child profile objects
 *   onAssign         {fn}      Called with (childId)
 *   onUnassign       {fn}      Called with (assignmentId)
 *   loading          {bool}
 */

import React from 'react';

export default function CaseAssignmentManager({ practitioner, assignedCases = [], availableChildren = [], onAssign, onUnassign, loading }) {
  if (!practitioner) {
    return (
      <div style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>
        Select a practitioner to manage case assignments.
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '1.5rem' }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>
        Cases for {practitioner.name || practitioner.fullName || practitioner.email}
      </h3>
      <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 20 }}>
        {assignedCases.length} case{assignedCases.length !== 1 ? 's' : ''} assigned
      </p>

      {loading && (
        <div style={{ color: '#9ca3af', fontSize: 14, marginBottom: 16 }}>Updating…</div>
      )}

      {!availableChildren.length && (
        <div style={{ color: '#9ca3af', fontSize: 14 }}>No child profiles found.</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {availableChildren.map(child => {
          const assignment = assignedCases.find(a =>
            (typeof a === 'object' ? a.childProfileId : a) === (child.id || child._id)
          );
          const isAssigned = !!assignment;
          const assignmentId = assignment && typeof assignment === 'object' ? assignment.id || assignment._id : assignment;

          return (
            <label
              key={child.id || child._id}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, border: `1px solid ${isAssigned ? '#c7d2fe' : '#e5e7eb'}`, background: isAssigned ? '#eef2ff' : '#fafafa', cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                checked={isAssigned}
                disabled={loading}
                onChange={() => {
                  if (isAssigned) {
                    onUnassign && onUnassign(assignmentId);
                  } else {
                    onAssign && onAssign(child.id || child._id);
                  }
                }}
                style={{ width: 16, height: 16, accentColor: '#6366f1', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>
                  {child.name || child.childName || child.firstName || '—'}
                </div>
                {child.dateOfBirth && (
                  <div style={{ color: '#9ca3af', fontSize: 12 }}>DOB: {child.dateOfBirth}</div>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
