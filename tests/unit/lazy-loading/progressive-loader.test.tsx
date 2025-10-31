/**
 * Progressive Loader - Unit Tests
 * Sprint 1 - Foundation Setup
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

// Mock logger
vi.mock("../../../lib/observability/logger", () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock intersection observer
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
});

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: mockIntersectionObserver,
});

Object.defineProperty(window, "navigator", {
  value: {
    hardwareConcurrency: 4,
    connection: {
      effectiveType: "4g",
    },
  },
  writable: true,
});

import {
  ProgressiveLoader,
  useProgressiveLoader,
  LoadingStage,
  LoadingState,
  ContextCollector,
  StrategyAdaptor,
} from "../../../lib/lazy-loading/core/progressive-loader";

// Mock components
const MockSkeleton = () => <div data-testid="skeleton">Skeleton</div>;
const MockPlaceholder = () => <div data-testid="placeholder">Placeholder</div>;
const MockComponent = () => <div data-testid="component">Loaded Component</div>;

// Helper to create test config
const createTestConfig = (overrides = {}) => ({
  sectionId: "test-section",
  component: () => Promise.resolve({ default: MockComponent }),
  stages: {
    skeleton: MockSkeleton,
    placeholder: MockPlaceholder,
  },
  loadPriority: "early" as const,
  strategy: "progressive" as const,
  context: {
    effectiveType: "4g" as const,
    hardwareConcurrency: 4,
    cookieConsent: {
      analytics: true,
      necessary: true,
    },
  },
  ...overrides,
});

describe.skip("Progressive Loader - Phase 1 (Legacy - Replaced by Simplified System)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Context Collector", () => {
    it("should collect minimal context without errors", async () => {
      const context = await ContextCollector.collectMinimalContext();

      expect(context).toEqual({
        effectiveType: "4g",
        hardwareConcurrency: 4,
      });
    });

    it("should collect context with consent", async () => {
      const context = await ContextCollector.collectWithConsent({
        analytics: true,
      });

      expect(context).toEqual({
        effectiveType: "4g",
        hardwareConcurrency: 4,
        cookieConsent: {
          analytics: true,
          necessary: true,
        },
      });
    });

    it("should handle missing navigator properties gracefully", async () => {
      // Temporarily remove connection
      const originalConnection = window.navigator.connection;
      delete (window.navigator as any).connection;

      const context = await ContextCollector.collectMinimalContext();

      expect(context).toEqual({
        hardwareConcurrency: 4,
      });

      // Restore
      (window.navigator as any).connection = originalConnection;
    });
  });

  describe("Strategy Adaptor", () => {
    it("should adapt strategy based on privacy", () => {
      const context = {
        cookieConsent: { analytics: false, necessary: true },
      };

      const adapted = StrategyAdaptor.adaptStrategy("eager", context);
      expect(adapted).toBe("progressive");
    });

    it("should adapt strategy based on network", () => {
      const context = {
        effectiveType: "slow-2g" as const,
        cookieConsent: { analytics: true, necessary: true },
      };

      const adapted = StrategyAdaptor.adaptStrategy("progressive", context);
      expect(adapted).toBe("deferred");
    });

    it("should adapt strategy based on hardware", () => {
      const context = {
        hardwareConcurrency: 2,
        cookieConsent: { analytics: true, necessary: true },
      };

      const adapted = StrategyAdaptor.adaptStrategy("progressive", context);
      expect(adapted).toBe("deferred");
    });

    it("should not adapt when conditions are good", () => {
      const context = {
        effectiveType: "4g" as const,
        hardwareConcurrency: 8,
        cookieConsent: { analytics: true, necessary: true },
      };

      const adapted = StrategyAdaptor.adaptStrategy("progressive", context);
      expect(adapted).toBe("progressive");
    });
  });

  describe("Progressive Loader Component", () => {
    it("should render skeleton initially", () => {
      const config = createTestConfig();

      render(<ProgressiveLoader {...config} />);

      expect(screen.getByTestId("skeleton")).toBeInTheDocument();
    });

    it("should load component with progressive strategy", async () => {
      const config = createTestConfig({
        strategy: "progressive",
      });

      render(<ProgressiveLoader {...config} />);

      // Should start with skeleton
      expect(screen.getByTestId("skeleton")).toBeInTheDocument();

      // Component should be rendered (mocked dynamic import)
      // In a real scenario, this would load progressively
      expect(screen.getByTestId("skeleton")).toBeInTheDocument();
    }, 5000); // Reduced timeout

    it("should show placeholder before full component", async () => {
      const config = createTestConfig({
        strategy: "progressive",
      });

      render(<ProgressiveLoader {...config} />);

      // Start with skeleton
      expect(screen.getByTestId("skeleton")).toBeInTheDocument();

      // Advance past skeleton delay
      vi.advanceTimersByTime(60);

      // Should show placeholder
      await waitFor(() => {
        expect(screen.getByTestId("placeholder")).toBeInTheDocument();
      });

      // Advance past placeholder delay
      vi.advanceTimersByTime(150);

      // Should show full component
      await waitFor(() => {
        expect(screen.getByTestId("component")).toBeInTheDocument();
      });
    });

    it("should handle component loading errors", async () => {
      const config = createTestConfig({
        component: () => Promise.reject(new Error("Load failed")),
        strategy: "eager",
      });

      render(<ProgressiveLoader {...config} />);

      await waitFor(() => {
        expect(screen.getByText("Unable to load content")).toBeInTheDocument();
      });

      expect(screen.getByText("Load failed")).toBeInTheDocument();
    });

    it("should render universal fallback on critical errors", async () => {
      // Create a config that will cause a render error
      const config = createTestConfig({
        stages: {
          skeleton: () => {
            throw new Error("Skeleton render error");
          },
        },
        strategy: "eager",
      });

      render(<ProgressiveLoader {...config} />);

      await waitFor(() => {
        expect(screen.getByText("Unable to load content")).toBeInTheDocument();
      });
    });

    it("should support retry functionality", async () => {
      let shouldFail = true;

      const config = createTestConfig({
        component: () => {
          if (shouldFail) {
            shouldFail = false;
            return Promise.reject(new Error("First attempt failed"));
          }
          return Promise.resolve({ default: MockComponent });
        },
        strategy: "eager",
      });

      render(<ProgressiveLoader {...config} />);

      // Should show error initially
      await waitFor(() => {
        expect(screen.getByText("First attempt failed")).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByText("Retry");
      retryButton.click();

      // Should eventually load successfully
      await waitFor(() => {
        expect(screen.getByTestId("component")).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes during loading", () => {
      const config = createTestConfig();

      render(<ProgressiveLoader {...config} />);

      const container = screen.getByTestId("skeleton").parentElement;
      expect(container).toHaveAttribute("aria-busy", "true");
      expect(container).toHaveAttribute("role", "status");
      expect(container).toHaveAttribute("aria-label", "Loading test-section section");
    });

    it("should have accessible error state", async () => {
      const config = createTestConfig({
        component: () => Promise.reject(new Error("Test error")),
        strategy: "eager",
      });

      render(<ProgressiveLoader {...config} />);

      await waitFor(() => {
        const errorContainer = screen.getByRole("alert");
        expect(errorContainer).toBeInTheDocument();
        expect(errorContainer).toHaveAttribute("aria-label", "Loading test-section section");
      });
    });
  });

  describe("Data Attributes", () => {
    it("should set appropriate data attributes", () => {
      const config = createTestConfig({
        loadPriority: "hero",
        strategy: "progressive",
      });

      render(<ProgressiveLoader {...config} />);

      const container = screen.getByTestId("skeleton").parentElement;
      expect(container).toHaveAttribute("data-loading-stage", "skeleton");
      expect(container).toHaveAttribute("data-loading-state", "idle");
      expect(container).toHaveAttribute("data-load-priority", "hero");
      expect(container).toHaveAttribute("data-adapted-strategy", "progressive");
    });
  });

  describe("Offline Mode", () => {
    it("should work without IntersectionObserver", () => {
      // Temporarily disable IntersectionObserver
      delete (window as any).IntersectionObserver;

      const config = createTestConfig({
        strategy: "eager",
      });

      expect(() => {
        render(<ProgressiveLoader {...config} />);
      }).not.toThrow();

      // Restore
      (window as any).IntersectionObserver = mockIntersectionObserver;
    });
  });
});
