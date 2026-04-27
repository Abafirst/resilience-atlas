'use strict';

/**
 * sessionNotes.js — IATLAS clinical session notes CRUD routes.
 *
 * All routes require a valid JWT (authenticateJWT) and that the user holds
 * a Practitioner, Practice, or Enterprise subscription tier.
 *
 * Endpoints:
 *   POST   /api/clinical/session-notes                              — Create note (draft)
 *   GET    /api/clinical/session-notes                              — List notes for a client profile
 *   GET    /api/clinical/session-notes/:id                          — Get single note (decrypted)
 *   PATCH  /api/clinical/session-notes/:id                          — Update / finalize note
 *   DELETE /api/clinical/session-notes/:id                          — Soft-delete note
 *   POST   /api/clinical/session-notes/:id/activities               — Add activity to note
 *   DELETE /api/clinical/session-notes/:id/activities/:activityLinkId — Remove activity from note
 */

const express   = require('express');
const mongoose  = require('mongoose');
const rateLimit = require('express-rate-limit');

const { authenticateJWT, requirePractitionerTier } = require('../../middleware/auth');
const SessionNote         = require('../../models/SessionNote');
const SessionNoteAuditLog = require('../../models/SessionNoteAuditLog');
const ClientProfile       = require('../../models/ClientProfile');
const logger              = require('../../utils/logger');

const router = express.Router();

// ── Rate limiter ──────────────────────────────────────────────────────────────

