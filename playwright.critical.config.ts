import { defineConfig, devices } from '@playwright/test';

/**
 * @type {import('@playwright/test').PlaywrightTestConfig}
 */
export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results/critical-paths',

  // Global setup for critical path tests
  globalSetup: require.resolve('./tests/e2e/setup.ts'),

  // Timeout for critical path tests
  timeout: 120000,
  expect: {
    timeout: 30000,
  },

  // Multiple browsers for critical paths
  projects: [
    {
      name: 'critical-chrome',
      use: {
        ...devices['Desktop Chrome'],
        // Enable video recording for critical paths
        video: 'retain-on-failure',
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
      },
      metadata: {
        type: 'critical-path',
        browser: 'chrome',
      },
    },
    {
      name: 'critical-firefox',
      use: {
        ...devices['Desktop Firefox'],
        video: 'retain-on-failure',
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
      },
      metadata: {
        type: 'critical-path',
        browser: 'firefox',
      },
    },
    {
      name: 'critical-mobile',
      use: {
        ...devices['Pixel 5'],
        video: 'retain-on-failure',
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
      },
      metadata: {
        type: 'critical-path',
        browser: 'mobile-chrome',
      },
    },
  ],

  // Reporter for critical path results
  reporter: [
    ['html', { outputFolder: 'playwright-report/critical-paths' }],
    ['json', { outputFile: 'test-results/critical-paths/results.json' }],
    ['junit', { outputFile: 'test-results/critical-paths/junit.xml' }],
    ['github'],
  ],

  // Retry failed critical path tests
  retries: process.env.CI ? 3 : 1,

  // Parallel execution (limited for critical paths)
  fullyParallel: false,

  // Workers (controlled for stability)
  workers: 2,

  // WebServer configuration for E2E
  webServer: {
    command: 'npm run dev',
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },

  // Global test configuration
  use: {
    baseURL: 'http://localhost:3000',
    // Capture all console logs
    launchOptions: {
      slowMo: process.env.CI ? 0 : 100,
    },
  },
});
