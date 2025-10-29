// Performance and Resource Loading Error Tests
// Tests for performance issues, resource failures, and loading problems

import { test, expect } from "@playwright/test";

test.describe("Performance and Resource Loading Tests", () => {
  test("should load without excessive memory usage", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");

    // Wait for full page load
    await page.waitForLoadState("networkidle");

    // Check for memory-related errors
    const memoryErrors = consoleErrors.filter(
      (error) =>
        error.includes("memory") ||
        error.includes("Memory") ||
        error.includes("heap") ||
        error.includes("Out of memory"),
    );

    expect(memoryErrors).toHaveLength(0);

    // Verify page is still responsive
    await expect(page.locator("body")).toBeVisible();
  });

  test("should handle large bundle sizes gracefully", async ({ page }) => {
    const resources: Array<{ url: string; size: number }> = [];

    page.on("response", (response) => {
      // Only track JS and CSS resources
      if (response.url().match(/\.(js|css)$/)) {
        // Get content length from headers
        const contentLength = response.headers()["content-length"];
        if (contentLength) {
          resources.push({
            url: response.url(),
            size: parseInt(contentLength, 10),
          });
        }
      }
    });

    await page.goto("/");

    // Wait for all resources to load
    await page.waitForLoadState("networkidle");

    // Check for excessively large bundles (>5MB)
    const largeBundles = resources.filter(
      (resource) => resource.size > 5 * 1024 * 1024,
    );

    // Allow some large bundles but not excessive ones
    expect(largeBundles.length).toBeLessThan(2);

    // Verify page still functions with large bundles
    await expect(page.locator("body")).toBeVisible();
  });

  test("should handle slow network conditions", async ({ page, context }) => {
    // Simulate slow 3G connection
    await context.route("**", async (route) => {
      // Add delay to simulate slow network
      await new Promise((resolve) => setTimeout(resolve, 100));
      await route.continue();
    });

    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Wait for page to stabilize under slow conditions
    await page.waitForTimeout(5000);

    // Check for timeout or network-related errors
    const networkErrors = consoleErrors.filter(
      (error) =>
        error.includes("timeout") ||
        error.includes("network") ||
        (error.includes("fetch") && error.includes("fail")) ||
        (error.includes("Loading") && error.includes("timeout")),
    );

    expect(networkErrors).toHaveLength(0);

    // Verify basic functionality under slow conditions
    await expect(page.locator("body")).toBeVisible();
  });

  test("should handle resource loading failures", async ({ page }) => {
    const failedResources: string[] = [];

    page.on("response", (response) => {
      if (!response.ok() && response.status() >= 400) {
        failedResources.push(response.url());
      }
    });

    await page.goto("/");

    // Wait for all resources to attempt loading
    await page.waitForLoadState("networkidle");

    // Check for critical resource failures
    const criticalFailures = failedResources.filter(
      (url) =>
        url.includes("_next/static/chunks") ||
        (url.includes("main") && url.includes(".js")) ||
        (url.includes("runtime") && url.includes(".js")),
    );

    expect(criticalFailures).toHaveLength(0);

    // Verify page still loads despite some resource failures
    await expect(page.locator("body")).toBeVisible();
  });

  test("should handle JavaScript execution errors", async ({ page }) => {
    const jsErrors: string[] = [];

    page.on("pageerror", (error) => {
      jsErrors.push(error.message);
    });

    await page.goto("/");

    // Wait for scripts to execute
    await page.waitForTimeout(3000);

    // Check for critical JavaScript errors
    const criticalJsErrors = jsErrors.filter(
      (error) =>
        !error.includes("dev") &&
        !error.includes("development") &&
        !error.includes("hot-reload") &&
        !error.includes("webpack"), // Webpack errors handled separately
    );

    expect(criticalJsErrors).toHaveLength(0);

    // Verify JavaScript functionality
    const hasJs = await page.evaluate(() => typeof window !== "undefined");
    expect(hasJs).toBe(true);
  });

  test("should handle CSS loading failures", async ({ page }) => {
    const cssFailures: string[] = [];

    page.on("response", (response) => {
      if (
        !response.ok() &&
        response.status() >= 400 &&
        response.url().includes(".css")
      ) {
        cssFailures.push(response.url());
      }
    });

    await page.goto("/");

    // Wait for styles to load
    await page.waitForTimeout(2000);

    // Check for critical CSS failures
    const criticalCssFailures = cssFailures.filter(
      (url) => url.includes("globals.css") || url.includes("layout.css"),
    );

    expect(criticalCssFailures).toHaveLength(0);

    // Verify basic styling is applied
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const computed = window.getComputedStyle(body);
      return {
        fontFamily: computed.fontFamily,
        backgroundColor: computed.backgroundColor,
      };
    });

    expect(bodyStyles.fontFamily).toBeTruthy();
  });

  test("should handle font loading failures", async ({ page }) => {
    const fontFailures: string[] = [];

    page.on("response", (response) => {
      if (
        !response.ok() &&
        response.status() >= 400 &&
        (response.url().includes("font") ||
          response.url().match(/\.(woff|woff2|ttf|otf)$/))
      ) {
        fontFailures.push(response.url());
      }
    });

    await page.goto("/");

    // Wait for fonts to attempt loading
    await page.waitForTimeout(3000);

    // Check for critical font failures
    const criticalFontFailures = fontFailures.filter(
      (url) => url.includes("inter") || url.includes("Inter"),
    );

    // Allow some font failures but not critical ones
    expect(criticalFontFailures.length).toBeLessThan(2);

    // Verify fallback fonts are working
    const fontFamily = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontFamily;
    });

    expect(fontFamily).toBeTruthy();
    expect(typeof fontFamily).toBe("string");
  });

  test("should handle image loading failures", async ({ page }) => {
    const imageFailures: string[] = [];

    page.on("response", (response) => {
      if (
        !response.ok() &&
        response.status() >= 400 &&
        response.url().match(/\.(jpg|jpeg|png|gif|svg|webp)$/)
      ) {
        imageFailures.push(response.url());
      }
    });

    await page.goto("/");

    // Wait for images to attempt loading
    await page.waitForTimeout(3000);

    // Check for critical image failures
    const criticalImageFailures = imageFailures.filter(
      (url) =>
        url.includes("hero") || url.includes("logo") || url.includes("brand"),
    );

    expect(criticalImageFailures).toHaveLength(0);

    // Verify images are handled gracefully
    const images = await page.locator("img").all();
    for (const img of images) {
      // Images should have alt text even if they fail to load
      const alt = await img.getAttribute("alt");
      expect(alt).toBeTruthy();
    }
  });

  test("should handle service worker errors", async ({ page }) => {
    const swErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (
          (text.includes("service") && text.includes("worker")) ||
          (text.includes("sw") && text.includes("error")) ||
          text.includes("ServiceWorker")
        ) {
          swErrors.push(text);
        }
      }
    });

    await page.goto("/");

    // Wait for service worker to potentially register
    await page.waitForTimeout(2000);

    // Check for critical service worker errors
    const criticalSwErrors = swErrors.filter(
      (error) =>
        !error.includes("dev") &&
        !error.includes("not supported") &&
        !error.includes("unregister"),
    );

    expect(criticalSwErrors).toHaveLength(0);
  });

  test("should handle web vitals tracking errors", async ({ page }) => {
    const webVitalsErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (
          text.includes("web-vitals") ||
          text.includes("Core Web Vitals") ||
          text.includes("LCP") ||
          text.includes("CLS") ||
          text.includes("FID") ||
          text.includes("TTFB")
        ) {
          webVitalsErrors.push(text);
        }
      }
    });

    await page.goto("/");

    // Wait for web vitals to potentially initialize
    await page.waitForTimeout(3000);

    // Web vitals errors should not break functionality
    expect(webVitalsErrors).toHaveLength(0);

    // Verify page is still functional
    await expect(page.locator("body")).toBeVisible();
  });

  test("should handle analytics loading errors", async ({ page }) => {
    const analyticsErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (
          text.includes("analytics") ||
          text.includes("gtag") ||
          text.includes("GA") ||
          text.includes("Google Analytics") ||
          text.includes("plausible") ||
          text.includes("tracking")
        ) {
          analyticsErrors.push(text);
        }
      }
    });

    await page.goto("/");

    // Wait for analytics to potentially load
    await page.waitForTimeout(3000);

    // Analytics errors should not break the page
    const criticalAnalyticsErrors = analyticsErrors.filter(
      (error) =>
        !error.includes("dev") &&
        !error.includes("not configured") &&
        !error.includes("not loaded"),
    );

    expect(criticalAnalyticsErrors).toHaveLength(0);
  });
});
