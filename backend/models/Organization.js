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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organization', organizationSchema);
