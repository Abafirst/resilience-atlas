'use strict';

const { ValidationError } = require('../utils/customErrors');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Strip HTML tags and trim whitespace to prevent stored XSS.
 *
 * @param {string} str
 * @returns {string}
 */
function sanitiseString(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/<[^>]*>/g, '') // remove HTML tags
        .replace(/&(?:amp|lt|gt|quot|#x27|#x2F);/g, (entity) => {
            const map = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': "'", '&#x2F;': '/' };
            return map[entity] || entity;
        })
        .trim();
}

/** Basic RFC 5322 email format check. */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
}

// ── Validation factories ─────────────────────────────────────────────────────

/**
 * Middleware: validate a quiz submission body.
 *
 * Expected shape:
 *   { answers: number[72], email: string, firstName?: string, tier?: string }
 */
const VALID_TIERS = new Set([
    'free', 'deep-report', 'atlas-premium', 'business', 'starter', 'pro', 'enterprise',
]);

function validateQuizSubmission(req, _res, next) {
    const { answers, email, tier } = req.body || {};

    if (!answers || !Array.isArray(answers) || answers.length !== 72) {
        return next(new ValidationError('Please provide all 72 answers.', {
            field: 'answers',
            suggestion: 'Ensure you have answered every question before submitting.',
        }));
    }

    for (let i = 0; i < answers.length; i++) {
        const val = Number(answers[i]);
        if (!Number.isInteger(val) || val < 1 || val > 5) {
            return next(new ValidationError(
                `Answer at position ${i + 1} is invalid. Expected a value between 1 and 5.`,
                { field: 'answers', index: i }
            ));
        }
    }

    if (!email) {
        return next(new ValidationError('Email is required.', { field: 'email' }));
    }

    if (!isValidEmail(email)) {
        return next(new ValidationError('Please provide a valid email address.', { field: 'email' }));
    }

    if (tier !== undefined && !VALID_TIERS.has(tier)) {
        return next(new ValidationError(`Invalid tier: "${sanitiseString(String(tier))}".`, { field: 'tier' }));
    }

    // Sanitise mutable string fields in-place.
    if (req.body.firstName) req.body.firstName = sanitiseString(req.body.firstName);
    if (req.body.email)     req.body.email     = sanitiseString(req.body.email);

    next();
}

/**
 * Middleware: validate a PDF download request query string.
 *
 * Expected query params: overall (number 0-100), scores (JSON string), email?
 */
function validateReportDownload(req, _res, next) {
    const { overall, scores, email } = req.query || {};

    if (overall === undefined || overall === null || overall === '') {
        return next(new ValidationError('Missing required parameter: overall.', { field: 'overall' }));
    }

    const overallNum = Number(overall);
    if (Number.isNaN(overallNum) || overallNum < 0 || overallNum > 100) {
        return next(new ValidationError('overall must be a number between 0 and 100.', { field: 'overall' }));
    }

    if (!scores) {
        return next(new ValidationError('Missing required parameter: scores.', { field: 'scores' }));
    }

    try {
        const parsed = JSON.parse(scores);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            throw new Error('scores must be a JSON object');
        }
    } catch {
        return next(new ValidationError('scores must be valid JSON.', { field: 'scores' }));
    }

    if (email !== undefined && email !== '' && !isValidEmail(email)) {
        return next(new ValidationError('Please provide a valid email address.', { field: 'email' }));
    }

    next();
}

/**
 * Middleware: validate a payment checkout / intent body.
 *
 * Expected shape:
 *   { email: string, tier: string, metadata?: object }
 */
const PURCHASABLE_TIERS = new Set(['deep-report', 'atlas-premium', 'business', 'starter', 'pro', 'enterprise']);

function validatePayment(req, _res, next) {
    const { email, tier, metadata } = req.body || {};

    if (!email) {
        return next(new ValidationError('Email is required for payment.', { field: 'email' }));
    }

    if (!isValidEmail(email)) {
        return next(new ValidationError('Please provide a valid email address.', { field: 'email' }));
    }

    if (tier !== undefined && !PURCHASABLE_TIERS.has(tier)) {
        return next(new ValidationError(`Invalid tier: "${sanitiseString(String(tier))}".`, { field: 'tier' }));
    }

    if (metadata !== undefined && (typeof metadata !== 'object' || Array.isArray(metadata))) {
        return next(new ValidationError('metadata must be a JSON object.', { field: 'metadata' }));
    }

    // Sanitise email.
    if (req.body.email) req.body.email = sanitiseString(req.body.email);

    next();
}

/**
 * Generic middleware factory: validate that a required JSON body is present.
 * Useful for endpoints that do their own validation but still want a common
 * "missing body" guard.
 */
function requireBody(req, _res, next) {
    if (!req.body || typeof req.body !== 'object') {
        return next(new ValidationError('Request body is required.'));
    }
    next();
}

module.exports = {
    sanitiseString,
    isValidEmail,
    validateQuizSubmission,
    validateReportDownload,
    validatePayment,
    requireBody,
};
