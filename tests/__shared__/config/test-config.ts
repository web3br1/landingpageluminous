// ===== TEST CONFIGURATION =====
// Configuration management for different test environments and scenarios

import { TestConfig, TestSuiteConfig, TestRunner } from "../test-types";

// ===== ENVIRONMENT CONFIGS =====

export const testEnvironments = {
  unit: {
    timeout: 5000,
    retries: 0,
    environment: "unit" as const,
  },

  integration: {
    timeout: 10000,
    retries: 2,
    environment: "integration" as const,
  },

  e2e: {
    timeout: 30000,
    retries: 3,
    environment: "e2e" as const,
  },
} as const;

// ===== BROWSER CONFIGS =====

export const browserConfigs = {
  chromium: {
    browser: "chromium" as const,
    viewport: { width: 1280, height: 720 },
    device: "desktop",
    locale: "en-US",
    timezone: "America/New_York",
  },

  firefox: {
    browser: "firefox" as const,
    viewport: { width: 1280, height: 720 },
    device: "desktop",
    locale: "en-US",
    timezone: "America/New_York",
  },

  webkit: {
    browser: "webkit" as const,
    viewport: { width: 1280, height: 720 },
    device: "desktop",
    locale: "en-US",
    timezone: "America/New_York",
  },
} as const;

// ===== DEVICE CONFIGS =====

export const deviceConfigs = {
  mobile: {
    viewport: { width: 375, height: 667 },
    device: "mobile",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
  },

  tablet: {
    viewport: { width: 768, height: 1024 },
    device: "tablet",
    userAgent: "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
  },

  desktop: {
    viewport: { width: 1440, height: 900 },
    device: "desktop",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  },

  desktopLarge: {
    viewport: { width: 1920, height: 1080 },
    device: "desktop",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  },
} as const;

// ===== TEST SUITE CONFIGS =====

export const componentTestSuite: TestSuiteConfig = {
  ...testEnvironments.unit,
  fixtures: [], // Will be populated by component-fixtures
  mocks: [], // Will be populated by service-mocks
  helpers: [], // Will be populated by test-helpers
  setup: [
    () => {
      // Setup DOM environment for components
      document.body.innerHTML = "";
    },
  ],
  teardown: [
    () => {
      // Cleanup after each test
      jest.clearAllMocks();
    },
  ],
};

export const integrationTestSuite: TestSuiteConfig = {
  ...testEnvironments.integration,
  fixtures: [],
  mocks: [],
  helpers: [],
  setup: [
    async () => {
      // Setup database connections
      // Setup external service mocks
    },
  ],
  teardown: [
    async () => {
      // Cleanup database
      // Reset external services
    },
  ],
};

export const e2eTestSuite: TestSuiteConfig = {
  ...testEnvironments.e2e,
  ...browserConfigs.chromium,
  fixtures: [],
  mocks: [],
  helpers: [],
  setup: [
    async () => {
      // Launch browser
      // Navigate to test environment
    },
  ],
  teardown: [
    async () => {
      // Close browser
      // Cleanup test data
    },
  ],
};

// ===== TEST RUNNERS =====

export const vitestRunner: TestRunner = {
  name: "vitest-unit",
  framework: "vitest",
  config: testEnvironments.unit,
  run: async (tests: string[]) => {
    // Implementation would integrate with Vitest
    return [];
  },
};

export const playwrightRunner: TestRunner = {
  name: "playwright-e2e",
  framework: "playwright",
  config: e2eTestSuite,
  run: async (tests: string[]) => {
    // Implementation would integrate with Playwright
    return [];
  },
};

// ===== UTILITY FUNCTIONS =====

export function createTestConfig(
  environment: keyof typeof testEnvironments,
  overrides: Partial<TestConfig> = {}
): TestConfig {
  return {
    ...testEnvironments[environment],
    ...overrides,
  };
}

export function createBrowserTestConfig(
  browser: keyof typeof browserConfigs,
  environment: keyof typeof testEnvironments = "e2e",
  overrides: Partial<TestConfig> = {}
): TestConfig {
  return {
    ...testEnvironments[environment],
    ...browserConfigs[browser],
    ...overrides,
  };
}

export function createDeviceTestConfig(
  device: keyof typeof deviceConfigs,
  browser: keyof typeof browserConfigs = "chromium",
  environment: keyof typeof testEnvironments = "e2e",
  overrides: Partial<TestConfig> = {}
): TestConfig {
  return {
    ...testEnvironments[environment],
    ...browserConfigs[browser],
    ...deviceConfigs[device],
    ...overrides,
  };
}

export function mergeTestConfigs(...configs: Partial<TestConfig>[]): TestConfig {
  return configs.reduce((merged, config) => ({ ...merged, ...config }), {} as TestConfig);
}

// ===== ENVIRONMENT DETECTION =====

export function getCurrentTestEnvironment(): keyof typeof testEnvironments {
  if (typeof window !== "undefined") {
    return "e2e";
  }

  if (process.env.NODE_ENV === "test" && process.env.TEST_TYPE === "integration") {
    return "integration";
  }

  return "unit";
}

export function isCI(): boolean {
  return !!(
    process.env.CI ||
    process.env.CONTINUOUS_INTEGRATION ||
    process.env.BUILD_NUMBER ||
    process.env.CIRCLECI ||
    process.env.TRAVIS ||
    process.env.GITHUB_ACTIONS
  );
}

export function shouldRunSlowTests(): boolean {
  return !isCI() || process.env.RUN_SLOW_TESTS === "true";
}

export function getTestTimeout(): number {
  const env = getCurrentTestEnvironment();
  const baseTimeout = testEnvironments[env].timeout;

  if (isCI()) {
    return baseTimeout * 2; // Double timeout in CI
  }

  return baseTimeout;
}

// ===== TEST FILTERING =====

export function shouldSkipTest(testName: string, tags: string[] = []): boolean {
  // Skip slow tests in CI unless explicitly requested
  if (!shouldRunSlowTests() && tags.includes("slow")) {
    return true;
  }

  // Skip flaky tests unless explicitly requested
  if (process.env.SKIP_FLAKY !== "false" && tags.includes("flaky")) {
    return true;
  }

  // Skip visual regression tests unless explicitly requested
  if (process.env.RUN_VISUAL !== "true" && tags.includes("visual")) {
    return true;
  }

  return false;
}

export function getTestTags(testName: string): string[] {
  const tags: string[] = [];

  if (testName.toLowerCase().includes("slow")) {
    tags.push("slow");
  }

  if (testName.toLowerCase().includes("flaky")) {
    tags.push("flaky");
  }

  if (testName.toLowerCase().includes("visual")) {
    tags.push("visual");
  }

  if (testName.toLowerCase().includes("accessibility") || testName.toLowerCase().includes("a11y")) {
    tags.push("accessibility");
  }

  if (testName.toLowerCase().includes("performance") || testName.toLowerCase().includes("perf")) {
    tags.push("performance");
  }

  return tags;
}

// ===== CONFIG EXPORTS =====

export const testConfigs = {
  environments: testEnvironments,
  browsers: browserConfigs,
  devices: deviceConfigs,
  suites: {
    component: componentTestSuite,
    integration: integrationTestSuite,
    e2e: e2eTestSuite,
  },
  runners: {
    vitest: vitestRunner,
    playwright: playwrightRunner,
  },
} as const;

export type TestConfigType = keyof typeof testConfigs;
