import { describe, it, expect } from "vitest";
import { defaultSeo } from "@/lib/seo";

describe("SEO Configuration SSR", () => {
  describe("defaultSeo structure", () => {
    it("should have all required SEO properties", () => {
      expect(defaultSeo).toHaveProperty("title");
      expect(defaultSeo).toHaveProperty("description");
      expect(defaultSeo).toHaveProperty("keywords");
      expect(defaultSeo).toHaveProperty("authors");
      expect(defaultSeo).toHaveProperty("metadataBase");
      expect(defaultSeo).toHaveProperty("openGraph");
      expect(defaultSeo).toHaveProperty("twitter");
      expect(defaultSeo).toHaveProperty("robots");
    });

    it("should have valid title configuration", () => {
      expect(defaultSeo.title).toBeDefined();
      if (
        defaultSeo.title &&
        typeof defaultSeo.title === "object" &&
        "default" in defaultSeo.title
      ) {
        expect(typeof defaultSeo.title.default).toBe("string");
        expect(typeof defaultSeo.title.template).toBe("string");
      } else {
        expect(typeof defaultSeo.title).toBe("string");
      }
    });

    it("should have valid description", () => {
      expect(defaultSeo.description).toBeDefined();
      if (defaultSeo.description) {
        expect(defaultSeo.description.length).toBeGreaterThan(50);
        expect(defaultSeo.description.length).toBeLessThanOrEqual(170);
      }
    });

    it("should have valid keywords array", () => {
      expect(Array.isArray(defaultSeo.keywords)).toBe(true);
      if (Array.isArray(defaultSeo.keywords)) {
        expect(defaultSeo.keywords.length).toBeGreaterThan(0);
        expect(defaultSeo.keywords).toContain("business intelligence");
        expect(defaultSeo.keywords).toContain("relatórios automáticos");
      }
    });

    it("should have valid OpenGraph configuration", () => {
      const og = defaultSeo.openGraph;
      expect(og).toBeDefined();
      expect(og?.title).toBeDefined();
      expect(og?.description).toBeDefined();
      expect(og?.type).toBe("website");

      const images = defaultSeo.openGraph?.images;
      if (images) {
        expect(Array.isArray(images)).toBe(true);
      }
    });

    it("should have valid Twitter configuration", () => {
      const twitter = defaultSeo.twitter;
      expect(twitter).toBeDefined();
      expect(twitter?.card).toBeDefined();
    });

    it("should have valid metadataBase URL", () => {
      expect(defaultSeo.metadataBase).toBeInstanceOf(URL);
      expect(defaultSeo.metadataBase?.toString()).toMatch(/^https:\/\//);
    });

    it("should have valid robots configuration", () => {
      const robots = defaultSeo.robots;
      expect(robots).toBeDefined();
      expect(robots?.index).toBeDefined();
      expect(robots?.follow).toBeDefined();
    });

    it("should have valid alternates configuration", () => {
      expect(defaultSeo.alternates).toHaveProperty(
        "canonical",
        "https://dataflow.com.br/",
      );
    });

    it("should have valid authors array", () => {
      expect(Array.isArray(defaultSeo.authors)).toBe(true);
      if (Array.isArray(defaultSeo.authors) && defaultSeo.authors.length > 0) {
        expect(defaultSeo.authors.length).toBeGreaterThan(0);
        expect(defaultSeo.authors[0]).toHaveProperty("name");
      }
    });
  });

  describe("SEO Content Quality", () => {
    it("should have appropriate title length", () => {
      const titleObj = defaultSeo.title;
      if (titleObj && typeof titleObj === "object" && "default" in titleObj) {
        expect(titleObj.default.length).toBeGreaterThan(10);
        expect(titleObj.default.length).toBeLessThanOrEqual(60);
        console.log(
          `SEO Title Length: ${titleObj.default.length} chars - "${titleObj.default}"`,
        );
      } else if (typeof titleObj === "string") {
        expect(titleObj.length).toBeGreaterThan(10);
        expect(titleObj.length).toBeLessThanOrEqual(60);
        console.log(
          `SEO Title Length: ${titleObj.length} chars - "${titleObj}"`,
        );
      }
    });

    it("should have compelling description", () => {
      const description = defaultSeo.description;
      expect(description).toMatch(/inteligência|automação|relatórios/i);
    });

    it("should have SEO-friendly OpenGraph title", () => {
      const ogTitle = defaultSeo.openGraph?.title;
      expect(ogTitle).toBeDefined();
      if (typeof ogTitle === "string") {
        expect(ogTitle.length).toBeGreaterThan(10);
        expect(ogTitle.length).toBeLessThanOrEqual(95);
      }
    });
  });

  describe("Technical SEO Compliance", () => {
    it("should have HTTPS metadataBase", () => {
      expect(defaultSeo.metadataBase?.toString()).toMatch(/^https:\/\/[^\/]+/);
    });

    it("should have proper canonical URL", () => {
      const canonical = defaultSeo.alternates?.canonical;
      expect(canonical).toMatch(/^https:\/\/[^\/]+/);
    });

    it("should have Brazilian Portuguese locale", () => {
      expect(defaultSeo.openGraph?.locale).toBe("pt_BR");
    });

    it("should have appropriate robots settings", () => {
      const robots = defaultSeo.robots;
      expect(robots?.index).toBe(true);
      expect(robots?.follow).toBe(true);
    });
  });
});
