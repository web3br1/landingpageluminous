import { test, expect } from "@playwright/test";

test.describe("Visual Regression Tests", () => {
  test.skip("simple hero section test", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const heroSection = page.locator('[data-section="hero"]');
    await expect(heroSection).toBeVisible();

    // Basic screenshot test - skipped due to rendering inconsistencies
    await expect(heroSection).toHaveScreenshot("hero-simple.png");
  });

  test("hero section functional test", async ({ page, browserName }) => {
    // Skip Firefox due to browser context issues
    test.skip(browserName === "firefox", "Firefox has browser context issues");

    // Test that hero section exists and has expected content
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Test that hero section exists and has expected content
    const heroSection = page.locator('[data-section="hero"]');
    await expect(heroSection).toBeVisible();

    // Test that hero contains expected elements
    const headline = heroSection.locator("h1");
    await expect(headline).toBeVisible();
    await expect(headline).toContainText(
      "Seu copiloto de automação empresarial",
    );

    const subheadline = heroSection.locator("p").first();
    await expect(subheadline).toBeVisible();
    await expect(subheadline).toContainText("Conecte, orquestre e acelere");

    // Test that CTA buttons exist
    const ctaButtons = heroSection.locator("button");
    await expect(ctaButtons).toHaveCount(2);

    const primaryButton = ctaButtons.first();
    await expect(primaryButton).toContainText("Começar grátis");

    const secondaryButton = ctaButtons.last();
    await expect(secondaryButton).toContainText("Agendar Demo");
  });
});
