'use strict';

/**
 * Tests for the error handling system:
 *   - backend/utils/customErrors.js
 *   - backend/middleware/errorHandler.js
 *   - backend/middleware/validation.js
 *   - backend/integrations/sentry.js
 */

// ── Silence winston during tests ─────────────────────────────────────────────
jest.mock('winston', () => {
    const loggerInstance = {
        info:  jest.fn(),
        warn:  jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        add:   jest.fn(),
        logError: jest.fn(),
    };
    return {
        createLogger: jest.fn(() => loggerInstance),
        format: {
            combine:    jest.fn((...args) => args),
            timestamp:  jest.fn(() => ({})),
            errors:     jest.fn(() => ({})),
            splat:      jest.fn(() => ({})),
            json:       jest.fn(() => ({})),
            colorize:   jest.fn(() => ({})),
            printf:     jest.fn((fn) => fn),
        },
        transports: {
            Console: function ConsoleTransport() {},
            File:    function FileTransport()    {},
        },
    };
});

// ── Imports ───────────────────────────────────────────────────────────────────
const {
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
} = require('../backend/utils/customErrors');

const { errorHandler, buildResponseBody, categorise } = require('../backend/middleware/errorHandler');

const {
    sanitiseString,
    isValidEmail,
    validateQuizSubmission,
    validateReportDownload,
    validatePayment,
    requireBody,
} = require('../backend/middleware/validation');

const sentry = require('../backend/integrations/sentry');

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeRes() {
    const res = { _headers: {} };
    res.status = jest.fn().mockReturnValue(res);
    res.json   = jest.fn().mockReturnValue(res);
    res.set    = jest.fn().mockReturnValue(res);
    res.headersSent = false;
    return res;
}

