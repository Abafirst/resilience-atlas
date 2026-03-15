'use strict';

/**
 * OrgSettings.js — Mongoose model for organizational branding and permissions.
 *
 * Stores customization (logo, colors, intro text) and role-based permission
 * configuration for an Organization.
 */

const mongoose = require('mongoose');

const orgSettingsSchema = new mongoose.Schema(
  {
    // One-to-one with Organization
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: true,
      index: true,
    },

    // ── Branding ──────────────────────────────────────────────────────────────

    branding: {
      // URL or base64 data URI for the organization logo
      logoUrl: {
        type: String,
        trim: true,
        default: null,
      },

      // Primary brand color as a CSS hex value, e.g. "#2563EB"
      primaryColor: {
        type: String,
        trim: true,
        default: '#1a2e5a',
      },

      // Secondary / accent color
      accentColor: {
        type: String,
        trim: true,
        default: '#3b82f6',
      },

      // Custom intro text shown to team members before the assessment
      assessmentIntro: {
        type: String,
        trim: true,
        default: '',
        maxlength: 1000,
      },

      // Organization tagline for reports and dashboard header
      tagline: {
        type: String,
        trim: true,
        default: '',
        maxlength: 200,
      },
    },

    // ── Role-based Permissions ────────────────────────────────────────────────

    permissions: {
      // Viewers can see dashboards but cannot invite or export
      viewerCanExport: {
        type: Boolean,
        default: false,
      },
      // Contributors can invite members
      contributorCanInvite: {
        type: Boolean,
        default: true,
      },
      // Whether members can see each other's individual scores
      showMemberScores: {
        type: Boolean,
        default: false,
      },
      // Risk threshold override (default 40)
      riskThreshold: {
        type: Number,
        default: 40,
        min: 1,
        max: 100,
      },
    },

    // ── Scheduled Exports ─────────────────────────────────────────────────────

    scheduledExport: {
      enabled: {
        type: Boolean,
        default: false,
      },
      // 'weekly' | 'monthly'
      frequency: {
        type: String,
        enum: ['weekly', 'monthly'],
        default: 'monthly',
      },
      // Email address to send the export to (defaults to admin email)
      recipientEmail: {
        type: String,
        lowercase: true,
        trim: true,
        default: null,
      },
      lastExportedAt: {
        type: Date,
        default: null,
      },
    },

    // ── Webhooks ──────────────────────────────────────────────────────────────

    webhooks: [
      {
        url: {
          type: String,
          trim: true,
        },
        // Events to subscribe to
        events: [
          {
            type: String,
            enum: ['assessment_completed', 'team_created', 'milestone_reached', 'member_invited'],
          },
        ],
        secret: {
          type: String,
          trim: true,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ── Reassessment Schedule ─────────────────────────────────────────────────

    reassessmentSchedule: {
      // Suggested days between reassessments
      intervalDays: {
        type: Number,
        default: 30,
      },
      nextReassessmentDate: {
        type: Date,
        default: null,
      },
      lastReassessmentDate: {
        type: Date,
        default: null,
      },
    },

    // ── Action Plans ──────────────────────────────────────────────────────────

    actionPlans: [
      {
        dimension: {
          type: String,
          enum: ['relational', 'cognitive', 'somatic', 'emotional', 'spiritual', 'agentic'],
        },
        goal: {
          type: String,
          trim: true,
          maxlength: 500,
        },
        owner: {
          type: String,
          trim: true,
        },
        targetDate: {
          type: Date,
          default: null,
        },
        status: {
          type: String,
          enum: ['not_started', 'in_progress', 'completed'],
          default: 'not_started',
        },
        notes: {
          type: String,
          trim: true,
          maxlength: 1000,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('OrgSettings', orgSettingsSchema);
