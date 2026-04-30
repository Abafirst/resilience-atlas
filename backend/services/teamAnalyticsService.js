'use strict';

/**
 * teamAnalyticsService.js — Core logic for the real-time team analytics dashboard.
 *
 * Responsibilities:
 *  - Aggregate member assessment data into a TeamProfile snapshot
 *  - Compute dimension averages, risk flags, heatmap, peer-mentoring pairs
 *  - Generate an HTML narrative report
 *  - Append trend entry to the running time-series
 */

const ResilienceResult = require('../models/ResilienceResult');
const Organization     = require('../models/Organization');
const User             = require('../models/User');
const TeamProfile      = require('../models/TeamProfile');
const UserDataSharing  = require('../models/UserDataSharing');
const mongoose         = require('mongoose');

// ── Constants ─────────────────────────────────────────────────────────────────

const DIMENSIONS = [
  'Cognitive-Narrative',
  'Relational-Connective',
  'Agentic-Generative',
  'Emotional-Adaptive',
  'Spiritual-Reflective',
  'Somatic-Regulative',
];

// Map from canonical short key → display label
const DIM_LABELS = {
  cognitive:  'Cognitive-Narrative',
  relational: 'Relational-Connective',
  agentic:    'Agentic-Generative',
  emotional:  'Emotional-Adaptive',
  spiritual:  'Spiritual-Reflective',
  somatic:    'Somatic-Regulative',
};

// Reverse: display label → short key
const LABEL_TO_KEY = Object.fromEntries(
  Object.entries(DIM_LABELS).map(([k, v]) => [v, k])
);

// Score → category mapping
const SCORE_CATEGORIES = {
  strong:     { min: 80, label: 'Strong',    cssClass: 'strong'     },
  solid:      { min: 65, label: 'Solid',     cssClass: 'solid'      },
  developing: { min: 45, label: 'Developing',cssClass: 'developing' },
  emerging:   { min: 0,  label: 'Emerging',  cssClass: 'emerging'   },
};

// Risk threshold: alert if score drops more than 10% or is below this absolute value
const AT_RISK_THRESHOLD   = 40;
const SCORE_DROP_THRESHOLD = 10;

// Overdue threshold: days since last assessment before status becomes 'overdue'
const OVERDUE_DAYS = 90;

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreCategory(score) {
  if (score == null) return null;
  if (score >= 80) return 'strong';
  if (score >= 65) return 'solid';
  if (score >= 45) return 'developing';
  return 'emerging';
}

function avg(values) {
  const valid = values.filter((v) => v != null && !isNaN(v));
  if (!valid.length) return null;
  return Math.round((valid.reduce((s, v) => s + v, 0) / valid.length) * 10) / 10;
}

function minVal(values) {
  const valid = values.filter((v) => v != null && !isNaN(v));
  return valid.length ? Math.round(Math.min(...valid) * 10) / 10 : null;
}

function maxVal(values) {
  const valid = values.filter((v) => v != null && !isNaN(v));
  return valid.length ? Math.round(Math.max(...valid) * 10) / 10 : null;
}

/**
 * Extract the short-key dimension score from a ResilienceResult document.
 * Handles both dimension_scores field and legacy scores Map.
 */
function extractDimScores(result) {
  const out = {};

  if (result.dimension_scores) {
    for (const [k] of Object.entries(DIM_LABELS)) {
      const v = result.dimension_scores[k];
      if (v != null) out[k] = v;
    }
  }

  if (result.scores) {
    const entries = result.scores instanceof Map
      ? Array.from(result.scores.entries())
      : Object.entries(result.scores);

    for (const [rawKey, val] of entries) {
      const shortKey = LABEL_TO_KEY[rawKey] || rawKey.toLowerCase();
      if (DIM_LABELS[shortKey] && out[shortKey] == null) {
        const pct = typeof val === 'object' && val !== null ? (val.percentage ?? null) : val;
        if (pct != null) out[shortKey] = pct;
      }
    }
  }

  return out;
}

