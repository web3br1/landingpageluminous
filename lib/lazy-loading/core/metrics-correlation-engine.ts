"use client";

import { logger } from "../../observability/logger";
import { storageManager, AtomicStorage } from "./storage-manager";

/**
 * Metrics Correlation Engine - Phase 3 Correction
 * Solves H3.11: Métricas correlacionadas (multi-dimensional performance correlation)
 */

export interface MetricSample {
  timestamp: number;
  sessionId: string;
  context: MetricContext;
  performance: PerformanceMetrics;
  loading: LoadingMetrics;
  user: UserMetrics;
  environment: EnvironmentMetrics;
}

export interface MetricContext {
  sectionId: string;
  loadingStrategy: string;
  thresholdValues: Record<string, number>;
  ruleActivations: string[];
  experimentVariant?: string;
}

export interface PerformanceMetrics {
  lcp?: number;
  cls?: number;
  inp?: number;
  ttfb?: number;
  fcp?: number;
  domContentLoaded?: number;
  loadComplete?: number;
  firstByte?: number;
  domInteractive?: number;
}

export interface LoadingMetrics {
  sectionsLoaded: number;
  sectionsFailed: number;
  totalLoadTime: number;
  averageLoadTime: number;
  cacheHitRate: number;
  adaptiveActions: number;
  ruleActivations: number;
  thresholdAdjustments: number;
}

export interface UserMetrics {
  timeSpent: number;
  scrollDepth: number;
  interactionCount: number;
  engagement: "low" | "medium" | "high";
  satisfaction?: number; // 0-1 scale
  conversionActions: number;
}

export interface EnvironmentMetrics {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  isLowPowerMode?: boolean;
  viewportWidth: number;
  viewportHeight: number;
  pixelRatio: number;
}

/**
 * Correlation Analysis Results
 */
export interface CorrelationResult {
  metricA: string;
  metricB: string;
  correlation: number; // -1 to 1 (Pearson correlation)
  confidence: number; // 0-1
  sampleSize: number;
  significance: number; // p-value
  isSignificant: boolean;
  strength: "weak" | "moderate" | "strong" | "very_strong";
  direction: "positive" | "negative" | "none";
  impact: "high" | "medium" | "low";
}

export interface CausalInsight {
  cause: string;
  effect: string;
  strength: number; // 0-1
  confidence: number; // 0-1
  mechanisms: string[]; // How the cause leads to effect
  evidence: CorrelationResult[];
  actionable: boolean;
  recommendation?: string;
}

export interface OptimizationOpportunity {
  type: "threshold" | "strategy" | "rule" | "feature";
  target: string;
  currentValue: any;
  recommendedValue: any;
  expectedImpact: number; // Expected improvement percentage
  confidence: number;
  rationale: string;
  causalInsights: CausalInsight[];
  riskLevel: "low" | "medium" | "high";
}

/**
 * Statistical Analysis Utilities
 */
class StatisticalAnalyzer {
  /**
   * Calculate Pearson correlation coefficient
   */
  static pearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length < 2) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate statistical significance (p-value approximation)
   */
  static calculateSignificance(correlation: number, sampleSize: number): number {
    if (sampleSize < 3) return 1; // Not significant

    // t-statistic for correlation
    const t = Math.abs(correlation) * Math.sqrt((sampleSize - 2) / (1 - correlation * correlation));

    // Approximate p-value using t-distribution (simplified)
    // For large samples, this approximates normal distribution
    if (sampleSize > 30) {
      // Use normal approximation
      const z = t;
      // Two-tailed p-value
      return 2 * (1 - this.normalCDF(Math.abs(z)));
    } else {
      // Use t-distribution approximation (simplified)
      return Math.max(0.001, 2 * (1 - this.studentTApprox(t, sampleSize - 2)));
    }
  }

  /**
   * Normal cumulative distribution function approximation
   */
  private static normalCDF(x: number): number {
    // Abramowitz & Stegun approximation
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2.0);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  /**
   * Student's t distribution CDF approximation (simplified)
   */
  private static studentTApprox(t: number, df: number): number {
    // Simplified approximation for correlation significance
    // This is not perfect but good enough for our use case
    const z = t / Math.sqrt(1 + t * t / df);
    return this.normalCDF(z);
  }

  /**
   * Determine correlation strength
   */
  static getCorrelationStrength(correlation: number): "weak" | "moderate" | "strong" | "very_strong" {
    const absCorr = Math.abs(correlation);
    if (absCorr < 0.3) return "weak";
    if (absCorr < 0.5) return "moderate";
    if (absCorr < 0.7) return "strong";
    return "very_strong";
  }

  /**
   * Determine correlation direction
   */
  static getCorrelationDirection(correlation: number): "positive" | "negative" | "none" {
    if (correlation > 0.1) return "positive";
    if (correlation < -0.1) return "negative";
    return "none";
  }

  /**
   * Calculate confidence interval for correlation
   */
  static getConfidenceInterval(correlation: number, sampleSize: number, confidence = 0.95): [number, number] {
    if (sampleSize < 3) return [correlation, correlation];

    // Fisher transformation
    const z = 0.5 * Math.log((1 + correlation) / (1 - correlation));
    const se = 1 / Math.sqrt(sampleSize - 3);

    // z-score for confidence level
    const zScore = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.576 : 1.645;

    const lowerZ = z - zScore * se;
    const upperZ = z + zScore * se;

    // Inverse Fisher transformation
    const lowerCorr = (Math.exp(2 * lowerZ) - 1) / (Math.exp(2 * lowerZ) + 1);
    const upperCorr = (Math.exp(2 * upperZ) - 1) / (Math.exp(2 * upperZ) + 1);

    return [lowerCorr, upperCorr];
  }
}

