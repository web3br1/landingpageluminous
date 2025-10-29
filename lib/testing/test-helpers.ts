// Test Helpers - Utilities for testing the composition system
// Provides factories, mocks, and utilities for comprehensive testing

import { vi, Mock } from "vitest";
import { Result } from "@shared/core";
import { AppError } from "@shared/errors";
import {
  IPageCompositionService,
  IContentMapper,
  IFallbackProvider,
  ISSRAdapter,
  IExperimentService,
  IAnalyticsService,
  IPerformanceMonitor,
  IErrorTracker,
  PageComposition,
  PageType,
  SectionId,
  SectionContent,
  CompositionContext,
  EnvironmentInfo,
  TimerHandle,
  LogLevel,
} from "../composition/ports";

// ===== TEST DATA FACTORIES =====

export class TestDataFactory {
  static createValidPageComposition(
    overrides: Partial<PageComposition> = {},
  ): PageComposition {
    return {
      sections: [
        {
          id: "hero" as SectionId,
          component: "Hero",
          content: this.createValidSectionContent("hero"),
          order: 1,
        },
        {
          id: "benefits" as SectionId,
          component: "Benefits",
          content: this.createValidSectionContent("benefits"),
          order: 2,
        },
      ],
      metadata: {
        title: "Test Page",
        description: "Test description",
        keywords: ["test", "page"],
      },
      experiments: [],
      analytics: {
        pageType: "landing" as PageType,
        conversionGoals: ["cta_click"],
      },
      pageType: "landing" as PageType,
      ...overrides,
    };
  }

  static createValidSectionContent(sectionId: string): SectionContent {
    const baseContent = {
      variant: {
        id: "test",
        name: "Test Variant",
        description: "Test variant for testing",
      },
    };

    switch (sectionId) {
      case "hero":
        return {
          ...baseContent,
          content: {
            headline: "Test Headline",
            subheadline: "Test Subheadline",
            primaryCta: "Test CTA",
          },
        };

      case "benefits":
        return {
          ...baseContent,
          content: {
            title: "Test Benefits",
            benefits: [
              {
                title: "Test Benefit",
                description: "Test description",
                icon: "TestIcon",
              },
            ],
          },
        };

      default:
        return {
          ...baseContent,
          content: { test: true },
        };
    }
  }

  static createValidCompositionContext(
    overrides: Partial<CompositionContext> = {},
  ): CompositionContext {
    return {
      userId: "test-user-id",
      tenantId: "test-tenant-id",
      userSegments: ["enterprise"],
      experiments: { hero_headline: "variant_a" },
      locale: "pt-BR",
      featureFlags: { new_feature: true },
      ...overrides,
    };
  }

  static createValidEnvironmentInfo(
    overrides: Partial<EnvironmentInfo> = {},
  ): EnvironmentInfo {
    return {
      isServer: false,
      isClient: true,
      isDevelopment: true,
      isProduction: false,
      nodeEnv: "development",
      ...overrides,
    };
  }

  static createValidTimerHandle(
    overrides: Partial<TimerHandle> = {},
  ): TimerHandle {
    return {
      id: "test-timer-id",
      operation: "test-operation",
      startTime: Date.now(),
      ...overrides,
    };
  }
}

// ===== MOCK IMPLEMENTATIONS =====

export class MockPageCompositionService implements IPageCompositionService {
  composePage = vi.fn();

  composePageSync = vi.fn();

  // Helper methods for common test scenarios
  mockSuccess(
    composition: PageComposition = TestDataFactory.createValidPageComposition(),
  ) {
    this.composePage.mockResolvedValue({ success: true, data: composition });
    this.composePageSync.mockReturnValue({ success: true, data: composition });
    return this;
  }

  mockFailure(error: AppError) {
    const result: Result<PageComposition, AppError> = { success: false, error };
    this.composePage.mockResolvedValue(result);
    this.composePageSync.mockReturnValue(result);
    return this;
  }

  mockAsyncSuccess(composition?: PageComposition) {
    return this.mockSuccess(composition);
  }

  mockSyncSuccess(composition?: PageComposition) {
    return this.mockSuccess(composition);
  }
}

