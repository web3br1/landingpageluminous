/**
 * Quality Gates Runner
 * Orchestrates all quality gates and generates comprehensive reports
 */

import { PRData, GateResult, QualityReport, QualityScore } from "./types";
import { staticAnalysisGate } from "./gates/static-analysis-gate";
import { bundleBudgetGate } from "./gates/bundle-budget-gate";
import { coverageGate } from "./gates/coverage-gate";
import { performanceGate } from "./gates/performance-gate";
import { accessibilityGate } from "./gates/accessibility-gate";
import { securityGate } from "./gates/security-gate";

export class QualityGateRunner {
  private readonly gates = [
    staticAnalysisGate,
    bundleBudgetGate,
    coverageGate,
    performanceGate,
    accessibilityGate,
    securityGate,
  ];

  async runAllGates(prData: PRData): Promise<GateResult[]> {
    const results: GateResult[] = [];
    const startTime = Date.now();

    console.log("🚀 Running Quality Gates...\n");

    for (const gate of this.gates) {
      if (process.env.SKIP_OPTIONAL_GATES === "true" && !gate.required) {
        console.log(`⏭️  Skipping optional gate: ${gate.name}`);
        continue;
      }

      const gateStartTime = Date.now();

      try {
        console.log(`📋 Running: ${gate.name}`);
        const result = await this.runGateWithTimeout(
          gate,
          prData,
          gateStartTime,
        );

        results.push(result);

        if (result.success) {
          console.log(`✅ ${gate.name} passed (${result.duration}ms)\n`);
        } else {
          console.log(`❌ ${gate.name} failed (${result.duration}ms)`);
          if (result.error) {
            console.log(`   Error: ${result.error}`);
          }
          console.log("");
        }
      } catch (error) {
        const duration = Date.now() - gateStartTime;
        console.log(`💥 ${gate.name} crashed (${duration}ms)`);
        console.log(
          `   Error: ${error instanceof Error ? error.message : "Unknown error"}\n`,
        );

        results.push({
          gate: gate.id,
          name: gate.name,
          success: false,
          duration,
          error: error instanceof Error ? error.message : "Unknown error",
          required: gate.required,
        });
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log(`⏱️  Total execution time: ${totalDuration}ms\n`);

    return results;
  }

  async generateReport(
    prData: PRData,
    results: GateResult[],
  ): Promise<QualityReport> {
    const passed = results.filter((r) => r.success).length;
    const total = results.length;
    const requiredPassed = results.filter(
      (r) => r.required && r.success,
    ).length;
    const requiredTotal = results.filter((r) => r.required).length;

    const overallScore = this.calculateOverallScore(results);

    // Generate recommendations based on failures
    const recommendations = this.generateRecommendations(results);

    // Identify critical issues
    const criticalIssues = results
      .filter((r) => !r.success && r.required)
      .map((r) => `${r.name}: ${r.error || "Failed"}`);

    return {
      pr: prData,
      timestamp: new Date(),
      overall: {
        passed: requiredPassed === requiredTotal,
        score: overallScore,
        duration: results.reduce((sum, r) => sum + r.duration, 0),
      },
      gates: results,
      recommendations,
      criticalIssues,
    };
  }

  private async runGateWithTimeout(
    gate: any,
    prData: PRData,
    startTime: number,
  ): Promise<GateResult> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          gate: gate.id,
          name: gate.name,
          success: false,
          duration: Date.now() - startTime,
          error: `Timeout after ${gate.timeout}ms`,
          required: gate.required,
        });
      }, gate.timeout);

      gate
        .run(prData)
        .then((result: GateResult) => {
          clearTimeout(timeout);
          resolve({
            ...result,
            duration: Date.now() - startTime,
          });
        })
        .catch((error: Error) => {
          clearTimeout(timeout);
          resolve({
            gate: gate.id,
            name: gate.name,
            success: false,
            duration: Date.now() - startTime,
            error: error.message,
            required: gate.required,
          });
        });
    });
  }

  private calculateOverallScore(results: GateResult[]): number {
    const weights = {
      staticAnalysis: 0.2,
      bundleBudget: 0.15,
      coverage: 0.25,
      performance: 0.15,
      accessibility: 0.15,
      security: 0.1,
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const result of results) {
      const weight = weights[result.gate as keyof typeof weights] || 0.1;
      const score = result.success ? result.score || 100 : 0;

      totalScore += score * weight;
      totalWeight += weight;
    }

    return Math.round(totalScore / totalWeight);
  }

  private generateRecommendations(results: GateResult[]): string[] {
    const recommendations: string[] = [];

    const failedGates = results.filter((r) => !r.success);

    for (const gate of failedGates) {
      switch (gate.gate) {
        case "staticAnalysis":
          recommendations.push(
            "Fix ESLint errors and TypeScript compilation issues",
          );
          break;
        case "bundleBudget":
          recommendations.push(
            "Optimize bundle size - consider code splitting or tree shaking",
          );
          break;
        case "coverage":
          recommendations.push(
            "Increase test coverage by adding unit tests for uncovered code",
          );
          break;
        case "performance":
          recommendations.push(
            "Optimize performance - check Core Web Vitals and Lighthouse scores",
          );
          break;
        case "accessibility":
          recommendations.push(
            "Fix accessibility violations - ensure WCAG compliance",
          );
          break;
        case "security":
          recommendations.push(
            "Address security vulnerabilities in dependencies",
          );
          break;
      }
    }

    return recommendations;
  }

  async calculateQualityScore(results: GateResult[]): Promise<QualityScore> {
    const getScore = (gateId: string) =>
      results.find((r) => r.gate === gateId)?.score || 0;

    return {
      overall: this.calculateOverallScore(results),
      staticAnalysis: getScore("staticAnalysis"),
      bundleSize: getScore("bundleBudget"),
      testCoverage: getScore("coverage"),
      performance: getScore("performance"),
      accessibility: getScore("accessibility"),
      security: getScore("security"),
    };
  }
}
