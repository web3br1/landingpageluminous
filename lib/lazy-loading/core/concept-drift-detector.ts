"use client";

import { logger } from "../../observability/logger";
import { storageManager, AtomicStorage } from "./storage-manager";

/**
 * Concept Drift Detector - Phase 3 Correction
 * Solves H3.17: Concept drift detection
 */

export interface ConceptDriftSignal {
  id: string;
  metric: string;
  baselineValue: number;
  currentValue: number;
  driftMagnitude: number; // How much it has drifted (absolute difference)
  driftDirection: "increasing" | "decreasing" | "oscillating";
  confidence: number; // 0-1, how confident we are in the drift
  timeWindow: number; // Time window over which drift was detected (ms)
  detectionMethod: "statistical" | "distributional" | "online_learning";
  severity: "low" | "medium" | "high" | "critical";
  impact: {
    affectedSystems: string[];
    businessImpact: "low" | "medium" | "high";
    userExperience: "unaffected" | "degraded" | "broken";
  };
  timestamp: number;
  metadata: Record<string, any>;
}

export interface DriftDetectionConfig {
  metric: string;
  enabled: boolean;
  sensitivity: "low" | "medium" | "high"; // How sensitive to detect drift
  timeWindow: number; // Minimum time window to consider (ms)
  minSamples: number; // Minimum samples needed for detection
  threshold: {
    statistical: number; // Z-score threshold for statistical drift
    distributional: number; // KL divergence threshold for distributional drift
    trend: number; // Minimum trend slope for online learning drift
  };
  falsePositiveProtection: {
    minConfidence: number; // Minimum confidence before flagging drift
    cooldownPeriod: number; // Don't detect drift again within this period (ms)
    requireMultipleConfirmations: boolean; // Require multiple detections
  };
}

export interface DriftBaseline {
  metric: string;
  baselineValue: number;
  standardDeviation: number;
  sampleCount: number;
  lastUpdated: number;
  confidenceInterval: [number, number]; // 95% confidence interval
  distribution: {
    mean: number;
    median: number;
    percentiles: { p25: number; p75: number; p95: number; p99: number };
  };
  trend: {
    slope: number; // Rate of change over time
    direction: "stable" | "increasing" | "decreasing";
    confidence: number;
  };
}

export interface DriftAdaptationStrategy {
  driftId: string;
  strategy: "ignore" | "alert" | "gradual_adaptation" | "immediate_adaptation" | "rollback";
  reason: string;
  affectedSystems: string[];
  adaptationSteps: AdaptationStep[];
  rollbackPlan?: RollbackPlan;
  monitoringPeriod: number; // How long to monitor after adaptation (ms)
  successCriteria: string[];
}

export interface AdaptationStep {
  order: number;
  action: string;
  target: string;
  parameters: Record<string, any>;
  rollbackAction?: string;
  estimatedImpact: number; // Expected performance impact
  riskLevel: "low" | "medium" | "high";
}

export interface RollbackPlan {
  triggerConditions: string[];
  rollbackSteps: AdaptationStep[];
  recoveryTime: number; // Expected time to rollback (ms)
  impactAssessment: string;
}

/**
 * Statistical Drift Detection
 */
