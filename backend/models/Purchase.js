'use strict';

const mongoose = require('mongoose');

/**
 * Purchase — records every completed (or pending) Stripe transaction.
 *
 * One record per checkout session.  The status field tracks the payment
 * lifecycle: pending → completed | failed.
 */
const purchaseSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },

        stripeSessionId: {
            type: String,
            required: true,
        },

        tier: {
            type: String,
            enum: ['atlas-starter', 'atlas-navigator', 'atlas-premium', 'starter', 'pro', 'enterprise'],
            required: true,
        },

        confirmationEmailSent: {
            type: Boolean,
            default: false,
        },

        amount: {
            type: Number,
            required: true,
        },

        currency: {
            type: String,
            default: 'usd',
        },

        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending',
        },

        purchasedAt: {
            type: Date,
        },

        /**
         * Assessment data captured at checkout time.
         * Stored so the PDF for this specific attempt can be regenerated later
         * without relying on the user's current localStorage state.
         */
        assessmentData: {
            overall:      { type: Number },
            dominantType: { type: String },
            scores:       { type: mongoose.Schema.Types.Mixed },
        },
    },
    { timestamps: true }
);

purchaseSchema.index({ email: 1 });
purchaseSchema.index({ stripeSessionId: 1 }, { unique: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
