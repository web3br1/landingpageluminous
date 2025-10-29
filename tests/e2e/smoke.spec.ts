import { test, expect } from "@playwright/test";

/**
 * Smoke Test - Landing Page Basic Functionality
 * Verifies that the basic landing page loads and displays essential elements
 */
test.describe("Landing Page Smoke Tests", () => {
  test("should load homepage and display title", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");

    // Check if page loads (basic smoke test)
    await expect(page).toHaveTitle(/Landing Page|Luminaris|SaaS/i);

    // Verify page has loaded by checking for body element
    await expect(page.locator("body")).toBeVisible();
  });

  test("should have basic HTML structure", async ({ page }) => {
    await page.goto("/");

    // Check for basic HTML elements that should exist
    await expect(page.locator("html")).toBeVisible();
    await expect(page.locator("head")).toBeVisible();
    await expect(page.locator("body")).toBeVisible();
  });
});
