'use strict';

/**
 * progress-circles.js — Multi-stakeholder shared progress tracking endpoints.
 *
 * Endpoints:
 *   POST   /api/progress-circles                             — Create a new circle
 *   POST   /api/progress-circles/:id/invite                  — Invite stakeholder
 *   POST   /api/progress-circles/:id/accept                  — Accept invitation
 *   GET    /api/progress-circles/:id/dashboard               — Get dashboard (role-filtered)
 *   POST   /api/progress-circles/:id/activities              — Log activity
 *   PUT    /api/progress-circles/:id/privacy                 — Update privacy (parent/guardian only)
 *   GET    /api/progress-circles/:id/members                 — Get team members
 *   DELETE /api/progress-circles/:id/members/:memberId       — Remove member (parent/guardian only)
 *   PUT    /api/progress-circles/:id/members/:memberId/permissions — Update permissions
 *   GET    /api/progress-circles/mine                        — List circles the user belongs to
 */

const express    = require('express');
const mongoose   = require('mongoose');
const rateLimit  = require('express-rate-limit');

const { authenticateJWT } = require('../middleware/auth');
const ProgressCircle       = require('../models/ProgressCircle');
const ChildProfile         = require('../models/ChildProfile');
const emailService         = require('../services/emailService');
const logger               = require('../utils/logger');

const router = express.Router();

// ── Rate limiter ──────────────────────────────────────────────────────────────

const circlesLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      60,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(circlesLimiter);

// ── Constants ─────────────────────────────────────────────────────────────────

const VALID_ROLES = [
  'parent', 'guardian', 'caregiver', 'grandparent', 'foster_parent',
  'family_member', 'slp', 'ot', 'bcba', 'teacher', 'counselor',
  'therapist', 'coach', 'employer', 'mentor', 'other',
];

const VALID_PRIVACY_LEVELS = ['full', 'aggregated', 'minimal'];

const VALID_SETTINGS = ['home', 'school', 'clinic', 'therapy', 'community', 'work', 'other'];

// Roles that have parent-equivalent authority (can modify privacy, invite, remove members).
const ADMIN_ROLES = ['parent', 'guardian'];

// Default permissions per role.
const DEFAULT_PERMISSIONS_BY_ROLE = {
  parent:        { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: true,  canAddActivities: true,  canInviteOthers: true  },
  guardian:      { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: true,  canAddActivities: true,  canInviteOthers: true  },
  caregiver:     { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: false, canAddActivities: true,  canInviteOthers: false },
  grandparent:   { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: false, canAddActivities: true,  canInviteOthers: false },
  foster_parent: { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: false, canAddActivities: true,  canInviteOthers: false },
  family_member: { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: false, canAddActivities: false, canInviteOthers: false },
  slp:           { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: false, canAddActivities: true,  canInviteOthers: false },
  ot:            { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: false, canAddActivities: true,  canInviteOthers: false },
  bcba:          { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: false, canAddActivities: true,  canInviteOthers: false },
  teacher:       { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: false, canAddActivities: true,  canInviteOthers: false },
  counselor:     { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: false, canAddActivities: true,  canInviteOthers: false },
  therapist:     { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: false, canAddActivities: true,  canInviteOthers: false },
  coach:         { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: false, canAddActivities: true,  canInviteOthers: false },
  employer:      { canViewProgress: true,  canViewActivities: false, canViewDimensions: true,  canViewNotes: false, canAddActivities: false, canInviteOthers: false },
  mentor:        { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: false, canAddActivities: true,  canInviteOthers: false },
  other:         { canViewProgress: true,  canViewActivities: false, canViewDimensions: true,  canViewNotes: false, canAddActivities: false, canInviteOthers: false },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveUserId(req) {
  return req.user && (req.user.userId || req.user.sub || req.user.id);
}

/**
 * Find a circle by id and verify the requesting user is an active member.
 * Returns { circle, member } or sends an error response.
 */
async function resolveCircleAndMember(req, res) {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: 'Invalid circle ID.' });
    return null;
  }

  const circle = await ProgressCircle.findById(id);
  if (!circle) {
    res.status(404).json({ error: 'Progress Circle not found.' });
    return null;
  }

  const userId = resolveUserId(req);
  const member = circle.members.find(
    (m) => m.status === 'active' && m.userId && m.userId.toString() === userId.toString()
  );

  if (!member) {
    res.status(403).json({ error: 'You are not an active member of this circle.' });
    return null;
  }

  return { circle, member };
}

/**
 * Apply privacy-level filtering to the dashboard data based on the requesting
 * member's role and the circle's privacyLevel setting.
 */
