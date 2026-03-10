const mongoose = require('mongoose');

/**
 * UserAffirmation Schema
 * Tracks user engagement with individual affirmations.
 */
const UserAffirmationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  affirmationId: {
    type: String,
    required: true,
    trim: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  isFavorited: {
    type: Boolean,
    default: false,
  },
  firstEngagedAt: {
    type: Date,
    default: Date.now,
  },
  lastEngagedAt: {
    type: Date,
    default: Date.now,
  },
  engagementCount: {
    type: Number,
    default: 1,
    min: 1,
  },
});

UserAffirmationSchema.index({ userId: 1, affirmationId: 1 });
UserAffirmationSchema.index({ userId: 1, isFavorited: 1 });

module.exports = mongoose.model('UserAffirmation', UserAffirmationSchema);
