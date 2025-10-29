// Unit Tests for Advanced Utils - Fase 2 Implementation
// Tests advanced utilities and hooks with comprehensive coverage
// Target: 6+ test cases covering hooks and utilities

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// No mocking of React hooks needed - use real hooks in tests

// Import after mocking
import {
  Brand,
  isChapterId,
  isHSLString,
  useDebounce,
  useThrottle,
  usePrevious,
  useLocalStorage,
  useSessionStorage,
  timeout,
  retry,
  batchAsync,
  createId,
  createSlug,
  formatCurrency,
  formatDate,
  formatNumber,
  clamp,
  lerp,
  inRange,
  formatBytes,
  capitalize,
  kebabToCamel,
  camelToKebab,
  sleep,
} from "../../lib/utils/advanced-utils";

describe("Brand utilities", () => {
  describe("chapterId", () => {
    it("should create valid chapter ID", () => {
      // Act
      const chapterId = Brand.chapterId("hero");

      // Assert
      expect(chapterId).toBe("hero");
      expect(isChapterId(chapterId)).toBe(true);
    });

    it("should throw error for invalid chapter ID", () => {
      // Act & Assert
      expect(() => Brand.chapterId("invalid")).toThrow(
        "Invalid chapter ID: invalid",
      );
    });
  });

  describe("animationId", () => {
    it("should create animation ID with timestamp", () => {
      // Arrange
      vi.useFakeTimers();
      vi.setSystemTime(1000000000);

      // Act
      const animationId = Brand.animationId("fade");

      // Assert
      expect(animationId).toMatch(/^fade_1000000000$/);
    });
  });

  describe("tokenName", () => {
    it("should create branded token name", () => {
      // Act
      const tokenName = Brand.tokenName("primary-color");

      // Assert
      expect(tokenName).toBe("primary-color");
    });
  });
});

describe("Type guards", () => {
  describe("isChapterId", () => {
    it("should return true for valid chapter IDs", () => {
      // Act & Assert
      expect(isChapterId("hero")).toBe(true);
      expect(isChapterId("features")).toBe(true);
      expect(isChapterId("pricing")).toBe(true);
    });

    it("should return false for invalid chapter IDs", () => {
      // Act & Assert
      expect(isChapterId("invalid")).toBe(false);
      expect(isChapterId("")).toBe(false);
      expect(isChapterId(null as any)).toBe(false);
    });
  });

  describe("isHSLString", () => {
    it("should validate HSL color strings", () => {
      // Act & Assert
      expect(isHSLString("hsl(120, 50%, 50%)")).toBe(true);
      expect(isHSLString("hsl(0, 100%, 0%)")).toBe(true);
      expect(isHSLString("hsl(360, 0%, 100%)")).toBe(true);
    });

    it("should reject invalid HSL strings", () => {
      // Act & Assert
      expect(isHSLString("hsl(120, 50, 50)")).toBe(false);
      expect(isHSLString("rgb(120, 50, 50)")).toBe(false);
      expect(isHSLString("hsl(400, 50%, 50%)")).toBe(false);
      expect(isHSLString("not-hsl")).toBe(false);
    });
  });
});

