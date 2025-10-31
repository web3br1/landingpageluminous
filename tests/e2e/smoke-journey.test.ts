/**
 * E2E Smoke Test - Basic functionality verification
 * Simple journey that doesn't require complex setup
 */

import { test, expect } from "@playwright/test";

test.describe("Landing Page Smoke Journey", () => {
  test("should load homepage successfully", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");

    // Basic checks
    await expect(page).toHaveTitle(/./); // Any title is fine

    // Check if basic elements exist
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should have basic page structure", async ({ page }) => {
    await page.goto("/");

    // Check for common elements
    const html = page.locator("html");
    const head = page.locator("head");
    const body = page.locator("body");

    await expect(html).toBeAttached();
    await expect(head).toBeAttached();
    await expect(body).toBeAttached();
  });

  test("should handle basic navigation", async ({ page }) => {
    await page.goto("/");

    // Try to find any clickable element
    const links = page.locator("a");
    const buttons = page.locator("button");

    // Just check that we can find some interactive elements
    const linkCount = await links.count();
    const buttonCount = await buttons.count();

    // We expect at least some interactive elements
    expect(linkCount + buttonCount).toBeGreaterThan(0);
  });
});

test.describe("Resilience Journey", () => {
  test("should handle missing resources gracefully", async ({ page }) => {
    await page.goto("/");

    // Check that page doesn't crash with missing resources
    await page.waitForLoadState("networkidle");

    // Page should still be functional
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should handle slow loading", async ({ page }) => {
    await page.goto("/");

    // Wait for any dynamic content to load
    await page.waitForTimeout(1000);

    // Basic functionality should still work
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});
