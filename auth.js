const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = 'your_jwt_secret'; // Change this to your secret

// Middleware for JWT authentication
const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (token) {
        jwt.verify(token, JWT_SECRET, (err, user) => {
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
    const hashedPassword = await bcrypt.hash(password, 10);
    // Save user to database code here
    res.status(201).send('User signed up');
};

// Function for user login
const login = async (req, res) => {
    const { username, password } = req.body;
    // Fetch user from database code here
    // Assuming user is fetched and stored in variable 'user'
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
        const token = jwt.sign({ username }, JWT_SECRET);
        res.json({ token });
    } else {
        res.sendStatus(403);
    }
};

module.exports = { authenticateJWT, signup, login };