class StatisticalDriftDetector {
  /**
   * Detect drift using statistical tests (Z-score, t-test)
   */
  detectStatisticalDrift(
    baseline: DriftBaseline,
    currentValues: number[],
    config: DriftDetectionConfig
  ): ConceptDriftSignal | null {
    if (currentValues.length < config.minSamples) return null;

    const currentMean = currentValues.reduce((a, b) => a + b, 0) / currentValues.length;
    const zScore = Math.abs(currentMean - baseline.baselineValue) / baseline.standardDeviation;

    if (zScore < config.threshold.statistical) return null;

    const driftMagnitude = Math.abs(currentMean - baseline.baselineValue);
    const driftDirection = currentMean > baseline.baselineValue ? "increasing" :
                          currentMean < baseline.baselineValue ? "decreasing" : "oscillating";

    // Calculate confidence based on sample size and z-score
    const confidence = Math.min(1, (zScore / 3) * (currentValues.length / config.minSamples));

    if (confidence < config.falsePositiveProtection.minConfidence) return null;

    return {
      id: `statistical_drift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metric: config.metric,
      baselineValue: baseline.baselineValue,
      currentValue: currentMean,
      driftMagnitude,
      driftDirection,
      confidence,
      timeWindow: config.timeWindow,
      detectionMethod: "statistical",
      severity: this.calculateSeverity(zScore, driftMagnitude, baseline.baselineValue),
      impact: this.assessImpact(config.metric, driftMagnitude, baseline.baselineValue),
      timestamp: Date.now(),
      metadata: {
        zScore,
        sampleSize: currentValues.length,
        standardDeviation: baseline.standardDeviation,
        method: "z_score_test",
      },
    };
  }

  /**
   * Calculate drift severity
   */
  private calculateSeverity(zScore: number, magnitude: number, baseline: number): "low" | "medium" | "high" | "critical" {
    const relativeMagnitude = Math.abs(magnitude / baseline);

    if (zScore > 5 || relativeMagnitude > 0.5) return "critical";
    if (zScore > 3 || relativeMagnitude > 0.25) return "high";
    if (zScore > 2 || relativeMagnitude > 0.15) return "medium";
    return "low";
  }

  /**
   * Assess business impact of drift
   */
  private assessImpact(metric: string, magnitude: number, baseline: number): ConceptDriftSignal["impact"] {
    const relativeMagnitude = Math.abs(magnitude / baseline);

    // Determine affected systems based on metric
    const affectedSystems = this.getAffectedSystems(metric);

    // Assess business impact
    let businessImpact: "low" | "medium" | "high" = "low";
    let userExperience: "unaffected" | "degraded" | "broken" = "unaffected";

    if (metric.includes("lcp") || metric.includes("loadTime")) {
      if (relativeMagnitude > 0.3) {
        businessImpact = "high";
        userExperience = "degraded";
      } else if (relativeMagnitude > 0.15) {
        businessImpact = "medium";
        userExperience = "degraded";
      }
    } else if (metric.includes("satisfaction") || metric.includes("bounceRate")) {
      if (relativeMagnitude > 0.2) {
        businessImpact = "high";
        userExperience = "broken";
      } else if (relativeMagnitude > 0.1) {
        businessImpact = "medium";
        userExperience = "degraded";
      }
    }

    return {
      affectedSystems,
      businessImpact,
      userExperience,
    };
  }

  /**
   * Get systems affected by a metric
   */
  private getAffectedSystems(metric: string): string[] {
    const systemMap: Record<string, string[]> = {
      "performance.lcp": ["lazy_loading", "threshold_manager", "adaptive_rules"],
      "performance.cls": ["rendering", "threshold_manager", "degradation_manager"],
      "loading.loadTime": ["lazy_loading", "cache_manager", "network_optimizer"],
      "user.satisfaction": ["adaptive_rules", "threshold_manager", "degradation_manager"],
      "user.bounceRate": ["lazy_loading", "adaptive_rules", "threshold_manager"],
      "network.rtt": ["network_optimizer", "cache_manager", "adaptive_rules"],
      "device.cpu": ["adaptive_rules", "threshold_manager", "degradation_manager"],
    };

    return systemMap[metric] || ["unknown"];
  }
}

/**
 * Distributional Drift Detection
 */
class DistributionalDriftDetector {
  /**
   * Detect drift using distribution comparison (KL divergence)
   */
  detectDistributionalDrift(
    baselineDistribution: number[],
    currentDistribution: number[],
    config: DriftDetectionConfig
  ): ConceptDriftSignal | null {
    if (baselineDistribution.length < 10 || currentDistribution.length < config.minSamples) {
      return null;
    }

    // Create histograms (simplified)
    const baselineHist = this.createHistogram(baselineDistribution, 10);
    const currentHist = this.createHistogram(currentDistribution, 10);

    // Calculate KL divergence
    const klDivergence = this.calculateKLDivergence(baselineHist, currentHist);

    if (klDivergence < config.threshold.distributional) return null;

    // Calculate confidence based on sample sizes and divergence
    const confidence = Math.min(1, klDivergence / 2 * Math.min(1, currentDistribution.length / 50));

    if (confidence < config.falsePositiveProtection.minConfidence) return null;

    const baselineMean = baselineDistribution.reduce((a, b) => a + b, 0) / baselineDistribution.length;
    const currentMean = currentDistribution.reduce((a, b) => a + b, 0) / currentDistribution.length;

    return {
      id: `distributional_drift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metric: config.metric,
      baselineValue: baselineMean,
      currentValue: currentMean,
      driftMagnitude: Math.abs(currentMean - baselineMean),
      driftDirection: currentMean > baselineMean ? "increasing" :
                     currentMean < baselineMean ? "decreasing" : "oscillating",
      confidence,
      timeWindow: config.timeWindow,
      detectionMethod: "distributional",
      severity: klDivergence > 2 ? "critical" : klDivergence > 1 ? "high" : klDivergence > 0.5 ? "medium" : "low",
      impact: {
        affectedSystems: ["distribution_analysis"],
        businessImpact: klDivergence > 1 ? "high" : "medium",
        userExperience: klDivergence > 2 ? "broken" : "degraded",
      },
      timestamp: Date.now(),
      metadata: {
        klDivergence,
        baselineSamples: baselineDistribution.length,
        currentSamples: currentDistribution.length,
        method: "kl_divergence",
      },
    };
  }

