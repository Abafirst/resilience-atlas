'use strict';

const mongoose = require('mongoose');

/**
 * UpsellEvent — records every upsell impression and conversion.
 *
 * An "impression" is logged when an upsell prompt is shown to the user.
 * A "conversion" is logged when the user clicks through to checkout.
 * This powers the A/B testing dashboard and funnel analytics.
 */
const upsellEventSchema = new mongoose.Schema(
    {
        /** Anonymous or authenticated session identifier. */
        sessionId: {
            type: String,
            required: true,
            index: true,
        },

        /** Registered user ID — optional (not set for anonymous visitors). */
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },

        /** User email at time of event — optional. */
        email: {
            type: String,
            lowercase: true,
            trim: true,
        },

        /** Where in the funnel the upsell was triggered. */
        trigger: {
            type: String,
            enum: [
                'assessment_complete',   // After finishing the quiz
                'results_view',          // On the results page
                'pdf_download_attempt',  // Tried to download without premium
                'top_results_view',      // Scrolled to top-dimension section
                'comparison_attempt',    // Tried to use comparison feature
                'history_attempt',       // Tried to access history timeline
                'manual',                // User clicked "Upgrade" themselves
                'timer',                 // Time-based trigger
                'exit_intent',           // Cursor moved toward tab/close
            ],
            required: true,
        },

        /** Which upsell variant was shown (A/B testing). */
        variant: {
            type: String,
            enum: ['control', 'variant_a', 'variant_b', 'variant_c'],
            default: 'control',
        },

        /** Tier being promoted. */
        targetTier: {
            type: String,
            enum: ['atlas-navigator', 'atlas-premium'],
            required: true,
        },

        /** Type of event. */
        eventType: {
            type: String,
            enum: ['impression', 'dismiss', 'click', 'conversion'],
            required: true,
        },

        /** The user's current tier at the time of the event. */
        userTier: {
            type: String,
            default: 'free',
        },

        /** Whether a limited-time offer was shown. */
        offerShown: {
            type: Boolean,
            default: false,
        },

        /** Promotional code or campaign tag, if any. */
        campaign: {
            type: String,
            default: null,
        },

        /** Page URL at time of event. */
        pageUrl: {
            type: String,
        },

        /** User-agent string for device segmentation. */
        userAgent: {
            type: String,
        },
    },
    { timestamps: true }
);

upsellEventSchema.index({ eventType: 1, createdAt: -1 });
upsellEventSchema.index({ trigger: 1, variant: 1 });
upsellEventSchema.index({ targetTier: 1, eventType: 1 });

module.exports = mongoose.model('UpsellEvent', upsellEventSchema);
