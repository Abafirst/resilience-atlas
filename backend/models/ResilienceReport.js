'use strict';

const mongoose = require('mongoose');

/**
 * ResilienceReport — cached generated report for a quiz submission.
 * Keyed by resultsHash so the same answers are never processed twice.
 */
const resilienceReportSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        resultsHash: {
            type: String,
            required: true,
            index: true,
        },
        reportText: {
            type: String,
            default: null,
        },
        pdfUrl: {
            type: String,
            default: null,
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'ready', 'failed'],
            default: 'pending',
        },
        errorMessage: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

// Compound index: one cached report per user per unique result set.
resilienceReportSchema.index({ userId: 1, resultsHash: 1 }, { unique: true });

module.exports = mongoose.model('ResilienceReport', resilienceReportSchema);
