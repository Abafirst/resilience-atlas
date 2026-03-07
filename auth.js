const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// In-memory user store used when no database is configured.
// Replace with a real DB lookup in production.
const users = [];

const resolveJwtSecret = () => {
    if (process.env.JWT_SECRET) {
        return process.env.JWT_SECRET;
    }
    if (process.env.JEST_WORKER_ID) {
        return 'test-secret';
    }
    return null;
};

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
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    const normalizedEmail = email?.toLowerCase();
    if (users.find(u => u.username === username)) {
        return res.status(409).json({ error: 'Username already taken' });
    }
    if (normalizedEmail && users.find(u => u.email === normalizedEmail)) {
        return res.status(409).json({ error: 'Email already taken' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { username, email: normalizedEmail || null, password: hashedPassword };
    users.push(user);
    const jwtSecret = resolveJwtSecret();
    if (!jwtSecret) {
        return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET is not set' });
    }
    const signupPayload = { username };
    if (normalizedEmail) {
        signupPayload.email = normalizedEmail;
    }
    const token = jwt.sign(signupPayload, jwtSecret);
    res.status(201).json({
        message: 'User signed up successfully',
        token,
        user: normalizedEmail ? { username, email: normalizedEmail } : { username }
    });
};

// Function for user login
const login = async (req, res) => {
    const { username, email, password } = req.body;
    const identifier = email?.toLowerCase() || username;
    if (!identifier || !password) {
        return res.status(400).json({ error: 'Username or email and password are required' });
    }
    const user = email
        ? users.find(u => u.email === identifier)
        : users.find(u => u.username === identifier);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const jwtSecret = resolveJwtSecret();
    if (!jwtSecret) {
        return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET is not set' });
    }
    const loginPayload = { username: user.username };
    if (user.email) {
        loginPayload.email = user.email;
    }
    const token = jwt.sign(loginPayload, jwtSecret);
    res.json({ token });
};

module.exports = { authenticateJWT, signup, login };
