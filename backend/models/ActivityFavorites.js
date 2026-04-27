'use strict';

/**
 * ActivityFavorites.js
 * Stores a user's favorited IATLAS activities.
 */

const mongoose = require('mongoose');

const favoriteItemSchema = new mongoose.Schema(
  {
    activityId: { type: String, required: true },
    savedAt:    { type: Date,   default: Date.now },
    notes:      { type: String, maxlength: 500, default: '' },
  },
  { _id: false }
);

const ActivityFavoritesSchema = new mongoose.Schema(
  {
    userId: {
      type:     String,
      required: true,
      index:    true,
      unique:   true,
    },
    favorites: [favoriteItemSchema],
  },
  {
    timestamps: true,
  }
);

// Update `updatedAt` automatically via Mongoose timestamps option above.

module.exports = mongoose.model('ActivityFavorites', ActivityFavoritesSchema);
