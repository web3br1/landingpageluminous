import { describe, it, expect } from "vitest";
import {
  getCriticalThemeCSS,
  getAvailableCriticalThemes,
  hasCriticalTokens,
} from "@/lib/theme/critical-css";

describe("Theme Hydration Safety - Core Functions", () => {
  it("should generate deterministic critical CSS based on theme only", () => {
    const liquidGlassCSS = getCriticalThemeCSS("liquid-glass");
    const techBlueprintCSS = getCriticalThemeCSS("tech-blueprint");
    const unknownThemeCSS = getCriticalThemeCSS("unknown-theme");

    // Should be deterministic - same input always produces same output
    expect(getCriticalThemeCSS("liquid-glass")).toBe(liquidGlassCSS);
    expect(getCriticalThemeCSS("tech-blueprint")).toBe(techBlueprintCSS);

    // Should contain expected theme-specific content
    expect(liquidGlassCSS).toContain('data-theme="liquid-glass"');
    expect(liquidGlassCSS).toContain("--background: hsl(210 20% 98%)");
    expect(liquidGlassCSS).toContain("--primary: hsl(258 90% 60%)");

    expect(techBlueprintCSS).toContain('data-theme="tech-blueprint"');
    expect(techBlueprintCSS).toContain("--background: hsl(220 25% 12%)");
    expect(techBlueprintCSS).toContain("--primary: hsl(200 80% 60%)");

    // Unknown theme should fallback to liquid-glass
    expect(unknownThemeCSS).toBe(liquidGlassCSS);

    // Should not contain dynamic content (no window, Date, Math.random, etc.)
    expect(liquidGlassCSS).not.toMatch(/window|Date|Math|random|matchMedia/);
    expect(techBlueprintCSS).not.toMatch(/window|Date|Math|random|matchMedia/);
  });

  it("should prevent FOUC with critical CSS transitions", () => {
    const css = getCriticalThemeCSS("liquid-glass");

    // Should disable transitions during loading
    expect(css).toContain('html[data-theme="liquid-glass"] body {');
    expect(css).toContain("transition: none;");

    // Should re-enable transitions after loading
    expect(css).toContain("html[data-theme]:not([data-loading]) body {");
    expect(css).toContain(
      "transition: background-color 0.2s ease, color 0.2s ease;",
    );
  });

  it("should have available critical themes", () => {
    const themes = getAvailableCriticalThemes();
    expect(themes).toContain("liquid-glass");
    expect(themes).toContain("tech-blueprint");
    expect(themes.length).toBeGreaterThanOrEqual(2);
  });

  it("should check if theme has critical tokens", () => {
    expect(hasCriticalTokens("liquid-glass")).toBe(true);
    expect(hasCriticalTokens("tech-blueprint")).toBe(true);
    expect(hasCriticalTokens("unknown-theme")).toBe(false);
  });

  it("should handle consent management", async () => {
    // Skip if no DOM environment - consent requires localStorage
    if (typeof window === "undefined" || !window.localStorage) return;

    const { hasConsent, setConsent } = await import(
      "../lib/theme/experimentation-engine"
    );

    // Test initial state (no consent)
    expect(hasConsent("analytics")).toBe(false);
    expect(hasConsent("marketing")).toBe(false);

    // Set consent
    setConsent("analytics", true);
    setConsent("marketing", false);

    // Check consent - should work with mocked localStorage
    expect(hasConsent("analytics")).toBe(true);
    expect(hasConsent("marketing")).toBe(false);

    // Test invalid consent type
    expect(hasConsent("invalid")).toBe(false);
  }, 5000); // Reduced timeout for faster test execution

  it("should protect PII with anonymous IDs", async () => {
    const { createAnonymousId, anonymizeContext } = await import(
      "../lib/theme/experimentation-engine"
    );

    // Test anonymous ID creation
    const id1 = createAnonymousId("user123");
    const id2 = createAnonymousId("user123");
    const id3 = createAnonymousId("user456");

    // Same input should produce same output
    expect(id1).toBe(id2);
    // Different inputs should produce different outputs
    expect(id1).not.toBe(id3);

    // Test context anonymization
    const originalContext = {
      userId: "user123",
      email: "user@example.com",
      name: "John Doe",
      age: 30,
      campaign: "black-friday",
    };

    const anonymized = anonymizeContext(originalContext);

    // PII fields should be hashed
    expect(anonymized.userId).not.toBe("user123");
    expect(anonymized.email).not.toBe("user@example.com");
    expect(anonymized.name).not.toBe("John Doe");

    // Non-PII fields should remain unchanged
    expect(anonymized.age).toBe(30);
    expect(anonymized.campaign).toBe("black-friday");
  });

  it("should validate experiment data security", async () => {
    const { validateExperimentData } = await import(
      "../lib/theme/experimentation-engine"
    );

    // Valid data should pass
    const validData = {
      experimentId: "test-experiment",
      variant: "A",
      themeId: "liquid-glass",
      metrics: { clicks: 10, conversions: 2 },
    };
    expect(validateExperimentData(validData)).toBe(true);

    // Invalid data should fail
    const invalidData = {
      experimentId: "test-experiment",
      maliciousField: "bad data",
      variant: "A",
    };
    expect(validateExperimentData(invalidData)).toBe(false);

    // Data with wrong types should fail
    const wrongTypeData = {
      experimentId: "test-experiment",
      variant: "A",
      metrics: "not-an-object",
    };
    expect(validateExperimentData(wrongTypeData)).toBe(false);
  });

  it("should handle performance optimizations", () => {
    // Test that critical CSS includes performance optimizations
    const css = getCriticalThemeCSS("liquid-glass");

    // Should include FOUC prevention
    expect(css).toContain("transition: none;");
    expect(css).toContain("html[data-theme]:not([data-loading]) body");

    // Should have proper CSS structure
    expect(css).toMatch(/^\/\* Critical theme tokens/);
    expect(css).toContain("--background:");
    expect(css).toContain("--foreground:");
  });

  // DOM tests moved to hydration-theme-dom.test.tsx
});
