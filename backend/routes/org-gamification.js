'use strict';

/**
 * org-gamification.js — Enterprise gamification management routes.
 *
 * Mounted at /api/org-gamification
 *
 * All endpoints require:
 *   1. JWT authentication
 *   2. Org-level admin role (for write operations)
 *   3. Enterprise plan with 'org-gamification' gate
 *
 * Route summary
 * ─────────────
 * Badges
 *   GET    /api/org-gamification/:orgId/badges               List org badges (admin + member)
 *   POST   /api/org-gamification/:orgId/badges               Create badge (admin)
 *   PUT    /api/org-gamification/:orgId/badges/:badgeId      Update badge (admin)
 *   DELETE /api/org-gamification/:orgId/badges/:badgeId      Retire badge (admin)
 *   POST   /api/org-gamification/:orgId/badges/:badgeId/award  Award badge to user (admin)
 *   GET    /api/org-gamification/:orgId/my-badges            My badge awards (authenticated member)
 *
 * Challenges
 *   GET    /api/org-gamification/:orgId/challenges           List challenges (admin + member)
 *   POST   /api/org-gamification/:orgId/challenges           Create challenge (admin)
 *   PUT    /api/org-gamification/:orgId/challenges/:id       Update challenge (admin)
 *   DELETE /api/org-gamification/:orgId/challenges/:id       Deactivate challenge (admin)
 *   POST   /api/org-gamification/:orgId/challenges/:id/complete  Mark challenge complete (member)
 *
 * Leaderboard
 *   GET    /api/org-gamification/:orgId/leaderboard          Org-wide leaderboard (admin + member)
 */

const express   = require('express');
const mongoose  = require('mongoose');
const rateLimit = require('express-rate-limit');

const Organization            = require('../models/Organization');
const User                    = require('../models/User');
const OrgBadge                = require('../models/OrgBadge');
const OrgBadgeAward           = require('../models/OrgBadgeAward');
const OrgChallenge            = require('../models/OrgChallenge');
const OrgChallengeCompletion  = require('../models/OrgChallengeCompletion');
const { authenticateJWT }     = require('../middleware/auth');
const { canAccessFeature }    = require('../utils/tierUtils');

const router = express.Router({ mergeParams: true });

// ── Rate limiting ─────────────────────────────────────────────────────────────

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(generalLimiter);

// All routes require JWT auth
router.use(authenticateJWT);

// ── Helpers ───────────────────────────────────────────────────────────────────

function validId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Load org and enforce enterprise 'org-gamification' gate.
 * Returns { org } on success or sends an error response.
 */
async function loadOrgWithGate(req, res) {
  const { orgId } = req.params;
  if (!validId(orgId)) {
    res.status(400).json({ error: 'Invalid organization ID.' });
    return null;
  }
  const org = await Organization.findById(orgId).lean();
  if (!org) {
    res.status(404).json({ error: 'Organization not found.' });
    return null;
  }
  const plan = org.plan || org.tier || 'free';
  if (!canAccessFeature(plan, 'org-gamification')) {
    res.status(403).json({ error: 'Full Gamification Suite requires Atlas Enterprise plan.' });
    return null;
  }
  return org;
}

function isOrgAdmin(org, userId) {
  return org.admins && org.admins.some((id) => id.toString() === userId.toString());
}

/**
 * Check that the requesting user is a member of the org (admin or user with org).
 * Admins always pass. For members, we check User.organization_id.
 */
async function isOrgMember(org, userId) {
  if (isOrgAdmin(org, userId)) return true;
  const user = await User.findById(userId).lean();
  return user && user.organization_id && user.organization_id.toString() === org._id.toString();
}

// ═══════════════════════════════════════════════════════════════════════════════
// BADGES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/org-gamification/:orgId/badges
 * List all (non-retired) org badges. Accessible to org admins and members.
 */