// ══════════════════════════════════════════════════════════════════════════════
// Custom Error Classes
// ══════════════════════════════════════════════════════════════════════════════
describe('customErrors', () => {
    test('AppError sets message, statusCode, code and isOperational', () => {
        const err = new AppError('oops', 418, 'TEAPOT');
        expect(err.message).toBe('oops');
        expect(err.statusCode).toBe(418);
        expect(err.code).toBe('TEAPOT');
        expect(err.isOperational).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err instanceof AppError).toBe(true);
    });

    test('ValidationError has statusCode 400 and code VALIDATION_ERROR', () => {
        const err = new ValidationError('bad input');
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe('VALIDATION_ERROR');
        expect(err instanceof AppError).toBe(true);
    });

    test('PaymentGatedError has statusCode 402 and upgradeRequired flag', () => {
        const err = new PaymentGatedError();
        expect(err.statusCode).toBe(402);
        expect(err.code).toBe('PAYMENT_REQUIRED');
        expect(err.extra.upgradeRequired).toBe(true);
    });

    test('NotFoundError has statusCode 404', () => {
        expect(new NotFoundError().statusCode).toBe(404);
        expect(new NotFoundError().code).toBe('NOT_FOUND');
    });

    test('UnauthorizedError has statusCode 401', () => {
        expect(new UnauthorizedError().statusCode).toBe(401);
        expect(new UnauthorizedError().code).toBe('UNAUTHORIZED');
    });

    test('RateLimitError has statusCode 429 and retryAfter', () => {
        const err = new RateLimitError('slow down', 30);
        expect(err.statusCode).toBe(429);
        expect(err.code).toBe('RATE_LIMIT_EXCEEDED');
        expect(err.retryAfter).toBe(30);
        expect(err.extra.retryAfter).toBe(30);
    });

    test('InternalServerError has statusCode 500', () => {
        expect(new InternalServerError().statusCode).toBe(500);
        expect(new InternalServerError().code).toBe('INTERNAL_SERVER_ERROR');
    });

    test('PaymentError has statusCode 402', () => {
        expect(new PaymentError().statusCode).toBe(402);
        expect(new PaymentError().code).toBe('PAYMENT_FAILED');
    });

    test('TimeoutError has statusCode 504 and retryAfter', () => {
        const err = new TimeoutError('timed out', 60);
        expect(err.statusCode).toBe(504);
        expect(err.code).toBe('TIMEOUT');
        expect(err.retryAfter).toBe(60);
    });

    test('ConflictError has statusCode 409', () => {
        expect(new ConflictError().statusCode).toBe(409);
        expect(new ConflictError().code).toBe('CONFLICT');
    });

    test('ForbiddenError has statusCode 403', () => {
        expect(new ForbiddenError().statusCode).toBe(403);
        expect(new ForbiddenError().code).toBe('FORBIDDEN');
    });

    test('All custom errors are instances of AppError', () => {
        const errors = [
            new ValidationError(), new PaymentGatedError(), new NotFoundError(),
            new UnauthorizedError(), new RateLimitError(), new InternalServerError(),
            new PaymentError(), new TimeoutError(), new ConflictError(), new ForbiddenError(),
        ];
        errors.forEach(err => expect(err instanceof AppError).toBe(true));
    });

    test('AppError extra data is merged into the instance', () => {
        const err = new ValidationError('bad', { field: 'email' });
        expect(err.extra.field).toBe('email');
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// errorHandler middleware
// ══════════════════════════════════════════════════════════════════════════════
describe('errorHandler middleware', () => {
    let req;
    let res;
    const next = jest.fn();

    beforeEach(() => {
        req  = { method: 'GET', originalUrl: '/test', user: null, body: {} };
        res  = makeRes();
        jest.clearAllMocks();
    });

    test('responds with statusCode from AppError', () => {
        errorHandler(new ValidationError('nope'), req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
    });

    test('responds with 500 for plain Error', () => {
        errorHandler(new Error('unexpected'), req, res, next);
        expect(res.status).toHaveBeenCalledWith(500);
    });

    test('sets Retry-After header for RateLimitError', () => {
        errorHandler(new RateLimitError('slow', 45), req, res, next);
        expect(res.set).toHaveBeenCalledWith('Retry-After', '45');
    });

    test('does not call next() when headers are not sent', () => {
        errorHandler(new NotFoundError(), req, res, next);
        expect(next).not.toHaveBeenCalled();
    });

    test('calls next(err) when headers have already been sent', () => {
        res.headersSent = true;
        const err = new NotFoundError();
        errorHandler(err, req, res, next);
        expect(next).toHaveBeenCalledWith(err);
    });

    test('includes error code in response body for AppError', () => {
        errorHandler(new ForbiddenError('denied'), req, res, next);
        const body = res.json.mock.calls[0][0];
        expect(body.code).toBe('FORBIDDEN');
        expect(body.error).toBe('denied');
    });
});

// ── buildResponseBody ─────────────────────────────────────────────────────────
describe('buildResponseBody', () => {
    test('returns code + message for operational errors', () => {
        const body = buildResponseBody(new ValidationError('bad field'), true);
        expect(body.code).toBe('VALIDATION_ERROR');
        expect(body.error).toBe('bad field');
    });

    test('hides error message in production for non-operational errors', () => {
        const body = buildResponseBody(new Error('DB creds'), false);
        expect(body.error).not.toContain('DB creds');
        expect(body.code).toBe('INTERNAL_SERVER_ERROR');
    });

    test('exposes error message in development for non-operational errors', () => {
        const body = buildResponseBody(new Error('secret detail'), true);
        expect(body.error).toBe('secret detail');
        expect(body.stack).toBeDefined();
    });

    test('extra properties from AppError are spread into body', () => {
        const err = new PaymentGatedError('need payment');
        const body = buildResponseBody(err, false);
        expect(body.upgradeRequired).toBe(true);
        expect(body.supportEmail).toBeDefined();
    });
});

// ── categorise ────────────────────────────────────────────────────────────────
describe('categorise', () => {
    test('5xx → critical', () => {
        expect(categorise(new Error(), 500)).toBe('critical');
        expect(categorise(new Error(), 503)).toBe('critical');
    });

    test('429 → warning', () => {
        expect(categorise(new RateLimitError(), 429)).toBe('warning');
    });

    test('4xx → info', () => {
        expect(categorise(new ValidationError(), 400)).toBe('info');
        expect(categorise(new NotFoundError(), 404)).toBe('info');
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// Validation middleware
// ══════════════════════════════════════════════════════════════════════════════
describe('sanitiseString', () => {
    test('strips HTML tags', () => {
        expect(sanitiseString('<b>hello</b>')).toBe('hello');
        // Tags are stripped; text content between tags is preserved
        expect(sanitiseString('<script>alert(1)</script>test')).toBe('alert(1)test');
    });

    test('strips nested/multiple tags', () => {
        expect(sanitiseString('<em><strong>bold</strong></em>')).toBe('bold');
    });

    test('strips split/nested attack tags — remaining fragments have no leading <', () => {
        // The looping regex fully removes any complete tags.
        // Fragments like "pt>" are left but cannot form HTML elements (no leading <).
        const result = sanitiseString('<scri<script>pt>evil</scri</script>pt>');
        // No complete <tag> patterns remain
        expect(result).not.toMatch(/<[^>]+>/);
        // The literal word "evil" is preserved
        expect(result).toContain('evil');
    });

    test('trims whitespace', () => {
        expect(sanitiseString('  hi  ')).toBe('hi');
    });

    test('returns non-string values unchanged', () => {
        expect(sanitiseString(42)).toBe(42);
        expect(sanitiseString(null)).toBe(null);
    });

    test('does NOT decode HTML entities — encoded payloads remain escaped', () => {
        // &lt;script&gt; must remain as-is, not be decoded to <script>
        const input = '&lt;script&gt;alert(1)&lt;/script&gt;';
        expect(sanitiseString(input)).toBe(input);
    });
});

describe('isValidEmail', () => {
    test('returns true for valid emails', () => {
        expect(isValidEmail('user@example.com')).toBe(true);
        expect(isValidEmail('user+tag@sub.domain.io')).toBe(true);
    });

    test('returns false for invalid emails', () => {
        expect(isValidEmail('notanemail')).toBe(false);
        expect(isValidEmail('missing@tld')).toBe(false);
        expect(isValidEmail('')).toBe(false);
    });
});

describe('validateQuizSubmission', () => {
    const next = jest.fn();

    function makeReq(body) {
        return { body };
    }

    beforeEach(() => jest.clearAllMocks());

    test('calls next() with no error for valid submission', () => {
        const answers = Array(72).fill(3);
        validateQuizSubmission(makeReq({ answers, email: 'user@example.com' }), {}, next);
        expect(next).toHaveBeenCalledWith();
    });

    test('passes ValidationError when answers array is missing', () => {
        validateQuizSubmission(makeReq({ email: 'a@b.com' }), {}, next);
        expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    test('passes ValidationError when answers length != 72', () => {
        validateQuizSubmission(makeReq({ answers: [1, 2], email: 'a@b.com' }), {}, next);
        expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    test('passes ValidationError when an answer is out of range', () => {
        const answers = Array(72).fill(3);
        answers[10] = 9; // out of range
        validateQuizSubmission(makeReq({ answers, email: 'a@b.com' }), {}, next);
        expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    test('passes ValidationError when answer is 0', () => {
        const answers = Array(72).fill(3);
        answers[0] = 0;
        validateQuizSubmission(makeReq({ answers, email: 'a@b.com' }), {}, next);
        expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    test('passes ValidationError when email is missing', () => {
        const answers = Array(72).fill(3);
        validateQuizSubmission(makeReq({ answers }), {}, next);
        expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    test('passes ValidationError for invalid email', () => {
        const answers = Array(72).fill(3);
        validateQuizSubmission(makeReq({ answers, email: 'not-an-email' }), {}, next);
        expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    test('passes ValidationError for invalid tier', () => {
        const answers = Array(72).fill(3);
        validateQuizSubmission(makeReq({ answers, email: 'a@b.com', tier: 'gold' }), {}, next);
        expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    test('accepts a valid tier', () => {
        const answers = Array(72).fill(3);
        validateQuizSubmission(makeReq({ answers, email: 'a@b.com', tier: 'pro' }), {}, next);
        expect(next).toHaveBeenCalledWith();
    });

    test('sanitises firstName in-place', () => {
        const answers = Array(72).fill(3);
        const req = makeReq({ answers, email: 'a@b.com', firstName: '<b>Alice</b>' });
        validateQuizSubmission(req, {}, next);
        expect(req.body.firstName).toBe('Alice');
    });
});

describe('validateReportDownload', () => {
    const next = jest.fn();

    function makeReq(query) {
        return { query };
    }

    beforeEach(() => jest.clearAllMocks());

    test('calls next() for valid query', () => {
        validateReportDownload(makeReq({ overall: '75', scores: '{"a":1}' }), {}, next);
        expect(next).toHaveBeenCalledWith();
    });

    test('passes ValidationError when overall is missing', () => {
        validateReportDownload(makeReq({ scores: '{}' }), {}, next);
        expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    test('passes ValidationError when overall is out of range', () => {
        validateReportDownload(makeReq({ overall: '150', scores: '{}' }), {}, next);
        expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    test('passes ValidationError when overall is negative', () => {
        validateReportDownload(makeReq({ overall: '-5', scores: '{}' }), {}, next);
        expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    test('passes ValidationError when scores is missing', () => {
        validateReportDownload(makeReq({ overall: '50' }), {}, next);
        expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    test('passes ValidationError when scores is invalid JSON', () => {
        validateReportDownload(makeReq({ overall: '50', scores: 'notjson' }), {}, next);
        expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    test('passes ValidationError when email is invalid', () => {
        validateReportDownload(makeReq({ overall: '50', scores: '{}', email: 'bad' }), {}, next);
        expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    test('accepts omitted email', () => {
        validateReportDownload(makeReq({ overall: '50', scores: '{"x":1}' }), {}, next);
        expect(next).toHaveBeenCalledWith();
    });
});

describe('validatePayment', () => {
    const next = jest.fn();

    function makeReq(body) {
        return { body };
    }

    beforeEach(() => jest.clearAllMocks());

    test('calls next() for valid payment body', () => {
        validatePayment(makeReq({ email: 'user@example.com', tier: 'pro' }), {}, next);
        expect(next).toHaveBeenCalledWith();
    });

    test('passes ValidationError when email is missing', () => {
        validatePayment(makeReq({ tier: 'pro' }), {}, next);
        expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    test('passes ValidationError for invalid email', () => {
        validatePayment(makeReq({ email: 'bad', tier: 'pro' }), {}, next);
        expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    test('passes ValidationError for non-purchasable tier', () => {
        validatePayment(makeReq({ email: 'a@b.com', tier: 'free' }), {}, next);
        expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    test('passes ValidationError when metadata is an array', () => {
        validatePayment(makeReq({ email: 'a@b.com', metadata: [1, 2] }), {}, next);
        expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    test('accepts valid metadata object', () => {
        validatePayment(makeReq({ email: 'a@b.com', metadata: { ref: 'xyz' } }), {}, next);
        expect(next).toHaveBeenCalledWith();
    });
});

describe('requireBody', () => {
    const next = jest.fn();

    beforeEach(() => jest.clearAllMocks());

    test('calls next() when body is an object', () => {
        requireBody({ body: { foo: 1 } }, {}, next);
        expect(next).toHaveBeenCalledWith();
    });

    test('passes ValidationError when body is missing', () => {
        requireBody({}, {}, next);
        expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    test('passes ValidationError when body is a string', () => {
        requireBody({ body: 'text' }, {}, next);
        expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// Sentry stub
// ══════════════════════════════════════════════════════════════════════════════
describe('sentry integration stub', () => {
    test('exports captureException as a function', () => {
        expect(typeof sentry.captureException).toBe('function');
    });

    test('exports captureMessage as a function', () => {
        expect(typeof sentry.captureMessage).toBe('function');
    });

    test('exports addBreadcrumb as a function', () => {
        expect(typeof sentry.addBreadcrumb).toBe('function');
    });

    test('exports setUser as a function', () => {
        expect(typeof sentry.setUser).toBe('function');
    });

    test('exports withScope as a function', () => {
        expect(typeof sentry.withScope).toBe('function');
    });

    test('Handlers.requestHandler returns middleware function', () => {
        const mw = sentry.Handlers.requestHandler();
        expect(typeof mw).toBe('function');
        // It should call next() as a no-op
        const next = jest.fn();
        mw({}, {}, next);
        expect(next).toHaveBeenCalled();
    });

    test('Handlers.errorHandler returns error middleware function', () => {
        const mw = sentry.Handlers.errorHandler();
        expect(typeof mw).toBe('function');
        const next = jest.fn();
        const err = new Error('boom');
        mw(err, {}, {}, next);
        expect(next).toHaveBeenCalledWith(err);
    });

    test('withScope calls callback with a scope object', () => {
        const cb = jest.fn();
        sentry.withScope(cb);
        expect(cb).toHaveBeenCalled();
        const scope = cb.mock.calls[0][0];
        expect(typeof scope.captureException).toBe('function');
        expect(typeof scope.setTag).toBe('function');
    });

    test('stub methods do not throw', () => {
        expect(() => sentry.captureException(new Error('x'))).not.toThrow();
        expect(() => sentry.captureMessage('hello')).not.toThrow();
        expect(() => sentry.addBreadcrumb({ message: 'test' })).not.toThrow();
        expect(() => sentry.setUser({ id: '1' })).not.toThrow();
        expect(() => sentry.setTag('env', 'test')).not.toThrow();
        expect(() => sentry.setContext('ctx', {})).not.toThrow();
    });
});
