const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const logger = require('./utils/logger');

dotenv.config();

const app = express();
const isTestEnv = Boolean(process.env.JEST_WORKER_ID);
app.locals.ready = isTestEnv;
let dbStatus = 'disconnected';

if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI).then(() => {
        dbStatus = 'connected';
        logger.info('✅ MongoDB connected');
    }).catch((err) => {
        dbStatus = 'disconnected';
        logger.error('❌ MongoDB connection failed:', err);
    });
} else {
    logger.warn('⚠️  MONGODB_URI not set — database features will be unavailable');
}

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Response compression
app.use(compression());

// Request body parsing with input size limits
const REQUEST_SIZE_LIMIT = '10kb';
app.use(express.json({ limit: REQUEST_SIZE_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: REQUEST_SIZE_LIMIT }));

// Request logging (skip in test environment to keep test output clean)
if (!isTestEnv) {
    app.use((req, _res, next) => {
        logger.info(`${req.method} ${req.url}`);
        next();
    });
}

// ✅ HEALTH CHECK ENDPOINT (for Railway/Docker/Kubernetes healthcheck)
app.get('/health', (req, res) => {
    if (!app.locals.ready) {
        return res.status(503).json({ status: 'starting', message: 'Server is starting up' });
    }
    res.status(200).json({
        status: 'OK',
        message: 'Resilience Atlas server is running',
        env: process.env.NODE_ENV || 'development',
        db: dbStatus,
    });
});

// Client config endpoint — exposes safe public values to the frontend
app.get('/config', (req, res) => {
    res.json({ stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '' });
});

// ✅ API ROUTES FIRST (must come before static files!)
app.use('/auth', require('./routes/auth'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/affiliates', require('./routes/affiliates'));
app.use('/api/stripe', require('./routes/stripe'));

// ✅ Basic route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to Resilience Atlas API' });
});

// ✅ THEN static files
app.use(express.static(path.join(__dirname, '../client/dist')));

// ✅ CATCH-ALL ROUTE LAST (for React routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// 404 handler for unmatched API routes (before catch-all)
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
});

// Global error handler — environment-aware responses
app.use((err, req, res, _next) => {
    logger.error('Unhandled error:', err);
    const isDev = (process.env.NODE_ENV || 'development') === 'development';
    res.status(err.status || 500).json({
        error: isDev ? err.message : 'Internal server error',
        ...(isDev && err.stack ? { stack: err.stack } : {}),
    });
});

const PORT = process.env.PORT || 3000;
const startServer = () => {
    const server = app.listen(PORT, () => {
        app.locals.ready = true;
        const env = process.env.NODE_ENV || 'development';
        logger.info('─────────────────────────────────────────');
        logger.info(`🚀 Resilience Atlas API started`);
        logger.info(`   Environment : ${env}`);
        logger.info(`   Port        : ${PORT}`);
        logger.info(`   Database    : ${dbStatus}`);
        logger.info('─────────────────────────────────────────');
    });
    return server;
};

app.startServer = startServer;
module.exports = app;

if (require.main === module) {
    const server = startServer();
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            logger.error(`❌ Port ${PORT} is already in use. Set a different PORT environment variable or stop the process using that port.`);
            process.exit(1);
        } else {
            logger.error('❌ Failed to start server. Check configuration, permissions, and dependencies.', err);
            process.exit(1);
        }
    });
}
