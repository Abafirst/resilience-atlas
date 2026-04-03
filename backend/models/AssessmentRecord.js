'use strict';

const mongoose = require('mongoose');

/**
 * AssessmentRecord — tracks each assessment attempt and its PDF unlock status.
 *
 * Each time a user completes the assessment a record is created here.
 * The `pdfUnlocked` flag becomes true when the user purchases an Atlas Starter
 * or Atlas Navigator tier that covers this specific assessment.
 *
 * For Atlas Navigator users, ALL of their assessment records are considered
 * unlocked once they hold a valid Navigator purchase.
 * For Atlas Starter users, only the specific record whose `resultsHash`
 * matches the purchase's stored `assessmentData` hash is unlocked.
 */
const assessmentRecordSchema = new mongoose.Schema(
    {
        /** Authenticated user ID (ObjectId) or null for anonymous/email-only flows. */
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false,
            default: null,
        },

        /** User email — primary identifier in the assessment/payment flow. */
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },

        /**
         * Deterministic MD5 hash of `${overall}|${dominantType}|${scores}`.
         * Used to match this record against Purchase.assessmentData for re-downloads.
         */
        resultsHash: {
            type: String,
            required: true,
        },

        /** Overall resilience score (0–100). */
        overall: {
            type: Number,
            required: true,
        },

        /** Dominant resilience dimension. */
        dominantType: {
            type: String,
            required: true,
        },

        /** Full per-dimension score map. */
        scores: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },

        /** The tier the user held when they took this assessment (e.g. 'free'). */
        tier: {
            type: String,
            default: 'free',
        },

        /**
         * Whether this assessment's PDF has been unlocked via a purchase.
         * Atlas Navigator users have blanket unlock; Atlas Starter users need
         * a per-assessment purchase whose hash matches `resultsHash`.
         */
        pdfUnlocked: {
            type: Boolean,
            default: false,
            index: true,
        },

        /** When the PDF was unlocked (null if not yet unlocked). */
        unlockedAt: {
            type: Date,
            default: null,
        },

        /** Which tier was used to unlock this report ('atlas-starter' | 'atlas-navigator'). */
        unlockedTier: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

assessmentRecordSchema.index({ email: 1, createdAt: -1 });
assessmentRecordSchema.index({ userId: 1, createdAt: -1 });
assessmentRecordSchema.index({ resultsHash: 1 });

module.exports = mongoose.model('AssessmentRecord', assessmentRecordSchema);
