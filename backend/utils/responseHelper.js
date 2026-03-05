'use strict';

/**
 * Build a standardized auth response body.
 *
 * @param {string} message - Human-readable status message.
 * @param {string} token   - Signed JWT for the authenticated session.
 * @param {object} user    - Serializable user object (call user.toJSON() first).
 * @returns {{ message: string, token: string, user: object }}
 */
function authResponse(message, token, user) {
    return { message, token, user };
}

module.exports = { authResponse };
