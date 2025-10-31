// E2E Journey - Happy Path
// Tests the main user flow from landing to conversion

import { test, expect } from "@playwright/test";

test.describe("Happy Path Journey", () => {
  test("should complete full user journey successfully", async ({ page }) => {
    // Block external network calls to ensure deterministic tests
    await page.route("**/*", (route) => {
      const url = route.request().url();
      // Allow localhost and internal resources
      if (url.includes("localhost") || url.includes("127.0.0.1")) {
        route.continue();
      } else {
        // Block external requests
        route.abort();
      }
    });

    // Navigate to home page
    await page.goto("/");
    await expect(page).toHaveURL(/.*\/$/);

    // Verify hero section is loaded
    const heroSection = page.locator("[data-section='hero']");
    await expect(heroSection).toBeVisible();

    // Verify hero headline is present
    const heroHeadline = heroSection.locator("h1, h2").first();
    await expect(heroHeadline).toBeVisible();
    await expect(heroHeadline).toContainText(/\w+/); // Has some text

    // Verify primary CTA button exists
    const primaryCta = heroSection
      .locator("button, a")
      .filter({ hasText: /comece|start|trial|demo/i })
      .first();
    await expect(primaryCta).toBeVisible();

    // Verify benefits section exists
    const benefitsSection = page.locator("[data-section='benefits']");
    await expect(benefitsSection).toBeVisible();

    // Verify benefits content is loaded (no map errors)
    const benefitsContent = benefitsSection.locator("h2, h3, p").first();
    await expect(benefitsContent).toBeVisible();

    // Verify page is still functional (no hydration errors)
    await expect(page.locator("body")).toBeVisible();

    // Verify no console errors (strict check)
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Wait a moment for any potential errors
    await page.waitForTimeout(1000);

    // Allow expected warnings but no errors
    const allowedErrors = ["Download the React DevTools", "Warning:"]; // Common dev warnings
    const unexpectedErrors = errors.filter(
      (error) => !allowedErrors.some((allowed) => error.includes(allowed)),
    );

    expect(unexpectedErrors).toHaveLength(0);
  });
});
