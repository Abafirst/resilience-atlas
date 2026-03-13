'use strict';

/**
 * organizations.js — REST API routes for the Business tier.
 *
 * All endpoints are mounted at /api/organizations.
 * They complement (and do not replace) the existing /api/org routes used by
 * the Leadership Insights feature.
 *
 * Route summary
 * ─────────────
 * POST   /api/organizations               Create organisation (business tier)
 * GET    /api/organizations/:id           Get organisation details (admin)
 * PUT    /api/organizations/:id           Update organisation settings (admin)
 * GET    /api/organizations/:id/users     List members (admin)
 * GET    /api/organizations/:id/analytics Team analytics (admin or member)
 * GET    /api/organizations/:id/results   Individual member results (admin)
 * POST   /api/organizations/:id/export/csv  Export CSV (admin)
 * POST   /api/organizations/:id/export/pdf  Export PDF (admin)
 */

const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const Organization  = require('../models/Organization');
const User          = require('../models/User');
const ResilienceResult = require('../models/ResilienceResult');
const TeamResult    = require('../models/TeamResult');
const { authenticateJWT } = require('../middleware/auth');
const { buildCsv, buildPdf } = require('../utils/export');
const { computeTeamAverages } = require('./analytics');

const router = express.Router();

// ── Rate limiting ─────────────────────────────────────────────────────────────

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

const exportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Export rate limit exceeded. Please wait before exporting again.' },
});

router.use(generalLimiter);

// ── Helpers ───────────────────────────────────────────────────────────────────

function isOrgAdmin(org, userId) {
  return org.admins && org.admins.some((id) => id.toString() === userId.toString());
}

function isOrgMember(org, userId) {
  if (isOrgAdmin(org, userId)) return true;
  // Members are users whose organization_id matches
  return false; // further check done via User query when needed
}

function validId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ── Create organisation ───────────────────────────────────────────────────────

