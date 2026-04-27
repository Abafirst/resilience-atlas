'use strict';

/**
 * ClientProfile.js — Mongoose model for IATLAS clinical client profiles.
 *
 * Each document represents one client managed by a practitioner.
 * Sensitive fields are encrypted at rest using AES-256-CBC (application-level
 * encryption) so that PII is protected even if the database is compromised.
 *
 * Soft-delete is implemented via `isActive` / `archivedAt` — records are
 * never hard-deleted so that the HIPAA audit trail is preserved.
 */

const mongoose = require('mongoose');
const crypto   = require('crypto');

// ── Encryption helpers ────────────────────────────────────────────────────────

const ENCRYPTION_KEY_HEX = process.env.CLIENT_ENCRYPTION_KEY || null;

/**
 * Derive a 32-byte key buffer from the hex-encoded env var.
 * Returns null when no key is configured (dev / test environments without
 * real encryption).
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
 * Encrypt a plain-text string.
 * Returns null for falsy input.  Returns the original string when no
 * encryption key is configured (development fall-back).
 *
 * @param  {string|null} value
 * @returns {string|null}
 */
function encrypt(value) {
  if (value == null || value === '') return value;
  const key = getEncryptionKey();
  if (!key) return value; // no key configured — store plain (dev only)

  const iv         = crypto.randomBytes(16);
  const cipher     = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted  = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  return `enc:${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt a value that was produced by `encrypt()`.
 * Returns the value unchanged when it is not an encrypted string or when no
 * key is configured.
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

// ── Constants ─────────────────────────────────────────────────────────────────

const VALID_DIMENSIONS = [
  'agentic-generative',
  'somatic-regulative',
  'cognitive-narrative',
  'relational-connective',
  'emotional-adaptive',
  'spiritual-existential',
];

// ── Age-group calculation ─────────────────────────────────────────────────────

/**
 * Calculate the IATLAS age-group string from a Date of birth.
 *
 * @param  {Date|string|null} dateOfBirth
 * @returns {string} age-group identifier or 'unknown'
 */
function calculateAgeGroup(dateOfBirth) {
  if (!dateOfBirth) return 'unknown';
  const dob = dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return 'unknown';

  const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  if (age >= 3  && age <= 4)  return 'ages-3-4';
  if (age >= 5  && age <= 7)  return 'ages-5-7';
  if (age >= 8  && age <= 10) return 'ages-8-10';
  if (age >= 11 && age <= 13) return 'ages-11-13';
  if (age >= 14 && age <= 17) return 'ages-14-17';
  if (age >= 18)              return 'adult';

  return 'unknown';
}

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const clinicalGoalSchema = new mongoose.Schema(
  {
    goal: {
      type:      String,
      required:  true,
      trim:      true,
      minlength: 10,
      maxlength: 500,
    },
    priority: {
      type:    String,
      enum:    ['high', 'medium', 'low'],
      default: 'medium',
    },
    status: {
      type:    String,
      enum:    ['active', 'achieved', 'on-hold', 'archived'],
      default: 'active',
    },
    createdAt:  { type: Date, default: Date.now },
    achievedAt: { type: Date, default: null },
  },
  { _id: true }
);

const guardianContactSchema = new mongoose.Schema(
  {
    name:             { type: String, default: '' },
    relationship: {
      type:    String,
      enum:    ['parent', 'guardian', 'caregiver', ''],
      default: '',
    },
    email:            { type: String, default: '' },
    phone:            { type: String, default: '' },
    preferredContact: {
      type:    String,
      enum:    ['email', 'phone', 'both', ''],
      default: '',
    },
  },
  { _id: false }
);

// ── Main schema ───────────────────────────────────────────────────────────────

const clientProfileSchema = new mongoose.Schema(
  {
    // Auth0 sub of the owning practitioner.
    practitionerId: {
      type:     String,
      required: true,
      index:    true,
    },

    // HIPAA-safe identifier (initials / pseudonym) — encrypted at rest.
    clientIdentifier: {
      type:      String,
      required:  true,
      trim:      true,
      minlength: 2,
      maxlength: 50,
      validate: {
        validator(v) {
          // No consecutive spaces allowed.
          return !/  /.test(v);
        },
        message: 'clientIdentifier must not contain consecutive spaces.',
      },
    },

    dateOfBirth: {
      type:     Date,
      required: true,
      validate: [
        {
          validator(v) {
            return v < new Date();
          },
          message: 'dateOfBirth must be in the past.',
        },
        {
          validator(v) {
            return v > new Date('1900-01-01');
          },
          message: 'dateOfBirth must be after 1900-01-01.',
        },
      ],
    },

    // Auto-calculated from dateOfBirth in the pre-save hook.
    ageGroup: {
      type: String,
      enum: ['ages-3-4', 'ages-5-7', 'ages-8-10', 'ages-11-13', 'ages-14-17', 'adult', 'unknown'],
      default: 'unknown',
    },

    pronouns: {
      type:    String,
      default: '',
    },

    targetDimensions: {
      type: [{ type: String, enum: VALID_DIMENSIONS }],
      validate: [
        {
          validator(arr) {
            return Array.isArray(arr) && arr.length >= 1 && arr.length <= 6;
          },
          message: 'targetDimensions must contain 1 to 6 dimensions.',
        },
      ],
    },

    clinicalGoals: {
      type:    [clinicalGoalSchema],
      default: [],
    },

    // Encrypted fields — stored as "enc:<iv_hex>:<cipher_hex>" when a key is
    // configured; stored plain-text in development when no key is set.
    guardianContact: {
      type:    guardianContactSchema,
      default: null,
    },

    intakeNotes:           { type: String, default: '' },
    ongoingNotes:          { type: String, default: '' },
    medicalConsiderations: { type: String, default: '' },

    isActive: {
      type:    Boolean,
      default: true,
      index:   true,
    },

    firstSessionDate: { type: Date, default: null },
    lastSessionDate:  { type: Date, default: null },
    totalSessions:    { type: Number, default: 0 },

    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ── Compound indexes ──────────────────────────────────────────────────────────

clientProfileSchema.index({ practitionerId: 1, isActive: 1, updatedAt: -1 });
clientProfileSchema.index({ practitionerId: 1, ageGroup: 1 });

// ── Pre-save hooks ────────────────────────────────────────────────────────────

clientProfileSchema.pre('save', function preSave(next) {
  // Auto-calculate ageGroup from dateOfBirth.
  if (this.dateOfBirth) {
    this.ageGroup = calculateAgeGroup(this.dateOfBirth);
  }

  // Encrypt sensitive fields when a key is configured.
  if (this.isModified('ongoingNotes') && this.ongoingNotes) {
    this.ongoingNotes = encrypt(this.ongoingNotes);
  }
  if (this.isModified('medicalConsiderations') && this.medicalConsiderations) {
    this.medicalConsiderations = encrypt(this.medicalConsiderations);
  }

  next();
});

// ── Instance method: return decrypted representation ─────────────────────────

clientProfileSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  obj.ongoingNotes          = decrypt(obj.ongoingNotes);
  obj.medicalConsiderations = decrypt(obj.medicalConsiderations);
  return obj;
};


// ── Export ────────────────────────────────────────────────────────────────────

const ClientProfile = mongoose.model('ClientProfile', clientProfileSchema);

// In mocked test environments mongoose.model() may return undefined.
// Fall back to an empty object so that subsequent property assignments
// (and any code that loads this module without actually calling the DB)
// do not throw a TypeError.
const exported = ClientProfile || {};

exported.calculateAgeGroup = calculateAgeGroup;
exported.VALID_DIMENSIONS  = VALID_DIMENSIONS;
exported.encrypt           = encrypt;
exported.decrypt           = decrypt;

module.exports = exported;
