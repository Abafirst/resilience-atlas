// Polyfill for Node.js < 15
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_TEST_SECRET = process.env.JWT_TEST_SECRET || 'test-secret';
