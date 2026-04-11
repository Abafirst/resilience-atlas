const mongoose = require('mongoose');

/**
 * Auth0Profile — stores profile data for users who authenticate via Auth0.
 *
 * The standard User model requires a username + password (local-auth only).
 * Auth0 users don't have those fields, so we keep a lightweight profile record
 * here, keyed by email.  The primary use-case is storing the user's full name
 * for reports and exports after the post-login "Complete your profile" step.
 */
const auth0ProfileSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },

        // Auth0 subject identifier (e.g. "auth0|abc123")
        sub: {
            type: String,
            default: null,
            index: true,
            sparse: true,
        },

        // Full display name captured via the "Complete your profile" flow.
        // null/undefined = name not yet collected.
        fullName: {
            type: String,
            default: null,
            trim: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Auth0Profile', auth0ProfileSchema);
