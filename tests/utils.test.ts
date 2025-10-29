import { describe, it, expect } from "vitest";
import { cn } from "../lib/utils";

// Teste simples sem dependências complexas
describe("Utils", () => {
  describe("String utilities", () => {
    it("handles basic string operations", () => {
      const str = "test string";
      expect(str).toBeDefined();
      expect(typeof str).toBe("string");
      expect(str.length).toBeGreaterThan(0);
    });

    it("handles string concatenation", () => {
      const result = "hello" + " " + "world";
      expect(result).toBe("hello world");
    });

    it("handles template literals", () => {
      const name = "DataFlow";
      const result = `Welcome to ${name}!`;
      expect(result).toContain("DataFlow");
      expect(result).toContain("Welcome");
    });
  });

  describe("Array utilities", () => {
    it("handles array operations", () => {
      const arr = [1, 2, 3, 4, 5];
      expect(Array.isArray(arr)).toBe(true);
      expect(arr.length).toBe(5);
      expect(arr[0]).toBe(1);
    });

    it("handles array methods", () => {
      const arr = ["a", "b", "c"];
      const mapped = arr.map((item) => item.toUpperCase());
      expect(mapped).toEqual(["A", "B", "C"]);

      const filtered = arr.filter((item) => item !== "b");
      expect(filtered).toEqual(["a", "c"]);
    });
  });

  describe("Object utilities", () => {
    it("handles object operations", () => {
      const obj = { key: "value", number: 42 };
      expect(obj.key).toBe("value");
      expect(obj.number).toBe(42);
      expect(Object.keys(obj)).toHaveLength(2);
    });

    it("handles object spread", () => {
      const base = { a: 1, b: 2 };
      const extended = { ...base, c: 3 };
      expect(extended).toEqual({ a: 1, b: 2, c: 3 });
    });
  });

  describe("cn function", () => {
    it("merges class names correctly", () => {
      const result = cn("bg-red-500", "text-white");
      expect(result).toBe("bg-red-500 text-white");
    });

    it("handles conditional classes", () => {
      const isActive = true;
      const result = cn("base-class", isActive && "active-class");
      expect(result).toBe("base-class active-class");
    });

    it("removes falsy values", () => {
      const result = cn("class1", false && "class2", null, undefined, "class3");
      expect(result).toBe("class1 class3");
    });

    it("handles important classes (! prefix)", () => {
      const result = cn("bg-blue-500", "!bg-red-500");
      expect(result).toBe("!bg-red-500");
    });

    it("merges conflicting Tailwind classes", () => {
      const result = cn("bg-red-500", "bg-blue-500");
      expect(result).toBe("bg-blue-500");
    });

    it("handles empty inputs", () => {
      const result = cn();
      expect(result).toBe("");
    });
  });
});
