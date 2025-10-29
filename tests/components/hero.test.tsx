import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Hero } from "@/components/sections/hero/hero";
import type { HeroContent } from "@/domains/marketing";

// Mock Next.js Image component
vi.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    priority,
    blurDataURL,
    ...props
  }: Record<string, unknown>) => {
    // Filter out Next.js specific props that cause warnings
    const filteredProps = { ...props };
    delete filteredProps.priority;
    delete filteredProps.blurDataURL;

    return <img src={src as string} alt={alt as string} {...filteredProps} />;
  },
}));

// Mock UI components
vi.mock("@/app/(marketing)/components/ui/cta-button-unified", () => ({
  CTA: ({
    children,
    onClick,
    variant,
    href,
    ...props
  }: {
    children?: React.ReactNode | { text?: string };
    onClick?: () => void;
    variant?: string;
    href?: string;
    [key: string]: unknown;
  }) =>
    React.createElement(
      "button",
      {
        onClick,
        "data-variant": variant,
        "data-href": href,
        ...props,
      },
      (children as { text?: string })?.text || children,
    ),
}));

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
}));

// Mock experiment framework to prevent async state changes
vi.mock("@/lib/ab-testing/ab-testing-framework", () => ({
  experimentManager: {
    loadExperiments: vi.fn().mockResolvedValue(undefined),
    assignVariant: vi.fn().mockReturnValue(null),
    trackEvent: vi.fn(),
  },
}));

// Mock experiment hooks to prevent any async state changes
vi.mock("@/lib/ab-testing/use-experiment", () => ({
  useExperiment: () => ({
    variant: null, // No experiment variant - use default content
    trackEvent: vi.fn(),
    trackConversion: vi.fn(),
    loading: false, // Ensure no loading state changes
    error: null,
    isControl: true,
    experimentId: "hero_test",
  }),
}));

vi.mock("@/lib/analytics/experiment-analytics", () => ({
  trackExperimentEvent: vi.fn(),
}));

