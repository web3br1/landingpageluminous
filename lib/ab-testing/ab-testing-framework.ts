// ===== ADVANCED A/B TESTING FRAMEWORK =====
// Comprehensive experimentation system with statistical analysis

import React, { useState, useEffect, useCallback } from "react";
import { logger } from "../logger";
import {
  realUserMonitoring,
  trackRUMEvent,
} from "../monitoring/real-user-monitoring";

// ===== TYPES & INTERFACES =====

export interface ExperimentVariant {
  id: string;
  name: string;
  weight: number;
  config: Record<string, any>;
  isControl?: boolean;
}

export interface ExperimentDefinition {
  id: string;
  name: string;
  description: string;
  status: "draft" | "running" | "paused" | "completed";
  variants: ExperimentVariant[];
  targetAudience?: {
    segments?: string[];
    countries?: string[];
    devices?: ("mobile" | "tablet" | "desktop")[];
    userTypes?: string[];
  };
  goals: {
    primary: ExperimentGoal;
    secondary?: ExperimentGoal[];
  };
  startDate?: Date;
  endDate?: Date;
  sampleSize?: number;
  confidenceLevel?: number; // 0.8, 0.9, 0.95, 0.99
  minimumDetectableEffect?: number; // percentage
}

export interface ExperimentGoal {
  id: string;
  name: string;
  type: "conversion" | "engagement" | "revenue" | "custom";
  metric: string;
  target?: number;
  direction: "increase" | "decrease"; // whether higher values are better
}

export interface ExperimentResult {
  experimentId: string;
  variantId: string;
  metrics: {
    [goalId: string]: {
      value: number;
      confidence: number;
      statisticalSignificance: boolean;
      improvement: number; // percentage change from control
      sampleSize: number;
      conversion: number;
    };
  };
  winner?: string;
  confidence: number;
  recommendedAction: "continue" | "stop" | "declare_winner";
}

export interface ExperimentSession {
  experimentId: string;
  variantId: string;
  sessionId: string;
  userId?: string;
  startTime: number;
  events: ExperimentEvent[];
}

export interface ExperimentEvent {
  type: string;
  metric: string;
  value: number;
  timestamp: number;
  context?: Record<string, any>;
}

export interface ABTestingConfig {
  enabled: boolean;
  storageKey: string;
  cookieDomain?: string;
  cookieExpires: number;
  trackingEndpoint?: string;
  statisticalEngine: "frequentist" | "bayesian";
  defaultConfidenceLevel: number;
  minimumSampleSize: number;
}

// ===== STATISTICAL ENGINE =====

class StatisticalEngine {
  private static instance: StatisticalEngine;

  static getInstance(): StatisticalEngine {
    if (!StatisticalEngine.instance) {
      StatisticalEngine.instance = new StatisticalEngine();
    }
    return StatisticalEngine.instance;
  }

  // Calculate statistical significance using chi-square test
  calculateSignificance(
    controlConversions: number,
    controlVisitors: number,
    variantConversions: number,
    variantVisitors: number,
  ): {
    pValue: number;
    confidence: number;
    significant: boolean;
    relativeImprovement: number;
  } {
    // Chi-square test for conversion rates
    const controlRate = controlConversions / controlVisitors;
    const variantRate = variantConversions / variantVisitors;

    const relativeImprovement =
      ((variantRate - controlRate) / controlRate) * 100;

    // Calculate chi-square statistic
    const expectedControl =
      (controlConversions + variantConversions) *
      (controlVisitors / (controlVisitors + variantVisitors));
    const expectedVariant =
      (controlConversions + variantConversions) *
      (variantVisitors / (controlVisitors + variantVisitors));

    const chiSquare =
      Math.pow(controlConversions - expectedControl, 2) / expectedControl +
      Math.pow(variantConversions - expectedVariant, 2) / expectedVariant;

    // Approximate p-value (simplified)
    const degreesOfFreedom = 1;
    const pValue = this.approximateChiSquarePValue(chiSquare, degreesOfFreedom);

    const confidence = 1 - pValue;
    const significant = pValue < 0.05; // 95% confidence level

    return {
      pValue,
      confidence,
      significant,
      relativeImprovement,
    };
  }

  private approximateChiSquarePValue(chiSquare: number, df: number): number {
    // Simplified chi-square p-value approximation
    // In production, you'd use a proper statistical library
    if (df === 1) {
      // For 1 degree of freedom, use normal approximation
      const z = Math.sqrt(chiSquare) - Math.sqrt(df - 0.5);
      return 1 - this.normalCDF(z);
    }
    return 0.5; // Conservative approximation
  }

