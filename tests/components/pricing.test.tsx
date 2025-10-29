import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pricing } from "@/components/sections/pricing/pricing";
import type { PricingContent } from "@/domains/marketing";

// Mocks
vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: Record<string, unknown>) => (
    <img src={src as string} alt={alt as string} {...props} />
  ),
}));

vi.mock("lucide-react", () => ({
  Check: () => <span data-testid="check-icon">✓</span>,
  X: () => <span data-testid="x-icon">✗</span>,
  Zap: () => <span data-testid="zap-icon">⚡</span>,
}));

vi.mock("@/lib/utils", () => ({
  cn: (...classes: (string | undefined | null | boolean)[]) =>
    classes.filter(Boolean).join(" "),
}));

describe("Pricing Component", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const content: PricingContent = {
    title: "Planos que crescem com seu negócio",
    subtitle: "Escolha o plano ideal",
    billingToggle: { enabled: true, defaultPeriod: "monthly" },
    highlightPopular: true,
    disclaimer: "Preços sujeitos a impostos",
    plans: [
      {
        id: "starter",
        name: "Starter",
        description: "Para começar",
        price: { monthly: 99, annual: 999, currency: "BRL" },
        features: [
          { name: "1 usuário", included: true },
          { name: "Relatórios básicos", included: true },
          { name: "Suporte prioritário", included: false },
        ],
        cta: "Assinar Starter",
        popular: false,
      },
      {
        id: "pro",
        name: "Pro",
        description: "Para equipes",
        price: { monthly: 199, annual: 1999, currency: "BRL" },
        features: [
          { name: "5 usuários", included: true },
          { name: "Dashboards avançados", included: true },
          { name: "Integrações", included: true },
        ],
        cta: "Assinar Pro",
        popular: true,
        badge: "Mais Popular",
      },
    ],
  };

  it("renders header, plans and disclaimer", () => {
    render(
      <Pricing
        content={content}
        tracking={{
          section: "pricing",
          experimentId: "pricing_test",
          variant: "default",
        }}
      />,
    );

    // Check that the main content is rendered (don't test specific IDs)
    expect(screen.getByText(content.title)).toBeInTheDocument();
    expect(screen.getByText(content.subtitle)).toBeInTheDocument();
    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Preços sujeitos a impostos")).toBeInTheDocument();

    // Check that CTA buttons are rendered with correct text
    const starterButton = screen.getByRole("button", {
      name: "Assinar Starter",
    });
    expect(starterButton).toBeInTheDocument();
    expect(starterButton).toHaveTextContent("Assinar Starter");
  });

  it("renders billing toggle buttons correctly", () => {
    render(<Pricing content={content} tracking={{ section: "pricing" }} />);

    // Check that both monthly and annual buttons are rendered
    const monthlyBtn = screen.getByRole("button", { name: "Mensal" });
    const annualBtn = screen.getByRole("button", { name: "Anual" });

    expect(monthlyBtn).toBeInTheDocument();
    expect(annualBtn).toBeInTheDocument();

    // Check initial state - monthly should be active by default (as per component default)
    expect(monthlyBtn).toHaveClass("bg-primary");
    expect(annualBtn).not.toHaveClass("bg-primary");
  });

  it("renders plan CTA buttons with correct attributes", () => {
    render(<Pricing content={content} tracking={{ section: "pricing" }} />);

    // Check that professional plan CTA button is rendered with correct text and attributes
    const professionalBtn = screen.getByRole("button", { name: "Assinar Pro" });
    expect(professionalBtn).toBeInTheDocument();
    expect(professionalBtn).toHaveAttribute("data-tracking", "pricing-cta");
    expect(professionalBtn).toHaveAttribute("data-plan", "pro");
  });

  it("applies data attributes for variant and experiment", () => {
    const { container } = render(
      <Pricing
        content={content}
        variant="enterprise"
        tracking={{ section: "pricing", experimentId: "exp123", variant: "b" }}
      />,
    );

    const pricingContainer = container.firstChild as HTMLElement;
    expect(pricingContainer).toHaveAttribute("data-variant", "enterprise");
    expect(pricingContainer).toHaveAttribute("data-experiment-id", "exp123");
  });
});

import { describe, it, expect, jest, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Check: () => <div data-testid="check-icon">✓</div>,
  X: () => <div data-testid="x-icon">✗</div>,
  Zap: () => <div data-testid="zap-icon">⚡</div>,
}));

// Mock UI components
vi.mock("@/app/(marketing)/components/ui/section-wrapper", () => ({
  SectionWrapper: ({
    children,
    id,
    className,
    ...props
  }: Record<string, unknown>) => (
    <section id={id as string} className={className as string} {...props}>
      {children}
    </section>
  ),
  SectionHeader: ({ title, subtitle, className }: Record<string, unknown>) => (
    <div className={className as string}>
      <h2>{title as string}</h2>
      <p>{subtitle as string}</p>
    </div>
  ),
}));

