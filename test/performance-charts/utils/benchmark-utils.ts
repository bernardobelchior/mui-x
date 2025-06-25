import { cdp, CDPSession, server } from '@vitest/browser/context';

const baseDir = './traces';

export class PerformanceTracer {
  client: CDPSession | null = null;

  timestamp: string | null = null;

  async startBenchmark(name: string) {
    console.log('Starting performance trace...');
    this.client = cdp();
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    await this.client.send('Tracing.start', {
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
    await this.client.send('Performance.enable');
    await this.client.send('Runtime.enable');
    await this.client.send('HeapProfiler.enable');

    // Start CPU profiling
    await this.client.send('Profiler.enable');
    await this.client.send('Profiler.start');

    // Start heap profiling
    await this.client.send('HeapProfiler.startSampling');

    // Mark the start of benchmark
    await this.client.send('Runtime.evaluate', {
      expression: `performance.mark('${name}-start');`,
    });
  }

  async endBenchmark(name: string) {
    console.log('Ending performance trace...');
    // Mark the end of benchmark
    await this.client.send('Runtime.evaluate', {
      expression: `
      performance.mark('${name}-end');
      performance.measure('${name}', '${name}-start', '${name}-end');
      `,
    });

    // Stop profiling and collect data
    const cpuProfile = await this.client.send('Profiler.stop');
    const heapProfile = await this.client.send('HeapProfiler.stopSampling');
    const metrics = await this.client.send('Performance.getMetrics');

    // Stop tracing and save
    const { promise: tracingCompletePromise, resolve } = Promise.withResolvers<void>();
    this.client.once('Tracing.tracingComplete', async (event) => {
      console.log('Tracing complete...');
      const tracePath = `${baseDir}/${name}-${this.timestamp}.json`;

      if (event.stream !== undefined) {
        const { data } = await this.client!.send('IO.read', { handle: event.stream });
        await this.client.send('IO.close', { handle: event.stream });
        await server.commands.writeFile(tracePath, data);
      } else {
        console.warn(`No trace stream available for ${name}.`);
      }

      resolve();
    });
    await this.client.send('Tracing.end');

    // Save all performance data
    const cpuPath = `${baseDir}/${name}-cpu-${this.timestamp}.json`;
    const heapPath = `${baseDir}/${name}-heap-${this.timestamp}.json`;
    const metricsPath = `${baseDir}/${name}-metrics-${this.timestamp}.json`;

    await Promise.all([
      // writeFile(tracePath, traceBuffer),
      server.commands.writeFile(cpuPath, JSON.stringify(cpuProfile, null, 2)),
      server.commands.writeFile(heapPath, JSON.stringify(heapProfile, null, 2)),
      server.commands.writeFile(
        metricsPath,
        JSON.stringify({ metrics: metrics.metrics, timestamp: this.timestamp }, null, 2),
      ),
    ]);

    console.log('Ended performance trace...');

    await tracingCompletePromise;

    console.log('Awaited performance trace...');
  }
}