  private normalCDF(x: number): number {
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
    const y =
      1.0 -
      ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  // Calculate required sample size for statistical power
  calculateRequiredSampleSize(
    baselineConversion: number,
    minimumDetectableEffect: number,
    confidenceLevel: number = 0.95,
    power: number = 0.8,
  ): number {
    // Simplified sample size calculation
    const zAlpha = this.getZScore(confidenceLevel);
    const zBeta = this.getZScore(power);

    const effect = (baselineConversion * minimumDetectableEffect) / 100;
    const variance = baselineConversion * (1 - baselineConversion);

    const numerator = Math.pow(zAlpha + zBeta, 2) * 2 * variance;
    const denominator = Math.pow(effect, 2);

    return Math.ceil(numerator / denominator);
  }

  private getZScore(confidenceLevel: number): number {
    // Common z-scores
    const zScores: Record<number, number> = {
      0.8: 1.282,
      0.85: 1.44,
      0.9: 1.645,
      0.95: 1.96,
      0.99: 2.576,
      0.999: 3.291,
    };
    return zScores[confidenceLevel] || 1.96;
  }
}

// ===== EXPERIMENT MANAGER =====

class ExperimentManager {
  private static instance: ExperimentManager | null = null;
  private experiments: Map<string, ExperimentDefinition> = new Map();
  private sessions: Map<string, ExperimentSession> = new Map();
  private results: Map<string, ExperimentResult[]> = new Map();
  private isClientSide = false;

  private constructor() {
    // Check if we're on the client side
    if (typeof window !== "undefined") {
      this.isClientSide = true;
    }
  }

  private isSSR(): boolean {
    return typeof window === "undefined";
  }

  static getInstance(): ExperimentManager {
    if (!ExperimentManager.instance) {
      ExperimentManager.instance = new ExperimentManager();
    }
    return ExperimentManager.instance;
  }

  // Test utility method to reset singleton (only available in test environment)
  static resetInstance(): void {
    if (process.env.NODE_ENV === "test") {
      ExperimentManager.instance = null;
    }
  }

  // Load experiment definitions from registry
  async loadExperiments(): Promise<void> {
    try {
      // Import the experiments registry dynamically to avoid circular dependencies
      const { ALL_EXPERIMENTS } = await import(
        "../experiments/experiments-registry"
      );

      Object.values(ALL_EXPERIMENTS).forEach((exp) => {
        this.experiments.set(exp.id, exp);
      });

      logger.info("Loaded experiments from registry", {
        count: Object.keys(ALL_EXPERIMENTS).length,
        active: Object.values(ALL_EXPERIMENTS).filter(
          (exp) => exp.status === "running",
        ).length,
      });
    } catch (error) {
      logger.error("Failed to load experiments from registry", { error });
      // Fallback to empty experiments if registry fails
      logger.warn("Using empty experiment set as fallback");
    }
  }

  // Get active experiments for a user
  getActiveExperiments(userContext?: {
    userId?: string;
    segments?: string[];
    country?: string;
    device?: string;
  }): ExperimentDefinition[] {
    return Array.from(this.experiments.values())
      .filter((exp) => exp.status === "running")
      .filter((exp) => this.matchesTargetAudience(exp, userContext));
  }

  private matchesTargetAudience(
    experiment: ExperimentDefinition,
    userContext?: {
      userId?: string;
      segments?: string[];
      country?: string;
      device?: string;
    },
  ): boolean {
    if (!experiment.targetAudience) return true;

    const audience = experiment.targetAudience;

    // Check segments
    if (audience.segments && userContext?.segments) {
      const hasMatchingSegment = audience.segments.some((segment) =>
        userContext.segments!.includes(segment),
      );
      if (!hasMatchingSegment) return false;
    }

    // Check countries
    if (audience.countries && userContext?.country) {
      if (!audience.countries.includes(userContext.country)) return false;
    }

    // Check devices
    if (audience.devices && userContext?.device) {
      const deviceType = this.getDeviceType(userContext.device);
      if (!audience.devices.includes(deviceType)) return false;
    }

    return true;
  }

  private getDeviceType(userAgent: string): "mobile" | "tablet" | "desktop" {
    if (/Mobi|Android/i.test(userAgent)) return "mobile";
    if (/Tablet|iPad/i.test(userAgent)) return "tablet";
    return "desktop";
  }

  // Assign user to experiment variant
  assignVariant(
    experimentId: string,
    userId?: string,
  ): ExperimentVariant | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== "running") return null;

    // During SSR, return control variant to avoid hydration mismatches
    if (this.isSSR()) {
      const controlVariant =
        experiment.variants.find((v) => v.isControl) || experiment.variants[0];
      // Don't start session during SSR
      return controlVariant;
    }

