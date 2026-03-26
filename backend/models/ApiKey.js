'use strict';

/**
 * ApiKey.js — Mongoose model for enterprise API keys.
 *
 * Enterprise org admins can generate API keys to enable automated,
 * programmatic access to their org's data (exports, analytics, etc.).
 *
 * Keys are stored as SHA-256 hashes; only the prefix is retained for
 * display after initial creation.
 */

const mongoose = require('mongoose');
const crypto   = require('crypto');

const apiKeySchema = new mongoose.Schema(
  {
    // Owning organization
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    // User who created the key
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Human-readable label for the key (e.g. "CI Export", "HR Dashboard")
    label: {
      type: String,
      trim: true,
      required: true,
      maxlength: 100,
    },

    // First 8 chars of the raw key — shown after creation for identification.
    // Never store the full plaintext key.
    prefix: {
      type: String,
      trim: true,
      required: true,
    },

    // SHA-256 hash of the raw key — used for authentication lookups.
    keyHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Optional expiry. Null = never expires.
    expiresAt: {
      type: Date,
      default: null,
    },

    // Whether the key is currently active.
    isActive: {
      type: Boolean,
      default: true,
    },

    // Last time this key was used (updated on each authenticated request).
    lastUsedAt: {
      type: Date,
      default: null,
    },

    // Scopes / permissions for the key.
    // 'read' — can fetch analytics and results
    // 'export' — can trigger data exports
    scopes: [
      {
        type: String,
        enum: ['read', 'export'],
      },
    ],
  },
  { timestamps: true }
);

// Ensure statics object exists (some test mocks don't initialize it)
if (!apiKeySchema.statics) apiKeySchema.statics = {};

/**
 * Generate a new API key.
 *
 * @param {string} organizationId
 * @param {string} createdBy      — userId
 * @param {string} label
 * @param {string[]} scopes       — e.g. ['read', 'export']
 * @param {Date|null} expiresAt
 * @returns {{ doc: ApiKey, rawKey: string }}
 */
apiKeySchema.statics.generate = async function (
  organizationId,
  createdBy,
  label,
  scopes = ['read'],
  expiresAt = null
) {
  const raw     = crypto.randomBytes(32).toString('hex'); // 64-char hex string
  const prefix  = raw.substring(0, 8);
  const keyHash = crypto.createHash('sha256').update(raw).digest('hex');

  const doc = await this.create({
    organizationId,
    createdBy,
    label,
    prefix,
    keyHash,
    scopes,
    expiresAt,
    isActive: true,
  });

  return { doc, rawKey: `rsa_${raw}` };
};

/**
 * Verify a raw API key string and return the matching ApiKey document,
 * or null if invalid / inactive / expired.
 *
 * @param {string} rawKey — full "rsa_<hex>" string
 * @returns {Promise<ApiKey|null>}
 */
apiKeySchema.statics.verify = async function (rawKey) {
  if (!rawKey || !rawKey.startsWith('rsa_')) return null;
  const hex     = rawKey.slice(4);
  const keyHash = crypto.createHash('sha256').update(hex).digest('hex');

  const key = await this.findOne({ keyHash, isActive: true });
  if (!key) return null;
  if (key.expiresAt && key.expiresAt < new Date()) return null;

  // Update lastUsedAt without triggering full validation
  await this.updateOne({ _id: key._id }, { $set: { lastUsedAt: new Date() } });
  return key;
};

module.exports = mongoose.model('ApiKey', apiKeySchema);
