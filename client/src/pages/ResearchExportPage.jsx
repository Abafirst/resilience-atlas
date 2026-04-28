/**
 * ResearchExportPage.jsx
 * Task #23c: Research Export Tools 📑
 *
 * Features:
 *   - De-identified data exports for research
 *   - Aggregate statistics across cohorts
 *   - CSV export with configurable fields
 *   - Statistical analysis ready formats
 *   - IRB-compliant data anonymization
 *   - Longitudinal study dataset generation
 *
 * Route: /iatlas/research/export
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import SiteHeader from '../components/SiteHeader.jsx';
import { apiFetch } from '../lib/apiFetch.js';

// ── Navigation ─────────────────────────────────────────────────────────────────

const NAV = [
  { to: '/iatlas/ml/insights',          label: '🤖 AI Insights',     key: 'ml' },
  { to: '/iatlas/practice/dashboard',   label: '🏠 Practice',        key: 'practice' },
  { to: '/iatlas/practice/clients',     label: '👥 Clients',         key: 'clients' },
  { to: '/iatlas/practice/analytics',   label: '📈 Analytics',       key: 'analytics' },
  { to: '/iatlas/research/export',      label: '📑 Research Export', key: 'research' },
];

// ── Constants ──────────────────────────────────────────────────────────────────

const DIMENSION_KEYS = [
  'agenticGenerative',
  'relationalConnective',
  'somaticRegulative',
  'cognitiveNarrative',
  'emotionalAdaptive',
  'spiritualExistential',
];

const DIMENSION_LABELS = {
  agenticGenerative:    'Agentic-Generative',
  relationalConnective: 'Relational-Connective',
  somaticRegulative:    'Somatic-Regulative',
  cognitiveNarrative:   'Cognitive-Narrative',
  emotionalAdaptive:    'Emotional-Adaptive',
  spiritualExistential: 'Spiritual-Existential',
};

const TABS = [
  { key: 'aggregate',    icon: '📊', label: 'Cohort Statistics' },
  { key: 'csv',          icon: '📄', label: 'CSV Export' },
  { key: 'longitudinal', icon: '📈', label: 'Longitudinal Dataset' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function downloadBlob(content, filename, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function jsonToCsv(dataset, columns) {
  if (!dataset || dataset.length === 0) return '';
  const cols = columns || Object.keys(dataset[0]);
  const header = cols.join(',');
  const rows = dataset.map(row =>
    cols.map(col => {
      const val = row[col];
      if (val == null) return '';
      const s = String(val);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
      return s;
    }).join(',')
  );
  return [header, ...rows].join('\r\n');
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const styles = {
  sectionTitle: { fontSize: '1.05rem', fontWeight: 800, color: '#111827', margin: '0 0 .35rem' },
  sectionDesc:  { fontSize: '.85rem', color: '#6b7280', margin: '0 0 1.1rem' },
  controlRow:   { display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap', marginBottom: '.75rem' },
  label:        { fontSize: '.84rem', fontWeight: 600, color: '#374151' },
  select: {
    padding: '.45rem .75rem', borderRadius: 8, border: '1.5px solid #d1d5db',
    fontSize: '.85rem', color: '#374151', background: '#fff', outline: 'none',
  },
  btn: {
    padding: '.5rem 1.1rem', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontWeight: 700, fontSize: '.84rem', transition: 'opacity .15s',
  },
  btnPrimary: { background: '#4f46e5', color: '#fff' },
  btnSuccess: { background: '#059669', color: '#fff' },
  errorBox: {
    background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8,
    padding: '.65rem .9rem', color: '#991b1b', fontSize: '.85rem', marginBottom: '1rem',
  },
  infoBox: {
    background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8,
    padding: '.65rem .9rem', color: '#1e40af', fontSize: '.82rem', marginBottom: '1rem',
  },
  irbBox: {
    background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 8,
    padding: '.65rem .9rem', color: '#065f46', fontSize: '.8rem', marginBottom: '1rem',
  },
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: '.6rem', padding: '2.5rem 1.5rem', background: '#f8fafc',
    border: '1.5px dashed #d1d5db', borderRadius: 12, textAlign: 'center',
    color: '#6b7280', fontSize: '.88rem',
  },
  kpiCard: {
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
    padding: '.9rem 1rem', display: 'flex', flexDirection: 'column', gap: '.15rem',
  },
  kpiLabel: { fontSize: '.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' },
  kpiValue: { fontSize: '1.15rem', fontWeight: 800 },
  checkboxRow: { display: 'flex', alignItems: 'center', gap: '.45rem', fontSize: '.85rem', color: '#374151' },
};

// ── Tab: Cohort Statistics ─────────────────────────────────────────────────────

function AggregateStatsTab({ getTokenFn }) {
  const [loading, setLoading]   = useState(false);
  const [data, setData]         = useState(null);
  const [error, setError]       = useState(null);

  const handleFetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/research/aggregate-stats', {}, getTokenFn);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setData(await res.json());
    } catch (err) {
      setError(err.message || 'Failed to load aggregate statistics.');
    } finally {
      setLoading(false);
    }
  }, [getTokenFn]);

  // Auto-load on mount.
  useEffect(() => { handleFetch(); }, [handleFetch]);

  return (
    <div>
      <h3 style={styles.sectionTitle}>📊 Cohort Aggregate Statistics</h3>
      <p style={styles.sectionDesc}>
        Population-level statistics across all active clients. No individual-level data is shown —
        only aggregate means, standard deviations, and distributions suitable for IRB reporting.
      </p>

      <div style={styles.irbBox}>
        🔒 <strong>IRB Compliant:</strong> All data is aggregated. No individual client identifiers, names, or dates of birth are included.
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {loading && (
        <div style={styles.emptyState}>
          <span style={{ fontSize: '2rem' }}>📊</span>
          <p>Loading cohort statistics…</p>
        </div>
      )}

      {data && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Summary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
            <div style={{ ...styles.kpiCard, borderColor: '#bfdbfe', background: '#eff6ff' }}>
              <span style={styles.kpiLabel}>Cohort Size</span>
              <span style={{ ...styles.kpiValue, color: '#1d4ed8' }}>{data.cohortSize}</span>
              <span style={{ fontSize: '.73rem', color: '#6b7280' }}>active clients</span>
            </div>
            <div style={styles.kpiCard}>
              <span style={styles.kpiLabel}>Snapshots</span>
              <span style={{ ...styles.kpiValue, color: '#374151' }}>{data.snapshotsAvailable || 0}</span>
              <span style={{ fontSize: '.73rem', color: '#6b7280' }}>assessment records</span>
            </div>
            <div style={styles.kpiCard}>
              <span style={styles.kpiLabel}>Data As Of</span>
              <span style={{ fontSize: '.88rem', fontWeight: 700, color: '#374151' }}>
                {data.dataAsOf ? new Date(data.dataAsOf).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>

          {/* Dimension statistics table */}
          <div>
            <h4 style={{ fontSize: '.9rem', fontWeight: 700, color: '#374151', margin: '0 0 .75rem' }}>
              Dimension Score Statistics (latest snapshot per client)
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.83rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Dimension', 'N', 'Mean', 'Std Dev', 'Min', 'Max'].map(h => (
                      <th key={h} style={{
                        padding: '.55rem .85rem', textAlign: 'left', fontWeight: 700,
                        color: '#374151', borderBottom: '2px solid #e5e7eb',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DIMENSION_KEYS.map((key, i) => {
                    const s = data.dimensionStats?.[key];
                    if (!s) return null;
                    return (
                      <tr key={key} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                        <td style={{ padding: '.5rem .85rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #f1f5f9' }}>
                          {DIMENSION_LABELS[key]}
                        </td>
                        <td style={{ padding: '.5rem .85rem', color: '#6b7280', borderBottom: '1px solid #f1f5f9' }}>{s.n}</td>
                        <td style={{ padding: '.5rem .85rem', fontWeight: 700, color: '#111827', borderBottom: '1px solid #f1f5f9' }}>
                          {s.mean != null ? s.mean : '—'}
                        </td>
                        <td style={{ padding: '.5rem .85rem', color: '#6b7280', borderBottom: '1px solid #f1f5f9' }}>
                          {s.stdDev != null ? s.stdDev : '—'}
                        </td>
                        <td style={{ padding: '.5rem .85rem', color: '#6b7280', borderBottom: '1px solid #f1f5f9' }}>{s.min ?? '—'}</td>
                        <td style={{ padding: '.5rem .85rem', color: '#6b7280', borderBottom: '1px solid #f1f5f9' }}>{s.max ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Age group distribution */}
          {data.ageGroupDistribution && Object.keys(data.ageGroupDistribution).length > 0 && (
            <div>
              <h4 style={{ fontSize: '.9rem', fontWeight: 700, color: '#374151', margin: '0 0 .75rem' }}>
                Age-Group Distribution
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
                {Object.entries(data.ageGroupDistribution)
                  .sort(([a], [b]) => {
                    const aNum = parseInt(a.split('-')[0]) || 0;
                    const bNum = parseInt(b.split('-')[0]) || 0;
                    return aNum - bNum;
                  })
                  .map(([bucket, count]) => (
                    <div key={bucket} style={{
                      background: '#eef2ff', borderRadius: 8,
                      padding: '.4rem .8rem', fontSize: '.82rem',
                    }}>
                      <strong style={{ color: '#4f46e5' }}>{bucket}</strong>
                      <span style={{ color: '#6b7280', marginLeft: '.35rem' }}>({count})</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div style={styles.infoBox}>
            ℹ️ {data.irbNote || 'Data is aggregated and de-identified.'}
          </div>

          <div style={styles.controlRow}>
            <button
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={handleFetch}
              disabled={loading}
            >
              🔄 Refresh Statistics
            </button>
            <button
              style={{ ...styles.btn, ...styles.btnSuccess }}
              onClick={() => {
                const json = JSON.stringify(data, null, 2);
                downloadBlob(json, 'cohort-aggregate-stats.json', 'application/json');
              }}
            >
              ⬇️ Download JSON
            </button>
          </div>
        </div>
      )}

      {!data && !loading && !error && (
        <div style={styles.emptyState}>
          <span style={{ fontSize: '2rem' }}>📊</span>
          <p>No data available. Add clients and record progress snapshots to generate cohort statistics.</p>
        </div>
      )}
    </div>
  );
}

// ── Tab: CSV Export ────────────────────────────────────────────────────────────

function CsvExportTab({ getTokenFn }) {
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [success, setSuccess]       = useState(null);
  const [selectedFields, setFields] = useState(new Set(DIMENSION_KEYS));
  const [includeAge, setIncludeAge] = useState(true);
  const [snapshotsMax, setSnapMax]  = useState(1);

  const toggleField = (key) => {
    setFields(prev => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  };

  const handleExport = useCallback(async () => {
    if (selectedFields.size === 0) {
      setError('Please select at least one dimension field.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await apiFetch('/api/research/csv', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          fields:       Array.from(selectedFields),
          includeAge,
          snapshotsMax: Number(snapshotsMax),
        }),
      }, getTokenFn);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const data = await res.json();

      if (!data.csv) {
        setError(data.message || 'No data available for export.');
        return;
      }

      const filename = `research-export-${new Date().toISOString().slice(0, 10)}.csv`;
      downloadBlob(data.csv, filename);
      setSuccess(`✅ Exported ${data.rowCount} rows for ${data.clientCount} clients.`);
    } catch (err) {
      setError(err.message || 'Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedFields, includeAge, snapshotsMax, getTokenFn]);

  return (
    <div>
      <h3 style={styles.sectionTitle}>📄 De-Identified CSV Export</h3>
      <p style={styles.sectionDesc}>
        Generate a CSV file of client dimension scores with all direct identifiers removed.
        Suitable for submission to IRB and use with statistical tools (R, SPSS, STATA, Python).
      </p>

      <div style={styles.irbBox}>
        🔒 <strong>IRB-Compliant Anonymization:</strong> Client names and contact details are removed.
        Dates of birth are replaced with age-group buckets. Client IDs are replaced with pseudonymous research codes (R001, R002, …).
      </div>

      {/* Field selection */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ ...styles.label, marginBottom: '.5rem' }}>Dimensions to include:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem' }}>
          {DIMENSION_KEYS.map(key => (
            <label key={key} style={{ ...styles.checkboxRow, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedFields.has(key)}
                onChange={() => toggleField(key)}
                style={{ accentColor: '#4f46e5' }}
              />
              {DIMENSION_LABELS[key]}
            </label>
          ))}
        </div>
      </div>

      {/* Options */}
      <div style={{ ...styles.controlRow, marginBottom: '1.25rem' }}>
        <label style={{ ...styles.checkboxRow, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={includeAge}
            onChange={e => setIncludeAge(e.target.checked)}
            style={{ accentColor: '#4f46e5' }}
          />
          Include age-group column
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <span style={styles.label}>Snapshots per client:</span>
          <select
            style={{ ...styles.select, width: 140 }}
            value={snapshotsMax}
            onChange={e => setSnapMax(Number(e.target.value))}
          >
            <option value={1}>Latest only</option>
            <option value={3}>Last 3</option>
            <option value={6}>Last 6</option>
            <option value={0}>All snapshots</option>
          </select>
        </div>
      </div>

      {error  && <div style={styles.errorBox}>{error}</div>}
      {success && (
        <div style={{ ...styles.irbBox, marginBottom: '1rem' }}>
          {success}
        </div>
      )}

      <div style={styles.controlRow}>
        <button
          style={{ ...styles.btn, ...styles.btnSuccess, opacity: loading ? .6 : 1 }}
          onClick={handleExport}
          disabled={loading || selectedFields.size === 0}
        >
          {loading ? '⏳ Generating…' : '⬇️ Download CSV'}
        </button>
      </div>

      <div style={{ fontSize: '.8rem', color: '#9ca3af', marginTop: '.75rem' }}>
        Exported files contain only: pseudonymous research IDs, {includeAge ? 'age-group bucket, ' : ''}snapshot dates, data source, and selected dimension scores.
      </div>
    </div>
  );
}

// ── Tab: Longitudinal Dataset ──────────────────────────────────────────────────

function LongitudinalTab({ getTokenFn }) {
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [success, setSuccess]         = useState(null);
  const [dataset, setDataset]         = useState(null);
  const [startDate, setStartDate]     = useState('');
  const [endDate, setEndDate]         = useState('');
  const [minSnapshots, setMinSnaps]   = useState(2);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const body = { minSnapshots: Number(minSnapshots) };
      if (startDate) body.startDate = startDate;
      if (endDate)   body.endDate   = endDate;

      const res = await apiFetch('/api/research/longitudinal', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      }, getTokenFn);

      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setDataset(data);
      setSuccess(`✅ ${data.rowCount} observations for ${data.clientCount} clients.`);
    } catch (err) {
      setError(err.message || 'Failed to generate longitudinal dataset.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, minSnapshots, getTokenFn]);

  const handleDownloadCsv = () => {
    if (!dataset?.dataset) return;
    const csv = jsonToCsv(dataset.dataset, dataset.columns);
    downloadBlob(csv, `longitudinal-dataset-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleDownloadJson = () => {
    if (!dataset) return;
    downloadBlob(JSON.stringify(dataset, null, 2), `longitudinal-dataset-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  };

  return (
    <div>
      <h3 style={styles.sectionTitle}>📈 Longitudinal Study Dataset</h3>
      <p style={styles.sectionDesc}>
        Generate a repeated-measures dataset with one row per (client, assessment-wave) — ideal for
        mixed-effects models, growth curve analysis, and IRB-submitted longitudinal studies.
        Includes change-from-baseline columns for each dimension.
      </p>

      <div style={styles.irbBox}>
        🔒 <strong>IRB-Compliant:</strong> All direct identifiers stripped. Change-from-baseline columns included for
        within-subject analysis without exposing individual baselines in isolation.
      </div>

      {/* Filters */}
      <div style={{ ...styles.controlRow, gap: '1rem', alignItems: 'flex-end', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
          <span style={styles.label}>Start date</span>
          <input
            type="date"
            style={styles.select}
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
          <span style={styles.label}>End date</span>
          <input
            type="date"
            style={styles.select}
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
          <span style={styles.label}>Min. snapshots per client</span>
          <select
            style={{ ...styles.select, width: 120 }}
            value={minSnapshots}
            onChange={e => setMinSnaps(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <button
          style={{ ...styles.btn, ...styles.btnPrimary, opacity: loading ? .6 : 1 }}
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? '⏳ Generating…' : '🔬 Generate Dataset'}
        </button>
      </div>

      {error   && <div style={styles.errorBox}>{error}</div>}
      {success && <div style={styles.irbBox}>{success}</div>}

      {dataset && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '.5rem' }}>
          {/* Preview */}
          <div>
            <h4 style={{ fontSize: '.88rem', fontWeight: 700, color: '#374151', margin: '0 0 .6rem' }}>
              Preview (first 5 rows)
            </h4>
            <div style={{ overflowX: 'auto', fontSize: '.78rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {(dataset.columns || []).slice(0, 10).map(col => (
                      <th key={col} style={{
                        padding: '.4rem .6rem', textAlign: 'left', fontWeight: 700,
                        color: '#374151', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap',
                      }}>{col}</th>
                    ))}
                    {(dataset.columns || []).length > 10 && (
                      <th style={{ padding: '.4rem .6rem', color: '#9ca3af' }}>…</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(dataset.dataset || []).slice(0, 5).map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                      {(dataset.columns || []).slice(0, 10).map(col => (
                        <td key={col} style={{
                          padding: '.4rem .6rem', color: '#374151',
                          borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap',
                        }}>
                          {row[col] != null ? String(row[col]) : '—'}
                        </td>
                      ))}
                      {(dataset.columns || []).length > 10 && (
                        <td style={{ padding: '.4rem .6rem', color: '#9ca3af' }}>…</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Download buttons */}
          <div style={styles.controlRow}>
            <button
              style={{ ...styles.btn, ...styles.btnSuccess }}
              onClick={handleDownloadCsv}
            >
              ⬇️ Download CSV
            </button>
            <button
              style={{ ...styles.btn, background: '#0891b2', color: '#fff' }}
              onClick={handleDownloadJson}
            >
              ⬇️ Download JSON
            </button>
          </div>

          {dataset.irbStatement && (
            <div style={styles.irbBox}>{dataset.irbStatement}</div>
          )}
        </div>
      )}

      {!dataset && !loading && !error && (
        <div style={styles.emptyState}>
          <span style={{ fontSize: '2rem' }}>📈</span>
          <p>Set filters and click <strong>Generate Dataset</strong> to create a longitudinal study dataset for your client cohort.</p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ResearchExportPage() {
  const { getAccessTokenSilently } = useAuth0();
  const [activeTab, setActiveTab] = useState('aggregate');

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      <SiteHeader />

      {/* Top Nav */}
      <nav style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '.5rem 1.5rem', display: 'flex', gap: '.25rem', flexWrap: 'wrap',
      }}>
        {NAV.map(n => (
          <Link
            key={n.key}
            to={n.to}
            style={{
              padding: '.4rem .85rem', borderRadius: 8, textDecoration: 'none',
              fontSize: '.83rem', fontWeight: 600,
              background: n.key === 'research' ? '#f0fdf4' : 'transparent',
              color: n.key === 'research' ? '#059669' : '#6b7280',
            }}
          >
            {n.label}
          </Link>
        ))}
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Page header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111827', margin: 0 }}>
            📑 Research Export Tools
          </h1>
          <p style={{ fontSize: '.85rem', color: '#6b7280', margin: '.3rem 0 0' }}>
            Clinical research and evidence-based practice — de-identified, IRB-compliant data exports
          </p>
        </div>

        {/* Compliance banner */}
        <div style={{
          background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12,
          padding: '.75rem 1.1rem', marginBottom: '1.25rem',
          display: 'flex', alignItems: 'flex-start', gap: '.75rem', fontSize: '.82rem', color: '#92400e',
        }}>
          <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>⚖️</span>
          <div>
            <strong>IRB & Privacy Compliance:</strong> All exports from this tool are de-identified in
            accordance with the HIPAA Safe Harbor method. Direct identifiers (names, contact details, dates of birth)
            are removed or replaced. It is the responsibility of the researcher to obtain appropriate IRB approval
            before using exported data in research publications.
          </div>
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: '.3rem', marginBottom: '1rem',
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
          padding: '.4rem', flexWrap: 'wrap',
        }}>
          {TABS.map(t => (
            <button
              key={t.key}
              style={{
                flex: '1 1 auto', padding: '.55rem .75rem', borderRadius: 8, border: 'none',
                cursor: 'pointer', fontWeight: 700, fontSize: '.82rem',
                background: activeTab === t.key ? '#059669' : 'transparent',
                color: activeTab === t.key ? '#fff' : '#6b7280',
                transition: 'all .15s',
              }}
              onClick={() => setActiveTab(t.key)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
          padding: '1.5rem',
        }}>
          {activeTab === 'aggregate'    && <AggregateStatsTab    getTokenFn={getAccessTokenSilently} />}
          {activeTab === 'csv'          && <CsvExportTab         getTokenFn={getAccessTokenSilently} />}
          {activeTab === 'longitudinal' && <LongitudinalTab      getTokenFn={getAccessTokenSilently} />}
        </div>

        {/* Feature list footer */}
        <div style={{
          marginTop: '1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0',
          borderRadius: 10, padding: '1rem 1.25rem',
        }}>
          <h4 style={{ fontSize: '.85rem', fontWeight: 700, color: '#374151', margin: '0 0 .6rem' }}>
            📑 Task #23c — Research Export Features
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem 2rem', fontSize: '.8rem', color: '#6b7280' }}>
            <span>✅ De-identified data exports for research</span>
            <span>✅ Aggregate statistics across cohorts</span>
            <span>✅ CSV export with configurable fields</span>
            <span>✅ Statistical analysis ready formats</span>
            <span>✅ IRB-compliant data anonymization</span>
            <span>✅ Longitudinal study dataset generation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
