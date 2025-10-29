import * as React from "react";
import { beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom";

// Canvas API support for tests
import { createCanvas } from "canvas";

// Configure Canvas API globally for tests
const Canvas = createCanvas.Canvas;
const Image = createCanvas.Image;
const CanvasRenderingContext2D = createCanvas.CanvasRenderingContext2D;

// Set up Canvas API on global object
global.HTMLCanvasElement = Canvas as any;
global.Canvas = Canvas as any;
global.Image = Image as any;
global.CanvasRenderingContext2D = CanvasRenderingContext2D as any;

// Configure canvas prototype methods
if (typeof window !== "undefined") {
  // Override jsdom window with canvas support
  Object.defineProperty(window, "HTMLCanvasElement", {
    value: Canvas,
    writable: true,
  });
  Object.defineProperty(window, "Canvas", {
    value: Canvas,
    writable: true,
  });
  Object.defineProperty(window, "Image", {
    value: Image,
    writable: true,
  });
  Object.defineProperty(window, "CanvasRenderingContext2D", {
    value: CanvasRenderingContext2D,
    writable: true,
  });

  // Ensure canvas getContext method works
  if (
    window.HTMLCanvasElement &&
    !window.HTMLCanvasElement.prototype.getContext
  ) {
    window.HTMLCanvasElement.prototype.getContext = function (type: string) {
      if (type === "2d") {
        try {
          return createCanvas.createCanvas(300, 150).getContext("2d");
        } catch (e) {
          // Fallback: return null if canvas creation fails
          return null;
        }
      }
      return null;
    };
  }
}

// ===== FRENTE A: INFRA DE TESTE =====
// 1. Mocks padrão da plataforma
import {
  setupPlatformMocks,
  cleanupPlatformMocks,
} from "./tests/__mocks__/platform-mocks";

// 2. Axe single-runner para evitar concorrência
import {
  clearAxeQueue,
  setupAxeForTests,
} from "./tests/__utils__/axe-single-runner";

// Type declarations for browser globals used in tests
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Configure Vitest for better SSR compatibility
process.env.NODE_ENV = "test";

// Enable fake timers globally for hooks that use setTimeout/setInterval
import { vi } from "vitest";
vi.useFakeTimers();

// Increase timeout for async operations in tests
vi.setConfig({ testTimeout: 10000 });

// ===== SETUP GLOBAL DE MOCKS DA PLATAFORMA =====
// Só configura mocks de DOM se estiver em ambiente jsdom
if (typeof window !== "undefined") {
  setupPlatformMocks();
}

// ===== SETUP CONDICIONAL DO AXE SINGLE-RUNNER =====
// Ativa apenas para testes de acessibilidade para evitar overhead desnecessário
if (
  typeof window !== "undefined" &&
  (global as any).__vitest_testPath?.includes("/a11y/")
) {
  setupAxeForTests();
}

// Test isolation utilities - ONDA A: Cleanup global padronizado
beforeEach(() => {
  // 1. Limpar mocks da plataforma
  cleanupPlatformMocks();

  // 2. Limpar fila do Axe (evita concorrência)
  clearAxeQueue();

  // 3. Clear all mocks
  vi.clearAllMocks();

  // 4. Reset experiment state between tests
  resetExperimentState();

  // 5. Clear localStorage safely
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.clear();
    } catch (e) {
      // Ignore errors in test cleanup
    }
  }

  // 6. Clear sessionStorage safely (using mock)
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      window.sessionStorage.clear();
    } catch (e) {
      // Ignore errors in test cleanup
    }
  }

  // 7. Reset dataLayer safely
  if (typeof window !== "undefined" && window.dataLayer) {
    try {
      window.dataLayer.length = 0;
    } catch (e) {
      // Ignore errors in test cleanup
    }
  }

  // 8. Reset fetch mocks
  if (typeof global !== "undefined" && global.fetch) {
    try {
      vi.mocked(global.fetch).mockClear();
    } catch (e) {
      // Ignore if fetch is not mocked
    }
  }
});

