import { test, expect } from "@playwright/test";

/**
 * Smoke Test - Landing Page Basic Functionality
 * Verifies that the basic landing page loads without SSR/content mapping errors
 */
test.describe("Landing Page Smoke Tests", () => {
  test("should load homepage without sectionId or composer errors", async ({ page }) => {
    const errors: string[] = [];

    // Capture console errors
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto("/");
    await page.waitForLoadState('domcontentloaded');

    // Check that page has loaded (basic smoke test)
    const bodyExists = await page.locator('body').count() > 0;
    expect(bodyExists).toBe(true);

    // Fail if any sectionId or composer related errors
    const criticalErrors = errors.filter(error =>
      error.includes('sectionId') ||
      error.includes('composer') ||
      error.includes('tracking.sectionId')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("should have basic HTML structure", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState('domcontentloaded');

    // Check basic HTML elements exist
    const htmlExists = await page.locator("html").count() > 0;
    const bodyExists = await page.locator("body").count() > 0;
    const headExists = await page.locator("head").count() > 0;

    expect(htmlExists && bodyExists && headExists).toBe(true);
  });

  test("should serve content without critical errors", async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto("/");
    const content = await page.content();

    // Ensure we have content
    expect(content.length).toBeGreaterThan(0);

    // Allow warnings but fail on critical errors
    const criticalErrors = errors.filter(error =>
      error.includes('sectionId') ||
      error.includes('composer') ||
      error.includes('tracking.sectionId') ||
      error.includes('TypeError') ||
      error.includes('ReferenceError')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
