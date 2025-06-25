import { defineConfig } from 'vitest/config';
import codspeedPlugin from '@codspeed/vitest-plugin';
import react from '@vitejs/plugin-react';

const isCI = process.env.CI === 'true';
const isTrace = process.env.TRACE === 'true';

export default defineConfig({
  plugins: [...(isCI ? [codspeedPlugin()] : []), react()],
  test: {
    setupFiles: ['./setup.ts'],
    // @ts-expect-error
    env: process.env,
    environment: isTrace ? undefined : 'jsdom',
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
