import React from "react";
import { render, screen } from "@testing-library/react";
import { ProofTraction } from "@/components/sections/proof-traction/proof-traction";
import type { ProofTractionContent } from "@/domains/marketing/types/proof-traction.types";
import { vi } from "vitest";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// Mock components
vi.mock("@/app/(marketing)/components/ui/section", () => ({
  Section: ({ children, id, className }: Record<string, unknown>) => (
    <section id={id} className={className}>
      {children}
    </section>
  ),
}));

vi.mock("@/app/(marketing)/components/ui/fade-up", () => ({
  FadeUp: ({
    children,
    delay,
  }: {
    children: React.ReactNode;
    delay?: number;
  }) => <div data-delay={delay}>{children}</div>,
}));

describe("ProofTraction Component", () => {
  const mockContent: ProofTractionContent = {
    title: "Prova Social",
    subtitle: "Resultados comprovados pelos nossos clientes",
    metrics: [
      {
        value: "10k+",
        label: "Usuários Ativos",
        description: "Pessoas confiam na nossa solução",
      },
      {
        value: "99.9%",
        label: "Uptime",
        description: "Disponibilidade garantida",
      },
    ],
    testimonials: [
      {
        quote: "Excelente solução!",
        author: {
          name: "João Silva",
          role: "CTO",
          company: "TechCorp",
          avatar: "/avatar.jpg",
        },
        rating: 5,
      },
    ],
  };

  it("renders the component with title and subtitle", () => {
    render(<ProofTraction content={mockContent} />);

    expect(screen.getByText("Prova Social")).toBeInTheDocument();
    expect(
      screen.getByText("Resultados comprovados pelos nossos clientes"),
    ).toBeInTheDocument();
  });

  it("renders metrics when provided", () => {
    render(<ProofTraction content={mockContent} />);

    expect(screen.getByText("10k+")).toBeInTheDocument();
    expect(screen.getByText("Usuários Ativos")).toBeInTheDocument();
    expect(screen.getByText("99.9%")).toBeInTheDocument();
    expect(screen.getByText("Uptime")).toBeInTheDocument();
  });

  it("handles testimonials in content without crashing", () => {
    render(<ProofTraction content={mockContent} />);

    // Component should not crash with testimonials in content
    expect(screen.getByText("Prova Social")).toBeInTheDocument();
  });

  it("applies custom sectionId when provided", () => {
    render(<ProofTraction content={mockContent} sectionId="custom-proof" />);

    const section = document.getElementById("custom-proof");
    expect(section).toBeInTheDocument();
  });

  it("renders without title and subtitle", () => {
    const contentWithoutTitle: ProofTractionContent = {
      metrics: mockContent.metrics,
    };

    render(<ProofTraction content={contentWithoutTitle} />);

    expect(screen.getByText("10k+")).toBeInTheDocument();
  });

  it("renders empty metrics array", () => {
    const contentWithEmptyMetrics: ProofTractionContent = {
      title: "Test",
      metrics: [],
    };

    render(<ProofTraction content={contentWithEmptyMetrics} />);

    expect(screen.getByText("Test")).toBeInTheDocument();
    // Should not crash with empty metrics
  });
});
