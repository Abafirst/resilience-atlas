'use strict';

/**
 * clients.js — IATLAS clinical client profile CRUD routes.
 *
 * All routes require a valid JWT (authenticateJWT) and that the user holds
 * a Practitioner, Practice, or Enterprise subscription tier.
 *
 * Endpoints:
 *   POST   /api/clinical/clients              — Create new client
 *   GET    /api/clinical/clients              — List clients (paginated + filtered)
 *   GET    /api/clinical/clients/:id          — Get single client
 *   PUT    /api/clinical/clients/:id          — Update client
 *   DELETE /api/clinical/clients/:id          — Archive client (soft delete)
 *   POST   /api/clinical/clients/:id/restore  — Restore archived client
 */

const express   = require('express');
const mongoose  = require('mongoose');
const rateLimit = require('express-rate-limit');

const { authenticateJWT, requirePractitionerTier } = require('../../middleware/auth');
const ClientProfile = require('../../models/ClientProfile');
const AuditLog      = require('../../models/AuditLog');
const logger        = require('../../utils/logger');

const router = express.Router();

// ── Rate limiter ──────────────────────────────────────────────────────────────

const clientsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max:      120,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

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
 * Fire-and-forget audit log entry.
 */
async function writeAuditLog({ practitionerId, action, clientId, ipAddress, details }) {
  try {
    await AuditLog.create({
      practitionerId,
      action,
      clientId: clientId || null,
      ipAddress: ipAddress || null,
      details:   details  || {},
    });
  } catch (err) {
    logger.error('[clinical/clients] Audit log write failed:', err);
  }
}

/**
 * Return a sanitised client object with sensitive fields decrypted.
 */
function sanitiseClient(doc) {
  const obj = doc.toSafeObject ? doc.toSafeObject() : (doc.toObject ? doc.toObject() : { ...doc });
  // eslint-disable-next-line no-unused-vars
  const { __v, ...rest } = obj;
  return rest;
}

// ── Middleware: verify client ownership ──────────────────────────────────────

