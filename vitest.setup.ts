import * as React from "react";
import { beforeEach, afterEach, vi } from "vitest";
import "@testing-library/jest-dom";

// Canvas API support for tests - mocked to avoid native dependencies
// Mock canvas globally to prevent native module loading issues
if (typeof window !== "undefined") {
  // Create mock canvas classes
  class MockCanvas {
    width = 300;
    height = 150;
    getContext(type: string) {
      if (type === "2d") {
        return {
          fillRect: vi.fn(),
          clearRect: vi.fn(),
          getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(1200) })),
          putImageData: vi.fn(),
          createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(1200) })),
          setTransform: vi.fn(),
          drawImage: vi.fn(),
          save: vi.fn(),
          restore: vi.fn(),
          beginPath: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          closePath: vi.fn(),
          stroke: vi.fn(),
          fill: vi.fn(),
        };
      }
      return null;
    }
    toDataURL() {
      return "data:image/png;base64,mock";
    }
  }

  class MockImage {
    src = "";
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
  }

  // Set up Canvas API on global object
  Object.defineProperty(window, "HTMLCanvasElement", {
    value: MockCanvas,
    writable: true,
  });
  Object.defineProperty(window, "Canvas", {
    value: MockCanvas,
    writable: true,
  });
  Object.defineProperty(window, "Image", {
    value: MockImage,
    writable: true,
  });
  Object.defineProperty(window, "CanvasRenderingContext2D", {
    value: {},
    writable: true,
  });
}

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
vi.useFakeTimers();

// Increase timeout for async operations in tests
vi.setConfig({ testTimeout: 10000 });

// Test isolation utilities
beforeEach(() => {
  // Clear all mocks
  vi.clearAllMocks();

  // Clear localStorage safely
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.clear();
    } catch (e) {
      // Ignore errors in test cleanup
    }
  }

  // Clear sessionStorage safely
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      window.sessionStorage.clear();
    } catch (e) {
      // Ignore errors in test cleanup
    }
  }

  // Reset dataLayer safely
  if (typeof window !== "undefined" && window.dataLayer) {
    try {
      window.dataLayer.length = 0;
    } catch (e) {
      // Ignore errors in test cleanup
    }
  }
});

afterEach(() => {
  // Clean up after each test
  vi.clearAllTimers();
});

// Basic mocks for common hooks
vi.mock("@/lib/hooks/use-analytics", () => ({
  useAnalytics: vi.fn(() => ({
    trackEvent: vi.fn(),
    trackConversion: vi.fn(),
    trackPageView: vi.fn(),
  })),
}));

// Basic browser API mocks for jsdom
if (typeof window !== "undefined") {
  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, "localStorage", { value: localStorageMock });

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, "sessionStorage", { value: sessionStorageMock });

  // Mock dataLayer
  Object.defineProperty(window, "dataLayer", {
    writable: true,
    value: [],
  });
}
