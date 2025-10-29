// Test Helpers - Utilities for testing the composition system
// Provides factories, mocks, and utilities for comprehensive testing

import { vi } from "vitest";
import { Result, isOk, isErr } from "@shared/core";
import { AppError as SharedAppError } from "@shared/errors";
import { createAppError } from "@shared/errors";
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
  PageMetadata,
} from "./ports";

// ===== TEST DATA FACTORIES =====

export class TestDataFactory {
  static createValidPageComposition(
    overrides: Partial<PageComposition> = {},
  ): PageComposition {
    const base = {
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
    };

    return TestUtils.deepMerge(base, overrides as any);
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
  composePage = vi.fn() as any;

  composePageSync = vi.fn() as any;

  // Helper methods for common test scenarios
  mockSuccess(
    composition: PageComposition = TestDataFactory.createValidPageComposition(),
  ) {
    this.composePage.mockResolvedValue(Result.ok(composition));
    this.composePageSync.mockReturnValue(Result.ok(composition));
    return this;
  }

  mockFailure(error: SharedAppError) {
    this.composePage.mockResolvedValue(Result.err(error));
    this.composePageSync.mockReturnValue(Result.err(error));
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
  mapSectionContent = vi.fn() as any;

  mapSectionContentSync = vi.fn() as any;

  mockSuccess(
    content: SectionContent = TestDataFactory.createValidSectionContent("hero"),
  ) {
    this.mapSectionContent.mockResolvedValue(Result.ok(content));
    this.mapSectionContentSync.mockReturnValue(Result.ok(content));
    return this;
  }

  mockFailure(error: SharedAppError) {
    this.mapSectionContent.mockResolvedValue(Result.err(error));
    this.mapSectionContentSync.mockReturnValue(Result.err(error));
    return this;
  }
}

export class MockFallbackProvider implements IFallbackProvider {
  getFallbackComposition = vi.fn() as any;

  getFallbackSectionContent = vi.fn() as any;

  mockSuccess(composition?: PageComposition) {
    const fallback =
      composition || TestDataFactory.createValidPageComposition();
    this.getFallbackComposition.mockReturnValue(Result.ok(fallback));
    return this;
  }

  mockSectionSuccess(content?: SectionContent) {
    const fallback =
      content || TestDataFactory.createValidSectionContent("hero");
    this.getFallbackSectionContent.mockReturnValue(Result.ok(fallback));
    return this;
  }
}

export class MockSSRAdapter implements ISSRAdapter {
  isServerContext = vi.fn() as any;
  isClientContext = vi.fn() as any;
  getEnvironmentInfo = vi.fn() as any;
  safeWindowAccess = vi.fn() as any;
  safeLocalStorageAccess = vi.fn() as any;
  safeAsyncOperation = vi.fn() as any;
  isStaticGeneration = vi.fn() as any;
  safeTimeout = vi.fn() as any;
  safeConsoleLog = vi.fn() as any;

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
  getActiveVariant = vi.fn() as any;

  isExperimentActive = vi.fn() as any;

  mockVariant(variant: string) {
    this.getActiveVariant.mockResolvedValue(Result.ok(variant));
    this.isExperimentActive.mockResolvedValue(Result.ok(variant !== "control"));
    return this;
  }

  mockInactive() {
    this.getActiveVariant.mockResolvedValue(Result.ok("control"));
    this.isExperimentActive.mockResolvedValue(Result.ok(false));
    return this;
  }
}

export class MockAnalyticsService implements IAnalyticsService {
  trackPageView = vi.fn() as any;

  trackSectionLoad = vi.fn() as any;

  mockSuccess() {
    this.trackPageView.mockResolvedValue(Result.ok(undefined));
    this.trackSectionLoad.mockResolvedValue(Result.ok(undefined));
    return this;
  }
}

export class MockPerformanceMonitor implements IPerformanceMonitor {
  startTimer = vi.fn() as any;

  endTimer = vi.fn() as any;

  recordMetric = vi.fn() as any;

  mockTimer(duration: number = 100) {
    const handle = TestDataFactory.createValidTimerHandle();
    this.startTimer.mockReturnValue(handle);
    this.endTimer.mockResolvedValue(Result.ok(duration));
    return this;
  }

  mockSuccess() {
    this.recordMetric.mockResolvedValue(Result.ok(undefined));
    return this;
  }
}

export class MockErrorTracker implements IErrorTracker {
  captureException = vi.fn() as any;

  captureMessage = vi.fn() as any;

  mockSuccess() {
    this.captureException.mockResolvedValue(Result.ok(undefined));
    this.captureMessage.mockResolvedValue(Result.ok(undefined));
    return this;
  }
}

// ===== TEST UTILITIES =====

export class TestUtils {
  /**
   * Safely extract value from Result, throwing if it's an error
   */
  static unwrapResult<T, E>(result: Result<T, E>): T {
    if (isOk(result)) {
      return result.value;
    }
    throw new Error(
      `Expected Ok result, got Err: ${JSON.stringify(result.error)}`,
    );
  }

  /**
   * Safely extract error from Result, throwing if it's a success
   */
  static unwrapError<T, E>(result: Result<T, E>): E {
    if (isErr(result)) {
      return result.error;
    }
    throw new Error(
      `Expected Err result, got Ok: ${JSON.stringify(result.value)}`,
    );
  }

  static deepMerge<T extends Record<string, any>>(target: T, source: any): T {
    const result = { ...target } as any;

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const sourceValue = source[key];
        const targetValue = result[key];

        if (this.isObject(sourceValue) && this.isObject(targetValue)) {
          result[key] = this.deepMerge(targetValue, sourceValue);
        } else {
          result[key] = sourceValue;
        }
      }
    }

    return result as T;
  }

