'use strict';

/**
 * SessionNote.js — Mongoose model for IATLAS session notes.
 *
 * Practitioners create session notes for each client session using the SOAP
 * format (Subjective, Objective, Assessment, Plan).  All four SOAP text
 * fields are encrypted at rest using AES-256-CBC for HIPAA compliance.
 *
 * Soft-delete is implemented via `isDeleted` — finalized notes can never be
 * hard-deleted to preserve the HIPAA audit trail.
 */

const mongoose = require('mongoose');
const crypto   = require('crypto');

// ── Encryption helpers ────────────────────────────────────────────────────────

const ENCRYPTION_KEY_HEX = process.env.SESSION_NOTES_ENCRYPTION_KEY || null;

/**
 * Derive a 32-byte AES key from the hex-encoded environment variable.
 * Returns null when no key is configured (dev / test fall-back).
 */
function getEncryptionKey() {
  if (!ENCRYPTION_KEY_HEX) return null;
  try {
    const buf = Buffer.from(ENCRYPTION_KEY_HEX, 'hex');
    return buf.length === 32 ? buf : null;
  } catch {
    return null;
  }
}

/**
 * Encrypt a plain-text string with AES-256-CBC.
 * Returns the original value when no key is configured (dev fallback).
 *
 * @param  {string|null} value
 * @returns {string|null}
 */
function encrypt(value) {
  if (value == null || value === '') return value;
  const key = getEncryptionKey();
  if (!key) return value;

  const iv        = crypto.randomBytes(16);
  const cipher    = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  return `enc:${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt a value produced by `encrypt()`.
 * Returns the value unchanged when it is not an encrypted string or when
 * no key is configured.
 *
 * @param  {string|null} value
 * @returns {string|null}
 */
function decrypt(value) {
  if (!value || !String(value).startsWith('enc:')) return value;
  const key = getEncryptionKey();
  if (!key) return value;

  try {
    const parts     = value.slice(4).split(':');
    const iv        = Buffer.from(parts[0], 'hex');
    const encrypted = Buffer.from(parts[1], 'hex');
    const decipher  = crypto.createDecipheriv('aes-256-cbc', key, iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch {
    return value; // return cipher-text rather than crashing on corrupted data
  }
}

// ── Activity link sub-schema ──────────────────────────────────────────────────

const activityLinkSchema = new mongoose.Schema(
  {
    activityId: {
      type:     String,
      required: true,
    },
    durationMinutes: {
      type:    Number,
      default: null,
    },
    notes: {
      type:    String,
      default: '',
    },
  },
  {
    _id:        true,
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// ── Main schema ───────────────────────────────────────────────────────────────

const sessionNoteSchema = new mongoose.Schema(
  {
    // Auth0 sub of the owning practitioner.
    practitionerId: {
      type:     String,
      required: true,
      index:    true,
    },

    // ObjectId of the associated ClientProfile.
    clientProfileId: {
      type:     mongoose.Schema.Types.ObjectId,
      required: true,
      index:    true,
      ref:      'ClientProfile',
    },

    // Date the session took place (defaults to creation time).
    sessionDate: {
      type:    Date,
      default: () => new Date(),
      index:   true,
    },

    // Optional template the practitioner applied to pre-fill the note.
    templateId: {
      type:    mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // IATLAS activities used in this session — stored as embedded sub-docs.
    activities: {
      type:    [activityLinkSchema],
      default: [],
    },

    // SOAP fields — stored encrypted when a key is configured.
    subjective: { type: String, default: '' },
    objective:  { type: String, default: '' },
    assessment: { type: String, default: '' },
    plan:       { type: String, default: '' },

    // Workflow state.
    status: {
      type:    String,
      enum:    ['draft', 'finalized'],
      default: 'draft',
      index:   true,
    },

    finalizedAt: {
      type:    Date,
      default: null,
    },

    // Soft-delete — finalized notes are never hard-deleted (HIPAA compliance).
    isDeleted: {
      type:    Boolean,
      default: false,
      index:   true,
    },
  },
  { timestamps: true }
);

// ── Compound indexes ──────────────────────────────────────────────────────────

sessionNoteSchema.index({ practitionerId: 1, clientProfileId: 1, sessionDate: -1 });
sessionNoteSchema.index({ practitionerId: 1, status: 1 });
sessionNoteSchema.index({ clientProfileId: 1, isDeleted: 1, sessionDate: -1 });

// ── Pre-save hook: encrypt SOAP fields ───────────────────────────────────────

sessionNoteSchema.pre('save', function preSave(next) {
  const SOAP_FIELDS = ['subjective', 'objective', 'assessment', 'plan'];

  for (const field of SOAP_FIELDS) {
    if (this.isModified(field) && this[field]) {
      this[field] = encrypt(this[field]);
    }
  }

  next();
});

// ── Instance method: decrypted representation ─────────────────────────────────

sessionNoteSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();

  obj.subjective = decrypt(obj.subjective);
  obj.objective  = decrypt(obj.objective);
  obj.assessment = decrypt(obj.assessment);
  obj.plan       = decrypt(obj.plan);

  return obj;
};

// ── Export ────────────────────────────────────────────────────────────────────

const SessionNote = mongoose.model('SessionNote', sessionNoteSchema);

// Expose helpers for testing.
SessionNote.encrypt = encrypt;
SessionNote.decrypt = decrypt;

module.exports = SessionNote;
