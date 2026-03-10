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
            enum: ['deep-report', 'atlas-premium'],
            required: true,
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
    },
    { timestamps: true }
);

purchaseSchema.index({ email: 1 });
purchaseSchema.index({ stripeSessionId: 1 }, { unique: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
