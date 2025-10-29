/**
 * @jest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";

// Mock the theme registry
vi.mock("@/lib/theme/theme-registry", () => ({
  THEME_REGISTRY: {
    "liquid-glass": {
      id: "liquid-glass",
      name: "Liquid Glass",
      description: "Minimal glassmorphism",
      category: "modern",
      tokens: {
        colors: {
          primary: "210 60% 50%",
          secondary: "160 50% 45%",
          accent: "300 60% 55%",
          base: "210 20% 98%",
          contrast: "0 0% 100%",
          warning: "38 92% 50%",
          success: "142 76% 36%",
          error: "0 84.2% 60.2%",
          border: "210 13% 92%",
          surface: "0 0% 100% / 0.7",
          elevated: "0 0% 100% / 0.9",
        },
        typography: {
          family: { display: "Inter Tight", body: "Inter" },
          scale: {},
        },
        spacing: {},
        radius: {},
        shadows: {},
        motion: { duration: {}, easing: {}, distance: "12px" },
      },
      features: {
        glassmorphism: true,
        brutalism: false,
        neon: false,
        serif: false,
        bento: false,
        soft: true,
      },
      performance: { lcp: 2500, inp: 200, cls: 0.1 },
    },
    "neo-brutal": {
      id: "neo-brutal",
      name: "Neo Brutal",
      description: "Bold borders and shadows",
      category: "experimental",
      tokens: {
        colors: {
          primary: "210 60% 50%",
          secondary: "160 50% 45%",
          accent: "35 100% 70%",
          base: "210 20% 98%",
          contrast: "0 0% 100%",
          warning: "38 92% 50%",
          success: "142 76% 36%",
          error: "0 84.2% 60.2%",
          border: "210 10% 42%",
          surface: "0 0% 100%",
          elevated: "0 0% 100%",
        },
        typography: {
          family: { display: "Inter Tight", body: "Inter" },
          scale: {},
        },
        spacing: {},
        radius: {},
        shadows: {},
        motion: { duration: {}, easing: {}, distance: "8px" },
      },
      features: {
        glassmorphism: false,
        brutalism: true,
        neon: false,
        serif: false,
        bento: false,
        soft: false,
      },
      performance: { lcp: 2200, inp: 150, cls: 0.08 },
    },
  },
  getThemePack: (id: string) => {
    const themes = {
      "liquid-glass": {
        id: "liquid-glass",
        name: "Liquid Glass",
        description: "Minimal glassmorphism",
        category: "modern",
        tokens: {
          colors: {
            primary: "210 60% 50%",
            secondary: "160 50% 45%",
            accent: "300 60% 55%",
            base: "210 20% 98%",
            contrast: "0 0% 100%",
            warning: "38 92% 50%",
            success: "142 76% 36%",
            error: "0 84.2% 60.2%",
            border: "210 13% 92%",
            surface: "0 0% 100% / 0.7",
            elevated: "0 0% 100% / 0.9",
          },
          typography: {
            family: { display: "Inter Tight", body: "Inter" },
            scale: {},
          },
          spacing: {},
          radius: {},
          shadows: {},
          motion: { duration: {}, easing: {}, distance: "12px" },
        },
        features: {
          glassmorphism: true,
          brutalism: false,
          neon: false,
          serif: false,
          bento: false,
          soft: true,
        },
        performance: { lcp: 2500, inp: 200, cls: 0.1 },
      },
      "neo-brutal": {
        id: "neo-brutal",
        name: "Neo Brutal",
        description: "Bold borders and shadows",
        category: "experimental",
        tokens: {
          colors: {
            primary: "210 60% 50%",
            secondary: "160 50% 45%",
            accent: "35 100% 70%",
            base: "210 20% 98%",
            contrast: "0 0% 100%",
            warning: "38 92% 50%",
            success: "142 76% 36%",
            error: "0 84.2% 60.2%",
            border: "210 10% 42%",
            surface: "0 0% 100%",
            elevated: "0 0% 100%",
          },
          typography: {
            family: { display: "Inter Tight", body: "Inter" },
            scale: {},
          },
          spacing: {},
          radius: {},
          shadows: {},
          motion: { duration: {}, easing: {}, distance: "8px" },
        },
        features: {
          glassmorphism: false,
          brutalism: true,
          neon: false,
          serif: false,
          bento: false,
          soft: false,
        },
        performance: { lcp: 2200, inp: 150, cls: 0.08 },
      },
    };
    return themes[id as keyof typeof themes] || null;
  },
}));

describe("ThemeSwitcher", () => {
  beforeEach(() => {
    // Reset document
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders with default theme", () => {
    render(<ThemeSwitcher />);
    expect(screen.getByText("Seletor de Temas")).toBeInTheDocument();
  });

  it("displays current theme information", () => {
    render(<ThemeSwitcher currentTheme="liquid-glass" />);
    // Check for the header display
    expect(screen.getByText("Seletor de Temas")).toBeInTheDocument();
    // Check that Liquid Glass appears in the current theme display
    const liquidGlassElements = screen.getAllByText("Liquid Glass");
    expect(liquidGlassElements.length).toBeGreaterThan(0);
  });

  it("shows theme selection buttons", () => {
    render(<ThemeSwitcher />);
    // Check that themes appear in the selection grid
    expect(screen.getAllByText("Liquid Glass").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Neo Brutal").length).toBeGreaterThan(0);
  });

  it("calls onThemeChange when theme is selected", () => {
    const mockOnChange = vi.fn();
    render(<ThemeSwitcher onThemeChange={mockOnChange} />);

    // Find the Neo Brutal button by its title attribute
    const neoBrutalButton = screen.getByTitle(
      "Neo Brutal: Bold borders and shadows",
    );
    fireEvent.click(neoBrutalButton);

    expect(mockOnChange).toHaveBeenCalledWith("neo-brutal");
  });

  it("applies theme to document element", () => {
    render(<ThemeSwitcher currentTheme="liquid-glass" />);

    // Wait for effect to run
    expect(document.documentElement).toHaveAttribute(
      "data-theme",
      "liquid-glass",
    );
  });

  it("renders compact version", () => {
    render(<ThemeSwitcher compact={true} />);

    // Compact version should not have the full title
    expect(screen.queryByText("Seletor de Temas")).not.toBeInTheDocument();
  });

  it("shows preview information when enabled", () => {
    render(<ThemeSwitcher showPreview={true} />);

    expect(
      screen.getByText(/Passe o mouse sobre os temas/),
    ).toBeInTheDocument();
  });
});
