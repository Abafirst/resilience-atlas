// Updated content with corrected syntax

const express = require('express');
const router = express.Router();

// Example of a corrected arrow function
router.get('/pay', (req, res) => {
    // Business logic here
    res.send('Payment successful');
});

module.exports = router;