export class MockContentMapper implements IContentMapper {
  mapSectionContent = vi.fn();

  mapSectionContentSync = vi.fn();

  mockSuccess(
    content: SectionContent = TestDataFactory.createValidSectionContent("hero"),
  ) {
    this.mapSectionContent.mockResolvedValue({ success: true, data: content });
    this.mapSectionContentSync.mockReturnValue({
      success: true,
      data: content,
    });
    return this;
  }

  mockFailure(error: AppError) {
    const result: Result<SectionContent, AppError> = { success: false, error };
    this.mapSectionContent.mockResolvedValue(result);
    this.mapSectionContentSync.mockReturnValue(result);
    return this;
  }
}

export class MockFallbackProvider implements IFallbackProvider {
  getFallbackComposition = vi.fn();

  getFallbackSectionContent = vi.fn();

  mockSuccess(composition?: PageComposition) {
    const fallback =
      composition || TestDataFactory.createValidPageComposition();
    this.getFallbackComposition.mockReturnValue({
      success: true,
      data: fallback,
    });
    return this;
  }

  mockSectionSuccess(content?: SectionContent) {
    const fallback =
      content || TestDataFactory.createValidSectionContent("hero");
    this.getFallbackSectionContent.mockReturnValue({
      success: true,
      data: fallback,
    });
    return this;
  }
}

export class MockSSRAdapter implements ISSRAdapter {
  isServerContext = vi.fn();
  isClientContext = vi.fn();
  getEnvironmentInfo = vi.fn();
  safeWindowAccess = vi.fn();
  safeLocalStorageAccess = vi.fn();
  safeAsyncOperation = vi.fn();
  isStaticGeneration = vi.fn();
  safeTimeout = vi.fn();
  safeConsoleLog = vi.fn();

  mockClientEnvironment() {
    this.isServerContext.mockReturnValue(false);
    this.isClientContext.mockReturnValue(true);
    this.isStaticGeneration.mockReturnValue(false);
    this.getEnvironmentInfo.mockReturnValue(
      TestDataFactory.createValidEnvironmentInfo({
        isServer: false,
        isClient: true,
      }),
    );
    return this;
  }

  mockServerEnvironment() {
    this.isServerContext.mockReturnValue(true);
    this.isClientContext.mockReturnValue(false);
    this.isStaticGeneration.mockReturnValue(false);
    this.getEnvironmentInfo.mockReturnValue(
      TestDataFactory.createValidEnvironmentInfo({
        isServer: true,
        isClient: false,
      }),
    );
    return this;
  }

  mockStaticGeneration() {
    this.isServerContext.mockReturnValue(true);
    this.isClientContext.mockReturnValue(false);
    this.isStaticGeneration.mockReturnValue(true);
    this.getEnvironmentInfo.mockReturnValue(
      TestDataFactory.createValidEnvironmentInfo({
        isServer: true,
        isClient: false,
      }),
    );
    return this;
  }
}

export class MockExperimentService implements IExperimentService {
  getActiveVariant = vi.fn();

  isExperimentActive = vi.fn();

  mockVariant(variant: string) {
    this.getActiveVariant.mockResolvedValue({ success: true, data: variant });
    this.isExperimentActive.mockResolvedValue({
      success: true,
      data: variant !== "control",
    });
    return this;
  }

  mockInactive() {
    this.getActiveVariant.mockResolvedValue({ success: true, data: "control" });
    this.isExperimentActive.mockResolvedValue({ success: true, data: false });
    return this;
  }
}

export class MockAnalyticsService implements IAnalyticsService {
  trackPageView = vi.fn();

  trackSectionLoad = vi.fn();

  mockSuccess() {
    this.trackPageView.mockResolvedValue({ success: true, data: undefined });
    this.trackSectionLoad.mockResolvedValue({ success: true, data: undefined });
    return this;
  }
}

export class MockPerformanceMonitor implements IPerformanceMonitor {
  startTimer = vi.fn();

  endTimer = vi.fn();

  recordMetric = vi.fn();

