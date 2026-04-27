'use strict';

/**
 * SessionNoteAuditLog.js — HIPAA-compliant audit log for session note access.
 *
 * Every create, view, edit, finalize, and delete action performed on a
 * SessionNote is recorded here so a full audit trail is available for
 * compliance reporting.
 */

const mongoose = require('mongoose');

const sessionNoteAuditLogSchema = new mongoose.Schema(
  {
    // ObjectId of the SessionNote that was acted upon.
    sessionNoteId: {
      type:     mongoose.Schema.Types.ObjectId,
      required: true,
      index:    true,
      ref:      'SessionNote',
    },

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
      enum:     ['created', 'viewed', 'edited', 'finalized', 'deleted'],
      index:    true,
    },

    // Request metadata for security auditing.
    ipAddress: {
      type:    String,
      default: null,
    },

    userAgent: {
      type:    String,
      default: null,
    },

    // Optional free-form detail payload (e.g. updated fields list).
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

sessionNoteAuditLogSchema.index({ sessionNoteId: 1, createdAt: -1 });
sessionNoteAuditLogSchema.index({ practitionerId: 1, createdAt: -1 });

module.exports = mongoose.model('SessionNoteAuditLog', sessionNoteAuditLogSchema);
