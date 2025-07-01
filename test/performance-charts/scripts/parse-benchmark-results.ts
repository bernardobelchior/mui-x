/* eslint-disable no-console */
import fs from 'node:fs/promises';

const THRESHOLD = 0.05; // 5% threshold for performance change

interface BenchmarkResult {
  id: string;
  name: string;
  rank: number;
  rme: number;
  samples: [];
  totalTime: number;
  min: number;
  max: number;
  hz: number;
  period: number;
  mean: number;
  variance: number;
  sd: number;
  sem: number;
  df: number;
  critical: number;
  moe: number;
  p75: number;
  p99: number;
  p995: number;
  p999: number;
  sampleCount: number;
  median: number;
}

function parseBenchmarkResults(data: any) {
  const benchmarks: BenchmarkResult[] = data.files
    ?.flatMap((file: any) => file?.groups?.flatMap((g: any) => g?.benchmarks))
    .filter((bench: any) => bench !== undefined);

  return benchmarks;
}

interface ChangedBenchmark {
  name: string;
  baseline: BenchmarkResult;
  compare: BenchmarkResult;
  diff: number; // Percentage difference between the median of compare and baseline
}

function processResults(
  compareBenchmarks: BenchmarkResult[],
  baselineBenchmarks: BenchmarkResult[] | null,
  threshold: number,
) {
  const added: BenchmarkResult[] = [];
  const removed: BenchmarkResult[] = [];
  const changed = [];
  let perfChangeExceedsThreshold = false;

  const compareMap = new Map(compareBenchmarks.map((b) => [b.name, b]));
  const baselineMap = new Map(baselineBenchmarks?.map((b) => [b.name, b]) ?? []);

  for (const [_, baselineBench] of baselineMap) {
    const compareBench = compareMap.get(baselineBench.name);

    if (!compareBench) {
      removed.push(baselineBench);
    } else {
      const diff = (compareBench.median - baselineBench.median) / baselineBench.median;
      if (diff > 1 + threshold) {
        perfChangeExceedsThreshold = true;
      }

      changed.push({
        name: baselineBench.name,
        baseline: baselineBench,
        compare: compareBench,
        diff,
      });
      compareMap.delete(baselineBench.name);
    }
  }

  for (const [_, compareBench] of compareMap) {
    added.push(compareBench);
  }

  return {
    added,
    removed,
    changed,
    result: perfChangeExceedsThreshold ? 'fail' : 'pass',
  };
}

function printResults(results: ReturnType<typeof processResults>) {
  console.log(`Overall result: ${results.result}`);

  console.log(`Benchmarks: ${results.changed.length}`);
  const changedTable = results.changed.map((c) => ({
    name: c.name,
    medianBaseline: c.baseline.median.toFixed(2),
    medianCompare: c.compare.median.toFixed(2),
    diff: `${(c.diff * 100).toFixed(2)}%`,
  }));
  console.table(changedTable, ['name', 'medianBaseline', 'medianCompare', 'diff']);

  if (results.added.length > 0) {
    console.log(`Added benchmarks: ${results.added.length}`);
    results.added.forEach((b) => console.log(`- ${b.name}`));
  }

  if (results.removed.length > 0) {
    console.log(`Removed benchmarks: ${results.removed.length}`);
    results.removed.forEach((b) => console.log(`- ${b.name}`));
  }
}

async function main(baselinePath: string, comparePath: string) {
  const [baselinePromise, comparePromise] = await Promise.allSettled([
    fs.readFile(baselinePath),
    fs.readFile(comparePath),
  ]);

  if (comparePromise.status === 'rejected') {
    console.error(
      `Aborting comparison because compare file could not be read:`,
      comparePromise.reason,
    );
    throw new Error('Compare file read error');
  }

  if (baselinePromise.status === 'rejected') {
    console.log('Could not read baseline file:', baselinePromise.reason);
  }

  const compareJson = JSON.parse(comparePromise.value.toString('utf-8'));
  const baselineJson =
    baselinePromise.status === 'fulfilled'
      ? JSON.parse(baselinePromise.value.toString('utf-8'))
      : null;

  const compareBenchmarks = parseBenchmarkResults(compareJson);
  const baselineBenchmarks = baselineJson ? parseBenchmarkResults(baselineJson) : null;

  const results = processResults(compareBenchmarks, baselineBenchmarks, THRESHOLD);

  printResults(results);
}

await main('../baseline.json', '../compare.json');
