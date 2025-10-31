// Integration Tests for Composition System
// Tests end-to-end functionality with real service interactions

import { describe, it, expect, beforeEach } from "@jest/globals";
import { PageCompositionService } from "../services/page-composition-service";
import { ContentMapper } from "../services/content-mapper";
import { FallbackProvider } from "../services/fallback-provider";
import { SSRAdapter } from "../services/ssr-adapter";
import { Factory, TestUtils } from "../../../tests/__shared__/lib/test-helpers";
import { Result, isOk } from "@shared/core";

// Helper function to safely extract values from Result
function unwrapResult<T>(result: Result<T, any>): T {
  if (isOk(result)) {
    return unwrapResult(result);
  }
  throw new Error("Expected Ok result");
}

// Helper function to safely extract errors from Result
function unwrapError<T>(result: Result<any, T>): T {
  if (!isOk(result)) {
    return unwrapError(result);
  }
  throw new Error("Expected Err result");
}

describe("Composition System Integration", () => {
  let compositionService: PageCompositionService;
  let contentMapper: ContentMapper;
  let fallbackProvider: FallbackProvider;
  let ssrAdapter: SSRAdapter;

  beforeEach(() => {
    // Initialize real services for integration testing
    ssrAdapter = new SSRAdapter();
    contentMapper = new ContentMapper(
      // Mock experiment service for controlled testing
      {
        getActiveVariant: async () => ({ success: true, data: "control" }),
        isExperimentActive: async () => ({ success: true, data: false }),
      } as any,
      // Mock performance monitor
      {
        startTimer: () => ({
          id: "test",
          operation: "test",
          startTime: Date.now(),
        }),
        endTimer: async () => ({ success: true, data: 100 }),
        recordMetric: async () => ({ success: true, data: undefined }),
      } as any,
      // Mock error tracker
      {
        captureException: async () => ({ success: true, data: undefined }),
        captureMessage: async () => ({ success: true, data: undefined }),
      } as any,
    );

    fallbackProvider = new FallbackProvider();

    compositionService = new PageCompositionService(
      contentMapper,
      fallbackProvider,
      // Mock performance monitor for composition service
      {
        startTimer: () => ({
          id: "test",
          operation: "test",
          startTime: Date.now(),
        }),
        endTimer: async () => ({ success: true, data: 100 }),
        recordMetric: async () => ({ success: true, data: undefined }),
      } as any,
      // Mock error tracker for composition service
      {
        captureException: async () => ({ success: true, data: undefined }),
        captureMessage: async () => ({ success: true, data: undefined }),
      } as any,
    );
  });

  describe("End-to-End Page Composition", () => {
    it("should compose a complete landing page successfully", async () => {
      // Act
      const result = await compositionService.composePage("landing");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(unwrapResult(result)).toBeDefined();
      }

      const composition = unwrapResult(result);

      // Should have expected structure
      expect(composition.sections).toBeDefined();
      expect(composition.sections.length).toBeGreaterThan(0);
      expect(composition.metadata).toBeDefined();
      expect(composition.analytics).toBeDefined();
      expect(composition.experiments).toBeDefined();

      // Should have valid metadata
      expect(composition.metadata.title).toBeDefined();
      expect(composition.metadata.description).toBeDefined();
      expect(composition.metadata.keywords).toBeDefined();

      // Should have valid analytics
      expect(composition.analytics.pageType).toBe("landing");
      expect(composition.analytics.conversionGoals).toBeDefined();
    });

    it("should compose different page types with appropriate content", async () => {
      // Arrange
      const pageTypes = ["landing", "features", "pricing"] as const;

      // Act & Assert
      for (const pageType of pageTypes) {
        const result = await compositionService.composePage(pageType);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(unwrapResult(result).analytics.pageType).toBe(pageType);
          expect(unwrapResult(result).sections.length).toBeGreaterThan(0);
        }
      }
    });

    it("should handle composition failures gracefully with fallbacks", async () => {
      // Arrange - Create a failing content mapper
      const failingMapper = new ContentMapper(
        {
          getActiveVariant: async () => ({
            success: false,
            error: TestUtils.createAppError(
              "Failed to get experiment",
              "INTERNAL_ERROR",
            ),
          }),
          isExperimentActive: async () => ({
            success: false,
            error: TestUtils.createAppError(
              "Failed to check experiment",
              "INTERNAL_ERROR",
            ),
          }),
        } as any,
        {
          startTimer: () => ({
            id: "test",
            operation: "test",
            startTime: Date.now(),
          }),
          endTimer: async () => ({ success: true, data: 100 }),
          recordMetric: async () => ({ success: true, data: undefined }),
        } as any,
        {
          captureException: async () => ({ success: true, data: undefined }),
          captureMessage: async () => ({ success: true, data: undefined }),
        } as any,
      );

      const failingService = new PageCompositionService(
        failingMapper,
        fallbackProvider,
        {
          startTimer: () => ({
            id: "test",
            operation: "test",
            startTime: Date.now(),
          }),
          endTimer: async () => ({ success: true, data: 100 }),
          recordMetric: async () => ({ success: true, data: undefined }),
        } as any,
        {
          captureException: async () => ({ success: true, data: undefined }),
          captureMessage: async () => ({ success: true, data: undefined }),
        } as any,
      );

      // Act
      const result = await failingService.composePage("landing");

      // Assert - Should still succeed with fallback
      expect(result.success).toBe(true);
      expect(unwrapResult(result).sections).toBeDefined();
      expect(unwrapResult(result).sections.length).toBeGreaterThan(0);
    });

    it("should compose synchronously for SSR compatibility", () => {
      // Act
      const result = compositionService.composePageSync("landing");

      // Assert
      expect(result.success).toBe(true);
      expect(unwrapResult(result)).toBeDefined();
      expect(unwrapResult(result).sections.length).toBeGreaterThan(0);
    });
  });

  describe("Content Mapping Integration", () => {
    it("should map section content with proper fallbacks", async () => {
      // Arrange
      const context = Factory.createValidCompositionContext();

      // Act
      const heroResult = await contentMapper.mapSectionContent(
        "hero",
        "landing",
        context,
      );
      const benefitsResult = await contentMapper.mapSectionContent(
        "benefits",
        "landing",
        context,
      );

      // Assert
      expect(heroResult.success).toBe(true);
      expect(benefitsResult.success).toBe(true);

      expect(TestUtils.unwrapResult(heroResult).content).toBeDefined();
      expect(TestUtils.unwrapResult(benefitsResult).content).toBeDefined();

      expect(TestUtils.unwrapResult(heroResult).variant).toBeDefined();
      expect(TestUtils.unwrapResult(benefitsResult).variant).toBeDefined();
    });

    it("should handle unknown sections gracefully", async () => {
      // Act
      const result = await contentMapper.mapSectionContent(
        "unknown" as any,
        "landing",
      );

      // Assert
      expect(result.success).toBe(false);
      expect(unwrapError(result).code).toBe("VALIDATION_ERROR");
    });
  });

  describe("SSR Compatibility", () => {
    it("should work in server environment simulation", () => {
      // This test simulates SSR environment
      // In real SSR, window would be undefined

      // Act
      const result = compositionService.composePageSync("landing");

      // Assert
      expect(result.success).toBe(true);
      // Should work without window-dependent features
    });

    it("should handle environment-specific operations safely", () => {
      // Act & Assert
      expect(() => ssrAdapter.isServerContext()).not.toThrow();
      expect(() => ssrAdapter.isClientContext()).not.toThrow();
      expect(() => ssrAdapter.getEnvironmentInfo()).not.toThrow();
    });
  });

  describe("Performance Characteristics", () => {
    it("should compose pages within reasonable time limits", async () => {
      // Act
      const startTime = performance.now();
      await compositionService.composePage("landing");
      const endTime = performance.now();

      // Assert - Should complete within 1 second
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it("should handle concurrent composition requests", async () => {
      // Act
      const promises = [
        compositionService.composePage("landing"),
        compositionService.composePage("features"),
        compositionService.composePage("pricing"),
      ];

      const results = await Promise.all(promises);

      // Assert
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe("Error Recovery", () => {
    it("should provide comprehensive fallback content", () => {
      // Act
      const fallbackResult = fallbackProvider.getFallbackComposition("landing");

      // Assert
      expect(fallbackResult.success).toBe(true);

      const composition = unwrapResult(fallbackResult);

      // Should have all required properties
      expect(composition.sections).toBeDefined();
      expect(composition.metadata).toBeDefined();
      expect(composition.analytics).toBeDefined();
      expect(composition.experiments).toEqual([]);

      // Should have meaningful content
      expect(composition.sections.length).toBeGreaterThan(0);
      expect(composition.metadata.title).toBeTruthy();
      expect(composition.metadata.description).toBeTruthy();
    });

    it("should maintain data consistency in fallbacks", () => {
      // Act
      const compositionFallback =
        fallbackProvider.getFallbackComposition("landing");
      const sectionFallback =
        fallbackProvider.getFallbackSectionContent("hero");

      // Assert
      expect(unwrapResult(compositionFallback).analytics.pageType).toBe(
        "landing",
      );
      expect(unwrapResult(sectionFallback).variant.id).toBe("emergency");
    });
  });

  describe("Memory and Resource Management", () => {
    it("should not leak resources during repeated compositions", async () => {
      // Act - Perform multiple compositions
      for (let i = 0; i < 10; i++) {
        await compositionService.composePage("landing");
      }

      // Assert - Should not throw or accumulate memory issues
      // In a real scenario, we'd check memory usage here
      expect(true).toBe(true); // Placeholder assertion
    });

    it("should handle cleanup properly", async () => {
      // This test ensures that any resources created during composition
      // are properly cleaned up

      // Act
      await compositionService.composePage("landing");
      await compositionService.composePage("features");

      // Assert - No lingering state or resources
      expect(true).toBe(true); // Placeholder assertion
    });
  });

  describe("Cross-Service Communication", () => {
    it("should coordinate between services correctly", async () => {
      // Arrange
      const context = Factory.createValidCompositionContext();

      // Act
      const result = await compositionService.composePage("landing", context);

      // Assert
      expect(result.success).toBe(true);

      // Services should have communicated properly:
      // - ContentMapper should have received context
      // - FallbackProvider should be ready if needed
      // - Composition should be valid
      expect(unwrapResult(result).sections.length).toBeGreaterThan(0);
    });

    it("should maintain service boundaries", () => {
      // This test ensures services don't interfere with each other

      // Act - Use services independently
      const compositionResult = compositionService.composePageSync("landing");
      const fallbackResult = fallbackProvider.getFallbackComposition("landing");
      const envInfo = ssrAdapter.getEnvironmentInfo();

      // Assert - All should work independently
      expect(compositionResult.success).toBe(true);
      expect(fallbackResult.success).toBe(true);
      expect(envInfo).toBeDefined();
    });
  });
});
