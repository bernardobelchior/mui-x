import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const isTrace = process.env.TRACE === 'true';

export default defineConfig({
  plugins: [react()],
  test: {
    setupFiles: ['./setup.ts'],
    // @ts-expect-error
    env: process.env,
    environment: isTrace ? 'node' : 'jsdom',
    browser: {
      enabled: isTrace,
      headless: true,
      instances: [
        {
          browser: 'chromium',
          testTimeout: 60_000,
          launch: {
            args: [
              '--enable-precise-memory-info',
              '--enable-devtools-experiments',
              '--disable-web-security',
            ],
          },
        },
      ],
      provider: 'playwright',
    },
  },
});
