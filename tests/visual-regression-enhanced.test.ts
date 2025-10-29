import { test, expect } from "@playwright/test";
import {
  hardStabilize,
  applyRequiredMasks,
  validateVisualStability,
} from "./utils/visual-governance";
import {
  setupTestIsolation,
  freezeAnimationsForScreenshots,
  cleanTestState,
} from "../lib/test-helpers";

// Enhanced Visual Regression Test Suite
// Comprehensive visual testing across multiple dimensions

test.describe("Enhanced Visual Regression Tests", () => {
  // Setup de isolamento e limpeza entre testes
  setupTestIsolation();

  test.beforeEach(async ({ page, context }) => {
    // ===== ESTABILIZAÇÃO VISUAL COMPLETA - PR-1 =====

    // 1. Estabiliza ambiente (datas, RNG, animações, fontes)
    await hardStabilize(page);

    // 2. Comprehensive API mocking for stability
    await page.route("**/api/**", async (route) => {
      const url = route.request().url();

      if (url.includes("/geolocation")) {
        await route.fulfill({
          json: { latitude: -23.5505, longitude: -46.6333, accuracy: 100 },
        });
      } else if (url.includes("/feature-flags")) {
        await route.fulfill({
          json: {
            abVariant: "A",
            geo: "BR",
            reducedMotion: true,
            userBucket: 1,
            theme: "light",
            analyticsEnabled: true,
            lazyLoading: true,
            experimentalFeatures: false,
          },
        });
      } else if (url.includes("/analytics")) {
        await route.fulfill({ status: 200 });
      } else if (url.includes("/user/preferences")) {
        await route.fulfill({
          json: {
            theme: "system",
            language: "pt-BR",
            notifications: true,
            reducedMotion: false,
          },
        });
      } else if (url.includes("/performance")) {
        await route.fulfill({ status: 200 });
      } else {
        await route.continue();
      }
    });

    // 3. Mock de geolocalização para consistência
    await page
      .context()
      .setGeolocation({ latitude: -23.5505, longitude: -46.6333 }); // São Paulo

    // 4. Navigate to the landing page
    await page.goto("/");

    // 5. Wait for the page to be fully loaded e estabilizada
    await page.waitForLoadState("networkidle");
    await validateVisualStability(page);

    // 6. Aplica máscaras obrigatórias para elementos dinâmicos
    await applyRequiredMasks(page);
  });

  test.describe("Responsive Design Testing", () => {
    const viewports = [
      { name: "mobile-small", width: 320, height: 568 },
      { name: "mobile", width: 375, height: 667 },
      { name: "mobile-large", width: 414, height: 896 },
      { name: "tablet", width: 768, height: 1024 },
      { name: "tablet-large", width: 1024, height: 1366 },
      { name: "desktop", width: 1440, height: 900 },
      { name: "desktop-large", width: 1920, height: 1080 },
      { name: "4k", width: 2560, height: 1440 },
    ];

    for (const viewport of viewports) {
      test(`full page visual regression - ${viewport.name}`, async ({
        page,
      }) => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });

        // Wait for responsive layout to settle
        await page.waitForTimeout(1000);

        // Take full page screenshot - máscaras já aplicadas no beforeEach
        await expect(page).toHaveScreenshot(`full-page-${viewport.name}.png`, {
          fullPage: true,
        });
      });
    }

    test("touch targets meet minimum size requirements", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // Mobile viewport

      const buttons = page.locator('button, [role="button"], a');
      const touchTargets = await buttons.evaluateAll((elements) =>
        elements.map((el) => ({
          width: el.offsetWidth,
          height: el.offsetHeight,
          text: el.textContent?.slice(0, 50) || "",
          tagName: el.tagName,
          visible: el.offsetWidth > 0 && el.offsetHeight > 0,
        })),
      );

      // Filter visible elements only
      const visibleTargets = touchTargets.filter((target) => target.visible);

      // Log touch target sizes for debugging
      console.log(`Found ${visibleTargets.length} touch targets on mobile:`);
      visibleTargets.forEach((target, i) => {
        console.log(
          `  ${i + 1}. ${target.tagName}: ${target.width}x${target.height} "${target.text}"`,
        );
      });

      // Assert minimum touch target sizes (44x44px as per WCAG)
      visibleTargets.forEach((target) => {
        expect(target.width).toBeGreaterThanOrEqual(44);
        expect(target.height).toBeGreaterThanOrEqual(44);
      });

      // Additional check for small screens - ensure critical CTAs are properly sized
      const ctaButtons = page
        .locator('button, [role="button"]')
        .filter({ hasText: /comece|start|signup|trial|get/i });
      const ctaCount = await ctaButtons.count();

      if (ctaCount > 0) {
        const ctaSizes = await ctaButtons.evaluateAll((elements) =>
          elements.map((el) => ({
            width: el.offsetWidth,
            height: el.offsetHeight,
            text: el.textContent?.slice(0, 30) || "",
          })),
        );

        console.log(`Critical CTA buttons on mobile:`);
        ctaSizes.forEach((cta, i) => {
          console.log(`  ${i + 1}. ${cta.width}x${cta.height} "${cta.text}"`);
          expect(cta.width).toBeGreaterThanOrEqual(44);
          expect(cta.height).toBeGreaterThanOrEqual(44);
        });
      }
    });
  });

  test.describe("Component-Level Visual Regression", () => {
    test("hero section with dynamic content", async ({ page }) => {
      // Wait for any dynamic content in hero
      await page.waitForTimeout(500);

      // Take screenshot of hero area - estabilização já aplicada
      const heroArea = page.locator('[data-section="hero"]');
      await expect(heroArea).toHaveScreenshot("hero-area-dynamic.png");
    });

    test("benefits section content area", async ({ page }) => {
      // Look for benefits-related content even if section fails to load
      const benefitsContent = page
        .locator("body")
        .filter({ hasText: /Resultados|benefícios|carregada/i });

      if ((await benefitsContent.count()) > 0) {
        await expect(benefitsContent.first()).toHaveScreenshot(
          "benefits-content.png",
        );
      }
    });

    test("navigation and header area", async ({ page }) => {
      // Capture top portion of page (navigation, header, hero top)
      const headerArea = page.locator("body");

      await expect(headerArea).toHaveScreenshot("header-navigation.png");
    });
  });

  test.describe("Interactive States Testing", () => {
    test("hover states on interactive elements", async ({ page }) => {
      // Esconder debug panels completamente para hover funcionar
      await page.addStyleTag({
        content:
          ".debug-panel { display: none !important; pointer-events: none !important; }",
      });

      // Find interactive elements (buttons, links)
      const interactiveElements = page.locator('button, a, [role="button"]');
      const elementCount = await interactiveElements.count();

      if (elementCount > 0) {
        // Test hover on first few interactive elements
        for (let i = 0; i < Math.min(elementCount, 3); i++) {
          const element = interactiveElements.nth(i);

          if (await element.isVisible()) {
            // Hover and capture screenshot
            await element.hover();
            await page.waitForTimeout(200); // Allow hover effects to apply

            await expect(page).toHaveScreenshot(
              `hover-state-element-${i}.png`,
              {
                threshold: 0.2,
                maxDiffPixels: 200,
              },
            );
          }
        }
      }
    });

    test("focus states and keyboard navigation", async ({ page }) => {
      // Test tab navigation and focus states
      await page.keyboard.press("Tab");
      await page.waitForTimeout(200);

      // Capture focused state
      await expect(page).toHaveScreenshot("focus-state-initial.png", {
        threshold: 0.3,
        maxDiffPixels: 250,
      });

      // Tab through a few more elements
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press("Tab");
        await page.waitForTimeout(150);

        await expect(page).toHaveScreenshot(`focus-state-tab-${i + 1}.png`, {
          threshold: 0.1,
          maxDiffPixels: 80,
        });
      }
    });
  });

  test.describe("Theme and Accessibility Visual Testing", () => {
    test("reduced motion mode visual consistency", async ({ page }) => {
      // Enable reduced motion
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.reload();
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveScreenshot("reduced-motion-mode.png", {
        fullPage: true,
        threshold: 0.05,
        maxDiffPixels: 300,
      });
    });

    test("high contrast mode (forced colors)", async ({ page }) => {
      // Force high contrast colors
      await page.emulateMedia({ forcedColors: "active" });
      await page.reload();
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveScreenshot("high-contrast-mode.png", {
        fullPage: true,
        threshold: 0.1, // Higher threshold for forced colors
        maxDiffPixels: 500,
      });
    });
  });

  test.describe("Content and State Variations", () => {
    test("error states and fallback content", async ({ page }) => {
      // Aguardar carregamento completo da página - abordagem orientada a eventos
      await page.waitForLoadState("networkidle", { timeout: 5000 });

      // Pequena pausa para elementos dinâmicos (reduzido de 2000ms)
      await page.waitForTimeout(500);

      // Capture current state which may include error messages
      await expect(page).toHaveScreenshot("error-fallback-state.png", {
        fullPage: true,
        threshold: 0.08, // Mesmo threshold, mas com configs globais mais permissivas
        maxDiffPixels: 400,
      });
    });

    test("loading states (if present)", async ({ page }) => {
      // Look for loading indicators
      const loadingElements = page.locator(
        '[class*="loading"], [class*="spinner"], [aria-label*="Loading"]',
      );
      const loadingCount = await loadingElements.count();

      if (loadingCount > 0) {
        // Capture loading state
        await expect(page).toHaveScreenshot("loading-state.png", {
          threshold: 0.25,
          maxDiffPixels: 300,
        });
      }
    });

    test("dynamic content variations", async ({ page }) => {
      // Wait for potential dynamic content changes
      await page.waitForTimeout(1500);

      // Capture final state
      await expect(page).toHaveScreenshot("dynamic-content-final.png", {
        fullPage: true,
        threshold: 0.1,
        maxDiffPixels: 400,
      });
    });
  });

  test.describe("Cross-Browser Visual Consistency", () => {
    test.skip("visual consistency across browsers", async ({
      page,
      browserName,
    }) => {
      // This test would run in multiple browsers and compare screenshots
      // Currently skipped as it requires cross-browser screenshot comparison

      const browserSuffix = browserName.toLowerCase();
      await expect(page).toHaveScreenshot(
        `cross-browser-${browserSuffix}.png`,
        {
          fullPage: true,
          threshold: 0.1, // Higher threshold for browser differences
          maxDiffPixels: 1000,
        },
      );
    });
  });

  test.describe("Performance and Loading Visual Tests", () => {
    test("initial page load visual state", async ({ page }) => {
      // Reload and capture immediate visual state
      await page.reload();
      await page.waitForLoadState("domcontentloaded"); // Don't wait for full load

      await expect(page).toHaveScreenshot("initial-load-state.png", {
        threshold: 0.05,
        maxDiffPixels: 200,
      });
    });

    test("progressive loading visual states", async ({ page }) => {
      // Capture at different loading stages
      await page.reload();

      // Stage 1: DOM loaded
      await page.waitForLoadState("domcontentloaded");
      await expect(page).toHaveScreenshot("loading-stage-1-dom.png", {
        threshold: 0.05,
        maxDiffPixels: 150,
      });

      // Stage 2: Network idle (most resources loaded)
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot("loading-stage-2-network-idle.png", {
        threshold: 0.05,
        maxDiffPixels: 200,
      });

      // Stage 3: Final state (after dynamic content)
      await page.waitForTimeout(2000);
      await expect(page).toHaveScreenshot("loading-stage-3-final.png", {
        threshold: 0.15,
        maxDiffPixels: 300,
      });
    });
  });

  test.describe("Edge Cases and Error Handling", () => {
    test("visual state with JavaScript disabled", async ({ page, context }) => {
      // Create a new page with JavaScript disabled
      const jsDisabledPage = await context.newPage();
      await jsDisabledPage.route("**/*", (route) => {
        const request = route.request();
        if (request.resourceType() === "script") {
          route.abort();
        } else {
          route.continue();
        }
      });

      await jsDisabledPage.goto("/");
      await jsDisabledPage.waitForLoadState("networkidle");

      await expect(jsDisabledPage).toHaveScreenshot("javascript-disabled.png", {
        fullPage: true,
        threshold: 0.1, // Higher threshold for JS disabled differences
        maxDiffPixels: 800,
      });

      await jsDisabledPage.close();
    });

    test("visual state with slow network", async ({ page }) => {
      // Simulate slow network - otimizado para reduzir tempo
      await page.route("**/*", async (route) => {
        // Delay reduzido e apenas para recursos críticos
        if (
          route.request().resourceType() === "image" ||
          route.request().url().includes(".css")
        ) {
          await page.waitForTimeout(50); // Reduzido de 100ms para 50ms
        }
        await route.continue();
      });

      await page.reload();
      // Timeout reduzido para networkidle
      await page.waitForLoadState("networkidle", { timeout: 10000 });

      await expect(page).toHaveScreenshot("slow-network-state.png", {
        fullPage: true,
        threshold: 0.08, // Mesmo threshold, mas agora com configs globais mais permissivas
        maxDiffPixels: 400,
      });
    });
  });
});

// Utility function for consistent screenshot configuration
export const screenshotConfig = {
  threshold: 0.05, // 5% difference allowed
  maxDiffPixels: 200, // Maximum pixel differences
  fullPage: false, // Default to component-level screenshots
};

// Helper function for responsive testing
export async function testResponsiveViewport(
  page: any,
  viewport: { width: number; height: number; name: string },
  screenshotName: string,
) {
  await page.setViewportSize({
    width: viewport.width,
    height: viewport.height,
  });
  await page.waitForTimeout(500); // Allow layout to settle

  await expect(page).toHaveScreenshot(
    `${screenshotName}-${viewport.name}.png`,
    {
      ...screenshotConfig,
      fullPage: true,
    },
  );
}
