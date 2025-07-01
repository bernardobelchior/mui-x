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

interface BenchmarkComparison {
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
  const unchanged: BenchmarkComparison[] = [];
  const changed: BenchmarkComparison[] = [];

  const compareMap = new Map(compareBenchmarks.map((b) => [b.name, b]));
  const baselineMap = new Map(baselineBenchmarks?.map((b) => [b.name, b]) ?? []);

  for (const [_, baselineBench] of baselineMap) {
    const compareBench = compareMap.get(baselineBench.name);

    if (!compareBench) {
      removed.push(baselineBench);
    } else {
      const diff = (compareBench.median - baselineBench.median) / baselineBench.median;
      const benchmark: BenchmarkComparison = {
        name: baselineBench.name,
        baseline: baselineBench,
        compare: compareBench,
        diff,
      };

      if (diff > threshold) {
        changed.push(benchmark);
      } else {
        unchanged.push(benchmark);
      }

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
    unchanged,
    result: changed.length > 0 ? 'fail' : 'pass',
  };
}

function printResults(results: ReturnType<typeof processResults>) {
  console.log(`Overall result: ${results.result}`);

  console.log(`Changed benchmarks: ${results.changed.length}`);
  const changedTable = results.changed.map((c) => ({
    name: c.name,
    medianBaseline: c.baseline.median.toFixed(2),
    medianCompare: c.compare.median.toFixed(2),
    diff: `${(c.diff * 100).toFixed(2)}%`,
    sampleCount: c.compare.sampleCount,
    mean: c.compare.mean.toFixed(2),
    p75: c.compare.p75.toFixed(2),
    p99: c.compare.p99.toFixed(2),
    marginOfError: c.compare.moe.toFixed(2),
  }));
  console.table(changedTable, ['name', 'medianBaseline', 'medianCompare', 'diff']);
  console.log(`Unchanged benchmarks: ${results.unchanged.length}`);
  const unchangedTable = results.unchanged.map((c) => ({
    name: c.name,
    medianBaseline: c.baseline.median.toFixed(2),
    medianCompare: c.compare.median.toFixed(2),
    diff: `${(c.diff * 100).toFixed(2)}%`,
    sampleCount: c.compare.sampleCount,
    mean: c.compare.mean.toFixed(2),
    p75: c.compare.p75.toFixed(2),
    p99: c.compare.p99.toFixed(2),
    marginOfError: c.compare.moe.toFixed(2),
  }));
  console.table(unchangedTable, ['name', 'medianBaseline', 'medianCompare', 'diff']);

  console.log(`Added benchmarks: ${results.added.length}`);
  results.added.forEach((b) => console.log(`- ${b.name}`));

  console.log(`Removed benchmarks: ${results.removed.length}`);
  results.removed.forEach((b) => console.log(`- ${b.name}`));
}

function generateResultMarkdown(results: ReturnType<typeof processResults>) {
  let markdown = '';

  markdown += `## Benchmark Report\n`;

  markdown += `\nResult: ${results.result === 'pass' ? 'Pass ✅' : 'Fail ❌'}\n`;

  markdown += `\nChanged benchmarks: ${results.changed.length}\n`;

  if (results.changed.length > 0) {
    markdown += `| Name | Median Baseline | Median Compare | Diff | Sample Count | Mean | P75 | P99 | Margin of Error |\n`;
    markdown += `| ---- | --------------- | -------------- | ---- | ------------ | ---- | --- | --- | --------------- |\n`;

    results.changed.forEach((c) => {
      markdown += `| ${c.name} | ${c.baseline.median.toFixed(2)} | ${c.compare.median.toFixed(2)} | ${(c.diff * 100).toFixed(2)}% | ${c.compare.sampleCount} | ${c.compare.mean.toFixed(2)} | ${c.compare.p75.toFixed(2)} | ${c.compare.p99.toFixed(2)} | ${c.compare.moe.toFixed(2)} |\n`;
    });
  }

  markdown += `\nUnchanged benchmarks: ${results.unchanged.length}\n`;

  if (results.unchanged.length > 0) {
    markdown += `<details>\n`;
    markdown += `<summary>Click to expand</summary>\n\n`;

    markdown += `| Name | Median Baseline | Median Compare | Diff | Sample Count | Mean | P75 | P99 | Margin of Error |\n`;
    markdown += `| ---- | --------------- | -------------- | ---- | ------------ | ---- | --- | --- | --------------- |\n`;

    results.unchanged.forEach((c) => {
      markdown += `| ${c.name} | ${c.baseline.median.toFixed(2)} | ${c.compare.median.toFixed(2)} | ${(c.diff * 100).toFixed(2)}% | ${c.compare.sampleCount} | ${c.compare.mean.toFixed(2)} | ${c.compare.p75.toFixed(2)} | ${c.compare.p99.toFixed(2)} | ${c.compare.moe.toFixed(2)} |\n`;
    });

    markdown += `</details>\n`;
  }

  markdown += `\nAdded benchmarks: ${results.added.length}\n`;
  if (results.added.length > 0) {
    markdown += `| Name | Median | Sample Count | Mean | P75 | P99 | Margin of Error |\n`;
    markdown += `| ---- | ------ | ------------ | ---- | --- | --- | --------------- |\n`;

    results.added.forEach((c) => {
      markdown += `| ${c.name} | ${c.median.toFixed(2)} | ${c.sampleCount} | ${c.mean.toFixed(2)} | ${c.p75.toFixed(2)} | ${c.p99.toFixed(2)} | ${c.moe.toFixed(2)} |\n`;
    });
  }

  markdown += `\nRemoved benchmarks: ${results.removed.length}\n`;
  results.removed.forEach((b) => {
    markdown += `- ${b.name}`;
  });

  return markdown;
}

async function main(baselinePath: string, comparePath: string, exportPath: string) {
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
  const markdown = generateResultMarkdown(results);

  await fs.writeFile(exportPath, markdown);
}

await main('../baseline.json', '../compare.json', '../benchmark-results.md');
