'use strict';

const mongoose = require('mongoose');

/**
 * Invite model — tracks email-based invitations to organizations.
 *
 * When an org admin invites a user:
 *   1. An Invite record is created with status="pending" and a unique token.
 *   2. The user receives a link: /join?token=<inviteToken>
 *   3. On signup/login via that link, the invite is marked "accepted" and
 *      the user gains the organization association.
 */
const inviteSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    role: {
      type: String,
      enum: ['member', 'admin'],
      default: 'member',
    },

    teamName: {
      type: String,
      default: null,
      trim: true,
    },

    inviteToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired'],
      default: 'pending',
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      // TTL index: MongoDB automatically removes expired documents after status change
      // (handled in application logic rather than TTL since status can be queried)
    },
  },
  { timestamps: true }
);

// Compound index for looking up pending invites by email
inviteSchema.index({ email: 1, status: 1 });

// Compound index for admin views of all invites in an org
inviteSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('Invite', inviteSchema);
