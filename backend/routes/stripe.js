const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authenticateJWT } = require('../middleware/auth');
const User = require('../models/User');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/stripe/create-payment-intent
 * Create a Stripe PaymentIntent
 */
router.post('/create-payment-intent', authenticateJWT, async (req, res) => {
    try {
        const { amount, currency = 'usd', description, metadata } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid payment amount.' });
        }

        // Retrieve or create Stripe customer
        let user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.username,
                metadata: { userId: user._id.toString() }
            });
            customerId = customer.id;
            await User.findByIdAndUpdate(user._id, { stripeCustomerId: customerId });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency,
            customer: customerId,
            description: description || 'Resilience Atlas Payment',
            metadata: { userId: req.user.userId, ...metadata }
        });

        logger.info(`Payment intent created for user: ${req.user.username}, amount: ${amount} ${currency}`);

        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount,
            currency
        });
    } catch (err) {
        logger.error('Payment intent error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/stripe/payment/:paymentIntentId
 * Get the status of a PaymentIntent
 */
router.get('/payment/:paymentIntentId', authenticateJWT, async (req, res) => {
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(req.params.paymentIntentId);
        res.status(200).json({ paymentIntent });
    } catch (err) {
        logger.error('Payment retrieval error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /webhook (mounted at root in server.js)
 * Handle Stripe webhook events
 */
const webhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        logger.error('Stripe webhook signature verification failed:', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                logger.info(`✅ Payment succeeded: ${event.data.object.id}`);
                break;

            case 'payment_intent.payment_failed':
                logger.warn(`❌ Payment failed: ${event.data.object.id}`);
                break;

            case 'charge.refunded':
                logger.info(`🔄 Refund processed: ${event.data.object.id}`);
                break;

            default:
                logger.info(`Unhandled Stripe event: ${event.type}`);
        }

        res.status(200).json({ received: true });
    } catch (err) {
        logger.error('Webhook processing error:', err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { router, webhook };
