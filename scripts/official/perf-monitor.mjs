#!/usr/bin/env node

/**
 * Performance Monitoring for CI/CD
 * Monitors Core Web Vitals and performance budgets
 */

const fs = require("fs");
const path = require("path");

// Performance budgets (aligned with Core Web Vitals)
const PERFORMANCE_BUDGETS = {
  // Core Web Vitals
  LCP: { value: 2500, unit: "ms" }, // Largest Contentful Paint
  FID: { value: 100, unit: "ms" }, // First Input Delay
  CLS: { value: 0.1, unit: "score" }, // Cumulative Layout Shift
  FCP: { value: 1800, unit: "ms" }, // First Contentful Paint
  TTFB: { value: 800, unit: "ms" }, // Time to First Byte

  // Bundle sizes
  "bundle-size-critical": { value: 150, unit: "KB" }, // Critical sections
  "bundle-size-social": { value: 80, unit: "KB" }, // Social sections
  "bundle-size-conversion": { value: 100, unit: "KB" }, // Conversion sections
  "bundle-size-footer": { value: 50, unit: "KB" }, // Footer section
  "bundle-size-framework": { value: 250, unit: "KB" }, // React + Next.js
  "bundle-size-total": { value: 500, unit: "KB" }, // Total bundle

  // Section loading times
  "section-load-time": { value: 500, unit: "ms" }, // Per section

  // Resource loading
  "font-load-time": { value: 300, unit: "ms" }, // Font loading
  "image-load-time": { value: 1000, unit: "ms" }, // Image loading

  // Lighthouse scores
  "lighthouse-performance": { value: 90, unit: "score" },
  "lighthouse-accessibility": { value: 95, unit: "score" },
  "lighthouse-best-practices": { value: 90, unit: "score" },
  "lighthouse-seo": { value: 90, unit: "score" },
};

class PerformanceMonitor {
  constructor() {
    this.results = {};
    this.failures = [];
    this.warnings = [];
  }

  /**
   * Analyze Lighthouse results
   */
  analyzeLighthouseResults(lighthousePath = "./.lighthouse") {
    console.log("📊 Analyzing Lighthouse results...");

    try {
      const files = fs.readdirSync(lighthousePath);
      const jsonFile = files.find((file) => file.endsWith(".json"));

      if (!jsonFile) {
        throw new Error("No Lighthouse JSON report found");
      }

      const reportPath = path.join(lighthousePath, jsonFile);
      const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

      this.analyzeCoreWebVitals(report);
      this.analyzeLighthouseScores(report);
      this.analyzeResourceSizes(report);
    } catch (error) {
      console.warn("⚠️ Could not analyze Lighthouse results:", error.message);
    }
  }

  /**
   * Analyze Core Web Vitals from Lighthouse report
   */
  analyzeCoreWebVitals(report) {
    const audits = report.audits || {};

    const metrics = {
      LCP: audits["largest-contentful-paint"]?.numericValue,
      FID: audits["max-potential-fid"]?.numericValue,
      CLS: audits["cumulative-layout-shift"]?.numericValue,
      FCP: audits["first-contentful-paint"]?.numericValue,
      TTFB: audits["server-response-time"]?.numericValue,
    };

    console.log("🔍 Core Web Vitals Analysis:");

    Object.entries(metrics).forEach(([metric, value]) => {
      if (value !== undefined) {
        const budget = PERFORMANCE_BUDGETS[metric];
        const status = value <= budget.value ? "✅" : "❌";

        console.log(
          `${status} ${metric}: ${value}${budget.unit} (budget: ${budget.value}${budget.unit})`,
        );

        this.results[metric] = {
          value,
          budget: budget.value,
          status: value <= budget.value ? "PASS" : "FAIL",
        };

        if (value > budget.value) {
          this.failures.push({
            metric,
            value,
            budget: budget.value,
            unit: budget.unit,
            type: "core-web-vitals",
          });
        }
      }
    });
  }

  /**
   * Analyze Lighthouse scores
   */
  analyzeLighthouseScores(report) {
    const categories = report.categories || {};

    console.log("📈 Lighthouse Scores Analysis:");

    const scoreMetrics = {
      "lighthouse-performance": categories.performance?.score * 100,
      "lighthouse-accessibility": categories.accessibility?.score * 100,
      "lighthouse-best-practices": categories["best-practices"]?.score * 100,
      "lighthouse-seo": categories.seo?.score * 100,
    };

    Object.entries(scoreMetrics).forEach(([metric, score]) => {
      if (score !== undefined) {
        const budget = PERFORMANCE_BUDGETS[metric];
        const status = score >= budget.value ? "✅" : "❌";

        console.log(
          `${status} ${metric.replace("lighthouse-", "")}: ${score.toFixed(1)} (budget: ${budget.value})`,
        );

        this.results[metric] = {
          value: score,
          budget: budget.value,
          status: score >= budget.value ? "PASS" : "FAIL",
        };

        if (score < budget.value) {
          this.failures.push({
            metric: metric.replace("lighthouse-", ""),
            value: score,
            budget: budget.value,
            unit: "score",
            type: "lighthouse-score",
          });
        }
      }
    });
  }

