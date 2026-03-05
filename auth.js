const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// In-memory user store used when no database is configured.
// Replace with a real DB lookup in production.
const users = [];

// Middleware for JWT authentication
const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
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
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    if (users.find(u => u.username === username)) {
        return res.status(409).json({ error: 'Username already taken' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword });
    res.status(201).json({ message: 'User signed up successfully' });
};

// Function for user login
const login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET is not set' });
    }
    const token = jwt.sign({ username }, process.env.JWT_SECRET);
    res.json({ token });
};

module.exports = { authenticateJWT, signup, login };
