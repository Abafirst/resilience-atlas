'use strict';

/**
 * Sentry error-tracking integration.
 *
 * In production, set the SENTRY_DSN environment variable to your project DSN
 * to enable real error reporting. Without a DSN the module exports a no-op
 * stub so the rest of the codebase can import and call Sentry methods
 * unconditionally without any runtime errors.
 *
 * Install the Sentry SDK when you are ready to enable real tracking:
 *   npm install @sentry/node @sentry/tracing
 */

let Sentry = null;

/* istanbul ignore next */
if (process.env.SENTRY_DSN && !process.env.JEST_WORKER_ID) {
    try {
        Sentry = require('@sentry/node');
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || 'development',
            // Capture 100 % of transactions in production; tune as needed.
            tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 1.0,
            // Capture session replays (requires @sentry/replay) when configured.
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,
        });
        console.log('✅ Sentry initialised');
    } catch (err) {
        console.warn('⚠️  Sentry SDK not installed — error tracking disabled:', err.message);
        Sentry = null;
    }
}

// ── No-op stub ───────────────────────────────────────────────────────────────
// Provides the same surface area used by the rest of the application so that
// callers never need to guard against Sentry being undefined.

const noop = () => {};

const stub = {
    captureException: noop,
    captureMessage:   noop,
    addBreadcrumb:    noop,
    setUser:          noop,
    setTag:           noop,
    setContext:       noop,
    withScope:        (cb) => cb({ captureException: noop, setTag: noop, setLevel: noop, setContext: noop }),
    Handlers: {
        requestHandler:  () => (_req, _res, next) => next(),
        errorHandler:    () => (_err, _req, _res, next) => next(_err),
        tracingHandler:  () => (_req, _res, next) => next(),
    },
};

// Export either the real Sentry instance or the stub.
const instance = Sentry || stub;

module.exports = instance;
