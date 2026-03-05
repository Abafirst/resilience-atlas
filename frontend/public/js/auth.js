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
     * Log in with email + password, persist session.
     * @param {string} email
     * @param {string} password
     * @returns {Promise<Object>}
     */
    async function login(email, password) {
        const data = await apiFetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        setSession(data.token, data.user);
        return data;
    }

    /**
     * Sign up with username, email, and password.
     * @param {string} username
     * @param {string} email
     * @param {string} password
     * @param {string} [referralCode]
     * @returns {Promise<Object>}
     */
    async function signup(username, email, password, referralCode) {
        const data = await apiFetch('/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, referralCode })
        });
        setSession(data.token, data.user);
        return data;
    }

    /**
     * Log the current user out and clear the session.
     * @param {string} [redirectTo='/login.html']
     */
    function logout(redirectTo = '/login.html') {
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
     * Guard a page — redirect to login if not authenticated.
     * @param {string} [loginUrl='/login.html']
     */
    function requireAuth(loginUrl = '/login.html') {
        if (!isLoggedIn()) {
            window.location.href = loginUrl;
        }
    }

    return { login, signup, logout, getToken, getUser, isLoggedIn, getProfile, requireAuth, authHeaders };
})();

// Make available globally
window.Auth = Auth;
