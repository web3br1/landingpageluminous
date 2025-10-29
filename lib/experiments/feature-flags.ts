// Feature flags and experiment management system

import type {
  Experiment,
  ExperimentVariant,
  FeatureFlag,
  UserExperiment,
} from "./types";
import { logger } from "@/lib/logger";

// ===== EXPERIMENT LOGGING HELPERS =====

interface ExperimentLogContext {
  experimentId: string;
  variantId?: string;
  userId?: string;
  sessionId?: string;
  assignmentMethod?: "consistent-hash" | "random" | "rule-based" | "fallback";
  confidence?: number;
  conversionType?: string;
  conversionValue?: number;
  funnelStep?: number;
  timeToConvert?: number;
  metadata?: Record<string, any>;
  traceId?: string;
}

function logExperimentAssignment(context: ExperimentLogContext): void {
  logger.info("Experiment assignment", {
    event: "experiment_assignment",
    experimentId: context.experimentId,
    variantId: context.variantId,
    userId: context.userId,
    sessionId: context.sessionId,
    assignmentMethod: context.assignmentMethod,
    confidence: context.confidence,
    traceId: context.traceId || generateExperimentTraceId(),
  });
}

function logExperimentExposure(context: ExperimentLogContext): void {
  logger.info("Experiment exposure", {
    event: "experiment_exposure",
    experimentId: context.experimentId,
    variantId: context.variantId,
    userId: context.userId,
    sessionId: context.sessionId,
    traceId: context.traceId || generateExperimentTraceId(),
  });
}

function logExperimentConversion(context: ExperimentLogContext): void {
  logger.info("Experiment conversion", {
    event: "experiment_conversion",
    experimentId: context.experimentId,
    variantId: context.variantId,
    conversionType: context.conversionType,
    conversionValue: context.conversionValue,
    funnelStep: context.funnelStep,
    timeToConvert: context.timeToConvert,
    userId: context.userId,
    sessionId: context.sessionId,
    traceId: context.traceId || generateExperimentTraceId(),
    ...context.metadata,
  });
}

function logExperimentAnalysis(context: {
  experimentId: string;
  analysisType: "statistical" | "revenue" | "engagement";
  winner?: string;
  confidence?: number;
  improvement?: number;
  sampleSize?: number;
  pValue?: number;
  recommendations?: string[];
  traceId?: string;
}): void {
  logger.info("Experiment analysis completed", {
    event: "experiment_analysis",
    experimentId: context.experimentId,
    analysisType: context.analysisType,
    winner: context.winner,
    confidence: context.confidence,
    improvement: context.improvement,
    sampleSize: context.sampleSize,
    pValue: context.pValue,
    recommendations: context.recommendations,
    traceId: context.traceId || generateExperimentTraceId(),
  });
}

function logFeatureFlagUsage(context: {
  flagId: string;
  enabled: boolean;
  rolloutPercentage?: number;
  userId?: string;
  sessionId?: string;
  conditions?: Record<string, any>;
  traceId?: string;
  evaluationTime?: number;
  cacheHit?: boolean;
  ruleMatches?: string[];
  ruleFailures?: string[];
}): void {
  logger.info("Feature flag evaluated", {
    event: "feature_flag_usage",
    flagId: context.flagId,
    enabled: context.enabled,
    rolloutPercentage: context.rolloutPercentage,
    userId: context.userId,
    sessionId: context.sessionId,
    conditions: context.conditions,
    evaluationTime: context.evaluationTime,
    cacheHit: context.cacheHit,
    ruleMatches: context.ruleMatches,
    ruleFailures: context.ruleFailures,
    traceId: context.traceId || generateExperimentTraceId(),
  });
}

function logFeatureFlagRollout(context: {
  flagId: string;
  rolloutPercentage: number;
  targetPercentage: number;
  currentAdoption: number;
  timeToRollout: number;
  estimatedCompletion: string;
  traceId?: string;
}): void {
  logger.info("Feature flag rollout progress", {
    event: "feature_flag_rollout",
    flagId: context.flagId,
    rolloutPercentage: context.rolloutPercentage,
    targetPercentage: context.targetPercentage,
    currentAdoption: context.currentAdoption,
    timeToRollout: context.timeToRollout,
    estimatedCompletion: context.estimatedCompletion,
    rolloutPhase:
      context.rolloutPercentage < 25
        ? "pilot"
        : context.rolloutPercentage < 50
          ? "gradual"
          : context.rolloutPercentage < 100
            ? "majority"
            : "complete",
    traceId: context.traceId || generateExperimentTraceId(),
  });
}