  mockTimer(duration: number = 100) {
    const handle = TestDataFactory.createValidTimerHandle();
    this.startTimer.mockReturnValue(handle);
    this.endTimer.mockResolvedValue({ success: true, data: duration });
    return this;
  }

  mockSuccess() {
    this.recordMetric.mockResolvedValue({ success: true, data: undefined });
    return this;
  }
}

export class MockErrorTracker implements IErrorTracker {
  captureException = vi.fn();

  captureMessage = vi.fn();

  mockSuccess() {
    this.captureException.mockResolvedValue({ success: true, data: undefined });
    this.captureMessage.mockResolvedValue({ success: true, data: undefined });
    return this;
  }
}

// ===== TEST UTILITIES =====

export class TestUtils {
  static async waitForNextTick(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  static async waitForTimeout(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  static createTestError(message: string, code?: string): AppError {
    return {
      message,
      code: (code as any) || "VALIDATION_ERROR",
      details: { test: true },
    };
  }

  static createAppError(message: string, code?: string): AppError {
    return {
      message,
      code: (code as any) || "INTERNAL_ERROR",
      details: { source: "test" },
    };
  }

  static mockConsole() {
    const originalConsole = { ...console };
    const mockConsole = {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    };

    Object.assign(console, mockConsole);

    return {
      restore: () => Object.assign(console, originalConsole),
      mocks: mockConsole,
    };
  }

  static mockLocalStorage() {
    const store: Record<string, string> = {};

    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete store[key];
        }),
        clear: vi.fn(() => {
          Object.keys(store).forEach((key) => delete store[key]);
        }),
        key: vi.fn((index: number) => Object.keys(store)[index] || null),
        get length() {
          return Object.keys(store).length;
        },
      },
      writable: true,
    });

    return {
      store,
      restore: () => {
        delete (window as any).localStorage;
      },
    };
  }

  static mockIntersectionObserver() {
    const mockIntersectionObserver = vi.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    });
    (window as any).IntersectionObserver = mockIntersectionObserver;

    return {
      mock: mockIntersectionObserver,
      restore: () => {
        delete (window as any).IntersectionObserver;
      },
    };
  }
}

// ===== TEST SCENARIOS =====

export class TestScenarios {
  static async testSuccessfulComposition() {
    const service = new MockPageCompositionService();
    const composition = TestDataFactory.createValidPageComposition();

    service.mockSuccess(composition);

    const result = await service.composePage("landing");

    expect(result.success).toBe(true);
    expect(result.data).toEqual(composition);

    return { service, composition, result };
  }

  static async testCompositionFailure() {
    const service = new MockPageCompositionService();
    const error = TestUtils.createAppError(
      "CompositionError",
      "Failed to compose page",
    );

    service.mockFailure(error);

    const result = await service.composePage("landing");

    expect(result.success).toBe(false);
    expect(result.error).toEqual(error);

    return { service, error, result };
  }

  static testSSRAdapterClientEnvironment() {
    const adapter = new MockSSRAdapter();
    adapter.mockClientEnvironment();

    expect(adapter.isClientContext()).toBe(true);
    expect(adapter.isServerContext()).toBe(false);
    expect(adapter.getEnvironmentInfo().isClient).toBe(true);

    return adapter;
  }

  static testSSRAdapterServerEnvironment() {
    const adapter = new MockSSRAdapter();
    adapter.mockServerEnvironment();

    expect(adapter.isServerContext()).toBe(true);
    expect(adapter.isClientContext()).toBe(false);
    expect(adapter.getEnvironmentInfo().isServer).toBe(true);

    return adapter;
  }
}

// ===== EXPORTS =====

export {
  TestDataFactory as Factory,
  MockPageCompositionService as MockCompositionService,
  MockContentMapper as MockMapper,
  MockFallbackProvider as MockFallback,
  MockSSRAdapter as MockSSR,
  MockExperimentService as MockExperiment,
  MockAnalyticsService as MockAnalytics,
  MockPerformanceMonitor as MockPerformance,
  MockErrorTracker as MockError,
  TestUtils as Utils,
  TestScenarios as Scenarios,
};
