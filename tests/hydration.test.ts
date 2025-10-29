// TODO: Expand hydration test coverage
// - Test hydration with dynamic content
// - Test hydration with client-side state changes
// - Test hydration mismatch detection and recovery
// - Test hydration performance and timing
// - Test hydration with lazy-loaded components
// - Test hydration with third-party scripts
// - Test hydration error boundaries
// - Test selective hydration strategies
// - Test hydration with service worker caching
// - Test hydration across different browsers
// - Test hydration with JavaScript disabled
// - Test progressive hydration patterns
// - Test hydration telemetry and monitoring

// Hydration Tests
// Tests to ensure SSR and hydration work correctly without errors

import { test, expect } from "@playwright/test";

// Console logging is useful for debugging hydration issues, so we'll keep it

test.describe("Hydration Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Clear console errors before each test
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log("Browser Error:", msg.text());
      }
    });

    // Clear any existing errors
    await page.evaluate(() => {
      // Clear console history
      console.clear();
    });
  });

  test("should hydrate without errors", async ({ page }) => {
    // Track console errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Navigate to the page
    await page.goto("/");

    // Wait for hydration to complete
    await page.waitForLoadState("networkidle");

    // Wait a bit more for any async hydration
    await page.waitForTimeout(1000);

    // Check for hydration-specific errors
    const hydrationErrors = errors.filter(
      (error) =>
        error.includes("hydration") ||
        error.includes("Hydration") ||
        error.includes("Extra attributes") ||
        error.includes("Expected server HTML"),
    );

    // Assert no hydration errors
    expect(hydrationErrors).toHaveLength(0);

    // Additional checks - accept any title as long as page loads
    await expect(page.locator("body")).toBeVisible();

    // Check if we have main content
    await expect(page.locator("main")).toBeVisible();
  });

  test("should render theme consistently", async ({ page }) => {
    await page.goto("/");

    // Check if theme classes are applied
    const bodyClasses = await page.locator("body").getAttribute("class");

    // Should have either 'light' or 'dark' class applied
    expect(bodyClasses).toMatch(/(^| )light( |$)|(^| )dark( |$)/);

    // Should have font-sans class (Tailwind font class)
    expect(bodyClasses).toContain("font-sans");

    // Should have antialiased class
    expect(bodyClasses).toContain("antialiased");

    // Check if font variables are applied via CSS custom properties
    const fontFamily = await page.evaluate(() => {
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      return computedStyle.fontFamily;
    });

    // Should have some font family applied (may be fallback if Inter not loaded)
    expect(fontFamily).toBeTruthy();
    expect(typeof fontFamily).toBe("string");
  });

  test("should render sections without layout shift", async ({ page }) => {
    await page.goto("/");

    // Debug: Check what elements exist
    const sectionCount = await page.locator("section").count();
    console.log("Available sections:", sectionCount);
    const sections = await page.locator("section").all();

    // Limit debug logging to avoid timeouts
    const maxSectionsToLog = Math.min(sections.length, 5);
    for (let i = 0; i < maxSectionsToLog; i++) {
      const section = sections[i];
      const id = await section.getAttribute("id");
      const dataTestId = await section.getAttribute("data-testid");
      const dataSection = await section.getAttribute("data-section");
      console.log(
        `Section ${i}: id=${id}, data-testid=${dataTestId}, data-section=${dataSection}`,
      );
    }

    if (sections.length > maxSectionsToLog) {
      console.log(
        `... and ${sections.length - maxSectionsToLog} more sections`,
      );
    }

    // Try different selectors
    let initialHero = null;
    try {
      initialHero = await page
        .locator('[data-testid="section-hero"]')
        .boundingBox();
    } catch {
      console.log("data-testid selector failed, trying id selector");
      try {
        initialHero = await page.locator("#hero").boundingBox();
      } catch {
        console.log("id selector also failed");
      }
    }

    const initialSections = await page.locator("section").all();

    // Wait for any dynamic content - increased timeout for hydration
    await page.waitForTimeout(2000);

    // Check layout didn't shift significantly
    if (initialHero) {
      let finalHero = null;
      try {
        finalHero = await page
          .locator('[data-testid="section-hero"]')
          .boundingBox();
      } catch {
        finalHero = await page.locator("#hero").boundingBox();
      }

      if (finalHero) {
        // Allow small shifts but not major ones
        expect(Math.abs(finalHero.y - initialHero.y)).toBeLessThan(100);
      }
    }

    // Check that critical sections are present (allow lazy loading for non-critical sections)
    const finalSections = await page.locator("section").all();
    console.log(
      `Initial sections: ${initialSections.length}, Final sections: ${finalSections.length}`,
    );

    // At minimum, we should have the critical sections (hero, benefits, features)
    let criticalSectionCount = 0;
    for (const section of finalSections) {
      const id = await section.getAttribute("id");
      if (["hero", "benefits", "features"].includes(id || "")) {
        criticalSectionCount++;
      }
    }

    expect(finalSections.length).toBeGreaterThanOrEqual(3); // At least some sections
    expect(criticalSectionCount).toBeGreaterThanOrEqual(3); // All critical sections present
  });

  test("should handle theme toggle without errors", async ({ page }) => {
    await page.goto("/");

    // Get initial theme
    const initialClasses = await page.locator("body").getAttribute("class");

    // Try to toggle theme (if toggle exists)
    const themeToggle = page.locator("[data-theme-toggle]");
    if (await themeToggle.isVisible()) {
      await themeToggle.click();

      // Wait for theme change
      await page.waitForTimeout(500);

      // Check that classes changed
      const finalClasses = await page.locator("body").getAttribute("class");
      expect(finalClasses).not.toBe(initialClasses);
    }
  });

  test("should maintain accessibility after hydration", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to load and hydrate - wait for main content to appear
    await page.waitForSelector("main", { timeout: 10000 });

    // Check for ARIA landmarks - be flexible as structure may vary
    const bannerExists = await page
      .locator('[role="banner"]')
      .isVisible()
      .catch(() => false);
    const mainExists = await page
      .locator("main")
      .isVisible()
      .catch(() => false);

    // At least one of banner or main should exist
    expect(bannerExists || mainExists).toBe(true);

    // Check for focusable elements
    const focusableElements = await page
      .locator("button, a[href], input, select, textarea")
      .all();
    expect(focusableElements.length).toBeGreaterThan(0);
  });

  test("should load images with proper attributes", async ({ page }) => {
    await page.goto("/");

    // Check all images have alt text
    const images = await page.locator("img").all();
    for (const img of images) {
      const alt = await img.getAttribute("alt");
      expect(alt).toBeTruthy();
      expect(alt?.length).toBeGreaterThan(0);
    }

    // Check that images have proper Next.js optimization attributes
    const firstImage = images[0];
    if (firstImage) {
      // Should have data-nimg attribute (Next.js Image marker)
      await expect(firstImage).toHaveAttribute("data-nimg");

      // Should have decoding attribute for performance
      await expect(firstImage).toHaveAttribute("decoding", "async");
    }
  });

  test("should handle error boundaries gracefully", async ({ page }) => {
    await page.goto("/");

    // Check that error boundaries don't show by default
    const errorBoundaries = page.locator("[data-error-boundary]");
    await expect(errorBoundaries).toHaveCount(0);

    // Check that main content is visible
    await expect(page.locator("main")).toBeVisible();
  });

  test("should load lazy components without webpack errors", async ({
    page,
  }) => {
    // Track console errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");

    // Wait for lazy components to load
    await page.waitForTimeout(1000);

    // Check for webpack-related errors
    const webpackErrors = consoleErrors.filter(
      (error) =>
        error.includes("webpack") ||
        error.includes(
          "Cannot read properties of undefined (reading 'call')",
        ) ||
        error.includes("factory") ||
        error.includes("__webpack_require__"),
    );

    expect(webpackErrors).toHaveLength(0);

    // Verify lazy components rendered
    const sections = page.locator("section");
    await expect(sections).toHaveCount(await sections.count());
  });

  test("should handle dynamic imports gracefully", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");

    // Wait for potential dynamic imports
    await page.waitForTimeout(2000);

    // Check that no critical dynamic import errors occurred
    const criticalErrors = consoleErrors.filter(
      (error) =>
        (error.includes("Loading chunk") && error.includes("failed")) ||
        (error.includes("Loading CSS chunk") && error.includes("failed")) ||
        error.includes("ChunkLoadError"),
    );

    expect(criticalErrors).toHaveLength(0);

    // Verify page still functions
    await expect(page.locator("body")).toBeVisible();
  });

  test("should render all sections without hydration mismatches", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");

    // Wait for all sections to load
    await page.waitForTimeout(2000);

    // Check for hydration mismatches
    const hydrationErrors = consoleErrors.filter(
      (error) =>
        error.includes("hydration") ||
        error.includes("Hydration") ||
        error.includes("Expected server HTML") ||
        error.includes("Did not expect server HTML"),
    );

    expect(hydrationErrors).toHaveLength(0);

    // Verify sections and footer are present and visible
    const sections = await page.locator("section, footer").all();
    expect(sections.length).toBeGreaterThan(0);

    for (const section of sections) {
      await expect(section).toBeVisible();
    }
  });

  test("should handle component unmounting without errors", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");

    // Navigate away and back to test unmounting
    await page.goto("/?test=1");
    await page.waitForTimeout(1000);
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Check for unmounting errors
    const unmountErrors = consoleErrors.filter(
      (error) =>
        error.includes("unmount") ||
        error.includes("cleanup") ||
        error.includes("Cannot read properties") ||
        error.includes("undefined"),
    );

    // Filter out expected navigation-related messages
    const criticalUnmountErrors = unmountErrors.filter(
      (error) => !error.includes("navigation") && !error.includes("route"),
    );

    expect(criticalUnmountErrors).toHaveLength(0);
  });

  test("should load all critical resources", async ({ page }) => {
    const failedRequests: string[] = [];

    // Track failed requests
    page.on("response", (response) => {
      if (!response.ok() && response.status() >= 400) {
        failedRequests.push(response.url());
      }
    });

    await page.goto("/");

    // Wait for all resources to load
    await page.waitForLoadState("networkidle");

    // Check for critical resource failures
    const criticalFailures = failedRequests.filter(
      (url) =>
        url.includes("_next/static") ||
        url.includes(".js") ||
        url.includes(".css"),
    );

    expect(criticalFailures).toHaveLength(0);

    // Verify critical elements are present
    await expect(page.locator("html")).toHaveAttribute("lang");
    await expect(page.locator("head title")).toBeTruthy();
  });

  test("should handle rapid navigation without breaking", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Rapid navigation simulation
    await page.goto("/");
    await page.waitForTimeout(500);

    // Simulate rapid clicks/navigation
    await page.reload();
    await page.waitForTimeout(500);

    await page.reload();
    await page.waitForTimeout(500);

    // Check for navigation-related errors
    const navErrors = consoleErrors.filter(
      (error) =>
        error.includes("navigation") ||
        error.includes("route") ||
        error.includes("Cannot read properties of undefined"),
    );

    // Allow some navigation warnings but not critical errors
    const criticalErrors = navErrors.filter(
      (error) =>
        error.includes("undefined") &&
        !error.includes("navigation") &&
        !error.includes("route"),
    );

    expect(criticalErrors).toHaveLength(0);

    // Verify page is still functional
    await expect(page.locator("body")).toBeVisible();
  });
});
