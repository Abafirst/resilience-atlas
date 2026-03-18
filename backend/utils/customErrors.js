'use strict';

/**
 * Base application error class.
 * All custom errors extend this class so they can be distinguished
 * from unexpected runtime errors in the global error handler.
 */
class AppError extends Error {
    /**
     * @param {string} message    - Human-readable error message.
     * @param {number} statusCode - HTTP status code to send in the response.
     * @param {string} code       - Machine-readable error code (e.g. 'VALIDATION_ERROR').
     * @param {object} [extra]    - Additional data to include in the response body.
     */
    constructor(message, statusCode, code, extra = {}) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.extra = extra;
        this.isOperational = true; // Marks errors that were intentionally thrown

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * 400 — Request body / query parameter failed schema validation.
 */
class ValidationError extends AppError {
    constructor(message = 'Invalid request data', extra = {}) {
        super(message, 400, 'VALIDATION_ERROR', extra);
    }
}

/**
 * 402 — Resource requires a paid plan / payment.
 */
class PaymentGatedError extends AppError {
    constructor(message = 'A purchase is required to access this resource', extra = {}) {
        super(message, 402, 'PAYMENT_REQUIRED', {
            upgradeRequired: true,
            supportEmail: 'support@resilienceatlas.io',
            ...extra,
        });
    }
}

/**
 * 404 — Requested resource does not exist.
 */
class NotFoundError extends AppError {
    constructor(message = 'Resource not found', extra = {}) {
        super(message, 404, 'NOT_FOUND', extra);
    }
}

/**
 * 401 — Request lacks valid authentication credentials.
 */
class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required', extra = {}) {
        super(message, 401, 'UNAUTHORIZED', extra);
    }
}

/**
 * 429 — Too many requests from this client.
 */
class RateLimitError extends AppError {
    /**
     * @param {number} [retryAfter] - Seconds until the client may retry.
     */
    constructor(message = 'Too many requests', retryAfter = 60, extra = {}) {
        super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter, ...extra });
        this.retryAfter = retryAfter;
    }
}

/**
 * 500 — Unexpected server-side error.
 */
class InternalServerError extends AppError {
    constructor(message = 'An unexpected error occurred', extra = {}) {
        super(message, 500, 'INTERNAL_SERVER_ERROR', {
            supportEmail: 'support@resilienceatlas.io',
            ...extra,
        });
    }
}

/**
 * 402 — Stripe / payment processor declined or returned an error.
 */
class PaymentError extends AppError {
    constructor(message = 'Payment failed', extra = {}) {
        super(message, 402, 'PAYMENT_FAILED', {
            supportEmail: 'support@resilienceatlas.io',
            ...extra,
        });
    }
}

/**
 * 504 — Upstream service (e.g. Puppeteer PDF rendering) timed out.
 */
class TimeoutError extends AppError {
    /**
     * @param {number} [retryAfter] - Seconds until the client may retry.
     */
    constructor(message = 'The operation timed out', retryAfter = 30, extra = {}) {
        super(message, 504, 'TIMEOUT', { retryAfter, ...extra });
        this.retryAfter = retryAfter;
    }
}

/**
 * 409 — Request conflicts with existing state (e.g. duplicate submission).
 */
class ConflictError extends AppError {
    constructor(message = 'Conflict with current state', extra = {}) {
        super(message, 409, 'CONFLICT', extra);
    }
}

/**
 * 403 — Authenticated user lacks permission for this resource.
 */
class ForbiddenError extends AppError {
    constructor(message = 'You do not have permission to perform this action', extra = {}) {
        super(message, 403, 'FORBIDDEN', extra);
    }
}

module.exports = {
    AppError,
    ValidationError,
    PaymentGatedError,
    NotFoundError,
    UnauthorizedError,
    RateLimitError,
    InternalServerError,
    PaymentError,
    TimeoutError,
    ConflictError,
    ForbiddenError,
};
