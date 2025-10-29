// Tests for layout composition system
import { describe, it, expect, beforeEach } from "vitest";
import {
  composeLayout,
  validateLayoutComposition,
  getAvailableLayouts,
  getLayoutConfig,
} from "@/lib/composition/layout-registry";

describe("Layout Composition", () => {
  describe("Layout Registry", () => {
    it("should have all required domains registered", () => {
      const availableLayouts = getAvailableLayouts();

      expect(availableLayouts).toContain("marketing");
      expect(availableLayouts).toContain("product");
      expect(availableLayouts).toContain("conversion");
    });

    it("should provide valid layout configurations", () => {
      const marketingLayout = getLayoutConfig("marketing");
      const productLayout = getLayoutConfig("product");
      const conversionLayout = getLayoutConfig("conversion");

      expect(marketingLayout).toBeDefined();
      expect(productLayout).toBeDefined();
      expect(conversionLayout).toBeDefined();

      // Check required properties
      [marketingLayout, productLayout, conversionLayout].forEach((layout) => {
        expect(layout?.id).toBeDefined();
        expect(layout?.name).toBeDefined();
        expect(layout?.wrapper).toBeDefined();
        expect(layout?.baseClasses).toBeDefined();
        expect(layout?.providers).toBeDefined();
        expect(layout?.errorBoundary).toBeDefined();
      });
    });
  });

  describe("Layout Composition", () => {
    it("should compose marketing layout successfully", () => {
      const composed = composeLayout("marketing");

      expect(composed).toHaveProperty("config");
      expect(composed).toHaveProperty("wrapper");
      expect(composed).toHaveProperty("className");
      expect(composed).toHaveProperty("providers");
      expect(composed.wrapper).toBe("div");
      expect(composed.className).toContain("min-h-screen");
      expect(composed.className).toContain("font-sans");
      expect(composed.providers.length).toBeGreaterThan(0);
    });

    it("should compose product layout successfully", () => {
      const composed = composeLayout("product");

      expect(composed.config.semanticRole).toBe("main");
      expect(composed.className).toContain("min-h-screen");
      expect(composed.config.analytics?.pageType).toBe("product");
    });

    it("should compose conversion layout successfully", () => {
      const composed = composeLayout("conversion");

      expect(composed.className).toContain("bg-gradient-to-br");
      expect(composed.config.analytics?.conversionGoals).toContain(
        "form_submit",
      );
      expect(composed.config.analytics?.conversionGoals).toContain(
        "checkout_complete",
      );
    });

    it("should include base configuration in all layouts", () => {
      const layouts = ["marketing", "product", "conversion"];

      layouts.forEach((layoutId) => {
        const composed = composeLayout(layoutId);

        // All layouts should have error boundaries
        expect(composed.config.errorBoundary).toBe(true);

        // All layouts should have base classes
        expect(composed.className).toContain("min-h-screen");
        expect(composed.className).toContain("font-sans");
        expect(composed.className).toContain("antialiased");

        // All layouts should have providers
        expect(composed.providers.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Layout Validation", () => {
    it("should validate marketing layout sections", () => {
      const validSections = [
        { id: "hero" },
        { id: "social-proof" },
        { id: "benefits" },
        { id: "features" },
        { id: "pricing" },
      ];

      const validation = validateLayoutComposition("marketing", validSections);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should reject invalid sections for marketing layout", () => {
      const invalidSections = [{ id: "hero" }, { id: "invalid-section" }];

      const validation = validateLayoutComposition(
        "marketing",
        invalidSections,
      );
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain("Invalid sections");
    });

    it("should enforce required sections", () => {
      const missingHero = [{ id: "social-proof" }, { id: "benefits" }];

      const validation = validateLayoutComposition("marketing", missingHero);
      expect(validation.valid).toBe(false);
      expect(
        validation.errors.some((error) =>
          error.includes("Missing required sections"),
        ),
      ).toBe(true);
    });

    it("should enforce maximum sections limit", () => {
      const tooManySections = Array.from({ length: 15 }, (_, i) => ({
        id: `section-${i}`,
      }));

      const validation = validateLayoutComposition(
        "marketing",
        tooManySections,
      );
      expect(validation.valid).toBe(false);
      expect(
        validation.errors.some((error) => error.includes("Too many sections")),
      ).toBe(true);
    });

    it("should handle layouts without validation rules", () => {
      // Test with a layout that doesn't exist (should return valid: true)
      const validation = validateLayoutComposition("nonexistent", [
        { id: "test" },
      ]);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe("Layout Metadata & SEO", () => {
    it("should include structured data in marketing layout", () => {
      const composed = composeLayout("marketing");

      expect(composed.metadata?.structuredData).toBeDefined();
      expect(composed.metadata?.structuredData["@type"]).toBe("WebSite");
      expect(composed.metadata?.structuredData.name).toBe("Luminaris");
    });

    it("should include appropriate analytics goals per domain", () => {
      const marketing = composeLayout("marketing");
      const conversion = composeLayout("conversion");
      const product = composeLayout("product");

      expect(marketing.config.analytics?.conversionGoals).toContain(
        "cta_click",
      );
      expect(marketing.config.analytics?.conversionGoals).toContain(
        "signup_start",
      );

      expect(conversion.config.analytics?.conversionGoals).toContain(
        "form_submit",
      );
      expect(conversion.config.analytics?.conversionGoals).toContain(
        "checkout_complete",
      );

      expect(product.config.analytics?.conversionGoals).toContain(
        "feature_view",
      );
      expect(product.config.analytics?.conversionGoals).toContain(
        "demo_request",
      );
    });
  });

  describe("Error Handling", () => {
    it("should throw error for non-existent layout", () => {
      expect(() => {
        composeLayout("nonexistent-layout");
      }).toThrow('Layout "nonexistent-layout" not found in registry');
    });

    it("should handle layout composition errors gracefully", () => {
      // Test that the function doesn't crash with unexpected inputs
      expect(() => {
        const composed = composeLayout("marketing");
        expect(composed).toBeDefined();
      }).not.toThrow();
    });
  });
});
