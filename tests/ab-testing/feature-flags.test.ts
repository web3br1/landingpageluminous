import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Hero } from "@/components/sections/hero/hero";
import { LeadForm } from "@/components/sections/lead-form/lead-form";
import { Benefits } from "@/components/sections/benefits/benefits";
import {
  getExperimentVariant,
  setExperimentOverride,
} from "@/lib/experiments/experiment-manager";
import { EXPERIMENT_KEYS } from "@/lib/experiments/experiment-config";
import type { HeroContent } from "@/domains/marketing/types/hero.types";
import type { LeadFormContent } from "@/domains/marketing/types/lead-form.types";
import type { BenefitsContent } from "@/domains/marketing/types/benefits.types";

// Mock dependencies
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement("div", props, children),
  },
}));

vi.mock("@/app/(marketing)/components/ui/section", () => ({
  Section: ({ children, ...props }: Record<string, unknown>) =>
    React.createElement("section", props, children),
}));

vi.mock("@/components/ui/cta-button-unified", () => ({
  CtaButton: ({ children, ...props }: Record<string, unknown>) =>
    React.createElement("button", props, children),
}));

vi.mock("@/app/(marketing)/components/ui/fade-up", () => ({
  FadeUp: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
}));

vi.mock("@/lib/hooks/use-analytics", () => ({
  useAnalytics: () => ({
    trackEvent: vi.fn(),
    trackConversion: vi.fn(),
  }),
}));

