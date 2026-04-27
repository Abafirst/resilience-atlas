'use strict';

/**
 * ClientActivityFavorites.js
 *
 * Stores a practitioner's per-client IATLAS activity favourites.
 * One document per (practitionerId, clientProfileId) pair; favourites are
 * stored as an embedded array so that the whole list can be retrieved in a
 * single query.
 */

const mongoose = require('mongoose');

const clientFavoriteItemSchema = new mongoose.Schema(
  {
    activityId: { type: String, required: true },
    addedAt:    { type: Date,   default: Date.now },
    notes:      { type: String, maxlength: 500, default: '' },
  },
  { _id: false }
);

const clientActivityFavoritesSchema = new mongoose.Schema(
  {
    practitionerId: {
      type:     String,
      required: true,
      index:    true,
    },

    clientProfileId: {
      type:     mongoose.Schema.Types.ObjectId,
      required: true,
      index:    true,
      ref:      'ClientProfile',
    },

    favorites: {
      type:    [clientFavoriteItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Compound unique index — one document per practitioner+client pair.
clientActivityFavoritesSchema.index(
  { practitionerId: 1, clientProfileId: 1 },
  { unique: true }
);

module.exports = mongoose.model('ClientActivityFavorites', clientActivityFavoritesSchema);
