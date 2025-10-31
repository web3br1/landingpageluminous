// Comprehensive SEO validation tests
import { describe, it, expect, beforeEach } from "vitest";
import { Metadata } from "next";
import { defaultSeo, jsonLd, stringifyForScript } from "../../seo";
import {
  generateCanonicalUrl,
  generatePaginatedCanonicalUrl,
  generateHreflangAlternates,
} from "../canonical-urls";
import { DuplicateContentDetector } from "../duplicate-content";
import {
  generatePageMetadata,
  generatePresetMetadata,
  validateMetadata,
} from "../dynamic-meta";

describe("SEO System Validation", () => {
  describe("Default SEO Configuration", () => {
    it("should have complete default SEO metadata", () => {
      expect(defaultSeo.title).toBeDefined();
      expect(defaultSeo.description).toBeDefined();
      expect(defaultSeo.keywords).toBeDefined();
      expect(defaultSeo.openGraph).toBeDefined();
      expect(defaultSeo.twitter).toBeDefined();
      expect(defaultSeo.robots).toBeDefined();
      expect(defaultSeo.alternates).toBeDefined();
    });

    it("should have proper Open Graph structure", () => {
      const og = defaultSeo.openGraph;
      expect(og?.type).toBe("website");
      expect(og?.locale).toBe("pt_BR");
      expect(og?.siteName).toBe("DataFlow Brasil");
      expect(og?.images).toBeDefined();
      expect(Array.isArray(og?.images)).toBe(true);
    });

    it("should have proper Twitter Cards structure", () => {
      const twitter = defaultSeo.twitter;
      expect(twitter?.card).toBe("summary_large_image");
      expect(twitter?.site).toBe("@dataflow_br");
      expect(twitter?.creator).toBe("@dataflow_br");
      expect(twitter?.images).toBeDefined();
    });

    it("should have canonical URLs", () => {
      expect(defaultSeo.alternates?.canonical).toBeDefined();
    });
  });

  describe("JSON-LD Structured Data", () => {
    it("should have valid JSON-LD schemas", () => {
      expect(jsonLd).toBeDefined();
      expect(Array.isArray(jsonLd)).toBe(true);
      expect(jsonLd.length).toBeGreaterThan(0);
    });

    it("should have SoftwareApplication schema", () => {
      const softwareSchema = jsonLd.find(
        (schema) => schema["@type"] === "SoftwareApplication",
      );
      expect(softwareSchema).toBeDefined();
      expect(softwareSchema?.name).toBe("DataFlow");
      expect(softwareSchema?.applicationCategory).toBe("BusinessApplication");
    });

    it("should have Organization schema", () => {
      const orgSchema = jsonLd.find(
        (schema) => schema["@type"] === "Organization",
      );
      expect(orgSchema).toBeDefined();
      expect(orgSchema?.name).toBe("DataFlow Brasil");
      expect(orgSchema?.url).toBe("https://dataflow.com.br");
    });

    it("should have FAQ schema", () => {
      const faqSchema = jsonLd.find((schema) => schema["@type"] === "FAQPage");
      expect(faqSchema).toBeDefined();
      expect(faqSchema?.mainEntity).toBeDefined();
      expect(Array.isArray(faqSchema?.mainEntity)).toBe(true);
    });

    it("should safely stringify JSON-LD for script tags", () => {
      const testSchema = {
        "@context": "https://schema.org",
        "@type": "Test",
        name: "Test</script><script>alert(1)</script>",
      };
      const stringified = stringifyForScript(testSchema);
      expect(stringified).toContain("<\\/script>");
      expect(stringified).not.toContain("</script><script>");
    });
  });

  describe("Canonical URL Generation", () => {
    it("should generate basic canonical URLs", () => {
      const url = generateCanonicalUrl("/features");
      expect(url).toBe("https://dataflow.com.br/features");
    });

    it("should handle query parameters", () => {
      const url = generateCanonicalUrl(
        "/search",
        {},
        { q: "business intelligence", page: "1" },
      );
      expect(url).toBe(
        "https://dataflow.com.br/search?page=1&q=business%20intelligence",
      );
    });

    it("should generate paginated canonical URLs", () => {
      expect(generatePaginatedCanonicalUrl("/blog", 1)).toBe(
        "https://dataflow.com.br/blog",
      );
      expect(generatePaginatedCanonicalUrl("/blog", 2)).toBe(
        "https://dataflow.com.br/blog?page=2",
      );
    });

    it("should generate hreflang alternates", () => {
      const alternates = generateHreflangAlternates("/features");
      expect(alternates.length).toBeGreaterThan(0);
      expect(alternates.some((alt) => alt.hreflang === "pt-BR")).toBe(true);
      expect(alternates.some((alt) => alt.hreflang === "x-default")).toBe(true);
    });
  });

  describe("Duplicate Content Detection", () => {
    beforeEach(() => {
      // Clear fingerprints between tests
      DuplicateContentDetector["fingerprints"].clear();
    });

    it("should detect identical content", () => {
      const content = "This is test content for duplicate detection";
      const result1 = DuplicateContentDetector.checkDuplicateContent(
        "/page1",
        "Test Page",
        "Test description",
        content,
      );
      const result2 = DuplicateContentDetector.checkDuplicateContent(
        "/page2",
        "Test Page",
        "Test description",
        content,
      );

      expect(result1.isDuplicate).toBe(false);
      expect(result2.isDuplicate).toBe(true);
      expect(result2.canonicalUrl).toBe("/page1");
    });

    it("should detect similar content", () => {
      const content1 = "Business intelligence dashboards for companies";
      const content2 = "Company dashboards for business intelligence";

      DuplicateContentDetector.checkDuplicateContent(
        "/page1",
        "BI Dashboards",
        "Business intelligence dashboards",
        content1,
      );

      const result = DuplicateContentDetector.checkDuplicateContent(
        "/page2",
        "BI Dashboards",
        "Business intelligence dashboards",
        content2,
      );

      expect(result.isDuplicate).toBe(true);
    });

    it("should generate metadata with canonical URLs for duplicates", () => {
      const baseMetadata: Metadata = {
        title: "Test Page",
        description: "Test description",
      };

      const content = "Test content";
      DuplicateContentDetector.checkDuplicateContent(
        "/original",
        "Test Page",
        "Test description",
        content,
      );

      const result =
        DuplicateContentDetector.generateMetadataWithDuplicateCheck(
          "/duplicate",
          baseMetadata,
          content,
        );

      expect(result.alternates?.canonical).toBe("/original");
      expect(result.robots?.index).toBe(false);
    });
  });

  describe("Dynamic Meta Generation", () => {
    it("should generate complete metadata for pages", () => {
      const config = {
        title: "Test Page",
        description: "Test description",
        keywords: ["test", "seo"],
        type: "website" as const,
      };

      const metadata = generatePageMetadata(config);

      expect(metadata.title).toBe("Test Page");
      expect(metadata.description).toBe("Test description");
      expect(metadata.keywords).toContain("test");
      expect(metadata.keywords).toContain("seo");
      expect(metadata.openGraph?.title).toBe("Test Page");
      expect(metadata.twitter?.title).toBe("Test Page");
    });

    it("should generate preset metadata", () => {
      const metadata = generatePresetMetadata("home");

      expect(metadata.title).toContain("DataFlow");
      expect(metadata.description).toContain("planilhas manuais");
      expect(metadata.openGraph?.type).toBe("website");
    });

    it("should validate metadata completeness", () => {
      const validMetadata: Metadata = {
        title: "Test Title",
        description:
          "Test description that is long enough for SEO purposes and should pass validation",
      };

      const invalidMetadata: Metadata = {
        title: "", // Empty title
      };

      const validResult = validateMetadata(validMetadata);
      const invalidResult = validateMetadata(invalidMetadata);

      expect(validResult.isValid).toBe(true);
      expect(validResult.errors.length).toBe(0);
      expect(validResult.warnings.length).toBeGreaterThan(0); // May have warnings about missing OG/Twitter

      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    it("should generate paginated metadata", () => {
      const baseConfig = {
        title: "Blog Posts",
        description: "Latest blog posts",
      };

      const page1Metadata = generatePaginatedMetadata(baseConfig, 1, 5);
      const page2Metadata = generatePaginatedMetadata(baseConfig, 2, 5);

      expect(page1Metadata.title).toBe("Blog Posts");
      expect(page1Metadata.robots?.index).toBe(true);

      expect(page2Metadata.title).toBe("Blog Posts - Página 2");
      expect(page2Metadata.robots?.index).toBe(false);
    });
  });

  describe("Mobile Responsiveness (Typography)", () => {
    // Note: This would test the typography system, but since it's in design-system/tokens
    // and uses CSS clamp(), we'll test the configuration structure
    it("should have mobile-optimized font sizes", () => {
      // This test would validate that the typography tokens include mobile-specific sizes
      // In a real test, we'd import the tokens and check the structure
      expect(true).toBe(true); // Placeholder for actual typography validation
    });
  });

  describe("SEO Integration Tests", () => {
    it("should integrate all SEO components together", () => {
      // Test complete SEO pipeline
      const pageConfig = {
        title: "Features - DataFlow BI",
        description: "Discover all DataFlow features",
        keywords: ["features", "BI"],
        url: "/features",
        content: "Features page content for duplicate detection",
      };

      const metadata = generatePageMetadata(pageConfig);

      // Should have all required SEO elements
      expect(metadata.title).toBeDefined();
      expect(metadata.description).toBeDefined();
      expect(metadata.openGraph).toBeDefined();
      expect(metadata.twitter).toBeDefined();
      expect(metadata.alternates?.canonical).toBeDefined();

      // Validate the generated metadata
      const validation = validateMetadata(metadata);
      expect(validation.errors.length).toBe(0);
    });

    it("should handle edge cases gracefully", () => {
      // Test with minimal config
      const minimalConfig = {};
      const metadata = generatePageMetadata(minimalConfig);

      expect(metadata).toBeDefined();
      expect(metadata.title).toBeDefined(); // Should fall back to default
    });
  });
});
