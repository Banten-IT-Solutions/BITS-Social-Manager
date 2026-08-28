import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/unit/**/*.test.ts'],
    pool: 'forks',
  },
  resolve: {
    alias: {
      '@': `${import.meta.dirname}/src/client`,
      '@worker': `${import.meta.dirname}/src/worker`,
    },
  },
});
