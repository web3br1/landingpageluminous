import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  compositionContainer,
  getPageCompositionService,
  getContentMapper,
  getFallbackProvider,
  getSSRAdapter,
  getLogger,
  getMetrics,
  getTracer,
  getPerformanceMonitor,
} from "@/lib/composition/container";

// Mock service classes
vi.mock("@/lib/composition/services/page-composition-service", () => ({
  PageCompositionService: vi.fn().mockImplementation(function () {
    this.composePage = vi.fn();
    this.composePageSync = vi.fn();
  }),
}));

vi.mock("@/lib/composition/services/content-mapper", () => ({
  ContentMapper: vi.fn().mockImplementation(function () {
    this.mapContent = vi.fn();
  }),
}));

vi.mock("@/lib/composition/services/fallback-provider", () => ({
  FallbackProvider: vi.fn().mockImplementation(function () {
    this.getFallback = vi.fn();
  }),
}));

vi.mock("@/lib/composition/services/ssr-adapter", () => ({
  SSRAdapter: vi.fn().mockImplementation(function () {
    this.isServerContext = vi.fn(() => typeof window === "undefined");
    this.safeConsoleLog = vi.fn();
  }),
}));

vi.mock("@/lib/composition/services/page-configuration-provider", () => ({
  PageConfigurationProvider: vi.fn().mockImplementation(function () {
    this.getConfiguration = vi.fn();
  }),
}));

vi.mock("@/lib/composition/adapters/infrastructure-adapters", () => ({
  createExperimentService: vi.fn(() => ({ runExperiment: vi.fn() })),
  createAnalyticsService: vi.fn(() => ({ track: vi.fn() })),
  createPerformanceMonitor: vi.fn(() => ({ start: vi.fn(), end: vi.fn() })),
  createErrorTracker: vi.fn(() => ({ capture: vi.fn() })),
  createSSRPerformanceMonitor: vi.fn(() => ({ start: vi.fn(), end: vi.fn() })),
  createSSRAnalyticsService: vi.fn(() => ({ track: vi.fn() })),
  createSSRErrorTracker: vi.fn(() => ({ capture: vi.fn() })),
}));

vi.mock("@/lib/composition/page-composer", () => ({
  createFallbackComposition: vi.fn(() => ({ sections: [] })),
}));

vi.mock("@/lib/composition/performance/content-cache", () => ({
  getCompositionCache: vi.fn(() => ({ get: vi.fn(), set: vi.fn() })),
  getContentCache: vi.fn(() => ({ get: vi.fn(), set: vi.fn() })),
}));

vi.mock("@/lib/observability/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/observability/metrics", () => ({
  metrics: { counter: vi.fn(), histogram: vi.fn() },
}));

vi.mock("@/lib/observability/tracer", () => ({
  tracer: { startSpan: vi.fn() },
}));

describe("Composition Container", () => {
  beforeEach(() => {
    // Reset container before each test
    compositionContainer.reset();

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after tests
    vi.restoreAllMocks();
  });

  describe("Core Services", () => {
    it("should have SSR adapter initialized", () => {
      const ssrAdapter = compositionContainer.ssrAdapter;

      expect(ssrAdapter).toBeDefined();
      expect(typeof ssrAdapter.isServerContext).toBe("function");
    });

    it("should initialize lazy services on first access", () => {
      // Initially should be null (lazy)
      expect(
        compositionContainer.services.get("IPageCompositionService"),
      ).toBeNull();

      // Access should initialize
      const service = compositionContainer.pageCompositionService;

      expect(service).toBeDefined();
      expect(
        compositionContainer.services.get("IPageCompositionService"),
      ).not.toBeNull();
    });
  });

  describe("Service Getters", () => {
    it("should return page composition service", () => {
      const service = compositionContainer.pageCompositionService;

      expect(service).toBeDefined();
      expect(typeof service.composePage).toBe("function");
      expect(typeof service.composePageSync).toBe("function");
    });

    it("should return observability services", () => {
      expect(compositionContainer.logger).toBeDefined();
      expect(compositionContainer.metrics).toBeDefined();
      expect(compositionContainer.tracer).toBeDefined();
    });
  });

  describe("Convenience Functions", () => {
    it("should export convenience getters", () => {
      expect(getPageCompositionService()).toBeDefined();
      expect(getSSRAdapter()).toBeDefined();
      expect(getLogger()).toBeDefined();
      expect(getMetrics()).toBeDefined();
    });
  });

  describe("Testing Utilities", () => {
    it("should reset container state", () => {
      // Initialize some services
      compositionContainer.ssrAdapter;
      compositionContainer.pageCompositionService;

      expect(compositionContainer.hasService("ISSRAdapter")).toBe(true);
      expect(compositionContainer.hasService("IPageCompositionService")).toBe(
        true,
      );

      // Reset
      compositionContainer.reset();

      // Should still have core services initialized
      expect(compositionContainer.hasService("ISSRAdapter")).toBe(true);
      // Application services should be reset to null (lazy)
      expect(
        compositionContainer.services.get("IPageCompositionService"),
      ).toBeNull();
    });

    it("should allow service replacement for testing", () => {
      const mockService = { testMethod: () => "mocked" };

      compositionContainer.replaceService("TestService", mockService);

      expect(compositionContainer.hasService("TestService")).toBe(true);
      expect(compositionContainer.getService("TestService")).toBe(mockService);
    });
  });
});
