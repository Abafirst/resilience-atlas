'use strict';

/**
 * Tests for the custom error handling system:
 *   - backend/utils/errors.js
 *   - backend/middleware/errorHandler.js
 *   - backend/middleware/validation.js
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────
jest.mock('winston', () => {
    const logger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        child: jest.fn().mockReturnThis(),
        withRequestId: jest.fn().mockReturnThis(),
    };
    return {
        createLogger: jest.fn(() => logger),
        format: {
            combine: jest.fn((...args) => args),
            timestamp: jest.fn(() => ({})),
            errors: jest.fn(() => ({})),
            splat: jest.fn(() => ({})),
            json: jest.fn(() => ({})),
            colorize: jest.fn(() => ({})),
            printf: jest.fn(() => ({})),
        },
        transports: {
            Console: jest.fn(),
        },
    };
});

// Silence sentry warnings in tests
jest.mock('../backend/config/sentry', () => ({
    captureException: jest.fn(),
    requestHandler: jest.fn(() => (_req, _res, next) => next()),
    errorHandler: jest.fn(() => (err, _req, _res, next) => next(err)),
    isSentryEnabled: jest.fn(() => false),
}));

// ── Test utilities ────────────────────────────────────────────────────────────
const {
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
} = require('../backend/utils/errors');

const { globalErrorHandler, normalizeError } = require('../backend/middleware/errorHandler');
const {
    sanitise,
    escapeHtml,
    sanitiseInput,
    limitStringLengths,
    requireFields,
    requireQueryParams,
    validateBody,
    validateSchema,
} = require('../backend/middleware/validation');

// ── helpers ───────────────────────────────────────────────────────────────────
function mockRes() {
    const res = {
        headersSent: false,
        _status: null,
        _body: null,
        status(code) { this._status = code; return this; },
        json(body) { this._body = body; return this; },
    };
    return res;
}

function mockReq(overrides = {}) {
    return { id: 'req_test123', originalUrl: '/test', path: '/test', method: 'GET', user: null, ...overrides };
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Error Classes
// ─────────────────────────────────────────────────────────────────────────────

describe('Custom Error Classes', () => {
    test('AppError sets all properties correctly', () => {
        const err = new AppError('test message', 400, 'TEST_CODE', 'User message', 'http://link');
        expect(err.message).toBe('test message');
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe('TEST_CODE');
        expect(err.userMessage).toBe('User message');
        expect(err.supportLink).toBe('http://link');
        expect(err.isOperational).toBe(true);
        expect(err instanceof Error).toBe(true);
    });

    test('ValidationError has 400 status and correct code', () => {
        const err = new ValidationError();
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe('VALIDATION_ERROR');
        expect(err.isOperational).toBe(true);
    });

    test('AuthenticationError has 401 status', () => {
        const err = new AuthenticationError();
        expect(err.statusCode).toBe(401);
        expect(err.code).toBe('AUTHENTICATION_ERROR');
    });

    test('PaymentGatedError has 402 status and upgradeRequired flag', () => {
        const err = new PaymentGatedError();
        expect(err.statusCode).toBe(402);
        expect(err.code).toBe('PAYMENT_REQUIRED');
        expect(err.upgradeRequired).toBe(true);
    });

    test('AuthorizationError has 403 status', () => {
        const err = new AuthorizationError();
        expect(err.statusCode).toBe(403);
        expect(err.code).toBe('AUTHORIZATION_ERROR');
    });

    test('NotFoundError has 404 status', () => {
        const err = new NotFoundError();
        expect(err.statusCode).toBe(404);
        expect(err.code).toBe('NOT_FOUND');
    });

    test('ConflictError has 409 status', () => {
        const err = new ConflictError();
        expect(err.statusCode).toBe(409);
        expect(err.code).toBe('CONFLICT');
    });

    test('RateLimitError has 429 status', () => {
        const err = new RateLimitError();
        expect(err.statusCode).toBe(429);
        expect(err.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    test('InternalServerError has 500 status and isOperational=false', () => {
        const err = new InternalServerError();
        expect(err.statusCode).toBe(500);
        expect(err.isOperational).toBe(false);
    });

    test('ServiceUnavailableError has 503 status', () => {
        const err = new ServiceUnavailableError();
        expect(err.statusCode).toBe(503);
        expect(err.code).toBe('SERVICE_UNAVAILABLE');
    });

    test('Custom message overrides default', () => {
        const err = new ValidationError('Custom dev message', 'Custom user message');
        expect(err.message).toBe('Custom dev message');
        expect(err.userMessage).toBe('Custom user message');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// normalizeError
// ─────────────────────────────────────────────────────────────────────────────

describe('normalizeError', () => {
    test('passes through AppError as-is', () => {
        const err = new ValidationError('bad input');
        const result = normalizeError(err);
        expect(result).toBe(err);
    });

    test('normalizes Mongoose ValidationError', () => {
        const err = { name: 'ValidationError', errors: { email: { message: 'invalid email' } } };
        const result = normalizeError(err);
        expect(result.statusCode).toBe(400);
        expect(result.code).toBe('VALIDATION_ERROR');
        expect(result.isOperational).toBe(true);
    });

    test('normalizes Mongoose CastError', () => {
        const err = { name: 'CastError', path: 'userId', message: 'Cast failed' };
        const result = normalizeError(err);
        expect(result.statusCode).toBe(400);
        expect(result.code).toBe('VALIDATION_ERROR');
    });

    test('normalizes duplicate key error (code 11000)', () => {
        const err = { code: 11000, keyValue: { email: 'test@test.com' } };
        const result = normalizeError(err);
        expect(result.statusCode).toBe(409);
        expect(result.code).toBe('CONFLICT');
    });

    test('normalizes JWT errors', () => {
        const err = { name: 'JsonWebTokenError', message: 'invalid signature' };
        const result = normalizeError(err);
        expect(result.statusCode).toBe(401);
        expect(result.code).toBe('AUTHENTICATION_ERROR');
    });

    test('normalizes payload too large error', () => {
        const err = { type: 'entity.too.large', message: 'too large' };
        const result = normalizeError(err);
        expect(result.statusCode).toBe(413);
        expect(result.code).toBe('PAYLOAD_TOO_LARGE');
    });

    test('normalizes malformed JSON SyntaxError', () => {
        const err = Object.assign(new SyntaxError('Unexpected token'), { status: 400, body: true });
        const result = normalizeError(err);
        expect(result.statusCode).toBe(400);
        expect(result.code).toBe('INVALID_JSON');
    });

    test('returns 500 for unknown errors', () => {
        const err = new Error('something exploded');
        const result = normalizeError(err);
        expect(result.statusCode).toBe(500);
        expect(result.code).toBe('INTERNAL_SERVER_ERROR');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// globalErrorHandler
// ─────────────────────────────────────────────────────────────────────────────

describe('globalErrorHandler', () => {
    const OLD_ENV = process.env.NODE_ENV;

    afterEach(() => { process.env.NODE_ENV = OLD_ENV; });

    test('responds with the correct status code for a ValidationError', () => {
        const err = new ValidationError('bad input', 'Please fix your input');
        const req = mockReq();
        const res = mockRes();
        globalErrorHandler(err, req, res, jest.fn());
        expect(res._status).toBe(400);
        expect(res._body.code).toBe('VALIDATION_ERROR');
        expect(res._body.userMessage).toBe('Please fix your input');
    });

    test('includes requestId in response when present', () => {
        const err = new NotFoundError();
        const req = mockReq({ id: 'req_abc123' });
        const res = mockRes();
        globalErrorHandler(err, req, res, jest.fn());
        expect(res._body.requestId).toBe('req_abc123');
    });

    test('includes supportLink when error has one', () => {
        const err = new PaymentGatedError();
        const req = mockReq();
        const res = mockRes();
        globalErrorHandler(err, req, res, jest.fn());
        expect(res._body.supportLink).toBeDefined();
    });

    test('includes upgradeRequired for PaymentGatedError', () => {
        const err = new PaymentGatedError();
        const req = mockReq();
        const res = mockRes();
        globalErrorHandler(err, req, res, jest.fn());
        expect(res._body.upgradeRequired).toBe(true);
    });

    test('does not send response when headers already sent', () => {
        const err = new Error('late error');
        const req = mockReq();
        const res = mockRes();
        res.headersSent = true;
        globalErrorHandler(err, req, res, jest.fn());
        expect(res._status).toBeNull();
    });

    test('in production does not leak developer error message', () => {
        process.env.NODE_ENV = 'production';
        const err = new Error('secret db password in message');
        const req = mockReq();
        const res = mockRes();
        globalErrorHandler(err, req, res, jest.fn());
        // The error field should be the userMessage, not the raw message
        expect(res._body.error).not.toContain('secret db password');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Validation middleware
// ─────────────────────────────────────────────────────────────────────────────

describe('sanitise / escapeHtml', () => {
    test('escapes HTML special characters', () => {
        expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    test('handles non-string primitives', () => {
        expect(sanitise(42)).toBe(42);
        expect(sanitise(null)).toBeNull();
        expect(sanitise(true)).toBe(true);
    });

    test('recursively sanitises objects', () => {
        const result = sanitise({ name: '<b>bold</b>', count: 5 });
        expect(result.name).toBe('&lt;b&gt;bold&lt;&#x2F;b&gt;');
        expect(result.count).toBe(5);
    });

    test('recursively sanitises arrays', () => {
        const result = sanitise(['<a>', 'safe']);
        expect(result[0]).toBe('&lt;a&gt;');
        expect(result[1]).toBe('safe');
    });
});

describe('sanitiseInput middleware', () => {
    test('sanitises req.body', () => {
        const req = { body: { name: '<script>' }, query: {}, params: {} };
        sanitiseInput(req, {}, (err) => {
            expect(err).toBeUndefined();
            expect(req.body.name).toBe('&lt;script&gt;');
        });
    });

    test('sanitises req.query', () => {
        const req = { body: {}, query: { q: '<b>' }, params: {} };
        sanitiseInput(req, {}, (err) => {
            expect(err).toBeUndefined();
            expect(req.query.q).toBe('&lt;b&gt;');
        });
    });
});

describe('limitStringLengths middleware', () => {
    test('passes valid lengths', (done) => {
        const mw = limitStringLengths(100);
        const req = { body: { name: 'short' } };
        mw(req, {}, (err) => {
            expect(err).toBeUndefined();
            done();
        });
    });

    test('passes ValidationError for strings exceeding max', (done) => {
        const mw = limitStringLengths(5);
        const req = { body: { name: 'toolongstring' } };
        mw(req, {}, (err) => {
            expect(err).toBeInstanceOf(ValidationError);
            done();
        });
    });
});

describe('requireFields middleware', () => {
    test('passes when all required fields are present', (done) => {
        const mw = requireFields(['name', 'email']);
        const req = { body: { name: 'Alice', email: 'alice@test.com' } };
        mw(req, {}, (err) => {
            expect(err).toBeUndefined();
            done();
        });
    });

    test('fails with ValidationError when field is missing', (done) => {
        const mw = requireFields(['name', 'email']);
        const req = { body: { name: 'Alice' } };
        mw(req, {}, (err) => {
            expect(err).toBeInstanceOf(ValidationError);
            expect(err.message).toContain('email');
            done();
        });
    });
});

describe('requireQueryParams middleware', () => {
    test('passes when all params present', (done) => {
        const mw = requireQueryParams(['page', 'limit']);
        const req = { query: { page: '1', limit: '10' } };
        mw(req, {}, (err) => {
            expect(err).toBeUndefined();
            done();
        });
    });

    test('fails with ValidationError when param is missing', (done) => {
        const mw = requireQueryParams(['page', 'limit']);
        const req = { query: { page: '1' } };
        mw(req, {}, (err) => {
            expect(err).toBeInstanceOf(ValidationError);
            expect(err.message).toContain('limit');
            done();
        });
    });
});

describe('validateSchema', () => {
    test('passes valid data', () => {
        expect(() => validateSchema({ email: 'a@b.com', age: 25 }, {
            email: { type: 'email', required: true },
            age: { type: 'number', min: 0, max: 120 },
        })).not.toThrow();
    });

    test('throws on missing required field', () => {
        expect(() => validateSchema({}, { name: { required: true } })).toThrow(ValidationError);
    });

    test('throws on invalid email', () => {
        expect(() => validateSchema({ email: 'notanemail' }, { email: { type: 'email' } })).toThrow(ValidationError);
    });

    test('throws on string too short', () => {
        expect(() => validateSchema({ bio: 'hi' }, { bio: { type: 'string', min: 10 } })).toThrow(ValidationError);
    });

    test('throws on number out of range', () => {
        expect(() => validateSchema({ score: 150 }, { score: { type: 'number', max: 100 } })).toThrow(ValidationError);
    });

    test('throws on pattern mismatch', () => {
        expect(() => validateSchema({ code: 'ABC' }, { code: { pattern: /^\d+$/ } })).toThrow(ValidationError);
    });

    test('skips optional fields that are absent', () => {
        expect(() => validateSchema({}, { optional: { type: 'string' } })).not.toThrow();
    });
});

describe('validateBody middleware', () => {
    test('passes valid body', (done) => {
        const mw = validateBody({ name: { type: 'string', required: true } });
        const req = { body: { name: 'Alice' } };
        mw(req, {}, (err) => {
            expect(err).toBeUndefined();
            done();
        });
    });

    test('forwards ValidationError for invalid body', (done) => {
        const mw = validateBody({ name: { type: 'string', required: true } });
        const req = { body: {} };
        mw(req, {}, (err) => {
            expect(err).toBeInstanceOf(ValidationError);
            done();
        });
    });
});
