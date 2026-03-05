'use strict';

/**
 * Ensures a MongoDB connection URI has its credentials properly URL-encoded.
 *
 * Passwords that contain characters such as @, /, ?, #, [ or ] MUST be
 * percent-encoded before they are embedded in a connection string, otherwise
 * the URI parser will misinterpret them and the connection will fail.
 *
 * This helper uses `lastIndexOf('@')` to locate the credential/host separator,
 * which means it correctly handles passwords that contain one or more literal
 * '@' characters (e.g. "p@ssw0rd" → "p%40ssw0rd").  It also prevents
 * double-encoding by decoding the credentials before re-encoding them.
 *
 * @param {string} uri  Raw MongoDB connection string (mongodb:// or mongodb+srv://).
 * @returns {string}    URI with credentials percent-encoded, or the original
 *                      string unchanged if it cannot be parsed.
 */
function sanitizeMongoUri(uri) {
    if (!uri) return uri;

    // Locate the scheme (e.g. "mongodb://" or "mongodb+srv://").
    const schemeEnd = uri.indexOf('://');
    if (schemeEnd === -1) return uri;

    const scheme = uri.substring(0, schemeEnd + 3);
    const afterScheme = uri.substring(schemeEnd + 3);

    // Find the last '@' — this is always the separator between credentials
    // and the host, even when the password itself contains unencoded '@' chars.
    const atIndex = afterScheme.lastIndexOf('@');
    if (atIndex === -1) return uri; // No credentials present.

    const rawCredentials = afterScheme.substring(0, atIndex);
    const hostAndRest = afterScheme.substring(atIndex + 1);

    // Split credentials into username and password at the FIRST colon.
    const colonIndex = rawCredentials.indexOf(':');
    if (colonIndex === -1) return uri; // Username only, no password to encode.

    const rawUsername = rawCredentials.substring(0, colonIndex);
    const rawPassword = rawCredentials.substring(colonIndex + 1);

    // Decode first to avoid double-encoding already-encoded characters,
    // then re-encode to ensure all special characters are safely escaped.
    let safeUsername, safePassword;
    try {
        safeUsername = encodeURIComponent(decodeURIComponent(rawUsername));
        safePassword = encodeURIComponent(decodeURIComponent(rawPassword));
    } catch (e) {
        // decodeURIComponent throws on malformed sequences — fall back to
        // encoding the raw value directly.
        safeUsername = encodeURIComponent(rawUsername);
        safePassword = encodeURIComponent(rawPassword);
    }

    return `${scheme}${safeUsername}:${safePassword}@${hostAndRest}`;
}

module.exports = { sanitizeMongoUri };
