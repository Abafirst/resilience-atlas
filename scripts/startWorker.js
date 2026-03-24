#!/usr/bin/env node
'use strict';

/**
 * scripts/startWorker.js
 *
 * Entry point for the background report-generation worker process.
 *
 * Usage:
 *   node scripts/startWorker.js
 *   npm run start:worker
 *
 * Environment variables required:
 *   REDIS_URL    — e.g. redis://localhost:6379
 *   MONGODB_URI  — e.g. mongodb://localhost:27017/resilience-atlas
 */

const { startWorker } = require('../workers/reportWorker');

startWorker();
