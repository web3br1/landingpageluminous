/**
 * Adaptive Rule Manager - Main orchestration class
 * Manages rule lifecycle and provides high-level API
 */

import { logger } from "../../observability/logger";
import { storageManager, AtomicStorage } from "./storage-manager";
import { RuleEngine } from "./rule-engine";
import type {
  AdaptiveRule,
  AdaptiveContext,
  RuleEvaluationResult,
  RuleExecutionResult,
  RuleActionResult
} from "./types";

export class AdaptiveRuleManager {
  private engine: RuleEngine;
  private static instance: AdaptiveRuleManager;
  private isInitialized = false;

  constructor() {
    this.engine = new RuleEngine();
  }

  static getInstance(): AdaptiveRuleManager {
    if (!AdaptiveRuleManager.instance) {
      AdaptiveRuleManager.instance = new AdaptiveRuleManager();
    }
    return AdaptiveRuleManager.instance;
  }

  /**
   * Initialize with default rules
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.loadPersistedRules();
    this.createDefaultRules();

    this.isInitialized = true;

    logger.info("Adaptive Rule Manager initialized", {
      event: "ll_adaptive_manager_initialized",
      ll_rules_count: this.engine.getRulesStats().totalRules,
    });
  }

  /**
   * Load rules from persistent storage
   */
  private async loadPersistedRules(): Promise<void> {
    try {
      const persistedRules = storageManager.getItem("adaptive_rules");
      if (persistedRules && Array.isArray(persistedRules)) {
        for (const rule of persistedRules) {
          this.engine.addRule(rule);
        }

        logger.info("Loaded persisted adaptive rules", {
          event: "ll_persisted_rules_loaded",
          ll_rules_loaded: persistedRules.length,
        });
      }
    } catch (error) {
      logger.error("Failed to load persisted rules", {
        event: "ll_persisted_rules_load_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Create default rules for common scenarios
   */
  private createDefaultRules(): void {
    // Rule 1: Slow network -> Conservative loading
    this.engine.addRule({
      id: "slow_network_conservative",
      name: "Slow Network Conservative Loading",
      description: "Use conservative loading strategy for slow networks",
      version: "1.0.0",
      priority: 9,
      conditions: [
        {
          type: "context",
          operator: "in",
          property: "effectiveType",
          value: ["slow-2g", "2g"],
          weight: 0.8,
        },
        {
          type: "metric",
          operator: "gt",
          property: "rtt",
          value: 500,
          weight: 0.6,
        },
      ],
      actions: [
        {
          type: "set_strategy",
          target: "loadingStrategy",
          value: "conservative",
          confidence: 0.9,
        },
        {
          type: "adjust_threshold",
          target: "intersectionRatio",
          value: 0.8, // Wait for 80% visibility
          confidence: 0.8,
        },
      ],
      confidence: 0.85,
      performance: {
        successRate: 0.85,
        avgImprovement: 15, // 15% improvement in perceived performance
        avgExecutionTime: 5,
        reliability: 0.9,
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        activationCount: 0,
        successCount: 0,
        failureCount: 0,
      },
    });

    // Rule 2: Low power mode -> Minimal loading
    this.engine.addRule({
      id: "low_power_minimal",
      name: "Low Power Minimal Loading",
      description: "Minimize loading on low power devices",
      version: "1.0.0",
      priority: 8,
      conditions: [
        {
          type: "context",
          operator: "eq",
          property: "isLowPowerMode",
          value: true,
          weight: 0.9,
        },
        {
          type: "context",
          operator: "lt",
          property: "hardwareConcurrency",
          value: 4,
          weight: 0.7,
        },
      ],
      actions: [
        {
          type: "set_strategy",
          target: "loadingStrategy",
          value: "minimal",
          confidence: 0.95,
        },
        {
          type: "enable_feature",
          target: "lazyLoading",
          value: false, // Disable lazy loading entirely
          confidence: 0.9,
        },
      ],
      confidence: 0.9,
      performance: {
        successRate: 0.9,
        avgImprovement: 25, // 25% battery savings
        avgExecutionTime: 3,
        reliability: 0.95,
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        activationCount: 0,
        successCount: 0,
        failureCount: 0,
      },
    });

    // Rule 3: High engagement -> Aggressive loading
    this.engine.addRule({
      id: "high_engagement_aggressive",
      name: "High Engagement Aggressive Loading",
      description: "Load aggressively when user shows high engagement",
      version: "1.0.0",
      priority: 7,
      conditions: [
        {
          type: "context",
          operator: "gt",
          property: "timeSpent",
          value: 60, // 1 minute
          weight: 0.6,
        },
        {
          type: "context",
          operator: "gt",
          property: "scrollDepth",
          value: 50, // 50% scroll depth
          weight: 0.7,
        },
        {
          type: "context",
          operator: "gt",
          property: "interactionCount",
          value: 5,
          weight: 0.5,
        },
      ],
      actions: [
        {
          type: "set_strategy",
          target: "loadingStrategy",
          value: "aggressive",
          confidence: 0.8,
        },
        {
          type: "adjust_threshold",
          target: "intersectionRatio",
          value: 0.1, // Load at 10% visibility
          confidence: 0.85,
        },
      ],
      confidence: 0.75,
      performance: {
        successRate: 0.75,
        avgImprovement: -10, // Slight performance cost but better UX
        avgExecutionTime: 8,
        reliability: 0.8,
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        activationCount: 0,
        successCount: 0,
        failureCount: 0,
      },
    });

    logger.info("Created default adaptive rules", {
      event: "ll_default_rules_created",
      ll_default_rules_count: 3,
    });
  }

  /**
   * Evaluate rules for given context
   */
  async evaluateRules(context: AdaptiveContext): Promise<RuleEvaluationResult[]> {
    await this.initialize();
    return this.engine.evaluateRules(context);
  }

  /**
   * Execute rule actions
   */
  async executeRuleActions(results: RuleEvaluationResult[]): Promise<RuleExecutionResult[]> {
    const executions: RuleExecutionResult[] = [];

    for (const result of results.slice(0, 3)) { // Execute top 3 rules
      const startTime = Date.now();
      let success = true;
      const actions: RuleActionResult[] = [];

      try {
        for (const action of result.rule.actions) {
          const actionResult = await this.executeAction(action, result.confidence);
          actions.push(actionResult);

          if (!actionResult.success) {
            success = false;
          }
        }
      } catch (error) {
        success = false;
        logger.error("Rule execution failed", {
          event: "ll_rule_execution_error",
          ll_rule_id: result.rule.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      const executionTime = Date.now() - startTime;
      const improvement = success ? result.rule.performance.avgImprovement : -5;

      // Update rule performance
      this.engine.updateRulePerformance(result.rule.id, success, improvement, executionTime);

      executions.push({
        ruleId: result.rule.id,
        success,
        executionTime,
        actions,
        confidence: result.confidence,
        improvement,
      });

      logger.info("Executed rule actions", {
        event: "ll_rule_actions_executed",
        ll_rule_id: result.rule.id,
        ll_success: success,
        ll_actions_count: actions.length,
        ll_execution_time: executionTime,
      });
    }

    return executions;
  }

  /**
   * Execute single action
   */
  private async executeAction(action: { type: string; target: string; value: unknown; confidence: number }, confidence: number): Promise<RuleActionResult> {
    const startTime = Date.now();

    try {
      // Here we would integrate with the actual loading system
      // For now, just log the action
      logger.info("Executing adaptive rule action", {
        event: "ll_rule_action_executed",
        ll_action_type: action.type,
        ll_action_target: action.target,
        ll_action_value: action.value,
        ll_action_confidence: action.confidence,
        ll_overall_confidence: confidence,
      });

      // Simulate action execution
      await new Promise(resolve => setTimeout(resolve, 10));

      return {
        type: action.type,
        target: action.target,
        value: action.value,
        success: true,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      logger.error("Action execution failed", {
        event: "ll_action_execution_error",
        ll_action_type: action.type,
        ll_action_target: action.target,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        type: action.type,
        target: action.target,
        value: action.value,
        success: false,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Add custom rule
   */
  async addRule(rule: Omit<AdaptiveRule, "metadata">): Promise<void> {
    await this.initialize();

    const fullRule: AdaptiveRule = {
      ...rule,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        activationCount: 0,
        successCount: 0,
        failureCount: 0,
      },
    };

    this.engine.addRule(fullRule);
    await this.persistRules();
  }

  /**
   * Persist rules to storage
   */
  private async persistRules(): Promise<void> {
    try {
      const rules = Array.from(this.engine["rules"].values());
      await AtomicStorage.atomicUpdate(
        "adaptive_rules",
        () => rules,
        []
      );
    } catch (error) {
      logger.error("Failed to persist rules", {
        event: "ll_rules_persist_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get manager statistics
   */
  getStats() {
    return {
      initialized: this.isInitialized,
      rules: this.engine.getRulesStats(),
    };
  }
}

// Export singleton
export const adaptiveRuleManager = AdaptiveRuleManager.getInstance();
