/**
 * Theme utilities tests - SSR safe theme management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getStoredTheme,
  setStoredTheme,
  getSystemTheme,
  resolveTheme,
  applyTheme,
  setTheme,
  getCurrentTheme,
  getInitialTheme,
  getInitialResolvedTheme,
} from "../../lib/theme/theme-utils";

// Mock window and document for SSR tests
const mockWindow = {
  matchMedia: vi.fn(),
  localStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
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

describe("Theme Utils - SSR Safety", () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup browser environment mocks
    mockWindow.matchMedia.mockReturnValue({ matches: false });
    mockWindow.localStorage.getItem.mockReturnValue(null);
    mockWindow.localStorage.setItem.mockImplementation(() => {});

    // Mock global objects
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: mockWindow.matchMedia,
    });

    Object.defineProperty(window, "localStorage", {
      writable: true,
      value: mockWindow.localStorage,
    });

    Object.defineProperty(document, "documentElement", {
      writable: true,
      value: mockDocument.documentElement,
    });
  });

  describe("Browser Detection", () => {
    it("should detect browser environment", () => {
      expect(typeof window).not.toBe("undefined");
      expect(typeof document).not.toBe("undefined");
    });
  });

  describe("Theme Storage", () => {
    it("should return default theme when no stored theme", () => {
      const theme = getStoredTheme();
      expect(theme).toBe("system");
    });

    it("should return stored theme when available", () => {
      mockWindow.localStorage.getItem.mockReturnValue("dark");
      const theme = getStoredTheme();
      expect(theme).toBe("dark");
    });

    it("should store theme in localStorage", () => {
      setStoredTheme("light");
      expect(mockWindow.localStorage.setItem).toHaveBeenCalledWith(
        "app-theme",
        "light",
      );
    });

    it("should handle localStorage errors gracefully", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockWindow.localStorage.getItem.mockImplementation(() => {
        throw new Error("Storage error");
      });

      const theme = getStoredTheme();
      expect(theme).toBe("system");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("System Theme Detection", () => {
    it("should return light theme by default in SSR", () => {
      // Temporarily remove window
      const originalWindow = global.window;
      delete (global as any).window;

      const theme = getSystemTheme();
      expect(theme).toBe("light");

      // Restore window
      global.window = originalWindow;
    });

    it("should detect dark system theme", () => {
      mockWindow.matchMedia.mockReturnValue({ matches: true });
      const theme = getSystemTheme();
      expect(theme).toBe("dark");
    });

    it("should detect light system theme", () => {
      mockWindow.matchMedia.mockReturnValue({ matches: false });
      const theme = getSystemTheme();
      expect(theme).toBe("light");
    });
  });

  describe("Theme Resolution", () => {
    it("should resolve system theme", () => {
      mockWindow.matchMedia.mockReturnValue({ matches: true });
      const resolved = resolveTheme("system");
      expect(resolved).toBe("dark");
    });

    it("should resolve explicit themes", () => {
      expect(resolveTheme("light")).toBe("light");
      expect(resolveTheme("dark")).toBe("dark");
    });
  });

  describe("Theme Application", () => {
    it("should apply theme to document", () => {
      applyTheme("dark");
      expect(mockDocument.documentElement.setAttribute).toHaveBeenCalledWith(
        "data-theme",
        "dark",
      );
      expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith(
        "dark",
      );
    });

    it("should handle document errors gracefully", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockDocument.documentElement.setAttribute.mockImplementation(() => {
        throw new Error("DOM error");
      });

      applyTheme("light");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("Theme Setting", () => {
    it("should set and apply theme", () => {
      setTheme("dark");
      expect(mockWindow.localStorage.setItem).toHaveBeenCalledWith(
        "app-theme",
        "dark",
      );
      expect(mockDocument.documentElement.setAttribute).toHaveBeenCalledWith(
        "data-theme",
        "dark",
      );
    });
  });

  describe("Current Theme", () => {
    it("should get current resolved theme", () => {
      mockWindow.localStorage.getItem.mockReturnValue("light");
      const theme = getCurrentTheme();
      expect(theme).toBe("light");
    });
  });

  describe("SSR Initial Values", () => {
    it("should provide SSR-safe initial theme", () => {
      expect(getInitialTheme()).toBe("system");
      expect(getInitialResolvedTheme()).toBe("light");
    });
  });
});