  private static isObject(item: any): item is Record<string, any> {
    return item && typeof item === "object" && !Array.isArray(item);
  }

  static async waitForNextTick(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  static async waitForTimeout(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  static createTestError(message: string, code?: string): SharedAppError {
    return {
      name: "AppError",
      message,
      code: (code as any) || "INTERNAL_ERROR",
      details: { test: true },
    };
  }

  static createAppError(
    message: string,
    code: string = "INTERNAL_ERROR",
  ): SharedAppError {
    return createAppError(code as any, message);
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

    // Check if window exists (for SSR/server environments)
    if (typeof window !== "undefined") {
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
    } else {
      // For server environments, define on global
      (global as any).window = {
        localStorage: {
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
      };
    }

    return {
      store,
      restore: () => {
        if (typeof window !== "undefined") {
          delete (window as any).localStorage;
        } else {
          delete (global as any).window;
        }
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

    // Check if window exists (for SSR/server environments)
    if (typeof window !== "undefined") {
      (window as any).IntersectionObserver = mockIntersectionObserver;
    } else {
      // For server environments, define on global
      if (!(global as any).window) {
        (global as any).window = {};
      }
      (global as any).window.IntersectionObserver = mockIntersectionObserver;
    }

    return {
      mock: mockIntersectionObserver,
      restore: () => {
        if (typeof window !== "undefined") {
          delete (window as any).IntersectionObserver;
        } else {
          if ((global as any).window) {
            delete (global as any).window.IntersectionObserver;
          }
        }
      },
    };
  }
}

// ===== TEST SCENARIOS =====

export class TestScenarios {
  static createSuccessfulCompositionScenario() {
    const service = new MockPageCompositionService();
    const composition = TestDataFactory.createValidPageComposition();

    service.mockSuccess(composition);

    return { service, composition };
  }

  static createCompositionFailureScenario() {
    const service = new MockPageCompositionService();
    const error = TestUtils.createAppError(
      "Failed to compose page",
      "COMPOSITION_ERROR",
    );

    service.mockFailure(error);

    return { service, error };
  }

  static createSSRAdapterClientScenario() {
    const adapter = new MockSSRAdapter();
    adapter.mockClientEnvironment();

    return adapter;
  }

  static createSSRAdapterServerScenario() {
    const adapter = new MockSSRAdapter();
    adapter.mockServerEnvironment();

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
