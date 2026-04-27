'use strict';

/**
 * AuditLog.js — HIPAA-compliant audit log for clinical client data access.
 *
 * All client data reads and writes are recorded here so that a full audit
 * trail is available for compliance reporting.
 */

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    // Auth0 sub of the practitioner who performed the action.
    practitionerId: {
      type:     String,
      required: true,
      index:    true,
    },

    // Type of action performed.
    action: {
      type:     String,
      required: true,
      enum: [
        'CREATE_CLIENT',
        'VIEW_CLIENT',
        'LIST_CLIENTS',
        'UPDATE_CLIENT',
        'ARCHIVE_CLIENT',
        'RESTORE_CLIENT',
      ],
      index: true,
    },

    // MongoDB ObjectId of the affected ClientProfile (null for LIST_CLIENTS).
    clientId: {
      type:    mongoose.Schema.Types.ObjectId,
      default: null,
      index:   true,
    },

    // Request metadata for security auditing.
    ipAddress: {
      type: String,
      default: null,
    },

    // Optional free-form detail payload (e.g. updated fields).
    details: {
      type:    Object,
      default: {},
    },
  },
  {
    // createdAt is the canonical "when did this happen" timestamp.
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ practitionerId: 1, createdAt: -1 });
auditLogSchema.index({ clientId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
