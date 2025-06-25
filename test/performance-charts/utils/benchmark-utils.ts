import { cdp, server } from '@vitest/browser/context';

const baseDir = './traces';

export async function startBenchmark(name: string) {
  await cdp().send('Tracing.start', {
    transferMode: 'ReturnAsStream',
    traceConfig: {
      includedCategories: [
        // JavaScript execution traces
        'v8.execute',
        'v8.compile',
        'v8.parse',
        'v8.gc',
        'v8.gc_stats',
        'v8.runtime_stats',
        'v8.wasm',

        // Browser events
        'blink.console',
        'blink.user_timing',
        'benchmark',
        'devtools.timeline',
        'disabled-by-default-devtools.timeline',
        'disabled-by-default-devtools.timeline.frame',
        'disabled-by-default-devtools.timeline.stack',

        // Network and loading
        'netlog',
        'loading',
        'navigation',

        // Rendering
        'cc',
        'gpu',
        'viz',
        'blink',
        'renderer.scheduler',

        // JavaScript-specific categories that show in Performance tab
        'disabled-by-default-v8.cpu_profiler',
        'disabled-by-default-v8.runtime_stats',
        'disabled-by-default-devtools.timeline.invalidationTracking',
      ],
      recordMode: 'recordContinuously',
    },
  });

  // Start Chrome DevTools performance profiling
  await cdp().send('Performance.enable');
  await cdp().send('Runtime.enable');
  await cdp().send('HeapProfiler.enable');

  // Start CPU profiling
  await cdp().send('Profiler.enable');
  await cdp().send('Profiler.start');

  // Start heap profiling
  await cdp().send('HeapProfiler.startSampling');

  // Mark the start of benchmark
  await cdp().send('Runtime.evaluate', {
    expression: `performance.mark('${name}-start');`,
  });
}

export async function endBenchmark(name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // Mark the end of benchmark
  await cdp().send('Runtime.evaluate', {
    expression: `
      performance.mark('${name}-end');
      performance.measure('${name}', '${name}-start', '${name}-end');
      `,
  });

  // Stop profiling and collect data
  const cpuProfile = await cdp().send('Profiler.stop');
  const heapProfile = await cdp().send('HeapProfiler.stopSampling');
  const metrics = await cdp().send('Performance.getMetrics');

  // Stop tracing and save
  const { promise: tracingCompletePromise, resolve } = Promise.withResolvers<void>();
  const onTracingComplete = async (event: Protocol.Tracing.tracingCompletePayload) => {
    const tracePath = `${baseDir}/${name}-${timestamp}.json`;

    if (event.stream !== undefined) {
      const { data } = await cdp().send('IO.read', { handle: event.stream });
      await cdp().send('IO.close', { handle: event.stream });
      await server.commands.writeFile(tracePath, data);
    } else {
      console.warn(`No trace stream available for ${name}.`);
    }

    cdp().off('Tracing.tracingComplete', onTracingComplete);
    resolve();
  };
  cdp().on('Tracing.tracingComplete', onTracingComplete);
  await cdp().send('Tracing.end');

  // Save all performance data
  const cpuPath = `${baseDir}/${name}-cpu-${timestamp}.json`;
  const heapPath = `${baseDir}/${name}-heap-${timestamp}.json`;
  const metricsPath = `${baseDir}/${name}-metrics-${timestamp}.json`;

  await Promise.all([
    // writeFile(tracePath, traceBuffer),
    server.commands.writeFile(cpuPath, JSON.stringify(cpuProfile, null, 2)),
    server.commands.writeFile(heapPath, JSON.stringify(heapProfile, null, 2)),
    server.commands.writeFile(
      metricsPath,
      JSON.stringify({ metrics: metrics.metrics, timestamp }, null, 2),
    ),
  ]);

  await tracingCompletePromise;
}
