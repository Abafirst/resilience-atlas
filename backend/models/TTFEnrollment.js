'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const practicumSessionSchema = new Schema({
  sessionNumber:     { type: Number, required: true, min: 1, max: 10 },
  submittedDate:     { type: Date, default: Date.now },
  videoUrl:          { type: String, default: '' },
  reflectionNotes:   { type: String, default: '' },
  supervisorFeedback:{ type: String, default: '' },
  approved:          { type: Boolean, default: false },
  needsRevision:     { type: Boolean, default: false },
  supervisorId:      { type: String, default: null },
}, { _id: true });

const moduleProgressEntrySchema = new Schema({
  completed:     { type: Boolean, default: false },
  completedDate: { type: Date,    default: null  },
  score:         { type: Number,  default: null  },
  sectionsCompleted: { type: [String], default: [] },
}, { _id: false });

const ttfEnrollmentSchema = new Schema({
  userId:          { type: String, required: true, index: true },
  userEmail:       { type: String, default: '' },
  userName:        { type: String, default: '' },
  userRole:        { type: String, default: '' },
  organization:    { type: String, default: '' },
  enrollmentReason:{ type: String, default: '' },
  enrollmentDate:  { type: Date,   default: Date.now },

  tier: {
    type:    String,
    enum:    ['professional', 'group', 'enterprise'],
    default: 'professional',
  },

  cohortId: { type: Schema.Types.ObjectId, ref: 'TTFCohort', default: null },

  paymentStatus: {
    type:    String,
    enum:    ['pending', 'paid', 'refunded', 'waived'],
    default: 'pending',
  },
  stripePaymentIntentId: { type: String, default: null },
  amountPaid:            { type: Number, default: 0 },

  personalAssessmentCompleted: { type: Boolean, default: false },

  moduleProgress: {
    module1: { type: moduleProgressEntrySchema, default: () => ({}) },
    module2: { type: moduleProgressEntrySchema, default: () => ({}) },
    module3: { type: moduleProgressEntrySchema, default: () => ({}) },
    module4: { type: moduleProgressEntrySchema, default: () => ({}) },
    module5: { type: moduleProgressEntrySchema, default: () => ({}) },
    module6: { type: moduleProgressEntrySchema, default: () => ({}) },
  },

  practicumSessions: { type: [practicumSessionSchema], default: [] },

  competencyAssessment: {
    completed:     { type: Boolean, default: false },
    completedDate: { type: Date,    default: null  },
    score:         { type: Number,  default: null  },
    passingScore:  { type: Number,  default: 85    },
    assessorId:    { type: String,  default: null  },
    feedback:      { type: String,  default: ''    },
    portfolioUrls: { type: [String], default: []   },
  },

  certificationIssued:     { type: Boolean, default: false },
  certificationIssuedDate: { type: Date,    default: null  },
  certificationExpiryDate: { type: Date,    default: null  },
  credentialId:            { type: String,  default: null, sparse: true },

  status: {
    type:    String,
    enum:    ['enrolled', 'in-progress', 'certified', 'expired', 'withdrawn'],
    default: 'enrolled',
  },
}, {
  timestamps: true,
  collection: 'ttfEnrollments',
});

ttfEnrollmentSchema.index({ credentialId: 1 }, { unique: true, sparse: true });
ttfEnrollmentSchema.index({ cohortId: 1 });

module.exports = mongoose.model('TTFEnrollment', ttfEnrollmentSchema);
