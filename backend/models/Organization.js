const mongoose = require('mongoose');

/**
 * Organization model for team/leadership and B2B features.
 * Stores organization details, admin references, and invited members.
 */
const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // URL-safe unique identifier (e.g. "acme-corp")
    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    // Primary contact / owner email
    adminEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },

    // Business tier: "free" | "business"
    tier: {
      type: String,
      enum: ['free', 'business'],
      default: 'free',
    },

    // Subscription lifecycle: "active" | "trial" | "cancelled"
    subscription_status: {
      type: String,
      enum: ['active', 'trial', 'cancelled'],
      default: 'trial',
    },

    // Maximum number of seats / users
    max_users: {
      type: Number,
      default: null,
    },

    // Admin users who can view leadership reports and manage the org
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Email addresses invited to take the assessment (legacy; Invite model is preferred)
    invitedEmails: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],

    // ResilienceResult IDs belonging to this org's assessment cycle
    completedResultIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ResilienceResult',
      },
    ],

    // References to generated leadership reports
    leadershipReportIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LeadershipReport',
      },
    ],

    // Whether to auto-generate report when ≥50% respond
    autoGenerateEnabled: {
      type: Boolean,
      default: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organization', organizationSchema);