describe("A/B Testing - Feature Flags System", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    // Reset experiment overrides
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Experiment Manager", () => {
    it("should return control variant by default", () => {
      const variant = getExperimentVariant(EXPERIMENT_KEYS.HERO_HEADLINE);
      expect(variant).toBe("control");
    });

    it("should allow overriding experiment variants", () => {
      setExperimentOverride(EXPERIMENT_KEYS.HERO_HEADLINE, "variant-a");
      const variant = getExperimentVariant(EXPERIMENT_KEYS.HERO_HEADLINE);
      expect(variant).toBe("variant-a");
    });

    it("should support multiple experiment overrides", () => {
      setExperimentOverride(EXPERIMENT_KEYS.HERO_HEADLINE, "variant-a");
      setExperimentOverride(EXPERIMENT_KEYS.CTA_COLOR, "blue");

      expect(getExperimentVariant(EXPERIMENT_KEYS.HERO_HEADLINE)).toBe(
        "variant-a",
      );
      expect(getExperimentVariant(EXPERIMENT_KEYS.CTA_COLOR)).toBe("blue");
      expect(getExperimentVariant(EXPERIMENT_KEYS.FORM_LAYOUT)).toBe("control"); // unchanged
    });

    it("should handle invalid experiment keys gracefully", () => {
      const variant = getExperimentVariant(
        "invalid-experiment" as keyof typeof EXPERIMENT_KEYS,
      );
      expect(variant).toBe("control");
    });
  });

  describe("Hero Section Experiments", () => {
    const baseHeroContent: HeroContent = {
      title: "Transforme seu negócio",
      subtitle: "Solução completa para empresas modernas",
      primaryCta: {
        text: "Começar agora",
        href: "/signup",
      },
    };

    it("should render control variant by default", () => {
      render(
        React.createElement(Hero, {
          content: baseHeroContent,
          sectionId: "hero",
        }),
      );

      expect(screen.getByText("Transforme seu negócio")).toBeInTheDocument();
      expect(screen.getByText("Começar agora")).toBeInTheDocument();
    });

    it("should render variant-a headline when experiment is active", () => {
      // Mock the experiment to return variant-a
      vi.mocked(getExperimentVariant).mockReturnValue("variant-a");

      const variantContent = {
        ...baseHeroContent,
        title: "Revolucione seu negócio hoje",
      };

      render(
        React.createElement(Hero, {
          content: variantContent,
          sectionId: "hero",
        }),
      );

      expect(
        screen.getByText("Revolucione seu negócio hoje"),
      ).toBeInTheDocument();
    });

    it("should render variant-b with different CTA text", () => {
      vi.mocked(getExperimentVariant).mockReturnValue("variant-b");

      const variantContent = {
        ...baseHeroContent,
        primaryCta: {
          text: "Experimentar grátis por 30 dias",
          href: "/trial",
        },
      };

      render(
        React.createElement(Hero, {
          content: variantContent,
          sectionId: "hero",
        }),
      );

      expect(
        screen.getByText("Experimentar grátis por 30 dias"),
      ).toBeInTheDocument();
    });

    it("should track experiment impressions", () => {
      const trackEvent = vi.fn();
      vi.mocked(getExperimentVariant).mockReturnValue("variant-a");

      // Mock analytics tracking
      vi.doMock("@/lib/hooks/use-analytics", () => ({
        useAnalytics: () => ({
          trackEvent,
        }),
      }));

      render(
        React.createElement(Hero, {
          content: baseHeroContent,
          sectionId: "hero",
        }),
      );

      // Should track experiment impression when component mounts
      expect(trackEvent).toHaveBeenCalledWith("experiment_impression", {
        experiment: EXPERIMENT_KEYS.HERO_HEADLINE,
        variant: "variant-a",
      });
    });
  });

  describe("Lead Form Experiments", () => {
    const baseFormContent: LeadFormContent = {
      title: "Comece seu teste grátis",
      fields: [
        {
          name: "email",
          type: "email",
          label: "E-mail corporativo",
          required: true,
        },
      ],
      submitText: "Começar teste grátis",
    };

    it("should render control layout by default", () => {
      render(
        React.createElement(LeadForm, {
          content: baseFormContent,
          sectionId: "lead-form",
        }),
      );

      expect(screen.getByText("Comece seu teste grátis")).toBeInTheDocument();
      expect(screen.getByText("Começar teste grátis")).toBeInTheDocument();
    });

    it("should render compact layout variant", () => {
      vi.mocked(getExperimentVariant).mockReturnValue("compact");

      const compactContent = {
        ...baseFormContent,
        title: "Teste Grátis", // Shorter title
      };

      render(
        React.createElement(LeadForm, {
          content: compactContent,
          sectionId: "lead-form",
        }),
      );

      expect(screen.getByText("Teste Grátis")).toBeInTheDocument();
    });

    it("should render expanded layout with additional fields", () => {
      vi.mocked(getExperimentVariant).mockReturnValue("expanded");

      const expandedContent = {
        ...baseFormContent,
        fields: [
          ...baseFormContent.fields,
          {
            name: "company",
            type: "text",
            label: "Empresa",
          },
          {
            name: "role",
            type: "select",
            label: "Cargo",
            options: ["CEO", "CTO", "Gerente"],
          },
        ],
      };

      render(
        React.createElement(LeadForm, {
          content: expandedContent,
          sectionId: "lead-form",
        }),
      );

      expect(screen.getByLabelText("Empresa")).toBeInTheDocument();
      expect(screen.getByLabelText("Cargo")).toBeInTheDocument();
    });

    it("should track form experiment conversions", async () => {
      const trackEvent = vi.fn();
      vi.mocked(getExperimentVariant).mockReturnValue("variant-a");

      vi.doMock("@/lib/hooks/use-analytics", () => ({
        useAnalytics: () => ({
          trackEvent,
        }),
      }));

      render(
        React.createElement(LeadForm, {
          content: baseFormContent,
          sectionId: "lead-form",
        }),
      );

      // Fill and submit form
      const emailInput = screen.getByRole("textbox", {
        name: /e-mail corporativo/i,
      });
      const submitButton = screen.getByRole("button", {
        name: /começar teste grátis/i,
      });

      await user.type(emailInput, "test@example.com");
      await user.click(submitButton);

      // Should track conversion with experiment data
      expect(trackEvent).toHaveBeenCalledWith(
        "form_submit",
        expect.objectContaining({
          experiment: EXPERIMENT_KEYS.FORM_LAYOUT,
          variant: "variant-a",
        }),
      );
    });
  });

  describe("CTA Button Experiments", () => {
    it("should render control button style", () => {
      const heroContent: HeroContent = {
        title: "Test",
        primaryCta: {
          text: "Click me",
          href: "/test",
        },
      };

      render(
        React.createElement(Hero, { content: heroContent, sectionId: "hero" }),
      );

      const button = screen.getByRole("link", { name: /click me/i });
      expect(button).toBeInTheDocument();
    });

    it("should render blue variant when experiment is active", () => {
      vi.mocked(getExperimentVariant).mockReturnValue("blue");

      const heroContent: HeroContent = {
        title: "Test",
        primaryCta: {
          text: "Click me",
          href: "/test",
        },
      };

      render(
        React.createElement(Hero, { content: heroContent, sectionId: "hero" }),
      );

      const button = screen.getByRole("link", { name: /click me/i });
      // Check if button has blue styling (this would depend on your implementation)
      expect(button).toHaveClass("bg-blue-600"); // Example assertion
    });

    it("should render green variant when experiment is active", () => {
      vi.mocked(getExperimentVariant).mockReturnValue("green");

      const heroContent: HeroContent = {
        title: "Test",
        primaryCta: {
          text: "Click me",
          href: "/test",
        },
      };

      render(
        React.createElement(Hero, { content: heroContent, sectionId: "hero" }),
      );

      const button = screen.getByRole("link", { name: /click me/i });
      expect(button).toHaveClass("bg-green-600"); // Example assertion
    });
  });

  describe("Benefits Section Experiments", () => {
    const baseBenefitsContent: BenefitsContent = {
      title: "Por que escolher nossa solução?",
      benefits: [
        {
          title: "Benefício 1",
          description: "Descrição do benefício 1",
          icon: "check",
        },
        {
          title: "Benefício 2",
          description: "Descrição do benefício 2",
          icon: "star",
        },
      ],
    };

    it("should render control layout with 2 columns", () => {
      render(
        React.createElement(Benefits, {
          content: baseBenefitsContent,
          sectionId: "benefits",
        }),
      );

      expect(
        screen.getByText("Por que escolher nossa solução?"),
      ).toBeInTheDocument();
      expect(screen.getByText("Benefício 1")).toBeInTheDocument();
      expect(screen.getByText("Benefício 2")).toBeInTheDocument();
    });

    it("should render 3-column layout variant", () => {
      vi.mocked(getExperimentVariant).mockReturnValue("three-column");

      const threeColumnContent = {
        ...baseBenefitsContent,
        benefits: [
          ...baseBenefitsContent.benefits,
          {
            title: "Benefício 3",
            description: "Descrição do benefício 3",
            icon: "heart",
          },
        ],
      };

      render(
        React.createElement(Benefits, {
          content: threeColumnContent,
          sectionId: "benefits",
        }),
      );

      expect(screen.getByText("Benefício 3")).toBeInTheDocument();
    });

    it("should render card-based layout variant", () => {
      vi.mocked(getExperimentVariant).mockReturnValue("cards");

      render(
        React.createElement(Benefits, {
          content: baseBenefitsContent,
          sectionId: "benefits",
        }),
      );

      // Check for card-specific classes or structure
      const cards = document.querySelectorAll('[data-testid="benefit-card"]');
      expect(cards.length).toBe(baseBenefitsContent.benefits.length);
    });
  });

  describe("Experiment Analytics Integration", () => {
    it("should include experiment data in all tracking events", () => {
      const trackEvent = vi.fn();

      vi.doMock("@/lib/hooks/use-analytics", () => ({
        useAnalytics: () => ({
          trackEvent,
        }),
      }));

      // Set multiple experiment overrides
      vi.mocked(getExperimentVariant).mockImplementation((key) => {
        const variants: Record<string, string> = {
          [EXPERIMENT_KEYS.HERO_HEADLINE]: "variant-a",
          [EXPERIMENT_KEYS.CTA_COLOR]: "blue",
          [EXPERIMENT_KEYS.FORM_LAYOUT]: "compact",
        };
        return variants[key] || "control";
      });

      const heroContent: HeroContent = {
        title: "Test",
        primaryCta: {
          text: "Click me",
          href: "/test",
        },
      };

      render(
        React.createElement(Hero, { content: heroContent, sectionId: "hero" }),
      );

      // Should track with experiment context
      expect(trackEvent).toHaveBeenCalledWith("experiment_impression", {
        experiment: EXPERIMENT_KEYS.HERO_HEADLINE,
        variant: "variant-a",
        additionalExperiments: {
          [EXPERIMENT_KEYS.CTA_COLOR]: "blue",
          [EXPERIMENT_KEYS.FORM_LAYOUT]: "compact",
        },
      });
    });

    it("should track conversion events with experiment attribution", async () => {
      const trackEvent = vi.fn();
      vi.mocked(getExperimentVariant).mockReturnValue("variant-a");

      vi.doMock("@/lib/hooks/use-analytics", () => ({
        useAnalytics: () => ({
          trackEvent,
        }),
      }));

      const formContent: LeadFormContent = {
        title: "Form",
        fields: [
          {
            name: "email",
            type: "email",
            label: "Email",
            required: true,
          },
        ],
        submitText: "Submit",
      };

      render(
        React.createElement(LeadForm, {
          content: formContent,
          sectionId: "form",
        }),
      );

      const emailInput = screen.getByRole("textbox", { name: /email/i });
      const submitButton = screen.getByRole("button", { name: /submit/i });

      await user.type(emailInput, "test@example.com");
      await user.click(submitButton);

      expect(trackEvent).toHaveBeenCalledWith(
        "form_submit",
        expect.objectContaining({
          experiment: EXPERIMENT_KEYS.FORM_LAYOUT,
          variant: "variant-a",
          email: "test@example.com",
          timestamp: expect.any(Number),
        }),
      );
    });
  });

  describe("Experiment Persistence", () => {
    it("should persist experiment variants in session storage", () => {
      // Mock sessionStorage
      const mockSessionStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };

      Object.defineProperty(window, "sessionStorage", {
        value: mockSessionStorage,
        writable: true,
      });

      setExperimentOverride(EXPERIMENT_KEYS.HERO_HEADLINE, "variant-a");

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        `experiment_${EXPERIMENT_KEYS.HERO_HEADLINE}`,
        "variant-a",
      );
    });

    it("should restore experiment variants from session storage", () => {
      const mockSessionStorage = {
        getItem: vi.fn((key) => {
          if (key === `experiment_${EXPERIMENT_KEYS.HERO_HEADLINE}`) {
            return "variant-b";
          }
          return null;
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };

      Object.defineProperty(window, "sessionStorage", {
        value: mockSessionStorage,
        writable: true,
      });

      const variant = getExperimentVariant(EXPERIMENT_KEYS.HERO_HEADLINE);
      expect(variant).toBe("variant-b");
    });

    it("should handle session storage errors gracefully", () => {
      const mockSessionStorage = {
        getItem: vi.fn(() => {
          throw new Error("Storage quota exceeded");
        }),
        setItem: vi.fn(() => {
          throw new Error("Storage quota exceeded");
        }),
        removeItem: vi.fn(),
      };

      Object.defineProperty(window, "sessionStorage", {
        value: mockSessionStorage,
        writable: true,
      });

      // Should not throw and return control variant
      expect(() => {
        const variant = getExperimentVariant(EXPERIMENT_KEYS.HERO_HEADLINE);
        expect(variant).toBe("control");
      }).not.toThrow();
    });
  });

  describe("Experiment Quality Assurance", () => {
    it("should validate experiment configuration", () => {
      // Test that all required experiments are defined
      expect(EXPERIMENT_KEYS.HERO_HEADLINE).toBeDefined();
      expect(EXPERIMENT_KEYS.CTA_COLOR).toBeDefined();
      expect(EXPERIMENT_KEYS.FORM_LAYOUT).toBeDefined();

      // Test that experiment keys are strings
      Object.values(EXPERIMENT_KEYS).forEach((key) => {
        expect(typeof key).toBe("string");
        expect(key.length).toBeGreaterThan(0);
      });
    });

    it("should prevent invalid experiment variants", () => {
      // Test that only valid variants are accepted
      const validVariants = [
        "control",
        "variant-a",
        "variant-b",
        "compact",
        "expanded",
        "blue",
        "green",
      ];

      validVariants.forEach((variant) => {
        setExperimentOverride(EXPERIMENT_KEYS.HERO_HEADLINE, variant);
        expect(getExperimentVariant(EXPERIMENT_KEYS.HERO_HEADLINE)).toBe(
          variant,
        );
      });

      // Invalid variant should default to control
      setExperimentOverride(EXPERIMENT_KEYS.HERO_HEADLINE, "invalid-variant");
      expect(getExperimentVariant(EXPERIMENT_KEYS.HERO_HEADLINE)).toBe(
        "control",
      );
    });

    it("should handle experiment rollout percentages", () => {
      // Mock Math.random for deterministic testing
      const originalRandom = Math.random;
      Math.random = vi.fn();

      // 50% rollout - should return variant-a for random < 0.5
      vi.mocked(Math.random).mockReturnValue(0.3);
      let variant = getExperimentVariant(EXPERIMENT_KEYS.HERO_HEADLINE);
      expect(variant).toBe("variant-a");

      // Should return control for random >= 0.5
      vi.mocked(Math.random).mockReturnValue(0.7);
      variant = getExperimentVariant(EXPERIMENT_KEYS.HERO_HEADLINE);
      expect(variant).toBe("control");

      Math.random = originalRandom;
    });
  });
});
