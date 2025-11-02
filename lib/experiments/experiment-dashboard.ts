// Experiment Dashboard - Administrative interface for A/B testing
// Provides real-time monitoring and automated analysis

import {
  analyzeExperiment,
  generateExperimentReport,
  type AnalysisResult,
} from "./analysis-engine";
import {
  getAllExperimentMetrics,
  getExperimentMetrics,
} from "../analytics/experiment-analytics";

export interface DashboardData {
  experiments: ExperimentStatus[];
  summary: ExperimentSummary;
  alerts: ExperimentAlert[];
  recommendations: ExperimentRecommendation[];
}

export interface ExperimentStatus {
  id: string;
  name: string;
  status: "running" | "stopped" | "concluded";
  winner?: string;
  confidence: number;
  improvement: number;
  sampleSize: number;
  daysRunning: number;
  analysis: AnalysisResult | null;
  health: "good" | "warning" | "critical";
}

export interface ExperimentSummary {
  totalExperiments: number;
  runningExperiments: number;
  concludedExperiments: number;
  averageImprovement: number;
  totalSampleSize: number;
  criticalAlerts: number;
}

export interface ExperimentAlert {
  experimentId: string;
  type: "winner_found" | "degradation" | "low_power" | "insufficient_data";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  actionRequired: string;
  timestamp: Date;
}

export interface ExperimentRecommendation {
  experimentId: string;
  type: "rollout_winner" | "stop_experiment" | "increase_sample" | "redesign";
  priority: "low" | "medium" | "high";
  description: string;
  impact: string;
  effort: "low" | "medium" | "high";
  deadline?: Date;
}

/**
 * Generate dashboard data for all experiments
 */
export function generateDashboardData(): DashboardData {
  const allMetrics = getAllExperimentMetrics();
  const experiments: ExperimentStatus[] = [];
  const alerts: ExperimentAlert[] = [];
  const recommendations: ExperimentRecommendation[] = [];

  let totalImprovement = 0;
  let totalSampleSize = 0;
  let criticalAlerts = 0;

  for (const metrics of allMetrics) {
    const analysis = analyzeExperiment(metrics.experimentId);
    const experimentStatus = createExperimentStatus(
      { ...metrics, sampleSize: metrics.totalEvents },
      analysis,
    );

    experiments.push(experimentStatus);
    totalImprovement += experimentStatus.improvement;
    totalSampleSize += experimentStatus.sampleSize;

    // Generate alerts and recommendations only if analysis is available
    if (analysis) {
      const experimentAlerts = generateAlerts(
        { ...metrics, sampleSize: metrics.totalEvents },
        analysis,
      );
      alerts.push(...experimentAlerts);
      criticalAlerts += experimentAlerts.filter(
        (a) => a.severity === "critical",
      ).length;

      // Generate recommendations
      const experimentRecommendations = generateRecommendations(
        { ...metrics, sampleSize: metrics.totalEvents },
        analysis,
      );
      recommendations.push(...experimentRecommendations);
    }
  }

  const summary: ExperimentSummary = {
    totalExperiments: experiments.length,
    runningExperiments: experiments.filter((e) => e.status === "running")
      .length,
    concludedExperiments: experiments.filter((e) => e.status === "concluded")
      .length,
    averageImprovement:
      experiments.length > 0 ? totalImprovement / experiments.length : 0,
    totalSampleSize,
    criticalAlerts,
  };

  return {
    experiments,
    summary,
    alerts,
    recommendations,
  };
}

/**
 * Create experiment status from metrics and analysis
 */
