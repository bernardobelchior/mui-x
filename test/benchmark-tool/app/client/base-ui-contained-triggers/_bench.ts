import { test } from '@playwright/test';
import { getRouteFromFilename, goToPage } from '../../../utils/goToPage';
import { bench } from '../../../utils/bench';

const route = getRouteFromFilename(import.meta.filename);

await bench({ warmupRuns: 5, iterations: 10, route }, (type, iteration, { renders }) => {
  test(`Base UI Contained Triggers - ${type} run ${iteration + 1}`, async ({ page }) => {
    await goToPage(import.meta.filename, page, renders);

    // Wait for the browser to be idle before finishing the iteration
    await page.evaluate(() => {
      return new Promise((resolve) => {
        requestIdleCallback(resolve, { timeout: 5000 });
      });
    });
  });
});
