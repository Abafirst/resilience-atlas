'use strict';

/**
 * Sanitise a user-supplied ?returnTo= query parameter.
 *
 * Returns the decoded, same-origin path (pathname + search + hash) when the
 * value is safe, or null if the value contains an absolute URL, a protocol-
 * relative URL, or any other pattern that could redirect to a third-party host.
 *
 * Uses the WHATWG URL constructor rather than regular expressions to avoid
 * catastrophic backtracking (ReDoS) and to correctly handle percent-encoded
 * edge cases.
 *
 * @param {unknown} raw - Raw value from req.query.returnTo
 * @returns {string|null}
 */
function sanitiseReturnTo(raw) {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(String(raw));
    // Parse against a fixed dummy origin.  If the caller supplied an absolute
    // URL or a protocol-relative URL the parsed hostname will differ.
    const parsed = new URL(decoded, 'http://spa.internal');
    if (parsed.hostname !== 'spa.internal') return null;
    // Reconstruct only the path portion — never include protocol or host.
    const safe = parsed.pathname + parsed.search + parsed.hash;
    // Guard against the edge-case where pathname itself starts with '//'
    if (safe.startsWith('//')) return null;
    return safe;
  } catch {
    return null;
  }
}

module.exports = sanitiseReturnTo;