// Mock personalization hooks to prevent hydration issues
vi.mock("@/lib/personalization/personalization-context", () => ({
  usePersonalization: () => ({
    activeSegments: [],
    personalizeContent: (content: unknown) => content,
    trackUserAction: vi.fn(),
  }),
  PersonalizationProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

vi.mock("@/lib/hooks/use-feature-flags", () => ({
  useExperiment: () => ({
    variant: null,
    trackEvent: vi.fn(),
    trackConversion: vi.fn(),
    loading: false,
    error: null,
    isControl: true,
    experimentId: "test_experiment",
  }),
  useABContent: () => "Test content",
}));

// Mock utils
vi.mock("@/lib/utils", () => ({
  cn: (...classes: (string | undefined | null | boolean)[]) =>
    classes.filter(Boolean).join(" "),
}));

// Mock analytics to prevent interference with tests
vi.mock("@/lib/analytics/experiment-analytics", () => ({
  trackExperimentEvent: vi.fn(),
}));

// Helper function to render with act
const renderWithAct = async (component: React.ReactElement) => {
  let result: ReturnType<typeof render>;
  await act(async () => {
    result = render(component);
  });
  return result!;
};

describe("Hero Component", () => {
  const mockContent: HeroContent = {
    headline: "Transforme seu negócio com nossa solução",
    subheadline: "Automatize processos e aumente sua produtividade em até 300%",
    primaryCta: "Começar Grátis",
    secondaryCta: "Agendar Demo",
    badge: "Novo: IA integrada",
  };

  // Mock the content to return strings for CTA rendering
  const mockHeroContent = {
    ...mockContent,
    primaryCta: "Começar Grátis",
    secondaryCta: "Agendar Demo",
  };

  const defaultProps = {
    id: "hero",
    headingId: "hero-headline",
    content: mockHeroContent,
    tracking: {
      section: "hero" as const,
      experimentId: "hero_test",
      variant: "default",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders the hero section with correct content", async () => {
      await renderWithAct(<Hero {...defaultProps} />);

      expect(document.querySelector("#hero")).toBeInTheDocument();
      expect(screen.getByText(mockContent.headline)).toBeInTheDocument();
      expect(screen.getByText(mockContent.subheadline)).toBeInTheDocument();
      expect(screen.getByText("Começar Grátis")).toBeInTheDocument();
      expect(screen.getByText("Agendar Demo")).toBeInTheDocument();
    });

    it("renders the badge when provided", async () => {
      await renderWithAct(<Hero {...defaultProps} />);

      expect(screen.getByText(mockContent.badge!)).toBeInTheDocument();
    });

    it("does not render badge when not provided", async () => {
      const contentWithoutBadge = { ...mockContent, badge: undefined };
      await renderWithAct(
        <Hero {...defaultProps} content={contentWithoutBadge} />,
      );

      expect(screen.queryByText(mockContent.badge!)).not.toBeInTheDocument();
    });

    it("renders hero visual preview", async () => {
      await renderWithAct(<Hero {...defaultProps} />);

      // Check for the dashboard preview image
      const previewImage = screen.getByAltText(
        "Dashboard preview do sistema de automação empresarial",
      );
      expect(previewImage).toBeInTheDocument();

      // Check that it's within the visual section
      const visualSection = previewImage.closest(".lg\\:order-last");
      expect(visualSection).toBeInTheDocument();
    });

    it("applies correct CSS classes and data attributes", async () => {
      await renderWithAct(<Hero {...defaultProps} variant="experiment_a" />);

      const section = document.querySelector("#hero");
      expect(section).toHaveAttribute("id", "hero");
      expect(section).toHaveAttribute("data-section", "hero");
      expect(section).toHaveAttribute("data-variant", "experiment_a");
      expect(section).toHaveAttribute("data-experiment-id", "hero_test");
    });
  });

  describe("Interactions", () => {
    it("calls onPrimaryCta when primary CTA is clicked", async () => {
      const mockOnPrimaryCta = vi.fn();
      await renderWithAct(
        <Hero {...defaultProps} onPrimaryCta={mockOnPrimaryCta} />,
      );

      const primaryButton = screen.getByText("Começar Grátis");
      fireEvent.click(primaryButton);

      expect(mockOnPrimaryCta).toHaveBeenCalledTimes(1);
    });

    it("calls onSecondaryCta when secondary CTA is clicked", async () => {
      const mockOnSecondaryCta = vi.fn();
      await renderWithAct(
        <Hero {...defaultProps} onSecondaryCta={mockOnSecondaryCta} />,
      );

      const secondaryButton = screen.getByText("Agendar Demo");
      fireEvent.click(secondaryButton);

      expect(mockOnSecondaryCta).toHaveBeenCalledTimes(1);
    });

    it("does not call handlers when not provided", async () => {
      await renderWithAct(<Hero {...defaultProps} />);

      const primaryButton = screen.getByText("Começar Grátis");
      const secondaryButton = screen.getByText("Agendar Demo");

      expect(() => {
        fireEvent.click(primaryButton);
        fireEvent.click(secondaryButton);
      }).not.toThrow();
    });
  });

  describe("Variants", () => {
    it("applies default variant when not specified", async () => {
      await renderWithAct(<Hero {...defaultProps} />);

      const section = document.querySelector("#hero");
      expect(section).toHaveAttribute("data-variant", "default");
    });

    it("applies custom variant when specified", async () => {
      await renderWithAct(<Hero {...defaultProps} variant="enterprise" />);

      const section = document.querySelector("#hero");
      expect(section).toHaveAttribute("data-variant", "enterprise");
    });
  });

  describe("Accessibility", () => {
    it("has proper heading hierarchy", async () => {
      await renderWithAct(<Hero {...defaultProps} />);

      const headline = screen.getByRole("heading", { level: 1 });
      expect(headline).toBeInTheDocument();
      expect(headline).toHaveAttribute("id", "hero-headline");
    });

    it("has accessible CTA buttons", async () => {
      await renderWithAct(<Hero {...defaultProps} />);

      const primaryButton = screen.getByRole("button", {
        name: /Clique para Começar Grátis/,
      });
      const secondaryButton = screen.getByRole("button", {
        name: /Clique para Agendar Demo/,
      });

      expect(primaryButton).toBeInTheDocument();
      expect(secondaryButton).toBeInTheDocument();
    });
  });

  describe("Basic Functionality", () => {
    it("renders with correct structure", async () => {
      await renderWithAct(<Hero {...defaultProps} />);

      // Check basic structure exists
      expect(document.querySelector("#hero")).toBeInTheDocument();
      expect(screen.getByText(mockContent.headline)).toBeInTheDocument();
      expect(screen.getByText("Começar Grátis")).toBeInTheDocument();
    });
  });
});
