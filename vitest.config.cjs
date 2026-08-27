const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    include: [
      'backend/tests/**/*.test.{js,ts}',
      'frontend/src/**/*.test.{js,jsx,ts,tsx}',
    ],
    environment: 'node',
    globals: true,
  },
});
