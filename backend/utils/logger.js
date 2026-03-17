'use strict';

const { createLogger, format, transports } = require('winston');

const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
    ),
    transports: [
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.printf(({ timestamp, level, message, ...meta }) => {
                    const extra = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
                    return `[${timestamp}] ${level}: ${message}${extra}`;
                })
            ),
        }),
    ],
    // Exceptions and rejections are caught and logged before the process exits.
    exceptionHandlers: [
        new transports.Console({ silent: Boolean(process.env.JEST_WORKER_ID) }),
    ],
    rejectionHandlers: [
        new transports.Console({ silent: Boolean(process.env.JEST_WORKER_ID) }),
    ],
});

/**
 * Convenience method: log an error with structured context fields.
 * Serialises the Error object so that the stack trace and code are captured.
 *
 * @example
 * logger.logError('PDF generation failed', err, {
 *   userId: 'abc123',
 *   resultsHash: 'sha256:...',
 *   context: { overall: 72, dominantType: 'Cognitive-Narrative' },
 * });
 *
 * @param {string} message  - Human-readable description of the failure.
 * @param {Error}  err      - The caught Error object.
 * @param {object} [ctx]    - Additional key/value pairs to include.
 */
logger.logError = function logError(message, err, ctx = {}) {
    const errorMeta = err instanceof Error
        ? { errorMessage: err.message, errorCode: err.code, stack: err.stack }
        : { error: err };
    this.error(message, { ...errorMeta, ...ctx });
};

module.exports = logger;