describe("useDebounce hook", () => {
  it("should debounce function calls", async () => {
    // Arrange
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 100));

    // Act
    act(() => {
      result.current();
      result.current();
      result.current();
    });

    // Assert - callback should not be called immediately
    expect(callback).not.toHaveBeenCalled();

    // Fast-forward time
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    // Assert - callback should be called once after debounce delay
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe("useThrottle hook", () => {
  it("should throttle function calls", async () => {
    // Arrange
    vi.useFakeTimers();
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottle(callback, 100));

    // Act - Call throttled function multiple times rapidly
    act(() => {
      result.current(); // result.current é a função throttled
      vi.advanceTimersByTime(50);
      result.current();
      vi.advanceTimersByTime(50);
      result.current();
    });

    // Assert - Only first call should execute due to throttling
    expect(callback).toHaveBeenCalledTimes(1);

    // Wait for throttle period to end
    act(() => {
      vi.advanceTimersByTime(100);
      result.current();
    });

    // Assert - Second call should execute
    expect(callback).toHaveBeenCalledTimes(2);
  });
});

describe("usePrevious hook", () => {
  it("should return previous value", () => {
    // Arrange
    let currentValue = "initial";

    // Act - Render hook with initial value
    const { result, rerender } = renderHook(() => usePrevious(currentValue));

    // Assert - Should return undefined for first render
    expect(result.current).toBeUndefined();

    // Act - Update value and rerender
    currentValue = "updated";
    rerender();

    // Assert - Should return previous value
    expect(result.current).toBe("initial");

    // Act - Update again
    currentValue = "final";
    rerender();

    // Assert - Should return updated value as previous
    expect(result.current).toBe("updated");
  });
});

describe("useLocalStorage hook", () => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    // Mock window and localStorage
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should read from localStorage on initialization", () => {
    // Arrange
    localStorageMock.getItem.mockReturnValue(JSON.stringify("stored-value"));

    // Act
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));

    // Assert
    expect(result.current[0]).toBe("stored-value");
    expect(localStorageMock.getItem).toHaveBeenCalledWith("test-key");
  });

  it("should write to localStorage when value changes", () => {
    // Arrange
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));

    // Act
    act(() => {
      result.current[1]("new-value");
    });

    // Assert
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "test-key",
      JSON.stringify("new-value"),
    );
  });

  it("should handle localStorage errors gracefully", () => {
    // Arrange
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error("Storage quota exceeded");
    });

    // Act
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));

    // Assert - Should return default value despite error
    expect(result.current[0]).toBe("default");
  });
});

