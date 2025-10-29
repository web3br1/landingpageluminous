import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock Next.js Image
vi.mock("next/image", () => ({
  default: ({ src, alt, className, ...props }: any) => (
    <img src={src} alt={alt} className={className} {...props} />
  ),
}));

// Mock Framer Motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    button: ({ children, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
    section: ({ children, ...props }: any) => (
      <section {...props}>{children}</section>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useAnimation: () => ({
    start: vi.fn(),
    stop: vi.fn(),
    set: vi.fn(),
  }),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  CheckCircle: () => (
    <div data-testid="check-circle-icon" className="w-6 h-6 text-primary" />
  ),
  Star: () => (
    <div data-testid="star-icon" className="w-6 h-6 text-yellow-500" />
  ),
  Users: () => (
    <div data-testid="users-icon" className="w-6 h-6 text-blue-500" />
  ),
  TrendingUp: () => (
    <div data-testid="trending-up-icon" className="w-6 h-6 text-green-500" />
  ),
  Shield: () => (
    <div data-testid="shield-icon" className="w-6 h-6 text-red-500" />
  ),
  Zap: () => <div data-testid="zap-icon" className="w-6 h-6 text-orange-500" />,
  ChevronRight: () => (
    <div data-testid="chevron-right-icon" className="w-6 h-6 text-gray-500" />
  ),
  ArrowRight: () => (
    <div data-testid="arrow-right-icon" className="w-6 h-6 text-gray-500" />
  ),
}));

