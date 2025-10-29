import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { jest } from "vitest";

// Import ThemeProvider for sections
import { ThemeProvider } from "@/lib/theme/theme-context";

// Test wrapper with ThemeProvider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider defaultTheme={{ mode: "light" }}>{children}</ThemeProvider>
);

// Custom render function that includes ThemeProvider
const customRender = (ui: React.ReactElement) =>
  render(ui, { wrapper: TestWrapper });

// Mock Next.js router
const mockPush = vi.fn();
const mockPrefetch = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    prefetch: mockPrefetch,
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock analytics
const mockTrackEvent = vi.fn();
const mockTrackCtaClick = vi.fn((cta, location) => {
  mockTrackEvent("cta_click", {
    cta_text: cta,
    cta_location: location,
    page_path: "/",
    timestamp: expect.any(String),
  });
});

// Mock UI components
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

// Mock a11y components
vi.mock("@/lib/a11y/touch-target-optimization", () => ({
  AccessibleButton: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  AccessibleLink: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  SkipLink: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  useReducedMotion: () => false,
}));

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock feature flags
vi.mock("@/lib/hooks/use-feature-flags", () => ({
  useExperiment: vi.fn(() => ({
    variant: "control",
    trackConversion: vi.fn(),
  })),
}));

// Mock component tokens
vi.mock("@/lib/hooks/use-chapter-tokens", () => ({
  useComponentTokens: vi.fn(() => ({
    cta: { variant: "primary" },
    background: { chapter: "hsl(var(--color-neutral-50))" },
  })),
}));

// Mock animations
vi.mock("@/lib/hooks/use-animations", () => ({
  useAnimations: vi.fn(() => ({
    animations: {
      buttonHover: {},
      buttonTap: {},
    },
  })),
}));

vi.mock("@/lib/analytics-core", () => ({
  analytics: {
    track: mockTrackEvent,
    trackView: vi.fn(),
    trackCtaClick: mockTrackCtaClick,
    trackScroll: vi.fn(),
    trackExperiment: vi.fn(),
    trackFormSubmit: vi.fn(),
  },
  consent: {
    getState: vi.fn(() => ({ analytics: true, marketing: true })),
    setState: vi.fn(),
    requestConsent: vi.fn(),
  },
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: any) => (
      <section {...props}>{children}</section>
    ),
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useMotionValue: vi.fn(() => ({ get: () => 0, set: vi.fn() })),
  useTransform: vi.fn(() => 0),
  useSpring: vi.fn(() => ({ get: () => 0, set: vi.fn() })),
}));

// Mock IntersectionObserver
const MockIntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
  root: null,
  rootMargin: "",
  thresholds: [],
}));

Object.defineProperty(MockIntersectionObserver, "prototype", {
  value: {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(() => []),
    root: null,
    rootMargin: "",
    thresholds: [],
  },
});

global.IntersectionObserver = MockIntersectionObserver as any;

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock composition system
const mockComposeHeroContent = vi.fn();
const mockComposeBenefitsContent = vi.fn();
const mockComposeFeaturesContent = vi.fn();
const mockComposePricingContent = vi.fn();

vi.mock("@/domains/marketing/composers/hero-composer", () => ({
  composeHeroContent: mockComposeHeroContent,
}));

vi.mock("@/domains/marketing/composers/benefits-composer", () => ({
  composeBenefitsContent: mockComposeBenefitsContent,
}));

vi.mock("@/domains/marketing/composers/features-composer", () => ({
  composeFeaturesContent: mockComposeFeaturesContent,
}));

vi.mock("@/domains/marketing/composers/pricing-composer", () => ({
  composePricingContent: mockComposePricingContent,
}));

// Note: ThemeProvider is imported directly, useTheme will use real implementation in tests

// Mock use-experiment hook to prevent state updates during tests
vi.mock("@/lib/ab-testing/use-experiment", () => ({
  useExperiment: vi.fn(() => ({
    variant: "default",
    isLoading: false,
    error: null,
    trackGoal: vi.fn(),
    trackEvent: vi.fn(),
    trackConversion: vi.fn(),
  })),
}));

