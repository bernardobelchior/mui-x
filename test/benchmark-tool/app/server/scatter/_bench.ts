import { test, expect } from '@playwright/test';
import { goToPage, getRouteFromFilename } from '../../../utils/goToPage';
import { bench } from '../../../utils/bench';

const route = getRouteFromFilename(import.meta.filename);

await bench({ warmupRuns: 10, iterations: 50, route }, (type, iteration, { renders }) => {
  test(`benchmark scatter render - ${type} run ${iteration + 1}`, async ({ page }) => {
    await goToPage(import.meta.filename, page, renders);

    // Wait for chart to be visible
    await expect(page.locator('svg:not([aria-hidden="true"])')).toBeVisible();
  });
});
