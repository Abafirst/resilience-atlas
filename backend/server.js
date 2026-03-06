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

// ... all your middleware and routes ...

// ✅ STATIC FILES FIRST
app.use(express.static(path.join(__dirname, '../client/dist')));

// ✅ CATCH-ALL ROUTE SECOND (for React routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// ... error handler ...

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    serverReady = true;
    logger.info(`🚀 Server running on port ${PORT}`);
});

