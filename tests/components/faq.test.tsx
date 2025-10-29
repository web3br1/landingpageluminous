import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Faq } from "@/components/sections/faq/faq";

describe("FAQ Section", () => {
  const faqs = [
    {
      question: "Teste 1?",
      answer: "Resposta 1",
      category: "funcionalidades" as const,
    },
    {
      question: "Teste 2?",
      answer: "Resposta 2",
      category: "usabilidade" as const,
    },
  ];

  it("renders title, subtitle and items", () => {
    render(
      <Faq
        content={{
          title: "Perguntas frequentes",
          subtitle: "Sub",
          items: faqs,
        }}
      />,
    );

    expect(screen.getByText("Perguntas frequentes")).toBeInTheDocument();
    expect(screen.getByText("Sub")).toBeInTheDocument();
    expect(screen.getByText("Teste 1?")).toBeInTheDocument();
    expect(screen.getByText("Teste 2?")).toBeInTheDocument();
  });

  it("renders all FAQ items", () => {
    render(<Faq content={{ title: "FAQ", items: faqs }} />);

    // Shows both questions
    expect(screen.getByText("Teste 1?")).toBeInTheDocument();
    expect(screen.getByText("Teste 2?")).toBeInTheDocument();
  });

  it("toggles accordion to show answer", () => {
    render(<Faq content={{ title: "FAQ", items: faqs }} />);

    const q1Btn = screen.getByText("Teste 1?").closest("button");
    if (q1Btn) fireEvent.click(q1Btn);
    expect(screen.getByText("Resposta 1")).toBeInTheDocument();
  });
});
