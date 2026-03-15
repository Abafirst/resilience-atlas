'use strict';

/**
 * export.js — Utilities for generating CSV and PDF exports of team analytics.
 *
 * CSV: built with plain string concatenation (no external dependency).
 * PDF: generated with puppeteer (already in package.json) by rendering an
 *      HTML template to a PDF buffer.
 */

const puppeteer = require('puppeteer');

// ── CSV ───────────────────────────────────────────────────────────────────────

/**
 * Convert an array of team member result objects to a CSV string.
 *
 * @param {Array<Object>} results  – enriched result objects
 * @returns {string}
 */
function buildCsv(results) {
  const header = [
    'Name',
    'Email',
    'Overall Score',
    'Relational-Connective',
    'Cognitive',
    'Somatic',
    'Emotional',
    'Spiritual',
    'Agentic',
    'Date Completed',
  ];

  const rows = results.map((r) => {
    const s = r.scores || {};

    // Each dimension may be stored as { percentage } or a plain number
    function pct(dim) {
      const val = s[dim];
      if (val == null) return '';
      if (typeof val === 'object' && val.percentage != null) return val.percentage;
      return val;
    }

    return [
      csvCell(r.firstName || ''),
      csvCell(r.email || ''),
      r.overall != null ? r.overall : '',
      pct('relational'),
      pct('cognitive'),
      pct('somatic'),
      pct('emotional'),
      pct('spiritual'),
      pct('agentic'),
      r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US') : '',
    ];
  });

  return [header, ...rows].map((row) => row.join(',')).join('\r\n');
}

function csvCell(value) {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ── PDF ───────────────────────────────────────────────────────────────────────

/**
 * Generate a PDF buffer from team analytics data using puppeteer.
 *
 * @param {Object} org      – organization document
 * @param {Object} teamResult – TeamResult document (averages, team_count)
 * @param {Array}  results  – individual result objects
 * @returns {Promise<Buffer>}
 */
async function buildPdf(org, teamResult, results) {
  const html = renderPdfHtml(org, teamResult, results);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

/**
 * Render a self-contained HTML string for the PDF report.
 */
function renderPdfHtml(org, teamResult, results) {
  const orgName = org.company_name || org.name || 'Your Organization';
  const avgScores = teamResult ? teamResult.averages : {};
  const memberCount = teamResult ? teamResult.team_count : results.length;
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const dimensionRows = [
    ['Relational-Connective', avgScores.relational],
    ['Cognitive', avgScores.cognitive],
    ['Somatic', avgScores.somatic],
    ['Emotional', avgScores.emotional],
    ['Spiritual', avgScores.spiritual],
    ['Agentic', avgScores.agentic],
  ]
    .map(
      ([name, val]) =>
        `<tr>
          <td>${name}</td>
          <td>${val != null ? Math.round(val) + '%' : '—'}</td>
          <td>
            <div style="background:#e5e7eb;border-radius:4px;height:8px;width:100%">
              <div style="background:#6366f1;border-radius:4px;height:8px;width:${val != null ? Math.round(val) : 0}%"></div>
            </div>
          </td>
        </tr>`
    )
    .join('');

  const memberRows = results
    .map(
      (r) =>
        `<tr>
          <td>${esc(r.firstName || '—')}</td>
          <td>${esc(r.email || '—')}</td>
          <td>${r.overall != null ? Math.round(r.overall) + '%' : '—'}</td>
          <td>${esc(r.dominantType || '—')}</td>
          <td>${r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US') : '—'}</td>
        </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1f2937; }
  h1 { font-size: 24px; color: #4f46e5; margin-bottom: 4px; }
  h2 { font-size: 16px; color: #374151; margin: 24px 0 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
  .meta { color: #6b7280; font-size: 11px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th { background: #f3f4f6; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }
  td { padding: 8px; border-bottom: 1px solid #f3f4f6; }
  .kpi-row { display: flex; gap: 16px; margin-bottom: 24px; }
  .kpi { flex: 1; background: #f9fafb; border-radius: 8px; padding: 16px; text-align: center; }
  .kpi-val { font-size: 28px; font-weight: bold; color: #4f46e5; }
  .kpi-lbl { font-size: 11px; color: #6b7280; margin-top: 4px; }
  @page { size: A4; margin: 20mm 15mm; }
</style>
</head>
<body>
  <h1>Team Resilience Report</h1>
  <div class="meta">${esc(orgName)} · Generated ${generatedDate}</div>

  <div class="kpi-row">
    <div class="kpi">
      <div class="kpi-val">${memberCount}</div>
      <div class="kpi-lbl">Team Members</div>
    </div>
    <div class="kpi">
      <div class="kpi-val">${avgScores.overall != null ? Math.round(avgScores.overall) + '%' : '—'}</div>
      <div class="kpi-lbl">Average Overall Score</div>
    </div>
  </div>

  <h2>Dimension Averages</h2>
  <table>
    <thead><tr><th>Dimension</th><th>Average</th><th>Distribution</th></tr></thead>
    <tbody>${dimensionRows}</tbody>
  </table>

  <h2>Team Member Results</h2>
  <table>
    <thead>
      <tr>
        <th>Name</th><th>Email</th><th>Overall</th><th>Primary Dimension</th><th>Date</th>
      </tr>
    </thead>
    <tbody>${memberRows || '<tr><td colspan="5" style="text-align:center;color:#9ca3af">No results yet</td></tr>'}</tbody>
  </table>
</body>
</html>`;
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { buildCsv, buildPdf };
