'use strict';

const { createLogger, format, transports } = require('winston');

const isDev = (process.env.NODE_ENV || 'development') === 'development';

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
            silent: process.env.NODE_ENV === 'test',
            format: isDev
                ? format.combine(
                    format.colorize(),
                    format.printf(({ timestamp, level, message, ...meta }) => {
                        const extra = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
                        return `[${timestamp}] ${level}: ${message}${extra}`;
                    })
                )
                : format.json(),
        }),
    ],
});

/**
 * Create a child logger pre-populated with a requestId so every log line
 * emitted during a request is traceable.
 *
 * @param  {string} requestId - The unique request identifier (e.g. from req.id).
 * @returns {winston.Logger}
 */
logger.withRequestId = function withRequestId(requestId) {
    return logger.child({ requestId });
};

module.exports = logger;
