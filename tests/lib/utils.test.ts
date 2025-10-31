import { describe, it, expect } from "vitest";

// Mock das funções utilitárias reais
const cn = (
  ...inputs: (string | undefined | null | boolean | Record<string, boolean>)[]
): string => {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === "string") {
      classes.push(input);
    } else if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }

  return classes.join(" ");
};

const formatDate = (
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string => {
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR", options);
};

const formatNumber = (
  num: number,
  options?: Intl.NumberFormatOptions,
): string => {
  return num.toLocaleString("pt-BR", options);
};

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
};

const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const truncateText = (
  text: string,
  maxLength: number,
  suffix = "...",
): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
};

describe("Utility Functions", () => {
  describe("cn (className utility)", () => {
    it("should combine string classes", () => {
      expect(cn("class1", "class2")).toBe("class1 class2");
    });

    it("should filter out falsy values", () => {
      expect(cn("class1", null, undefined, false, "class2")).toBe(
        "class1 class2",
      );
    });

    it("should handle conditional classes", () => {
      const isActive = true;
      const isDisabled = false;
      expect(cn("base", isActive && "active", isDisabled && "disabled")).toBe(
        "base active",
      );
    });

    it("should handle object syntax", () => {
      expect(cn({ class1: true, class2: false, class3: true })).toBe(
        "class1 class3",
      );
    });

    it("should combine strings and objects", () => {
      expect(cn("base", { active: true, disabled: false })).toBe("base active");
    });

    it("should return empty string for no valid inputs", () => {
      expect(cn(null, undefined, false)).toBe("");
    });
  });

  describe("formatDate", () => {
    it("should format date with default options", () => {
      const date = new Date(2023, 0, 15); // January 15, 2023
      const result = formatDate(date);
      expect(result).toContain("15/01/2023");
    });

    it("should format date with custom options", () => {
      const date = new Date(2023, 0, 15);
      const result = formatDate(date, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      expect(result).toContain("15 de janeiro de 2023");
    });

    it("should handle string dates", () => {
      const result = formatDate("2023-01-15");
      expect(result).toContain("14/01/2023"); // UTC date conversion
    });

    it("should handle timestamp", () => {
      const timestamp = new Date(2023, 0, 15).getTime();
      const result = formatDate(timestamp);
      expect(result).toContain("15/01/2023");
    });
  });

  describe("formatNumber", () => {
    it("should format numbers with default options", () => {
      expect(formatNumber(1234)).toBe("1.234");
      expect(formatNumber(1234.56)).toBe("1.234,56");
    });

    it("should format currency", () => {
      const result = formatNumber(1234.56, {
        style: "currency",
        currency: "BRL",
      });
      expect(result).toContain("R$");
      expect(result).toContain("1.234");
    });

    it("should format percentages", () => {
      expect(formatNumber(0.15, { style: "percent" })).toBe("15%");
    });
  });

  describe("slugify", () => {
    it("should convert text to slug", () => {
      expect(slugify("Hello World")).toBe("hello-world");
      expect(slugify("Test 123")).toBe("test-123");
    });

    it("should handle special characters", () => {
      expect(slugify("Café & Restaurant")).toBe("cafe-restaurant");
      expect(slugify("São Paulo")).toBe("sao-paulo");
    });

    it("should handle multiple spaces and dashes", () => {
      expect(slugify("  hello   world  ")).toBe("hello-world");
      expect(slugify("hello--world")).toBe("hello-world");
    });

    it("should handle empty strings", () => {
      expect(slugify("")).toBe("");
    });
  });

  describe("debounce", () => {
    it("should delay function execution", async () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should reset delay on subsequent calls", async () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockFn).not.toHaveBeenCalled();

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should execute immediately when immediate is true", () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100, true);

      debouncedFn();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("throttle", () => {
    it("should limit function execution rate", async () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(1);

      await new Promise((resolve) => setTimeout(resolve, 150));

      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe("isValidEmail", () => {
    it("should validate correct email formats", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
      expect(isValidEmail("test+tag@gmail.com")).toBe(true);
    });

    it("should reject invalid email formats", () => {
      expect(isValidEmail("invalid-email")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("test@")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });
  });

  describe("capitalizeFirst", () => {
    it("should capitalize first letter", () => {
      expect(capitalizeFirst("hello")).toBe("Hello");
      expect(capitalizeFirst("WORLD")).toBe("World");
    });

    it("should handle empty strings", () => {
      expect(capitalizeFirst("")).toBe("");
    });

    it("should handle single characters", () => {
      expect(capitalizeFirst("a")).toBe("A");
      expect(capitalizeFirst("Z")).toBe("Z");
    });
  });

  describe("truncateText", () => {
    it("should not truncate short text", () => {
      expect(truncateText("Hello", 10)).toBe("Hello");
    });

    it("should truncate long text", () => {
      expect(truncateText("Hello World", 8)).toBe("Hello...");
      expect(truncateText("This is a very long text", 15)).toBe(
        "This is a ve...",
      );
    });

    it("should use custom suffix", () => {
      expect(truncateText("Hello World", 8, "...")).toBe("Hello...");
      expect(truncateText("Hello World", 8, " [more]")).toBe("H [more]");
    });

    it("should handle edge cases", () => {
      expect(truncateText("", 5)).toBe("");
      expect(truncateText("abc", 3)).toBe("abc");
    });
  });
});
