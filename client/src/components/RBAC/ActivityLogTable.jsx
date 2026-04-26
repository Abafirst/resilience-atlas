/**
 * ActivityLogTable.jsx
 * Renders a table of activity log entries.
 *
 * Props:
 *   logs    {Array}  Log entries: { id, timestamp, user, action, resource, details }
 *   loading {bool}
 */

import React from 'react';

function formatDate(ts) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export default function ActivityLogTable({ logs = [], loading }) {
  if (loading) {
    return (
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
        Loading activity logs…
      </div>
    );
  }

  if (!logs.length) {
    return (
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
        No activity logs found.
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
            {['Date / Time', 'User', 'Action', 'Resource', 'Details'].map(h => (
              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {logs.map((log, i) => (
            <tr key={log.id || i} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>
                {formatDate(log.timestamp || log.createdAt)}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{log.userName || log.user || '—'}</div>
                {log.userEmail && <div style={{ fontSize: 12, color: '#9ca3af' }}>{log.userEmail}</div>}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{ display: 'inline-block', background: '#eef2ff', color: '#6366f1', borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
                  {log.action || '—'}
                </span>
              </td>
              <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>
                {log.resource || '—'}
              </td>
              <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280', maxWidth: 240 }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {typeof log.details === 'object'
                    ? JSON.stringify(log.details)
                    : (log.details || '—')}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
