// @ts-check
/* eslint-disable no-console */

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
  if (results.changed.length > 0) {
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
    console.table(changedTable);
  }

  console.log(`Unchanged benchmarks: ${results.unchanged.length}`);
  if (results.unchanged.length > 0) {
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
    console.table(unchangedTable);
  }

  console.log(`Added benchmarks: ${results.added.length}`);
  results.added.forEach((b) => console.log(`- ${b.name}`));
  if (results.added.length > 0) {
    const addedTable = results.added.map((c) => ({
      name: c.name,
      medianBaseline: c.median.toFixed(2),
      sampleCount: c.sampleCount,
      mean: c.mean.toFixed(2),
      p75: c.p75.toFixed(2),
      p99: c.p99.toFixed(2),
      marginOfError: c.moe.toFixed(2),
    }));
    console.table(addedTable);
  }

  console.log(`Removed benchmarks: ${results.removed.length}`);
  results.removed.forEach((b) => console.log(`- ${b.name}`));
}

/**
 * @param {{added: Array<import('./compare-benchmark-results.types.js').BenchmarkResult>, removed: Array<import('./compare-benchmark-results.types.js').BenchmarkResult>, changed: Array<import('./compare-benchmark-results.types.js').BenchmarkComparison>, unchanged: Array<import('./compare-benchmark-results.types.js').BenchmarkComparison>, result: 'pass' | 'fail'}} results
 */
function generateResultMarkdown(results) {
  let markdown = '';

  markdown += `**Result**: ${results.result === 'pass' ? 'Pass ✅' : 'Fail ❌'}\n`;

  const fMs = (/** @type {number} */ number) => `${number.toFixed(2)}ms`;
  const fPerc = (/** @type {number} */ number) => `${number.toFixed(2)}%`;

  if (results.changed.length > 0) {
    markdown += `\n**Changed benchmarks**: ${results.changed.length}\n`;

    markdown += `| Name | Median (Baseline) | Median (This run) | Diff | Sample Count | Margin of Error |\n`;
    markdown += `| ---- | ----------------- | ----------------- | ---- | ------------ | --------------- |\n`;

    results.changed.forEach((r) => {
      markdown += `| ${r.name} | ${fMs(r.baseline.median)} | ${fMs(r.compare.median)} | ${fPerc(r.diff * 100)} | ${r.compare.sampleCount} | ${fPerc(r.compare.moe)} |\n`;
    });

    markdown += `<details>\n`;
    markdown += `<summary>Detailed Results</summary>\n\n`;
    markdown += `| Name | Median (Baseline) | Median (This run) | Diff | Sample Count | Min | Mean | P75 | P99 | Max | Margin of Error |\n`;
    markdown += `| ---- | ----------------- | ----------------- | ---- | ------------ | --- | ---- | --- | --- | --- | --------------- |\n`;

    results.changed.forEach((r) => {
      markdown += `| ${r.name} | ${fMs(r.baseline.median)} | ${fMs(r.compare.median)} | ${fPerc(r.diff * 100)} | ${r.compare.sampleCount} | ${fMs(r.compare.mean)} | ${fMs(r.compare.p75)} | ${fMs(r.compare.p99)} | ${fPerc(r.compare.moe)} |\n`;
    });

    markdown += `</details>\n`;
  }

  if (results.unchanged.length > 0) {
    markdown += `\n**Unchanged benchmarks**: ${results.unchanged.length}\n`;

    markdown += `<details>\n`;
    markdown += `<summary>Detailed Results</summary>\n\n`;

    markdown += `| Name | Median (Baseline) | Median (This run) | Diff | Sample Count | Min | Mean | P75 | P99 | Max | Margin of Error |\n`;
    markdown += `| ---- | ----------------- | ----------------- | ---- | ------------ | --- | ---- | --- | --- | --- | --------------- |\n`;

    results.unchanged.forEach((r) => {
      markdown += `| ${r.name} | ${fMs(r.baseline.median)} | ${fMs(r.compare.median)} | ${fPerc(r.diff * 100)} | ${r.compare.sampleCount} | ${fMs(r.compare.mean)} | ${fMs(r.compare.p75)} | ${fMs(r.compare.p99)} | ${fPerc(r.compare.moe)} |\n`;
    });

    markdown += `</details>\n`;
  }

  if (results.added.length > 0) {
    markdown += `\n**Added benchmarks**: ${results.added.length}\n`;
    markdown += `| Name | Median | Sample Count | Min | Mean | P75 | P99 | Max | Margin of Error |\n`;
    markdown += `| ---- | ------ | ------------ | --- | ---- | --- | --- | --- | --------------- |\n`;

    results.added.forEach((r) => {
      markdown += `| ${r.name} | ${fMs(r.median)} | ${r.sampleCount} | ${fMs(r.min)} | ${fMs(r.mean)} | ${fMs(r.p75)} | ${fMs(r.p99)} | ${fMs(r.max)} | ${fPerc(r.moe)} |\n`;
    });
  }

  if (results.removed.length > 0) {
    markdown += `\n**Removed benchmarks**: ${results.removed.length}\n`;
    results.removed.forEach((r) => {
      markdown += `- ${r.name}`;
    });
  }

  return markdown;
}

/**
 * @param {string | null} baselineJson
 * @param {string} compareJson
 * @param {number} threshold
 * @returns {Promise<{ result: 'pass' | 'fail', markdown: string }>}
 */
export async function compareResults(baselineJson, compareJson, threshold) {
  const compareBenchmarks = parseBenchmarkResults(compareJson);
  const baselineBenchmarks = baselineJson ? parseBenchmarkResults(baselineJson) : null;

  const results = processResults(compareBenchmarks, baselineBenchmarks, threshold);

  printResults(results);
  return { result: results.result, markdown: generateResultMarkdown(results) };
}