/**
 * Metrics Correlation Engine
 */
export class MetricsCorrelationEngine {
  private samples: MetricSample[] = [];
  private correlations: Map<string, CorrelationResult> = new Map();
  private causalInsights: CausalInsight[] = [];
  private static instance: MetricsCorrelationEngine;
  private initialized = false;

  constructor() {
    this.samples = [];
    this.correlations = new Map();
    this.causalInsights = [];
  }

  static getInstance(): MetricsCorrelationEngine {
    if (!MetricsCorrelationEngine.instance) {
      MetricsCorrelationEngine.instance = new MetricsCorrelationEngine();
    }
    return MetricsCorrelationEngine.instance;
  }

  /**
   * Initialize the engine
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.loadPersistedData();

    this.initialized = true;

    logger.info("Metrics Correlation Engine initialized", {
      event: "ll_metrics_correlation_initialized",
      ll_samples_loaded: this.samples.length,
    });
  }

  /**
   * Add a new metric sample
   */
  async addSample(sample: MetricSample): Promise<void> {
    await this.initialize();

    this.samples.push(sample);

    // Keep only last 1000 samples to prevent memory issues
    if (this.samples.length > 1000) {
      this.samples = this.samples.slice(-1000);
    }

    // Update correlations incrementally
    await this.updateCorrelations();

    // Persist updated data
    await this.persistData();

    logger.debug("Added metric sample", {
      event: "ll_metric_sample_added",
      ll_session_id: sample.sessionId,
      ll_section_id: sample.context.sectionId,
      ll_total_samples: this.samples.length,
    });
  }

  /**
   * Update correlation analysis
   */
  private async updateCorrelations(): Promise<void> {
    if (this.samples.length < 10) return; // Need minimum samples for meaningful correlation

    const metricPairs = this.generateMetricPairs();
    const newCorrelations: Map<string, CorrelationResult> = new Map();

    for (const [metricA, metricB] of metricPairs) {
      const valuesA = this.extractMetricValues(metricA);
      const valuesB = this.extractMetricValues(metricB);

      if (valuesA.length >= 10 && valuesB.length >= 10) {
        const correlation = StatisticalAnalyzer.pearsonCorrelation(valuesA, valuesB);
        const significance = StatisticalAnalyzer.calculateSignificance(correlation, valuesA.length);
        const isSignificant = significance < 0.05; // 95% confidence

        const result: CorrelationResult = {
          metricA,
          metricB,
          correlation,
          confidence: Math.max(0, 1 - significance), // Convert p-value to confidence
          sampleSize: valuesA.length,
          significance,
          isSignificant,
          strength: StatisticalAnalyzer.getCorrelationStrength(correlation),
          direction: StatisticalAnalyzer.getCorrelationDirection(correlation),
          impact: this.calculateImpact(metricA, metricB, correlation),
        };

        const key = `${metricA}:${metricB}`;
        newCorrelations.set(key, result);
      }
    }

    this.correlations = newCorrelations;

    // Generate causal insights from correlations
    await this.generateCausalInsights();

    logger.debug("Updated metric correlations", {
      event: "ll_correlations_updated",
      ll_correlations_calculated: this.correlations.size,
      ll_causal_insights: this.causalInsights.length,
    });
  }