  /**
   * Create histogram from data
   */
  private createHistogram(data: number[], bins: number): number[] {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1; // Avoid division by zero
    const binWidth = range / bins;

    const histogram = new Array(bins).fill(0);

    for (const value of data) {
      const binIndex = Math.min(bins - 1, Math.floor((value - min) / binWidth));
      histogram[binIndex]++;
    }

    // Convert to probabilities
    const total = histogram.reduce((a, b) => a + b, 0);
    return histogram.map(count => count / total);
  }

  /**
   * Calculate KL divergence between two distributions
   */
  private calculateKLDivergence(p: number[], q: number[]): number {
    let divergence = 0;

    for (let i = 0; i < p.length; i++) {
      if (p[i] > 0 && q[i] > 0) {
        divergence += p[i] * Math.log(p[i] / q[i]);
      }
    }

    return divergence;
  }
}

/**
 * Online Learning Drift Detection
 */
class OnlineDriftDetector {
  private windowedData: Array<{ timestamp: number; value: number }> = [];
  private baselineSlope = 0;
  private baselineIntercept = 0;
  private baselineConfidence = 0;

  /**
   * Update baseline with new data
   */
  updateBaseline(data: Array<{ timestamp: number; value: number }>): void {
    if (data.length < 3) return;

    // Simple linear regression
    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.timestamp, 0);
    const sumY = data.reduce((sum, d) => sum + d.value, 0);
    const sumXY = data.reduce((sum, d) => sum + d.timestamp * d.value, 0);
    const sumXX = data.reduce((sum, d) => sum + d.timestamp * d.timestamp, 0);

    this.baselineSlope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    this.baselineIntercept = (sumY - this.baselineSlope * sumX) / n;

    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const ssRes = data.reduce((sum, d) => {
      const predicted = this.baselineSlope * d.timestamp + this.baselineIntercept;
      return sum + Math.pow(d.value - predicted, 2);
    }, 0);
    const ssTot = data.reduce((sum, d) => sum + Math.pow(d.value - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);

    this.baselineConfidence = Math.max(0, rSquared);
  }

