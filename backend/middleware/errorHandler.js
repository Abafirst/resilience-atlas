'use strict';

const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const { captureException } = require('../config/sentry');

/**
 * Normalize well-known non-AppError errors (e.g. Mongoose, JWT) into a shape
 * the error-response formatter understands.
 *
 * Returns an object with { statusCode, code, message, userMessage, supportLink }.
 */
function normalizeError(err) {
    // Already an operational AppError — use it as-is.
    if (err instanceof AppError) return err;

    const out = {
        statusCode: err.status || err.statusCode || 500,
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred.',
        userMessage: 'Something went wrong on our end. Please try again in a few minutes.',
        supportLink: 'https://support.resilienceatlas.io/help',
        isOperational: false,
    };

    // ── Mongoose validation error ──────────────────────────────────────────
    if (err.name === 'ValidationError' && err.errors) {
        out.statusCode = 400;
        out.code = 'VALIDATION_ERROR';
        out.message = Object.values(err.errors).map((e) => e.message).join('; ');
        out.userMessage = 'Please check your input and try again.';
        out.supportLink = null;
        out.isOperational = true;
        return out;
    }

    // ── Mongoose CastError (bad ObjectId) ─────────────────────────────────
    if (err.name === 'CastError') {
        out.statusCode = 400;
        out.code = 'VALIDATION_ERROR';
        out.message = `Invalid value for field "${err.path}".`;
        out.userMessage = 'One of the provided values is not in the expected format.';
        out.supportLink = null;
        out.isOperational = true;
        return out;
    }

    // ── Mongoose duplicate key error ───────────────────────────────────────
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        out.statusCode = 409;
        out.code = 'CONFLICT';
        out.message = `Duplicate value for "${field}".`;
        out.userMessage = `An account with that ${field} already exists.`;
        out.supportLink = null;
        out.isOperational = true;
        return out;
    }

    // ── JWT errors ─────────────────────────────────────────────────────────
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        out.statusCode = 401;
        out.code = 'AUTHENTICATION_ERROR';
        out.message = err.message;
        out.userMessage = 'Your session has expired. Please sign in again.';
        out.supportLink = null;
        out.isOperational = true;
        return out;
    }

    // ── Payload too large ──────────────────────────────────────────────────
    if (err.type === 'entity.too.large') {
        out.statusCode = 413;
        out.code = 'PAYLOAD_TOO_LARGE';
        out.message = 'Request payload exceeds the maximum allowed size.';
        out.userMessage = 'The data you submitted is too large. Please reduce its size and try again.';
        out.supportLink = null;
        out.isOperational = true;
        return out;
    }

    // ── SyntaxError (malformed JSON body) ─────────────────────────────────
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        out.statusCode = 400;
        out.code = 'INVALID_JSON';
        out.message = 'Malformed JSON in request body.';
        out.userMessage = 'The request body contains invalid JSON. Please check your input.';
        out.supportLink = null;
        out.isOperational = true;
        return out;
    }

    return out;
}

/**
 * Global Express error-handling middleware.
 *
 * Produces a consistent JSON response:
 * {
 *   "error":       "<short developer-facing summary>",
 *   "userMessage": "<human-friendly explanation>",
 *   "code":        "<MACHINE_READABLE_CODE>",
 *   "requestId":   "req_xxxxxxxx",
 *   "supportLink": "https://…" | null
 * }
 *
 * Stack traces and the raw error message are only included in development.
 */
// eslint-disable-next-line no-unused-vars
function globalErrorHandler(err, req, res, next) {
    const normalized = normalizeError(err);

    const requestId = req.id || null;
    const reqLogger = requestId ? logger.withRequestId(requestId) : logger;

    const logPayload = {
        statusCode: normalized.statusCode,
        code: normalized.code,
        path: req.originalUrl || req.path,
        method: req.method,
        ...(requestId ? { requestId } : {}),
        ...(req.user ? { userId: req.user.userId || req.user.id } : {}),
        ...(!normalized.isOperational ? { stack: err.stack } : {}),
    };

    if (!normalized.isOperational || normalized.statusCode >= 500) {
        reqLogger.error(normalized.message, logPayload);
    } else if (normalized.statusCode >= 400) {
        reqLogger.warn(normalized.message, logPayload);
    } else {
        reqLogger.info(normalized.message, logPayload);
    }

    // Report unexpected errors to Sentry.
    if (!normalized.isOperational || normalized.statusCode >= 500) {
        captureException(err, {
            requestId,
            path: req.originalUrl || req.path,
            method: req.method,
            userId: req.user ? (req.user.userId || req.user.id) : undefined,
        });
    }

    const isDev = (process.env.NODE_ENV || 'development') === 'development';

    const body = {
        error: isDev ? normalized.message : (normalized.userMessage || normalized.message),
        userMessage: normalized.userMessage,
        code: normalized.code,
        ...(requestId ? { requestId } : {}),
        ...(normalized.supportLink ? { supportLink: normalized.supportLink } : {}),
        ...(isDev && err.stack ? { stack: err.stack } : {}),
        // Pass upgradeRequired through for payment-gated errors.
        ...(normalized.upgradeRequired ? { upgradeRequired: true } : {}),
    };

    // Avoid sending a response if headers have already been sent.
    if (res.headersSent) return;
    res.status(normalized.statusCode).json(body);
}

module.exports = { globalErrorHandler, normalizeError };