  /**
   * Generate pairs of metrics to correlate
   */
  private generateMetricPairs(): [string, string][] {
    const performanceMetrics = [
      "lcp", "cls", "inp", "ttfb", "fcp", "domContentLoaded", "loadComplete"
    ];

    const loadingMetrics = [
      "sectionsLoaded", "sectionsFailed", "totalLoadTime", "averageLoadTime",
      "cacheHitRate", "adaptiveActions", "ruleActivations", "thresholdAdjustments"
    ];

    const userMetrics = [
      "timeSpent", "scrollDepth", "interactionCount", "satisfaction", "conversionActions"
    ];

    const environmentMetrics = [
      "downlink", "rtt", "hardwareConcurrency", "deviceMemory", "viewportWidth"
    ];

    const pairs: [string, string][] = [];

    // Cross-correlate all metric categories
    const allMetrics = [
      ...performanceMetrics.map(m => `performance.${m}`),
      ...loadingMetrics.map(m => `loading.${m}`),
      ...userMetrics.map(m => `user.${m}`),
      ...environmentMetrics.map(m => `environment.${m}`),
    ];

    // Generate pairs (avoid duplicates and self-correlation)
    for (let i = 0; i < allMetrics.length; i++) {
      for (let j = i + 1; j < allMetrics.length; j++) {
        pairs.push([allMetrics[i], allMetrics[j]]);
      }
    }

    return pairs.slice(0, 100); // Limit to prevent excessive computation
  }

  /**
   * Extract values for a specific metric from all samples
   */
  private extractMetricValues(metricPath: string): number[] {
    return this.samples
      .map(sample => this.getMetricValue(sample, metricPath))
      .filter((value): value is number => typeof value === "number" && !isNaN(value));
  }

