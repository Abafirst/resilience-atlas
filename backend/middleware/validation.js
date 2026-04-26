'use strict';

const { ValidationError } = require('../utils/errors');

// ── Tiny XSS / injection sanitiser ───────────────────────────────────────────
// Strips or encodes characters that are commonly exploited in reflected XSS,
// HTML-injection, and basic SQL-injection attacks.  This is a defense-in-depth
// layer; always use parameterised queries / an ODM like Mongoose as well.

const HTML_ENTITY_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
};

/**
 * Escape HTML special characters in a string.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    return String(str).replace(/[&<>"'`=/]/g, (s) => HTML_ENTITY_MAP[s]);
}

/**
 * Recursively sanitise all string values in an object / array.
 * Non-string primitives are returned unchanged.
 *
 * @param {*} value
 * @returns {*}
 */
function sanitise(value) {
    if (typeof value === 'string') return escapeHtml(value);
    if (Array.isArray(value)) return value.map(sanitise);
    if (value !== null && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([k, v]) => [k, sanitise(v)])
        );
    }
    return value;
}

// ── String length limiter ─────────────────────────────────────────────────────

const DEFAULT_MAX_STRING_LENGTH = 10_000;

/**
 * Recursively ensure all strings in a value are within `maxLength` characters.
 * Throws a ValidationError on violation.
 *
 * @param {*}      value
 * @param {number} maxLength
 * @param {string} [path]
 */
function enforceStringLengths(value, maxLength = DEFAULT_MAX_STRING_LENGTH, path = 'body') {
    if (typeof value === 'string') {
        if (value.length > maxLength) {
            throw new ValidationError(
                `String at "${path}" exceeds maximum length of ${maxLength} characters.`,
                `The value provided for "${path}" is too long. Please shorten it to ${maxLength} characters or fewer.`,
            );
        }
    } else if (Array.isArray(value)) {
        value.forEach((item, i) => enforceStringLengths(item, maxLength, `${path}[${i}]`));
    } else if (value !== null && typeof value === 'object') {
        Object.entries(value).forEach(([k, v]) =>
            enforceStringLengths(v, maxLength, `${path}.${k}`)
        );
    }
}

// ── Express middleware ────────────────────────────────────────────────────────

/**
 * Middleware: sanitise all string fields in req.body, req.query, and req.params
 * to prevent reflected XSS.  Operates in-place so downstream handlers see the
 * cleaned values.
 */
function sanitiseInput(req, _res, next) {
    try {
        if (req.body && typeof req.body === 'object') {
            req.body = sanitise(req.body);
        }
        if (req.query && typeof req.query === 'object') {
            req.query = sanitise(req.query);
        }
        // params are matched from the URL, sanitise for safety.
        if (req.params && typeof req.params === 'object') {
            req.params = sanitise(req.params);
        }
        next();
    } catch (err) {
        next(err);
    }
}

/**
 * Middleware factory: enforce a maximum string length across the request body.
 *
 * @param  {number} [maxLength=10000]
 * @returns {import('express').RequestHandler}
 */
function limitStringLengths(maxLength = DEFAULT_MAX_STRING_LENGTH) {
    return function stringLengthLimiter(req, _res, next) {
        try {
            if (req.body) enforceStringLengths(req.body, maxLength);
            next();
        } catch (err) {
            next(err);
        }
    };
}

/**
 * Middleware factory: require that certain fields exist in req.body.
 * Throws a ValidationError listing all missing fields.
 *
 * @param  {string[]} fields - Required field names.
 * @returns {import('express').RequestHandler}
 */
function requireFields(fields) {
    return function fieldPresenceCheck(req, _res, next) {
        const missing = fields.filter(
            (f) => req.body[f] === undefined || req.body[f] === null || req.body[f] === ''
        );
        if (missing.length > 0) {
            return next(
                new ValidationError(
                    `Missing required fields: ${missing.join(', ')}.`,
                    `The following fields are required: ${missing.join(', ')}.`,
                )
            );
        }
        next();
    };
}

/**
 * Middleware factory: require that certain query parameters are present.
 *
 * @param  {string[]} params
 * @returns {import('express').RequestHandler}
 */
function requireQueryParams(params) {
    return function queryParamCheck(req, _res, next) {
        const missing = params.filter(
            (p) => req.query[p] === undefined || req.query[p] === ''
        );
        if (missing.length > 0) {
            return next(
                new ValidationError(
                    `Missing required query parameters: ${missing.join(', ')}.`,
                    `The following query parameters are required: ${missing.join(', ')}.`,
                )
            );
        }
        next();
    };
}

/**
 * Validate a value against a plain rules object.
 * Supported rule keys per field:
 *   - type: 'string' | 'number' | 'boolean' | 'email'
 *   - min / max: for numbers or string length
 *   - required: boolean
 *   - pattern: RegExp
 *
 * @param  {object} data   - Object to validate (e.g. req.body).
 * @param  {object} schema - Rules map: { fieldName: { type, required, … } }
 * @throws {ValidationError}
 */
function validateSchema(data, schema) {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
        const value = data[field];
        const isEmpty = value === undefined || value === null || value === '';

        if (rules.required && isEmpty) {
            errors.push(`"${field}" is required.`);
            continue;
        }
        if (isEmpty) continue; // optional field not provided — skip further checks

        if (rules.type === 'email') {
            const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRe.test(String(value))) {
                errors.push(`"${field}" must be a valid email address.`);
            }
        } else if (rules.type) {
            const allowedTypes = ['string', 'number', 'boolean', 'object'];
            if (allowedTypes.includes(rules.type) && typeof value !== rules.type) {
                errors.push(`"${field}" must be of type ${rules.type}.`);
            }
        }

        if (rules.type === 'string' || typeof value === 'string') {
            if (rules.min !== undefined && String(value).length < rules.min) {
                errors.push(`"${field}" must be at least ${rules.min} characters.`);
            }
            if (rules.max !== undefined && String(value).length > rules.max) {
                errors.push(`"${field}" must be at most ${rules.max} characters.`);
            }
        }

        if (rules.type === 'number' || typeof value === 'number') {
            if (rules.min !== undefined && Number(value) < rules.min) {
                errors.push(`"${field}" must be at least ${rules.min}.`);
            }
            if (rules.max !== undefined && Number(value) > rules.max) {
                errors.push(`"${field}" must be at most ${rules.max}.`);
            }
        }

        if (rules.pattern && !rules.pattern.test(String(value))) {
            errors.push(`"${field}" has an invalid format.`);
        }
    }

    if (errors.length > 0) {
        throw new ValidationError(
            errors.join(' '),
            `Validation failed: ${errors.join(' ')}`,
        );
    }
}

/**
 * Middleware factory: validate req.body against a schema.
 *
 * @param  {object} schema
 * @returns {import('express').RequestHandler}
 */
function validateBody(schema) {
    return function bodyValidator(req, _res, next) {
        try {
            validateSchema(req.body || {}, schema);
            next();
        } catch (err) {
            next(err);
        }
    };
}

/**
 * Middleware factory: validate req.query against a schema.
 *
 * @param  {object} schema
 * @returns {import('express').RequestHandler}
 */
function validateQuery(schema) {
    return function queryValidator(req, _res, next) {
        try {
            validateSchema(req.query || {}, schema);
            next();
        } catch (err) {
            next(err);
        }
    };
}

module.exports = {
    sanitiseInput,
    limitStringLengths,
    requireFields,
    requireQueryParams,
    validateBody,
    validateQuery,
    validateSchema,
    sanitise,
    escapeHtml,
};