    // Use user ID for consistent assignment, or generate random for anonymous users
    const seed = userId || this.getAnonymousId();
    const hash = this.simpleHash(seed + experimentId);
    const random = (hash % 100) / 100;

    let cumulativeWeight = 0;
    for (const variant of experiment.variants) {
      cumulativeWeight += variant.weight / 100;
      if (random <= cumulativeWeight) {
        // Start tracking session
        this.startExperimentSession(experimentId, variant.id, userId);
        return variant;
      }
    }

    // Fallback to first variant
    const fallbackVariant = experiment.variants[0];
    this.startExperimentSession(experimentId, fallbackVariant.id, userId);
    return fallbackVariant;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private getAnonymousId(): string {
    if (!this.isClientSide) {
      // On server side, generate a temporary ID
      return "server_" + Math.random().toString(36).substring(2);
    }

    const key = "ab_testing_anonymous_id";
    let id =
      typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
    if (!id) {
      id = Math.random().toString(36).substring(2) + Date.now().toString(36);
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(key, id);
      }
    }
    return id!;
  }

  private startExperimentSession(
    experimentId: string,
    variantId: string,
    userId?: string,
  ): void {
    const sessionId = this.generateSessionId();
    const session: ExperimentSession = {
      experimentId,
      variantId,
      sessionId,
      userId,
      startTime: Date.now(),
      events: [],
    };

    this.sessions.set(sessionId, session);

    // Track assignment event
    this.trackEvent(experimentId, variantId, "assignment", 1, {
      sessionId,
      userId,
    });
  }

  private generateSessionId(): string {
    return (
      "session_" +
      Math.random().toString(36).substring(2) +
      Date.now().toString(36)
    );
  }

  // Track experiment events
  trackEvent(
    experimentId: string,
    variantId: string,
    eventType: string,
    value: number = 1,
    context?: Record<string, any>,
  ): void {
    // Skip tracking during SSR to avoid hydration issues
    if (this.isSSR()) {
      return;
    }

    // Find active session for this experiment
    const sessionKey = Array.from(this.sessions.keys()).find((key) => {
      const session = this.sessions.get(key);
      return session?.experimentId === experimentId;
    });

    if (!sessionKey) {
      // Create session if it doesn't exist (for events that happen before assignment)
      this.startExperimentSession(experimentId, variantId);
      return this.trackEvent(
        experimentId,
        variantId,
        eventType,
        value,
        context,
      );
    }

    const session = this.sessions.get(sessionKey);
    if (!session) return;

    const event: ExperimentEvent = {
      type: eventType,
      metric: eventType,
      value,
      timestamp: Date.now(),
      context,
    };

    session.events.push(event);

    // Send to RUM for real-time tracking
    trackRUMEvent("experiment_event", {
      experimentId,
      variantId,
      eventType,
      value,
      context,
    });

    // Check for goal completion
    const experiment = this.experiments.get(experimentId);
    if (experiment) {
      this.checkGoalCompletion(experiment, session, event);
    }
  }

  private checkGoalCompletion(
    experiment: ExperimentDefinition,
    session: ExperimentSession,
    event: ExperimentEvent,
  ): void {
    // Check primary goal
    if (event.type === experiment.goals.primary.metric) {
      // Goal completed - could trigger notifications or auto-advancement
      logger.info("Experiment goal completed", {
        experimentId: experiment.id,
        variantId: session.variantId,
        goal: experiment.goals.primary.id,
      });
    }

    // Check secondary goals
    experiment.goals.secondary?.forEach((goal) => {
      if (event.type === goal.metric) {
        logger.info("Secondary goal completed", {
          experimentId: experiment.id,
          variantId: session.variantId,
          goal: goal.id,
        });
      }
    });
  }

  // Calculate experiment results
  calculateResults(experimentId: string): ExperimentResult[] {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return [];

    const statisticalEngine = StatisticalEngine.getInstance();
    const results: ExperimentResult[] = [];

    // Group sessions by variant
    const variantData: Record<
      string,
      { conversions: number; visitors: number; events: ExperimentEvent[] }
    > = {};

    this.sessions.forEach((session) => {
      if (session.experimentId !== experimentId) return;

      if (!variantData[session.variantId]) {
        variantData[session.variantId] = {
          conversions: 0,
          visitors: 0,
          events: [],
        };
      }

      variantData[session.variantId].visitors++;
      variantData[session.variantId].events.push(...session.events);

      // Count conversions for primary goal
      const hasConversion = session.events.some(
        (event) =>
          event.type === experiment.goals.primary.metric && event.value > 0,
      );
      if (hasConversion) {
        variantData[session.variantId].conversions++;
      }
    });

    // Find control variant
    const controlVariant = experiment.variants.find((v) => v.isControl);
    if (!controlVariant || !variantData[controlVariant.id]) return [];

    const controlData = variantData[controlVariant.id];

    // Calculate results for each variant
    experiment.variants.forEach((variant) => {
      if (variant.id === controlVariant.id) return; // Skip control

      const variantResult = variantData[variant.id];
      if (!variantResult) return;

      const stats = statisticalEngine.calculateSignificance(
        controlData.conversions,
        controlData.visitors,
        variantResult.conversions,
        variantResult.visitors,
      );

      const result: ExperimentResult = {
        experimentId,
        variantId: variant.id,
        metrics: {
          [experiment.goals.primary.id]: {
            value: variantResult.conversions / variantResult.visitors,
            confidence: stats.confidence,
            statisticalSignificance: stats.significant,
            improvement: stats.relativeImprovement,
            sampleSize: variantResult.visitors,
            conversion: variantResult.conversions,
          },
        },
        confidence: stats.confidence,
        recommendedAction: this.getRecommendedAction(
          stats,
          experiment,
          variantResult.visitors,
        ),
      };

      results.push(result);
    });

    return results;
  }

  private getRecommendedAction(
    stats: {
      significant: boolean;
      confidence: number;
      relativeImprovement: number;
    },
    experiment: ExperimentDefinition,
    sampleSize: number,
  ): "continue" | "stop" | "declare_winner" {
    const minSampleSize = experiment.sampleSize || 1000;

    if (sampleSize < minSampleSize) {
      return "continue"; // Need more data
    }

    if (stats.significant && stats.relativeImprovement > 0) {
      return "declare_winner"; // Clear winner
    }

    if (stats.significant && stats.relativeImprovement < -5) {
      return "stop"; // Significantly worse, stop the test
    }

    if (stats.confidence > 0.95) {
      return stats.relativeImprovement > 0 ? "declare_winner" : "stop";
    }

    return "continue"; // Keep running
  }

  // Get experiment status
  getExperimentStatus(experimentId: string): {
    experiment: ExperimentDefinition;
    results: ExperimentResult[];
    totalVisitors: number;
    daysRunning: number;
  } | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    const results = this.calculateResults(experimentId);
    const totalVisitors = Array.from(this.sessions.values()).filter(
      (s) => s.experimentId === experimentId,
    ).length;

    const daysRunning = experiment.startDate
      ? Math.floor(
          (Date.now() - experiment.startDate.getTime()) / (1000 * 60 * 60 * 24),
        )
      : 0;

    return {
      experiment,
      results,
      totalVisitors,
      daysRunning,
    };
  }
}

