"use client";

import { logger } from "../../observability/logger";
import { metricsCorrelationEngine, CausalInsight, CorrelationResult } from "./metrics-correlation-engine";
import { storageManager, AtomicStorage } from "./storage-manager";

/**
 * Predictive Alerting System - Phase 3 Correction
 * Solves H3.13: Observabilidade preditiva (early warning system)
 */

export interface PredictiveAlert {
  id: string;
  type: "performance_degradation" | "user_experience_risk" | "system_instability" | "optimization_opportunity";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  predictedImpact: {
    metric: string;
    currentValue: number;
    predictedValue: number;
    confidence: number;
    timeHorizon: number; // minutes until impact
  };
  rootCause: {
    primary: string;
    contributing: string[];
    evidence: CorrelationResult[];
  };
  recommendations: AlertRecommendation[];
  createdAt: number;
  expiresAt: number;
  acknowledged: boolean;
  resolved: boolean;
  metadata: Record<string, any>;
}

export interface AlertRecommendation {
  action: string;
  priority: "immediate" | "high" | "medium" | "low";
  expectedBenefit: number; // Expected improvement percentage
  riskLevel: "low" | "medium" | "high";
  implementationEffort: "minimal" | "moderate" | "significant";
  prerequisites?: string[];
}

export interface AlertPattern {
  id: string;
  name: string;
  description: string;
  conditions: AlertCondition[];
  severity: PredictiveAlert["severity"];
  timeWindow: number; // minutes to look back
  cooldownPeriod: number; // minutes before same alert can fire again
  lastTriggered?: number;
}

export interface AlertCondition {
  type: "threshold" | "trend" | "correlation" | "anomaly";
  metric: string;
  operator: "gt" | "lt" | "gte" | "lte" | "trend_up" | "trend_down" | "anomaly_high" | "anomaly_low";
  value: number;
  confidence: number; // Minimum confidence level required
}

export interface AlertContext {
  currentMetrics: Record<string, number>;
  historicalMetrics: Array<{
    timestamp: number;
    metrics: Record<string, number>;
  }>;
  activeAlerts: PredictiveAlert[];
  systemState: {
    adaptiveRulesActive: number;
    dynamicThresholdsActive: number;
    crossSessionLearnings: number;
    recentErrors: number;
  };
}

/**
 * Trend Analysis for Predictive Alerting
 */
