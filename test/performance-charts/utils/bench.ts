import { bench as vitestBench, BenchOptions } from 'vitest';
import { endBenchmark, startBenchmark } from './benchmark-utils';
import { getTaskMode } from './options';

const isTrace = import.meta.env.TRACE === 'true';

export function bench(name: string, fn: () => Promise<void>, options?: BenchOptions) {
  vitestBench(name, isTrace ? wrapFnWithTrace(name, fn) : fn, options);
}

function wrapFnWithTrace(name: string, fn: () => Promise<void>): () => Promise<void> {
  return async function tracedFn() {
    const taskMode = getTaskMode(name);

    if (taskMode === 'run') {
      await startBenchmark(name);
    }

    try {
      await fn();
    } finally {
      if (taskMode === 'run') {
        await endBenchmark(name);
      }
    }
  };
}
