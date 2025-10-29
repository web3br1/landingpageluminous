import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SocialProof } from "@/components/sections/social-proof/social-proof";
import type {
  SocialProofContent,
  CompanyLogo,
  Testimonial,
  Metric,
} from "@/domains/marketing/types/social-proof.types";
import { vi } from "vitest";

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

describe("SocialProof Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockLogos: CompanyLogo[] = [
    {
      src: "/logos/company1.svg",
      alt: "Company 1",
      href: "https://company1.com",
      width: 120,
      height: 40,
    },
    {
      src: "/logos/company2.svg",
      alt: "Company 2",
      href: "https://company2.com",
      width: 120,
      height: 40,
    },
  ];

  const mockTestimonials: Testimonial[] = [
    {
      quote: "Esta solução transformou completamente nosso workflow!",
      author: {
        name: "João Silva",
        role: "CTO",
        company: "TechCorp",
        avatar: "/avatars/joao.jpg",
      },
      rating: 5,
      featured: true,
    },
    {
      quote: "Excelente suporte e funcionalidades incríveis.",
      author: {
        name: "Maria Santos",
        role: "Gerente de Produto",
        company: "Innovate Ltda",
        avatar: "/avatars/maria.jpg",
      },
      rating: 5,
    },
  ];

  const mockMetrics: Metric[] = [
    {
      value: "10k+",
      label: "Usuários ativos",
      description: "Empresas confiam na nossa solução",
      trend: "up",
      trendValue: "+25%",
    },
    {
      value: "99.9%",
      label: "Uptime",
      description: "Disponibilidade garantida",
      trend: "stable",
      trendValue: "0%",
    },
    {
      value: "24/7",
      label: "Suporte",
      description: "Atendimento sempre disponível",
    },
  ];

  const mockContent: SocialProofContent = {
    title: "Empresas que confiam em nós",
    subtitle: "Junte-se a milhares de clientes satisfeitos",
    logos: mockLogos,
    testimonials: mockTestimonials,
    metrics: mockMetrics,
    layout: "full",
    showRatings: true,
    ctaText: "Ver mais cases",
    ctaLink: "/cases",
  };

  const defaultProps = {
    content: mockContent,
    tracking: {
      section: "social-proof" as const,
      experimentId: "social_proof_test",
      variant: "default",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders title and subtitle when provided", () => {
    render(<SocialProof {...defaultProps} />);

    expect(screen.getByText(mockContent.title!)).toBeInTheDocument();
    expect(screen.getByText(mockContent.subtitle!)).toBeInTheDocument();
  });

  it("renders company logos", () => {
    render(<SocialProof {...defaultProps} />);

    mockLogos.forEach((logo) => {
      const logoImg = screen.getByAltText(logo.alt);
      expect(logoImg).toBeInTheDocument();
      expect(logoImg).toHaveAttribute("src", logo.src);
    });
  });

  it("renders testimonials with author information", () => {
    render(<SocialProof {...defaultProps} />);

    mockTestimonials.forEach((testimonial) => {
      // Check if testimonial quote is rendered (handling encoding issues)
      expect(
        screen.getByText(/Esta solução transformou completamente/),
      ).toBeInTheDocument();
      expect(screen.getByText(/Excelente suporte/)).toBeInTheDocument();

      // Check author names
      expect(screen.getByText(/João Silva/)).toBeInTheDocument();
      expect(screen.getByText(/Maria Santos/)).toBeInTheDocument();

      // Check roles and companies
      expect(screen.getByText(/CTO.*TechCorp/)).toBeInTheDocument();
      expect(
        screen.getByText(/Gerente de Produto.*Innovate/),
      ).toBeInTheDocument();
    });
  });

  it("renders star ratings when showRatings is true", () => {
    render(<SocialProof {...defaultProps} />);

    const stars = document.querySelectorAll(".lucide-star");
    expect(stars.length).toBeGreaterThan(0);
  });

  it("renders metrics with values and labels", () => {
    render(<SocialProof {...defaultProps} />);

    mockMetrics.forEach((metric) => {
      expect(screen.getByText(metric.value)).toBeInTheDocument();
      expect(screen.getByText(metric.label)).toBeInTheDocument();
    });
  });

  it("renders trend indicators for metrics", () => {
    render(<SocialProof {...defaultProps} />);

    // Check for trend up icon
    const trendUpIcon = document.querySelector(".lucide-trending-up");
    expect(trendUpIcon).toBeInTheDocument();

    // Check for trend stable icon (minus)
    const trendStableIcon = document.querySelector(".lucide-minus");
    expect(trendStableIcon).toBeInTheDocument();
  });

  it("handles logo clicks", () => {
    const mockOnLogoClick = vi.fn();
    render(<SocialProof {...defaultProps} onLogoClick={mockOnLogoClick} />);

    const firstLogo =
      screen.getByAltText(mockLogos[0].alt).closest("a") ||
      screen.getByAltText(mockLogos[0].alt);
    fireEvent.click(firstLogo);

    expect(mockOnLogoClick).toHaveBeenCalledWith(0, mockLogos[0]);
  });

  it("handles testimonial clicks", () => {
    const mockOnTestimonialClick = vi.fn();
    render(
      <SocialProof
        {...defaultProps}
        onTestimonialClick={mockOnTestimonialClick}
      />,
    );

    // Find testimonial by quote text (using regex for encoding issues) and click on the containing card
    const testimonialQuote = screen.getByText(
      /Esta solução transformou completamente/,
    );
    const testimonialCard = testimonialQuote.closest(".bg-card");
    expect(testimonialCard).toBeInTheDocument();

    fireEvent.click(testimonialCard!);

    expect(mockOnTestimonialClick).toHaveBeenCalledWith(0, mockTestimonials[0]);
  });

  it("handles metric clicks", () => {
    const mockOnMetricClick = vi.fn();
    render(<SocialProof {...defaultProps} onMetricClick={mockOnMetricClick} />);

    // Find metric by value text and click on the containing card
    const metricValue = screen.getByText(mockMetrics[0].value);
    const metricCard = metricValue.closest(".bg-card");
    expect(metricCard).toBeInTheDocument();

    fireEvent.click(metricCard!);

    expect(mockOnMetricClick).toHaveBeenCalledWith(0, mockMetrics[0]);
  });

  it("renders CTA button when ctaText is provided", () => {
    render(<SocialProof {...defaultProps} />);

    expect(screen.getByText(mockContent.ctaText!)).toBeInTheDocument();
  });

  it("handles CTA button clicks", () => {
    const mockOnCtaClick = vi.fn();
    render(<SocialProof {...defaultProps} onCtaClick={mockOnCtaClick} />);

    const ctaButton = screen.getByText(mockContent.ctaText!);
    fireEvent.click(ctaButton);

    expect(mockOnCtaClick).toHaveBeenCalledTimes(1);
  });

  it("conditionally renders sections based on layout", () => {
    // Test logos-only layout
    const logosOnlyContent = { ...mockContent, layout: "logos-only" as const };
    const { rerender } = render(
      <SocialProof {...defaultProps} content={logosOnlyContent} />,
    );

    expect(screen.getAllByAltText(/Company/)).toHaveLength(mockLogos.length);
    expect(
      screen.queryByText(/Esta solução transformou completamente/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(mockMetrics[0].value)).not.toBeInTheDocument();

    // Test testimonials-only layout
    const testimonialsOnlyContent = {
      ...mockContent,
      layout: "testimonials-only" as const,
    };
    rerender(
      <SocialProof {...defaultProps} content={testimonialsOnlyContent} />,
    );

    expect(
      screen.getByText(/Esta solução transformou completamente/),
    ).toBeInTheDocument();
    expect(screen.queryAllByAltText(/Company/)).toHaveLength(0);
    expect(screen.queryByText(mockMetrics[0].value)).not.toBeInTheDocument();
  });

  it("applies correct data attributes for tracking", () => {
    render(<SocialProof {...defaultProps} />);

    const container = screen
      .getByText(mockContent.title!)
      .closest("[data-section]");
    expect(container).toHaveAttribute("data-section", "social-proof");
    expect(container).toHaveAttribute(
      "data-experiment-id",
      "social_proof_test",
    );
    expect(container).toHaveAttribute("data-variant-experiment", "default");
  });

  it("supports different variants", () => {
    const { rerender } = render(
      <SocialProof {...defaultProps} variant="logos-only" />,
    );

    let container = screen
      .getByText(mockContent.title!)
      .closest("[data-variant]");
    expect(container).toHaveAttribute("data-variant", "logos-only");

    rerender(<SocialProof {...defaultProps} variant="default" />);
    container = screen.getByText(mockContent.title!).closest("[data-variant]");
    expect(container).toHaveAttribute("data-variant", "default");
  });

  it("renders featured testimonials differently", () => {
    render(<SocialProof {...defaultProps} />);

    const featuredTestimonial = screen
      .getByText(/Esta solução transformou completamente/)
      .closest("[data-featured]");
    expect(featuredTestimonial).toHaveAttribute("data-featured", "true");
  });

  it("includes proper heading ID when provided", () => {
    const headingId = "social-proof-heading";
    render(<SocialProof {...defaultProps} headingId={headingId} />);

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveAttribute("id", headingId);
  });

  it("is accessible with proper ARIA labels", () => {
    render(<SocialProof {...defaultProps} />);

    // Check for proper alt texts on images
    mockLogos.forEach((logo) => {
      const img = screen.getByAltText(logo.alt);
      expect(img).toHaveAttribute("alt");
    });

    // Check testimonials have proper structure
    mockTestimonials.forEach((testimonial) => {
      const testimonialText = testimonial.quote.includes("Esta solução")
        ? /Esta solução transformou completamente/
        : /Excelente suporte/;
      const testimonialElement = screen
        .getByText(testimonialText)
        .closest("blockquote");
      expect(testimonialElement).toBeInTheDocument();
    });
  });

  it("handles empty content gracefully", () => {
    const emptyContent = {
      ...mockContent,
      logos: [],
      testimonials: [],
      metrics: [],
      layout: "full" as const,
    };

    expect(() => {
      render(<SocialProof {...defaultProps} content={emptyContent} />);
    }).not.toThrow();
  });

  it("renders avatars for testimonials when provided", () => {
    render(<SocialProof {...defaultProps} />);

    mockTestimonials.forEach((testimonial) => {
      if (testimonial.author.avatar) {
        const avatar = screen.getByAltText(
          `Avatar of ${testimonial.author.name}`,
        );
        expect(avatar).toBeInTheDocument();
      }
    });
  });
});
