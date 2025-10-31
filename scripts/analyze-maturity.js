#!/usr/bin/env node

/**
 * Maturity Analysis Script
 *
 * Analyzes test results and coverage to determine project maturity level.
 * Used for CI/CD quality gates and development insights.
 *
 * Levels:
 * - M0: Infrastructure Unstable (build issues, < 50% coverage)
 * - M1: Basic Testing (< 70% coverage, basic test discovery)
 * - M2: Structured Testing (70-80% coverage, good test organization)
 * - M3: Quality Assurance (80%+ coverage, comprehensive testing)
 */

const fs = require("fs");
const path = require("path");

class MaturityAnalyzer {
  constructor(options = {}) {
    this.coveragePath = path.join(
      process.cwd(),
      "tmp",
      "coverage",
      "coverage-summary.json",
    );
    this.testResultsPath = path.join(process.cwd(), "test-results.json");
    this.options = {
      minPassrate: 90,
      minStatements: 65,
      requireE2e: 1,
      minMutation: 0,
      target: "M1",
      ...options,
    };
  }

  /**
   * Analyze project maturity based on coverage and test results
   */
  async analyze() {
    console.log("🔍 Analyzing project maturity...\n");

    try {
      // Load coverage data
      const coverageData = this.loadCoverageData();
      const testResults = this.loadTestResults();

      // Calculate metrics
      const metrics = this.calculateMetrics(coverageData, testResults);

      // Determine maturity level
      const maturity = this.determineMaturityLevel(metrics);

      // Display results
      this.displayResults(metrics, maturity);

      // Exit with appropriate code
      const exitCode = maturity.level === "M0" ? 1 : 0;
      process.exit(exitCode);
    } catch (error) {
      console.error("❌ Maturity analysis failed:", error.message);
      console.log("\n📊 Defaulting to M0 (Infrastructure Unstable)");
      console.log("Reason: Analysis failed due to missing data or errors\n");
      process.exit(1);
    }
  }

  /**
   * Load coverage summary data
   */
  loadCoverageData() {
    if (!fs.existsSync(this.coveragePath)) {
      console.warn("⚠️  Coverage data not found, using defaults");
      return this.getDefaultCoverageData();
    }

    const data = JSON.parse(fs.readFileSync(this.coveragePath, "utf8"));
    return data;
  }

  /**
   * Load test results data
   */
  loadTestResults() {
    if (!fs.existsSync(this.testResultsPath)) {
      console.warn("⚠️  Test results not found, using defaults");
      return this.getDefaultTestResults();
    }

    const data = JSON.parse(fs.readFileSync(this.testResultsPath, "utf8"));
    return data;
  }

  /**
   * Calculate maturity metrics
   */
  calculateMetrics(coverageData, testResults) {
    const total = coverageData.total || {};
    const lines = total.lines?.pct || 0;
    const functions = total.functions?.pct || 0;
    const branches = total.branches?.pct || 0;
    const statements = total.statements?.pct || 0;

    // Average coverage
    const avgCoverage = (lines + functions + branches + statements) / 4;

    // Test metrics (simplified)
    const testCount = testResults.numTotalTests || 0;
    const testPassRate = testResults.numPassedTests
      ? (testResults.numPassedTests / testResults.numTotalTests) * 100
      : 0;

    return {
      coverage: {
        lines,
        functions,
        branches,
        statements,
        average: avgCoverage,
      },
      tests: {
        total: testCount,
        passRate: testPassRate,
      },
      overall: {
        score: (avgCoverage + testPassRate) / 2,
      },
    };
  }

