const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const logger = require('./utils/logger');
const { sanitizeMongoUri } = require('./utils/mongoUri');

dotenv.config();

const app = express();

// Startup state flags
let serverReady = false;
let dbConnected = false;

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection with graceful fallback
// sanitizeMongoUri ensures any special characters in the password are
// properly percent-encoded, preventing URI-parsing failures.
const mongoUri = sanitizeMongoUri(process.env.MONGODB_URI || process.env.DATABASE_URL);
mongoose.connect(mongoUri)
.then(() => {
    dbConnected = true;
    logger.info('✅ MongoDB connected');
})
.catch(err => {
    dbConnected = false;
    logger.error('❌ MongoDB connection failed, running in limited mode:', err.message);
});

// Static files
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Stripe webhook (raw body required before JSON parser for this route)
app.post('/webhook', express.raw({ type: 'application/json' }), require('./routes/stripe').webhook);

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/stripe', require('./routes/stripe').router);
app.use('/api/affiliates', require('./routes/affiliates'));

// Health check — returns 503 while starting up, 200 once the server is ready.
// The db field reflects the MongoDB connection state at the time of the request;
// it may be 'disconnected' if MongoDB is still connecting or permanently unavailable.
app.get('/health', (req, res) => {
    if (!serverReady) {
        return res.status(503).json({ status: 'starting', message: 'Server is starting up' });
    }
    res.status(200).json({
        status: 'OK',
        message: 'Resilience Atlas server is running',
        db: dbConnected ? 'connected' : 'disconnected'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to Resilience Atlas API', version: '1.0.0' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    serverReady = true;
    logger.info(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
// ... all your existing routes above ...

// Example routes
app.get('/api/users', (req, res) => {
  // your code
});

app.post('/api/auth/login', (req, res) => {
  // your code
});

// ADD THIS AT THE END - Serve React frontend for all other routes
const path = require('path');

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

