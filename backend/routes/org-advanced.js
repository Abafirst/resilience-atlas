'use strict';

/**
 * org-advanced.js — Extended REST API for the Teams tier.
 *
 * Mounted at /api/orgs-advanced
 *
 * Route summary
 * ─────────────
 * GET    /api/orgs-advanced/:id/advanced-analytics   Full advanced analytics
 * GET    /api/orgs-advanced/:id/teams                List sub-teams
 * POST   /api/orgs-advanced/:id/teams                Create sub-team
 * DELETE /api/orgs-advanced/:id/teams/:teamId        Delete sub-team
 * POST   /api/orgs-advanced/:id/teams/:teamId/invite Invite member to team
 * GET    /api/orgs-advanced/:id/settings             Get org settings / branding
 * PUT    /api/orgs-advanced/:id/settings             Update org settings / branding
 * POST   /api/orgs-advanced/:id/settings/action-plan Add action plan item
 * PUT    /api/orgs-advanced/:id/settings/action-plan/:planId Update plan item
 * DELETE /api/orgs-advanced/:id/settings/action-plan/:planId Delete plan item
 * POST   /api/orgs-advanced/:id/report               Generate narrative team report
 * POST   /api/orgs-advanced/:id/export/csv           Programmatic CSV export
 * POST   /api/orgs-advanced/:id/webhooks             Register webhook
 * DELETE /api/orgs-advanced/:id/webhooks/:hookId     Remove webhook
 */

const express    = require('express');
const mongoose   = require('mongoose');
const rateLimit  = require('express-rate-limit');
const crypto     = require('crypto');

const Organization   = require('../models/Organization');
const Team           = require('../models/Team');
const OrgSettings    = require('../models/OrgSettings');
const ResilienceResult = require('../models/ResilienceResult');
const { authenticateJWT } = require('../middleware/auth');
const { computeAdvancedAnalytics } = require('../services/advancedAnalytics');
const { generateTeamNarrativeReport } = require('../services/teamReportGenerator');
const emailService = require('../services/emailService');
const { canAccessFeature } = require('../utils/tierUtils');

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

function validId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function isOrgAdmin(org, userId) {
  return org.admins && org.admins.some((id) => id.toString() === userId.toString());
}

// Feature-gate checks are performed via canAccessFeature() from
// backend/utils/tierUtils.js — the single source of truth for all plan
// feature gates.  All plan features and limits are governed by
// backend/config/tiers.js.  Never hardcode plan logic here.

async function requireOrgAdmin(req, res) {
  const { id } = req.params;
  if (!validId(id)) {
    res.status(400).json({ error: 'Invalid organization ID.' });
    return null;
  }
  const org = await Organization.findById(id).lean();
  if (!org) {
    res.status(404).json({ error: 'Organization not found.' });
    return null;
  }
  if (!isOrgAdmin(org, req.user.userId)) {
    res.status(403).json({ error: 'Forbidden — org admin access required.' });
    return null;
  }
  return org;
}

// ── Advanced Analytics ────────────────────────────────────────────────────────

/**
 * GET /api/orgs-advanced/:id/advanced-analytics
 * Returns distribution, trend, risk flags, benchmarks, heatmap.
 * Requires: teams-pro or enterprise plan.
 */
router.get('/:id/advanced-analytics', authenticateJWT, async (req, res) => {
  try {
    const org = await requireOrgAdmin(req, res);
    if (!org) return;

    if (!canAccessFeature(org.plan, 'advanced')) {
      return res.status(403).json({
        error: 'Advanced analytics require Teams Pro or Enterprise plan.',
        upgradeRequired: true,
      });
    }

    const riskThreshold = parseInt(req.query.riskThreshold, 10) || 40;
    const analytics = await computeAdvancedAnalytics(org, { riskThreshold });
    res.json({ success: true, analytics });
  } catch (err) {
    console.error('[org-advanced] advanced-analytics error:', err);
    res.status(500).json({ error: 'Failed to compute analytics.' });
  }
});

// ── Sub-team Management ───────────────────────────────────────────────────────

