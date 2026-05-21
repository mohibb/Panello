import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    setupFiles: ['./tests/helpers/setup.js'],
    include: ['tests/**/*.test.js'],
    poolOptions: {
      workers: {
        isolatedStorage: false,
        wrangler: { configPath: './wrangler.toml' },
      },
    },
  },
});
