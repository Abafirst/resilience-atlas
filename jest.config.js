<<<<<<< HEAD
﻿module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.js',
    '**/test/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  forceExit: true,
  detectOpenHandles: false
};
=======
module.exports = {  // Existing configurations...
  testEnvironmentOptions: {
    experimentalGlobalCustomPatch: true,
  },  // Other configurations...};
>>>>>>> bc886d68171b1755ac40b91398b8e0348a296e48
