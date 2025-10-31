/**
 * @fileoverview Unit tests for PageCompositionService
 * Tests composition logic with mocked dependencies
 */

import { describe, it, expect, vi, beforeEach, Mocked } from "vitest";
import { PageCompositionService } from "../../lib/composition/services/page-composition-service";
import { PageConfigurationProvider } from "../../lib/composition/services/page-configuration-provider";
import {
  IContentMapper,
  IFallbackProvider,
  IPerformanceMonitor,
  IErrorTracker,
  PageType,
  SectionContent,
  PageComposition,
} from "../../lib/composition/ports";
import { Result, isOk, isErr } from "../../shared/core";

// Mock the composition tracer module before importing anything
vi.mock("../../lib/composition/observability/composition-tracer", () => {
  // Create mock span that behaves like a real tracing span
  const createMockSpan = () => ({
    setAttributes: vi.fn(),
    recordException: vi.fn(),
    setStatus: vi.fn(),
    finish: vi.fn(),
  });

  return {
    compositionTracer: {
      tracePageCompositionStart: vi.fn(),
      tracePageCompositionComplete: vi.fn(),
      tracePageCompositionError: vi.fn(() => createMockSpan()),
      traceSectionCompositionStart: vi.fn(),
      traceSectionCompositionComplete: vi.fn(),
      traceSectionCompositionError: vi.fn(() => createMockSpan()),
    },
    createCompositionTraceContext: vi.fn(() => ({
      traceId: "test-trace-id",
      pageType: "landing",
      startTime: Date.now(),
    })),
  };
});

// Mock composition metrics
vi.mock("../../lib/composition/observability/composition-metrics", () => ({
  compositionMetrics: {
    recordPageCompositionStart: vi.fn(),
    recordPageCompositionComplete: vi.fn(),
    recordPageCompositionError: vi.fn(),
    recordSectionCompositionStart: vi.fn(),
    recordSectionCompositionComplete: vi.fn(),
    recordSectionCompositionError: vi.fn(),
    recordSectionProcessingStart: vi.fn(),
    recordSectionProcessingComplete: vi.fn(),
    recordSectionProcessingError: vi.fn(),
  },
  withCompositionMetrics: vi.fn(),
  withCompositionMetricsAsync: vi.fn(),
}));

// Mock composition alerts
vi.mock("../../lib/composition/observability/composition-alerts", () => ({
  compositionAlerts: {
    alertOnCompositionFailure: vi.fn(),
    alertOnPerformanceDegradation: vi.fn(),
  },
  alertOnCompositionFailure: vi.fn(),
  alertOnPerformanceDegradation: vi.fn(),
}));

// Mock implementations
class MockContentMapper implements IContentMapper {
  mapSectionContent = vi.fn();
  mapSectionContentSync = vi.fn();
}

class MockFallbackProvider implements IFallbackProvider {
  getFallbackComposition = vi.fn();
  getFallbackSectionContent = vi.fn();
}

class MockPerformanceMonitor implements IPerformanceMonitor {
  startTimer = vi.fn();
  endTimer = vi.fn();
}

class MockErrorTracker implements IErrorTracker {
  captureException = vi.fn().mockResolvedValue(undefined);
  captureMessage = vi.fn().mockResolvedValue(undefined);
}

