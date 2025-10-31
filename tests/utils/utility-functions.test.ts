import { describe, it, expect } from "vitest";

// Utility functions for testing
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
};

const formatCurrency = (amount: number, currency = "BRL"): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(amount);
};

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const isEmpty = (value: any): boolean => {
  if (value == null) return true;
  if (typeof value === "string" || Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === "object") {
    return Object.keys(value).length === 0;
  }
  return false;
};

const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

describe("Utility Functions Tests", () => {
  describe("isValidEmail", () => {
    it("should validate correct email addresses", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
      expect(isValidEmail("test+tag@gmail.com")).toBe(true);
    });

    it("should reject invalid email addresses", () => {
      expect(isValidEmail("invalid-email")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("test@")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });
  });

  describe("capitalize", () => {
    it("should capitalize first letter and lowercase rest", () => {
      expect(capitalize("hello")).toBe("Hello");
      expect(capitalize("WORLD")).toBe("World");
      expect(capitalize("mIXed")).toBe("Mixed");
    });

    it("should handle empty strings", () => {
      expect(capitalize("")).toBe("");
    });

    it("should handle single characters", () => {
      expect(capitalize("a")).toBe("A");
      expect(capitalize("Z")).toBe("Z");
    });
  });

  describe("truncate", () => {
    it("should not truncate short strings", () => {
      expect(truncate("Hello", 10)).toBe("Hello");
      expect(truncate("Test", 4)).toBe("Test");
    });

    it("should truncate long strings", () => {
      expect(truncate("Hello World", 8)).toBe("Hello...");
      expect(truncate("This is a long string", 10)).toBe("This is...");
    });

    it("should handle edge cases", () => {
      expect(truncate("", 5)).toBe("");
      expect(truncate("abc", 3)).toBe("abc");
      expect(truncate("abcd", 3)).toBe("...");
    });
  });

  describe("formatCurrency", () => {
    it("should format currency in BRL", () => {
      const result1 = formatCurrency(1234.56);
      const result2 = formatCurrency(100);
      const result3 = formatCurrency(0);

      // Check that they contain the expected currency symbol and format
      expect(result1).toContain("R$");
      expect(result1).toContain("1.234");
      expect(result2).toContain("R$");
      expect(result2).toContain("100");
      expect(result3).toContain("R$");
      expect(result3).toContain("0");
    });

    it("should format currency in USD", () => {
      const result = formatCurrency(1234.56, "USD");
      expect(result).toContain("$");
      expect(result).toContain("1");
    });
  });

  describe("debounce", () => {
    it("should delay function execution", async () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      await sleep(150);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should cancel previous calls", async () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      await sleep(50);
      expect(mockFn).not.toHaveBeenCalled();

      await sleep(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("generateId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe("string");
      expect(id1.length).toBeGreaterThan(10);
    });

    it("should generate valid ID format", () => {
      const id = generateId();
      // Should contain only alphanumeric characters
      expect(/^[a-zA-Z0-9]+$/.test(id)).toBe(true);
    });
  });

  describe("isEmpty", () => {
    it("should detect empty values", () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty("")).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
    });

    it("should detect non-empty values", () => {
      expect(isEmpty("hello")).toBe(false);
      expect(isEmpty([1, 2, 3])).toBe(false);
      expect(isEmpty({ key: "value" })).toBe(false);
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
    });
  });

  describe("deepClone", () => {
    it("should create deep copy of objects", () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });

    it("should handle arrays", () => {
      const original = [1, 2, { a: 3 }];
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[2]).not.toBe(original[2]);
    });

    it("should handle primitive values", () => {
      expect(deepClone("string")).toBe("string");
      expect(deepClone(42)).toBe(42);
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
    });
  });

  describe("sleep", () => {
    it("should wait for specified milliseconds", async () => {
      const start = Date.now();
      await sleep(50);
      const end = Date.now();

      expect(end - start).toBeGreaterThanOrEqual(45);
    });
  });
});
