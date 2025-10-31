/**
 * Hero Component Tests - Critical Section Coverage
 * Tests the main hero component for proper rendering, accessibility, and error handling
 * Target: 15+ test cases covering all component functionality
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Hero } from "@/components/sections/hero/hero";
import type { HeroContent } from "@/components/sections/hero/hero.types";

// Mock dependencies
vi.mock("@/lib/a11y/touch-target-optimization", () => ({
  AccessibleButton: ({
    children,
    onClick,
    "aria-label": ariaLabel,
    "data-tracking": dataTracking,
    ...props
  }: any) => (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      data-tracking={dataTracking}
      {...props}
    >
      {children}
    </button>
  ),
  AccessibleLink: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  SkipLink: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  useReducedMotion: () => false,
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock console methods to avoid noise in tests
const originalConsole = global.console;
beforeEach(() => {
  global.console = {
    ...originalConsole,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
});

afterEach(() => {
  global.console = originalConsole;
});

describe("Hero Component", () => {
  const mockValidContent: HeroContent = {
    headline: "Sistema de Automação Empresarial",
    subheadline: "Aumente sua produtividade com nossa solução completa",
    primaryCta: "Começar teste grátis",
    secondaryCta: "Ver demonstração",
    badge: "Lançamento",
    metrics: [
      { value: "75%", label: "mais produtividade" },
      { value: "50%", label: "menos tempo" },
    ],
    tracking: {
      section: "hero",
      sectionId: "hero",
    },
  };

  const mockCallbacks = {
    onPrimaryCta: vi.fn(),
    onSecondaryCta: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render hero section with valid content", () => {
      render(
        <Hero
          content={mockValidContent}
          onPrimaryCta={mockCallbacks.onPrimaryCta}
          onSecondaryCta={mockCallbacks.onSecondaryCta}
        />,
      );

      expect(
        screen.getByText("Sistema de Automação Empresarial"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Aumente sua produtividade com nossa solução completa",
        ),
      ).toBeInTheDocument();
      expect(screen.getByText("Lançamento")).toBeInTheDocument();
    });

    it("should render primary CTA button", () => {
      render(
        <Hero
          content={mockValidContent}
          onPrimaryCta={mockCallbacks.onPrimaryCta}
          onSecondaryCta={mockCallbacks.onSecondaryCta}
        />,
      );

      const primaryButton = screen.getByRole("button", {
        name: /começar teste grátis/i,
      });
      expect(primaryButton).toBeInTheDocument();
      expect(primaryButton).toHaveAttribute("data-tracking", "primary-cta");
    });

    it("should render secondary CTA button when provided", () => {
      render(
        <Hero
          content={mockValidContent}
          onPrimaryCta={mockCallbacks.onPrimaryCta}
          onSecondaryCta={mockCallbacks.onSecondaryCta}
        />,
      );

      const secondaryButton = screen.getByRole("button", {
        name: /ver demonstração/i,
      });
      expect(secondaryButton).toBeInTheDocument();
      expect(secondaryButton).toHaveAttribute("data-tracking", "secondary-cta");
    });

    it("should not render secondary CTA when not provided", () => {
      const contentWithoutSecondary = {
        ...mockValidContent,
        secondaryCta: undefined,
      };

      render(
        <Hero
          content={contentWithoutSecondary}
          onPrimaryCta={mockCallbacks.onPrimaryCta}
          onSecondaryCta={mockCallbacks.onSecondaryCta}
        />,
      );

      expect(
        screen.queryByRole("button", { name: /ver demonstração/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Metrics Rendering", () => {
    it("should render metrics when provided", () => {
      render(
        <Hero
          content={mockValidContent}
          onPrimaryCta={mockCallbacks.onPrimaryCta}
          onSecondaryCta={mockCallbacks.onSecondaryCta}
        />,
      );

      expect(screen.getByText("75%")).toBeInTheDocument();
      expect(screen.getByText("mais produtividade")).toBeInTheDocument();
      expect(screen.getByText("50%")).toBeInTheDocument();
      expect(screen.getByText("menos tempo")).toBeInTheDocument();
    });

    it("should not render metrics section when metrics are empty", () => {
      const contentWithoutMetrics = { ...mockValidContent, metrics: [] };

      render(
        <Hero
          content={contentWithoutMetrics}
          onPrimaryCta={mockCallbacks.onPrimaryCta}
          onSecondaryCta={mockCallbacks.onSecondaryCta}
        />,
      );

      expect(screen.queryByText("75%")).not.toBeInTheDocument();
    });

    it("should not render metrics section when metrics are undefined", () => {
      const contentWithoutMetrics = { ...mockValidContent, metrics: undefined };

      render(
        <Hero
          content={contentWithoutMetrics}
          onPrimaryCta={mockCallbacks.onPrimaryCta}
          onSecondaryCta={mockCallbacks.onSecondaryCta}
        />,
      );

      expect(screen.queryByText("75%")).not.toBeInTheDocument();
    });
  });

  describe("CTA Functionality", () => {
    it("should call onPrimaryCta when primary button is clicked", async () => {
      render(
        <Hero
          content={mockValidContent}
          onPrimaryCta={mockCallbacks.onPrimaryCta}
          onSecondaryCta={mockCallbacks.onSecondaryCta}
        />,
      );

      const primaryButton = screen.getByRole("button", {
        name: /começar teste grátis/i,
      });
      fireEvent.click(primaryButton);

      await waitFor(() => {
        expect(mockCallbacks.onPrimaryCta).toHaveBeenCalledTimes(1);
      });
    });

    it("should call onSecondaryCta when secondary button is clicked", async () => {
      render(
        <Hero
          content={mockValidContent}
          onPrimaryCta={mockCallbacks.onPrimaryCta}
          onSecondaryCta={mockCallbacks.onSecondaryCta}
        />,
      );

      const secondaryButton = screen.getByRole("button", {
        name: /ver demonstração/i,
      });
      fireEvent.click(secondaryButton);

      await waitFor(() => {
        expect(mockCallbacks.onSecondaryCta).toHaveBeenCalledTimes(1);
      });
    });

    it("should have proper aria-labels for accessibility", () => {
      render(
        <Hero
          content={mockValidContent}
          onPrimaryCta={mockCallbacks.onPrimaryCta}
          onSecondaryCta={mockCallbacks.onSecondaryCta}
        />,
      );

      const primaryButton = screen.getByRole("button", {
        name: /clique para começar teste grátis/i,
      });
      const secondaryButton = screen.getByRole("button", {
        name: /clique para ver demonstração/i,
      });

      expect(primaryButton).toHaveAttribute(
        "aria-label",
        "Clique para Começar teste grátis",
      );
      expect(secondaryButton).toHaveAttribute(
        "aria-label",
        "Clique para Ver demonstração",
      );
    });
  });

  describe("Error Handling", () => {
    it("should render fallback content when content is undefined", () => {
      render(
        <Hero
          content={undefined}
          onPrimaryCta={mockCallbacks.onPrimaryCta}
          onSecondaryCta={mockCallbacks.onSecondaryCta}
        />,
      );

      expect(
        screen.getByText("Sistema temporariamente indisponível"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Estamos trabalhando para melhorar sua experiência."),
      ).toBeInTheDocument();
    });

    it("should handle invalid headline types gracefully", () => {
      const invalidContent = {
        ...mockValidContent,
        headline: { invalid: "object" },
      };

      render(
        <Hero
          content={invalidContent}
          onPrimaryCta={mockCallbacks.onPrimaryCta}
          onSecondaryCta={mockCallbacks.onSecondaryCta}
        />,
      );

      expect(screen.getByText("Erro: Headline inválido")).toBeInTheDocument();
    });

    it("should handle invalid CTA types gracefully", () => {
      const invalidContent = {
        ...mockValidContent,
        primaryCta: 12345,
      };

      render(
        <Hero
          content={invalidContent}
          onPrimaryCta={mockCallbacks.onPrimaryCta}
          onSecondaryCta={mockCallbacks.onSecondaryCta}
        />,
      );

      const button = screen.getByRole("button", { name: /12345/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe("Accessibility & Reduced Motion", () => {
    it("should support reduced motion preferences", () => {
      // Note: useReducedMotion is mocked to return false by default in setup
      // This test verifies the component renders correctly with default motion settings
      render(
        <Hero
          content={mockValidContent}
          onPrimaryCta={mockCallbacks.onPrimaryCta}
          onSecondaryCta={mockCallbacks.onSecondaryCta}
        />,
      );

      // Component should render with motion classes (reduced motion = false)
      const primaryButton = screen.getByRole("button", {
        name: /começar teste grátis/i,
      });
      expect(primaryButton).toHaveClass("hover:shadow-lg");
      expect(primaryButton).toHaveClass("hover:-translate-y-0.5");
    });

    it("should support custom heading ID for skip links", () => {
      render(
        <Hero
          content={mockValidContent}
          headingId="custom-hero-heading"
          onPrimaryCta={mockCallbacks.onPrimaryCta}
          onSecondaryCta={mockCallbacks.onSecondaryCta}
        />,
      );

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveAttribute("id", "custom-hero-heading");
    });

    it("should have proper semantic structure", () => {
      render(
        <Hero
          content={mockValidContent}
          onPrimaryCta={mockCallbacks.onPrimaryCta}
          onSecondaryCta={mockCallbacks.onSecondaryCta}
        />,
      );

      // Should have proper heading hierarchy
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1).toBeInTheDocument();
      expect(h1).toHaveTextContent("Sistema de Automação Empresarial");

      // Should have accessible content structure
      expect(
        screen.getByText(
          "Aumente sua produtividade com nossa solução completa",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("Variants and Theming", () => {
    it("should support different variants", () => {
      render(
        <Hero
          content={mockValidContent}
          variant="experiment_a"
          onPrimaryCta={mockCallbacks.onPrimaryCta}
          onSecondaryCta={mockCallbacks.onSecondaryCta}
        />,
      );

      // Check that variant is applied via data attribute
      const heroSection = document.querySelector(
        '[data-variant="experiment_a"]',
      );
      expect(heroSection).toBeInTheDocument();
    });

    it("should default to 'default' variant when not specified", () => {
      render(
        <Hero
          content={mockValidContent}
          onPrimaryCta={mockCallbacks.onPrimaryCta}
          onSecondaryCta={mockCallbacks.onSecondaryCta}
        />,
      );

      // Check that default variant is applied
      const heroSection = document.querySelector('[data-variant="default"]');
      expect(heroSection).toBeInTheDocument();
    });
  });

  describe("Nested Content Handling", () => {
    it("should handle nested content structure from composition", () => {
      const nestedContent = {
        content: {
          content: mockValidContent,
        },
      };

      render(
        <Hero
          content={nestedContent}
          onPrimaryCta={mockCallbacks.onPrimaryCta}
          onSecondaryCta={mockCallbacks.onSecondaryCta}
        />,
      );

      expect(
        screen.getByText("Sistema de Automação Empresarial"),
      ).toBeInTheDocument();
    });

    it("should handle single-level nested content", () => {
      const singleNestedContent = {
        content: mockValidContent,
      };

      render(
        <Hero
          content={singleNestedContent}
          onPrimaryCta={mockCallbacks.onPrimaryCta}
          onSecondaryCta={mockCallbacks.onSecondaryCta}
        />,
      );

      expect(
        screen.getByText("Sistema de Automação Empresarial"),
      ).toBeInTheDocument();
    });
  });

  describe("Tracking Integration", () => {
    it("should support tracking configuration", () => {
      const trackingConfig = {
        section: "hero",
        experimentId: "hero_test_a",
        variant: "experiment_a",
      };

      render(
        <Hero
          content={mockValidContent}
          tracking={trackingConfig}
          onPrimaryCta={mockCallbacks.onPrimaryCta}
          onSecondaryCta={mockCallbacks.onSecondaryCta}
        />,
      );

      // Component should render without errors
      expect(
        screen.getByText("Sistema de Automação Empresarial"),
      ).toBeInTheDocument();
    });
  });
});
