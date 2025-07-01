import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { Reporter } from 'vitest/reporters';
import { RunnerTask } from 'vitest';

const isCI = process.env.CI === 'true';
const isTrace = !isCI && process.env.TRACE === 'true';

const ciReporter: Reporter = {
  onTestSuiteResult: (testSuite) => {
    const benchmarks: RunnerTask[] = testSuite.task.tasks.filter((t) => t.meta.benchmark);
    const benchmarkResults = benchmarks
      .map((b) => b.result?.benchmark)
      .filter((b) => b !== undefined);

    const table = benchmarkResults.map((result) => ({
      name: result.name,
      mean: result.mean,
      median: result.median,
      p99: result.p99,
      standardDeviation: result.sd,
      marginOfError: result.moe,
      sampleCount: result.sampleCount,
    }));

    const tableWoIndex = table.reduce((acc, row) => {
      acc[row.name] = row;
      return acc;
    }, {});

    // console.log(table);
    console.table(tableWoIndex, [
      'mean',
      'median',
      'p99',
      'standardDeviation',
      'marginOfError',
      'sampleCount',
    ]);
  },
};

export default defineConfig({
  plugins: [react()],
  test: {
    benchmark: {
      reporters: ['default', ciReporter],
    },
    setupFiles: ['./setup.ts'],
    env: { TRACE: isTrace ? 'true' : 'false' },
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
