'use strict';

/**
 * backend/routes/tiers.js — Public tier-information endpoint.
 *
 * GET /api/tiers
 *   Returns a display-safe copy of TIER_CONFIG for use by the UI and marketing
 *   pages.  No Stripe IDs, secret keys, or internal gate arrays are included.
 *
 * All plan features and limits are governed by backend/config/tiers.js.
 * Never hardcode plan logic — import and reference that single source.
 *
 * This config is display-only.
 * All Stripe price/payment logic remains in payments.js and env.
 */

const express   = require('express');
const rateLimit = require('express-rate-limit');
const { TIER_CONFIG } = require('../config/tiers');

const router = express.Router();

const tiersLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again in a moment.' },
});

/**
 * GET /api/tiers
 *
 * Returns the public, display-safe tier configuration.
 * UI components and marketing pages should query this endpoint rather than
 * hardcoding plan data so that frontend and backend stay in sync automatically.
 *
 * Response shape:
 * {
 *   tiers: {
 *     [planKey]: {
 *       name: string,
 *       price: number|null,     // cents; null = custom/contact-sales
 *       billing: string,
 *       maxUsers: number|null,  // null = Infinity (unlimited)
 *       maxTeams: number|null,  // null = Infinity (unlimited)
 *       features: string[],
 *       dataRetention: string
 *     },
 *     ...
 *   }
 * }
 */
router.get('/', tiersLimiter, (req, res) => {
    const tiers = {};

    for (const [key, tier] of Object.entries(TIER_CONFIG)) {
        // Expose display-safe fields only — no `gates` (internal), no Stripe IDs.
        tiers[key] = {
            name: tier.name,
            price: tier.price,           // cents; null for custom pricing
            billing: tier.billing,
            maxUsers:  tier.maxUsers  === Infinity ? null : tier.maxUsers,
            maxTeams:  tier.maxTeams  === Infinity ? null : tier.maxTeams,
            features: tier.features,
            dataRetention: tier.dataRetention,
        };
    }

    res.json({ tiers });
});

module.exports = router;
