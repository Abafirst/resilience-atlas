/**
 * ActivityLogsPage.jsx
 * Displays paginated, filterable activity logs for a practice.
 * Route: /activity-logs
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import SiteHeader from '../components/SiteHeader.jsx';
import ActivityLogTable from '../components/RBAC/ActivityLogTable.jsx';
import ActivityLogFilters from '../components/RBAC/ActivityLogFilters.jsx';
import { apiUrl } from '../api/baseUrl.js';

const PAGE_SIZE = 25;

export default function ActivityLogsPage() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [page, setPage]         = useState(1);
  const [hasMore, setHasMore]   = useState(false);
  const [filters, setFilters]   = useState({ startDate: '', endDate: '', action: '', resourceType: '' });

  // Resolve practiceId from query param or localStorage
  const practiceId = (() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('practiceId') || localStorage.getItem('practiceId') || '';
    }
    return '';
  })();

  const fetchLogs = useCallback(async (currentPage, currentFilters) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessTokenSilently();
      const params = new URLSearchParams();
      if (practiceId) params.set('practiceId', practiceId);
      if (currentFilters.startDate)    params.set('startDate', currentFilters.startDate);
      if (currentFilters.endDate)      params.set('endDate', currentFilters.endDate);
      if (currentFilters.action)       params.set('action', currentFilters.action);
      if (currentFilters.resourceType) params.set('resourceType', currentFilters.resourceType);
      params.set('page', String(currentPage));
      params.set('limit', String(PAGE_SIZE));

      const res = await fetch(apiUrl(`/api/activity-logs?${params.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load activity logs');
      const data = await res.json();
      const items = Array.isArray(data) ? data : (data.logs || data.items || []);
      setLogs(items);
      setHasMore(items.length === PAGE_SIZE);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently, practiceId]);

  useEffect(() => {
    if (isAuthenticated) fetchLogs(page, filters);
  }, [isAuthenticated, page, filters, fetchLogs]);

  function handleFiltersChange(newFilters) {
    setFilters(newFilters);
    setPage(1);
  }

  function handleExport() {
    const json = JSON.stringify(logs, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <SiteHeader activePage="iatlas" />
      <main style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>Activity Logs</h1>
              <p style={{ color: '#6b7280', fontSize: 14 }}>Audit trail of actions taken within your practice.</p>
            </div>
            <button
              onClick={handleExport}
              disabled={!logs.length}
              style={{ background: logs.length ? '#6366f1' : '#e5e7eb', color: logs.length ? '#fff' : '#9ca3af', border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: logs.length ? 'pointer' : 'not-allowed' }}
            >
              Export JSON
            </button>
          </div>

          {/* Filters */}
          <div style={{ marginBottom: 20 }}>
            <ActivityLogFilters filters={filters} onChange={handleFiltersChange} />
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 14 }}>
              {error}
            </div>
          )}

          {/* Table */}
          <ActivityLogTable logs={logs} loading={loading} />

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              style={{ background: page === 1 ? '#f3f4f6' : '#fff', color: page === 1 ? '#9ca3af' : '#374151', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
            >
              ← Previous
            </button>
            <span style={{ color: '#6b7280', fontSize: 14 }}>Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore || loading}
              style={{ background: !hasMore ? '#f3f4f6' : '#fff', color: !hasMore ? '#9ca3af' : '#374151', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: !hasMore ? 'not-allowed' : 'pointer' }}
            >
              Next →
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