function applyPrivacyFilter(data, member, privacyLevel) {
  if (privacyLevel === 'full') return data;

  if (privacyLevel === 'minimal') {
    // Members only see their own contributions.
    return {
      ...data,
      recentActivities: (data.recentActivities || []).filter(
        (a) => a.completedBy && member.userId && a.completedBy.toString() === member.userId.toString()
      ),
    };
  }

  // aggregated: employers only see trends, not individual activity details.
  if (member.role === 'employer') {
    return {
      ...data,
      recentActivities: [],
    };
  }

  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/progress-circles/mine — list circles the authenticated user belongs to
// ─────────────────────────────────────────────────────────────────────────────

router.get('/mine', authenticateJWT, async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.status(401).json({ error: 'User not authenticated.' });

    const circles = await ProgressCircle.find({
      'members.userId': new mongoose.Types.ObjectId(userId),
      'members.status': 'active',
    }).lean();

    return res.json(circles.map((c) => ({
      id:             c._id,
      name:           c.name,
      childProfileId: c.childProfileId,
      privacyLevel:   c.privacyLevel,
      sharingEnabled: c.sharingEnabled,
      memberCount:    (c.members || []).filter((m) => m.status === 'active').length,
    })));
  } catch (err) {
    logger.error('[progress-circles] GET /mine error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/progress-circles — Create a new progress circle
// Body: { childProfileId, name, privacyLevel? }
// ─────────────────────────────────────────────────────────────────────────────

router.post('/', authenticateJWT, async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.status(401).json({ error: 'User not authenticated.' });

    const { childProfileId, name, privacyLevel } = req.body;

    if (!childProfileId || !mongoose.Types.ObjectId.isValid(childProfileId)) {
      return res.status(400).json({ error: 'Valid childProfileId is required.' });
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Circle name is required.' });
    }

    if (privacyLevel && !VALID_PRIVACY_LEVELS.includes(privacyLevel)) {
      return res.status(400).json({ error: `Invalid privacyLevel. Must be one of: ${VALID_PRIVACY_LEVELS.join(', ')}.` });
    }

    // Verify the child profile exists and belongs to this user.
    const profile = await ChildProfile.findById(childProfileId);
    if (!profile) {
      return res.status(404).json({ error: 'Child profile not found.' });
    }
    if (profile.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'You do not own this child profile.' });
    }

    // Prevent duplicate circles for the same child profile.
    const existing = await ProgressCircle.findOne({ childProfileId });
    if (existing) {
      return res.status(409).json({ error: 'A Progress Circle already exists for this child profile.', circleId: existing._id });
    }

    const defaultPerms = DEFAULT_PERMISSIONS_BY_ROLE.parent;

    const circle = await ProgressCircle.create({
      childProfileId,
      name:           name.trim(),
      privacyLevel:   privacyLevel || 'aggregated',
      sharingEnabled: true,
      members: [
        {
          userId:       new mongoose.Types.ObjectId(userId),
          role:         'parent',
          status:       'active',
          acceptedAt:   new Date(),
          invitedBy:    new mongoose.Types.ObjectId(userId),
          ...defaultPerms,
        },
      ],
    });

    // Update the child profile with the circle reference.
    profile.progressCircleId = circle._id;
    profile.privacyConsent = {
      sharingEnabled: true,
      consentedBy:    new mongoose.Types.ObjectId(userId),
      consentedAt:    new Date(),
      consentVersion: '1.0',
    };
    await profile.save();

    logger.info(`[progress-circles] Created circle ${circle._id} for profile ${childProfileId} by user ${userId}`);
    return res.status(201).json(circle);
  } catch (err) {
    logger.error('[progress-circles] POST / error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/progress-circles/:id/invite — Invite stakeholder to circle
// Body: { email, role, permissions?, organizationId?, specialtyContext? }
// ─────────────────────────────────────────────────────────────────────────────

router.post('/:id/invite', authenticateJWT, async (req, res) => {
  try {
    const result = await resolveCircleAndMember(req, res);
    if (!result) return;
    const { circle, member: inviterMember } = result;

    // Only parents/guardians, or members with canInviteOthers, can invite.
    if (!inviterMember.canInviteOthers && !ADMIN_ROLES.includes(inviterMember.role)) {
      return res.status(403).json({ error: 'You do not have permission to invite others to this circle.' });
    }

    const { email, role, permissions, organizationId, organizationType, specialtyContext } = req.body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    // Basic email format check.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}.` });
    }

    // Check the email is not already a member.
    const alreadyMember = circle.members.some(
      (m) => m.email === trimmedEmail && m.status !== 'removed'
    );
    if (alreadyMember) {
      return res.status(409).json({ error: 'This email address is already a member of the circle.' });
    }

    const userId = resolveUserId(req);
    const roleDefaults = DEFAULT_PERMISSIONS_BY_ROLE[role] || DEFAULT_PERMISSIONS_BY_ROLE.other;
    const resolvedPerms = { ...roleDefaults, ...(permissions || {}) };

    const newMember = {
      email:            trimmedEmail,
      role,
      organizationId:   organizationId || null,
      organizationType: organizationType || null,
      ...resolvedPerms,
      invitedBy:        new mongoose.Types.ObjectId(userId),
      invitedAt:        new Date(),
      status:           'pending',
      specialtyContext: specialtyContext || {},
    };

    circle.members.push(newMember);
    await circle.save();

    // Retrieve the child profile to get the child's name for the email.
    const profile = await ChildProfile.findById(circle.childProfileId).lean();
    const childName = profile ? profile.name : 'your child';

    // Resolve inviter display name (best effort).
    let inviterName = 'A parent';
    try {
      const User = require('../models/User');
      const inviter = await User.findById(userId).lean();
      if (inviter) inviterName = inviter.fullName || inviter.name || inviterName;
    } catch {
      // non-fatal
    }

    const APP_URL = process.env.APP_URL || 'https://resilience-atlas.app';
    const invitationLink = `${APP_URL}/iatlas/circles/${circle._id}/accept?email=${encodeURIComponent(trimmedEmail)}`;

    try {
      await emailService.sendProgressCircleInvitation(trimmedEmail, {
        inviteeName:    trimmedEmail,
        inviterName,
        childName,
        circleName:     circle.name,
        role,
        invitationLink,
        expiryDays:     30,
      });
    } catch (emailErr) {
      // Log but don't fail the request — invitation is persisted even if email fails.
      logger.warn(`[progress-circles] Failed to send invitation email to ${trimmedEmail}: ${emailErr.message}`);
    }

    logger.info(`[progress-circles] Invited ${trimmedEmail} (role: ${role}) to circle ${circle._id}`);
    return res.status(201).json({ message: 'Invitation sent.', member: newMember });
  } catch (err) {
    logger.error('[progress-circles] POST /:id/invite error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/progress-circles/:id/accept — Accept an invitation
// Body: { email }  — the invited email must match; userId is set from JWT
// ─────────────────────────────────────────────────────────────────────────────

router.post('/:id/accept', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid circle ID.' });
    }

    const circle = await ProgressCircle.findById(id);
    if (!circle) return res.status(404).json({ error: 'Progress Circle not found.' });

    const userId = resolveUserId(req);
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required to accept invitation.' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Find a pending invitation for this email.
    const memberIndex = circle.members.findIndex(
      (m) => m.email === trimmedEmail && m.status === 'pending'
    );
    if (memberIndex === -1) {
      return res.status(404).json({ error: 'No pending invitation found for this email address.' });
    }

    circle.members[memberIndex].status     = 'active';
    circle.members[memberIndex].acceptedAt = new Date();
    circle.members[memberIndex].userId     = new mongoose.Types.ObjectId(userId);

    await circle.save();

    logger.info(`[progress-circles] User ${userId} accepted invitation to circle ${circle._id}`);
    return res.json({ message: 'Invitation accepted.', circle: { id: circle._id, name: circle.name } });
  } catch (err) {
    logger.error('[progress-circles] POST /:id/accept error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/progress-circles/:id/dashboard — Get dashboard data (role-filtered)
// ─────────────────────────────────────────────────────────────────────────────

router.get('/:id/dashboard', authenticateJWT, async (req, res) => {
  try {
    const result = await resolveCircleAndMember(req, res);
    if (!result) return;
    const { circle, member } = result;

    // Fetch the child's progress.
    const profile = await ChildProfile.findById(circle.childProfileId).lean();
    if (!profile) return res.status(404).json({ error: 'Child profile not found.' });

    const activeMembers = circle.members.filter((m) => m.status === 'active');

    const recentActivities = member.canViewActivities
      ? (circle.sharedActivities || [])
          .filter((a) => a.visible)
          .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
          .slice(0, 20)
          .map((a) => ({
            activityId:      a.activityId,
            completedBy:     a.completedBy,
            completedByRole: a.completedByRole,
            completedAt:     a.completedAt,
            setting:         a.setting,
            dimension:       a.dimension,
            xpAwarded:       a.xpAwarded,
            // Notes are only included if the member has note-viewing permission.
            notes: member.canViewNotes ? a.notes : undefined,
          }))
      : [];

    const progressData = member.canViewProgress ? {
      totalXP:  profile.progress?.totalXP  ?? 0,
      level:    profile.progress?.level    ?? 1,
      streaks:  profile.progress?.streaks  ?? {},
      badges:   profile.progress?.badges   ?? [],
    } : null;

    const dimensionData = member.canViewDimensions
      ? (profile.progress?.dimensions ?? {})
      : null;

    const rawData = {
      circle: {
        id:             circle._id,
        name:           circle.name,
        privacyLevel:   circle.privacyLevel,
        sharingEnabled: circle.sharingEnabled,
      },
      child: {
        name:     profile.name,
        ageGroup: profile.ageGroup,
        avatar:   profile.avatar,
      },
      userRole:   member.role,
      permissions: {
        canViewProgress:   member.canViewProgress,
        canViewActivities: member.canViewActivities,
        canViewDimensions: member.canViewDimensions,
        canViewNotes:      member.canViewNotes,
        canAddActivities:  member.canAddActivities,
        canInviteOthers:   member.canInviteOthers,
      },
      members:          activeMembers.map(sanitiseMember),
      progress:         progressData,
      dimensions:       dimensionData,
      recentActivities,
    };

    return res.json(applyPrivacyFilter(rawData, member, circle.privacyLevel));
  } catch (err) {
    logger.error('[progress-circles] GET /:id/dashboard error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/progress-circles/:id/activities — Log activity completion
// Body: { activityId, setting?, dimension?, xpAwarded?, notes? }
// ─────────────────────────────────────────────────────────────────────────────

router.post('/:id/activities', authenticateJWT, async (req, res) => {
  try {
    const result = await resolveCircleAndMember(req, res);
    if (!result) return;
    const { circle, member } = result;

    if (!member.canAddActivities) {
      return res.status(403).json({ error: 'You do not have permission to log activities in this circle.' });
    }

    const { activityId, setting, dimension, xpAwarded, notes } = req.body;

    if (!activityId || typeof activityId !== 'string') {
      return res.status(400).json({ error: 'activityId is required.' });
    }

    if (setting && !VALID_SETTINGS.includes(setting)) {
      return res.status(400).json({ error: `Invalid setting. Must be one of: ${VALID_SETTINGS.join(', ')}.` });
    }

    const userId = resolveUserId(req);

    const activity = {
      activityId,
      completedBy:     new mongoose.Types.ObjectId(userId),
      completedByRole: member.role,
      completedAt:     new Date(),
      setting:         setting   || '',
      dimension:       dimension || '',
      xpAwarded:       typeof xpAwarded === 'number' ? xpAwarded : 0,
      notes:           typeof notes === 'string' ? notes.slice(0, 1000) : '',
      visible:         true,
    };

    circle.sharedActivities.push(activity);

    // Also append to the child profile's activity log.
    const profile = await ChildProfile.findById(circle.childProfileId);
    if (profile) {
      profile.activityLog.push({
        activityId,
        completedAt:     activity.completedAt,
        completedBy:     activity.completedBy,
        completedByRole: member.role,
        setting:         activity.setting,
        dimension:       activity.dimension,
        xpAwarded:       activity.xpAwarded,
      });
      await profile.save();
    }

    await circle.save();

    logger.info(`[progress-circles] Activity ${activityId} logged to circle ${circle._id} by user ${userId}`);
    return res.status(201).json({ message: 'Activity logged.', activity });
  } catch (err) {
    logger.error('[progress-circles] POST /:id/activities error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/progress-circles/:id/privacy — Update privacy settings
// Body: { privacyLevel?, sharingEnabled? }
// Only parent/guardian roles can modify privacy.
// ─────────────────────────────────────────────────────────────────────────────

router.put('/:id/privacy', authenticateJWT, async (req, res) => {
  try {
    const result = await resolveCircleAndMember(req, res);
    if (!result) return;
    const { circle, member } = result;

    if (!ADMIN_ROLES.includes(member.role)) {
      return res.status(403).json({ error: 'Only parents or guardians can modify privacy settings.' });
    }

    const { privacyLevel, sharingEnabled } = req.body;

    if (privacyLevel !== undefined) {
      if (!VALID_PRIVACY_LEVELS.includes(privacyLevel)) {
        return res.status(400).json({ error: `Invalid privacyLevel. Must be one of: ${VALID_PRIVACY_LEVELS.join(', ')}.` });
      }
      circle.privacyLevel = privacyLevel;
    }

    if (sharingEnabled !== undefined) {
      circle.sharingEnabled = Boolean(sharingEnabled);
    }

    await circle.save();

    return res.json({ message: 'Privacy settings updated.', privacyLevel: circle.privacyLevel, sharingEnabled: circle.sharingEnabled });
  } catch (err) {
    logger.error('[progress-circles] PUT /:id/privacy error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/progress-circles/:id/members — Get team members
// ─────────────────────────────────────────────────────────────────────────────

router.get('/:id/members', authenticateJWT, async (req, res) => {
  try {
    const result = await resolveCircleAndMember(req, res);
    if (!result) return;
    const { circle } = result;

    const members = circle.members
      .filter((m) => m.status !== 'removed')
      .map(sanitiseMember);

    return res.json(members);
  } catch (err) {
    logger.error('[progress-circles] GET /:id/members error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/progress-circles/:id/members/:memberId — Remove member
// Only parent/guardian roles can remove members.
// ─────────────────────────────────────────────────────────────────────────────

router.delete('/:id/members/:memberId', authenticateJWT, async (req, res) => {
  try {
    const result = await resolveCircleAndMember(req, res);
    if (!result) return;
    const { circle, member: requesterMember } = result;

    if (!ADMIN_ROLES.includes(requesterMember.role)) {
      return res.status(403).json({ error: 'Only parents or guardians can remove members.' });
    }

    const { memberId } = req.params;
    if (!memberId || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ error: 'Invalid member ID.' });
    }

    const targetMember = circle.members.id(memberId);
    if (!targetMember) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    // Prevent removing yourself if you're the only admin.
    const userId = resolveUserId(req);
    if (targetMember.userId && targetMember.userId.toString() === userId.toString()) {
      const otherAdmins = circle.members.filter(
        (m) => m.status === 'active' && ADMIN_ROLES.includes(m.role) && m._id.toString() !== memberId
      );
      if (otherAdmins.length === 0) {
        return res.status(400).json({ error: 'Cannot remove yourself as you are the only admin.' });
      }
    }

    targetMember.status = 'removed';
    await circle.save();

    logger.info(`[progress-circles] Member ${memberId} removed from circle ${circle._id} by user ${userId}`);
    return res.json({ message: 'Member removed.' });
  } catch (err) {
    logger.error('[progress-circles] DELETE /:id/members/:memberId error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/progress-circles/:id/members/:memberId/permissions — Update permissions
// Only parent/guardian roles can update permissions.
// ─────────────────────────────────────────────────────────────────────────────

router.put('/:id/members/:memberId/permissions', authenticateJWT, async (req, res) => {
  try {
    const result = await resolveCircleAndMember(req, res);
    if (!result) return;
    const { circle, member: requesterMember } = result;

    if (!ADMIN_ROLES.includes(requesterMember.role)) {
      return res.status(403).json({ error: 'Only parents or guardians can update member permissions.' });
    }

    const { memberId } = req.params;
    if (!memberId || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ error: 'Invalid member ID.' });
    }

    const targetMember = circle.members.id(memberId);
    if (!targetMember || targetMember.status === 'removed') {
      return res.status(404).json({ error: 'Member not found.' });
    }

    const PERMISSION_FIELDS = [
      'canViewProgress', 'canViewActivities', 'canViewDimensions',
      'canViewNotes', 'canAddActivities', 'canInviteOthers',
    ];

    const { permissions } = req.body;
    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({ error: 'permissions object is required.' });
    }

    PERMISSION_FIELDS.forEach((field) => {
      if (field in permissions) {
        targetMember[field] = Boolean(permissions[field]);
      }
    });

    await circle.save();

    return res.json({ message: 'Permissions updated.', member: sanitiseMember(targetMember) });
  } catch (err) {
    logger.error('[progress-circles] PUT /:id/members/:memberId/permissions error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: strip sensitive fields from member objects
// ─────────────────────────────────────────────────────────────────────────────

function sanitiseMember(m) {
  const obj = m.toObject ? m.toObject() : { ...m };
  return {
    id:               obj._id,
    userId:           obj.userId,
    email:            obj.email,
    role:             obj.role,
    status:           obj.status,
    invitedAt:        obj.invitedAt,
    acceptedAt:       obj.acceptedAt,
    organizationType: obj.organizationType,
    canViewProgress:  obj.canViewProgress,
    canViewActivities:obj.canViewActivities,
    canViewDimensions:obj.canViewDimensions,
    canViewNotes:     obj.canViewNotes,
    canAddActivities: obj.canAddActivities,
    canInviteOthers:  obj.canInviteOthers,
    specialtyContext: obj.specialtyContext,
  };
}

module.exports = router;
