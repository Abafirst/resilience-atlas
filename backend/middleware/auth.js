const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Lazily-initialized JWKS client so that unit tests that never set
// AUTH0_DOMAIN / AUTH0_AUDIENCE still work without a network call.
let _jwksClient = null;

function getJwksClient() {
    if (_jwksClient) return _jwksClient;
    const domain = process.env.AUTH0_DOMAIN;
    if (!domain) return null;
    const jwksRsa = require('jwks-rsa');
    _jwksClient = jwksRsa({
        jwksUri: `https://${domain}/.well-known/jwks.json`,
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        cacheMaxEntries: 5,
        cacheMaxAge: 3600000, // 1 hour — JWKS keys rotate infrequently
    });
    return _jwksClient;
}

/**
 * Verify an Auth0 RS256 access token against the tenant's JWKS endpoint.
 * Returns a Promise that resolves to the decoded payload or rejects on error.
 */
function verifyAuth0Token(token) {
    return new Promise((resolve, reject) => {
        const domain   = process.env.AUTH0_DOMAIN;
        const audience = process.env.AUTH0_AUDIENCE;
        if (!domain || !audience) {
            return reject(new Error('AUTH0_DOMAIN or AUTH0_AUDIENCE not configured'));
        }

        const client = getJwksClient();
        if (!client) return reject(new Error('JWKS client not available'));

        function getKey(header, callback) {
            client.getSigningKey(header.kid, (err, key) => {
                if (err) return callback(err);
                // getPublicKey() is the standard method in jwks-rsa v4+.
                const signingKey = key.getPublicKey();
                callback(null, signingKey);
            });
        }

        jwt.verify(
            token,
            getKey,
            {
                issuer:     `https://${domain}/`,
                audience,
                algorithms: ['RS256'],
            },
            (err, decoded) => {
                if (err) return reject(err);
                resolve(decoded);
            }
        );
    });
}

/**
 * JWT authentication middleware.
 * Accepts Auth0 RS256 access tokens (when AUTH0_DOMAIN + AUTH0_AUDIENCE are
 * configured) or legacy HS256 tokens signed with JWT_SECRET.
 */
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Prefer Auth0 JWKS verification when the environment is configured for it.
    if (process.env.AUTH0_DOMAIN && process.env.AUTH0_AUDIENCE) {
        verifyAuth0Token(token)
            .then((decoded) => {
                // Normalize the Auth0 payload so that req.user.userId / req.user.email
                // are always available regardless of which token type was used.
                req.user = {
                    userId: decoded.sub,
                    email:  decoded.email || null,
                    sub:    decoded.sub,
                    ...decoded,
                };
                next();
            })
            .catch(() => {
                // Auth0 validation failed — fall back to legacy JWT_SECRET.
                jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                    if (err) {
                        return res.status(403).json({ error: 'Invalid or expired token.' });
                    }
                    req.user = decoded;
                    next();
                });
            });
        return;
    }

    // Auth0 not configured — use the legacy JWT_SECRET path.
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token.' });
        }
        req.user = decoded;
        next();
    });
};

/**
 * Optional JWT middleware — attaches user if token is present but does not block.
 * Supports both Auth0 RS256 tokens (when configured) and legacy JWT_SECRET tokens.
 */
const optionalJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next();
    }

    if (process.env.AUTH0_DOMAIN && process.env.AUTH0_AUDIENCE) {
        verifyAuth0Token(token)
            .then((decoded) => {
                req.user = {
                    userId: decoded.sub,
                    email:  decoded.email || null,
                    sub:    decoded.sub,
                    ...decoded,
                };
                next();
            })
            .catch(() => {
                jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                    if (!err) req.user = decoded;
                    next();
                });
            });
        return;
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (!err) {
            req.user = decoded;
        }
        next();
    });
};

/**
 * Middleware factory: verifies the requesting user is an admin of the given
 * organization (`:id` or `:organizationId` param).
 *
 * Must be used AFTER authenticateJWT so req.user is populated.
 * Dynamically requires Organization to avoid circular-require issues.
 */
const requireOrgAdmin = async (req, res, next) => {
    try {
        const orgId = req.params.id || req.params.organizationId;
        if (!orgId || !mongoose.Types.ObjectId.isValid(orgId)) {
            return res.status(400).json({ error: 'Invalid organization ID.' });
        }

        // Lazy-load to prevent circular deps at startup
        const Organization = require('../models/Organization');
        const org = await Organization.findById(orgId).lean();
        if (!org) return res.status(404).json({ error: 'Organization not found.' });

        const isAdmin = (org.admins || []).some(
            (id) => id.toString() === req.user.userId.toString()
        );
        if (!isAdmin) return res.status(403).json({ error: 'Admin access required.' });

        req.organization = org;
        next();
    } catch (err) {
        console.error('[auth] requireOrgAdmin error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

/**
 * Middleware factory: verifies the requesting user is a member (or admin) of
 * the given organization.
 *
 * Must be used AFTER authenticateJWT.
 */
const requireOrgMember = async (req, res, next) => {
    try {
        const orgId = req.params.id || req.params.organizationId;
        if (!orgId || !mongoose.Types.ObjectId.isValid(orgId)) {
            return res.status(400).json({ error: 'Invalid organization ID.' });
        }

        const Organization = require('../models/Organization');
        const User         = require('../models/User');

        const [org, user] = await Promise.all([
            Organization.findById(orgId).lean(),
            User.findById(req.user.userId).lean(),
        ]);

        if (!org)  return res.status(404).json({ error: 'Organization not found.' });
        if (!user) return res.status(403).json({ error: 'Access denied.' });

        const isAdmin = (org.admins || []).some(
            (id) => id.toString() === req.user.userId.toString()
        );
        const isMember =
            user.organization_id &&
            user.organization_id.toString() === orgId;

        if (!isAdmin && !isMember) {
            return res.status(403).json({ error: 'Organization membership required.' });
        }

        req.organization = org;
        next();
    } catch (err) {
        console.error('[auth] requireOrgMember error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

module.exports = { authenticateJWT, optionalJWT, requireOrgAdmin, requireOrgMember };
