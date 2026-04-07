const cors = require('cors');
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
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/payments', require('./routes/payments'));

// ── Quiz submission: compute 6-type resilience scores ─────────────────────────
// Maps 72 quiz answers (indices 0-71) to the 6 resilience types.
// 12 questions per type, max raw score 60 per type (5 per question).
const QUIZ_TYPE_MAP = {
    'Agentic-Generative':   [ 0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11], // Q1–Q12
    'Relational-Connective':[12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], // Q13–Q24
    'Spiritual-Reflective': [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35], // Q25–Q36
    'Emotional-Adaptive':   [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47], // Q37–Q48
    'Somatic-Regulative':   [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59], // Q49–Q60
    'Cognitive-Narrative':  [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71], // Q61–Q72
};
const MAX_ANSWER = 5;

// POST /api/quiz — score 72 answers and return 6-type resilience results
app.post('/api/quiz', (req, res) => {
    try {
        const { answers } = req.body || {};
        if (!Array.isArray(answers) || answers.length !== 72) {
            return res.status(400).json({ error: 'Please provide all 72 answers.' });
        }

        const scores = {};
        let totalRaw = 0;
        let totalMax = 0;

        for (const [type, indices] of Object.entries(QUIZ_TYPE_MAP)) {
            const raw = indices.reduce((sum, idx) => sum + (Number(answers[idx]) || 0), 0);
            const max = indices.length * MAX_ANSWER;
            const percentage = Math.round((raw / max) * 10000) / 100;
            scores[type] = { raw, max, percentage };
            totalRaw += raw;
            totalMax += max;
        }

        const overall = Math.round((totalRaw / totalMax) * 100);
        const dominantType = Object.entries(scores).reduce(
            (best, [type, data]) => (data.percentage > best[1] ? [type, data.percentage] : best),
            ['', -1]
        )[0];

        return res.status(200).json({ overall, dominantType, scores });
    } catch (err) {
        console.error('Quiz scoring error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

// ── Auth routes — SPA-friendly redirects ────────────────────────────────────
// /login and /register redirect into the React SPA at /results-history rather
// than generating a server-side Auth0 authorize URL.  The old approach produced
// redirect_uri=http://localhost:3000/callback in production, causing Auth0
// "Callback URL mismatch" errors.  The SPA's loginWithRedirect() always uses
// window.location.origin as the callback URL, which is always correct.
//
// An optional same-origin ?returnTo= param is honoured.
const sanitiseReturnTo = require('./backend/utils/sanitiseReturnTo');

app.get('/login', (req, res) => {
    const returnTo = sanitiseReturnTo(req.query.returnTo);
    res.redirect(302, returnTo || '/results-history');
});

app.get('/register', (req, res) => {
    res.redirect(302, '/results-history');
});

// Serve React frontend from client/dist when the build is present
const clientDist = path.join(__dirname, 'client', 'dist');

// Permanently redirect legacy results URLs to the canonical SPA route.
app.get(['/results.html', '/legacy-results.html'], (req, res) => {
    res.redirect(301, '/results');
});

// Redirect legacy /team (singular) to /teams (plural) — the canonical Teams landing page.
app.get('/team', (req, res) => {
    res.redirect(301, '/teams');
});

// Results page: always served by the React SPA (must be before public static middleware
// so the legacy public/legacy-results.html is never accidentally returned).
app.get('/results', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
});

// /kids SPA route — must be before the public/ static middleware so the legacy
// public/kids.html is never accidentally returned instead of the React component.
app.get('/kids', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
});

// Serve browser test UI at /index.html (and any other static assets in public/)
app.use(express.static(path.join(__dirname, 'public')));

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