async function verifyClientOwnership(req, res, next) {
  try {
    const clientId      = req.params.id;
    const practitionerId = resolveUserId(req);

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID.' });
    }

    const client = await ClientProfile.findById(clientId).lean();

    if (!client || client.practitionerId !== practitionerId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    req.clientDoc = client;
    next();
  } catch (err) {
    logger.error('[clinical/clients] verifyClientOwnership error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/clinical/clients — Create new client profile
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  '/',
  clientsLimiter,
  authenticateJWT,
  requirePractitionerTier,
  async (req, res) => {
    try {
      const practitionerId = resolveUserId(req);

      const {
        clientIdentifier,
        dateOfBirth,
        pronouns,
        targetDimensions,
        clinicalGoals,
        guardianContact,
        intakeNotes,
        ongoingNotes,
        medicalConsiderations,
        firstSessionDate,
      } = req.body;

      // --- Validation ---
      if (!clientIdentifier || typeof clientIdentifier !== 'string' || !clientIdentifier.trim()) {
        return res.status(400).json({ error: 'clientIdentifier is required.' });
      }
      const trimmedId = clientIdentifier.trim();
      if (trimmedId.length < 2 || trimmedId.length > 50) {
        return res.status(400).json({ error: 'clientIdentifier must be 2–50 characters.' });
      }
      if (/  /.test(trimmedId)) {
        return res.status(400).json({ error: 'clientIdentifier must not contain consecutive spaces.' });
      }

      if (!dateOfBirth) {
        return res.status(400).json({ error: 'dateOfBirth is required.' });
      }
      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime())) {
        return res.status(400).json({ error: 'dateOfBirth is not a valid date.' });
      }
      if (dob >= new Date()) {
        return res.status(400).json({ error: 'dateOfBirth must be in the past.' });
      }
      if (dob <= new Date('1900-01-01')) {
        return res.status(400).json({ error: 'dateOfBirth must be after 1900-01-01.' });
      }

      if (!Array.isArray(targetDimensions) || targetDimensions.length < 1 || targetDimensions.length > 6) {
        return res.status(400).json({ error: 'targetDimensions must contain 1–6 dimensions.' });
      }
      const invalidDims = targetDimensions.filter(d => !ClientProfile.VALID_DIMENSIONS.includes(d));
      if (invalidDims.length > 0) {
        return res.status(400).json({ error: `Invalid targetDimensions: ${invalidDims.join(', ')}` });
      }

      const client = await ClientProfile.create({
        practitionerId,
        clientIdentifier:      trimmedId,
        dateOfBirth:           dob,
        pronouns:              pronouns              || '',
        targetDimensions,
        clinicalGoals:         Array.isArray(clinicalGoals)  ? clinicalGoals  : [],
        guardianContact:       guardianContact       || null,
        intakeNotes:           intakeNotes           || '',
        ongoingNotes:          ongoingNotes          || '',
        medicalConsiderations: medicalConsiderations || '',
        firstSessionDate:      firstSessionDate      ? new Date(firstSessionDate) : null,
        isActive:              true,
      });

      await writeAuditLog({
        practitionerId,
        action:    'CREATE_CLIENT',
        clientId:  client._id,
        ipAddress: req.ip,
      });

      logger.info(`[clinical/clients] Created client ${client._id} for practitioner ${practitionerId}`);
      return res.status(201).json(sanitiseClient(client));
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
      }
      logger.error('[clinical/clients] POST / error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/clinical/clients — List clients (paginated + filtered)
// Query params: status, ageGroup, search, sort, page, limit
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/',
  clientsLimiter,
  authenticateJWT,
  requirePractitionerTier,
  async (req, res) => {
    try {
      const practitionerId = resolveUserId(req);
      const {
        status   = 'active',
        ageGroup,
        search,
        sort     = 'lastSession',
        page     = '1',
        limit    = '20',
      } = req.query;

      // --- Build filter ---
      const filter = { practitionerId };

      if (status === 'active') {
        filter.isActive = true;
      } else if (status === 'archived') {
        filter.isActive = false;
      }
      // status === 'all' → no isActive filter

      if (ageGroup) {
        const groups = ageGroup.split(',').map(g => g.trim()).filter(Boolean);
        if (groups.length === 1) {
          filter.ageGroup = groups[0];
        } else if (groups.length > 1) {
          filter.ageGroup = { $in: groups };
        }
      }

      if (search) {
        filter.clientIdentifier = new RegExp(escapeRegex(search), 'i');
      }

      // --- Pagination ---
      const pageNum  = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const skip     = (pageNum - 1) * limitNum;

      // --- Sort ---
      let sortObj = { updatedAt: -1 };
      if (sort === 'lastSession') sortObj = { lastSessionDate: -1, updatedAt: -1 };
      else if (sort === 'name')   sortObj = { clientIdentifier: 1 };
      else if (sort === 'created') sortObj = { createdAt: -1 };

      const [clients, total] = await Promise.all([
        ClientProfile.find(filter).sort(sortObj).skip(skip).limit(limitNum),
        ClientProfile.countDocuments(filter),
      ]);

      await writeAuditLog({
        practitionerId,
        action:    'LIST_CLIENTS',
        ipAddress: req.ip,
        details:   { filter: { status, ageGroup, search }, page: pageNum, limit: limitNum },
      });

      return res.json({
        clients: clients.map(sanitiseClient),
        pagination: {
          total,
          page:       pageNum,
          limit:      limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (err) {
      logger.error('[clinical/clients] GET / error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/clinical/clients/:id — Get single client
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/:id',
  clientsLimiter,
  authenticateJWT,
  requirePractitionerTier,
  verifyClientOwnership,
  async (req, res) => {
    try {
      const practitionerId = resolveUserId(req);
      const client = await ClientProfile.findById(req.params.id);
      if (!client) return res.status(404).json({ error: 'Client not found.' });

      await writeAuditLog({
        practitionerId,
        action:    'VIEW_CLIENT',
        clientId:  client._id,
        ipAddress: req.ip,
      });

      return res.json(sanitiseClient(client));
    } catch (err) {
      logger.error('[clinical/clients] GET /:id error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/clinical/clients/:id — Update client
// ─────────────────────────────────────────────────────────────────────────────

const UPDATABLE_FIELDS = [
  'clientIdentifier',
  'dateOfBirth',
  'pronouns',
  'targetDimensions',
  'clinicalGoals',
  'guardianContact',
  'intakeNotes',
  'ongoingNotes',
  'medicalConsiderations',
  'firstSessionDate',
  'lastSessionDate',
  'totalSessions',
];

router.put(
  '/:id',
  clientsLimiter,
  authenticateJWT,
  requirePractitionerTier,
  verifyClientOwnership,
  async (req, res) => {
    try {
      const practitionerId = resolveUserId(req);
      const client = await ClientProfile.findById(req.params.id);
      if (!client) return res.status(404).json({ error: 'Client not found.' });

      const updatedFields = [];

      for (const field of UPDATABLE_FIELDS) {
        if (req.body[field] === undefined) continue;

        if (field === 'clientIdentifier') {
          const val = req.body[field];
          if (typeof val !== 'string' || !val.trim()) {
            return res.status(400).json({ error: 'clientIdentifier must be a non-empty string.' });
          }
          const trimmed = val.trim();
          if (trimmed.length < 2 || trimmed.length > 50) {
            return res.status(400).json({ error: 'clientIdentifier must be 2–50 characters.' });
          }
          if (/  /.test(trimmed)) {
            return res.status(400).json({ error: 'clientIdentifier must not contain consecutive spaces.' });
          }
          client[field] = trimmed;
        } else if (field === 'dateOfBirth') {
          const dob = new Date(req.body[field]);
          if (isNaN(dob.getTime())) {
            return res.status(400).json({ error: 'dateOfBirth is not a valid date.' });
          }
          if (dob >= new Date()) {
            return res.status(400).json({ error: 'dateOfBirth must be in the past.' });
          }
          if (dob <= new Date('1900-01-01')) {
            return res.status(400).json({ error: 'dateOfBirth must be after 1900-01-01.' });
          }
          client[field] = dob;
        } else if (field === 'targetDimensions') {
          const dims = req.body[field];
          if (!Array.isArray(dims) || dims.length < 1 || dims.length > 6) {
            return res.status(400).json({ error: 'targetDimensions must contain 1–6 dimensions.' });
          }
          const invalid = dims.filter(d => !ClientProfile.VALID_DIMENSIONS.includes(d));
          if (invalid.length > 0) {
            return res.status(400).json({ error: `Invalid targetDimensions: ${invalid.join(', ')}` });
          }
          client[field] = dims;
        } else {
          client[field] = req.body[field];
        }

        updatedFields.push(field);
      }

      await client.save();

      await writeAuditLog({
        practitionerId,
        action:    'UPDATE_CLIENT',
        clientId:  client._id,
        ipAddress: req.ip,
        details:   { updatedFields },
      });

      logger.info(`[clinical/clients] Updated client ${client._id} for practitioner ${practitionerId}`);
      return res.json(sanitiseClient(client));
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
      }
      logger.error('[clinical/clients] PUT /:id error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/clinical/clients/:id — Archive client (soft delete)
// ─────────────────────────────────────────────────────────────────────────────

router.delete(
  '/:id',
  clientsLimiter,
  authenticateJWT,
  requirePractitionerTier,
  verifyClientOwnership,
  async (req, res) => {
    try {
      const practitionerId = resolveUserId(req);
      const client = await ClientProfile.findById(req.params.id);
      if (!client) return res.status(404).json({ error: 'Client not found.' });
      if (!client.isActive) return res.status(409).json({ error: 'Client is already archived.' });

      client.isActive   = false;
      client.archivedAt = new Date();
      await client.save();

      await writeAuditLog({
        practitionerId,
        action:    'ARCHIVE_CLIENT',
        clientId:  client._id,
        ipAddress: req.ip,
      });

      logger.info(`[clinical/clients] Archived client ${client._id} for practitioner ${practitionerId}`);
      return res.json({ message: 'Client archived successfully.', id: client._id });
    } catch (err) {
      logger.error('[clinical/clients] DELETE /:id error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/clinical/clients/:id/restore — Restore archived client
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  '/:id/restore',
  clientsLimiter,
  authenticateJWT,
  requirePractitionerTier,
  verifyClientOwnership,
  async (req, res) => {
    try {
      const practitionerId = resolveUserId(req);
      const client = await ClientProfile.findById(req.params.id);
      if (!client) return res.status(404).json({ error: 'Client not found.' });
      if (client.isActive) return res.status(409).json({ error: 'Client is already active.' });

      client.isActive   = true;
      client.archivedAt = null;
      await client.save();

      await writeAuditLog({
        practitionerId,
        action:    'RESTORE_CLIENT',
        clientId:  client._id,
        ipAddress: req.ip,
      });

      logger.info(`[clinical/clients] Restored client ${client._id} for practitioner ${practitionerId}`);
      return res.json(sanitiseClient(client));
    } catch (err) {
      logger.error('[clinical/clients] POST /:id/restore error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

module.exports = router;
