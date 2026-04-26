'use strict';

const https = require('https');
const Stripe = require('stripe');
const logger = require('../utils/logger');

const stripeKey = process.env.STRIPE_SECRET_KEY || '';

// Mirror the debug flag logic used in routes/payments.js so that both
// modules behave consistently: debug is active when explicitly opted-in
// or when running outside production (to aid local and staging diagnostics).
const debugStripe =
    process.env.DEBUG_STRIPE === 'true' ||
    process.env.NODE_ENV !== 'production';

let stripeInstance;

if (debugStripe) {
    // Log Stripe SDK version so we can correlate behavior across upgrades.
    let stripePkgVersion = 'unknown';
    try {
        stripePkgVersion = require('stripe/package.json').version;
    } catch (_) { /* ignore */ }

    logger.info('Stripe init (debug)', {
        stripeVersion: stripePkgVersion,
        keySet: stripeKey.length > 0,
        // First 7 chars only (e.g. "sk_live" / "sk_test") — no key material.
        keyPrefix: stripeKey.length > 0 ? stripeKey.slice(0, 7) : 'not-set',
    });

    // Use a fresh agent per request (keepAlive: false) in debug mode to rule
    // out connection-pool / keep-alive issues as the cause of StripeConnectionErrors.
    stripeInstance = new Stripe(stripeKey, {
        httpAgent: new https.Agent({ keepAlive: false }),
        maxNetworkRetries: 0, // disable SDK retries in debug so errors surface immediately
    });
} else {
    stripeInstance = new Stripe(stripeKey);
}

/**
 * Stripe singleton instance.
 * Initialized once with the secret key from environment variables.
 * In debug mode (DEBUG_STRIPE=true or non-production) uses an HTTPS agent
 * with keepAlive disabled to help diagnose connection-pooling issues.
 */
module.exports = stripeInstance;
