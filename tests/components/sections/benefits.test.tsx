import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Benefits } from "@/components/sections/benefits/benefits";
import type { BenefitsContent } from "@/domains/marketing";

// Mock Next.js Image component
vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: Record<string, unknown>) => (
    <img src={src as string} alt={alt as string} {...props} />
  ),
}));

// Mock utils
vi.mock("@/lib/utils", () => ({
  cn: (...classes: (string | undefined | null | boolean)[]) =>
    classes.filter(Boolean).join(" "),
}));

describe("Benefits Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  const mockContent: BenefitsContent = {
    title: "Por que escolher nossa solução?",
    subtitle: "Benefícios comprovados que transformam seu negócio",
    benefits: [
      {
        title: "Aumento de Produtividade",
        description:
          "Automatize processos manuais e foque no que realmente importa",
        icon: "Zap",
        metric: "300%",
      },
      {
        title: "Redução de Custos",
        description: "Otimize recursos e elimine desperdícios operacionais",
        icon: "TrendingUp",
        metric: "40%",
      },
      {
        title: "Análises Avançadas",
        description: "Insights profundos com inteligência artificial",
        icon: "BarChart3",
        metric: "5x",
      },
    ],
  };

  const defaultProps = {
    content: mockContent,
    id: "benefits",
    headingId: "benefits-headline",
    tracking: {
      section: "benefits" as const,
      experimentId: "benefits_test",
      variant: "default",
    },
  };

  it("renders benefits section with correct content", () => {
    render(<Benefits {...defaultProps} />);

    // Check title and subtitle
    expect(screen.getByText(mockContent.title)).toBeInTheDocument();
    expect(screen.getByText(mockContent.subtitle)).toBeInTheDocument();

    // Check all benefit titles and descriptions
    mockContent.benefits.forEach((benefit) => {
      expect(screen.getByText(benefit.title)).toBeInTheDocument();
      expect(screen.getByText(benefit.description)).toBeInTheDocument();
      if (benefit.metric) {
        expect(screen.getByText(benefit.metric)).toBeInTheDocument();
      }
    });
  });

  it("applies correct CSS classes and data attributes", () => {
    render(<Benefits {...defaultProps} />);

    const container = document.getElementById("benefits");
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute("data-variant", "default");
    expect(container).toHaveAttribute("data-experiment-id", "benefits_test");
  });

  it("renders with correct heading hierarchy", () => {
    render(<Benefits {...defaultProps} />);

    const headlines = screen.getAllByRole("heading", { level: 3 }); // h3 elements
    expect(headlines).toHaveLength(mockContent.benefits.length);
  });

  it.skip("handles benefit click interactions", async () => {
    const mockOnBenefitClick = vi.fn();
    render(<Benefits {...defaultProps} onBenefitClick={mockOnBenefitClick} />);

    // Find benefit cards by data-benefit-index attribute
    const benefitCards = document.querySelectorAll("[data-benefit-index]");
    expect(benefitCards).toHaveLength(mockContent.benefits.length);

    // Click on the first benefit card using userEvent
    await userEvent.click(benefitCards[0] as Element);

    // Verify the callback was called with the correct index
    expect(mockOnBenefitClick).toHaveBeenCalledWith(0);
  });

  it("renders benefit cards with correct data attributes", () => {
    render(<Benefits {...defaultProps} />);

    mockContent.benefits.forEach((benefit, index) => {
      const card = screen
        .getByText(benefit.title)
        .closest("[data-benefit-index]");
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute("data-benefit-index", index.toString());
      expect(card).toHaveAttribute("data-tracking", "benefit-card");
      expect(card).toHaveAttribute("data-experiment", "benefits_test");
    });
  });

  it("renders icons correctly", () => {
    render(<Benefits {...defaultProps} />);

    // Check if SVG icons are rendered
    const icons = document.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThan(0);
  });

  it("applies different variants correctly", () => {
    render(<Benefits {...defaultProps} variant="enterprise" />);

    const container = document.getElementById("benefits");
    expect(container).toHaveAttribute("data-variant", "enterprise");
  });

  it("handles missing metrics gracefully", () => {
    const contentWithoutMetrics = {
      ...mockContent,
      benefits: mockContent.benefits.map((benefit) => ({
        ...benefit,
        metric: undefined,
        metricLabel: undefined,
      })),
    };

    render(<Benefits {...defaultProps} content={contentWithoutMetrics} />);

    // Should still render benefit titles without errors
    mockContent.benefits.forEach((benefit) => {
      expect(screen.getByText(benefit.title)).toBeInTheDocument();
    });
  });

  describe("Icon Rendering", () => {
    it("renders correct icons for each benefit", () => {
      render(<Benefits {...defaultProps} />);

      // Check that icons are rendered
      const icons = document.querySelectorAll("svg");
      expect(icons.length).toBe(mockContent.benefits.length);

      // Verify icon accessibility
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute("class");
        // Icons should be present and styled
        expect(icon.className).toBeTruthy();
      });
    });

    it("handles invalid icon names gracefully", () => {
      const contentWithBadIcons = {
        ...mockContent,
        benefits: mockContent.benefits.map((benefit) => ({
          ...benefit,
          icon: "InvalidIconName",
        })),
      };

      render(<Benefits {...defaultProps} content={contentWithBadIcons} />);

      // Should still render icons (fallback to Zap)
      const icons = document.querySelectorAll("svg");
      expect(icons.length).toBe(mockContent.benefits.length);
    });

    it("maps icon names correctly to Lucide icons", () => {
      const expectedIcons = ["Zap", "TrendingUp", "BarChart3"];

      render(<Benefits {...defaultProps} />);

      // Verify we have the expected number of icons
      const icons = document.querySelectorAll("svg");
      expect(icons.length).toBe(expectedIcons.length);
    });
  });

  describe("Interactive Behavior", () => {
    it("handles benefit card clicks correctly", async () => {
      const mockOnBenefitClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Benefits {...defaultProps} onBenefitClick={mockOnBenefitClick} />,
      );

      // Click on first benefit card
      const firstBenefit = screen.getByText("Aumento de Produtividade");
      await user.click(firstBenefit.closest("[data-benefit-index]")!);

      expect(mockOnBenefitClick).toHaveBeenCalledWith(0);
      expect(mockOnBenefitClick).toHaveBeenCalledTimes(1);
    });

    it("handles clicks on different benefit cards", async () => {
      const mockOnBenefitClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Benefits {...defaultProps} onBenefitClick={mockOnBenefitClick} />,
      );

      // Click on second benefit card
      const secondBenefit = screen.getByText("Redução de Custos");
      await user.click(secondBenefit.closest("[data-benefit-index]")!);

      expect(mockOnBenefitClick).toHaveBeenCalledWith(1);
    });

    it("does not call onBenefitClick when callback is not provided", async () => {
      const user = userEvent.setup();

      render(<Benefits {...defaultProps} />);

      // Click should not cause errors
      const firstBenefit = screen.getByText("Aumento de Produtividade");
      await user.click(firstBenefit.closest("[data-benefit-index]")!);

      // No assertion needed - just verifying no errors
    });
  });

  describe("Variants and Theming", () => {
    it("renders with enterprise variant", () => {
      render(<Benefits {...defaultProps} variant="enterprise" />);

      const container = document.getElementById("benefits");
      expect(container).toHaveAttribute("data-variant", "enterprise");
    });

    it("renders with startup variant", () => {
      render(<Benefits {...defaultProps} variant="startup" />);

      const container = document.getElementById("benefits");
      expect(container).toHaveAttribute("data-variant", "startup");
    });

    it("defaults to 'default' variant when not specified", () => {
      render(<Benefits content={mockContent} />);

      const container = document.querySelector("[data-variant]");
      expect(container).toHaveAttribute("data-variant", "default");
    });
  });

  describe("Content Edge Cases", () => {
    it("renders with empty benefits array", () => {
      const emptyContent = {
        ...mockContent,
        benefits: [],
      };

      render(<Benefits {...defaultProps} content={emptyContent} />);

      // Should still render title and subtitle
      expect(screen.getByText(mockContent.title)).toBeInTheDocument();
      expect(screen.getByText(mockContent.subtitle)).toBeInTheDocument();

      // No benefit cards should be rendered
      const benefitCards = document.querySelectorAll("[data-benefit-index]");
      expect(benefitCards.length).toBe(0);
    });

    it("renders with single benefit", () => {
      const singleBenefitContent = {
        ...mockContent,
        benefits: [mockContent.benefits[0]],
      };

      render(<Benefits {...defaultProps} content={singleBenefitContent} />);

      const benefitCards = document.querySelectorAll("[data-benefit-index]");
      expect(benefitCards.length).toBe(1);
    });

    it("handles benefits with very long descriptions", () => {
      const longDescriptionContent = {
        ...mockContent,
        benefits: [
          {
            ...mockContent.benefits[0],
            description: "A".repeat(500), // Very long description
          },
        ],
      };

      render(<Benefits {...defaultProps} content={longDescriptionContent} />);

      // Should render without issues
      expect(screen.getByText("A".repeat(500))).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper heading hierarchy", () => {
      render(<Benefits {...defaultProps} />);

      const h2 = screen.getByRole("heading", { level: 2 });
      expect(h2).toHaveAttribute("id", "benefits-headline");

      const h3Elements = screen.getAllByRole("heading", { level: 3 });
      expect(h3Elements).toHaveLength(mockContent.benefits.length);
    });

    it("provides proper heading ID when specified", () => {
      render(
        <Benefits {...defaultProps} headingId="custom-benefits-heading" />,
      );

      const h2 = screen.getByRole("heading", { level: 2 });
      expect(h2).toHaveAttribute("id", "custom-benefits-heading");
    });

    it("has accessible benefit cards", () => {
      render(<Benefits {...defaultProps} />);

      // All benefit cards should be present with proper data attributes
      const benefitCards = document.querySelectorAll("[data-benefit-index]");
      expect(benefitCards.length).toBe(mockContent.benefits.length);

      benefitCards.forEach((card, index) => {
        expect(card).toHaveAttribute("data-benefit-index", index.toString());
        expect(card).toHaveAttribute("data-tracking", "benefit-card");
      });
    });

    it("supports data attributes for tracking", () => {
      render(<Benefits {...defaultProps} />);

      // Verify tracking attributes are applied
      const benefitCards = document.querySelectorAll("[data-benefit-index]");
      benefitCards.forEach((card) => {
        expect(card).toHaveAttribute("data-tracking", "benefit-card");
      });
    });
  });

  describe("Tracking Integration", () => {
    it("applies tracking attributes correctly", () => {
      render(<Benefits {...defaultProps} />);

      const container = document.getElementById("benefits");
      expect(container).toHaveAttribute("data-experiment-id", "benefits_test");
      expect(container).toHaveAttribute("data-variant-experiment", "default");
      expect(container).toHaveAttribute("data-section", "benefits");
    });

    it("handles missing tracking data gracefully", () => {
      render(<Benefits content={mockContent} />);

      const container = document.querySelector("[data-variant]");
      expect(container).toBeInTheDocument();
      // Should not have tracking attributes when not provided
      expect(container).not.toHaveAttribute("data-experiment-id");
    });

    it("applies experiment data to individual cards", () => {
      render(<Benefits {...defaultProps} />);

      const benefitCards = document.querySelectorAll("[data-benefit-index]");
      benefitCards.forEach((card) => {
        expect(card).toHaveAttribute("data-experiment", "benefits_test");
      });
    });
  });

  describe("Responsive Design", () => {
    it("uses responsive grid classes", () => {
      render(<Benefits {...defaultProps} />);

      const grid = document.querySelector(".grid");
      expect(grid).toHaveClass("grid-cols-1");
      expect(grid).toHaveClass("md:grid-cols-2");
      expect(grid).toHaveClass("lg:grid-cols-3");
    });

    it("has responsive spacing", () => {
      render(<Benefits {...defaultProps} />);

      const grid = document.querySelector(".grid");
      expect(grid).toHaveClass("gap-6");
      expect(grid).toHaveClass("md:gap-8");
    });
  });

  describe("Animation and Hover Effects", () => {
    it("applies hover animations to benefit cards", () => {
      render(<Benefits {...defaultProps} />);

      const benefitCards = document.querySelectorAll("[data-benefit-index]");
      benefitCards.forEach((card) => {
        expect(card).toHaveClass("group");
        expect(card).toHaveClass("hover:scale-105");
        expect(card).toHaveClass("hover:-translate-y-2");
        expect(card).toHaveClass("hover:shadow-lg");
      });
    });

    it("has hover animations on benefit cards", () => {
      render(<Benefits {...defaultProps} />);

      const benefitCards = document.querySelectorAll("[data-benefit-index]");
      benefitCards.forEach((card) => {
        expect(card).toHaveClass("group");
        expect(card).toHaveClass("hover:scale-105");
        expect(card).toHaveClass("hover:shadow-lg");
      });
    });
  });

  describe("Bottom CTA", () => {
    it("renders bottom CTA when provided", () => {
      const contentWithBottomCta = {
        ...mockContent,
        bottomCta: "Comece sua transformação hoje",
      };

      render(<Benefits {...defaultProps} content={contentWithBottomCta} />);

      expect(
        screen.getByText("Comece sua transformação hoje"),
      ).toBeInTheDocument();
    });

    it("does not render bottom CTA when not provided", () => {
      render(<Benefits {...defaultProps} />);

      // Should not have bottom CTA
      const bottomCtaElements = document.querySelectorAll(
        "[data-testid='bottom-cta']",
      );
      expect(bottomCtaElements.length).toBe(0);
    });
  });

  describe("Error Handling", () => {
    it("handles malformed benefit objects", () => {
      const malformedContent = {
        ...mockContent,
        benefits: [
          {
            title: "Test",
            description: "Test description",
            icon: "Zap",
            // Missing other required properties
          },
        ],
      };

      render(<Benefits {...defaultProps} content={malformedContent} />);

      // Should render the available content
      expect(screen.getByText("Test")).toBeInTheDocument();
      expect(screen.getByText("Test description")).toBeInTheDocument();
    });

    it("handles benefits with undefined icon", () => {
      const contentWithUndefinedIcon = {
        ...mockContent,
        benefits: [
          {
            ...mockContent.benefits[0],
            icon: undefined as any,
          },
        ],
      };

      render(<Benefits {...defaultProps} content={contentWithUndefinedIcon} />);

      // Should still render (fallback icon)
      const icons = document.querySelectorAll("svg");
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});