router.get('/:orgId/badges', async (req, res) => {
  try {
    const org = await loadOrgWithGate(req, res);
    if (!org) return;

    const member = await isOrgMember(org, req.user.userId);
    if (!member) return res.status(403).json({ error: 'Access denied.' });

    const badges = await OrgBadge.find({ orgId: org._id, retired: false })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ badges });
  } catch (err) {
    console.error('[org-gamification] list badges error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/org-gamification/:orgId/badges
 * Create a new custom badge. Admin only.
 * Body: { name, description?, icon?, awardType?, criteria? }
 */
router.post('/:orgId/badges', async (req, res) => {
  try {
    const org = await loadOrgWithGate(req, res);
    if (!org) return;
    if (!isOrgAdmin(org, req.user.userId)) return res.status(403).json({ error: 'Admin access required.' });

    const { name, description = '', icon = '🏅', awardType = 'manual', criteria = '' } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Badge name is required.' });
    }

    const badge = await OrgBadge.create({
      orgId: org._id,
      name: String(name).trim(),
      description: String(description).trim(),
      icon: String(icon).trim() || '🏅',
      awardType,
      criteria: String(criteria).trim(),
      createdBy: req.user.userId,
    });

    res.status(201).json({ badge });
  } catch (err) {
    console.error('[org-gamification] create badge error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * PUT /api/org-gamification/:orgId/badges/:badgeId
 * Update a badge definition. Admin only.
 */
router.put('/:orgId/badges/:badgeId', async (req, res) => {
  try {
    const org = await loadOrgWithGate(req, res);
    if (!org) return;
    if (!isOrgAdmin(org, req.user.userId)) return res.status(403).json({ error: 'Admin access required.' });

    if (!validId(req.params.badgeId)) return res.status(400).json({ error: 'Invalid badge ID.' });

    const allowed = ['name', 'description', 'icon', 'awardType', 'criteria'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const badge = await OrgBadge.findOneAndUpdate(
      { _id: req.params.badgeId, orgId: org._id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!badge) return res.status(404).json({ error: 'Badge not found.' });

    res.json({ badge });
  } catch (err) {
    console.error('[org-gamification] update badge error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * DELETE /api/org-gamification/:orgId/badges/:badgeId
 * Retire (soft-delete) a badge. Admin only.
 */
router.delete('/:orgId/badges/:badgeId', async (req, res) => {
  try {
    const org = await loadOrgWithGate(req, res);
    if (!org) return;
    if (!isOrgAdmin(org, req.user.userId)) return res.status(403).json({ error: 'Admin access required.' });

    if (!validId(req.params.badgeId)) return res.status(400).json({ error: 'Invalid badge ID.' });

    const badge = await OrgBadge.findOneAndUpdate(
      { _id: req.params.badgeId, orgId: org._id },
      { $set: { retired: true } },
      { new: true }
    );
    if (!badge) return res.status(404).json({ error: 'Badge not found.' });

    res.json({ success: true, message: 'Badge retired.' });
  } catch (err) {
    console.error('[org-gamification] retire badge error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/org-gamification/:orgId/badges/:badgeId/award
 * Award a badge to a user. Admin only.
 * Body: { userId, email?, note? }
 */
router.post('/:orgId/badges/:badgeId/award', async (req, res) => {
  try {
    const org = await loadOrgWithGate(req, res);
    if (!org) return;
    if (!isOrgAdmin(org, req.user.userId)) return res.status(403).json({ error: 'Admin access required.' });

    if (!validId(req.params.badgeId)) return res.status(400).json({ error: 'Invalid badge ID.' });

    const badge = await OrgBadge.findOne({ _id: req.params.badgeId, orgId: org._id, retired: false }).lean();
    if (!badge) return res.status(404).json({ error: 'Badge not found or retired.' });

    const { userId, email = null, note = '' } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required.' });

    const award = await OrgBadgeAward.create({
      orgId: org._id,
      badgeId: badge._id,
      awardedToUserId: String(userId),
      awardedToEmail: email ? String(email).toLowerCase().trim() : null,
      awardedByUserId: String(req.user.userId),
      note: String(note).trim(),
    });

    res.status(201).json({ award });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'This badge has already been awarded to this user.' });
    }
    console.error('[org-gamification] award badge error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/org-gamification/:orgId/my-badges
 * Return all badge awards for the authenticated user within this org.
 */
router.get('/:orgId/my-badges', async (req, res) => {
  try {
    const org = await loadOrgWithGate(req, res);
    if (!org) return;

    const member = await isOrgMember(org, req.user.userId);
    if (!member) return res.status(403).json({ error: 'Access denied.' });

    const awards = await OrgBadgeAward.find({
      orgId: org._id,
      awardedToUserId: String(req.user.userId),
    })
      .populate('badgeId', 'name description icon')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ awards });
  } catch (err) {
    console.error('[org-gamification] my-badges error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CHALLENGES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/org-gamification/:orgId/challenges
 * List active challenges. Accessible to org admins and members.
 * Query: ?all=true  (admin only) to include inactive challenges.
 */
router.get('/:orgId/challenges', async (req, res) => {
  try {
    const org = await loadOrgWithGate(req, res);
    if (!org) return;

    const member = await isOrgMember(org, req.user.userId);
    if (!member) return res.status(403).json({ error: 'Access denied.' });

    const showAll = req.query.all === 'true' && isOrgAdmin(org, req.user.userId);
    const filter = { orgId: org._id };
    if (!showAll) filter.active = true;

    const challenges = await OrgChallenge.find(filter).sort({ createdAt: -1 }).lean();

    // For each challenge, attach current user's completion status
    const userId = String(req.user.userId);
    const challengeIds = challenges.map((c) => c._id);
    const completions = await OrgChallengeCompletion.find({
      challengeId: { $in: challengeIds },
      userId,
    }).lean();

    const completedSet = new Set(completions.map((c) => c.challengeId.toString()));

    const enriched = challenges.map((c) => ({
      ...c,
      completedByMe: completedSet.has(c._id.toString()),
    }));

    res.json({ challenges: enriched });
  } catch (err) {
    console.error('[org-gamification] list challenges error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/org-gamification/:orgId/challenges
 * Create a new challenge. Admin only.
 * Body: { title, description?, dimension?, points?, startDate?, endDate? }
 */
router.post('/:orgId/challenges', async (req, res) => {
  try {
    const org = await loadOrgWithGate(req, res);
    if (!org) return;
    if (!isOrgAdmin(org, req.user.userId)) return res.status(403).json({ error: 'Admin access required.' });

    const { title, description = '', dimension = null, points = 10, startDate = null, endDate = null } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Challenge title is required.' });
    }

    const challenge = await OrgChallenge.create({
      orgId: org._id,
      title: String(title).trim(),
      description: String(description).trim(),
      dimension: dimension ? String(dimension).trim() : null,
      points: Math.max(0, Math.min(10000, Number(points) || 10)),
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      createdBy: req.user.userId,
    });

    res.status(201).json({ challenge });
  } catch (err) {
    console.error('[org-gamification] create challenge error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * PUT /api/org-gamification/:orgId/challenges/:challengeId
 * Update a challenge. Admin only.
 */
router.put('/:orgId/challenges/:challengeId', async (req, res) => {
  try {
    const org = await loadOrgWithGate(req, res);
    if (!org) return;
    if (!isOrgAdmin(org, req.user.userId)) return res.status(403).json({ error: 'Admin access required.' });

    if (!validId(req.params.challengeId)) return res.status(400).json({ error: 'Invalid challenge ID.' });

    const allowed = ['title', 'description', 'dimension', 'points', 'startDate', 'endDate', 'active'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const challenge = await OrgChallenge.findOneAndUpdate(
      { _id: req.params.challengeId, orgId: org._id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!challenge) return res.status(404).json({ error: 'Challenge not found.' });

    res.json({ challenge });
  } catch (err) {
    console.error('[org-gamification] update challenge error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * DELETE /api/org-gamification/:orgId/challenges/:challengeId
 * Deactivate (soft-delete) a challenge. Admin only.
 */
router.delete('/:orgId/challenges/:challengeId', async (req, res) => {
  try {
    const org = await loadOrgWithGate(req, res);
    if (!org) return;
    if (!isOrgAdmin(org, req.user.userId)) return res.status(403).json({ error: 'Admin access required.' });

    if (!validId(req.params.challengeId)) return res.status(400).json({ error: 'Invalid challenge ID.' });

    const challenge = await OrgChallenge.findOneAndUpdate(
      { _id: req.params.challengeId, orgId: org._id },
      { $set: { active: false } },
      { new: true }
    );
    if (!challenge) return res.status(404).json({ error: 'Challenge not found.' });

    res.json({ success: true, message: 'Challenge deactivated.' });
  } catch (err) {
    console.error('[org-gamification] deactivate challenge error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/org-gamification/:orgId/challenges/:challengeId/complete
 * Mark a challenge as completed by the authenticated user.
 */
router.post('/:orgId/challenges/:challengeId/complete', async (req, res) => {
  try {
    const org = await loadOrgWithGate(req, res);
    if (!org) return;

    const member = await isOrgMember(org, req.user.userId);
    if (!member) return res.status(403).json({ error: 'Access denied.' });

    if (!validId(req.params.challengeId)) return res.status(400).json({ error: 'Invalid challenge ID.' });

    const challenge = await OrgChallenge.findOne({ _id: req.params.challengeId, orgId: org._id, active: true }).lean();
    if (!challenge) return res.status(404).json({ error: 'Challenge not found or inactive.' });

    // Enforce date window if set
    const now = new Date();
    if (challenge.startDate && now < new Date(challenge.startDate)) {
      return res.status(400).json({ error: 'Challenge has not started yet.' });
    }
    if (challenge.endDate && now > new Date(challenge.endDate)) {
      return res.status(400).json({ error: 'Challenge window has ended.' });
    }

    const completion = await OrgChallengeCompletion.create({
      orgId: org._id,
      challengeId: challenge._id,
      userId: String(req.user.userId),
      email: req.user.email || null,
      pointsEarned: challenge.points || 0,
    });

    res.status(201).json({ completion, pointsEarned: challenge.points });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'You have already completed this challenge.' });
    }
    console.error('[org-gamification] complete challenge error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ORG-WIDE LEADERBOARD
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/org-gamification/:orgId/leaderboard
 * Org-wide leaderboard aggregating challenge completion points.
 * Accessible to org admins and members.
 * Query: ?limit=20
 */
router.get('/:orgId/leaderboard', async (req, res) => {
  try {
    const org = await loadOrgWithGate(req, res);
    if (!org) return;

    const member = await isOrgMember(org, req.user.userId);
    if (!member) return res.status(403).json({ error: 'Access denied.' });

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    // Aggregate total points per user from challenge completions
    const leaderboard = await OrgChallengeCompletion.aggregate([
      { $match: { orgId: mongoose.Types.ObjectId.createFromHexString(org._id.toString()) } },
      {
        $group: {
          _id: '$userId',
          email: { $first: '$email' },
          totalPoints: { $sum: '$pointsEarned' },
          completions: { $sum: 1 },
        },
      },
      { $sort: { totalPoints: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          email: 1,
          totalPoints: 1,
          completions: 1,
        },
      },
    ]);

    // Add badge count per user for richer display
    const userIds = leaderboard.map((e) => e.userId);
    const badgeCounts = await OrgBadgeAward.aggregate([
      { $match: { orgId: mongoose.Types.ObjectId.createFromHexString(org._id.toString()), awardedToUserId: { $in: userIds } } },
      { $group: { _id: '$awardedToUserId', badgeCount: { $sum: 1 } } },
    ]);
    const badgeMap = {};
    for (const b of badgeCounts) badgeMap[b._id] = b.badgeCount;

    const enriched = leaderboard.map((entry, idx) => ({
      rank: idx + 1,
      ...entry,
      badgeCount: badgeMap[entry.userId] || 0,
    }));

    res.json({ leaderboard: enriched, total: enriched.length });
  } catch (err) {
    console.error('[org-gamification] leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