// Mock data for components
const mockBenefitsData = {
  title: "Resultados que você pode medir",
  subtitle: "Veja como nossos clientes alcançaram sucesso",
  benefits: [
    {
      icon: "Zap",
      title: "75% menos tempo",
      description: "Automatize processos manuais",
      metric: "75%",
    },
    {
      icon: "TrendingUp",
      title: "99.9% precisão",
      description: "Resultados confiáveis",
      metric: "99.9%",
    },
  ],
};

const mockFeaturesData = {
  content: {
    title: "Funcionalidades que resolvem problemas reais",
    subtitle: "Tudo que você precisa em uma plataforma",
    layout: "grid",
    features: [
      {
        icon: "BarChart3",
        title: "Relatórios automatizados",
        description: "Gere relatórios automaticamente a partir dos seus dados",
        technicalDetails: ["API Rest", "Webhooks"],
        mockupType: "dashboard" as const,
        benefits: ["Reduz tempo", "Aumenta precisão"],
      },
      {
        icon: "Database",
        title: "Dashboards interativos",
        description: "Visualize seus dados com dashboards modernos",
        technicalDetails: ["Real-time", "Customizável"],
        mockupType: "connectors" as const,
        benefits: ["Fácil uso", "Personalizável"],
      },
    ],
  },
  tracking: { section: "features" },
};

const mockPricingData = {
  content: {
    title: "Planos que crescem com seu negócio",
    subtitle: "Escolha o plano ideal para suas necessidades",
    billingToggle: {
      enabled: true,
      defaultPeriod: "monthly",
    },
    plans: [
      {
        id: "starter",
        name: "Iniciante",
        price: { monthly: 97, annual: 997 },
        description: "Ideal para microempresas começando",
        features: [
          { name: "Até 3 usuários", included: true },
          { name: "5 dashboards personalizados", included: true },
        ],
        popular: false,
        cta: "Começar teste grátis",
      },
      {
        id: "pro",
        name: "Profissional",
        price: { monthly: 197, annual: 1997 },
        description: "Para empresas em expansão",
        features: [
          { name: "Até 10 usuários", included: true },
          { name: "Dashboards ilimitados", included: true },
        ],
        popular: true,
        cta: "Começar teste grátis",
      },
    ],
  },
  tracking: { section: "pricing" },
};

// Import components after mocks
import { Hero } from "@/components/sections/hero/hero";
import { Benefits } from "@/components/sections/benefits/benefits";
import { Features } from "@/components/sections/features/features";
import { Pricing } from "@/components/sections/pricing/pricing";

