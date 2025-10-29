// Unit Tests for Hero Content - Semana 4 Implementation
// Tests hero content data structure and business logic
// Target: 6+ test cases covering content functionality

import { describe, it, expect, vi } from "vitest";
import { getHeroContent } from "@/domains/marketing/content/hero-content";

describe("Hero Content", () => {
  describe("content retrieval", () => {
    it("should return hero content for landing page", () => {
      const content = getHeroContent("landing");

      expect(content).toHaveProperty("headline");
      expect(content).toHaveProperty("subheadline");
      expect(content).toHaveProperty("primaryCta");
      expect(typeof content.headline).toBe("string");
      expect(typeof content.subheadline).toBe("string");
      expect(typeof content.primaryCta).toBe("string");
    });

    it("should return hero content for pricing page", () => {
      const content = getHeroContent("pricing");

      expect(content).toHaveProperty("headline");
      expect(content).toHaveProperty("subheadline");
      expect(typeof content.headline).toBe("string");
    });

    it("should return hero content for demo page", () => {
      const content = getHeroContent("demo");

      expect(content).toHaveProperty("headline");
      expect(typeof content.headline).toBe("string");
    });
  });

  describe("content structure", () => {
    it("should have valid headline format", () => {
      const content = getHeroContent("landing");

      expect(content.headline.length).toBeGreaterThan(10);
      expect(content.headline.length).toBeLessThan(200);
    });

    it("should have compelling subheadline", () => {
      const content = getHeroContent("landing");

      expect(content.subheadline.length).toBeGreaterThan(20);
      expect(content.subheadline.length).toBeLessThan(300);
    });

    it("should have action-oriented CTAs", () => {
      const content = getHeroContent("landing");

      expect(content.primaryCta).toMatch(
        /(começar|ver|agendar|saber|conhecer)/i,
      );
      expect(content.primaryCta.length).toBeGreaterThan(5);
      expect(content.primaryCta.length).toBeLessThan(50);
    });

    it("should include metrics when relevant", () => {
      const content = getHeroContent("landing");

      if (content.metrics) {
        expect(Array.isArray(content.metrics)).toBe(true);
        content.metrics.forEach((metric) => {
          expect(metric).toHaveProperty("value");
          expect(metric).toHaveProperty("label");
          expect(typeof metric.value).toBe("string");
          expect(typeof metric.label).toBe("string");
        });
      }
    });
  });

  describe("business logic", () => {
    it("should provide different content for different pages", () => {
      const landingContent = getHeroContent("landing");
      const pricingContent = getHeroContent("pricing");

      // Content should be different for different pages
      expect(landingContent.headline).not.toBe(pricingContent.headline);
    });

    it("should maintain consistent branding", () => {
      const content = getHeroContent("landing");

      // Check for consistent brand voice
      expect(content.subheadline).toMatch(/(nossa|sua|seu|nosso)/i);
    });

    it("should include social proof elements", () => {
      const content = getHeroContent("landing");

      // Should have some form of credibility indicators
      const hasMetrics = content.metrics && content.metrics.length > 0;
      const hasBadge = content.badge;

      expect(hasMetrics || hasBadge).toBeTruthy();
    });
  });

  describe("performance", () => {
    it("should return content synchronously", () => {
      const startTime = performance.now();

      getHeroContent("landing");

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10); // Should be instant
    });

    it("should handle multiple calls efficiently", () => {
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        getHeroContent("landing");
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / 100;

      expect(averageTime).toBeLessThan(1); // Should be very fast
    });
  });

  describe("error handling", () => {
    it("should handle unknown page types", () => {
      const content = getHeroContent("unknown" as any);

      expect(content).toHaveProperty("headline");
      expect(typeof content.headline).toBe("string");
    });

    it("should always return valid content structure", () => {
      const content = getHeroContent("landing");

      // Ensure all required properties exist
      expect(content).toHaveProperty("headline");
      expect(content).toHaveProperty("subheadline");
      expect(content).toHaveProperty("primaryCta");

      // Ensure they are strings
      expect(typeof content.headline).toBe("string");
      expect(typeof content.subheadline).toBe("string");
      expect(typeof content.primaryCta).toBe("string");
    });
  });
});
