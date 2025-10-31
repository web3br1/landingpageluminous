// Advanced A/B Testing Analysis Engine
// Automatically analyzes experiment results and provides actionable insights

import type { Experiment, ExperimentMetrics, ExperimentResult } from "./types";
import {
  getExperimentMetrics,
  trackExperimentEvent,
} from "../analytics/experiment-analytics";

// Statistical constants
const CONFIDENCE_LEVELS = {
  90: 1.645, // 90% confidence
  95: 1.96, // 95% confidence
  99: 2.576, // 99% confidence
} as const;

export interface AnalysisResult {
  experimentId: string;
  winner?: string;
  confidence: number;
  improvement: number;
  recommendations: string[];
  shouldStop: boolean;
  reason: string;
  statisticalSignificance: StatisticalSignificance;
  powerAnalysis: PowerAnalysis;
  nextSteps: string[];
}

export interface StatisticalSignificance {
  level: keyof typeof CONFIDENCE_LEVELS;
  pValue: number;
  isSignificant: boolean;
  effectSize: number;
  confidenceInterval: [number, number];
}

export interface PowerAnalysis {
  sampleSize: number;
  requiredSampleSize: number;
  statisticalPower: number;
  minimumDetectableEffect: number;
}

/**
 * Analyze experiment results and provide automated recommendations
 */
export function analyzeExperiment(experimentId: string): AnalysisResult | null {
  const metrics = getExperimentMetrics(experimentId);

  if (!metrics || metrics.variants.length < 2) {
    return null;
  }

  const controlVariant = metrics.variants.find(
    (v) => v.variantId === "control",
  );
  const testVariants = metrics.variants.filter(
    (v) => v.variantId !== "control",
  );

  if (!controlVariant || testVariants.length === 0) {
    return {
      experimentId,
      confidence: 0,
      improvement: 0,
      recommendations: [
        "No control variant found or insufficient test variants",
      ],
      shouldStop: false,
      reason: "Invalid experiment setup",
      statisticalSignificance: {
        level: 95,
        pValue: 1,
        isSignificant: false,
        effectSize: 0,
        confidenceInterval: [0, 0],
      },
      powerAnalysis: {
        sampleSize: 0,
        requiredSampleSize: 0,
        statisticalPower: 0,
        minimumDetectableEffect: 0,
      },
      nextSteps: ["Review experiment configuration"],
    };
  }

  // Analyze each test variant against control
  const analyses = testVariants.map((variant) =>
    analyzeVariant(controlVariant, variant),
  );

  // Find the best performing variant
  const bestAnalysis = analyses.reduce((best, current) =>
    current.improvement > best.improvement ? current : best,
  );

  const winner =
    bestAnalysis.isSignificant && bestAnalysis.improvement > 0
      ? bestAnalysis.variantId
      : undefined;

  // Generate recommendations
  const recommendations = generateRecommendations(bestAnalysis, metrics);

  // Determine if experiment should stop
  const shouldStop = determineShouldStop(bestAnalysis, metrics);

  return {
    experimentId,
    winner,
    confidence: bestAnalysis.confidence ?? 0,
    improvement: bestAnalysis.improvement,
    recommendations,
    shouldStop,
    reason: generateReason(bestAnalysis, metrics),
    statisticalSignificance: bestAnalysis.significance,
    powerAnalysis: bestAnalysis.power,
    nextSteps: generateNextSteps(bestAnalysis, metrics),
  };
}

/**
 * Analyze a single variant against control
 */
function analyzeVariant(control: unknown, variant: unknown) {
  const totalViews = control.views + variant.views;
  const totalClicks = control.clicks + variant.clicks;

  // Calculate rates
  const controlRate = control.views > 0 ? control.clicks / control.views : 0;
  const variantRate = variant.views > 0 ? variant.clicks / variant.views : 0;

  // Statistical significance test (simplified chi-square)
  const significance = calculateStatisticalSignificance(control, variant);

  // Calculate improvement
  const improvement =
    controlRate > 0 ? ((variantRate - controlRate) / controlRate) * 100 : 0;

  // Power analysis
  const power = calculatePowerAnalysis(control, variant);

  return {
    variantId: variant.variantId,
    controlRate,
    variantRate,
    improvement,
    confidence: significance.isSignificant ? significance.level : 0,
    isSignificant: significance.isSignificant,
    significance,
    power,
  };
}

/**
 * Calculate statistical significance using simplified z-test
 */