afterEach(() => {
  // Clean up after each test - ONDA A: Cleanup consistente
  vi.clearAllTimers();

  // Limpar fila do Axe após cada teste
  clearAxeQueue();

  // Only run pending timers if fake timers are enabled
  if (vi.isMockFunction(setTimeout)) {
    vi.runOnlyPendingTimers();
  }
});

// Helper function to reset experiment state
function resetExperimentState() {
  // Clear any experiment-related global state
  if (typeof window !== "undefined") {
    // Clear any experiment-related items from sessionStorage
    const keys = Object.keys(window.sessionStorage);
    keys.forEach((key) => {
      if (key.includes("experiment")) {
        window.sessionStorage.removeItem(key);
      }
    });

    // Clear localStorage experiment data
    const localKeys = Object.keys(window.localStorage);
    localKeys.forEach((key) => {
      if (key.includes("experiment")) {
        window.localStorage.removeItem(key);
      }
    });
  }

  // Reset any global experiment state if available
  try {
    // If there's a global reset function for experiments, call it
    if (typeof global !== "undefined" && (global as any).resetExperimentState) {
      (global as any).resetExperimentState();
    }
  } catch (e) {
    // Ignore errors in test cleanup
  }
}

// Configure JSDOM for better SSR compatibility
if (typeof window !== "undefined") {
  // Ensure document is properly initialized before any operations
  if (!window.document) {
    // Create a minimal document if it doesn't exist
    const { JSDOM } = require("jsdom");
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
      url: "http://localhost:3000",
      pretendToBeVisual: true,
      resources: "usable",
    });
    global.window = dom.window;
    global.document = dom.window.document;
    global.navigator = dom.window.navigator;
  }

  // Ensure html element has lang attribute to prevent hydration mismatches
  if (
    window.document &&
    window.document.documentElement &&
    !window.document.documentElement.getAttribute("lang")
  ) {
    window.document.documentElement.setAttribute("lang", "pt-BR");
  }

  // Ensure addEventListener is available on document
  if (window.document && !window.document.addEventListener) {
    window.document.addEventListener = window.addEventListener.bind(
      window.document,
    );
    window.document.removeEventListener = window.removeEventListener.bind(
      window.document,
    );
  }
}

// Mock hooks that can cause hydration issues
vi.mock("@/lib/hooks/use-analytics", () => ({
  useAnalytics: vi.fn(() => ({
    trackEvent: vi.fn(),
    trackConversion: vi.fn(),
    trackPageView: vi.fn(),
  })),
  useSectionTracking: vi.fn(() => {
    // Return a mock ref that simulates the hook behavior
    return {
      current: null,
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };
  }),
  useCtaTracking: vi.fn(() => vi.fn()), // Return a mock function
  useScrollTracking: vi.fn(() => {
    // Return mock functions that the hook expects
    return {
      trackScroll: vi.fn(),
      cleanup: vi.fn(),
    };
  }),
  useTimeOnPageTracking: vi.fn(() => {
    // Return mock functions that the hook expects
    return {
      trackTime: vi.fn(),
      cleanup: vi.fn(),
    };
  }),
  useExperimentTracking: vi.fn(() => ({
    // Return the expected object structure
    trackExperiment: vi.fn(),
    trackConversion: vi.fn(),
  })),
  useFormTracking: vi.fn(() => vi.fn()),
}));

