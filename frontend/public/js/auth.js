/**
 * frontend/public/js/auth.js
 * Client-side authentication state management for Resilience Atlas.
 */

const API_BASE = '/api';
const TOKEN_KEY = 'ra_token';
const USER_KEY  = 'ra_user';

const Auth = (() => {
    /**
     * Store token and user data in localStorage.
     */
    function setSession(token, user) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    /**
     * Clear stored session data.
     */
    function clearSession() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    /**
     * Retrieve the stored JWT token.
     * @returns {string|null}
     */
    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    /**
     * Retrieve the cached user object.
     * @returns {Object|null}
     */
    function getUser() {
        const raw = localStorage.getItem(USER_KEY);
        try { return raw ? JSON.parse(raw) : null; } catch { return null; }
    }

    /**
     * Return true when a token exists in storage.
     * @returns {boolean}
     */
    function isLoggedIn() {
        return !!getToken();
    }

    /**
     * Build headers with the Authorization bearer token.
     * @returns {Object}
     */
    function authHeaders() {
        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`
        };
    }

    /**
     * Generic fetch wrapper that throws on non-2xx responses.
     */
    async function apiFetch(path, options = {}) {
        const response = await fetch(`${API_BASE}${path}`, options);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || `Request failed (${response.status})`);
        }
        return data;
    }

    /**
     * Redirect to the application to trigger Auth0 Universal Login.
     * The email/password parameters are no longer used; authentication is
     * handled entirely by Auth0 Universal Login.
     * @returns {void}
     */
    // eslint-disable-next-line no-unused-vars
    function login(email, password) {
        window.location.href = '/app';
    }

    /**
     * Redirect to the application to trigger Auth0 Universal Login (signup screen).
     * The username/email/password/referralCode parameters are no longer used;
     * registration is handled entirely by Auth0 Universal Login.
     * @returns {void}
     */
    // eslint-disable-next-line no-unused-vars
    function signup(username, email, password, referralCode) {
        window.location.href = '/app';
    }

    /**
     * Log the current user out and redirect to the app root.
     * @param {string} [redirectTo='/']
     */
    function logout(redirectTo = '/') {
        clearSession();
        window.location.href = redirectTo;
    }

    /**
     * Fetch the authenticated user's profile from the API.
     * @returns {Promise<Object>}
     */
    async function getProfile() {
        return apiFetch('/auth/profile', {
            headers: authHeaders()
        });
    }

    /**
     * Guard a page — redirect to the app (Auth0 login) if not authenticated.
     * @param {string} [loginUrl='/app']
     */
    function requireAuth(loginUrl = '/app') {
        if (!isLoggedIn()) {
            window.location.href = loginUrl;
        }
    }

    return { login, signup, logout, getToken, getUser, isLoggedIn, getProfile, requireAuth, authHeaders };
})();

// Make available globally
window.Auth = Auth;
