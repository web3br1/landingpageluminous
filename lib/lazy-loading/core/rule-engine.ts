/**
 * Rule Engine - Core evaluation logic
 * Handles rule matching and performance tracking
 */

import { logger } from "../../observability/logger";
import type {
  AdaptiveRule,
  AdaptiveContext,
  RuleEvaluationResult,
  RuleCondition,
  RuleStatistics
} from "./types";

export class RuleEngine {
  private rules: Map<string, AdaptiveRule> = new Map();
  private ruleVersions: Map<string, string[]> = new Map(); // ruleId -> versions

  /**
   * Add or update a rule
   */
  addRule(rule: AdaptiveRule): void {
    const existing = this.rules.get(rule.id);

    if (existing) {
      // Update version history
      const versions = this.ruleVersions.get(rule.id) || [];
      if (!versions.includes(existing.version)) {
        versions.push(existing.version);
        this.ruleVersions.set(rule.id, versions);
      }

      // Update metadata
      rule.metadata.createdAt = existing.metadata.createdAt;
      rule.metadata.updatedAt = Date.now();
      rule.metadata.activationCount = existing.metadata.activationCount;
      rule.metadata.successCount = existing.metadata.successCount;
      rule.metadata.failureCount = existing.metadata.failureCount;
    }

    this.rules.set(rule.id, rule);

    logger.info("Added adaptive rule", {
      event: "ll_adaptive_rule_added",
      ll_rule_id: rule.id,
      ll_rule_version: rule.version,
      ll_rule_confidence: rule.confidence,
    });
  }

  /**
   * Evaluate rules against context
   */
  evaluateRules(context: AdaptiveContext): RuleEvaluationResult[] {
    const results: RuleEvaluationResult[] = [];

    for (const rule of this.rules.values()) {
      const evaluation = this.evaluateRule(rule, context);
      if (evaluation.matched) {
        results.push(evaluation);
      }
    }

    // Sort by priority and confidence
    results.sort((a, b) => {
      if (Math.abs(a.rule.priority - b.rule.priority) > 0.1) {
        return b.rule.priority - a.rule.priority; // Higher priority first
      }
      return b.rule.confidence - a.rule.confidence; // Higher confidence first
    });

    return results;
  }

  /**
   * Evaluate single rule
   */
  private evaluateRule(rule: AdaptiveRule, context: AdaptiveContext): RuleEvaluationResult {
    let totalScore = 0;
    let totalWeight = 0;
    const matchedConditions: RuleCondition[] = [];
    const failedConditions: RuleCondition[] = [];

    for (const condition of rule.conditions) {
      const matches = this.evaluateCondition(condition, context);
      const weight = condition.weight;

      if (matches) {
        matchedConditions.push(condition);
        totalScore += weight;
      } else {
        failedConditions.push(condition);
      }

      totalWeight += weight;
    }

    const matchScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    const matched = matchScore >= 0.8; // 80% of conditions must match

    return {
      rule,
      matched,
      matchScore,
      confidence: rule.confidence * matchScore, // Combined confidence
      matchedConditions,
      failedConditions,
    };
  }

  /**
   * Evaluate single condition
   */
  private evaluateCondition(condition: RuleCondition, context: AdaptiveContext): boolean {
    const propertyValue = this.getPropertyValue(condition.property, context);

    switch (condition.operator) {
      case "eq":
        return propertyValue === condition.value;
      case "gt":
        return typeof propertyValue === "number" && propertyValue > (condition.value as number);
      case "lt":
        return typeof propertyValue === "number" && propertyValue < (condition.value as number);
      case "gte":
        return typeof propertyValue === "number" && propertyValue >= (condition.value as number);
      case "lte":
        return typeof propertyValue === "number" && propertyValue <= (condition.value as number);
      case "between":
        return typeof propertyValue === "number" &&
               Array.isArray(condition.value) &&
               propertyValue >= (condition.value[0] as number) &&
               propertyValue <= (condition.value[1] as number);
      case "in":
        return Array.isArray(condition.value) && condition.value.includes(propertyValue);
      case "contains":
        return typeof propertyValue === "string" && propertyValue.includes(condition.value as string);
      default:
        return false;
    }
  }

  /**
   * Get property value from context
   */
  private getPropertyValue(property: string, context: AdaptiveContext): unknown {
    const path = property.split(".");
    let value: unknown = context;

    for (const segment of path) {
      if (value && typeof value === "object" && value !== null) {
        value = (value as Record<string, unknown>)[segment];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Update rule performance after execution
   */
  updateRulePerformance(ruleId: string, success: boolean, improvement: number, executionTime: number): void {
    const rule = this.rules.get(ruleId);
    if (!rule) return;

    rule.metadata.activationCount++;
    rule.metadata.lastActivated = Date.now();

    if (success) {
      rule.metadata.successCount++;
    } else {
      rule.metadata.failureCount++;
    }

    // Update performance metrics
    const totalActivations = rule.metadata.activationCount;
    rule.performance.successRate = rule.metadata.successCount / totalActivations;
    rule.performance.avgImprovement =
      (rule.performance.avgImprovement * (totalActivations - 1) + improvement) / totalActivations;
    rule.performance.avgExecutionTime =
      (rule.performance.avgExecutionTime * (totalActivations - 1) + executionTime) / totalActivations;
    rule.performance.reliability = Math.min(1, rule.performance.successRate * 0.8 + 0.2); // Some baseline reliability
    rule.performance.lastEvaluated = Date.now();

    // Update rule confidence based on performance
    rule.confidence = Math.min(1, rule.performance.successRate * rule.performance.reliability);

    logger.debug("Updated rule performance", {
      event: "ll_rule_performance_updated",
      ll_rule_id: ruleId,
      ll_success: success,
      ll_improvement: improvement,
      ll_new_confidence: rule.confidence,
    });
  }

  /**
   * Get rules statistics
   */
  getRulesStats(): RuleStatistics {
    const stats: RuleStatistics = {
      totalRules: this.rules.size,
      avgConfidence: 0,
      avgSuccessRate: 0,
      totalActivations: 0,
      rulesByPriority: {},
    };

    let totalConfidence = 0;
    let totalSuccessRate = 0;

    for (const rule of this.rules.values()) {
      totalConfidence += rule.confidence;
      totalSuccessRate += rule.performance.successRate;
      stats.totalActivations += rule.metadata.activationCount;

      const priority = Math.floor(rule.priority);
      stats.rulesByPriority[priority] = (stats.rulesByPriority[priority] || 0) + 1;
    }

    stats.avgConfidence = stats.totalRules > 0 ? totalConfidence / stats.totalRules : 0;
    stats.avgSuccessRate = stats.totalRules > 0 ? totalSuccessRate / stats.totalRules : 0;

    return stats;
  }
}
