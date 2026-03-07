const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');

dotenv.config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;
const isTestEnv = Boolean(process.env.JEST_WORKER_ID);
app.locals.ready = isTestEnv;

// Apply a broad rate limit to all requests to mitigate DoS
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
app.use(limiter);

// Middleware
// Apply JSON parsing to all routes except /webhook, which needs express.raw() to verify Stripe signatures
app.use((req, res, next) => {
    if (req.path === '/webhook') return next();
    express.json()(req, res, next);
});
app.use(express.urlencoded({ extended: true }));

// MongoDB connection — only attempt when MONGODB_URI is configured
let db;
let dbStatus = 'disconnected';
if (process.env.MONGODB_URI) {
    const mongoClient = new MongoClient(process.env.MONGODB_URI);
    mongoClient.connect().then(() => {
        db = mongoClient.db('resilience-atlas');
        dbStatus = 'connected';
        console.log('✅ MongoDB connected');
    }).catch(err => {
        dbStatus = 'disconnected';
        console.error('❌ MongoDB connection failed:', err);
    });
} else {
    console.warn('⚠️  MONGODB_URI not set — database features will be unavailable');
}

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
    if (!app.locals.ready) {
        return res.status(503).json({ status: 'starting', message: 'Server is starting up' });
    }
    res.status(200).json({
        status: 'OK',
        message: 'Resilience Atlas server is running',
        db: dbStatus
    });
});

// Client config endpoint — exposes safe public values to the frontend
app.get('/config', (req, res) => {
    res.json({ stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '' });
});

// Basic route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to Resilience Atlas API' });
});

// Mount route modules
app.use('/auth', require('./routes/auth'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/payments', require('./routes/payments'));

// Serve browser test UI at /index.html (and any other static assets in public/)
app.use(express.static(path.join(__dirname, 'public')));

// Serve React frontend from client/dist when the build is present
const clientDist = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientDist));
// Catch-all: serve React app for /app and all client-side sub-routes.
// This route is intentionally registered last so all API routes above take precedence.
app.get('/app*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
});

// CREATE PAYMENT INTENT ENDPOINT
app.post('/create-payment', verifyToken, async (req, res) => {
    if (!db) return res.status(503).json({ error: 'Database unavailable' });
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
    if (!db) return res.status(503).json({ error: 'Database unavailable' });
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
    if (!db) return res.status(503).json({ error: 'Database unavailable' });
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

// Start server only when run directly (not when required by tests)
if (require.main === module) {
    const server = app.listen(PORT, '0.0.0.0', () => {
        app.locals.ready = true;
        console.log(`🚀 Server running on port ${PORT}`);
    });
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`❌ Port ${PORT} is already in use. Set a different PORT environment variable or stop the process using that port.`);
            process.exit(1);
        } else {
            throw err;
        }
    });
}

module.exports = app;
