'use strict';

/**
 * organization.js
 *
 * Routes for managing organisations (create, invite members, link results).
 * All mutating endpoints require authentication.
 */

const express = require('express');
const mongoose = require('mongoose');

const Organization = require('../models/Organization');
const ResilienceResult = require('../models/ResilienceResult');
const { authenticateJWT } = require('../middleware/auth');
const { maybeAutoGenerate } = require('../services/leadership-report-generator');

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

function isAdmin(org, userId) {
  return org.admins.some((id) => id.toString() === userId.toString());
}

// ── Create organisation ───────────────────────────────────────────────────────

/**
 * POST /api/org
 * Create a new organisation. The requesting user becomes the first admin.
 */
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Organisation name is required.' });
    }

    const org = await Organization.create({
      name: name.trim(),
      admins: [req.user.userId],
    });

    res.status(201).json({ organization: org });
  } catch (err) {
    console.error('Create org error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── Get organisation ──────────────────────────────────────────────────────────

/**
 * GET /api/org/:organizationId
 * Get organisation details. Admin only.
 */
router.get('/:organizationId', authenticateJWT, async (req, res) => {
  try {
    const { organizationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ error: 'Invalid organisation ID.' });
    }

    const org = await Organization.findById(organizationId);
    if (!org) return res.status(404).json({ error: 'Organisation not found.' });

    if (!isAdmin(org, req.user.userId)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json({ organization: org });
  } catch (err) {
    console.error('Get org error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── Invite members ────────────────────────────────────────────────────────────

/**
 * POST /api/org/:organizationId/invite
 * Add email addresses to the invited list. Admin only.
 * Body: { emails: [string] }
 */
router.post('/:organizationId/invite', authenticateJWT, async (req, res) => {
  try {
    const { organizationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ error: 'Invalid organisation ID.' });
    }

    const org = await Organization.findById(organizationId);
    if (!org) return res.status(404).json({ error: 'Organisation not found.' });

    if (!isAdmin(org, req.user.userId)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const { emails } = req.body;
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'emails must be a non-empty array.' });
    }

    const sanitised = emails
      .map((e) => String(e).toLowerCase().trim())
      .filter((e) => e.includes('@'));

    await Organization.findByIdAndUpdate(organizationId, {
      $addToSet: { invitedEmails: { $each: sanitised } },
    });

    res.json({ message: `${sanitised.length} email(s) added.`, emails: sanitised });
  } catch (err) {
    console.error('Invite error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── Link a completed result ───────────────────────────────────────────────────

/**
 * POST /api/org/:organizationId/results
 * Associate a completed ResilienceResult with the organisation.
 * Triggers auto-generation check.
 * Body: { resultId: string }
 */
router.post('/:organizationId/results', authenticateJWT, async (req, res) => {
  try {
    const { organizationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ error: 'Invalid organisation ID.' });
    }

    const { resultId } = req.body;
    if (!resultId || !mongoose.Types.ObjectId.isValid(resultId)) {
      return res.status(400).json({ error: 'Valid resultId is required.' });
    }

    const org = await Organization.findById(organizationId);
    if (!org) return res.status(404).json({ error: 'Organisation not found.' });

    await Organization.findByIdAndUpdate(organizationId, {
      $addToSet: { completedResultIds: resultId },
    });

    // Trigger auto-generation if threshold reached
    let autoReport = null;
    try {
      autoReport = await maybeAutoGenerate(organizationId);
    } catch (_) {
      // Non-fatal — report generation failures should not block result submission
    }

    res.json({
      message: 'Result linked to organisation.',
      autoReportGenerated: !!autoReport,
      autoReportId: autoReport ? autoReport._id : null,
    });
  } catch (err) {
    console.error('Link result error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
