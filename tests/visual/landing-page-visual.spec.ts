import { test, expect } from "@playwright/test";

/**
 * Visual Regression Tests for Landing Page
 * Tests critical visual elements and layouts
 */
test.describe("Landing Page Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation: none !important;
          transition: none !important;
        }
      `,
    });
  });

  test("@visual-regression should match hero section visual baseline", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for hero section to be fully loaded
    await page.waitForSelector('[data-testid="hero-section"]');
    await page.waitForTimeout(1000); // Let images/fonts load

    // Take screenshot of hero section
    await expect(page.locator('[data-testid="hero-section"]')).toHaveScreenshot(
      "hero-section-baseline.png",
      {
        threshold: 0.1,
        fullPage: false,
      },
    );
  });

  test("@visual-regression should match features section visual baseline", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for features section
    await page.waitForSelector('[data-testid="features-section"]');
    await page.waitForTimeout(500);

    // Scroll to features section for lazy loading
    await page
      .locator('[data-testid="features-section"]')
      .scrollIntoViewIfNeeded();

    // Take screenshot
    await expect(
      page.locator('[data-testid="features-section"]'),
    ).toHaveScreenshot("features-section-baseline.png", {
      threshold: 0.1,
      fullPage: false,
    });
  });

  test("@visual-regression should match pricing section visual baseline", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for pricing section
    await page.waitForSelector('[data-testid="pricing-section"]');
    await page.waitForTimeout(500);

    // Scroll to pricing section
    await page
      .locator('[data-testid="pricing-section"]')
      .scrollIntoViewIfNeeded();

    // Take screenshot
    await expect(
      page.locator('[data-testid="pricing-section"]'),
    ).toHaveScreenshot("pricing-section-baseline.png", {
      threshold: 0.1,
      fullPage: false,
    });
  });

  test("@visual-regression should match full page layout", async ({ page }) => {
    await page.goto("/");

    // Wait for all sections to load
    await page.waitForSelector('[data-testid="footer-section"]');
    await page.waitForTimeout(2000); // Let everything settle

    // Take full page screenshot
    await expect(page).toHaveScreenshot("full-page-baseline.png", {
      threshold: 0.05, // Stricter threshold for full page
      fullPage: true,
    });
  });

  test("@visual-regression should match mobile layout", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");

    // Wait for mobile layout to stabilize
    await page.waitForSelector('[data-testid="hero-section"]');
    await page.waitForTimeout(1500);

    // Take mobile screenshot
    await expect(page).toHaveScreenshot("mobile-layout-baseline.png", {
      threshold: 0.1,
      fullPage: true,
    });
  });
});