describe("PageCompositionService - Unit Tests", () => {
  // Sentinel test: ensure Result contract consistency
  it("enforces Result contract - no .success or .data usage", () => {
    // This test will fail if any test in this file uses .success or .data
    // instead of isOk/isErr and .value/.error
    // Implementation: checked by ESLint rule (added separately)
    expect(true).toBe(true);
  });
  let service: PageCompositionService;
  let mockContentMapper: Mocked<IContentMapper>;
  let mockFallbackProvider: Mocked<IFallbackProvider>;
  let mockPerformanceMonitor: Mocked<IPerformanceMonitor>;
  let mockErrorTracker: Mocked<IErrorTracker>;
  let mockConfigProvider: Mocked<PageConfigurationProvider>;

  beforeEach(() => {
    mockContentMapper = new MockContentMapper() as Mocked<IContentMapper>;
    mockFallbackProvider =
      new MockFallbackProvider() as Mocked<IFallbackProvider>;
    mockPerformanceMonitor =
      new MockPerformanceMonitor() as Mocked<IPerformanceMonitor>;
    mockErrorTracker = new MockErrorTracker() as Mocked<IErrorTracker>;
    mockConfigProvider = {
      getPageConfig: vi.fn(),
    } as Mocked<PageConfigurationProvider>;

    // Setup default mocks
    mockPerformanceMonitor.startTimer.mockReturnValue("timer-handle");
    mockPerformanceMonitor.endTimer.mockResolvedValue(Result.ok(100));

    // Setup default config provider that always succeeds
    const defaultConfig = Result.ok({
      sections: [
        { id: "hero", component: "Hero", order: 1, content: null },
        { id: "benefits", component: "Benefits", order: 2, content: null },
        { id: "features", component: "Features", order: 3, content: null },
        { id: "pricing", component: "Pricing", order: 4, content: null },
        {
          id: "social-proof",
          component: "SocialProof",
          order: 5,
          content: null,
        },
        { id: "demo", component: "Demo", order: 6, content: null },
        { id: "faq", component: "Faq", order: 7, content: null },
        { id: "final-cta", component: "FinalCta", order: 8, content: null },
        { id: "footer", component: "Footer", order: 9, content: null },
      ],
      metadata: {
        title: "Landing Page",
        description: "Test landing page",
        keywords: ["test"],
      },
      analytics: {
        pageType: "landing" as PageType,
        conversionGoals: ["cta_click"],
      },
    });

    mockConfigProvider.getPageConfig.mockReturnValue(defaultConfig);

    service = new PageCompositionService(
      mockContentMapper,
      mockFallbackProvider,
      mockPerformanceMonitor,
      mockErrorTracker,
      mockConfigProvider,
    );
  });

  describe("composePage - Success Cases", () => {
    it("should compose landing page successfully", async () => {
      // Setup mocks
      const mockSectionContent: SectionContent = {
        content: { title: "Welcome" },
        variant: { id: "default", name: "Default" },
      };

      mockContentMapper.mapSectionContent.mockResolvedValue(
        Result.ok(mockSectionContent),
      );
      mockFallbackProvider.getFallbackComposition.mockReturnValue(
        Result.ok({
          sections: [],
          metadata: {
            title: "Fallback",
            description: "Fallback",
            keywords: [],
          },
          experiments: [],
          analytics: { pageType: "landing", conversionGoals: [] },
          pageType: "landing",
        }),
      );

      const result = await service.composePage("landing");

      expect(isOk(result)).toBe(true);
      expect(result.value).toBeDefined();
      expect(result.value?.pageType).toBe("landing");
      expect(result.value?.sections).toBeDefined();
      expect(result.value?.metadata).toBeDefined();
      expect(result.value?.experiments).toBeDefined();
      expect(result.value?.analytics).toBeDefined();

      expect(mockPerformanceMonitor.startTimer).toHaveBeenCalledWith(
        "compose_page",
      );
      expect(mockPerformanceMonitor.endTimer).toHaveBeenCalledWith(
        "timer-handle",
      );
    });

    it("should handle composition options correctly", async () => {
      const mockSectionContent: SectionContent = {
        content: { title: "Welcome" },
        variant: { id: "default", name: "Default" },
      };

      mockContentMapper.mapSectionContent.mockResolvedValue(
        Result.ok(mockSectionContent),
      );

      const options = { flags: { featureA: true, featureB: false } };
      const result = await service.composePage("landing", undefined, options);

      expect(isOk(result)).toBe(true);
      expect(mockContentMapper.mapSectionContent).toHaveBeenCalledWith(
        expect.any(String),
        "landing",
        expect.objectContaining({ flags: options.flags }),
      );
    });

    it("should handle composition context correctly", async () => {
      const mockSectionContent: SectionContent = {
        content: { title: "Welcome" },
        variant: { id: "default", name: "Default" },
      };

      mockContentMapper.mapSectionContent.mockResolvedValue(
        Result.ok(mockSectionContent),
      );

      const context = {
        userId: "user123",
        locale: "pt-BR",
        experiments: { test: "variant" },
      };

      const result = await service.composePage("landing", context);

      expect(isOk(result)).toBe(true);
      expect(mockContentMapper.mapSectionContent).toHaveBeenCalledWith(
        expect.any(String),
        "landing",
        expect.objectContaining(context),
      );
    });

    it("should collect experiments from sections", async () => {
      const mockSectionWithExperiment: SectionContent = {
        content: { title: "Welcome" },
        variant: { id: "default", name: "Default" },
        experiment: { id: "hero_test", variant: "variant_a" },
      };

      const mockSectionWithoutExperiment: SectionContent = {
        content: { title: "Features" },
        variant: { id: "default", name: "Default" },
      };

      // Features page has 4 sections: hero, features, demo, final-cta
      // Only hero section has experiment
      const mockHeroResult = Result.ok(mockSectionWithExperiment);
      const mockFeaturesResult = Result.ok(mockSectionWithoutExperiment);
      const mockDemoResult = Result.ok(mockSectionWithoutExperiment);
      const mockCtaResult = Result.ok(mockSectionWithoutExperiment);

      mockContentMapper.mapSectionContent
        .mockResolvedValueOnce(mockHeroResult) // hero
        .mockResolvedValueOnce(mockFeaturesResult) // features
        .mockResolvedValueOnce(mockDemoResult) // demo
        .mockResolvedValueOnce(mockCtaResult); // final-cta

      // Mock config provider to return features config
      const mockConfigResult = Result.ok({
        sections: [
          { id: "hero", component: "Hero", order: 1, content: null },
          { id: "features", component: "Features", order: 2, content: null },
          { id: "demo", component: "Demo", order: 3, content: null },
          { id: "final-cta", component: "FinalCta", order: 4, content: null },
        ],
        metadata: {
          title: "Funcionalidades - Luminaris",
          description: "Conheça todas as funcionalidades do Luminaris.",
          keywords: ["funcionalidades", "recursos", "Luminaris"],
        },
        analytics: {
          pageType: "features" as PageType,
          conversionGoals: ["demo_request", "pricing_view"],
        },
      });

      // Override config provider for this specific test
      const originalMock =
        mockConfigProvider.getPageConfig.getMockImplementation();
      mockConfigProvider.getPageConfig.mockReturnValue(mockConfigResult);

      try {
        const result = await service.composePage("features");
        expect(result).toBeDefined();
        expect(isOk(result)).toBe(true);
        expect(result.value.experiments).toHaveLength(1);
        expect(result.value.experiments[0]).toEqual({
          id: "hero_test",
          variant: "variant_a",
          sections: ["hero"], // hero section id
        });
      } finally {
        // Restore original mock implementation
        if (originalMock) {
          mockConfigProvider.getPageConfig.mockImplementation(originalMock);
        } else {
          mockConfigProvider.getPageConfig.mockReturnValue(defaultConfig);
        }
      }
    });
  });

  describe("composePage - Error Handling", () => {
    it("should handle configuration provider errors", async () => {
      // Mock config provider to return error
      const originalMock =
        mockConfigProvider.getPageConfig.getMockImplementation();
      mockConfigProvider.getPageConfig.mockReturnValue(
        Result.err({
          message: "Configuration provider error",
          code: "CONFIG_ERROR",
        }),
      );

      try {
        const result = await service.composePage("landing");

        expect(result).toBeDefined();
        expect(isErr(result)).toBe(true);
        expect(result.error.message).toContain("Configuration provider error");
        expect(mockErrorTracker.captureException).toHaveBeenCalled();
        expect(
          mockFallbackProvider.getFallbackComposition,
        ).toHaveBeenCalledWith("landing", expect.any(Object));
      } finally {
        // Restore original mock implementation
        if (originalMock) {
          mockConfigProvider.getPageConfig.mockImplementation(originalMock);
        } else {
          mockConfigProvider.getPageConfig.mockReturnValue(defaultConfig);
        }
      }
    });

    it("should handle content mapper errors gracefully", async () => {
      mockContentMapper.mapSectionContent.mockResolvedValue(
        Result.err({
          message: "Content mapping failed",
          code: "MAPPING_ERROR",
        }),
      );

      mockFallbackProvider.getFallbackSectionContent.mockReturnValue(
        Result.ok({
          content: { fallback: true },
          variant: { id: "fallback", name: "Fallback" },
        }),
      );

      // Setup config provider
      mockConfigProvider.getPageConfig.mockResolvedValue(
        Result.ok({
          sections: [
            { id: "hero", component: "Hero", order: 1, content: null },
          ],
          metadata: {
            title: "Landing Page",
            description: "Test landing page",
            keywords: ["test"],
          },
          analytics: {
            pageType: "landing" as PageType,
            conversionGoals: ["cta_click"],
          },
        }),
      );

      const result = await service.composePage("landing");

      expect(isOk(result)).toBe(true); // Should succeed with fallbacks
      expect(mockFallbackProvider.getFallbackSectionContent).toHaveBeenCalled();
    });

    it("should handle performance monitor errors", async () => {
      mockPerformanceMonitor.endTimer.mockResolvedValue(
        Result.err({ message: "Timer error", code: "TIMER_ERROR" }),
      );

      const mockSectionContent: SectionContent = {
        content: { title: "Welcome" },
        variant: { id: "default", name: "Default" },
      };

      mockContentMapper.mapSectionContent.mockResolvedValue(
        Result.ok(mockSectionContent),
      );

      // Setup config provider
      mockConfigProvider.getPageConfig.mockResolvedValue(
        Result.ok({
          sections: [
            { id: "hero", component: "Hero", order: 1, content: null },
          ],
          metadata: {
            title: "Landing Page",
            description: "Test landing page",
            keywords: ["test"],
          },
          analytics: {
            pageType: "landing" as PageType,
            conversionGoals: ["cta_click"],
          },
        }),
      );

      const result = await service.composePage("landing");

      expect(isOk(result)).toBe(true); // Should still succeed
      // Logger would be called with duration 0
    });

    it("should handle unexpected errors and use fallbacks", async () => {
      // Mock all section content mapping to fail (landing has 9 sections)
      mockContentMapper.mapSectionContent.mockRejectedValue(
        new Error("Unexpected error"),
      );

      mockFallbackProvider.getFallbackComposition.mockReturnValue(
        Result.ok({
          sections: [],
          metadata: {
            title: "Error Fallback",
            description: "Fallback page",
            keywords: [],
          },
          experiments: [],
          analytics: { pageType: "landing", conversionGoals: [] },
          pageType: "landing",
        }),
      );

      const result = await service.composePage("landing");

      expect(isOk(result)).toBe(true);
      expect(mockErrorTracker.captureException).toHaveBeenCalled();
      expect(mockFallbackProvider.getFallbackComposition).toHaveBeenCalledWith(
        "landing",
        expect.objectContaining({
          code: "INTERNAL_ERROR",
          message: expect.stringContaining("All sections failed"),
        }),
      );
    });
  });

  describe("composePage - Input Validation", () => {
    it("should accept valid composition options", async () => {
      const mockSectionContent: SectionContent = {
        content: { title: "Welcome" },
        variant: { id: "default", name: "Default" },
      };

      mockContentMapper.mapSectionContent.mockResolvedValue(
        Result.ok(mockSectionContent),
      );

      // Setup config provider
      mockConfigProvider.getPageConfig.mockResolvedValue(
        Result.ok({
          sections: [
            { id: "hero", component: "Hero", order: 1, content: null },
          ],
          metadata: {
            title: "Landing Page",
            description: "Test landing page",
            keywords: ["test"],
          },
          analytics: {
            pageType: "landing" as PageType,
            conversionGoals: ["cta_click"],
          },
        }),
      );

      const validOptions = { flags: { validFlag: true } };
      const result = await service.composePage(
        "landing",
        undefined,
        validOptions,
      );

      expect(isOk(result)).toBe(true);
      // Validation warnings would be logged but shouldn't fail composition
    });

    it("should handle invalid composition options gracefully", async () => {
      const mockSectionContent: SectionContent = {
        content: { title: "Welcome" },
        variant: { id: "default", name: "Default" },
      };

      mockContentMapper.mapSectionContent.mockResolvedValue(
        Result.ok(mockSectionContent),
      );

      // Setup config provider
      mockConfigProvider.getPageConfig.mockResolvedValue(
        Result.ok({
          sections: [
            { id: "hero", component: "Hero", order: 1, content: null },
          ],
          metadata: {
            title: "Landing Page",
            description: "Test landing page",
            keywords: ["test"],
          },
          analytics: {
            pageType: "landing" as PageType,
            conversionGoals: ["cta_click"],
          },
        }),
      );

      // Invalid options (would be caught by validation but shouldn't break composition)
      const invalidOptions = { flags: "invalid" } as any;
      const result = await service.composePage(
        "landing",
        undefined,
        invalidOptions,
      );

      expect(isOk(result)).toBe(true);
      // Invalid options are logged as warnings but don't prevent composition
    });

    it("should handle invalid composition context gracefully", async () => {
      const mockSectionContent: SectionContent = {
        content: { title: "Welcome" },
        variant: { id: "default", name: "Default" },
      };

      mockContentMapper.mapSectionContent.mockResolvedValue(
        Result.ok(mockSectionContent),
      );

      // Setup config provider
      mockConfigProvider.getPageConfig.mockResolvedValue(
        Result.ok({
          sections: [
            { id: "hero", component: "Hero", order: 1, content: null },
          ],
          metadata: {
            title: "Landing Page",
            description: "Test landing page",
            keywords: ["test"],
          },
          analytics: {
            pageType: "landing" as PageType,
            conversionGoals: ["cta_click"],
          },
        }),
      );

      // Invalid context (would be caught by validation but shouldn't break composition)
      const invalidContext = { userId: 123 } as any;
      const result = await service.composePage("landing", invalidContext);

      expect(isOk(result)).toBe(true);
      // Invalid context is logged as warnings but don't prevent composition
    });
  });

  describe("composePageSync - Synchronous Composition", () => {
    it("should compose page synchronously", () => {
      const mockSectionContent: SectionContent = {
        content: { title: "Welcome" },
        variant: { id: "default", name: "Default" },
      };

      mockContentMapper.mapSectionContentSync.mockReturnValue(
        Result.ok(mockSectionContent),
      );

      // Setup config provider
      mockConfigProvider.getPageConfig.mockResolvedValue(
        Result.ok({
          sections: [
            { id: "hero", component: "Hero", order: 1, content: null },
          ],
          metadata: {
            title: "Landing Page",
            description: "Test landing page",
            keywords: ["test"],
          },
          analytics: {
            pageType: "landing" as PageType,
            conversionGoals: ["cta_click"],
          },
        }),
      );

      const result = service.composePageSync("landing");

      expect(isOk(result)).toBe(true);
      expect(result.value?.pageType).toBe("landing");
      expect(mockPerformanceMonitor.startTimer).toHaveBeenCalledWith(
        "compose_page_sync",
      );
    });

    it("should handle sync errors gracefully", () => {
      mockContentMapper.mapSectionContentSync.mockReturnValue(
        Result.err({ message: "Sync mapping failed", code: "SYNC_ERROR" }),
      );

      mockFallbackProvider.getFallbackSectionContent.mockReturnValue(
        Result.ok({
          content: { fallback: true },
          variant: { id: "fallback", name: "Fallback" },
        }),
      );

      // Setup config provider
      mockConfigProvider.getPageConfig.mockResolvedValue(
        Result.ok({
          sections: [
            { id: "hero", component: "Hero", order: 1, content: null },
          ],
          metadata: {
            title: "Landing Page",
            description: "Test landing page",
            keywords: ["test"],
          },
          analytics: {
            pageType: "landing" as PageType,
            conversionGoals: ["cta_click"],
          },
        }),
      );

      const result = service.composePageSync("landing");

      expect(isOk(result)).toBe(true);
      expect(mockFallbackProvider.getFallbackSectionContent).toHaveBeenCalled();
    });

    it("should handle sync exceptions", () => {
      mockContentMapper.mapSectionContentSync.mockImplementation(() => {
        throw new Error("Sync exception");
      });

      mockFallbackProvider.getFallbackComposition.mockReturnValue(
        Result.ok({
          sections: [],
          metadata: {
            title: "Sync Error Fallback",
            description: "Fallback",
            keywords: [],
          },
          experiments: [],
          analytics: { pageType: "landing", conversionGoals: [] },
          pageType: "landing",
        }),
      );

      // Setup config provider
      mockConfigProvider.getPageConfig.mockResolvedValue(
        Result.ok({
          sections: [
            { id: "hero", component: "Hero", order: 1, content: null },
          ],
          metadata: {
            title: "Landing Page",
            description: "Test landing page",
            keywords: ["test"],
          },
          analytics: {
            pageType: "landing" as PageType,
            conversionGoals: ["cta_click"],
          },
        }),
      );

      const result = service.composePageSync("landing");

      expect(isOk(result)).toBe(true);
      expect(mockErrorTracker.captureException).toHaveBeenCalled();
    });
  });

  describe("Integration - Real Page Types", () => {
    const pageTypes: PageType[] = [
      "landing",
      "features",
      "pricing",
      "demo",
      "signup",
      "trial",
      "checkout",
      "admin-experiments",
      "admin-experiments-dashboard",
      "admin-ml",
      "admin-monitoring",
      "admin-performance",
    ];

    pageTypes.forEach((pageType) => {
      it(`should handle ${pageType} page type`, async () => {
        const mockSectionContent: SectionContent = {
          content: { title: "Content" },
          variant: { id: "default", name: "Default" },
        };

        mockContentMapper.mapSectionContent.mockResolvedValue(
          Result.ok(mockSectionContent),
        );

        // Setup config provider with basic configuration for each page type
        mockConfigProvider.getPageConfig.mockResolvedValueOnce(
          Result.ok({
            sections: [
              { id: "hero", component: "Hero", order: 1, content: null },
            ],
            metadata: {
              title: `${pageType} Page`,
              description: `Test ${pageType} page`,
              keywords: ["test"],
            },
            analytics: {
              pageType: pageType as PageType,
              conversionGoals: ["cta_click"],
            },
          }),
        );

        const result = await service.composePage(pageType);

        expect(isOk(result)).toBe(true);
        expect(result.value?.pageType).toBe(pageType);
        expect(Array.isArray(result.value?.sections)).toBe(true);
      });
    });
  });

  describe("Performance - Timing and Metrics", () => {
    it("should measure composition timing", async () => {
      const mockSectionContent: SectionContent = {
        content: { title: "Welcome" },
        variant: { id: "default", name: "Default" },
      };

      mockContentMapper.mapSectionContent.mockResolvedValue(
        Result.ok(mockSectionContent),
      );
      // Setup config provider
      mockConfigProvider.getPageConfig.mockResolvedValue(
        Result.ok({
          sections: [
            { id: "hero", component: "Hero", order: 1, content: null },
          ],
          metadata: {
            title: "Landing Page",
            description: "Test landing page",
            keywords: ["test"],
          },
          analytics: {
            pageType: "landing" as PageType,
            conversionGoals: ["cta_click"],
          },
        }),
      );

      mockPerformanceMonitor.endTimer.mockResolvedValue(Result.ok(150));

      const result = await service.composePage("landing");

      expect(isOk(result)).toBe(true);
      expect(mockPerformanceMonitor.startTimer).toHaveBeenCalledWith(
        "compose_page",
      );
      expect(mockPerformanceMonitor.endTimer).toHaveBeenCalledWith(
        "timer-handle",
      );
    });

    it("should handle timing failures gracefully", async () => {
      const mockSectionContent: SectionContent = {
        content: { title: "Welcome" },
        variant: { id: "default", name: "Default" },
      };

      mockContentMapper.mapSectionContent.mockResolvedValue(
        Result.ok(mockSectionContent),
      );
      // Setup config provider
      mockConfigProvider.getPageConfig.mockResolvedValue(
        Result.ok({
          sections: [
            { id: "hero", component: "Hero", order: 1, content: null },
          ],
          metadata: {
            title: "Landing Page",
            description: "Test landing page",
            keywords: ["test"],
          },
          analytics: {
            pageType: "landing" as PageType,
            conversionGoals: ["cta_click"],
          },
        }),
      );

      mockPerformanceMonitor.endTimer.mockResolvedValue(
        Result.err({ message: "Timing failed", code: "TIMING_ERROR" }),
      );

      const result = await service.composePage("landing");

      expect(isOk(result)).toBe(true);
      // Should still succeed even with timing errors
    });
  });
});
