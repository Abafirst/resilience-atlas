'use strict';

/**
 * practiceInvitations.js — Invitation lifecycle and practitioner permission/case routes.
 * Mounted at /api/practitioners
 */

const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const PracticePractitioner = require('../models/PracticePractitioner');
const PractitionerInvitation = require('../models/PractitionerInvitation');
const CaseAssignment = require('../models/CaseAssignment');
const ActivityLog = require('../models/ActivityLog');
const { authenticateJWT } = require('../middleware/auth');
const { hasPermission, getPermissions } = require('../config/practicePermissions');

const router = express.Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(limiter);

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
  const pp = await PracticePractitioner.findOne({ practiceId, userId, status: 'active' }).lean();
  return pp ? pp.role : null;
}

// ── GET /api/practitioners/invitations/:token — Get invitation details ─────────
router.get('/invitations/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const invitation = await PractitionerInvitation.findOne({
      invitationToken: token,
      status: 'pending',
    }).populate('practiceId', 'name').lean();

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found or already used.' });
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      await PractitionerInvitation.findByIdAndUpdate(invitation._id, { status: 'expired' });
      return res.status(410).json({ error: 'Invitation has expired.' });
    }

    res.json({
      invitation: {
        id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        practiceName: invitation.practiceId ? invitation.practiceId.name : null,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (err) {
    console.error('[practiceInvitations] GET /invitations/:token:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/practitioners/invitations/:token/accept — Accept invitation ──────
router.post('/invitations/:token/accept', authenticateJWT, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { token } = req.params;

    const invitation = await PractitionerInvitation.findOne({
      invitationToken: token,
      status: 'pending',
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found or already used.' });
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      await invitation.updateOne({ status: 'expired' });
      return res.status(410).json({ error: 'Invitation has expired.' });
    }

    const existing = await PracticePractitioner.findOne({
      practiceId: invitation.practiceId,
      userId,
    });

    if (existing) {
      if (existing.status === 'active') {
        return res.status(409).json({ error: 'You are already a practitioner in this practice.' });
      }
      await existing.updateOne({ status: 'active', role: invitation.role, acceptedAt: new Date() });
    } else {
      await PracticePractitioner.create({
        practiceId: invitation.practiceId,
        userId,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
        invitedAt: invitation.createdAt,
        acceptedAt: new Date(),
        status: 'active',
      });
    }

    await invitation.updateOne({ status: 'accepted', acceptedAt: new Date() });

    await logActivity(invitation.practiceId, userId, 'accept_invitation', 'practitioner', userId, { role: invitation.role }, req);

    res.json({ message: 'Invitation accepted. You have joined the practice.' });
  } catch (err) {
    console.error('[practiceInvitations] POST /invitations/:token/accept:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── DELETE /api/practitioners/invitations/:id — Revoke invitation ─────────────
router.delete('/invitations/:id', authenticateJWT, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid invitation ID.' });
    }

    const invitation = await PractitionerInvitation.findById(id).lean();
    if (!invitation) return res.status(404).json({ error: 'Invitation not found.' });

    const role = await getPractitionerRole(invitation.practiceId, userId);
    if (!hasPermission(role, 'practitioners', 'invite')) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    await PractitionerInvitation.findByIdAndUpdate(id, { status: 'revoked' });
    await logActivity(invitation.practiceId, userId, 'revoke_invitation', 'practitioner', id, { email: invitation.email }, req);

    res.json({ message: 'Invitation revoked.' });
  } catch (err) {
    console.error('[practiceInvitations] DELETE /invitations/:id:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/practitioners/:targetId/permissions — Get practitioner permissions
router.get('/:targetId/permissions', authenticateJWT, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { targetId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ error: 'Invalid practitioner ID.' });
    }

    const pp = await PracticePractitioner.findOne({ userId: targetId, status: 'active' }).lean();
    if (!pp) return res.status(404).json({ error: 'Practitioner not found.' });

    const requesterRole = await getPractitionerRole(pp.practiceId, userId);
    if (!requesterRole) return res.status(403).json({ error: 'Access denied.' });

    const permissions = getPermissions(pp.role);

    res.json({ role: pp.role, permissions });
  } catch (err) {
    console.error('[practiceInvitations] GET /:targetId/permissions:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/practitioners/:targetId/cases — Get cases for practitioner ────────
router.get('/:targetId/cases', authenticateJWT, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { targetId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ error: 'Invalid practitioner ID.' });
    }

    const pp = await PracticePractitioner.findOne({ userId: targetId, status: 'active' }).lean();
    if (!pp) return res.status(404).json({ error: 'Practitioner not found.' });

    const requesterRole = await getPractitionerRole(pp.practiceId, userId);
    if (!requesterRole) return res.status(403).json({ error: 'Access denied.' });

    const assignments = await CaseAssignment.find({ practitionerId: targetId })
      .populate('childProfileId', 'name ageGroup avatar profileId')
      .lean();

    res.json({ assignments });
  } catch (err) {
    console.error('[practiceInvitations] GET /:targetId/cases:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
