const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
const isTestEnv = Boolean(process.env.JEST_WORKER_ID);
app.locals.ready = isTestEnv;
let dbStatus = 'disconnected';

if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI).then(() => {
        dbStatus = 'connected';
        console.log('✅ MongoDB connected');
    }).catch((err) => {
        dbStatus = 'disconnected';
        console.error('❌ MongoDB connection failed:', err);
    });
} else {
    console.warn('⚠️  MONGODB_URI not set — database features will be unavailable');
}

// Middleware
app.use(express.json());

// ✅ HEALTH CHECK ENDPOINT (for Railway healthcheck)
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

// ✅ API ROUTES FIRST (must come before static files!)
app.use('/auth', require('./routes/auth'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/affiliates', require('./routes/affiliates'));
const stripeRoutes = require('./routes/stripe');
const stripeRouter = stripeRoutes.router || stripeRoutes;
app.use('/api/stripe', stripeRouter);

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

// Error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
const startServer = () => {
    const server = app.listen(PORT, () => {
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
};

app.startServer = startServer;
module.exports = app;

if (require.main === module) {
    startServer();
}
