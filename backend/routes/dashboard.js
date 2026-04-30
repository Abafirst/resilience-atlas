'use strict';

/**
 * dashboard.js
 *
 * Business-tier analytics endpoints.
 *
 * All endpoints require authentication AND that the authenticated user
 * belongs to an organization (user.organizationId is set).
 *
 *   GET /api/dashboard/org-summary      — Organization-level statistics
 *   GET /api/dashboard/team-breakdown   — Per-team breakdown
 *   GET /api/dashboard/members          — Member results list
 *   GET /api/dashboard/export/csv       — CSV download of member results
 */

const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const { authenticateJWT } = require('../middleware/auth');
const Organization = require('../models/Organization');
const ResilienceResult = require('../models/ResilienceResult');
const User = require('../models/User');
const Invite = require('../models/Invite');
const UserDataSharing = require('../models/UserDataSharing');

const router = express.Router();

const dashboardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(dashboardLimiter);

// ── Dimension keys used across the quiz scoring ───────────────────────────────

const DIMENSION_KEYS = [
  'relational',
  'cognitive',
  'somatic',
  'emotional',
  'spiritual',
  'agentic',
];

// Map from quiz score keys → dashboard dimension keys
const SCORE_KEY_MAP = {
  'Relational-Connective':           'relational',
  'Cognitive-Narrative':  'cognitive',
  'Somatic-Regulative':   'somatic',
  'Emotional-Adaptive':   'emotional',
  'Spiritual-Reflective':'spiritual',
  'Agentic-Generative':   'agentic',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Resolve dimension scores from a ResilienceResult document.
 * Supports both the structured dimension_scores field and the legacy scores Map.
 */
function resolveDimensionScores(result) {
  if (result.dimension_scores && Object.values(result.dimension_scores).some((v) => v !== null)) {
    return result.dimension_scores;
  }

  // Fall back to the scores Map (legacy format)
  const scores = {};
  if (result.scores && typeof result.scores.get === 'function') {
    for (const [key, val] of result.scores.entries()) {
      const dimKey = SCORE_KEY_MAP[key];
      if (dimKey) {
        scores[dimKey] = typeof val === 'object' && val !== null ? val.percentage ?? null : val;
      }
    }
  } else if (result.scores && typeof result.scores === 'object') {
    for (const [key, val] of Object.entries(result.scores)) {
      const dimKey = SCORE_KEY_MAP[key];
      if (dimKey) {
        scores[dimKey] = typeof val === 'object' && val !== null ? val.percentage ?? null : val;
      }
    }
  }
  return scores;
}

/**
 * Calculate dimension averages from an array of dimension score objects.
 */
function avgDimensions(dimensionScoresArray) {
  const totals = {};
  const counts = {};

  for (const ds of dimensionScoresArray) {
    for (const key of DIMENSION_KEYS) {
      const v = ds[key];
      if (v !== null && v !== undefined && !isNaN(v)) {
        totals[key] = (totals[key] || 0) + Number(v);
        counts[key] = (counts[key] || 0) + 1;
      }
    }
  }

  const averages = {};
  for (const key of DIMENSION_KEYS) {
    averages[key] = counts[key] ? parseFloat((totals[key] / counts[key]).toFixed(2)) : null;
  }
  return averages;
}

/**
 * Identify the dimension with the highest/lowest average.
 */
function extremeDimension(averages, fn) {
  let best = null;
  let bestVal = null;

  for (const [key, val] of Object.entries(averages)) {
    if (val === null) continue;
    if (bestVal === null || fn(val, bestVal)) {
      best = key;
      bestVal = val;
    }
  }
  return best;
}

/**
 * Middleware: ensure the authenticated user belongs to an organization.
 */
async function requireOrgMember(req, res, next) {
  try {
    const userId = req.user && (req.user.userId || req.user.id);
    if (!userId) return res.status(401).json({ error: 'Authentication required.' });

    const user = await User.findById(userId).lean();
    if (!user) return res.status(401).json({ error: 'User not found.' });
    if (!user.organizationId) {
      return res.status(403).json({ error: 'You are not a member of any organization.' });
    }

    req.orgUser = user;
    req.orgId = user.organizationId;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Return the set of userIds (as strings) that have scoresEnabled === true
 * for the given organisation.  Null consent is treated as private (opt-in only).
 */
async function getScoringConsentUserIds(orgId) {
  const records = await UserDataSharing.find(
    { organizationId: orgId, scoresEnabled: true },
    { userId: 1 }
  ).lean();
  return new Set(records.map((r) => r.userId.toString()));
}

/**
 * Build a Mongoose query filter that restricts ResilienceResult documents
 * to those belonging to members who have consented to share scores.
 *
 * Strategy:
 *   1. Records with sharingConsent.scores === true are always included.
 *   2. Records whose owning userId appears in the UserDataSharing collection
 *      with scoresEnabled === true are also included.
 *
 * Returns an array of userId ObjectIds representing consenting users, or
 * null if the set is empty (meaning no data should be returned).
 */
async function buildConsentFilter(orgId, userIds) {
  const consentSet = await getScoringConsentUserIds(orgId);

  // Intersect with users in scope — filter out any non-ObjectId strings to avoid type mismatches
  const allowedIds = userIds
    .map((id) => id.toString())
    .filter((id) => consentSet.has(id) && mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  // When we have consenting users via UserDataSharing, combine with inline consent flag.
  // If no users have a UserDataSharing record, only include results with inline flag set.
  if (allowedIds.length > 0) {
    return {
      $or: [
        { userId: { $in: allowedIds } },
        { 'sharingConsent.scores': true },
      ],
    };
  }

  // No UserDataSharing consent records — fall back to inline field only
  return { 'sharingConsent.scores': true };
}

// ── GET /api/dashboard/org-summary ───────────────────────────────────────────

/**
 * Returns organization-level statistics.
 *
 * Response:
 * {
 *   organization: { id, name, tier, created_at },
 *   summary: {
 *     avg_overall_score, strongest_dimension, weakest_dimension,
 *     completion_rate, total_members, completed_assessments
 *   }
 * }
 */
router.get('/org-summary', authenticateJWT, requireOrgMember, async (req, res) => {
  try {
    const orgId = req.orgId;

    const [org, totalMembers] = await Promise.all([
      Organization.findById(orgId).lean(),
      User.countDocuments({ organizationId: orgId }),
    ]);

    if (!org) return res.status(404).json({ error: 'Organization not found.' });

    // Only include results from members who have explicitly consented to share scores
    const allMembers  = await User.find({ organizationId: orgId }, { _id: 1 }).lean();
    const allUserIds  = allMembers.map((m) => m._id);
    const consentFilter = await buildConsentFilter(orgId, allUserIds);
    const results = await ResilienceResult.find({
      organizationId: orgId,
      ...consentFilter,
    }).lean();

    const completedAssessments = results.length;

    // Completion rate: completed assessments / total members who have joined.
    // Pending invites (not yet accepted) are excluded — they haven't joined yet.
    const totalExpected = Math.max(totalMembers, 1);
    const completionRate = parseFloat((completedAssessments / totalExpected).toFixed(4));

    // Average overall score
    const overallScores = results.map((r) => r.overall ?? r.overall_score).filter((v) => v != null);
    const avgOverallScore =
      overallScores.length > 0
        ? parseFloat((overallScores.reduce((s, v) => s + v, 0) / overallScores.length).toFixed(2))
        : null;

    // Dimension averages
    const dimensionScoresArray = results.map(resolveDimensionScores);
    const dimensionAverages = avgDimensions(dimensionScoresArray);

    const strongestDimension = extremeDimension(dimensionAverages, (a, b) => a > b);
    const weakestDimension   = extremeDimension(dimensionAverages, (a, b) => a < b);

    // Participation stats
    const sharingRecords = await UserDataSharing.find(
      { organizationId: orgId },
      { scoresEnabled: 1, curriculumEnabled: 1 }
    ).lean();
    const scoresSharing     = sharingRecords.filter((r) => r.scoresEnabled === true).length;
    const curriculumSharing = sharingRecords.filter((r) => r.curriculumEnabled === true).length;

    res.json({
      organization: {
        id:         org._id,
        name:       org.name,
        tier:       org.tier,
        created_at: org.createdAt,
      },
      summary: {
        avg_overall_score:    avgOverallScore,
        strongest_dimension:  strongestDimension,
        weakest_dimension:    weakestDimension,
        completion_rate:      completionRate,
        total_members:        totalMembers,
        completed_assessments: completedAssessments,
        dimension_averages:   dimensionAverages,
        participation: {
          scoresSharing,
          curriculumSharing,
          total: totalMembers,
        },
      },
    });
  } catch (err) {
    console.error('Dashboard org-summary error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/dashboard/team-breakdown ────────────────────────────────────────

/**
 * Returns team-level breakdown if the org uses teams.
 *
 * Response:
 * {
 *   teams: [
 *     { team_name, avg_score, member_count, dimension_averages }
 *   ]
 * }
 */
router.get('/team-breakdown', authenticateJWT, requireOrgMember, async (req, res) => {
  try {
    const orgId = req.orgId;

    // Get all users in the org with their team names
    const members = await User.find({ organizationId: orgId }, { _id: 1, teamName: 1 }).lean();
    const userIds = members.map((m) => m._id);

    // Only include results from members who have consented to share scores
    const consentFilter = await buildConsentFilter(orgId, userIds);
    const results = await ResilienceResult.find({
      organizationId: orgId,
      userId: { $in: userIds },
      ...consentFilter,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Map userId → latest result
    const latestByUser = {};
    for (const r of results) {
      const uid = r.userId?.toString();
      if (uid && !latestByUser[uid]) latestByUser[uid] = r;
    }

    // Group by team
    const teamMap = {};
    for (const member of members) {
      const team = member.teamName || 'Unassigned';
      if (!teamMap[team]) teamMap[team] = { members: [], results: [] };
      teamMap[team].members.push(member);
      const result = latestByUser[member._id.toString()];
      if (result) teamMap[team].results.push(result);
    }

    const teams = Object.entries(teamMap).map(([team_name, { members: mems, results: res_ }]) => {
      const overallScores = res_.map((r) => r.overall ?? r.overall_score).filter((v) => v != null);
      const avgScore =
        overallScores.length > 0
          ? parseFloat((overallScores.reduce((s, v) => s + v, 0) / overallScores.length).toFixed(2))
          : null;
      const dimensionAverages = avgDimensions(res_.map(resolveDimensionScores));

      return {
        team_name,
        avg_score: avgScore,
        member_count: mems.length,
        completed_count: res_.length,
        dimension_averages: dimensionAverages,
      };
    });

    res.json({ teams });
  } catch (err) {
    console.error('Dashboard team-breakdown error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/dashboard/members ────────────────────────────────────────────────

/**
 * Returns list of all organization members with their latest result.
 *
 * Response:
 * {
 *   members: [
 *     { user_id, name, email, team, overall_score, dominant_dimension,
 *       completed_at, dimension_scores }
 *   ]
 * }
 */
router.get('/members', authenticateJWT, requireOrgMember, async (req, res) => {
  try {
    const orgId = req.orgId;

    const members = await User.find(
      { organizationId: orgId },
      { _id: 1, username: 1, email: 1, teamName: 1, role: 1 }
    ).lean();

    const userIds = members.map((m) => m._id);

    // Fetch all results (regardless of consent) for presence detection,
    // then apply consent to determine what data to expose.
    const allResults = await ResilienceResult.find({ organizationId: orgId, userId: { $in: userIds } })
      .sort({ createdAt: -1 })
      .lean();

    // Map userId → latest result (any result, for activity tracking)
    const latestByUser = {};
    for (const r of allResults) {
      const uid = r.userId?.toString();
      if (uid && !latestByUser[uid]) latestByUser[uid] = r;
    }

    // Fetch sharing consent records for this org
    const sharingRecords = await UserDataSharing.find(
      { organizationId: orgId },
      { userId: 1, scoresEnabled: 1, curriculumEnabled: 1 }
    ).lean();
    const sharingByUser = {};
    for (const s of sharingRecords) {
      sharingByUser[s.userId.toString()] = s;
    }

    const memberList = members.map((m) => {
      const uid     = m._id.toString();
      const r       = latestByUser[uid];
      const sharing = sharingByUser[uid];

      // Determine per-user consent state
      // Falls back to inline sharingConsent if no UserDataSharing doc exists
      const scoresSharing = sharing
        ? sharing.scoresEnabled === true
        : r?.sharingConsent?.scores === true;
      const curriculumSharing = sharing
        ? sharing.curriculumEnabled === true
        : r?.sharingConsent?.curriculum === true;

      return {
        user_id:            m._id,
        name:               m.username || m.email,
        email:              m.email,
        team:               m.teamName || null,
        role:               m.role || 'member',
        // Only expose score data when the member has consented
        overall_score:      scoresSharing && r ? (r.overall ?? r.overall_score ?? null) : null,
        dominant_dimension: scoresSharing && r ? (r.dominant_dimension ?? r.dominantType ?? null) : null,
        completed_at:       r ? r.createdAt : null,
        dimension_scores:   scoresSharing && r ? resolveDimensionScores(r) : null,
        // Privacy indicators
        scores_sharing:     scoresSharing,
        curriculum_sharing: curriculumSharing,
        has_assessment:     !!r,
      };
    });

    res.json({ members: memberList });
  } catch (err) {
    console.error('Dashboard members error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/dashboard/export/csv ─────────────────────────────────────────────

/**
 * Download all member results as a CSV file.
 * Admin only.
 */
router.get('/export/csv', authenticateJWT, requireOrgMember, async (req, res) => {
  try {
    // Require admin role for export
    if (req.orgUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required for CSV export.' });
    }

    const orgId = req.orgId;

    const members = await User.find(
      { organizationId: orgId },
      { _id: 1, username: 1, email: 1, teamName: 1 }
    ).lean();

    const userIds = members.map((m) => m._id);
    const allResults = await ResilienceResult.find({ organizationId: orgId, userId: { $in: userIds } })
      .sort({ createdAt: -1 })
      .lean();

    // Map userId → latest result
    const latestByUser = {};
    for (const r of allResults) {
      const uid = r.userId?.toString();
      if (uid && !latestByUser[uid]) latestByUser[uid] = r;
    }

    // Fetch sharing consent records
    const sharingRecords = await UserDataSharing.find(
      { organizationId: orgId },
      { userId: 1, scoresEnabled: 1 }
    ).lean();
    const sharingByUser = {};
    for (const s of sharingRecords) {
      sharingByUser[s.userId.toString()] = s;
    }

    const header = [
      'Name',
      'Email',
      'Team',
      'Scores_Sharing',
      'Overall_Score',
      'Relational-Connective',
      'Cognitive',
      'Somatic',
      'Emotional',
      'Spiritual',
      'Agentic',
      'Dominant_Dimension',
      'Completed_At',
    ].join(',');

    const rows = members.map((m) => {
      const uid     = m._id.toString();
      const r       = latestByUser[uid];
      const sharing = sharingByUser[uid];
      const scoresSharing = sharing
        ? sharing.scoresEnabled === true
        : r?.sharingConsent?.scores === true;

      const dimScores   = scoresSharing && r ? resolveDimensionScores(r) : {};
      const completedAt = r ? (r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : '') : '';

      return [
        csvEscape(m.username || ''),
        csvEscape(m.email || ''),
        csvEscape(m.teamName || ''),
        scoresSharing ? 'Yes' : 'No',
        scoresSharing && r ? (r.overall ?? r.overall_score ?? '') : '',
        dimScores.relational  ?? '',
        dimScores.cognitive   ?? '',
        dimScores.somatic     ?? '',
        dimScores.emotional   ?? '',
        dimScores.spiritual   ?? '',
        dimScores.agentic     ?? '',
        csvEscape(scoresSharing && r ? (r.dominant_dimension ?? r.dominantType ?? '') : ''),
        completedAt,
      ].join(',');
    });

    const csv = [header, ...rows].join('\n');

    const org = await Organization.findById(orgId, { name: 1 }).lean();
    const filename = `resilience-results-${(org?.name || 'org').replace(/\s+/g, '-')}-${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    console.error('Dashboard CSV export error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

function csvEscape(value) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

module.exports = router;
