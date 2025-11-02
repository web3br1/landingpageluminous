/**
 * Adaptive Rule Manager Types
 * Centralized type definitions for the adaptive rule system
 */

export interface AdaptiveRule {
  id: string;
  name: string;
  description: string;
  version: string;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  confidence: number; // 0-1, how confident we are in this rule
  performance: RulePerformance;
  metadata: {
    createdAt: number;
    updatedAt: number;
    activationCount: number;
    successCount: number;
    failureCount: number;
    lastActivated?: number;
  };
}

export interface RuleCondition {
  type: "threshold" | "metric" | "context" | "temporal" | "experiment";
  operator: "eq" | "gt" | "lt" | "gte" | "lte" | "between" | "in" | "contains";
  property: string;
  value: unknown; // Changed from any to unknown for type safety
  weight: number; // How important this condition is (0-1)
}

export interface RuleAction {
  type: "set_strategy" | "adjust_threshold" | "enable_feature" | "log_metric";
  target: string;
  value: unknown; // Changed from any to unknown for type safety
  confidence: number; // Confidence in this action working
}

export interface RulePerformance {
  successRate: number; // 0-1
  avgImprovement: number; // Average performance improvement
  avgExecutionTime: number; // Average time to execute
  reliability: number; // 0-1, how reliable this rule is
  lastEvaluated?: number;
}

export interface AdaptiveContext {
  // Performance metrics
  lcp?: number;
  cls?: number;
  inp?: number;
  ttfb?: number;

  // Network context
  effectiveType?: string;
  downlink?: number;
  rtt?: number;

  // Device context
  hardwareConcurrency?: number;
  deviceMemory?: number;
  isLowPowerMode?: boolean;

  // User context
  scrollDepth: number;
  timeSpent: number;
  interactionCount: number;

  // Temporal context
  hourOfDay: number;
  dayOfWeek: number;
  isWeekend: boolean;

  // Experiment context
  experimentVariant?: string;
  featureFlags: Record<string, boolean>;
}

export interface RuleEvaluationResult {
  rule: AdaptiveRule;
  matched: boolean;
  matchScore: number; // 0-1
  confidence: number; // 0-1
  matchedConditions: RuleCondition[];
  failedConditions: RuleCondition[];
}

export interface RuleActionResult {
  type: string;
  target: string;
  value: unknown;
  success: boolean;
  executionTime: number;
  error?: string;
}

export interface RuleExecutionResult {
  ruleId: string;
  success: boolean;
  executionTime: number;
  actions: RuleActionResult[];
  confidence: number;
  improvement: number;
}

export interface RuleStatistics {
  totalRules: number;
  avgConfidence: number;
  avgSuccessRate: number;
  totalActivations: number;
  rulesByPriority: Record<number, number>;
}
