import { describe, it, expect, jest, beforeEach } from "vitest";

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

// Mock matchMedia
const mockMatchMedia = vi.fn(() => ({
  matches: false, // Default to light preference
  media: "",
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(), // deprecated
  removeListener: vi.fn(), // deprecated
  dispatchEvent: vi.fn(),
}));
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: mockMatchMedia,
});

// Import theme utilities after mocks
import {
  setTheme,
  toggleTheme,
  applyTheme,
  THEMES,
  STORAGE_KEY,
  getSystemTheme,
  getStoredTheme,
  watchSystemTheme,
  getCurrentTheme,
  initializeTheme,
} from "@/lib/theme/theme-utils";

describe("Theme System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockMatchMedia.mockClear();

    // Reset document classes and attributes
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-theme");
  });

  describe("Theme Constants", () => {
    it("defines all required themes", () => {
      expect(THEMES).toEqual({
        LIGHT: "light",
        DARK: "dark",
        SYSTEM: "system",
      });
    });

    it("defines storage key", () => {
      expect(STORAGE_KEY).toBe("dataflow-theme");
    });
  });

  describe("getStoredTheme", () => {
    it("returns stored theme from localStorage", () => {
      mockLocalStorage.getItem.mockReturnValue("dark");

      const result = getStoredTheme();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(STORAGE_KEY);
      expect(result).toBe("dark");
    });

    it("returns null when no theme is stored", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = getStoredTheme();

      expect(result).toBeNull();
    });

    it("returns null when localStorage throws", () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error("Storage error");
      });

      const result = getStoredTheme();

      expect(result).toBeNull();
    });
  });

  describe("getSystemTheme", () => {
    it("returns light theme when system prefers light", () => {
      mockMatchMedia.mockReturnValue({
        matches: false, // prefers-color-scheme: light
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const result = getSystemTheme();

      expect(mockMatchMedia).toHaveBeenCalledWith(
        "(prefers-color-scheme: dark)",
      );
      expect(result).toBe(THEMES.LIGHT);
    });

    it("returns dark theme when system prefers dark", () => {
      mockMatchMedia.mockReturnValue({
        matches: true, // prefers-color-scheme: dark
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const result = getSystemTheme();

      expect(result).toBe(THEMES.DARK);
    });
  });

  describe("getCurrentTheme", () => {
    it("returns stored theme when available", () => {
      mockLocalStorage.getItem.mockReturnValue("dark");

      const result = getCurrentTheme();

      expect(result).toBe("dark");
    });

    it("returns system theme when stored theme is system", () => {
      mockLocalStorage.getItem.mockReturnValue("system");
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const result = getCurrentTheme();

      expect(result).toBe(THEMES.DARK);
    });

    it("returns system theme when no stored theme", () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const result = getCurrentTheme();

      expect(result).toBe(THEMES.LIGHT);
    });
  });

  describe("setTheme", () => {
    it("stores theme in localStorage", () => {
      setTheme("dark");

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        "dark",
      );
    });

    it("applies theme to document", () => {
      setTheme("dark");

      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("handles invalid theme gracefully", () => {
      // Should not crash with invalid theme
      expect(() => {
        setTheme("invalid" as any);
      }).not.toThrow();
    });

    it("removes dark class when setting light theme", () => {
      // Set dark first
      setTheme("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);

      // Then set light
      setTheme("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });

  describe("toggleTheme", () => {
    it("toggles from light to dark", () => {
      mockLocalStorage.getItem.mockReturnValue("light");

      toggleTheme();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        "dark",
      );
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("toggles from dark to light", () => {
      mockLocalStorage.getItem.mockReturnValue("dark");

      toggleTheme();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        "light",
      );
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("toggles from system theme based on current system preference", () => {
      mockLocalStorage.getItem.mockReturnValue("system");
      mockMatchMedia.mockReturnValue({
        matches: false, // prefers light
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      toggleTheme();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        "dark",
      );
    });
  });

  describe("applyTheme", () => {
    it("applies light theme correctly", () => {
      applyTheme("light");

      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("applies dark theme correctly", () => {
      applyTheme("dark");

      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("applies system theme based on preference", () => {
      mockMatchMedia.mockReturnValue({
        matches: true, // prefers dark
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      applyTheme("system");

      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  describe("watchSystemTheme", () => {
    it("sets up media query listener", () => {
      const mockMediaQuery = {
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      mockMatchMedia.mockReturnValue(mockMediaQuery);

      const cleanup = watchSystemTheme(() => {});

      expect(mockMatchMedia).toHaveBeenCalledWith(
        "(prefers-color-scheme: dark)",
      );
      expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith(
        "change",
        expect.any(Function),
      );

      // Cleanup should remove listener
      cleanup();
      expect(mockMediaQuery.removeEventListener).toHaveBeenCalledWith(
        "change",
        expect.any(Function),
      );
    });

    it("calls callback when system theme changes", () => {
      const callback = vi.fn();
      let changeHandler: (...args: any[]) => void;

      const mockMediaQuery = {
        matches: false,
        addEventListener: vi.fn((event, handler) => {
          changeHandler = handler as (...args: any[]) => void;
        }),
        removeEventListener: vi.fn(),
      };

      mockMatchMedia.mockReturnValue(mockMediaQuery);

      watchSystemTheme(callback);

      // Simulate theme change
      changeHandler!({ matches: true });

      expect(callback).toHaveBeenCalledWith("dark");
    });
  });

  describe("Integration Tests", () => {
    it("theme persistence works end-to-end", () => {
      // Set theme
      setTheme("dark");
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        "dark",
      );
      expect(document.documentElement.classList.contains("dark")).toBe(true);

      // Get theme should return stored value
      mockLocalStorage.getItem.mockReturnValue("dark");
      const retrievedTheme = getCurrentTheme();
      expect(retrievedTheme).toBe("dark");
    });

    it("system theme fallback works", () => {
      // No stored theme
      mockLocalStorage.getItem.mockReturnValue(null);
      mockMatchMedia.mockReturnValue({
        matches: true, // prefers dark
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const theme = getCurrentTheme();
      expect(theme).toBe(THEMES.DARK);

      // Should apply dark theme
      expect(document.documentElement.classList.contains("dark")).toBe(false); // Not applied yet

      applyTheme(theme);
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("handles localStorage errors gracefully", () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error("Storage unavailable");
      });

      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      // Should not crash
      expect(() => {
        const theme = getCurrentTheme();
        expect(theme).toBe(THEMES.LIGHT);
      }).not.toThrow();
    });

    it("theme toggle works with system preference", () => {
      // Start with light system preference
      mockLocalStorage.getItem.mockReturnValue("system");
      mockMatchMedia.mockReturnValue({
        matches: false, // prefers light
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      // Toggle should go to dark
      toggleTheme();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        "dark",
      );
    });
  });

  describe("Accessibility", () => {
    it("respects system preferences", () => {
      mockMatchMedia.mockReturnValue({
        matches: true, // User prefers dark
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      setTheme("system");

      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("provides consistent theming across page loads", () => {
      // Simulate page load with stored dark theme
      mockLocalStorage.getItem.mockReturnValue("dark");

      const theme = getCurrentTheme();
      applyTheme(theme);

      expect(document.documentElement.classList.contains("dark")).toBe(true);

      // Simulate another page load
      const theme2 = getCurrentTheme();
      expect(theme2).toBe("dark");
    });
  });
});
