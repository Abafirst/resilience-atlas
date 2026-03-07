const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authenticateJWT } = require('../middleware/auth');
const User = require('../models/User');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/stripe/create-payment-intent
 * Create a Stripe PaymentIntent for the authenticated user
 */
router.post('/create-payment-intent', authenticateJWT, async (req, res) => {
    try {
        const { amount, currency = 'usd' } = req.body;

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ error: 'A valid positive amount is required.' });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Create or reuse a Stripe customer for this user
        if (!user.stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { userId: String(user._id) }
            });
            user.stripeCustomerId = customer.id;
            await user.save();
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            customer: user.stripeCustomerId,
            metadata: { userId: String(user._id) }
        });

        res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        logger.error('Create payment intent error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * GET /api/stripe/payment-status/:paymentIntentId
 * Retrieve the status of a PaymentIntent for the authenticated user
 */
router.get('/payment-status/:paymentIntentId', authenticateJWT, async (req, res) => {
    try {
        const { paymentIntentId } = req.params;
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        // Ensure the payment intent belongs to this user's Stripe customer
        if (user.stripeCustomerId && paymentIntent.customer !== user.stripeCustomerId) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        res.status(200).json({ id: paymentIntent.id, status: paymentIntent.status });
    } catch (err) {
        if (err.type === 'StripeInvalidRequestError' && err.code === 'resource_missing') {
            return res.status(404).json({ error: 'Payment intent not found.' });
        }
        logger.error('Payment status error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * Stripe webhook handler.
 * Must be mounted with express.raw() body parser (raw body required for
 * signature verification), before any JSON body-parsing middleware.
 */
const webhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        logger.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object;
            logger.info(`PaymentIntent succeeded: ${paymentIntent.id}`);
            break;
        }
        case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object;
            logger.warn(`PaymentIntent failed: ${paymentIntent.id}`);
            break;
        }
        default:
            logger.info(`Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ received: true });
};

router.webhook = webhook;
module.exports = router;
