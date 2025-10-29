/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { OptimizedLazySection } from "@/lib/composition/performance/optimized-lazy-section";

// Mock do route-based-lazy-loading para controlar o comportamento
vi.mock("@/lib/composition/performance/route-based-lazy-loading.tsx", () => ({
  getComponentForSection: vi.fn(),
  getLazyLoadingConfig: vi.fn(() => ({
    rootMargin: "50px",
    threshold: 0.1,
  })),
  lazyLoadingMonitor: {
    markLoaded: vi.fn(),
  },
  shouldUseLazyLoading: vi.fn(() => false), // Por padrão, não lazy
  getSectionPriority: vi.fn(() => "important"),
}));

// Mock do container para controlar SSR
vi.mock("@/lib/composition/container", () => ({
  getSSRAdapter: vi.fn(() => ({
    isServerContext: vi.fn(() => false), // Client-side por padrão
    safeLocalStorageAccess: vi.fn(() => []),
  })),
}));

// Mock do Hero component
const MockHero = ({ content, variant, id }: any) => (
  <div data-testid={`hero-${id}`}>
    <h1>{content?.headline || "Hero Title"}</h1>
    <p>{content?.subheadline || "Hero Subtitle"}</p>
    <button>{content?.primaryCta || "CTA"}</button>
  </div>
);

describe("OptimizedLazySection - Critical Bug Prevention", () => {
  const mockHeroSection = {
    id: "hero",
    component: "Hero",
    content: {
      headline: "Test Headline",
      subheadline: "Test Subheadline",
      primaryCta: "Test CTA",
    },
    order: 1,
  };

  const mockNonCriticalSection = {
    id: "features",
    component: "Features",
    content: {
      title: "Features Title",
    },
    order: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Critical Section Rendering (Hero)", () => {
    it("renders Hero synchronously without lazy loading", async () => {
      const { getComponentForSection } =
        require("@/lib/composition/performance/route-based-lazy-loading.tsx")(
          getComponentForSection as any,
        ).mockReturnValue(MockHero);

      const { getSSRAdapter } = require("@/lib/composition/container");
      getSSRAdapter.mockReturnValue({
        isServerContext: () => false,
        safeLocalStorageAccess: () => [],
      });

      render(<OptimizedLazySection section={mockHeroSection} index={0} />);

      // Hero deve aparecer imediatamente (não lazy)
      await waitFor(() => {
        expect(screen.getByTestId("hero-hero")).toBeInTheDocument();
      });

      expect(screen.getByText("Test Headline")).toBeInTheDocument();
      expect(screen.getByText("Test Subheadline")).toBeInTheDocument();
      expect(screen.getByText("Test CTA")).toBeInTheDocument();
    });

    it('prevents "Element type is invalid" by validating components', async () => {
      const { getComponentForSection } =
        require("@/lib/composition/performance/route-based-lazy-loading.tsx")(
          getComponentForSection as any,
        ).mockReturnValue(null); // Componente não encontrado

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(<OptimizedLazySection section={mockHeroSection} index={0} />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            "[section:hero] Component not found in registry",
          ),
        );
      });

      // Deve mostrar fallback visível para seções críticas
      expect(
        screen.getByText("Seção Temporariamente Indisponível"),
      ).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it("uses correct content structure (direct content, no nesting)", async () => {
      const { getComponentForSection } =
        require("@/lib/composition/performance/route-based-lazy-loading.tsx")(
          getComponentForSection as any,
        ).mockReturnValue(MockHero);

      render(<OptimizedLazySection section={mockHeroSection} index={0} />);

      await waitFor(() => {
        expect(screen.getByTestId("hero-hero")).toBeInTheDocument();
      });

      // Verifica que o componente recebeu o content correto
      // (não podemos verificar props diretamente, mas podemos verificar se renderizou)
      expect(screen.getByText("Test Headline")).toBeInTheDocument();
    });
  });

  describe("Non-Critical Section Rendering", () => {
    it("renders non-critical sections normally", async () => {
      const { getComponentForSection } =
        require("@/lib/composition/performance/route-based-lazy-loading.tsx")(
          getComponentForSection as any,
        ).mockReturnValue(({ content, id }: any) => (
          <div data-testid={`features-${id}`}>
            <h2>{content?.title || "Features"}</h2>
          </div>
        ));

      render(
        <OptimizedLazySection section={mockNonCriticalSection} index={1} />,
      );

      await waitFor(() => {
        expect(screen.getByTestId("features-features")).toBeInTheDocument();
      });

      expect(screen.getByText("Features Title")).toBeInTheDocument();
    });
  });

  describe("Error Handling and Fallbacks", () => {
    it("shows visible fallback for critical sections when component fails", async () => {
      const { getComponentForSection } =
        require("@/lib/composition/performance/route-based-lazy-loading.tsx")(
          getComponentForSection as any,
        ).mockImplementation(() => {
          throw new Error("Component loading failed");
        });

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(<OptimizedLazySection section={mockHeroSection} index={0} />);

      await waitFor(() => {
        expect(
          screen.getByText("Seção Temporariamente Indisponível"),
        ).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("SSR render failed for hero"),
      );

      consoleSpy.mockRestore();
    });

    it("shows minimal fallback for non-critical sections", async () => {
      const { getComponentForSection } =
        require("@/lib/composition/performance/route-based-lazy-loading.tsx")(
          getComponentForSection as any,
        ).mockReturnValue(undefined);

      render(
        <OptimizedLazySection section={mockNonCriticalSection} index={1} />,
      );

      // Para seções não críticas, deve mostrar um loading simples
      // Não podemos verificar diretamente o spinner, mas verificamos que não quebrou
      expect(screen.getByRole("region")).toBeInTheDocument();
    });
  });

  describe("Performance and Attributes", () => {
    it("adds critical-sync attribute to critical sections", async () => {
      const { getComponentForSection } =
        require("@/lib/composition/performance/route-based-lazy-loading.tsx")(
          getComponentForSection as any,
        ).mockReturnValue(MockHero);

      render(<OptimizedLazySection section={mockHeroSection} index={0} />);

      await waitFor(() => {
        const section = screen.getByTestId("hero-hero").closest("section");
        expect(section).toHaveAttribute("data-critical-sync", "true");
      });
    });

    it("adds proper data attributes for debugging", async () => {
      const { getComponentForSection } =
        require("@/lib/composition/performance/route-based-lazy-loading.tsx")(
          getComponentForSection as any,
        ).mockReturnValue(MockHero);

      render(<OptimizedLazySection section={mockHeroSection} index={0} />);

      await waitFor(() => {
        const section = screen.getByTestId("hero-hero").closest("section");
        expect(section).toHaveAttribute("data-section", "hero");
        expect(section).toHaveAttribute("data-testid", "section-hero");
        expect(section).toHaveAttribute("data-ssr", "false"); // Client-side test
        expect(section).toHaveAttribute("data-priority");
      });
    });
  });
});
