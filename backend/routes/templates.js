'use strict';

/**
 * templates.js — Session Template CRUD routes.
 *
 * All routes require a valid JWT (authenticateJWT) and that the user holds
 * a Practitioner, Practice, or Enterprise subscription tier.
 *
 * Endpoints:
 *   POST   /api/templates                  — Create template
 *   GET    /api/templates                  — List templates (paginated + filtered)
 *   GET    /api/templates/search           — Search templates by name, tags, category
 *   GET    /api/templates/:id              — Get single template
 *   PUT    /api/templates/:id              — Update template
 *   DELETE /api/templates/:id              — Delete template
 *   POST   /api/templates/:id/duplicate    — Clone template
 */

const express   = require('express');
const mongoose  = require('mongoose');
const rateLimit = require('express-rate-limit');

const { authenticateJWT } = require('../middleware/auth');
const checkTier           = require('../middleware/checkTier');
const SessionTemplate     = require('../models/SessionTemplate');
const logger              = require('../utils/logger');

const router = express.Router();

// ── Tier gate ─────────────────────────────────────────────────────────────────

const TEMPLATE_ALLOWED_TIERS = ['practitioner', 'practice', 'enterprise'];
const requireTemplateTier    = checkTier(TEMPLATE_ALLOWED_TIERS);

// ── Rate limiters ─────────────────────────────────────────────────────────────

const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      120,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      30,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

// ── Constants ─────────────────────────────────────────────────────────────────

const VALID_CATEGORIES = new Set(['intake', 'ongoing', 'closure', 'assessment', 'custom']);

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveUserId(req) {
  return req.user && (req.user.userId || req.user.sub);
}

/**
 * Escape special regex characters to prevent ReDoS attacks.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitise a category query parameter.
 * Returns the value only if it is a known category string; otherwise returns null.
 * Prevents NoSQL injection where an attacker might pass an object (e.g. {$gt:""}).
 */
function sanitiseCategory(value) {
  if (typeof value !== 'string') return null;
  return VALID_CATEGORIES.has(value) ? value : null;
}

/**
 * Sanitise a tags query parameter into an array of plain strings.
 * Rejects any element that is not a non-empty string to prevent NoSQL injection.
 */
function sanitiseTags(value) {
  if (!value) return [];
  const raw = Array.isArray(value)
    ? value
    : String(value).split(',').map((t) => t.trim());
  return raw.filter((t) => typeof t === 'string' && t.length > 0 && t.length <= 100);
}

/**
 * Return a sanitised template object with sensitive fields decrypted.
 */
function sanitiseTemplate(doc) {
  const obj = doc.toSafeObject ? doc.toSafeObject() : (doc.toObject ? doc.toObject() : { ...doc });
  // eslint-disable-next-line no-unused-vars
  const { __v, ...rest } = obj;
  return rest;
}

/**
 * Verify the requesting user owns the template.
 * Returns the template document on success or sends a 404/403 and returns null.
 */
async function verifyOwnership(req, res, allowShared = false) {
  const userId = resolveUserId(req);
  const { id }  = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: 'Invalid template ID.' });
    return null;
  }

  const template = await SessionTemplate.findById(id);
  if (!template) {
    res.status(404).json({ error: 'Template not found.' });
    return null;
  }

  const isOwner  = template.therapistId === userId.toString();
  const isShared = allowShared && (
    template.isPublic ||
    template.sharedWith.includes(userId.toString())
  );

  if (!isOwner && !isShared) {
    res.status(403).json({ error: 'Access denied.' });
    return null;
  }

  return template;
}

// ── POST /api/templates — Create template ─────────────────────────────────────

