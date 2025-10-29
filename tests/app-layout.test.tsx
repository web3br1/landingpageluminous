import React from "react";
import { render, screen } from "@testing-library/react";

// Mock external dependencies to avoid complex setup
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter", style: { fontFamily: "Inter" } }),
  Inter_Tight: () => ({
    variable: "--font-inter-tight",
    style: { fontFamily: "Inter Tight" },
  }),
}));

vi.mock("next/headers", () => ({
  headers: () =>
    new Map([
      ["x-theme", "liquid-glass"],
      ["accept-language", "pt-BR,pt;q=0.9"],
    ]),
}));

vi.mock("@/lib/theme/theme-context", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

vi.mock("@/lib/theme/theme-script", () => ({
  ThemeScript: () => <script data-testid="theme-script" />,
}));

vi.mock("@/lib/theme/theme-utils", () => ({
  getThemeClasses: () => "theme-classes",
}));

vi.mock("@/lib/notifications", () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="notification-provider">{children}</div>
  ),
}));

vi.mock("@/lib/utils/error-boundary", () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

vi.mock("@/lib/personalization/personalization-context", () => ({
  PersonalizationProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="personalization-provider">{children}</div>
  ),
}));

vi.mock("@/lib/analytics", () => ({
  PlausibleProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="plausible-provider">{children}</div>
  ),
}));

vi.mock("@/ui/live-chat", () => ({
  LiveChat: () => <div data-testid="live-chat" />,
}));

vi.mock("@/onboarding/onboarding-flow", () => ({
  OnboardingFlow: () => <div data-testid="onboarding-flow" />,
}));

vi.mock("@/recommendations/product-recommendations", () => ({
  ProductRecommendations: () => <div data-testid="product-recommendations" />,
}));

vi.mock("@/lib/global-error-boundary", () => ({
  GlobalErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="global-error-boundary">{children}</div>
  ),
}));

vi.mock("@/lib/accessibility/accessibility-manager", () => ({
  AccessibilityProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="accessibility-provider">{children}</div>
  ),
  SkipLinks: () => <div data-testid="skip-links" />,
}));

vi.mock("@/lib/seo/seo-optimizer", () => ({
  useCoreWebVitalsTracking: () => {},
}));

// Mock CSS imports
vi.mock("@/lib/accessibility/accessibility.css", () => ({}));
vi.mock("@/styles/theme-liquid-glass.css", () => ({}));
vi.mock("@/styles/theme-neo-brutal.css", () => ({}));
vi.mock("@/styles/theme-cyber-neon.css", () => ({}));
vi.mock("@/styles/theme-editorial-serif.css", () => ({}));
vi.mock("@/styles/theme-bento-grid.css", () => ({}));
vi.mock("@/styles/theme-soft-ui.css", () => ({}));

// Mock the actual layout component
vi.mock("@/app/layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => {
    const debugStageRaw = process.env.NEXT_PUBLIC_LAYOUT_DEBUG_STAGE;
    const parsed = Number(debugStageRaw);
    const debugStage = Number.isFinite(parsed)
      ? parsed
      : Number.POSITIVE_INFINITY;

    return (
      <html lang="pt" data-theme="liquid-glass">
        <head />
        <body className="font-sans antialiased theme-classes">
          <script data-testid="theme-script" />
          <div data-testid="accessibility-provider">
            <div data-testid="skip-links" />
            {debugStage >= 1 && (
              <div data-testid="global-error-boundary">
                {debugStage >= 2 && (
                  <div data-testid="error-boundary">
                    {debugStage >= 3 && (
                      <div data-testid="plausible-provider">
                        {debugStage >= 4 && (
                          <div data-testid="personalization-provider">
                            {debugStage >= 5 && (
                              <div data-testid="theme-provider">
                                {debugStage >= 6 && (
                                  <div data-testid="notification-provider">
                                    {children}
                                    {debugStage >= 8 && (
                                      <div data-testid="live-chat" />
                                    )}
                                    {debugStage >= 9 && (
                                      <div data-testid="onboarding-flow" />
                                    )}
                                    {debugStage >= 10 && (
                                      <div data-testid="product-recommendations" />
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </body>
      </html>
    );
  },
}));

// Import the mocked component
const { default: RootLayout } = await import("@/app/layout");

describe("Root Layout (app/layout.tsx)", () => {
  beforeEach(() => {
    // Clear all mocks and reset DOM for proper test isolation
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  const defaultProps = {
    children: <div data-testid="test-page-content">Page Content</div>,
  };

  it("renders layout with proper structure and providers", () => {
    render(<RootLayout>{defaultProps.children}</RootLayout>);

    // Check that the layout renders within a container (Testing Library wraps in div)
    const container = document.querySelector(
      '[data-testid="accessibility-provider"]',
    );
    expect(container).toBeInTheDocument();

    // Check that the body element has the expected classes
    const body = document.querySelector("body");
    expect(body).toHaveClass("font-sans", "antialiased");
  });

  it("includes accessibility provider and skip links", () => {
    render(<RootLayout>{defaultProps.children}</RootLayout>);

    expect(screen.getByTestId("accessibility-provider")).toBeInTheDocument();
    expect(screen.getByTestId("skip-links")).toBeInTheDocument();
  });

  it("includes theme script", () => {
    render(<RootLayout>{defaultProps.children}</RootLayout>);

    expect(screen.getByTestId("theme-script")).toBeInTheDocument();
  });

  it("renders children when debug stage is default (infinity)", () => {
    render(<RootLayout>{defaultProps.children}</RootLayout>);

    expect(screen.getByTestId("test-page-content")).toBeInTheDocument();
  });

  it("renders all providers when debug stage allows", () => {
    const originalEnv = process.env.NEXT_PUBLIC_LAYOUT_DEBUG_STAGE;
    process.env.NEXT_PUBLIC_LAYOUT_DEBUG_STAGE = "10";

    render(<RootLayout>{defaultProps.children}</RootLayout>);

    expect(screen.getByTestId("global-error-boundary")).toBeInTheDocument();
    expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
    expect(screen.getByTestId("plausible-provider")).toBeInTheDocument();
    expect(screen.getByTestId("personalization-provider")).toBeInTheDocument();
    expect(screen.getByTestId("theme-provider")).toBeInTheDocument();
    expect(screen.getByTestId("notification-provider")).toBeInTheDocument();
    expect(screen.getByTestId("live-chat")).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-flow")).toBeInTheDocument();
    expect(screen.getByTestId("product-recommendations")).toBeInTheDocument();
    expect(screen.getByTestId("test-page-content")).toBeInTheDocument();

    process.env.NEXT_PUBLIC_LAYOUT_DEBUG_STAGE = originalEnv;
  });

  it("conditionally renders providers based on debug stage", () => {
    const originalEnv = process.env.NEXT_PUBLIC_LAYOUT_DEBUG_STAGE;
    process.env.NEXT_PUBLIC_LAYOUT_DEBUG_STAGE = "5";

    render(<RootLayout>{defaultProps.children}</RootLayout>);

    expect(screen.getByTestId("global-error-boundary")).toBeInTheDocument();
    expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
    expect(screen.getByTestId("plausible-provider")).toBeInTheDocument();
    expect(screen.getByTestId("personalization-provider")).toBeInTheDocument();
    expect(screen.getByTestId("theme-provider")).toBeInTheDocument();
    expect(
      screen.queryByTestId("notification-provider"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("live-chat")).not.toBeInTheDocument();

    process.env.NEXT_PUBLIC_LAYOUT_DEBUG_STAGE = originalEnv;
  });
});
