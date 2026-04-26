'use strict';

/**
 * team-analytics.js — REST API for the real-time team analytics dashboard.
 *
 * Base path: /api/team-analytics
 *
 * Endpoints:
 *   GET  /api/team-analytics/:orgId              — get latest analytics snapshot (admin only)
 *   POST /api/team-analytics/:orgId/generate     — trigger fresh analytics generation (admin only)
 *   GET  /api/team-analytics/:orgId/report       — download HTML narrative report (admin only)
 *   GET  /api/team-analytics/:orgId/members      — member status list
 *                                                  (admin: full detail; member: own row + team avg)
 *   GET  /api/team-analytics/:orgId/risk         — at-risk member list (admin only)
 *   GET  /api/team-analytics/:orgId/compare      — compare two snapshots (admin only)
 */

const express    = require('express');
const mongoose   = require('mongoose');
const rateLimit  = require('express-rate-limit');

const { authenticateJWT } = require('../middleware/auth');
const Organization = require('../models/Organization');
const TeamProfile   = require('../models/TeamProfile');
const User          = require('../models/User');
const { buildTeamAnalytics, getLatestTeamProfile } = require('../services/teamAnalyticsService');

const router = express.Router();

// ── Rate limiter ──────────────────────────────────────────────────────────────

const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(analyticsLimiter);

// ── Guards ────────────────────────────────────────────────────────────────────

/**
 * Resolve and authorize: returns { org, user } or sends an error response.
 * role: 'admin' — only org admins; 'member' — any org member.
 */
async function resolveOrgAccess(req, res, role = 'admin') {
  const { orgId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(orgId)) {
    res.status(400).json({ error: 'Invalid organization ID.' });
    return null;
  }

  const userId = req.user && (req.user.userId || req.user.id);
  if (!userId) {
    res.status(401).json({ error: 'Authentication required.' });
    return null;
  }

  const [org, user] = await Promise.all([
    Organization.findById(orgId).lean(),
    User.findById(userId).lean(),
  ]);

  if (!org) {
    res.status(404).json({ error: 'Organization not found.' });
    return null;
  }

  if (!user || user.organizationId?.toString() !== orgId) {
    res.status(403).json({ error: 'You are not a member of this organization.' });
    return null;
  }

  if (role === 'admin') {
    const isAdmin =
      org.admins && org.admins.some((id) => id.toString() === userId.toString());
    if (!isAdmin) {
      res.status(403).json({ error: 'Admin access required.' });
      return null;
    }
  }

  return { org, user };
}

// ── GET /api/team-analytics/:orgId ────────────────────────────────────────────

/**
 * Returns the most recently computed analytics snapshot for the organization.
 * If no snapshot exists yet, returns 404 (use POST /generate first).
 */
