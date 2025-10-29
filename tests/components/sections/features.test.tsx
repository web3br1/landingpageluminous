// Unit Tests for Features Component - Semana 4 Implementation
// Tests features section rendering and interactions with comprehensive coverage
// Target: 15+ test cases covering all critical features functionality

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Features } from "@/components/sections/features/features";
import type { FeaturesContent } from "@/domains/marketing";

// Mock Next.js Image component
vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: Record<string, unknown>) => (
    <img src={src as string} alt={alt as string} {...props} />
  ),
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock utils
vi.mock("@/lib/utils", () => ({
  cn: (...classes: (string | undefined | null | boolean)[]) =>
    classes.filter(Boolean).join(" "),
}));

describe("Features Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockContent: FeaturesContent = {
    title: "Recursos Poderosos",
    subtitle: "Tudo que você precisa para ter sucesso",
    layout: "grid",
    features: [
      {
        title: "Dashboard Intuitivo",
        description: "Interface amigável e fácil de usar",
        icon: "📊",
        category: "interface",
        badge: "Novo",
      },
      {
        title: "Relatórios Automáticos",
        description: "Gere relatórios automaticamente",
        icon: "📈",
        category: "automation",
        highlight: true,
      },
    ],
  };

  describe("basic rendering", () => {
    it("should render features section with title and subtitle", () => {
      render(<Features content={mockContent} />);

      expect(screen.getByText("Recursos Poderosos")).toBeInTheDocument();
      expect(
        screen.getByText("Tudo que você precisa para ter sucesso"),
      ).toBeInTheDocument();
    });

    it("should render all features", () => {
      render(<Features content={mockContent} />);

      expect(screen.getByText("Dashboard Intuitivo")).toBeInTheDocument();
      expect(screen.getByText("Relatórios Automáticos")).toBeInTheDocument();
      expect(
        screen.getByText("Interface amigável e fácil de usar"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Gere relatórios automaticamente"),
      ).toBeInTheDocument();
    });

    it("should render feature icons", () => {
      render(<Features content={mockContent} />);

      expect(screen.getByText("📊")).toBeInTheDocument();
      expect(screen.getByText("📈")).toBeInTheDocument();
    });
  });

  describe("feature highlights", () => {
    it("should highlight featured items", () => {
      render(<Features content={mockContent} />);

      const highlightedFeature = screen
        .getByText("Relatórios Automáticos")
        .closest("[data-highlight]");
      expect(highlightedFeature).toHaveAttribute("data-highlight", "true");
    });

    it("should show badges on featured items", () => {
      render(<Features content={mockContent} />);

      expect(screen.getByText("Novo")).toBeInTheDocument();
    });
  });

  describe("layout variations", () => {
    it("should render grid layout by default", () => {
      render(<Features content={mockContent} />);

      const container = screen.getByRole("region");
      expect(container).toHaveClass("grid");
    });

    it("should support zigzag layout", () => {
      const zigzagContent = { ...mockContent, layout: "zigzag" as const };
      render(<Features content={zigzagContent} />);

      const container = screen.getByRole("region");
      expect(container).toHaveAttribute("data-layout", "zigzag");
    });

    it("should support cards layout", () => {
      const cardsContent = { ...mockContent, layout: "cards" as const };
      render(<Features content={cardsContent} />);

      const container = screen.getByRole("region");
      expect(container).toHaveAttribute("data-layout", "cards");
    });
  });

  describe("accessibility", () => {
    it("should have proper heading hierarchy", () => {
      render(<Features content={mockContent} headingId="features-heading" />);

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveAttribute("id", "features-heading");
    });

    it("should have descriptive alt text for icons", () => {
      render(<Features content={mockContent} />);

      const icons = screen.getAllByRole("img");
      expect(icons[0]).toHaveAttribute("alt", "Dashboard Intuitivo icon");
      expect(icons[1]).toHaveAttribute("alt", "Relatórios Automáticos icon");
    });

    it("should be keyboard navigable", async () => {
      const user = userEvent.setup();
      render(<Features content={mockContent} />);

      const firstFeature = screen.getByText("Dashboard Intuitivo");
      await user.tab();
      expect(firstFeature).toHaveFocus();
    });
  });

  describe("empty states", () => {
    it("should handle empty features array", () => {
      const emptyContent = { ...mockContent, features: [] };
      render(<Features content={emptyContent} />);

      expect(screen.getByText("Recursos Poderosos")).toBeInTheDocument();
      expect(screen.queryByText("Dashboard Intuitivo")).not.toBeInTheDocument();
    });

    it("should handle undefined content gracefully", () => {
      render(<Features content={{} as any} />);

      // Should not crash and render basic structure
      expect(screen.getByRole("region")).toBeInTheDocument();
    });
  });

  describe("categories and filtering", () => {
    const categorizedContent: FeaturesContent = {
      ...mockContent,
      features: [
        { title: "UI Feature", category: "interface", icon: "🎨" },
        { title: "API Feature", category: "api", icon: "🔗" },
        { title: "Analytics Feature", category: "analytics", icon: "📊" },
      ],
    };

    it("should group features by category", () => {
      render(<Features content={categorizedContent} />);

      expect(screen.getByText("UI Feature")).toBeInTheDocument();
      expect(screen.getByText("API Feature")).toBeInTheDocument();
      expect(screen.getByText("Analytics Feature")).toBeInTheDocument();
    });

    it("should apply category-specific styling", () => {
      render(<Features content={categorizedContent} />);

      const uiFeature = screen
        .getByText("UI Feature")
        .closest("[data-category]");
      expect(uiFeature).toHaveAttribute("data-category", "interface");
    });
  });

  describe("performance", () => {
    it("should render without performance warnings", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      render(<Features content={mockContent} />);

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should handle large feature lists efficiently", () => {
      const largeContent = {
        ...mockContent,
        features: Array.from({ length: 20 }, (_, i) => ({
          title: `Feature ${i + 1}`,
          description: `Description ${i + 1}`,
          icon: "⭐",
        })),
      };

      const startTime = performance.now();
      render(<Features content={largeContent} />);
      const endTime = performance.now();

      // Should render in reasonable time (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe("responsive behavior", () => {
    it("should adapt to mobile layout", () => {
      // Mock mobile viewport
      Object.defineProperty(window, "innerWidth", { value: 375 });

      render(<Features content={mockContent} />);

      const container = screen.getByRole("region");
      expect(container).toHaveClass("grid-cols-1"); // Mobile: single column
    });

    it("should adapt to tablet layout", () => {
      Object.defineProperty(window, "innerWidth", { value: 768 });

      render(<Features content={mockContent} />);

      const container = screen.getByRole("region");
      expect(container).toHaveClass("md:grid-cols-2"); // Tablet: two columns
    });

    it("should adapt to desktop layout", () => {
      Object.defineProperty(window, "innerWidth", { value: 1024 });

      render(<Features content={mockContent} />);

      const container = screen.getByRole("region");
      expect(container).toHaveClass("lg:grid-cols-3"); // Desktop: three columns
    });
  });

  describe("interaction handling", () => {
    it("should handle feature clicks", async () => {
      const onFeatureClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Features content={mockContent} onFeatureClick={onFeatureClick} />,
      );

      const feature = screen.getByText("Dashboard Intuitivo");
      await user.click(feature);

      expect(onFeatureClick).toHaveBeenCalledWith(0, mockContent.features[0]);
    });

    it("should handle category filter clicks", async () => {
      const onCategoryClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Features content={mockContent} onCategoryClick={onCategoryClick} />,
      );

      // Assuming there's a category filter button
      const categoryButton = screen.getByText("interface");
      await user.click(categoryButton);

      expect(onCategoryClick).toHaveBeenCalledWith("interface");
    });
  });

  describe("theme integration", () => {
    it("should respect dark mode", () => {
      // Mock dark mode
      document.documentElement.setAttribute("data-theme", "dark");

      render(<Features content={mockContent} />);

      const container = screen.getByRole("region");
      expect(container).toHaveAttribute("data-theme", "dark");
    });

    it("should apply theme-specific styles", () => {
      document.documentElement.setAttribute("data-theme", "light");

      render(<Features content={mockContent} />);

      const container = screen.getByRole("region");
      expect(container).toHaveAttribute("data-theme", "light");
    });
  });
});