class TrendAnalyzer {
  /**
   * Calculate trend direction and strength
   */
  static calculateTrend(data: number[], timestamps: number[]): {
    direction: "up" | "down" | "stable";
    strength: number; // 0-1
    slope: number;
    confidence: number;
  } {
    if (data.length < 3) {
      return { direction: "stable", strength: 0, slope: 0, confidence: 0 };
    }

    // Simple linear regression
    const n = data.length;
    const sumX = timestamps.reduce((a, b) => a + b, 0);
    const sumY = data.reduce((a, b) => a + b, 0);
    const sumXY = timestamps.reduce((sum, x, i) => sum + x * data[i], 0);
    const sumXX = timestamps.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const ssRes = data.reduce((sum, y, i) => {
      const predicted = slope * timestamps[i] + intercept;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    const ssTot = data.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);

    const absSlope = Math.abs(slope);
    const strength = Math.min(1, absSlope / (Math.max(...data) - Math.min(...data)) * 10);

    let direction: "up" | "down" | "stable" = "stable";
    if (slope > 0.1) direction = "up";
    else if (slope < -0.1) direction = "down";

    return {
      direction,
      strength,
      slope,
      confidence: Math.max(0, rSquared),
    };
  }

  /**
   * Detect anomalies using statistical methods
   */
  static detectAnomaly(
    value: number,
    historicalData: number[],
    sensitivity = 2.5 // Standard deviations
  ): {
    isAnomaly: boolean;
    deviation: number;
    expectedRange: [number, number];
    confidence: number;
  } {
    if (historicalData.length < 5) {
      return { isAnomaly: false, deviation: 0, expectedRange: [value, value], confidence: 0 };
    }

    const mean = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
    const variance = historicalData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalData.length;
    const stdDev = Math.sqrt(variance);

    const deviation = Math.abs(value - mean) / stdDev;
    const isAnomaly = deviation > sensitivity;

    const expectedRange: [number, number] = [
      mean - sensitivity * stdDev,
      mean + sensitivity * stdDev,
    ];

    // Confidence based on sample size and deviation
    const confidence = Math.min(1, historicalData.length / 20) * (1 - Math.min(1, deviation / 10));

    return { isAnomaly, deviation, expectedRange, confidence };
  }

  /**
   * Predict future values using trend extrapolation
   */
  static predictValue(
    historicalData: Array<{ timestamp: number; value: number }>,
    predictionHorizon: number // minutes
  ): {
    predictedValue: number;
    confidence: number;
    trend: "improving" | "degrading" | "stable";
  } {
    if (historicalData.length < 3) {
      return {
        predictedValue: historicalData[historicalData.length - 1]?.value || 0,
        confidence: 0,
        trend: "stable",
      };
    }

    const values = historicalData.map(d => d.value);
    const timestamps = historicalData.map(d => d.timestamp);

    const trend = this.calculateTrend(values, timestamps);

    // Simple extrapolation
    const lastValue = values[values.length - 1];
    const lastTimestamp = timestamps[timestamps.length - 1];
    const futureTimestamp = lastTimestamp + (predictionHorizon * 60 * 1000);

    const predictedValue = lastValue + trend.slope * (futureTimestamp - lastTimestamp);

    let trendLabel: "improving" | "degrading" | "stable" = "stable";
    if (trend.direction === "up") trendLabel = "improving";
    else if (trend.direction === "down") trendLabel = "degrading";

    return {
      predictedValue: Math.max(0, predictedValue), // Ensure non-negative
      confidence: trend.confidence,
      trend: trendLabel,
    };
  }
}

/**
 * Predictive Alerting System
 */
export class PredictiveAlertingSystem {
  private alerts: PredictiveAlert[] = [];
  private patterns: AlertPattern[] = [];
  private static instance: PredictiveAlertingSystem;
  private initialized = false;

  constructor() {
    this.alerts = [];
    this.patterns = [];
  }

  static getInstance(): PredictiveAlertingSystem {
    if (!PredictiveAlertingSystem.instance) {
      PredictiveAlertingSystem.instance = new PredictiveAlertingSystem();
    }
    return PredictiveAlertingSystem.instance;
  }

  /**
   * Initialize the alerting system
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.loadPersistedData();
    this.defineAlertPatterns();

    this.initialized = true;

    logger.info("Predictive Alerting System initialized", {
      event: "ll_predictive_alerting_initialized",
      ll_patterns_defined: this.patterns.length,
    });
  }

  /**
   * Define alert patterns
   */
  private defineAlertPatterns(): void {
    this.patterns = [
      // Performance Degradation Alert
      {
        id: "performance_degradation",
        name: "Performance Degradation",
        description: "Detects degrading performance trends before they impact users",
        conditions: [
          {
            type: "trend",
            metric: "performance.lcp",
            operator: "trend_up", // Increasing LCP (worse)
            value: 0.1, // 10% increase
            confidence: 0.8,
          },
          {
            type: "correlation",
            metric: "loading.totalLoadTime:user.satisfaction",
            operator: "lt",
            value: -0.3, // Strong negative correlation
            confidence: 0.7,
          },
        ],
        severity: "high",
        timeWindow: 30, // 30 minutes
        cooldownPeriod: 60, // 1 hour cooldown
      },

      // User Experience Risk Alert
      {
        id: "ux_risk",
        name: "User Experience Risk",
        description: "Alerts when loading patterns risk poor user experience",
        conditions: [
          {
            type: "threshold",
            metric: "loading.sectionsFailed",
            operator: "gt",
            value: 2, // More than 2 failed sections
            confidence: 0.9,
          },
          {
            type: "trend",
            metric: "user.satisfaction",
            operator: "trend_down",
            value: 0.05, // 5% satisfaction decrease
            confidence: 0.75,
          },
        ],
        severity: "medium",
        timeWindow: 15,
        cooldownPeriod: 30,
      },

      // System Instability Alert
      {
        id: "system_instability",
        name: "System Instability",
        description: "Detects system instability patterns",
        conditions: [
          {
            type: "anomaly",
            metric: "performance.cls",
            operator: "anomaly_high",
            value: 3.0, // 3 standard deviations
            confidence: 0.85,
          },
          {
            type: "trend",
            metric: "loading.adaptiveActions",
            operator: "trend_up",
            value: 0.2, // 20% increase in adaptive actions
            confidence: 0.7,
          },
        ],
        severity: "high",
        timeWindow: 20,
        cooldownPeriod: 45,
      },

      // Optimization Opportunity Alert
      {
        id: "optimization_opportunity",
        name: "Optimization Opportunity",
        description: "Identifies high-impact optimization opportunities",
        conditions: [
          {
            type: "correlation",
            metric: "loading.cacheHitRate:user.satisfaction",
            operator: "gt",
            value: 0.4, // Strong positive correlation
            confidence: 0.8,
          },
          {
            type: "threshold",
            metric: "loading.cacheHitRate",
            operator: "lt",
            value: 0.7, // Below 70% cache hit rate
            confidence: 0.9,
          },
        ],
        severity: "low",
        timeWindow: 60, // 1 hour
        cooldownPeriod: 120, // 2 hours
      },
    ];
  }

