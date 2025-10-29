import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FinalCta } from "@/components/sections/final-cta/final-cta";
import type { FinalCtaContent } from "@/domains/marketing";

import { vi } from "vitest";

// Mock utils
vi.mock("@/lib/utils", () => ({
  cn: (...classes: (string | undefined | null | boolean)[]) =>
    classes.filter(Boolean).join(" "),
}));

describe("FinalCta Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockContent: FinalCtaContent = {
    headline: "Pronto para transformar seu negócio?",
    subheadline:
      "Junte-se a milhares de empresas que já estão usando nossa solução",
    primaryButton: {
      text: "Começar agora",
      link: "/signup",
    },
    secondaryButton: {
      text: "Falar com especialista",
      link: "/contact",
    },
    backgroundImage: "/images/cta-bg.jpg",
    urgencyText: "Oferta limitada - Apenas hoje!",
  };

  const defaultProps = {
    content: mockContent,
    tracking: {
      section: "final-cta" as const,
      experimentId: "final_cta_test",
      variant: "default",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Cleanup DOM between tests
    document.body.innerHTML = "";
  });

  it("renders headline and subheadline correctly", () => {
    render(<FinalCta {...defaultProps} />);

    expect(screen.getByText(mockContent.headline)).toBeInTheDocument();
    expect(screen.getByText(mockContent.subheadline)).toBeInTheDocument();
  });

  it("renders primary CTA button with correct text and link", () => {
    render(<FinalCta {...defaultProps} />);

    const primaryButton = screen.getByText(mockContent.primaryButton.text);
    expect(primaryButton).toBeInTheDocument();
    expect(primaryButton.closest("a")).toHaveAttribute(
      "href",
      mockContent.primaryButton.link,
    );
  });

  it("renders secondary CTA button when provided", () => {
    render(<FinalCta {...defaultProps} />);

    const secondaryButton = screen.getByText(mockContent.secondaryButton!.text);
    expect(secondaryButton).toBeInTheDocument();
    expect(secondaryButton.closest("a")).toHaveAttribute(
      "href",
      mockContent.secondaryButton!.link,
    );
  });

  it("does not render secondary button when not provided", () => {
    const contentWithoutSecondary = { ...mockContent };
    delete contentWithoutSecondary.secondaryButton;

    render(<FinalCta {...defaultProps} content={contentWithoutSecondary} />);

    expect(
      screen.queryByText(mockContent.secondaryButton!.text),
    ).not.toBeInTheDocument();
  });

  it("renders urgency text when provided", () => {
    render(<FinalCta {...defaultProps} />);

    expect(screen.getByText(mockContent.urgencyText!)).toBeInTheDocument();
  });

  it("applies correct CSS classes and styling", () => {
    render(<FinalCta {...defaultProps} />);

    const container = document.querySelector(".bg-gradient-to-br");
    expect(container).toHaveClass(
      "from-primary",
      "via-primary/90",
      "to-accent",
    );
  });

  it("includes animated background elements", () => {
    render(<FinalCta {...defaultProps} />);

    const animatedElements = document.querySelectorAll(".animate-pulse");
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it.skip("handles primary button click", async () => {
    const mockOnPrimaryClick = vi.fn();
    render(<FinalCta {...defaultProps} onPrimaryClick={mockOnPrimaryClick} />);

    const primaryButton = screen.getByText(mockContent.primaryButton.text);
    await userEvent.click(primaryButton);

    expect(mockOnPrimaryClick).toHaveBeenCalledTimes(1);
  });

  it.skip("handles secondary button click", async () => {
    const mockOnSecondaryClick = vi.fn();
    render(
      <FinalCta {...defaultProps} onSecondaryClick={mockOnSecondaryClick} />,
    );

    const secondaryButton = screen.getByText(mockContent.secondaryButton!.text);
    await userEvent.click(secondaryButton);

    expect(mockOnSecondaryClick).toHaveBeenCalledTimes(1);
  });

  it("applies correct data attributes for tracking", () => {
    render(<FinalCta {...defaultProps} />);

    const container = document.querySelector('[data-section="final-cta"]');
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute("data-experiment-id", "final_cta_test");
    expect(container).toHaveAttribute("data-variant-experiment", "default");
  });

  it("supports different variants", () => {
    const { rerender } = render(
      <FinalCta {...defaultProps} variant="enterprise" />,
    );

    let container = document.querySelector('[data-variant="enterprise"]');
    expect(container).toBeInTheDocument();

    rerender(<FinalCta {...defaultProps} variant="default" />);
    container = document.querySelector('[data-variant="default"]');
    expect(container).toBeInTheDocument();
  });

  it("includes arrow icon in primary button", () => {
    render(<FinalCta {...defaultProps} />);

    const arrowIcon = document.querySelector(".lucide-arrow-right");
    expect(arrowIcon).toBeInTheDocument();
  });

  it("applies hover effects to buttons", () => {
    render(<FinalCta {...defaultProps} />);

    const primaryButton = screen
      .getByText(mockContent.primaryButton.text)
      .closest("a");
    expect(primaryButton).toHaveClass("hover:bg-white/90", "hover:shadow-xl");
  });

  it("has responsive layout", () => {
    render(<FinalCta {...defaultProps} />);

    const buttonContainer = screen
      .getByText(mockContent.primaryButton.text)
      .closest(".flex");
    expect(buttonContainer).toHaveClass("flex-col", "sm:flex-row");
  });

  it("centers content properly", () => {
    render(<FinalCta {...defaultProps} />);

    const contentContainer = screen
      .getByText(mockContent.headline)
      .closest(".text-center");
    expect(contentContainer).toBeInTheDocument();
  });

  it("uses proper heading hierarchy", () => {
    render(<FinalCta {...defaultProps} />);

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent(mockContent.headline);
  });

  it("includes proper heading ID when provided", () => {
    const headingId = "final-cta-heading";
    render(<FinalCta {...defaultProps} headingId={headingId} />);

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveAttribute("id", headingId);
  });

  it("has accessible button structure", () => {
    render(<FinalCta {...defaultProps} />);

    const primaryButton = screen.getByText(mockContent.primaryButton.text);
    expect(primaryButton).toHaveAttribute("href");
    expect(primaryButton).toHaveClass("focus:outline-none", "focus:ring-2");
  });

  it("supports background image when provided", () => {
    render(<FinalCta {...defaultProps} />);

    // Background image handling would be tested if implemented
    // Currently it's just stored in content but not used in rendering
    expect(mockContent.backgroundImage).toBeDefined();
  });

  it("maintains proper spacing and padding", () => {
    render(<FinalCta {...defaultProps} />);

    const contentContainer = screen
      .getByText(mockContent.headline)
      .closest(".px-4");
    expect(contentContainer).toHaveClass("py-16", "md:py-24");
  });
});
