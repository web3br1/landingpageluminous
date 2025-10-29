// Unit Tests for Hero Composer - Semana 4 Implementation
// Tests hero content composition and A/B testing logic
// Target: 8+ test cases covering composer functionality

import { describe, it, expect, vi, beforeEach } from "vitest";
import { composeHeroContent } from "@/domains/marketing/composers/hero-composer";
import { getHeroContent } from "@/domains/marketing/content/hero-content";

// Mock dependencies
vi.mock("@/domains/marketing/content/hero-content", () => ({
  getHeroContent: vi.fn(),
}));

vi.mock("@/lib/flags", () => ({
  getExperimentVariant: vi.fn(),
}));

vi.mock("@/lib/analytics", () => ({
  trackExperimentView: vi.fn(),
}));

describe("Hero Composer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockHeroContent = {
    headline: "Sistema de Automação Empresarial",
    subheadline: "Aumente sua produtividade com nossa solução completa",
    primaryCta: "Começar teste grátis",
    secondaryCta: "Ver demonstração",
    badge: "Lançamento",
    metrics: [
      { value: "75%", label: "mais produtividade" },
      { value: "50%", label: "menos tempo" },
    ],
  };

  describe("basic composition", () => {
    it("should compose hero content from base content", () => {
      vi.mocked(getHeroContent).mockReturnValue(mockHeroContent);

      const result = composeHeroContent("landing");

      expect(result).toEqual(mockHeroContent);
      expect(getHeroContent).toHaveBeenCalledWith("landing");
    });

    it("should handle different page contexts", () => {
      vi.mocked(getHeroContent).mockReturnValue(mockHeroContent);

      composeHeroContent("pricing");
      expect(getHeroContent).toHaveBeenCalledWith("pricing");

      composeHeroContent("demo");
      expect(getHeroContent).toHaveBeenCalledWith("demo");
    });

    it("should return valid hero content structure", () => {
      vi.mocked(getHeroContent).mockReturnValue(mockHeroContent);

      const result = composeHeroContent("landing");

      expect(result).toHaveProperty("headline");
      expect(result).toHaveProperty("subheadline");
      expect(result).toHaveProperty("primaryCta");
      expect(typeof result.headline).toBe("string");
      expect(typeof result.subheadline).toBe("string");
    });
  });

  describe("A/B testing integration", () => {
    it("should apply experiment variants", () => {
      const variantContent = {
        ...mockHeroContent,
        headline: "Nova versão do headline",
        primaryCta: "CTA variante",
      };

      vi.mocked(getHeroContent).mockReturnValue(mockHeroContent);
      // Mock experiment variant
      const { getExperimentVariant } = await import("@/lib/flags");
      vi.mocked(getExperimentVariant).mockReturnValue(variantContent);

      const result = composeHeroContent("landing", {
        experimentId: "hero-test",
      });

      expect(result.headline).toBe("Nova versão do headline");
      expect(result.primaryCta).toBe("CTA variante");
    });

    it("should track experiment views", () => {
      vi.mocked(getHeroContent).mockReturnValue(mockHeroContent);

      const { trackExperimentView } = await import("@/lib/analytics");

      composeHeroContent("landing", {
        experimentId: "hero-test",
        variant: "A",
      });

      expect(trackExperimentView).toHaveBeenCalledWith(
        "hero-test",
        "A",
        "landing",
      );
    });

    it("should handle missing experiment data gracefully", () => {
      vi.mocked(getHeroContent).mockReturnValue(mockHeroContent);

      const result = composeHeroContent("landing");

      expect(result).toEqual(mockHeroContent);
    });
  });

  describe("content validation", () => {
    it("should validate required fields", () => {
      const invalidContent = {
        headline: "",
        subheadline: "Valid subheadline",
        primaryCta: "Valid CTA",
      };

      vi.mocked(getHeroContent).mockReturnValue(invalidContent as any);

      const result = composeHeroContent("landing");

      expect(result.headline).toBe(""); // Should allow empty but handle gracefully
    });

    it("should handle missing optional fields", () => {
      const minimalContent = {
        headline: "Valid headline",
        subheadline: "Valid subheadline",
        primaryCta: "Valid CTA",
      };

      vi.mocked(getHeroContent).mockReturnValue(minimalContent as any);

      const result = composeHeroContent("landing");

      expect(result.headline).toBe("Valid headline");
      expect(result.secondaryCta).toBeUndefined();
      expect(result.badge).toBeUndefined();
    });

    it("should sanitize content", () => {
      const unsafeContent = {
        ...mockHeroContent,
        headline: "<script>alert('xss')</script>Valid headline",
        subheadline: "Valid subheadline <img src=x onerror=alert('xss')>",
      };

      vi.mocked(getHeroContent).mockReturnValue(unsafeContent);

      const result = composeHeroContent("landing");

      expect(result.headline).not.toContain("<script>");
      expect(result.subheadline).not.toContain("onerror");
    });
  });

  describe("performance", () => {
    it("should compose content efficiently", () => {
      vi.mocked(getHeroContent).mockReturnValue(mockHeroContent);

      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        composeHeroContent("landing");
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / 100;

      expect(averageTime).toBeLessThan(1); // Should be very fast
    });

    it("should cache repeated calls", () => {
      vi.mocked(getHeroContent).mockReturnValue(mockHeroContent);

      composeHeroContent("landing");
      composeHeroContent("landing");

      expect(getHeroContent).toHaveBeenCalledTimes(1); // Should cache
    });
  });

  describe("error handling", () => {
    it("should handle content loading errors", () => {
      vi.mocked(getHeroContent).mockImplementation(() => {
        throw new Error("Content loading failed");
      });

      const result = composeHeroContent("landing");

      expect(result).toHaveProperty("headline");
      expect(result).toHaveProperty("subheadline");
      // Should return fallback content
    });

    it("should handle malformed content", () => {
      vi.mocked(getHeroContent).mockReturnValue(null as any);

      const result = composeHeroContent("landing");

      expect(result).toHaveProperty("headline");
      expect(typeof result.headline).toBe("string");
    });
  });

  describe("localization", () => {
    it("should support different locales", () => {
      const localizedContent = {
        ...mockHeroContent,
        headline: "Sistema de Automatización Empresarial", // Spanish
        subheadline: "Aumente su productividad con nuestra solución completa",
      };

      vi.mocked(getHeroContent).mockReturnValue(localizedContent);

      const result = composeHeroContent("landing", { locale: "es" });

      expect(result.headline).toContain("Automatización");
    });

    it("should fallback to default locale", () => {
      vi.mocked(getHeroContent).mockReturnValue(mockHeroContent);

      const result = composeHeroContent("landing", { locale: "unknown" });

      expect(result.headline).toBe("Sistema de Automação Empresarial");
    });
  });
});
