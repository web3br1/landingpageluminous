/**
 * 🧪 Centralized Test Utilities & Mocks Library
 *
 * This file provides comprehensive mocks and utilities for testing,
 * based on patterns identified during test corrections.
 *
 * @see docs/testing-patterns.md for detailed patterns and usage
 */

import { vi } from "vitest";

// =============================================================================
// BROWSER APIs MOCKS
// =============================================================================

/**
 * Comprehensive matchMedia mock for CSS media queries
 * Required by: Framer Motion, responsive components
 */
export const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  // Legacy methods (deprecated but still used)
  addListener: vi.fn(),
  removeListener: vi.fn(),
  // Modern methods
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

/**
 * ResizeObserver mock for responsive layouts
 * Required by: Dynamic layouts, responsive components
 */
export const mockResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

/**
 * IntersectionObserver mock for lazy loading and scroll triggers
 * Required by: Lazy components, scroll animations
 */
export const mockIntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: "",
  thresholds: [],
}));

/**
 * PerformanceObserver mock for performance monitoring
 * Required by: Performance tracking, Core Web Vitals
 */
class MockPerformanceObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
  static supportedEntryTypes = [
    "largest-contentful-paint",
    "layout-shift",
    "first-input",
    "navigation",
    "resource",
    "longtask",
    "paint",
  ];
}

export const mockPerformanceObserver = MockPerformanceObserver;

// =============================================================================
// BROWSER APIs SETUP UTILITIES
// =============================================================================

/**
 * Setup comprehensive browser APIs mocks
 * Call this in test setup or beforeEach for components that use browser APIs
 */
export function setupBrowserAPIs() {
  // Media queries
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: mockMatchMedia,
  });

  // Resize Observer
  global.ResizeObserver = mockResizeObserver;

  // Intersection Observer
  global.IntersectionObserver = mockIntersectionObserver;

  // Performance Observer
  global.PerformanceObserver = mockPerformanceObserver;

  // Additional common browser APIs that might be needed
  Object.defineProperty(window, "requestAnimationFrame", {
    writable: true,
    value: vi.fn().mockImplementation((cb) => setTimeout(cb, 16)),
  });

  Object.defineProperty(window, "cancelAnimationFrame", {
    writable: true,
    value: vi.fn(),
  });
}

/**
 * Reset all browser API mocks to clean state
 */
export function resetBrowserAPIs() {
  mockMatchMedia.mockClear();
  mockResizeObserver.mockClear();
  mockIntersectionObserver.mockClear();
  // mockPerformanceObserver is a class, no mockClear needed
}

// =============================================================================
// UTILITY FUNCTIONS FOR TESTS
// =============================================================================

/**
 * Validate date strings in ISO 8601 format
 * Supports: YYYY-MM-DD, YYYY-MM-DDTHH:mm:ssZ, YYYY-MM-DDTHH:mm:ss.sssZ
 */
export function isValidDateString(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== "string") {
    return false;
  }

  // ISO 8601 date formats
  const iso8601Regex =
    /^(\d{4})-(\d{2})-(\d{2})(T(\d{2}):(\d{2}):(\d{2})(\.(\d{3}))?Z?)?$/;

  if (iso8601Regex.test(dateStr)) {
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
  }

  return false;
}

/**
 * Format currency for Brazilian locale
 */
export function formatCurrency(amount: number, currency = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Generate random ID for tests
 */
export function generateTestId(prefix = "test"): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// ASYNC TESTING HELPERS
// =============================================================================

/**
 * Wait for component to stabilize after async operations
 */
export async function waitForStableState(timeout = 100): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

/**
 * Create a delay function that can be controlled in tests
 */
export function createControllableDelay() {
  let resolveDelay: (() => void) | null = null;
  let delayPromise: Promise<void> | null = null;

  const delay = (ms: number) => {
    delayPromise = new Promise<void>((resolve) => {
      resolveDelay = resolve;
      setTimeout(resolve, ms);
    });
    return delayPromise;
  };

  const resolve = () => {
    if (resolveDelay) {
      resolveDelay();
      resolveDelay = null;
    }
  };

  return {
    delay,
    resolve,
    get promise() {
      return delayPromise;
    },
  };
}

// =============================================================================
// TEST DATA GENERATORS
// =============================================================================

/**
 * Generate mock user data for tests
 */
export function createMockUser(overrides = {}) {
  return {
    id: generateTestId("user"),
    name: "João Silva",
    email: "joao.silva@email.com",
    company: "Empresa Exemplo",
    role: "CEO",
    ...overrides,
  };
}

/**
 * Generate mock form data
 */
export function createMockFormData(overrides = {}) {
  return {
    name: "Test User",
    email: "test@email.com",
    company: "Test Company",
    role: "Manager",
    ...overrides,
  };
}

// =============================================================================
// ASSERTION HELPERS (MOVED TO test-helpers.ts)
// =============================================================================

// These assertion helpers have been moved to lib/test-helpers.ts
// to avoid TypeScript build issues with Vitest globals

// =============================================================================
// PERFORMANCE TESTING HELPERS
// =============================================================================

/**
 * Measure execution time of a function
 */
export async function measureExecutionTime<T>(
  fn: () => T | Promise<T>,
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

/**
 * Mock performance.mark for performance testing
 */
export const mockPerformanceMark = vi.fn();

// Setup performance mocking
Object.defineProperty(window.performance, "mark", {
  writable: true,
  value: mockPerformanceMark,
});

// =============================================================================
// EXPORT ALL UTILITIES
// =============================================================================

export {
  // Re-export vitest utilities for convenience
  vi,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from "vitest";

export {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";

export { userEvent } from "@testing-library/user-event";
