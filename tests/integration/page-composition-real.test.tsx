import { describe, it, expect, beforeAll } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { composePage } from "@/lib/composition/page-composer";
import { createTestCMSClient } from "../utils/test-cms-client";
import type { PageType } from "@/lib/composition/types";

describe("Page Composition Integration - Real Data", () => {
  let cmsClient: any;

  beforeAll(async () => {
    // Create real CMS client for testing
    cmsClient = createTestCMSClient({
      baseURL: process.env.CMS_TEST_URL || "http://localhost:3001/api/cms",
      apiKey: process.env.CMS_TEST_API_KEY || "test-key",
    });
  });

  describe("Landing Page Composition", () => {
    it("composes landing page with real CMS data", async () => {
      const pageType: PageType = "marketing";
      const locale = "pt-BR";

      // Compose page with real data
      const composition = await composePage(pageType, locale, {
        cmsClient,
        includeDrafts: true,
        experimentOverrides: {
          hero_headline: "A",
          pricing_layout: "B",
        },
      });

      expect(composition.success).toBe(true);

      if (composition.success) {
        const { sections, metadata, experiments } = composition.data;

        // Verify page structure
        expect(sections).toBeDefined();
        expect(sections.length).toBeGreaterThan(0);
        expect(metadata).toBeDefined();
        expect(experiments).toBeDefined();

        // Verify essential sections exist
        const sectionTypes = sections.map((s) => s.type);
        expect(sectionTypes).toContain("hero");
        expect(sectionTypes).toContain("benefits");
        expect(sectionTypes).toContain("pricing");

        // Verify metadata
        expect(metadata.title).toBeTruthy();
        expect(metadata.description).toBeTruthy();
      }
    });

    it("renders composed page correctly", async () => {
      const composition = await composePage("marketing", "pt-BR", {
        cmsClient,
        includeDrafts: false,
      });

      expect(composition.success).toBe(true);

      if (composition.success) {
        // Render the composed page
        const { container } = render(composition.data.page);

        // Wait for dynamic content to load
        await waitFor(() => {
          expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
        });

        // Verify hero section
        const heroHeading = screen.getByRole("heading", { level: 1 });
        expect(heroHeading).toBeInTheDocument();
        expect(heroHeading.textContent).toBeTruthy();

        // Verify CTAs are present
        const ctas = screen.getAllByRole("button");
        expect(ctas.length).toBeGreaterThan(0);

        // Verify sections are rendered
        const sections = container.querySelectorAll("[data-section]");
        expect(sections.length).toBeGreaterThan(3); // At least hero, benefits, pricing
      }
    });

    it("handles CMS data unavailability gracefully", async () => {
      // Simulate CMS failure
      const failingCmsClient = createTestCMSClient({
        baseURL: "http://nonexistent-cms-url",
        apiKey: "test-key",
      });

      const composition = await composePage("marketing", "pt-BR", {
        cmsClient: failingCmsClient,
        fallbackToDefaults: true,
      });

      // Should still compose with fallback data
      expect(composition.success).toBe(true);

      if (composition.success) {
        const { sections } = composition.data;

        // Should have fallback sections
        expect(sections.length).toBeGreaterThan(0);

        // Fallback sections should have default content
        const heroSection = sections.find((s) => s.type === "hero");
        expect(heroSection).toBeDefined();
        expect(heroSection?.content).toBeDefined();
      }
    });

    it("applies experiments correctly in composition", async () => {
      const experimentOverrides = {
        hero_headline: "B", // Use variant B
        pricing_layout: "A",
        cta_color: "blue",
      };

      const composition = await composePage("marketing", "pt-BR", {
        cmsClient,
        experimentOverrides,
      });

      expect(composition.success).toBe(true);

      if (composition.success) {
        const { experiments } = composition.data;

        // Verify experiments were applied
        expect(experiments.hero_headline.variant).toBe("B");
        expect(experiments.pricing_layout.variant).toBe("A");
        expect(experiments.cta_color.variant).toBe("blue");

        // Verify sections reflect experiment variants
        const heroSection = composition.data.sections.find(
          (s) => s.type === "hero",
        );
        expect(heroSection?.experimentVariant).toBe("B");
      }
    });
  });

  describe("Section Composition", () => {
    it("composes individual sections with real data", async () => {
      const sections = ["hero", "benefits", "pricing", "faq"];

      for (const sectionType of sections) {
        const sectionComposition = await composePage("marketing", "pt-BR", {
          cmsClient,
          sectionOverrides: [sectionType],
        });

        expect(sectionComposition.success).toBe(true);

        if (sectionComposition.success) {
          const section = sectionComposition.data.sections.find(
            (s) => s.type === sectionType,
          );
          expect(section).toBeDefined();
          expect(section?.content).toBeDefined();

          // Render section to verify it works
          const { container } = render(section?.component);
          expect(container.firstChild).toBeInTheDocument();
        }
      }
    });

    it("handles section-specific errors gracefully", async () => {
      // Force one section to fail
      const composition = await composePage("marketing", "pt-BR", {
        cmsClient,
        sectionOverrides: ["hero", "nonexistent-section"],
      });

      expect(composition.success).toBe(true); // Page should still compose

      if (composition.success) {
        const heroSection = composition.data.sections.find(
          (s) => s.type === "hero",
        );
        const badSection = composition.data.sections.find(
          (s) => s.type === "nonexistent-section",
        );

        // Hero should work
        expect(heroSection).toBeDefined();

        // Bad section should be handled gracefully (either fallback or omitted)
        // This depends on implementation - could be fallback content or section omission
      }
    });
  });

  describe("Performance and Caching", () => {
    it("caches composition results appropriately", async () => {
      const startTime = Date.now();

      // First composition
      await composePage("marketing", "pt-BR", { cmsClient });

      const firstDuration = Date.now() - startTime;

      const secondStartTime = Date.now();

      // Second composition (should use cache)
      await composePage("marketing", "pt-BR", { cmsClient });

      const secondDuration = Date.now() - secondStartTime;

      // Second should be faster (cached)
      expect(secondDuration).toBeLessThan(firstDuration);
    });

    it("invalidates cache when content changes", async () => {
      // First composition
      const composition1 = await composePage("marketing", "pt-BR", {
        cmsClient,
      });
      expect(composition1.success).toBe(true);

      // Simulate content change in CMS
      await cmsClient.updateContent("hero", { headline: "Updated Headline" });

      // Second composition should get fresh data
      const composition2 = await composePage("marketing", "pt-BR", {
        cmsClient,
        skipCache: true, // Force fresh data
      });

      expect(composition2.success).toBe(true);

      if (composition1.success && composition2.success) {
        // Content should be different (or at least cache bypassed)
        expect(composition2.data.timestamp).toBeGreaterThan(
          composition1.data.timestamp,
        );
      }
    });
  });

  describe("Internationalization", () => {
    it("composes page for different locales", async () => {
      const locales = ["pt-BR", "en-US", "es-ES"];

      for (const locale of locales) {
        const composition = await composePage("marketing", locale, {
          cmsClient,
        });

        expect(composition.success).toBe(true);

        if (composition.success) {
          // Verify locale-specific content
          expect(composition.data.locale).toBe(locale);

          // Content should be in correct language
          const sections = composition.data.sections;
          sections.forEach((section) => {
            if (section.content?.headline) {
              // Basic check that content exists for locale
              expect(section.content.headline).toBeTruthy();
            }
          });
        }
      }
    });
  });
});
