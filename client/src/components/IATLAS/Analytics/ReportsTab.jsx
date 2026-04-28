/**
 * ReportsTab.jsx
 * Reports tab for the IATLAS Analytics Dashboard.
 *
 * Provides:
 *  - CSV export of raw activity data
 *  - PDF report generation (print-friendly layout)
 *  - Summary report with key metrics
 */

import React, { useState, useCallback, useMemo } from 'react';
import PrintExportButton from '../PrintExportButton.jsx';
import {
  loadProfileProgress,
  computeOverviewMetrics,
  calculateLearningVelocity,
  rangeToStartDate,
  getActivitiesInRange,
  DIMENSION_LABELS,
} from '../../../utils/analyticsHelpers.js';

const STYLES = `
.rt-root {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.rt-section {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
}
[data-theme="dark"] .rt-section {
  background: #1e293b;
  border-color: #334155;
}
.rt-section-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 .5rem;
}
[data-theme="dark"] .rt-section-title { color: #f1f5f9; }
.rt-section-desc {
  font-size: .85rem;
  color: #64748b;
  margin: 0 0 1rem;
}
[data-theme="dark"] .rt-section-desc { color: #94a3b8; }
.rt-btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: .6rem;
}
.rt-btn {
  display: flex;
  align-items: center;
  gap: .4rem;
  padding: .55rem 1.1rem;
  border-radius: 10px;
  border: 1.5px solid #e2e8f0;
  background: #fff;
  font-size: .85rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: background .15s, color .15s, border-color .15s, box-shadow .15s;
}
.rt-btn:hover {
  background: #f1f5f9;
  border-color: #c7d2fe;
  color: #4f46e5;
  box-shadow: 0 2px 8px rgba(99,102,241,.1);
}
.rt-btn:active { transform: scale(.98); }
.rt-btn-primary {
  background: #6366f1;
  border-color: #6366f1;
  color: #fff;
}
.rt-btn-primary:hover {
  background: #4f46e5;
  border-color: #4f46e5;
  color: #fff;
}
[data-theme="dark"] .rt-btn {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}
[data-theme="dark"] .rt-btn:hover {
  background: #334155;
  color: #f1f5f9;
}
.rt-toast {
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: .6rem 1rem;
  background: #d1fae5;
  border: 1px solid #a7f3d0;
  border-radius: 10px;
  font-size: .85rem;
  color: #065f46;
  margin-top: .75rem;
}
[data-theme="dark"] .rt-toast {
  background: #064e3b;
  border-color: #065f46;
  color: #a7f3d0;
}
.rt-preview {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  margin-top: .75rem;
  font-size: .8rem;
  color: #475569;
  font-family: monospace;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
}
[data-theme="dark"] .rt-preview {
  background: #0f172a;
  border-color: #334155;
  color: #94a3b8;
}
`;

// ── CSV builder ───────────────────────────────────────────────────────────────

function buildCsvRows(profiles, rangeKey) {
  const startDate = rangeToStartDate(rangeKey);
  const rows = [['Child Name', 'Activity ID', 'Dimension', 'Completed At', 'Stars']];

  for (const profile of profiles) {
    const acts = getActivitiesInRange(profile.id, startDate);
    for (const act of acts) {
      rows.push([
        profile.name,
        act.id,
        DIMENSION_LABELS[act.dimension] || act.dimension,
        act.completedAt.toISOString(),
        act.stars,
      ]);
    }
  }
  return rows;
}

