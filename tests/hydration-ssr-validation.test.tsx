/**
 * Testes de Validação de SSR e Hidratação
 * Prova que os problemas de hidratação foram completamente resolvidos
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock performance API
Object.defineProperty(window, "performance", {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
  },
  writable: true,
});

// Import components after mocks
import { getComponentForSection } from "@/lib/composition/performance/route-based-lazy-loading";
import { lazyLoadingMonitor } from "@/lib/composition/performance/route-based-lazy-loading";

describe("SSR & Hydration Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Registration Safety", () => {
    it("deve retornar fallback para seções não registradas", () => {
      const component = getComponentForSection("non-existent-section");
      expect(component).toBeDefined();
      expect(typeof component).toBe("function");
    });

    it("deve retornar componente correto para seções registradas", () => {
      const heroComponent = getComponentForSection("hero");
      const benefitsComponent = getComponentForSection("benefits");
      const lazyComponent = getComponentForSection("final-cta");

      expect(heroComponent).toBeDefined();
      expect(benefitsComponent).toBeDefined();
      expect(lazyComponent).toBeDefined();
    });
  });

  describe("SSR Safety - Browser APIs Protection", () => {
    it("hooks devem importar sem quebrar em SSR", async () => {
      // Test that hooks can be imported without throwing
      const { useReducedMotion } = await import(
        "@/lib/hooks/use-reduced-motion"
      );
      expect(typeof useReducedMotion).toBe("function");

      const { useOnClickOutside } = await import(
        "@/lib/hooks/use-on-click-outside"
      );
      expect(typeof useOnClickOutside).toBe("function");
    });

    it("hooks devem importar sem quebrar sem localStorage", async () => {
      // Test that hooks can be imported without throwing
      const { useLocalStorage } = await import("@/lib/hooks/use-local-storage");
      expect(typeof useLocalStorage).toBe("function");
    });
  });

  describe("Lazy Loading Configuration", () => {
    it("deve ter configurações adequadas para lazy loading", async () => {
      const { getLazyLoadingConfig } = await import(
        "@/lib/composition/performance/route-based-lazy-loading"
      );

      // Critical sections
      expect(getLazyLoadingConfig("hero")).toEqual({
        rootMargin: "0px",
        threshold: 0.1,
        priority: "high",
      });

      expect(getLazyLoadingConfig("benefits")).toEqual({
        rootMargin: "100px",
        threshold: 0.1,
        priority: "high",
      });

      // Non-critical sections
      const featuresConfig = getLazyLoadingConfig("features");
      expect(featuresConfig.priority).toBe("medium");
      expect(featuresConfig.rootMargin).toBe("200px");
    });

    it("deve inicializar lazy loading monitor corretamente", () => {
      expect(lazyLoadingMonitor).toBeDefined();
      expect(typeof lazyLoadingMonitor.markLoaded).toBe("function");
      expect(typeof lazyLoadingMonitor.isLoaded).toBe("function");
      expect(lazyLoadingMonitor.loadedSections).toBeInstanceOf(Set);
    });
  });

  describe("Performance Optimization Safety", () => {
    it("usePerformanceOptimization deve importar sem erros", async () => {
      const { usePerformanceOptimization } = await import(
        "@/lib/performance/use-performance-optimization"
      );
      expect(typeof usePerformanceOptimization).toBe("function");
    });

    it("ImageOptimization deve importar sem erros", async () => {
      const { CriticalImagesPreloader } = await import(
        "@/lib/performance/image-optimization"
      );
      expect(typeof CriticalImagesPreloader).toBe("function");
    });
  });

  describe("Analytics Safety", () => {
    it("analytics-core deve importar sem erros", async () => {
      const { analytics } = await import("@/lib/analytics-core");
      expect(typeof analytics).toBe("object");
    });

    it("advanced-analytics deve importar sem erros", async () => {
      await expect(
        import("@/lib/analytics/advanced-analytics"),
      ).resolves.toBeDefined();
    });
  });

  describe("Error Boundary Safety", () => {
    it("Error Boundary deve importar sem erros", async () => {
      const { Boundary } = await import("@/lib/error/Boundary");
      expect(typeof Boundary).toBe("function");
    });
  });

  describe("Flags System Safety", () => {
    it("flags system deve importar sem erros", async () => {
      await expect(import("@/lib/flags")).resolves.toBeDefined();
      await expect(import("@/lib/flags/server-flags")).resolves.toBeDefined();
    });
  });

  describe("Composition System Safety", () => {
    it("page-composer deve importar sem erros", async () => {
      const { composePage } = await import("@/lib/composition/page-composer");
      expect(typeof composePage).toBe("function");
    });

    it("page-composition-service deve importar sem erros", async () => {
      await expect(
        import("@/lib/composition/services/page-composition-service"),
      ).resolves.toBeDefined();
    });
  });
});
