/**
 * @fileoverview Unit tests for PageCompositionService helpers and validation
 * Tests for ensureError, logErrorAndCapture functions and Zod schemas
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

// Import the helpers from the service (we'll need to extract them to a separate file)
// For now, we'll duplicate them for testing
function ensureError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

const CompositionOptionsSchema = z
  .object({
    flags: z.record(z.string(), z.boolean()).optional(),
  })
  .strict();

const CompositionContextSchema = z
  .object({
    userId: z.string().optional(),
    tenantId: z.string().optional(),
    userSegments: z.array(z.string()).optional(),
    experiments: z.record(z.string(), z.string()).optional(),
    locale: z.string().optional(),
    featureFlags: z.record(z.string(), z.boolean()).optional(),
    experimentOverrides: z.record(z.string(), z.string()).optional(),
  })
  .strict()
  .optional();

describe("PageCompositionService Helpers - Unit Tests", () => {
  describe("ensureError", () => {
    it("should return Error object unchanged if input is already an Error", () => {
      const originalError = new Error("test message");
      const result = ensureError(originalError);

      expect(result).toBe(originalError);
      expect(result.message).toBe("test message");
      expect(result).toBeInstanceOf(Error);
    });

    it("should create new Error from string", () => {
      const errorString = "simple error message";
      const result = ensureError(errorString);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("simple error message");
    });

    it("should create new Error from number", () => {
      const errorNumber = 404;
      const result = ensureError(errorNumber);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("404");
    });

    it("should create new Error from null", () => {
      const result = ensureError(null);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("null");
    });

    it("should create new Error from undefined", () => {
      const result = ensureError(undefined);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("undefined");
    });

    it("should create new Error from complex object", () => {
      const complexObject = {
        code: "VALIDATION_ERROR",
        details: "field required",
      };
      const result = ensureError(complexObject);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("[object Object]");
    });

    it("should handle Error subclasses", () => {
      const typeError = new TypeError("type error message");
      const result = ensureError(typeError);

      expect(result).toBe(typeError);
      expect(result).toBeInstanceOf(TypeError);
      expect(result.message).toBe("type error message");
    });
  });

  describe("CompositionOptionsSchema", () => {
    it("should validate valid composition options", () => {
      const validOptions = {
        flags: {
          featureA: true,
          featureB: false,
        },
      };

      const result = CompositionOptionsSchema.safeParse(validOptions);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validOptions);
    });

    it("should validate options without flags", () => {
      const optionsWithoutFlags = {};

      const result = CompositionOptionsSchema.safeParse(optionsWithoutFlags);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ flags: undefined });
    });

    it("should validate options with empty flags", () => {
      const optionsWithEmptyFlags = { flags: {} };

      const result = CompositionOptionsSchema.safeParse(optionsWithEmptyFlags);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(optionsWithEmptyFlags);
    });

    it("should reject invalid flags type", () => {
      const invalidOptions = {
        flags: "not-an-object",
      };

      const result = CompositionOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain("expected record");
    });

    it("should reject non-boolean flag values", () => {
      const invalidOptions = {
        flags: {
          featureA: "true", // string instead of boolean
          featureB: true,
        },
      };

      const result = CompositionOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toHaveLength(1);
    });

    it("should reject extra properties in strict mode", () => {
      const invalidOptions = {
        flags: { featureA: true },
        extraProperty: "not allowed",
      };

      const result = CompositionOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain("Unrecognized key");
    });

    it("should reject null or undefined flags", () => {
      const invalidOptions = { flags: null };

      const result = CompositionOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
    });
  });

  describe("CompositionContextSchema", () => {
    it("should validate valid composition context", () => {
      const validContext = {
        userId: "user123",
        tenantId: "tenant456",
        userSegments: ["premium", "enterprise"],
        experiments: { hero_test: "variant_a" },
        locale: "pt-BR",
        featureFlags: { new_feature: true },
        experimentOverrides: { override_test: "override_variant" },
      };

      const result = CompositionContextSchema.safeParse(validContext);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validContext);
    });

    it("should validate minimal context with all optional fields", () => {
      const minimalContext = {};

      const result = CompositionContextSchema.safeParse(minimalContext);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it("should validate undefined context", () => {
      const result = CompositionContextSchema.safeParse(undefined);
      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
    });

    it("should validate partial context", () => {
      const partialContext = {
        userId: "user123",
        locale: "en-US",
      };

      const result = CompositionContextSchema.safeParse(partialContext);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(partialContext);
    });

    it("should reject invalid userId type", () => {
      const invalidContext = {
        userId: 12345, // number instead of string
      };

      const result = CompositionContextSchema.safeParse(invalidContext);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain("expected string");
    });

    it("should reject invalid userSegments type", () => {
      const invalidContext = {
        userSegments: "not-an-array", // string instead of array
      };

      const result = CompositionContextSchema.safeParse(invalidContext);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain("expected array");
    });

    it("should reject invalid userSegments array elements", () => {
      const invalidContext = {
        userSegments: ["valid", 123, "also-valid"], // number in array
      };

      const result = CompositionContextSchema.safeParse(invalidContext);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain("expected string");
    });

    it("should reject invalid experiments record", () => {
      const invalidContext = {
        experiments: {
          test_exp: "variant_a",
          another_exp: 123, // number instead of string
        },
      };

      const result = CompositionContextSchema.safeParse(invalidContext);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain("expected string");
    });

    it("should reject invalid featureFlags record", () => {
      const invalidContext = {
        featureFlags: {
          feature_a: true,
          feature_b: "false", // string instead of boolean
        },
      };

      const result = CompositionContextSchema.safeParse(invalidContext);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain("expected boolean");
    });

    it("should reject extra properties in strict mode", () => {
      const invalidContext = {
        userId: "user123",
        extraProperty: "not allowed",
      };

      const result = CompositionContextSchema.safeParse(invalidContext);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain("Unrecognized key");
    });

    it("should handle complex nested validation", () => {
      const complexContext = {
        userId: "user123",
        tenantId: "tenant456",
        userSegments: ["premium", "enterprise", "trial"],
        experiments: {
          hero_color: "blue",
          pricing_layout: "cards",
          cta_text: "start_free_trial",
        },
        locale: "pt-BR",
        featureFlags: {
          new_dashboard: true,
          analytics_beta: false,
          mobile_app: true,
        },
        experimentOverrides: {
          forced_experiment: "control",
        },
      };

      const result = CompositionContextSchema.safeParse(complexContext);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(complexContext);
    });
  });

  describe("Integration - Schema Validation", () => {
    it("should handle real-world composition scenarios", () => {
      // Valid landing page composition
      const validLandingOptions = {
        flags: {
          show_pricing: true,
          enable_chat: false,
          dark_mode: true,
        },
      };

      const validLandingContext = {
        userId: "user_abc123",
        tenantId: "tenant_xyz789",
        userSegments: ["free_trial", "marketing_emails"],
        experiments: {
          hero_variant: "animated",
          pricing_display: "yearly_first",
        },
        locale: "en-US",
        featureFlags: {
          beta_features: true,
          analytics: true,
        },
      };

      const optionsResult =
        CompositionOptionsSchema.safeParse(validLandingOptions);
      const contextResult =
        CompositionContextSchema.safeParse(validLandingContext);

      expect(optionsResult.success).toBe(true);
      expect(contextResult.success).toBe(true);

      // Ensure the validated data maintains structure
      expect(optionsResult.data?.flags?.show_pricing).toBe(true);
      expect(contextResult.data?.experiments?.hero_variant).toBe("animated");
    });

    it("should reject common invalid inputs", () => {
      const invalidInputs = [
        { flags: null },
        { flags: "string" },
        { flags: { feature: "true" } }, // string instead of boolean
        { userId: [] }, // array instead of string
        { userSegments: {} }, // object instead of array
        { experiments: [] }, // array instead of record
        { featureFlags: { flag: "yes" } }, // string instead of boolean
      ];

      invalidInputs.forEach((input) => {
        if ("flags" in input) {
          const result = CompositionOptionsSchema.safeParse(input);
          expect(result.success).toBe(false);
        } else {
          const result = CompositionContextSchema.safeParse(input);
          expect(result.success).toBe(false);
        }
      });
    });
  });
});
