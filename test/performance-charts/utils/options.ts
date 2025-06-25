import { BenchOptions } from 'vitest';
import { endBenchmark, startBenchmark } from './benchmark-utils';

const iterations = import.meta.env.BENCHMARK_ITERATIONS
  ? parseInt(import.meta.env.BENCHMARK_ITERATIONS, 10)
  : 1;

const isTrace = import.meta.env.TRACE === 'true';

const traceOptions: BenchOptions = {
  time: 0,
  iterations,
  async setup(task, mode) {
    if (mode === 'run') {
      await startBenchmark(task.name);
    }
  },
  async teardown(task, mode) {
    console.log('teardown start');
    if (mode === 'run') {
      console.log('before end benchmark');
      try {
        await endBenchmark(task.name);
      } catch (e) {
        console.error(e);
      }

      console.log('teardown finished');
    }
  },
};

const benchOptions: BenchOptions = {
  iterations,
};

export const options: BenchOptions = isTrace ? traceOptions : benchOptions;
