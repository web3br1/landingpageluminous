import { test, expect } from "@playwright/test";

/**
 * Smoke Resilience Test - Landing Page Error Handling
 * Verifies that the landing page handles basic network scenarios
 */
test.describe("Landing Page Resilience Tests", () => {
  test("should load with basic network conditions", async ({ page }) => {
    const errors: string[] = [];

    // Capture errors
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Basic smoke check
    const bodyExists = (await page.locator("body").count()) > 0;
    expect(bodyExists).toBe(true);

    // Should not have critical content mapping errors
    const criticalErrors = errors.filter(
      (error) =>
        error.includes("sectionId") ||
        error.includes("composer") ||
        error.includes("tracking.sectionId"),
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("should serve content when assets fail", async ({ page }) => {
    const errors: string[] = [];

    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    // Mock failing images but allow main content
    await page.route("**/images/**", (route) => route.abort());

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Page should still load main content
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);

    // Allow image errors but not content mapping errors
    const criticalErrors = errors.filter(
      (error) =>
        error.includes("sectionId") ||
        error.includes("composer") ||
        error.includes("tracking.sectionId"),
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
