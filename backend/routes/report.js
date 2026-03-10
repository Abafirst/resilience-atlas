'use strict';

const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const ResilienceReport = require('../models/ResilienceReport');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/report/status?hash=<resultsHash>
 * Poll whether the report for a given resultsHash is ready.
 * Returns status: "pending" | "processing" | "ready" | "failed"
 */
router.get('/status', authenticateJWT, async (req, res) => {
    try {
        const { hash } = req.query;
        if (!hash) {
            return res.status(400).json({ error: 'hash query parameter is required.' });
        }

        const report = await ResilienceReport.findOne({
            userId: req.user.userId,
            resultsHash: hash,
        });

        if (!report) {
            return res.status(404).json({ status: 'not_found' });
        }

        return res.status(200).json({ status: report.status });
    } catch (err) {
        logger.error('Report status check error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * GET /api/report/:hash
 * Retrieve the full generated report (text + PDF URL) once status is "ready".
 */
router.get('/:hash', authenticateJWT, async (req, res) => {
    try {
        const { hash } = req.params;

        const report = await ResilienceReport.findOne({
            userId: req.user.userId,
            resultsHash: hash,
        });

        if (!report) {
            return res.status(404).json({ error: 'Report not found.' });
        }

        if (report.status !== 'ready') {
            return res.status(202).json({
                status: report.status,
                message: 'Report is not ready yet. Please try again shortly.',
            });
        }

        return res.status(200).json({
            status: 'ready',
            reportText: report.reportText,
            pdfUrl: report.pdfUrl,
            createdAt: report.createdAt,
        });
    } catch (err) {
        logger.error('Report retrieval error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
