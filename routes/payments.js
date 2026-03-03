const express = require('express');
const router = express.Router();

// Placeholder for payment routes
router.get('/', (req, res) => {
    res.status(200).json({ message: 'Payments route' });
});

module.exports = router;
