'use strict';

const mongoose = require('mongoose');

/**
 * ResilienceAssessment — longitudinal assessment storage.
 *
 * Every quiz submission creates a NEW record. Past results are never overwritten.
 * Indexed on userId and assessmentDate for fast chronological queries.
 */
const resilienceAssessmentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        assessmentDate: {
            type: Date,
            default: Date.now,
        },
        overall: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        dominantType: {
            type: String,
            required: true,
        },
        scores: {
            emotional: { type: Number, default: 0 },
            mental:    { type: Number, default: 0 },
            physical:  { type: Number, default: 0 },
            social:    { type: Number, default: 0 },
            spiritual: { type: Number, default: 0 },
            financial: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

// Single-field indexes for flexible queries
resilienceAssessmentSchema.index({ userId: 1 });
resilienceAssessmentSchema.index({ assessmentDate: -1 });

// Compound index — most efficient for "user history sorted by date" queries
resilienceAssessmentSchema.index({ userId: 1, assessmentDate: -1 });

module.exports = mongoose.model('ResilienceAssessment', resilienceAssessmentSchema);