router.post(
  '/',
  writeLimiter,
  authenticateJWT,
  requireTemplateTier,
  async (req, res) => {
    try {
      const userId = resolveUserId(req);

      const {
        name,
        description,
        category,
        sections,
        tags,
        isPublic,
        sharedWith,
        metadata,
      } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'name is required.' });
      }
      if (name.trim().length > 100) {
        return res.status(400).json({ error: 'name must be at most 100 characters.' });
      }
      if (description && description.length > 500) {
        return res.status(400).json({ error: 'description must be at most 500 characters.' });
      }

      const template = await SessionTemplate.create({
        therapistId:  userId.toString(),
        name:         name.trim(),
        description:  description  || '',
        category:     category     || 'custom',
        sections:     Array.isArray(sections)    ? sections    : [],
        tags:         Array.isArray(tags)        ? tags        : [],
        isPublic:     typeof isPublic === 'boolean' ? isPublic : false,
        sharedWith:   Array.isArray(sharedWith)  ? sharedWith  : [],
        metadata:     metadata     || {},
      });

      logger.info(`[templates] Created template ${template._id} for user ${userId}`);
      return res.status(201).json(sanitiseTemplate(template));
    } catch (err) {
      logger.error('[templates] POST / error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ── GET /api/templates — List templates ───────────────────────────────────────

router.get(
  '/',
  readLimiter,
  authenticateJWT,
  requireTemplateTier,
  async (req, res) => {
    try {
      const userId = resolveUserId(req);

      const {
        category,
        tags,
        sort  = 'recent',
        limit = '20',
        skip  = '0',
      } = req.query;

      const filter = { therapistId: userId.toString() };

      const safeCategory = sanitiseCategory(category);
      if (safeCategory) filter.category = safeCategory;

      const safeTagList = sanitiseTags(tags);
      if (safeTagList.length > 0) filter.tags = { $in: safeTagList };

      const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
      const parsedSkip  = Math.max(parseInt(skip,  10) || 0, 0);

      const sortMap = {
        recent:    { updatedAt: -1 },
        usage:     { usageCount: -1 },
        name:      { name: 1 },
      };
      const sortOrder = sortMap[sort] || sortMap.recent;

      const [templates, total] = await Promise.all([
        SessionTemplate.find(filter)
          .sort(sortOrder)
          .skip(parsedSkip)
          .limit(parsedLimit),
        SessionTemplate.countDocuments(filter),
      ]);

      return res.json({
        templates: templates.map(sanitiseTemplate),
        total,
        limit:     parsedLimit,
        skip:      parsedSkip,
      });
    } catch (err) {
      logger.error('[templates] GET / error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ── GET /api/templates/search — Search templates ──────────────────────────────
// NOTE: This route must be registered BEFORE /:id to avoid "search" being
// treated as an ObjectId parameter.

router.get(
  '/search',
  readLimiter,
  authenticateJWT,
  requireTemplateTier,
  async (req, res) => {
    try {
      const userId = resolveUserId(req);
      const { q, category, tags } = req.query;

      const filter = { therapistId: userId.toString() };
      const conditions = [];

      if (q && typeof q === 'string' && q.trim()) {
        const safe = new RegExp(escapeRegex(q.trim()), 'i');
        conditions.push({ name: safe });
        conditions.push({ tags: safe });
      }
      const safeCategory = sanitiseCategory(category);
      if (safeCategory) {
        filter.category = safeCategory;
      }
      const safeTagList = sanitiseTags(tags);
      if (safeTagList.length > 0) filter.tags = { $in: safeTagList };
      if (conditions.length > 0) {
        filter.$or = conditions;
      }

      const templates = await SessionTemplate.find(filter)
        .sort({ updatedAt: -1 })
        .limit(50);

      return res.json({ templates: templates.map(sanitiseTemplate) });
    } catch (err) {
      logger.error('[templates] GET /search error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ── GET /api/templates/:id — Get single template ──────────────────────────────

router.get(
  '/:id',
  readLimiter,
  authenticateJWT,
  requireTemplateTier,
  async (req, res) => {
    try {
      const template = await verifyOwnership(req, res, true);
      if (!template) return;

      return res.json(sanitiseTemplate(template));
    } catch (err) {
      logger.error('[templates] GET /:id error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ── PUT /api/templates/:id — Update template ──────────────────────────────────

const UPDATABLE_FIELDS = [
  'name',
  'description',
  'category',
  'sections',
  'tags',
  'isPublic',
  'sharedWith',
  'metadata',
];

router.put(
  '/:id',
  writeLimiter,
  authenticateJWT,
  requireTemplateTier,
  async (req, res) => {
    try {
      const template = await verifyOwnership(req, res, false);
      if (!template) return;

      for (const field of UPDATABLE_FIELDS) {
        if (req.body[field] === undefined) continue;

        if (field === 'name') {
          const val = req.body[field];
          if (typeof val !== 'string' || !val.trim()) {
            return res.status(400).json({ error: 'name must be a non-empty string.' });
          }
          if (val.trim().length > 100) {
            return res.status(400).json({ error: 'name must be at most 100 characters.' });
          }
          template[field] = val.trim();
        } else if (field === 'description') {
          if (req.body[field].length > 500) {
            return res.status(400).json({ error: 'description must be at most 500 characters.' });
          }
          template[field] = req.body[field];
        } else {
          template[field] = req.body[field];
        }
      }

      await template.save();

      logger.info(`[templates] Updated template ${template._id}`);
      return res.json(sanitiseTemplate(template));
    } catch (err) {
      logger.error('[templates] PUT /:id error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ── DELETE /api/templates/:id — Delete template ───────────────────────────────

router.delete(
  '/:id',
  writeLimiter,
  authenticateJWT,
  requireTemplateTier,
  async (req, res) => {
    try {
      const template = await verifyOwnership(req, res, false);
      if (!template) return;

      await SessionTemplate.findByIdAndDelete(template._id);

      logger.info(`[templates] Deleted template ${template._id}`);
      return res.json({ message: 'Template deleted successfully.', id: template._id });
    } catch (err) {
      logger.error('[templates] DELETE /:id error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ── POST /api/templates/:id/duplicate — Clone template ───────────────────────

router.post(
  '/:id/duplicate',
  writeLimiter,
  authenticateJWT,
  requireTemplateTier,
  async (req, res) => {
    try {
      const userId   = resolveUserId(req);
      const original = await verifyOwnership(req, res, true);
      if (!original) return;

      // Build copy from decrypted original so that the pre-save hook
      // re-encrypts the new document consistently.
      const safe = original.toSafeObject();

      const copy = await SessionTemplate.create({
        therapistId:  userId.toString(),
        name:         `Copy of ${safe.name}`.slice(0, 100),
        description:  safe.description  || '',
        category:     safe.category     || 'custom',
        sections:     Array.isArray(safe.sections) ? safe.sections.map((s) => ({ ...s })) : [],
        tags:         Array.isArray(safe.tags)     ? [...safe.tags]     : [],
        isPublic:     false,
        sharedWith:   [],
        usageCount:   0,
        metadata:     safe.metadata ? { ...safe.metadata } : {},
      });

      logger.info(`[templates] Duplicated template ${original._id} → ${copy._id}`);
      return res.status(201).json(sanitiseTemplate(copy));
    } catch (err) {
      logger.error('[templates] POST /:id/duplicate error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

module.exports = router;
