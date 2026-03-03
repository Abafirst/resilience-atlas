const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const logger = require('./utils/logger');

dotenv.config();

const app = express();

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

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => logger.info('✅ MongoDB connected'))
.catch(err => logger.error('❌ MongoDB connection failed:', err));

// Static files
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Stripe webhook (raw body required before JSON parser for this route)
app.post('/webhook', express.raw({ type: 'application/json' }), require('./routes/stripe').webhook);

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/stripe', require('./routes/stripe').router);
app.use('/api/affiliates', require('./routes/affiliates'));

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Resilience Atlas server is running' });
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
    logger.info(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
