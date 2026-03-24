'use strict';

/**
 * UserResourceInteraction Model
 *
 * One document per (user, resource) pair. Tracks bookmarks, completion
 * status, and user ratings/reviews for a single resource.
 */

const mongoose = require('mongoose');

const UserResourceInteractionSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    resourceId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Resource',
      required: true,
      index:    true,
    },

    // ── Bookmark ──────────────────────────────────────────────────────────────
    bookmarked:   { type: Boolean, default: false },
    bookmarkedAt: { type: Date,    default: null  },

    // ── Progress ─────────────────────────────────────────────────────────────
    completed:   { type: Boolean, default: false },
    completedAt: { type: Date,    default: null  },
    progress:    { type: Number,  default: 0, min: 0, max: 100 },  // 0-100 %

    // ── Rating / review ───────────────────────────────────────────────────────
    rating:     { type: Number, min: 1, max: 5, default: null },
    reviewText: { type: String, trim: true, maxlength: 1000, default: null },
    reviewedAt: { type: Date,   default: null },
  },
  {
    timestamps: true,
  }
);

// ── Composite unique index: one record per user+resource pair ─────────────────

UserResourceInteractionSchema.index({ userId: 1, resourceId: 1 }, { unique: true });

module.exports = mongoose.model('UserResourceInteraction', UserResourceInteractionSchema);
