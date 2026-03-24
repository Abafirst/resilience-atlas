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

    // ── Business tier fields (optional) ──────────────────────────────────────

    // Human-readable company name used for business/enterprise accounts
    company_name: {
      type: String,
      trim: true,
    },

    // Primary contact / billing email for the organization
    admin_email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    // Subscription plan level
    // teams-starter: up to 25 users, 1 team
    // teams-pro:     up to 250 users, unlimited teams
    // enterprise:    unlimited users/teams + branding + SSO
    plan: {
      type: String,
      enum: ['free', 'business', 'teams-starter', 'teams-pro', 'enterprise'],
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

    // Sub-team references (multi-team support for Pro/Enterprise)
    teamIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
      },
    ],

    // Custom branding — logo URL and primary color (Enterprise)
    branding: {
      logoUrl:      { type: String, trim: true, default: null },
      primaryColor: { type: String, trim: true, default: null },
      accentColor:  { type: String, trim: true, default: null },
    },

    // Webhook endpoints registered for this org
    webhookUrls: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organization', organizationSchema);
