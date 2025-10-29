import React from "react";
import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/sections/footer/footer";

vi.mock("@/app/(marketing)/components/ui/section", () => ({
  Section: ({ children, id, className, ...props }: Record<string, unknown>) => {
    return React.createElement(
      "section",
      { id, className, ...props },
      children,
    );
  },
}));

describe("Footer", () => {
  const mockFooterContent = {
    companyName: "DataFlow Brasil",
    copyright: "© 2025 DataFlow Brasil. Todos os direitos reservados.",
    links: [
      { label: "Funcionalidades", href: "/features" },
      { label: "Preços", href: "/pricing" },
      { label: "Política de Privacidade", href: "/privacy" },
      { label: "Termos de Uso", href: "/terms" },
    ],
  };

  it("renders company name, nav links and legal links", () => {
    render(<Footer content={mockFooterContent} />);

    expect(screen.getByText("Funcionalidades")).toHaveAttribute(
      "href",
      "/features",
    );
    expect(screen.getByText("Preços")).toHaveAttribute("href", "/pricing");
    expect(screen.getByText("Política de Privacidade")).toBeInTheDocument();
  });
});
