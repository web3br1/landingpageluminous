// Tests for Test Helpers
// Ensures our testing utilities work correctly

import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Mock window for SSR tests
const mockWindow = {
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  IntersectionObserver: jest.fn(),
  matchMedia: jest.fn(() => ({
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
};

Object.defineProperty(global, "window", {
  value: mockWindow,
  writable: true,
});
import {
  TestDataFactory,
  MockPageCompositionService,
  MockContentMapper,
  MockFallbackProvider,
  MockSSRAdapter,
  MockExperimentService,
  MockAnalyticsService,
  MockPerformanceMonitor,
  MockErrorTracker,
  TestUtils,
  TestScenarios,
} from "../../../tests/__shared__/lib/test-helpers";

describe("Test Helpers", () => {
  describe("TestDataFactory", () => {
    it("should create valid page composition", () => {
      // Act
      const composition = TestDataFactory.createValidPageComposition();

      // Assert
      expect(composition.sections).toBeDefined();
      expect(composition.sections.length).toBe(2);
      expect(composition.metadata.title).toBe("Test Page");
      expect(composition.analytics.pageType).toBe("landing");
    });

    it("should allow overriding default values", () => {
      // Act
      const composition = TestDataFactory.createValidPageComposition({
        metadata: {
          title: "Custom Title",
          description: "Custom Description",
          keywords: ["custom"],
        },
      });

      // Assert
      expect(composition.metadata.title).toBe("Custom Title");
      expect(composition.metadata.description).toBe("Test description"); // Should keep defaults
    });

    it("should create valid section content", () => {
      // Act
      const content = TestDataFactory.createValidSectionContent("hero");

      // Assert
      expect(content.content.headline).toBe("Test Headline");
      expect(content.variant.id).toBe("test");
    });

    it("should create valid composition context", () => {
      // Act
      const context = TestDataFactory.createValidCompositionContext();

      // Assert
      expect(context.userId).toBe("test-user-id");
      expect(context.locale).toBe("pt-BR");
      expect(context.experiments).toBeDefined();
    });

    it("should create valid environment info", () => {
      // Act
      const info = TestDataFactory.createValidEnvironmentInfo();

      // Assert
      expect(typeof info.isServer).toBe("boolean");
      expect(typeof info.isClient).toBe("boolean");
      expect(info.nodeEnv).toBeDefined();
    });

    it("should create valid timer handle", () => {
      // Act
      const handle = TestDataFactory.createValidTimerHandle();

      // Assert
      expect(handle.id).toBe("test-timer-id");
      expect(handle.operation).toBe("test-operation");
      expect(typeof handle.startTime).toBe("number");
    });
  });

  describe("Mock Services", () => {
    describe("MockPageCompositionService", () => {
      let mockService: MockPageCompositionService;

      beforeEach(() => {
        mockService = new MockPageCompositionService();
      });

      it("should mock successful composition", async () => {
        // Arrange
        const composition = TestDataFactory.createValidPageComposition();
        mockService.mockSuccess(composition);

        // Act
        const result = await mockService.composePage("landing");

        // Assert
        expect(result.success).toBe(true);
        expect(TestUtils.unwrapResult(result)).toBe(composition);
        expect(mockService.composePage).toHaveBeenCalledWith("landing");
      });

      it("should mock composition failure", async () => {
        // Arrange
        const error = TestUtils.createAppError("TestError", "Mock error");
        mockService.mockFailure(error);

        // Act
        const result = await mockService.composePage("landing");

        // Assert
        expect(result.success).toBe(false);
        expect(TestUtils.unwrapError(result)).toBe(error);
      });

      it("should support chaining", () => {
        // Act
        const result = mockService.mockSuccess();

        // Assert
        expect(result).toBe(mockService);
      });
    });

    describe("MockContentMapper", () => {
      let mockMapper: InstanceType<typeof MockContentMapper>;

      beforeEach(() => {
        mockMapper = new MockContentMapper();
      });

      it("should mock successful mapping", async () => {
        // Arrange
        const content = TestDataFactory.createValidSectionContent("hero");
        mockMapper.mockSuccess(content);

        // Act
        const result = await mockMapper.mapSectionContent("hero", "landing");

        // Assert
        expect(result.success).toBe(true);
        expect(TestUtils.unwrapResult(result)).toBe(content);
      });

      it("should mock mapping failure", async () => {
        // Arrange
        const error = TestUtils.createAppError(
          "MappingError",
          "Mock mapping error",
        );
        mockMapper.mockFailure(error);

        // Act
        const result = await mockMapper.mapSectionContent("hero", "landing");

        // Assert
        expect(result.success).toBe(false);
        expect(TestUtils.unwrapError(result)).toBe(error);
      });
    });

    describe("MockSSRAdapter", () => {
      let mockAdapter: InstanceType<typeof MockSSRAdapter>;

      beforeEach(() => {
        mockAdapter = new MockSSRAdapter();
      });

      it("should mock client environment", () => {
        // Act
        mockAdapter.mockClientEnvironment();

        // Assert
        expect(mockAdapter.isClientContext()).toBe(true);
        expect(mockAdapter.isServerContext()).toBe(false);
        expect(mockAdapter.getEnvironmentInfo().isClient).toBe(true);
      });

      it("should mock server environment", () => {
        // Act
        mockAdapter.mockServerEnvironment();

        // Assert
        expect(mockAdapter.isServerContext()).toBe(true);
        expect(mockAdapter.isClientContext()).toBe(false);
        expect(mockAdapter.getEnvironmentInfo().isServer).toBe(true);
      });

      it("should mock static generation", () => {
        // Act
        mockAdapter.mockStaticGeneration();

        // Assert
        expect(mockAdapter.isStaticGeneration()).toBe(true);
        expect(mockAdapter.isServerContext()).toBe(true);
      });
    });

    describe("MockExperimentService", () => {
      let mockExperiment: InstanceType<typeof MockExperimentService>;

      beforeEach(() => {
        mockExperiment = new MockExperimentService();
      });

      it("should mock active variant", async () => {
        // Arrange
        mockExperiment.mockVariant("variant_a");

        // Act
        const variantResult = await mockExperiment.getActiveVariant("test");
        const activeResult = await mockExperiment.isExperimentActive("test");

        // Assert
        expect(variantResult.success).toBe(true);
        expect(TestUtils.unwrapResult(variantResult)).toBe("variant_a");
        expect(activeResult.success).toBe(true);
        expect(TestUtils.unwrapResult(activeResult)).toBe(true);
      });

      it("should mock inactive experiment", async () => {
        // Arrange
        mockExperiment.mockInactive();

        // Act
        const variantResult = await mockExperiment.getActiveVariant("test");
        const activeResult = await mockExperiment.isExperimentActive("test");

        // Assert
        expect(variantResult.success).toBe(true);
        expect(TestUtils.unwrapResult(variantResult)).toBe("control");
        expect(activeResult.success).toBe(true);
        expect(TestUtils.unwrapResult(activeResult)).toBe(false);
      });
    });

    describe("MockPerformanceMonitor", () => {
      let mockMonitor: InstanceType<typeof MockPerformanceMonitor>;

      beforeEach(() => {
        mockMonitor = new MockPerformanceMonitor();
      });

      it("should mock timer operations", async () => {
        // Arrange
        const expectedDuration = 150;
        mockMonitor.mockTimer(expectedDuration);

        // Act
        const handle = mockMonitor.startTimer("test");
        const result = await mockMonitor.endTimer(handle);

        // Assert
        expect(result.success).toBe(true);
        expect(TestUtils.unwrapResult(result)).toBe(expectedDuration);
      });

      it("should mock metric recording", async () => {
        // Arrange
        mockMonitor.mockSuccess();

        // Act
        const result = await mockMonitor.recordMetric("test", 100, {
          tag: "value",
        });

        // Assert
        expect(result.success).toBe(true);
      });
    });

    describe("MockErrorTracker", () => {
      let mockTracker: InstanceType<typeof MockErrorTracker>;

      beforeEach(() => {
        mockTracker = new MockErrorTracker();
      });

      it("should mock error tracking", async () => {
        // Arrange
        mockTracker.mockSuccess();
        const error = new Error("Test error");

        // Act
        const exceptionResult = await mockTracker.captureException(error);
        const messageResult = await mockTracker.captureMessage(
          "Test message",
          "error",
        );

        // Assert
        expect(exceptionResult.success).toBe(true);
        expect(messageResult.success).toBe(true);
      });
    });
  });

  describe("TestUtils", () => {
    it("should create app errors", () => {
      // Act
      const error = TestUtils.createAppError("Test message", "TEST_CODE");

      // Assert
      expect(error.message).toBe("Test message");
      expect(error.code).toBe("TEST_CODE");
    });

    it("should mock console safely", () => {
      // Act
      const mockConsole = TestUtils.mockConsole();

      // Assert
      expect(mockConsole.mocks.log).toBeDefined();
      expect(mockConsole.mocks.error).toBeDefined();

      // Test logging
      console.log("Test message");
      expect(mockConsole.mocks.log).toHaveBeenCalledWith("Test message");

      // Cleanup
      mockConsole.restore();
    });

    it("should mock localStorage safely", () => {
      // Act
      const mockStorage = TestUtils.mockLocalStorage();

      // Assert
      expect(mockStorage.store).toBeDefined();
      expect(typeof mockStorage.restore).toBe("function");

      // Test that store operations work
      mockStorage.store.test = "value";
      expect(mockStorage.store.test).toBe("value");

      // Cleanup
      mockStorage.restore();
    });

    it("should mock IntersectionObserver safely", () => {
      // Act
      const mockIO = TestUtils.mockIntersectionObserver();

      // Assert
      expect(mockIO.mock).toBeDefined();
      expect(typeof mockIO.restore).toBe("function");

      // Test that mock was created
      expect(jest.isMockFunction(mockIO.mock)).toBe(true);

      // Cleanup
      mockIO.restore();
    });
  });

  describe("TestScenarios", () => {
    it("should provide successful composition scenario", async () => {
      // Act
      const { service, composition } =
        TestScenarios.createSuccessfulCompositionScenario();
      const result = await service.composePage("landing");

      // Assert
      expect(service).toBeDefined();
      expect(composition).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should provide composition failure scenario", async () => {
      // Act
      const { service, error } =
        TestScenarios.createCompositionFailureScenario();
      const result = await service.composePage("landing");

      // Assert
      expect(service).toBeDefined();
      expect(error).toBeDefined();
      expect(result.success).toBe(false);
    });

    it("should provide SSR adapter client environment scenario", () => {
      // Act
      const adapter = TestScenarios.createSSRAdapterClientScenario();

      // Assert
      expect(adapter.isClientContext()).toBe(true);
      expect(adapter.isServerContext()).toBe(false);
      expect(adapter.getEnvironmentInfo().isClient).toBe(true);
    });

    it("should provide SSR adapter server environment scenario", () => {
      // Act
      const adapter = TestScenarios.createSSRAdapterServerScenario();

      // Assert
      expect(adapter.isServerContext()).toBe(true);
      expect(adapter.isClientContext()).toBe(false);
      expect(adapter.getEnvironmentInfo().isServer).toBe(true);
    });
  });

  describe("Integration and Edge Cases", () => {
    it("should handle complex test data structures", () => {
      // Act
      const composition = TestDataFactory.createValidPageComposition({
        sections: [
          TestDataFactory.createValidSectionContent("hero"),
          TestDataFactory.createValidSectionContent("benefits"),
        ].map((content) => ({
          id:
            content === TestDataFactory.createValidSectionContent("hero")
              ? "hero"
              : ("benefits" as any),
          component: "TestComponent",
          content,
          order: 1,
        })),
      });

      // Assert
      expect(composition.sections).toHaveLength(2);
      expect(composition.sections[0].content).toBeDefined();
      expect(composition.sections[0].content!.variant.id).toBe("test");
    });

    it("should provide consistent test data across calls", () => {
      // Act
      const composition1 = TestDataFactory.createValidPageComposition();
      const composition2 = TestDataFactory.createValidPageComposition();

      // Assert
      expect(composition1.metadata.title).toBe(composition2.metadata.title);
      expect(composition1.sections.length).toBe(composition2.sections.length);
    });

    it("should support deep merging of overrides", () => {
      // Act
      const composition = TestDataFactory.createValidPageComposition({
        metadata: {
          title: "Override Title",
          description: "Override Description",
          keywords: ["override", "keywords"],
        },
        analytics: {
          pageType: "features" as any,
          conversionGoals: ["override_goal"],
        },
      });

      // Assert
      expect(composition.metadata.title).toBe("Override Title");
      expect(composition.metadata.keywords).toEqual(["override", "keywords"]);
      expect(composition.analytics.pageType).toBe("features");
      expect(composition.analytics.conversionGoals).toEqual(["override_goal"]);
    });
  });
});
