const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

/**
 * JWT authentication middleware.
 * Verifies the Bearer token in the Authorization header.
 */
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

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
 */
const optionalJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next();
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
 * organisation (`:id` or `:organizationId` param).
 *
 * Must be used AFTER authenticateJWT so req.user is populated.
 * Dynamically requires Organisation to avoid circular-require issues.
 */
const requireOrgAdmin = async (req, res, next) => {
    try {
        const orgId = req.params.id || req.params.organizationId;
        if (!orgId || !mongoose.Types.ObjectId.isValid(orgId)) {
            return res.status(400).json({ error: 'Invalid organisation ID.' });
        }

        // Lazy-load to prevent circular deps at startup
        const Organization = require('../models/Organization');
        const org = await Organization.findById(orgId).lean();
        if (!org) return res.status(404).json({ error: 'Organisation not found.' });

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
 * the given organisation.
 *
 * Must be used AFTER authenticateJWT.
 */
const requireOrgMember = async (req, res, next) => {
    try {
        const orgId = req.params.id || req.params.organizationId;
        if (!orgId || !mongoose.Types.ObjectId.isValid(orgId)) {
            return res.status(400).json({ error: 'Invalid organisation ID.' });
        }

        const Organization = require('../models/Organization');
        const User         = require('../models/User');

        const [org, user] = await Promise.all([
            Organization.findById(orgId).lean(),
            User.findById(req.user.userId).lean(),
        ]);

        if (!org)  return res.status(404).json({ error: 'Organisation not found.' });
        if (!user) return res.status(403).json({ error: 'Access denied.' });

        const isAdmin = (org.admins || []).some(
            (id) => id.toString() === req.user.userId.toString()
        );
        const isMember =
            user.organization_id &&
            user.organization_id.toString() === orgId;

        if (!isAdmin && !isMember) {
            return res.status(403).json({ error: 'Organisation membership required.' });
        }

        req.organization = org;
        next();
    } catch (err) {
        console.error('[auth] requireOrgMember error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

module.exports = { authenticateJWT, optionalJWT, requireOrgAdmin, requireOrgMember };
