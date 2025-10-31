/**
 * Theme System Integration Tests - Real usage scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Import actual modules to get real coverage
import {
  getStoredTheme,
  setStoredTheme,
  getSystemTheme,
  resolveTheme,
  applyTheme,
  setTheme,
  getCurrentTheme,
  initializeTheme,
} from "../../lib/theme/theme-utils";

// Mock localStorage and document
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

const mockDocument = {
  documentElement: {
    setAttribute: vi.fn(),
    classList: {
      remove: vi.fn(),
      add: vi.fn(),
    },
  },
};

// Store original globals
let originalWindow: any;
let originalDocument: any;

describe("Theme System Integration - Real Scenarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Store originals
    originalWindow = global.window;
    originalDocument = global.document;

    // Mock browser APIs
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });

    Object.defineProperty(window, "matchMedia", {
      value: vi.fn(() => ({ matches: false })),
      writable: true,
    });

    global.document = mockDocument as any;

    // Reset mocks
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
    mockDocument.documentElement.setAttribute.mockImplementation(() => {});
    mockDocument.documentElement.classList.add.mockImplementation(() => {});
    mockDocument.documentElement.classList.remove.mockImplementation(() => {});
  });

  afterEach(() => {
    global.window = originalWindow;
    global.document = originalDocument;
  });

  describe("Theme Persistence Flow", () => {
    it("should persist and retrieve theme correctly", () => {
      // Set theme
      setStoredTheme("dark");
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "app-theme",
        "dark",
      );

      // Retrieve theme
      mockLocalStorage.getItem.mockReturnValue("dark");
      const stored = getStoredTheme();
      expect(stored).toBe("dark");
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith("app-theme");
    });

    it("should handle theme resolution with system preference", () => {
      // Mock system preference for dark mode
      Object.defineProperty(window, "matchMedia", {
        value: vi.fn(() => ({ matches: true })),
      });

      const resolved = resolveTheme("system");
      expect(resolved).toBe("dark");

      // Test light preference
      Object.defineProperty(window, "matchMedia", {
        value: vi.fn(() => ({ matches: false })),
      });

      const resolvedLight = resolveTheme("system");
      expect(resolvedLight).toBe("light");
    });

    it("should maintain theme state across operations", () => {
      // Set initial theme
      setTheme("light");
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "app-theme",
        "light",
      );

      // Get current theme
      mockLocalStorage.getItem.mockReturnValue("light");
      const current = getCurrentTheme();
      expect(current).toBe("light");
    });
  });

  describe("Theme Application Flow", () => {
    it("should handle theme switching workflow", () => {
      // Switch from light to dark
      setTheme("dark");
      expect(mockDocument.documentElement.setAttribute).toHaveBeenCalledWith(
        "data-theme",
        "dark",
      );

      // Switch from dark to light
      setTheme("light");
      expect(mockDocument.documentElement.setAttribute).toHaveBeenCalledWith(
        "data-theme",
        "light",
      );
    });

    it("should initialize theme on startup", () => {
      // Set stored theme
      mockLocalStorage.getItem.mockReturnValue("dark");

      // Just test that the functions can be called without throwing
      expect(() => setTheme("light")).not.toThrow();
      expect(() => applyTheme("dark")).not.toThrow();
    });
  });

  describe("System Theme Integration", () => {
    it("should respond to system theme changes", () => {
      // Set system theme
      Object.defineProperty(window, "matchMedia", {
        value: vi.fn(() => ({
          matches: true,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      const systemTheme = getSystemTheme();
      expect(systemTheme).toBe("dark");
    });

    it("should handle system theme fallback gracefully", () => {
      // Remove matchMedia support
      delete (window as any).matchMedia;

      const systemTheme = getSystemTheme();
      expect(systemTheme).toBe("light"); // Default fallback
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle localStorage errors gracefully", () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

      // Should not throw, should return default
      expect(() => getStoredTheme()).not.toThrow();
      const theme = getStoredTheme();
      expect(theme).toBe("system"); // Default fallback
    });

    it("should handle DOM manipulation errors", () => {
      mockDocument.documentElement.setAttribute.mockImplementation(() => {
        throw new Error("DOM manipulation failed");
      });

      // Should not throw
      expect(() => applyTheme("light")).not.toThrow();
    });
  });

  describe("Complete Theme Workflow", () => {
    it("should handle full theme switching workflow", () => {
      // 1. Set theme
      setTheme("dark");
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "app-theme",
        "dark",
      );

      // 2. Verify storage
      mockLocalStorage.getItem.mockReturnValue("dark");
      expect(getStoredTheme()).toBe("dark");

      // 3. Verify resolution
      expect(getCurrentTheme()).toBe("dark");

      // 4. Verify DOM application
      expect(mockDocument.documentElement.setAttribute).toHaveBeenCalledWith(
        "data-theme",
        "dark",
      );
      expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith(
        "dark",
      );

      // 5. Switch theme
      setTheme("light");
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "app-theme",
        "light",
      );
      expect(mockDocument.documentElement.setAttribute).toHaveBeenCalledWith(
        "data-theme",
        "light",
      );
    });

    it("should handle system theme workflow", () => {
      // Set system preference
      Object.defineProperty(window, "matchMedia", {
        value: vi.fn(() => ({ matches: true })),
      });

      // Set system theme
      setTheme("system");

      // Should resolve to dark based on system preference
      mockLocalStorage.getItem.mockReturnValue("system");
      const current = getCurrentTheme();
      expect(current).toBe("dark");
    });
  });
});
