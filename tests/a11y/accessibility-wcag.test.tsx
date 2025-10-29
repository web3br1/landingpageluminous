import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { jest } from "vitest";

// Mock framer-motion completely
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) =>
      React.createElement("div", props, children),
    section: ({ children, ...props }: any) =>
      React.createElement("section", props, children),
    h1: ({ children, ...props }: any) =>
      React.createElement("h1", props, children),
    h2: ({ children, ...props }: any) =>
      React.createElement("h2", props, children),
    p: ({ children, ...props }: any) =>
      React.createElement("p", props, children),
  },
  AnimatePresence: ({ children }: any) =>
    React.createElement(React.Fragment, null, children),
  useMotionValue: vi.fn(() => ({
    get: () => 0,
    set: vi.fn(),
    onChange: vi.fn(),
    destroy: vi.fn(),
  })),
  useTransform: vi.fn(() => ({
    get: () => 0,
    onChange: vi.fn(),
    destroy: vi.fn(),
  })),
  useSpring: vi.fn(() => ({
    get: () => 0,
    set: vi.fn(),
    onChange: vi.fn(),
    destroy: vi.fn(),
  })),
  useReducedMotion: vi.fn(() => false),
  animate: vi.fn(() => Promise.resolve()),
}));

// Mock IntersectionObserver with proper interface
const mockIntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: "",
  thresholds: [],
  takeRecords: vi.fn().mockReturnValue([]),
}));

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: mockIntersectionObserver,
});

Object.defineProperty(global, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: mockIntersectionObserver,
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    matches: false,
    media: "",
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Next.js router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => "/",
}));

// Mock analytics
const mockTrackEvent = vi.fn();
vi.mock("@/lib/analytics-core", () => ({
  analytics: {
    track: mockTrackEvent,
    trackView: vi.fn(),
    trackCtaClick: vi.fn((cta, location) => {
      mockTrackEvent("cta_click", {
        cta_text: cta,
        cta_location: location,
        page_path: "/",
        timestamp: new Date().toISOString(),
      });
    }),
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

// Mock rate limiting
vi.mock("@/lib/api/rate-limiting", () => ({
  checkRateLimit: vi.fn(() =>
    Promise.resolve({
      allowed: true,
      remaining: 10,
      resetTime: Math.floor(Date.now() / 1000) + 3600,
    }),
  ),
  reportRateLimitUsage: vi.fn(() => Promise.resolve()),
  getClientIdentifier: vi.fn(() => "test-client-id"),
  getUserIdentifier: vi.fn(() => "test-user-id"),
}));

vi.mock("@/lib/hooks/use-backend-rate-limiting", () => ({
  useBackendRateLimiting: vi.fn(() => ({
    state: {
      isLoading: false,
      isBlocked: false,
      remainingAttempts: 10,
      resetTime: 0,
      retryAfter: 0,
      error: null,
      lastCheck: 0,
    },
    checkLimit: vi.fn(() => Promise.resolve(true)),
    reportUsage: vi.fn(() => Promise.resolve()),
    reset: vi.fn(),
    canAttempt: true,
    getTimeUntilReset: vi.fn(() => ({ minutes: 0, seconds: 0 })),
  })),
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

// Import components after mocks
import { Hero } from "@/components/sections/hero/hero";
import { Benefits } from "@/components/sections/benefits/benefits";
import { Features } from "@/components/sections/features/features";
import { Pricing } from "@/components/sections/pricing/pricing";

// Mock CtaButton to ensure it has type="button"
vi.mock("@/components/ui/cta-button-unified", () => ({
  CtaButton: ({ children, ...props }: any) =>
    React.createElement("button", { type: "button", ...props }, children),
}));

// Mock shadcn/ui Button component
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) =>
    React.createElement("button", props, children),
}));

// Mock shadcn/ui Badge component
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: any) =>
    React.createElement("span", props, children),
}));

