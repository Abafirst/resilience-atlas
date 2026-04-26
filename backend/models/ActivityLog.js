'use strict';
const mongoose = require('mongoose');
const activityLogSchema = new mongoose.Schema({
  practiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Practice' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  resourceType: { type: String },
  resourceId: { type: String },
  details: { type: Object, default: {} },
  ipAddress: { type: String },
  userAgent: { type: String },
}, { timestamps: true });
activityLogSchema.index({ practiceId: 1 });
activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ createdAt: -1 });
module.exports = mongoose.model('ActivityLog', activityLogSchema);
