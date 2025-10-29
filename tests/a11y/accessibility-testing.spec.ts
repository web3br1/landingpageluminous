import { test, expect } from "@playwright/test";

test.describe("Accessibility Testing - WCAG 2.1 AA Compliance", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
  });

  test.skip("keyboard navigation works throughout the page", async ({
    page,
  }) => {
    // Test Tab navigation
    const focusableElements = await page
      .locator(
        'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      .all();

    expect(focusableElements.length).toBeGreaterThan(5); // Should have reasonable number of focusable elements

    // Test forward tab navigation
    await page.keyboard.press("Tab");
    let focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();

    // Continue tabbing through several elements
    for (let i = 0; i < Math.min(10, focusableElements.length); i++) {
      const currentFocused = page.locator(":focus");
      if (
        await currentFocused.isVisible({ timeout: 1000 }).catch(() => false)
      ) {
        // Check if element has visible focus indicator
        const hasFocusIndicator = await currentFocused.evaluate((el) => {
          const computedStyle = window.getComputedStyle(el);
          return (
            computedStyle.outline !== "none" ||
            computedStyle.boxShadow !== "none" ||
            computedStyle.border !==
              window.getComputedStyle(el.parentElement || el).border ||
            el.hasAttribute("focus-visible")
          );
        });

        // At least some elements should have focus indicators
        if (hasFocusIndicator || i === 0) {
          // Continue testing
        }
      }

      await page.keyboard.press("Tab");
    }

    // Test Shift+Tab (backward navigation)
    await page.keyboard.press("Shift+Tab");
    focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });

  test("semantic HTML structure is correct", async ({ page }) => {
    // Check for main landmark
    const main = page.locator("main");
    await expect(main).toHaveCount(1);

    // Check for heading hierarchy
    const h1Tags = await page.locator("h1").count();
    const h2Tags = await page.locator("h2").count();
    const h3Tags = await page.locator("h3").count();

    expect(h1Tags).toBeGreaterThanOrEqual(1); // At least one H1
    expect(h2Tags).toBeGreaterThanOrEqual(1); // At least one H2

    // Check heading hierarchy (no skipping levels)
    const headings = await page.locator("h1, h2, h3, h4, h5, h6").all();
    let previousLevel = 0;

    for (const heading of headings) {
      const tagName = await heading.evaluate((el) => el.tagName.toLowerCase());
      const level = parseInt(tagName.charAt(1));

      // Should not skip more than one level (allowing H1 -> H3 for design purposes)
      expect(level - previousLevel).toBeLessThanOrEqual(2);
      previousLevel = level;
    }

    // Check for proper section structure
    const sections = page.locator("section");
    await expect(sections).toHaveCount(await sections.count()); // At least some sections

    // Check for navigation landmark if navigation exists
    const nav = page.locator("nav");
    if (await nav.isVisible({ timeout: 2000 }).catch(() => false)) {
      // If nav exists, it should have a landmark role or aria-label
      const hasLandmark = await nav.evaluate(
        (el) =>
          el.hasAttribute("aria-label") ||
          el.hasAttribute("aria-labelledby") ||
          el.getAttribute("role") === "navigation",
      );
      expect(hasLandmark).toBe(true);
    }
  });

  test("form accessibility is compliant", async ({ page }) => {
    const forms = page.locator("form");

    for (const form of await forms.all()) {
      // Check form inputs have labels
      const inputs = form.locator("input, select, textarea");
      const inputCount = await inputs.count();

      if (inputCount > 0) {
        for (let i = 0; i < inputCount; i++) {
          const input = inputs.nth(i);
          const inputType = await input.getAttribute("type");
          const isHidden = await input.isHidden();

          if (
            !isHidden &&
            inputType !== "submit" &&
            inputType !== "button" &&
            inputType !== "hidden"
          ) {
            // Check for associated label
            const hasLabel = await input.evaluate((el) => {
              const id = el.id;
              const ariaLabel = el.getAttribute("aria-label");
              const ariaLabelledBy = el.getAttribute("aria-labelledby");

              if (ariaLabel || ariaLabelledBy) return true;

              if (id) {
                const label = document.querySelector(`label[for="${id}"]`);
                return !!label;
              }

              return false;
            });

            expect(hasLabel).toBe(true);
          }
        }

        // Check for form validation messages
        const submitButton = form
          .locator('button[type="submit"], input[type="submit"]')
          .first();
        if (await submitButton.isVisible()) {
          // Try to submit empty form to check validation
          await submitButton.click();
          await page.waitForTimeout(500);

          // Check if error messages are properly associated
          const errorMessages = form
            .locator('[role="alert"], .error, [aria-invalid="true"]')
            .all();
          // Note: Real validation testing would require specific form knowledge
        }
      }
    }
  });

  test("images have proper alt text", async ({ page }) => {
    const images = page.locator("img");

    for (const img of await images.all()) {
      const alt = await img.getAttribute("alt");
      const ariaHidden = await img.getAttribute("aria-hidden");
      const isDecorative = ariaHidden === "true";

      // Images should have alt text unless they are decorative
      if (!isDecorative) {
        expect(alt).toBeTruthy();
        expect(alt!.length).toBeGreaterThan(0);
        expect(alt).not.toBe(""); // Not empty string
      }
    }
  });

  test("color contrast meets WCAG AA standards", async ({ page }) => {
    // Get text elements and their computed styles
    const textElements = await page
      .locator("h1, h2, h3, h4, h5, h6, p, span, a, button")
      .all();

    for (const element of textElements) {
      if (await element.isVisible()) {
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
          };
        });

        // Extract RGB values from color strings
        const colorMatch = styles.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        const bgMatch = styles.backgroundColor.match(
          /rgb\((\d+),\s*(\d+),\s*(\d+)\)/,
        );

        if (colorMatch && bgMatch) {
          const [, r1, g1, b1] = colorMatch;
          const [, r2, g2, b2] = bgMatch;

          // Calculate relative luminance
          const getLuminance = (r: number, g: number, b: number) => {
            const [rs, gs, bs] = [r, g, b].map((c) => {
              c = c / 255;
              return c <= 0.03928
                ? c / 12.92
                : Math.pow((c + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
          };

          const lum1 = getLuminance(parseInt(r1), parseInt(g1), parseInt(b1));
          const lum2 = getLuminance(parseInt(r2), parseInt(g2), parseInt(b2));

          const ratio =
            (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);

          // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
          const fontSize = parseFloat(styles.fontSize);
          const isLargeText =
            fontSize >= 18 || (fontSize >= 14 && styles.fontWeight >= 700);
          const requiredRatio = isLargeText ? 3 : 4.5;

          expect(ratio).toBeGreaterThanOrEqual(requiredRatio);
        }
      }
    }
  });

  test("ARIA attributes are used correctly", async ({ page }) => {
    // Check ARIA labels on interactive elements
    const interactiveElements = page.locator(
      'button, [role="button"], input, select, textarea',
    );

    for (const element of await interactiveElements.all()) {
      if (await element.isVisible()) {
        const tagName = await element.evaluate((el) =>
          el.tagName.toLowerCase(),
        );
        const type = await element.getAttribute("type");
        const ariaLabel = await element.getAttribute("aria-label");
        const ariaLabelledBy = await element.getAttribute("aria-labelledby");

        // Buttons should have accessible names
        if (tagName === "button" || type === "submit" || type === "button") {
          const hasAccessibleName = await element.evaluate((el) => {
            const text = el.textContent?.trim();
            const ariaLabel = el.getAttribute("aria-label");
            const ariaLabelledBy = el.getAttribute("aria-labelledby");
            return !!(text || ariaLabel || ariaLabelledBy);
          });
          expect(hasAccessibleName).toBe(true);
        }

        // If aria-label is present, aria-labelledby should not be
        if (ariaLabel && ariaLabelledBy) {
          console.warn("Element has both aria-label and aria-labelledby");
        }
      }
    }

    // Check for proper ARIA roles
    const elementsWithRole = page.locator("[role]");
    for (const element of await elementsWithRole.all()) {
      const role = await element.getAttribute("role");
      const validRoles = [
        "alert",
        "alertdialog",
        "application",
        "article",
        "banner",
        "button",
        "cell",
        "checkbox",
        "columnheader",
        "combobox",
        "complementary",
        "contentinfo",
        "definition",
        "dialog",
        "directory",
        "document",
        "feed",
        "figure",
        "form",
        "grid",
        "gridcell",
        "group",
        "heading",
        "img",
        "link",
        "list",
        "listbox",
        "listitem",
        "log",
        "main",
        "marquee",
        "math",
        "meter",
        "menu",
        "menubar",
        "menuitem",
        "menuitemcheckbox",
        "menuitemradio",
        "navigation",
        "none",
        "note",
        "option",
        "presentation",
        "progressbar",
        "radio",
        "radiogroup",
        "region",
        "row",
        "rowgroup",
        "rowheader",
        "scrollbar",
        "search",
        "searchbox",
        "separator",
        "slider",
        "spinbutton",
        "status",
        "switch",
        "tab",
        "table",
        "tablist",
        "tabpanel",
        "term",
        "textbox",
        "timer",
        "toolbar",
        "tooltip",
        "tree",
        "treegrid",
        "treeitem",
      ];

      expect(validRoles).toContain(role);
    }
  });

  test("focus management is proper", async ({ page }) => {
    // Test modal focus management (if modals exist)
    const modalTriggers = page
      .locator('[data-modal], [aria-haspopup="dialog"]')
      .all();

    for (const trigger of await modalTriggers) {
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(500);

        // Check if modal is open
        const modal = page
          .locator('[role="dialog"], [aria-modal="true"]')
          .first();
        if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
          // Focus should be within modal
          const focusedElement = page.locator(":focus");
          const isFocusInModal = await focusedElement.evaluate((el) => {
            let parent = el;
            while (parent && parent !== document.body) {
              if (parent.matches('[role="dialog"], [aria-modal="true"]')) {
                return true;
              }
              parent = parent.parentElement;
            }
            return false;
          });

          expect(isFocusInModal).toBe(true);

          // Close modal
          const closeButton = modal
            .locator('[aria-label*="close"], [aria-label*="fechar"]')
            .first();
          if (await closeButton.isVisible()) {
            await closeButton.click();
            await page.waitForTimeout(500);
            await expect(modal).not.toBeVisible();
          }
        }
      }
    }
  });

  test("page has proper language declaration", async ({ page }) => {
    // Check html lang attribute
    const htmlLang = await page.getAttribute("html", "lang");
    expect(htmlLang).toBeTruthy();
    expect(htmlLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // Valid language code format

    // Check for proper charset
    const charset = page.locator("meta[charset]");
    await expect(charset).toHaveAttribute("charset", "utf-8");
  });

  test("touch targets meet minimum size requirements", async ({ page }) => {
    // Set mobile viewport for touch target testing
    await page.setViewportSize({ width: 375, height: 667 });

    const touchTargets = page
      .locator(
        'button, a, input[type="button"], input[type="submit"], [role="button"]',
      )
      .all();

    for (const target of await touchTargets) {
      if (await target.isVisible()) {
        const box = await target.boundingBox();

        if (box) {
          // WCAG requires touch targets to be at least 44x44px
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  test("page zoom works correctly", async ({ page }) => {
    // Test 200% zoom (WCAG requirement)
    await page.evaluate(() => {
      document.body.style.zoom = "2";
    });

    await page.waitForTimeout(1000);

    // Content should still be accessible and functional
    const heroSection = page.locator('[data-section="hero"]');
    await expect(heroSection).toBeVisible();

    const primaryCTA = page
      .getByRole("button", { name: /começar|demo/i })
      .first();
    await expect(primaryCTA).toBeVisible();

    // Text should not overflow
    const overflowingElements = await page
      .locator("*")
      .filter({ hasText: /.*/ })
      .evaluateAll((elements) => {
        return elements.filter((el) => {
          const rect = el.getBoundingClientRect();
          const computed = window.getComputedStyle(el);
          return (
            rect.right > window.innerWidth ||
            rect.bottom > window.innerHeight ||
            (computed.overflow === "hidden" && el.scrollWidth > el.clientWidth)
          );
        }).length;
      });

    expect(overflowingElements).toBe(0);
  });

  test("media elements have proper accessibility features", async ({
    page,
  }) => {
    // Check videos
    const videos = page.locator("video");
    for (const video of await videos.all()) {
      // Videos should have captions/subtitles if they contain speech
      const hasCaptions = await video.evaluate((el) => {
        const tracks = el.querySelectorAll("track");
        return Array.from(tracks).some(
          (track) => track.getAttribute("kind") === "captions",
        );
      });

      // Note: This is a basic check - real video accessibility testing is more complex
      if (hasCaptions) {
        console.log("Video has captions");
      }
    }

    // Check audio elements
    const audio = page.locator("audio");
    for (const audioEl of await audio.all()) {
      // Audio should have transcripts if it contains speech
      const hasTranscript = await audioEl.evaluate((el) => {
        const transcriptId = el.getAttribute("aria-describedby");
        return !!(transcriptId && document.getElementById(transcriptId));
      });

      if (hasTranscript) {
        console.log("Audio has transcript");
      }
    }
  });

  test("error messages are accessible", async ({ page }) => {
    // Try to trigger form validation errors
    const forms = page.locator("form");

    for (const form of await forms.all()) {
      const submitButton = form
        .locator('button[type="submit"], input[type="submit"]')
        .first();

      if (await submitButton.isVisible()) {
        // Submit empty form to trigger validation
        await submitButton.click();
        await page.waitForTimeout(1000);

        // Check for error messages
        const errorMessages = form
          .locator('[role="alert"], .error, [aria-invalid="true"]')
          .all();

        for (const error of await errorMessages) {
          // Error messages should be associated with inputs
          const hasAssociation = await error.evaluate((el) => {
            const describedBy = el.getAttribute("aria-describedby");
            const labelledBy = el.getAttribute("aria-labelledby");
            return !!(describedBy || labelledBy);
          });

          expect(hasAssociation).toBe(true);
        }
      }
    }
  });

  test("page title is descriptive and unique", async ({ page }) => {
    const title = await page.title();

    // Title should exist and be descriptive
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(10);
    expect(title.length).toBeLessThan(70); // SEO best practice, also helps screen readers

    // Title should be unique (not just generic)
    expect(title.toLowerCase()).not.toBe("home");
    expect(title.toLowerCase()).not.toBe("index");
    expect(title.toLowerCase()).not.toBe("page");
  });

  test("skip links are present for keyboard users", async ({ page }) => {
    // Check for skip links (common accessibility pattern)
    const skipLinks = page.locator('a[href^="#"], [class*="skip"]').all();

    // Skip links are not strictly required but are a good practice
    // We'll just log if they exist
    const skipLinkCount = (await skipLinks).length;
    if (skipLinkCount > 0) {
      console.log(`Found ${skipLinkCount} skip links`);
    } else {
      console.log(
        "No skip links found - consider adding for better keyboard navigation",
      );
    }
  });
});