  /**
   * Detect online drift using trend analysis
   */
  detectOnlineDrift(
    recentData: Array<{ timestamp: number; value: number }>,
    config: DriftDetectionConfig
  ): ConceptDriftSignal | null {
    if (recentData.length < config.minSamples) return null;

    // Calculate recent trend
    const n = recentData.length;
    const sumX = recentData.reduce((sum, d) => sum + d.timestamp, 0);
    const sumY = recentData.reduce((sum, d) => sum + d.value, 0);
    const sumXY = recentData.reduce((sum, d) => sum + d.timestamp * d.value, 0);
    const sumXX = recentData.reduce((sum, d) => sum + d.timestamp * d.timestamp, 0);

    const recentSlope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const slopeDifference = Math.abs(recentSlope - this.baselineSlope);

    if (slopeDifference < config.threshold.trend) return null;

    // Calculate confidence in the drift detection
    const confidence = Math.min(1, slopeDifference / Math.abs(this.baselineSlope || 1));

    if (confidence < config.falsePositiveProtection.minConfidence) return null;

    const currentMean = sumY / n;
    const baselineValue = this.baselineSlope * recentData[0].timestamp + this.baselineIntercept;

    return {
      id: `online_drift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metric: config.metric,
      baselineValue,
      currentValue: currentMean,
      driftMagnitude: slopeDifference,
      driftDirection: recentSlope > this.baselineSlope ? "increasing" :
                     recentSlope < this.baselineSlope ? "decreasing" : "oscillating",
      confidence,
      timeWindow: config.timeWindow,
      detectionMethod: "online_learning",
      severity: slopeDifference > 0.5 ? "high" : slopeDifference > 0.2 ? "medium" : "low",
      impact: {
        affectedSystems: ["trend_analysis", "adaptive_systems"],
        businessImpact: slopeDifference > 0.3 ? "high" : "medium",
        userExperience: slopeDifference > 0.5 ? "degraded" : "unaffected",
      },
      timestamp: Date.now(),
      metadata: {
        baselineSlope: this.baselineSlope,
        recentSlope,
        slopeDifference,
        method: "trend_analysis",
      },
    };
  }
}

/**
 * Concept Drift Detector
 */
export class ConceptDriftDetector {
  private baselines: Map<string, DriftBaseline> = new Map();
  private signals: ConceptDriftSignal[] = [];
  private statisticalDetector: StatisticalDriftDetector;
  private distributionalDetector: DistributionalDriftDetector;
  private onlineDetector: OnlineDriftDetector;
  private configs: Map<string, DriftDetectionConfig> = new Map();
  private static instance: ConceptDriftDetector;
  private initialized = false;

  constructor() {
    this.statisticalDetector = new StatisticalDriftDetector();
    this.distributionalDetector = new DistributionalDriftDetector();
    this.onlineDetector = new OnlineDriftDetector();
  }

  static getInstance(): ConceptDriftDetector {
    if (!ConceptDriftDetector.instance) {
      ConceptDriftDetector.instance = new ConceptDriftDetector();
    }
    return ConceptDriftDetector.instance;
  }

  /**
   * Initialize the drift detector
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.defineDetectionConfigs();
    await this.loadPersistedData();

    this.initialized = true;

    logger.info("Concept Drift Detector initialized", {
      event: "ll_concept_drift_detector_initialized",
      ll_configs_defined: this.configs.size,
      ll_baselines_loaded: this.baselines.size,
    });
  }

  /**
   * Define detection configurations for different metrics
   */
  private defineDetectionConfigs(): void {
    this.configs.set("performance.lcp", {
      metric: "performance.lcp",
      enabled: true,
      sensitivity: "medium",
      timeWindow: 3600000, // 1 hour
      minSamples: 20,
      threshold: {
        statistical: 2.5, // 2.5 standard deviations
        distributional: 0.5, // KL divergence
        trend: 0.1, // Minimum slope change
      },
      falsePositiveProtection: {
        minConfidence: 0.7,
        cooldownPeriod: 1800000, // 30 minutes
        requireMultipleConfirmations: true,
      },
    });

    this.configs.set("user.satisfaction", {
      metric: "user.satisfaction",
      enabled: true,
      sensitivity: "high",
      timeWindow: 7200000, // 2 hours
      minSamples: 15,
      threshold: {
        statistical: 2.0,
        distributional: 0.3,
        trend: 0.05,
      },
      falsePositiveProtection: {
        minConfidence: 0.8,
        cooldownPeriod: 3600000, // 1 hour
        requireMultipleConfirmations: true,
      },
    });

    this.configs.set("loading.cacheHitRate", {
      metric: "loading.cacheHitRate",
      enabled: true,
      sensitivity: "medium",
      timeWindow: 1800000, // 30 minutes
      minSamples: 25,
      threshold: {
        statistical: 3.0,
        distributional: 0.7,
        trend: 0.15,
      },
      falsePositiveProtection: {
        minConfidence: 0.6,
        cooldownPeriod: 900000, // 15 minutes
        requireMultipleConfirmations: false,
      },
    });

    this.configs.set("network.rtt", {
      metric: "network.rtt",
      enabled: true,
      sensitivity: "low",
      timeWindow: 900000, // 15 minutes
      minSamples: 30,
      threshold: {
        statistical: 2.0,
        distributional: 0.4,
        trend: 0.2,
      },
      falsePositiveProtection: {
        minConfidence: 0.5,
        cooldownPeriod: 600000, // 10 minutes
        requireMultipleConfirmations: false,
      },
    });
  }

  /**
   * Record a metric value for drift detection
   */
  async recordMetric(
    metric: string,
    value: number,
    context?: {
      timestamp?: number;
      sessionId?: string;
      userId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    await this.initialize();

    const timestamp = context?.timestamp || Date.now();
    const config = this.configs.get(metric);

    if (!config || !config.enabled) return;

    // Update baseline with new value
    await this.updateBaseline(metric, value, timestamp);

    // Check for drift using all detection methods
    const driftSignals = await this.detectDrift(metric, config);

    // Process detected drift signals
    for (const signal of driftSignals) {
      await this.processDriftSignal(signal);
    }

    logger.debug("Recorded metric for drift detection", {
      event: "ll_metric_recorded_drift_detection",
      ll_metric: metric,
      ll_value: value,
      ll_drift_signals: driftSignals.length,
    });
  }

  /**
   * Update baseline statistics for a metric
   */
  private async updateBaseline(metric: string, value: number, timestamp: number): Promise<void> {
    let baseline = this.baselines.get(metric);

    if (!baseline) {
      baseline = {
        metric,
        baselineValue: value,
        standardDeviation: 0,
        sampleCount: 1,
        lastUpdated: timestamp,
        confidenceInterval: [value, value],
        distribution: {
          mean: value,
          median: value,
          percentiles: { p25: value, p75: value, p95: value, p99: value },
        },
        trend: {
          slope: 0,
          direction: "stable",
          confidence: 0,
        },
      };
      this.baselines.set(metric, baseline);
    }

    // Update running statistics (simplified incremental update)
    const oldCount = baseline.sampleCount;
    const newCount = oldCount + 1;
    const oldMean = baseline.baselineValue;

    // Update mean
    baseline.baselineValue = (oldMean * oldCount + value) / newCount;

    // Update standard deviation (simplified)
    const oldVariance = baseline.standardDeviation * baseline.standardDeviation;
    const newVariance = ((oldCount - 1) * oldVariance + (value - oldMean) * (value - baseline.baselineValue)) / oldCount;
    baseline.standardDeviation = Math.sqrt(Math.max(0, newVariance));

    baseline.sampleCount = newCount;
    baseline.lastUpdated = timestamp;

    // Update confidence interval (95%)
    const zScore = 1.96;
    const margin = zScore * baseline.standardDeviation / Math.sqrt(newCount);
    baseline.confidenceInterval = [
      baseline.baselineValue - margin,
      baseline.baselineValue + margin,
    ];

    // Update distribution (simplified)
    const sortedValues = await this.getRecentValues(metric, 100);
    if (sortedValues.length > 0) {
      const sorted = sortedValues.sort((a, b) => a - b);
      baseline.distribution.mean = baseline.baselineValue;
      baseline.distribution.median = sorted[Math.floor(sorted.length / 2)];
      baseline.distribution.percentiles = {
        p25: sorted[Math.floor(sorted.length * 0.25)],
        p75: sorted[Math.floor(sorted.length * 0.75)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
      };
    }

    // Update online detector
    const recentData = await this.getRecentDataPoints(metric, 50);
    this.onlineDetector.updateBaseline(recentData);
  }

  /**
   * Detect drift using all available methods
   */
  private async detectDrift(metric: string, config: DriftDetectionConfig): Promise<ConceptDriftSignal[]> {
    const signals: ConceptDriftSignal[] = [];
    const baseline = this.baselines.get(metric);

    if (!baseline || baseline.sampleCount < config.minSamples) return signals;

    // Get recent values for detection
    const recentValues = await this.getRecentValues(metric, 50);
    const recentDataPoints = await this.getRecentDataPoints(metric, 50);

    // Statistical drift detection
    const statisticalSignal = this.statisticalDetector.detectStatisticalDrift(baseline, recentValues, config);
    if (statisticalSignal) signals.push(statisticalSignal);

    // Distributional drift detection
    const baselineDistribution = await this.getBaselineDistribution(metric, 100);
    const distributionalSignal = this.distributionalDetector.detectDistributionalDrift(
      baselineDistribution,
      recentValues,
      config
    );
    if (distributionalSignal) signals.push(distributionalSignal);

    // Online learning drift detection
    const onlineSignal = this.onlineDetector.detectOnlineDrift(recentDataPoints, config);
    if (onlineSignal) signals.push(onlineSignal);

    return signals;
  }

  /**
   * Process a detected drift signal
   */
  private async processDriftSignal(signal: ConceptDriftSignal): Promise<void> {
    // Check for false positive protection
    const config = this.configs.get(signal.metric);
    if (!config) return;

    // Cooldown check
    const recentSignals = this.signals.filter(s =>
      s.metric === signal.metric &&
      Date.now() - s.timestamp < config.falsePositiveProtection.cooldownPeriod
    );

    if (recentSignals.length > 0) {
      logger.debug("Drift signal blocked by cooldown", {
        event: "ll_drift_signal_cooldown",
        ll_metric: signal.metric,
        ll_cooldown_remaining: config.falsePositiveProtection.cooldownPeriod - (Date.now() - recentSignals[0].timestamp),
      });
      return;
    }

    // Multiple confirmations check
    if (config.falsePositiveProtection.requireMultipleConfirmations) {
      const confirmations = recentSignals.filter(s =>
        Math.abs(s.driftMagnitude - signal.driftMagnitude) / signal.driftMagnitude < 0.1
      ).length;

      if (confirmations < 2) { // Require at least 2 similar signals
        logger.debug("Drift signal requires more confirmations", {
          event: "ll_drift_signal_confirmation_pending",
          ll_metric: signal.metric,
          ll_current_confirmations: confirmations,
        });
        return;
      }
    }

    // Add to signals list
    this.signals.push(signal);

    // Keep only recent signals
    if (this.signals.length > 100) {
      this.signals = this.signals.slice(-100);
    }

    // Generate adaptation strategy
    const strategy = await this.generateAdaptationStrategy(signal);

    // Persist signal
    await this.persistSignal(signal);

    logger.warn("Concept drift detected and processed", {
      event: "ll_concept_drift_detected",
      ll_metric: signal.metric,
      ll_drift_magnitude: signal.driftMagnitude,
      ll_severity: signal.severity,
      ll_confidence: signal.confidence,
      ll_adaptation_strategy: strategy.strategy,
    });
  }

  /**
   * Generate adaptation strategy for detected drift
   */
  private async generateAdaptationStrategy(signal: ConceptDriftSignal): Promise<DriftAdaptationStrategy> {
    const strategy: DriftAdaptationStrategy = {
      driftId: signal.id,
      strategy: "gradual_adaptation",
      reason: `Detected ${signal.driftDirection} drift in ${signal.metric} with ${signal.severity} severity`,
      affectedSystems: signal.impact.affectedSystems,
      adaptationSteps: [],
      monitoringPeriod: 1800000, // 30 minutes
      successCriteria: [
        "Performance metrics return to acceptable levels",
        "User experience impact is resolved",
        "System stability is restored",
      ],
    };

    // Define adaptation steps based on metric and drift characteristics
    switch (signal.metric) {
      case "performance.lcp":
        if (signal.driftDirection === "increasing") {
          strategy.adaptationSteps = [
            {
              order: 1,
              action: "adjust_thresholds",
              target: "intersection_ratio",
              parameters: { newValue: 0.1 },
              estimatedImpact: 15,
              riskLevel: "low",
            },
            {
              order: 2,
              action: "enable_aggressive_caching",
              target: "cache_strategy",
              parameters: { strategy: "aggressive" },
              estimatedImpact: 10,
              riskLevel: "medium",
            },
          ];
        }
        break;

      case "user.satisfaction":
        if (signal.driftDirection === "decreasing") {
          strategy.adaptationSteps = [
            {
              order: 1,
              action: "reduce_degradation_level",
              target: "degradation_manager",
              parameters: { targetLevel: "progressive" },
              estimatedImpact: 20,
              riskLevel: "medium",
            },
          ];
        }
        break;

      case "loading.cacheHitRate":
        if (signal.driftDirection === "decreasing") {
          strategy.adaptationSteps = [
            {
              order: 1,
              action: "optimize_cache_strategy",
              target: "cache_manager",
              parameters: { strategy: "predictive" },
              estimatedImpact: 25,
              riskLevel: "low",
            },
          ];
        }
        break;
    }

    // Define rollback plan
    strategy.rollbackPlan = {
      triggerConditions: [
        "Performance degradation persists after adaptation",
        "User experience impact increases",
        "System becomes unstable",
      ],
      rollbackSteps: strategy.adaptationSteps.map(step => ({
        ...step,
        rollbackAction: this.getRollbackAction(step.action),
      })),
      recoveryTime: 300000, // 5 minutes
      impactAssessment: "Minimal impact expected from rollback to previous state",
    };

    return strategy;
  }

  /**
   * Get rollback action for an adaptation action
   */
  private getRollbackAction(action: string): string {
    const rollbackMap: Record<string, string> = {
      "adjust_thresholds": "restore_previous_thresholds",
      "enable_aggressive_caching": "restore_previous_cache_strategy",
      "reduce_degradation_level": "restore_previous_degradation_level",
      "optimize_cache_strategy": "restore_previous_cache_strategy",
    };

    return rollbackMap[action] || "general_rollback";
  }

  /**
   * Helper methods for data retrieval
   */
  private async getRecentValues(metric: string, count: number): Promise<number[]> {
    // This would query actual metric data from storage
    // For now, return mock data
    return Array.from({ length: count }, () => Math.random() * 100);
  }

  private async getRecentDataPoints(metric: string, count: number): Promise<Array<{ timestamp: number; value: number }>> {
    // This would query actual time-series data
    // For now, return mock data
    const now = Date.now();
    return Array.from({ length: count }, (_, i) => ({
      timestamp: now - (count - i) * 60000, // 1 minute intervals
      value: Math.random() * 100,
    }));
  }

  private async getBaselineDistribution(metric: string, count: number): Promise<number[]> {
    // This would get historical baseline data
    // For now, return mock data
    return Array.from({ length: count }, () => Math.random() * 100);
  }

  /**
   * Persist drift signal
   */
  private async persistSignal(signal: ConceptDriftSignal): Promise<void> {
    try {
      const signals = storageManager.getItem("drift_signals") || [];
      signals.push(signal);

      // Keep only last 200 signals
      if (signals.length > 200) {
        signals.splice(0, signals.length - 200);
      }

      await AtomicStorage.atomicUpdate(
        "drift_signals",
        () => signals,
        []
      );
    } catch (error) {
      logger.error("Failed to persist drift signal", {
        event: "ll_drift_signal_persist_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Load persisted data
   */
  private async loadPersistedData(): Promise<void> {
    try {
      const persistedSignals = storageManager.getItem("drift_signals");
      if (persistedSignals) {
        this.signals = persistedSignals;
      }
    } catch (error) {
      logger.error("Failed to load persisted drift data", {
        event: "ll_drift_data_load_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get detector statistics
   */
  getStats() {
    const recentSignals = this.signals.filter(s => Date.now() - s.timestamp < 86400000); // Last 24 hours

    return {
      initialized: this.initialized,
      baselines: this.baselines.size,
      totalSignals: this.signals.length,
      recentSignals: recentSignals.length,
      signalsBySeverity: {
        critical: recentSignals.filter(s => s.severity === "critical").length,
        high: recentSignals.filter(s => s.severity === "high").length,
        medium: recentSignals.filter(s => s.severity === "medium").length,
        low: recentSignals.filter(s => s.severity === "low").length,
      },
      configs: this.configs.size,
    };
  }

  /**
   * Get recent drift signals
   */
  getRecentSignals(limit = 10): ConceptDriftSignal[] {
    return this.signals.slice(-limit);
  }

  /**
   * Force drift detection for testing
   */
  async forceDriftDetection(metric: string, testValues: number[]): Promise<ConceptDriftSignal[]> {
    const config = this.configs.get(metric);
    if (!config) return [];

    // Temporarily update baseline for testing
    const originalBaseline = this.baselines.get(metric);
    const testBaseline: DriftBaseline = {
      metric,
      baselineValue: 50, // Mock baseline
      standardDeviation: 10,
      sampleCount: 100,
      lastUpdated: Date.now() - 3600000,
      confidenceInterval: [30, 70],
      distribution: {
        mean: 50,
        median: 50,
        percentiles: { p25: 40, p75: 60, p95: 80, p99: 90 },
      },
      trend: {
        slope: 0,
        direction: "stable",
        confidence: 0.8,
      },
    };

    this.baselines.set(metric, testBaseline);

    const signals = await this.detectDrift(metric, config);

    // Restore original baseline
    if (originalBaseline) {
      this.baselines.set(metric, originalBaseline);
    } else {
      this.baselines.delete(metric);
    }

    return signals;
  }
}

// Export singleton
export const conceptDriftDetector = ConceptDriftDetector.getInstance();