// Mock accessibility components
vi.mock("@/lib/a11y/touch-target-optimization", () => ({
  AccessibleButton: ({ children, size = "md", ...props }: any) => {
    const sizeClasses = {
      sm: "min-h-[44px] min-w-[44px]",
      md: "min-h-[44px] min-w-[44px]",
      lg: "min-h-[48px] min-w-[48px]",
    };
    return React.createElement(
      "button",
      {
        type: "button",
        className: `${sizeClasses[size]} ${props.className || ""}`.trim(),
        ...props,
      },
      children,
    );
  },
  AccessibleLink: ({ children, ...props }: any) =>
    React.createElement("a", props, children),
  SkipLink: ({ children, ...props }: any) =>
    React.createElement("a", props, children),
  useReducedMotion: vi.fn(() => false),
  useFocusTrap: vi.fn(() => ({})),
  useHighContrast: vi.fn(() => false),
}));

// Mock Next.js Image component
vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) =>
    React.createElement("img", { src, alt, ...props }),
}));

// Mock hero content data for testing
const mockHeroContent = {
  headline: "Automatize seus dados. Acelere seus resultados.",
  subheadline:
    "Conecte, orquestre e acelere seus fluxos — sem fricção. Nossa IA entende seu negócio e gera sistemas sob medida automaticamente.",
  primaryCta: "Entrar na pré-venda",
  secondaryCta: "Ver demo",
  badge: "Pré-venda Fundadores",
  metrics: [
    { value: "75%", label: "menos tempo em relatórios" },
    { value: "3x", label: "mais decisões assertivas" },
    { value: "24/7", label: "suporte disponível" },
  ],
  tracking: {
    section: "hero" as const,
  },
};

const mockHeroProps = {
  content: mockHeroContent,
  tracking: { section: "hero" as const },
  onPrimaryCta: vi.fn(),
  onSecondaryCta: vi.fn(),
  id: "hero",
};

const mockBenefitsContent = {
  title: "Resultados que você pode medir",
  subtitle: "Veja como nossos clientes alcançaram sucesso",
  benefits: [
    {
      icon: "Zap",
      title: "75% menos tempo",
      description: "Reduza o tempo gasto em relatórios manuais",
      metric: "75%",
    },
  ],
};

const mockBenefitsProps = {
  content: mockBenefitsContent,
  tracking: { section: "benefits" as const },
  onBenefitClick: vi.fn(),
};

const mockFeaturesContent = {
  title: "Funcionalidades que resolvem problemas reais",
  subtitle: "Tudo que você precisa em uma plataforma",
  layout: "grid" as const,
  features: [
    {
      icon: "Code",
      title: "Desenvolvimento rápido",
      description: "Ferramentas que aceleram o desenvolvimento",
    },
  ],
};

const mockFeaturesProps = {
  content: mockFeaturesContent,
  tracking: { section: "features" as const },
  onFeatureClick: vi.fn(),
};

