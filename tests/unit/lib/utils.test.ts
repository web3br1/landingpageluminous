// Unit Tests for Utils - Fase 2 Implementation
// Tests utility functions with comprehensive coverage
// Target: 8+ test cases covering all utility functions

import { describe, it, expect } from "vitest";
import { cn, isValidDateString, contrastOk, designTokens } from "@/lib/utils";

describe("cn (className utility)", () => {
  describe("basic functionality", () => {
    it("should merge class names correctly", () => {
      // Act
      const result = cn("class1", "class2");

      // Assert
      expect(result).toBe("class1 class2");
    });

    it("should handle undefined and null values", () => {
      // Act
      const result = cn("class1", undefined, null, "class2");

      // Assert
      expect(result).toBe("class1 class2");
    });

    it("should handle conditional classes", () => {
      // Arrange
      const isActive = true;
      const isDisabled = false;

      // Act
      const result = cn(
        "base-class",
        isActive && "active",
        isDisabled && "disabled",
        "final-class",
      );

      // Assert
      expect(result).toBe("base-class active final-class");
    });

    it("should handle array inputs", () => {
      // Act
      const result = cn(["class1", "class2"], ["class3"]);

      // Assert
      expect(result).toBe("class1 class2 class3");
    });
  });

  describe("important classes (! prefix)", () => {
    it("should prioritize important classes over regular ones", () => {
      // Act
      const result = cn("text-sm", "!text-lg", "text-md");

      // Assert
      expect(result).toBe("!text-lg");
    });

    it("should merge multiple important classes", () => {
      // Act
      const result = cn("!text-sm", "!font-bold", "!text-lg");

      // Assert
      expect(result).toBe("!text-sm !font-bold !text-lg");
    });

    it("should ignore regular classes when important ones exist", () => {
      // Act
      const result = cn("text-sm", "font-normal", "!text-lg", "!font-bold");

      // Assert
      expect(result).toBe("!text-lg !font-bold");
    });
  });

  describe("tailwind merge behavior", () => {
    it("should handle conflicting Tailwind classes", () => {
      // Act
      const result = cn("text-sm", "text-lg");

      // Assert
      expect(result).toBe("text-lg"); // text-lg should win
    });

    it("should preserve responsive classes", () => {
      // Act
      const result = cn("text-sm", "md:text-lg", "lg:text-xl");

      // Assert
      expect(result).toBe("text-sm md:text-lg lg:text-xl");
    });

    it("should handle hover and focus states", () => {
      // Act
      const result = cn("hover:text-blue-500", "focus:text-red-500");

      // Assert
      expect(result).toBe("hover:text-blue-500 focus:text-red-500");
    });
  });

  describe("edge cases", () => {
    it("should handle empty inputs", () => {
      // Act
      const result = cn();

      // Assert
      expect(result).toBe("");
    });

    it("should handle falsy values", () => {
      // Act
      const result = cn("class1", false, "", 0, "class2");

      // Assert
      expect(result).toBe("class1 class2");
    });

    it("should handle object inputs", () => {
      // Act
      const result = cn({ class1: true, class2: false }, "class3");

      // Assert
      expect(result).toBe("class1 class3");
    });
  });
});