function calculateStatisticalSignificance(
  control: unknown,
  variant: unknown,
): StatisticalSignificance {
  const n1 = control.views;
  const n2 = variant.views;
  const p1 = control.views > 0 ? control.clicks / control.views : 0;
  const p2 = variant.views > 0 ? variant.clicks / variant.views : 0;

  if (n1 === 0 || n2 === 0) {
    return {
      level: 95,
      pValue: 1,
      isSignificant: false,
      effectSize: 0,
      confidenceInterval: [0, 0],
    };
  }

  // Pooled proportion
  const p = (control.clicks + variant.clicks) / (n1 + n2);
  const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));

  if (se === 0) {
    return {
      level: 95,
      pValue: 1,
      isSignificant: false,
      effectSize: 0,
      confidenceInterval: [0, 0],
    };
  }

  // Z-score
  const z = Math.abs(p2 - p1) / se;
  const pValue = 2 * (1 - normalCDF(z)); // Two-tailed test

  // Determine confidence level
  let level: keyof typeof CONFIDENCE_LEVELS = 90;
  if (z >= CONFIDENCE_LEVELS[99]) level = 99;
  else if (z >= CONFIDENCE_LEVELS[95]) level = 95;

  const isSignificant = pValue < 0.05; // 95% confidence
  const effectSize = Math.abs(p2 - p1);

  // Confidence interval (simplified)
  const margin = CONFIDENCE_LEVELS[95] * se;
  const confidenceInterval: [number, number] = [
    Math.max(0, p2 - margin),
    p2 + margin,
  ];

  return {
    level,
    pValue,
    isSignificant,
    effectSize,
    confidenceInterval,
  };
}

/**
 * Calculate statistical power and required sample size
 */
