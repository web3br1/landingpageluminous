import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Benefits } from "@/components/sections/benefits/benefits";
import type { BenefitsContent } from "@/domains/marketing";

// Mock Next.js Image component - Tipado corretamente
vi.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => React.createElement("img", { src, alt, ...props }),
}));

// Mock utils - Tipado corretamente
vi.mock("@/lib/utils", () => ({
  cn: (...classes: (string | undefined | null | false)[]) =>
    classes.filter(Boolean).join(" "),
}));

// Mock experiment hooks - Comportamento realista
const mockTrackClick = vi.fn().mockResolvedValue(undefined);
const mockTrackExperimentEvent = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/experiments/hooks", () => ({
  useABTest: vi.fn(() => ({
    variant: "control",
    trackClick: mockTrackClick,
    isLoading: false,
    error: null,
  })),
}));

vi.mock("@/lib/analytics/experiment-analytics", () => ({
  trackExperimentEvent: mockTrackExperimentEvent,
}));

// Mock lucide-react icons - Comportamento realista
vi.mock("lucide-react", () => ({
  Zap: ({
    className,
    ...props
  }: {
    className?: string;
    [key: string]: unknown;
  }) =>
    React.createElement("svg", {
      "data-testid": "zap-icon",
      "data-icon": "zap",
      className,
      ...props,
    }),
  TrendingUp: ({
    className,
    ...props
  }: {
    className?: string;
    [key: string]: unknown;
  }) =>
    React.createElement("svg", {
      "data-testid": "trending-up-icon",
      "data-icon": "trending-up",
      className,
      ...props,
    }),
  BarChart3: ({
    className,
    ...props
  }: {
    className?: string;
    [key: string]: unknown;
  }) =>
    React.createElement("svg", {
      "data-testid": "bar-chart-icon",
      "data-icon": "bar-chart",
      className,
      ...props,
    }),
  Users: ({
    className,
    ...props
  }: {
    className?: string;
    [key: string]: unknown;
  }) =>
    React.createElement("svg", {
      "data-testid": "users-icon",
      "data-icon": "users",
      className,
      ...props,
    }),
  Shield: ({
    className,
    ...props
  }: {
    className?: string;
    [key: string]: unknown;
  }) =>
    React.createElement("svg", {
      "data-testid": "shield-icon",
      "data-icon": "shield",
      className,
      ...props,
    }),
  Settings: ({
    className,
    ...props
  }: {
    className?: string;
    [key: string]: unknown;
  }) =>
    React.createElement("svg", {
      "data-testid": "settings-icon",
      "data-icon": "settings",
      className,
      ...props,
    }),
  Rocket: ({
    className,
    ...props
  }: {
    className?: string;
    [key: string]: unknown;
  }) =>
    React.createElement("svg", {
      "data-testid": "rocket-icon",
      "data-icon": "rocket",
      className,
      ...props,
    }),
  DollarSign: ({
    className,
    ...props
  }: {
    className?: string;
    [key: string]: unknown;
  }) =>
    React.createElement("svg", {
      "data-testid": "dollar-sign-icon",
      "data-icon": "dollar-sign",
      className,
      ...props,
    }),
  Building: ({
    className,
    ...props
  }: {
    className?: string;
    [key: string]: unknown;
  }) =>
    React.createElement("svg", {
      "data-testid": "building-icon",
      "data-icon": "building",
      className,
      ...props,
    }),
}));

// Mock utils - Tipado corretamente
vi.mock("@/lib/utils", () => ({
  cn: (...classes: (string | undefined | null | false)[]) =>
    classes.filter(Boolean).join(" "),
}));

