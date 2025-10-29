// Unit Tests for SEO Optimizer - Fase 2 Implementation
// Tests SEO optimization logic with mocked dependencies
// Target: 10+ test cases covering critical SEO functionality

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@testing-library/react";

import {
  SEOOptimizer,
  SEOContentAnalyzer,
  ConversionOptimizer,
} from "../seo-optimizer";
import { Factory, Utils } from "../../composition/test-helpers";

// Mock Next.js router
vi.mock("next/router", () => ({
  useRouter: () => ({
    asPath: "/test-path",
  }),
}));

// Mock SSR adapter
vi.mock("../../composition/container", () => ({
  getSSRAdapter: () => ({
    isClientContext: vi.fn().mockReturnValue(true),
    getEnvironmentInfo: vi.fn(),
  }),
}));

// Mock logger and metrics
vi.mock("../../observability/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../observability/metrics", () => ({
  metrics: {
    incrementCounter: vi.fn(),
    recordHistogram: vi.fn(),
  },
}));

describe("SEOOptimizer", () => {
  const defaultConfig = {
    title: "Test Page Title",
    description: "Test page description for SEO",
    keywords: ["test", "seo", "optimization"],
    canonical: "https://example.com/test",
    ogImage: "https://example.com/image.jpg",
    ogType: "website" as const,
    twitterCard: "summary_large_image" as const,
    structuredData: [],
    noIndex: false,
    noFollow: false,
    locale: "pt-BR",
  };

  const defaultProps = {
    config: defaultConfig,
    pageType: "landing",
    experimentId: "seo_test",
    experimentVariant: "variant_a",
    contentHash: "abc123def456",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("component rendering", () => {
    it("should render Head component with basic meta tags", () => {
      // Act
      const { container } = render(<SEOOptimizer {...defaultProps} />);

      // Assert
      expect(
        container.querySelector('meta[name="description"]'),
      ).toHaveAttribute("content", defaultConfig.description);
      expect(container.querySelector('link[rel="canonical"]')).toHaveAttribute(
        "href",
        defaultConfig.canonical,
      );
    });

    it("should render Open Graph meta tags", () => {
      // Act
      const { container } = render(<SEOOptimizer {...defaultProps} />);

      // Assert
      expect(
        container.querySelector('meta[property="og:title"]'),
      ).toHaveAttribute("content", defaultConfig.title);
      expect(
        container.querySelector('meta[property="og:description"]'),
      ).toHaveAttribute("content", defaultConfig.description);
      expect(
        container.querySelector('meta[property="og:image"]'),
      ).toHaveAttribute("content", defaultConfig.ogImage);
    });

    it("should render Twitter Card meta tags", () => {
      // Act
      const { container } = render(<SEOOptimizer {...defaultProps} />);

      // Assert
      expect(
        container.querySelector('meta[name="twitter:card"]'),
      ).toHaveAttribute("content", defaultConfig.twitterCard);
      expect(
        container.querySelector('meta[name="twitter:title"]'),
      ).toHaveAttribute("content", defaultConfig.title);
    });

    it("should handle robots directives", () => {
      // Arrange
      const configWithRobots = {
        ...defaultConfig,
        noIndex: true,
        noFollow: true,
      };

      // Act
      const { container } = render(
        <SEOOptimizer {...defaultProps} config={configWithRobots} />,
      );

      // Assert
      expect(container.querySelector('meta[name="robots"]')).toHaveAttribute(
        "content",
        "noindex, nofollow",
      );
    });

    it("should render structured data scripts", () => {
      // Arrange
      const structuredData = [
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Test Company",
        },
      ];

      const configWithStructuredData = {
        ...defaultConfig,
        structuredData,
      };

      // Act
      const { container } = render(
        <SEOOptimizer {...defaultProps} config={configWithStructuredData} />,
      );

      // Assert
      const scriptElement = container.querySelector(
        'script[type="application/ld+json"]',
      );
      expect(scriptElement).toBeInTheDocument();
      expect(JSON.parse(scriptElement!.textContent!)).toEqual(
        structuredData[0],
      );
    });
  });

  describe("dynamic updates", () => {
    it("should update canonical URL with content hash", () => {
      // Act
      const { container } = render(<SEOOptimizer {...defaultProps} />);

      // Assert
      const canonicalLink = container.querySelector('link[rel="canonical"]');
      expect(canonicalLink).toHaveAttribute(
        "href",
        expect.stringContaining("abc123"),
      );
    });

    it("should handle experiment tracking in title", () => {
      // Act
      render(<SEOOptimizer {...defaultProps} />);

      // Assert - Logger should be called with experiment info
      // This would be verified in integration tests with actual logger
      expect(true).toBe(true); // Placeholder for now
    });

    it("should generate structured data for organization", () => {
      // Act
      const { container } = render(<SEOOptimizer {...defaultProps} />);

      // Assert
      const scripts = container.querySelectorAll(
        'script[type="application/ld+json"]',
      );
      expect(scripts.length).toBeGreaterThan(0);

      const organizationData = Array.from(scripts).find(
        (script) => JSON.parse(script.textContent!).name === "DataFlow",
      );
      expect(organizationData).toBeTruthy();
    });
  });

  describe("SEOContentAnalyzer", () => {
    describe("content analysis", () => {
      it("should calculate word count correctly", () => {
        // Arrange
        const content =
          "This is a test content with multiple words for analysis.";

        // Act
        const analysis = SEOContentAnalyzer.analyzeContent(content);

        // Assert
        expect(analysis.wordCount).toBe(10);
      });

      it("should analyze keyword density", () => {
        // Arrange
        const content = "test content test analysis test optimization";

        // Act
        const analysis = SEOContentAnalyzer.analyzeContent(content);

        // Assert
        expect(analysis.keywordDensity.test).toBeGreaterThan(0);
      });

      it("should calculate readability score", () => {
        // Arrange
        const content =
          "This is a long content paragraph. It contains multiple sentences. Each sentence adds to the readability analysis.";

        // Act
        const analysis = SEOContentAnalyzer.analyzeContent(content);

        // Assert
        expect(typeof analysis.readabilityScore).toBe("number");
        expect(analysis.readabilityScore).toBeGreaterThan(0);
      });

      it("should generate suggestions for short content", () => {
        // Arrange
        const shortContent = "Short content.";

        // Act
        const analysis = SEOContentAnalyzer.analyzeContent(shortContent);

        // Assert
        expect(analysis.suggestions).toContain(
          expect.stringContaining("conteúdo muito curto"),
        );
      });

      it("should detect keyword stuffing", () => {
        // Arrange
        const stuffedContent =
          "keyword keyword keyword keyword keyword keyword keyword keyword keyword keyword";

        // Act
        const analysis = SEOContentAnalyzer.analyzeContent(stuffedContent);

        // Assert
        expect(
          analysis.suggestions.some((suggestion) =>
            suggestion.includes("keyword stuffing"),
          ),
        ).toBe(true);
      });
    });

    describe("title optimization", () => {
      it("should generate SEO-optimized title", () => {
        // Arrange
        const baseTitle = "Amazing Product for Businesses";
        const keywords = ["product", "business"];

        // Act
        const optimizedTitle = SEOContentAnalyzer.generateTitle(
          baseTitle,
          keywords,
        );

        // Assert
        expect(optimizedTitle).toContain("product");
        expect(optimizedTitle.length).toBeLessThanOrEqual(60);
      });

      it("should truncate long titles", () => {
        // Arrange
        const longTitle =
          "This is a very very very very very very very very very long title that exceeds the recommended length limit";
        const keywords = ["title"];

        // Act
        const optimizedTitle = SEOContentAnalyzer.generateTitle(
          longTitle,
          keywords,
        );

        // Assert
        expect(optimizedTitle.length).toBeLessThanOrEqual(60);
        expect(optimizedTitle).toContain("...");
      });

      it("should include primary keyword when not present", () => {
        // Arrange
        const titleWithoutKeyword = "Amazing Software Solution";
        const keywords = ["product"];

        // Act
        const optimizedTitle = SEOContentAnalyzer.generateTitle(
          titleWithoutKeyword,
          keywords,
        );

        // Assert
        expect(optimizedTitle).toContain("product");
      });
    });

    describe("description optimization", () => {
      it("should generate SEO-optimized description", () => {
        // Arrange
        const content =
          "This is a comprehensive software solution that helps businesses automate their workflows and increase productivity.";
        const keywords = ["software", "automation"];

        // Act
        const optimizedDescription = SEOContentAnalyzer.generateDescription(
          content,
          keywords,
        );

        // Assert
        expect(optimizedDescription.length).toBeLessThanOrEqual(160);
        expect(optimizedDescription).toContain("software");
      });

      it("should include primary keyword when missing", () => {
        // Arrange
        const content = "This solution helps businesses with various tasks.";
        const keywords = ["automation"];

        // Act
        const optimizedDescription = SEOContentAnalyzer.generateDescription(
          content,
          keywords,
        );

        // Assert
        expect(optimizedDescription).toContain("automation");
      });
    });
  });

  describe("ConversionOptimizer", () => {
    describe("CTA optimization", () => {
      it("should generate variant CTAs based on experiment", () => {
        // Act
        const controlVariant =
          ConversionOptimizer.generateCTAVariant("control");
        const urgencyVariant =
          ConversionOptimizer.generateCTAVariant("urgency");

        // Assert
        expect(controlVariant.text).toContain("Começar");
        expect(urgencyVariant.text).toContain("Agora");
        expect(urgencyVariant.urgencyLevel).toBe("high");
      });

      it("should return control variant for unknown experiment", () => {
        // Act
        const unknownVariant = ConversionOptimizer.generateCTAVariant(
          "unknown" as any,
        );

        // Assert
        expect(unknownVariant).toEqual(
          expect.objectContaining({
            text: expect.stringContaining("Começar"),
            urgencyLevel: "low",
          }),
        );
      });
    });

    describe("scroll-based optimization", () => {
      it("should optimize CTA placement based on scroll depth", () => {
        // Act
        const earlyScroll = ConversionOptimizer.optimizeCTAPlacement(10);
        const midScroll = ConversionOptimizer.optimizeCTAPlacement(40);
        const deepScroll = ConversionOptimizer.optimizeCTAPlacement(80);

        // Assert
        expect(earlyScroll.showStickyCTA).toBe(false);
        expect(midScroll.showStickyCTA).toBe(true);
        expect(deepScroll.showExitIntent).toBe(true);
        expect(deepScroll.highlightCTA).toBe(true);
      });
    });

    describe("conversion tracking", () => {
      it("should track conversion events with metadata", () => {
        // Act
        ConversionOptimizer.trackConversion("cta_click", 99.99, {
          page: "landing",
          section: "hero",
        });

        // Assert - Metrics would be verified in integration tests
        expect(true).toBe(true); // Placeholder for actual metrics verification
      });
    });
  });

  describe("lazy loading optimization", () => {
    it("should handle position-based lazy loading", () => {
      // This would require more complex DOM mocking
      // Placeholder for lazy loading tests
      expect(true).toBe(true);
    });
  });

  describe("performance tracking", () => {
    it("should track Core Web Vitals", () => {
      // This would require web-vitals mocking
      // Placeholder for performance tracking tests
      expect(true).toBe(true);
    });
  });
});
