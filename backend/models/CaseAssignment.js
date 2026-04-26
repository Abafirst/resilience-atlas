'use strict';
const mongoose = require('mongoose');
const caseAssignmentSchema = new mongoose.Schema({
  practiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Practice', required: true },
  practitionerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  childProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChildProfile', required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  accessLevel: { type: String, enum: ['full', 'read-only', 'limited'], default: 'full' },
}, { timestamps: true });
caseAssignmentSchema.index({ practitionerId: 1, childProfileId: 1 }, { unique: true });
module.exports = mongoose.model('CaseAssignment', caseAssignmentSchema);
