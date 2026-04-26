'use strict';
const mongoose = require('mongoose');
const practicePractitionerSchema = new mongoose.Schema({
  practiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Practice', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['admin', 'clinician', 'therapist', 'observer'], required: true },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  invitedAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date },
  status: { type: String, enum: ['pending', 'active', 'suspended', 'removed'], default: 'pending' },
}, { timestamps: true });
practicePractitionerSchema.index({ practiceId: 1, userId: 1 }, { unique: true });
module.exports = mongoose.model('PracticePractitioner', practicePractitionerSchema);