  /**
   * Determine maturity level based on metrics
   */
  determineMaturityLevel(metrics) {
    const { coverage, tests, overall } = metrics;
    const opts = this.options;

    // M0: Infrastructure Unstable
    if (
      coverage.average < opts.minStatements ||
      tests.total < opts.requireE2e
    ) {
      return {
        level: "M0",
        name: "Infrastructure Unstable",
        description: "Build issues, low coverage, basic testing",
        thresholds: {
          minCoverage: opts.minStatements,
          minTests: opts.requireE2e,
          minScore: opts.minPassrate,
        },
        status: "critical",
      };
    }

    // M1: Basic Testing
    if (
      coverage.average < opts.minStatements ||
      overall.score < opts.minPassrate
    ) {
      return {
        level: "M1",
        name: "Basic Testing",
        description: "Basic test coverage and structure",
        thresholds: {
          minCoverage: opts.minStatements,
          minScore: opts.minPassrate,
        },
        status: "warning",
      };
    }

    // M2: Integration Complete
    if (coverage.average < 70 || overall.score < 75) {
      return {
        level: "M2",
        name: "Integration Complete",
        description: "Integration testing, 70%+ coverage, quality gates",
        thresholds: {
          minCoverage: 70,
          minScore: 75,
          minMutation: opts.minMutation,
        },
        status: "good",
      };
    }

    // M3: Quality Assurance
    return {
      level: "M3",
      name: "Quality Assurance",
      description: "80%+ coverage, mutation testing, comprehensive QA",
      thresholds: {
        minCoverage: 80,
        minScore: 85,
        minMutation: 40,
      },
      status: "excellent",
    };
  }

  /**
   * Display analysis results
   */
  displayResults(metrics, maturity) {
    console.log(`🏆 MATURITY LEVEL: ${maturity.level} - ${maturity.name}`);
    console.log(`📝 ${maturity.description}\n`);

    console.log("📊 METRICS:");
    console.log(`   Coverage: ${metrics.coverage.average.toFixed(1)}%`);
    console.log(`   Lines: ${metrics.coverage.lines.toFixed(1)}%`);
    console.log(`   Functions: ${metrics.coverage.functions.toFixed(1)}%`);
    console.log(`   Branches: ${metrics.coverage.branches.toFixed(1)}%`);
    console.log(`   Statements: ${metrics.coverage.statements.toFixed(1)}%`);
    console.log(
      `   Tests: ${metrics.tests.total} (${metrics.tests.passRate.toFixed(1)}% pass rate)`,
    );
    console.log(`   Overall Score: ${metrics.overall.score.toFixed(1)}%\n`);

    // Recommendations
    this.displayRecommendations(maturity);

    // Status indicator
    const statusIcon = {
      critical: "❌",
      warning: "⚠️",
      good: "✅",
      excellent: "🏆",
    };

    console.log(
      `${statusIcon[maturity.status]} STATUS: ${maturity.status.toUpperCase()}`,
    );
  }

  /**
   * Display improvement recommendations
   */
  displayRecommendations(maturity) {
    console.log("💡 RECOMMENDATIONS:");

    switch (maturity.level) {
      case "M0":
        console.log("   • Fix build issues and TypeScript errors");
        console.log("   • Implement basic unit tests for core functionality");
        console.log("   • Set up CI/CD pipeline with quality gates");
        break;

      case "M1":
        console.log("   • Increase test coverage to 70%+");
        console.log("   • Add integration and component tests");
        console.log("   • Implement test automation and CI quality gates");
        break;

      case "M2":
        console.log("   • Reach 80%+ code coverage");
        console.log("   • Add comprehensive E2E testing");
        console.log("   • Implement performance and accessibility testing");
        break;

      case "M3":
        console.log("   • Maintain high coverage and test quality");
        console.log("   • Add mutation testing and property-based testing");
        console.log("   • Implement advanced quality metrics and monitoring");
        break;
    }
    console.log("");
  }

  /**
   * Get default coverage data when file is missing
   */
  getDefaultCoverageData() {
    return {
      total: {
        lines: { pct: 0 },
        functions: { pct: 0 },
        branches: { pct: 0 },
        statements: { pct: 0 },
      },
    };
  }

  /**
   * Get default test results when file is missing
   */
  getDefaultTestResults() {
    return {
      numTotalTests: 0,
      numPassedTests: 0,
      numFailedTests: 0,
    };
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace("--", "");
    const value = args[i + 1];

    switch (key) {
      case "min-passrate":
        options.minPassrate = parseFloat(value);
        break;
      case "min-statements":
        options.minStatements = parseFloat(value);
        break;
      case "require-e2e":
        options.requireE2e = parseInt(value);
        break;
      case "min-mutation":
        options.minMutation = parseFloat(value);
        break;
      case "target":
        options.target = value;
        break;
    }
  }

  return options;
}

// Run analysis if called directly
if (require.main === module) {
  const options = parseArgs();
  const analyzer = new MaturityAnalyzer(options);
  analyzer.analyze().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

module.exports = MaturityAnalyzer;
