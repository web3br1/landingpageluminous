import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { jest } from "vitest";
import { setupBrowserAPIs } from "@/lib/test/test-utils";

// Import ThemeProvider for UI components
import { ThemeProvider } from "@/lib/theme/theme-context";

// Test wrapper with ThemeProvider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider defaultTheme={{ mode: "light" }}>{children}</ThemeProvider>
);

// Custom render function that includes ThemeProvider
const customRender = (ui: React.ReactElement) =>
  render(ui, { wrapper: TestWrapper });

// Mock do analytics
const mockAnalytics = vi.fn();
vi.mock("@/lib/analytics", () => ({
  trackEvent: mockAnalytics,
  CTA_CLICK: "cta_click",
}));

// Mock do Next.js router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock for shadcn/ui components that require theme context
vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className, ...props }: Record<string, unknown>) =>
    React.createElement(
      "div",
      {
        className: `rounded-lg border bg-card text-card-foreground shadow-sm ${className || ""}`,
        ...props,
      },
      children,
    ),
  CardHeader: ({ children, className, ...props }: Record<string, unknown>) =>
    React.createElement(
      "div",
      {
        className: `flex flex-col space-y-1.5 p-6 ${className || ""}`,
        ...props,
      },
      children,
    ),
  CardTitle: ({ children, className, ...props }: Record<string, unknown>) =>
    React.createElement(
      "h3",
      {
        className: `text-2xl font-semibold leading-none tracking-tight ${className || ""}`,
        ...props,
      },
      children,
    ),
  CardDescription: ({
    children,
    className,
    ...props
  }: Record<string, unknown>) =>
    React.createElement(
      "p",
      {
        className: `text-sm text-muted-foreground ${className || ""}`,
        ...props,
      },
      children,
    ),
  CardContent: ({ children, className, ...props }: Record<string, unknown>) =>
    React.createElement(
      "div",
      {
        className: `p-6 pt-0 ${className || ""}`,
        ...props,
      },
      children,
    ),
  CardFooter: ({ children, className, ...props }: Record<string, unknown>) =>
    React.createElement(
      "div",
      {
        className: `flex items-center p-6 pt-0 ${className || ""}`,
        ...props,
      },
      children,
    ),
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({
    children,
    variant = "default",
    className,
    ...props
  }: Record<string, unknown>) => {
    const variantClasses: Record<string, string> = {
      default: "bg-primary text-primary-foreground hover:bg-primary/80",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/80",
      outline:
        "text-foreground border border-input hover:bg-accent hover:text-accent-foreground",
    };

    return React.createElement(
      "span",
      {
        className: `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantClasses[variant] || variantClasses.default} ${className || ""}`,
        ...props,
      },
      children,
    );
  },
}));

// Import components after mocks
import { CtaButton } from "@/app/(marketing)/components/ui/cta-button";
import { Section } from "@/app/(marketing)/components/ui/section";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/app/(marketing)/components/ui/card";
import { Badge } from "@/app/(marketing)/components/ui/badge";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/app/(marketing)/components/ui/avatar";
import { FadeUp } from "@/components/ui/fade-up-optimized";

describe("UI Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("CtaButton", () => {
    it("renders with custom children", () => {
      customRender(<CtaButton>Custom Text</CtaButton>);

      expect(screen.getByText("Custom Text")).toBeInTheDocument();
    });

    it("handles click events", () => {
      const handleClick = vi.fn();
      customRender(<CtaButton onClick={handleClick}>Clickable</CtaButton>);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("supports additional props", () => {
      customRender(
        <CtaButton className="custom-class">Custom Button</CtaButton>,
      );

      const button = screen.getByRole("button", { name: "Custom Button" });
      expect(button).toHaveClass("custom-class");
    });

    it("has proper accessibility attributes", () => {
      customRender(<CtaButton>Accessible Button</CtaButton>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });
  });

  describe("Section", () => {
    it("renders with required id prop", () => {
      customRender(
        <Section id="test-section">
          <p>Section content</p>
        </Section>,
      );

      const section = document.getElementById("test-section");
      expect(section).toBeInTheDocument();
      expect(screen.getByText("Section content")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      customRender(
        <Section id="custom-section" className="custom-spacing">
          <div>Content</div>
        </Section>,
      );

      const section = document.getElementById("custom-section");
      expect(section).toHaveClass("custom-spacing");
    });

    it("renders children correctly", () => {
      customRender(
        <Section id="children-section">
          <h1>Main Title</h1>
          <p>Description text</p>
          <button>Action</button>
        </Section>,
      );

      expect(screen.getByText("Main Title")).toBeInTheDocument();
      expect(screen.getByText("Description text")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /action/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Card Components", () => {
    it("renders Card with content", () => {
      customRender(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Test content</p>
          </CardContent>
        </Card>,
      );

      expect(screen.getByText("Test Title")).toBeInTheDocument();
      expect(screen.getByText("Test Description")).toBeInTheDocument();
      expect(screen.getByText("Test content")).toBeInTheDocument();
    });

    it("renders Card with footer", () => {
      customRender(
        <Card>
          <CardContent>Main content</CardContent>
          <CardFooter>Footer content</CardFooter>
        </Card>,
      );

      expect(screen.getByText("Main content")).toBeInTheDocument();
      expect(screen.getByText("Footer content")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      customRender(
        <Card className="custom-class">
          <CardContent>Test</CardContent>
        </Card>,
      );

      const card = screen.getByText("Test").closest(".custom-class");
      expect(card).toBeInTheDocument();
    });
  });

  describe("Badge", () => {
    it("renders with default variant", () => {
      customRender(<Badge>Default Badge</Badge>);

      const badge = screen.getByText("Default Badge");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("bg-primary");
    });

    it("renders with secondary variant", () => {
      customRender(<Badge variant="secondary">Secondary Badge</Badge>);

      const badge = screen.getByText("Secondary Badge");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("bg-secondary");
    });

    it("renders with destructive variant", () => {
      customRender(<Badge variant="destructive">Destructive Badge</Badge>);

      const badge = screen.getByText("Destructive Badge");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("bg-destructive");
    });

    it("renders with outline variant", () => {
      customRender(<Badge variant="outline">Outline Badge</Badge>);

      const badge = screen.getByText("Outline Badge");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("border");
    });

    it("applies custom className", () => {
      customRender(<Badge className="custom-badge">Custom Badge</Badge>);

      const badge = screen.getByText("Custom Badge");
      expect(badge).toHaveClass("custom-badge");
    });
  });

  describe("Avatar", () => {
    it("renders fallback when no image provided", () => {
      customRender(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>,
      );

      expect(screen.getByText("JD")).toBeInTheDocument();
    });
  });

  describe("FadeUp", () => {
    it("renders children with animation", () => {
      // Use centralized browser API mocks for consistent testing
      // ✅ Resolvido: APIs Browser - Uma chamada resolve todos os mocks necessários
      setupBrowserAPIs();

      customRender(
        <FadeUp>
          <div data-testid="animated-content">Animated Content</div>
        </FadeUp>,
      );

      expect(screen.getByTestId("animated-content")).toBeInTheDocument();
      expect(screen.getByTestId("animated-content")).toHaveTextContent(
        "Animated Content",
      );
    });
  });
});