  /**
   * Analyze current context and generate alerts
   */
  async analyzeAndAlert(context: AlertContext): Promise<PredictiveAlert[]> {
    await this.initialize();

    const newAlerts: PredictiveAlert[] = [];

    for (const pattern of this.patterns) {
      // Check cooldown period
      if (pattern.lastTriggered &&
          Date.now() - pattern.lastTriggered < pattern.cooldownPeriod * 60 * 1000) {
        continue;
      }

      const alert = await this.evaluatePattern(pattern, context);
      if (alert) {
        newAlerts.push(alert);
        pattern.lastTriggered = Date.now();
      }
    }

    // Add new alerts to the list
    this.alerts.push(...newAlerts);

    // Clean up expired alerts
    this.cleanupExpiredAlerts();

    // Persist updated alerts
    await this.persistAlerts();

    if (newAlerts.length > 0) {
      logger.info("Generated predictive alerts", {
        event: "ll_predictive_alerts_generated",
        ll_alerts_count: newAlerts.length,
        ll_alert_types: newAlerts.map(a => a.type),
        ll_severities: newAlerts.map(a => a.severity),
      });
    }

    return newAlerts;
  }

  /**
   * Evaluate a single alert pattern
   */
  private async evaluatePattern(
    pattern: AlertPattern,
    context: AlertContext
  ): Promise<PredictiveAlert | null> {
    let conditionsMet = 0;
    const totalConditions = pattern.conditions.length;
    let avgConfidence = 0;

    for (const condition of pattern.conditions) {
      const result = await this.evaluateCondition(condition, context);
      if (result.met) {
        conditionsMet++;
        avgConfidence += result.confidence;
      }
    }

    avgConfidence /= totalConditions;

    // Require 80% of conditions to be met with sufficient confidence
    if (conditionsMet / totalConditions >= 0.8 && avgConfidence >= 0.7) {
      return await this.createAlert(pattern, context, avgConfidence);
    }

    return null;
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(
    condition: AlertCondition,
    context: AlertContext
  ): Promise<{ met: boolean; confidence: number }> {
    const currentValue = this.getMetricValue(context.currentMetrics, condition.metric);

    switch (condition.type) {
      case "threshold":
        return this.evaluateThresholdCondition(condition, currentValue);

      case "trend":
        return this.evaluateTrendCondition(condition, context);

      case "correlation":
        return await this.evaluateCorrelationCondition(condition);

      case "anomaly":
        return this.evaluateAnomalyCondition(condition, context);

      default:
        return { met: false, confidence: 0 };
    }
  }

  private evaluateThresholdCondition(
    condition: AlertCondition,
    currentValue: number
  ): { met: boolean; confidence: number } {
    let met = false;

    switch (condition.operator) {
      case "gt":
        met = currentValue > condition.value;
        break;
      case "lt":
        met = currentValue < condition.value;
        break;
      case "gte":
        met = currentValue >= condition.value;
        break;
      case "lte":
        met = currentValue <= condition.value;
        break;
    }

    return { met, confidence: condition.confidence };
  }

  private evaluateTrendCondition(
    condition: AlertCondition,
    context: AlertContext
  ): { met: boolean; confidence: number } {
    const historicalValues = context.historicalMetrics
      .filter(h => Date.now() - h.timestamp < condition.value * 60 * 1000) // Within time window
      .map(h => this.getMetricValue(h.metrics, condition.metric))
      .filter(v => !isNaN(v));

    if (historicalValues.length < 3) {
      return { met: false, confidence: 0 };
    }

    const timestamps = context.historicalMetrics
      .filter(h => Date.now() - h.timestamp < condition.value * 60 * 1000)
      .map(h => h.timestamp);

    const trend = TrendAnalyzer.calculateTrend(historicalValues, timestamps);

    let met = false;
    switch (condition.operator) {
      case "trend_up":
        met = trend.direction === "up" && trend.strength > 0.1;
        break;
      case "trend_down":
        met = trend.direction === "down" && trend.strength > 0.1;
        break;
    }

    return { met, confidence: trend.confidence };
  }

  private async evaluateCorrelationCondition(
    condition: AlertCondition
  ): Promise<{ met: boolean; confidence: number }> {
    const [metricA, metricB] = condition.metric.split(":");
    if (!metricA || !metricB) return { met: false, confidence: 0 };

    const correlation = metricsCorrelationEngine.getCorrelation(metricA, metricB);
    if (!correlation) return { met: false, confidence: 0 };

    let met = false;
    switch (condition.operator) {
      case "gt":
        met = correlation.correlation > condition.value;
        break;
      case "lt":
        met = correlation.correlation < condition.value;
        break;
    }

    return { met: met && correlation.isSignificant, confidence: correlation.confidence };
  }

  private evaluateAnomalyCondition(
    condition: AlertCondition,
    context: AlertContext
  ): { met: boolean; confidence: number } {
    const currentValue = this.getMetricValue(context.currentMetrics, condition.metric);
    const historicalValues = context.historicalMetrics
      .map(h => this.getMetricValue(h.metrics, condition.metric))
      .filter(v => !isNaN(v));

    const anomaly = TrendAnalyzer.detectAnomaly(currentValue, historicalValues, condition.value);

    let met = false;
    switch (condition.operator) {
      case "anomaly_high":
        met = anomaly.isAnomaly && currentValue > anomaly.expectedRange[1];
        break;
      case "anomaly_low":
        met = anomaly.isAnomaly && currentValue < anomaly.expectedRange[0];
        break;
    }

    return { met, confidence: anomaly.confidence };
  }

  /**
   * Create an alert from a pattern
   */
  private async createAlert(
    pattern: AlertPattern,
    context: AlertContext,
    confidence: number
  ): Promise<PredictiveAlert> {
    const causalInsights = metricsCorrelationEngine.getCausalInsights();

    // Predict impact based on correlations
    const predictedImpact = await this.predictImpact(pattern, context, causalInsights);

    // Generate recommendations
    const recommendations = this.generateRecommendations(pattern, predictedImpact);

    const alert: PredictiveAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: pattern.id as any,
      severity: pattern.severity,
      title: this.generateAlertTitle(pattern),
      description: this.generateAlertDescription(pattern, predictedImpact),
      predictedImpact,
      rootCause: {
        primary: this.identifyPrimaryCause(pattern, causalInsights),
        contributing: this.identifyContributingCauses(pattern, causalInsights),
        evidence: this.gatherEvidence(pattern, context),
      },
      recommendations,
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      acknowledged: false,
      resolved: false,
      metadata: {
        patternId: pattern.id,
        confidence,
        context: {
          activeRules: context.systemState.adaptiveRulesActive,
          activeThresholds: context.systemState.dynamicThresholdsActive,
          recentErrors: context.systemState.recentErrors,
        },
      },
    };

    return alert;
  }

