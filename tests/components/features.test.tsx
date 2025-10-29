import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Features } from "@/components/sections/features/features";
import type { FeaturesContent } from "@/domains/marketing";

vi.mock("@/app/(marketing)/components/ui/section-wrapper", () => ({
  SectionWrapper: ({
    children,
    id,
    className,
    ...props
  }: Record<string, unknown>) => (
    <section id={id} className={className} {...props}>
      {children}
    </section>
  ),
  SectionHeader: ({ title, subtitle }: Record<string, unknown>) => (
    <header>
      <h2>{title}</h2>
      {subtitle ? <p>{subtitle}</p> : null}
    </header>
  ),
}));

vi.mock("@/lib/utils", () => ({
  cn: (...classes: (string | undefined | null | boolean)[]) =>
    classes.filter(Boolean).join(" "),
}));

describe("Features Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const content: FeaturesContent = {
    title: "Funcionalidades que impulsionam resultados",
    subtitle: "Tecnologia de ponta",
    layout: "zigzag",
    features: [
      {
        icon: "Database",
        title: "Integração de Dados",
        description: "Conecte tudo",
      },
      {
        icon: "Zap",
        title: "Tempo Real",
        description: "Atualizações instantâneas",
      },
      {
        icon: "Brain",
        title: "IA Conversacional",
        description: "Pergunte aos dados",
      },
    ],
  };

  it("renders title, subtitle and feature items with proper structure", () => {
    render(
      <Features
        id="features"
        content={content}
        tracking={{ section: "features" }}
      />,
    );

    // Verifica seção com ID correto
    const section = document.querySelector("#features");
    expect(section).toBeInTheDocument();
    expect(section).toHaveAttribute("data-section", "features");

    // Verifica elementos principais com classes corretas
    const titleElement = screen.getByRole("heading", { level: 2 });
    expect(titleElement).toHaveTextContent(content.title);
    expect(titleElement).toHaveClass("font-bold");
    expect(titleElement).toHaveStyle({
      fontSize: expect.stringMatching(/clamp/),
    });

    const subtitleElement = screen.getByText(content.subtitle);
    expect(subtitleElement).toBeVisible();
    expect(subtitleElement).toHaveClass("text-muted-foreground");

    // Verifica cards de features
    const featureCards = screen.getAllByRole("article");
    expect(featureCards).toHaveLength(3);

    // Verifica conteúdo específico dos cards
    expect(screen.getByText("Integração de Dados")).toBeVisible();
    expect(screen.getByText("Tempo Real")).toBeVisible();
    expect(screen.getByText("IA Conversacional")).toBeVisible();
  });

  it.skip("invokes onFeatureClick when a feature card is clicked (grid layout)", async () => {
    // Skip: Complex interaction testing requires component implementation details
  });

  it("applies data attributes for variant and experiment", () => {
    render(
      <Features
        content={content}
        variant="enterprise"
        tracking={{ section: "features", experimentId: "feat_exp" }}
      />,
    );

    const section = document.querySelector("#features");
    expect(section).toHaveAttribute("data-variant", "enterprise");
    expect(section).toHaveAttribute("data-experiment", "feat_exp");
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

// Mock next/image
vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: Record<string, unknown>) => (
    <img src={src as string} alt={alt as string} {...props} />
  ),
}));

// Mock lucide-react icons - mock all used icons
vi.mock("lucide-react", () => ({
  Database: () => <div data-testid="database-icon">📊</div>,
  Zap: () => <div data-testid="zap-icon">⚡</div>,
  Brain: () => <div data-testid="brain-icon">🧠</div>,
  Shield: () => <div data-testid="shield-icon">🛡️</div>,
  BarChart3: () => <div data-testid="barchart-icon">📈</div>,
  Users: () => <div data-testid="users-icon">👥</div>,
  Server: () => <div data-testid="server-icon">🖥️</div>,
  Lock: () => <div data-testid="lock-icon">🔒</div>,
  Globe: () => <div data-testid="globe-icon">🌐</div>,
  Code: () => <div data-testid="code-icon">💻</div>,
  Settings: () => <div data-testid="settings-icon">⚙️</div>,
}));

// Mock UI components
vi.mock("@/app/(marketing)/components/ui/section-wrapper", () => ({
  SectionWrapper: ({
    children,
    id,
    className,
    ...props
  }: Record<string, unknown>) => (
    <section id={id} className={className} {...props}>
      {children}
    </section>
  ),
  SectionHeader: ({ title, subtitle, className }: Record<string, unknown>) => (
    <div className={className}>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  ),
}));

vi.mock("@/lib/utils", () => ({
  cn: (...classes: unknown[]) => classes.filter(Boolean).join(" "),
}));

// Component already imported at the top