vi.mock("@/lib/utils", () => ({
  cn: (...classes: (string | undefined | null | boolean)[]) =>
    classes.filter(Boolean).join(" "),
}));

// Component already imported at the top

describe("Pricing Component", () => {
  const mockPricingContent: PricingContent = {
    title: "Escolha seu plano",
    subtitle: "Planos flexíveis para todos os tamanhos de empresa",
    plans: [
      {
        id: "starter",
        name: "Starter",
        description: "Perfeito para começar",
        price: {
          monthly: 29,
          annual: 290,
          currency: "BRL",
        },
        features: [
          { name: "Até 5 usuários", included: true },
          { name: "10GB de armazenamento", included: true },
          { name: "Suporte por email", included: true },
          { name: "Relatórios avançados", included: false },
          { name: "API access", included: false },
        ],
        popular: false,
        cta: "Começar Grátis",
      },
      {
        id: "professional",
        name: "Professional",
        description: "Para equipes em crescimento",
        price: {
          monthly: 99,
          annual: 990,
          currency: "BRL",
        },
        features: [
          { name: "Até 25 usuários", included: true, highlight: true },
          { name: "100GB de armazenamento", included: true },
          { name: "Suporte prioritário", included: true },
          { name: "Relatórios avançados", included: true },
          { name: "API access", included: true },
          { name: "Integrações premium", included: false },
        ],
        popular: true,
        cta: "Assinar Professional",
        badge: "Mais Popular",
      },
      {
        id: "enterprise",
        name: "Enterprise",
        description: "Soluções personalizadas",
        price: {
          monthly: 299,
          annual: 2990,
          currency: "BRL",
        },
        features: [
          { name: "Usuários ilimitados", included: true },
          { name: "Armazenamento ilimitado", included: true },
          { name: "Suporte 24/7", included: true },
          { name: "Relatórios avançados", included: true },
          { name: "API access completo", included: true },
          { name: "Integrações premium", included: true },
        ],
        popular: false,
        cta: "Falar com Vendas",
      },
    ],
    billingToggle: {
      enabled: true,
      defaultPeriod: "annual",
    },
    highlightPopular: true,
    disclaimer:
      "Preços em reais, sujeitos a impostos. Cancelamento a qualquer momento.",
  };

  const defaultProps = {
    content: mockPricingContent,
    tracking: {
      section: "pricing" as const,
      experimentId: "pricing_test",
      variant: "default",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders the pricing section with correct content", () => {
      render(<Pricing {...defaultProps} />);

      // Check main content is rendered
      expect(screen.getByText(mockPricingContent.title)).toBeInTheDocument();
      expect(screen.getByText(mockPricingContent.subtitle)).toBeInTheDocument();

      // Check all plan names are rendered
      mockPricingContent.plans.forEach((plan) => {
        expect(screen.getByText(plan.name)).toBeInTheDocument();
        expect(screen.getByText(plan.description)).toBeInTheDocument();
      });
    });

    it("renders billing toggle when enabled", () => {
      render(<Pricing {...defaultProps} />);

      expect(screen.getByText("Mensal")).toBeInTheDocument();
      expect(screen.getByText("Anual")).toBeInTheDocument();
    });

    it("does not render billing toggle when disabled", () => {
      const contentWithoutToggle = {
        ...mockPricingContent,
        billingToggle: { enabled: false, defaultPeriod: "monthly" as const },
      };

      render(<Pricing {...defaultProps} content={contentWithoutToggle} />);

      expect(screen.queryByText("Mensal")).not.toBeInTheDocument();
      expect(screen.queryByText("Anual")).not.toBeInTheDocument();
    });

    it("renders popular plan with special styling", () => {
      render(<Pricing {...defaultProps} />);

      const popularPlan = mockPricingContent.plans.find((p) => p.popular);
      const popularCard = screen
        .getByText(popularPlan!.name)
        .closest(".relative.bg-card");

      // Should have popular styling (border-primary)
      expect(popularCard).toHaveClass("border-primary");
    });

    it("renders plan features with correct icons", () => {
      render(<Pricing {...defaultProps} />);

      // Should have check icons for included features
      const checkIcons = screen.getAllByTestId("check-icon");
      expect(checkIcons.length).toBeGreaterThan(0);

      // Should have X icons for excluded features
      const xIcons = screen.getAllByTestId("x-icon");
      expect(xIcons.length).toBeGreaterThan(0);
    });

    it("renders highlighted features with special styling", () => {
      render(<Pricing {...defaultProps} />);

      // Professional plan has a highlighted feature
      const highlightedFeature = screen.getByText("Até 25 usuários");
      const featureContainer = highlightedFeature.closest("span");

      expect(featureContainer).toHaveClass("font-semibold");
      expect(featureContainer).toHaveClass("text-accent");
    });

    it("renders disclaimer when provided", () => {
      render(<Pricing {...defaultProps} />);

      expect(
        screen.getByText(mockPricingContent.disclaimer!),
      ).toBeInTheDocument();
    });
  });

  describe("Billing Toggle", () => {
    it("starts with default annual billing", () => {
      render(<Pricing {...defaultProps} />);

      // Should show annual prices by default
      const professionalPlan = mockPricingContent.plans[1];
      const expectedAnnualPrice = "R$ 990";
      expect(screen.getByText(expectedAnnualPrice)).toBeInTheDocument();
      // Check for at least one "/ano" text
      expect(screen.getAllByText("/ano")).toHaveLength(3);
    });

    it("shows discount percentage for annual billing", () => {
      render(<Pricing {...defaultProps} />);

      // Should calculate and show discount (17% for Professional plan)
      expect(screen.getByText("-17%")).toBeInTheDocument();
    });

    it("shows savings text for annual billing", () => {
      render(<Pricing {...defaultProps} />);

      // Should show savings text for multiple plans
      const savingsElements = screen.getAllByText(/Economize 17% vs\. mensal/);
      expect(savingsElements).toHaveLength(3); // All plans have the same discount
    });
  });

  describe("Plan Selection", () => {
    it("renders plan CTAs correctly", () => {
      render(<Pricing {...defaultProps} />);

      mockPricingContent.plans.forEach((plan) => {
        expect(screen.getByText(plan.cta)).toBeInTheDocument();
      });
    });
  });

  describe("Variants", () => {
    it("applies default variant when not specified", () => {
      const { container } = render(<Pricing {...defaultProps} />);

      const pricingContainer = container.firstChild as HTMLElement;
      expect(pricingContainer).toHaveAttribute("data-variant", "default");
    });

    it("applies custom variant when specified", () => {
      const { container } = render(
        <Pricing {...defaultProps} variant="enterprise" />,
      );

      const pricingContainer = container.firstChild as HTMLElement;
      expect(pricingContainer).toHaveAttribute("data-variant", "enterprise");
    });
  });

  describe("Accessibility", () => {
    it("has proper heading hierarchy", () => {
      render(<Pricing {...defaultProps} />);

      const mainHeading = screen.getByRole("heading", { level: 2 });
      expect(mainHeading).toBeInTheDocument();

      // Check that plan names are headings too
      const planHeadings = screen.getAllByRole("heading", { level: 3 });
      expect(planHeadings).toHaveLength(mockPricingContent.plans.length);
    });

    it("has accessible CTA buttons", () => {
      render(<Pricing {...defaultProps} />);

      mockPricingContent.plans.forEach((plan) => {
        const ctaButton = screen.getByText(plan.cta);
        expect(ctaButton).toBeInTheDocument();
        expect(ctaButton).toHaveAttribute("data-tracking", "pricing-cta");
        expect(ctaButton).toHaveAttribute("data-plan", plan.id);
      });
    });

    it("has proper ARIA labels for billing toggle", () => {
      render(<Pricing {...defaultProps} />);

      const monthlyButton = screen.getByText("Mensal");
      const annualButton = screen.getByText("Anual");

      expect(monthlyButton).toBeInTheDocument();
      expect(annualButton).toBeInTheDocument();
    });
  });

  describe("Basic Functionality", () => {
    it("renders with correct structure", () => {
      render(<Pricing {...defaultProps} />);

      // Check basic structure exists
      expect(screen.getByText(mockPricingContent.title)).toBeInTheDocument();
      expect(screen.getByText("Começar Grátis")).toBeInTheDocument();
    });

    it("handles empty plans gracefully", () => {
      const emptyContent = {
        ...mockPricingContent,
        plans: [],
      };

      render(<Pricing {...defaultProps} content={emptyContent} />);

      // Should still render header
      expect(screen.getByText(mockPricingContent.title)).toBeInTheDocument();

      // But no plan cards
      expect(document.querySelectorAll("[data-plan]").length).toBe(0);
    });

    it("handles plans without prices", () => {
      const contentWithFreePlan = {
        ...mockPricingContent,
        plans: [
          {
            ...mockPricingContent.plans[0],
            price: { monthly: 0, annual: 0, currency: "BRL" },
          },
        ],
      };

      render(<Pricing {...defaultProps} content={contentWithFreePlan} />);

      expect(screen.getByText("R$ 0")).toBeInTheDocument();
    });
  });
});
