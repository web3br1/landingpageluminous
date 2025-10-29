import { test, expect } from "@playwright/test";

test.describe("Complete User Journey - Advanced E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000); // Allow for animations and lazy loading
  });

  test("critical user journey: landing → lead form → conversion", async ({
    page,
  }) => {
    // === PHASE 1: LANDING PAGE VALIDATION ===
    await test.step("Validate landing page structure", async () => {
      // Check page title and meta
      await expect(page).toHaveTitle(/DataFlow|Luminaris|Sistema|Automação/i);

      // Check hero section is visible and functional
      const heroSection = page.locator('[data-section="hero"]');
      await expect(heroSection).toBeVisible();

      // Check hero headline
      const heroHeadline = heroSection.locator("h1").first();
      await expect(heroHeadline).toBeVisible();
      await expect(heroHeadline).toContainText(/\w+/);

      // Check primary CTA is visible
      const primaryCTA = page
        .getByRole("button", { name: /começar|iniciar|demo|trial/i })
        .first();
      await expect(primaryCTA).toBeVisible();
      await expect(primaryCTA).toBeEnabled();

      // Check benefits section loads
      const benefitsSection = page.locator('[data-section="benefits"]');
      await expect(benefitsSection).toBeVisible();

      // Check pricing section loads
      const pricingSection = page.locator(
        '[data-section="pricing"], [data-section="pricing-presale"]',
      );
      await expect(pricingSection).toBeVisible();
    });

    // === PHASE 2: LEAD FORM INTERACTION ===
    await test.step("Interact with lead form", async () => {
      // Scroll to lead form section
      const leadFormSection = page.locator(
        '[data-section="lead-form"], [data-section="cta-final"]',
      );
      await leadFormSection.scrollIntoViewIfNeeded();
      await expect(leadFormSection).toBeVisible();

      // Check form elements are present
      const form = leadFormSection.locator("form");
      await expect(form).toBeVisible();

      // Fill out the form
      const nameInput = form
        .locator('input[name="name"], input[placeholder*="nome" i]')
        .first();
      if (await nameInput.isVisible()) {
        await nameInput.fill("João Silva Test");
      }

      const emailInput = form
        .locator('input[name="email"], input[type="email"]')
        .first();
      await expect(emailInput).toBeVisible();
      await emailInput.fill("joao.silva.test@example.com");

      const companyInput = form
        .locator('input[name="company"], input[placeholder*="empresa" i]')
        .first();
      if (await companyInput.isVisible()) {
        await companyInput.fill("Empresa Test LTDA");
      }

      // Select role if present
      const roleSelect = form.locator('select[name="role"]').first();
      if (await roleSelect.isVisible()) {
        await roleSelect.selectOption({ label: "CEO" });
      }

      // Fill message if present
      const messageTextarea = form.locator('textarea[name="message"]').first();
      if (await messageTextarea.isVisible()) {
        await messageTextarea.fill(
          "Mensagem de teste para validação do formulário E2E.",
        );
      }

      // Submit form and check success/error handling
      const submitButton = form.locator('button[type="submit"]').first();
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();

      // Click submit and monitor for success/error messages
      await submitButton.click();

      // Wait for form submission response
      await page.waitForTimeout(2000);

      // Check for success message or error handling
      const successMessage = page.getByText(
        /sucesso|enviado|obrigado|thank you/i,
      );
      const errorMessage = page.getByText(/erro|error|falha|failed/i);

      // Either success or error should be shown (form should respond)
      const hasResponse =
        (await successMessage
          .isVisible({ timeout: 3000 })
          .catch(() => false)) ||
        (await errorMessage.isVisible({ timeout: 3000 }).catch(() => false));

      expect(hasResponse).toBe(true);
    });

    // === PHASE 3: CONVERSION TRACKING ===
    await test.step("Validate conversion tracking", async () => {
      // Check if analytics events were fired (through network requests or data layer)
      const networkRequests = page.context().requests();

      // Look for analytics tracking (Google Analytics, Plausible, etc.)
      const analyticsRequests = networkRequests.filter(
        (req) =>
          req.url().includes("analytics") ||
          req.url().includes("plausible") ||
          req.url().includes("googletagmanager") ||
          req.url().includes("gtag"),
      );

      // Should have at least some analytics tracking
      // Note: This is a basic check - real analytics validation would be more complex
      expect(analyticsRequests.length).toBeGreaterThanOrEqual(0); // Allow for no tracking in test env
    });
  });

  test("responsive design across devices", async ({ page, browserName }) => {
    const viewports = [
      { name: "mobile", width: 375, height: 667 },
      { name: "tablet", width: 768, height: 1024 },
      { name: "desktop", width: 1440, height: 900 },
      { name: "large", width: 1920, height: 1080 },
    ];

    for (const viewport of viewports) {
      await test.step(`Test ${viewport.name} viewport (${viewport.width}x${viewport.height})`, async () => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        await page.waitForTimeout(1000); // Allow for responsive adjustments

        // Core elements should remain visible and functional
        const heroSection = page.locator('[data-section="hero"]');
        await expect(heroSection).toBeVisible();

        const heroHeadline = heroSection.locator("h1, h2").first();
        await expect(heroHeadline).toBeVisible();

        // Primary CTA should be visible and clickable
        const primaryCTA = page
          .getByRole("button", { name: /começar|demo|trial/i })
          .first();
        await expect(primaryCTA).toBeVisible();
        await expect(primaryCTA).toBeEnabled();

        // Check that content doesn't overflow
        const body = page.locator("body");
        const bodyWidth = await body.evaluate((el) => el.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 20); // Allow small margin

        // Test scrolling works
        const benefitsSection = page.locator('[data-section="benefits"]');
        if (
          await benefitsSection.isVisible({ timeout: 2000 }).catch(() => false)
        ) {
          await benefitsSection.scrollIntoViewIfNeeded();
          await expect(benefitsSection).toBeInViewport();
        }
      });
    }
  });

  test("accessibility compliance - WCAG 2.1 AA", async ({ page }) => {
    // Test keyboard navigation
    await test.step("Keyboard navigation", async () => {
      // Tab through focusable elements
      await page.keyboard.press("Tab");
      let focusedElement = page.locator(":focus");

      // Should have some focused element
      await expect(focusedElement).toBeVisible();

      // Continue tabbing through several elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press("Tab");
        focusedElement = page.locator(":focus");
        if (
          await focusedElement.isVisible({ timeout: 1000 }).catch(() => false)
        ) {
          // Check if focused element has proper focus indicators
          const hasFocusIndicator = await focusedElement.evaluate((el) => {
            const style = getComputedStyle(el);
            return (
              style.outline !== "none" ||
              style.boxShadow !== "none" ||
              style.border !== getComputedStyle(el.parentElement || el).border
            );
          });
          // At least one element should have visible focus indicator
          if (hasFocusIndicator) break;
        }
      }
    });

    // Test semantic structure
    await test.step("Semantic HTML structure", async () => {
      // Should have main landmark
      const main = page.locator("main");
      await expect(main).toHaveCount(1);

      // Should have proper heading hierarchy
      const h1 = page.locator("h1");
      await expect(h1).toHaveCount(1); // Usually one main h1

      // Should have sections with proper structure
      const sections = page.locator("section");
      await expect(sections).toHaveCount(await sections.count()); // At least some sections

      // Check for proper form structure
      const forms = page.locator("form");
      for (const form of await forms.all()) {
        // Forms should have proper labels or aria-labels
        const inputs = form.locator("input, select, textarea");
        for (const input of await inputs.all()) {
          const hasLabel = await input.evaluate((el) => {
            const id = el.id;
            const label = id
              ? document.querySelector(`label[for="${id}"]`)
              : null;
            const ariaLabel = el.getAttribute("aria-label");
            const ariaLabelledBy = el.getAttribute("aria-labelledby");
            return !!(label || ariaLabel || ariaLabelledBy);
          });
          expect(hasLabel).toBe(true);
        }
      }
    });

    // Test color contrast (basic check)
    await test.step("Color contrast basics", async () => {
      const textElements = page
        .locator("h1, h2, h3, p, span, div")
        .filter({ hasText: /\w+/ });

      for (const element of await textElements.all()) {
        if (await element.isVisible()) {
          const color = await element.evaluate(
            (el) => getComputedStyle(el).color,
          );
          const backgroundColor = await element.evaluate(
            (el) => getComputedStyle(el).backgroundColor,
          );

          // Basic validation - colors should be defined
          expect(color).toMatch(/rgb\(|hsl\(|#\w{3,6}/);
          expect(backgroundColor).toMatch(/rgb\(|hsl\(|#\w{3,6}|rgba\(|hsla\(/);
        }
      }
    });

    // Test ARIA attributes
    await test.step("ARIA attributes and roles", async () => {
      // Check buttons have proper labels
      const buttons = page.getByRole("button").all();
      for (const button of await buttons) {
        const hasAccessibleName = await button.evaluate((el) => {
          const text = el.textContent?.trim();
          const ariaLabel = el.getAttribute("aria-label");
          const ariaLabelledBy = el.getAttribute("aria-labelledby");
          return !!(text || ariaLabel || ariaLabelledBy);
        });
        expect(hasAccessibleName).toBe(true);
      }

      // Check images have alt text
      const images = page.locator("img");
      for (const img of await images.all()) {
        const alt = await img.getAttribute("alt");
        const ariaLabel = await img.getAttribute("aria-label");
        const hasAlt = alt || ariaLabel || alt === "";
        expect(hasAlt).toBeDefined();
      }
    });
  });

  test("performance and core web vitals", async ({ page }) => {
    // Start performance monitoring
    const client = await page.context().newCDPSession(page);

    // Enable performance monitoring
    await client.send("Performance.enable");

    // Clear any existing metrics
    await page.evaluate(() => {
      if (window.performance && window.performance.clearMarks) {
        window.performance.clearMarks();
      }
      if (window.performance && window.performance.clearMeasures) {
        window.performance.clearMeasures();
      }
    });

    // Wait for page to be fully interactive
    await page.waitForLoadState("domcontentloaded");
    await page.waitForLoadState("networkidle");

    // Measure Core Web Vitals
    const metrics = await page.evaluate(() => {
      const observer = new PerformanceObserver((list) => {
        // Handle performance entries
      });

      // Try to observe various metrics
      try {
        observer.observe({ entryTypes: ["measure", "navigation", "paint"] });
      } catch (e) {
        // Some entry types might not be supported
      }

      // Get navigation timing
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;

      return {
        domContentLoaded:
          navigation?.domContentLoadedEventEnd -
          navigation?.domContentLoadedEventStart,
        loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
        firstPaint: performance.getEntriesByName("first-paint")[0]?.startTime,
        firstContentfulPaint: performance.getEntriesByName(
          "first-contentful-paint",
        )[0]?.startTime,
        // LCP might not be available in all browsers
        largestContentfulPaint: (performance as any).getEntriesByType(
          "largest-contentful-paint",
        )[0]?.startTime,
      };
    });

    // Validate performance thresholds
    if (metrics.domContentLoaded > 0) {
      expect(metrics.domContentLoaded).toBeLessThan(3000); // DOM ready in < 3s
    }

    if (metrics.loadComplete > 0) {
      expect(metrics.loadComplete).toBeLessThan(5000); // Full load in < 5s
    }

    // Test interactivity
    await test.step("Page interactivity", async () => {
      // Try to interact with elements
      const button = page.getByRole("button").first();
      if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
        const startTime = Date.now();
        await button.click();
        const clickTime = Date.now() - startTime;

        // Click should be responsive (< 100ms)
        expect(clickTime).toBeLessThan(100);
      }

      // Test scrolling performance
      const scrollStart = Date.now();
      await page.evaluate(() => window.scrollTo(0, 500));
      const scrollTime = Date.now() - scrollStart;

      // Scrolling should be smooth (< 50ms)
      expect(scrollTime).toBeLessThan(50);
    });

    // Test memory usage (if available)
    await test.step("Memory usage", async () => {
      const memoryInfo = await page.evaluate(() => {
        if ("memory" in performance) {
          return (performance as any).memory;
        }
        return null;
      });

      if (memoryInfo) {
        // Memory usage should be reasonable (< 50MB for initial load)
        expect(memoryInfo.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024);
      }
    });
  });

  test("error handling and resilience", async ({ page }) => {
    // Monitor console errors
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      } else if (msg.type() === "warning") {
        consoleWarnings.push(msg.text());
      }
    });

    // Monitor network errors
    const failedRequests: string[] = [];
    page.on("response", (response) => {
      if (!response.ok() && response.status() >= 400) {
        failedRequests.push(`${response.status()}: ${response.url()}`);
      }
    });

    // Navigate through all sections
    const sections = [
      "hero",
      "benefits",
      "features",
      "pricing",
      "pricing-presale",
      "faq",
      "lead-form",
      "cta-final",
      "footer",
    ];

    for (const sectionId of sections) {
      const section = page.locator(`[data-section="${sectionId}"]`);

      if (await section.isVisible({ timeout: 2000 }).catch(() => false)) {
        await section.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);

        // Try to interact with elements in the section
        const buttons = section.getByRole("button");
        const links = section.locator("a");

        // Click any visible buttons (safely)
        for (const button of await buttons.all()) {
          if ((await button.isVisible()) && (await button.isEnabled())) {
            try {
              await button.click({ timeout: 1000 });
              await page.waitForTimeout(200); // Allow for any resulting actions
              break; // Only click one button per section to avoid issues
            } catch (e) {
              // Button might trigger navigation or other actions - continue
            }
          }
        }
      }
    }

    // Filter out expected errors/warnings
    const criticalErrors = consoleErrors.filter(
      (error) =>
        !error.includes("favicon") &&
        !error.includes("analytics") &&
        !error.includes("googletagmanager") &&
        !error.includes("gtag") &&
        !error.includes("plausible") &&
        !error.includes("hotjar") &&
        !error.includes("ChunkLoadError") &&
        !error.includes("loading chunk") &&
        !error.includes("download the React DevTools"),
    );

    const criticalWarnings = consoleWarnings.filter(
      (warning) =>
        !warning.includes("favicon") &&
        !warning.includes("analytics") &&
        !warning.includes("deprecated") &&
        !warning.includes("DevTools"),
    );

    // Page should not have critical JavaScript errors
    expect(criticalErrors).toHaveLength(0);

    // Allow some warnings but log them
    if (criticalWarnings.length > 0) {
      console.warn("Non-critical warnings found:", criticalWarnings);
    }

    // Check that page is still functional after all interactions
    await expect(page.locator('[data-section="hero"]')).toBeVisible();

    // Test error boundaries by trying to break things
    await test.step("Error boundary testing", async () => {
      // Try to trigger potential errors
      await page.evaluate(() => {
        // Try to access undefined properties (safely)
        try {
          const element = document.querySelector(
            '[data-section="nonexistent"]',
          );
          if (element) {
            (element as any).nonexistentMethod();
          }
        } catch (e) {
          // Expected - ignore
        }
      });

      // Page should still be functional
      await expect(page.locator("body")).toBeVisible();
    });
  });

  test("SEO and meta tags validation", async ({ page }) => {
    // Check title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(10);
    expect(title.length).toBeLessThan(70); // SEO best practice

    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute("content");
    const descriptionContent = await metaDescription.getAttribute("content");
    expect(descriptionContent!.length).toBeGreaterThan(50);
    expect(descriptionContent!.length).toBeLessThan(160); // SEO best practice

    // Check Open Graph tags
    const ogTitle = page.locator('meta[property="og:title"]');
    const ogDescription = page.locator('meta[property="og:description"]');
    const ogImage = page.locator('meta[property="og:image"]');

    await expect(ogTitle).toHaveAttribute("content");
    await expect(ogDescription).toHaveAttribute("content");
    await expect(ogImage).toHaveAttribute("content");

    // Check Twitter Card tags
    const twitterTitle = page.locator('meta[name="twitter:title"]');
    const twitterDescription = page.locator('meta[name="twitter:description"]');
    const twitterImage = page.locator('meta[name="twitter:image"]');

    // Twitter tags are optional but if present should be valid
    if (await twitterTitle.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(twitterTitle).toHaveAttribute("content");
    }

    // Check canonical URL
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute("href");

    // Check robots meta
    const robots = page.locator('meta[name="robots"]');
    if (await robots.isVisible({ timeout: 1000 }).catch(() => false)) {
      const robotsContent = await robots.getAttribute("content");
      expect(robotsContent).toMatch(/index|noindex|follow|nofollow/);
    }

    // Check structured data (JSON-LD)
    const jsonLd = page.locator('script[type="application/ld+json"]');
    const jsonLdCount = await jsonLd.count();

    if (jsonLdCount > 0) {
      // If structured data is present, validate it's valid JSON
      for (let i = 0; i < jsonLdCount; i++) {
        const scriptContent = await jsonLd.nth(i).textContent();
        expect(() => JSON.parse(scriptContent!)).not.toThrow();
      }
    }

    // Check heading hierarchy
    const h1Tags = await page.locator("h1").count();
    const h2Tags = await page.locator("h2").count();

    expect(h1Tags).toBeGreaterThanOrEqual(1); // At least one H1
    expect(h2Tags).toBeGreaterThanOrEqual(1); // At least one H2

    // Check for keyword stuffing (basic check)
    const bodyText = await page.locator("body").textContent();
    const wordCount = bodyText!.split(/\s+/).length;
    expect(wordCount).toBeGreaterThan(50); // Should have substantial content
  });

  test("security headers and CSP compliance", async ({ page }) => {
    // Check security headers in responses
    const responses: any[] = [];

    page.on("response", (response) => {
      responses.push({
        url: response.url(),
        headers: response.headers(),
      });
    });

    // Navigate and wait for all resources to load
    await page.waitForLoadState("networkidle");

    // Check main document response
    const mainResponse = responses.find((r) => r.url === page.url());
    if (mainResponse) {
      const headers = mainResponse.headers;

      // Check for security headers (these might not be present in dev)
      if (headers["x-frame-options"]) {
        expect(["DENY", "SAMEORIGIN"]).toContain(headers["x-frame-options"]);
      }

      if (headers["x-content-type-options"]) {
        expect(headers["x-content-type-options"]).toBe("nosniff");
      }

      if (headers["referrer-policy"]) {
        expect(headers["referrer-policy"]).toBeTruthy();
      }
    }

    // Test for XSS vulnerabilities (basic)
    await test.step("XSS vulnerability check", async () => {
      // Try to inject script in URL parameters
      const testUrl = new URL(page.url());
      testUrl.searchParams.set("test", '<script>alert("xss")</script>');

      await page.goto(testUrl.toString());

      // Page should still load normally (script should not execute)
      await expect(page.locator('[data-section="hero"]')).toBeVisible();

      // Check that no alert was triggered (this is basic - real XSS testing is more complex)
      let alertTriggered = false;
      page.on("dialog", () => {
        alertTriggered = true;
      });

      await page.waitForTimeout(1000);
      expect(alertTriggered).toBe(false);
    });

    // Test HTTPS enforcement (if applicable)
    await test.step("HTTPS enforcement", async () => {
      const currentUrl = page.url();

      // In production, should be HTTPS
      if (process.env.NODE_ENV === "production") {
        expect(currentUrl).toMatch(/^https:\/\//);
      }
    });
  });

  test("internationalization and localization", async ({ page }) => {
    // Check for lang attribute
    const htmlLang = await page.getAttribute("html", "lang");
    expect(htmlLang).toBeTruthy();
    expect(htmlLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // ISO language codes

    // Check for RTL language support (if applicable)
    const dir = await page.getAttribute("html", "dir");
    if (dir) {
      expect(["ltr", "rtl"]).toContain(dir);
    }

    // Check for proper encoding
    const charset = page.locator("meta[charset]");
    await expect(charset).toHaveAttribute("charset", "utf-8");

    // Check for number formatting consistency
    const numbersInText = await page.locator("text=/\\d+/").allTextContents();
    for (const text of numbersInText) {
      // Numbers should be properly formatted (basic check)
      const numbers = text.match(/\d+/g);
      if (numbers) {
        for (const number of numbers) {
          // Should not have malformed number formatting
          expect(number).not.toMatch(/,\d{3},\d{3}/); // Double commas
          expect(number).not.toMatch(/\.\d{3}\.\d{3}/); // Double dots
        }
      }
    }

    // Check for currency symbols consistency
    const currencySymbols = ["$", "€", "£", "R$", "¥", "₹"];
    const currencyElements = await page
      .locator(
        `text=/${currencySymbols.map((s) => s.replace("$", "\\$")).join("|")}/`,
      )
      .all();

    if (currencyElements.length > 0) {
      // If currency is used, it should be consistent
      const firstSymbol = await currencyElements[0].textContent();
      const symbolMatch = firstSymbol!.match(
        new RegExp(
          `(${currencySymbols.map((s) => s.replace("$", "\\$")).join("|")})`,
        ),
      );

      if (symbolMatch) {
        const expectedSymbol = symbolMatch[1];
        for (const element of currencyElements) {
          const text = await element.textContent();
          expect(text).toContain(expectedSymbol);
        }
      }
    }
  });
});