/**
 * POST /api/organizations
 * Create a new business-tier organisation.
 * Body: { company_name, admin_email, plan }
 */
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { company_name, admin_email, plan } = req.body;

    if (!company_name || !company_name.trim()) {
      return res.status(400).json({ error: 'company_name is required.' });
    }
    if (!admin_email || !admin_email.trim()) {
      return res.status(400).json({ error: 'admin_email is required.' });
    }

    const allowedPlans = ['business', 'enterprise'];
    const resolvedPlan = allowedPlans.includes(plan) ? plan : 'business';

    const org = await Organization.create({
      name: company_name.trim(),
      company_name: company_name.trim(),
      admin_email: admin_email.toLowerCase().trim(),
      plan: resolvedPlan,
      subscription_status: 'active',
      admins: [req.user.userId],
    });

    // Mark the creating user as an admin of this org
    await User.findByIdAndUpdate(req.user.userId, {
      organization_id: org._id,
      role: 'admin',
    });

    res.status(201).json({ organization: org });
  } catch (err) {
    console.error('[organizations] create error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── Get organisation ──────────────────────────────────────────────────────────

/**
 * GET /api/organizations/:id
 * Returns organisation details. Admin only.
 */
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid organisation ID.' });

    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ error: 'Organisation not found.' });
    if (!isOrgAdmin(org, req.user.userId)) return res.status(403).json({ error: 'Access denied.' });

    res.json({ organization: org });
  } catch (err) {
    console.error('[organizations] get error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── Update organisation ───────────────────────────────────────────────────────

/**
 * PUT /api/organizations/:id
 * Update organisation settings. Admin only.
 * Body: { company_name?, admin_email?, settings? }
 */
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid organisation ID.' });

    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ error: 'Organisation not found.' });
    if (!isOrgAdmin(org, req.user.userId)) return res.status(403).json({ error: 'Access denied.' });

    const allowed = ['company_name', 'admin_email', 'settings', 'subscription_status'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    // Keep name in sync with company_name
    if (updates.company_name) updates.name = updates.company_name;

    const updated = await Organization.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({ organization: updated });
  } catch (err) {
    console.error('[organizations] update error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── List users ────────────────────────────────────────────────────────────────

/**
 * GET /api/organizations/:id/users
 * List all users belonging to this organisation. Admin only.
 */
router.get('/:id/users', authenticateJWT, async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid organisation ID.' });

    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ error: 'Organisation not found.' });
    if (!isOrgAdmin(org, req.user.userId)) return res.status(403).json({ error: 'Access denied.' });

    const users = await User.find(
      { organization_id: req.params.id },
      { password: 0 }
    ).lean();

    res.json({ users });
  } catch (err) {
    console.error('[organizations] list users error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── Invite members ────────────────────────────────────────────────────────────

/**
 * POST /api/organizations/:id/invite
 * Add email addresses to the invited list. Admin only.
 * Body: { emails: [string] }
 */
router.post('/:id/invite', authenticateJWT, async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid organisation ID.' });

    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ error: 'Organisation not found.' });
    if (!isOrgAdmin(org, req.user.userId)) return res.status(403).json({ error: 'Access denied.' });

    const { emails } = req.body;
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'emails must be a non-empty array.' });
    }

    const sanitised = emails
      .map((e) => String(e).toLowerCase().trim())
      .filter((e) => e.includes('@'));

    await Organization.findByIdAndUpdate(req.params.id, {
      $addToSet: { invitedEmails: { $each: sanitised } },
    });

    res.json({ message: `${sanitised.length} email(s) added.`, emails: sanitised });
  } catch (err) {
    console.error('[organizations] invite error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── Analytics ─────────────────────────────────────────────────────────────────

/**
 * GET /api/organizations/:id/analytics
 * Returns team statistics: averages, member count, dimension scores.
 * Accessible to admins; members can access if their organization_id matches.
 */
router.get('/:id/analytics', authenticateJWT, async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid organisation ID.' });

    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ error: 'Organisation not found.' });

    // Allow access to admins or members of this org
    const requestingUser = await User.findById(req.user.userId).lean();
    const isMember =
      requestingUser &&
      requestingUser.organization_id &&
      requestingUser.organization_id.toString() === req.params.id;

    if (!isOrgAdmin(org, req.user.userId) && !isMember) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Fetch or compute team result
    const teamResult = await computeTeamAverages(org);

    res.json({
      analytics: {
        team_count: teamResult.team_count,
        averages: teamResult.averages,
        period: teamResult.period,
      },
    });
  } catch (err) {
    console.error('[organizations] analytics error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── Results list ──────────────────────────────────────────────────────────────

/**
 * GET /api/organizations/:id/results
 * List all individual member results for this organisation. Admin only.
 */
router.get('/:id/results', authenticateJWT, async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid organisation ID.' });

    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ error: 'Organisation not found.' });
    if (!isOrgAdmin(org, req.user.userId)) return res.status(403).json({ error: 'Access denied.' });

    const results = await ResilienceResult.find({
      _id: { $in: org.completedResultIds },
    }).lean();

    res.json({ results });
  } catch (err) {
    console.error('[organizations] results error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── CSV export ────────────────────────────────────────────────────────────────

/**
 * POST /api/organizations/:id/export/csv
 * Stream a CSV file of all team member results. Admin only.
 */
router.post('/:id/export/csv', authenticateJWT, exportLimiter, async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid organisation ID.' });

    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ error: 'Organisation not found.' });
    if (!isOrgAdmin(org, req.user.userId)) return res.status(403).json({ error: 'Access denied.' });

    const results = await ResilienceResult.find({
      _id: { $in: org.completedResultIds },
    }).lean();

    const csv = buildCsv(results);
    const filename = `team-results-${req.params.id}-${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    console.error('[organizations] csv export error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── PDF export ────────────────────────────────────────────────────────────────

/**
 * POST /api/organizations/:id/export/pdf
 * Generate and stream a PDF team report. Admin only.
 */
router.post('/:id/export/pdf', authenticateJWT, exportLimiter, async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid organisation ID.' });

    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ error: 'Organisation not found.' });
    if (!isOrgAdmin(org, req.user.userId)) return res.status(403).json({ error: 'Access denied.' });

    const [results, teamResult] = await Promise.all([
      ResilienceResult.find({ _id: { $in: org.completedResultIds } }).lean(),
      TeamResult.findOne({ organization_id: req.params.id, period: 'current' }).lean(),
    ]);

    const pdfBuffer = await buildPdf(org, teamResult, results);
    const filename = `team-report-${req.params.id}-${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('[organizations] pdf export error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
