const mongoose = require('mongoose');

/**
 * Organization model for team/leadership features.
 * Stores organization details, admin references, and invited members.
 */
const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Admin users who can view leadership reports
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Email addresses invited to take the assessment
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

    // ── Business tier fields (optional) ──────────────────────────────────────

    // Human-readable company name used for business/enterprise accounts
    company_name: {
      type: String,
      trim: true,
    },

    // Primary contact / billing email for the organisation
    admin_email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    // Subscription plan level
    plan: {
      type: String,
      enum: ['free', 'business', 'enterprise'],
      default: 'free',
    },

    // Current subscription status
    subscription_status: {
      type: String,
      enum: ['active', 'cancelled', 'trialing'],
      default: 'active',
    },

    // Optional branding and seat configuration
    settings: {
      team_name: { type: String, trim: true },
      max_users:  { type: Number, default: 100 },
      custom_branding: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organization', organizationSchema);
