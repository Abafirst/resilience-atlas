'use strict';

const { sanitizeMongoUri } = require('../backend/utils/mongoUri');

describe('sanitizeMongoUri', () => {
    test('returns undefined unchanged', () => {
        expect(sanitizeMongoUri(undefined)).toBeUndefined();
    });

    test('returns null unchanged', () => {
        expect(sanitizeMongoUri(null)).toBeNull();
    });

    test('returns URI without credentials unchanged', () => {
        const uri = 'mongodb://localhost:27017/mydb';
        expect(sanitizeMongoUri(uri)).toBe(uri);
    });

    test('does not alter a plain alphanumeric password', () => {
        const uri = 'mongodb+srv://resilience_user:0TmAGDlyLb5avfck@cluster0.dfrv3lt.mongodb.net/resilience?retryWrites=true&w=majority';
        // No special characters — output should be functionally identical.
        expect(sanitizeMongoUri(uri)).toBe(uri);
    });

    test('encodes @ in password', () => {
        const uri = 'mongodb+srv://user:p@ssword@cluster.mongodb.net/db';
        const result = sanitizeMongoUri(uri);
        expect(result).toBe('mongodb+srv://user:p%40ssword@cluster.mongodb.net/db');
    });

    test('encodes / in password', () => {
        const uri = 'mongodb://user:p/assword@localhost:27017/db';
        const result = sanitizeMongoUri(uri);
        expect(result).toBe('mongodb://user:p%2Fassword@localhost:27017/db');
    });

    test('encodes multiple special characters in password', () => {
        const uri = 'mongodb+srv://user:p@ss/w0rd#!@cluster.mongodb.net/db';
        const result = sanitizeMongoUri(uri);
        // All special chars in password should be encoded.
        expect(result).toContain('p%40ss%2Fw0rd%23!@cluster.mongodb.net/db');
    });

    test('does not double-encode an already-encoded password', () => {
        const uri = 'mongodb+srv://user:p%40ssword@cluster.mongodb.net/db';
        const result = sanitizeMongoUri(uri);
        // %40 should remain %40, not become %2540.
        expect(result).toBe('mongodb+srv://user:p%40ssword@cluster.mongodb.net/db');
    });

    test('encodes @ in username', () => {
        const uri = 'mongodb://u@ser:password@localhost/db';
        const result = sanitizeMongoUri(uri);
        expect(result).toBe('mongodb://u%40ser:password@localhost/db');
    });

    test('preserves query string options', () => {
        const uri = 'mongodb+srv://user:p@ss@cluster.mongodb.net/db?retryWrites=true&w=majority';
        const result = sanitizeMongoUri(uri);
        expect(result).toBe('mongodb+srv://user:p%40ss@cluster.mongodb.net/db?retryWrites=true&w=majority');
    });

    test('returns string without :// unchanged', () => {
        const uri = 'not-a-valid-uri';
        expect(sanitizeMongoUri(uri)).toBe(uri);
    });

    test('returns URI with no @ in authority unchanged', () => {
        const uri = 'mongodb://localhost/db';
        expect(sanitizeMongoUri(uri)).toBe(uri);
    });
});