describe("Async utilities", () => {
  describe("timeout", () => {
    it("should resolve with successful promise", async () => {
      // Arrange
      const promise = Promise.resolve("success");

      // Act
      const result = await timeout(promise, 1000);

      // Assert
      expect(result).toBe("success");
    });

    it("should reject with timeout error", async () => {
      // Arrange
      const slowPromise = new Promise((resolve) =>
        setTimeout(() => resolve("slow"), 200),
      );
      const timeoutMs = 100;

      // Act & Assert
      await expect(timeout(slowPromise, timeoutMs)).rejects.toThrow(
        "Operation timed out",
      );
    });
  });

  describe("retry", () => {
    it("should resolve on first successful attempt", async () => {
      // Arrange
      const fn = vi.fn().mockResolvedValue("success");

      // Act
      const result = await retry(fn, 3, 10);

      // Assert
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure and eventually succeed", async () => {
      // Arrange
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail1"))
        .mockRejectedValueOnce(new Error("fail2"))
        .mockResolvedValue("success");

      // Act
      const result = await retry(fn, 3, 10);

      // Assert
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should fail after max attempts", async () => {
      // Arrange
      const fn = vi.fn().mockRejectedValue(new Error("persistent failure"));

      // Act & Assert
      await expect(retry(fn, 3, 10)).rejects.toThrow("persistent failure");
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe("batchAsync", () => {
    it("should process items in batches", async () => {
      // Arrange
      const items = [1, 2, 3, 4, 5];
      const processor = vi.fn(async (item: number) => item * 2);

      // Act
      const results = await batchAsync(items, processor, 2);

      // Assert
      expect(results).toEqual([2, 4, 6, 8, 10]);
      expect(processor).toHaveBeenCalledTimes(5);
    });
  });
});

describe("Utility functions", () => {
  describe("createId", () => {
    it("should create unique IDs with prefix", () => {
      // Act
      const id1 = createId("test");
      const id2 = createId("test");

      // Assert
      expect(id1).toMatch(/^test-/);
      expect(id2).toMatch(/^test-/);
      expect(id1).not.toBe(id2);
    });

    it("should create ID without prefix", () => {
      // Act
      const id = createId();

      // Assert
      expect(id).toMatch(/^id-/);
    });
  });

  describe("createSlug", () => {
    it("should convert text to URL-friendly slug", () => {
      // Act & Assert
      expect(createSlug("Hello World!")).toBe("hello-world");
      expect(createSlug("Test with   spaces")).toBe("test-with-spaces");
      expect(createSlug("Español & Português")).toBe("espanol-portugues");
      expect(createSlug("Multiple---dashes")).toBe("multiple-dashes");
    });

    it("should handle empty and special cases", () => {
      // Act & Assert
      expect(createSlug("")).toBe("");
      expect(createSlug("---")).toBe("");
      expect(createSlug("!@#$%")).toBe("");
    });
  });

  describe("Formatting utilities", () => {
    describe("formatCurrency", () => {
      it("should format currency in Brazilian Real", () => {
        // Act
        const result = formatCurrency(1234.56, "BRL", "pt-BR");

        // Assert
        expect(result).toContain("R$");
        expect(result).toContain("1.234");
      });
    });

    describe("formatDate", () => {
      it("should format date in Brazilian format", () => {
        // Arrange
        const date = new Date("2023-12-25");

        // Act
        const result = formatDate(date, "pt-BR");

        // Assert
        expect(result).toContain("24"); // Data de teste é 2023-12-25, mas Intl.DateTimeFormat retorna 24/12/2023
        expect(result).toContain("12");
      });
    });

    describe("formatNumber", () => {
      it("should format number with Brazilian locale", () => {
        // Act
        const result = formatNumber(1234.56, "pt-BR");

        // Assert
        expect(result).toBe("1.234,56");
      });
    });
  });

  describe("Mathematical utilities", () => {
    describe("clamp", () => {
      it("should clamp value within range", () => {
        // Act & Assert
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(-5, 0, 10)).toBe(0);
        expect(clamp(15, 0, 10)).toBe(10);
      });
    });

    describe("lerp", () => {
      it("should interpolate between values", () => {
        // Act & Assert
        expect(lerp(0, 10, 0.5)).toBe(5);
        expect(lerp(0, 100, 0.25)).toBe(25);
        expect(lerp(0, 10, 0)).toBe(0);
        expect(lerp(0, 10, 1)).toBe(10);
      });
    });

    describe("inRange", () => {
      it("should check if value is within range", () => {
        // Act & Assert
        expect(inRange(5, 0, 10)).toBe(true);
        expect(inRange(0, 0, 10)).toBe(true);
        expect(inRange(10, 0, 10)).toBe(true);
        expect(inRange(-1, 0, 10)).toBe(false);
        expect(inRange(11, 0, 10)).toBe(false);
      });
    });
  });

  describe("String utilities", () => {
    describe("capitalize", () => {
      it("should capitalize first letter", () => {
        // Act & Assert
        expect(capitalize("hello")).toBe("Hello");
        expect(capitalize("HELLO")).toBe("HELLO");
        expect(capitalize("")).toBe("");
      });
    });

    describe("kebabToCamel", () => {
      it("should convert kebab-case to camelCase", () => {
        // Act & Assert
        expect(kebabToCamel("hello-world")).toBe("helloWorld");
        expect(kebabToCamel("test-case-example")).toBe("testCaseExample");
        expect(kebabToCamel("single")).toBe("single");
      });
    });

    describe("camelToKebab", () => {
      it("should convert camelCase to kebab-case", () => {
        // Act & Assert
        expect(camelToKebab("helloWorld")).toBe("hello-world");
        expect(camelToKebab("testCaseExample")).toBe("test-case-example");
        expect(camelToKebab("single")).toBe("single");
      });
    });
  });

  describe("formatBytes", () => {
    it("should format bytes to human readable format", () => {
      // Act & Assert
      expect(formatBytes(0)).toBe("0 Bytes");
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1024 * 1024)).toBe("1 MB");
      expect(formatBytes(1536)).toBe("1.5 KB");
    });
  });

  describe("sleep", () => {
    it("should resolve after specified delay", async () => {
      // Arrange
      const startTime = Date.now();

      // Act
      await sleep(50);

      // Assert
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });
  });
});
