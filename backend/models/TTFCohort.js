'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const liveSessionSchema = new Schema({
  date:     { type: Date,   required: true },
  topic:    { type: String, default: '' },
  zoomLink: { type: String, default: '' },
}, { _id: true });

const ttfCohortSchema = new Schema({
  cohortName:   { type: String, required: true },
  startDate:    { type: Date,   required: true },
  endDate:      { type: Date,   required: true },
  facilitatorId:{ type: String, default: null },

  enrolledStudents: { type: [String], default: [] },
  maxCapacity:      { type: Number,   default: 30  },

  liveSessionSchedule: { type: [liveSessionSchema], default: [] },
  communityChannelUrl: { type: String, default: '' },

  status: {
    type:    String,
    enum:    ['upcoming', 'active', 'completed'],
    default: 'upcoming',
  },

  description: { type: String, default: '' },
  price:        { type: Number, default: 497 },
}, {
  timestamps: true,
  collection: 'ttfCohorts',
});

module.exports = mongoose.model('TTFCohort', ttfCohortSchema);
