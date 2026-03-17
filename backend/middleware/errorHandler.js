'use strict';

const logger = require('../utils/logger');
const { AppError } = require('../utils/customErrors');
const sentry = require('../integrations/sentry');

/**
 * Categorise an error so it can be routed to the right logging / alerting
 * level.
 *
 * @param {Error}  err         - The thrown error.
 * @param {number} statusCode  - Resolved HTTP status code.
 * @returns {'critical'|'warning'|'info'}
 */
function categorise(err, statusCode) {
    if (statusCode >= 500) return 'critical';
    if (statusCode === 429) return 'warning';
    if (statusCode >= 400) return 'info';
    return 'info';
}

/**
 * Build a user-friendly response body from an error.
 *
 * Operational errors (instances of AppError) expose their message to the
 * client.  Unexpected errors return a generic message in production so that
 * internal details are never leaked.
 *
 * @param {Error}   err       - The thrown error.
 * @param {boolean} isDev     - True when NODE_ENV !== 'production'.
 * @returns {object}          - JSON-serialisable response body.
 */
function buildResponseBody(err, isDev) {
    const isOperational = err instanceof AppError;
    const statusCode    = err.statusCode || 500;

    if (isOperational) {
        return {
            error:        err.message,
            code:         err.code,
            ...(err.extra || {}),
        };
    }

    // Non-operational — hide internals in production.
    const body = {
        error:        isDev ? err.message : "We're sorry, something went wrong on our end.",
        code:         'INTERNAL_SERVER_ERROR',
        message:      'Please try again in a moment or contact support.',
        supportEmail: 'support@resilienceatlas.io',
    };

    if (isDev && err.stack) {
        body.stack = err.stack;
    }

    return body;
}

/**
 * Global Express error-handling middleware.
 *
 * Must be registered AFTER all routes and other middleware.
 * Signature must have exactly 4 parameters so Express recognises it as an
 * error handler.
 *
 * @param {Error}    err
 * @param {object}   req
 * @param {object}   res
 * @param {Function} next
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
    const isDev      = (process.env.NODE_ENV || 'development') !== 'production';
    const statusCode = err.statusCode || 500;
    const category   = categorise(err, statusCode);

    // ── Logging ──────────────────────────────────────────────────────────────
    const logContext = {
        method:     req.method,
        url:        req.originalUrl || req.url,
        statusCode,
        userId:     req.user ? (req.user.userId || req.user.id) : undefined,
        error:      err,
    };

    if (category === 'critical') {
        logger.error(`${err.name || 'Error'}: ${err.message}`, logContext);
    } else if (category === 'warning') {
        logger.warn(`${err.name || 'Error'}: ${err.message}`, logContext);
    } else {
        logger.info(`${err.name || 'Error'}: ${err.message}`, logContext);
    }

    // ── Sentry ───────────────────────────────────────────────────────────────
    if (statusCode >= 500) {
        sentry.withScope((scope) => {
            scope.setTag('category', category);
            if (req.user) {
                sentry.setUser({ id: req.user.userId || req.user.id, email: req.user.email });
            }
            scope.setContext('request', {
                method: req.method,
                url:    req.originalUrl || req.url,
                body:   req.body,
            });
            sentry.captureException(err);
        });
    }

    // ── Retry-After header for rate-limit errors ─────────────────────────────
    if (err.retryAfter) {
        res.set('Retry-After', String(err.retryAfter));
    }

    // ── Response ─────────────────────────────────────────────────────────────
    if (res.headersSent) {
        // Can't send another response — just close the connection.
        return next(err);
    }

    res.status(statusCode).json(buildResponseBody(err, isDev));
}

module.exports = { errorHandler, buildResponseBody, categorise };
