import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['backend/tests/**/*.test.ts', 'frontend/src/**/*.test.{ts,tsx}'],
    environment: 'node',
    globals: true,
    testTimeout: 15_000,
    maxWorkers: 4,
  },
});