describe("isValidDateString", () => {
  describe("ISO 8601 date validation", () => {
    it("should validate YYYY-MM-DD format", () => {
      // Act & Assert
      expect(isValidDateString("2023-12-25")).toBe(true);
      expect(isValidDateString("2024-02-29")).toBe(true); // Valid leap year
      expect(isValidDateString("2023-13-01")).toBe(false); // Invalid month
      expect(isValidDateString("2023-02-30")).toBe(false); // Invalid day
    });

    it("should validate ISO 8601 datetime format", () => {
      // Act & Assert
      expect(isValidDateString("2023-12-25T10:30:00Z")).toBe(true);
      expect(isValidDateString("2023-12-25T10:30:00.123Z")).toBe(true);
      expect(isValidDateString("2023-12-25T25:00:00Z")).toBe(false); // Invalid hour
    });

    it("should validate datetime without timezone", () => {
      // Act & Assert
      expect(isValidDateString("2023-12-25T10:30:00")).toBe(true);
      expect(isValidDateString("2023-12-25T10:30:00.123")).toBe(true);
    });
  });

  describe("input validation", () => {
    it("should reject non-string inputs", () => {
      // Act & Assert
      expect(isValidDateString(null as any)).toBe(false);
      expect(isValidDateString(undefined as any)).toBe(false);
      expect(isValidDateString(123 as any)).toBe(false);
      expect(isValidDateString({} as any)).toBe(false);
    });

    it("should reject empty strings", () => {
      // Act & Assert
      expect(isValidDateString("")).toBe(false);
      expect(isValidDateString("   ")).toBe(false);
    });

    it("should reject malformed date strings", () => {
      // Act & Assert
      expect(isValidDateString("not-a-date")).toBe(false);
      expect(isValidDateString("2023/12/25")).toBe(false);
      expect(isValidDateString("25-12-2023")).toBe(false);
      expect(isValidDateString("December 25, 2023")).toBe(false);
    });

    it("should reject invalid regex matches", () => {
      // Act & Assert
      expect(isValidDateString("2023-99-99")).toBe(false); // Valid regex but invalid date
      expect(isValidDateString("2023-12-32")).toBe(false); // Valid regex but invalid day
    });
  });
});

describe("contrastOk", () => {
  it("should return true for any color combination (simplified implementation)", () => {
    // Act & Assert
    expect(contrastOk("#000000", "#ffffff")).toBe(true);
    expect(contrastOk("#ff0000", "#00ff00")).toBe(true);
    expect(contrastOk("invalid", "colors")).toBe(true);
  });

  it("should handle edge cases gracefully", () => {
    // Act & Assert
    expect(contrastOk("", "")).toBe(true);
    expect(contrastOk(null as any, undefined as any)).toBe(true);
  });
});

describe("designTokens re-export", () => {
  it("should re-export designTokens from design-system", () => {
    // Act & Assert
    expect(designTokens).toBeDefined();
    expect(typeof designTokens).toBe("object");
  });

  it("should contain expected token structure", () => {
    // Act & Assert
    expect(designTokens).toHaveProperty("colors");
    expect(designTokens).toHaveProperty("typography");
    expect(designTokens).toHaveProperty("spacing");
  });
});

describe("utility function integration", () => {
  it("should work together seamlessly", () => {
    // Arrange
    const baseClasses = "base-class";
    const conditionalClasses = true ? "active" : "inactive";
    const importantOverride = "!important-override";

    // Act
    const result = cn(baseClasses, conditionalClasses, importantOverride);

    // Assert
    expect(result).toBe("!important-override");
  });

  it("should handle complex class combinations", () => {
    // Act
    const result = cn(
      "text-sm",
      "md:text-base",
      "lg:text-lg",
      "hover:text-blue-500",
      "focus:outline-none",
      "focus:ring-2",
      "!text-xl",
    );

    // Assert
    expect(result).toBe("!text-xl");
  });
});

describe("performance characteristics", () => {
  it("should handle large numbers of classes efficiently", () => {
    // Arrange
    const classes = Array.from({ length: 100 }, (_, i) => `class-${i}`);

    // Act
    const startTime = performance.now();
    const result = cn(...classes);
    const endTime = performance.now();

    // Assert
    expect(result.split(" ").length).toBe(100);
    expect(endTime - startTime).toBeLessThan(10); // Should be fast
  });

  it("should handle deep object merging", () => {
    // Arrange
    const complexInput = {
      class1: true,
      class2: false,
      class3: true,
      nested: {
        class4: true,
      },
    };

    // Act
    const result = cn(complexInput, "additional-class");

    // Assert
    expect(result).toContain("class1");
    expect(result).toContain("class3");
    expect(result).toContain("additional-class");
    expect(result).not.toContain("class2");
  });
});
