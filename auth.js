const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// In-memory user store used when no database is configured.
// Replace with a real DB lookup in production.
const users = [];

const resolveJwtSecret = () => {
    if (process.env.JWT_SECRET) {
        return process.env.JWT_SECRET;
    }
    if (process.env.NODE_ENV === 'test' && process.env.JWT_TEST_SECRET) {
        return process.env.JWT_TEST_SECRET;
    }
    return null;
};

const normalizeEmail = (email) => {
    if (!email) {
        return null;
    }
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
        return null;
    }
    return trimmed;
};

const TOKEN_EXPIRATION = '24h';
const generateUserId = () => `user_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

// Middleware for JWT authentication
const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (token) {
        const jwtSecret = resolveJwtSecret();
        if (!jwtSecret) {
            return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET is not set' });
        }
        jwt.verify(token, jwtSecret, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

// Function for user signup
const signup = async (req, res) => {
    const { username, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const primaryIdentifier = username || normalizedEmail;
    if (!primaryIdentifier || !password) {
        return res.status(400).json({ error: 'Username or email and password are required' });
    }
    if (username && users.find(u => u.username === username)) {
        return res.status(409).json({ error: 'Username already taken' });
    }
    const emailExists = normalizedEmail ? users.find(u => u.email === normalizedEmail) : null;
    const emailUsedAsUsername = !username && normalizedEmail ? users.find(u => u.username === normalizedEmail) : null;
    if (emailExists || emailUsedAsUsername) {
        return res.status(409).json({ error: 'Email already taken' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateUserId();
    const user = { userId, username: primaryIdentifier, email: normalizedEmail || null, password: hashedPassword };
    users.push(user);
    const jwtSecret = resolveJwtSecret();
    if (!jwtSecret) {
        return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET is not set' });
    }
    const signupPayload = { username: primaryIdentifier, userId };
    if (normalizedEmail) {
        signupPayload.email = normalizedEmail;
    }
    const token = jwt.sign(signupPayload, jwtSecret, { expiresIn: TOKEN_EXPIRATION });
    res.status(201).json({
        message: 'User signed up successfully',
        token,
        user: normalizedEmail ? { username: primaryIdentifier, email: normalizedEmail } : { username: primaryIdentifier }
    });
};

// Function for user login
const login = async (req, res) => {
    const { username, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const identifier = normalizedEmail || username;
    if (!identifier || !password) {
        return res.status(400).json({ error: 'Username or email and password are required' });
    }
    let user = null;
    if (normalizedEmail) {
        user = users.find(u => u.email === normalizedEmail);
    }
    if (!user && username) {
        user = users.find(u => u.username === username);
    }
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!user.userId) {
        user.userId = generateUserId();
    }
    const jwtSecret = resolveJwtSecret();
    if (!jwtSecret) {
        return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET is not set' });
    }
    const loginPayload = { username: user.username, userId: user.userId };
    if (user.email) {
        loginPayload.email = user.email;
    }
    const token = jwt.sign(loginPayload, jwtSecret, { expiresIn: TOKEN_EXPIRATION });
    res.json({ token });
};

module.exports = { authenticateJWT, signup, login };
