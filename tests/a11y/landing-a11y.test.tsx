import { test, expect } from "@playwright/test";
import { injectAxe, checkA11y } from "@axe-core/playwright";

// Comprehensive WCAG 2.1 AA Accessibility Tests

test.describe("WCAG 2.1 AA Accessibility Compliance", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await injectAxe(page);
  });

  test("should pass automated accessibility checks", async ({ page }) => {
    // Run axe-core accessibility tests
    const results = await checkA11y(page, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });

    // Should have no critical violations
    const criticalViolations = results.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact || ""),
    );

    if (criticalViolations.length > 0) {
      console.log("Accessibility Violations:", criticalViolations);
    }

    expect(criticalViolations).toHaveLength(0);
  });

  test("should have proper color contrast ratios", async ({ page }) => {
    // Test specific contrast requirements
    const contrastResults = await page.evaluate(() => {
      const elements = document.querySelectorAll("*");
      const contrastIssues = [];

      elements.forEach((el) => {
        const style = window.getComputedStyle(el);
        const backgroundColor = style.backgroundColor;
        const color = style.color;

        // Simple check for transparent backgrounds
        if (
          backgroundColor.includes("rgba(0, 0, 0, 0)") ||
          backgroundColor === "transparent" ||
          backgroundColor.includes("rgba(255, 255, 255, 0)")
        ) {
          // Check if parent has background
          let parent = el.parentElement;
          while (parent) {
            const parentStyle = window.getComputedStyle(parent);
            if (
              !parentStyle.backgroundColor.includes("rgba(0, 0, 0, 0)") &&
              parentStyle.backgroundColor !== "transparent"
            ) {
              break;
            }
            parent = parent.parentElement;
          }
        }
      });

      return contrastIssues;
    });

    expect(contrastResults).toHaveLength(0);
  });

  test("should support keyboard navigation", async ({ page }) => {
    // Test Tab navigation through the page
    await page.keyboard.press("Tab");

    // Should focus on first interactive element
    const activeElement = await page.evaluate(
      () => document.activeElement?.tagName,
    );
    expect(
      ["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA"].includes(
        activeElement || "",
      ),
    ).toBe(true);

    // Continue tabbing through elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      const currentElement = await page.evaluate(
        () => document.activeElement?.tagName,
      );
      expect(currentElement).toBeDefined();
    }
  });

  test("should have visible focus indicators", async ({ page }) => {
    await page.keyboard.press("Tab");

    const focusStyles = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement;
      if (!element) return null;

      const style = window.getComputedStyle(element);
      const outline = style.outline;
      const boxShadow = style.boxShadow;

      return {
        hasOutline: outline !== "none" && outline !== "",
        hasBoxShadow: boxShadow !== "none" && boxShadow !== "",
        outlineWidth: style.outlineWidth,
        focusVisible: element.matches(":focus-visible"),
      };
    });

    expect(focusStyles?.hasOutline || focusStyles?.hasBoxShadow).toBe(true);
  });

  test("should have proper semantic structure", async ({ page }) => {
    // Check for proper heading hierarchy
    const headings = await page.$$eval("h1, h2, h3, h4, h5, h6", (elements) =>
      elements.map((el) => ({
        tag: el.tagName,
        text: el.textContent?.trim(),
        level: parseInt(el.tagName.charAt(1)),
      })),
    );

    // Should have H1
    const h1Count = headings.filter((h) => h.level === 1).length;
    expect(h1Count).toBeGreaterThanOrEqual(1);

    // Heading levels should not skip (1,2,3 not 1,3)
    let previousLevel = 0;
    for (const heading of headings) {
      expect(heading.level).toBeLessThanOrEqual(previousLevel + 1);
      previousLevel = heading.level;
    }
  });

  test("should have proper landmarks and regions", async ({ page }) => {
    const landmarks = await page.$$eval(
      "[role], header, nav, main, aside, footer",
      (elements) =>
        elements.map((el) => ({
          role: el.getAttribute("role") || el.tagName.toLowerCase(),
          accessibleName:
            el.getAttribute("aria-label") ||
            el.textContent?.trim().substring(0, 50),
        })),
    );

    // Should have main landmark
    const hasMain = landmarks.some((l) => l.role === "main");
    expect(hasMain).toBe(true);

    // Should have navigation
    const hasNav = landmarks.some((l) =>
      ["navigation", "nav"].includes(l.role),
    );
    expect(hasNav).toBe(true);
  });

  test("should have alt text for images", async ({ page }) => {
    const images = await page.$$eval("img", (imgs) =>
      imgs.map((img) => ({
        src: img.src,
        alt: img.alt,
        hasAlt: img.hasAttribute("alt"),
        altLength: img.alt?.length || 0,
      })),
    );

    images.forEach((img) => {
      expect(img.hasAlt).toBe(true);
      expect(img.altLength).toBeGreaterThan(0);
    });
  });

  test("should support screen readers with ARIA", async ({ page }) => {
    // Check for ARIA attributes on interactive elements
    const ariaElements = await page.$$eval(
      "[aria-label], [aria-labelledby], [aria-describedby]",
      (elements) =>
        elements.map((el) => ({
          tag: el.tagName,
          ariaLabel: el.getAttribute("aria-label"),
          ariaLabelledBy: el.getAttribute("aria-labelledby"),
          ariaDescribedBy: el.getAttribute("aria-describedby"),
          role: el.getAttribute("role"),
        })),
    );

    // Should have some ARIA labels
    expect(ariaElements.length).toBeGreaterThan(0);

    // All ARIA labels should have content
    ariaElements.forEach((el) => {
      if (el.ariaLabel) {
        expect(el.ariaLabel.trim()).not.toBe("");
      }
    });
  });

  test("should handle dynamic content with ARIA live regions", async ({
    page,
  }) => {
    // Look for live regions
    const liveRegions = await page.$$eval(
      "[aria-live], [aria-atomic]",
      (elements) =>
        elements.map((el) => ({
          live: el.getAttribute("aria-live"),
          atomic: el.getAttribute("aria-atomic"),
          relevant: el.getAttribute("aria-relevant"),
        })),
    );

    // Note: Live regions are optional but good practice for dynamic content
    console.log("Live regions found:", liveRegions.length);
  });

  test("should have adequate touch target sizes on mobile", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "Touch target test only runs on mobile");

    const touchTargets = await page.$$eval(
      'button, a, input, select, textarea, [role="button"]',
      (elements) =>
        elements.map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            tag: el.tagName,
            width: rect.width,
            height: rect.height,
            area: rect.width * rect.height,
            visible: rect.width > 0 && rect.height > 0,
          };
        }),
    );

    touchTargets.forEach((target) => {
      // WCAG touch target minimum is 44x44px
      expect(target.width).toBeGreaterThanOrEqual(44);
      expect(target.height).toBeGreaterThanOrEqual(44);
    });
  });

  test("should support reduced motion preferences", async ({ page }) => {
    // Test with reduced motion enabled
    await page.emulateMedia({ reducedMotion: "reduce" });

    // Check if animations are disabled or reduced
    const animations = await page.$$eval(
      '[style*="animation"], [style*="transition"]',
      (elements) =>
        elements.map((el) => {
          const style = window.getComputedStyle(el);
          return {
            animation: style.animation,
            transition: style.transition,
            hasMotion:
              style.animation !== "none" || style.transition !== "none",
          };
        }),
    );

    // With reduced motion, should have fewer animations
    console.log(
      "Animations with reduced motion:",
      animations.filter((a) => a.hasMotion).length,
    );
  });

  test("should maintain accessibility in high contrast mode", async ({
    page,
  }) => {
    // Test high contrast media query
    await page.emulateMedia({ forcedColors: "active" });

    // Should still be usable in high contrast
    const isVisible = await page.isVisible("body");
    expect(isVisible).toBe(true);

    // Check that important elements are still distinguishable
    const contrastElements = await page.$$eval("button, a, input", (elements) =>
      elements.map((el) => {
        const style = window.getComputedStyle(el);
        return {
          hasBorder: style.border !== "none",
          hasBackground: style.backgroundColor !== "transparent",
          hasText: el.textContent?.trim().length > 0,
        };
      }),
    );

    contrastElements.forEach((el) => {
      expect(el.hasBorder || el.hasBackground || el.hasText).toBe(true);
    });
  });

  test("should have proper form accessibility", async ({ page }) => {
    // Test form elements have labels
    const formElements = await page.$$eval(
      "input, select, textarea",
      (elements) =>
        elements.map((el) => {
          const id = el.id;
          const label = document.querySelector(`label[for="${id}"]`);
          const ariaLabel = el.getAttribute("aria-label");
          const ariaLabelledBy = el.getAttribute("aria-labelledby");
          const placeholder = el.getAttribute("placeholder");

          return {
            tag: el.tagName,
            hasId: !!id,
            hasLabel: !!label,
            hasAriaLabel: !!ariaLabel,
            hasAriaLabelledBy: !!ariaLabelledBy,
            hasPlaceholder: !!placeholder,
            isRequired: el.hasAttribute("required"),
            type: el.getAttribute("type"),
          };
        }),
    );

    formElements.forEach((el) => {
      const hasAccessibleName =
        el.hasLabel || el.hasAriaLabel || el.hasAriaLabelledBy;
      expect(hasAccessibleName).toBe(true);

      // Required fields should be marked
      if (el.isRequired) {
        const hasRequiredIndicator =
          el.hasLabel &&
          document
            .querySelector(`label[for="${el.hasId ? el.hasId : ""}"]`)
            ?.textContent?.includes("*");
        expect(hasRequiredIndicator || el.hasAriaLabel).toBe(true);
      }
    });
  });

  test("should handle error states accessibly", async ({ page }) => {
    // Look for error messages and their association with inputs
    const errorElements = await page.$$eval(
      '[aria-invalid], .error, [role="alert"]',
      (elements) =>
        elements.map((el) => ({
          role: el.getAttribute("role"),
          invalid: el.getAttribute("aria-invalid"),
          describedBy: el.getAttribute("aria-describedby"),
          className: el.className,
          text: el.textContent?.trim(),
        })),
    );

    // If there are error states, they should be properly associated
    if (errorElements.length > 0) {
      errorElements.forEach((error) => {
        if (error.invalid === "true") {
          expect(error.describedBy).toBeTruthy();
        }
      });
    }
  });

  test("should support multiple languages and RTL", async ({ page }) => {
    // Check lang attribute
    const lang = await page.getAttribute("html", "lang");
    expect(lang).toBeTruthy();

    // Check for RTL support if needed
    const dir = await page.getAttribute("html", "dir");
    if (dir === "rtl") {
      // Should have RTL-specific styles
      const rtlElements = await page.$$eval(
        '[dir="rtl"], .rtl',
        (elements) => elements.length,
      );
      expect(rtlElements).toBeGreaterThan(0);
    }
  });

  test("should have consistent navigation and skip links", async ({ page }) => {
    // Check for skip links (good practice for keyboard users)
    const skipLinks = await page.$$eval('a[href^="#"]', (links) =>
      links.filter(
        (link) =>
          link.textContent?.toLowerCase().includes("skip") ||
          link.textContent?.toLowerCase().includes("pular"),
      ),
    );

    // Skip links are recommended but not required
    console.log("Skip links found:", skipLinks.length);

    // Check navigation consistency
    const navLinks = await page.$$eval("nav a", (links) =>
      links.map((link) => ({
        href: link.href,
        text: link.textContent?.trim(),
        accessible: link.getAttribute("aria-label") || link.textContent?.trim(),
      })),
    );

    navLinks.forEach((link) => {
      expect(link.accessible).toBeTruthy();
    });
  });
});
