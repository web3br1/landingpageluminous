import { describe, it, expect } from "vitest";
import {
  heroContentVariants,
  heroVariants,
  heroConfiguration,
  type HeroContentVariants,
  type HeroContentKey,
} from "@/domains/marketing/content/hero-content";

describe("Hero Content", () => {
  describe("heroContentVariants", () => {
    it("should have all required variants", () => {
      expect(heroContentVariants).toHaveProperty("default");
      expect(heroContentVariants).toHaveProperty("experiment_a");
      expect(heroContentVariants).toHaveProperty("experiment_b");
      expect(heroContentVariants).toHaveProperty("enterprise");
      expect(heroContentVariants).toHaveProperty("experiment_user");
    });

    it("should have proper structure for default variant", () => {
      const { default: defaultContent } = heroContentVariants;

      expect(defaultContent).toHaveProperty("headline");
      expect(defaultContent).toHaveProperty("subheadline");
      expect(defaultContent).toHaveProperty("primaryCta");
      expect(defaultContent).toHaveProperty("secondaryCta");
      expect(defaultContent).toHaveProperty("badge");
      expect(defaultContent).toHaveProperty("metrics");
      expect(defaultContent).toHaveProperty("tracking");

      expect(typeof defaultContent.headline).toBe("string");
      expect(typeof defaultContent.subheadline).toBe("string");
      expect(typeof defaultContent.primaryCta).toBe("string");
      expect(typeof defaultContent.secondaryCta).toBe("string");
      expect(typeof defaultContent.badge).toBe("string");
      expect(Array.isArray(defaultContent.metrics)).toBe(true);
      expect(defaultContent.tracking).toHaveProperty("section", "hero");
    });

    it("should have proper structure for experiment_a variant", () => {
      const experimentA = heroContentVariants.experiment_a;

      expect(experimentA.headline).toContain("IA");
      expect(experimentA.primaryCta).toBe("Experimentar agora");
      expect(experimentA.secondaryCta).toBe("Ver casos de sucesso");
      expect(experimentA.badge).toBe("Tecnologia Inovadora");
      expect(experimentA.metrics).toHaveLength(3);
      expect(experimentA.tracking.section).toBe("hero");
    });

    it("should have proper structure for experiment_b variant", () => {
      const experimentB = heroContentVariants.experiment_b;

      expect(experimentB.headline).toContain("Relatórios");
      expect(experimentB.primaryCta).toBe("Agendar demonstração");
      expect(experimentB.secondaryCta).toBe("Baixar brochure");
      expect(experimentB.badge).toBe("Business Intelligence");
      expect(experimentB.metrics).toHaveLength(3);
      expect(experimentB.tracking.section).toBe("hero");
    });

    it("should have proper structure for enterprise variant", () => {
      const enterprise = heroContentVariants.enterprise;

      expect(enterprise.headline).toContain("enterprise");
      expect(enterprise.primaryCta).toBe("Falar com especialista");
      expect(enterprise.secondaryCta).toBe("Agendar consultoria");
      expect(enterprise.badge).toBe("Enterprise Ready");
      expect(enterprise.metrics).toHaveLength(3);
      expect(enterprise.metrics[0].value).toBe("1000+");
      expect(enterprise.metrics[1].value).toBe("99.99%");
      expect(enterprise.metrics[2].value).toBe("ISO 27001");
    });

    it("should have valid metrics structure", () => {
      Object.values(heroContentVariants).forEach((content) => {
        content.metrics.forEach((metric) => {
          expect(metric).toHaveProperty("value");
          expect(metric).toHaveProperty("label");
          expect(typeof metric.value).toBe("string");
          expect(typeof metric.label).toBe("string");
        });
      });
    });
  });

  describe("heroVariants", () => {
    it("should have all required variants", () => {
      expect(heroVariants).toHaveLength(5);
      const ids = heroVariants.map((v) => v.id);
      expect(ids).toEqual([
        "default",
        "experiment_a",
        "experiment_b",
        "enterprise",
        "experiment_user",
      ]);
    });

    it("should have proper structure for each variant", () => {
      heroVariants.forEach((variant) => {
        expect(variant).toHaveProperty("id");
        expect(variant).toHaveProperty("name");
        expect(variant).toHaveProperty("description");
        expect(variant).toHaveProperty("content");
        expect(variant).toHaveProperty("weight");

        expect(typeof variant.id).toBe("string");
        expect(typeof variant.name).toBe("string");
        expect(typeof variant.description).toBe("string");
        expect(typeof variant.weight).toBe("number");
        expect(variant.weight).toBeGreaterThanOrEqual(0);
        expect(variant.weight).toBeLessThanOrEqual(100);
      });
    });

    it("should have valid content references", () => {
      heroVariants.forEach((variant) => {
        expect(heroContentVariants).toHaveProperty(variant.id);
        expect(variant.content).toBe(
          heroContentVariants[variant.id as HeroContentKey],
        );
      });
    });

    it("should have total weight equal to 100", () => {
      const totalWeight = heroVariants.reduce(
        (sum, variant) => sum + variant.weight,
        0,
      );
      expect(totalWeight).toBe(100);
    });

    it("should have enterprise variant with conditions", () => {
      const enterpriseVariant = heroVariants.find((v) => v.id === "enterprise");
      expect(enterpriseVariant).toHaveProperty("conditions");
      expect(enterpriseVariant?.conditions).toHaveProperty(
        "userType",
        "returning",
      );
    });
  });

  describe("heroConfiguration", () => {
    it("should have proper structure", () => {
      expect(heroConfiguration).toHaveProperty("variants");
      expect(heroConfiguration).toHaveProperty("defaultVariant");
      expect(heroConfiguration).toHaveProperty("experimentId");

      expect(heroConfiguration.variants).toBe(heroVariants);
      expect(heroConfiguration.defaultVariant).toBe("default");
      expect(heroConfiguration.experimentId).toBe("hero_headline");
    });

    it("should have defaultVariant that exists in variants", () => {
      const variantIds = heroConfiguration.variants.map((v) => v.id);
      expect(variantIds).toContain(heroConfiguration.defaultVariant);
    });
  });

  describe("Type exports", () => {
    it("should export proper types", () => {
      // Type checking - these should not throw
      const variants: HeroContentVariants = heroContentVariants;
      expect(variants).toBeDefined();

      const key: HeroContentKey = "default";
      expect(key).toBe("default");
    });
  });
});