function logFeatureFlagImpact(context: {
  flagId: string;
  metric: string;
  baselineValue: number;
  variantValue: number;
  improvement: number;
  confidence: number;
  sampleSize: number;
  duration: number;
  traceId?: string;
}): void {
  logger.info("Feature flag impact analysis", {
    event: "feature_flag_impact",
    flagId: context.flagId,
    metric: context.metric,
    baselineValue: context.baselineValue,
    variantValue: context.variantValue,
    improvement: context.improvement,
    improvementType:
      context.improvement > 0
        ? "positive"
        : context.improvement < 0
          ? "negative"
          : "neutral",
    confidence: context.confidence,
    sampleSize: context.sampleSize,
    duration: context.duration,
    traceId: context.traceId || generateExperimentTraceId(),
  });
}

function logFeatureFlagError(context: {
  flagId: string;
  error: string;
  operation: "evaluation" | "rollout" | "analysis";
  userId?: string;
  sessionId?: string;
  traceId?: string;
}): void {
  logger.error("Feature flag error", {
    event: "feature_flag_error",
    flagId: context.flagId,
    error: context.error,
    operation: context.operation,
    userId: context.userId,
    sessionId: context.sessionId,
    traceId: context.traceId || generateExperimentTraceId(),
  });
}

function generateExperimentTraceId(): string {
  return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// In-memory storage for development - replace with database in production
const experiments: Map<string, Experiment> = new Map();
const featureFlags: Map<string, FeatureFlag> = new Map();
const userAssignments: Map<string, UserExperiment[]> = new Map();

// Initialize with built-in experiments
import { BUILT_IN_EXPERIMENTS } from "./types";
Object.values(BUILT_IN_EXPERIMENTS).forEach((exp) => {
  experiments.set(exp.id, { ...exp, status: "running" });
});

/**
 * Get user ID from session/request
 * In production, this would come from authentication/session
 */
export function getUserId(): string | undefined {
  // For demo purposes, use sessionStorage or generate random ID
  if (typeof window !== "undefined") {
    let userId = sessionStorage.getItem("experiment_user_id");
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("experiment_user_id", userId);
    }
    return userId;
  }
  return undefined;
}

/**
 * Get session ID
 */
export function getSessionId(): string {
  if (typeof window !== "undefined") {
    let sessionId = sessionStorage.getItem("experiment_session_id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("experiment_session_id", sessionId);
    }
    return sessionId;
  }
  return "server_session";
}

/**
 * Assign user to experiment variant using consistent hashing
 */
export function assignVariant(experimentId: string, userId?: string): string {
  const traceId = generateExperimentTraceId();
  const experiment = experiments.get(experimentId);

  if (!experiment || experiment.status !== "running") {
    logExperimentAssignment({
      experimentId,
      variantId: "control",
      userId,
      sessionId: getSessionId(),
      assignmentMethod: "rule-based",
      traceId,
    });
    return "control";
  }

  const sessionId = getSessionId();
  const identifier = userId || sessionId;

  // Check if user already assigned
  const existingAssignments = userAssignments.get(identifier) || [];
  const existing = existingAssignments.find(
    (a) => a.experimentId === experimentId,
  );
  if (existing) {
    logExperimentExposure({
      experimentId,
      variantId: existing.variantId,
      userId,
      sessionId,
      traceId,
    });
    return existing.variantId;
  }

  // Simple weighted random assignment
  const random = simpleHash(identifier + experimentId) % 100;
  let cumulativeWeight = 0;

  for (const variant of experiment.variants) {
    cumulativeWeight += variant.weight;
    if (random < cumulativeWeight) {
      const assignment: UserExperiment = {
        experimentId,
        variantId: variant.id,
        assignedAt: new Date(),
        sessionId,
        userId,
      };

      existingAssignments.push(assignment);
      userAssignments.set(identifier, existingAssignments);

      logExperimentAssignment({
        experimentId,
        variantId: variant.id,
        userId,
        sessionId,
        assignmentMethod: "consistent-hash",
        confidence: variant.weight / 100,
        traceId,
      });

      return variant.id;
    }
  }

  const fallbackVariant = experiment.variants[0]?.id || "control";
  logExperimentAssignment({
    experimentId,
    variantId: fallbackVariant,
    userId,
    sessionId,
    assignmentMethod: "rule-based",
    traceId,
  });

  return fallbackVariant;
}

/**
 * Simple hash function for consistent assignment
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Check if feature flag is enabled for user
 */
