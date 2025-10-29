import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "sessionStorage", { value: mockSessionStorage });

// Import utilities after mocks
import {
  createStorage,
  createSessionStorage,
  createLocalStorage,
  createCache,
  createDebounce,
  createThrottle,
  createEventEmitter,
  createQueryString,
  parseQueryString,
  deepClone,
  deepEqual,
  createId,
  createSlug,
  formatCurrency,
  formatDate,
  formatNumber,
  sleep,
} from "@/lib/utils/advanced-utils";

describe("Advanced Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockSessionStorage.getItem.mockClear();
    mockSessionStorage.setItem.mockClear();
  });

  describe("Storage Utilities", () => {
    describe("createStorage", () => {
      it("creates storage utility with localStorage", () => {
        const storage = createStorage(localStorage);

        expect(storage).toHaveProperty("get");
        expect(storage).toHaveProperty("set");
        expect(storage).toHaveProperty("remove");
        expect(storage).toHaveProperty("clear");
        expect(typeof storage.get).toBe("function");
      });

      it("gets stored values", () => {
        mockLocalStorage.getItem.mockReturnValue('"stored value"');
        const storage = createStorage(localStorage);

        const result = storage.get("test-key");

        expect(result).toBe("stored value");
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith("test-key");
      });

      it("sets values in storage", () => {
        const storage = createStorage(localStorage);

        storage.set("test-key", { data: "value" });

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          "test-key",
          '{"data":"value"}',
        );
      });

      it("removes values from storage", () => {
        const storage = createStorage(localStorage);

        storage.remove("test-key");

        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("test-key");
      });

      it("clears storage", () => {
        const storage = createStorage(localStorage);

        storage.clear();

        expect(mockLocalStorage.clear).toHaveBeenCalled();
      });

      it("handles storage errors gracefully", () => {
        mockLocalStorage.getItem.mockImplementation(() => {
          throw new Error("Storage error");
        });

        const storage = createStorage(localStorage);
        const result = storage.get("test-key");

        expect(result).toBeUndefined();
      });
    });

    describe("createLocalStorage", () => {
      it("creates localStorage utility", () => {
        const storage = createLocalStorage();

        expect(storage).toHaveProperty("get");
        expect(storage).toHaveProperty("set");
      });

      it("works with localStorage", () => {
        const storage = createLocalStorage();

        storage.set("test", "value");
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          "test",
          '"value"',
        );
      });
    });

    describe("createSessionStorage", () => {
      it("creates sessionStorage utility", () => {
        const storage = createSessionStorage();

        expect(storage).toHaveProperty("get");
        expect(storage).toHaveProperty("set");
      });

      it("works with sessionStorage", () => {
        const storage = createSessionStorage();

        storage.set("session-key", "session-value");
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
          "session-key",
          '"session-value"',
        );
      });
    });
  });

  describe("Cache Utility", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });
    it("creates cache with default options", () => {
      const cache = createCache();

      expect(cache).toHaveProperty("get");
      expect(cache).toHaveProperty("set");
      expect(cache).toHaveProperty("has");
      expect(cache).toHaveProperty("delete");
      expect(cache).toHaveProperty("clear");
    });

    it("caches values with TTL", () => {
      const cache = createCache({ ttl: 1000 });

      cache.set("key", "value");

      expect(cache.get("key")).toBe("value");
      expect(cache.has("key")).toBe(true);
    });

    it("respects TTL expiration", () => {
      const cache = createCache({ ttl: 100 });

      cache.set("key", "value");

      // Fast-forward time
      vi.advanceTimersByTime(150);

      expect(cache.get("key")).toBeUndefined();
      expect(cache.has("key")).toBe(false);
    });

    it("handles max size limit", () => {
      const cache = createCache({ maxSize: 2 });

      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.set("key3", "value3"); // Should evict key1

      expect(cache.has("key1")).toBe(false);
      expect(cache.has("key2")).toBe(true);
      expect(cache.has("key3")).toBe(true);
    });

    it("clears cache", () => {
      const cache = createCache();

      cache.set("key1", "value1");
      cache.set("key2", "value2");

      cache.clear();

      expect(cache.has("key1")).toBe(false);
      expect(cache.has("key2")).toBe(false);
    });
  });

  describe("Debounce Utility", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });
    it("creates debounced function", () => {
      const mockFn = vi.fn();
      const debouncedFn = createDebounce(mockFn, 300);

      expect(typeof debouncedFn).toBe("function");
    });

    it("delays function execution", () => {
      const mockFn = vi.fn();
      const debouncedFn = createDebounce(mockFn, 300);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      // Advance time
      vi.advanceTimersByTime(300);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("resets delay on multiple calls", () => {
      const mockFn = vi.fn();
      const debouncedFn = createDebounce(mockFn, 300);

      debouncedFn();
      vi.advanceTimersByTime(200);

      debouncedFn(); // Reset timer
      vi.advanceTimersByTime(200);

      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("passes arguments correctly", () => {
      const mockFn = vi.fn();
      const debouncedFn = createDebounce(mockFn, 300);

      debouncedFn("arg1", "arg2", 123);

      vi.advanceTimersByTime(300);

      expect(mockFn).toHaveBeenCalledWith("arg1", "arg2", 123);
    });
  });

  describe("Throttle Utility", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });
    it("creates throttled function", () => {
      const mockFn = vi.fn();
      const throttledFn = createThrottle(mockFn, 300);

      expect(typeof throttledFn).toBe("function");
    });

    it("limits function execution rate", () => {
      const mockFn = vi.fn();
      const throttledFn = createThrottle(mockFn, 300);

      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(1);

      throttledFn();
      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(1); // Still 1

      vi.advanceTimersByTime(300);

      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it("passes arguments correctly", () => {
      const mockFn = vi.fn();
      const throttledFn = createThrottle(mockFn, 300);

      throttledFn("test", 42);

      expect(mockFn).toHaveBeenCalledWith("test", 42);
    });
  });

  describe("Event Emitter", () => {
    it("creates event emitter", () => {
      const emitter = createEventEmitter();

      expect(emitter).toHaveProperty("on");
      expect(emitter).toHaveProperty("off");
      expect(emitter).toHaveProperty("emit");
      expect(emitter).toHaveProperty("removeAllListeners");
    });

    it("registers event listeners", () => {
      const emitter = createEventEmitter();
      const mockListener = vi.fn();

      emitter.on("test-event", mockListener);

      emitter.emit("test-event", "data");

      expect(mockListener).toHaveBeenCalledWith("data");
    });

    it("removes event listeners", () => {
      const emitter = createEventEmitter();
      const mockListener = vi.fn();

      emitter.on("test-event", mockListener);
      emitter.off("test-event", mockListener);

      emitter.emit("test-event", "data");

      expect(mockListener).not.toHaveBeenCalled();
    });

    it("handles multiple listeners for same event", () => {
      const emitter = createEventEmitter();
      const mockListener1 = vi.fn();
      const mockListener2 = vi.fn();

      emitter.on("test-event", mockListener1);
      emitter.on("test-event", mockListener2);

      emitter.emit("test-event", "data");

      expect(mockListener1).toHaveBeenCalledWith("data");
      expect(mockListener2).toHaveBeenCalledWith("data");
    });

    it("removes all listeners for event", () => {
      const emitter = createEventEmitter();
      const mockListener1 = vi.fn();
      const mockListener2 = vi.fn();

      emitter.on("test-event", mockListener1);
      emitter.on("test-event", mockListener2);

      emitter.removeAllListeners("test-event");

      emitter.emit("test-event", "data");

      expect(mockListener1).not.toHaveBeenCalled();
      expect(mockListener2).not.toHaveBeenCalled();
    });
  });

  describe("Query String Utilities", () => {
    describe("createQueryString", () => {
      it("creates query string from object", () => {
        const params = { key: "value", number: 42, boolean: true };
        const queryString = createQueryString(params);

        expect(queryString).toBe("key=value&number=42&boolean=true");
      });

      it("handles empty object", () => {
        const queryString = createQueryString({});

        expect(queryString).toBe("");
      });

      it("encodes special characters", () => {
        const params = { search: "hello world", filter: "name=john" };
        const queryString = createQueryString(params);

        expect(queryString).toContain("hello%20world");
        expect(queryString).toContain("name%3Djohn");
      });

      it("handles array values", () => {
        const params = { tags: ["react", "typescript"] };
        const queryString = createQueryString(params);

        expect(queryString).toBe("tags=react&tags=typescript");
      });
    });

    describe("parseQueryString", () => {
      it("parses query string to object", () => {
        const queryString = "key=value&number=42&boolean=true";
        const params = parseQueryString(queryString);

        expect(params).toEqual({
          key: "value",
          number: "42",
          boolean: "true",
        });
      });

      it("handles empty query string", () => {
        const params = parseQueryString("");

        expect(params).toEqual({});
      });

      it("decodes special characters", () => {
        const queryString = "search=hello%20world&filter=name%3Djohn";
        const params = parseQueryString(queryString);

        expect(params.search).toBe("hello world");
        expect(params.filter).toBe("name=john");
      });

      it("handles array values", () => {
        const queryString = "tags=react&tags=typescript";
        const params = parseQueryString(queryString);

        expect(params.tags).toEqual(["react", "typescript"]);
      });
    });
  });

  describe("Object Utilities", () => {
    describe("deepClone", () => {
      it("clones primitive values", () => {
        expect(deepClone("string")).toBe("string");
        expect(deepClone(42)).toBe(42);
        expect(deepClone(true)).toBe(true);
        expect(deepClone(null)).toBe(null);
        expect(deepClone(undefined)).toBe(undefined);
      });

      it("clones objects deeply", () => {
        const original = {
          nested: {
            value: "test",
            array: [1, 2, { deep: "value" }],
          },
        };

        const cloned = deepClone(original);

        expect(cloned).toEqual(original);
        expect(cloned).not.toBe(original);
        expect(cloned.nested).not.toBe(original.nested);
        expect(cloned.nested.array).not.toBe(original.nested.array);
      });

      it("clones arrays deeply", () => {
        const original = [1, 2, { nested: "value" }, [3, 4]];

        const cloned = deepClone(original);

        expect(cloned).toEqual(original);
        expect(cloned).not.toBe(original);
        expect(cloned[2]).not.toBe(original[2]);
      });
    });

    describe("deepEqual", () => {
      it("compares primitive values", () => {
        expect(deepEqual("string", "string")).toBe(true);
        expect(deepEqual("string", "different")).toBe(false);
        expect(deepEqual(42, 42)).toBe(true);
        expect(deepEqual(42, 43)).toBe(false);
      });

      it("compares objects deeply", () => {
        const obj1 = { a: 1, b: { c: 2 } };
        const obj2 = { a: 1, b: { c: 2 } };
        const obj3 = { a: 1, b: { c: 3 } };

        expect(deepEqual(obj1, obj2)).toBe(true);
        expect(deepEqual(obj1, obj3)).toBe(false);
      });

      it("compares arrays deeply", () => {
        expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
        expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
        expect(deepEqual([1, 2, { a: 1 }], [1, 2, { a: 1 }])).toBe(true);
      });

      it("handles null and undefined", () => {
        expect(deepEqual(null, null)).toBe(true);
        expect(deepEqual(undefined, undefined)).toBe(true);
        expect(deepEqual(null, undefined)).toBe(false);
      });
    });
  });

  describe("ID and Slug Utilities", () => {
    describe("createId", () => {
      it("creates unique IDs", () => {
        const id1 = createId();
        const id2 = createId();

        expect(id1).not.toBe(id2);
        expect(typeof id1).toBe("string");
        expect(id1.length).toBeGreaterThan(0);
      });

      it("creates IDs with prefix", () => {
        const id = createId("user");

        expect(id.startsWith("user-")).toBe(true);
      });
    });

    describe("createSlug", () => {
      it("creates URL-friendly slugs", () => {
        expect(createSlug("Hello World")).toBe("hello-world");
        expect(createSlug("Olá Mundo!")).toBe("ola-mundo");
        expect(createSlug("Test_with_underscores")).toBe(
          "test-with-underscores",
        );
      });

      it("handles special characters", () => {
        expect(createSlug("Café & Restaurant")).toBe("cafe-restaurant");
        expect(createSlug("100% Quality")).toBe("100-quality");
      });

      it("handles empty and whitespace", () => {
        expect(createSlug("")).toBe("");
        expect(createSlug("   ")).toBe("");
        expect(createSlug("  test  ")).toBe("test");
      });
    });
  });

  describe("Formatting Utilities", () => {
    describe("formatCurrency", () => {
      it("formats currency values", () => {
        const brl = formatCurrency(1234.56, "BRL", "pt-BR");
        const usd = formatCurrency(1234.56, "USD", "en-US");

        expect(brl).toContain("R$");
        expect(brl).toContain("1.234,56");
        expect(usd).toContain("$");
        expect(usd).toMatch(/\$[\d,]+\.?\d*/);
      });

      it("handles different locales", () => {
        const eur = formatCurrency(1234.56, "EUR", "de-DE");

        expect(eur).toContain("1.234,56");
        expect(eur).toContain("€");
      });
    });

    describe("formatDate", () => {
      it("formats dates", () => {
        const date = new Date("2023-12-25T12:00:00Z"); // Use UTC to avoid timezone issues
        const formatted = formatDate(date, "pt-BR");

        expect(formatted).toContain("25");
        expect(formatted).toContain("12");
        expect(formatted).toContain("2023");
      });

      it("handles different formats", () => {
        const date = new Date("2023-12-25T12:00:00Z"); // Use UTC to avoid timezone issues
        const formatted = formatDate(date, "en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        expect(formatted).toContain("December");
        expect(formatted).toContain("25");
        expect(formatted).toContain("2023");
      });
    });

    describe("formatNumber", () => {
      it("formats numbers", () => {
        expect(formatNumber(1234.56, "pt-BR")).toBe("1.234,56");
        expect(formatNumber(1234.56, "en-US")).toBe("1,234.56");
      });

      it("handles different options", () => {
        expect(formatNumber(1234, "en-US", { minimumFractionDigits: 2 })).toBe(
          "1,234.00",
        );
      });
    });
  });

  describe("sleep", () => {
    it("returns a promise that resolves after delay", async () => {
      vi.useFakeTimers();
      const promise = sleep(100);

      vi.advanceTimersByTime(100);

      await expect(promise).resolves.toBeUndefined();
      vi.useRealTimers();
    });

    it("handles zero delay", async () => {
      vi.useFakeTimers();
      const promise = sleep(0);

      vi.advanceTimersByTime(0);

      await expect(promise).resolves.toBeUndefined();
      vi.useRealTimers();
    });
  });
});
