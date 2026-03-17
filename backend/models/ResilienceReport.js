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

        // ── PDF Cache Fields ──────────────────────────────────────────────────
        /** Base64-encoded PDF binary for direct cache retrieval. */
        pdfBuffer: {
            type: String,
            default: null,
        },
        /** When the PDF was generated / cached. */
        pdfGeneratedAt: {
            type: Date,
            default: null,
        },
        /**
         * Template version number. Bump this when the PDF template changes to
         * automatically invalidate all previously cached PDFs.
         */
        pdfVersion: {
            type: Number,
            default: 1,
        },
        /**
         * Absolute expiry timestamp for the cached PDF.
         * The cleanup job removes documents whose cacheExpiry has passed.
         */
        cacheExpiry: {
            type: Date,
            default: null,
            index: true,
        },
        /** True when a valid cached PDF is stored in pdfBuffer. */
        cached: {
            type: Boolean,
            default: false,
            index: true,
        },
        /** How long Puppeteer took to generate this PDF, in milliseconds. */
        generationTime: {
            type: Number,
            default: null,
        },
    },
    { timestamps: true }
);

// Compound index: one cached report per user per unique result set.
resilienceReportSchema.index({ userId: 1, resultsHash: 1 }, { unique: true });

// Index for fast cache-hit lookups.
resilienceReportSchema.index({ resultsHash: 1, cached: 1, cacheExpiry: 1 });

module.exports = mongoose.model('ResilienceReport', resilienceReportSchema);
