'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const rubricLevelSchema = new Schema({
  score:       { type: Number, required: true },
  description: { type: String, required: true },
}, { _id: false });

const criteriaSchema = new Schema({
  criteriaId:    { type: String, required: true },
  criteria:      { type: String, required: true },
  scoringRubric: { type: [rubricLevelSchema], default: [] },
}, { _id: false });

const ttfCompetencySchema = new Schema({
  competencyName:      { type: String, required: true },
  dimension:           { type: String, default: '' },
  description:         { type: String, default: '' },
  assessmentCriteria:  { type: [criteriaSchema], default: [] },
  orderIndex:          { type: Number, default: 0 },
}, {
  timestamps: true,
  collection: 'ttfCompetencies',
});

module.exports = mongoose.model('TTFCompetency', ttfCompetencySchema);
