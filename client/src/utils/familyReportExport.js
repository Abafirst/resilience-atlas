/**
 * familyReportExport.js
 * Utility for exporting family progress data as a downloadable CSV file.
 */

/**
 * Export the family progress report as a CSV file.
 * The CSV includes one row per child with key progress metrics.
 *
 * @param {object} summaryMetrics - Aggregated family metrics
 * @param {Array}  profileData    - Per-profile progress data from FamilyDashboard
 */
export function exportFamilyReportAsCSV(summaryMetrics, profileData) {
  const headers = [
    'Child Name',
    'Age Group',
    'Total Activities',
    'Stars Earned',
    'Level',
    'This Week',
    'Overall Progress %',
  ];

  const rows = profileData.map((d) => [
    escapeCSV(d.profile.name),
    escapeCSV(d.profile.ageGroup || '—'),
    d.totalCompleted,
    d.stars,
    d.level.level,
    d.thisWeek,
    `${d.pct}%`,
  ]);

  const summaryRow = [
    'TOTAL',
    '',
    summaryMetrics.totalCompleted,
    summaryMetrics.totalStars,
    '',
    summaryMetrics.totalActivitiesWeek,
    '',
  ];

  const lines = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
    summaryRow.join(','),
  ];

  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `family-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Wrap a CSV field value in double-quotes and escape any embedded quotes.
 * Numeric values are returned as-is.
 *
 * @param {string|number} value
 * @returns {string}
 */
function escapeCSV(value) {
  if (typeof value === 'number') return String(value);
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
