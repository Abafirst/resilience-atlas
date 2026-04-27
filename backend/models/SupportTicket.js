'use strict';

const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema(
  {
    author:      { type: String, enum: ['user', 'support'], required: true },
    message:     { type: String, required: true },
    timestamp:   { type: Date, default: Date.now },
    attachments: [String],
  },
  { _id: false }
);

const SupportTicketSchema = new mongoose.Schema({
  userId: {
    type:     String,
    required: true,
    index:    true,
  },
  userEmail: {
    type:     String,
    required: true,
  },
  userName: String,
  userTier: {
    type:    String,
    enum:    ['free', 'individual', 'family', 'complete', 'practitioner', 'practice', 'enterprise'],
    default: 'free',
    index:   true,
  },
  priority: {
    type:    String,
    enum:    ['low', 'normal', 'high', 'critical'],
    default: 'normal',
    index:   true,
  },
  status: {
    type:    String,
    enum:    ['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'],
    default: 'open',
    index:   true,
  },
  category: {
    type:     String,
    enum:     ['technical', 'billing', 'feature_request', 'bug_report', 'general', 'account'],
    required: true,
  },
  subject: {
    type:     String,
    required: true,
  },
  description: {
    type:     String,
    required: true,
  },
  attachments: [String], // URLs to uploaded files
  replies:     [ReplySchema],
  assignedTo:  String, // Support agent user ID
  createdAt: {
    type:    Date,
    default: Date.now,
    index:   true,
  },
  updatedAt:       Date,
  resolvedAt:      Date,
  firstResponseAt: Date, // SLA tracking
  slaTarget:       Date, // Auto-calculated based on tier
});

// Auto-assign priority and SLA target based on tier when ticket is first created.
SupportTicketSchema.pre('save', function (next) {
  if (this.isNew) {
    if (this.userTier === 'enterprise') {
      this.priority  = 'critical';
      this.slaTarget = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    } else if (this.userTier === 'complete') {
      this.priority  = 'high';
      this.slaTarget = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours
    } else if (this.userTier === 'practitioner' || this.userTier === 'practice') {
      this.priority  = 'normal';
      this.slaTarget = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    } else {
      this.priority  = 'low';
      this.slaTarget = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
    }
  }
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);
