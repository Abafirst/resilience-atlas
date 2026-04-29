'use strict';
const mongoose = require('mongoose');

const practiceSchema = new mongoose.Schema({
  // Stable external identifier (UUID v4)
  practiceId: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },

  name: { type: String, required: true, trim: true, maxlength: 128 },

  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Legacy field — keep for backwards compatibility
  subscriptionTier: { type: String, default: 'basic' },

  // Practice plan tier
  plan: {
    type: String,
    enum: ['practice-5', 'practice-10', 'practice-25', 'custom'],
    default: 'practice-5',
  },

  // Total seat limit (based on plan)
  seatLimit: { type: Number, default: 5 },

  // Current active seats (count of active practitioners)
  seatsUsed: { type: Number, default: 0 },

  // Stripe billing info
  billing: {
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    subscriptionStatus: {
      type: String,
      enum: ['active', 'trialing', 'past_due', 'canceled', 'unpaid'],
      default: 'trialing',
    },
    trialEndsAt: Date,
    currentPeriodEnd: Date,
  },

  settings: {
    type: Object,
    default: {
      allowClientSharing: true,
      requireApprovalForNewClients: false,
      defaultSessionDuration: 60,
    },
  },

  // Soft delete flag
  archived: { type: Boolean, default: false },
}, { timestamps: true });

// Virtual: available seats
practiceSchema.virtual('seatsAvailable').get(function () {
  return this.seatLimit - this.seatsUsed;
});

module.exports = mongoose.model('Practice', practiceSchema);
