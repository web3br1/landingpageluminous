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
});
