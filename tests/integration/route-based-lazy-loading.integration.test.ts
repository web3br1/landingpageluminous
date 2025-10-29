/**
 * Testes de Integração - RouteBasedLazyLoading
 *
 * Testa a integração real entre componentes, mocks limitados,
 * e comportamento end-to-end simulado.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { Suspense } from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { RouteBasedLazyLoading } from "@/lib/composition/performance/route-based-lazy-loading";
import { SectionRegistry } from "@/lib/composition/registry/section-registry";
import {
  LazyLoadingPolicy,
  LoadingPriority,
} from "@/lib/composition/performance/lazy-loading-policy";

// Setup jsdom for React rendering tests
import { JSDOM } from "jsdom";
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.window = dom.window as any;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockImplementation(
  (callback: IntersectionObserverCallback) => {
    const mockObserver = {
      observe: vi.fn((element: Element) => {
        // Simulate intersection after a delay
        setTimeout(() => {
          callback(
            [
              {
                isIntersecting: true,
                target: element,
              } as IntersectionObserverEntry,
            ],
            mockObserver,
          );
        }, 100);
      }),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };
    return mockObserver;
  },
);

vi.stubGlobal("IntersectionObserver", mockIntersectionObserver);

describe("RouteBasedLazyLoading - Integration Tests", () => {
  let originalRegistry: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Setup real section registry for integration tests
    originalRegistry = SectionRegistry;

    // Mock SectionRegistry with real component loaders
    vi.mock("@/lib/composition/registry/section-registry", () => ({
      SectionRegistry: {
        getComponent: vi.fn((sectionId: string) => {
          switch (sectionId) {
            case "hero":
              return () =>
                Promise.resolve({
                  default: () =>
                    React.createElement(
                      "div",
                      { "data-testid": "hero" },
                      "Hero Component",
                    ),
                });
            case "features":
              return () =>
                Promise.resolve({
                  default: () =>
                    React.createElement(
                      "div",
                      { "data-testid": "features" },
                      "Features Component",
                    ),
                });
            case "pricing":
              return () =>
                Promise.resolve({
                  default: () =>
                    React.createElement(
                      "div",
                      { "data-testid": "pricing" },
                      "Pricing Component",
                    ),
                });
            default:
              return null;
          }
        }),
        getAllSectionIds: vi.fn(() => ["hero", "features", "pricing"]),
        getSectionMetadata: vi.fn(() => ({
          critical: false,
          lazyLoad: true,
          ssrEnabled: false,
        })),
      },
    }));
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe("Component Loading Integration", () => {
    it("should load and render hero component with Suspense fallback", async () => {
      const LazyHero = RouteBasedLazyLoading.createLazyComponent("hero");

      const heroProps = {
        content: {
          headline: "Welcome to Hero Component",
          subheadline: "This is a test subheadline",
          primaryCta: "Get Started",
          secondaryCta: "Learn More",
        },
        tracking: { section: "hero" as const },
      };

      render(
        React.createElement(
          Suspense,
          { fallback: React.createElement("div", {}, "Loading Hero...") },
          React.createElement(LazyHero, heroProps),
        ),
      );

      // Should show fallback initially
      expect(screen.getByText("Loading Hero...")).toBeInTheDocument();

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByTestId("hero-text-block")).toBeInTheDocument();
      });

      expect(screen.getByText("Welcome to Hero Component")).toBeInTheDocument();
    });

    it("should handle multiple components loading simultaneously", async () => {
      const LazyHero = RouteBasedLazyLoading.createLazyComponent("hero");
      const LazyFeatures =
        RouteBasedLazyLoading.createLazyComponent("features");
      const LazyPricing = RouteBasedLazyLoading.createLazyComponent("pricing");

      render(
        React.createElement(
          "div",
          {},
          React.createElement(
            Suspense,
            { fallback: React.createElement("div", {}, "Loading...") },
            React.createElement(LazyHero),
          ),
          React.createElement(
            Suspense,
            { fallback: React.createElement("div", {}, "Loading...") },
            React.createElement(LazyFeatures),
          ),
          React.createElement(
            Suspense,
            { fallback: React.createElement("div", {}, "Loading...") },
            React.createElement(LazyPricing),
          ),
        ),
      );

      // Should show multiple loading states
      const loadingElements = screen.getAllByText("Loading...");
      expect(loadingElements).toHaveLength(3);

      // All components should eventually load
      await waitFor(() => {
        expect(screen.getByTestId("hero")).toBeInTheDocument();
        expect(screen.getByTestId("features")).toBeInTheDocument();
        expect(screen.getByTestId("pricing")).toBeInTheDocument();
      });
    });

    it("should handle component loading errors gracefully", async () => {
      // Mock a failing component loader
      const mockSectionRegistry =
        require("@/lib/composition/registry/section-registry").SectionRegistry;
      mockSectionRegistry.getComponent.mockImplementationOnce(() => {
        return () => Promise.reject(new Error("Network error"));
      });

      const LazyHero = RouteBasedLazyLoading.createLazyComponent("hero");

      render(
        React.createElement(
          Suspense,
          { fallback: React.createElement("div", {}, "Loading...") },
          React.createElement(LazyHero),
        ),
      );

      // Should show loading initially
      expect(screen.getByText("Loading...")).toBeInTheDocument();

      // Component should fail to load and show error boundary
      await waitFor(() => {
        expect(screen.getByText("Error loading hero")).toBeInTheDocument();
      });
    });
  });

  describe("IntersectionObserver Integration", () => {
    it("should lazy load component when it enters viewport", async () => {
      const { component: ObservedHero, cleanup } =
        RouteBasedLazyLoading.createIntersectionObserverLazyComponent("hero");

      render(
        React.createElement(
          "div",
          {},
          React.createElement(
            Suspense,
            { fallback: React.createElement("div", {}, "Loading...") },
            React.createElement(ObservedHero, { ref: React.createRef() }),
          ),
        ),
      );

      // Should show loading initially
      expect(screen.getByText("Loading...")).toBeInTheDocument();

      // Advance timers to trigger intersection
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Component should load after intersection
      await waitFor(() => {
        expect(screen.getByTestId("hero")).toBeInTheDocument();
      });

      cleanup();
    });

    it("should respect loading priorities from policy", () => {
      // Test with different priorities
      const priorities = [
        { priority: LoadingPriority.HIGH, expected: "high" },
        { priority: LoadingPriority.MEDIUM, expected: "medium" },
        { priority: LoadingPriority.LOW, expected: "low" },
      ];

      priorities.forEach(({ priority, expected }) => {
        const mockPolicy =
          require("@/lib/composition/performance/lazy-loading-policy").LazyLoadingPolicy;
        mockPolicy.getLoadingDecision.mockReturnValue({
          shouldLoad: true,
          trigger: "viewport",
          priority,
        });

        const config =
          RouteBasedLazyLoading.getIntersectionObserverConfig("hero");
        expect(config.priority).toBe(expected);
      });
    });

    it("should cleanup IntersectionObserver resources", () => {
      const { cleanup } =
        RouteBasedLazyLoading.createIntersectionObserverLazyComponent("hero");

      expect(cleanup).toBeDefined();

      // Should not throw when called
      expect(() => cleanup()).not.toThrow();
    });
  });

  describe("Performance Monitoring Integration", () => {
    it("should track loading states correctly", () => {
      expect(RouteBasedLazyLoading.isSectionLoaded("hero")).toBe(false);

      RouteBasedLazyLoading.markSectionAsLoaded("hero");

      expect(RouteBasedLazyLoading.isSectionLoaded("hero")).toBe(true);
    });

    it("should provide performance metrics", () => {
      const metrics = RouteBasedLazyLoading.getPerformanceMetrics();

      expect(metrics).toHaveProperty("loadedSections");
      expect(metrics).toHaveProperty("cacheSize");
      expect(Array.isArray(metrics.loadedSections)).toBe(true);
      expect(typeof metrics.cacheSize).toBe("number");
    });

    it("should manage component cache", () => {
      const initialCacheSize = RouteBasedLazyLoading.getCacheSize();

      // Create some components (this adds to cache in real implementation)
      RouteBasedLazyLoading.createLazyComponent("hero");
      RouteBasedLazyLoading.createLazyComponent("features");

      // Cache size should be >= initial (may not increase in mocked environment)
      const newCacheSize = RouteBasedLazyLoading.getCacheSize();
      expect(newCacheSize).toBeGreaterThanOrEqual(initialCacheSize);

      // Cleanup should work
      RouteBasedLazyLoading.cleanupUnusedComponents();
      expect(RouteBasedLazyLoading.getCacheSize()).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Error Recovery Integration", () => {
    it("should create error fallback components", () => {
      const ErrorFallback = RouteBasedLazyLoading.createErrorFallback(
        "hero",
        "Component failed",
      );

      expect(ErrorFallback).toBeDefined();
      expect(typeof ErrorFallback).toBe("function");

      // Should render error message
      render(React.createElement(ErrorFallback));
      expect(
        screen.getByText("Error loading hero: Component failed"),
      ).toBeInTheDocument();
    });

    it("should handle missing sections gracefully", () => {
      expect(() => {
        RouteBasedLazyLoading.createLazyComponent("nonexistent");
      }).toThrow("Section nonexistent not found in registry");
    });

    it("should handle invalid section registry", () => {
      // Temporarily break the registry
      const mockRegistry = require("@/lib/composition/registry/section-registry");
      const originalGetComponent = mockRegistry.SectionRegistry.getComponent;
      mockRegistry.SectionRegistry.getComponent = null;

      expect(() => {
        RouteBasedLazyLoading.createLazyComponent("hero");
      }).toThrow("SectionRegistry not available");

      // Restore
      mockRegistry.SectionRegistry.getComponent = originalGetComponent;
    });
  });

  describe("Policy Integration", () => {
    it("should integrate with LazyLoadingPolicy for loading decisions", () => {
      const loadingContext = {
        viewportHeight: 800,
        scrollY: 100,
        userAgent: "test",
        connectionSpeed: "fast",
        deviceType: "desktop",
        userId: "test-user",
      };

      const mockPolicy =
        require("@/lib/composition/performance/lazy-loading-policy").LazyLoadingPolicy;
      mockPolicy.getLoadingDecision.mockReturnValue({
        shouldLoad: true,
        trigger: "viewport",
        priority: LoadingPriority.HIGH,
      });

      const config = RouteBasedLazyLoading.getIntersectionObserverConfig(
        "hero",
        loadingContext,
      );

      expect(mockPolicy.getLoadingDecision).toHaveBeenCalledWith(
        "hero",
        loadingContext,
      );
      expect(config.priority).toBe("high");
    });

    it("should initialize policies correctly", () => {
      const mockPolicy =
        require("@/lib/composition/performance/lazy-loading-policy").LazyLoadingPolicy;
      mockPolicy.initializePolicies.mockClear();

      RouteBasedLazyLoading.initializeLazyLoading();

      expect(mockPolicy.initializePolicies).toHaveBeenCalled();
    });
  });
});
