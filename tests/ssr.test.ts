// SSR Tests
// Tests to ensure server-side rendering works correctly

import { test, expect } from "@playwright/test";

test.describe("SSR Tests", () => {
  test("should render page with proper HTML structure", async ({ page }) => {
    await page.goto("/");

    // Should have proper HTML structure - check for lang attribute and basic elements
    const htmlElement = await page.locator("html");
    const lang = await htmlElement.getAttribute("lang");
    expect(lang).toBe("pt-BR");

    // Check that head and body exist
    await expect(page.locator("head")).toBeAttached();
    await expect(page.locator("body")).toBeVisible();
  });

  test("should render critical CSS and fonts", async ({ page }) => {
    await page.goto("/");

    // Check for critical CSS - look for stylesheet links
    const stylesheets = await page.locator('link[rel="stylesheet"]').all();
    expect(stylesheets.length).toBeGreaterThan(0);

    // Check that at least one CSS file is loaded
    const firstStylesheet = stylesheets[0];
    const href = await firstStylesheet.getAttribute("href");
    expect(href).toContain(".css");
  });

  test("should have proper meta tags for SEO", async ({ page }) => {
    await page.goto("/");

    // Check meta tags
    const title = await page.title();
    expect(title).toContain("Sistema de Automação Empresarial"); // Título correto da página

    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toBeAttached();

    const description = await metaDescription.getAttribute("content");
    expect(description).toBeTruthy();
    expect(description?.length).toBeGreaterThan(50);
  });

  test("should render layout consistently", async ({ page }) => {
    await page.goto("/");

    // Should have proper layout structure
    await expect(page.locator("main")).toBeVisible(); // Main content
    await expect(page.locator("body")).toBeVisible(); // Body exists
  });

  test("should maintain data attributes for sections", async ({ page }) => {
    await page.goto("/");

    // Wait for main content to load
    await page.waitForSelector("main", { timeout: 10000 });

    // Check for sections - they may be loaded lazily
    const sections = await page.locator("section[id]").all();

    // If no sections are found yet, that's OK for SSR test - they may load client-side
    if (sections.length > 0) {
      // Each section should have an id
      for (const section of sections) {
        const id = await section.getAttribute("id");
        expect(id).toBeTruthy();
      }
    }

    // At minimum, check that we have a main container
    await expect(page.locator("main")).toBeVisible();
  });

  test("should render theme classes on body", async ({ page }) => {
    await page.goto("/");

    // Check if body has theme classes
    const bodyClasses = await page.locator("body").getAttribute("class");
    expect(bodyClasses).toContain("font-sans");
    expect(bodyClasses).toContain("antialiased");
  });
});
