const express = require('express');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');

dotenv.config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
let db;
const mongoClient = new MongoClient(process.env.MONGODB_URI);
mongoClient.connect().then(() => {
    db = mongoClient.db('resilience-atlas');
    console.log('✅ MongoDB connected');
}).catch(err => {
    console.error('❌ MongoDB connection failed:', err);
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    
jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' });
        req.userId = decoded.userId;
        next();
    });
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Basic route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to Resilience Atlas API' });
});

// CREATE PAYMENT INTENT ENDPOINT
app.post('/create-payment', verifyToken, async (req, res) => {
    try {
        const { amount, currency = 'usd', description, metadata } = req.body;

        // Validate input
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        // Create payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency,
            description: description || 'Resilience Atlas Payment',
            metadata: {
                userId: req.userId,
                ...metadata
            }
        });

        // Save payment record to MongoDB
        const paymentsCollection = db.collection('payments');
        await paymentsCollection.insertOne({
            userId: req.userId,
            stripePaymentIntentId: paymentIntent.id,
            amount: amount,
            currency: currency,
            status: paymentIntent.status,
            createdAt: new Date(),
            metadata: metadata
        });

        // Return client secret to frontend
        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: amount,
            currency: currency
        });
    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({ error: error.message });
    }
});

// WEBHOOK ENDPOINT - Handle Stripe events
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // Verify webhook signature
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        console.error('Webhook signature verification failed:', error);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    // Handle different event types
    try {
        const paymentsCollection = db.collection('payments');

        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntentSucceeded = event.data.object;
                await paymentsCollection.updateOne(
                    { stripePaymentIntentId: paymentIntentSucceeded.id },
                    {
                        $set: {
                            status: 'succeeded',
                            completedAt: new Date()
                        }
                    }
                );
                console.log('✅ Payment succeeded:', paymentIntentSucceeded.id);
                break;

            case 'payment_intent.payment_failed':
                const paymentIntentFailed = event.data.object;
                await paymentsCollection.updateOne(
                    { stripePaymentIntentId: paymentIntentFailed.id },
                    {
                        $set: {
                            status: 'failed',
                            failedAt: new Date(),
                            failureReason: paymentIntentFailed.last_payment_error?.message
                        }
                    }
                );
                console.log('❌ Payment failed:', paymentIntentFailed.id);
                break;

            case 'charge.refunded':
                const chargeRefunded = event.data.object;
                await paymentsCollection.updateOne(
                    { stripePaymentIntentId: chargeRefunded.payment_intent },
                    {
                        $set: {
                            status: 'refunded',
                            refundedAt: new Date(),
                            refundAmount: chargeRefunded.amount_refunded / 100
                        }
                    }
                );
                console.log('🔄 Refund processed:', chargeRefunded.id);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET PAYMENT STATUS ENDPOINT
app.get('/payment/:paymentIntentId', verifyToken, async (req, res) => {
    try {
        const { paymentIntentId } = req.params;

        // Get payment from MongoDB
        const paymentsCollection = db.collection('payments');
        const payment = await paymentsCollection.findOne({
            stripePaymentIntentId: paymentIntentId,
            userId: req.userId
        });

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        res.status(200).json(payment);
    } catch (error) {
        console.error('Error fetching payment:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;