const notesLimiter = rateLimit({
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
 * Fire-and-forget audit log entry.
 */
async function writeAuditLog({ sessionNoteId, practitionerId, action, ipAddress, userAgent, details }) {
  try {
    await SessionNoteAuditLog.create({
      sessionNoteId,
      practitionerId,
      action,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      details:   details   || {},
    });
  } catch (err) {
    logger.error('[clinical/session-notes] Audit log write failed:', err);
  }
}

/**
 * Return a sanitised session note object with SOAP fields decrypted.
 */
function sanitiseNote(doc) {
  const obj = doc.toSafeObject ? doc.toSafeObject() : (doc.toObject ? doc.toObject() : { ...doc });
  // eslint-disable-next-line no-unused-vars
  const { __v, ...rest } = obj;
  return rest;
}

/**
 * Return a summary of a note (no SOAP fields) suitable for list views.
 */
function summariseNote(doc) {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  return {
    _id:             obj._id,
    clientProfileId: obj.clientProfileId,
    practitionerId:  obj.practitionerId,
    sessionDate:     obj.sessionDate,
    status:          obj.status,
    finalizedAt:     obj.finalizedAt,
    activityCount:   Array.isArray(obj.activities) ? obj.activities.length : 0,
    templateId:      obj.templateId,
    createdAt:       obj.createdAt,
    updatedAt:       obj.updatedAt,
  };
}

// ── Middleware: verify note ownership ────────────────────────────────────────

async function verifyNoteOwnership(req, res, next) {
  try {
    const noteId         = req.params.id;
    const practitionerId = resolveUserId(req);

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({ error: 'Invalid session note ID.' });
    }

    const note = await SessionNote.findById(noteId);

    if (!note || note.isDeleted) {
      return res.status(404).json({ error: 'Session note not found.' });
    }

    if (note.practitionerId !== practitionerId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    req.sessionNote = note;
    next();
  } catch (err) {
    logger.error('[clinical/session-notes] verifyNoteOwnership error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/clinical/session-notes — Create new session note (draft)
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  '/',
  notesLimiter,
  authenticateJWT,
  requirePractitionerTier,
  async (req, res) => {
    try {
      const practitionerId = resolveUserId(req);

      const {
        clientProfileId,
        sessionDate,
        templateId,
        subjective,
        objective,
        assessment,
        plan,
        activities,
      } = req.body;

      // --- Validation ---
      if (!clientProfileId || !mongoose.Types.ObjectId.isValid(clientProfileId)) {
        return res.status(400).json({ error: 'clientProfileId is required and must be a valid ID.' });
      }

      // Verify the practitioner owns this client profile.
      const client = await ClientProfile.findById(clientProfileId).lean();
      if (!client || client.practitionerId !== practitionerId) {
        return res.status(403).json({ error: 'Access denied: client profile not found or not owned by you.' });
      }

      const note = await SessionNote.create({
        practitionerId,
        clientProfileId,
        sessionDate:  sessionDate ? new Date(sessionDate) : new Date(),
        templateId:   templateId && mongoose.Types.ObjectId.isValid(templateId) ? templateId : null,
        subjective:   subjective  || '',
        objective:    objective   || '',
        assessment:   assessment  || '',
        plan:         plan        || '',
        activities:   Array.isArray(activities) ? activities : [],
        status:       'draft',
      });

      await writeAuditLog({
        sessionNoteId:  note._id,
        practitionerId,
        action:         'created',
        ipAddress:      req.ip,
        userAgent:      req.get('User-Agent'),
      });

      logger.info(`[clinical/session-notes] Created note ${note._id} for client ${clientProfileId}`);
      return res.status(201).json(sanitiseNote(note));
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
      }
      logger.error('[clinical/session-notes] POST / error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/clinical/session-notes — List notes for a client profile
// Query params: client_profile_id (required), status, page, limit
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/',
  notesLimiter,
  authenticateJWT,
  requirePractitionerTier,
  async (req, res) => {
    try {
      const practitionerId = resolveUserId(req);
      const {
        client_profile_id,
        status,
        page  = '1',
        limit = '20',
      } = req.query;

      if (!client_profile_id || !mongoose.Types.ObjectId.isValid(client_profile_id)) {
        return res.status(400).json({ error: 'client_profile_id is required and must be a valid ID.' });
      }

      // Verify ownership of the client profile before listing notes.
      const client = await ClientProfile.findById(client_profile_id).lean();
      if (!client || client.practitionerId !== practitionerId) {
        return res.status(403).json({ error: 'Access denied: client profile not found or not owned by you.' });
      }

      // Use client._id from the database (not the raw user input) in the query filter.
      const filter = {
        practitionerId,
        clientProfileId: client._id,
        isDeleted:       false,
      };

      if (status === 'draft' || status === 'finalized') {
        filter.status = status;
      }

      const pageNum  = Math.max(1, parseInt(page,  10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const skip     = (pageNum - 1) * limitNum;

      const [notes, total] = await Promise.all([
        SessionNote.find(filter).sort({ sessionDate: -1 }).skip(skip).limit(limitNum),
        SessionNote.countDocuments(filter),
      ]);

      return res.json({
        notes: notes.map(summariseNote),
        pagination: {
          total,
          page:       pageNum,
          limit:      limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (err) {
      logger.error('[clinical/session-notes] GET / error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/clinical/session-notes/:id — Get single note (decrypted SOAP fields)
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/:id',
  notesLimiter,
  authenticateJWT,
  requirePractitionerTier,
  verifyNoteOwnership,
  async (req, res) => {
    try {
      const practitionerId = resolveUserId(req);
      const note           = req.sessionNote;

      await writeAuditLog({
        sessionNoteId:  note._id,
        practitionerId,
        action:         'viewed',
        ipAddress:      req.ip,
        userAgent:      req.get('User-Agent'),
      });

      return res.json(sanitiseNote(note));
    } catch (err) {
      logger.error('[clinical/session-notes] GET /:id error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/clinical/session-notes/:id — Update / finalize note
// ─────────────────────────────────────────────────────────────────────────────

const UPDATABLE_FIELDS = [
  'sessionDate',
  'subjective',
  'objective',
  'assessment',
  'plan',
  'templateId',
];

router.patch(
  '/:id',
  notesLimiter,
  authenticateJWT,
  requirePractitionerTier,
  verifyNoteOwnership,
  async (req, res) => {
    try {
      const practitionerId = resolveUserId(req);
      const note           = req.sessionNote;

      if (note.status === 'finalized') {
        return res.status(403).json({ error: 'Finalized notes cannot be edited.' });
      }

      const updatedFields = [];

      for (const field of UPDATABLE_FIELDS) {
        if (req.body[field] === undefined) continue;

        if (field === 'sessionDate') {
          const d = new Date(req.body.sessionDate);
          if (isNaN(d.getTime())) {
            return res.status(400).json({ error: 'sessionDate is not a valid date.' });
          }
          note.sessionDate = d;
        } else if (field === 'templateId') {
          const tid = req.body.templateId;
          note.templateId = tid && mongoose.Types.ObjectId.isValid(tid) ? tid : null;
        } else {
          note[field] = req.body[field];
        }

        updatedFields.push(field);
      }

      // Handle finalization.
      let action = 'edited';
      if (req.body.finalize === true) {
        note.status      = 'finalized';
        note.finalizedAt = new Date();
        action           = 'finalized';
        updatedFields.push('status', 'finalizedAt');
      }

      await note.save();

      await writeAuditLog({
        sessionNoteId:  note._id,
        practitionerId,
        action,
        ipAddress:      req.ip,
        userAgent:      req.get('User-Agent'),
        details:        { updatedFields },
      });

      logger.info(`[clinical/session-notes] ${action} note ${note._id}`);
      return res.json(sanitiseNote(note));
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
      }
      logger.error('[clinical/session-notes] PATCH /:id error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/clinical/session-notes/:id — Soft-delete note
// Finalized notes cannot be deleted (HIPAA compliance).
// ─────────────────────────────────────────────────────────────────────────────

router.delete(
  '/:id',
  notesLimiter,
  authenticateJWT,
  requirePractitionerTier,
  verifyNoteOwnership,
  async (req, res) => {
    try {
      const practitionerId = resolveUserId(req);
      const note           = req.sessionNote;

      if (note.status === 'finalized') {
        return res.status(403).json({ error: 'Finalized notes cannot be deleted.' });
      }

      note.isDeleted = true;
      await note.save();

      await writeAuditLog({
        sessionNoteId:  note._id,
        practitionerId,
        action:         'deleted',
        ipAddress:      req.ip,
        userAgent:      req.get('User-Agent'),
      });

      logger.info(`[clinical/session-notes] Soft-deleted note ${note._id}`);
      return res.json({ message: 'Session note deleted successfully.', id: note._id });
    } catch (err) {
      logger.error('[clinical/session-notes] DELETE /:id error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/clinical/session-notes/:id/activities — Add activity to note
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  '/:id/activities',
  notesLimiter,
  authenticateJWT,
  requirePractitionerTier,
  verifyNoteOwnership,
  async (req, res) => {
    try {
      const note = req.sessionNote;

      if (note.status === 'finalized') {
        return res.status(403).json({ error: 'Finalized notes cannot be edited.' });
      }

      const { activityId, durationMinutes, notes: activityNotes } = req.body;

      if (!activityId || typeof activityId !== 'string' || !activityId.trim()) {
        return res.status(400).json({ error: 'activityId is required.' });
      }

      note.activities.push({
        activityId:      activityId.trim(),
        durationMinutes: durationMinutes != null ? Number(durationMinutes) : null,
        notes:           activityNotes || '',
      });

      await note.save();

      const added = note.activities[note.activities.length - 1];
      logger.info(`[clinical/session-notes] Added activity ${activityId} to note ${note._id}`);
      return res.status(201).json({ activity: added.toObject ? added.toObject() : added });
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
      }
      logger.error('[clinical/session-notes] POST /:id/activities error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/clinical/session-notes/:id/activities/:activityLinkId
// Remove activity from note
// ─────────────────────────────────────────────────────────────────────────────

router.delete(
  '/:id/activities/:activityLinkId',
  notesLimiter,
  authenticateJWT,
  requirePractitionerTier,
  verifyNoteOwnership,
  async (req, res) => {
    try {
      const note           = req.sessionNote;
      const { activityLinkId } = req.params;

      if (note.status === 'finalized') {
        return res.status(403).json({ error: 'Finalized notes cannot be edited.' });
      }

      if (!mongoose.Types.ObjectId.isValid(activityLinkId)) {
        return res.status(400).json({ error: 'Invalid activity link ID.' });
      }

      const before = note.activities.length;
      note.activities = note.activities.filter(
        (a) => a._id.toString() !== activityLinkId
      );

      if (note.activities.length === before) {
        return res.status(404).json({ error: 'Activity link not found.' });
      }

      await note.save();

      logger.info(`[clinical/session-notes] Removed activity link ${activityLinkId} from note ${note._id}`);
      return res.json({ message: 'Activity removed successfully.' });
    } catch (err) {
      logger.error('[clinical/session-notes] DELETE /:id/activities/:activityLinkId error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

module.exports = router;