// ===== REACT HOOKS =====

export function useExperiment(
  experimentId: string,
  userContext?: {
    userId?: string;
    segments?: string[];
    country?: string;
    device?: string;
  },
) {
  const [variant, setVariant] = useState<ExperimentVariant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const assignVariant = async () => {
      const manager = ExperimentManager.getInstance();
      await manager.loadExperiments();

      const assignedVariant = manager.assignVariant(
        experimentId,
        userContext?.userId,
      );
      setVariant(assignedVariant);
      setLoading(false);
    };

    assignVariant();
  }, [experimentId, userContext?.userId]);

  const trackEvent = useCallback(
    (eventType: string, value: number = 1, context?: Record<string, any>) => {
      if (variant) {
        const manager = ExperimentManager.getInstance();
        manager.trackEvent(experimentId, variant.id, eventType, value, context);
      }
    },
    [experimentId, variant],
  );

  return {
    variant,
    loading,
    trackEvent,
    isControl: variant?.isControl || false,
  };
}

export function useExperimentResults(experimentId: string) {
  const [results, setResults] = useState<ExperimentResult[]>([]);
  const [status, setStatus] = useState<any>(null);

  const refresh = useCallback(() => {
    const manager = ExperimentManager.getInstance();
    const experimentResults = manager.calculateResults(experimentId);
    const experimentStatus = manager.getExperimentStatus(experimentId);

    setResults(experimentResults);
    setStatus(experimentStatus);
  }, [experimentId]);

  useEffect(() => {
    refresh();
    // Refresh every 30 seconds
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return {
    results,
    status,
    refresh,
  };
}

// ===== EXPORTS =====

export const experimentManager = ExperimentManager.getInstance();
export const statisticalEngine = StatisticalEngine.getInstance();
export { ExperimentManager, StatisticalEngine };
