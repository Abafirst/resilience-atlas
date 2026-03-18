'use strict';

const mongoose = require('mongoose');

/**
 * AssessmentHistory — extended longitudinal assessment record.
 *
 * Augments raw assessment data with milestones, user notes, and a
 * results hash so the frontend can detect duplicate submissions.
 *
 * Each quiz submission creates a NEW document; history is append-only.
 */
const assessmentHistorySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        // SHA-256 hex of the raw answers array — used to detect duplicates
        resultsHash: {
            type: String,
            default: null,
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
            emotional:  { type: Number, default: 0 },
            mental:     { type: Number, default: 0 },
            physical:   { type: Number, default: 0 },
            social:     { type: Number, default: 0 },
            spiritual:  { type: Number, default: 0 },
            financial:  { type: Number, default: 0 },
        },
        // Milestone badge keys earned on this assessment
        milestones: {
            type: [String],
            default: [],
        },
        // Optional user-authored reflection note
        notes: {
            type: String,
            default: '',
            maxlength: 2000,
        },
    },
    { timestamps: true }
);

// Compound index for "user history sorted by date" — most common query
assessmentHistorySchema.index({ userId: 1, assessmentDate: -1 });
// Single-field fallback indexes
assessmentHistorySchema.index({ userId: 1 });
assessmentHistorySchema.index({ assessmentDate: -1 });

module.exports = mongoose.model('AssessmentHistory', assessmentHistorySchema);
