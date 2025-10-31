import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  readLocalStorage,
  writeLocalStorage,
  removeLocalStorage,
  safeBrowserAPI,
  isClient,
  isServer,
} from "../../lib/utils/browser-storage";

describe("Browser Storage Utils", () => {
  let mockLocalStorage: any;
  let originalWindow: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock console methods
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Save original window
    originalWindow = global.window;

    // Create fresh mocks for each test
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    // Mock window with localStorage
    Object.defineProperty(global, "window", {
      value: {
        localStorage: mockLocalStorage,
        sessionStorage: {
          getItem: vi.fn(),
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn(),
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    // Restore original window
    if (originalWindow) {
      global.window = originalWindow;
    }
  });

  describe("SSR Safety", () => {
    it("should return null/false for all operations when window is undefined", () => {
      // Temporarily mock window as undefined to simulate SSR
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      expect(readLocalStorage("test")).toBeNull();
      expect(writeLocalStorage("test", "value")).toBe(false);
      expect(removeLocalStorage("test")).toBe(false);
      expect(isClient()).toBe(false);
      expect(isServer()).toBe(true);

      // Restore window
      global.window = originalWindow;
    });
  });

  describe("LocalStorage Operations", () => {

    describe("readLocalStorage", () => {
      it("should read from localStorage successfully", () => {
        mockLocalStorage.getItem.mockReturnValue("test-value");
        const result = readLocalStorage("test-key");
        expect(result).toBe("test-value");
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith("test-key");
      });

      it("should return null when localStorage throws", () => {
        mockLocalStorage.getItem.mockImplementation(() => {
          throw new Error("Storage quota exceeded");
        });
        const result = readLocalStorage("test-key");
        expect(result).toBeNull();
        expect(console.warn).toHaveBeenCalled();
      });
    });

    describe("writeLocalStorage", () => {
      it("should write to localStorage successfully", () => {
        const result = writeLocalStorage("test-key", "test-value");
        expect(result).toBe(true);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          "test-key",
          "test-value",
        );
      });

      it("should return false when localStorage throws", () => {
        mockLocalStorage.setItem.mockImplementation(() => {
          throw new Error("Storage quota exceeded");
        });
        const result = writeLocalStorage("test-key", "test-value");
        expect(result).toBe(false);
        expect(console.warn).toHaveBeenCalled();
      });
    });

    describe("removeLocalStorage", () => {
      it("should remove from localStorage successfully", () => {
        const result = removeLocalStorage("test-key");
        expect(result).toBe(true);
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("test-key");
      });

      it("should return false when localStorage throws", () => {
        mockLocalStorage.removeItem.mockImplementation(() => {
          throw new Error("Storage access denied");
        });
        const result = removeLocalStorage("test-key");
        expect(result).toBe(false);
        expect(console.warn).toHaveBeenCalled();
      });
    });
  });

  describe("Browser API Safety", () => {
    it("should return fallback when browser API throws", () => {
      const result = safeBrowserAPI(() => {
        throw new Error("Browser API failed");
      }, "fallback-value");
      expect(result).toBe("fallback-value");
    });

    it("should return result when browser API succeeds", () => {
      const result = safeBrowserAPI(() => "success", "fallback");
      expect(result).toBe("success");
    });
  });

  describe("Environment Detection", () => {
    it("should detect client environment when window exists", () => {
      expect(isClient()).toBe(true);
      expect(isServer()).toBe(false);
    });

    it.skip("should detect server environment when window is undefined", () => {
      const restoreWindow = vi.stubGlobal("window", undefined);
      expect(isClient()).toBe(false);
      expect(isServer()).toBe(true);
      restoreWindow();
    });
  });

  describe("Environment Detection", () => {
    it("should detect client environment when window exists", () => {
      expect(isClient()).toBe(true);
      expect(isServer()).toBe(false);
    });

    it.skip("should detect server environment when window is undefined", () => {
      const restoreWindow = vi.stubGlobal("window", undefined);
      expect(isClient()).toBe(false);
      expect(isServer()).toBe(true);
      restoreWindow();
    });
  });

  describe("Safe Browser API", () => {
    it("should return result when browser API succeeds", () => {
      const result = safeBrowserAPI(() => "success", "fallback");
      expect(result).toBe("success");
    });

    it("should return fallback when browser API fails", () => {
      const result = safeBrowserAPI(() => {
        throw new Error("API error");
      }, "fallback");
      expect(result).toBe("fallback");
    });
  });
});
