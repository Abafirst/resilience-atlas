/**
 * ActivityLogFilters.jsx
 * Filter controls for the activity log: date range, action, resource type.
 *
 * Props:
 *   filters   {object}  { startDate, endDate, action, resourceType }
 *   onChange  {fn}      Called with updated filters object
 */

import React from 'react';

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'view', label: 'View' },
  { value: 'invite', label: 'Invite' },
  { value: 'assign', label: 'Assign' },
  { value: 'export', label: 'Export' },
];

const RESOURCE_OPTIONS = [
  { value: '', label: 'All Resources' },
  { value: 'children', label: 'Children' },
  { value: 'practitioners', label: 'Practitioners' },
  { value: 'assessments', label: 'Assessments' },
  { value: 'protocols', label: 'Protocols' },
  { value: 'practice_settings', label: 'Practice Settings' },
  { value: 'analytics', label: 'Analytics' },
];

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 };
const inputStyle = { padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, background: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box' };

export default function ActivityLogFilters({ filters = {}, onChange }) {
  function update(key, value) {
    onChange && onChange({ ...filters, [key]: value });
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '1.25rem 1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
      <div style={{ flex: '1 1 160px', minWidth: 140 }}>
        <label style={labelStyle}>Start Date</label>
        <input
          type="date"
          value={filters.startDate || ''}
          onChange={e => update('startDate', e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={{ flex: '1 1 160px', minWidth: 140 }}>
        <label style={labelStyle}>End Date</label>
        <input
          type="date"
          value={filters.endDate || ''}
          onChange={e => update('endDate', e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={{ flex: '1 1 160px', minWidth: 140 }}>
        <label style={labelStyle}>Action</label>
        <select
          value={filters.action || ''}
          onChange={e => update('action', e.target.value)}
          style={inputStyle}
        >
          {ACTION_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div style={{ flex: '1 1 160px', minWidth: 140 }}>
        <label style={labelStyle}>Resource Type</label>
        <select
          value={filters.resourceType || ''}
          onChange={e => update('resourceType', e.target.value)}
          style={inputStyle}
        >
          {RESOURCE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div style={{ flex: '0 0 auto' }}>
        <button
          onClick={() => onChange && onChange({ startDate: '', endDate: '', action: '', resourceType: '' })}
          style={{ background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