function downloadCsv(rows, filename) {
  const csv     = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob    = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url     = URL.createObjectURL(blob);
  const link    = document.createElement('a');
  link.href     = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── PDF / print builder ───────────────────────────────────────────────────────

function buildPrintReport(profiles, rangeKey, metrics) {
  const lines = [
    '=== IATLAS Analytics Report ===',
    `Generated: ${new Date().toLocaleString()}`,
    `Date Range: ${rangeKey}`,
    '',
    '--- Overview ---',
    `Total Profiles:     ${metrics.totalFamilies}`,
    `Active Children:    ${metrics.activeChildren}`,
    `Activities (range): ${metrics.totalActivities}`,
    `Total Stars:        ${metrics.totalStars}`,
    '',
    '--- Per-Child Summary ---',
  ];

  for (const profile of profiles) {
    const velocity = calculateLearningVelocity(profile.id, rangeKey);
    const acts     = getActivitiesInRange(profile.id, rangeToStartDate(rangeKey));
    lines.push(`  ${profile.name}: ${acts.length} activities, ${velocity} act/wk`);
  }

  if (profiles.length === 0) {
    lines.push('  No child profiles found.');
  }

  return lines.join('\n');
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReportsTab({ profiles = [], rangeKey = '30d' }) {
  const [csvToast,   setCsvToast]   = useState(false);
  const [printToast, setPrintToast] = useState(false);
  const [preview,    setPreview]    = useState('');

  const metrics = computeOverviewMetrics(profiles, rangeKey);

  // Build analytics export data for the PrintPreviewModal
  const analyticsExportData = useMemo(() => {
    const startDate = rangeToStartDate(rangeKey);
    const profilesWithStats = profiles.map(p => {
      const acts     = getActivitiesInRange(p.id, startDate);
      const velocity = calculateLearningVelocity(p.id, rangeKey);
      return { name: p.name, activityCount: acts.length, velocity };
    });
    return { metrics, profiles: profilesWithStats, rangeKey };
  }, [profiles, rangeKey, metrics]);

  const handleExportCsv = useCallback(() => {
    const rows = buildCsvRows(profiles, rangeKey);
    if (rows.length <= 1) {
      setPreview('No activity data found in the selected range. Complete some activities first.');
      return;
    }
    downloadCsv(rows, `iatlas-analytics-${rangeKey}-${Date.now()}.csv`);
    setCsvToast(true);
    setTimeout(() => setCsvToast(false), 3000);
  }, [profiles, rangeKey]);

  const handlePreviewReport = useCallback(() => {
    const text = buildPrintReport(profiles, rangeKey, metrics);
    setPreview(text);
  }, [profiles, rangeKey, metrics]);

  const handlePrintReport = useCallback(() => {
    const text = buildPrintReport(profiles, rangeKey, metrics);
    const win  = window.open('', '_blank', 'width=800,height=700');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html>
      <head>
        <title>IATLAS Analytics Report</title>
        <style>
          body { font-family: Georgia, serif; padding: 2rem; max-width: 680px; margin: 0 auto; color: #0f172a; }
          pre { white-space: pre-wrap; font-size: .95rem; line-height: 1.7; }
          h1  { font-size: 1.5rem; border-bottom: 2px solid #6366f1; padding-bottom: .5rem; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>IATLAS Analytics Report</h1>
        <pre>${text}</pre>
        <button onclick="window.print()" style="margin-top:1rem;padding:.5rem 1rem;background:#6366f1;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:1rem;">
          Print / Save as PDF
        </button>
      </body>
      </html>
    `);
    win.document.close();
    setPrintToast(true);
    setTimeout(() => setPrintToast(false), 3000);
  }, [profiles, rangeKey, metrics]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="rt-root">

        {/* CSV Export */}
        <div className="rt-section" role="region" aria-label="CSV Export">
          <h3 className="rt-section-title"><img src="/icons/journal.svg" aria-hidden="true" className="icon icon-sm" alt="" /> Export Raw Data (CSV)</h3>
          <p className="rt-section-desc">
            Download all activity completion records for the selected date range as a CSV file.
            Compatible with Excel, Google Sheets, and other tools.
          </p>
          <div className="rt-btn-row">
            <button className="rt-btn rt-btn-primary" onClick={handleExportCsv} aria-label="Download activity data as CSV">
              <span aria-hidden="true">⬇</span> Download CSV
            </button>
          </div>
          {csvToast && (
            <div className="rt-toast" role="status" aria-live="polite">
              <img src="/icons/success.svg" alt="" aria-hidden="true" style={{ width: '1rem', height: '1rem', objectFit: 'contain', verticalAlign: 'middle' }} /> CSV downloaded successfully!
            </div>
          )}
        </div>

        {/* PDF Report */}
        <div className="rt-section" role="region" aria-label="PDF Report">
          <h3 className="rt-section-title"><img src="/icons/print.svg" aria-hidden="true" className="icon icon-sm" alt="" /> Generate PDF Report</h3>
          <p className="rt-section-desc">
            Generate a comprehensive analytics report. Opens a print-friendly page that can be
            saved as a PDF using your browser's print dialog.
          </p>
          <div className="rt-btn-row">
            <PrintExportButton
              resourceType="progress_report"
              resourceData={analyticsExportData}
              label="Export Analytics (PDF)"
              variant="primary"
            />
            <button className="rt-btn rt-btn-primary" onClick={handlePrintReport} aria-label="Quick print report">
              <img src="/icons/print.svg" alt="" aria-hidden="true" style={{ width: '1rem', height: '1rem', objectFit: 'contain' }} /> Quick Print
            </button>
            <button className="rt-btn" onClick={handlePreviewReport} aria-label="Preview report content">
              <img src="/icons/info.svg" alt="" aria-hidden="true" style={{ width: '1rem', height: '1rem', objectFit: 'contain' }} /> Preview Report
            </button>
          </div>
          {printToast && (
            <div className="rt-toast" role="status" aria-live="polite">
              <img src="/icons/success.svg" alt="" aria-hidden="true" style={{ width: '1rem', height: '1rem', objectFit: 'contain', verticalAlign: 'middle' }} /> Report opened in new tab. Use browser print to save as PDF.
            </div>
          )}
          {preview && (
            <div className="rt-preview" aria-label="Report preview" tabIndex={0}>
              {preview}
            </div>
          )}
        </div>

        {/* Quick metrics summary */}
        <div className="rt-section" role="region" aria-label="Summary metrics">
          <h3 className="rt-section-title"><img src="/icons/org-leaderboards.svg" aria-hidden="true" className="icon icon-sm" alt="" /> Current Summary</h3>
          <p className="rt-section-desc">Key metrics for the selected date range.</p>
          <table style={{ fontSize: '.85rem', borderCollapse: 'collapse', width: '100%' }} aria-label="Summary metrics table">
            <tbody>
              {[
                ['Total child profiles',       profiles.length],
                ['Active children (in range)',  metrics.activeChildren],
                ['Activities completed',        metrics.totalActivities],
                ['Total stars earned',          metrics.totalStars],
                ['Avg activities per child',    metrics.averageActivitiesPerChild],
              ].map(([label, val]) => (
                <tr key={label}>
                  <td style={{ padding: '.4rem .6rem', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>{label}</td>
                  <td style={{ padding: '.4rem .6rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </>
  );
}