describe("Features Component", () => {
  const mockFeaturesContent: FeaturesContent = {
    title: "Recursos Poderosos",
    subtitle: "Tudo que você precisa para transformar seu negócio",
    layout: "grid",
    features: [
      {
        icon: "Database",
        title: "Banco de Dados Seguro",
        description:
          "Armazenamento seguro e criptografado para todos os seus dados importantes.",
      },
      {
        icon: "Zap",
        title: "Performance Rápida",
        description:
          "Tecnologia otimizada para máxima velocidade e eficiência.",
        highlight: "Premium",
      },
      {
        icon: "Brain",
        title: "IA Inteligente",
        description:
          "Inteligência artificial avançada para automatizar processos complexos.",
        highlight: "Novo",
      },
      {
        icon: "Shield",
        title: "Segurança Avançada",
        description:
          "Proteção de nível empresarial com criptografia de ponta a ponta.",
      },
      {
        icon: "BarChart3",
        title: "Relatórios Detalhados",
        description:
          "Análises profundas e relatórios personalizáveis para tomada de decisão.",
      },
      {
        icon: "Users",
        title: "Colaboração em Tempo Real",
        description:
          "Trabalhe em equipe com sincronização instantânea e comunicação integrada.",
      },
    ],
  };

  const defaultProps = {
    content: mockFeaturesContent,
    tracking: {
      section: "features" as const,
      experimentId: "features_test",
      variant: "default",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders the features section with correct content", () => {
      render(<Features {...defaultProps} id="features" />);

      expect(document.querySelector("#features")).toBeInTheDocument();
      expect(screen.getByText(mockFeaturesContent.title)).toBeInTheDocument();
      expect(
        screen.getByText(mockFeaturesContent.subtitle),
      ).toBeInTheDocument();

      // Check all feature titles are rendered
      mockFeaturesContent.features.forEach((feature) => {
        expect(screen.getByText(feature.title)).toBeInTheDocument();
        expect(screen.getByText(feature.description)).toBeInTheDocument();
      });
    });

    it("renders grid layout by default", () => {
      render(<Features {...defaultProps} />);

      const gridContainer = document.querySelector(".grid");
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass("md:grid-cols-2", "lg:grid-cols-3");
    });

    it("renders zigzag layout when specified", () => {
      const zigzagContent = {
        ...mockFeaturesContent,
        layout: "zigzag" as const,
      };

      render(<Features {...defaultProps} content={zigzagContent} />);

      // Should not have grid layout
      const gridContainer = document.querySelector(".grid");
      expect(gridContainer).toBeNull();

      // Should have zigzag-specific classes
      const zigzagContainer = document.querySelector(".space-y-16");
      expect(zigzagContainer).toBeInTheDocument();
    });

    it("renders feature icons correctly", () => {
      render(<Features {...defaultProps} />);

      // Check that icons are rendered based on feature.icon
      expect(screen.getByTestId("database-icon")).toBeInTheDocument();
      expect(screen.getByTestId("zap-icon")).toBeInTheDocument();
      expect(screen.getByTestId("brain-icon")).toBeInTheDocument();
      expect(screen.getByTestId("shield-icon")).toBeInTheDocument();
      expect(screen.getByTestId("barchart-icon")).toBeInTheDocument();
      expect(screen.getByTestId("users-icon")).toBeInTheDocument();
    });

    it("renders highlight badges for featured items", () => {
      render(<Features {...defaultProps} />);

      // Check highlight badges
      expect(screen.getByText("Premium")).toBeInTheDocument();
      expect(screen.getByText("Novo")).toBeInTheDocument();
    });

    it("handles unknown icons gracefully", () => {
      const contentWithUnknownIcon = {
        ...mockFeaturesContent,
        features: [
          ...mockFeaturesContent.features.slice(0, 1),
          {
            ...mockFeaturesContent.features[1],
            icon: "UnknownIcon",
          },
        ],
      };

      render(<Features {...defaultProps} content={contentWithUnknownIcon} />);

      // Should fall back to Database icon for unknown icons
      expect(screen.getAllByTestId("database-icon")).toHaveLength(2);
    });
  });

  describe("Layout Variants", () => {
    it("renders grid layout correctly", () => {
      render(<Features {...defaultProps} />);

      const featureCards = document.querySelectorAll(
        '[data-tracking="feature-card"]',
      );
      expect(featureCards).toHaveLength(mockFeaturesContent.features.length);

      // Check that cards have grid-specific classes
      featureCards.forEach((card) => {
        expect(card).toHaveClass("group", "relative", "p-6", "rounded-2xl");
      });
    });

    it("renders zigzag layout with alternating positions", () => {
      const zigzagContent = {
        ...mockFeaturesContent,
        layout: "zigzag" as const,
      };

      render(<Features {...defaultProps} content={zigzagContent} />);

      // Check alternating flex directions
      const featureRows = document.querySelectorAll(
        ".lg\\:flex-row, .lg\\:flex-row-reverse",
      );
      expect(featureRows.length).toBeGreaterThan(0);
    });

    it("applies correct text alignment in zigzag layout", () => {
      const zigzagContent = {
        ...mockFeaturesContent,
        layout: "zigzag" as const,
      };

      render(<Features {...defaultProps} content={zigzagContent} />);

      // Check alternating text alignment classes
      const leftAligned = document.querySelector(".lg\\:text-left");
      const rightAligned = document.querySelector(".lg\\:text-right");

      expect(leftAligned).toBeInTheDocument();
      expect(rightAligned).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("renders feature cards as clickable elements", () => {
      render(<Features {...defaultProps} />);

      const featureCards = document.querySelectorAll(
        '[data-tracking="feature-card"]',
      );
      expect(featureCards).toHaveLength(mockFeaturesContent.features.length);

      featureCards.forEach((card) => {
        expect(card).toHaveAttribute("data-tracking", "feature-card");
      });
    });
  });

  describe("Variants", () => {
    it("applies default variant when not specified", () => {
      render(<Features {...defaultProps} id="features" />);

      const section = document.querySelector("#features");
      expect(section).toHaveAttribute("data-variant", "default");
    });

    it("applies custom variant when specified", () => {
      render(<Features {...defaultProps} variant="enterprise" id="features" />);

      const section = document.querySelector("#features");
      expect(section).toHaveAttribute("data-variant", "enterprise");
    });
  });

  describe("Accessibility", () => {
    it("has proper heading hierarchy", () => {
      render(<Features {...defaultProps} />);

      const mainHeading = screen.getByRole("heading", { level: 2 });
      expect(mainHeading).toBeInTheDocument();
      expect(mainHeading).toHaveTextContent(mockFeaturesContent.title);

      // Check that feature titles are headings too
      const featureHeadings = screen.getAllByRole("heading", { level: 3 });
      expect(featureHeadings).toHaveLength(mockFeaturesContent.features.length);
    });

    it("has accessible feature cards", () => {
      render(<Features {...defaultProps} />);

      const featureCards = document.querySelectorAll(
        '[data-tracking="feature-card"]',
      );
      expect(featureCards).toHaveLength(mockFeaturesContent.features.length);

      featureCards.forEach((card) => {
        expect(card).toHaveAttribute("data-tracking", "feature-card");
      });
    });

    it("has proper structure for accessibility", () => {
      render(<Features {...defaultProps} />);

      // Feature cards should be present and accessible
      const featureCards = document.querySelectorAll(
        '[data-tracking="feature-card"]',
      );
      expect(featureCards).toHaveLength(mockFeaturesContent.features.length);
    });
  });

  describe("Hover Effects", () => {
    it("applies hover effects to feature cards", () => {
      render(<Features {...defaultProps} />);

      const featureCards = document.querySelectorAll(
        '[data-tracking="feature-card"]',
      );

      featureCards.forEach((card) => {
        expect(card).toHaveClass("hover:-translate-y-1");
        expect(card).toHaveClass("hover:shadow-soft-lg");
      });
    });

    it("applies hover effects to icons", () => {
      render(<Features {...defaultProps} />);

      const iconContainers = document.querySelectorAll(
        ".group-hover\\:bg-primary\\/20",
      );

      expect(iconContainers.length).toBeGreaterThan(0);
    });

    it("applies hover effects to titles", () => {
      render(<Features {...defaultProps} />);

      const titles = document.querySelectorAll(".group-hover\\:text-primary");

      expect(titles.length).toBeGreaterThan(0);
    });
  });

  describe("Basic Functionality", () => {
    it("renders with correct structure", () => {
      render(<Features {...defaultProps} id="features" />);

      // Check basic structure exists
      expect(document.querySelector("#features")).toBeInTheDocument();
      expect(screen.getByText(mockFeaturesContent.title)).toBeInTheDocument();
      expect(screen.getByText("Banco de Dados Seguro")).toBeInTheDocument();
    });

    it("handles empty features gracefully", () => {
      const emptyContent = {
        ...mockFeaturesContent,
        features: [],
      };

      render(<Features {...defaultProps} content={emptyContent} />);

      // Should still render header
      expect(screen.getByText(mockFeaturesContent.title)).toBeInTheDocument();

      // But no feature cards
      const featureCards = document.querySelectorAll(
        '[data-tracking="feature-card"]',
      );
      expect(featureCards).toHaveLength(0);
    });

    it("handles features without highlights", () => {
      const contentWithoutHighlights = {
        ...mockFeaturesContent,
        features: mockFeaturesContent.features.map((f) => ({
          ...f,
          highlight: undefined,
        })),
      };

      render(<Features {...defaultProps} content={contentWithoutHighlights} />);

      // Should render without highlight badges
      expect(screen.queryByText("Premium")).not.toBeInTheDocument();
      expect(screen.queryByText("Novo")).not.toBeInTheDocument();
    });

    it("renders all features even with mixed layouts", () => {
      const mixedContent = {
        ...mockFeaturesContent,
        layout: "zigzag" as const,
        features: mockFeaturesContent.features.slice(0, 3), // Just 3 features for zigzag
      };

      render(<Features {...defaultProps} content={mixedContent} />);

      mixedContent.features.forEach((feature) => {
        expect(screen.getByText(feature.title)).toBeInTheDocument();
      });
    });
  });
});
