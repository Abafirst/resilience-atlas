'use strict';

/**
 * practices.js — Practice CRUD and practitioner management routes.
 */

const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const Practice = require('../models/Practice');
const PracticePractitioner = require('../models/PracticePractitioner');
const PractitionerInvitation = require('../models/PractitionerInvitation');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const emailService = require('../services/emailService');
const { authenticateJWT } = require('../middleware/auth');
const { hasPermission } = require('../config/practicePermissions');
const crypto = require('crypto');

const router = express.Router();

const practiceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

const inviteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many invitation requests. Please try again later.' },
});

router.use(practiceLimiter);

function getUserId(req) {
  return req.user && (req.user.userId || req.user.id || req.user._id);
}

async function logActivity(practiceId, userId, action, resourceType, resourceId, details, req) {
  try {
    await ActivityLog.create({
      practiceId,
      userId,
      action,
      resourceType,
      resourceId: resourceId ? resourceId.toString() : undefined,
      details: details || {},
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
  } catch (err) {
    console.error('[ActivityLog] Failed to write log:', err.message);
  }
}

async function getPractitionerRole(practiceId, userId) {
  const pp = await PracticePractitioner.findOne({
    practiceId,
    userId,
    status: 'active',
  }).lean();
  return pp ? pp.role : null;
}

// ── POST /api/practices — Create a new practice ──────────────────────────────
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { name, subscriptionTier, settings } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Practice name is required.' });
    }

    const practice = await Practice.create({
      name: name.trim(),
      ownerId: userId,
      subscriptionTier: subscriptionTier || 'basic',
      settings: settings || {},
    });

    await PracticePractitioner.create({
      practiceId: practice._id,
      userId,
      role: 'admin',
      status: 'active',
      acceptedAt: new Date(),
    });

    await logActivity(practice._id, userId, 'create_practice', 'practice', practice._id, { name: practice.name }, req);

    res.status(201).json({ practice });
  } catch (err) {
    console.error('[practices] POST /:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/practices/:id — Get practice details ────────────────────────────
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid practice ID.' });
    }

    const practice = await Practice.findById(id).lean();
    if (!practice) return res.status(404).json({ error: 'Practice not found.' });

    const role = await getPractitionerRole(id, userId);
    if (!role) return res.status(403).json({ error: 'Access denied.' });

    res.json({ practice });
  } catch (err) {
    console.error('[practices] GET /:id:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── PATCH /api/practices/:id — Update practice settings (admin only) ─────────
router.patch('/:id', authenticateJWT, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid practice ID.' });
    }

    const role = await getPractitionerRole(id, userId);
    if (!hasPermission(role, 'practice_settings', 'edit')) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    const { name, subscriptionTier, settings } = req.body;
    const update = {};
    if (name) update.name = name.trim();
    if (subscriptionTier) update.subscriptionTier = subscriptionTier;
    // Only accept plain objects for settings to prevent NoSQL injection
    if (settings && typeof settings === 'object' && !Array.isArray(settings)) {
      update.settings = settings;
    }

    const practice = await Practice.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!practice) return res.status(404).json({ error: 'Practice not found.' });

    await logActivity(id, userId, 'update_practice_settings', 'practice', id, { updates: update }, req);

    res.json({ practice });
  } catch (err) {
    console.error('[practices] PATCH /:id:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/practices/:id/practitioners — List practitioners ────────────────
router.get('/:id/practitioners', authenticateJWT, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid practice ID.' });
    }

    const role = await getPractitionerRole(id, userId);
    if (!hasPermission(role, 'practitioners', 'view')) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    const practitioners = await PracticePractitioner.find({ practiceId: id, status: { $ne: 'removed' } })
      .populate('userId', 'email name')
      .lean();

    res.json({ practitioners });
  } catch (err) {
    console.error('[practices] GET /:id/practitioners:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/practices/:id/practitioners/invite — Invite practitioner ────────
router.post('/:id/practitioners/invite', authenticateJWT, inviteLimiter, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid practice ID.' });
    }

    const role = await getPractitionerRole(id, userId);
    if (!hasPermission(role, 'practitioners', 'invite')) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    const { email, role: inviteRole } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    const validRoles = ['admin', 'clinician', 'therapist', 'observer'];
    if (!validRoles.includes(inviteRole)) {
      return res.status(400).json({ error: 'Invalid role. Must be one of: admin, clinician, therapist, observer.' });
    }

    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await PractitionerInvitation.create({
      practiceId: id,
      email: email.trim().toLowerCase(),
      role: inviteRole,
      invitedBy: userId,
      invitationToken,
      expiresAt,
    });

    const practice = await Practice.findById(id).lean();
    const inviter = await User.findById(userId).lean();
    const baseUrl = process.env.BASE_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');
    if (!baseUrl) {
      console.error('[practices] BASE_URL env var is not set in production.');
      return res.status(500).json({ error: 'Server configuration error.' });
    }
    const inviteUrl = `${baseUrl}/invite/accept?token=${invitationToken}`;

    try {
      await emailService.sendPractitionerInvitation({
        to: email.trim().toLowerCase(),
        inviterName: (inviter && (inviter.name || inviter.email)) || 'A practitioner',
        practiceName: practice ? practice.name : 'a clinical practice',
        role: inviteRole,
        inviteUrl,
        expiresAt,
      });
    } catch (emailErr) {
      console.error('[practices] Failed to send invitation email:', emailErr.message);
    }

    await logActivity(id, userId, 'invite_practitioner', 'practitioner', invitation._id, { email, role: inviteRole }, req);

    res.status(201).json({ invitation: { id: invitation._id, email, role: inviteRole, expiresAt, status: 'pending' } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'An active invitation for this email already exists.' });
    }
    console.error('[practices] POST /:id/practitioners/invite:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── PATCH /api/practices/:id/practitioners/:targetUserId — Update role ────────
router.patch('/:id/practitioners/:targetUserId', authenticateJWT, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id, targetUserId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ error: 'Invalid ID.' });
    }

    const role = await getPractitionerRole(id, userId);
    if (!hasPermission(role, 'practitioners', 'edit_roles')) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    const { role: newRole, status } = req.body;
    const validRoles = ['admin', 'clinician', 'therapist', 'observer'];
    if (newRole && !validRoles.includes(newRole)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }
    const validStatuses = ['pending', 'active', 'suspended', 'removed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const update = {};
    if (newRole) update.role = newRole;
    if (status) update.status = status;

    const pp = await PracticePractitioner.findOneAndUpdate(
      { practiceId: id, userId: targetUserId },
      update,
      { new: true }
    );
    if (!pp) return res.status(404).json({ error: 'Practitioner not found in this practice.' });

    await logActivity(id, userId, 'update_practitioner_role', 'practitioner', targetUserId, { updates: update }, req);

    res.json({ practitioner: pp });
  } catch (err) {
    console.error('[practices] PATCH /:id/practitioners/:targetUserId:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── DELETE /api/practices/:id/practitioners/:targetUserId — Remove ────────────
router.delete('/:id/practitioners/:targetUserId', authenticateJWT, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id, targetUserId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ error: 'Invalid ID.' });
    }

    const role = await getPractitionerRole(id, userId);
    if (!hasPermission(role, 'practitioners', 'remove')) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    await PracticePractitioner.findOneAndUpdate(
      { practiceId: id, userId: targetUserId },
      { status: 'removed' }
    );

    await logActivity(id, userId, 'remove_practitioner', 'practitioner', targetUserId, {}, req);

    res.json({ message: 'Practitioner removed.' });
  } catch (err) {
    console.error('[practices] DELETE /:id/practitioners/:targetUserId:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
