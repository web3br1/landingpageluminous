// Unit Tests for Footer Component - Semana 4 Implementation
// Tests footer navigation and legal links with comprehensive coverage
// Target: 8+ test cases covering footer functionality

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Footer } from "@/components/sections/footer/footer";
import type { FooterContent } from "@/domains/marketing";

// Mock utils
vi.mock("@/lib/utils", () => ({
  cn: (...classes: (string | undefined | null | boolean)[]) =>
    classes.filter(Boolean).join(" "),
}));

describe("Footer Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockContent: FooterContent = {
    logo: {
      src: "/logo.svg",
      alt: "Company Logo",
      href: "/",
    },
    navigation: [
      {
        title: "Produto",
        links: [
          { label: "Recursos", href: "/features" },
          { label: "Preços", href: "/pricing" },
          { label: "Demonstração", href: "/demo" },
        ],
      },
      {
        title: "Empresa",
        links: [
          { label: "Sobre nós", href: "/about" },
          { label: "Carreiras", href: "/careers" },
          { label: "Contato", href: "/contact" },
        ],
      },
      {
        title: "Suporte",
        links: [
          { label: "Central de ajuda", href: "/help" },
          { label: "Documentação", href: "/docs" },
          { label: "Status", href: "/status" },
        ],
      },
    ],
    socialLinks: [
      {
        platform: "twitter",
        href: "https://twitter.com/company",
        label: "Twitter",
      },
      {
        platform: "linkedin",
        href: "https://linkedin.com/company/company",
        label: "LinkedIn",
      },
      {
        platform: "github",
        href: "https://github.com/company",
        label: "GitHub",
      },
    ],
    legalLinks: [
      { label: "Termos de uso", href: "/terms" },
      { label: "Política de privacidade", href: "/privacy" },
      { label: "Política de cookies", href: "/cookies" },
    ],
    copyright: "© 2024 Company. Todos os direitos reservados.",
    newsletterSignup: {
      title: "Fique por dentro",
      subtitle: "Receba as últimas novidades e atualizações",
      placeholder: "Seu melhor e-mail",
      cta: "Inscrever-se",
    },
  };

  describe("basic rendering", () => {
    it("should render footer with logo", () => {
      render(<Footer content={mockContent} />);

      const logo = screen.getByAltText("Company Logo");
      expect(logo).toBeInTheDocument();
      expect(logo.closest("a")).toHaveAttribute("href", "/");
    });

    it("should render navigation sections", () => {
      render(<Footer content={mockContent} />);

      expect(screen.getByText("Produto")).toBeInTheDocument();
      expect(screen.getByText("Empresa")).toBeInTheDocument();
      expect(screen.getByText("Suporte")).toBeInTheDocument();
    });

    it("should render navigation links", () => {
      render(<Footer content={mockContent} />);

      expect(screen.getByText("Recursos")).toBeInTheDocument();
      expect(screen.getByText("Preços")).toBeInTheDocument();
      expect(screen.getByText("Sobre nós")).toBeInTheDocument();
      expect(screen.getByText("Central de ajuda")).toBeInTheDocument();
    });

    it("should render social links", () => {
      render(<Footer content={mockContent} />);

      expect(screen.getByLabelText("Twitter")).toBeInTheDocument();
      expect(screen.getByLabelText("LinkedIn")).toBeInTheDocument();
      expect(screen.getByLabelText("GitHub")).toBeInTheDocument();
    });

    it("should render legal links", () => {
      render(<Footer content={mockContent} />);

      expect(screen.getByText("Termos de uso")).toBeInTheDocument();
      expect(screen.getByText("Política de privacidade")).toBeInTheDocument();
      expect(screen.getByText("Política de cookies")).toBeInTheDocument();
    });

    it("should render copyright text", () => {
      render(<Footer content={mockContent} />);

      expect(
        screen.getByText("© 2024 Company. Todos os direitos reservados."),
      ).toBeInTheDocument();
    });
  });

  describe("newsletter signup", () => {
    it("should render newsletter signup section", () => {
      render(<Footer content={mockContent} />);

      expect(screen.getByText("Fique por dentro")).toBeInTheDocument();
      expect(
        screen.getByText("Receba as últimas novidades e atualizações"),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Seu melhor e-mail"),
      ).toBeInTheDocument();
      expect(screen.getByText("Inscrever-se")).toBeInTheDocument();
    });

    it("should handle newsletter signup", async () => {
      const onNewsletterSignup = vi.fn();
      const user = userEvent.setup();

      render(
        <Footer
          content={mockContent}
          onNewsletterSignup={onNewsletterSignup}
        />,
      );

      const emailInput = screen.getByPlaceholderText("Seu melhor e-mail");
      const submitButton = screen.getByText("Inscrever-se");

      await user.type(emailInput, "test@example.com");
      await user.click(submitButton);

      expect(onNewsletterSignup).toHaveBeenCalledWith("test@example.com");
    });
  });

  describe("accessibility", () => {
    it("should have proper heading hierarchy", () => {
      render(<Footer content={mockContent} />);

      const headings = screen.getAllByRole("heading");
      expect(headings.length).toBeGreaterThan(0);
    });

    it("should have accessible navigation landmarks", () => {
      render(<Footer content={mockContent} />);

      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    it("should have descriptive link labels", () => {
      render(<Footer content={mockContent} />);

      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link).toHaveAccessibleName();
      });
    });

    it("should have proper form labels", () => {
      render(<Footer content={mockContent} />);

      const emailInput = screen.getByPlaceholderText("Seu melhor e-mail");
      expect(emailInput).toHaveAccessibleName();
    });
  });

  describe("interactions", () => {
    it("should handle navigation link clicks", async () => {
      const onNavClick = vi.fn();
      const user = userEvent.setup();

      render(<Footer content={mockContent} onNavClick={onNavClick} />);

      const featuresLink = screen.getByText("Recursos");
      await user.click(featuresLink);

      expect(onNavClick).toHaveBeenCalledWith("features", "/features");
    });

    it("should handle social link clicks", async () => {
      const onSocialClick = vi.fn();
      const user = userEvent.setup();

      render(<Footer content={mockContent} onSocialClick={onSocialClick} />);

      const twitterLink = screen.getByLabelText("Twitter");
      await user.click(twitterLink);

      expect(onSocialClick).toHaveBeenCalledWith(
        "twitter",
        "https://twitter.com/company",
      );
    });

    it("should handle legal link clicks", async () => {
      const onLegalClick = vi.fn();
      const user = userEvent.setup();

      render(<Footer content={mockContent} onLegalClick={onLegalClick} />);

      const termsLink = screen.getByText("Termos de uso");
      await user.click(termsLink);

      expect(onLegalClick).toHaveBeenCalledWith("terms", "/terms");
    });
  });

  describe("responsive behavior", () => {
    it("should adapt navigation layout for mobile", () => {
      Object.defineProperty(window, "innerWidth", { value: 375 });

      render(<Footer content={mockContent} />);

      const nav = screen.getByRole("navigation");
      expect(nav).toHaveAttribute("data-mobile", "true");
    });

    it("should adapt social links layout for desktop", () => {
      Object.defineProperty(window, "innerWidth", { value: 1024 });

      render(<Footer content={mockContent} />);

      const socialSection = screen
        .getByText("Fique por dentro")
        .closest("[data-desktop]");
      expect(socialSection).toHaveAttribute("data-desktop", "true");
    });
  });

  describe("empty states", () => {
    it("should handle missing navigation", () => {
      const contentWithoutNav = { ...mockContent, navigation: [] };
      render(<Footer content={contentWithoutNav} />);

      expect(screen.getByAltText("Company Logo")).toBeInTheDocument();
      expect(screen.queryByText("Produto")).not.toBeInTheDocument();
    });

    it("should handle missing social links", () => {
      const contentWithoutSocial = { ...mockContent, socialLinks: [] };
      render(<Footer content={contentWithoutSocial} />);

      expect(screen.getByText("Termos de uso")).toBeInTheDocument();
      expect(screen.queryByLabelText("Twitter")).not.toBeInTheDocument();
    });

    it("should handle missing newsletter signup", () => {
      const contentWithoutNewsletter = {
        ...mockContent,
        newsletterSignup: undefined,
      };
      render(<Footer content={contentWithoutNewsletter} />);

      expect(
        screen.getByText("© 2024 Company. Todos os direitos reservados."),
      ).toBeInTheDocument();
      expect(screen.queryByText("Fique por dentro")).not.toBeInTheDocument();
    });
  });
});
