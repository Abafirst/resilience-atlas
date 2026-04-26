'use strict';
const mongoose = require('mongoose');
const practitionerInvitationSchema = new mongoose.Schema({
  practiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Practice', required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  role: { type: String, enum: ['admin', 'clinician', 'therapist', 'observer'], required: true },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invitationToken: { type: String, unique: true, required: true },
  expiresAt: { type: Date, required: true },
  acceptedAt: { type: Date },
  status: { type: String, enum: ['pending', 'accepted', 'expired', 'revoked'], default: 'pending' },
}, { timestamps: true });
module.exports = mongoose.model('PractitionerInvitation', practitionerInvitationSchema);
