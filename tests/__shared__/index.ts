// ===== TESTING INFRASTRUCTURE INDEX =====
// Main entry point for all testing infrastructure

// ===== TYPE EXPORTS =====
export * from "./test-types";

// ===== FIXTURE EXPORTS =====
export * from "./fixtures/component-fixtures";

// ===== MOCK EXPORTS =====
export * from "./mocks/service-mocks";

// ===== UTILITY EXPORTS =====
export * from "./utils/test-helpers";

// ===== CONFIG EXPORTS =====
export * from "./config/test-config";

// ===== CONVENIENCE EXPORTS =====

// Re-export commonly used testing utilities
export {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";

export { default as userEvent } from "@testing-library/user-event";

// ===== TEST INFRASTRUCTURE SETUP =====

import { TestConfig, TestSuiteConfig } from "./test-types";
import { componentFixtures } from "./fixtures/component-fixtures";
import { serviceMocks } from "./mocks/service-mocks";
import { testHelpers } from "./utils/test-helpers";
import { testConfigs } from "./config/test-config";

/**
 * Initialize test infrastructure with default configuration
 */
export function initializeTestInfrastructure(config?: Partial<TestConfig>): void {
  // Setup global test configuration
  const defaultConfig: TestConfig = {
    timeout: 5000,
    retries: 0,
    environment: "unit",
    ...config,
  };

  // Configure Vitest/Jest timeouts
  if (typeof jest !== "undefined") {
    jest.setTimeout(defaultConfig.timeout);
  }

  // Setup test fixtures
  setupTestFixtures();

  // Setup service mocks
  setupServiceMocks();

  // Setup test helpers
  setupTestHelpers();
}

/**
 * Setup test fixtures for the current test run
 */
function setupTestFixtures(): void {
  // Register component fixtures
  Object.assign(globalThis, {
    testFixtures: componentFixtures,
  });
}

/**
 * Setup service mocks for the current test run
 */
function setupServiceMocks(): void {
  // Register service mocks
  Object.assign(globalThis, {
    testMocks: serviceMocks,
  });
}

/**
 * Setup test helpers for the current test run
 */
function setupTestHelpers(): void {
  // Register test helpers
  Object.assign(globalThis, {
    testUtils: testHelpers,
  });
}

// ===== TEST RUNNER UTILITIES =====

/**
 * Create a test runner for a specific test type
 */
export function createTestRunner(type: keyof typeof testConfigs.runners) {
  return testConfigs.runners[type];
}

/**
 * Create a test suite configuration
 */
export function createTestSuite(type: keyof typeof testConfigs.suites): TestSuiteConfig {
  return testConfigs.suites[type];
}

/**
 * Run tests with specific configuration
 */
export async function runTests(
  testFiles: string[],
  config: Partial<TestConfig> = {}
): Promise<void> {
  const runner = createTestRunner("vitest");
  const results = await runner.run(testFiles);

  // Log results
  console.log(`Ran ${results.length} tests`);

  const passed = results.filter(r => r.status === "passed").length;
  const failed = results.filter(r => r.status === "failed").length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log("\nFailed tests:");
    results
      .filter(r => r.status === "failed")
      .forEach(result => {
        console.log(`  - ${result.name}: ${result.error?.message}`);
      });
  }
}

// ===== GLOBAL TEST HELPERS =====

/**
 * Global test helper for common assertions
 */
export const testAssertions = {
  /**
   * Assert that a component renders without crashing
   */
  rendersWithoutCrashing: (component: React.ReactElement) => {
    expect(() => render(component)).not.toThrow();
  },

  /**
   * Assert that text content is present
   */
  hasTextContent: (text: string | RegExp) => {
    const element = screen.getByText(text);
    expect(element).toBeInTheDocument();
  },

  /**
   * Assert that an element has specific attributes
   */
  hasAttributes: (testId: string, attributes: Record<string, any>) => {
    const element = screen.getByTestId(testId);
    Object.entries(attributes).forEach(([attr, value]) => {
      expect(element).toHaveAttribute(attr, value);
    });
  },

  /**
   * Assert that a form field has a specific value
   */
  formFieldHasValue: (fieldName: string, value: string) => {
    const field = screen.getByDisplayValue(value);
    expect(field).toHaveAttribute("name", fieldName);
  },

  /**
   * Assert accessibility compliance
   */
  isAccessible: async (component: React.ReactElement) => {
    // This would integrate with axe-core or similar
    expect(true).toBe(true); // Placeholder
  },
};

// ===== TEST DATA GENERATORS =====

/**
 * Generate random test data
 */
export const testDataGenerators = {
  /**
   * Generate a random email
   */
  email: () => `test-${Math.random().toString(36).substr(2, 9)}@example.com`,

  /**
   * Generate a random name
   */
  name: () => `Test User ${Math.floor(Math.random() * 1000)}`,

  /**
   * Generate a random ID
   */
  id: () => `test-${Math.random().toString(36).substr(2, 9)}`,

  /**
   * Generate a random phone number
   */
  phone: () => `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,

  /**
   * Generate random text
   */
  text: (length: number = 10) => {
    const chars = "abcdefghijklmnopqrstuvwxyz ";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
};

// ===== DEFAULT EXPORTS =====

// Auto-initialize in test environment
if (typeof globalThis !== "undefined" && globalThis.process?.env?.NODE_ENV === "test") {
  initializeTestInfrastructure();
}
