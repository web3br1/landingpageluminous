// Tests for Type Guards and Runtime Validation

import { describe, it, expect, vi } from "vitest";
import {
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray,
  isEmail,
  isURL,
  isUUID,
  isPageType,
  isSectionId,
  assertString,
  assertNumber,
  assertObject,
  hasProperty,
  isArrayOf,
  isArrayOfStrings,
  ValidationOutcome,
  createValidationSuccess,
  createValidationError,
  validateAndTransform,
} from "../type-guards";

describe("Type Guards", () => {
  describe("Primitive Type Guards", () => {
    it("should identify strings correctly", () => {
      expect(isString("hello")).toBe(true);
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
    });

    it("should identify numbers correctly", () => {
      expect(isNumber(123)).toBe(true);
      expect(isNumber(123.45)).toBe(true);
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber(Infinity)).toBe(false);
      expect(isNumber("123")).toBe(false);
    });

    it("should identify booleans correctly", () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
      expect(isBoolean(0)).toBe(false);
      expect(isBoolean("true")).toBe(false);
    });

    it("should identify objects correctly", () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: "value" })).toBe(true);
      expect(isObject([])).toBe(false);
      expect(isObject(null)).toBe(false);
      expect(isObject("string")).toBe(false);
    });

    it("should identify arrays correctly", () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray({})).toBe(false);
      expect(isArray("string")).toBe(false);
    });
  });

  describe("Specific Type Guards", () => {
    it("should validate emails", () => {
      expect(isEmail("user@example.com")).toBe(true);
      expect(isEmail("invalid-email")).toBe(false);
      expect(isEmail("")).toBe(false);
      expect(isEmail(null)).toBe(false);
    });

    it("should validate URLs", () => {
      expect(isURL("https://example.com")).toBe(true);
      expect(isURL("http://localhost:3000")).toBe(true);
      expect(isURL("invalid-url")).toBe(false);
      expect(isURL("")).toBe(false);
    });

    it("should validate UUIDs", () => {
      expect(isUUID("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
      expect(isUUID("invalid-uuid")).toBe(false);
      expect(isUUID("")).toBe(false);
    });

    it("should validate page types", () => {
      expect(isPageType("landing")).toBe(true);
      expect(isPageType("product")).toBe(true);
      expect(isPageType("invalid")).toBe(false);
      expect(isPageType("")).toBe(false);
    });

    it("should validate section IDs", () => {
      expect(isSectionId("hero")).toBe(true);
      expect(isSectionId("features")).toBe(true);
      expect(isSectionId("invalid")).toBe(false);
      expect(isSectionId("")).toBe(false);
    });
  });

  describe("Object Type Guards", () => {
    it("should check property existence", () => {
      const obj = { name: "John", age: 30 };

      expect(hasProperty(obj, "name")).toBe(true);
      expect(hasProperty(obj, "email")).toBe(false);
    });

    it("should validate array contents", () => {
      expect(isArrayOf([1, 2, 3], isNumber)).toBe(true);
      expect(isArrayOf(["a", "b", "c"], isString)).toBe(true);
      expect(isArrayOf([1, "a", 3], isNumber)).toBe(false);
      expect(isArrayOfStrings(["a", "b", "c"])).toBe(true);
      expect(isArrayOfStrings([1, 2, 3])).toBe(false);
    });
  });

  describe("Assertion Functions", () => {
    it("should assert strings", () => {
      expect(() => assertString("hello")).not.toThrow();
      expect(() => assertString(123)).toThrow("must be a string");
    });

    it("should assert numbers", () => {
      expect(() => assertNumber(123)).not.toThrow();
      expect(() => assertNumber("123")).toThrow("must be a number");
    });

    it("should assert objects", () => {
      expect(() => assertObject({})).not.toThrow();
      expect(() => assertObject("string")).toThrow("must be an object");
    });
  });

  describe("Validation Utilities", () => {
    it("should create validation results", () => {
      const success = createValidationSuccess("data");
      const error = createValidationError(["error message"]);

      expect(success.success).toBe(true);
      expect(success.data).toBe("data");
      expect(error.success).toBe(false);
      expect(error.errors).toEqual(["error message"]);
    });

    it("should validate and transform", () => {
      const result = validateAndTransform("hello", isString, "Not a string");

      expect(result.success).toBe(true);
      expect(result.data).toBe("hello");

      const invalidResult = validateAndTransform(123, isString, "Not a string");

      expect(invalidResult.success).toBe(false);
      expect(invalidResult.errors).toEqual(["Not a string"]);
    });
  });
});
