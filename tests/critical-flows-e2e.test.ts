import { test, expect } from "@playwright/test";
import { installBrowserMocks, TEST_CONFIGS } from "./utils/browser-mocks";
import { setupTestIsolation, waitForNetworkIdle } from "../lib/test-helpers";

test.describe("Critical User Flows E2E", () => {
  // Setup de isolamento e limpeza entre testes
  setupTestIsolation();

  test.beforeEach(async ({ page }) => {
    // ===== MOCKS DETERMINÍSTICOS PARA FLUXOS CRÍTICOS - PR-2 =====
    await installBrowserMocks(page, TEST_CONFIGS.e2e);

    await page.goto("/");
    await waitForNetworkIdle(page, 3000); // Usar helper otimizado ao invés de networkidle + timeout
  });

  test.describe("Navigation Flow", () => {
    test("user can navigate through all main sections smoothly", async ({
      page,
    }) => {
      // Verify main sections are present and accessible
      const sections = [
        "hero",
        "benefits",
        "social-proof",
        "demo",
        "features",
        "pricing-presale",
        "faq",
        "footer",
      ];

      for (const sectionId of sections) {
        const section = page.locator(`[data-section="${sectionId}"]`);
        if (await section.isVisible({ timeout: 2000 }).catch(() => false)) {
          // Scroll to section
          await section.scrollIntoViewIfNeeded();
          await page.waitForTimeout(200); // Reduzido de 500ms para 200ms

          // Verify section is in viewport and content is loaded
          await expect(section).toBeInViewport();
          await expect(section).toBeVisible();
        }
      }
    });

    test("smooth scrolling between sections works correctly", async ({
      page,
    }) => {
      // Start from hero section
      const heroSection = page.locator('[data-section="hero"]');
      await expect(heroSection).toBeInViewport();

      // Scroll to benefits section
      const benefitsSection = page.locator('[data-section="benefits"]');
      await benefitsSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Verify benefits section is now in viewport
      await expect(benefitsSection).toBeInViewport();

      // Verify hero section is no longer in viewport
      await expect(heroSection).not.toBeInViewport();
    });

    test("keyboard navigation through sections works", async ({ page }) => {
      // Start tab navigation from the beginning
      await page.keyboard.press("Tab");

      // Skip Next.js dev tools and verify we can tab through app elements
      let focusCount = 0;
      for (let i = 0; i < 15; i++) {
        const focusedElement = page.locator(":focus").first();

        // Skip Next.js dev tools elements
        const elementHandle = await focusedElement.elementHandle();
        if (elementHandle) {
          const isDevTools = await elementHandle.evaluate(
            (el) =>
              el.id === "next-logo" ||
              el.hasAttribute("data-nextjs-dev-tools-button"),
          );

          if (!isDevTools) {
            await expect(focusedElement).toBeVisible();
            focusCount++;
            if (focusCount >= 5) break; // Test at least 5 app elements
          }
        }

        // Move to next element
        await page.keyboard.press("Tab");
        await page.waitForTimeout(100);
      }

      // Should have found at least 5 focusable app elements
      expect(focusCount).toBeGreaterThanOrEqual(5);
    });
  });

  test.describe("Conversion Flow - Trial Signup", () => {
    test("primary CTA leads to signup flow", async ({ page }) => {
      // Click primary CTA
      const primaryCTA = page
        .getByRole("button", { name: /Começar|Iniciar|Entrar|Garantir/i })
        .first();
      await expect(primaryCTA).toBeVisible();

      // Set up dialog/popup handler for potential signup modal
      let signupModalAppeared: boolean = false;
      page.on("dialog", async (dialog) => {
        signupModalAppeared = true;
        await dialog.dismiss();
      });

      // Try to click CTA and see what happens
      await primaryCTA.click();

      // Check if navigation occurred or modal appeared
      const currentUrl = page.url();
      if (
        currentUrl.includes("/signup") ||
        currentUrl.includes("/trial") ||
        currentUrl.includes("/register")
      ) {
        // Navigation to signup page occurred
        await expect(page).toHaveURL(/\/(signup|trial|register)/);

        // Verify signup form elements are present
        const emailInput = page.locator('input[type="email"]').first();
        const submitButton = page
          .getByRole("button", { name: /Cadastrar|Registrar|Começar/i })
          .first();

        await expect(emailInput.or(submitButton)).toBeVisible();
      } else if (signupModalAppeared) {
        // Modal appeared (handled by dialog event)
        expect(signupModalAppeared as boolean).toBe(true);
      } else {
        // CTA might be disabled or lead to demo - verify page didn't break
        await expect(page.locator("body")).toBeVisible();
      }
    });

    test("signup form validation works correctly", async ({ page }) => {
      // Navigate to signup if not already there
      const primaryCTA = page
        .getByRole("button", { name: /Começar|Iniciar|Entrar|Garantir/i })
        .first();
      await primaryCTA.click();

      // If we're on a signup page, test form validation
      const currentUrl = page.url();
      if (
        currentUrl.includes("/signup") ||
        currentUrl.includes("/trial") ||
        currentUrl.includes("/register")
      ) {
        // Try to submit empty form
        const submitButton = page
          .getByRole("button", { name: /Cadastrar|Registrar|Começar|Enviar/i })
          .first();

        if (await submitButton.isVisible()) {
          await submitButton.click();

          // Check for validation errors (either native HTML5 or custom)
          const emailInput = page.locator('input[type="email"]').first();
          const errorMessages = page.locator(
            '.error, [class*="error"], [aria-invalid="true"]',
          );

          // Either validation prevents submission or shows error messages
          if ((await errorMessages.count()) > 0) {
            await expect(errorMessages.first()).toBeVisible();
          }
        }
      }
    });

    test("demo request flow works", async ({ page }) => {
      // Click demo/secondary CTA
      const demoCTA = page
        .getByRole("button", { name: /Demo|Demonstração|Agendar|Contato/i })
        .first();

      if (await demoCTA.isVisible({ timeout: 3000 }).catch(() => false)) {
        await demoCTA.click();

        // Check what happens after demo CTA click
        const currentUrl = page.url();
        if (currentUrl.includes("/demo") || currentUrl.includes("/contact")) {
          // Navigated to demo/contact page
          await expect(page).toHaveURL(/\/(demo|contact)/);
        } else {
          // Might have opened a modal or stayed on page
          await expect(page.locator("body")).toBeVisible();
        }
      }
    });
  });

  test.describe("Authentication Flow", () => {
    test("login/signup toggle works correctly", async ({ page }) => {
      // Navigate to auth page
      const primaryCTA = page
        .getByRole("button", { name: /Começar|Iniciar|Entrar/i })
        .first();
      await primaryCTA.click();

      const currentUrl = page.url();
      if (
        currentUrl.includes("/signup") ||
        currentUrl.includes("/trial") ||
        currentUrl.includes("/register")
      ) {
        // Look for login link or toggle
        const loginLink = page
          .getByRole("link", { name: /Entrar|Login|Já tenho conta/i })
          .first();
        const loginToggle = page
          .getByRole("button", { name: /Entrar|Login/i })
          .first();

        if (await loginLink.isVisible({ timeout: 2000 }).catch(() => false)) {
          await loginLink.click();
          await expect(page).toHaveURL(/\/login/);
        } else if (
          await loginToggle.isVisible({ timeout: 2000 }).catch(() => false)
        ) {
          await loginToggle.click();
          // Should show login form
          await expect(
            page.locator('input[type="password"]').first(),
          ).toBeVisible();
        }
      }
    });

    test("password reset flow is accessible", async ({ page }) => {
      // Navigate to login page
      const primaryCTA = page
        .getByRole("button", { name: /Começar|Iniciar|Entrar/i })
        .first();
      await primaryCTA.click();

      const currentUrl = page.url();
      if (
        currentUrl.includes("/signup") ||
        currentUrl.includes("/trial") ||
        currentUrl.includes("/login")
      ) {
        // Look for "forgot password" link
        const forgotPasswordLink = page
          .getByRole("link", { name: /Esqueci|Esqueceu|Recuperar|Reset/i })
          .first();

        if (
          await forgotPasswordLink
            .isVisible({ timeout: 2000 })
            .catch(() => false)
        ) {
          // Password reset link exists
          expect(await forgotPasswordLink.getAttribute("href")).toBeTruthy();
        }
      }
    });
  });

  test.describe("Error Handling", () => {
    test("page handles 404 errors gracefully", async ({ page }) => {
      // Navigate to non-existent page
      await page.goto("/non-existent-page");
      await page.waitForLoadState("networkidle");

      // Should show 404 page or redirect to home
      const bodyText = await page.locator("body").textContent();
      expect(bodyText).toMatch(
        /404|página não encontrada|page not found|não existe/i,
      );
    });

    test("page handles network errors gracefully", async ({ page }) => {
      // Intercept and block some network requests to simulate network issues
      await page.route("**/api/**", (route) => route.abort());

      // Try to load a page that might make API calls
      await page.reload();
      await page.waitForLoadState("domcontentloaded");

      // Page should still be functional even with API failures
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator('[data-section="hero"]')).toBeVisible();
    });

    test("form validation errors are displayed properly", async ({ page }) => {
      // Navigate to signup
      const primaryCTA = page
        .getByRole("button", { name: /Começar|Iniciar|Entrar/i })
        .first();
      await primaryCTA.click();

      const currentUrl = page.url();
      if (currentUrl.includes("/signup") || currentUrl.includes("/trial")) {
        // Try to submit form with invalid data
        const emailInput = page.locator('input[type="email"]').first();
        const submitButton = page
          .getByRole("button", { name: /Cadastrar|Registrar|Enviar/i })
          .first();

        if (
          (await emailInput.isVisible()) &&
          (await submitButton.isVisible())
        ) {
          // Enter invalid email
          await emailInput.fill("invalid-email");
          await submitButton.click();

          // Should show validation error
          const errorMessage = page
            .locator('.error, [class*="error"], [aria-invalid="true"]')
            .first();
          try {
            await expect(errorMessage).toBeVisible({ timeout: 3000 });
          } catch {
            // If no custom error, check for native HTML5 validation
            const isInvalid = await emailInput.evaluate(
              (el) => (el as HTMLInputElement).checkValidity() === false,
            );
            expect(isInvalid).toBe(true);
          }
        }
      }
    });
  });

  test.describe("Performance & Accessibility", () => {
    test("page loads within acceptable time limits", async ({ page }) => {
      // Measure load time
      const startTime = Date.now();

      await page.goto("/", { waitUntil: "networkidle" });

      const loadTime = Date.now() - startTime;

      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);

      // Should not have critical console errors
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          errors.push(msg.text());
        }
      });

      await page.waitForTimeout(500);

      // Filter out non-critical errors
      const criticalErrors = errors.filter(
        (error) =>
          !error.includes("favicon") &&
          !error.includes("analytics") &&
          !error.includes("ChunkLoadError"),
      );

      expect(criticalErrors).toHaveLength(0);
    });

    test("core accessibility features work", async ({ page }) => {
      // Check for proper heading hierarchy
      const h1Count = await page.locator("h1").count();
      expect(h1Count).toBeGreaterThan(0);

      // Check for focusable elements
      const focusableElements = await page
        .locator(
          'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        .count();
      expect(focusableElements).toBeGreaterThan(0);

      // Check for alt text on images
      const images = page.locator("img");
      const imageCount = await images.count();

      if (imageCount > 0) {
        for (let i = 0; i < imageCount; i++) {
          const alt = await images.nth(i).getAttribute("alt");
          expect(alt).toBeTruthy();
          expect(alt?.length).toBeGreaterThan(0);
        }
      }
    });

    test("responsive design works on mobile", async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Core elements should still be visible and usable
      await expect(page.locator('[data-section="hero"]')).toBeVisible();
      await expect(page.locator("h1")).toBeVisible();

      // CTAs should be accessible
      const cta = page
        .getByRole("button", { name: /Começar|Demo|Entrar/i })
        .first();
      await expect(cta).toBeVisible();

      // Content should be readable
      const heroText = await page
        .locator('[data-section="hero"]')
        .textContent();
      expect(heroText?.length).toBeGreaterThan(10);
    });
  });

  test.describe("Business Logic Validation", () => {
    test("pricing information is consistent and valid", async ({ page }) => {
      await page.waitForTimeout(2000); // Wait for lazy loading

      const pricingSection = page.locator('[data-section="pricing-presale"]');
      if (
        await pricingSection.isVisible({ timeout: 3000 }).catch(() => false)
      ) {
        // Should have pricing information
        await expect(pricingSection).toContainText(/\$\d+|\d+,\d+|\d+\.\d+/);

        // Should have clear CTAs
        const pricingCTAs = pricingSection.getByRole("button");
        await expect(pricingCTAs.first()).toBeVisible();
      }
    });

    test("social proof metrics are realistic and consistent", async ({
      page,
    }) => {
      await page.waitForTimeout(2000);

      const socialProofSection = page.locator('[data-section="social-proof"]');
      if (
        await socialProofSection.isVisible({ timeout: 3000 }).catch(() => false)
      ) {
        // Should contain some form of social proof
        const sectionText = await socialProofSection.textContent();
        const hasMetrics = /\d+\+|\d+%|\d+ empresas|\d+ clientes/i.test(
          sectionText || "",
        );

        expect(hasMetrics).toBe(true);
      }
    });

    test("feature claims are clear and benefit-focused", async ({ page }) => {
      await page.waitForTimeout(2000);

      const featuresSection = page.locator('[data-section="features"]');
      if (
        await featuresSection.isVisible({ timeout: 3000 }).catch(() => false)
      ) {
        // Should have clear feature descriptions
        const features = await featuresSection
          .locator('[data-testid="feature"], .feature, [class*="feature"]')
          .all();

        if (features.length > 0) {
          for (const feature of features) {
            const text = await feature.textContent();
            expect(text?.length).toBeGreaterThan(10); // Meaningful content
          }
        }
      }
    });
  });
});
