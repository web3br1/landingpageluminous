// Unit Tests for Pricing Component - Semana 4 Implementation
// Tests pricing section with billing toggle and plan interactions
// Target: 12+ test cases covering pricing functionality

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pricing } from "@/components/sections/pricing/pricing";
import type { PricingContent } from "@/domains/marketing";

// Mock utils
vi.mock("@/lib/utils", () => ({
  cn: (...classes: (string | undefined | null | boolean)[]) =>
    classes.filter(Boolean).join(" "),
}));

describe("Pricing Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockContent: PricingContent = {
    title: "Planos para todos os tamanhos",
    subtitle: "Escolha o plano ideal para seu negócio",
    billingToggle: {
      enabled: true,
      defaultPeriod: "monthly",
    },
    highlightPopular: true,
    tracking: {
      section: "pricing",
      sectionId: "pricing",
    },
    plans: [
      {
        id: "starter",
        name: "Iniciante",
        description: "Ideal para microempresas começando",
        price: {
          monthly: 97,
          annual: 997,
          currency: "BRL",
        },
        features: [
          { name: "Até 3 usuários", included: true },
          { name: "Relatórios básicos", included: true },
          { name: "Suporte por email", included: false },
        ],
        popular: false,
        cta: "Começar teste grátis",
      },
      {
        id: "pro",
        name: "Profissional",
        description: "Para empresas em expansão",
        price: {
          monthly: 197,
          annual: 1997,
          currency: "BRL",
        },
        features: [
          { name: "Até 10 usuários", included: true },
          { name: "Relatórios avançados", included: true },
          { name: "Suporte prioritário", included: true },
        ],
        popular: true,
        cta: "Começar teste grátis",
      },
    ],
  };

  describe("basic rendering", () => {
    it("should render pricing section with title and subtitle", () => {
      render(<Pricing content={mockContent} />);

      expect(
        screen.getByText("Planos para todos os tamanhos"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Escolha o plano ideal para seu negócio"),
      ).toBeInTheDocument();
    });

    it("should render all pricing plans", () => {
      render(<Pricing content={mockContent} />);

      expect(screen.getByText("Iniciante")).toBeInTheDocument();
      expect(screen.getByText("Profissional")).toBeInTheDocument();
      expect(
        screen.getByText("Ideal para microempresas começando"),
      ).toBeInTheDocument();
      expect(screen.getByText("Para empresas em expansão")).toBeInTheDocument();
    });

    it("should display monthly prices by default", () => {
      render(<Pricing content={mockContent} />);

      expect(screen.getByText("R$ 97")).toBeInTheDocument();
      expect(screen.getByText("R$ 197")).toBeInTheDocument();
    });
  });

  describe("billing toggle", () => {
    it("should show billing toggle when enabled", () => {
      render(<Pricing content={mockContent} />);

      expect(screen.getByText("Mensal")).toBeInTheDocument();
      expect(screen.getByText("Anual")).toBeInTheDocument();
    });

    it("should hide billing toggle when disabled", () => {
      const contentWithoutToggle = {
        ...mockContent,
        billingToggle: { enabled: false },
      };
      render(<Pricing content={contentWithoutToggle} />);

      expect(screen.queryByText("Mensal")).not.toBeInTheDocument();
      expect(screen.queryByText("Anual")).not.toBeInTheDocument();
    });

    it("should switch to annual pricing when toggle is clicked", async () => {
      const user = userEvent.setup();
      render(<Pricing content={mockContent} />);

      const annualToggle = screen.getByText("Anual");
      await user.click(annualToggle);

      expect(screen.getByText("R$ 997")).toBeInTheDocument();
      expect(screen.getByText("R$ 1997")).toBeInTheDocument();
    });

    it("should show savings badge for annual pricing", async () => {
      const user = userEvent.setup();
      render(<Pricing content={mockContent} />);

      const annualToggle = screen.getByText("Anual");
      await user.click(annualToggle);

      expect(screen.getByText(/Economize/)).toBeInTheDocument();
    });
  });

  describe("plan features", () => {
    it("should render plan features with correct styling", () => {
      render(<Pricing content={mockContent} />);

      // Check for included features (green check icons)
      const checkIcons = document.querySelectorAll(
        'svg[data-testid="check-icon"], svg.lucide-check',
      );
      expect(checkIcons.length).toBeGreaterThan(0);

      // Check for excluded features (red x icons)
      const xIcons = document.querySelectorAll(
        'svg[data-testid="x-icon"], svg.lucide-x',
      );
      expect(xIcons.length).toBeGreaterThan(0);
    });

    it("should show feature names", () => {
      render(<Pricing content={mockContent} />);

      expect(screen.getByText("Até 3 usuários")).toBeInTheDocument();
      expect(screen.getByText("Relatórios básicos")).toBeInTheDocument();
      expect(screen.getByText("Até 10 usuários")).toBeInTheDocument();
      expect(screen.getByText("Relatórios avançados")).toBeInTheDocument();
    });
  });

  describe("popular plan", () => {
    it("should highlight popular plan", () => {
      render(<Pricing content={mockContent} />);

      const popularBadge = screen.getByText("Mais Popular");
      expect(popularBadge).toBeInTheDocument();
    });

    it("should apply special styling to popular plan", () => {
      render(<Pricing content={mockContent} />);

      // Popular plan should have the badge
      const popularBadge = screen.getByText("Mais Popular");
      expect(popularBadge).toBeInTheDocument();

      // Popular plan card should have special styling classes
      const popularPlanCard = popularBadge.closest(".pricing-card");
      expect(popularPlanCard).toHaveClass("scale-105", "border-primary");
    });
  });

  describe("plan interactions", () => {
    it("should handle plan selection", async () => {
      const onPlanSelect = vi.fn();
      const user = userEvent.setup();

      render(<Pricing content={mockContent} onPlanSelect={onPlanSelect} />);

      const ctaButton = screen.getAllByText("Começar teste grátis")[0];
      await user.click(ctaButton);

      expect(onPlanSelect).toHaveBeenCalledWith("starter", "monthly");
    });

    it("should handle popular plan selection", async () => {
      const onPlanSelect = vi.fn();
      const user = userEvent.setup();

      render(<Pricing content={mockContent} onPlanSelect={onPlanSelect} />);

      const popularCta = screen.getAllByText("Começar teste grátis")[1];
      await user.click(popularCta);

      expect(onPlanSelect).toHaveBeenCalledWith("pro", "monthly");
    });
  });

  describe("currency formatting", () => {
    it("should format prices correctly for BRL", () => {
      render(<Pricing content={mockContent} />);

      expect(screen.getByText("R$ 97")).toBeInTheDocument();
      expect(screen.getByText("R$ 197")).toBeInTheDocument();
    });

    it("should support different currencies", () => {
      const usdContent = {
        ...mockContent,
        plans: mockContent.plans.map((plan) => ({
          ...plan,
          price: { ...plan.price, currency: "USD" },
        })),
      };
      render(<Pricing content={usdContent} />);

      expect(screen.getByText("$ 97")).toBeInTheDocument();
      expect(screen.getByText("$ 197")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper heading hierarchy", () => {
      render(<Pricing content={mockContent} headingId="pricing-heading" />);

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveAttribute("id", "pricing-heading");
    });

    it("should be keyboard navigable", async () => {
      const user = userEvent.setup();
      render(<Pricing content={mockContent} />);

      const firstCta = screen.getAllByText("Começar teste grátis")[0];
      await user.tab();

      // First CTA should be focusable
      expect(firstCta).toHaveFocus();
    });

    it("should have descriptive button labels", () => {
      render(<Pricing content={mockContent} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });
  });

  describe("responsive design", () => {
    it("should adapt to mobile layout", () => {
      // Mock mobile viewport
      Object.defineProperty(window, "innerWidth", { value: 375 });

      render(<Pricing content={mockContent} />);

      const container = screen.getByRole("region");
      expect(container).toHaveClass("grid-cols-1"); // Mobile: single column
    });

    it("should adapt to desktop layout", () => {
      Object.defineProperty(window, "innerWidth", { value: 1024 });

      render(<Pricing content={mockContent} />);

      const container = screen.getByRole("region");
      expect(container).toHaveClass("lg:grid-cols-2"); // Desktop: two columns for 2 plans
    });
  });

  describe("empty states", () => {
    it("should handle empty plans array", () => {
      const emptyContent = { ...mockContent, plans: [] };
      render(<Pricing content={emptyContent} />);

      expect(
        screen.getByText("Planos para todos os tamanhos"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Iniciante")).not.toBeInTheDocument();
    });

    it("should handle plans without prices", () => {
      const contentWithoutPrices = {
        ...mockContent,
        plans: mockContent.plans.map((plan) => ({ ...plan, price: undefined })),
      };

      render(<Pricing content={contentWithoutPrices as any} />);

      // Should not crash
      expect(screen.getByRole("region")).toBeInTheDocument();
    });
  });
});
