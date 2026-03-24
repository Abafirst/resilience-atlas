'use strict';

/**
 * Team.js — Mongoose model for sub-teams within an organization.
 *
 * An Organization can have multiple Teams (departments, cohorts, etc.).
 * Each team has its own set of members and dashboard view.
 */

const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    // Parent organization
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    // Human-readable team name (e.g. "Engineering", "Sales")
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Optional description
    description: {
      type: String,
      trim: true,
      default: '',
    },

    // Members — references to User documents with their role in this team
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        email: {
          type: String,
          lowercase: true,
          trim: true,
        },
        // Role within the team
        role: {
          type: String,
          enum: ['viewer', 'contributor', 'admin'],
          default: 'viewer',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ResilienceResult IDs belonging to this specific team
    completedResultIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ResilienceResult',
      },
    ],

    // Pending invitations for this team
    pendingInvites: [
      {
        email: {
          type: String,
          lowercase: true,
          trim: true,
        },
        invitedAt: {
          type: Date,
          default: Date.now,
        },
        // Track reminder count for auto-reminders
        reminderCount: {
          type: Number,
          default: 0,
        },
        lastReminderAt: {
          type: Date,
          default: null,
        },
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index: one org can't have two teams with the same name
teamSchema.index({ organizationId: 1, name: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Team', teamSchema);