router.get('/:orgId', authenticateJWT, async (req, res) => {
  try {
    const access = await resolveOrgAccess(req, res, 'admin');
    if (!access) return;

    const { orgId } = req.params;
    const teamId = req.query.teamId || null;

    const profile = await getLatestTeamProfile(orgId, teamId);
    if (!profile) {
      return res.status(404).json({
        error: 'No analytics snapshot found. Use POST /generate to create one.',
      });
    }

    // Omit member-level detail from the top-level response for privacy
    const { generatedReport, memberStatus, ...rest } = profile;

    res.json({
      analytics: {
        ...rest,
        memberCount: (memberStatus || []).length,
        atRiskCount: (memberStatus || []).filter((m) => m.riskFlags && m.riskFlags.length > 0).length,
        generatedAt: profile.generatedAt,
      },
    });
  } catch (err) {
    console.error('GET team-analytics error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/team-analytics/:orgId/generate ─────────────────────────────────

/**
 * Trigger a fresh analytics computation and persist the result.
 * Admin only.
 */
router.post('/:orgId/generate', authenticateJWT, async (req, res) => {
  try {
    const access = await resolveOrgAccess(req, res, 'admin');
    if (!access) return;

    const { orgId } = req.params;
    const teamId = req.body.teamId || req.query.teamId || null;

    const profile = await buildTeamAnalytics(orgId, { save: true, teamId });

    res.status(201).json({
      profileId:  profile._id,
      status:     'generated',
      generatedAt: profile.generatedAt,
      overallScore: profile.teamProfile?.overallScore,
      memberCount:  profile.teamProfile?.memberCount,
    });
  } catch (err) {
    console.error('POST team-analytics/generate error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/team-analytics/:orgId/report ────────────────────────────────────

/**
 * Returns the HTML narrative report from the latest analytics snapshot.
 * Admin only.
 */
router.get('/:orgId/report', authenticateJWT, async (req, res) => {
  try {
    const access = await resolveOrgAccess(req, res, 'admin');
    if (!access) return;

    const { orgId } = req.params;
    const teamId = req.query.teamId || null;

    const profile = await getLatestTeamProfile(orgId, teamId);
    if (!profile || !profile.generatedReport) {
      return res.status(404).json({
        error: 'No report available. Use POST /generate to create one.',
      });
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(profile.generatedReport);
  } catch (err) {
    console.error('GET team-analytics/report error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/team-analytics/:orgId/members ───────────────────────────────────

/**
 * Returns member status list.
 *
 * Admins receive full detail including dimension scores and risk flags.
 * Regular members receive only their own row plus redacted team data
 * (score replaced with team average, no risk flags for other members).
 */
router.get('/:orgId/members', authenticateJWT, async (req, res) => {
  try {
    // Allow both admin and member access; behavior differs per role
    const { orgId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orgId)) {
      return res.status(400).json({ error: 'Invalid organization ID.' });
    }

    const userId = req.user && (req.user.userId || req.user.id);
    if (!userId) return res.status(401).json({ error: 'Authentication required.' });

    const [org, user] = await Promise.all([
      Organization.findById(orgId).lean(),
      User.findById(userId).lean(),
    ]);

    if (!org) return res.status(404).json({ error: 'Organization not found.' });
    if (!user || user.organizationId?.toString() !== orgId) {
      return res.status(403).json({ error: 'You are not a member of this organization.' });
    }

    const isAdmin = org.admins && org.admins.some((id) => id.toString() === userId.toString());

    const teamId  = req.query.teamId || null;
    const profile = await getLatestTeamProfile(orgId, teamId);

    if (!profile) {
      return res.status(404).json({ error: 'No analytics snapshot found.' });
    }

    const members = profile.memberStatus || [];

    if (isAdmin) {
      return res.json({ members });
    }

    // Non-admin: return own row in full, plus a redacted view of each other member
    const redacted = members.map((m) => {
      const isOwn = m.userId?.toString() === userId.toString();
      if (isOwn) return m;
      // Return only non-sensitive aggregated info
      return {
        name:   'Team Member',
        status: m.status,
        score:  profile.teamProfile?.overallScore ?? null,  // team average as proxy
      };
    });

    res.json({ members: redacted });
  } catch (err) {
    console.error('GET team-analytics/members error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/team-analytics/:orgId/risk ──────────────────────────────────────

/**
 * Returns the list of at-risk members (those with at least one risk flag).
 * Admin only.
 */
router.get('/:orgId/risk', authenticateJWT, async (req, res) => {
  try {
    const access = await resolveOrgAccess(req, res, 'admin');
    if (!access) return;

    const { orgId } = req.params;
    const teamId  = req.query.teamId || null;
    const profile = await getLatestTeamProfile(orgId, teamId);

    if (!profile) {
      return res.status(404).json({ error: 'No analytics snapshot found.' });
    }

    const atRisk = (profile.memberStatus || [])
      .filter((m) => m.riskFlags && m.riskFlags.length > 0)
      .map(({ userId, name, role, score, assessmentDate, status, riskFlags }) => ({
        userId, name, role, score, assessmentDate, status, riskFlags,
      }));

    res.json({
      atRiskCount: atRisk.length,
      members: atRisk,
      recommendations: profile.recommendations?.riskIntervention || [],
    });
  } catch (err) {
    console.error('GET team-analytics/risk error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/team-analytics/:orgId/compare ───────────────────────────────────

/**
 * Compare two analytics snapshots by profileId.
 * Query params: ?current=<profileId>&previous=<profileId>
 * If 'previous' is omitted, the second-most-recent snapshot is used.
 * Admin only.
 */
router.get('/:orgId/compare', authenticateJWT, async (req, res) => {
  try {
    const access = await resolveOrgAccess(req, res, 'admin');
    if (!access) return;

    const { orgId } = req.params;
    const { current: currentId, previous: previousId } = req.query;

    // Load the two profiles
    let current, previous;

    if (currentId && mongoose.Types.ObjectId.isValid(currentId)) {
      current = await TeamProfile.findOne({ _id: currentId, orgId }).lean();
    } else {
      // Most recent
      current = await TeamProfile.findOne({ orgId }).sort({ createdAt: -1 }).lean();
    }

    if (!current) {
      return res.status(404).json({ error: 'Current snapshot not found.' });
    }

    if (previousId && mongoose.Types.ObjectId.isValid(previousId)) {
      previous = await TeamProfile.findOne({ _id: previousId, orgId }).lean();
    } else {
      // Second-most-recent (by skipping the most recent)
      previous = await TeamProfile.findOne({
        orgId,
        _id: { $lt: current._id },
      }).sort({ createdAt: -1 }).lean();
    }

    const currentAvg  = current.teamProfile?.overallScore ?? null;
    const previousAvg = previous ? (previous.teamProfile?.overallScore ?? null) : null;

    const delta = currentAvg != null && previousAvg != null
      ? Math.round((currentAvg - previousAvg) * 10) / 10
      : null;

    const direction = delta == null ? 'no-data'
      : delta > 0 ? 'improving'
      : delta < 0 ? 'declining'
      : 'stable';

    // Per-dimension deltas
    const dimDeltas = {};
    if (previous) {
      const curDims  = current.teamProfile?.dimensionAverages  || {};
      const prevDims = previous.teamProfile?.dimensionAverages || {};
      for (const label of Object.keys(curDims)) {
        const c = curDims[label];
        const p = prevDims[label];
        if (c != null && p != null) {
          dimDeltas[label] = Math.round((c - p) * 10) / 10;
        }
      }
    }

    res.json({
      current: {
        profileId:   current._id,
        generatedAt: current.generatedAt,
        overallScore: currentAvg,
        memberCount:  current.teamProfile?.memberCount,
      },
      previous: previous
        ? {
            profileId:   previous._id,
            generatedAt: previous.generatedAt,
            overallScore: previousAvg,
            memberCount:  previous.teamProfile?.memberCount,
          }
        : null,
      comparison: {
        overallDelta: delta,
        direction,
        dimensionDeltas: dimDeltas,
      },
    });
  } catch (err) {
    console.error('GET team-analytics/compare error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
