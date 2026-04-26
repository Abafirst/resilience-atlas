/**
 * PrintPreviewModal.jsx
 * Modal that provides a live text preview and "Print / Save as PDF" export.
 *
 * Supported resourceTypes:
 *   'activity'        — Kids activity worksheet
 *   'session_plan'    — Clinical session plan
 *   'family_report'   — Family dashboard progress report
 *   'progress_report' — Analytics progress report
 *   'protocol'        — ABA/ACT protocol document
 *   'bulk_protocols'  — Multiple protocols at once
 *
 * Uses the browser's native print dialog (window.print on a new window) —
 * consistent with the existing ReportsTab.jsx approach.
 */

import React, { useState, useCallback, useEffect } from 'react';

// ── Escape helper ─────────────────────────────────────────────────────────────

function esc(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function currentDateStr() {
  return new Date().toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ── Shared print CSS ──────────────────────────────────────────────────────────

const PRINT_BASE_CSS = `
  @page { size: letter; margin: .75in; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    color: #1e293b;
    line-height: 1.6;
    font-size: 11pt;
    background: #fff;
  }
  .iatlas-header {
    border-bottom: 3px solid #4f46e5;
    padding-bottom: 12px;
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .iatlas-header h1 { margin: 0; font-size: 20pt; font-weight: 800; color: #0f172a; }
  .iatlas-header .meta { font-size: 9pt; color: #64748b; margin-top: 4px; }
  .badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 9pt;
    font-weight: 700;
    background: #eef2ff;
    color: #4338ca;
  }
  h2 { font-size: 13pt; font-weight: 700; color: #4338ca; margin: 20px 0 8px; }
  h3 { font-size: 11pt; font-weight: 700; color: #334155; margin: 16px 0 6px; }
  p, li { font-size: 10.5pt; color: #374151; }
  ul, ol { padding-left: 1.2em; }
  li { margin-bottom: 4px; }
  .section { margin-bottom: 22px; }
  .tracker {
    border: 2px solid #cbd5e1;
    border-radius: 8px;
    padding: 14px 16px;
    background: #f8fafc;
    page-break-inside: avoid;
  }
  .tracker-title { font-size: 10pt; font-weight: 700; margin: 0 0 10px; }
  .tracker-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .check-item { display: flex; align-items: center; gap: 4px; font-size: 10pt; }
  .check-box {
    width: 16px; height: 16px; border: 2px solid #64748b; border-radius: 3px;
    display: inline-block; flex-shrink: 0;
  }
  .writing-line {
    border-bottom: 1px solid #e2e8f0;
    min-height: 28px;
    margin-bottom: 12px;
  }
  .iatlas-footer {
    margin-top: 48px;
    padding-top: 10px;
    border-top: 1px solid #e2e8f0;
    font-size: 8.5pt;
    color: #94a3b8;
    text-align: center;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10pt;
    margin-bottom: 14px;
  }
  th {
    background: #f1f5f9;
    padding: 6px 10px;
    text-align: left;
    font-weight: 700;
    color: #374151;
    border: 1px solid #e2e8f0;
  }
  td {
    padding: 6px 10px;
    border: 1px solid #e2e8f0;
    color: #374151;
    vertical-align: top;
  }
  .progress-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .progress-label { min-width: 140px; font-size: 10pt; font-weight: 600; }
  .progress-bar-wrap { flex: 1; height: 18px; background: #f1f5f9; border-radius: 99px; overflow: hidden; border: 1px solid #e2e8f0; }
  .progress-bar-fill { height: 100%; background: #6366f1; border-radius: 99px; }
  .progress-pct { min-width: 40px; text-align: right; font-size: 10pt; font-weight: 700; color: #4f46e5; }
  .summary-cards { display: flex; gap: 14px; margin-bottom: 28px; flex-wrap: wrap; }
  .summary-card {
    flex: 1; min-width: 90px;
    border: 2px solid #e2e8f0; border-radius: 10px; padding: 12px;
    text-align: center; page-break-inside: avoid;
  }
  .summary-number { font-size: 22pt; font-weight: 800; color: #4f46e5; margin-bottom: 4px; }
  .summary-label { font-size: 8pt; color: #64748b; text-transform: uppercase; letter-spacing: .05em; font-weight: 600; }
  .parent-note { background: #fef3c7; border-left: 3px solid #f59e0b; padding: 8px 12px; border-radius: 0 6px 6px 0; font-size: 10pt; }
  @media print {
    body { padding: 0; }
    .no-print { display: none !important; }
    a { text-decoration: none; color: inherit; }
  }
`;

// ── Activity worksheet template ───────────────────────────────────────────────

function buildActivityHTML(data, opts) {
  const {
    title = 'Activity',
    dimension = '',
    ageGroup = '',
    duration = '',
    description = '',
    materials = [],
    instructions = [],
    reflectionQuestions = [],
    parentNote = '',
    learningGoal = '',
  } = data || {};

  const headerText = opts.headerText || 'Resilience Atlas\u2122';
  const showTracker = opts.showTracker !== false;

  const materialsHTML = materials.length
    ? `<ul>${materials.map(m => `<li>${esc(m)}</li>`).join('')}</ul>`
    : '<p><em>No materials required.</em></p>';

  const stepsHTML = instructions.length
    ? instructions.map((s, i) => `<p><strong>Step ${i + 1}:</strong> ${esc(s)}</p>`).join('')
    : '<p><em>Follow the activity guide below.</em></p>';

  const reflectionHTML = reflectionQuestions.length
    ? reflectionQuestions.map(q => `
        <p><strong>${esc(q)}</strong></p>
        <div class="writing-line"></div>
        <div class="writing-line"></div>
      `).join('')
    : '<div class="writing-line"></div><div class="writing-line"></div>';

  const goalHTML = learningGoal
    ? `<div class="section"><h2>What You'll Learn</h2><p>${esc(learningGoal)}</p></div>`
    : description
      ? `<div class="section"><h2>About This Activity</h2><p>${esc(description)}</p></div>`
      : '';

  const parentNoteHTML = parentNote
    ? `<div class="section"><h2>Parent / Teacher Note</h2><div class="parent-note">${esc(parentNote)}</div></div>`
    : '';

  const trackerHTML = showTracker ? `
    <div class="tracker">
      <p class="tracker-title">\uD83D\uDCC5 Practice Tracker \u2014 Complete all 5 days to master this skill!</p>
      <div class="tracker-row">
        ${[1,2,3,4,5].map(d => `<span class="check-item"><span class="check-box"></span> Day ${d}</span>`).join('')}
      </div>
    </div>
  ` : '';

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
  <title>${esc(title)} \u2014 Activity Worksheet</title>
  <style>${PRINT_BASE_CSS}</style>
</head><body>
  <div class="iatlas-header">
    <div>
      <h1>${esc(title)}</h1>
      <div class="meta">
        ${dimension ? `<span class="badge">${esc(dimension)}</span> &nbsp;` : ''}
        ${ageGroup ? `Age Group: ${esc(ageGroup)} &nbsp;|&nbsp;` : ''}
        ${duration ? `Duration: ${esc(duration)} &nbsp;|&nbsp;` : ''}
        Generated: ${currentDateStr()}
      </div>
    </div>
    <div style="text-align:right;font-size:9pt;color:#64748b;">${esc(headerText)}</div>
  </div>

  ${goalHTML}

  <div class="section">
    <h2>Materials Needed</h2>
    ${materialsHTML}
  </div>

  <div class="section">
    <h2>Instructions</h2>
    ${stepsHTML}
  </div>

  <div class="section">
    <h2>Reflection Questions</h2>
    ${reflectionHTML}
  </div>

  ${parentNoteHTML}
  ${trackerHTML}

  <div class="iatlas-footer">
    Resilience Atlas\u2122 &nbsp;|&nbsp; Generated on ${currentDateStr()} &nbsp;|&nbsp; ${esc(headerText)}
  </div>

  <script>window.onload = function(){ window.print(); }<\/script>
</body></html>`;
}

// ── Session plan template ─────────────────────────────────────────────────────

function buildSessionPlanHTML(plan, opts) {
  const headerText = opts.headerText || 'Resilience Atlas\u2122';
  const includeClient = opts.includeClientInfo !== false;

  const DIM_LABELS = {
    'agentic-generative':    'Agentic-Generative',
    'somatic-regulative':    'Somatic-Regulative',
    'cognitive-interpretive':'Cognitive-Interpretive',
    'emotional-adaptive':    'Emotional-Adaptive',
    'relational-integrative':'Relational-Integrative',
    'spiritual-existential': 'Spiritual-Existential',
  };

  const sessionLabel = plan.sessionNumber ? `Session #${plan.sessionNumber}` : 'Session Plan';
  const dateLabel = plan.sessionDate
    ? new Date(plan.sessionDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const clientHTML = includeClient && plan.clientIdentifier
    ? `<div class="section"><h3>Client</h3><p>${esc(plan.clientIdentifier)}</p></div>`
    : '';

  const goalsHTML = (plan.sessionGoals || []).filter(Boolean).length
    ? `<div class="section"><h2>\uD83C\uDFAF Session Goals</h2>
        <ul>${(plan.sessionGoals || []).filter(Boolean).map(g => `<li>${esc(g)}</li>`).join('')}</ul>
       </div>`
    : '';

  const activitiesHTML = (plan.activitiesSelected || []).length
    ? `<div class="section"><h2>\uD83D\uDCDA Activities / Protocols</h2>
        ${(plan.activitiesSelected || []).map(a => `
          <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;margin-bottom:8px;background:#f8fafc;">
            <strong>${esc(a.title)}</strong>
            ${a.type ? `<span class="badge" style="margin-left:8px;background:#d1fae5;color:#065f46;">${esc(a.type)}</span>` : ''}
            ${a.reference ? `<p style="margin:4px 0 0;font-size:9.5pt;color:#64748b;">Ref: ${esc(a.reference)}</p>` : ''}
            ${a.notes ? `<p style="margin:4px 0 0;font-size:10pt;">${esc(a.notes)}</p>` : ''}
          </div>
        `).join('')}
       </div>`
    : '';

  const dataHTML = (plan.dataCollected || []).length
    ? `<div class="section"><h2>\uD83D\uDCCA Data Collected</h2>
        <table><thead><tr><th>Target</th><th>Measurement</th><th>Value</th><th>Notes</th></tr></thead>
        <tbody>${(plan.dataCollected || []).map(row => `
          <tr>
            <td>${esc(row.target || '\u2014')}</td>
            <td>${esc(row.measurement || '\u2014')}</td>
            <td>${esc(row.value || '\u2014')}</td>
            <td>${esc(row.notes || '\u2014')}</td>
          </tr>
        `).join('')}</tbody></table>
       </div>`
    : '';

  const progressHTML = (plan.progressTowardObjectives || []).length
    ? `<div class="section"><h2>\uD83D\uDCC8 Progress Toward Objectives</h2>
        ${(plan.progressTowardObjectives || []).map((obj, i) => `
          <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;margin-bottom:8px;">
            <strong>${esc(obj.objectiveId || `Objective ${i + 1}`)}</strong>
            ${obj.trend ? `<span class="badge" style="margin-left:8px;">${esc(obj.trend)}</span>` : ''}
            ${obj.notes ? `<p style="margin:4px 0 0;">${esc(obj.notes)}</p>` : ''}
          </div>
        `).join('')}
       </div>`
    : '';

  const notesHTML = plan.sessionNotes
    ? `<div class="section"><h2>\uD83D\uDCDD Session Notes</h2><p>${esc(plan.sessionNotes)}</p></div>`
    : '';

  const homeworkHTML = (plan.homeworkAssigned || []).length
    ? `<div class="section"><h2>\uD83D\uDCCC Homework Assigned</h2>
        ${(plan.homeworkAssigned || []).map(hw => `
          <div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:6px;">
            <span class="check-box" style="flex-shrink:0;margin-top:2px;"></span>
            <span>${esc(hw.task)}${hw.due ? ` <span style="color:#64748b;font-size:9pt;">(Due: ${esc(hw.due)})</span>` : ''}</span>
          </div>
        `).join('')}
       </div>`
    : '';

  const nextHTML = plan.planForNextSession
    ? `<div class="section"><h2>\uD83D\uDD2E Plan for Next Session</h2><p>${esc(plan.planForNextSession)}</p></div>`
    : '';

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
  <title>${esc(sessionLabel)} \u2014 Session Plan</title>
  <style>${PRINT_BASE_CSS}</style>
</head><body>
  <div class="iatlas-header">
    <div>
      <h1>${esc(sessionLabel)}${dateLabel ? ` \u2014 ${esc(dateLabel)}` : ''}</h1>
      <div class="meta">
        ${plan.dimensionalFocus ? `<span class="badge">${esc(DIM_LABELS[plan.dimensionalFocus] || plan.dimensionalFocus)}</span> &nbsp;` : ''}
        Generated: ${currentDateStr()}
      </div>
    </div>
    <div style="text-align:right;font-size:9pt;color:#64748b;">${esc(headerText)}</div>
  </div>

  ${clientHTML}
  ${goalsHTML}
  ${activitiesHTML}
  ${dataHTML}
  ${progressHTML}
  ${notesHTML}
  ${homeworkHTML}
  ${nextHTML}

  <div style="margin-top:32px;">
    <h2>Practitioner Notes</h2>
    <div class="writing-line"></div>
    <div class="writing-line"></div>
    <div class="writing-line"></div>
  </div>

  <div class="iatlas-footer">
    Resilience Atlas\u2122 Clinical &nbsp;|&nbsp; ${esc(sessionLabel)} &nbsp;|&nbsp; Generated ${currentDateStr()} &nbsp;|&nbsp; ${esc(headerText)}
  </div>

  <script>window.onload = function(){ window.print(); }<\/script>
</body></html>`;
}

// ── Family / progress report template ────────────────────────────────────────

function buildFamilyReportHTML(data, opts) {
  const headerText = opts.headerText || 'Resilience Atlas\u2122';
  const {
    summaryMetrics = {},
    profileData = [],
    rangeKey = 'all time',
  } = data || {};

  const summaryCardsHTML = `
    <div class="summary-cards">
      <div class="summary-card">
        <div class="summary-number">${esc(profileData.length)}</div>
        <div class="summary-label">Children</div>
      </div>
      <div class="summary-card">
        <div class="summary-number">${esc(summaryMetrics.totalCompleted || 0)}</div>
        <div class="summary-label">Activities Completed</div>
      </div>
      <div class="summary-card">
        <div class="summary-number">${esc(summaryMetrics.totalStars || 0)}</div>
        <div class="summary-label">Stars Earned</div>
      </div>
      <div class="summary-card">
        <div class="summary-number">${esc(summaryMetrics.totalActivitiesWeek || 0)}</div>
        <div class="summary-label">This Week</div>
      </div>
    </div>
  `;

  const childrenHTML = profileData.length
    ? profileData.map(({ profile, totalCompleted, stars, level, pct }) => `
        <div style="border:1.5px solid #e2e8f0;border-radius:12px;padding:14px 16px;margin-bottom:14px;page-break-inside:avoid;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <span style="font-size:22pt;">${esc(profile.avatar || '\uD83D\uDC64')}</span>
            <div>
              <div style="font-size:12pt;font-weight:700;">${esc(profile.name)}</div>
              ${profile.ageGroup ? `<div style="font-size:9pt;color:#64748b;">${esc(profile.ageGroup)}</div>` : ''}
            </div>
            <div style="margin-left:auto;text-align:right;">
              <div style="font-size:10pt;font-weight:700;color:#4f46e5;">Level ${esc(level?.level || 1)}: ${esc(level?.title || 'Beginner')}</div>
              <div style="font-size:9pt;color:#64748b;">\u2B50 ${esc(stars)} ${stars === 1 ? 'star' : 'stars'}</div>
            </div>
          </div>
          <div class="progress-row">
            <span class="progress-label">Overall Progress</span>
            <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${esc(pct || 0)}%;"></div></div>
            <span class="progress-pct">${esc(pct || 0)}%</span>
          </div>
          <div style="font-size:9.5pt;color:#64748b;">${esc(totalCompleted)} activities completed</div>
        </div>
      `).join('')
    : '<p><em>No child profiles found.</em></p>';

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
  <title>Family Resilience Progress Report</title>
  <style>${PRINT_BASE_CSS}</style>
</head><body>
  <div class="iatlas-header">
    <div>
      <h1>Family Resilience Progress Report</h1>
      <div class="meta">Date Range: ${esc(rangeKey)} &nbsp;|&nbsp; Generated: ${currentDateStr()}</div>
    </div>
    <div style="text-align:right;font-size:9pt;color:#64748b;">${esc(headerText)}</div>
  </div>

  <div class="section">
    <h2>Family Summary</h2>
    ${summaryCardsHTML}
  </div>

  <div class="section">
    <h2>Children's Progress</h2>
    ${childrenHTML}
  </div>

  <div class="section">
    <h2>Notes &amp; Observations</h2>
    <div class="writing-line"></div>
    <div class="writing-line"></div>
    <div class="writing-line"></div>
  </div>

  <div class="iatlas-footer">
    Resilience Atlas\u2122 &nbsp;|&nbsp; Family Progress Report &nbsp;|&nbsp; Generated ${currentDateStr()} &nbsp;|&nbsp; ${esc(headerText)}
  </div>

  <script>window.onload = function(){ window.print(); }<\/script>
</body></html>`;
}

// ── Analytics progress report template ───────────────────────────────────────

function buildProgressReportHTML(data, opts) {
  const headerText = opts.headerText || 'Resilience Atlas\u2122';
  const {
    metrics = {},
    profiles = [],
    rangeKey = '30d',
  } = data || {};

  const summaryCardsHTML = `
    <div class="summary-cards">
      <div class="summary-card">
        <div class="summary-number">${esc(metrics.totalFamilies || 0)}</div>
        <div class="summary-label">Total Profiles</div>
      </div>
      <div class="summary-card">
        <div class="summary-number">${esc(metrics.activeChildren || 0)}</div>
        <div class="summary-label">Active Children</div>
      </div>
      <div class="summary-card">
        <div class="summary-number">${esc(metrics.totalActivities || 0)}</div>
        <div class="summary-label">Activities (range)</div>
      </div>
      <div class="summary-card">
        <div class="summary-number">${esc(metrics.totalStars || 0)}</div>
        <div class="summary-label">Stars Earned</div>
      </div>
    </div>
  `;

  const perChildHTML = profiles.length
    ? `<table>
        <thead><tr><th>Child</th><th>Activities (range)</th><th>Avg/Week</th></tr></thead>
        <tbody>
          ${profiles.map(p => `<tr>
            <td>${esc(p.name)}</td>
            <td>${esc(p.activityCount || 0)}</td>
            <td>${esc(p.velocity || '\u2014')}</td>
          </tr>`).join('')}
        </tbody>
       </table>`
    : '<p><em>No child data found for this date range.</em></p>';

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
  <title>IATLAS Analytics Report</title>
  <style>${PRINT_BASE_CSS}</style>
</head><body>
  <div class="iatlas-header">
    <div>
      <h1>IATLAS Analytics Report</h1>
      <div class="meta">Date Range: ${esc(rangeKey)} &nbsp;|&nbsp; Generated: ${currentDateStr()}</div>
    </div>
    <div style="text-align:right;font-size:9pt;color:#64748b;">${esc(headerText)}</div>
  </div>

  <div class="section">
    <h2>Overview</h2>
    ${summaryCardsHTML}
  </div>

  <div class="section">
    <h2>Per-Child Summary</h2>
    ${perChildHTML}
  </div>

  <div class="section">
    <h2>Notes</h2>
    <div class="writing-line"></div>
    <div class="writing-line"></div>
  </div>

  <div class="iatlas-footer">
    Resilience Atlas\u2122 &nbsp;|&nbsp; Analytics Report &nbsp;|&nbsp; Generated ${currentDateStr()} &nbsp;|&nbsp; ${esc(headerText)}
  </div>

  <script>window.onload = function(){ window.print(); }<\/script>
</body></html>`;
}

// ── ABA Protocol template ─────────────────────────────────────────────────────

function buildProtocolHTML(protocol, opts) {
  const headerText = opts.headerText || 'Resilience Atlas\u2122';

  const stepsHTML = (protocol.procedure || []).length
    ? `<ol>${(protocol.procedure || []).map(s => `<li>${esc(s)}</li>`).join('')}</ol>`
    : '<p><em>See full procedure in the practitioner guide.</em></p>';

  const masteryHTML = protocol.masteryCriteria
    ? `<div class="section"><h2>Mastery Criteria</h2><p>${esc(protocol.masteryCriteria)}</p></div>`
    : '';

  const dataHTML = protocol.dataCollection
    ? `<div class="section"><h2>Data Collection</h2><p>${esc(protocol.dataCollection)}</p></div>`
    : '';

  const outcomesHTML = protocol.expectedOutcomes
    ? `<div class="section"><h2>Expected Outcomes</h2><p>${esc(protocol.expectedOutcomes)}</p></div>`
    : '';

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
  <title>${esc(protocol.title || 'Protocol')} \u2014 ABA Protocol</title>
  <style>${PRINT_BASE_CSS}</style>
</head><body>
  <div class="iatlas-header">
    <div>
      <h1>${esc(protocol.title || 'Protocol')}</h1>
      <div class="meta">
        ${protocol.dimension ? `<span class="badge">${esc(protocol.dimension)}</span> &nbsp;` : ''}
        ABA Protocol &nbsp;|&nbsp; Generated: ${currentDateStr()}
      </div>
    </div>
    <div style="text-align:right;font-size:9pt;color:#64748b;">${esc(headerText)}</div>
  </div>

  ${protocol.purpose ? `<div class="section"><h2>Purpose</h2><p>${esc(protocol.purpose)}</p></div>` : ''}
  ${protocol.theoreticalBasis ? `<div class="section"><h2>Theoretical Basis</h2><p>${esc(protocol.theoreticalBasis)}</p></div>` : ''}

  <div class="section">
    <h2>Procedure</h2>
    ${stepsHTML}
  </div>

  ${dataHTML}
  ${masteryHTML}
  ${outcomesHTML}

  <div class="section">
    <h2>Practitioner Observation Notes</h2>
    <div class="writing-line"></div>
    <div class="writing-line"></div>
    <div class="writing-line"></div>
    <div class="writing-line"></div>
  </div>

  <div class="iatlas-footer">
    Resilience Atlas\u2122 Clinical &nbsp;|&nbsp; ABA Protocol Library &nbsp;|&nbsp; Generated ${currentDateStr()} &nbsp;|&nbsp; ${esc(headerText)}
  </div>

  <script>window.onload = function(){ window.print(); }<\/script>
</body></html>`;
}

// ── Bulk protocol template ────────────────────────────────────────────────────

function buildBulkProtocolsHTML(protocols, opts) {
  const headerText = opts.headerText || 'Resilience Atlas\u2122';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
  <title>ABA Protocol Library Export</title>
  <style>
    ${PRINT_BASE_CSS}
    .protocol-section { page-break-before: always; }
    .protocol-section:first-child { page-break-before: auto; }
  </style>
</head><body>
  <div class="iatlas-header">
    <div>
      <h1>ABA Protocol Library</h1>
      <div class="meta">${esc(protocols.length)} protocols &nbsp;|&nbsp; Generated: ${currentDateStr()}</div>
    </div>
    <div style="text-align:right;font-size:9pt;color:#64748b;">${esc(headerText)}</div>
  </div>

  <div class="section">
    <h2>Protocols Included</h2>
    <ul>${protocols.map(p => `<li>${esc(p.title)}</li>`).join('')}</ul>
  </div>

  ${protocols.map((p, i) => `
    <div class="protocol-section">
      <h2 style="font-size:15pt;color:#0f172a;border-bottom:2px solid #4f46e5;padding-bottom:6px;">
        ${i + 1}. ${esc(p.title)}
        ${p.dimension ? `<span class="badge" style="margin-left:8px;font-size:9pt;">${esc(p.dimension)}</span>` : ''}
      </h2>
      ${p.purpose ? `<p><strong>Purpose:</strong> ${esc(p.purpose)}</p>` : ''}
      ${(p.procedure || []).length ? `
        <h3>Procedure</h3>
        <ol>${(p.procedure || []).map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      ` : ''}
      ${p.masteryCriteria ? `<p><strong>Mastery Criteria:</strong> ${esc(p.masteryCriteria)}</p>` : ''}
      ${p.dataCollection ? `<p><strong>Data Collection:</strong> ${esc(p.dataCollection)}</p>` : ''}
    </div>
  `).join('')}

  <div class="iatlas-footer">
    Resilience Atlas\u2122 &nbsp;|&nbsp; ABA Protocol Library &nbsp;|&nbsp; Generated ${currentDateStr()} &nbsp;|&nbsp; ${esc(headerText)}
  </div>

  <script>window.onload = function(){ window.print(); }<\/script>
</body></html>`;
}

// ── Dispatch to the right builder ─────────────────────────────────────────────

function buildPrintHTML(resourceType, resourceData, opts) {
  switch (resourceType) {
    case 'activity':        return buildActivityHTML(resourceData, opts);
    case 'session_plan':    return buildSessionPlanHTML(resourceData, opts);
    case 'family_report':   return buildFamilyReportHTML(resourceData, opts);
    case 'progress_report': return buildProgressReportHTML(resourceData, opts);
    case 'protocol':        return buildProtocolHTML(resourceData, opts);
    case 'bulk_protocols':  return buildBulkProtocolsHTML(resourceData, opts);
    default:                return buildActivityHTML(resourceData, opts);
  }
}

// ── Text preview summary ──────────────────────────────────────────────────────

function buildPreviewText(resourceType, resourceData) {
  switch (resourceType) {
    case 'activity': {
      const d = resourceData || {};
      return [
        `ACTIVITY WORKSHEET: ${d.title || '(untitled)'}`,
        d.dimension ? `Dimension: ${d.dimension}` : null,
        d.ageGroup  ? `Age Group: ${d.ageGroup}`  : null,
        d.duration  ? `Duration: ${d.duration}`   : null,
        '',
        d.learningGoal      ? `Goal: ${d.learningGoal}` : null,
        d.materials?.length ? `Materials: ${d.materials.join(', ')}` : null,
        d.instructions?.length ? `Steps: ${d.instructions.length} step(s)` : null,
      ].filter(l => l !== null).join('\n');
    }
    case 'session_plan': {
      const p = resourceData || {};
      return [
        `SESSION PLAN: Session${p.sessionNumber ? ` #${p.sessionNumber}` : ''}`,
        p.clientIdentifier ? `Client: ${p.clientIdentifier}` : null,
        p.sessionDate ? `Date: ${new Date(p.sessionDate).toLocaleDateString()}` : null,
        p.dimensionalFocus ? `Focus: ${p.dimensionalFocus}` : null,
        p.sessionGoals?.length ? `Goals: ${p.sessionGoals.length} goal(s)` : null,
      ].filter(l => l !== null).join('\n');
    }
    case 'family_report': {
      const d = resourceData || {};
      const m = d.summaryMetrics || {};
      return [
        'FAMILY RESILIENCE PROGRESS REPORT',
        `Children: ${(d.profileData || []).length}`,
        `Total Completed: ${m.totalCompleted || 0}`,
        `Total Stars: ${m.totalStars || 0}`,
        `This Week: ${m.totalActivitiesWeek || 0}`,
      ].join('\n');
    }
    case 'progress_report': {
      const d = resourceData || {};
      const m = d.metrics || {};
      return [
        'ANALYTICS PROGRESS REPORT',
        `Date Range: ${d.rangeKey || '30d'}`,
        `Profiles: ${m.totalFamilies || 0}`,
        `Activities: ${m.totalActivities || 0}`,
        `Stars: ${m.totalStars || 0}`,
      ].join('\n');
    }
    case 'protocol': {
      const p = resourceData || {};
      return [
        `ABA PROTOCOL: ${p.title || '(untitled)'}`,
        p.dimension ? `Dimension: ${p.dimension}` : null,
        p.purpose   ? `Purpose: ${p.purpose.slice(0, 100)}...` : null,
      ].filter(l => l !== null).join('\n');
    }
    case 'bulk_protocols': {
      const protocols = resourceData || [];
      return [
        'BULK ABA PROTOCOL EXPORT',
        `${protocols.length} protocol(s) selected`,
        ...protocols.slice(0, 5).map(p => `  \u2022 ${p.title}`),
        protocols.length > 5 ? `  ... and ${protocols.length - 5} more` : null,
      ].filter(l => l !== null).join('\n');
    }
    default:
      return 'Preview not available.';
  }
}

// ── Resource type labels ──────────────────────────────────────────────────────

const RESOURCE_LABELS = {
  activity:        'Activity Worksheet',
  session_plan:    'Session Plan',
  family_report:   'Family Progress Report',
  progress_report: 'Analytics Report',
  protocol:        'ABA Protocol',
  bulk_protocols:  'Protocol Library Export',
};

// ── Modal styles ──────────────────────────────────────────────────────────────

const MODAL_STYLES = `
.ppm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.55);
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: ppm-fade-in .15s ease;
}
@keyframes ppm-fade-in { from { opacity: 0; } to { opacity: 1; } }

.ppm-dialog {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(0,0,0,.25);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: ppm-slide-in .2s ease;
}
@keyframes ppm-slide-in {
  from { opacity: 0; transform: translateY(16px) scale(.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
[data-theme="dark"] .ppm-dialog {
  background: #1e293b;
  box-shadow: 0 24px 60px rgba(0,0,0,.5);
}

.ppm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem 1rem;
  border-bottom: 1.5px solid #e2e8f0;
  flex-shrink: 0;
}
[data-theme="dark"] .ppm-header { border-bottom-color: #334155; }
.ppm-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}
[data-theme="dark"] .ppm-title { color: #f1f5f9; }
.ppm-close {
  width: 30px; height: 30px;
  border-radius: 8px;
  border: none;
  background: #f1f5f9;
  color: #64748b;
  font-size: 1rem;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background .12s;
  flex-shrink: 0;
}
.ppm-close:hover { background: #e2e8f0; color: #0f172a; }
[data-theme="dark"] .ppm-close { background: #334155; color: #94a3b8; }
[data-theme="dark"] .ppm-close:hover { background: #475569; color: #f1f5f9; }

.ppm-body {
  overflow-y: auto;
  padding: 1.25rem 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ppm-section-label {
  font-size: .78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: #64748b;
  margin: 0 0 .45rem;
}
[data-theme="dark"] .ppm-section-label { color: #94a3b8; }

.ppm-input {
  padding: .55rem .75rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: .88rem;
  background: #fff;
  color: #0f172a;
  outline: none;
  width: 100%;
  transition: border-color .15s;
  box-sizing: border-box;
}
.ppm-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,.1);
}
[data-theme="dark"] .ppm-input {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}

.ppm-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.ppm-toggle-label {
  font-size: .88rem;
  color: #374151;
  font-weight: 500;
}
[data-theme="dark"] .ppm-toggle-label { color: #cbd5e1; }

.ppm-preview {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  padding: .9rem 1rem;
  font-size: .78rem;
  color: #475569;
  font-family: 'Courier New', monospace;
  white-space: pre-wrap;
  max-height: 150px;
  overflow-y: auto;
}
[data-theme="dark"] .ppm-preview {
  background: #0f172a;
  border-color: #334155;
  color: #94a3b8;
}

.ppm-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: .65rem;
  padding: 1rem 1.5rem;
  border-top: 1.5px solid #e2e8f0;
  flex-shrink: 0;
  flex-wrap: wrap;
}
[data-theme="dark"] .ppm-footer { border-top-color: #334155; }

.ppm-btn {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  padding: .6rem 1.25rem;
  border-radius: 10px;
  font-size: .88rem;
  font-weight: 700;
  cursor: pointer;
  border: 1.5px solid transparent;
  transition: background .15s, border-color .15s, color .15s, box-shadow .15s;
}
.ppm-btn:active { transform: scale(.97); }
.ppm-btn--cancel {
  background: #f1f5f9;
  border-color: #e2e8f0;
  color: #374151;
}
.ppm-btn--cancel:hover { background: #e2e8f0; }
[data-theme="dark"] .ppm-btn--cancel {
  background: #334155;
  border-color: #475569;
  color: #cbd5e1;
}
[data-theme="dark"] .ppm-btn--cancel:hover { background: #475569; }
.ppm-btn--print {
  background: #6366f1;
  border-color: #6366f1;
  color: #fff;
}
.ppm-btn--print:hover { background: #4f46e5; box-shadow: 0 2px 8px rgba(99,102,241,.3); }

@media (max-width: 480px) {
  .ppm-dialog { border-radius: 14px; max-height: 95vh; }
  .ppm-footer { justify-content: stretch; }
  .ppm-btn { flex: 1; justify-content: center; }
}
`;

// ── Component ─────────────────────────────────────────────────────────────────

export default function PrintPreviewModal({
  isOpen,
  onClose,
  resourceType = 'activity',
  resourceData,
}) {
  const [headerText,        setHeaderText]        = useState('Resilience Atlas\u2122');
  const [showTracker,       setShowTracker]        = useState(true);
  const [includeClientInfo, setIncludeClientInfo]  = useState(false);
  const [previewText,       setPreviewText]        = useState('');

  useEffect(() => {
    if (isOpen) {
      setPreviewText(buildPreviewText(resourceType, resourceData));
    }
  }, [isOpen, resourceType, resourceData]);

  const handlePrint = useCallback(() => {
    const opts = { headerText, showTracker, includeClientInfo };
    const html = buildPrintHTML(resourceType, resourceData, opts);
    const win  = window.open('', '_blank', 'width=850,height=750');
    if (!win) {
      alert('Pop-up blocked. Please allow pop-ups for this site to print.');
      return;
    }
    win.document.write(html);
    win.document.close();
  }, [resourceType, resourceData, headerText, showTracker, includeClientInfo]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const resourceLabel = RESOURCE_LABELS[resourceType] || 'Export';

  const showTrackerOption   = resourceType === 'activity';
  const showClientOption    = resourceType === 'session_plan';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MODAL_STYLES }} />
      <div
        className="ppm-overlay"
        onKeyDown={handleKeyDown}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        role="dialog"
        aria-modal="true"
        aria-label={`Print preview: ${resourceLabel}`}
        tabIndex={0}
      >
        <div className="ppm-dialog">

          {/* Header */}
          <div className="ppm-header">
            <h2 className="ppm-title">\uD83D\uDDA8 Print / Export — {resourceLabel}</h2>
            <button
              className="ppm-close"
              onClick={onClose}
              aria-label="Close print preview"
              type="button"
            >
              \u2715
            </button>
          </div>

          {/* Body */}
          <div className="ppm-body">

            {/* Header text customization */}
            <div>
              <p className="ppm-section-label">Header / Organization Name</p>
              <input
                className="ppm-input"
                type="text"
                value={headerText}
                onChange={e => setHeaderText(e.target.value)}
                placeholder="e.g., IATLAS — School Name or Practice Name"
                aria-label="Header text for printed document"
                maxLength={80}
              />
            </div>

            {/* Tracker toggle (activity only) */}
            {showTrackerOption && (
              <div className="ppm-toggle-row">
                <span className="ppm-toggle-label">Include practice tracker (Day 1–5 checkboxes)</span>
                <label className="ppm-toggle" aria-label="Toggle practice tracker">
                  <input
                    type="checkbox"
                    checked={showTracker}
                    onChange={e => setShowTracker(e.target.checked)}
                  />
                  <span className="ppm-toggle-track">
                    <span className="ppm-toggle-thumb" />
                  </span>
                </label>
              </div>
            )}

            {/* Client info toggle (session plan only) */}
            {showClientOption && (
              <div className="ppm-toggle-row">
                <span className="ppm-toggle-label">Include client identifier in printout</span>
                <label className="ppm-toggle" aria-label="Toggle client info inclusion">
                  <input
                    type="checkbox"
                    checked={includeClientInfo}
                    onChange={e => setIncludeClientInfo(e.target.checked)}
                  />
                  <span className="ppm-toggle-track">
                    <span className="ppm-toggle-thumb" />
                  </span>
                </label>
              </div>
            )}

            {/* Preview */}
            <div>
              <p className="ppm-section-label">Content Preview</p>
              <div className="ppm-preview" aria-label="Content preview" tabIndex={0}>
                {previewText || 'No preview available.'}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="ppm-footer">
            <button
              className="ppm-btn ppm-btn--cancel"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="ppm-btn ppm-btn--print"
              onClick={handlePrint}
              type="button"
              aria-label="Open print dialog"
            >
              <span aria-hidden="true">\uD83D\uDDA8</span> Print / Save as PDF
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
