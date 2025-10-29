import { test, expect } from "@playwright/test";

test.describe("Visual Regression - Core Components", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000); // Allow for animations and lazy loading
  });

  test.skip("hero section visual regression", async ({ page }) => {
    const heroSection = page.locator('[data-section="hero"]');

    // Wait for hero to be fully loaded
    await expect(heroSection).toBeVisible();
    await page.waitForTimeout(1000); // Allow for any dynamic content

    // Take screenshot of hero section
    await expect(heroSection).toHaveScreenshot("hero-section.png", {
      threshold: 0.1, // Allow 10% difference for minor variations
      fullPage: false,
    });
  });

  test.skip("benefits section visual regression", async ({ page }) => {
    const benefitsSection = page.locator('[data-section="benefits"]');

    // Scroll to benefits section
    await benefitsSection.scrollIntoViewIfNeeded();
    await expect(benefitsSection).toBeVisible();
    await page.waitForTimeout(1000);

    // Take screenshot
    await expect(benefitsSection).toHaveScreenshot("benefits-section.png", {
      threshold: 0.1,
      fullPage: false,
    });
  });

  test.skip("pricing section visual regression", async ({ page }) => {
    const pricingSection = page.locator(
      '[data-section="pricing"], [data-section="pricing-presale"]',
    );

    await pricingSection.scrollIntoViewIfNeeded();
    await expect(pricingSection).toBeVisible();
    await page.waitForTimeout(1000);

    // Take screenshot
    await expect(pricingSection).toHaveScreenshot("pricing-section.png", {
      threshold: 0.15, // Allow more variation for pricing changes
      fullPage: false,
    });
  });

  test.skip("lead form visual regression", async ({ page }) => {
    const leadFormSection = page.locator(
      '[data-section="lead-form"], [data-section="cta-final"]',
    );

    await leadFormSection.scrollIntoViewIfNeeded();
    await expect(leadFormSection).toBeVisible();
    await page.waitForTimeout(1000);

    // Take screenshot
    await expect(leadFormSection).toHaveScreenshot("lead-form-section.png", {
      threshold: 0.1,
      fullPage: false,
    });
  });

  test.skip("footer visual regression", async ({ page }) => {
    const footer = page.locator('[data-section="footer"], footer').first();

    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
    await page.waitForTimeout(1000);

    // Take screenshot
    await expect(footer).toHaveScreenshot("footer-section.png", {
      threshold: 0.1,
      fullPage: false,
    });
  });

  test("mobile hero visual regression", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    const heroSection = page.locator('[data-section="hero"]');
    await expect(heroSection).toBeVisible();
    await page.waitForTimeout(1000);

    // Take mobile screenshot
    await expect(heroSection).toHaveScreenshot("hero-section-mobile.png", {
      threshold: 0.15, // Allow more variation for responsive design
      fullPage: false,
    });
  });

  test("tablet hero visual regression", async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);

    const heroSection = page.locator('[data-section="hero"]');
    await expect(heroSection).toBeVisible();
    await page.waitForTimeout(1000);

    // Take tablet screenshot
    await expect(heroSection).toHaveScreenshot("hero-section-tablet.png", {
      threshold: 0.12,
      fullPage: false,
    });
  });

  test("hover states visual regression", async ({ page }) => {
    // Hide debug panels that might interfere with hover tests
    await page.addStyleTag({
      content: ".debug-panel { display: none !important; }",
    });
    const benefitsSection = page.locator('[data-section="benefits"]');
    await benefitsSection.scrollIntoViewIfNeeded();
    await expect(benefitsSection).toBeVisible();

    // Find benefit cards
    const benefitCards = benefitsSection
      .locator('[class*="benefit"], [data-benefit-index]')
      .all();

    if ((await benefitCards).length > 0) {
      const firstCard = (await benefitCards)[0];

      // Take screenshot before hover
      await expect(firstCard).toHaveScreenshot("benefit-card-normal.png", {
        threshold: 0.05,
      });

      // Hover over the card
      await firstCard.hover();
      await page.waitForTimeout(300); // Allow for hover animation

      // Take screenshot after hover
      await expect(firstCard).toHaveScreenshot("benefit-card-hover.png", {
        threshold: 0.05,
      });
    }
  });

  test("button states visual regression", async ({ page }) => {
    // Hide debug panels that might interfere with hover tests
    await page.addStyleTag({
      content: ".debug-panel { display: none !important; }",
    });
    const primaryButton = page
      .getByRole("button", { name: /começar|demo|trial/i })
      .first();

    if (await primaryButton.isVisible()) {
      // Take normal state screenshot
      await expect(primaryButton).toHaveScreenshot(
        "primary-button-normal.png",
        {
          threshold: 0.05,
        },
      );

      // Hover over button
      await primaryButton.hover();
      await page.waitForTimeout(200);

      // Take hover state screenshot
      await expect(primaryButton).toHaveScreenshot("primary-button-hover.png", {
        threshold: 0.05,
      });

      // Focus on button
      await primaryButton.focus();
      await page.waitForTimeout(200);

      // Take focus state screenshot
      await expect(primaryButton).toHaveScreenshot("primary-button-focus.png", {
        threshold: 0.05,
      });
    }
  });

  test.skip("form validation states visual regression", async ({ page }) => {
    const leadFormSection = page.locator(
      '[data-section="lead-form"], [data-section="cta-final"]',
    );
    await leadFormSection.scrollIntoViewIfNeeded();

    const form = leadFormSection.locator("form");
    if (await form.isVisible()) {
      const emailInput = form.locator('input[type="email"]').first();

      if (await emailInput.isVisible()) {
        // Take normal state screenshot
        await expect(emailInput).toHaveScreenshot("email-input-normal.png", {
          threshold: 0.05,
        });

        // Focus on input
        await emailInput.focus();
        await page.waitForTimeout(200);

        // Take focus state screenshot
        await expect(emailInput).toHaveScreenshot("email-input-focus.png", {
          threshold: 0.05,
        });

        // Type invalid email
        await emailInput.fill("invalid-email");
        await page.waitForTimeout(200);

        // Submit form to trigger validation
        const submitButton = form.locator('button[type="submit"]').first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(500);

          // Take validation error state screenshot
          await expect(emailInput).toHaveScreenshot("email-input-error.png", {
            threshold: 0.1, // Allow more variation for error states
          });
        }
      }
    }
  });

  test("loading states visual regression", async ({ page }) => {
    // Try to trigger loading states
    const submitButtons = page
      .locator('button[type="submit"], [class*="submit"], [class*="cta"]')
      .all();

    for (const button of await submitButtons) {
      if (await button.isVisible()) {
        // Take normal state
        await expect(button).toHaveScreenshot(
          `submit-button-normal-${Math.random()}.png`,
          {
            threshold: 0.05,
          },
        );

        // Click to potentially trigger loading
        try {
          await button.click();
          await page.waitForTimeout(1000);

          // Check if button shows loading state
          const isLoading = await button.evaluate(
            (el) =>
              el.textContent?.includes("Carregando") ||
              el.textContent?.includes("Loading") ||
              el.getAttribute("disabled") !== null ||
              el.classList.contains("loading"),
          );

          if (isLoading) {
            // Take loading state screenshot
            await expect(button).toHaveScreenshot(
              `submit-button-loading-${Math.random()}.png`,
              {
                threshold: 0.1,
              },
            );
          }
        } catch (e) {
          // Continue if click fails
        }
      }
    }
  });

  test("animation states visual regression", async ({ page }) => {
    // Wait for initial animations to complete
    await page.waitForTimeout(2000);

    const heroSection = page.locator('[data-section="hero"]');

    // Take screenshot after animations
    await expect(heroSection).toHaveScreenshot("hero-after-animations.png", {
      threshold: 0.1,
      fullPage: false,
    });

    // Scroll to trigger scroll-based animations
    const benefitsSection = page.locator('[data-section="benefits"]');
    if (await benefitsSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      await benefitsSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);

      // Take screenshot after scroll animations
      await expect(benefitsSection).toHaveScreenshot(
        "benefits-after-scroll.png",
        {
          threshold: 0.1,
          fullPage: false,
        },
      );
    }
  });

  test("theme consistency visual regression", async ({ page }) => {
    // Check if theme toggle exists
    const themeToggle = page
      .locator('[class*="theme"], [data-theme-toggle]')
      .first();

    if (await themeToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Take light theme screenshot
      await expect(page.locator("body")).toHaveScreenshot(
        "page-light-theme.png",
        {
          threshold: 0.05,
          fullPage: true,
        },
      );

      // Toggle theme
      await themeToggle.click();
      await page.waitForTimeout(1000); // Allow theme transition

      // Take dark theme screenshot
      await expect(page.locator("body")).toHaveScreenshot(
        "page-dark-theme.png",
        {
          threshold: 0.05,
          fullPage: true,
        },
      );
    } else {
      // If no theme toggle, just take a full page screenshot
      await expect(page.locator("body")).toHaveScreenshot(
        "page-full-screenshot.png",
        {
          threshold: 0.05,
          fullPage: true,
        },
      );
    }
  });

  test("responsive grid layouts visual regression", async ({ page }) => {
    const viewports = [
      { name: "mobile", width: 375, height: 667 },
      { name: "tablet", width: 768, height: 1024 },
      { name: "desktop", width: 1440, height: 900 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.waitForTimeout(1000);

      // Test benefits grid layout
      const benefitsSection = page.locator('[data-section="benefits"]');
      if (
        await benefitsSection.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        await benefitsSection.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);

        await expect(benefitsSection).toHaveScreenshot(
          `benefits-grid-${viewport.name}.png`,
          {
            threshold: 0.15, // Allow more variation for responsive layouts
            fullPage: false,
          },
        );
      }

      // Test pricing grid layout
      const pricingSection = page.locator(
        '[data-section="pricing"], [data-section="pricing-presale"]',
      );
      if (
        await pricingSection.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        await pricingSection.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);

        await expect(pricingSection).toHaveScreenshot(
          `pricing-grid-${viewport.name}.png`,
          {
            threshold: 0.15,
            fullPage: false,
          },
        );
      }
    }
  });
});
