import React, { useState } from 'react';

/**
 * DataExportPanel — reusable component for downloading team data exports.
 * Props:
 *  - orgId: the organization/team ID to scope downloads
 *  - token: auth token for API calls (optional; omit for public endpoints)
 */
export default function DataExportPanel({ orgId, token }) {
  const [downloading, setDownloading] = useState(null);
  const [errors, setErrors] = useState({});
  async function handleDownload(type) {
    setDownloading(type);
    setErrors(prev => ({ ...prev, [type]: null }));
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const endpoints = {
        csv:       `/api/team-analytics/${orgId}/export/csv`,
        members:   `/api/team-analytics/${orgId}/export/members`,
        pdf:       `/api/team-analytics/${orgId}/export/pdf`,
        resources: `/api/teams/resources/export`,
      };

      const res = await fetch(endpoints[type], { headers });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filenames = {
        csv:       'team-results.csv',
        members:   'team-members.csv',
        pdf:       'team-report.pdf',
        resources: 'facilitation-resources.zip',
      };
      a.download = filenames[type] || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setErrors(prev => ({ ...prev, [type]: err.message || 'Download failed' }));
    } finally {
      setDownloading(null);
    }
  }

  const exports = [
    {
      key: 'csv',
      icon: '📊',
      title: 'Assessment Results',
      desc: 'All team member scores and dimension breakdowns',
      format: 'CSV',
      color: '#22c55e',
    },
    {
      key: 'members',
      icon: '👥',
      title: 'Member List',
      desc: 'Team member names, emails, and status',
      format: 'CSV',
      color: '#3b82f6',
    },
    {
      key: 'pdf',
      icon: '📄',
      title: 'Team Report',
      desc: 'Full team resilience report with charts',
      format: 'PDF',
      color: '#8b5cf6',
    },
    {
      key: 'resources',
      icon: '📦',
      title: 'Facilitation Resources',
      desc: 'Workshop guides, templates, and activity cards',
      format: 'ZIP',
      color: '#f97316',
    },
  ];

  return (
    <section aria-labelledby="data-export-heading">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2
          id="data-export-heading"
          style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: '0 0 .35rem' }}
        >
          Download Your Data
        </h2>
        <p style={{ fontSize: '.9rem', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
          All data exports are self-service. Download and manage everything on your end.{' '}
          <a href="/privacy" style={{ color: '#4F46E5', fontWeight: 600 }}>Learn about our data model</a>
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1rem',
        }}
        role="list"
        aria-label="Data export options"
      >
        {exports.map(exp => (
          <div
            key={exp.key}
            role="listitem"
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderTop: `3px solid ${exp.color}`,
              borderRadius: 12,
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '.75rem',
              boxShadow: '0 2px 6px rgba(0,0,0,.04)',
            }}
          >
            <div style={{ fontSize: '2rem', lineHeight: 1 }} aria-hidden="true">{exp.icon}</div>
            <div>
              <h3 style={{ fontSize: '.95rem', fontWeight: 700, color: '#0f172a', margin: '0 0 .2rem' }}>
                {exp.title}
              </h3>
              <p style={{ fontSize: '.82rem', color: '#64748b', margin: 0, lineHeight: 1.55 }}>{exp.desc}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem', marginTop: 'auto' }}>
              <span
                style={{
                  fontSize: '.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '.05em',
                  color: exp.color,
                  background: `${exp.color}15`,
                  borderRadius: 6,
                  padding: '.2rem .55rem',
                  border: `1px solid ${exp.color}30`,
                }}
              >
                {exp.format}
              </span>
              <button
                type="button"
                onClick={() => handleDownload(exp.key)}
                disabled={!!downloading}
                aria-label={`Download ${exp.title} as ${exp.format}`}
                style={{
                  background: downloading === exp.key ? '#e2e8f0' : `linear-gradient(135deg,${exp.color},${exp.color}cc)`,
                  color: downloading === exp.key ? '#64748b' : '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '.5rem 1rem',
                  fontSize: '.85rem',
                  fontWeight: 700,
                  cursor: downloading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '.35rem',
                  transition: 'opacity .15s',
                  opacity: downloading && downloading !== exp.key ? 0.6 : 1,
                }}
              >
                {downloading === exp.key ? (
                  <>
                    <span aria-hidden="true" style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                    Downloading…
                  </>
                ) : (
                  <>↓ Download</>
                )}
              </button>
            </div>
            {errors[exp.key] && (
              <p style={{ fontSize: '.8rem', color: '#dc2626', margin: 0 }} role="alert">
                {errors[exp.key]}
              </p>
            )}
          </div>
        ))}
      </div>

      <p style={{ fontSize: '.8rem', color: '#94a3b8', marginTop: '1rem', lineHeight: 1.6 }}>
        Need help with data exports?{' '}
        <a href="/privacy#enterprise-heading" style={{ color: '#4F46E5' }}>Enterprise support available</a>{' '}
        for access issues. All other tiers are fully self-service.
      </p>
    </section>
  );
}
