'use strict';

/**
 * Base application error class.
 * All custom errors extend this class so the global error handler can
 * distinguish between expected operational errors and unexpected programming
 * bugs.
 */
class AppError extends Error {
    /**
     * @param {string}  message      - Developer-facing message (logged, not always sent to client).
     * @param {number}  statusCode   - HTTP status code.
     * @param {string}  code         - Machine-readable error code (e.g. 'VALIDATION_ERROR').
     * @param {string}  [userMessage]  - Human-friendly sentence shown to the end user.
     * @param {string}  [supportLink]  - URL to help documentation for this error.
     */
    constructor(message, statusCode, code, userMessage, supportLink) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.userMessage = userMessage || message;
        this.supportLink = supportLink || null;
        this.isOperational = true; // expected, handled errors
        Error.captureStackTrace(this, this.constructor);
    }
}

// ── 400 ─────────────────────────────────────────────────────────────────────

class ValidationError extends AppError {
    constructor(
        message = 'Invalid request data.',
        userMessage = 'Please check your input and try again.',
        supportLink = null,
    ) {
        super(message, 400, 'VALIDATION_ERROR', userMessage, supportLink);
    }
}

// ── 401 ─────────────────────────────────────────────────────────────────────

class AuthenticationError extends AppError {
    constructor(
        message = 'Authentication required.',
        userMessage = 'You need to sign in to access this resource.',
        supportLink = null,
    ) {
        super(message, 401, 'AUTHENTICATION_ERROR', userMessage, supportLink);
    }
}

// ── 402 ─────────────────────────────────────────────────────────────────────

class PaymentGatedError extends AppError {
    constructor(
        message = 'A paid plan is required.',
        userMessage = 'This feature requires an active subscription. Please upgrade to continue.',
        supportLink = 'https://support.resilienceatlas.io/upgrade',
    ) {
        super(message, 402, 'PAYMENT_REQUIRED', userMessage, supportLink);
        this.upgradeRequired = true;
    }
}

// ── 403 ─────────────────────────────────────────────────────────────────────

class AuthorizationError extends AppError {
    constructor(
        message = 'Access denied.',
        userMessage = 'You do not have permission to perform this action.',
        supportLink = null,
    ) {
        super(message, 403, 'AUTHORIZATION_ERROR', userMessage, supportLink);
    }
}

// ── 404 ─────────────────────────────────────────────────────────────────────

class NotFoundError extends AppError {
    constructor(
        message = 'Resource not found.',
        userMessage = 'The item you were looking for could not be found.',
        supportLink = null,
    ) {
        super(message, 404, 'NOT_FOUND', userMessage, supportLink);
    }
}

// ── 409 ─────────────────────────────────────────────────────────────────────

class ConflictError extends AppError {
    constructor(
        message = 'Conflict with existing data.',
        userMessage = 'This action conflicts with existing data. Please refresh and try again.',
        supportLink = null,
    ) {
        super(message, 409, 'CONFLICT', userMessage, supportLink);
    }
}

// ── 429 ─────────────────────────────────────────────────────────────────────

class RateLimitError extends AppError {
    constructor(
        message = 'Too many requests.',
        userMessage = 'You have made too many requests. Please wait a moment and try again.',
        supportLink = null,
    ) {
        super(message, 429, 'RATE_LIMIT_EXCEEDED', userMessage, supportLink);
    }
}

// ── 500 ─────────────────────────────────────────────────────────────────────

class InternalServerError extends AppError {
    constructor(
        message = 'An unexpected error occurred.',
        userMessage = 'Something went wrong on our end. Please try again in a few minutes.',
        supportLink = 'https://support.resilienceatlas.io/help',
    ) {
        super(message, 500, 'INTERNAL_SERVER_ERROR', userMessage, supportLink);
        this.isOperational = false;
    }
}

// ── 503 ─────────────────────────────────────────────────────────────────────

class ServiceUnavailableError extends AppError {
    constructor(
        message = 'Service temporarily unavailable.',
        userMessage = 'This service is temporarily unavailable. Please try again in a few minutes.',
        supportLink = 'https://support.resilienceatlas.io/help',
    ) {
        super(message, 503, 'SERVICE_UNAVAILABLE', userMessage, supportLink);
    }
}

module.exports = {
    AppError,
    ValidationError,
    AuthenticationError,
    PaymentGatedError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    InternalServerError,
    ServiceUnavailableError,
};