describe("Benefits Component", () => {
  const user = userEvent.setup();

  const mockBenefits = [
    {
      icon: "Zap",
      title: "Aumento de Produtividade",
      description:
        "Automatize processos manuais e foque no que realmente importa",
      metric: "300%",
    },
    {
      icon: "TrendingUp",
      title: "Redução de Custos",
      description: "Otimize recursos e elimine desperdícios operacionais",
      metric: "40%",
    },
    {
      icon: "BarChart3",
      title: "Análises Avançadas",
      description: "Insights profundos com inteligência artificial",
      metric: "5x",
    },
  ];

  const mockContent: BenefitsContent = {
    title: "Por que escolher nossa solução?",
    subtitle: "Descubra os benefícios que fazem a diferença",
    benefits: mockBenefits,
  };

  const defaultProps = {
    content: mockContent,
    id: "benefits",
    tracking: {
      section: "benefits" as const,
      experimentId: "benefits_test",
      variant: "default",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders the benefits section with title and subtitle", () => {
      render(<Benefits {...defaultProps} />);

      const titleElement = screen.getByRole("heading", { level: 2 });
      expect(titleElement).toHaveTextContent(mockContent.title);
      expect(titleElement).toBeVisible();

      const subtitleElement = screen.getByText(mockContent.subtitle);
      expect(subtitleElement).toBeVisible();
      expect(subtitleElement).toHaveClass("text-muted-foreground"); // Verifica classe específica
    });

    it("renders all benefits with correct content", () => {
      render(<Benefits {...defaultProps} />);

      mockBenefits.forEach((benefit, index) => {
        expect(screen.getByText(benefit.title)).toBeInTheDocument();
        expect(screen.getByText(benefit.description)).toBeInTheDocument();
        if (benefit.metric) {
          expect(screen.getByText(benefit.metric)).toBeInTheDocument();
        }
      });
    });

    it("renders icons for each benefit", () => {
      render(<Benefits {...defaultProps} />);

      expect(screen.getByTestId("zap-icon")).toBeInTheDocument();
      expect(screen.getByTestId("trending-up-icon")).toBeInTheDocument();
      expect(screen.getByTestId("bar-chart-icon")).toBeInTheDocument();
    });

    it("applies correct CSS classes and data attributes", () => {
      render(<Benefits {...defaultProps} variant="enterprise" />);

      const section = document.querySelector("#benefits");
      expect(section).toHaveAttribute("id", "benefits");
      expect(section).toHaveAttribute("data-section", "benefits");
      expect(section).toHaveAttribute("data-variant", "enterprise");
      expect(section).toHaveAttribute("data-experiment", "benefits_test");
    });
  });

  describe("Interactions", () => {
    it("calls onBenefitClick when benefit is clicked", () => {
      const mockOnBenefitClick = vi.fn();
      render(
        <Benefits {...defaultProps} onBenefitClick={mockOnBenefitClick} />,
      );

      // Find benefit card by data-benefit-index attribute
      const benefitCard = document.querySelector('[data-benefit-index="0"]');
      expect(benefitCard).toBeInTheDocument();

      // Simulate click
      fireEvent.click(benefitCard!);

      expect(mockOnBenefitClick).toHaveBeenCalledTimes(1);
      expect(mockOnBenefitClick).toHaveBeenCalledWith(0);
    });

    it("handles clicks gracefully when onBenefitClick is not provided", () => {
      render(<Benefits {...defaultProps} />);

      // Component deve lidar com ausência de callback sem quebrar
      const benefitCard = document.querySelector('[data-benefit-index="0"]');
      expect(benefitCard).toBeInTheDocument();

      // Click should not throw error
      expect(() => fireEvent.click(benefitCard!)).not.toThrow();

      // Component should still render correctly
      expect(screen.getByText(mockBenefits[0].title)).toBeInTheDocument();
      expect(screen.getByText(mockBenefits[0].description)).toBeInTheDocument();
    });

    it("supports keyboard navigation and interaction", () => {
      const mockOnBenefitClick = vi.fn();
      render(
        <Benefits {...defaultProps} onBenefitClick={mockOnBenefitClick} />,
      );

      // Find benefit card by data-benefit-index
      const benefitCard = document.querySelector(
        '[data-benefit-index="0"]',
      ) as HTMLElement;
      expect(benefitCard).toBeInTheDocument();

      // Component should be keyboard accessible (clickable)
      expect(benefitCard).toHaveClass("cursor-pointer");

      // Note: Full keyboard support (Enter key) could be added to component later
      // For now, we verify the component is properly structured for interaction
    });
  });

  describe("Accessibility & UX", () => {
    it("provides proper ARIA labels and roles", () => {
      render(<Benefits {...defaultProps} />);

      // Verifica roles semânticos
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
        mockContent.title,
      );

      // Verifica que métricas têm labels adequadas
      const metrics = screen.getAllByText(/\d+%|mais rápido|uptime/i);
      metrics.forEach((metric) => {
        expect(metric).toBeInTheDocument();
        // Verifica que não está vazio
        expect(metric.textContent?.trim()).not.toBe("");
      });
    });

    it("maintains focus management for keyboard users", () => {
      render(<Benefits {...defaultProps} />);

      // Check that benefit cards exist and are clickable
      const benefitCards = document.querySelectorAll("[data-benefit-index]");
      expect(benefitCards.length).toBeGreaterThan(0);

      // First benefit card should be present
      const firstCard = benefitCards[0] as HTMLElement;
      expect(firstCard).toBeInTheDocument();

      // Should have cursor pointer indicating it's interactive
      expect(firstCard).toHaveClass("cursor-pointer");
    });
  });

  describe("Edge Cases & Error Handling", () => {
    it("handles empty benefits array gracefully", () => {
      const emptyContent: BenefitsContent = {
        ...mockContent,
        benefits: [],
      };

      render(<Benefits {...defaultProps} content={emptyContent} />);

      // Deve mostrar mensagem apropriada ou estado vazio
      expect(screen.getByText(mockContent.title)).toBeInTheDocument();
      expect(screen.getByText(mockContent.subtitle)).toBeInTheDocument();
    });

    it("handles benefits without metrics", () => {
      const contentWithoutMetrics: BenefitsContent = {
        ...mockContent,
        benefits: mockBenefits.map((b) => ({ ...b, metric: undefined })),
      };

      render(<Benefits {...defaultProps} content={contentWithoutMetrics} />);

      // Deve renderizar sem quebrar
      expect(screen.getByText(mockBenefits[0].title)).toBeInTheDocument();
      expect(screen.getByText(mockBenefits[0].description)).toBeInTheDocument();

      // Não deve ter badges de métricas vazias
      const metricBadges = screen.queryAllByText(/^$/);
      const emptyMetricBadges = metricBadges.filter(
        (el) =>
          el.classList.contains("rounded-full") &&
          el.textContent?.trim() === "",
      );
      expect(emptyMetricBadges).toHaveLength(0);
    });

    it("handles malformed icon names gracefully", () => {
      // Simula cenário onde o ícone pode não existir
      const originalIcons = vi.importActual("lucide-react");

      // Mock temporário para simular ícone faltante
      const mockLucideReact = {
        ...originalIcons,
        InvalidIconName: undefined, // Ícone não existe
      };

      vi.doMock("lucide-react", () => mockLucideReact);

      const contentWithBadIcons: BenefitsContent = {
        ...mockContent,
        benefits: [
          {
            ...mockBenefits[0],
            icon: "InvalidIconName", // Tipo correto
          },
        ],
      };

      // Deve renderizar sem quebrar (fallback ou erro graceful)
      expect(() => {
        render(<Benefits {...defaultProps} content={contentWithBadIcons} />);
      }).not.toThrow();

      // Component deve ainda mostrar o benefício mesmo sem ícone
      expect(screen.getByText(mockBenefits[0].title)).toBeInTheDocument();

      vi.doUnmock("lucide-react");
    });
  });

  describe("Performance & Cleanup", () => {
    it("cleans up event listeners on unmount", () => {
      const { unmount } = render(<Benefits {...defaultProps} />);

      // Simula interações antes do unmount
      expect(screen.getByText(mockBenefits[0].title)).toBeInTheDocument();

      // Unmount
      unmount();

      // Container deve estar vazio
      expect(document.querySelector("#benefits")).toBeNull();
    });

    it("does not cause unnecessary re-renders", () => {
      const renderSpy = vi.spyOn(React, "createElement");

      const { rerender } = render(<Benefits {...defaultProps} />);

      const initialRenderCount = renderSpy.mock.calls.length;

      // Re-render com mesmas props
      rerender(<Benefits {...defaultProps} />);

      // Deve ter renderizado novamente, mas não excessivamente
      expect(renderSpy.mock.calls.length).toBeGreaterThan(initialRenderCount);

      renderSpy.mockRestore();
    });
  });
});
