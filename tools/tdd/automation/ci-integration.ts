/**
 * CI Integration - Simplified Version
 * Basic quality gates for CI/CD pipelines
 */

import { execSync } from "child_process";

export interface CISimpleConfig {
  environment: "local" | "ci";
  thresholds: {
    maxLintErrors: number;
    maxTestFailures: number;
    maxTypeErrors: number;
  };
}

export class CIIntegration {
  private config: CISimpleConfig;

  constructor(config: CISimpleConfig) {
    this.config = config;
  }

  /**
   * Run basic CI quality checks
   */
  async runQualityChecks(): Promise<{
    passed: boolean;
    results: {
      lint: { errors: number; passed: boolean };
      tests: { failures: number; passed: boolean };
      types: { errors: number; passed: boolean };
    };
  }> {
    console.log("🔍 Running basic quality checks...\n");

    const results = {
      lint: await this.checkLint(),
      tests: await this.checkTests(),
      types: await this.checkTypes(),
    };

    const passed =
      results.lint.passed &&
      results.tests.passed &&
      results.types.passed;

    console.log(`\n${passed ? "✅" : "❌"} Quality checks ${passed ? "PASSED" : "FAILED"}`);

    return { passed, results };
  }

  /**
   * Check linting
   */
  private async checkLint(): Promise<{ errors: number; passed: boolean }> {
    try {
      console.log("🔍 Checking lint...");
      execSync("npm run lint", { stdio: "pipe" });
      console.log("✅ Lint passed");
      return { errors: 0, passed: true };
    } catch (error) {
      const output = error.stdout?.toString() || error.stderr?.toString() || "";
      const errors = (output.match(/error/g) || []).length;

      console.log(`❌ Lint failed: ${errors} errors`);
      return {
        errors,
        passed: errors <= this.config.thresholds.maxLintErrors
      };
    }
  }

  /**
   * Check tests
   */
  private async checkTests(): Promise<{ failures: number; passed: boolean }> {
    try {
      console.log("🧪 Running tests...");
      execSync("npm test", { stdio: "pipe" });
      console.log("✅ Tests passed");
      return { failures: 0, passed: true };
    } catch (error) {
      const output = error.stdout?.toString() || error.stderr?.toString() || "";
      const failures = (output.match(/failed/g) || []).length;

      console.log(`❌ Tests failed: ${failures} failures`);
      return {
        failures,
        passed: failures <= this.config.thresholds.maxTestFailures
      };
    }
  }

  /**
   * Check TypeScript types
   */
  private async checkTypes(): Promise<{ errors: number; passed: boolean }> {
    try {
      console.log("🔧 Checking types...");
      execSync("npx tsc --noEmit", { stdio: "pipe" });
      console.log("✅ Types passed");
      return { errors: 0, passed: true };
    } catch (error) {
      const output = error.stdout?.toString() || error.stderr?.toString() || "";
      const errors = (output.match(/error/g) || []).length;

      console.log(`❌ Types failed: ${errors} errors`);
      return {
        errors,
        passed: errors <= this.config.thresholds.maxTypeErrors
      };
    }
  }

  /**
   * Create default CI config
   */
  static createDefaultConfig(): CISimpleConfig {
    return {
      environment: process.env.CI ? "ci" : "local",
      thresholds: {
        maxLintErrors: 0,
        maxTestFailures: 0,
        maxTypeErrors: 0,
      },
    };
  }
}
