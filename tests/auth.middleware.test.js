'use strict';

const { authenticateJWT } = require('../backend/middleware/auth');

// Minimal stub for jwt.verify — we don't want real network/crypto overhead.
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn()
}));

const jwt = require('jsonwebtoken');

function makeRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe('authenticateJWT middleware', () => {
    const next = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns 401 when no Authorization header is present', () => {
        const req = { headers: {} };
        const res = makeRes();

        authenticateJWT(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
        expect(next).not.toHaveBeenCalled();
    });

    test('returns 401 when Authorization header is present but no token', () => {
        const req = { headers: { authorization: 'Bearer ' } };
        const res = makeRes();

        // Empty token after split → falsy
        authenticateJWT(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('returns 403 when jwt.verify reports an error', () => {
        const req = { headers: { authorization: 'Bearer invalidtoken' } };
        const res = makeRes();

        jwt.verify.mockImplementation((token, secret, cb) => {
            cb(new Error('invalid token'), null);
        });

        authenticateJWT(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
        expect(next).not.toHaveBeenCalled();
    });

    test('calls next() and attaches decoded user when token is valid', () => {
        const decoded = { userId: 'user123', username: 'alice', role: 'user' };
        const req = { headers: { authorization: 'Bearer validtoken' } };
        const res = makeRes();

        jwt.verify.mockImplementation((token, secret, cb) => {
            cb(null, decoded);
        });

        authenticateJWT(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toEqual(decoded);
        expect(res.status).not.toHaveBeenCalled();
    });
});
