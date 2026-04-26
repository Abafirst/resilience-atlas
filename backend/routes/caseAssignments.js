'use strict';

/**
 * caseAssignments.js — Case assignment management routes.
 * Mounted at /api/cases
 */

const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const CaseAssignment = require('../models/CaseAssignment');
const PracticePractitioner = require('../models/PracticePractitioner');
const ActivityLog = require('../models/ActivityLog');
const { authenticateJWT } = require('../middleware/auth');
const { hasPermission } = require('../config/practicePermissions');

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

// ── POST /api/cases/assign — Assign child to practitioner ────────────────────
router.post('/assign', authenticateJWT, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { practiceId, practitionerId, childProfileId, accessLevel } = req.body;

    if (!mongoose.Types.ObjectId.isValid(practiceId)) {
      return res.status(400).json({ error: 'Invalid practice ID.' });
    }

    const role = await getPractitionerRole(practiceId, userId);
    if (!hasPermission(role, 'practitioners', 'invite')) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    const assignment = await CaseAssignment.create({
      practiceId,
      practitionerId,
      childProfileId,
      assignedBy: userId,
      accessLevel: accessLevel || 'full',
    });

    await logActivity(practiceId, userId, 'assign_case', 'child', childProfileId, { practitionerId, accessLevel }, req);

    res.status(201).json({ assignment });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'This case is already assigned to this practitioner.' });
    }
    console.error('[caseAssignments] POST /assign:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── DELETE /api/cases/:id/unassign — Remove case assignment ──────────────────
router.delete('/:id/unassign', authenticateJWT, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid assignment ID.' });
    }

    const assignment = await CaseAssignment.findById(id).lean();
    if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });

    const role = await getPractitionerRole(assignment.practiceId, userId);
    if (!hasPermission(role, 'practitioners', 'remove')) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    await CaseAssignment.findByIdAndDelete(id);

    await logActivity(assignment.practiceId, userId, 'unassign_case', 'child', assignment.childProfileId, { practitionerId: assignment.practitionerId }, req);

    res.json({ message: 'Case assignment removed.' });
  } catch (err) {
    console.error('[caseAssignments] DELETE /:id/unassign:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── PATCH /api/cases/:id/access-level — Change assignment access level ────────
router.patch('/:id/access-level', authenticateJWT, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { accessLevel } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid assignment ID.' });
    }

    const validLevels = ['full', 'read-only', 'limited'];
    if (!validLevels.includes(accessLevel)) {
      return res.status(400).json({ error: 'Invalid access level.' });
    }

    const assignment = await CaseAssignment.findById(id).lean();
    if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });

    const role = await getPractitionerRole(assignment.practiceId, userId);
    if (!hasPermission(role, 'practitioners', 'edit_roles')) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    const updated = await CaseAssignment.findByIdAndUpdate(id, { accessLevel }, { new: true });

    await logActivity(assignment.practiceId, userId, 'change_case_access_level', 'child', assignment.childProfileId, { accessLevel }, req);

    res.json({ assignment: updated });
  } catch (err) {
    console.error('[caseAssignments] PATCH /:id/access-level:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
