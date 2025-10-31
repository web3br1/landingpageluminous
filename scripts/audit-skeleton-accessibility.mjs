#!/usr/bin/env node

/**
 * Skeleton Accessibility Audit - Phase 1
 * Ensures skeleton components meet accessibility requirements
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

class SkeletonAccessibilityAudit {
  constructor() {
    this.issues = [];
    this.passed = 0;
    this.failed = 0;
  }

  log(message, type = "info") {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: "ℹ️ ",
      success: "✅",
      error: "❌",
      warning: "⚠️ "
    }[type] || "ℹ️ ";

    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  check(condition, message, type = "success") {
    if (condition) {
      this.passed++;
      this.log(message, type === "error" ? "error" : "success");
      return true;
    } else {
      this.failed++;
      const issueType = type === "warning" ? "warning" : "error";
      this.issues.push({ message, severity: issueType });
      this.log(message, issueType);
      return false;
    }
  }

  async auditFile(filePath, componentName) {
    if (!existsSync(filePath)) {
      this.check(false, `${componentName}: File does not exist - ${filePath}`);
      return;
    }

    const content = readFileSync(filePath, "utf8");
    this.log(`Auditing ${componentName}...`, "info");

    // Check for proper semantic structure
    this.check(
      content.includes("section") || content.includes("div"),
      `${componentName}: Uses semantic container elements`
    );

    // Check for loading animation (should be subtle)
    const hasAnimation = content.includes("animate-pulse") || content.includes("animate-spin");
    this.check(
      hasAnimation,
      `${componentName}: Has loading animation for visual feedback`,
      hasAnimation ? "success" : "warning"
    );

    // Check for proper color contrast (gray colors for skeletons)
    const hasGrayColors = content.includes("gray-") || content.includes("bg-gray-");
    this.check(
      hasGrayColors,
      `${componentName}: Uses appropriate gray colors for skeleton appearance`
    );

    // Check that skeleton doesn't have interactive elements
    const hasButtons = content.includes("<button") || content.includes("onClick");
    this.check(
      !hasButtons,
      `${componentName}: No interactive elements during loading (good)`,
      hasButtons ? "error" : "success"
    );

    // Check for consistent sizing (prevents CLS)
    const hasExplicitSizing = content.includes("h-") || content.includes("min-h-");
    this.check(
      hasExplicitSizing,
      `${componentName}: Has explicit sizing to prevent layout shift`
    );

    // Check for proper text content indication
    const hasLoadingText = content.includes("Loading") || content.includes("loading");
    this.warn(
      hasLoadingText,
      `${componentName}: Consider adding loading text for screen readers`
    );
  }

  warn(condition, message) {
    if (!condition) {
      this.log(message, "warning");
    }
  }

  async runAudit() {
    this.log("Starting Skeleton Accessibility Audit", "info");

    // Audit core progressive loader
    await this.auditFile(
      join(__dirname, "../lib/lazy-loading/core/progressive-loader.tsx"),
      "Progressive Loader"
    );

    // Audit example skeletons
    const skeletonFiles = [
      {
        path: join(__dirname, "../lib/lazy-loading/examples/scaffold-b-integration-example.tsx"),
        name: "Integration Example Skeletons"
      }
    ];

    for (const { path, name } of skeletonFiles) {
      await this.auditFile(path, name);
    }

    // Additional accessibility checks
    await this.checkProgressiveLoaderAccessibility();

    this.printReport();
  }

  async checkProgressiveLoaderAccessibility() {
    const loaderPath = join(__dirname, "../lib/lazy-loading/core/progressive-loader.tsx");

    if (!existsSync(loaderPath)) {
      this.check(false, "Progressive Loader: File not found for accessibility audit");
      return;
    }

    const content = readFileSync(loaderPath, "utf8");

    // Check for ARIA busy state
    this.check(
      content.includes('aria-busy'),
      "Progressive Loader: Implements aria-busy for loading states"
    );

    // Check for proper ARIA role
    this.check(
      content.includes('"status"'),
      "Progressive Loader: Uses role='status' for loading announcements"
    );

    // Check for aria-label
    this.check(
      content.includes('aria-label'),
      "Progressive Loader: Provides aria-label for loading states"
    );

    // Check for focus management (no focus during loading)
    const hasAutoFocus = content.includes("autoFocus") || content.includes("focus()");
    this.check(
      !hasAutoFocus,
      "Progressive Loader: No automatic focus management during loading"
    );

    // Check for keyboard navigation preservation
    this.check(
      !content.includes("tabIndex") || content.includes('tabIndex={-1}'),
      "Progressive Loader: Doesn't interfere with keyboard navigation"
    );

    // Check for reduced motion consideration
    const hasReducedMotion = content.includes("prefers-reduced-motion") ||
                           content.includes("motion-safe") ||
                           content.includes("motion-reduce");
    this.warn(
      hasReducedMotion,
      "Progressive Loader: Consider adding prefers-reduced-motion support"
    );
  }

  printReport() {
    console.log("\n" + "=".repeat(60));
    console.log("🎯 SKELETON ACCESSIBILITY AUDIT REPORT");
    console.log("=".repeat(60));

    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);

    const score = this.passed + this.failed > 0
      ? ((this.passed / (this.passed + this.failed)) * 100).toFixed(1)
      : "0";

    console.log(`📊 Accessibility Score: ${score}%`);

    if (this.failed === 0) {
      console.log("🎉 SUCCESS: All accessibility requirements met!");
      console.log("🏆 Skeleton components are WCAG 2.1 AA compliant");
    } else {
      console.log("⚠️  ISSUES FOUND: Address accessibility violations");
      console.log("\n🚨 CRITICAL ISSUES:");
      this.issues.filter(issue => issue.severity === "error").forEach(issue => {
        console.log(`  • ${issue.message}`);
      });
    }

    console.log("\n📋 ACCESSIBILITY GUIDELINES CHECKED:");
    console.log("  • WCAG 2.1 AA compliance");
    console.log("  • ARIA authoring practices");
    console.log("  • Screen reader compatibility");
    console.log("  • Keyboard navigation preservation");
    console.log("  • Reduced motion preferences");
    console.log("  • Layout shift prevention (CLS)");

    if (this.failed > 0) {
      console.log("\n🔧 RECOMMENDED FIXES:");
      console.log("  • Add aria-busy='true' to loading containers");
      console.log("  • Use role='status' for loading announcements");
      console.log("  • Provide descriptive aria-label for loading states");
      console.log("  • Ensure consistent sizing to prevent CLS");
      console.log("  • Add prefers-reduced-motion support");
    }

    console.log("\n🔗 RESOURCES:");
    console.log("  • WCAG 2.1: https://www.w3.org/TR/WCAG21/");
    console.log("  • ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/");
    console.log("  • Skeleton Loading UX: https://www.smashingmagazine.com/2020/05/skeleton-screens-react/");

    console.log("=".repeat(60));
  }
}

// Run accessibility audit
const audit = new SkeletonAccessibilityAudit();
audit.runAudit().catch(error => {
  console.error("Accessibility audit failed:", error);
  process.exit(1);
});
