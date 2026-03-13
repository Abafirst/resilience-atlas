'use strict';

/**
 * organization.js
 *
 * Routes for managing organizations (create, invite members, link results).
 * All mutating endpoints require authentication.
 */

const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const Organization = require('../models/Organization');
const Invite = require('../models/Invite');
const ResilienceResult = require('../models/ResilienceResult');
const User = require('../models/User');
const emailService = require('../services/emailService');
const { authenticateJWT } = require('../middleware/auth');
const { maybeAutoGenerate } = require('../services/leadership-report-generator');

const router = express.Router();

const orgLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(orgLimiter);

// ── Helpers ───────────────────────────────────────────────────────────────────

function isAdmin(org, userId) {
  return org.admins.some((id) => id.toString() === userId.toString());
}

// ── Create organization ───────────────────────────────────────────────────────

/**
 * POST /api/org
 * Create a new organization. The requesting user becomes the first admin.
 */
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Organization name is required.' });
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

// ── Get organization ──────────────────────────────────────────────────────────

/**
 * GET /api/org/:organizationId
 * Get organization details. Admin only.
 */
router.get('/:organizationId', authenticateJWT, async (req, res) => {
  try {
    const { organizationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ error: 'Invalid organization ID.' });
    }

    const org = await Organization.findById(organizationId);
    if (!org) return res.status(404).json({ error: 'Organization not found.' });

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
 * Invite users by email. Creates Invite records with unique tokens and sends emails.
 * Admin only.
 * Body: { emails: [string], role?: "member"|"admin", team_name?: string }
 */
router.post('/:organizationId/invite', authenticateJWT, async (req, res) => {
  try {
    const { organizationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ error: 'Invalid organization ID.' });
    }

    const org = await Organization.findById(organizationId);
    if (!org) return res.status(404).json({ error: 'Organization not found.' });

    if (!isAdmin(org, req.user.userId)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const { emails, role = 'member', team_name = null } = req.body;
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'emails must be a non-empty array.' });
    }
    if (!['member', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'role must be "member" or "admin".' });
    }

    const sanitised = emails
      .map((e) => String(e).toLowerCase().trim())
      .filter((e) => e.includes('@'));

    if (sanitised.length === 0) {
      return res.status(400).json({ error: 'No valid email addresses provided.' });
    }

    // INVITE_EXPIRY_DAYS defaults to 7; validate it's a positive integer
    const parsedExpiry = parseInt(process.env.INVITE_EXPIRY_DAYS || '7', 10);
    const expiryDays = (!isNaN(parsedExpiry) && parsedExpiry > 0) ? parsedExpiry : 7;
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    const createdInvites = [];
    const errors = [];

    for (const email of sanitised) {
      try {
        // If a pending invite already exists for this email+org, reuse / update it
        const inviteToken = crypto.randomBytes(32).toString('hex');

        const invite = await Invite.findOneAndUpdate(
          { organizationId, email, status: 'pending' },
          {
            $set: {
              role,
              teamName: team_name,
              inviteToken,
              expiresAt,
              status: 'pending',
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        createdInvites.push(invite);

        // Also update legacy invitedEmails list on the org
        await Organization.findByIdAndUpdate(organizationId, {
          $addToSet: { invitedEmails: email },
        });

        // Send invitation email (non-fatal failure)
        try {
          const joinLink = `${appUrl}/join.html?token=${inviteToken}`;
          await emailService.sendInviteEmail(email, org.name, joinLink);
        } catch (emailErr) {
          console.warn(`Invite email failed for ${email}:`, emailErr.message);
        }
      } catch (err) {
        console.error(`Failed to create invite for ${email}:`, err.message);
        errors.push(email);
      }
    }

    res.json({
      success: true,
      invites_sent: createdInvites.length,
      message: `Invitations sent to ${createdInvites.length} user(s).`,
      ...(errors.length > 0 ? { errors } : {}),
    });
  } catch (err) {
    console.error('Invite error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── Accept invite (join via token) ────────────────────────────────────────────

/**
 * GET /api/org/join?token=<inviteToken>
 * Validate an invite token and return the invite details.
 * Used by the /join.html page to show organization info before signup.
 */
router.get('/join', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Invite token is required.' });

    const invite = await Invite.findOne({ inviteToken: token });
    if (!invite) return res.status(404).json({ error: 'Invalid or expired invite token.' });

    if (invite.status === 'accepted') {
      return res.status(410).json({ error: 'This invitation has already been accepted.' });
    }
    if (invite.status === 'expired' || invite.expiresAt < new Date()) {
      if (invite.status !== 'expired') {
        await Invite.findByIdAndUpdate(invite._id, { status: 'expired' });
      }
      return res.status(410).json({ error: 'This invitation has expired.' });
    }

    const org = await Organization.findById(invite.organizationId, { name: 1, tier: 1 }).lean();

    res.json({
      valid: true,
      invite: {
        email:         invite.email,
        role:          invite.role,
        team_name:     invite.teamName,
        organization:  org ? { id: org._id, name: org.name, tier: org.tier } : null,
        expires_at:    invite.expiresAt,
      },
    });
  } catch (err) {
    console.error('Join token error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/org/join
 * Accept an invite token — links an authenticated user to the organization.
 * Body: { token: string }
 */
router.post('/join', authenticateJWT, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Invite token is required.' });

    const invite = await Invite.findOne({ inviteToken: token });
    if (!invite) return res.status(404).json({ error: 'Invalid or expired invite token.' });

    if (invite.status === 'accepted') {
      return res.status(410).json({ error: 'This invitation has already been accepted.' });
    }
    if (invite.status === 'expired' || invite.expiresAt < new Date()) {
      if (invite.status !== 'expired') {
        await Invite.findByIdAndUpdate(invite._id, { status: 'expired' });
      }
      return res.status(410).json({ error: 'This invitation has expired.' });
    }

    const userId = req.user.userId || req.user.id;

    // Associate user with organization
    await User.findByIdAndUpdate(userId, {
      organizationId: invite.organizationId,
      role:           invite.role,
      teamName:       invite.teamName,
    });

    // Mark invite as accepted
    await Invite.findByIdAndUpdate(invite._id, { status: 'accepted' });

    res.json({
      success: true,
      message: 'You have successfully joined the organization.',
      organization_id: invite.organizationId,
      role:            invite.role,
      team_name:       invite.teamName,
    });
  } catch (err) {
    console.error('Join org error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── Link a completed result ───────────────────────────────────────────────────

/**
 * POST /api/org/:organizationId/results
 * Associate a completed ResilienceResult with the organization.
 * Triggers auto-generation check.
 * Body: { resultId: string }
 */
router.post('/:organizationId/results', authenticateJWT, async (req, res) => {
  try {
    const { organizationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ error: 'Invalid organization ID.' });
    }

    const { resultId } = req.body;
    if (!resultId || !mongoose.Types.ObjectId.isValid(resultId)) {
      return res.status(400).json({ error: 'Valid resultId is required.' });
    }

    const org = await Organization.findById(organizationId);
    if (!org) return res.status(404).json({ error: 'Organization not found.' });

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
      message: 'Result linked to organization.',
      autoReportGenerated: !!autoReport,
      autoReportId: autoReport ? autoReport._id : null,
    });
  } catch (err) {
    console.error('Link result error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