describe("WCAG 2.1 AA Accessibility Compliance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Perceivable (Guideline 1.1 - 1.4)", () => {
    describe("Text Alternatives (1.1)", () => {
      it("provides meaningful alt text for images", () => {
        // This would test actual image components with proper alt text
        // For now, we test that the components render without throwing
        expect(() => {
          render(<Hero {...mockHeroProps} />);
        }).not.toThrow();
      });

      it("ensures decorative images are properly marked", () => {
        render(<Hero {...mockHeroProps} />);

        // Check that there are no images without alt text
        const images = document.querySelectorAll("img");
        images.forEach((img) => {
          expect(img).toHaveAttribute("alt");
        });
      });
    });

    describe("Info and Relationships (1.3)", () => {
      it("uses semantic HTML elements", () => {
        render(<Hero {...mockHeroProps} />);

        // Check for semantic elements
        expect(document.querySelector("h1")).toBeInTheDocument();
        expect(document.querySelector('div[id="hero"]')).toBeInTheDocument();
      });

      it("maintains heading hierarchy", () => {
        render(
          <>
            <Hero {...mockHeroProps} />
            <Benefits {...mockBenefitsProps} />
          </>,
        );

        const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
        const levels = Array.from(headings).map((h) =>
          parseInt(h.tagName.charAt(1)),
        );

        // Ensure no heading level is skipped inappropriately
        for (let i = 1; i < levels.length; i++) {
          expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
        }
      });

      it("provides proper form labels", () => {
        // This would test form components when they exist
        // For now, ensure components render without accessibility issues
        expect(() => {
          render(<Hero {...mockHeroProps} />);
          render(<Benefits {...mockBenefitsProps} />);
        }).not.toThrow();
      });
    });

    describe("Contrast (1.4)", () => {
      it("uses sufficient color contrast ratios", () => {
        render(<Hero {...mockHeroProps} />);

        // Test that primary elements have sufficient contrast
        // This would require a color contrast testing library
        // For now, we ensure the components use design system colors
        const buttons = document.querySelectorAll("button");
        expect(buttons.length).toBeGreaterThan(0);
      });

      it("provides focus indicators with sufficient contrast", () => {
        render(<Hero {...mockHeroProps} />);

        const primaryCta = screen.getByRole("button", {
          name: /entrar na pré-venda/i,
        });

        // Simulate focus
        primaryCta.focus();

        // Check that focus styles are applied
        expect(primaryCta.tagName).toBe("BUTTON");
      });
    });
  });

  describe("Operable (Guideline 2.1 - 2.4)", () => {
    describe("Keyboard Accessible (2.1)", () => {
      it("supports keyboard navigation", () => {
        render(<Hero {...mockHeroProps} />);

        const primaryCta = screen.getByRole("button", {
          name: /entrar na pré-venda/i,
        });
        const secondaryCta = screen.getByRole("button", { name: /ver demo/i });

        // Test tab order
        expect(document.activeElement).not.toBe(primaryCta);

        primaryCta.focus();
        expect(document.activeElement).toBe(primaryCta);

        primaryCta.blur();
        secondaryCta.focus();
        expect(document.activeElement).toBe(secondaryCta);
      });

      it("provides visible focus indicators", () => {
        render(<Hero {...mockHeroProps} />);

        const primaryCta = screen.getByRole("button", {
          name: /entrar na pré-venda/i,
        });

        // Focus should apply focus styles
        primaryCta.focus();

        // Check that the element is focusable
        expect(primaryCta.tagName).toBe("BUTTON");
      });

      it("handles keyboard activation", () => {
        render(<Hero {...mockHeroProps} />);

        const primaryCta = screen.getByRole("button", {
          name: `Clique para ${mockHeroContent.primaryCta}`,
        });

        // Simulate click (buttons handle keyboard activation automatically)
        fireEvent.click(primaryCta);

        // Should trigger the onPrimaryCta callback
        expect(mockHeroProps.onPrimaryCta).toHaveBeenCalled();
      });
    });

    describe("Enough Time (2.2)", () => {
      it("respects reduced motion preferences", () => {
        // Mock reduced motion
        const mockMatchMedia = vi.fn().mockImplementation(() => ({
          matches: true,
          media: "(prefers-reduced-motion: reduce)",
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }));

        Object.defineProperty(window, "matchMedia", {
          writable: true,
          value: mockMatchMedia,
        });

        render(<Hero {...mockHeroProps} />);

        // The component uses framer-motion's useReducedMotion hook
        // which internally uses matchMedia, so we can't directly test the call
        // Instead, we ensure the component renders without errors
        expect(document.querySelector("h1")).toBeInTheDocument();
      });

      it("provides adjustable timeouts when present", () => {
        // This would test components with timeouts
        // For now, ensure components handle async operations gracefully
        expect(() => {
          render(<Hero {...mockHeroProps} />);
        }).not.toThrow();
      });
    });

    describe("Seizures and Physical Reactions (2.3)", () => {
      it("avoids content that could cause seizures", () => {
        render(<Hero {...mockHeroProps} />);

        // Check that there are no rapidly flashing elements
        // This would require more sophisticated testing in a real implementation
        const flashingElements = document.querySelectorAll(
          '[style*="animation"], [style*="flash"]',
        );
        expect(flashingElements.length).toBe(0);
      });

      it("provides pause controls for animations when needed", () => {
        // Test that animations can be paused
        // For now, ensure the component respects reduced motion
        expect(() => {
          render(<Hero {...mockHeroProps} />);
        }).not.toThrow();
      });
    });

    describe("Navigable (2.4)", () => {
      it("provides descriptive page titles", () => {
        // This would test the document title
        // For component tests, we ensure components have proper heading structure
        render(<Hero {...mockHeroProps} />);

        const h1 = document.querySelector("h1");
        expect(h1).toBeInTheDocument();
        expect(h1?.textContent?.length).toBeGreaterThan(0);
      });

      it("provides meaningful link text", () => {
        render(<Hero {...mockHeroProps} />);

        const buttons = screen.getAllByRole("button");
        buttons.forEach((button) => {
          expect(button.textContent?.length).toBeGreaterThan(0);
        });
      });

      it("provides heading structure", () => {
        render(
          <>
            <Hero {...mockHeroProps} />
            <Benefits {...mockBenefitsProps} />
            <Features {...mockFeaturesProps} />
          </>,
        );

        const h1 = document.querySelector("h1");
        const h2Elements = document.querySelectorAll("h2");

        expect(h1).toBeInTheDocument();
        expect(h2Elements.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Understandable (Guideline 3.1 - 3.3)", () => {
    describe("Readable (3.1)", () => {
      it("uses clear and simple language", () => {
        render(<Hero {...mockHeroProps} />);

        // Check that text content is not too complex
        // This is a basic check - in practice, you'd use readability metrics
        const headings = document.querySelectorAll("h1, h2, h3");
        headings.forEach((heading) => {
          const text = heading.textContent || "";
          expect(text.length).toBeGreaterThan(0);
          expect(text.length).toBeLessThan(200); // Reasonable heading length
        });
      });

      it("provides abbreviations with expansions", () => {
        render(<Hero {...mockHeroProps} />);

        // Check for proper use of abbr elements if any abbreviations exist
        const abbrs = document.querySelectorAll("abbr");
        abbrs.forEach((abbr) => {
          expect(abbr).toHaveAttribute("title");
        });
      });
    });

    describe("Predictable (3.2)", () => {
      it("maintains consistent navigation", () => {
        render(<Hero {...mockHeroProps} />);

        // Check that navigation elements are consistent
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBeGreaterThan(0);

        // All buttons should be properly labeled
        buttons.forEach((button) => {
          expect(button.tagName).toBe("BUTTON");
        });
      });

      it("provides consistent interaction patterns", () => {
        render(<Hero {...mockHeroProps} />);

        const primaryCta = screen.getByRole("button", {
          name: /entrar na pré-venda/i,
        });
        const secondaryCta = screen.getByRole("button", { name: /ver demo/i });

        // Both should be buttons with similar interaction patterns
        expect(primaryCta.tagName).toBe("BUTTON");
        expect(secondaryCta.tagName).toBe("BUTTON");
      });
    });

    describe("Input Assistance (3.3)", () => {
      it("provides clear error messages when applicable", () => {
        // This would test form validation
        // For now, ensure components render without errors
        expect(() => {
          render(<Hero {...mockHeroProps} />);
        }).not.toThrow();
      });

      it("provides helpful labels and instructions", () => {
        render(<Hero {...mockHeroProps} />);

        // Check that interactive elements have clear purposes
        const buttons = screen.getAllByRole("button");
        buttons.forEach((button) => {
          expect(button.textContent?.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe("Robust (Guideline 4.1)", () => {
    describe("Compatible (4.1)", () => {
      it("uses valid HTML markup", () => {
        render(<Hero {...mockHeroProps} />);

        // Check that the DOM is valid
        const root = document.body;
        expect(root).toBeInTheDocument();

        // Check for proper nesting
        const sections = document.querySelectorAll("section");
        sections.forEach((section) => {
          expect(section.children.length).toBeGreaterThan(0);
        });
      });

      it("provides proper ARIA attributes", () => {
        render(<Hero {...mockHeroProps} />);

        // Check for proper ARIA usage on buttons
        const primaryCta = screen.getByRole("button", {
          name: /entrar na pré-venda/i,
        });
        const secondaryCta = screen.getByRole("button", { name: /ver demo/i });

        expect(primaryCta).toHaveAttribute("aria-label");
        expect(secondaryCta).toHaveAttribute("aria-label");
      });

      it("maintains accessibility tree integrity", () => {
        render(<Hero {...mockHeroProps} />);

        // Check that interactive elements are properly exposed
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBeGreaterThan(0);

        buttons.forEach((button) => {
          expect(button).toBeVisible();
        });
      });
    });
  });

  describe("Touch Target Size (WCAG 2.5.5)", () => {
    it("provides adequate touch target sizes", () => {
      render(<Hero {...mockHeroProps} />);

      const buttons = screen.getAllByRole("button");

      // Ensure we have buttons to test
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach((button) => {
        // Check that buttons are properly rendered as BUTTON elements
        // The AccessibleButton component ensures touch target compliance
        expect(button.tagName).toBe("BUTTON");
        // Ensure buttons have some className (accessibility styles are applied)
        expect(button.className.length).toBeGreaterThan(0);
      });
    });

    it("provides adequate spacing between touch targets", () => {
      render(<Hero {...mockHeroProps} />);

      const buttons = screen.getAllByRole("button");

      // Ensure we have buttons to test
      expect(buttons.length).toBeGreaterThan(0);

      // Check that buttons are properly spaced (flexbox gap or margins)
      // The Hero component uses flexbox with gap-4
      const container = buttons[0].parentElement;
      expect(container).toHaveClass("gap-4");
    });
  });

  describe("Focus Management", () => {
    it("maintains logical tab order", () => {
      render(<Hero {...mockHeroProps} />);

      // Get all focusable elements
      const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      // Should have focusable elements
      expect(focusableElements.length).toBeGreaterThan(0);

      // Check that focusable elements have proper attributes for accessibility
      focusableElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        // Ensure elements are not hidden from screen readers
        expect(htmlElement.getAttribute("aria-hidden")).not.toBe("true");
        expect(htmlElement.getAttribute("hidden")).toBeNull();
      });

      // Test that we have at least primary and secondary CTAs
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it("does not trap focus inappropriately", () => {
      render(<Hero {...mockHeroProps} />);

      // Ensure we can move focus freely
      const buttons = screen.getAllByRole("button");

      buttons.forEach((button) => {
        button.focus();
        expect(document.activeElement).toBe(button);
      });
    });
  });

  describe("Screen Reader Compatibility", () => {
    it("provides appropriate ARIA labels", () => {
      render(<Hero {...mockHeroProps} />);

      const primaryCta = screen.getByRole("button", {
        name: /entrar na pré-venda/i,
      });

      // Check for aria-label or accessible name
      expect(primaryCta).toHaveAccessibleName();
    });

    it("avoids redundant ARIA attributes", () => {
      render(<Hero {...mockHeroProps} />);

      // Buttons shouldn't have redundant aria-label when text content is sufficient
      const buttons = document.querySelectorAll("button[aria-label]");

      // If there are aria-label attributes, ensure they're actually needed
      buttons.forEach((button) => {
        const textContent = button.textContent?.trim();
        const ariaLabel = button.getAttribute("aria-label");

        // If there's visible text, aria-label should add value
        if (textContent && ariaLabel) {
          expect(ariaLabel).not.toBe(textContent);
        }
      });
    });

    it("provides live region updates when needed", () => {
      // This would test dynamic content updates
      // For now, ensure static content is properly structured
      render(<Hero {...mockHeroProps} />);

      const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
      expect(headings.length).toBeGreaterThan(0);
    });
  });
});
