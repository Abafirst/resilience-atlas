const mongoose = require('mongoose');

const AnalyticsEventSchema = new mongoose.Schema({
  event: {
    type: String,
    required: true,
    enum: [
      'quiz_started',
      'quiz_completed',
      'report_purchased',
      'results_shared',
      'team_invite_sent',
      'email_captured',
      'lead_submitted',
      'insights_viewed',
    ],
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  sessionId: { type: String, trim: true },
  properties: { type: mongoose.Schema.Types.Mixed, default: {} },
  ip: { type: String },
  userAgent: { type: String },
}, { timestamps: true });

AnalyticsEventSchema.index({ event: 1, createdAt: -1 });
AnalyticsEventSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('AnalyticsEvent', AnalyticsEventSchema);
