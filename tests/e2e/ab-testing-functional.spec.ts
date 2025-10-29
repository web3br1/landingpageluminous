import { test, expect } from "@playwright/test";
import { ExperimentManager } from "@/lib/ab-testing/experiment-manager";
import { AnalyticsTracker } from "@/lib/analytics/tracker";

test.describe("A/B Testing Functional E2E", () => {
  let experimentManager: ExperimentManager;
  let analyticsTracker: AnalyticsTracker;

  test.beforeEach(async ({ page }) => {
    // Initialize experiment manager
    experimentManager = new ExperimentManager({
      storage: "sessionStorage",
      apiEndpoint: "/api/experiments",
    });

    // Initialize analytics
    analyticsTracker = new AnalyticsTracker({
      apiEndpoint: "/api/analytics",
      userId: "test-user-" + Date.now(),
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test.describe("Experiment Assignment", () => {
    test("assigns user to experiment variants consistently", async ({
      page,
      context,
    }) => {
      // First visit - assign variant
      const variant1 = await page.evaluate(() => {
        return window.experimentManager?.getVariant("hero_headline");
      });

      expect(variant1).toBeDefined();
      expect(["A", "B", "control"]).toContain(variant1);

      // Refresh page - should get same variant
      await page.reload();
      await page.waitForLoadState("networkidle");

      const variant2 = await page.evaluate(() => {
        return window.experimentManager?.getVariant("hero_headline");
      });

      expect(variant2).toBe(variant1); // Should be consistent
    });

    test("different users get different variants", async ({ browser }) => {
      const variants: string[] = [];

      // Create multiple users
      for (let i = 0; i < 10; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.goto("/");
        await page.waitForLoadState("networkidle");

        const variant = await page.evaluate(() => {
          return window.experimentManager?.getVariant("hero_headline");
        });

        variants.push(variant!);

        await context.close();
      }

      // Should have some distribution (not all same variant)
      const uniqueVariants = [...new Set(variants)];
      expect(uniqueVariants.length).toBeGreaterThan(1);
    });

    test("respects experiment targeting rules", async ({ page }) => {
      // Test user from Brazil
      await page.evaluate(() => {
        Object.defineProperty(navigator, "language", { value: "pt-BR" });
      });

      await page.reload();

      const brVariant = await page.evaluate(() => {
        return window.experimentManager?.getVariant("pricing_currency");
      });

      expect(brVariant).toBe("BRL"); // Should show BRL pricing

      // Test user from US
      await page.evaluate(() => {
        Object.defineProperty(navigator, "language", { value: "en-US" });
      });

      await page.reload();

      const usVariant = await page.evaluate(() => {
        return window.experimentManager?.getVariant("pricing_currency");
      });

      expect(usVariant).toBe("USD"); // Should show USD pricing
    });
  });

  test.describe("Variant Rendering", () => {
    test("renders correct variant content", async ({ page }) => {
      // Force variant A
      await page.evaluate(() => {
        window.experimentManager?.setForcedVariant("hero_headline", "A");
      });

      await page.reload();

      // Check that variant A content is rendered
      const heroHeading = page.locator('[data-section="hero"] h1');
      await expect(heroHeading).toContainText("headline variant A");

      // Force variant B
      await page.evaluate(() => {
        window.experimentManager?.setForcedVariant("hero_headline", "B");
      });

      await page.reload();

      // Check that variant B content is rendered
      await expect(heroHeading).toContainText("headline variant B");
    });

    test("applies variant-specific styles", async ({ page }) => {
      // Test CTA color experiment
      await page.evaluate(() => {
        window.experimentManager?.setForcedVariant("cta_color", "blue");
      });

      await page.reload();

      const ctaButton = page.locator('[data-section="hero"] button').first();
      const buttonColor = await ctaButton.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor,
      );

      expect(buttonColor).toContain("0, 0, 255"); // RGB for blue

      // Test green variant
      await page.evaluate(() => {
        window.experimentManager?.setForcedVariant("cta_color", "green");
      });

      await page.reload();

      const greenButtonColor = await ctaButton.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor,
      );

      expect(greenButtonColor).toContain("0, 128, 0"); // RGB for green
    });
  });

  test.describe("Analytics Tracking", () => {
    test("tracks experiment impressions", async ({ page }) => {
      let impressionTracked = false;

      // Listen for analytics calls
      page.on("request", (request) => {
        if (
          request.url().includes("/api/analytics") &&
          request.method() === "POST"
        ) {
          const data = JSON.parse(request.postData() || "{}");
          if (
            data.event === "experiment_impression" &&
            data.experimentId === "hero_headline"
          ) {
            impressionTracked = true;
          }
        }
      });

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Wait for impression tracking
      await page.waitForTimeout(1000);

      expect(impressionTracked).toBe(true);
    });

    test("tracks experiment conversions", async ({ page }) => {
      // Assign to experiment variant
      await page.evaluate(() => {
        window.experimentManager?.setForcedVariant("hero_headline", "A");
      });

      await page.reload();

      let conversionTracked = false;

      // Listen for conversion events
      page.on("request", (request) => {
        if (
          request.url().includes("/api/analytics") &&
          request.method() === "POST"
        ) {
          const data = JSON.parse(request.postData() || "{}");
          if (
            data.event === "experiment_conversion" &&
            data.experimentId === "hero_headline" &&
            data.variant === "A"
          ) {
            conversionTracked = true;
          }
        }
      });

      // Perform conversion action (click CTA)
      const ctaButton = page.locator('[data-section="hero"] button').first();
      await ctaButton.click();

      // Wait for conversion tracking
      await page.waitForTimeout(500);

      expect(conversionTracked).toBe(true);
    });

    test("tracks interactions per variant", async ({ page }) => {
      const interactions: any[] = [];

      page.on("request", (request) => {
        if (
          request.url().includes("/api/analytics") &&
          request.method() === "POST"
        ) {
          const data = JSON.parse(request.postData() || "{}");
          if (data.experimentId) {
            interactions.push(data);
          }
        }
      });

      // Test variant A
      await page.evaluate(() => {
        window.experimentManager?.setForcedVariant("hero_headline", "A");
      });

      await page.reload();

      const ctaA = page.locator('[data-section="hero"] button').first();
      await ctaA.click();

      // Test variant B
      await page.evaluate(() => {
        window.experimentManager?.setForcedVariant("hero_headline", "B");
      });

      await page.reload();

      const ctaB = page.locator('[data-section="hero"] button').first();
      await ctaB.click();

      await page.waitForTimeout(1000);

      // Should have tracked interactions for both variants
      const variantAInteractions = interactions.filter(
        (i) => i.variant === "A",
      );
      const variantBInteractions = interactions.filter(
        (i) => i.variant === "B",
      );

      expect(variantAInteractions.length).toBeGreaterThan(0);
      expect(variantBInteractions.length).toBeGreaterThan(0);
    });
  });

  test.describe("Experiment Persistence", () => {
    test("persists variant assignment across sessions", async ({
      page,
      context,
    }) => {
      // Assign variant
      const variant1 = await page.evaluate(() => {
        const variant = window.experimentManager?.getVariant("hero_headline");
        window.experimentManager?.persistVariant("hero_headline", variant);
        return variant;
      });

      // Create new page (new session)
      const newPage = await context.newPage();
      await newPage.goto("/");
      await newPage.waitForLoadState("networkidle");

      // Should get same variant
      const variant2 = await newPage.evaluate(() => {
        return window.experimentManager?.getVariant("hero_headline");
      });

      expect(variant2).toBe(variant1);

      await newPage.close();
    });

    test("respects experiment rollout percentages", async ({ page }) => {
      // Test with 50% rollout
      await page.evaluate(() => {
        window.experimentManager?.setExperimentConfig("hero_headline", {
          rollout: 50, // 50% of users
          variants: ["A", "B"],
        });
      });

      let controlCount = 0;
      let variantCount = 0;

      // Test multiple users
      for (let i = 0; i < 100; i++) {
        await page.evaluate(() => {
          window.experimentManager?.clearStoredVariants(); // Fresh user
        });

        const variant = await page.evaluate(() => {
          return window.experimentManager?.getVariant("hero_headline");
        });

        if (variant === "control") controlCount++;
        else variantCount++;
      }

      // Should be roughly 50/50 distribution
      const totalAssigned = controlCount + variantCount;
      const variantPercentage = (variantCount / totalAssigned) * 100;

      expect(variantPercentage).toBeGreaterThan(40); // Allow some variance
      expect(variantPercentage).toBeLessThan(60);
    });
  });

  test.describe("Error Handling", () => {
    test("falls back gracefully when experiment service fails", async ({
      page,
    }) => {
      // Simulate experiment service failure
      await page.evaluate(() => {
        window.experimentManager?.disable();
      });

      await page.reload();

      // Page should still load with default content
      await expect(page.locator('[data-section="hero"]')).toBeVisible();
      await expect(page.locator("h1")).toBeVisible();

      // Should use control/default variants
      const variant = await page.evaluate(() => {
        return window.experimentManager?.getVariant("hero_headline");
      });

      expect(variant).toBe("control");
    });

    test("handles invalid experiment configurations", async ({ page }) => {
      // Set invalid experiment config
      await page.evaluate(() => {
        window.experimentManager?.setExperimentConfig("hero_headline", {
          variants: [], // Empty variants
          rollout: 100,
        });
      });

      await page.reload();

      // Should fall back to control
      const variant = await page.evaluate(() => {
        return window.experimentManager?.getVariant("hero_headline");
      });

      expect(variant).toBe("control");
    });
  });

  test.describe("Cross-Platform Consistency", () => {
    test("maintains variant assignment across devices", async ({ browser }) => {
      // Simulate mobile user agent
      const mobileContext = await browser.newContext({
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15",
      });

      const mobilePage = await mobileContext.newPage();
      await mobilePage.goto("/");
      await mobilePage.waitForLoadState("networkidle");

      const mobileVariant = await mobilePage.evaluate(() => {
        return window.experimentManager?.getVariant("hero_headline");
      });

      // Simulate desktop with same user identifier
      const desktopContext = await browser.newContext({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      });

      const desktopPage = await desktopContext.newPage();
      await desktopPage.goto("/");
      await desktopPage.waitForLoadState("networkidle");

      const desktopVariant = await desktopPage.evaluate(() => {
        return window.experimentManager?.getVariant("hero_headline");
      });

      // Should be consistent for same user
      expect(desktopVariant).toBe(mobileVariant);

      await mobileContext.close();
      await desktopContext.close();
    });
  });
});