  /**
   * Get metric value from sample using dot notation
   */
  private getMetricValue(sample: MetricSample, path: string): number | undefined {
    const parts = path.split(".");
    let value: any = sample;

    for (const part of parts) {
      if (value && typeof value === "object") {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return typeof value === "number" ? value : undefined;
  }

  /**
   * Calculate business impact of correlation
   */
  private calculateImpact(metricA: string, metricB: string, correlation: number): "high" | "medium" | "low" {
    const absCorr = Math.abs(correlation);

    // High impact correlations
    if ((metricA.includes("lcp") || metricA.includes("cls") || metricA.includes("inp")) &&
        (metricB.includes("satisfaction") || metricB.includes("conversion"))) {
      return absCorr > 0.5 ? "high" : "medium";
    }

    // Medium impact correlations
    if ((metricA.includes("loadTime") || metricA.includes("cacheHitRate")) &&
        (metricB.includes("satisfaction") || metricB.includes("timeSpent"))) {
      return absCorr > 0.4 ? "medium" : "low";
    }

    // Default impact
    return absCorr > 0.6 ? "medium" : "low";
  }

  /**
   * Generate causal insights from correlations
   */
  private async generateCausalInsights(): Promise<void> {
    const insights: CausalInsight[] = [];

    // Insight 1: Network speed affects loading performance
    const networkLoadingInsight = this.generateNetworkLoadingInsight();
    if (networkLoadingInsight) insights.push(networkLoadingInsight);

    // Insight 2: Loading strategy affects user satisfaction
    const strategySatisfactionInsight = this.generateStrategySatisfactionInsight();
    if (strategySatisfactionInsight) insights.push(strategySatisfactionInsight);

    // Insight 3: Device capabilities affect performance
    const devicePerformanceInsight = this.generateDevicePerformanceInsight();
    if (devicePerformanceInsight) insights.push(devicePerformanceInsight);

    // Insight 4: User engagement patterns
    const engagementPatternInsight = this.generateEngagementPatternInsight();
    if (engagementPatternInsight) insights.push(engagementPatternInsight);

    this.causalInsights = insights;
  }

  private generateNetworkLoadingInsight(): CausalInsight | null {
    const correlations = [
      this.correlations.get("environment.downlink:loading.totalLoadTime"),
      this.correlations.get("environment.rtt:loading.averageLoadTime"),
      this.correlations.get("environment.effectiveType:performance.lcp"),
    ].filter(Boolean) as CorrelationResult[];

    if (correlations.length < 2) return null;

    const avgCorrelation = correlations.reduce((sum, c) => sum + Math.abs(c.correlation), 0) / correlations.length;
    const avgConfidence = correlations.reduce((sum, c) => sum + c.confidence, 0) / correlations.length;

    if (avgCorrelation < 0.3 || avgConfidence < 0.7) return null;

    return {
      cause: "Network conditions (speed, latency)",
      effect: "Loading performance and user experience",
      strength: avgCorrelation,
      confidence: avgConfidence,
      mechanisms: [
        "Slow networks increase loading times",
        "High latency delays resource fetching",
        "Poor connectivity causes timeouts and retries"
      ],
      evidence: correlations,
      actionable: true,
      recommendation: "Implement adaptive loading strategies based on network conditions",
    };
  }

  private generateStrategySatisfactionInsight(): CausalInsight | null {
    const correlations = [
      this.correlations.get("loading.adaptiveActions:user.satisfaction"),
      this.correlations.get("loading.ruleActivations:user.timeSpent"),
      this.correlations.get("loading.thresholdAdjustments:user.interactionCount"),
    ].filter(Boolean) as CorrelationResult[];

    if (correlations.length === 0) return null;

    const avgCorrelation = correlations.reduce((sum, c) => sum + Math.abs(c.correlation), 0) / correlations.length;
    const avgConfidence = correlations.reduce((sum, c) => sum + c.confidence, 0) / correlations.length;

    return {
      cause: "Adaptive loading strategies",
      effect: "User satisfaction and engagement",
      strength: avgCorrelation,
      confidence: avgConfidence,
      mechanisms: [
        "Personalized loading improves perceived performance",
        "Context-aware strategies reduce frustration",
        "Progressive enhancement matches user expectations"
      ],
      evidence: correlations,
      actionable: true,
      recommendation: "Continue optimizing adaptive loading based on user feedback",
    };
  }

  private generateDevicePerformanceInsight(): CausalInsight | null {
    const correlations = [
      this.correlations.get("environment.hardwareConcurrency:loading.totalLoadTime"),
      this.correlations.get("environment.deviceMemory:performance.lcp"),
      this.correlations.get("environment.isLowPowerMode:loading.adaptiveActions"),
    ].filter(Boolean) as CorrelationResult[];

    if (correlations.length === 0) return null;

    const avgCorrelation = correlations.reduce((sum, c) => sum + Math.abs(c.correlation), 0) / correlations.length;
    const avgConfidence = correlations.reduce((sum, c) => sum + c.confidence, 0) / correlations.length;

    return {
      cause: "Device capabilities (CPU, memory, power)",
      effect: "Loading performance and strategy effectiveness",
      strength: avgCorrelation,
      confidence: avgConfidence,
      mechanisms: [
        "Low-end devices need simpler loading strategies",
        "Limited resources affect parallel loading",
        "Power constraints require conservative approaches"
      ],
      evidence: correlations,
      actionable: true,
      recommendation: "Implement device-aware loading strategies",
    };
  }

  private generateEngagementPatternInsight(): CausalInsight | null {
    const correlations = [
      this.correlations.get("user.timeSpent:loading.sectionsLoaded"),
      this.correlations.get("user.scrollDepth:user.interactionCount"),
      this.correlations.get("user.engagement:performance.cls"),
    ].filter(Boolean) as CorrelationResult[];

    if (correlations.length === 0) return null;

    const avgCorrelation = correlations.reduce((sum, c) => sum + Math.abs(c.correlation), 0) / correlations.length;
    const avgConfidence = correlations.reduce((sum, c) => sum + c.confidence, 0) / correlations.length;

    return {
      cause: "User engagement patterns",
      effect: "Loading strategy effectiveness",
      strength: avgCorrelation,
      confidence: avgConfidence,
      mechanisms: [
        "Engaged users tolerate more aggressive loading",
        "High engagement correlates with better device capabilities",
        "User behavior indicates loading tolerance levels"
      ],
      evidence: correlations,
      actionable: true,
      recommendation: "Use engagement signals to adjust loading aggressiveness",
    };
  }

  /**
   * Generate optimization opportunities
   */
  async generateOptimizationOpportunities(): Promise<OptimizationOpportunity[]> {
    await this.initialize();

    const opportunities: OptimizationOpportunity[] = [];

    // Analyze threshold optimizations
    const thresholdOpportunities = await this.analyzeThresholdOptimizations();
    opportunities.push(...thresholdOpportunities);

    // Analyze strategy optimizations
    const strategyOpportunities = await this.analyzeStrategyOptimizations();
    opportunities.push(...strategyOpportunities);

    // Analyze rule optimizations
    const ruleOpportunities = await this.analyzeRuleOptimizations();
    opportunities.push(...ruleOpportunities);

    // Sort by expected impact
    opportunities.sort((a, b) => b.expectedImpact - a.expectedImpact);

    logger.info("Generated optimization opportunities", {
      event: "ll_optimization_opportunities_generated",
      ll_opportunities_count: opportunities.length,
      ll_top_impact: opportunities[0]?.expectedImpact || 0,
    });

    return opportunities;
  }

  private async analyzeThresholdOptimizations(): Promise<OptimizationOpportunity[]> {
    const opportunities: OptimizationOpportunity[] = [];

    // Analyze intersection ratio threshold
    const intersectionCorr = this.correlations.get("loading.totalLoadTime:user.satisfaction");
    if (intersectionCorr && intersectionCorr.isSignificant && intersectionCorr.correlation < -0.3) {
      opportunities.push({
        type: "threshold",
        target: "intersection_ratio",
        currentValue: 0.3,
        recommendedValue: 0.1, // More aggressive loading
        expectedImpact: Math.abs(intersectionCorr.correlation) * 15, // Estimated 15% max improvement
        confidence: intersectionCorr.confidence,
        rationale: "Faster loading correlates with higher user satisfaction",
        causalInsights: this.causalInsights.filter(i => i.effect.includes("satisfaction")),
        riskLevel: "medium",
      });
    }

    return opportunities;
  }

  private async analyzeStrategyOptimizations(): Promise<OptimizationOpportunity[]> {
    const opportunities: OptimizationOpportunity[] = [];

    // Analyze loading strategy effectiveness
    const strategyCorr = this.correlations.get("loading.adaptiveActions:performance.lcp");
    if (strategyCorr && strategyCorr.isSignificant && strategyCorr.correlation < -0.2) {
      opportunities.push({
        type: "strategy",
        target: "loading_strategy",
        currentValue: "progressive",
        recommendedValue: "adaptive",
        expectedImpact: Math.abs(strategyCorr.correlation) * 20,
        confidence: strategyCorr.confidence,
        rationale: "Adaptive strategies improve loading performance",
        causalInsights: this.causalInsights.filter(i => i.cause.includes("strategy")),
        riskLevel: "low",
      });
    }

    return opportunities;
  }

  private async analyzeRuleOptimizations(): Promise<OptimizationOpportunity[]> {
    const opportunities: OptimizationOpportunity[] = [];

    // Analyze rule activation impact
    const ruleCorr = this.correlations.get("loading.ruleActivations:user.timeSpent");
    if (ruleCorr && ruleCorr.isSignificant && ruleCorr.correlation > 0.3) {
      opportunities.push({
        type: "rule",
        target: "rule_activation_frequency",
        currentValue: "moderate",
        recommendedValue: "high",
        expectedImpact: ruleCorr.correlation * 10,
        confidence: ruleCorr.confidence,
        rationale: "More rule activations correlate with better user engagement",
        causalInsights: this.causalInsights.filter(i => i.mechanisms.some(m => m.includes("rule"))),
        riskLevel: "medium",
      });
    }

    return opportunities;
  }

  /**
   * Get correlation between two specific metrics
   */
  getCorrelation(metricA: string, metricB: string): CorrelationResult | null {
    const key1 = `${metricA}:${metricB}`;
    const key2 = `${metricB}:${metricA}`;

    return this.correlations.get(key1) || this.correlations.get(key2) || null;
  }

  /**
   * Get causal insights
   */
  getCausalInsights(): CausalInsight[] {
    return [...this.causalInsights];
  }

  /**
   * Persist correlation data
   */
  private async persistData(): Promise<void> {
    try {
      // Persist only recent samples and correlations
      const recentSamples = this.samples.slice(-100);
      const correlationData = Array.from(this.correlations.entries());

      await AtomicStorage.atomicUpdate(
        "metrics_correlation_data",
        () => ({
          samples: recentSamples,
          correlations: correlationData,
          causalInsights: this.causalInsights,
          lastUpdated: Date.now(),
        }),
        {}
      );
    } catch (error) {
      logger.error("Failed to persist correlation data", {
        event: "ll_correlation_persist_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Load persisted data
   */
  private async loadPersistedData(): Promise<void> {
    try {
      const persisted = storageManager.getItem("metrics_correlation_data");
      if (persisted && typeof persisted === "object") {
        this.samples = persisted.samples || [];
        this.correlations = new Map(persisted.correlations || []);
        this.causalInsights = persisted.causalInsights || [];
      }
    } catch (error) {
      logger.error("Failed to load persisted correlation data", {
        event: "ll_correlation_load_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get engine statistics
   */
  getStats() {
    return {
      initialized: this.initialized,
      samples: this.samples.length,
      correlations: this.correlations.size,
      causalInsights: this.causalInsights.length,
      avgSampleAge: this.samples.length > 0 ?
        (Date.now() - this.samples.reduce((sum, s) => sum + s.timestamp, 0) / this.samples.length) / 1000 : 0,
    };
  }
}

// Export singleton
export const metricsCorrelationEngine = MetricsCorrelationEngine.getInstance();