/**
 * GET /api/orgs-advanced/:id/teams
 * List all sub-teams for an org.
 */
router.get('/:id/teams', authenticateJWT, async (req, res) => {
  try {
    const org = await requireOrgAdmin(req, res);
    if (!org) return;

    if (!canAccessFeature(org.plan, 'multi-team')) {
      return res.status(403).json({
        error: 'Multi-team support requires Teams Pro or Enterprise plan.',
        upgradeRequired: true,
      });
    }

    const teams = await Team.find({ organizationId: org._id, isActive: true }).lean();
    res.json({ success: true, teams });
  } catch (err) {
    console.error('[org-advanced] list-teams error:', err);
    res.status(500).json({ error: 'Failed to list teams.' });
  }
});

/**
 * POST /api/orgs-advanced/:id/teams
 * Create a new sub-team.
 * Body: { name, description }
 */
router.post('/:id/teams', authenticateJWT, async (req, res) => {
  try {
    const org = await requireOrgAdmin(req, res);
    if (!org) return;

    if (!canAccessFeature(org.plan, 'multi-team')) {
      return res.status(403).json({
        error: 'Multi-team support requires Teams Pro or Enterprise plan.',
        upgradeRequired: true,
      });
    }

    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Team name is required.' });
    }

    const team = await Team.create({
      organizationId: org._id,
      name: name.trim(),
      description: (description || '').trim(),
      members: [{ userId: req.user.userId, role: 'admin', email: req.user.email }],
    });

    // Track team ID on org
    await Organization.updateOne({ _id: org._id }, { $addToSet: { teamIds: team._id } });

    // Emit webhook event
    await emitWebhookEvent(org._id, 'team_created', { teamId: team._id, name: team.name });

    res.status(201).json({ success: true, team });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A team with that name already exists.' });
    }
    console.error('[org-advanced] create-team error:', err);
    res.status(500).json({ error: 'Failed to create team.' });
  }
});

/**
 * DELETE /api/orgs-advanced/:id/teams/:teamId
 * Soft-delete a sub-team.
 */
router.delete('/:id/teams/:teamId', authenticateJWT, async (req, res) => {
  try {
    const org = await requireOrgAdmin(req, res);
    if (!org) return;

    const { teamId } = req.params;
    if (!validId(teamId)) return res.status(400).json({ error: 'Invalid team ID.' });

    const team = await Team.findOneAndUpdate(
      { _id: teamId, organizationId: org._id },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!team) return res.status(404).json({ error: 'Team not found.' });

    res.json({ success: true, message: 'Team removed.' });
  } catch (err) {
    console.error('[org-advanced] delete-team error:', err);
    res.status(500).json({ error: 'Failed to delete team.' });
  }
});

/**
 * POST /api/orgs-advanced/:id/teams/:teamId/invite
 * Invite members to a specific sub-team.
 * Body: { emails: string[] }
 */
router.post('/:id/teams/:teamId/invite', authenticateJWT, async (req, res) => {
  try {
    const org = await requireOrgAdmin(req, res);
    if (!org) return;

    const { teamId } = req.params;
    if (!validId(teamId)) return res.status(400).json({ error: 'Invalid team ID.' });

    const { emails } = req.body;
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'emails array is required.' });
    }

    const team = await Team.findOne({ _id: teamId, organizationId: org._id });
    if (!team) return res.status(404).json({ error: 'Team not found.' });

    const invited = [];
    for (const raw of emails) {
      const email = (raw || '').trim().toLowerCase();
      if (!email) continue;

      // Add to pending invites if not already there
      const existing = team.pendingInvites.find((i) => i.email === email);
      if (!existing) {
        team.pendingInvites.push({ email, invitedAt: new Date() });
        invited.push(email);

        // Send invitation email (best-effort)
        try {
          await emailService.sendInvitationEmail({
            to: email,
            orgName: org.company_name || org.name,
            teamName: team.name,
            assessmentUrl: `${process.env.APP_URL || ''}/quiz.html?org=${org.slug || org._id}`,
          });
        } catch (emailErr) {
          console.warn('[org-advanced] invite email failed:', emailErr.message);
        }
      }
    }

    await team.save();

    // Emit webhook
    await emitWebhookEvent(org._id, 'member_invited', { teamId, count: invited.length });

    res.json({ success: true, invited });
  } catch (err) {
    console.error('[org-advanced] invite error:', err);
    res.status(500).json({ error: 'Failed to send invitations.' });
  }
});

