'use strict';

const mongoose = require('mongoose');

/**
 * ReportPurchase — tracks per-assessment PDF report unlock purchases.
 *
 * One record is created each time a user pays to unlock a specific report
 * (Atlas Starter: one report per purchase) or purchases Atlas Navigator
 * (which grants blanket access to all current and future reports).
 *
 * For Atlas Starter purchases the `assessmentHash` field links this purchase
 * to a specific assessment attempt.  For Atlas Navigator purchases
 * `assessmentHash` is null — the purchase covers all assessments.
 */
const reportPurchaseSchema = new mongoose.Schema(
    {
        /** Authenticated user ID (ObjectId) or null for email-only flows. */
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
         * Hash of the specific assessment unlocked by this purchase.
         * Built as MD5 of `${overall}|${dominantType}|${scores}`.
         * null for Atlas Navigator purchases (blanket / unlimited access).
         */
        assessmentHash: {
            type: String,
            default: null,
            index: true,
        },

        /**
         * Tier purchased:
         *   'atlas-starter'   → unlocks ONE specific report (assessmentHash is set)
         *   'atlas-navigator' → unlocks ALL reports (assessmentHash is null)
         */
        tier: {
            type: String,
            enum: ['atlas-starter', 'atlas-navigator', 'atlas-premium'],
            required: true,
        },

        /** When the purchase was completed. */
        purchasedAt: {
            type: Date,
            default: Date.now,
        },

        /**
         * Expiry date — null means the purchase never expires.
         * All purchases in the new model are permanent (null).
         */
        expiresAt: {
            type: Date,
            default: null,
        },

        /** Amount paid in cents (e.g. 999 = $9.99). */
        amount: {
            type: Number,
            required: true,
        },

        /** Currency code (e.g. 'usd'). */
        currency: {
            type: String,
            default: 'usd',
        },

        /** Stripe Payment Intent ID for reconciliation. */
        stripePaymentId: {
            type: String,
            default: null,
        },

        /** Stripe Checkout Session ID (links back to the Purchase record). */
        stripeSessionId: {
            type: String,
            default: null,
            index: true,
        },
    },
    { timestamps: true }
);

reportPurchaseSchema.index({ email: 1, createdAt: -1 });
reportPurchaseSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ReportPurchase', reportPurchaseSchema);