/**
 * Determine assessment status for a member.
 */
function memberAssessmentStatus(lastAssessmentDate) {
  if (!lastAssessmentDate) return 'pending';
  const daysSince = (Date.now() - new Date(lastAssessmentDate).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince > OVERDUE_DAYS) return 'overdue';
  return 'assessed';
}

// ── Peer mentoring pairing ────────────────────────────────────────────────────

/**
 * Identify potential peer-mentoring pairs: for each dimension, pair the
 * highest-scoring member (mentor) with the lowest-scoring member who is below
 * the dimension average (mentee), if they differ.
 *
 * @param {Object[]} memberStatus
 * @param {Object}   dimAverages  — { cognitive, relational, … }
 * @returns {Array<{ mentor, mentee, dimension }>}
 */
function identifyMentoringPairs(memberStatus, dimAverages) {
  const pairs = [];
  const assessed = memberStatus.filter((m) => m.status === 'assessed' && m.dimensionScores);

  for (const [shortKey, label] of Object.entries(DIM_LABELS)) {
    const teamAvg = dimAverages[shortKey] || 0;

    const sorted = assessed
      .filter((m) => m.dimensionScores[shortKey] != null)
      .sort((a, b) => b.dimensionScores[shortKey] - a.dimensionScores[shortKey]);

    if (sorted.length < 2) continue;

    const mentor = sorted[0];
    // Mentee: lowest scorer below the team average (and not the mentor themselves)
    const menteeCandidates = sorted
      .slice(1)
      .filter((m) => (m.dimensionScores[shortKey] || 0) < teamAvg);

    if (!menteeCandidates.length) continue;

    const mentee = menteeCandidates[menteeCandidates.length - 1];
    if (mentor.name !== mentee.name) {
      pairs.push({ mentor: mentor.name, mentee: mentee.name, dimension: label });
    }
  }

  return pairs;
}

// ── Risk flag computation ─────────────────────────────────────────────────────

/**
 * Build risk flags for an individual member.
 *
 * @param {Object} memberDimScores  — { cognitive, relational, … } for this member
 * @param {Object} teamDimAverages  — same keys, team average
 * @param {number} memberOverall    — overall score (0-100)
 * @returns {string[]} list of human-readable flag messages
 */
function buildRiskFlags(memberDimScores, teamDimAverages, memberOverall) {
  const flags = [];

  if (memberOverall != null && memberOverall < AT_RISK_THRESHOLD) {
    flags.push(`Overall resilience score critically low (${memberOverall}%)`);
  }

  for (const [shortKey, label] of Object.entries(DIM_LABELS)) {
    const memberScore = memberDimScores[shortKey];
    const teamAvg    = teamDimAverages[shortKey];

    if (memberScore == null) continue;

    if (scoreCategory(memberScore) === 'emerging') {
      flags.push(`${label} is at emerging level (${memberScore}%) — critical gap`);
    } else if (teamAvg != null && memberScore < teamAvg - SCORE_DROP_THRESHOLD) {
      flags.push(`${label} is ${Math.round(teamAvg - memberScore)}% below team average`);
    }
  }

  return flags;
}

// ── Recommendations ───────────────────────────────────────────────────────────

const WORKSHOP_MAP = {
  cognitive:  'Narrative & Perspective-Taking Workshop',
  relational: 'Relational Connection & Trust-Building Workshop',
  agentic:    'Agency & Goal-Setting Intensive',
  emotional:  'Emotional Literacy & Regulation Workshop',
  spiritual:  'Purpose, Values & Meaning-Making Retreat',
  somatic:    'Somatic Awareness & Stress-Regulation Practice',
};

const INTERVENTION_COPY = {
  cognitive:  'Provide structured journaling prompts and cognitive reframing exercises.',
  relational: 'Facilitate team bonding sessions and peer support check-ins.',
  agentic:    'Implement short-term goal sprints with visible progress tracking.',
  emotional:  'Introduce emotional check-in rituals at the start of team meetings.',
  spiritual:  'Run a values-clarification exercise and connect daily tasks to team purpose.',
  somatic:    'Integrate body-scan breaks and mindful movement into the workday.',
};

