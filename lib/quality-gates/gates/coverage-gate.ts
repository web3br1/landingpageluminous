/**
 * Test Coverage Quality Gate
 * Ensures test coverage meets minimum requirements
 */

import { execSync } from "child_process";
import { join } from "path";
import { existsSync, readFileSync } from "fs";
import { PRData, GateResult, QualityGate } from "../types";

export const coverageGate: QualityGate = {
  id: "coverage",
  name: "Test Coverage Analysis",
  description: "Analyzes test coverage against minimum thresholds",
  required: true,
  timeout: 300000, // 5 minutes
  category: "testing",

  async run(prData: PRData): Promise<GateResult> {
    const startTime = Date.now();

    try {
      // Check if we're in a Node.js environment with test scripts
      const packageJsonPath = join(process.cwd(), "package.json");
      if (!existsSync(packageJsonPath)) {
        throw new Error("package.json not found");
      }

      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
      const hasCoverageScript =
        packageJson.scripts &&
        (packageJson.scripts["test:coverage"] ||
          packageJson.scripts["test:ci"]);

      if (!hasCoverageScript) {
        console.log("⚠️  Coverage script not found, skipping...");
        return {
          gate: "coverage",
          name: "Test Coverage Analysis",
          success: false,
          duration: Date.now() - startTime,
          error: "Coverage script not configured",
          required: true,
          score: 0,
          threshold: 70,
          details: {
            configured: false,
          },
        };
      }

      // Check if coverage report already exists
      const coveragePath = join(
        process.cwd(),
        "coverage",
        "coverage-summary.json",
      );
      let coverageData: any = null;

      if (!existsSync(coveragePath)) {
        console.log("📊 Generating coverage report...");
        try {
          execSync("pnpm test:coverage", {
            cwd: process.cwd(),
            stdio: "pipe",
            timeout: 240000, // 4 minutes
          });
        } catch (error: any) {
          // Coverage command might fail but still generate partial report
          console.log(
            "⚠️  Coverage command failed, checking for partial report...",
          );
        }
      }

      // Read coverage data
      if (existsSync(coveragePath)) {
        coverageData = JSON.parse(readFileSync(coveragePath, "utf8"));
      } else {
        throw new Error("Coverage report not found after generation attempt");
      }

      // Analyze coverage
      const analysis = analyzeCoverage(coverageData);

      // Check if minimum thresholds are met
      const minThreshold = 70; // 70%
      const meetsThreshold = analysis.overall.lines.pct >= minThreshold;

      if (!meetsThreshold) {
        return {
          gate: "coverage",
          name: "Test Coverage Analysis",
          success: false,
          duration: Date.now() - startTime,
          error: `Coverage ${analysis.overall.lines.pct.toFixed(1)}% below minimum ${minThreshold}%`,
          required: true,
          score: analysis.overall.lines.pct,
          threshold: minThreshold,
          details: {
            ...analysis,
            threshold: minThreshold,
            passed: false,
          },
        };
      }

      // Calculate quality score
      const qualityScore = calculateCoverageQualityScore(analysis);

      return {
        gate: "coverage",
        name: "Test Coverage Analysis",
        success: true,
        duration: Date.now() - startTime,
        required: true,
        score: qualityScore,
        threshold: minThreshold,
        details: {
          ...analysis,
          qualityScore,
          passed: true,
        },
      };
    } catch (error) {
      return {
        gate: "coverage",
        name: "Test Coverage Analysis",
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
        required: true,
        score: 0,
        threshold: 70,
      };
    }
  },
};

function analyzeCoverage(coverageData: any) {
  const total = coverageData.total || {};

  // Calculate coverage by category
  const lines = total.lines || { pct: 0 };
  const functions = total.functions || { pct: 0 };
  const branches = total.branches || { pct: 0 };
  const statements = total.statements || { pct: 0 };

  // Analyze coverage distribution across files
  const files = Object.keys(coverageData).filter((key) => key !== "total");
  const fileCoverages = files.map((file) => ({
    file,
    lines: coverageData[file].lines?.pct || 0,
    functions: coverageData[file].functions?.pct || 0,
    branches: coverageData[file].branches?.pct || 0,
  }));

  // Identify files with low coverage
  const lowCoverageFiles = fileCoverages.filter((f) => f.lines < 50);
  const uncoveredFiles = fileCoverages.filter((f) => f.lines === 0);

  // Calculate coverage quality metrics
  const averageCoverage =
    (lines.pct + functions.pct + branches.pct + statements.pct) / 4;
  const coverageVariance = Math.abs(lines.pct - averageCoverage);

  return {
    overall: {
      lines: lines.pct,
      functions: functions.pct,
      branches: branches.pct,
      statements: statements.pct,
      average: averageCoverage,
    },
    files: {
      total: files.length,
      lowCoverage: lowCoverageFiles.length,
      uncovered: uncoveredFiles.length,
    },
    quality: {
      variance: coverageVariance,
      consistency: 100 - coverageVariance,
    },
    recommendations: generateCoverageRecommendations(
      lines.pct,
      branches.pct,
      lowCoverageFiles.length,
      uncoveredFiles.length,
    ),
  };
}

function calculateCoverageQualityScore(analysis: any): number {
  const { overall, files, quality } = analysis;

  let score = overall.lines; // Base score on line coverage

  // Bonus for high branch coverage (harder to test)
  if (overall.branches > 80) score += 5;
  else if (overall.branches > 70) score += 2;

  // Bonus for function coverage
  if (overall.functions > 85) score += 3;

  // Penalty for low coverage files
  score -= files.lowCoverage * 2;

  // Penalty for uncovered files
  score -= files.uncovered * 5;

  // Bonus for consistent coverage across metrics
  if (quality.consistency > 90) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function generateCoverageRecommendations(
  linesPct: number,
  branchesPct: number,
  lowCoverageFiles: number,
  uncoveredFiles: number,
): string[] {
  const recommendations: string[] = [];

  if (linesPct < 70) {
    recommendations.push(
      "Increase line coverage by adding unit tests for core business logic",
    );
  }

  if (branchesPct < 60) {
    recommendations.push(
      "Improve branch coverage by testing conditional logic and error paths",
    );
  }

  if (lowCoverageFiles > 5) {
    recommendations.push(
      `Address ${lowCoverageFiles} files with low coverage (<50%)`,
    );
  }

  if (uncoveredFiles > 0) {
    recommendations.push(
      `Add tests for ${uncoveredFiles} completely uncovered files`,
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Coverage meets requirements - consider adding integration tests",
    );
  }

  return recommendations;
}
