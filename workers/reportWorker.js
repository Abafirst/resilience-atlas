'use strict';

/**
 * reportWorker.js — BullMQ worker that processes report generation jobs.
 *
 * Responsibilities:
 *  1. Check cache: if a report with the same resultsHash already exists, skip generation.
 *  2. Generate narrative text.
 *  3. Generate PDF.
 *  4. Store result in MongoDB (ResilienceReport).
 *  5. Optionally send email.
 *
 * Supports up to 3 retries (configured via Queue defaultJobOptions).
 * Failed jobs are logged and marked in MongoDB.
 */

const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { QUEUE_NAME } = require('../queue/reportQueue');
const ResilienceReport = require('../backend/models/ResilienceReport');
const reportService = require('../backend/services/reportService');
const { generateReport } = require('../backend/scoring');
const emailService = require('../backend/services/emailService');
const logger = require('../backend/utils/logger');

const REDIS_URL = process.env.REDIS_URL;
const MONGODB_URI = process.env.MONGODB_URI;

// ── MongoDB ───────────────────────────────────────────────────────────────────

async function connectDB() {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(MONGODB_URI);
        logger.info('✅ Worker: MongoDB connected');
    }
}

// ── Job processor ─────────────────────────────────────────────────────────────

/**
 * Process a single report generation job.
 * @param {import('bullmq').Job} job
 */
async function processJob(job) {
    const { userId, scores, username, email, resultsHash } = job.data;

    logger.info(`Processing report job ${job.id} for user ${userId}`);

    // 1. Check cache — reuse if the same result hash already has a ready report.
    const existing = await ResilienceReport.findOne({ resultsHash, status: 'ready' });
    if (existing) {
        logger.info(`Report cache hit for hash ${resultsHash.slice(0, 8)}… — reusing.`);
        return { cached: true, reportId: existing._id.toString() };
    }

    // 2. Create or update the report document to "processing".
    let reportDoc = await ResilienceReport.findOneAndUpdate(
        { userId, resultsHash },
        { $set: { status: 'processing', errorMessage: null } },
        { upsert: true, new: true }
    );

    try {
        // 3. Compute the structured report once and reuse it for narrative, PDF, and email.
        const report = generateReport(scores);

        // 4. Generate narrative text.
        const reportText = reportService.generateNarrativeReport(scores);

        // 5. Generate PDF.
        const pdfBuffer = await reportService.generatePDFReport(scores, username);
        const pdfUrl = reportService.savePDF(pdfBuffer, userId, resultsHash);

        // 6. Persist to MongoDB.
        reportDoc = await ResilienceReport.findOneAndUpdate(
            { _id: reportDoc._id },
            { $set: { reportText, pdfUrl, status: 'ready', errorMessage: null } },
            { new: true }
        );

        logger.info(`Report ${reportDoc._id} ready for user ${userId}`);

        // 7. Optional email delivery (reuses the already-computed report object).
        if (email) {
            try {
                await emailService.sendQuizReport(email, username, report);
                logger.info(`Email sent to ${email}`);
            } catch (emailErr) {
                logger.warn(`Email delivery failed (non-fatal): ${emailErr.message}`);
            }
        }

        return { cached: false, reportId: reportDoc._id.toString() };
    } catch (err) {
        // Mark the report as failed in MongoDB.
        await ResilienceReport.findOneAndUpdate(
            { _id: reportDoc._id },
            { $set: { status: 'failed', errorMessage: err.message } }
        );
        logger.error(`Report job ${job.id} failed: ${err.message}`);
        throw err; // Re-throw so BullMQ triggers a retry.
    }
}

// ── Worker startup ────────────────────────────────────────────────────────────

function startWorker() {
    if (!REDIS_URL) {
        logger.error('REDIS_URL is not set — worker cannot start.');
        process.exit(1);
    }
    if (!MONGODB_URI) {
        logger.error('MONGODB_URI is not set — worker cannot start.');
        process.exit(1);
    }

    connectDB().catch((err) => {
        logger.error(`MongoDB connection failed: ${err.message}`);
        process.exit(1);
    });

    const worker = new Worker(QUEUE_NAME, processJob, {
        connection: { url: REDIS_URL },
        concurrency: 5,
    });

    worker.on('completed', (job, result) => {
        logger.info(`Job ${job.id} completed — cached: ${result.cached}`);
    });

    worker.on('failed', (job, err) => {
        logger.error(`Job ${job ? job.id : '?'} failed after retries: ${err.message}`);
    });

    logger.info(`🔧 Report worker listening on queue "${QUEUE_NAME}"`);

    return worker;
}

module.exports = { processJob, startWorker };
