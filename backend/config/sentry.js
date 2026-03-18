'use strict';

/**
 * Optional Sentry integration.
 *
 * Sentry is used only when SENTRY_DSN is configured.  If the @sentry/node
 * package is not installed (e.g. in development without the optional dep) the
 * module degrades gracefully so the rest of the application still functions.
 */

const logger = require('../utils/logger');

let Sentry = null;
let sentryInitialised = false;

try {
    if (process.env.SENTRY_DSN) {
        // eslint-disable-next-line global-require
        Sentry = require('@sentry/node');
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || 'development',
            release: process.env.APP_VERSION || undefined,
            // Capture 10 % of transactions for performance monitoring.
            tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
            // Do not send events in the test environment.
            enabled: process.env.NODE_ENV !== 'test',
        });
        sentryInitialised = true;
        logger.info('✅ Sentry error tracking initialised');
    } else {
        logger.warn('⚠️  SENTRY_DSN not set — error tracking disabled');
    }
} catch (err) {
    // @sentry/node is an optional dependency; swallow the error.
    logger.warn('⚠️  Sentry package not available — error tracking disabled', { message: err.message });
}

/**
 * Capture an exception in Sentry (if configured) along with optional context.
 *
 * @param {Error}  error   - The error to report.
 * @param {object} [ctx]   - Extra context (userId, requestId, path, …).
 */
function captureException(error, ctx = {}) {
    if (!sentryInitialised || !Sentry) return;

    Sentry.withScope((scope) => {
        if (ctx.userId) scope.setUser({ id: String(ctx.userId) });
        if (ctx.requestId) scope.setTag('requestId', ctx.requestId);
        if (ctx.path) scope.setTag('path', ctx.path);
        if (ctx.method) scope.setTag('method', ctx.method);
        Object.entries(ctx).forEach(([key, value]) => scope.setExtra(key, value));
        Sentry.captureException(error);
    });
}

/**
 * Express request-handler middleware exported by Sentry (if available).
 * Attach BEFORE routes so Sentry can capture request context automatically.
 */
function requestHandler() {
    if (!sentryInitialised || !Sentry) return (_req, _res, next) => next();
    return Sentry.Handlers.requestHandler();
}

/**
 * Express error-handler middleware exported by Sentry (if available).
 * Attach AFTER all other error handlers.
 */
function errorHandler() {
    if (!sentryInitialised || !Sentry) return (err, _req, _res, next) => next(err);
    return Sentry.Handlers.errorHandler();
}

module.exports = { captureException, requestHandler, errorHandler, isSentryEnabled: () => sentryInitialised };