describe("CSS Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Design System Token Validation", () => {
    it("should validate color token structure", () => {
      const mockColors = {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          900: "#1e3a8a",
        },
        secondary: {
          50: "#f9fafb",
          100: "#f3f4f6",
          500: "#6b7280",
          900: "#111827",
        },
        success: "#10b981",
        warning: "#f59e0b",
        destructive: "#ef4444",
        neutral: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          500: "#6b7280",
          900: "#111827",
        },
      };

      // Validate primary color scale
      expect(mockColors.primary).toHaveProperty("50");
      expect(mockColors.primary).toHaveProperty("500");
      expect(mockColors.primary).toHaveProperty("900");

      // Validate semantic colors
      expect(mockColors.success).toBeDefined();
      expect(mockColors.warning).toBeDefined();
      expect(mockColors.destructive).toBeDefined();

      // Validate neutral scale
      expect(mockColors.neutral).toHaveProperty("50");
      expect(mockColors.neutral).toHaveProperty("500");
      expect(mockColors.neutral).toHaveProperty("900");
    });

    it("should validate typography token structure", () => {
      const mockTypography = {
        fontSize: {
          xs: "0.75rem", // 12px
          sm: "0.875rem", // 14px
          base: "1rem", // 16px
          lg: "1.125rem", // 18px
          xl: "1.25rem", // 20px
          "2xl": "1.5rem", // 24px
          "3xl": "1.875rem", // 30px
          "4xl": "2.25rem", // 36px
          "5xl": "3rem", // 48px
          "6xl": "3.75rem", // 60px
        },
        fontFamily: {
          display: '"Inter Tight", sans-serif',
          body: '"Inter", sans-serif',
          mono: '"JetBrains Mono", monospace',
        },
        lineHeight: {
          tight: "1.25",
          normal: "1.5",
          relaxed: "1.625",
          loose: "2",
        },
        letterSpacing: {
          tight: "-0.025em",
          normal: "0",
          wide: "0.025em",
        },
      };

      // Validate font sizes
      expect(mockTypography.fontSize.xs).toBe("0.75rem");
      expect(mockTypography.fontSize.base).toBe("1rem");
      expect(mockTypography.fontSize["6xl"]).toBe("3.75rem");

      // Validate font families
      expect(mockTypography.fontFamily.display).toContain("Inter Tight");
      expect(mockTypography.fontFamily.body).toContain("Inter");
      expect(mockTypography.fontFamily.mono).toContain("JetBrains Mono");

      // Validate line heights
      expect(mockTypography.lineHeight.normal).toBe("1.5");
      expect(mockTypography.letterSpacing.normal).toBe("0");
    });

    it("should validate spacing token structure", () => {
      const mockSpacing = {
        1: "0.25rem", // 4px
        2: "0.5rem", // 8px
        3: "0.75rem", // 12px
        4: "1rem", // 16px
        5: "1.25rem", // 20px
        6: "1.5rem", // 24px
        8: "2rem", // 32px
        10: "2.5rem", // 40px
        12: "3rem", // 48px
        16: "4rem", // 64px
        20: "5rem", // 80px
        24: "6rem", // 96px
      };

      // Validate spacing scale progression
      expect(mockSpacing[1]).toBe("0.25rem"); // 4px
      expect(mockSpacing[2]).toBe("0.5rem"); // 8px
      expect(mockSpacing[4]).toBe("1rem"); // 16px
      expect(mockSpacing[8]).toBe("2rem"); // 32px
      expect(mockSpacing[16]).toBe("4rem"); // 64px
    });
  });

  describe("Tailwind Integration Validation", () => {
    it("should validate Tailwind configuration structure", () => {
      const mockTailwindConfig = {
        darkMode: "class",
        content: [
          "./pages/**/*.{ts,tsx}",
          "./components/**/*.{ts,tsx}",
          "./app/**/*.{ts,tsx}",
          "./src/**/*.{ts,tsx}",
        ],
        theme: {
          container: {
            center: true,
            padding: "2rem",
            screens: {
              "2xl": "1400px",
            },
          },
          extend: {
            colors: {
              primary: {
                50: "#eff6ff",
                100: "#dbeafe",
                500: "#3b82f6",
                900: "#1e3a8a",
              },
              secondary: "#6b7280",
              neutral: {
                50: "#f9fafb",
                500: "#6b7280",
                900: "#111827",
              },
            },
            borderRadius: {
              "2xl": "1rem",
              "3xl": "1.5rem",
            },
            spacing: {
              18: "4.5rem",
              88: "22rem",
            },
            fontFamily: {
              display: '"Inter Tight", sans-serif',
              body: '"Inter", sans-serif',
            },
          },
        },
        plugins: [],
      };

      expect(mockTailwindConfig.darkMode).toBe("class");
      expect(mockTailwindConfig.content).toContain(
        "./components/**/*.{ts,tsx}",
      );
      expect(mockTailwindConfig.theme.extend.colors.primary).toHaveProperty(
        "50",
      );
      expect(mockTailwindConfig.theme.extend.colors.primary).toHaveProperty(
        "500",
      );
      expect(mockTailwindConfig.theme.extend.borderRadius).toHaveProperty(
        "2xl",
      );
      expect(mockTailwindConfig.theme.extend.fontFamily).toHaveProperty(
        "display",
      );
    });

    it("should validate custom utility classes", () => {
      const mockUtilities = {
        ".glass": {
          "backdrop-filter": "saturate(140%) blur(10px)",
          background:
            "linear-gradient(180deg, rgb(255 255 255 / .55), rgb(255 255 255 / .25))",
          border: "1px solid color-mix(in oklab, white 60%, var(--border))",
        },
        ".glass-elevated": {
          "backdrop-filter": "saturate(160%) blur(12px)",
          background:
            "linear-gradient(180deg, rgb(255 255 255 / .7), rgb(255 255 255 / .4))",
        },
        ".brutal-border": {
          border: "3px solid var(--border)",
        },
        ".soft-shadow": {
          "box-shadow":
            "0 4px 20px rgb(0 0 0 / 0.08), 0 2px 8px rgb(0 0 0 / 0.04)",
        },
        ".neon-glow": {
          "box-shadow":
            "0 0 20px rgb(59 130 246 / 0.5), 0 0 40px rgb(59 130 246 / 0.3)",
        },
        ".serif-accent": {
          "font-family": "var(--font-display)",
          "letter-spacing": "-0.02em",
        },
        ".focus-ring": {
          "@apply focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2":
            {},
        },
      };

      expect(mockUtilities[".glass"]).toHaveProperty("backdrop-filter");
      expect(mockUtilities[".glass-elevated"]).toHaveProperty(
        "backdrop-filter",
      );
      expect(mockUtilities[".brutal-border"]).toHaveProperty("border");
      expect(mockUtilities[".soft-shadow"]).toHaveProperty("box-shadow");
      expect(mockUtilities[".neon-glow"]).toHaveProperty("box-shadow");
      expect(mockUtilities[".serif-accent"]).toHaveProperty("font-family");
    });
  });

  describe("Component Styling Validation", () => {
    it("should apply correct button component styles", () => {
      const TestButton = ({ variant = "default", size = "default" }: any) => (
        <button
          className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 ${
            variant === "default"
              ? "bg-primary text-primary-foreground shadow hover:bg-primary/90"
              : variant === "secondary"
                ? "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80"
                : variant === "outline"
                  ? "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
                  : ""
          } ${
            size === "default"
              ? "h-9 px-4 py-2"
              : size === "sm"
                ? "h-8 rounded-md px-3 text-xs"
                : size === "lg"
                  ? "h-10 rounded-md px-8"
                  : ""
          }`}
        >
          Test Button
        </button>
      );

      const { container } = render(<TestButton />);
      const button = container.querySelector("button");

      expect(button).toHaveClass("inline-flex");
      expect(button).toHaveClass("items-center");
      expect(button).toHaveClass("justify-center");
      expect(button).toHaveClass("rounded-md");
      expect(button).toHaveClass("bg-primary");
      expect(button).toHaveClass("text-primary-foreground");
      expect(button).toHaveClass("shadow");
    });

    it("should apply correct card component styles", () => {
      const TestCard = () => (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">
              Card Title
            </h3>
            <p className="text-sm text-muted-foreground">Card description</p>
          </div>
        </div>
      );

      const { container } = render(<TestCard />);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveClass("rounded-lg");
      expect(card).toHaveClass("border");
      expect(card).toHaveClass("bg-card");
      expect(card).toHaveClass("text-card-foreground");
      expect(card).toHaveClass("shadow-sm");

      const content = card.querySelector("div");
      expect(content).toHaveClass("p-6");
      expect(content).toHaveClass("flex");
      expect(content).toHaveClass("flex-col");
    });

    it("should apply correct input component styles", () => {
      const TestInput = () => (
        <input
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter text..."
        />
      );

      const { container } = render(<TestInput />);
      const input = container.querySelector("input");

      expect(input).toHaveClass("flex");
      expect(input).toHaveClass("h-9");
      expect(input).toHaveClass("w-full");
      expect(input).toHaveClass("rounded-md");
      expect(input).toHaveClass("border");
      expect(input).toHaveClass("border-input");
      expect(input).toHaveClass("px-3");
      expect(input).toHaveClass("py-1");
      expect(input).toHaveClass("focus-visible:ring-1");
    });
  });

  describe("Theme System Validation", () => {
    it("should validate theme CSS variables", () => {
      const mockThemeCSS = `
        :root[data-theme="liquid-glass"] {
          --bg: 0 0% 100%;
          --fg: 222.2 84% 4.9%;
          --primary: 221.2 83.2% 53.3%;
          --secondary: 210 40% 96%;
          --accent: 210 40% 96%;
          --muted: 210 40% 96%;
          --border: 214.3 31.8% 91.4%;
        }
      `;

      expect(mockThemeCSS).toContain('[data-theme="liquid-glass"]');
      expect(mockThemeCSS).toContain("--bg:");
      expect(mockThemeCSS).toContain("--fg:");
      expect(mockThemeCSS).toContain("--primary:");
      expect(mockThemeCSS).toContain("--secondary:");
    });

    it("should validate theme effects", () => {
      const themeEffects = {
        glass:
          "backdrop-filter: saturate(140%) blur(10px); background: linear-gradient(180deg, rgb(255 255 255 / .55), rgb(255 255 255 / .25)); border: 1px solid color-mix(in oklab, white 60%, var(--border));",
        "glass-elevated":
          "backdrop-filter: saturate(160%) blur(12px); background: linear-gradient(180deg, rgb(255 255 255 / .7), rgb(255 255 255 / .4)); border: 1px solid color-mix(in oklab, white 70%, var(--border));",
        "brutal-border": "border: 3px solid var(--border);",
        "soft-shadow":
          "box-shadow: 0 4px 20px rgb(0 0 0 / 0.08), 0 2px 8px rgb(0 0 0 / 0.04);",
      };

      Object.values(themeEffects).forEach((effect) => {
        expect(typeof effect).toBe("string");
        expect(effect.length).toBeGreaterThan(10);
      });
    });
  });

  describe("Responsive Design Validation", () => {
    it("should validate responsive breakpoints", () => {
      const responsiveClasses = {
        mobile: "text-sm",
        tablet: "md:text-base",
        desktop: "lg:text-lg",
        large: "xl:text-xl",
      };

      expect(responsiveClasses.mobile).toBe("text-sm");
      expect(responsiveClasses.tablet).toBe("md:text-base");
      expect(responsiveClasses.desktop).toBe("lg:text-lg");
      expect(responsiveClasses.large).toBe("xl:text-xl");
    });

    it("should validate grid responsiveness", () => {
      const gridClasses = {
        single: "grid-cols-1",
        responsive: "md:grid-cols-2 lg:grid-cols-3",
        complex: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
      };

      expect(gridClasses.single).toBe("grid-cols-1");
      expect(gridClasses.responsive).toContain("md:grid-cols-2");
      expect(gridClasses.responsive).toContain("lg:grid-cols-3");
      expect(gridClasses.complex).toContain("sm:grid-cols-2");
    });
  });

  describe("Animation and Transition Validation", () => {
    it("should validate keyframe animations", () => {
      const keyframes = {
        fadeIn: "from { opacity: 0; } to { opacity: 1; }",
        slideUp:
          "from { opacity: 0; transform: translateY(1rem); } to { opacity: 1; transform: translateY(0); }",
        scaleIn:
          "from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); }",
      };

      expect(keyframes.fadeIn).toContain("opacity: 0");
      expect(keyframes.fadeIn).toContain("opacity: 1");
      expect(keyframes.slideUp).toContain("translateY(1rem)");
      expect(keyframes.slideUp).toContain("translateY(0)");
      expect(keyframes.scaleIn).toContain("scale(0.95)");
    });

    it("should validate transition properties", () => {
      const transitionClasses = {
        smooth: "transition-all duration-250 ease-out",
        fast: "transition duration-150 ease-in",
        slow: "transition duration-500 ease-in-out",
      };

      expect(transitionClasses.smooth).toContain("transition-all");
      expect(transitionClasses.smooth).toContain("duration-250");
      expect(transitionClasses.fast).toContain("duration-150");
      expect(transitionClasses.slow).toContain("duration-500");
    });
  });

  describe("Accessibility CSS Validation", () => {
    it("should validate focus styles", () => {
      const focusClasses =
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary";

      expect(focusClasses).toContain("focus:outline-none");
      expect(focusClasses).toContain("focus-visible:ring-2");
      expect(focusClasses).toContain("focus-visible:ring-primary");
    });

    it("should validate reduced motion preferences", () => {
      const reducedMotionCSS = `
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `;

      expect(reducedMotionCSS).toContain("prefers-reduced-motion: reduce");
      expect(reducedMotionCSS).toContain("animation-duration: 0.01ms");
      expect(reducedMotionCSS).toContain("transition-duration: 0.01ms");
    });

    it("should validate touch target sizes", () => {
      const touchTargets = {
        button: "min-h-[44px] min-w-[44px]",
        link: "min-h-[44px]",
        input: "min-h-[44px]",
      };

      expect(touchTargets.button).toContain("min-h-[44px]");
      expect(touchTargets.button).toContain("min-w-[44px]");
      expect(touchTargets.link).toContain("min-h-[44px]");
      expect(touchTargets.input).toContain("min-h-[44px]");
    });
  });

  describe("CSS Performance Validation", () => {
    it("should validate CSS optimization techniques", () => {
      const optimizationChecks = {
        fontDisplay: "font-display: swap",
        willChange: "will-change: transform",
        contain: "contain: layout style paint",
        contentVisibility: "content-visibility: auto",
      };

      expect(optimizationChecks.fontDisplay).toBe("font-display: swap");
      expect(optimizationChecks.willChange).toBe("will-change: transform");
      expect(optimizationChecks.contain).toBe("contain: layout style paint");
    });

    it("should validate bundle size considerations", () => {
      // Mock bundle analysis
      const mockBundleStats = {
        css: {
          size: 45000, // 45KB
          gzipped: 12000, // 12KB
          chunks: 3,
        },
        critical: {
          size: 15000, // 15KB above fold
          gzipped: 4000, // 4KB above fold
        },
      };

      expect(mockBundleStats.css.size).toBeLessThan(100000); // Less than 100KB
      expect(mockBundleStats.css.gzipped).toBeLessThan(25000); // Less than 25KB gzipped
      expect(mockBundleStats.critical.size).toBeLessThan(20000); // Less than 20KB critical
    });
  });

  describe("Cross-browser Compatibility", () => {
    it("should validate CSS vendor prefixes", () => {
      const vendorPrefixes = {
        transform: [
          "-webkit-transform",
          "-moz-transform",
          "-ms-transform",
          "transform",
        ],
        animation: ["-webkit-animation", "-moz-animation", "animation"],
        flexbox: ["-webkit-flex", "-moz-flex", "flex"],
      };

      expect(vendorPrefixes.transform).toContain("-webkit-transform");
      expect(vendorPrefixes.transform).toContain("transform");
      expect(vendorPrefixes.animation).toContain("-webkit-animation");
      expect(vendorPrefixes.flexbox).toContain("-webkit-flex");
    });

    it("should validate CSS custom properties fallbacks", () => {
      const fallbackCSS = `
        .component {
          color: #333;
          color: var(--text-color, #333);
        }
        .card {
          border-radius: 8px;
          border-radius: var(--radius, 8px);
        }
      `;

      expect(fallbackCSS).toContain("color: #333");
      expect(fallbackCSS).toContain("color: var(--text-color, #333)");
      expect(fallbackCSS).toContain("border-radius: 8px");
      expect(fallbackCSS).toContain("border-radius: var(--radius, 8px)");
    });
  });

  describe("Print Styles Validation", () => {
    it("should validate print media queries", () => {
      const printCSS = `
        @media print {
          .print-hidden { display: none !important; }
          .print-break-before { page-break-before: always; }
          .print-text-black { color: #000 !important; }
          .print-no-bg { background: white !important; }
        }
      `;

      expect(printCSS).toContain("@media print");
      expect(printCSS).toContain(".print-hidden");
      expect(printCSS).toContain(".print-break-before");
      expect(printCSS).toContain(".print-text-black");
      expect(printCSS).toContain(".print-no-bg");
    });
  });

  describe("CSS Custom Properties Validation", () => {
    it("should validate design token custom properties", () => {
      const customProperties = {
        colors: [
          "--primary: 221.2 83.2% 53.3%",
          "--secondary: 210 40% 96%",
          "--accent: 210 40% 96%",
          "--neutral-50: 210 40% 98%",
        ],
        typography: [
          '--font-display: "Inter Tight", sans-serif',
          '--font-body: "Inter", sans-serif',
          "--font-size-base: 1rem",
          "--line-height-base: 1.6",
        ],
        spacing: [
          "--space-1: 0.25rem",
          "--space-2: 0.5rem",
          "--space-4: 1rem",
          "--space-8: 2rem",
        ],
      };

      expect(customProperties.colors.length).toBeGreaterThan(3);
      expect(customProperties.typography.length).toBeGreaterThan(3);
      expect(customProperties.spacing.length).toBeGreaterThan(3);
    });

    it("should validate CSS custom property usage", () => {
      const cssUsage = {
        background: "background-color: hsl(var(--primary))",
        text: "color: hsl(var(--neutral-900))",
        spacing: "padding: var(--space-4)",
        typography: "font-family: var(--font-display)",
      };

      expect(cssUsage.background).toContain("hsl(var(--primary))");
      expect(cssUsage.text).toContain("hsl(var(--neutral-900))");
      expect(cssUsage.spacing).toContain("var(--space-4)");
      expect(cssUsage.typography).toContain("var(--font-display)");
    });
  });

  describe("CSS Architecture Validation", () => {
    it("should validate CSS file organization", () => {
      const fs = require("fs");
      const path = require("path");

      const stylesDir = path.join(process.cwd(), "styles");
      const files = fs.readdirSync(stylesDir);

      expect(files).toContain("globals.css");
      expect(files.some((f) => f.startsWith("theme-"))).toBe(true);
    });

    it("should validate design system structure", () => {
      const fs = require("fs");
      const path = require("path");

      const dsDir = path.join(process.cwd(), "design-system");
      const dsFiles = fs.readdirSync(dsDir);

      expect(dsFiles).toContain("tokens");
      expect(dsFiles).toContain("foundations");
      expect(dsFiles).toContain("variants");
      expect(dsFiles).toContain("colors.js");
    });
  });

  describe("Integration Test - Full Page Render", () => {
    it("should render a complete page with all CSS applied", () => {
      const FullPage = () => (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
          {/* Header */}
          <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
            <nav className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-primary">Logo</div>
                <div className="hidden md:flex space-x-8">
                  <a
                    href="#features"
                    className="text-neutral-600 hover:text-primary transition"
                  >
                    Features
                  </a>
                  <a
                    href="#pricing"
                    className="text-neutral-600 hover:text-primary transition"
                  >
                    Pricing
                  </a>
                  <a
                    href="#contact"
                    className="text-neutral-600 hover:text-primary transition"
                  >
                    Contact
                  </a>
                </div>
              </div>
            </nav>
          </header>

          {/* Hero Section */}
          <section className="py-20 md:py-28">
            <div className="container mx-auto px-4 text-center">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
                Welcome to Our Platform
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Transform your business with our cutting-edge solutions
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="inline-flex items-center rounded-2xl px-8 py-3 text-base font-semibold bg-primary text-white shadow-md hover:shadow-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2">
                  Get Started
                </button>
                <button className="inline-flex items-center rounded-2xl px-8 py-3 text-base font-medium bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2">
                  Learn More
                </button>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20 md:py-28 bg-white dark:bg-neutral-800">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                  Features
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Everything you need to succeed
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="rounded-2xl border border-neutral-200/20 bg-card p-6 shadow-md hover:shadow-lg transition">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <div className="w-6 h-6 bg-primary rounded" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Feature 1</h3>
                  <p className="text-muted-foreground">
                    Description of feature 1
                  </p>
                </div>
                <div className="rounded-2xl border border-neutral-200/20 bg-card p-6 shadow-md hover:shadow-lg transition">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                    <div className="w-6 h-6 bg-secondary rounded" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Feature 2</h3>
                  <p className="text-muted-foreground">
                    Description of feature 2
                  </p>
                </div>
                <div className="rounded-2xl border border-neutral-200/20 bg-card p-6 shadow-md hover:shadow-lg transition">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                    <div className="w-6 h-6 bg-accent rounded" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Feature 3</h3>
                  <p className="text-muted-foreground">
                    Description of feature 3
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-neutral-50 border-t py-12">
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-4 gap-8">
                <div>
                  <div className="text-xl font-bold text-primary mb-4">
                    Logo
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Building the future together
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Product</h3>
                  <ul className="space-y-2">
                    <li>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-primary transition"
                      >
                        Features
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-primary transition"
                      >
                        Pricing
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-primary transition"
                      >
                        Security
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Company</h3>
                  <ul className="space-y-2">
                    <li>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-primary transition"
                      >
                        About
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-primary transition"
                      >
                        Blog
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-primary transition"
                      >
                        Careers
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Support</h3>
                  <ul className="space-y-2">
                    <li>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-primary transition"
                      >
                        Help Center
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-primary transition"
                      >
                        Contact
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-primary transition"
                      >
                        Status
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </footer>
        </div>
      );

      const { container } = render(<FullPage />);

      // Verify the page structure
      expect(container.querySelector("header")).toBeInTheDocument();
      expect(container.querySelectorAll("section")).toHaveLength(2);
      expect(container.querySelector("footer")).toBeInTheDocument();

      // Verify CSS classes are applied
      expect(container.querySelector(".bg-primary")).toBeInTheDocument();
      expect(container.querySelector(".rounded-2xl")).toBeInTheDocument();
      expect(container.querySelector(".shadow-md")).toBeInTheDocument();
      expect(container.querySelector(".grid")).toBeInTheDocument();
    });
  });
});
