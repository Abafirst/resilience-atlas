const express = require('express');
const router = express.Router();
const questions = require('../questions.json');

// GET all quiz questions
router.get('/', (req, res) => {
    res.status(200).json(questions);
});

module.exports = router;
