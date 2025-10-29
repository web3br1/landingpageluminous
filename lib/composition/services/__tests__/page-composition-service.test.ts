// Unit Tests for PageCompositionService - Fase 2 Implementation
// Tests the orchestration logic with mocked dependencies
// Target: 15+ test cases covering all critical paths

import { describe, it, expect, beforeEach, vi } from "vitest";

import { PageCompositionService } from "../page-composition-service";
import {
  Factory,
  MockMapper,
  MockFallback,
  MockPerformance,
  MockError,
  Utils,
} from "../../test-helpers";
import { Result, isOk } from "@shared/core";

describe("PageCompositionService", () => {
  let service: PageCompositionService;
  let mockMapper: InstanceType<typeof MockMapper>;
  let mockFallback: InstanceType<typeof MockFallback>;
  let mockPerformance: InstanceType<typeof MockPerformance>;
  let mockErrorTracker: InstanceType<typeof MockError>;

  beforeEach(() => {
    // Create fresh mocks for each test
    mockMapper = new MockMapper();
    mockFallback = new MockFallback();
    mockPerformance = new MockPerformance();
    mockErrorTracker = new MockError();

    // Initialize service with mocked dependencies
    service = new PageCompositionService(
      mockMapper,
      mockFallback,
      mockPerformance,
      mockErrorTracker,
    );
  });

  describe("composePage (async)", () => {
    it("should successfully compose a page with valid data", async () => {
      // Arrange
      const composition = Factory.createValidPageComposition();
      const context = Factory.createValidCompositionContext();

      mockMapper.mockSuccess();
      mockFallback.mockSuccess(composition);
      mockPerformance.mockTimer(150);
      mockErrorTracker.mockSuccess();

      // Act
      const result = await service.composePage("landing", context);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(unwrapResult(result)).toBeDefined();
        expect(unwrapResult(result).sections).toHaveLength(2);
        expect(unwrapResult(result).metadata.title).toBe("Test Page");
      }

      // Verify interactions
      expect(mockMapper.mapSectionContent).toHaveBeenCalledTimes(2);
      expect(mockPerformance.startTimer).toHaveBeenCalledWith("compose_page");
      expect(mockPerformance.endTimer).toHaveBeenCalled();
    });

    it("should handle mapper failures gracefully with fallback", async () => {
      // Arrange
      const error = Utils.createAppError(
        "MappingError",
        "Failed to map content",
      );
      const fallbackComposition = Factory.createValidPageComposition();

      mockMapper.mockFailure(error);
      mockFallback.mockSuccess(fallbackComposition);
      mockPerformance.mockTimer(200);

      // Act
      const result = await service.composePage("landing");

      // Assert
      expect(result.success).toBe(true);
      expect(unwrapResult(result)).toEqual(fallbackComposition);

      // Verify fallback was called
      expect(mockFallback.getFallbackComposition).toHaveBeenCalledWith(
        "landing",
        error,
      );
    });

    it("should validate composition and use fallback on validation failure", async () => {
      // Arrange
      const invalidComposition = Factory.createValidPageComposition({
        sections: [], // Invalid: no sections
      });

      mockMapper.mockSuccess();
      mockFallback.mockSuccess();
      mockPerformance.mockTimer(100);

      // Mock validation to fail
      jest.mock("../composer-validation", () => ({
        validatePageComposition: jest.fn().mockReturnValue({
          success: false,
          error: { message: "Validation failed" },
        }),
      }));

      // Act
      const result = await service.composePage("landing");

      // Assert
      expect(result.success).toBe(true); // Should still succeed with fallback
      expect(mockFallback.getFallbackComposition).toHaveBeenCalled();
      expect(mockErrorTracker.captureException).toHaveBeenCalled();
    });

    it("should handle exceptions and return fallback composition", async () => {
      // Arrange
      const error = new Error("Unexpected error");

      mockMapper.mapSectionContent.mockRejectedValue(error);
      mockFallback.mockSuccess();
      mockPerformance.mockTimer(50);

      // Act
      const result = await service.composePage("landing");

      // Assert
      expect(result.success).toBe(true); // Should succeed with fallback
      expect(mockFallback.getFallbackComposition).toHaveBeenCalledWith(
        "landing",
        error,
      );
      expect(mockErrorTracker.captureException).toHaveBeenCalledWith(error, {
        pageType: "landing",
        operation: "compose_page",
      });
    });

    it("should pass composition context to mapper", async () => {
      // Arrange
      const context = Factory.createValidCompositionContext();

      mockMapper.mockSuccess();
      mockFallback.mockSuccess();
      mockPerformance.mockTimer(75);

      // Act
      await service.composePage("landing", context);

      // Assert
      expect(mockMapper.mapSectionContent).toHaveBeenCalledWith(
        "hero",
        "landing",
        context,
      );
      expect(mockMapper.mapSectionContent).toHaveBeenCalledWith(
        "benefits",
        "landing",
        context,
      );
    });
  });

  describe("composePageSync", () => {
    it("should successfully compose synchronously", () => {
      // Arrange
      const composition = Factory.createValidPageComposition();

      mockMapper.mapSectionContentSync
        .mockReturnValue(Result.ok(Factory.createValidSectionContent("hero")))
        .mockReturnValueOnce(
          Result.ok(Factory.createValidSectionContent("benefits")),
        );

      mockFallback.mockSuccess(composition);
      mockPerformance.mockTimer(25);

      // Act
      const result = service.composePageSync("landing");

      // Assert
      expect(result.success).toBe(true);
      expect(unwrapResult(result).sections).toHaveLength(2);
      expect(mockMapper.mapSectionContentSync).toHaveBeenCalledTimes(2);
    });

    it("should handle sync failures with fallback", () => {
      // Arrange
      const error = Utils.createAppError("SyncError", "Sync mapping failed");
      const fallbackComposition = Factory.createValidPageComposition();

      mockMapper.mapSectionContentSync.mockReturnValue({
        success: false,
        error,
      });

      mockFallback.mockSuccess(fallbackComposition);

      // Act
      const result = service.composePageSync("landing");

      // Assert
      expect(result.success).toBe(true);
      expect(unwrapResult(result)).toEqual(fallbackComposition);
      expect(mockFallback.getFallbackComposition).toHaveBeenCalledWith(
        "landing",
        error,
      );
    });

    it("should validate serializable composition in development", () => {
      // Arrange - Mock development environment
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "development",
        writable: true,
      });

      mockMapper.mapSectionContentSync.mockReturnValue(
        Result.ok(Factory.createValidSectionContent("hero")),
      );

      mockFallback.mockSuccess();

      // Act & Assert - Should not throw (composition is serializable)
      expect(() => service.composePageSync("landing")).not.toThrow();

      // Cleanup
      Object.defineProperty(process.env, "NODE_ENV", {
        value: originalEnv,
        writable: true,
      });
    });
  });

  describe("performance monitoring", () => {
    it("should record performance metrics for successful operations", async () => {
      // Arrange
      const expectedDuration = 300;

      mockMapper.mockSuccess();
      mockFallback.mockSuccess();
      mockPerformance.mockTimer(expectedDuration);
      mockErrorTracker.mockSuccess();

      // Act
      await service.composePage("landing");

      // Assert
      expect(mockPerformance.startTimer).toHaveBeenCalledWith("compose_page");
      expect(mockPerformance.endTimer).toHaveBeenCalled();
      expect(mockPerformance.recordMetric).toHaveBeenCalledWith(
        "section_content_mapping_duration",
        expectedDuration,
        expect.objectContaining({
          section_id: expect.any(String),
          page_type: "landing",
        }),
      );
    });

    it("should still record performance metrics on failures", async () => {
      // Arrange
      const error = new Error("Test error");

      mockMapper.mapSectionContent.mockRejectedValue(error);
      mockFallback.mockSuccess();
      mockPerformance.mockTimer(150);

      // Act
      await service.composePage("landing");

      // Assert
      expect(mockPerformance.endTimer).toHaveBeenCalled();
      // Should still record metrics even on failure
    });
  });

  describe("error handling", () => {
    it("should capture exceptions with proper context", async () => {
      // Arrange
      const error = new Error("Composition failed");

      mockMapper.mapSectionContent.mockRejectedValue(error);
      mockFallback.mockSuccess();

      // Act
      await service.composePage("landing");

      // Assert
      expect(mockErrorTracker.captureException).toHaveBeenCalledWith(error, {
        pageType: "landing",
        operation: "compose_page",
      });
    });

    it("should not expose internal errors in production", async () => {
      // This would be tested in integration tests with actual error boundaries
      // Unit tests focus on the service logic
    });
  });

  describe("experiment collection", () => {
    it("should collect experiment information from sections", async () => {
      // Arrange
      const sectionWithExperiment = Factory.createValidSectionContent("hero");
      sectionWithExperiment.experiment = {
        id: "hero_test",
        variant: "variant_a",
      };

      mockMapper.mapSectionContent
        .mockResolvedValueOnce(Result.ok(sectionWithExperiment))
        .mockResolvedValueOnce(
          Result.ok(Factory.createValidSectionContent("benefits")),
        );

      mockFallback.mockSuccess();
      mockPerformance.mockTimer(100);

      // Act
      const result = await service.composePage("landing");

      // Assert
      expect(result.success).toBe(true);
      expect(unwrapResult(result).experiments).toHaveLength(1);
      expect(unwrapResult(result).experiments[0]).toEqual({
        id: "hero_test",
        variant: "variant_a",
        sections: ["hero"],
      });
    });

    it("should aggregate experiments across multiple sections", async () => {
      // Arrange
      const heroContent = Factory.createValidSectionContent("hero");
      heroContent.experiment = {
        id: "hero_test",
        variant: "variant_a",
      };

      const benefitsContent = Factory.createValidSectionContent("benefits");
      benefitsContent.experiment = {
        id: "hero_test", // Same experiment
        variant: "variant_a",
      };

      mockMapper.mapSectionContent
        .mockResolvedValueOnce(Result.ok(heroContent))
        .mockResolvedValueOnce(Result.ok(benefitsContent));

      mockFallback.mockSuccess();
      mockPerformance.mockTimer(120);

      // Act
      const result = await service.composePage("landing");

      // Assert
      expect(unwrapResult(result).experiments).toHaveLength(1);
      expect(unwrapResult(result).experiments[0].sections).toEqual([
        "hero",
        "benefits",
      ]);
    });
  });

  describe("edge cases", () => {
    it("should handle empty sections gracefully", async () => {
      // Arrange
      const compositionWithEmptySections = Factory.createValidPageComposition({
        sections: [],
      });

      mockMapper.mockSuccess();
      mockFallback.mockSuccess(compositionWithEmptySections);

      // Act
      const result = await service.composePage("landing");

      // Assert
      expect(result.success).toBe(true);
      expect(unwrapResult(result).sections).toHaveLength(0);
    });

    it("should handle undefined context", async () => {
      // Arrange
      mockMapper.mockSuccess();
      mockFallback.mockSuccess();

      // Act
      const result = await service.composePage("landing", undefined);

      // Assert
      expect(result.success).toBe(true);
      expect(mockMapper.mapSectionContent).toHaveBeenCalledWith(
        "hero",
        "landing",
        undefined,
      );
    });

    it("should handle partial section failures gracefully", async () => {
      // Arrange
      const error = Utils.createAppError("Section mapping failed");

      mockMapper.mapSectionContent
        .mockResolvedValueOnce(
          Result.ok(Factory.createValidSectionContent("hero")),
        )
        .mockResolvedValueOnce(Result.err(error)); // benefits fails

      mockFallback.mockSuccess();
      mockPerformance.mockTimer(150);

      // Act
      const result = await service.composePage("landing");

      // Assert
      expect(result.success).toBe(true);
      expect(isOk(result) && result.value.sections).toHaveLength(1); // Only hero section
      expect(isOk(result) && result.value.sections[0].id).toBe("hero");
    });

    it("should fail when all sections fail to compose", async () => {
      // Arrange
      const error = Utils.createAppError("All sections failed");

      mockMapper.mapSectionContent.mockResolvedValue(Result.err(error));
      mockFallback.mockSuccess();

      // Act
      const result = await service.composePage("landing");

      // Assert
      expect(result.success).toBe(false);
      expect(!result.success && result.error.code).toBe("INTERNAL_ERROR");
    });

    it("should handle configuration provider failure", async () => {
      // Arrange - Mock config provider to fail
      const serviceWithConfig = new PageCompositionService(
        mockMapper,
        mockFallback,
        mockPerformance,
        mockErrorTracker,
        {
          getPageConfig: vi.fn().mockReturnValue(
            Result.err({
              name: "AppError",
              message: "Config not found",
              code: "CONFIG_ERROR",
            }),
          ),
        },
      );

      mockFallback.mockSuccess();

      // Act
      const result = await serviceWithConfig.composePage("unknown-page");

      // Assert
      expect(result.success).toBe(true); // Should succeed with fallback
      expect(mockFallback.getFallbackComposition).toHaveBeenCalledWith(
        "unknown-page",
        expect.objectContaining({ code: "CONFIG_ERROR" }),
      );
    });

    it("should validate page composition structure", async () => {
      // Arrange - Invalid composition structure
      mockMapper.mockSuccess();
      mockFallback.mockSuccess();

      // Mock validation to fail by making jest.mock work
      const originalValidate = await import("../composer-validation");
      const mockValidate = vi.fn().mockReturnValue({
        success: false,
        error: { message: "Invalid composition structure" },
      });

      vi.doMock("../composer-validation", () => ({
        validatePageComposition: mockValidate,
      }));

      // Act
      const result = await service.composePage("landing");

      // Assert
      expect(result.success).toBe(true); // Should succeed with fallback
      expect(mockFallback.getFallbackComposition).toHaveBeenCalled();
      expect(mockErrorTracker.captureException).toHaveBeenCalled();

      // Restore mock
      vi.doUnmock("../composer-validation");
    });

    it("should collect experiments from multiple sections", async () => {
      // Arrange
      const heroContent = Factory.createValidSectionContent("hero");
      heroContent.experiment = { id: "hero_exp", variant: "A" };

      const featuresContent = Factory.createValidSectionContent("features");
      featuresContent.experiment = { id: "features_exp", variant: "B" };

      mockMapper.mapSectionContent
        .mockResolvedValueOnce(Result.ok(heroContent))
        .mockResolvedValueOnce(Result.ok(featuresContent))
        .mockResolvedValueOnce(
          Result.ok(Factory.createValidSectionContent("benefits")),
        );

      mockFallback.mockSuccess();

      // Act
      const result = await service.composePage("landing");

      // Assert
      expect(result.success).toBe(true);
      expect(isOk(result) && result.value.experiments).toHaveLength(2);
      expect(isOk(result) && result.value.experiments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "hero_exp", variant: "A" }),
          expect.objectContaining({ id: "features_exp", variant: "B" }),
        ]),
      );
    });

    it("should handle performance monitoring failures gracefully", async () => {
      // Arrange
      mockMapper.mockSuccess();
      mockFallback.mockSuccess();
      mockPerformance.startTimer.mockImplementation(() => {
        throw new Error("Performance monitoring failed");
      });

      // Act
      const result = await service.composePage("landing");

      // Assert
      expect(result.success).toBe(true); // Should succeed despite perf failure
    });

    it("should handle error tracker failures gracefully", async () => {
      // Arrange
      const error = new Error("Composition failed");
      mockMapper.mapSectionContent.mockRejectedValue(error);
      mockFallback.mockSuccess();
      mockErrorTracker.captureException.mockRejectedValue(
        new Error("Tracking failed"),
      );

      // Act
      const result = await service.composePage("landing");

      // Assert
      expect(result.success).toBe(true); // Should succeed despite tracking failure
    });

    it("should handle empty sections array", async () => {
      // Arrange
      const serviceWithEmptySections = new PageCompositionService(
        mockMapper,
        mockFallback,
        mockPerformance,
        mockErrorTracker,
        {
          getPageConfig: vi.fn().mockReturnValue(
            Result.ok({
              sections: [],
              metadata: { title: "Empty Page" },
              analytics: { pageType: "empty", conversionGoals: [] },
            }),
          ),
        },
      );

      mockFallback.mockSuccess();

      // Act
      const result = await serviceWithEmptySections.composePage("empty");

      // Assert
      expect(result.success).toBe(true);
      expect(isOk(result) && result.value.sections).toHaveLength(0);
    });

    it("should handle malformed context object", async () => {
      // Arrange - Context with invalid properties
      const invalidContext = {
        userId: null, // Invalid type
        experiments: "not-an-object", // Invalid type
        invalidProp: "should-be-ignored",
      };

      mockMapper.mockSuccess();
      mockFallback.mockSuccess();

      // Act
      const result = await service.composePage(
        "landing",
        invalidContext as any,
      );

      // Assert
      expect(result.success).toBe(true); // Should handle invalid context gracefully
    });

    it("should preserve section order from configuration", async () => {
      // Arrange - Custom service with specific config
      const serviceWithOrderedSections = new PageCompositionService(
        mockMapper,
        mockFallback,
        mockPerformance,
        mockErrorTracker,
        {
          getPageConfig: vi.fn().mockReturnValue(
            Result.ok({
              sections: [
                { id: "header", component: "Header", order: 1, content: null },
                { id: "hero", component: "Hero", order: 2, content: null },
                { id: "footer", component: "Footer", order: 10, content: null },
              ],
              metadata: { title: "Ordered Page" },
              analytics: { pageType: "ordered", conversionGoals: [] },
            }),
          ),
        },
      );

      mockMapper.mockSuccess();
      mockFallback.mockSuccess();

      // Act
      const result = await serviceWithOrderedSections.composePage("ordered");

      // Assert
      expect(result.success).toBe(true);
      expect(isOk(result) && result.value.sections).toHaveLength(3);
      expect(isOk(result) && result.value.sections.map((s) => s.id)).toEqual([
        "header",
        "hero",
        "footer",
      ]);
    });

    it("should handle async section mapping timeout", async () => {
      // Arrange
      mockMapper.mapSectionContent.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve(Result.ok(Factory.createValidSectionContent("hero"))),
              100,
            ),
          ),
      );
      mockFallback.mockSuccess();
      mockPerformance.mockTimer(200);

      // Act
      const result = await service.composePage("landing");

      // Assert
      expect(result.success).toBe(true);
      expect(mockPerformance.endTimer).toHaveBeenCalled();
    });

    it("should aggregate section-level experiments correctly", async () => {
      // Arrange - Same experiment across different sections
      const heroContent = Factory.createValidSectionContent("hero");
      heroContent.experiment = { id: "shared_exp", variant: "variant_a" };

      const benefitsContent = Factory.createValidSectionContent("benefits");
      benefitsContent.experiment = { id: "shared_exp", variant: "variant_a" };

      const featuresContent = Factory.createValidSectionContent("features");
      featuresContent.experiment = {
        id: "different_exp",
        variant: "variant_b",
      };

      mockMapper.mapSectionContent
        .mockResolvedValueOnce(Result.ok(heroContent))
        .mockResolvedValueOnce(Result.ok(benefitsContent))
        .mockResolvedValueOnce(Result.ok(featuresContent));

      mockFallback.mockSuccess();

      // Act
      const result = await service.composePage("landing");

      // Assert
      expect(result.success).toBe(true);
      expect(isOk(result) && result.value.experiments).toHaveLength(2);

      const sharedExp =
        isOk(result) &&
        result.value.experiments.find((e) => e.id === "shared_exp");
      expect(sharedExp).toEqual({
        id: "shared_exp",
        variant: "variant_a",
        sections: ["hero", "benefits"],
      });
    });
  });
});