// ── Org Settings & Branding ───────────────────────────────────────────────────

/**
 * GET /api/orgs-advanced/:id/settings
 * Get org settings including branding and action plans.
 */
router.get('/:id/settings', authenticateJWT, async (req, res) => {
  try {
    const org = await requireOrgAdmin(req, res);
    if (!org) return;

    let settings = await OrgSettings.findOne({ organizationId: org._id }).lean();
    if (!settings) {
      settings = await OrgSettings.create({ organizationId: org._id });
    }

    res.json({ success: true, settings });
  } catch (err) {
    console.error('[org-advanced] get-settings error:', err);
    res.status(500).json({ error: 'Failed to retrieve settings.' });
  }
});

/**
 * PUT /api/orgs-advanced/:id/settings
 * Update org settings. Enterprise plans can update branding.
 * Body: { branding, permissions, scheduledExport, reassessmentSchedule }
 */
router.put('/:id/settings', authenticateJWT, async (req, res) => {
  try {
    const org = await requireOrgAdmin(req, res);
    if (!org) return;

    const { branding, permissions, scheduledExport, reassessmentSchedule } = req.body;

    // Validate branding access
    if (branding && !canAccessFeature(org.plan, 'branding')) {
      return res.status(403).json({
        error: 'Custom branding requires Enterprise plan.',
        upgradeRequired: true,
      });
    }

    const update = {};
    if (branding)              update.branding              = branding;
    if (permissions)           update.permissions           = permissions;
    if (scheduledExport)       update.scheduledExport       = scheduledExport;
    if (reassessmentSchedule)  update.reassessmentSchedule  = reassessmentSchedule;

    const settings = await OrgSettings.findOneAndUpdate(
      { organizationId: org._id },
      { $set: update },
      { upsert: true, new: true }
    );

    res.json({ success: true, settings });
  } catch (err) {
    console.error('[org-advanced] update-settings error:', err);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

// ── Action Plans ──────────────────────────────────────────────────────────────

/**
 * POST /api/orgs-advanced/:id/settings/action-plan
 * Add a new action plan item.
 * Body: { dimension, goal, owner, targetDate, notes }
 */
router.post('/:id/settings/action-plan', authenticateJWT, async (req, res) => {
  try {
    const org = await requireOrgAdmin(req, res);
    if (!org) return;

    if (!canAccessFeature(org.plan, 'facilitation')) {
      return res.status(403).json({
        error: 'Action plans require Teams Pro or Enterprise plan.',
        upgradeRequired: true,
      });
    }

    const { dimension, goal, owner, targetDate, notes } = req.body;
    if (!dimension || !goal) {
      return res.status(400).json({ error: 'dimension and goal are required.' });
    }

    const settings = await OrgSettings.findOneAndUpdate(
      { organizationId: org._id },
      {
        $push: {
          actionPlans: {
            dimension,
            goal: goal.trim(),
            owner: (owner || '').trim(),
            targetDate: targetDate ? new Date(targetDate) : null,
            notes: (notes || '').trim(),
            status: 'not_started',
          },
        },
      },
      { upsert: true, new: true }
    );

    const added = settings.actionPlans[settings.actionPlans.length - 1];
    res.status(201).json({ success: true, plan: added });
  } catch (err) {
    console.error('[org-advanced] add-plan error:', err);
    res.status(500).json({ error: 'Failed to add action plan.' });
  }
});

/**
 * PUT /api/orgs-advanced/:id/settings/action-plan/:planId
 * Update an existing action plan item.
 */
router.put('/:id/settings/action-plan/:planId', authenticateJWT, async (req, res) => {
  try {
    const org = await requireOrgAdmin(req, res);
    if (!org) return;

    const { planId } = req.params;
    if (!validId(planId)) return res.status(400).json({ error: 'Invalid plan ID.' });

    const { goal, owner, targetDate, notes, status } = req.body;
    const setFields = { 'actionPlans.$.updatedAt': new Date() };
    if (goal     != null) setFields['actionPlans.$.goal']       = goal.trim();
    if (owner    != null) setFields['actionPlans.$.owner']      = owner.trim();
    if (targetDate)       setFields['actionPlans.$.targetDate'] = new Date(targetDate);
    if (notes    != null) setFields['actionPlans.$.notes']      = notes.trim();
    if (status   != null) setFields['actionPlans.$.status']     = status;

    const settings = await OrgSettings.findOneAndUpdate(
      { organizationId: org._id, 'actionPlans._id': planId },
      { $set: setFields },
      { new: true }
    );

    if (!settings) return res.status(404).json({ error: 'Action plan not found.' });

    const updated = settings.actionPlans.find((p) => p._id.toString() === planId);
    res.json({ success: true, plan: updated });
  } catch (err) {
    console.error('[org-advanced] update-plan error:', err);
    res.status(500).json({ error: 'Failed to update action plan.' });
  }
});

/**
 * DELETE /api/orgs-advanced/:id/settings/action-plan/:planId
 * Remove an action plan item.
 */
router.delete('/:id/settings/action-plan/:planId', authenticateJWT, async (req, res) => {
  try {
    const org = await requireOrgAdmin(req, res);
    if (!org) return;

    const { planId } = req.params;
    if (!validId(planId)) return res.status(400).json({ error: 'Invalid plan ID.' });

    await OrgSettings.updateOne(
      { organizationId: org._id },
      { $pull: { actionPlans: { _id: new mongoose.Types.ObjectId(planId) } } }
    );

    res.json({ success: true, message: 'Action plan removed.' });
  } catch (err) {
    console.error('[org-advanced] delete-plan error:', err);
    res.status(500).json({ error: 'Failed to delete action plan.' });
  }
});

// ── Narrative Team Report ─────────────────────────────────────────────────────

/**
 * POST /api/orgs-advanced/:id/report
 * Generate a narrative team report.
 * Requires: teams-pro or enterprise.
 */
router.post('/:id/report', authenticateJWT, async (req, res) => {
  try {
    const org = await requireOrgAdmin(req, res);
    if (!org) return;

    if (!canAccessFeature(org.plan, 'advanced')) {
      return res.status(403).json({
        error: 'Narrative reports require Teams Pro or Enterprise plan.',
        upgradeRequired: true,
      });
    }

    const analytics = await computeAdvancedAnalytics(org);
    const settings  = await OrgSettings.findOne({ organizationId: org._id }).lean();

    const report = generateTeamNarrativeReport(analytics, {
      orgName:  org.company_name || org.name,
      settings: settings || {},
    });

    res.json({ success: true, report });
  } catch (err) {
    console.error('[org-advanced] report error:', err);
    res.status(500).json({ error: 'Failed to generate report.' });
  }
});

// ── CSV Export ────────────────────────────────────────────────────────────────

/**
 * POST /api/orgs-advanced/:id/export/csv
 * Programmatic CSV export of team results.
 */
router.post('/:id/export/csv', authenticateJWT, exportLimiter, async (req, res) => {
  try {
    const org = await requireOrgAdmin(req, res);
    if (!org) return;

    const results = await ResilienceResult.find({
      _id: { $in: org.completedResultIds || [] },
    }).lean();

    const DIMS = ['relational', 'cognitive', 'somatic', 'emotional', 'spiritual', 'agentic'];
    const header = ['email', 'overall', ...DIMS, 'completedAt'].join(',');

    const rows = results.map((r) => {
      const dimScores = DIMS.map((d) => (r.dimension_scores && r.dimension_scores[d] != null ? r.dimension_scores[d] : '')).join(',');
      return [
        `"${(r.email || '').replace(/"/g, '""')}"`,
        r.overall || r.overall_score || '',
        dimScores,
        r.createdAt ? new Date(r.createdAt).toISOString() : '',
      ].join(',');
    });

    const csv = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="team-results-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('[org-advanced] csv-export error:', err);
    res.status(500).json({ error: 'Failed to export CSV.' });
  }
});

// ── Webhooks ──────────────────────────────────────────────────────────────────

/**
 * POST /api/orgs-advanced/:id/webhooks
 * Register a webhook endpoint. Requires Enterprise plan.
 * Body: { url, events: string[], secret }
 */
router.post('/:id/webhooks', authenticateJWT, async (req, res) => {
  try {
    const org = await requireOrgAdmin(req, res);
    if (!org) return;

    if (!canAccessFeature(org.plan, 'webhooks')) {
      return res.status(403).json({
        error: 'Webhooks require Enterprise plan.',
        upgradeRequired: true,
      });
    }

    const { url, events, secret } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ error: 'Webhook URL is required.' });
    }
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'At least one event is required.' });
    }

    const settings = await OrgSettings.findOneAndUpdate(
      { organizationId: org._id },
      {
        $push: {
          webhooks: {
            url: url.trim(),
            events,
            secret: secret || crypto.randomBytes(20).toString('hex'),
            isActive: true,
          },
        },
      },
      { upsert: true, new: true }
    );

    const hook = settings.webhooks[settings.webhooks.length - 1];
    res.status(201).json({ success: true, webhook: hook });
  } catch (err) {
    console.error('[org-advanced] add-webhook error:', err);
    res.status(500).json({ error: 'Failed to register webhook.' });
  }
});

