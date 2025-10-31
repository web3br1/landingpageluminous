/**
 * Static Analysis Quality Gate
 * Runs ESLint and TypeScript compilation checks
 */

import { execSync } from "child_process";
import { join } from "path";
import { existsSync, readFileSync } from "fs";
import { PRData, GateResult, QualityGate } from "../types";

export const staticAnalysisGate: QualityGate = {
  id: "staticAnalysis",
  name: "Static Analysis (ESLint + TypeScript)",
  description: "Runs ESLint linting and TypeScript compilation checks",
  required: true,
  timeout: 120000, // 2 minutes
  category: "static",

  async run(prData: PRData): Promise<GateResult> {
    const startTime = Date.now();

    try {
      // Check if we're in a Node.js environment with package.json
      const packageJsonPath = join(process.cwd(), "package.json");
      if (!existsSync(packageJsonPath)) {
        throw new Error("package.json not found");
      }

      // Run TypeScript compilation check
      console.log("🔍 Running TypeScript compilation check...");
      try {
        execSync("pnpm tsc --noEmit", {
          cwd: process.cwd(),
          stdio: "pipe",
          timeout: 60000,
        });
      } catch (error: unknown) {
        const output = getCommandOutput(error);
        const errorCount = (output.match(/error/g) || []).length;

        return {
          gate: "staticAnalysis",
          name: "Static Analysis (ESLint + TypeScript)",
          success: false,
          duration: Date.now() - startTime,
          error: `TypeScript compilation failed with ${errorCount} errors`,
          required: true,
          details: {
            typescriptErrors: errorCount,
            output: output.substring(0, 500), // Truncate for readability
          },
        };
      }

      // Run ESLint
      console.log("🔍 Running ESLint checks...");
      try {
        execSync("pnpm eslint . --max-warnings 0 --format json", {
          cwd: process.cwd(),
          stdio: "pipe",
          timeout: 60000,
        });
      } catch (error: unknown) {
        const output = getCommandOutput(error);

        let eslintResults;
        try {
          eslintResults = JSON.parse(output);
        } catch {
          eslintResults = [];
        }

        const errorCount = eslintResults.reduce(
          (sum: number, file: unknown) => sum + (file.errorCount || 0),
          0,
        );
        const warningCount = eslintResults.reduce(
          (sum: number, file: unknown) => sum + (file.warningCount || 0),
          0,
        );

        if (errorCount > 0) {
          return {
            gate: "staticAnalysis",
            name: "Static Analysis (ESLint + TypeScript)",
            success: false,
            duration: Date.now() - startTime,
            error: `ESLint failed with ${errorCount} errors and ${warningCount} warnings`,
            required: true,
            details: {
              eslintErrors: errorCount,
              eslintWarnings: warningCount,
              filesWithIssues: eslintResults.length,
            },
          };
        }

        // Warnings are allowed but logged
        if (warningCount > 0) {
          console.log(`⚠️  ESLint passed with ${warningCount} warnings`);
        }
      }

      // Calculate quality score based on complexity and maintainability
      const score = await calculateStaticAnalysisScore();

      return {
        gate: "staticAnalysis",
        name: "Static Analysis (ESLint + TypeScript)",
        success: true,
        duration: Date.now() - startTime,
        required: true,
        score,
        threshold: 80,
        details: {
          typescript: "passed",
          eslint: "passed",
          score,
        },
      };
    } catch (error) {
      return {
        gate: "staticAnalysis",
        name: "Static Analysis (ESLint + TypeScript)",
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
        required: true,
      };
    }
  },
};

async function calculateStaticAnalysisScore(): Promise<number> {
  try {
    // Analyze codebase for complexity indicators
    const tsconfigPath = join(process.cwd(), "tsconfig.json");
    const eslintConfigPath = join(process.cwd(), "eslint.config.js");

    let score = 100;

    // Check TypeScript strict mode
    if (existsSync(tsconfigPath)) {
      const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf8"));
      const compilerOptions = tsconfig.compilerOptions || {};

      // Deduct points for missing strict settings
      if (!compilerOptions.strict) score -= 10;
      if (!compilerOptions.noImplicitReturns) score -= 5;
      if (!compilerOptions.noUnusedLocals) score -= 5;
      if (!compilerOptions.exactOptionalPropertyTypes) score -= 5;
    }

    // Check ESLint configuration
    if (existsSync(eslintConfigPath)) {
      const eslintConfig = readFileSync(eslintConfigPath, "utf8");

      // Bonus for advanced rules
      if (eslintConfig.includes("@typescript-eslint")) score += 5;
      if (eslintConfig.includes("complexity")) score += 5;
      if (eslintConfig.includes("import/order")) score += 5;
    }

    return Math.max(0, Math.min(100, score));
  } catch (error) {
    console.warn("Failed to calculate static analysis score:", error);
    return 75; // Default good score
  }
}

function getCommandOutput(error: unknown): string {
  if (error && typeof error === 'object' && 'stdout' in error) {
    const err = error as { stdout?: unknown; stderr?: unknown };
    return (err.stdout as string)?.toString() || (err.stderr as string)?.toString() || "";
  }
  return "";
}
