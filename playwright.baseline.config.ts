import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  testMatch: ["**/hydration.test.ts", "**/ssr.test.ts"],
  use: {
    baseURL: "http://localhost:3002",
    headless: true,
    viewport: {
      width: 1280,
      height: 720,
    },
    ignoreHTTPSErrors: true,
    bypassCSP: true,
    launchOptions: {
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    },
  },
  workers: 1,
  retries: 0,
  reporter: [
    ["line"],
    [
      "json",
      {
        outputFile: "baseline-results.json",
      },
    ],
  ],
  expect: {
    timeout: 10000,
  },
  outputDir: "test-results-baseline",
});
