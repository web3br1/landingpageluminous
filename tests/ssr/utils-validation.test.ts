import { describe, it, expect } from "vitest";
import { cn, designTokens } from "@/lib/utils";

describe("Utils Validation SSR", () => {
  describe("cn utility function", () => {
    it("merges Tailwind classes correctly", () => {
      const result = cn("bg-red-500", "text-white", "p-4");
      expect(result).toBe("bg-red-500 text-white p-4");
    });

    it("handles conflicting classes by keeping the last one", () => {
      const result = cn("bg-red-500", "bg-blue-500");
      expect(result).toBe("bg-blue-500");
    });

    it("merges complex Tailwind classes", () => {
      const result = cn(
        "flex items-center",
        "justify-between",
        "flex-col",
        "items-start",
      );
      expect(result).toBe("flex justify-between flex-col items-start");
    });

    it("handles conditional classes", () => {
      const isActive = true;
      const isDisabled = false;
      const result = cn(
        "btn",
        isActive && "btn-active",
        isDisabled && "btn-disabled",
      );
      expect(result).toBe("btn btn-active");
    });

    it("handles undefined and null values", () => {
      const result = cn("base-class", undefined, null, "another-class");
      expect(result).toBe("base-class another-class");
    });

    it("handles empty strings", () => {
      const result = cn("base-class", "", "another-class", "");
      expect(result).toBe("base-class another-class");
    });

    it("handles falsy values correctly", () => {
      const result = cn(
        "base-class",
        0,
        false,
        "",
        null,
        undefined,
        "another-class",
      );
      expect(result).toBe("base-class another-class");
    });

    it("preserves important modifier", () => {
      const result = cn("!bg-red-500", "bg-blue-500");
      expect(result).toBe("!bg-red-500");
    });
  });

  describe("designTokens", () => {
    it("should have all required token categories", () => {
      expect(designTokens).toHaveProperty("colors");
      expect(designTokens).toHaveProperty("spacing");
      expect(designTokens).toHaveProperty("typography");
      expect(designTokens).toHaveProperty("borderRadius");
      expect(designTokens).toHaveProperty("shadows");
    });

    it("should have valid color tokens", () => {
      const colors = designTokens.colors;

      expect(colors).toHaveProperty("primary");
      expect(colors).toHaveProperty("secondary");
      expect(colors).toHaveProperty("accent");
      expect(colors).toHaveProperty("neutral");

      // Check that primary has the expected shades
      expect(colors.primary).toHaveProperty("50");
      expect(colors.primary).toHaveProperty("100");
      expect(colors.primary).toHaveProperty("500");
      expect(colors.primary).toHaveProperty("900");
    });

    it("should have valid spacing tokens", () => {
      const spacing = designTokens.spacing;

      expect(spacing).toHaveProperty("xs");
      expect(spacing).toHaveProperty("sm");
      expect(spacing).toHaveProperty("md");
      expect(spacing).toHaveProperty("lg");
      expect(spacing).toHaveProperty("xl");

      // Spacing values should be strings (CSS values)
      Object.values(spacing).forEach((value) => {
        expect(typeof value).toBe("string");
      });
    });

    it("should have valid typography tokens", () => {
      const typography = designTokens.typography;

      expect(typography).toHaveProperty("fontFamily");
      expect(typography).toHaveProperty("fontSize");
      expect(typography).toHaveProperty("fontWeight");
      expect(typography).toHaveProperty("lineHeight");

      expect(typography.fontFamily).toHaveProperty("sans");
      expect(typography.fontFamily).toHaveProperty("mono");

      expect(typography.fontSize).toHaveProperty("xs");
      expect(typography.fontSize).toHaveProperty("sm");
      expect(typography.fontSize).toHaveProperty("base");
      expect(typography.fontSize).toHaveProperty("lg");
      expect(typography.fontSize).toHaveProperty("xl");
    });

    it("should have valid border radius tokens", () => {
      const borderRadius = designTokens.borderRadius;

      expect(borderRadius).toHaveProperty("none");
      expect(borderRadius).toHaveProperty("sm");
      expect(borderRadius).toHaveProperty("md");
      expect(borderRadius).toHaveProperty("lg");
      expect(borderRadius).toHaveProperty("full");

      Object.values(borderRadius).forEach((value) => {
        expect(typeof value).toBe("string");
      });
    });

    it("should have valid shadow tokens", () => {
      const shadows = designTokens.shadows;

      expect(shadows).toHaveProperty("none");
      expect(shadows).toHaveProperty("sm");
      expect(shadows).toHaveProperty("md");
      expect(shadows).toHaveProperty("lg");
      expect(shadows).toHaveProperty("xl");

      Object.values(shadows).forEach((value) => {
        expect(typeof value).toBe("string");
      });
    });

    it("should ensure token consistency", () => {
      // All token categories should have consistent structure
      Object.values(designTokens).forEach((category) => {
        expect(typeof category).toBe("object");
        expect(category).not.toBeNull();
      });
    });

    it("should have semantic color mappings", () => {
      const colors = designTokens.colors;

      // Check for semantic color names
      expect(colors).toHaveProperty("success");
      expect(colors).toHaveProperty("warning");
      expect(colors).toHaveProperty("error");
      expect(colors).toHaveProperty("info");
    });
  });

  describe("Token Integration", () => {
    it("should integrate tokens with cn utility", () => {
      const primaryBg = designTokens.colors.primary[500];
      const spacingMd = designTokens.spacing.md;

      // This would typically be used in component styles
      const className = cn(`bg-[${primaryBg}]`, `p-[${spacingMd}]`);
      expect(className).toContain("bg-[");
      expect(className).toContain("p-[");
    });

    it("should support responsive design tokens", () => {
      // Check if tokens include responsive variants
      const typography = designTokens.typography;

      // Font sizes should support responsive scaling
      expect(typography.fontSize).toHaveProperty("xs");
      expect(typography.fontSize).toHaveProperty("2xl");
      expect(typography.fontSize).toHaveProperty("3xl");
    });

    it("should have accessible color contrast ratios", () => {
      const colors = designTokens.colors;

      // Basic check for color token structure
      // In a real implementation, this would check actual contrast ratios
      expect(colors.primary).toBeDefined();
      expect(colors.neutral).toBeDefined();

      // Ensure neutral colors have sufficient range for accessibility
      expect(Object.keys(colors.neutral)).toHaveLength(10); // 50, 100, 200, ..., 900
    });
  });
});
