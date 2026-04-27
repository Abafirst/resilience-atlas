'use strict';

/**
 * SessionTemplate.js — Mongoose model for IATLAS session templates.
 *
 * Practitioner+ users can create reusable session templates that pre-fill
 * session plan forms.  Sensitive fields are encrypted at rest using
 * AES-256-CBC (application-level encryption) for HIPAA compliance.
 *
 * Soft-delete is NOT used here — templates may be hard-deleted by their
 * owner as they contain no PHI (client data); the template content itself
 * is the practitioner's intellectual work product.
 */

const mongoose = require('mongoose');
const crypto   = require('crypto');

// ── Encryption helpers ────────────────────────────────────────────────────────

const ENCRYPTION_KEY_ENV = process.env.MONGODB_ENCRYPTION_KEY || null;

/**
 * Derive a 32-byte AES key from the base64-encoded environment variable.
 * Returns null when no key is configured (dev / test without encryption).
 */
function getEncryptionKey() {
  if (!ENCRYPTION_KEY_ENV) return null;
  try {
    const buf = Buffer.from(ENCRYPTION_KEY_ENV, 'base64');
    // Use first 32 bytes of the (potentially longer) key material.
    return buf.length >= 32 ? buf.slice(0, 32) : null;
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

// ── Section sub-schema ────────────────────────────────────────────────────────

const sectionSchema = new mongoose.Schema(
  {
    title: {
      type:     String,
      required: true,
      trim:     true,
    },
    type: {
      type: String,
      enum: ['text', 'checklist', 'scale', 'dropdown'],
      default: 'text',
    },
    // Stored encrypted when a key is configured.
    content: {
      type:    String,
      default: '',
    },
    required: {
      type:    Boolean,
      default: false,
    },
    order: {
      type:    Number,
      default: 0,
    },
  },
  { _id: true }
);

// ── Metadata sub-schema ───────────────────────────────────────────────────────

const metadataSchema = new mongoose.Schema(
  {
    estimatedDuration: {
      type:    Number, // minutes
      default: null,
    },
    // Stored encrypted when a key is configured.
    targetPopulation: {
      type:    String,
      default: '',
    },
    therapeuticApproach: {
      type:    String,
      default: '',
    },
  },
  { _id: false }
);

// ── Main schema ───────────────────────────────────────────────────────────────

const sessionTemplateSchema = new mongoose.Schema(
  {
    // Auth0 sub of the owning practitioner.
    therapistId: {
      type:     String,
      required: true,
      index:    true,
    },

    name: {
      type:      String,
      required:  true,
      trim:      true,
      maxlength: 100,
    },

    // Stored encrypted when a key is configured.
    description: {
      type:      String,
      default:   '',
      maxlength: 500,
    },

    category: {
      type: String,
      enum: ['intake', 'ongoing', 'closure', 'assessment', 'custom'],
      default: 'custom',
    },

    sections: {
      type:    [sectionSchema],
      default: [],
    },

    tags: {
      type:    [String],
      default: [],
      index:   true,
    },

    // When true, visible to all practitioners in the same Practice.
    isPublic: {
      type:    Boolean,
      default: false,
    },

    // Explicit sharing with specific practitioner IDs.
    sharedWith: {
      type:    [String],
      default: [],
    },

    usageCount: {
      type:    Number,
      default: 0,
    },

    metadata: {
      type:    metadataSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

// ── Compound indexes ──────────────────────────────────────────────────────────

sessionTemplateSchema.index({ therapistId: 1, updatedAt: -1 });
sessionTemplateSchema.index({ therapistId: 1, category: 1 });
sessionTemplateSchema.index({ therapistId: 1, usageCount: -1 });
sessionTemplateSchema.index({ therapistId: 1, name: 1 });

// ── Pre-save hooks ────────────────────────────────────────────────────────────

sessionTemplateSchema.pre('save', function preSave(next) {
  if (this.isModified('description') && this.description) {
    this.description = encrypt(this.description);
  }

  if (this.isModified('sections') && Array.isArray(this.sections)) {
    this.sections.forEach((section) => {
      if (section.content) {
        section.content = encrypt(section.content);
      }
    });
  }

  if (this.isModified('metadata') && this.metadata && this.metadata.targetPopulation) {
    this.metadata.targetPopulation = encrypt(this.metadata.targetPopulation);
  }

  next();
});

// ── Instance method: return decrypted representation ─────────────────────────

sessionTemplateSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  obj.description = decrypt(obj.description);

  if (Array.isArray(obj.sections)) {
    obj.sections = obj.sections.map((section) => ({
      ...section,
      content: decrypt(section.content),
    }));
  }

  if (obj.metadata) {
    obj.metadata = {
      ...obj.metadata,
      targetPopulation: decrypt(obj.metadata.targetPopulation),
    };
  }

  return obj;
};

// ── Export ────────────────────────────────────────────────────────────────────

const SessionTemplate = mongoose.model('SessionTemplate', sessionTemplateSchema);

// Expose helpers for testing.
const exported = SessionTemplate || {};
exported.encrypt = encrypt;
exported.decrypt = decrypt;

module.exports = exported;
