// @ts-check
/* eslint-disable no-console */
import fs from 'node:fs/promises';

/**
 * @param {any} data
 * @returns {Array<import('./compare-benchmark-results.types.js').BenchmarkResult>}
 */
function parseBenchmarkResults(data) {
  const benchmarks = data.files
    ?.flatMap((/** @type {{ groups: any[]; }} */ file) =>
      file?.groups?.flatMap((g) => g?.benchmarks),
    )
    .filter(
      (
        /** @type {import('./compare-benchmark-results.types.js').BenchmarkResult | undefined} */ bench,
      ) => bench !== undefined,
    );

  return benchmarks;
}

/**
 *
 * @param {Array<import('./compare-benchmark-results.types.js').BenchmarkResult>} compareBenchmarks
 * @param {Array<import('./compare-benchmark-results.types.js').BenchmarkResult> | null} baselineBenchmarks
 * @param {number} threshold
 * @returns {{added: Array<import('./compare-benchmark-results.types.js').BenchmarkResult>, removed: Array<import('./compare-benchmark-results.types.js').BenchmarkResult>, changed: Array<import('./compare-benchmark-results.types.js').BenchmarkComparison>, unchanged: Array<import('./compare-benchmark-results.types.js').BenchmarkComparison>, result: 'pass' | 'fail'}}
 */
function processResults(compareBenchmarks, baselineBenchmarks, threshold) {
  const added = [];
  const removed = [];
  const unchanged = [];
  const changed = [];

  const compareMap = new Map(compareBenchmarks.map((b) => [b.name, b]));
  const baselineMap = new Map(baselineBenchmarks?.map((b) => [b.name, b]) ?? []);

  for (const [_, baselineBench] of baselineMap) {
    const compareBench = compareMap.get(baselineBench.name);

    if (!compareBench) {
      removed.push(baselineBench);
    } else {
      const diff = (compareBench.median - baselineBench.median) / baselineBench.median;
      const benchmark = {
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

/**
 * @param {{added: Array<import('./compare-benchmark-results.types.js').BenchmarkResult>, removed: Array<import('./compare-benchmark-results.types.js').BenchmarkResult>, changed: Array<import('./compare-benchmark-results.types.js').BenchmarkComparison>, unchanged: Array<import('./compare-benchmark-results.types.js').BenchmarkComparison>, result: 'pass' | 'fail'}} results
 */
function printResults(results) {
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

/**
 * @param {{added: Array<import('./compare-benchmark-results.types.js').BenchmarkResult>, removed: Array<import('./compare-benchmark-results.types.js').BenchmarkResult>, changed: Array<import('./compare-benchmark-results.types.js').BenchmarkComparison>, unchanged: Array<import('./compare-benchmark-results.types.js').BenchmarkComparison>, result: 'pass' | 'fail'}} results
 */
function generateResultMarkdown(results) {
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

/**
 *
 * @param {string} baselinePath
 * @param {string} comparePath
 * @param {number} threshold
 * @returns {Promise<{ result: 'pass' | 'fail', markdown: string }>}
 */
export async function compareResults(baselinePath, comparePath, threshold) {
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

  const results = processResults(compareBenchmarks, baselineBenchmarks, threshold);

  printResults(results);
  return { result: results.result, markdown: generateResultMarkdown(results) };
}