/**
 * Build recommendations from dimension averages.
 */
function buildRecommendations(dimAverages, memberStatus, peerPairs) {
  const sorted = Object.entries(dimAverages)
    .filter(([, v]) => v != null)
    .sort((a, b) => b[1] - a[1]);

  const top3Keys    = sorted.slice(0, 3).map(([k]) => k);
  const bottom3Keys = sorted.slice(-3).map(([k]) => k);

  const strengthFocus = top3Keys.map(
    (k) => `Leverage ${DIM_LABELS[k]}: team scores ${dimAverages[k]}% — share best practices across teams.`
  );

  const riskKeys = bottom3Keys.filter((k) => (dimAverages[k] || 100) < 55);
  const riskIntervention = riskKeys.map(
    (k) => INTERVENTION_COPY[k] || `Focus on improving ${DIM_LABELS[k]}.`
  );

  const workshopSuggestions = bottom3Keys.map((k) => WORKSHOP_MAP[k]).filter(Boolean);

  return {
    strengthFocus,
    riskIntervention,
    workshopSuggestions,
    peerMentoringPairs: peerPairs,
  };
}

// ── Narrative HTML report ─────────────────────────────────────────────────────

/**
 * Generate an HTML narrative report from computed analytics data.
 *
 * @param {Object} analytics — result of buildTeamAnalytics()
 * @returns {string} HTML string
 */
