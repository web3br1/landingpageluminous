import React from "react";
import { render, screen } from "@testing-library/react";
import Page from "@/app/page";

// Suppress Next.js warnings for SSR context during tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.("headers") && args[0]?.includes?.("request scope"))
    return;
  if (args[0]?.includes?.("cookies") && args[0]?.includes?.("request scope"))
    return;
  originalWarn.apply(console, args);
};

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

// Mock composition system
vi.mock("@/lib/composition/page-composer", () => ({
  composePageFull: vi.fn().mockResolvedValue({
    metadata: {
      title: "DataFlow Brasil - Automatize seus Relatórios",
      description:
        "Plataforma completa de business intelligence para PMEs brasileiras",
      keywords: [
        "business intelligence",
        "relatórios automáticos",
        "BI Brasil",
      ],
    },
    sections: [
      {
        id: "hero",
        component: "Hero",
        order: 1,
        content: {
          headline: "Transforme seu negócio",
          subheadline: "Automatize processos e aumente produtividade",
          primaryCta: "Comece agora",
          secondaryCta: "Saiba mais",
        },
      },
    ],
    pageType: "landing",
    experiments: [],
    analytics: {
      pageType: "landing" as const,
      conversionGoals: ["cta_click"],
    },
  }),
  generateMetadata: vi.fn(),
}));

// Mock the entire composition system
vi.mock("@/lib/composition/performance/route-based-lazy-loading", () => ({
  getComponentForSection: vi.fn().mockImplementation((sectionId: string) => {
    if (sectionId === "hero") {
      // Return a simple mock component instead of the real Hero
      return ({ content }: any) =>
        React.createElement(
          "div",
          {
            "data-testid": "mock-hero",
            "data-content": JSON.stringify(content),
          },
          "Mock Hero Component",
        );
    }
    return null;
  }),
  getSectionPriority: vi.fn().mockReturnValue("critical"),
  shouldUseLazyLoading: vi.fn().mockReturnValue(false),
  getLazyLoadingConfig: vi
    .fn()
    .mockReturnValue({ rootMargin: "50px", threshold: 0.1 }),
  lazyLoadingMonitor: { markLoaded: vi.fn() },
}));

vi.mock("@/lib/composition/container", () => ({
  getSSRAdapter: vi.fn().mockReturnValue({
    isServerContext: vi.fn().mockReturnValue(false),
  }),
}));

vi.mock("@/lib/composition/page-renderer", () => ({
  PageRenderer: ({
    composition,
    pageType,
  }: {
    composition?: any;
    pageType?: string;
  }) =>
    React.createElement(
      "div",
      {
        "data-testid": "page-renderer",
        "data-page-type": pageType,
      },
      React.createElement(
        "div",
        { "data-testid": "metadata-title" },
        composition?.metadata?.title,
      ),
      React.createElement(
        "div",
        { "data-testid": "metadata-description" },
        composition?.metadata?.description,
      ),
      // Render sections for testing
      composition?.sections?.map((section: any) =>
        React.createElement(
          "div",
          {
            key: section.id,
            "data-testid": `section-${section.id}`,
            "data-section": section.id,
          },
          `Section: ${section.id}`,
        ),
      ),
    ),
}));

describe("Main Page (app/page.tsx)", () => {
  beforeEach(() => {
    // Clear all mocks before each test for proper isolation
    vi.clearAllMocks();
  });

  it("renders the main landing page", async () => {
    render(await Page());

    expect(screen.getByTestId("page-renderer")).toBeInTheDocument();
    expect(screen.getByTestId("page-renderer")).toHaveAttribute(
      "data-page-type",
      "landing",
    );
  });

  it("passes correct metadata to renderer", async () => {
    render(await Page());

    expect(screen.getByTestId("metadata-title")).toHaveTextContent(
      "DataFlow Brasil - Automatize seus Relatórios",
    );
    expect(screen.getByTestId("metadata-description")).toHaveTextContent(
      "Plataforma completa de business intelligence para PMEs brasileiras",
    );
  });

  it("handles composition loading errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Mock failed composition
    const { composePageFull } = await import("@/lib/composition/page-composer");
    vi.mocked(composePageFull).mockRejectedValueOnce(
      new Error("Composition failed"),
    );

    render(await Page());

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error rendering landing page:",
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  it("handles null composition gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Mock null composition
    const { composePageFull } = await import("@/lib/composition/page-composer");
    vi.mocked(composePageFull).mockResolvedValueOnce(null);

    render(await Page());

    expect(consoleSpy).toHaveBeenCalledWith(
      "No composition returned for landing page",
    );

    consoleSpy.mockRestore();
  });
});