  /**
   * Predict the impact of the alert
   */
  private async predictImpact(
    pattern: AlertPattern,
    context: AlertContext,
    causalInsights: CausalInsight[]
  ): Promise<PredictiveAlert["predictedImpact"]> {
    // Find relevant causal insights
    const relevantInsights = causalInsights.filter(insight =>
      pattern.conditions.some(condition =>
        insight.cause.includes(condition.metric.split(".")[0]) ||
        insight.effect.includes(condition.metric.split(".")[0])
      )
    );

    // Predict impact on key metrics
    const predictions = await Promise.all([
      this.predictMetricImpact("performance.lcp", context, 30), // 30 minutes
      this.predictMetricImpact("user.satisfaction", context, 30),
      this.predictMetricImpact("loading.totalLoadTime", context, 30),
    ]);

    const lcpPrediction = predictions[0];
    const satisfactionPrediction = predictions[1];

    return {
      metric: "user.satisfaction",
      currentValue: context.currentMetrics["user.satisfaction"] || 0.5,
      predictedValue: satisfactionPrediction.predictedValue,
      confidence: Math.min(...predictions.map(p => p.confidence)),
      timeHorizon: 30,
    };
  }

  private async predictMetricImpact(
    metric: string,
    context: AlertContext,
    horizon: number
  ): Promise<{ predictedValue: number; confidence: number }> {
    const historicalData = context.historicalMetrics
      .map(h => ({
        timestamp: h.timestamp,
        value: this.getMetricValue(h.metrics, metric),
      }))
      .filter(d => !isNaN(d.value));

    if (historicalData.length < 3) {
      return { predictedValue: context.currentMetrics[metric] || 0, confidence: 0 };
    }

    return TrendAnalyzer.predictValue(historicalData, horizon);
  }

