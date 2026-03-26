'use strict';

/**
 * api-keys.js — Enterprise API key management.
 *
 * Mounted at /api/orgs-advanced/:orgId/api-keys
 *
 * Route summary
 * ─────────────
 * GET    /api/orgs-advanced/:orgId/api-keys          List org API keys (admin)
 * POST   /api/orgs-advanced/:orgId/api-keys          Generate new API key (admin)
 * DELETE /api/orgs-advanced/:orgId/api-keys/:keyId   Revoke an API key (admin)
 *
 * Requires the organization to be on the 'enterprise' plan (data-export gate).
 */

const express   = require('express');
const mongoose  = require('mongoose');
const rateLimit = require('express-rate-limit');

const { authenticateJWT }  = require('../middleware/auth');
const Organization         = require('../models/Organization');
const ApiKey               = require('../models/ApiKey');
const { canAccessFeature } = require('../utils/tierUtils');

const router = express.Router({ mergeParams: true });

const keyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(keyLimiter);

// ── Helpers ───────────────────────────────────────────────────────────────────

function validId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function isOrgAdmin(org, userId) {
  return org.admins && org.admins.some((id) => id.toString() === userId.toString());
}

async function requireEnterprise(req, res) {
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
  if (!isOrgAdmin(org, req.user.userId)) {
    res.status(403).json({ error: 'Forbidden — org admin access required.' });
    return null;
  }
  if (!canAccessFeature(org.plan, 'data-export')) {
    res.status(403).json({
      error: 'API key management requires the Enterprise plan.',
      upgradeRequired: true,
    });
    return null;
  }
  return org;
}

// ── GET /api/orgs-advanced/:orgId/api-keys ───────────────────────────────────

/**
 * List all API keys for the organization.
 * Returns label, prefix, scopes, expiresAt, lastUsedAt, isActive — never keyHash.
 */
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const org = await requireEnterprise(req, res);
    if (!org) return;

    const keys = await ApiKey.find({ organizationId: org._id })
      .select('-keyHash')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ keys });
  } catch (err) {
    console.error('[api-keys] list error:', err);
    return res.status(500).json({ error: 'Failed to retrieve API keys.' });
  }
});

// ── POST /api/orgs-advanced/:orgId/api-keys ──────────────────────────────────

/**
 * Generate a new API key.
 *
 * Body: { label, scopes?, expiresAt? }
 *
 * Returns: { key: { ...doc, prefix }, rawKey }
 * The rawKey is only returned once — store it securely.
 */
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const org = await requireEnterprise(req, res);
    if (!org) return;

    const { label, scopes, expiresAt } = req.body || {};
    if (!label || typeof label !== 'string' || !label.trim()) {
      return res.status(400).json({ error: 'label is required.' });
    }

    const allowedScopes = ['read', 'export'];
    const resolvedScopes = Array.isArray(scopes)
      ? scopes.filter((s) => allowedScopes.includes(s))
      : ['read'];

    if (resolvedScopes.length === 0) {
      return res.status(400).json({ error: 'At least one valid scope (read, export) is required.' });
    }

    const resolvedExpiry = expiresAt ? new Date(expiresAt) : null;
    if (resolvedExpiry && isNaN(resolvedExpiry.getTime())) {
      return res.status(400).json({ error: 'Invalid expiresAt date.' });
    }

    const { doc, rawKey } = await ApiKey.generate(
      org._id,
      req.user.userId,
      label.trim(),
      resolvedScopes,
      resolvedExpiry
    );

    const safeDoc = { ...doc.toObject(), keyHash: undefined };
    delete safeDoc.keyHash;

    return res.status(201).json({
      key: safeDoc,
      rawKey,
      warning: 'Store this key securely — it will not be shown again.',
    });
  } catch (err) {
    console.error('[api-keys] create error:', err);
    return res.status(500).json({ error: 'Failed to create API key.' });
  }
});

// ── DELETE /api/orgs-advanced/:orgId/api-keys/:keyId ─────────────────────────

/**
 * Revoke (deactivate) an API key.
 */
router.delete('/:keyId', authenticateJWT, async (req, res) => {
  try {
    const org = await requireEnterprise(req, res);
    if (!org) return;

    const { keyId } = req.params;
    if (!validId(keyId)) {
      return res.status(400).json({ error: 'Invalid key ID.' });
    }

    const key = await ApiKey.findOne({ _id: keyId, organizationId: org._id });
    if (!key) {
      return res.status(404).json({ error: 'API key not found.' });
    }

    key.isActive = false;
    await key.save();

    return res.json({ success: true, message: 'API key revoked.' });
  } catch (err) {
    console.error('[api-keys] revoke error:', err);
    return res.status(500).json({ error: 'Failed to revoke API key.' });
  }
});

module.exports = router;
