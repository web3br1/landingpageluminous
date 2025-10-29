// Unit Tests for Proof Traction Component - Semana 4 Implementation
// Tests social proof metrics and testimonials display
// Target: 10+ test cases covering proof traction functionality

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProofTraction } from "@/components/sections/proof-traction/proof-traction";
import type { ProofTractionContent } from "@/domains/marketing";

// Mock Next.js Image component
vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: Record<string, unknown>) => (
    <img src={src as string} alt={alt as string} {...props} />
  ),
}));

// Mock utils
vi.mock("@/lib/utils", () => ({
  cn: (...classes: (string | undefined | null | boolean)[]) =>
    classes.filter(Boolean).join(" "),
}));

describe("Proof Traction Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockContent: ProofTractionContent = {
    title: "Confiança de milhares de empresas",
    subtitle: "Veja os resultados que nossos clientes conquistaram",
    metrics: [
      {
        value: "10.000+",
        label: "Clientes satisfeitos",
        description: "Empresas que escolheram nossa solução",
      },
      {
        value: "99.9%",
        label: "Uptime garantido",
        description: "Disponibilidade do sistema",
        trend: "stable",
      },
      {
        value: "24/7",
        label: "Suporte dedicado",
        description: "Atendimento sempre disponível",
      },
    ],
    testimonials: [
      {
        quote: "A solução transformou nossa produtividade completamente.",
        author: {
          name: "João Silva",
          role: "CTO",
          company: "TechCorp",
          avatar: "/avatars/joao.jpg",
        },
        rating: 5,
      },
      {
        quote: "Implementação rápida e resultados imediatos.",
        author: {
          name: "Maria Santos",
          role: "Diretora de Operações",
          company: "LogiTrans",
        },
        rating: 5,
        featured: true,
      },
    ],
    logos: [
      {
        src: "/logos/techcorp.png",
        alt: "TechCorp logo",
        href: "https://techcorp.com",
      },
      { src: "/logos/logitrans.png", alt: "LogiTrans logo" },
      {
        src: "/logos/innovate.png",
        alt: "Innovate Solutions logo",
        href: "https://innovate.com",
      },
    ],
  };

  describe("basic rendering", () => {
    it("should render proof traction section with title and subtitle", () => {
      render(<ProofTraction content={mockContent} />);

      expect(
        screen.getByText("Confiança de milhares de empresas"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Veja os resultados que nossos clientes conquistaram"),
      ).toBeInTheDocument();
    });

    it("should render metrics with values and labels", () => {
      render(<ProofTraction content={mockContent} />);

      expect(screen.getByText("10.000+")).toBeInTheDocument();
      expect(screen.getByText("Clientes satisfeitos")).toBeInTheDocument();
      expect(screen.getByText("99.9%")).toBeInTheDocument();
      expect(screen.getByText("Uptime garantido")).toBeInTheDocument();
    });

    it("should render testimonials", () => {
      render(<ProofTraction content={mockContent} />);

      expect(
        screen.getByText(
          "A solução transformou nossa produtividade completamente.",
        ),
      ).toBeInTheDocument();
      expect(screen.getByText("João Silva")).toBeInTheDocument();
      expect(screen.getByText("CTO, TechCorp")).toBeInTheDocument();
    });

    it("should render company logos", () => {
      render(<ProofTraction content={mockContent} />);

      const logos = screen.getAllByRole("img");
      expect(logos.length).toBeGreaterThan(0);
      expect(
        logos.some((img) => img.getAttribute("alt")?.includes("logo")),
      ).toBe(true);
    });
  });

  describe("metrics display", () => {
    it("should show metric descriptions when available", () => {
      render(<ProofTraction content={mockContent} />);

      expect(
        screen.getByText("Empresas que escolheram nossa solução"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Disponibilidade do sistema"),
      ).toBeInTheDocument();
    });

    it("should display trend indicators", () => {
      render(<ProofTraction content={mockContent} />);

      const stableMetric = screen.getByText("99.9%").closest("[data-trend]");
      expect(stableMetric).toHaveAttribute("data-trend", "stable");
    });

    it("should format large numbers appropriately", () => {
      render(<ProofTraction content={mockContent} />);

      expect(screen.getByText("10.000+")).toBeInTheDocument();
    });
  });

  describe("testimonials", () => {
    it("should display star ratings", () => {
      render(<ProofTraction content={mockContent} />);

      const stars = screen.getAllByText("⭐");
      expect(stars.length).toBeGreaterThan(0);
    });

    it("should show author information", () => {
      render(<ProofTraction content={mockContent} />);

      expect(screen.getByText("João Silva")).toBeInTheDocument();
      expect(screen.getByText("CTO")).toBeInTheDocument();
      expect(screen.getByText("TechCorp")).toBeInTheDocument();
    });

    it("should highlight featured testimonials", () => {
      render(<ProofTraction content={mockContent} />);

      const featuredTestimonial = screen
        .getByText("Implementação rápida e resultados imediatos.")
        .closest("[data-featured]");
      expect(featuredTestimonial).toHaveAttribute("data-featured", "true");
    });

    it("should display avatars when available", () => {
      render(<ProofTraction content={mockContent} />);

      const avatars = screen.getAllByAltText(/avatar/i);
      expect(avatars.length).toBeGreaterThan(0);
    });
  });

  describe("company logos", () => {
    it("should render clickable logos with links", () => {
      render(<ProofTraction content={mockContent} />);

      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThan(0);
    });

    it("should render non-clickable logos", () => {
      render(<ProofTraction content={mockContent} />);

      const images = screen.getAllByRole("img");
      expect(images.some((img) => img.closest("a") === null)).toBe(true);
    });

    it("should have proper alt text for logos", () => {
      render(<ProofTraction content={mockContent} />);

      expect(screen.getByAltText("TechCorp logo")).toBeInTheDocument();
      expect(screen.getByAltText("LogiTrans logo")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper heading hierarchy", () => {
      render(<ProofTraction content={mockContent} headingId="proof-heading" />);

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveAttribute("id", "proof-heading");
    });

    it("should have descriptive alt text", () => {
      render(<ProofTraction content={mockContent} />);

      expect(screen.getByAltText("Avatar of João Silva")).toBeInTheDocument();
    });

    it("should have accessible logo links", () => {
      render(<ProofTraction content={mockContent} />);

      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link).toHaveAttribute("href");
      });
    });
  });

  describe("interactions", () => {
    it("should handle logo clicks", async () => {
      const onLogoClick = vi.fn();
      const user = userEvent.setup();

      render(<ProofTraction content={mockContent} onLogoClick={onLogoClick} />);

      const logoLink = screen.getByRole("link", { name: /techcorp/i });
      await user.click(logoLink);

      expect(onLogoClick).toHaveBeenCalled();
    });

    it("should handle testimonial clicks", async () => {
      const onTestimonialClick = vi.fn();
      const user = userEvent.setup();

      render(
        <ProofTraction
          content={mockContent}
          onTestimonialClick={onTestimonialClick}
        />,
      );

      const testimonial = screen.getByText(
        "A solução transformou nossa produtividade completamente.",
      );
      await user.click(testimonial);

      expect(onTestimonialClick).toHaveBeenCalled();
    });

    it("should handle metric clicks", async () => {
      const onMetricClick = vi.fn();
      const user = userEvent.setup();

      render(
        <ProofTraction content={mockContent} onMetricClick={onMetricClick} />,
      );

      const metric = screen.getByText("10.000+");
      await user.click(metric);

      expect(onMetricClick).toHaveBeenCalled();
    });
  });

  describe("empty states", () => {
    it("should handle missing metrics", () => {
      const contentWithoutMetrics = { ...mockContent, metrics: [] };
      render(<ProofTraction content={contentWithoutMetrics} />);

      expect(
        screen.getByText("Confiança de milhares de empresas"),
      ).toBeInTheDocument();
      expect(screen.queryByText("10.000+")).not.toBeInTheDocument();
    });

    it("should handle missing testimonials", () => {
      const contentWithoutTestimonials = { ...mockContent, testimonials: [] };
      render(<ProofTraction content={contentWithoutTestimonials} />);

      expect(
        screen.getByText("Confiança de milhares de empresas"),
      ).toBeInTheDocument();
      expect(screen.queryByText("João Silva")).not.toBeInTheDocument();
    });

    it("should handle missing logos", () => {
      const contentWithoutLogos = { ...mockContent, logos: [] };
      render(<ProofTraction content={contentWithoutLogos} />);

      expect(
        screen.getByText("Confiança de milhares de empresas"),
      ).toBeInTheDocument();
      expect(screen.queryByAltText(/logo/)).toBeNull();
    });
  });

  describe("responsive behavior", () => {
    it("should adapt metrics layout for mobile", () => {
      Object.defineProperty(window, "innerWidth", { value: 375 });

      render(<ProofTraction content={mockContent} />);

      const metricsContainer = screen
        .getByText("10.000+")
        .closest("[data-responsive]");
      expect(metricsContainer).toHaveAttribute("data-responsive", "mobile");
    });

    it("should adapt testimonials layout for desktop", () => {
      Object.defineProperty(window, "innerWidth", { value: 1024 });

      render(<ProofTraction content={mockContent} />);

      const testimonialsContainer = screen
        .getByText("João Silva")
        .closest("[data-responsive]");
      expect(testimonialsContainer).toHaveAttribute(
        "data-responsive",
        "desktop",
      );
    });
  });
});
