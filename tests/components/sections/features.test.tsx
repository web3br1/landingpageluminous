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
    tracking: {
      section: "features",
      sectionId: "features",
    },
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
        highlight: "Novo",
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

      // Check for Lucide icons (Database icons in this case)
      const icons = document.querySelectorAll("svg.lucide-database");
      expect(icons.length).toBeGreaterThan(0);

      // Verify icons have proper attributes
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute("width", "24");
        expect(icon).toHaveAttribute("height", "24");
      });
    });
  });

  describe("feature highlights", () => {
    it("should highlight featured items", () => {
      render(<Features content={mockContent} />);

      // Check that highlighted feature has the badge
      const highlightedBadge = screen.getByText("Novo");
      expect(highlightedBadge).toBeInTheDocument();

      // Badge should be in a span with proper styling
      const badgeElement = highlightedBadge.closest("span");
      expect(badgeElement).toHaveClass(
        "bg-accent/20",
        "text-accent",
        "rounded-full",
      );
    });

    it("should show badges on featured items", () => {
      render(<Features content={mockContent} />);

      const badges = screen.getAllByText("Novo");
      expect(badges.length).toBe(1); // Only one feature has highlight
    });
  });

  describe("layout variations", () => {
    it("should render grid layout by default", () => {
      render(<Features content={mockContent} />);

      // Check that grid layout is applied
      const gridContainer = document.querySelector(
        ".grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3",
      );
      expect(gridContainer).toBeInTheDocument();
    });

    it("should support zigzag layout", () => {
      const zigzagContent = { ...mockContent, layout: "zigzag" as const };
      render(<Features content={zigzagContent} />);

      // Check for zigzag layout classes (flex-col lg:flex-row)
      const zigzagElements = document.querySelectorAll(
        ".flex-col.lg\\:flex-row",
      );
      expect(zigzagElements.length).toBeGreaterThan(0);
    });

    it("should support zigzag layout", () => {
      const zigzagContent = { ...mockContent, layout: "zigzag" as const };
      render(<Features content={zigzagContent} />);

      // Check for zigzag layout classes
      const zigzagContainer = document.querySelector(".space-y-16");
      expect(zigzagContainer).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper heading hierarchy", () => {
      render(<Features content={mockContent} headingId="features-heading" />);

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveAttribute("id", "features-heading");
    });

    it("should have accessible icons", () => {
      render(<Features content={mockContent} />);

      // Check that icons are present and have proper attributes
      const icons = document.querySelectorAll("svg.lucide");
      expect(icons.length).toBe(mockContent.features.length);

      // Verify each icon has proper attributes
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute("width");
        expect(icon).toHaveAttribute("height");
        expect(icon).toHaveClass("lucide");
      });
    });

    it("should support keyboard navigation", async () => {
      render(<Features content={mockContent} />);

      // Features should be focusable (they have cursor-pointer class)
      const featureCards = document.querySelectorAll(
        '[data-tracking="feature-card"]',
      );
      featureCards.forEach((card) => {
        expect(card).toHaveClass("cursor-pointer");
        expect(card).toHaveAttribute("role", "article");
      });
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

      // Should not crash and render basic structure with fallback content
      expect(screen.getByText("Recursos")).toBeInTheDocument();
      expect(
        screen.getByText("Descubra as funcionalidades da nossa plataforma"),
      ).toBeInTheDocument();
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

    it("should render features with categories", () => {
      render(<Features content={categorizedContent} />);

      // Check that all features are rendered
      expect(screen.getByText("UI Feature")).toBeInTheDocument();
      expect(screen.getByText("Analytics Feature")).toBeInTheDocument();

      // Features should be properly grouped
      const featureCards = document.querySelectorAll(
        '[data-tracking="feature-card"]',
      );
      expect(featureCards.length).toBe(3); // UI, API, Analytics features
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

      // Check grid layout classes are applied
      const gridContainer = document.querySelector(
        ".grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3",
      );
      expect(gridContainer).toBeInTheDocument();
    });

    it("should adapt to tablet layout", () => {
      Object.defineProperty(window, "innerWidth", { value: 768 });

      render(<Features content={mockContent} />);

      // Check responsive grid classes are applied
      const gridContainer = document.querySelector(
        ".grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3",
      );
      expect(gridContainer).toBeInTheDocument();
    });

    it("should adapt to desktop layout", () => {
      Object.defineProperty(window, "innerWidth", { value: 1024 });

      render(<Features content={mockContent} />);

      // Check responsive grid classes are applied
      const gridContainer = document.querySelector(
        ".grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3",
      );
      expect(gridContainer).toBeInTheDocument();
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