function createExperimentStatus(
  metrics: ExperimentMetrics,
  analysis: AnalysisResult | null,
): ExperimentStatus {
  const startDate = new Date();
  const daysRunning = Math.floor(
    (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  let status: ExperimentStatus["status"] = "running";
  let health: ExperimentStatus["health"] = "good";

  if (analysis?.shouldStop) {
    status = "concluded";
  }

  if (analysis && analysis.statisticalSignificance.pValue > 0.1) {
    health = "warning";
  }

  if (analysis && analysis.improvement < -10) {
    health = "critical";
  }

  return {
    id: metrics.experimentId,
    name: `Experiment ${metrics.experimentId}`,
    status,
    winner: analysis?.winner,
    confidence: analysis?.confidence || 0,
    improvement: analysis?.improvement || 0,
    sampleSize: metrics.totalEvents,
    daysRunning,
    analysis,
    health,
  };
}

/**
 * Generate alerts for an experiment
 */
function generateAlerts(
  metrics: ExperimentMetrics,
  analysis: AnalysisResult | null,
): ExperimentAlert[] {
  const alerts: ExperimentAlert[] = [];

  if (analysis?.winner && analysis.confidence >= 95) {
    alerts.push({
      experimentId: metrics.experimentId,
      type: "winner_found",
      severity: "high",
      message: `Winner found: ${analysis.winner} with ${analysis.improvement.toFixed(1)}% improvement`,
      actionRequired: "Review and rollout winner variant",
      timestamp: new Date(),
    });
  }

  if (
    analysis &&
    analysis.improvement < -10 &&
    analysis.statisticalSignificance.isSignificant
  ) {
    alerts.push({
      experimentId: metrics.experimentId,
      type: "degradation",
      severity: "critical",
      message: `Performance degradation: ${Math.abs(analysis.improvement).toFixed(1)}% worse than control`,
      actionRequired: "Stop experiment and investigate issues",
      timestamp: new Date(),
    });
  }

  if (
    analysis?.powerAnalysis?.statisticalPower !== undefined &&
    analysis.powerAnalysis.statisticalPower < 0.5
  ) {
    alerts.push({
      experimentId: metrics.experimentId,
      type: "low_power",
      severity: "medium",
      message: `Low statistical power (${(analysis.powerAnalysis.statisticalPower * 100).toFixed(0)}%)`,
      actionRequired: `Collect ${analysis.powerAnalysis.requiredSampleSize - analysis.powerAnalysis.sampleSize} more samples`,
      timestamp: new Date(),
    });
  }

  if (metrics.totalEvents < 100) {
    alerts.push({
      experimentId: metrics.experimentId,
      type: "insufficient_data",
      severity: "low",
      message: `Insufficient data: only ${metrics.totalEvents} events collected`,
      actionRequired: "Continue running experiment to collect more data",
      timestamp: new Date(),
    });
  }

  return alerts;
}

/**
 * Generate recommendations for an experiment
 */
function generateRecommendations(
  metrics: ExperimentMetrics,
  analysis: AnalysisResult | null,
): ExperimentRecommendation[] {
  const recommendations: ExperimentRecommendation[] = [];

  if (analysis?.winner && analysis.confidence >= 95) {
    recommendations.push({
      experimentId: metrics.experimentId,
      type: "rollout_winner",
      priority: "high",
      description: `Roll out winning variant ${analysis.winner} to 100% of users`,
      impact: `Expected ${analysis.improvement.toFixed(1)}% improvement in key metrics`,
      effort: "medium",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
    });
  }

  if (analysis?.shouldStop && analysis.improvement < -5) {
    recommendations.push({
      experimentId: metrics.experimentId,
      type: "stop_experiment",
      priority: "high",
      description: "Stop experiment due to significant performance degradation",
      impact: "Prevent further negative impact on user experience",
      effort: "low",
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
    });
  }

  if (
    analysis &&
    analysis.powerAnalysis.sampleSize <
      analysis.powerAnalysis.requiredSampleSize
  ) {
    recommendations.push({
      experimentId: metrics.experimentId,
      type: "increase_sample",
      priority: "medium",
      description: `Increase sample size to ${analysis.powerAnalysis.requiredSampleSize} for reliable results`,
      impact: "Improve statistical significance and confidence in results",
      effort: "low",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
  }

  return recommendations;
}

/**
 * Get detailed experiment report
 */
export function getExperimentReport(experimentId: string): string {
  return generateExperimentReport(experimentId);
}

/**
 * Export dashboard data as JSON
 */
export function exportDashboardData(): string {
  const data = generateDashboardData();
  return JSON.stringify(data, null, 2);
}

/**
 * Get experiments that need attention
 */
export function getExperimentsNeedingAttention(): ExperimentStatus[] {
  const dashboard = generateDashboardData();
  return dashboard.experiments.filter(
    (exp) =>
      exp.health === "critical" ||
      exp.health === "warning" ||
      exp.status === "concluded",
  );
}

/**
 * Get system-wide experiment health score
 */
export function getExperimentHealthScore(): number {
  const dashboard = generateDashboardData();

  if (dashboard.experiments.length === 0) return 100;

  let score = 100;

  // Deduct points for various issues
  score -=
    dashboard.alerts.filter((a) => a.severity === "critical").length * 20;
  score -= dashboard.alerts.filter((a) => a.severity === "high").length * 10;
  score -= dashboard.alerts.filter((a) => a.severity === "medium").length * 5;

  // Bonus for concluded experiments with winners
  const conclusiveExperiments = dashboard.experiments.filter(
    (e) => e.status === "concluded" && e.winner,
  );
  score += conclusiveExperiments.length * 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate executive summary
 */
export function generateExecutiveSummary(): string {
  const dashboard = generateDashboardData();
  const healthScore = getExperimentHealthScore();

  let summary = `📊 Experiment System Executive Summary\n\n`;
  summary += `Health Score: ${healthScore}/100 ${getHealthEmoji(healthScore)}\n\n`;

  summary += `📈 Overview:\n`;
  summary += `• Total Experiments: ${dashboard.summary.totalExperiments}\n`;
  summary += `• Running: ${dashboard.summary.runningExperiments}\n`;
  summary += `• Concluded: ${dashboard.summary.concludedExperiments}\n`;
  summary += `• Average Improvement: ${dashboard.summary.averageImprovement.toFixed(1)}%\n`;
  summary += `• Total Sample Size: ${dashboard.summary.totalSampleSize}\n\n`;

  if (dashboard.alerts.length > 0) {
    summary += `🚨 Active Alerts: ${dashboard.alerts.length}\n`;
    dashboard.alerts.slice(0, 5).forEach((alert) => {
      summary += `• ${getSeverityEmoji(alert.severity)} ${alert.message}\n`;
    });

    if (dashboard.alerts.length > 5) {
      summary += `• ... and ${dashboard.alerts.length - 5} more\n`;
    }
    summary += "\n";
  }

  if (dashboard.recommendations.length > 0) {
    summary += `💡 Key Recommendations: ${dashboard.recommendations.length}\n`;
    dashboard.recommendations
      .filter((r) => r.priority === "high")
      .slice(0, 3)
      .forEach((rec) => {
        summary += `• ${rec.description}\n`;
      });
    summary += "\n";
  }

  summary += `🎯 Next Actions:\n`;
  const needsAttention = getExperimentsNeedingAttention();
  if (needsAttention.length > 0) {
    summary += `• Review ${needsAttention.length} experiments needing attention\n`;
  }

  summary += `• Monitor experiment health score\n`;
  summary += `• Review concluded experiments for rollout\n`;

  return summary;
}

function getHealthEmoji(score: number): string {
  if (score >= 90) return "🟢";
  if (score >= 70) return "🟡";
  if (score >= 50) return "🟠";
  return "🔴";
}

function getSeverityEmoji(severity: string): string {
  switch (severity) {
    case "critical":
      return "🔴";
    case "high":
      return "🟠";
    case "medium":
      return "🟡";
    case "low":
      return "🟢";
    default:
      return "⚪";
  }
}