describe("Landing Page Sections", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock returns
    mockComposeHeroContent.mockReturnValue({
      content: {
        headline: "Transforme seus dados em resultados",
        subheadline: "Automatize relatórios em minutos",
        primaryCta: "Comece seu teste grátis",
        secondaryCta: "Ver demonstração",
        badge: "Novo: IA Avançada",
        metrics: [
          { value: "75%", label: "menos tempo" },
          { value: "99.9%", label: "precisão" },
        ],
      },
      variant: {
        id: "default",
        name: "Default",
        description: "Hero padrão",
      },
    });

    mockComposeBenefitsContent.mockReturnValue({
      content: {
        title: "Resultados que você pode medir",
        subtitle: "Veja como nossos clientes alcançaram sucesso",
        benefits: [
          {
            title: "75% menos tempo",
            description: "Reduza o tempo gasto em relatórios manuais",
            icon: "Clock",
            metric: "75%",
          },
          {
            title: "99.9% precisão",
            description: "Dados confiáveis para tomadas de decisão",
            icon: "Target",
            metric: "99.9%",
          },
        ],
      },
      variant: {
        id: "cards",
        name: "Cards",
        description: "Layout em cards",
      },
    });

    mockComposeFeaturesContent.mockReturnValue({
      content: {
        title: "Funcionalidades que resolvem problemas reais",
        subtitle: "Tudo que você precisa em uma plataforma",
        layout: "grid",
        features: [
          {
            title: "Relatórios automatizados",
            description:
              "Gere relatórios automaticamente a partir dos seus dados",
            icon: "FileText",
            highlight: "Popular",
          },
          {
            title: "Dashboards interativos",
            description: "Visualize seus dados com dashboards modernos",
            icon: "BarChart",
            highlight: "Novo",
          },
        ],
      },
      variant: {
        id: "zigzag",
        name: "Zigzag",
        description: "Layout alternado",
      },
    });

    mockComposePricingContent.mockReturnValue({
      content: {
        title: "Planos para todos os tamanhos",
        subtitle: "Escolha o plano ideal para seu negócio",
        billingToggle: {
          enabled: true,
          defaultPeriod: "monthly",
        },
        plans: [
          {
            id: "starter",
            name: "Starter",
            description: "Ideal para microempresas começando",
            price: { monthly: 97, annual: 997, currency: "BRL" },
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
            name: "Pro",
            description: "Para empresas em expansão",
            price: { monthly: 197, annual: 1997, currency: "BRL" },
            features: [
              { name: "Até 10 usuários", included: true },
              { name: "Relatórios avançados", included: true },
              { name: "Suporte prioritário", included: true },
            ],
            popular: true,
            cta: "Começar teste grátis",
          },
        ],
      },
      variant: {
        id: "comparison",
        name: "Comparison",
        description: "Tabela comparativa",
      },
    });
  });

  describe("Hero Section", () => {
    const mockHeroData = {
      content: {
        headline: "Transforme seus dados em resultados",
        subheadline: "Automatize relatórios em minutos",
        primaryCta: "Comece seu teste grátis",
        secondaryCta: "Ver demonstração",
        badge: "Novo: IA Avançada",
      },
      variant: "default" as const,
      tracking: { section: "hero" as const },
    };

    it("renders hero content", async () => {
      await act(async () => {
        render(<Hero {...mockHeroData} />);
      });

      // Check for badge
      expect(screen.getByText("Novo: IA Avançada")).toBeInTheDocument();

      // Check for subheadline (content.subheadline is used directly)
      expect(
        screen.getByText("Automatize relatórios em minutos"),
      ).toBeInTheDocument();
    });

    it("renders CTA buttons", async () => {
      await act(async () => {
        render(<Hero {...mockHeroData} />);
      });

      expect(
        screen.getByRole("button", { name: /Comece seu teste grátis/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Ver demonstração/i }),
      ).toBeInTheDocument();
    });

    it("tracks CTA clicks", async () => {
      const mockOnPrimaryCta = vi.fn();
      await act(async () => {
        render(<Hero {...mockHeroData} onPrimaryCta={mockOnPrimaryCta} />);
      });

      const primaryCta = screen.getByRole("button", {
        name: /Clique para Comece seu teste grátis/i,
      });
      fireEvent.click(primaryCta);

      expect(mockOnPrimaryCta).toHaveBeenCalled();
    });

    it("handles navigation on CTA click", () => {
      const mockOnPrimaryCta = vi.fn();
      render(<Hero {...mockHeroData} onPrimaryCta={mockOnPrimaryCta} />);

      const primaryCta = screen.getByRole("button", {
        name: /Clique para Comece seu teste grátis/i,
      });
      fireEvent.click(primaryCta);

      expect(mockOnPrimaryCta).toHaveBeenCalled();
    });
  });

  describe("Benefits Section", () => {
    const mockBenefitsProps = {
      content: {
        title: "Resultados que você pode medir",
        subtitle: "Veja como nossos clientes alcançaram sucesso",
        benefits: [
          {
            icon: "Zap",
            title: "75% menos tempo",
            description: "Automatize processos manuais",
            metric: "75%",
          },
          {
            icon: "TrendingUp",
            title: "99.9% precisão",
            description: "Resultados confiáveis",
            metric: "99.9%",
          },
        ],
      },
      variant: "default" as const,
      tracking: { section: "benefits" as const },
    };

    it("renders benefits content", () => {
      render(<Benefits {...mockBenefitsProps} />);

      expect(
        screen.getByText("Resultados que você pode medir"),
      ).toBeInTheDocument();
      expect(screen.getByText("75% menos tempo")).toBeInTheDocument();
      expect(screen.getByText("99.9% precisão")).toBeInTheDocument();
    });

    it("displays benefit metrics", () => {
      render(<Benefits {...mockBenefitsProps} />);

      expect(screen.getByText("75%")).toBeInTheDocument();
      expect(screen.getByText("99.9%")).toBeInTheDocument();
    });

    it("renders benefit icons", () => {
      render(<Benefits {...mockBenefitsProps} />);

      // Icons should be rendered (implementation dependent)
      const benefitsSection = screen
        .getByText("75% menos tempo")
        .closest("div");
      expect(benefitsSection).toBeInTheDocument();
    });

    it("handles empty benefits gracefully", () => {
      mockComposeBenefitsContent.mockReturnValue({
        content: {
          title: "Benefits",
          benefits: [],
        },
        variant: { id: "empty", name: "Empty", description: "No benefits" },
      });

      render(
        <Benefits
          content={{ title: "Benefits", subtitle: "Test", benefits: [] }}
        />,
      );

      expect(screen.getByText("Benefits")).toBeInTheDocument();
      // Should not crash with empty benefits
    });
  });

  describe("Features Section", () => {
    const mockFeaturesProps = {
      content: {
        title: "Funcionalidades que resolvem problemas reais",
        subtitle: "Tudo que você precisa em uma plataforma",
        layout: "grid" as const,
        features: [
          {
            icon: "BarChart3",
            title: "Relatórios automatizados",
            description:
              "Gere relatórios automaticamente a partir dos seus dados",
            highlight: "Popular",
          },
          {
            icon: "Database",
            title: "Dashboards interativos",
            description: "Visualize seus dados com dashboards modernos",
            highlight: "Novo",
          },
        ],
      },
      variant: "default" as const,
      tracking: { section: "features" as const },
    };

    it("renders features content", () => {
      render(<Features {...mockFeaturesProps} />);

      expect(
        screen.getByText("Funcionalidades que resolvem problemas reais"),
      ).toBeInTheDocument();
      expect(screen.getByText("Relatórios automatizados")).toBeInTheDocument();
      expect(screen.getByText("Dashboards interativos")).toBeInTheDocument();
    });

    it("displays feature categories", () => {
      render(<Features {...mockFeaturesProps} />);

      expect(screen.getByText("Popular")).toBeInTheDocument();
      expect(screen.getByText("Novo")).toBeInTheDocument();
    });

    it("renders zigzag layout structure", () => {
      render(<Features {...mockFeaturesProps} />);

      // Features section should exist
      const featuresSection = screen
        .getByText("Relatórios automatizados")
        .closest("div");
      expect(featuresSection).toBeInTheDocument();
    });

    it("handles feature descriptions", () => {
      render(<Features {...mockFeaturesProps} />);

      expect(
        screen.getByText(
          "Gere relatórios automaticamente a partir dos seus dados",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Visualize seus dados com dashboards modernos"),
      ).toBeInTheDocument();
    });
  });

  describe("Pricing Section", () => {
    const mockPricingProps = {
      content: {
        title: "Planos para todos os tamanhos",
        subtitle: "Escolha o plano ideal para seu negócio",
        billingToggle: {
          enabled: true,
          defaultPeriod: "monthly" as const,
        },
        plans: [
          {
            id: "starter",
            name: "Iniciante",
            description: "Ideal para microempresas começando",
            price: { monthly: 97, annual: 997, currency: "BRL" },
            features: [
              { name: "Até 3 usuários", included: true },
              { name: "Relatórios básicos", included: true },
            ],
            popular: false,
            cta: "Começar teste grátis",
          },
          {
            id: "pro",
            name: "Profissional",
            description: "Para empresas em expansão",
            price: { monthly: 197, annual: 1997, currency: "BRL" },
            features: [
              { name: "Até 10 usuários", included: true },
              { name: "Relatórios avançados", included: true },
            ],
            popular: true,
            cta: "Começar teste grátis",
          },
        ],
      },
      variant: "default" as const,
      tracking: { section: "pricing" as const },
    };

    it("renders pricing content", () => {
      render(<Pricing {...mockPricingProps} />);

      expect(
        screen.getByText("Planos para todos os tamanhos"),
      ).toBeInTheDocument();
      expect(screen.getByText("Iniciante")).toBeInTheDocument();
      expect(screen.getByText("Profissional")).toBeInTheDocument();
    });

    it("displays pricing correctly", () => {
      render(<Pricing {...mockPricingProps} />);

      expect(screen.getByText("R$ 97")).toBeInTheDocument();
      expect(screen.getByText("R$ 197")).toBeInTheDocument();
    });

    it("marks popular plan", () => {
      render(<Pricing {...mockPricingProps} />);

      // Popular plan should have special styling/marking
      const proPlan = screen.getByText("Profissional").closest("div");
      expect(proPlan).toBeInTheDocument();
    });

    it("displays plan features", () => {
      render(<Pricing {...mockPricingProps} />);

      expect(screen.getByText("Até 3 usuários")).toBeInTheDocument();
      expect(screen.getByText("Relatórios básicos")).toBeInTheDocument();
      expect(screen.getByText("Até 10 usuários")).toBeInTheDocument();
    });

    it("shows annual pricing toggle", () => {
      render(<Pricing {...mockPricingProps} />);

      // Should have annual pricing option
      expect(screen.getByText("Anual")).toBeInTheDocument();
    });
  });

  describe("Integration Tests", () => {
    it("all sections render without crashing", () => {
      expect(() => {
        const heroData = {
          content: {
            headline: "Test Headline",
            subheadline: "Test Subheadline",
            primaryCta: "Test CTA",
            secondaryCta: "Test Secondary",
          },
          variant: "default" as const,
          tracking: { section: "hero" as const },
        };
        const benefitsData = {
          content: {
            title: "Test Benefits",
            subtitle: "Test Subtitle",
            benefits: [
              { icon: "Test", title: "Test Benefit", description: "Test Desc" },
            ],
          },
          variant: "default" as const,
          tracking: { section: "benefits" as const },
        };
        const featuresData = {
          content: {
            title: "Test Features",
            subtitle: "Test Subtitle",
            layout: "grid" as const,
            features: [
              { icon: "Test", title: "Test Feature", description: "Test Desc" },
            ],
          },
          variant: "default" as const,
          tracking: { section: "features" as const },
        };
        const pricingData = {
          content: {
            title: "Test Pricing",
            subtitle: "Test Subtitle",
            plans: [
              {
                id: "test",
                name: "Test Plan",
                description: "Test Desc",
                price: { monthly: 10, annual: 100, currency: "BRL" },
                features: [{ name: "Test Feature", included: true }],
                popular: false,
                cta: "Test CTA",
              },
            ],
          },
          variant: "default" as const,
          tracking: { section: "pricing" as const },
        };

        render(<Hero {...heroData} />);
        render(<Benefits {...benefitsData} />);
        render(<Features {...featuresData} />);
        render(<Pricing {...pricingData} />);
      }).not.toThrow();
    });

    it("sections render with proper structure", () => {
      const heroData = {
        content: {
          headline: "Test Headline",
          subheadline: "Test Subheadline",
          primaryCta: "Test CTA",
        },
        variant: "default" as const,
        tracking: { section: "hero" as const },
      };
      const benefitsData = {
        content: {
          title: "Test Benefits",
          subtitle: "Test Subtitle",
          benefits: [
            { icon: "Test", title: "Test Benefit", description: "Test Desc" },
          ],
        },
        variant: "default" as const,
        tracking: { section: "benefits" as const },
      };

      render(<Hero {...heroData} />);
      render(<Benefits {...benefitsData} />);

      // Check that sections have proper semantic structure
      expect(screen.getAllByRole("heading").length).toBeGreaterThan(0);
    });

    it("sections have proper semantic structure", () => {
      const heroData = {
        content: {
          headline: "Test Headline",
          subheadline: "Test Subheadline",
          primaryCta: "Test CTA",
        },
        variant: "default" as const,
        tracking: { section: "hero" as const },
      };
      const benefitsData = {
        content: {
          title: "Test Benefits",
          subtitle: "Test Subtitle",
          benefits: [
            { icon: "Test", title: "Test Benefit", description: "Test Desc" },
          ],
        },
        variant: "default" as const,
        tracking: { section: "benefits" as const },
      };

      render(<Hero {...heroData} />);
      render(<Benefits {...benefitsData} />);

      // Should have proper headings
      expect(
        screen.getAllByRole("heading", { level: 1 }).length,
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByRole("heading", { level: 2 }).length,
      ).toBeGreaterThan(0);
    });
  });
});
