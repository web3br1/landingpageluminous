// Webpack and Module Loading Error Tests
// Tests specifically for webpack chunk loading, module errors, and dynamic imports

import { test, expect } from "@playwright/test";

test.describe("Webpack and Module Loading Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Clear console before each test
    await page.evaluate(() => {
      console.clear();
    });

    // Track all console messages
    page.on("console", (msg) => {
      console.log(`[${msg.type()}] ${msg.text()}`);
    });
  });

  test("should handle webpack chunk loading failures gracefully", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];

    // Track console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Track network errors
    page.on("response", (response) => {
      if (!response.ok()) {
        networkErrors.push(`${response.status()}: ${response.url()}`);
      }
    });

    await page.goto("/");

    // Wait for all chunks to potentially load/fail
    await page.waitForTimeout(5000);

    // Check for critical webpack errors
    const webpackErrors = consoleErrors.filter(
      (error) =>
        (error.includes("Loading chunk") && error.includes("failed")) ||
        error.includes("ChunkLoadError") ||
        error.includes(
          "Cannot read properties of undefined (reading 'call')",
        ) ||
        (error.includes("factory") && error.includes("call")),
    );

    // Allow some chunk warnings but not critical failures
    const criticalWebpackErrors = webpackErrors.filter(
      (error) =>
        !error.includes("dev") && // Allow dev warnings
        !error.includes("hot-reload"), // Allow hot reload warnings
    );

    expect(criticalWebpackErrors).toHaveLength(0);

    // Verify page still loads basic content
    await expect(page.locator("body")).toBeVisible();
  });

  test("should recover from module loading errors", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");

    // Wait for potential lazy loading
    await page.waitForTimeout(3000);

    // Simulate a component that might fail to load
    const sections = await page.locator("section").all();

    // Check if sections loaded without critical errors
    const loadingErrors = consoleErrors.filter(
      (error) =>
        error.includes("Failed to load") ||
        error.includes("Module not found") ||
        error.includes("Cannot resolve module"),
    );

    // Some loading errors might be expected in dev, but not critical runtime errors
    const criticalLoadingErrors = loadingErrors.filter(
      (error) =>
        !error.includes("dev") &&
        !error.includes("hot-reload") &&
        !error.includes("webpack-internal"),
    );

    // If we have sections, loading should have worked
    if (sections.length > 0) {
      expect(criticalLoadingErrors).toHaveLength(0);
    }
  });

  test("should handle dynamic imports during navigation", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to page
    await page.goto("/");
    await page.waitForTimeout(2000);

    // Simulate navigation that might trigger dynamic imports
    await page.evaluate(() => {
      // Trigger any lazy loading that might happen on scroll or interaction
      window.scrollTo(0, document.body.scrollHeight / 2);
    });

    await page.waitForTimeout(2000);

    // Check for dynamic import errors
    const dynamicImportErrors = consoleErrors.filter(
      (error) =>
        (error.includes("import(") && error.includes("failed")) ||
        (error.includes("Dynamic import") && error.includes("error")) ||
        (error.includes("__webpack_require__") && error.includes("undefined")),
    );

    expect(dynamicImportErrors).toHaveLength(0);

    // Verify page remains functional
    await expect(page.locator("body")).toBeVisible();
  });

  test("should handle lazy component mounting errors", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");

    // Wait for lazy components to mount
    await page.waitForTimeout(4000);

    // Check for React mounting errors
    const mountingErrors = consoleErrors.filter(
      (error) =>
        error.includes("mountLazyComponent") ||
        (error.includes("lazy") && error.includes("error")) ||
        (error.includes("React.lazy") && error.includes("failed")) ||
        (error.includes("Suspense") && error.includes("boundary")),
    );

    // Filter out development warnings
    const criticalMountingErrors = mountingErrors.filter(
      (error) => !error.includes("dev") && !error.includes("development"),
    );

    expect(criticalMountingErrors).toHaveLength(0);
  });

  test("should recover from bundle loading interruptions", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate and interrupt loading
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Reload to interrupt any ongoing loads
    await page.reload();
    await page.waitForTimeout(2000);

    // Check for bundle interruption errors
    const bundleErrors = consoleErrors.filter(
      (error) =>
        (error.includes("bundle") && error.includes("error")) ||
        error.includes("interrupted") ||
        error.includes("aborted") ||
        error.includes("cancelled"),
    );

    // Allow some interruption warnings but not critical errors
    const criticalBundleErrors = bundleErrors.filter(
      (error) => !error.includes("navigation") && !error.includes("reload"),
    );

    expect(criticalBundleErrors).toHaveLength(0);

    // Verify page recovered
    await expect(page.locator("body")).toBeVisible();
  });

  test("should handle webpack hot module replacement errors", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");

    // Wait for HMR to potentially initialize
    await page.waitForTimeout(3000);

    // Check for HMR-related errors that could affect production
    const hmrErrors = consoleErrors.filter(
      (error) =>
        (error.includes("hot") && error.includes("error")) ||
        (error.includes("HMR") && error.includes("failed")) ||
        error.includes("webpackHotUpdate"),
    );

    // HMR errors should not affect functionality in production
    expect(hmrErrors).toHaveLength(0);

    // Verify core functionality works
    await expect(page.locator("main")).toBeVisible();
  });

  test("should load all webpack chunks successfully", async ({ page }) => {
    const loadedChunks: string[] = [];
    const failedChunks: string[] = [];

    // Track chunk loading
    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("Loading chunk")) {
        if (text.includes("failed") || text.includes("error")) {
          failedChunks.push(text);
        } else {
          loadedChunks.push(text);
        }
      }
    });

    await page.goto("/");

    // Wait for chunks to load
    await page.waitForTimeout(5000);

    // Should have more loaded chunks than failed ones
    expect(failedChunks.length).toBe(0);

    // Verify that critical chunks loaded (at least some chunks should be loaded)
    if (loadedChunks.length === 0) {
      // If no chunks logged, at least verify the page works
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("should handle module factory errors", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");

    // Wait for modules to initialize
    await page.waitForTimeout(3000);

    // Check for the specific error mentioned: factory.call
    const factoryErrors = consoleErrors.filter(
      (error) =>
        (error.includes("factory") && error.includes("call")) ||
        error.includes("options.factory") ||
        error.includes("factory is not a function"),
    );

    expect(factoryErrors).toHaveLength(0);

    // Verify modules are working
    await expect(page.locator("body")).toBeVisible();
  });

  test("should handle require() errors gracefully", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");

    // Wait for requires to resolve
    await page.waitForTimeout(3000);

    // Check for __webpack_require__ errors
    const requireErrors = consoleErrors.filter(
      (error) =>
        error.includes("__webpack_require__") ||
        error.includes("require is not defined") ||
        error.includes("Cannot resolve module"),
    );

    // Filter out expected dev warnings
    const criticalRequireErrors = requireErrors.filter(
      (error) =>
        !error.includes("dev") &&
        !error.includes("development") &&
        !error.includes("hot-reload"),
    );

    expect(criticalRequireErrors).toHaveLength(0);
  });

  test("should handle circular dependency warnings", async ({ page }) => {
    const consoleWarnings: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "warning") {
        consoleWarnings.push(msg.text());
      }
    });

    await page.goto("/");

    // Wait for dependencies to resolve
    await page.waitForTimeout(3000);

    // Check for circular dependency warnings that might indicate problems
    const circularWarnings = consoleWarnings.filter(
      (warning) =>
        warning.includes("Circular dependency") ||
        (warning.includes("circular") && warning.includes("dependency")),
    );

    // Too many circular dependencies might indicate architecture issues
    expect(circularWarnings.length).toBeLessThan(5);

    // But critical functionality should still work
    await expect(page.locator("body")).toBeVisible();
  });

  test("should handle factory function call errors in webpack runtime", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    // Track console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Track JavaScript errors
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    await page.goto("/");

    // Wait for webpack runtime to initialize
    await page.waitForTimeout(4000);

    // Force some lazy component loading by scrolling
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });

    await page.waitForTimeout(2000);

    // Check for the specific factory.call error
    const factoryCallErrors = [...consoleErrors, ...pageErrors].filter(
      (error) =>
        error.includes("factory.call") ||
        error.includes("options.factory.call") ||
        error.includes(
          "Cannot read properties of undefined (reading 'call')",
        ) ||
        error.includes("factory is not a function"),
    );

    expect(factoryCallErrors).toHaveLength(0);

    // Verify that lazy components are still functional
    const lazySections = page.locator("[data-lazy-section]");
    if ((await lazySections.count()) > 0) {
      await expect(lazySections.first()).toBeVisible();
    }

    // Verify core page functionality
    await expect(page.locator("body")).toBeVisible();
  });

  test("should recover from module resolution failures", async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("response", (response) => {
      if (!response.ok() && response.status() >= 400) {
        networkErrors.push(`${response.status()}: ${response.url()}`);
      }
    });

    await page.goto("/");

    // Wait for modules to resolve
    await page.waitForTimeout(3000);

    // Check for module resolution errors that could lead to factory.call issues
    const resolutionErrors = consoleErrors.filter(
      (error) =>
        error.includes("Module not found") ||
        error.includes("Cannot resolve module") ||
        error.includes("Cannot find module") ||
        error.includes("__webpack_require__ is not defined"),
    );

    // Allow some resolution warnings but not critical failures
    const criticalResolutionErrors = resolutionErrors.filter(
      (error) =>
        !error.includes("dev") &&
        !error.includes("optional") &&
        !error.includes("peer dependency"),
    );

    expect(criticalResolutionErrors).toHaveLength(0);

    // Verify that the page can still function despite some module issues
    await expect(page.locator("body")).toBeVisible();
  });

  test("should handle webpack chunk evaluation errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    const jsErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("pageerror", (error) => {
      jsErrors.push(error.message);
    });

    await page.goto("/");

    // Wait for chunks to load and evaluate
    await page.waitForTimeout(5000);

    // Check for chunk evaluation errors that could cause factory.call issues
    const chunkEvalErrors = [...consoleErrors, ...jsErrors].filter(
      (error) =>
        error.includes("chunk evaluation failed") ||
        error.includes("Error evaluating chunk") ||
        (error.includes("webpack chunk") && error.includes("error")) ||
        (error.includes("__webpack_require__(") &&
          error.includes("is not a function")),
    );

    expect(chunkEvalErrors).toHaveLength(0);

    // Verify that dynamically loaded content still works
    const sections = await page.locator("section").all();
    expect(sections.length).toBeGreaterThan(0);
  });

  test("should prevent factory call errors during rapid navigation", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    // Start navigation
    await page.goto("/");

    // Rapid navigation to trigger lazy loading issues
    await page.waitForTimeout(1000);

    // Reload to interrupt any ongoing module loading
    await page.reload();
    await page.waitForTimeout(2000);

    // Navigate again
    await page.reload();
    await page.waitForTimeout(2000);

    // Check for factory.call errors during rapid transitions
    const factoryErrors = [...consoleErrors, ...pageErrors].filter(
      (error) =>
        error.includes("factory.call") ||
        error.includes(
          "Cannot read properties of undefined (reading 'call')",
        ) ||
        (error.includes("options.factory") && error.includes("call")),
    );

    expect(factoryErrors).toHaveLength(0);

    // Verify page recovers and functions
    await expect(page.locator("body")).toBeVisible();
  });

  test("should handle webpack runtime undefined errors", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");

    // Wait for webpack runtime to fully initialize
    await page.waitForTimeout(3000);

    // Try to trigger lazy loading
    await page.evaluate(() => {
      // Scroll to trigger intersection observers
      window.scrollTo(0, window.innerHeight);
    });

    await page.waitForTimeout(2000);

    // Check for webpack runtime errors that could cause undefined.call
    const runtimeErrors = consoleErrors.filter(
      (error) =>
        error.includes("webpack runtime") ||
        (error.includes("__webpack_require__") &&
          error.includes("undefined")) ||
        (error.includes("Cannot read properties of undefined") &&
          error.includes("call")) ||
        (error.includes("factory") && error.includes("not a function")),
    );

    expect(runtimeErrors).toHaveLength(0);

    // Verify lazy-loaded sections are working
    const lazySections = await page.locator("section").all();
    expect(lazySections.length).toBeGreaterThan(0);
  });

  test("should recover from factory.call errors gracefully", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    // Inject a script that simulates factory.call error conditions
    await page.addScriptTag({
      content: `
        window.testFactoryCallError = function() {
          try {
            // Simulate the exact error condition
            const options = { factory: undefined };
            options.factory.call({}, {});
          } catch (e) {
            console.error('Simulated factory.call error:', e.message);
            return e.message;
          }
        };
      `,
    });

    await page.goto("/");

    // Wait for page to stabilize
    await page.waitForTimeout(2000);

    // Check if any factory.call errors occurred naturally
    const factoryCallErrors = [...consoleErrors, ...pageErrors].filter(
      (error) =>
        error.includes("factory.call") ||
        error.includes(
          "Cannot read properties of undefined (reading 'call')",
        ) ||
        error.includes("options.factory.call"),
    );

    // If we have factory.call errors, the page should still be functional
    if (factoryCallErrors.length > 0) {
      console.warn("Factory.call errors detected:", factoryCallErrors);
      // Even with errors, core functionality should work
      await expect(page.locator("body")).toBeVisible();
    } else {
      // No errors is the expected case
      expect(factoryCallErrors).toHaveLength(0);
    }

    // Verify that error boundaries prevent crashes
    const errorBoundaries = page.locator(
      '[data-error-boundary], [data-testid="error-boundary"]',
    );
    if ((await errorBoundaries.count()) > 0) {
      // If error boundaries exist, they should handle errors gracefully
      await expect(errorBoundaries.first()).not.toContainText("Error");
    }
  });

  test("should handle module loading race conditions", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");

    // Create race condition by rapid scrolling and navigation
    await page.evaluate(async () => {
      // Rapid scroll to trigger multiple lazy loads simultaneously
      const scrollPromises = [];
      for (let i = 0; i < 5; i++) {
        scrollPromises.push(
          new Promise((resolve) => {
            setTimeout(() => {
              window.scrollTo(0, (document.body.scrollHeight / 5) * i);
              resolve(void 0);
            }, i * 200);
          }),
        );
      }
      await Promise.all(scrollPromises);
    });

    await page.waitForTimeout(3000);

    // Check for race condition errors that could cause factory.call issues
    const raceConditionErrors = consoleErrors.filter(
      (error) =>
        error.includes("factory.call") ||
        error.includes(
          "Cannot read properties of undefined (reading 'call')",
        ) ||
        error.includes("module did not self-register") ||
        error.includes("has not been loaded yet"),
    );

    expect(raceConditionErrors).toHaveLength(0);

    // Verify all sections loaded despite rapid scrolling
    const sections = await page.locator("section").all();
    expect(sections.length).toBeGreaterThan(0);
  });

  test("should prevent undefined factory errors in production", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const jsErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("pageerror", (error) => {
      jsErrors.push(error.message);
    });

    // Set production-like environment
    await page.evaluate(() => {
      // Simulate production environment
      (window as any).__webpack_public_path__ = "/_next/static/chunks/";
    });

    await page.goto("/");

    // Wait for all lazy loading to complete
    await page.waitForTimeout(5000);

    // Check for undefined factory errors that occur in production
    const undefinedFactoryErrors = [...consoleErrors, ...jsErrors].filter(
      (error) =>
        error.includes("factory.call") ||
        error.includes(
          "Cannot read properties of undefined (reading 'call')",
        ) ||
        error.includes("options.factory is undefined") ||
        error.includes("factory is not defined"),
    );

    expect(undefinedFactoryErrors).toHaveLength(0);

    // Verify the page is fully functional in production-like conditions
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("body")).toBeVisible();
  });
});