function calculatePowerAnalysis(
  control: unknown,
  variant: unknown,
): PowerAnalysis {
  const n1 = control.views;
  const n2 = variant.views;
  const sampleSize = Math.min(n1, n2);

  // Simplified power calculation
  const p1 = control.views > 0 ? control.clicks / control.views : 0;
  const p2 = variant.views > 0 ? variant.clicks / variant.views : 0;
  const effectSize = Math.abs(p2 - p1);

  // Required sample size for 80% power (simplified formula)
  const requiredSampleSize =
    effectSize > 0
      ? Math.ceil((16 / effectSize ** 2) * (p1 * (1 - p1) + p2 * (1 - p2)))
      : 1000;

  // Statistical power (simplified)
  const statisticalPower =
    sampleSize >= requiredSampleSize
      ? 0.8
      : (sampleSize / requiredSampleSize) * 0.8;

  // Minimum detectable effect for current sample size
  const minimumDetectableEffect =
    sampleSize > 0 ? Math.sqrt(16 / sampleSize) * 0.1 : 0.05;

  return {
    sampleSize,
    requiredSampleSize,
    statisticalPower,
    minimumDetectableEffect,
  };
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(
  analysis: unknown,
  metrics: unknown,
): string[] {
  const recommendations: string[] = [];

  if (analysis.isSignificant && analysis.improvement > 0) {
    recommendations.push(
      `🚀 Winner found! ${analysis.variantId} improved by ${analysis.improvement.toFixed(1)}%`,
    );
    recommendations.push("Consider rolling out this variant to 100% of users");
  } else if (analysis.isSignificant && analysis.improvement < 0) {
    recommendations.push(
      `⚠️ Variant ${analysis.variantId} performed worse by ${Math.abs(analysis.improvement).toFixed(1)}%`,
    );
    recommendations.push(
      "Consider stopping this variant or investigating issues",
    );
  } else {
    recommendations.push("📊 Results are inconclusive - continue testing");
    recommendations.push(
      `Need ${analysis.power.requiredSampleSize} samples for reliable results`,
    );
  }

  if (metrics.totalEvents < 1000) {
    recommendations.push(
      "🔄 Continue collecting more data for better statistical significance",
    );
  }

  if (analysis.power.statisticalPower < 0.8) {
    recommendations.push(
      "⚡ Low statistical power - consider increasing sample size",
    );
  }

  return recommendations;
}

/**
 * Determine if experiment should stop
 */
function determineShouldStop(analysis: unknown, metrics: unknown): boolean {
  // Stop if we have a clear winner with high confidence
  if (
    analysis.isSignificant &&
    analysis.improvement > 5 &&
    analysis.confidence >= 95
  ) {
    return true;
  }

  // Stop if we have strong negative results
  if (analysis.isSignificant && analysis.improvement < -10) {
    return true;
  }

  // Continue if inconclusive or needs more data
  return false;
}

/**
 * Generate reason for current analysis state
 */
function generateReason(analysis: unknown, metrics: unknown): string {
  if (analysis.isSignificant && analysis.improvement > 0) {
    return `Variant ${analysis.variantId} shows statistically significant improvement`;
  } else if (analysis.isSignificant && analysis.improvement < 0) {
    return `Variant ${analysis.variantId} shows statistically significant degradation`;
  } else if (metrics.totalEvents < 100) {
    return "Insufficient data for reliable analysis";
  } else {
    return "Results are inconclusive - continue testing";
  }
}

/**
 * Generate next steps based on analysis
 */
function generateNextSteps(analysis: unknown, metrics: unknown): string[] {
  const steps: string[] = [];

  if (analysis.isSignificant && analysis.improvement > 0) {
    steps.push("🎯 Implement winner variant across all users");
    steps.push("📊 Monitor performance after rollout");
    steps.push("🔄 Start new experiment with different hypothesis");
  } else if (analysis.isSignificant && analysis.improvement < 0) {
    steps.push("🔍 Investigate why variant performed worse");
    steps.push("🛑 Stop variant or redesign experiment");
    steps.push("📝 Document learnings for future experiments");
  } else {
    steps.push("⏱️ Continue running experiment");
    steps.push(
      `📈 Collect ${Math.max(0, analysis.power.requiredSampleSize - metrics.totalEvents)} more samples`,
    );
    steps.push("📊 Review experiment setup and goals");
  }

  return steps;
}

/**
 * Normal cumulative distribution function (simplified)
 */
function normalCDF(x: number): number {
  // Approximation of normal CDF
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const probability =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  return x > 0 ? 1 - probability : probability;
}

/**
 * Auto-analyze all running experiments
 */
export function autoAnalyzeAllExperiments(): AnalysisResult[] {
  // This would integrate with experiment management system
  // For now, return empty array
  return [];
}

/**
 * Generate automated experiment report
 */
export function generateExperimentReport(experimentId: string): string {
  const analysis = analyzeExperiment(experimentId);

  if (!analysis) {
    return `❌ Experiment ${experimentId} not found or has insufficient data`;
  }

  let report = `📊 Experiment Analysis Report: ${experimentId}\n\n`;

  if (analysis.winner) {
    report += `🏆 WINNER: ${analysis.winner}\n`;
    report += `📈 Improvement: ${analysis.improvement.toFixed(1)}%\n`;
    report += `🎯 Confidence: ${analysis.confidence}%\n\n`;
  } else {
    report += `🤔 INCONCLUSIVE: No clear winner yet\n\n`;
  }

  report += `📋 Recommendations:\n`;
  analysis.recommendations.forEach((rec) => (report += `• ${rec}\n`));

  report += `\n🚀 Next Steps:\n`;
  analysis.nextSteps.forEach((step) => (report += `• ${step}\n`));

  report += `\n📈 Statistical Details:\n`;
  report += `• P-value: ${analysis.statisticalSignificance.pValue.toFixed(4)}\n`;
  report += `• Effect size: ${analysis.statisticalSignificance.effectSize?.toFixed(4) ?? "N/A"}\n`;
  report += `• Sample size: ${analysis.powerAnalysis.sampleSize}\n`;
  report += `• Required sample size: ${analysis.powerAnalysis.requiredSampleSize}\n`;

  if (analysis.shouldStop) {
    report += `\n🛑 RECOMMENDATION: Stop experiment - ${analysis.reason}`;
  } else {
    report += `\n⏱️ RECOMMENDATION: Continue experiment - ${analysis.reason}`;
  }

  return report;
}

/**
 * Hook for automated experiment monitoring
 */
export function setupAutomatedMonitoring(
  experimentId: string,
  checkInterval: number = 3600000,
): void {
  // Set up periodic analysis
  const intervalId = setInterval(() => {
    const analysis = analyzeExperiment(experimentId);

    if (analysis?.shouldStop) {
      console.log(`🔔 Experiment ${experimentId} ready for decision!`);
      console.log(generateExperimentReport(experimentId));

      // In production, this could send notifications, update dashboards, etc.
      clearInterval(intervalId);
    }
  }, checkInterval);
}