export function isFeatureEnabled(flagId: string, userId?: string): boolean {
  const traceId = generateExperimentTraceId();
  const startTime = performance.now();
  const sessionId = getSessionId();

  const flag = featureFlags.get(flagId);

  if (!flag) {
    const evaluationTime = performance.now() - startTime;
    logFeatureFlagUsage({
      flagId,
      enabled: false,
      userId,
      sessionId,
      evaluationTime,
      cacheHit: false,
      traceId,
    });
    return false;
  }

  if (!flag.enabled) {
    const evaluationTime = performance.now() - startTime;
    logFeatureFlagUsage({
      flagId,
      enabled: false,
      rolloutPercentage: flag.rolloutPercentage,
      userId,
      sessionId,
      conditions: flag.conditions,
      evaluationTime,
      cacheHit: false,
      ruleFailures: ["flag_disabled"],
      traceId,
    });
    return false;
  }

  // Check rollout percentage
  if (flag.rolloutPercentage < 100) {
    const identifier = userId || sessionId;
    const hash = simpleHash(identifier + flagId) % 100;
    const enabled = hash < flag.rolloutPercentage;
    const evaluationTime = performance.now() - startTime;

    logFeatureFlagUsage({
      flagId,
      enabled,
      rolloutPercentage: flag.rolloutPercentage,
      userId,
      sessionId,
      conditions: flag.conditions,
      evaluationTime,
      cacheHit: false,
      ruleMatches: enabled ? ["rollout_percentage"] : [],
      ruleFailures: enabled ? [] : ["rollout_percentage"],
      traceId,
    });

    if (!enabled) return false;
  }

  // Check conditions
  if (flag.conditions) {
    // Add condition checking logic here if needed
    // For now, assume conditions pass
    const evaluationTime = performance.now() - startTime;
    logFeatureFlagUsage({
      flagId,
      enabled: true,
      rolloutPercentage: flag.rolloutPercentage,
      userId,
      sessionId,
      conditions: flag.conditions,
      evaluationTime,
      cacheHit: false,
      ruleMatches: ["conditions_met"],
      traceId,
    });
  }

  const evaluationTime = performance.now() - startTime;
  logFeatureFlagUsage({
    flagId,
    enabled: true,
    rolloutPercentage: flag.rolloutPercentage,
    userId,
    sessionId,
    conditions: flag.conditions,
    evaluationTime,
    cacheHit: false,
    ruleMatches: ["all_checks_passed"],
    traceId,
  });

  return true;
}

/**
 * Get experiment variant for user
 */
export function getExperimentVariant(
  experimentId: string,
  userId?: string,
): string {
  return assignVariant(experimentId, userId);
}

/**
 * Track experiment event
 */
export function trackExperimentEvent(
  experimentId: string,
  variantId: string,
  eventType: "view" | "click" | "convert" | "custom",
  eventName?: string,
  metadata?: Record<string, any>,
): void {
  const event = {
    experimentId,
    variantId,
    eventType,
    eventName,
    userId: getUserId(),
    sessionId: getSessionId(),
    timestamp: new Date(),
    metadata,
  };

  // In production, send to analytics service
  console.log("Experiment event:", event);

  // Could integrate with analytics providers like:
  // - Google Analytics 4
  // - Mixpanel
  // - Amplitude
  // - Custom analytics API
}

/**
 * Admin functions for managing experiments
 */
export const admin = {
  createExperiment: (experiment: Experiment) => {
    experiments.set(experiment.id, experiment);
  },

  updateExperiment: (id: string, updates: Partial<Experiment>) => {
    const existing = experiments.get(id);
    if (existing) {
      experiments.set(id, { ...existing, ...updates });
    }
  },

  deleteExperiment: (id: string) => {
    experiments.delete(id);
  },

  getExperiment: (id: string) => experiments.get(id),

  getAllExperiments: () => Array.from(experiments.values()),

  createFeatureFlag: (flag: FeatureFlag) => {
    featureFlags.set(flag.id, flag);
  },

  updateFeatureFlag: (id: string, updates: Partial<FeatureFlag>) => {
    const existing = featureFlags.get(id);
    if (existing) {
      featureFlags.set(id, { ...existing, ...updates });
    }
  },

  deleteFeatureFlag: (id: string) => {
    featureFlags.delete(id);
  },

  getFeatureFlag: (id: string) => featureFlags.get(id),

  getAllFeatureFlags: () => Array.from(featureFlags.values()),
};

// Export for use in components
export { experiments, featureFlags };
