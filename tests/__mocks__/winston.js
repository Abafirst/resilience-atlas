// jest manual mock for winston

const createLogger = jest.fn();
const format = {};
const transports = {
  Console: jest.fn(),
  File: jest.fn(),
};

module.exports = { createLogger, format, transports };