vi.mock("@/lib/personalization/personalization-context", () => ({
  usePersonalization: () => ({
    activeSegments: [],
    personalizeContent: (content: any) => content,
    trackUserAction: vi.fn(),
  }),
  PersonalizationProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

vi.mock("@/lib/hooks/use-feature-flags", () => ({
  useExperiment: () => ({
    variant: null,
    trackEvent: vi.fn(),
    trackConversion: vi.fn(),
    loading: false,
    error: null,
    isControl: true,
    experimentId: "test_experiment",
  }),
  useABContent: () => "Test content",
}));

vi.mock("@/lib/ab-testing/use-experiment", () => ({
  useExperiment: () => ({
    variant: null,
    trackEvent: vi.fn(),
    trackConversion: vi.fn(),
    loading: false,
    error: null,
    isControl: true,
    experimentId: "test_experiment",
  }),
}));

// Basic browser API mocks for jsdom gaps
if (typeof window !== "undefined") {
  // Always mock IntersectionObserver for consistent test behavior
  // Mock IntersectionObserver constructor as a proper class
  class MockIntersectionObserver {
    root: Element | Document | null = null;
    rootMargin: string = "";
    thresholds: readonly number[] = [];
    private callback: IntersectionObserverCallback;

    constructor(
      callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit,
    ) {
      this.callback = callback;
      this.root = options?.root || null;
      this.rootMargin = options?.rootMargin || "";
      this.thresholds = Array.isArray(options?.threshold)
        ? options.threshold
        : [options?.threshold || 0];
    }

    observe = vi.fn((target: Element) => {
      // Simulate immediate intersection for tests
      const mockEntry: IntersectionObserverEntry = {
        isIntersecting: true,
        intersectionRatio: 1,
        boundingClientRect: new DOMRect(),
        rootBounds: null,
        target: target,
        time: Date.now(),
        intersectionRect: new DOMRect(),
      };

      // Call callback immediately to trigger image loading
      this.callback([mockEntry], this);
    });

    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
  }

  // @ts-ignore
  window.IntersectionObserver = MockIntersectionObserver;

  if (!("PerformanceObserver" in window)) {
    class MockPerformanceObserver {
      observe() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
      static supportedEntryTypes = [];
    }
    // @ts-ignore
    window.PerformanceObserver = MockPerformanceObserver;
  }

  // Mock localStorage (durable in-memory)
  const __localStorageStore = new Map();
  var localStorageMock = {
    getItem: vi.fn((key) => {
      // Handle specific test keys
      if (key === "test-key") return '"stored value"';
      if (key === "complex-key")
        return JSON.stringify({ nested: { data: "test" } });
      // General case: return from memory store
      return __localStorageStore.has(key) ? __localStorageStore.get(key) : null;
    }),
    setItem: vi.fn((key, value) => {
      __localStorageStore.set(key, String(value));
    }),
    removeItem: vi.fn((key) => {
      __localStorageStore.delete(key);
    }),
    clear: vi.fn(() => {
      __localStorageStore.clear();
    }),
  };
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });

  // Mock sessionStorage (durable in-memory)
  const __sessionStorageStore = new Map();
  var sessionStorageMock = {
    getItem: vi.fn((key) => {
      return __sessionStorageStore.has(key) ? __sessionStorageStore.get(key) : null;
    }),
    setItem: vi.fn((key, value) => {
      __sessionStorageStore.set(key, String(value));
    }),
    removeItem: vi.fn((key) => {
      __sessionStorageStore.delete(key);
    }),
    clear: vi.fn(() => {
      __sessionStorageStore.clear();
    }),
  };
  Object.defineProperty(window, "sessionStorage", {
    value: sessionStorageMock,
  });

  // Mock matchMedia for prefers-reduced-motion and other media queries
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false, // Default to false for all queries unless overridden in tests
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // requestAnimationFrame / cancelAnimationFrame
  if (!("requestAnimationFrame" in window)) {
    Object.defineProperty(window, "requestAnimationFrame", {
      value: (cb) => setTimeout(() => cb(Date.now()), 16),
    });
  }
  if (!("cancelAnimationFrame" in window)) {
    Object.defineProperty(window, "cancelAnimationFrame", {
      value: (id) => clearTimeout(id),
    });
  }

  // requestIdleCallback polyfill
  if (!("requestIdleCallback" in window)) {
    Object.defineProperty(window, "requestIdleCallback", {
      value: (cb) =>
        setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 1 }), 1),
    });
  }
  if (!("cancelIdleCallback" in window)) {
    Object.defineProperty(window, "cancelIdleCallback", {
      value: (id) => clearTimeout(id),
    });
  }

  // Mock dataLayer (gtag will be mocked per test as needed)
  Object.defineProperty(window, "dataLayer", {
    writable: true,
    value: [],
  });

  // Guard for gtag to avoid re-declaration warnings in tests
  if (typeof window.gtag === "undefined") {
    // define a no-op default; tests may override
    Object.defineProperty(window, "gtag", {
      writable: true,
      value: (..._args) => {},
    });
  }
}
