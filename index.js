const express = require('express');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');
const stripe = require('stripe');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Basic route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to Resilience Atlas API' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
