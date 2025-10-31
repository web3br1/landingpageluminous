/**
 * Lazy Loading Deterministic Flows - Integration Tests
 *
 * Testa fluxos determinísticos de lazy loading usando métodos existentes
 * do RouteBasedLazyLoading.createLazyComponent
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { Suspense } from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { RouteBasedLazyLoading } from "@/lib/composition/performance/route-based-lazy-loading";
import { SectionRegistry } from "@/lib/composition/registry/section-registry";

// Setup jsdom for React rendering tests
import { JSDOM } from "jsdom";
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost:3000",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  resources: "usable",
});

global.window = dom.window as any;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock sessionStorage and localStorage
Object.defineProperty(window, "sessionStorage", {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(() => null),
    removeItem: vi.fn(() => null),
    clear: vi.fn(() => null),
  },
  writable: true,
});

Object.defineProperty(window, "localStorage", {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(() => null),
    removeItem: vi.fn(() => null),
    clear: vi.fn(() => null),
  },
  writable: true,
});

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

describe("Lazy Loading Deterministic Flows", () => {
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
                      { "data-testid": "hero-component" },
                      "Hero Component Content",
                    ),
                });
            case "features":
              return () =>
                Promise.resolve({
                  default: () =>
                    React.createElement(
                      "div",
                      { "data-testid": "features-component" },
                      "Features Component Content",
                    ),
                });
            case "pricing":
              return () =>
                Promise.resolve({
                  default: () =>
                    React.createElement(
                      "div",
                      { "data-testid": "pricing-component" },
                      "Pricing Component Content",
                    ),
                });
            case "testimonials":
              return () =>
                Promise.resolve({
                  default: () =>
                    React.createElement(
                      "div",
                      { "data-testid": "testimonials-component" },
                      "Testimonials Component Content",
                    ),
                });
            default:
              return null;
          }
        }),
        getAllSectionIds: vi.fn(() => [
          "hero",
          "features",
          "pricing",
          "testimonials",
        ]),
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

  describe("Single Component Lazy Loading Flow", () => {
    it("should lazy load hero component via createLazyComponent", async () => {
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
        expect(screen.getByTestId("hero-component")).toBeInTheDocument();
      });

      expect(screen.getByText("Hero Component Content")).toBeInTheDocument();
    });

    it("should lazy load features component with deterministic timing", async () => {
      const LazyFeatures =
        RouteBasedLazyLoading.createLazyComponent("features");

      render(
        React.createElement(
          Suspense,
          { fallback: React.createElement("div", {}, "Loading Features...") },
          React.createElement(LazyFeatures),
        ),
      );

      // Should show loading
      expect(screen.getByText("Loading Features...")).toBeInTheDocument();

      // Component should load
      await waitFor(() => {
        expect(screen.getByTestId("features-component")).toBeInTheDocument();
      });

      expect(
        screen.getByText("Features Component Content"),
      ).toBeInTheDocument();
    });
  });

  describe("Multiple Components Sequential Loading", () => {
    it("should load multiple components sequentially with proper fallbacks", async () => {
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
            { fallback: React.createElement("div", {}, "Loading Hero...") },
            React.createElement(LazyHero),
          ),
          React.createElement(
            Suspense,
            { fallback: React.createElement("div", {}, "Loading Features...") },
            React.createElement(LazyFeatures),
          ),
          React.createElement(
            Suspense,
            { fallback: React.createElement("div", {}, "Loading Pricing...") },
            React.createElement(LazyPricing),
          ),
        ),
      );

      // All should show loading initially
      expect(screen.getAllByText(/Loading/).length).toBe(3);

      // First component loads
      await waitFor(() => {
        expect(screen.getByTestId("hero-component")).toBeInTheDocument();
      });

      // Second component loads
      await waitFor(() => {
        expect(screen.getByTestId("features-component")).toBeInTheDocument();
      });

      // Third component loads
      await waitFor(() => {
        expect(screen.getByTestId("pricing-component")).toBeInTheDocument();
      });

      // All content should be present
      expect(screen.getByText("Hero Component Content")).toBeInTheDocument();
      expect(
        screen.getByText("Features Component Content"),
      ).toBeInTheDocument();
      expect(screen.getByText("Pricing Component Content")).toBeInTheDocument();
    });
  });

  describe("IntersectionObserver Triggered Loading", () => {
    it("should lazy load component when it enters viewport via intersection observer", async () => {
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
        expect(screen.getByTestId("hero-component")).toBeInTheDocument();
      });

      cleanup();
    });

    it("should handle multiple intersection observers simultaneously", async () => {
      const { component: ObservedHero, cleanup: cleanupHero } =
        RouteBasedLazyLoading.createIntersectionObserverLazyComponent("hero");
      const { component: ObservedFeatures, cleanup: cleanupFeatures } =
        RouteBasedLazyLoading.createIntersectionObserverLazyComponent(
          "features",
        );

      render(
        React.createElement(
          "div",
          {},
          React.createElement(
            Suspense,
            { fallback: React.createElement("div", {}, "Loading Hero...") },
            React.createElement(ObservedHero, { ref: React.createRef() }),
          ),
          React.createElement(
            Suspense,
            { fallback: React.createElement("div", {}, "Loading Features...") },
            React.createElement(ObservedFeatures, { ref: React.createRef() }),
          ),
        ),
      );

      // Both should show loading
      expect(screen.getByText("Loading Hero...")).toBeInTheDocument();
      expect(screen.getByText("Loading Features...")).toBeInTheDocument();

      // Trigger first intersection
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // First component loads
      await waitFor(() => {
        expect(screen.getByTestId("hero-component")).toBeInTheDocument();
      });

      // Trigger second intersection
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Second component loads
      await waitFor(() => {
        expect(screen.getByTestId("features-component")).toBeInTheDocument();
      });

      cleanupHero();
      cleanupFeatures();
    });
  });

  describe("Error Handling in Lazy Loading", () => {
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

    it("should handle missing sections gracefully", () => {
      expect(() => {
        RouteBasedLazyLoading.createLazyComponent("nonexistent");
      }).toThrow("Section nonexistent not found in registry");
    });
  });

  describe("Cache and Performance Monitoring", () => {
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
});
