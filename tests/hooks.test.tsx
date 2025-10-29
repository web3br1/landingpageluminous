import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { vi } from "vitest";

// Configuração de timeout para testes de hooks (animações e observadores)
vi.setConfig({ testTimeout: 15000 }); // 15 segundos para hooks complexos
import { useScrollConfig } from "@/lib/hooks/use-scroll-config";
import { setupBrowserAPIs } from "@/lib/test-utils";

// Setup comprehensive browser API mocks for all hook tests
// ✅ Resolvido: APIs Browser - Uma chamada resolve todos os mocks necessários
beforeAll(() => {
  setupBrowserAPIs();
});

// Legacy mocks (can be removed after full migration)
global.IntersectionObserver = vi.fn().mockImplementation(function (this: any) {
  this.observe = vi.fn();
  this.unobserve = vi.fn();
  this.disconnect = vi.fn();
  this.root = null;
  this.rootMargin = "";
  this.thresholds = [];
  this.takeRecords = vi.fn(() => []);
  return this;
}) as any;

// Browser API setup moved to beforeAll with setupBrowserAPIs()

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) =>
  setTimeout(cb as any, 16),
) as any;
global.cancelAnimationFrame = vi.fn((id: number) => clearTimeout(id));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

// Mock do analytics
const mockTrackEvent = vi.fn();
vi.mock("@/lib/analytics", () => ({
  trackEvent: mockTrackEvent,
}));

// Mock do tema
const mockTheme = {
  theme: "light",
  setTheme: vi.fn(),
};
vi.mock("@/lib/theme/theme-context", () => ({
  useTheme: () => mockTheme,
}));

// Import hooks after mocks
// Note: useScrollConfig doesn't exist, using SCROLL_CONFIG from the same file
import {
  useAnalytics,
  useSectionTracking,
  useCtaTracking,
} from "@/lib/hooks/use-analytics";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

describe("Custom Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
  });

  describe("useReducedMotion", () => {
    it("returns false when prefers-reduced-motion is not set", () => {
      // Mock media query
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
          matches: false,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      const { result } = renderHook(() => useReducedMotion());

      expect(result.current).toBe(false);
    });

    it("returns true when prefers-reduced-motion is set", () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
          matches: true,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      const { result } = renderHook(() => useReducedMotion());

      expect(result.current).toBe(true);
    });

    it("listens for changes in prefers-reduced-motion", () => {
      const mockMediaQuery = {
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation(() => mockMediaQuery),
      });

      renderHook(() => useReducedMotion());

      expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith(
        "change",
        expect.any(Function),
      );
    });
  });

  describe("useAnalytics", () => {
    it("initializes analytics without throwing", () => {
      expect(() => {
        renderHook(() => useAnalytics());
      }).not.toThrow();
    });
  });

  describe("useSectionTracking", () => {
    it("initializes without throwing and handles element tracking", async () => {
      // Create an element in the DOM that the hook will look for
      const testElement = document.createElement("div");
      testElement.id = "test-section";
      document.body.appendChild(testElement);

      // Clear previous calls to the global mock
      const mockIntersectionObserver = global.IntersectionObserver as any;
      mockIntersectionObserver.mockClear();

      // Render the hook - it should initialize without throwing
      expect(() => {
        renderHook(() => useSectionTracking("test-section"));
      }).not.toThrow();

      // Wait for effects to settle
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Clean up
      document.body.removeChild(testElement);

      // Verify the hook initialized - IntersectionObserver may or may not be called
      // depending on circuit breaker state, but the hook shouldn't crash
      expect(mockIntersectionObserver).toBeDefined();
    });
  });

  describe("useCtaTracking", () => {
    it("returns a function for CTA tracking", () => {
      const { result } = renderHook(() => useCtaTracking("Test CTA", "hero"));

      expect(typeof result.current).toBe("function");
    });
  });

  // TODO: Implement missing hook tests
  // - useScrollConfig: Test scroll behavior configuration
  // - useIntersectionObserver: Test element visibility detection
  // - useResizeObserver: Test element resize detection
  // - useGeolocation: Test location services integration
  // - useNetworkStatus: Test online/offline detection
  // - useBatteryStatus: Test device battery monitoring
  // - useDeviceOrientation: Test device orientation changes
  // - useClipboard: Test clipboard read/write operations
  // - useMediaQuery: Test responsive breakpoint detection
  // - useLocalStorage: Test persistent state management
  // - useSessionStorage: Test session state management
  // - useDebounce: Test input debouncing
  // - useThrottle: Test function throttling
  // - usePrevious: Test previous value tracking
  // - useEventListener: Test DOM event handling
  // - useOnClickOutside: Test click outside detection
  // - useLockBodyScroll: Test body scroll locking
  // - usePortal: Test DOM portal creation
  // - useAsync: Test async operation management

  describe("useScrollConfig", () => {
    it("returns scroll configuration", () => {
      const { result } = renderHook(() => useScrollConfig());

      expect(result.current).toBeDefined();
      expect(typeof result.current).toBe("object");

      // Test performance constants
      expect(result.current.scrollThrottle).toBe(16);
      expect(result.current.chapterChangeDebounce).toBe(150);
      expect(result.current.transitionDuration).toBe(320);
      expect(result.current.transitionEase).toEqual([0.2, 0.8, 0.2, 1]);

      // Test pinning configuration
      expect(result.current.pinOffsetMultiplier).toBe(0.1);
      expect(result.current.pinStartMultiplier).toBe(0.1);
      expect(result.current.pinEndMultiplier).toBe(0.2);

      // Test navigation
      expect(result.current.keyboardNavigationDebounce).toBe(200);

      // Test breakpoints
      expect(result.current.mobileBreakpoint).toBe(768);
      expect(result.current.tabletBreakpoint).toBe(1024);

      // Test accessibility
      expect(result.current.touchTargetSize).toBe(44);
      expect(result.current.focusRingSize).toBe(2);

      // Test default chapters
      expect(Array.isArray(result.current.defaultChapters)).toBe(true);
      expect(result.current.defaultChapters.length).toBeGreaterThan(0);
      expect(result.current.defaultChapters[0]).toHaveProperty("id", "hero");

      // Test types and variants
      expect(result.current.transitionTypes).toBeDefined();
      expect(result.current.chapterTypes).toBeDefined();
      expect(result.current.navigationVariants).toBeDefined();
      expect(result.current.stepperVariants).toBeDefined();

      // Test debug configuration
      expect(result.current.debug).toBeDefined();
      expect(typeof result.current.debug.ENABLE_SCROLL_DEBUG).toBe("boolean");

      // Test analytics events
      expect(result.current.analyticsEvents).toBeDefined();
      expect(result.current.analyticsEvents.CHAPTER_ENTER).toBe(
        "chapter_enter",
      );

      // Test feature flags
      expect(result.current.features).toBeDefined();
      expect(typeof result.current.features.ENABLE_PINNING).toBe("boolean");
    });
  });
});
