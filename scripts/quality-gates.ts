#!/usr/bin/env node

/**
 * Quality Gates - CI/CD Quality Enforcement
 *
 * Gates bloqueantes para CI/CD:
 * - Pass rate unit/int ≥ 97%
 * - Statements ≥ 70%
 * - E2E 2 jornadas executadas, 3 runs sem flake
 * - Maturity >= M2 (exit 0 do script)
 *
 * Usage: node scripts/quality-gates.ts [options]
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

interface GateResult {
  name: string;
  passed: boolean;
  value: any;
  threshold: any;
  details?: string;
}

interface QualityGateResults {
  overall: boolean;
  gates: GateResult[];
  summary: {
    passed: number;
    failed: number;
    total: number;
  };
}

class QualityGates {
  private results: QualityGateResults;

  constructor() {
    this.results = {
      overall: false,
      gates: [],
      summary: { passed: 0, failed: 0, total: 0 }
    };
  }

  /**
   * Run all quality gates
   */
  async run(): Promise<QualityGateResults> {
    console.log("🔍 Running Quality Gates...\n");

    // Gate 1: Unit/Integration Pass Rate ≥ 97%
    await this.checkTestPassRate();

    // Gate 2: Coverage Statements ≥ 70%
    await this.checkCoverageStatements();

    // Gate 3: E2E 2 jornadas executadas
    await this.checkE2EJourneys();

    // Gate 4: Maturity Level ≥ M2
    await this.checkMaturityLevel();

    // Calculate summary
    this.calculateSummary();

    // Display results
    this.displayResults();

    return this.results;
  }

  /**
   * Check test pass rate
   */
  private async checkTestPassRate(): Promise<void> {
    try {
      console.log("📊 Checking test pass rate...");

      // Run unit/integration tests
      const testCommand = "npx vitest run --config vitest.config.ts tests/unit/ tests/integration/ --reporter=json";
      const output = execSync(testCommand, { encoding: "utf8" });

      const testResults = JSON.parse(output);
      const { numPassedTests = 0, numTotalTests = 0 } = testResults;

      const passRate = numTotalTests > 0 ? (numPassedTests / numTotalTests) * 100 : 0;
      const threshold = 97;

      const passed = passRate >= threshold;

      this.results.gates.push({
        name: "Test Pass Rate",
        passed,
        value: passRate,
        threshold,
        details: `${numPassedTests}/${numTotalTests} tests passed (${passRate.toFixed(1)}%)`
      });

    } catch (error) {
      this.results.gates.push({
        name: "Test Pass Rate",
        passed: false,
        value: 0,
        threshold: 97,
        details: `Failed to run tests: ${(error as Error).message}`
      });
    }
  }

  /**
   * Check coverage statements
   */
  private async checkCoverageStatements(): Promise<void> {
    try {
      console.log("📈 Checking coverage statements...");

      const coveragePath = path.join(process.cwd(), "tmp", "coverage", "coverage-summary.json");

      if (!fs.existsSync(coveragePath)) {
        // Generate coverage if not exists
        execSync("npx vitest run --config vitest.config.ts --coverage", { stdio: "inherit" });
      }

      if (fs.existsSync(coveragePath)) {
        const coverageData = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
        const statements = coverageData.total?.statements?.pct || 0;
        const threshold = 70;

        const passed = statements >= threshold;

        this.results.gates.push({
          name: "Coverage Statements",
          passed,
          value: statements,
          threshold,
          details: `${statements.toFixed(1)}% statement coverage`
        });
      } else {
        this.results.gates.push({
          name: "Coverage Statements",
          passed: false,
          value: 0,
          threshold: 70,
          details: "Coverage report not found"
        });
      }

    } catch (error) {
      this.results.gates.push({
        name: "Coverage Statements",
        passed: false,
        value: 0,
        threshold: 70,
        details: `Failed to check coverage: ${(error as Error).message}`
      });
    }
  }

  /**
   * Check E2E journeys
   */
  private async checkE2EJourneys(): Promise<void> {
    try {
      console.log("🌐 Checking E2E journeys...");

      // Run E2E tests 3 times to check stability
      const runs = [];
      for (let i = 1; i <= 3; i++) {
        try {
          console.log(`  Running E2E run ${i}/3...`);
          execSync("npm run test:e2e", { stdio: "pipe" });
          runs.push(true);
        } catch (error) {
          runs.push(false);
          console.log(`  E2E run ${i} failed`);
        }
      }

      const successRuns = runs.filter(Boolean).length;
      const totalRuns = runs.length;
      const passed = successRuns === totalRuns && totalRuns >= 2; // At least 2 journeys, all passed

      this.results.gates.push({
        name: "E2E Journeys",
        passed,
        value: successRuns,
        threshold: `${totalRuns} runs`,
        details: `${successRuns}/${totalRuns} E2E runs passed`
      });

    } catch (error) {
      this.results.gates.push({
        name: "E2E Journeys",
        passed: false,
        value: 0,
        threshold: "3 runs",
        details: `Failed to run E2E tests: ${(error as Error).message}`
      });
    }
  }

  /**
   * Check maturity level
   */
  private async checkMaturityLevel(): Promise<void> {
    try {
      console.log("🏆 Checking maturity level...");

      const maturityCommand = "node scripts/analyze-maturity.js --target M2";
      const output = execSync(maturityCommand, { encoding: "utf8" });

      // Parse output to find maturity level
      const lines = output.split("\n");
      const maturityLine = lines.find(line => line.includes("MATURITY LEVEL"));

      if (maturityLine) {
        const match = maturityLine.match(/M(\d+)/);
        if (match) {
          const level = parseInt(match[1]);
          const passed = level >= 2; // M2 or higher

          this.results.gates.push({
            name: "Maturity Level",
            passed,
            value: `M${level}`,
            threshold: "M2",
            details: maturityLine.trim()
          });
          return;
        }
      }

      // Fallback: check exit code
      const passed = output.includes("STATUS: EXCELLENT") || output.includes("STATUS: GOOD");

      this.results.gates.push({
        name: "Maturity Level",
        passed,
        value: "Unknown",
        threshold: "M2",
        details: "Could not parse maturity level from output"
      });

    } catch (error) {
      this.results.gates.push({
        name: "Maturity Level",
        passed: false,
        value: "M0",
        threshold: "M2",
        details: `Failed to check maturity: ${(error as Error).message}`
      });
    }
  }

  /**
   * Calculate summary
   */
  private calculateSummary(): void {
    const passed = this.results.gates.filter(gate => gate.passed).length;
    const failed = this.results.gates.filter(gate => !gate.passed).length;
    const total = this.results.gates.length;

    this.results.summary = { passed, failed, total };
    this.results.overall = failed === 0;
  }

  /**
   * Display results
   */
  private displayResults(): void {
    console.log("\n📋 QUALITY GATES RESULTS");
    console.log("=".repeat(50));

    this.results.gates.forEach(gate => {
      const status = gate.passed ? "✅" : "❌";
      console.log(`${status} ${gate.name}: ${gate.value} / ${gate.threshold}`);
      if (gate.details) {
        console.log(`   ${gate.details}`);
      }
    });

    console.log("\n📊 SUMMARY");
    console.log(`   Passed: ${this.results.summary.passed}`);
    console.log(`   Failed: ${this.results.summary.failed}`);
    console.log(`   Total:  ${this.results.summary.total}`);

    const overallStatus = this.results.overall ? "✅ PASSED" : "❌ FAILED";
    console.log(`\n🏁 OVERALL: ${overallStatus}`);

    if (!this.results.overall) {
      console.log("\n🔧 FAILED GATES:");
      this.results.gates
        .filter(gate => !gate.passed)
        .forEach(gate => {
          console.log(`   - ${gate.name}: ${gate.details}`);
        });
    }
  }

  /**
   * Get results
   */
  getResults(): QualityGateResults {
    return this.results;
  }
}

// CLI interface
if (require.main === module) {
  const gates = new QualityGates();

  gates.run()
    .then(results => {
      process.exit(results.overall ? 0 : 1);
    })
    .catch(error => {
      console.error("Fatal error running quality gates:", error);
      process.exit(1);
    });
}

export { QualityGates, type QualityGateResults, type GateResult };
