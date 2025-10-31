// Runtime Safety Tests - Benefits Component
// Ensures benefits component handles edge cases gracefully

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Benefits } from "../../components/sections/benefits/benefits";
import type { BenefitsContent } from "../../domains/marketing/types/benefits.types";

describe("Benefits Runtime Safety", () => {
  const mockBenefits: BenefitsContent = {
    title: "Test Benefits",
    subtitle: "Test subtitle",
    benefits: [
      {
        icon: "Zap",
        title: "Test Benefit",
        description: "Test description",
        metric: "75%",
      },
    ],
  };

  it("should render with complete benefits data", () => {
    render(<Benefits content={mockBenefits} />);
    expect(screen.getByText("Test Benefits")).toBeInTheDocument();
    expect(screen.getByText("Test Benefit")).toBeInTheDocument();
  });

  it("should handle undefined benefits array gracefully", () => {
    const contentWithoutBenefits = {
      ...mockBenefits,
      benefits: undefined as any,
    };

    render(<Benefits content={contentWithoutBenefits} />);
    // Should not crash and should render title
    expect(screen.getByText("Test Benefits")).toBeInTheDocument();
    // Should not render any benefit cards
    expect(screen.queryByText("Test Benefit")).not.toBeInTheDocument();
  });

  it("should handle null benefits array gracefully", () => {
    const contentWithNullBenefits = {
      ...mockBenefits,
      benefits: null as any,
    };

    render(<Benefits content={contentWithNullBenefits} />);
    // Should not crash and should render title
    expect(screen.getByText("Test Benefits")).toBeInTheDocument();
    // Should not render any benefit cards
    expect(screen.queryByText("Test Benefit")).not.toBeInTheDocument();
  });

  it("should handle empty benefits array gracefully", () => {
    const contentWithEmptyBenefits = {
      ...mockBenefits,
      benefits: [],
    };

    render(<Benefits content={contentWithEmptyBenefits} />);
    // Should render title but no benefit cards
    expect(screen.getByText("Test Benefits")).toBeInTheDocument();
    expect(screen.queryByText("Test Benefit")).not.toBeInTheDocument();
  });

  it("should handle missing title gracefully", () => {
    const contentWithoutTitle = {
      ...mockBenefits,
      title: undefined as any,
    };

    render(<Benefits content={contentWithoutTitle} />);
    // Should not render title but should render subtitle
    expect(screen.queryByText("Test Benefits")).not.toBeInTheDocument();
    expect(screen.getByText("Test subtitle")).toBeInTheDocument();
  });

  it("should handle missing subtitle gracefully", () => {
    const contentWithoutSubtitle = {
      ...mockBenefits,
      subtitle: undefined as any,
    };

    render(<Benefits content={contentWithoutSubtitle} />);
    // Should render title but not subtitle
    expect(screen.getByText("Test Benefits")).toBeInTheDocument();
    expect(screen.queryByText("Test subtitle")).not.toBeInTheDocument();
  });

  it("should handle benefit with missing icon gracefully", () => {
    const contentWithBadIcon = {
      ...mockBenefits,
      benefits: [
        {
          icon: "NonExistentIcon",
          title: "Test Benefit",
          description: "Test description",
          metric: "75%",
        },
      ],
    };

    render(<Benefits content={contentWithBadIcon} />);
    // Should render the benefit (icon should fallback to Zap)
    expect(screen.getByText("Test Benefit")).toBeInTheDocument();
  });

  it("should handle benefit with missing metric gracefully", () => {
    const contentWithoutMetric = {
      ...mockBenefits,
      benefits: [
        {
          icon: "Zap",
          title: "Test Benefit",
          description: "Test description",
          metric: undefined as any,
        },
      ],
    };

    render(<Benefits content={contentWithoutMetric} />);
    // Should render the benefit without crashing
    expect(screen.getByText("Test Benefit")).toBeInTheDocument();
  });
});
