/**
 * @fileoverview Integration tests for PageConfigurationProvider
 * Tests configuration retrieval, error handling, and data validation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { PageConfigurationProvider } from "../../lib/composition/services/page-configuration-provider";
import { PageType } from "../../lib/composition/ports";

describe("PageConfigurationProvider - Integration Tests", () => {
  let provider: PageConfigurationProvider;

  beforeEach(() => {
    provider = new PageConfigurationProvider();
  });

  // Debug test
  it("should instantiate correctly", () => {
    expect(provider).toBeDefined();
    expect(typeof provider.getPageConfig).toBe("function");
  });

  it("should return a Result object", () => {
    const result = provider.getPageConfig("landing");
    expect(result).toBeDefined();
    expect(result).toHaveProperty("success");
    // Debug logging removed for cleaner test output
  });

  describe("getPageConfig - Landing Page", () => {
    it("should return valid landing page configuration", () => {
      const result = provider.getPageConfig("landing");

      expect(result.success).toBe(true);
      expect(result.value).toBeDefined();

      const config = result.value!;
      expect(config.sections).toHaveLength(9); // hero, benefits, features, pricing, social-proof, demo, faq, final-cta, footer
      expect(config.metadata.title).toBe(
        "DataFlow - Automação Empresarial com IA",
      );
      expect(config.metadata.description).toContain("IA inteligente");
      expect(config.analytics.pageType).toBe("landing");
      expect(config.analytics.conversionGoals).toEqual([
        "cta_click",
        "signup_start",
        "demo_request",
      ]);
    });

    it("should return correct section structure for landing page", () => {
      const result = provider.getPageConfig("landing");

      expect(result.success).toBe(true);
      const config = result.value!;

      // Check specific sections
      const heroSection = config.sections.find((s) => s.id === "hero");
      expect(heroSection).toBeDefined();
      expect(heroSection?.component).toBe("Hero");
      expect(heroSection?.order).toBe(1);

      const pricingSection = config.sections.find((s) => s.id === "pricing");
      expect(pricingSection).toBeDefined();
      expect(pricingSection?.component).toBe("Pricing");
      expect(pricingSection?.order).toBe(4);

      const footerSection = config.sections.find((s) => s.id === "footer");
      expect(footerSection).toBeDefined();
      expect(footerSection?.component).toBe("Footer");
      expect(footerSection?.order).toBe(9);
    });
  });

  describe("getPageConfig - Features Page", () => {
    it("should return valid features page configuration", () => {
      const result = provider.getPageConfig("features");

      expect(result.success).toBe(true);
      expect(result.value).toBeDefined();

      const config = result.value!;
      expect(config.sections).toHaveLength(4); // hero, features, demo, final-cta
      expect(config.metadata.title).toBe("Funcionalidades - Luminaris");
      expect(config.analytics.pageType).toBe("features");
      expect(config.analytics.conversionGoals).toEqual([
        "demo_request",
        "pricing_view",
      ]);
    });

    it("should have correct section ordering for features page", () => {
      const result = provider.getPageConfig("features");
      const config = result.value!;

      const sections = config.sections;
      expect(sections[0].id).toBe("hero");
      expect(sections[0].order).toBe(1);

      expect(sections[1].id).toBe("features");
      expect(sections[1].order).toBe(2);

      expect(sections[2].id).toBe("demo");
      expect(sections[2].order).toBe(3);

      expect(sections[3].id).toBe("final-cta");
      expect(sections[3].order).toBe(4);
    });
  });

  describe("getPageConfig - Pricing Page", () => {
    it("should return valid pricing page configuration", () => {
      const result = provider.getPageConfig("pricing");

      expect(result.success).toBe(true);
      const config = result.value!;

      expect(config.sections).toHaveLength(4);
      expect(config.metadata.title).toBe("Preços - Luminaris");
      expect(config.analytics.pageType).toBe("pricing");
      expect(config.analytics.conversionGoals).toEqual([
        "signup_start",
        "demo_request",
      ]);
    });
  });

  describe("getPageConfig - Demo Page", () => {
    it("should return valid demo page configuration", () => {
      const result = provider.getPageConfig("demo");

      expect(result.success).toBe(true);
      const config = result.value!;

      expect(config.sections).toHaveLength(4);
      expect(config.metadata.title).toBe("Demonstração - Luminaris");
      expect(config.analytics.pageType).toBe("demo");
      expect(config.analytics.conversionGoals).toEqual([
        "signup_start",
        "contact_form",
      ]);
    });
  });

  describe("getPageConfig - Signup Page", () => {
    it("should return valid signup page configuration", () => {
      const result = provider.getPageConfig("signup");

      expect(result.success).toBe(true);
      const config = result.value!;

      expect(config.sections).toHaveLength(2);
      expect(config.metadata.title).toBe("Cadastrar - Luminaris");
      expect(config.analytics.pageType).toBe("signup");
      expect(config.analytics.conversionGoals).toEqual(["signup_complete"]);
    });
  });

  describe("getPageConfig - Trial Page", () => {
    it("should return valid trial page configuration", () => {
      const result = provider.getPageConfig("trial");

      expect(result.success).toBe(true);
      const config = result.value!;

      expect(config.sections).toHaveLength(2);
      expect(config.metadata.title).toBe("Teste Grátis - Luminaris");
      expect(config.analytics.pageType).toBe("trial");
      expect(config.analytics.conversionGoals).toEqual(["trial_start"]);
    });
  });

  describe("getPageConfig - Checkout Page", () => {
    it("should return valid checkout page configuration", () => {
      const result = provider.getPageConfig("checkout");

      expect(result.success).toBe(true);
      const config = result.value!;

      expect(config.sections).toHaveLength(1);
      expect(config.metadata.title).toBe("Checkout - Finalizar Compra");
      expect(config.analytics.pageType).toBe("checkout");
      expect(config.analytics.conversionGoals).toEqual([
        "purchase_complete",
        "payment_success",
      ]);
    });
  });

  describe("getPageConfig - Admin Pages", () => {
    it("should return valid admin-experiments configuration", () => {
      const result = provider.getPageConfig("admin-experiments");

      expect(result.success).toBe(true);
      const config = result.value!;

      expect(config.sections).toHaveLength(2);
      expect(config.metadata.title).toBe("Experiments - Admin");
      expect(config.metadata.robots).toBe("noindex,nofollow");
      expect(config.analytics.conversionGoals).toEqual([]);
    });

    it("should include admin-specific content in hero sections", () => {
      const result = provider.getPageConfig("admin-experiments");
      const config = result.value!;
      const heroSection = config.sections.find((s) => s.id === "hero");

      expect(heroSection?.content).toEqual({
        title: "A/B Testing Dashboard",
        subtitle: "Monitor and manage experiments",
      });
    });

    it("should return valid admin-ml configuration", () => {
      const result = provider.getPageConfig("admin-ml");

      expect(result.success).toBe(true);
      const config = result.value!;

      expect(config.sections).toHaveLength(2);
      expect(config.metadata.title).toBe("ML Dashboard - Admin");
      expect(config.metadata.robots).toBe("noindex,nofollow");
    });

    it("should return valid admin-monitoring configuration", () => {
      const result = provider.getPageConfig("admin-monitoring");

      expect(result.success).toBe(true);
      const config = result.value!;

      expect(config.metadata.title).toBe("Monitoring - Admin");
      expect(config.analytics.pageType).toBe("admin-monitoring");
    });

    it("should return valid admin-performance configuration", () => {
      const result = provider.getPageConfig("admin-performance");

      expect(result.success).toBe(true);
      const config = result.value!;

      expect(config.metadata.title).toBe("Performance - Admin");
      expect(config.analytics.pageType).toBe("admin-performance");
    });

    it("should return valid admin-experiments-dashboard configuration", () => {
      const result = provider.getPageConfig("admin-experiments-dashboard");

      expect(result.success).toBe(true);
      const config = result.value!;

      expect(config.metadata.title).toBe("Experiments Dashboard - Admin");
      expect(config.analytics.pageType).toBe("admin-experiments-dashboard");
    });
  });

  describe("getPageConfig - Error Handling", () => {
    it("should return error for unknown page type", () => {
      const result = provider.getPageConfig("unknown-page" as PageType);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("Unknown page type");
      expect(result.error?.code).toBe("VALIDATION_ERROR");
    });

    it("should handle all defined page types", () => {
      const allPageTypes: PageType[] = [
        "landing",
        "features",
        "pricing",
        "demo",
        "signup",
        "trial",
        "checkout",
        "admin-experiments",
        "admin-experiments-dashboard",
        "admin-ml",
        "admin-monitoring",
        "admin-performance",
      ];

      allPageTypes.forEach((pageType) => {
        const result = provider.getPageConfig(pageType);
        expect(result.success).toBe(true);
        expect(result.value?.analytics.pageType).toBe(pageType);
      });
    });
  });

  describe("Configuration Consistency", () => {
    it("should have consistent section ordering across calls", () => {
      const firstCall = provider.getPageConfig("landing");
      const secondCall = provider.getPageConfig("landing");

      expect(firstCall.success).toBe(true);
      expect(secondCall.success).toBe(true);

      const firstConfig = firstCall.value!;
      const secondConfig = secondCall.value!;

      expect(firstConfig.sections).toEqual(secondConfig.sections);
      expect(firstConfig.metadata).toEqual(secondConfig.metadata);
      expect(firstConfig.analytics).toEqual(secondConfig.analytics);
    });

    it("should have valid section IDs", () => {
      const allConfigs = [
        "landing",
        "features",
        "pricing",
        "demo",
        "signup",
        "trial",
        "checkout",
        "admin-experiments",
        "admin-experiments-dashboard",
        "admin-ml",
        "admin-monitoring",
        "admin-performance",
      ] as PageType[];

      allConfigs.forEach((pageType) => {
        const result = provider.getPageConfig(pageType);
        const config = result.value!;

        config.sections.forEach((section) => {
          expect(section.id).toBeDefined();
          expect(typeof section.id).toBe("string");
          expect(section.component).toBeDefined();
          expect(typeof section.component).toBe("string");
          expect(section.order).toBeDefined();
          expect(typeof section.order).toBe("number");
          expect(section.order).toBeGreaterThan(0);
        });
      });
    });

    it("should have unique section orders within each page", () => {
      const allConfigs = [
        "landing",
        "features",
        "pricing",
        "demo",
        "signup",
        "trial",
        "checkout",
        "admin-experiments",
        "admin-experiments-dashboard",
        "admin-ml",
        "admin-monitoring",
        "admin-performance",
      ] as PageType[];

      allConfigs.forEach((pageType) => {
        const result = provider.getPageConfig(pageType);
        const config = result.value!;

        const orders = config.sections.map((s) => s.order);
        const uniqueOrders = [...new Set(orders)];
        expect(orders).toHaveLength(uniqueOrders.length);
      });
    });

    it("should have SEO-friendly metadata", () => {
      const allConfigs = [
        "landing",
        "features",
        "pricing",
        "demo",
        "signup",
        "trial",
        "checkout",
        "admin-experiments",
        "admin-experiments-dashboard",
        "admin-ml",
        "admin-monitoring",
        "admin-performance",
      ] as PageType[];

      allConfigs.forEach((pageType) => {
        const result = provider.getPageConfig(pageType);
        const config = result.value!;

        expect(config.metadata.title).toBeDefined();
        expect(config.metadata.title.length).toBeGreaterThan(0);
        expect(config.metadata.description).toBeDefined();
        expect(config.metadata.description.length).toBeGreaterThan(0);
        expect(config.metadata.keywords).toBeDefined();
        expect(Array.isArray(config.metadata.keywords)).toBe(true);
        expect(config.metadata.keywords.length).toBeGreaterThan(0);
      });
    });

    it("should have admin pages marked as noindex", () => {
      const adminPages: PageType[] = [
        "admin-experiments",
        "admin-experiments-dashboard",
        "admin-ml",
        "admin-monitoring",
        "admin-performance",
      ];

      adminPages.forEach((pageType) => {
        const result = provider.getPageConfig(pageType);
        const config = result.value!;

        expect(config.metadata.robots).toBe("noindex,nofollow");
      });
    });
  });
});
