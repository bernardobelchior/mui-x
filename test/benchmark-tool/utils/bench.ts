import { test } from '@playwright/test';
import { generateReportFromIterations, saveReport } from './reporter';
import { RenderEvent } from './Profiler';

interface BenchOptions {
  warmupRuns?: number;
  iterations: number;
  route: string;
}

type TestFnCreator = (
  type: 'warmup' | 'bench',
  iteration: number,
  benchState: Pick<BenchState, 'renders'>,
) => void;

interface BenchRuns {
  runs: Array<RenderEvent[]>;
}

// Store mutable state per page so the callback can access updated values
interface BenchState {
  renders: RenderEvent[];
  name: string;
  trackEvents: boolean;
}

export async function bench(
  { warmupRuns = 0, iterations, route }: BenchOptions,
  testFnCreator: TestFnCreator,
) {
  const runs: BenchRuns = { runs: [] };

  test.afterAll(async () => {
    const report = generateReportFromIterations(runs.runs);
    await saveReport(report, route);
  });

  for (let i = 0; i < warmupRuns; i += 1) {
    testFnCreator('warmup', i, { renders: [] });
  }

  for (let i = 0; i < iterations; i += 1) {
    const renders: RenderEvent[] = [];
    testFnCreator('bench', i, { renders });
    runs.runs.push(renders);
  }
}
