import { test, expect } from "@playwright/test";

/**
 * Performance Budget Tests
 * Validates Core Web Vitals budgets in production build
 */

test.describe("Performance Budget Tests", () => {
  test("should meet LCP budget (≤2.5s)", async ({ page }) => {
    const startTime = Date.now();

    // Start LCP monitoring
    let lcpValue = 0;
    const observer = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry.entryType === "largest-contentful-paint") {
            resolve(lastEntry.startTime);
          }
        });
        observer.observe({ entryTypes: ["largest-contentful-paint"] });

        // Timeout after 10s
        setTimeout(() => resolve(10000), 10000);
      });
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    lcpValue = await observer;
    const loadTime = Date.now() - startTime;

    console.log(`PERF LCP: ${lcpValue}ms, Total Load: ${loadTime}ms`);

    // Budget: LCP ≤ 2.5s
    expect(lcpValue).toBeLessThanOrEqual(2500);
  });

  test("should meet TTI budget (≤3.5s)", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Wait for network idle (heuristic for TTI)
    await page.waitForLoadState("networkidle");
    const tti = Date.now() - startTime;

    console.log(`PERF TTI: ${tti}ms`);

    // Budget: TTI ≤ 3.5s
    expect(tti).toBeLessThanOrEqual(3500);
  });

  test("should have acceptable First Contentful Paint", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Wait for first paint
    await page.waitForFunction(() => {
      return performance.getEntriesByType("paint").length > 0;
    });

    const fcp = Date.now() - startTime;
    console.log(`PERF FCP: ${fcp}ms`);

    // FCP should be reasonable (< 2s)
    expect(fcp).toBeLessThanOrEqual(2000);
  });

  test("should load without long tasks blocking interactivity", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Check for long tasks (>50ms)
    const longTasks = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let longTaskCount = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              longTaskCount++;
            }
          }
        });
        observer.observe({ entryTypes: ["longtask"] });

        setTimeout(() => resolve(longTaskCount), 3000);
      });
    });

    console.log(`PERF Long Tasks (>50ms): ${longTasks}`);

    // Should have minimal long tasks
    expect(longTasks).toBeLessThanOrEqual(3);
  });
});
