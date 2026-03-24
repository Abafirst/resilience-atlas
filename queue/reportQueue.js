'use strict';

/**
 * reportQueue.js — BullMQ queue for asynchronous report generation.
 *
 * The queue is only initialized when a REDIS_URL is configured.
 * This allows the web server to start (and tests to run) without Redis.
 */

const { Queue } = require('bullmq');

const QUEUE_NAME = 'reportGeneration';

let reportQueue = null;

/**
 * Return the singleton Queue instance, creating it on first call.
 * Returns null if REDIS_URL is not set so callers can degrade gracefully.
 */
function getReportQueue() {
    if (reportQueue) return reportQueue;

    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        return null;
    }

    try {
        reportQueue = new Queue(QUEUE_NAME, {
            connection: { url: redisUrl },
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
                removeOnComplete: 100,
                removeOnFail: 200,
            },
        });
    } catch (err) {
        console.error('Failed to initialise report queue:', err.message);
        reportQueue = null;
    }

    return reportQueue;
}

/**
 * Add a "generateReport" job to the queue.
 *
 * @param {Object} payload
 * @param {string} payload.userId
 * @param {Object} payload.scores     - Output of calculateResilienceScores()
 * @param {string} payload.username
 * @param {string} payload.email      - User email for optional delivery
 * @param {string} payload.resultsHash
 * @returns {Promise<import('bullmq').Job|null>} The queued job, or null if queue unavailable
 */
async function addReportJob(payload) {
    const queue = getReportQueue();
    if (!queue) {
        return null;
    }
    return queue.add('generateReport', payload);
}

module.exports = { getReportQueue, addReportJob, QUEUE_NAME };