  /**
   * Generate alert title
   */
  private generateAlertTitle(pattern: AlertPattern): string {
    switch (pattern.id) {
      case "performance_degradation":
        return "🚨 Performance Degradation Detected";
      case "ux_risk":
        return "⚠️ User Experience Risk Alert";
      case "system_instability":
        return "🔴 System Instability Warning";
      case "optimization_opportunity":
        return "💡 Optimization Opportunity Available";
      default:
        return "Alert: " + pattern.name;
    }
  }

  /**
   * Generate alert description
   */
  private generateAlertDescription(
    pattern: AlertPattern,
    impact: PredictiveAlert["predictedImpact"]
  ): string {
    const impactPercent = Math.abs(
      ((impact.predictedValue - impact.currentValue) / impact.currentValue) * 100
    ).toFixed(1);

    const direction = impact.predictedValue > impact.currentValue ? "increase" : "decrease";

    return `Predicted ${impactPercent}% ${direction} in ${impact.metric} within ${impact.predictedImpact.timeHorizon} minutes. ` +
           `Confidence: ${(impact.confidence * 100).toFixed(0)}%. ` +
           `Early intervention recommended.`;
  }

  /**
   * Identify primary root cause
   */
  private identifyPrimaryCause(pattern: AlertPattern, insights: CausalInsight[]): string {
    // Find the most relevant causal insight
    const relevant = insights
      .filter(i => i.confidence > 0.7)
      .sort((a, b) => b.strength - a.strength);

    return relevant[0]?.cause || "Multiple contributing factors";
  }

  /**
   * Identify contributing causes
   */
  private identifyContributingCauses(pattern: AlertPattern, insights: CausalInsight[]): string[] {
    return insights
      .filter(i => i.confidence > 0.6)
      .slice(1, 4) // Top 3 additional causes
      .map(i => i.cause);
  }

