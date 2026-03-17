'use strict';

const mongoose = require('mongoose');
const crypto   = require('crypto');

/**
 * Comparison — persists a side-by-side resilience profile comparison.
 *
 * Supports three comparison types:
 *  - 'individual' : two users side-by-side
 *  - 'growth'     : a single user's current vs. historical assessment
 *  - 'team'       : a user vs. their organisation's team average
 */

const scoresSchema = new mongoose.Schema(
    {
        emotional:  { type: Number, default: 0 },
        mental:     { type: Number, default: 0 },
        physical:   { type: Number, default: 0 },
        social:     { type: Number, default: 0 },
        spiritual:  { type: Number, default: 0 },
        financial:  { type: Number, default: 0 },
    },
    { _id: false }
);

const participantSchema = new mongoose.Schema(
    {
        userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        displayName:  { type: String, default: 'Anonymous' },
        overall:      { type: Number, required: true, min: 0, max: 100 },
        dominantType: { type: String, default: '' },
        scores:       { type: scoresSchema, required: true },
        assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResilienceAssessment', default: null },
        assessmentDate: { type: Date, default: null },
    },
    { _id: false }
);

const comparisonAnalysisSchema = new mongoose.Schema(
    {
        synergies:        { type: [String], default: [] },
        complementarities:{ type: [String], default: [] },
        gaps:             { type: [String], default: [] },
        teamScore:        { type: Number, default: 0 },
        recommendations:  { type: [String], default: [] },
    },
    { _id: false }
);

const comparisonSchema = new mongoose.Schema(
    {
        // Who created this comparison
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        comparisonType: {
            type: String,
            enum: ['individual', 'growth', 'team'],
            default: 'individual',
        },

        // Left / primary participant
        user1: { type: participantSchema, required: true },

        // Right / secondary participant (may be a snapshot of team avg for 'team' type)
        user2: { type: participantSchema, required: true },

        // AI-generated analysis
        comparisonAnalysis: { type: comparisonAnalysisSchema, default: () => ({}) },

        // Sharing
        shareToken: {
            type: String,
            unique: true,
            default: () => crypto.randomBytes(20).toString('hex'),
        },
        isPublic: { type: Boolean, default: false },

        // Expiry — shareable links expire after 30 days
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
    },
    { timestamps: true }
);

// Indexes for common access patterns
comparisonSchema.index({ createdBy: 1, createdAt: -1 });
comparisonSchema.index({ shareToken: 1 });
comparisonSchema.index({ expiresAt: 1 });

// Auto-delete expired comparisons (TTL)
comparisonSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Comparison', comparisonSchema);
