const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    include: ['backend/tests/**/*.test.js', 'frontend/src/**/*.test.{js,jsx}'],
    environment: 'node',
    globals: true,
  },
});