/**
 * DELETE /api/orgs-advanced/:id/webhooks/:hookId
 * Remove a webhook.
 */
router.delete('/:id/webhooks/:hookId', authenticateJWT, async (req, res) => {
  try {
    const org = await requireOrgAdmin(req, res);
    if (!org) return;

    const { hookId } = req.params;
    if (!validId(hookId)) return res.status(400).json({ error: 'Invalid webhook ID.' });

    await OrgSettings.updateOne(
      { organizationId: org._id },
      { $pull: { webhooks: { _id: new mongoose.Types.ObjectId(hookId) } } }
    );

    res.json({ success: true, message: 'Webhook removed.' });
  } catch (err) {
    console.error('[org-advanced] delete-webhook error:', err);
    res.status(500).json({ error: 'Failed to delete webhook.' });
  }
});

// ── Webhook Dispatcher (internal helper) ─────────────────────────────────────

/**
 * Emit a webhook event to all registered endpoints for an org.
 * Fire-and-forget — errors are logged but not re-thrown.
 *
 * @param {ObjectId|string} orgId
 * @param {string} event   – e.g. 'assessment_completed'
 * @param {Object} payload – event-specific data
 */
async function emitWebhookEvent(orgId, event, payload) {
  try {
    const settings = await OrgSettings.findOne({ organizationId: orgId }).lean();
    if (!settings || !settings.webhooks) return;

    const http = require('http');
    const https = require('https');

    for (const hook of settings.webhooks) {
      if (!hook.isActive) continue;
      if (!hook.events.includes(event)) continue;

      const body = JSON.stringify({ event, data: payload, ts: Date.now() });
      const sig  = crypto
        .createHmac('sha256', hook.secret || '')
        .update(body)
        .digest('hex');

      try {
        const url  = new URL(hook.url);
        const lib  = url.protocol === 'https:' ? https : http;

        await new Promise((resolve) => {
          const req = lib.request(
            {
              hostname: url.hostname,
              port:     url.port,
              path:     url.pathname + url.search,
              method:   'POST',
              headers: {
                'Content-Type':       'application/json',
                'Content-Length':     Buffer.byteLength(body),
                'X-Resilience-Event': event,
                'X-Resilience-Sig':   `sha256=${sig}`,
              },
              timeout: 5000,
            },
            resolve
          );
          req.on('error', () => resolve());
          req.write(body);
          req.end();
        });
      } catch (hookErr) {
        console.warn('[org-advanced] webhook delivery failed:', hookErr.message);
      }
    }
  } catch (err) {
    console.warn('[org-advanced] emitWebhookEvent error:', err.message);
  }
}

module.exports = router;
module.exports.emitWebhookEvent = emitWebhookEvent;