  /**
   * Gather evidence from correlations
   */
  private gatherEvidence(pattern: AlertPattern, context: AlertContext): CorrelationResult[] {
    const evidence: CorrelationResult[] = [];

    for (const condition of pattern.conditions) {
      if (condition.type === "correlation") {
        const correlation = metricsCorrelationEngine.getCorrelation(
          condition.metric.split(":")[0],
          condition.metric.split(":")[1]
        );
        if (correlation) evidence.push(correlation);
      }
    }

    return evidence;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    pattern: AlertPattern,
    impact: PredictiveAlert["predictedImpact"]
  ): AlertRecommendation[] {
    const recommendations: AlertRecommendation[] = [];

    switch (pattern.id) {
      case "performance_degradation":
        recommendations.push({
          action: "Enable more aggressive loading preloading",
          priority: "high",
          expectedBenefit: 15,
          riskLevel: "medium",
          implementationEffort: "moderate",
        });
        break;

      case "ux_risk":
        recommendations.push({
          action: "Reduce loading thresholds for better responsiveness",
          priority: "immediate",
          expectedBenefit: 10,
          riskLevel: "low",
          implementationEffort: "minimal",
        });
        break;

      case "system_instability":
        recommendations.push({
          action: "Implement circuit breaker for failing components",
          priority: "high",
          expectedBenefit: 25,
          riskLevel: "low",
          implementationEffort: "moderate",
        });
        break;

      case "optimization_opportunity":
        recommendations.push({
          action: "Optimize cache strategy based on correlation analysis",
          priority: "medium",
          expectedBenefit: 20,
          riskLevel: "low",
          implementationEffort: "moderate",
        });
        break;
    }

    return recommendations;
  }

  /**
   * Get metric value from context
   */
  private getMetricValue(metrics: Record<string, number>, metricPath: string): number {
    const parts = metricPath.split(".");
    let value: any = metrics;

    for (const part of parts) {
      if (value && typeof value === "object") {
        value = value[part];
      } else {
        return 0;
      }
    }

    return typeof value === "number" ? value : 0;
  }

  /**
   * Clean up expired alerts
   */
  private cleanupExpiredAlerts(): void {
    const now = Date.now();
    this.alerts = this.alerts.filter(alert =>
      !alert.resolved && alert.expiresAt > now
    );
  }

  /**
   * Persist alerts data
   */
  private async persistAlerts(): Promise<void> {
    try {
      await AtomicStorage.atomicUpdate(
        "predictive_alerts",
        () => ({
          alerts: this.alerts.slice(-50), // Keep last 50 alerts
          patterns: this.patterns,
          lastUpdated: Date.now(),
        }),
        {}
      );
    } catch (error) {
      logger.error("Failed to persist alerts", {
        event: "ll_alerts_persist_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Load persisted data
   */
  private async loadPersistedData(): Promise<void> {
    try {
      const persisted = storageManager.getItem("predictive_alerts");
      if (persisted && typeof persisted === "object") {
        this.alerts = persisted.alerts || [];
        this.patterns = persisted.patterns || [];
      }
    } catch (error) {
      logger.error("Failed to load persisted alerts", {
        event: "ll_alerts_load_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.acknowledged) {
      alert.acknowledged = true;
      await this.persistAlerts();
      return true;
    }
    return false;
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      await this.persistAlerts();
      return true;
    }
    return false;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PredictiveAlert[] {
    return this.alerts.filter(alert => !alert.resolved && alert.expiresAt > Date.now());
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: PredictiveAlert["severity"]): PredictiveAlert[] {
    return this.getActiveAlerts().filter(alert => alert.severity === severity);
  }

  /**
   * Get system statistics
   */
  getStats() {
    const activeAlerts = this.getActiveAlerts();
    return {
      initialized: this.initialized,
      totalAlerts: this.alerts.length,
      activeAlerts: activeAlerts.length,
      alertsBySeverity: {
        critical: activeAlerts.filter(a => a.severity === "critical").length,
        high: activeAlerts.filter(a => a.severity === "high").length,
        medium: activeAlerts.filter(a => a.severity === "medium").length,
        low: activeAlerts.filter(a => a.severity === "low").length,
      },
      patterns: this.patterns.length,
    };
  }
}

// Export singleton
export const predictiveAlertingSystem = PredictiveAlertingSystem.getInstance();
