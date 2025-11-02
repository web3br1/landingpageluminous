import { defineConfig, devices } from "@playwright/test";

/**
 * @type {import('@playwright/test').PlaywrightTestConfig}
 */
export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results/visual",

  // Global setup for visual regression
  globalSetup: require.resolve("./tests/visual/setup.ts"),

  // Timeout for visual tests (longer due to screenshots)
  timeout: 60000,
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      threshold: 0.1, // 10% threshold for visual differences
      maxDiffPixels: 100,
    },
  },

  // Use only chromium for visual regression (consistent rendering)
  projects: [
    {
      name: "visual-regression",
      use: {
        ...devices["Desktop Chrome"],
        // Disable animations for consistent screenshots
        launchOptions: {
          args: [
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
          ],
        },
        // Screenshot configuration
        screenshot: "only-on-failure",
      },
      metadata: {
        type: "visual-regression",
      },
    },
  ],

  // Screenshot configuration is in use section below

  // Reporter for visual regression results
  reporter: [
    ["html", { outputFolder: "playwright-report/visual" }],
    ["json", { outputFile: "test-results/visual/results.json" }],
    ["github"],
  ],

  // Retry failed tests (useful for flaky visual tests)
  retries: process.env.CI ? 2 : 0,

  // Parallel execution (disabled for visual consistency)
  fullyParallel: false,

  // Workers (single worker for consistent results)
  workers: 1,
});