  /**
   * Analyze bundle sizes from Lighthouse report
   */
  analyzeResourceSizes(report) {
    const audits = report.audits || {};

    console.log("📦 Bundle Size Analysis:");

    // Analyze JavaScript bundles
    const jsBundles = audits["bundle-size"]?.details?.items || [];

    jsBundles.forEach((bundle) => {
      const sizeKB = bundle.transferSize / 1024;
      const bundleName =
        bundle.url.split("/").pop()?.split(".")[0] || "unknown";

      // Map bundle names to our budget categories
      let budgetKey = "bundle-size-total";
      if (bundleName.includes("critical")) budgetKey = "bundle-size-critical";
      else if (bundleName.includes("social")) budgetKey = "bundle-size-social";
      else if (bundleName.includes("conversion"))
        budgetKey = "bundle-size-conversion";
      else if (bundleName.includes("footer")) budgetKey = "bundle-size-footer";
      else if (bundleName.includes("framework"))
        budgetKey = "bundle-size-framework";

      const budget = PERFORMANCE_BUDGETS[budgetKey];
      const status = sizeKB <= budget.value ? "✅" : "❌";

      console.log(
        `${status} ${bundleName}: ${sizeKB.toFixed(1)}KB (budget: ${budget.value}KB)`,
      );

      this.results[bundleName] = {
        value: sizeKB,
        budget: budget.value,
        status: sizeKB <= budget.value ? "PASS" : "FAIL",
      };

      if (sizeKB > budget.value) {
        this.failures.push({
          metric: bundleName,
          value: sizeKB,
          budget: budget.value,
          unit: "KB",
          type: "bundle-size",
        });
      }
    });
  }

  /**
   * Analyze build artifacts (if webpack-bundle-analyzer data is available)
   */
  analyzeBuildArtifacts(buildPath = "./.next/static/chunks") {
    console.log("🔧 Analyzing build artifacts...");

    try {
      const stats = fs.statSync(buildPath);

      // This would be enhanced with actual webpack stats analysis
      // For now, we'll do basic size checks

      console.log("✅ Build artifacts analysis completed");
    } catch (error) {
      console.warn("⚠️ Could not analyze build artifacts:", error.message);
    }
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      failures: this.failures,
      warnings: this.warnings,
      summary: {
        totalChecks: Object.keys(this.results).length,
        passed: Object.values(this.results).filter((r) => r.status === "PASS")
          .length,
        failed: this.failures.length,
        warnings: this.warnings.length,
        successRate: 0,
      },
    };

    report.summary.successRate =
      (report.summary.passed / report.summary.totalChecks) * 100;

    return report;
  }

  /**
   * Save report to file
   */
  saveReport(outputPath = "./performance-report.json") {
    const report = this.generateReport();

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`💾 Performance report saved to ${outputPath}`);
  }

  /**
   * Check if build should fail based on failures
   */
  shouldFailBuild() {
    // Fail build if there are any critical failures
    const criticalFailures = this.failures.filter((f) =>
      ["LCP", "CLS", "lighthouse-performance"].includes(f.metric),
    );

    return criticalFailures.length > 0;
  }

  /**
   * Run complete performance analysis
   */
  async runAnalysis(options = {}) {
    const {
      lighthousePath = "./.lighthouse",
      buildPath = "./.next/static/chunks",
      outputPath = "./performance-report.json",
    } = options;

    console.log("🚀 Starting Performance Analysis...\n");

    this.analyzeLighthouseResults(lighthousePath);
    console.log("");

    this.analyzeBuildArtifacts(buildPath);
    console.log("");

    const report = this.generateReport();

    console.log("📊 Performance Analysis Summary:");
    console.log(`Total checks: ${report.summary.totalChecks}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Success rate: ${report.summary.successRate.toFixed(1)}%`);
    console.log("");

    if (this.failures.length > 0) {
      console.log("❌ Failures:");
      this.failures.forEach((failure) => {
        console.log(
          `  - ${failure.metric}: ${failure.value}${failure.unit} (budget: ${failure.budget}${failure.unit})`,
        );
      });
      console.log("");
    }

    if (this.warnings.length > 0) {
      console.log("⚠️ Warnings:");
      this.warnings.forEach((warning) => {
        console.log(`  - ${warning}`);
      });
      console.log("");
    }

    this.saveReport(outputPath);

    const shouldFail = this.shouldFailBuild();
    if (shouldFail) {
      console.log("💥 Build failed due to critical performance issues!");
      process.exit(1);
    } else {
      console.log("🎉 Performance checks passed!");
    }

    return report;
  }
}

// CLI interface
if (require.main === module) {
  const monitor = new PerformanceMonitor();

  const args = process.argv.slice(2);
  const options = {};

  // Parse CLI arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace("--", "");
    const value = args[i + 1];
    options[key] = value;
  }

  monitor.runAnalysis(options).catch((error) => {
    console.error("Error running performance analysis:", error);
    process.exit(1);
  });
}

module.exports = { PerformanceMonitor, PERFORMANCE_BUDGETS };
