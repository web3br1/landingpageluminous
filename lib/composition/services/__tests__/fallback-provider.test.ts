// Unit Tests for FallbackProvider
// Tests fallback logic for error recovery

import { describe, it, expect, beforeEach } from "@jest/globals";

import { FallbackProvider } from "../fallback-provider";
import { Factory, Utils } from "../../../../tests/__shared__/lib/test-helpers";
import { Result, isOk } from "@shared/core";

// Helper function to safely extract values from Result
function unwrapResult<T>(result: Result<T, any>): T {
  if (isOk(result)) {
    return unwrapResult(result);
  }
  throw new Error("Expected Ok result");
}

describe("FallbackProvider", () => {
  let provider: FallbackProvider;

  beforeEach(() => {
    provider = new FallbackProvider();
  });

  describe("getFallbackComposition", () => {
    it("should return valid fallback composition for landing page", () => {
      // Act
      const result = provider.getFallbackComposition("landing");

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(unwrapResult(result).sections).toBeDefined();
        expect(unwrapResult(result).sections.length).toBeGreaterThan(0);
        expect(unwrapResult(result).metadata).toBeDefined();
        expect(unwrapResult(result).metadata.title).toBeDefined();
        expect(unwrapResult(result).experiments).toEqual([]);
        expect(unwrapResult(result).analytics.pageType).toBe("landing");
      }
    });

    it("should return valid fallback for all supported page types", () => {
      // Arrange
      const pageTypes = [
        "landing",
        "features",
        "pricing",
        "demo",
        "signup",
        "trial",
        "checkout",
      ] as const;

      // Act & Assert
      for (const pageType of pageTypes) {
        const result = provider.getFallbackComposition(pageType);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(unwrapResult(result).analytics.pageType).toBe(pageType);
          expect(unwrapResult(result).sections.length).toBeGreaterThan(0);
        }
      }
    });

    it("should include error context when provided", () => {
      // Arrange
      const error = Utils.createAppError("TestError", "Test error message");

      // Act
      const result = provider.getFallbackComposition("landing", error);

      // Assert
      expect(result.success).toBe(true);
      // Fallback should still be valid even with error context
      if (result.success) {
        expect(unwrapResult(result).sections).toBeDefined();
      }
    });

    it("should handle unknown page types gracefully", () => {
      // Act
      const result = provider.getFallbackComposition("unknown" as any);

      // Assert
      expect(result.success).toBe(true);
      // Should fall back to landing page configuration
      expect(unwrapResult(result).analytics.pageType).toBe("landing");
    });
  });

  describe("getFallbackSectionContent", () => {
    it("should return valid fallback content for hero section", () => {
      // Act
      const result = provider.getFallbackSectionContent("hero");

      // Assert
      expect(result.success).toBe(true);
      expect(unwrapResult(result).content).toBeDefined();
      expect(unwrapResult(result).variant).toBeDefined();
      expect(unwrapResult(result).variant.id).toBe("emergency");
    });

    it("should return valid fallback for all supported sections", () => {
      // Arrange
      const sections = [
        "hero",
        "benefits",
        "features",
        "pricing",
        "social-proof",
        "demo",
        "faq",
        "final-cta",
        "footer",
        "checkout",
        "trial",
        "signup",
      ] as const;

      // Act & Assert
      for (const sectionId of sections) {
        const result = provider.getFallbackSectionContent(sectionId);

        expect(result.success).toBe(true);
        expect(unwrapResult(result).content).toBeDefined();
        expect(unwrapResult(result).variant.id).toBe("emergency");
      }
    });

    it("should return minimal fallback for unknown sections", () => {
      // Act
      const result = provider.getFallbackSectionContent("unknown" as any);

      // Assert
      expect(result.success).toBe(true);
      expect(unwrapResult(result).content).toBeNull();
      expect(unwrapResult(result).variant.id).toBe("emergency");
    });

    it("should provide meaningful fallback content for each section type", () => {
      // Test specific sections have appropriate content
      const testCases = [
        {
          section: "hero",
          expectedHeadline: "Sistema temporariamente indisponível",
        },
        { section: "benefits", expectedTitle: "Benefícios Comprovados" },
        { section: "features", expectedTitle: "Funcionalidades Principais" },
        { section: "pricing", expectedTitle: "Planos Flexíveis" },
        { section: "faq", expectedTitle: "Perguntas Frequentes" },
        {
          section: "footer",
          expectedDescription: "Transforme dados em decisões inteligentes.",
        },
      ] as const;

      for (const { section, ...expected } of testCases) {
        const result = provider.getFallbackSectionContent(section);

        expect(result.success).toBe(true);

        if ("expectedHeadline" in expected) {
          expect(unwrapResult(result).content.headline).toBe(
            expected.expectedHeadline,
          );
        }
        if ("expectedTitle" in expected) {
          expect(unwrapResult(result).content.title).toBe(
            expected.expectedTitle,
          );
        }
        if ("expectedDescription" in expected) {
          expect(unwrapResult(result).content.description).toBe(
            expected.expectedDescription,
          );
        }
      }
    });
  });

  describe("fallback content quality", () => {
    it("should provide user-friendly error messages", () => {
      // Act
      const heroFallback = provider.getFallbackSectionContent("hero");

      // Assert
      expect(heroFallback.success).toBe(true);
      expect(Utils.unwrapResult(heroFallback).content.headline).toContain(
        "indisponível",
      );
      expect(Utils.unwrapResult(heroFallback).content.subheadline).toContain(
        "Estamos trabalhando",
      );
    });

    it("should include working CTAs in critical sections", () => {
      // Act
      const heroFallback = provider.getFallbackSectionContent("hero");

      // Assert
      expect(Utils.unwrapResult(heroFallback).content.primaryCta).toBeDefined();
      expect(Utils.unwrapResult(heroFallback).content.primaryCta).toBe(
        "Tentar novamente",
      );
    });

    it("should provide realistic content for business sections", () => {
      // Act
      const benefitsFallback = provider.getFallbackSectionContent("benefits");

      // Assert
      expect(
        Utils.unwrapResult(benefitsFallback).content.benefits,
      ).toBeDefined();
      expect(
        Utils.unwrapResult(benefitsFallback).content.benefits.length,
      ).toBeGreaterThan(0);
      expect(
        Utils.unwrapResult(benefitsFallback).content.benefits[0].title,
      ).toBeDefined();
      expect(
        Utils.unwrapResult(benefitsFallback).content.benefits[0].description,
      ).toBeDefined();
    });

    it("should include proper metadata for SEO", () => {
      // Act
      const compositionFallback = provider.getFallbackComposition("landing");

      // Assert
      expect(
        Utils.unwrapResult(compositionFallback).metadata.title,
      ).toBeDefined();
      expect(
        Utils.unwrapResult(compositionFallback).metadata.description,
      ).toBeDefined();
      expect(
        Utils.unwrapResult(compositionFallback).metadata.keywords,
      ).toBeDefined();
      expect(
        Utils.unwrapResult(compositionFallback).metadata.keywords.length,
      ).toBeGreaterThan(0);
    });
  });

  describe("error resilience", () => {
    it("should never throw exceptions during fallback generation", () => {
      // Act & Assert - These should never throw
      expect(() => provider.getFallbackComposition("landing")).not.toThrow();
      expect(() => provider.getFallbackSectionContent("hero")).not.toThrow();
      expect(() =>
        provider.getFallbackComposition("unknown" as any),
      ).not.toThrow();
      expect(() =>
        provider.getFallbackSectionContent("unknown" as any),
      ).not.toThrow();
    });

    it("should handle malformed input gracefully", () => {
      // Act & Assert
      expect(() => provider.getFallbackComposition(null as any)).not.toThrow();
      expect(() =>
        provider.getFallbackSectionContent(undefined as any),
      ).not.toThrow();
    });

    it("should provide consistent structure across fallbacks", () => {
      // Act
      const compositionFallback = provider.getFallbackComposition("landing");
      const sectionFallback = provider.getFallbackSectionContent("hero");

      // Assert
      expect(Utils.unwrapResult(compositionFallback)).toHaveProperty(
        "sections",
      );
      expect(Utils.unwrapResult(compositionFallback)).toHaveProperty(
        "metadata",
      );
      expect(Utils.unwrapResult(compositionFallback)).toHaveProperty(
        "experiments",
      );
      expect(Utils.unwrapResult(compositionFallback)).toHaveProperty(
        "analytics",
      );

      expect(Utils.unwrapResult(sectionFallback)).toHaveProperty("content");
      expect(Utils.unwrapResult(sectionFallback)).toHaveProperty("variant");
    });
  });

  describe("performance characteristics", () => {
    it("should generate fallbacks synchronously and quickly", () => {
      // Act
      const startTime = performance.now();
      provider.getFallbackComposition("landing");
      provider.getFallbackSectionContent("hero");
      const endTime = performance.now();

      // Assert - Should be very fast (less than 10ms)
      expect(endTime - startTime).toBeLessThan(10);
    });

    it("should not have memory leaks or side effects", () => {
      // Arrange
      const initialMemoryUsage = (performance as any).memory?.usedJSHeapSize;

      // Act - Generate multiple fallbacks
      for (let i = 0; i < 100; i++) {
        provider.getFallbackComposition("landing");
        provider.getFallbackSectionContent("hero");
      }

      // Assert - Memory usage should be stable (if available)
      if (initialMemoryUsage !== undefined) {
        const finalMemoryUsage = (performance as any).memory?.usedJSHeapSize;
        const memoryIncrease = finalMemoryUsage - initialMemoryUsage;

        // Allow some memory increase but not excessive
        expect(memoryIncrease).toBeLessThan(1024 * 1024); // Less than 1MB
      }
    });
  });

  describe("accessibility considerations", () => {
    it("should provide emergency content that is still usable", () => {
      // Act
      const heroFallback = provider.getFallbackSectionContent("hero");

      // Assert - Emergency content should still be informative
      expect(Utils.unwrapResult(heroFallback).content.headline).toBeTruthy();
      expect(Utils.unwrapResult(heroFallback).content.subheadline).toBeTruthy();
      expect(Utils.unwrapResult(heroFallback).content.primaryCta).toBeTruthy();
    });

    it("should maintain content hierarchy in fallbacks", () => {
      // Act
      const compositionFallback = provider.getFallbackComposition("landing");

      // Assert - Should have proper section structure
      expect(
        Utils.unwrapResult(compositionFallback).sections.length,
      ).toBeGreaterThan(0);
      expect(
        Utils.unwrapResult(compositionFallback).sections[0].id,
      ).toBeDefined();
      expect(
        Utils.unwrapResult(compositionFallback).sections[0].component,
      ).toBeDefined();
    });
  });
});