function generateNarrativeReport(analytics) {
  const { teamProfile, memberStatus, recommendations } = analytics;
  const { name, overallScore, memberCount, dimensionAverages } = teamProfile;

  const level = overallScore >= 80 ? 'High'
    : overallScore >= 65 ? 'Strong'
    : overallScore >= 45 ? 'Developing'
    : 'Emerging';

  const assessedCount = memberStatus.filter((m) => m.status === 'assessed').length;
  const atRiskMembers = memberStatus.filter((m) => m.riskFlags && m.riskFlags.length > 0);

  const dimRows = Object.entries(DIM_LABELS).map(([key, label]) => {
    const score = dimensionAverages[key] || 0;
    const cat   = scoreCategory(score) || 'emerging';
    return `
      <tr>
        <td style="padding:8px 12px;font-weight:500;">${label}</td>
        <td style="padding:8px 12px;">${score}%</td>
        <td style="padding:8px 12px;text-transform:capitalize;">${cat}</td>
      </tr>`;
  }).join('');

  const strengthList = (recommendations.strengthFocus || [])
    .map((s) => `<li>${s}</li>`).join('');
  const riskList = (recommendations.riskIntervention || [])
    .map((r) => `<li>${r}</li>`).join('') || '<li>No critical risk areas identified.</li>';
  const workshopList = (recommendations.workshopSuggestions || [])
    .map((w) => `<li>${w}</li>`).join('') || '<li>No workshops recommended at this time.</li>';

  const atRiskSection = atRiskMembers.length
    ? `<ul>${atRiskMembers.map((m) =>
        `<li><strong>${m.name}</strong> — ${m.riskFlags.join('; ')}</li>`
      ).join('')}</ul>`
    : '<p>No members are currently at risk. Great work!</p>';

  const pairsSection = (recommendations.peerMentoringPairs || []).length
    ? `<ul>${recommendations.peerMentoringPairs.map((p) =>
        `<li><strong>${p.mentor}</strong> can mentor <strong>${p.mentee}</strong> in ${p.dimension}</li>`
      ).join('')}</ul>`
    : '<p>Insufficient data to suggest mentoring pairs at this time.</p>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Team Resilience Report — ${name}</title>
  <style>
    body{font-family:'Segoe UI',Arial,sans-serif;color:#1a202c;margin:0;padding:0;background:#f7f8fa;}
    .report{max-width:860px;margin:0 auto;padding:40px 32px;}
    h1{color:#2d3748;font-size:2rem;margin-bottom:4px;}
    h2{color:#4a5568;font-size:1.25rem;margin-top:32px;margin-bottom:12px;border-bottom:2px solid #e2e8f0;padding-bottom:6px;}
    .badge{display:inline-block;padding:4px 12px;border-radius:999px;font-size:0.85rem;font-weight:600;}
    .badge-high{background:#c6f6d5;color:#276749;}
    .badge-strong{background:#bee3f8;color:#2b6cb0;}
    .badge-developing{background:#fefcbf;color:#975a16;}
    .badge-emerging{background:#fed7d7;color:#9b2c2c;}
    .kpi-grid{display:flex;gap:16px;flex-wrap:wrap;margin:16px 0;}
    .kpi{background:#fff;border-radius:12px;padding:20px 24px;flex:1;min-width:140px;box-shadow:0 1px 4px rgba(0,0,0,.08);}
    .kpi-val{font-size:2rem;font-weight:700;color:#3182ce;}
    .kpi-label{font-size:0.8rem;color:#718096;margin-top:4px;}
    table{width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06);}
    th{background:#ebf4ff;padding:10px 12px;text-align:left;font-size:0.85rem;color:#2b6cb0;}
    tr:nth-child(even){background:#f7fafc;}
    ul{padding-left:20px;line-height:1.9;}
    .footer{margin-top:48px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:0.8rem;color:#a0aec0;text-align:center;}
  </style>
</head>
<body>
<div class="report">
  <h1>Team Resilience Report</h1>
  <p style="color:#718096;margin-bottom:24px;">Organization: <strong>${name}</strong> &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString()}</p>

  <h2>Executive Summary</h2>
  <p>
    <strong>${name}</strong> has a team resilience level of
    <span class="badge badge-${level.toLowerCase()}">${level}</span>
    with an overall score of <strong>${overallScore ?? 'N/A'}%</strong>.
    ${assessedCount} of ${memberCount} members completed assessments in this cycle.
    ${atRiskMembers.length > 0
      ? `<strong style="color:#e53e3e;">${atRiskMembers.length} member(s) have been flagged for follow-up support.</strong>`
      : 'No members currently require urgent intervention.'}
  </p>

  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-val">${overallScore ?? '—'}%</div><div class="kpi-label">Overall Resilience</div></div>
    <div class="kpi"><div class="kpi-val">${memberCount}</div><div class="kpi-label">Team Members</div></div>
    <div class="kpi"><div class="kpi-val">${assessedCount}</div><div class="kpi-label">Completed Assessments</div></div>
    <div class="kpi"><div class="kpi-val">${atRiskMembers.length}</div><div class="kpi-label">Members at Risk</div></div>
  </div>

  <h2>Dimension Analysis</h2>
  <table>
    <thead><tr><th>Dimension</th><th>Team Average</th><th>Category</th></tr></thead>
    <tbody>${dimRows}</tbody>
  </table>

  <h2>Strengths &amp; Opportunities</h2>
  ${strengthList ? `<ul>${strengthList}</ul>` : '<p>Insufficient data.</p>'}

  <h2>Risk Summary</h2>
  ${atRiskSection}

  <h2>Recommended Actions</h2>
  <ul>${riskList}</ul>

  <h2>Suggested Workshops &amp; Resources</h2>
  <ul>${workshopList}</ul>

  <h2>Peer Mentoring Suggestions</h2>
  ${pairsSection}

  <div class="footer">
    Resilience Atlas — Confidential Team Report &nbsp;|&nbsp; ${new Date().getFullYear()}
  </div>
</div>
</body>
</html>`;
}

// ── Main analytics builder ────────────────────────────────────────────────────

/**
 * Build (or refresh) team analytics for an organization.
 *
 * Steps:
 *  1. Load org + all member users
 *  2. Load latest ResilienceResult per user
 *  3. Compute dimension averages
 *  4. Build member status list with risk flags
 *  5. Identify peer mentoring pairs
 *  6. Build recommendations
 *  7. Append trend entry to existing TeamProfile (or create new)
 *  8. Generate HTML narrative
 *  9. Persist and return the TeamProfile document
 *
 * @param {string|ObjectId} orgId
 * @param {Object}          [options]
 * @param {boolean}         [options.save=true]   — persist to DB
 * @param {string|null}     [options.teamId=null]  — scope to a specific sub-team
 * @returns {Promise<Object>} analytics payload (same shape as TeamProfile fields)
 */
async function buildTeamAnalytics(orgId, options = {}) {
  const { save = true, teamId = null } = options;

  const org = await Organization.findById(orgId).lean();
  if (!org) throw new Error('Organization not found');

  // Load members — optionally scoped to a specific sub-team via teamName
  const userQuery = { organizationId: orgId };
  const members = await User.find(userQuery, {
    _id: 1, username: 1, email: 1, teamName: 1, role: 1,
  }).lean();

  const userIds = members.map((m) => m._id);

  // Load sharing consent records for this org
  const sharingRecords = await UserDataSharing.find(
    { organizationId: orgId },
    { userId: 1, scoresEnabled: 1 }
  ).lean();
  const consentUserIdSet = new Set(
    sharingRecords
      .filter((s) => s.scoresEnabled === true)
      .map((s) => s.userId.toString())
  );

  // Latest result per user — only for members who have consented to share scores
  // A result qualifies if:
  //   a) the user has a UserDataSharing record with scoresEnabled === true, OR
  //   b) the result itself has sharingConsent.scores === true
  const allResults = await ResilienceResult.find(
    { organizationId: orgId, userId: { $in: userIds } },
  ).sort({ createdAt: -1 }).lean();

  const latestByUser = {};
  for (const r of allResults) {
    const uid = r.userId?.toString();
    if (!uid) continue;
    if (latestByUser[uid]) continue; // already have the latest
    // Only include if user has consented (via UserDataSharing or inline field)
    const hasConsent = consentUserIdSet.has(uid) || r.sharingConsent?.scores === true;
    if (hasConsent) latestByUser[uid] = r;
  }

  // ── Compute dimension averages ────────────────────────────────────────────

  const dimValuesMap = Object.fromEntries(Object.keys(DIM_LABELS).map((k) => [k, []]));
  const overallValues = [];

  for (const uid of Object.keys(latestByUser)) {
    const r = latestByUser[uid];
    const dimScores = extractDimScores(r);
    for (const k of Object.keys(DIM_LABELS)) {
      if (dimScores[k] != null) dimValuesMap[k].push(dimScores[k]);
    }
    const overall = r.overall ?? r.overall_score ?? null;
    if (overall != null) overallValues.push(overall);
  }

  const dimAverages = {};
  for (const k of Object.keys(DIM_LABELS)) {
    dimAverages[k] = avg(dimValuesMap[k]);
  }
  const teamOverallScore = avg(overallValues);

  // ── Build dimensionAverages with display labels ───────────────────────────

  const dimensionAverages = {};
  for (const [shortKey, label] of Object.entries(DIM_LABELS)) {
    dimensionAverages[label] = dimAverages[shortKey];
  }

  // ── Build member status ───────────────────────────────────────────────────

  const memberStatus = members.map((m) => {
    const r          = latestByUser[m._id.toString()];
    const dimScores  = r ? extractDimScores(r) : {};
    const overall    = r ? (r.overall ?? r.overall_score ?? null) : null;
    const lastDate   = r ? r.createdAt : null;
    const status     = memberAssessmentStatus(lastDate);
    const riskFlags  = r ? buildRiskFlags(dimScores, dimAverages, overall) : [];

    return {
      userId:         m._id,
      name:           m.username || m.email,
      role:           m.role || 'member',
      score:          overall,
      assessmentDate: lastDate,
      status,
      riskFlags,
      dimensionScores: {
        relational: dimScores.relational ?? null,
        cognitive:  dimScores.cognitive  ?? null,
        somatic:    dimScores.somatic    ?? null,
        emotional:  dimScores.emotional  ?? null,
        spiritual:  dimScores.spiritual  ?? null,
        agentic:    dimScores.agentic    ?? null,
      },
    };
  });

  // ── Peer mentoring pairs ──────────────────────────────────────────────────

  const peerPairs = identifyMentoringPairs(memberStatus, dimAverages);

  // ── Recommendations ───────────────────────────────────────────────────────

  const recommendations = buildRecommendations(dimAverages, memberStatus, peerPairs);

  // ── Trend entry ───────────────────────────────────────────────────────────

  const trendEntry = {
    date:    new Date(),
    average: teamOverallScore,
    min:     minVal(overallValues),
    max:     maxVal(overallValues),
  };

  // Per-dimension trend entries
  const dimTrends = {};
  for (const [shortKey, label] of Object.entries(DIM_LABELS)) {
    dimTrends[label] = {
      date:    new Date(),
      average: dimAverages[shortKey],
      min:     minVal(dimValuesMap[shortKey]),
      max:     maxVal(dimValuesMap[shortKey]),
    };
  }

  const mostRecentAssessment = Object.values(latestByUser)
    .map((r) => r.createdAt)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a))[0] || null;

  // ── Assemble payload ──────────────────────────────────────────────────────

  const analyticsPayload = {
    orgId,
    teamId: teamId || null,
    teamProfile: {
      name:           org.name || org.company_name || 'Team',
      memberCount:    members.length,
      overallScore:   teamOverallScore,
      assessmentDate: mostRecentAssessment,
      dimensionAverages,
    },
    memberStatus,
    recommendations,
  };

  // Generate HTML report
  analyticsPayload.generatedReport = generateNarrativeReport(analyticsPayload);

  // ── Persist ───────────────────────────────────────────────────────────────

  if (save) {
    // Find existing profile to carry forward trend history
    const existing = await TeamProfile.findOne({ orgId, teamId: teamId || null })
      .sort({ createdAt: -1 })
      .lean();

    const prevTrends = existing ? (existing.teamProfile?.trends || {}) : {};

    // Append new trend entries per dimension
    const updatedTrends = {};
    for (const label of DIMENSIONS) {
      const prev   = (prevTrends[label] || []).slice(-29); // keep last 29 + new = 30 max
      const entry  = dimTrends[label];
      updatedTrends[label] = entry ? [...prev, entry] : prev;
    }

    const profileDoc = await TeamProfile.create({
      orgId,
      teamId:     teamId || null,
      teamProfile: {
        ...analyticsPayload.teamProfile,
        trends: updatedTrends,
      },
      memberStatus,
      recommendations: {
        strengthFocus:       recommendations.strengthFocus,
        riskIntervention:    recommendations.riskIntervention,
        workshopSuggestions: recommendations.workshopSuggestions,
        peerMentoringPairs:  peerPairs,
      },
      generatedReport: analyticsPayload.generatedReport,
      generatedAt:     new Date(),
    });

    return profileDoc.toObject();
  }

  return analyticsPayload;
}

/**
 * Retrieve the most recent TeamProfile for an organization (without re-computing).
 *
 * @param {string|ObjectId} orgId
 * @param {string|null}     [teamId]
 * @returns {Promise<Object|null>}
 */
async function getLatestTeamProfile(orgId, teamId = null) {
  return TeamProfile.findOne({ orgId, teamId: teamId || null, isActive: true })
    .sort({ createdAt: -1 })
    .lean();
}

module.exports = {
  buildTeamAnalytics,
  getLatestTeamProfile,
  generateNarrativeReport,
  identifyMentoringPairs,
  buildRiskFlags,
  buildRecommendations,
  DIMENSIONS,
  DIM_LABELS,
  scoreCategory,
};
