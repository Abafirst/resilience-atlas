'use strict';
const mongoose = require('mongoose');
const practiceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subscriptionTier: { type: String, default: 'basic' },
  settings: { type: Object, default: {} },
}, { timestamps: true });
module.exports = mongoose.model('Practice', practiceSchema);
