'use strict';

const Stripe = require('stripe');

/**
 * Stripe singleton instance.
 * Initialised once with the secret key from environment variables.
 */
module.exports = new Stripe(process.env.STRIPE_SECRET_KEY || '');
