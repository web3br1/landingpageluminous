/**
 * Scaffold B Integration Tests - Progressive Loading
 * Tests how progressive loading integrates with Scaffold B architecture
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

import {
  ProgressiveLoader,
  createLoaderConfig,
  ContextCollector,
} from "../../../lib/lazy-loading/core/progressive-loader";

// Mock Scaffold B components
const MockHeroComposer = () => <div data-testid="hero-composer">Hero Content</div>;
const MockPricingComposer = () => <div data-testid="pricing-composer">Pricing Content</div>;
const MockFeaturesComposer = () => <div data-testid="features-composer">Features Content</div>;

// Mock skeleton components
const HeroSkeleton = () => <div data-testid="hero-skeleton">Hero Skeleton</div>;
const PricingSkeleton = () => <div data-testid="pricing-skeleton">Pricing Skeleton</div>;
const FeaturesSkeleton = () => <div data-testid="features-skeleton">Features Skeleton</div>;

describe("Scaffold B Integration - Progressive Loading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Composer Metadata Integration", () => {
    it("should create loader config from Scaffold B hero metadata", async () => {
      const heroMetadata = {
        sectionId: "hero",
        loadPriority: "hero" as const,
        strategy: "eager" as const,
        requiresAnalyticsConsent: false,
      };

      const context = await ContextCollector.collectMinimalContext();
      const config = createLoaderConfig("hero", () => Promise.resolve({ default: MockHeroComposer }), {
        skeleton: HeroSkeleton,
      }, heroMetadata, context);

      expect(config.sectionId).toBe("hero");
      expect(config.loadPriority).toBe("hero");
      expect(config.strategy).toBe("eager");
      expect(config.context).toEqual(context);
    });

    it("should create loader config from Scaffold B pricing metadata", async () => {
      const pricingMetadata = {
        sectionId: "pricing",
        loadPriority: "early" as const,
        strategy: "progressive" as const,
        requiresAnalyticsConsent: true,
      };

      const context = await ContextCollector.collectMinimalContext();
      const config = createLoaderConfig("pricing", () => Promise.resolve({ default: MockPricingComposer }), {
        skeleton: PricingSkeleton,
        placeholder: () => <div>Placeholder</div>,
      }, pricingMetadata, context);

      expect(config.sectionId).toBe("pricing");
      expect(config.loadPriority).toBe("early");
      expect(config.strategy).toBe("progressive");
      expect(config.context).toEqual(context);
    });

    it("should create loader config from Scaffold B features metadata", async () => {
      const featuresMetadata = {
        sectionId: "features",
        loadPriority: "early" as const,
        strategy: "deferred" as const,
        requiresAnalyticsConsent: false,
      };

      const context = await ContextCollector.collectMinimalContext();
      const config = createLoaderConfig("features", () => Promise.resolve({ default: MockFeaturesComposer }), {
        skeleton: FeaturesSkeleton,
      }, featuresMetadata, context);

      expect(config.sectionId).toBe("features");
      expect(config.loadPriority).toBe("early");
      expect(config.strategy).toBe("deferred");
      expect(config.context).toEqual(context);
    });
  });

  describe("Progressive Loader with Scaffold B Config", () => {
    it("should load hero section eagerly", async () => {
      const heroMetadata = {
        sectionId: "hero",
        loadPriority: "hero" as const,
        strategy: "eager" as const,
        requiresAnalyticsConsent: false,
      };

      const context = await ContextCollector.collectMinimalContext();
      const config = createLoaderConfig("hero", () => Promise.resolve({ default: MockHeroComposer }), {
        skeleton: HeroSkeleton,
      }, heroMetadata, context);

      render(<ProgressiveLoader {...config} />);

      // Should show skeleton initially
      expect(screen.getByTestId("hero-skeleton")).toBeInTheDocument();

      // Should load hero content immediately (eager strategy)
      await waitFor(() => {
        expect(screen.getByTestId("hero-composer")).toBeInTheDocument();
      });
    });

    it("should load pricing section progressively", async () => {
      const pricingMetadata = {
        sectionId: "pricing",
        loadPriority: "early" as const,
        strategy: "progressive" as const,
        requiresAnalyticsConsent: true,
      };

      const context = await ContextCollector.collectMinimalContext();
      const config = createLoaderConfig("pricing", () => Promise.resolve({ default: MockPricingComposer }), {
        skeleton: PricingSkeleton,
      }, pricingMetadata, context);

      render(<ProgressiveLoader {...config} />);

      // Should show skeleton initially
      expect(screen.getByTestId("pricing-skeleton")).toBeInTheDocument();

      // Should load pricing content after progressive delay
      vi.advanceTimersByTime(150);

      await waitFor(() => {
        expect(screen.getByTestId("pricing-composer")).toBeInTheDocument();
      });
    });

    it("should load features section on viewport trigger", async () => {
      const featuresMetadata = {
        sectionId: "features",
        loadPriority: "early" as const,
        strategy: "deferred" as const,
        requiresAnalyticsConsent: false,
      };

      const context = await ContextCollector.collectMinimalContext();
      const config = createLoaderConfig("features", () => Promise.resolve({ default: MockFeaturesComposer }), {
        skeleton: FeaturesSkeleton,
      }, featuresMetadata, context);

      render(<ProgressiveLoader {...config} />);

      // Should show skeleton initially
      expect(screen.getByTestId("features-skeleton")).toBeInTheDocument();

      // Simulate viewport intersection (deferred strategy)
      const callback = (global as any).__intersectionCallback;
      callback([{
        isIntersecting: true,
        intersectionRatio: 0.3,
      }]);

      await waitFor(() => {
        expect(screen.getByTestId("features-composer")).toBeInTheDocument();
      });
    });
  });

  describe("Scaffold B Page Renderer Simulation", () => {
    it("should render multiple sections with progressive loading", async () => {
      const sections = [
        {
          id: "hero",
          component: MockHeroComposer,
          metadata: {
            loadPriority: "hero" as const,
            strategy: "eager" as const,
            requiresAnalyticsConsent: false,
          },
          skeleton: HeroSkeleton,
        },
        {
          id: "pricing",
          component: MockPricingComposer,
          metadata: {
            loadPriority: "early" as const,
            strategy: "progressive" as const,
            requiresAnalyticsConsent: true,
          },
          skeleton: PricingSkeleton,
        },
        {
          id: "features",
          component: MockFeaturesComposer,
          metadata: {
            loadPriority: "early" as const,
            strategy: "deferred" as const,
            requiresAnalyticsConsent: false,
          },
          skeleton: FeaturesSkeleton,
        },
      ];

      const context = await ContextCollector.collectMinimalContext();

      // Simulate Scaffold B page renderer
      const renderedSections = sections.map(section => {
        const config = createLoaderConfig(
          section.id,
          () => Promise.resolve({ default: section.component }),
          { skeleton: section.skeleton },
          section.metadata,
          context
        );

        return <ProgressiveLoader key={section.id} {...config} />;
      });

      render(<div>{renderedSections}</div>);

      // All sections should show skeletons initially
      expect(screen.getByTestId("hero-skeleton")).toBeInTheDocument();
      expect(screen.getByTestId("pricing-skeleton")).toBeInTheDocument();
      expect(screen.getByTestId("features-skeleton")).toBeInTheDocument();

      // Hero should load immediately (eager)
      await waitFor(() => {
        expect(screen.getByTestId("hero-composer")).toBeInTheDocument();
      });

      // Pricing should load after progressive delay
      vi.advanceTimersByTime(150);
      await waitFor(() => {
        expect(screen.getByTestId("pricing-composer")).toBeInTheDocument();
      });

      // Features should load on viewport trigger
      const callback = (global as any).__intersectionCallback;
      callback([{
        isIntersecting: true,
        intersectionRatio: 0.3,
      }]);

      await waitFor(() => {
        expect(screen.getByTestId("features-composer")).toBeInTheDocument();
      });
    });
  });

  describe("Data Attributes for Scaffold B", () => {
    it("should set appropriate data attributes for Scaffold B", async () => {
      const config = createLoaderConfig("test-section", () => Promise.resolve({ default: MockHeroComposer }), {
        skeleton: HeroSkeleton,
      }, {
        sectionId: "test-section",
        loadPriority: "hero",
        strategy: "eager",
        requiresAnalyticsConsent: false,
      }, await ContextCollector.collectMinimalContext());

      render(<ProgressiveLoader {...config} />);

      const container = screen.getByTestId("hero-skeleton").parentElement;

      expect(container).toHaveAttribute("data-loading-stage", "skeleton");
      expect(container).toHaveAttribute("data-loading-state", "idle");
      expect(container).toHaveAttribute("data-load-priority", "hero");
      expect(container).toHaveAttribute("data-adapted-strategy", "eager");
    });
  });

  describe("Privacy Integration with Scaffold B", () => {
    it("should respect consent requirements from Scaffold B metadata", async () => {
      // Test with analytics consent denied
      const contextWithoutConsent = {
        effectiveType: "4g" as const,
        hardwareConcurrency: 4,
        cookieConsent: {
          analytics: false, // No analytics consent
          necessary: true,
        },
      };

      const config = createLoaderConfig("test-section", () => Promise.resolve({ default: MockHeroComposer }), {
        skeleton: HeroSkeleton,
      }, {
        sectionId: "test-section",
        loadPriority: "early",
        strategy: "eager", // Would be eager normally
        requiresAnalyticsConsent: true, // But requires consent
      }, contextWithoutConsent);

      // Strategy should be adapted to progressive due to privacy
      expect(config.strategy).toBe("progressive");
    });

    it("should allow full features with consent", async () => {
      const contextWithConsent = {
        effectiveType: "4g" as const,
        hardwareConcurrency: 4,
        cookieConsent: {
          analytics: true, // Analytics consent given
          necessary: true,
        },
      };

      const config = createLoaderConfig("test-section", () => Promise.resolve({ default: MockHeroComposer }), {
        skeleton: HeroSkeleton,
      }, {
        sectionId: "test-section",
        loadPriority: "early",
        strategy: "eager",
        requiresAnalyticsConsent: true,
      }, contextWithConsent);

      // Strategy should remain eager with consent
      expect(config.strategy).toBe("eager");
    });
  });
});
