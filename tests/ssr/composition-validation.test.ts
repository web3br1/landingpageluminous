import { describe, it, expect, beforeEach } from "vitest";
import { composePage } from "@/lib/composition/page-composer";
import { composeHeroContent } from "@/domains/marketing/composers/hero-composer";
import { composeBenefitsContent } from "@/domains/marketing/composers/benefits-composer";
import { composeFeaturesContent } from "@/domains/marketing/composers/features-composer";
import { composePricingContent } from "@/domains/marketing/composers/pricing-composer";

describe("Composition Validation SSR", () => {
  describe("Hero Composer", () => {
    it("should compose hero content with default variant", async () => {
      const result = await composeHeroContent();

      expect(result).toHaveProperty("content");
      expect(result).toHaveProperty("variant");
      // Note: variant.id will be whatever the flags return in test context
      expect(result.content).toHaveProperty("title");
      expect(result.content).toHaveProperty("subtitle");
    });

    it("should compose hero content with valid envelope structure", async () => {
      const result = await composeHeroContent();

      expect(result.content).toHaveProperty("envelope");
      expect(result.content.envelope).toHaveProperty("id");
      expect(result.content.envelope).toHaveProperty("type");
      expect(result.content.envelope).toHaveProperty("version");
      expect(result.content.envelope).toHaveProperty("timestamp");
      expect(result.content.envelope.type).toBe("hero");
      expect(typeof result.content.envelope.timestamp).toBe("number");
    });
  });

  describe("Page Composer", () => {
    it("should compose landing page successfully", async () => {
      const result = await composePage("landing");

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should include all required sections in landing page", async () => {
      const result = await composePage("landing");

      const sectionIds = result.map((section) => section.id);
      expect(sectionIds).toContain("hero");
      expect(sectionIds).toContain("benefits");
      expect(sectionIds).toContain("features");
      expect(sectionIds).toContain("pricing");
    });

    it("should handle unknown page types gracefully", async () => {
      const result = await composePage("unknown" as any);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("Benefits Composer", () => {
    it("should compose benefits content", async () => {
      const result = await composeBenefitsContent();

      expect(result).toHaveProperty("content");
      expect(result).toHaveProperty("variant");
      expect(Array.isArray(result.content.benefits)).toBe(true);
      expect(result.content.benefits.length).toBeGreaterThan(0);
    });

    it("should have valid benefits structure", async () => {
      const result = await composeBenefitsContent();

      const firstBenefit = result.content.benefits[0];
      expect(firstBenefit).toHaveProperty("title");
      expect(firstBenefit).toHaveProperty("description");
      expect(firstBenefit).toHaveProperty("icon");
    });
  });

  describe("Features Composer", () => {
    it("should compose features content", async () => {
      const result = await composeFeaturesContent();

      expect(result).toHaveProperty("content");
      expect(result).toHaveProperty("variant");
      expect(result.content).toHaveProperty("title");
      expect(result.content).toHaveProperty("features");
      expect(Array.isArray(result.content.features)).toBe(true);
    });

    it("should have valid features structure", async () => {
      const result = await composeFeaturesContent();

      const firstFeature = result.content.features[0];
      expect(firstFeature).toHaveProperty("title");
      expect(firstFeature).toHaveProperty("description");
      expect(firstFeature).toHaveProperty("icon");
    });
  });

  describe("Pricing Composer", () => {
    it("should compose pricing content", async () => {
      const result = await composePricingContent();

      expect(result).toHaveProperty("content");
      expect(result).toHaveProperty("variant");
      expect(result.content).toHaveProperty("title");
      expect(result.content).toHaveProperty("plans");
      expect(Array.isArray(result.content.plans)).toBe(true);
    });

    it("should have valid pricing structure", async () => {
      const result = await composePricingContent();

      const firstPlan = result.content.plans[0];
      expect(firstPlan).toHaveProperty("name");
      expect(firstPlan).toHaveProperty("price");
      expect(firstPlan).toHaveProperty("features");
    });
  });

  describe("Page Composition Integration", () => {
    it("should maintain composition order", async () => {
      const result = await composePage("landing");

      // Hero should be first
      expect(result[0].id).toBe("hero");

      // Check if sections are in logical order
      const sectionOrder = result.map((s) => s.id);
      const heroIndex = sectionOrder.indexOf("hero");
      const benefitsIndex = sectionOrder.indexOf("benefits");
      const featuresIndex = sectionOrder.indexOf("features");

      expect(heroIndex).toBeLessThan(benefitsIndex);
      expect(benefitsIndex).toBeLessThan(featuresIndex);
    });

    it("should have consistent envelope structure across sections", async () => {
      const result = await composePage("landing");

      result.forEach((section) => {
        // Envelope can be in multiple locations depending on composer structure
        const envelopeLocation =
          section.content?.content?.content?.envelope ||
          section.content?.content?.envelope ||
          section.content?.envelope;

        expect(envelopeLocation).toBeDefined();
        expect(envelopeLocation).toHaveProperty("id");
        expect(envelopeLocation).toHaveProperty("type");
        expect(envelopeLocation).toHaveProperty("version");
        expect(envelopeLocation).toHaveProperty("timestamp");
        expect(typeof envelopeLocation.timestamp).toBe("number");
      });
    });
  });

  describe("Error Recovery", () => {
    it("should handle composition errors gracefully", async () => {
      // Test error handling by using a page type that doesn't exist
      // This should trigger fallback behavior
      const result = await composePage("unknown-page" as any);

      // Should return empty array for unknown pages (fallback behavior)
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("Envelope Contract", () => {
    it("should maintain envelope contract consistency", async () => {
      const result = await composePage("landing");

      result.forEach((section) => {
        // Validate envelope exists and has required fields
        const envelopeLocation =
          section.content?.content?.content?.envelope ||
          section.content?.content?.envelope ||
          section.content?.envelope;

        expect(envelopeLocation).toBeDefined();
        expect(envelopeLocation).toHaveProperty("id");
        expect(envelopeLocation).toHaveProperty("type");
        expect(envelopeLocation).toHaveProperty("version");
        expect(envelopeLocation).toHaveProperty("timestamp");

        // Validate envelope structure
        expect(envelopeLocation.id).toMatch(/^[a-z-]+$/);
        expect(envelopeLocation.type).toBe(section.id);
        expect(typeof envelopeLocation.version).toBe("string");
        expect(typeof envelopeLocation.timestamp).toBe("number");
        expect(envelopeLocation.timestamp).toBeGreaterThan(0);
      });
    });

    it("should enforce envelope contract at build time", async () => {
      const { validateEnvelopeContract } = await import(
        "@/lib/composition/composer-validation"
      );

      // Valid envelope should pass (direct envelope object)
      const validEnvelope = {
        id: "test-section",
        type: "test-section",
        version: "1.0.0",
        timestamp: Date.now(),
      };

      expect(() =>
        validateEnvelopeContract(validEnvelope, "test-section"),
      ).not.toThrow();

      // Invalid envelope should throw (missing envelope in content)
      const invalidEnvelope = {
        content: { title: "Test" },
        variant: { id: "test", name: "Test", description: "Test", content: {} },
        // Missing envelope in content
      };

      expect(() =>
        validateEnvelopeContract(invalidEnvelope, "test-section"),
      ).toThrow();
    });
  });
});
