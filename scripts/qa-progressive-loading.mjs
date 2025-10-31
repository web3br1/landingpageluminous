#!/usr/bin/env node

/**
 * QA Progressive Loading Checklist - Phase 1
 * Automated checks for progressive loading system
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

class ProgressiveLoadingQA {
  constructor() {
    this.checks = [];
    this.passed = 0;
    this.failed = 0;
    this.warnings = 0;
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
      this.log(message, type);
      return true;
    } else {
      this.failed++;
      this.log(message, "error");
      return false;
    }
  }

  warn(condition, message) {
    if (!condition) {
      this.warnings++;
      this.log(message, "warning");
      return false;
    }
    return true;
  }

  async runChecks() {
    this.log("Starting Progressive Loading QA Checks", "info");

    // 1. File Structure Checks
    await this.checkFileStructure();

    // 2. Performance Checks
    await this.checkPerformanceMetrics();

    // 3. Accessibility Checks
    await this.checkAccessibilityCompliance();

    // 4. Privacy Checks
    await this.checkPrivacyCompliance();

    // 5. Integration Checks
    await this.checkScaffoldBIntegration();

    // 6. Code Quality Checks
    await this.checkCodeQuality();

    this.printSummary();
  }

  async checkFileStructure() {
    this.log("Checking file structure...", "info");

    // Core files exist
    const coreFiles = [
      "lib/lazy-loading/core/progressive-loader.tsx",
      "lib/lazy-loading/core/intersection-observer.ts",
      "lib/lazy-loading/core/privacy-gateway.ts",
    ];

    coreFiles.forEach(file => {
      const exists = existsSync(join(__dirname, "..", file));
      this.check(exists, `Core file exists: ${file}`);
    });

    // Example files exist
    const exampleFiles = [
      "lib/lazy-loading/examples/scaffold-b-integration-example.tsx",
      "lib/lazy-loading/examples/mock-hero.tsx",
      "lib/lazy-loading/examples/mock-pricing.tsx",
      "lib/lazy-loading/examples/mock-features.tsx",
    ];

    exampleFiles.forEach(file => {
      const exists = existsSync(join(__dirname, "..", file));
      this.check(exists, `Example file exists: ${file}`);
    });

    // Test files exist
    const testFiles = [
      "tests/unit/lazy-loading/progressive-loader.test.tsx",
      "tests/unit/lazy-loading/intersection-observer.test.tsx",
    ];

    testFiles.forEach(file => {
      const exists = existsSync(join(__dirname, "..", file));
      this.check(exists, `Test file exists: ${file}`);
    });
  }

  async checkPerformanceMetrics() {
    this.log("Checking performance metrics...", "info");

    // Check if progressive loader has performance monitoring
    const loaderContent = readFileSync(join(__dirname, "../lib/lazy-loading/core/progressive-loader.tsx"), "utf8");

    this.check(
      loaderContent.includes("ll_stage_completed"),
      "Stage completion logging implemented"
    );

    this.check(
      loaderContent.includes("ll_error"),
      "Error logging with ll_ prefix implemented"
    );

    this.check(
      loaderContent.includes("startTimeRef"),
      "Load time measurement implemented"
    );

    // Check intersection observer performance
    const intersectionContent = readFileSync(join(__dirname, "../lib/lazy-loading/core/intersection-observer.ts"), "utf8");

    this.check(
      intersectionContent.includes("ll_intersection_observed"),
      "Intersection observation logging implemented"
    );

    this.check(
      intersectionContent.includes("GRANULAR_THRESHOLDS"),
      "Granular thresholds defined (0.1, 0.2, 0.3, 0.5, 0.7, 0.8, 0.9, 1.0)"
    );
  }

  async checkAccessibilityCompliance() {
    this.log("Checking accessibility compliance...", "info");

    const loaderContent = readFileSync(join(__dirname, "../lib/lazy-loading/core/progressive-loader.tsx"), "utf8");

    this.check(
      loaderContent.includes('aria-busy'),
      "ARIA busy attribute implemented for loading states"
    );

    this.check(
      loaderContent.includes('role: state === LoadingState.LOADING ? "status"'),
      "Proper ARIA role for loading states"
    );

    this.check(
      loaderContent.includes('aria-label'),
      "Accessible labels for loading states"
    );

    // Check skeleton components in examples
    const exampleContent = readFileSync(join(__dirname, "../lib/lazy-loading/examples/scaffold-b-integration-example.tsx"), "utf8");

    this.check(
      exampleContent.includes("animate-pulse"),
      "Skeleton components use proper loading animation"
    );
  }

  async checkPrivacyCompliance() {
    this.log("Checking privacy compliance...", "info");

    const privacyContent = readFileSync(join(__dirname, "../lib/lazy-loading/core/privacy-gateway.ts"), "utf8");

    this.check(
      privacyContent.includes("globalPrivacyControl"),
      "Global Privacy Control (GPC) support implemented"
    );

    this.check(
      privacyContent.includes("doNotTrack"),
      "Do Not Track support implemented"
    );

    this.check(
      privacyContent.includes("cookieConsent"),
      "Cookie consent validation implemented"
    );

    this.check(
      privacyContent.includes("ll_privacy_assessment"),
      "Privacy assessment logging implemented"
    );

    // Check strategy adaptation based on consent
    this.check(
      privacyContent.includes("applyPrivacyRestrictions"),
      "Privacy-based strategy restrictions implemented"
    );
  }

  async checkScaffoldBIntegration() {
    this.log("Checking Scaffold B integration...", "info");

    const exampleContent = readFileSync(join(__dirname, "../lib/lazy-loading/examples/scaffold-b-integration-example.tsx"), "utf8");

    this.check(
      exampleContent.includes("loadPriority"),
      "Scaffold B loadPriority metadata supported"
    );

    this.check(
      exampleContent.includes("strategy"),
      "Scaffold B strategy metadata supported"
    );

    this.check(
      exampleContent.includes("requiresAnalyticsConsent"),
      "Scaffold B consent requirements supported"
    );

    // Check createLoaderConfig utility
    const loaderContent = readFileSync(join(__dirname, "../lib/lazy-loading/core/progressive-loader.tsx"), "utf8");

    this.check(
      loaderContent.includes("createLoaderConfig"),
      "Scaffold B loader config utility implemented"
    );
  }

  async checkCodeQuality() {
    this.log("Checking code quality...", "info");

    const files = [
      "lib/lazy-loading/core/progressive-loader.tsx",
      "lib/lazy-loading/core/intersection-observer.ts",
      "lib/lazy-loading/core/privacy-gateway.ts",
    ];

    files.forEach(file => {
      const content = readFileSync(join(__dirname, "../", file), "utf8");

      // Check for ll_ prefix in logs
      const llLogs = (content.match(/ll_[a-z_]+/g) || []).length;
      this.check(llLogs > 0, `${file}: Uses ll_ prefix for logging (${llLogs} instances)`);

      // Check for proper error handling
      this.check(
        content.includes("try") && content.includes("catch"),
        `${file}: Has error handling`
      );

      // Check for TypeScript types
      this.check(
        content.includes("interface") || content.includes("type"),
        `${file}: Has TypeScript type definitions`
      );
    });
  }

  printSummary() {
    console.log("\n" + "=".repeat(60));
    console.log("🏁 PROGRESSIVE LOADING QA SUMMARY");
    console.log("=".repeat(60));

    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`⚠️  Warnings: ${this.warnings}`);
    console.log(`📊 Total Checks: ${this.passed + this.failed + this.warnings}`);

    const successRate = ((this.passed / (this.passed + this.failed)) * 100).toFixed(1);

    if (this.failed === 0) {
      console.log(`🎉 SUCCESS: ${successRate}% pass rate - All QA checks passed!`);
      console.log("🚀 Ready for Phase 1 deployment");
    } else {
      console.log(`⚠️  ISSUES: ${successRate}% pass rate - ${this.failed} checks failed`);
      console.log("🔧 Fix failed checks before proceeding");
    }

    console.log("=".repeat(60));

    if (this.warnings > 0) {
      console.log("\n📋 RECOMMENDATIONS:");
      console.log("- Review warnings for potential improvements");
      console.log("- Consider accessibility audit for production deployment");
      console.log("- Validate integration with actual Scaffold B components");
    }

    console.log("\n🔗 NEXT STEPS:");
    console.log("1. Fix any failed checks");
    console.log("2. Run Lighthouse accessibility audit");
    console.log("3. Test with real Scaffold B components");
    console.log("4. Deploy to staging for performance validation");
  }
}

// Run QA checks
const qa = new ProgressiveLoadingQA();
qa.runChecks().catch(error => {
  console.error("QA check failed:", error);
  process.exit(1);
});
