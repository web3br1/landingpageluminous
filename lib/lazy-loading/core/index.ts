/**
 * Adaptive Rule Manager - Modularized
 * Clean separation of concerns with type safety
 */

// Re-export all types
export type {
  AdaptiveRule,
  RuleCondition,
  RuleAction,
  RulePerformance,
  AdaptiveContext,
  RuleEvaluationResult,
  RuleActionResult,
  RuleExecutionResult,
  RuleStatistics,
} from "./types";

// Re-export classes
export { RuleEngine } from "./rule-engine";
export { AdaptiveRuleManager, adaptiveRuleManager } from "./rule-manager";
