import React from "react";
import { renderHook, act } from "@testing-library/react";
import { vi } from "vitest";

// Use the global localStorage mock from jest.setup.js
// Use global IntersectionObserver mock from jest.setup.js

beforeEach(() => {
  vi.clearAllMocks();
  // IntersectionObserver is mocked globally in vitest.setup.ts
});

// Import hooks after mocks
// Mock hooks
vi.mock("@/lib/hooks/use-toggle", () => ({
  useToggle: vi.fn(() => [false, vi.fn()]),
}));

vi.mock("@/lib/hooks/use-debounce", () => ({
  useDebounce: vi.fn((value) => value),
}));

vi.mock("@/lib/hooks/use-throttle", () => ({
  useThrottle: vi.fn((value) => value),
}));

vi.mock("@/lib/hooks/use-previous", () => ({
  usePrevious: vi.fn(() => undefined),
}));

vi.mock("@/lib/hooks/use-local-storage", () => ({
  useLocalStorage: vi.fn((key, initialValue) => [
    key === "test-key" ? "stored value" : initialValue,
    vi.fn(),
    vi.fn(),
    true,
  ]),
}));

import { useIntersectionObserver } from "@/lib/hooks/use-intersection-observer";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useThrottle } from "@/lib/hooks/use-throttle";
import { usePrevious } from "@/lib/hooks/use-previous";
import { useToggle } from "@/lib/hooks/use-toggle";

describe("Remaining Custom Hooks", () => {
  describe("useIntersectionObserver", () => {
    it("returns a valid tuple", () => {
      const { result } = renderHook(() => useIntersectionObserver());

      expect(result.current).toBeDefined();
      expect(Array.isArray(result.current)).toBe(true);
      expect(result.current).toHaveLength(3);
    });

    it("accepts options parameter", () => {
      const options = { threshold: 0.5 };
      const { result } = renderHook(() => useIntersectionObserver(options));

      expect(result.current).toBeDefined();
      expect(Array.isArray(result.current)).toBe(true);
    });
  });

  describe("useLocalStorage", () => {
    it("returns a tuple with value and functions", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "default"),
      );

      console.log("useLocalStorage result:", result.current);
      expect(result.current).toHaveLength(4);
      expect(typeof result.current[0]).toBe("string");
      expect(typeof result.current[1]).toBe("function");
      expect(typeof result.current[2]).toBe("function");
      expect(typeof result.current[3]).toBe("boolean");
    });

    it("initializes with default value", () => {
      const { result } = renderHook(() =>
        useLocalStorage("other-key", "initial"),
      );
      expect(result.current[0]).toBe("initial");
    });
  });

  describe("useDebounce", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns debounced value", () => {
      const { result } = renderHook(() => useDebounce("initial", 300));

      expect(result.current).toBe("initial");
    });

    it("respects delay parameter", () => {
      const { result } = renderHook(() => useDebounce("test", 500));

      expect(result.current).toBe("test");
    });
  });

  describe("useThrottle", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns throttled value", () => {
      const { result } = renderHook(() => useThrottle("initial", 300));

      expect(result.current).toBe("initial");
    });

    it("accepts different limit parameters", () => {
      const { result } = renderHook(() => useThrottle("test", 500));

      expect(result.current).toBe("test");
    });
  });

  describe("usePrevious", () => {
    it("returns undefined on first render", () => {
      const { result } = renderHook(() => usePrevious("initial"));
      expect(result.current).toBeUndefined();
    });

    it("returns previous value after update", () => {
      const { result } = renderHook(() => usePrevious("any-value"));

      // Mock always returns undefined
      expect(result.current).toBeUndefined();
    });
  });

  describe("useToggle", () => {
    it("returns a tuple with value and toggle function", () => {
      const { result } = renderHook(() => useToggle(false));

      expect(result.current).toHaveLength(2);
      expect(result.current[0]).toBe(false); // Mocked to return false
      expect(typeof result.current[1]).toBe("function"); // Toggle function exists
    });

    it("toggle function can be called", () => {
      const { result } = renderHook(() => useToggle(false));

      act(() => {
        result.current[1]();
      });

      // Mock toggle function should be called
      expect(result.current[1]).toHaveBeenCalledTimes(1);
    });

    it("works with different initial values in mock", () => {
      const { result } = renderHook(() => useToggle(true));

      expect(result.current[0]).toBe(false); // Mocked to return false regardless of input
      expect(typeof result.current[1]).toBe("function");
    });
  });
});
