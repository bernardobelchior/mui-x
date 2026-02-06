import { test, expect } from '@playwright/test';
import { getRouteFromFilename, goToPage } from '../../../utils/goToPage';
import { bench } from '../../../utils/bench';

const route = getRouteFromFilename(import.meta.filename);

await bench({ warmupRuns: 3, iterations: 10, route }, (type, iteration, { renders }) => {
  test(`benchmark render - ${type} run ${iteration + 1}`, async ({ page }) => {
    const { startBench, endBench } = await goToPage(import.meta.filename, page, renders);

    // Wait for chart to be visible
    const svg = page.locator('svg:not([aria-hidden="true"])');
    await expect(svg).toBeVisible();

    // Scroll from the center of the SVG
    const boundingBox = (await svg.boundingBox())!;
    const centerX = boundingBox.width / 2;
    const centerY = boundingBox.height / 2;

    await svg.hover({ position: { x: centerX, y: centerY } });

    const deltaY = -1000; // Negative for zooming in
    const steps = 20;

    startBench();

    for (let i = 0; i < steps; i += 1) {
      // Scroll in smaller increments to simulate a smoother zoom
      // eslint-disable-next-line no-await-in-loop
      await page.mouse.wheel(0, deltaY / steps);
    }

    endBench();
  });
});
