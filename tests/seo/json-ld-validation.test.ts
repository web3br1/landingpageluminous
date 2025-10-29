import { describe, it, expect } from "vitest";
import { validateJsonLdSchema } from "@/lib/seo/json-ld-schemas";
import {
  softwareApplicationSchema,
  organizationSchema,
  faqSchema,
} from "@/lib/seo";

describe("JSON-LD Schema Validation", () => {
  describe("SoftwareApplication Schema", () => {
    it("should validate a correct SoftwareApplication schema", () => {
      const result = validateJsonLdSchema(
        softwareApplicationSchema,
        "SoftwareApplication",
      );
      expect(result.success).toBe(true);
    });

    it("should reject invalid SoftwareApplication schema", () => {
      const invalidSchema = {
        ...softwareApplicationSchema,
        name: "", // Invalid: empty name
      };
      const result = validateJsonLdSchema(invalidSchema, "SoftwareApplication");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.issues.length).toBeGreaterThan(0);
      }
    });

    it("should reject schema with invalid URL", () => {
      const invalidSchema = {
        ...softwareApplicationSchema,
        url: "not-a-url",
      };
      const result = validateJsonLdSchema(invalidSchema, "SoftwareApplication");
      expect(result.success).toBe(false);
    });
  });

  describe("Organization Schema", () => {
    it("should validate a correct Organization schema", () => {
      const result = validateJsonLdSchema(organizationSchema, "Organization");
      expect(result.success).toBe(true);
    });

    it("should reject invalid Organization schema", () => {
      const invalidSchema = {
        ...organizationSchema,
        sameAs: ["not-a-url"], // Invalid URL
      };
      const result = validateJsonLdSchema(invalidSchema, "Organization");
      expect(result.success).toBe(false);
    });
  });

  describe("FAQPage Schema", () => {
    it("should validate a correct FAQPage schema", () => {
      const result = validateJsonLdSchema(faqSchema, "FAQPage");
      expect(result.success).toBe(true);
    });

    it("should reject FAQ with empty answer", () => {
      const invalidSchema = {
        ...faqSchema,
        mainEntity: [
          {
            "@type": "Question",
            name: "Test Question",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Too short", // Invalid: too short
            },
          },
        ],
      };
      const result = validateJsonLdSchema(invalidSchema, "FAQPage");
      expect(result.success).toBe(false);
    });
  });

  describe("Unknown Schema Type", () => {
    it("should reject unknown schema types", () => {
      const result = validateJsonLdSchema({}, "UnknownType");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.issues[0].message).toContain(
          "Unknown schema type",
        );
      }
    });
  });

  describe("Runtime Validation Integration", () => {
    it("should validate all production schemas", () => {
      // This test ensures our production schemas are valid
      const schemas = [
        { schema: softwareApplicationSchema, type: "SoftwareApplication" },
        { schema: organizationSchema, type: "Organization" },
        { schema: faqSchema, type: "FAQPage" },
      ];

      for (const { schema, type } of schemas) {
        const result = validateJsonLdSchema(schema, type);
        expect(result.success).toBe(true);
      }
    });
  });
});
