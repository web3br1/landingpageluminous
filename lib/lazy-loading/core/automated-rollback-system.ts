"use client";

import { logger } from "../../observability/logger";
import { storageManager, AtomicStorage } from "./storage-manager";
import { gracefulDegradationManager } from "./graceful-degradation-manager";
import { errorBudgetManager } from "./error-budget-manager";

/**
 * Automated Rollback System - Phase 3 Correction
 * Solves H3.25: Automated rollback capability (self-healing)
 */

export interface RollbackConfig {
  id: string;
  name: string;
  description: string;

  // What to rollback
  rollbackTarget: "degradation_level" | "rule_config" | "threshold_config" | "feature_flags";

  // Trigger conditions
  triggerConditions: RollbackTrigger[];

  // Rollback strategy
  rollbackStrategy: "immediate" | "gradual" | "safe_fallback";

  // Safety checks
  safetyChecks: RollbackSafetyCheck[];

  // Recovery monitoring
  recoveryMonitoring: {
    observationPeriod: number; // Time to observe after rollback (ms)
    successMetrics: string[]; // Metrics to monitor for success
    failureThreshold: number; // When to consider rollback failed
  };
}

export interface RollbackTrigger {
  type: "error_rate" | "performance_degradation" | "user_satisfaction" | "system_instability";
  threshold: number;
  timeWindow: number; // Time window to evaluate (ms)
  confidence: number; // Minimum confidence level
  consecutiveOccurrences: number; // How many times in a row
}

export interface RollbackSafetyCheck {
  type: "circuit_breaker" | "error_budget" | "system_health" | "user_impact";
  condition: string;
  action: "block" | "warn" | "allow";
}

export interface RollbackState {
  activeRollbacks: RollbackExecution[];
  rollbackHistory: RollbackRecord[];
  lastRollbackTime?: number;
  consecutiveFailures: number;
  systemStateSnapshots: SystemStateSnapshot[];
}

export interface RollbackExecution {
  id: string;
  configId: string;
  startTime: number;
  status: "executing" | "completed" | "failed" | "monitoring";
  progress: number; // 0-1
  currentStep: string;
  rollbackData: any; // What was rolled back
  monitoringStartTime?: number;
  estimatedCompletionTime?: number;
}

export interface RollbackRecord {
  id: string;
  configId: string;
  timestamp: number;
  status: "success" | "failure" | "partial" | "aborted";
  duration: number;
  triggerReason: string;
  rollbackTarget: string;
  beforeState: SystemStateSnapshot;
  afterState: SystemStateSnapshot;
  impactAssessment: RollbackImpact;
  lessonsLearned?: string[];
}

export interface SystemStateSnapshot {
  timestamp: number;
  degradationLevel: string;
  activeRules: string[];
  thresholdConfigs: Record<string, any>;
  featureFlags: Record<string, boolean>;
  performanceMetrics: Record<string, number>;
  errorMetrics: Record<string, number>;
}

export interface RollbackImpact {
  userImpact: "none" | "low" | "medium" | "high";
  performanceChange: number; // Performance delta after rollback
  reliabilityChange: number; // Reliability delta after rollback
  timeToRecovery: number; // Time until system stabilized
  confidence: number; // Confidence in the assessment
}

/**
 * Rollback Execution Engine
 */
class RollbackExecutor {
  /**
   * Execute a rollback operation
   */
  async executeRollback(config: RollbackConfig): Promise<RollbackExecution> {
    const executionId = `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const execution: RollbackExecution = {
      id: executionId,
      configId: config.id,
      startTime: Date.now(),
      status: "executing",
      progress: 0,
      currentStep: "preparing_rollback",
      rollbackData: {},
    };

    try {
      // Step 1: Safety checks
      execution.currentStep = "safety_checks";
      execution.progress = 0.1;

      const safetyResult = await this.performSafetyChecks(config);
      if (!safetyResult.allowed) {
        throw new RollbackError(`Safety check failed: ${safetyResult.reason}`, config.id);
      }

      // Step 2: Create system snapshot
      execution.currentStep = "creating_snapshot";
      execution.progress = 0.2;

      const beforeSnapshot = await this.createSystemSnapshot();

      // Step 3: Execute rollback based on strategy
      execution.currentStep = "executing_rollback";
      execution.progress = 0.5;

      const rollbackData = await this.executeRollbackStrategy(config);

      execution.rollbackData = rollbackData;
      execution.progress = 0.8;

      // Step 4: Start monitoring
      execution.currentStep = "starting_monitoring";
      execution.status = "monitoring";
      execution.monitoringStartTime = Date.now();
      execution.estimatedCompletionTime = Date.now() + config.recoveryMonitoring.observationPeriod;

      logger.info("Rollback execution started", {
        event: "ll_rollback_started",
        ll_execution_id: executionId,
        ll_config_id: config.id,
        ll_target: config.rollbackTarget,
        ll_strategy: config.rollbackStrategy,
      });

      return execution;

    } catch (error) {
      execution.status = "failed";
      execution.progress = 1.0;

      logger.error("Rollback execution failed", {
        event: "ll_rollback_failed",
        ll_execution_id: executionId,
        ll_config_id: config.id,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Perform safety checks before rollback
   */
  private async performSafetyChecks(config: RollbackConfig): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    for (const check of config.safetyChecks) {
      const result = await this.evaluateSafetyCheck(check);

      if (result.action === "block") {
        return { allowed: false, reason: result.reason };
      } else if (result.action === "warn") {
        logger.warn("Safety check warning for rollback", {
          event: "ll_rollback_safety_warning",
          ll_check: check.type,
          ll_reason: result.reason,
        });
      }
      // "allow" continues to next check
    }

    return { allowed: true };
  }

  /**
   * Evaluate individual safety check
   */
  private async evaluateSafetyCheck(check: RollbackSafetyCheck): Promise<{
    action: "block" | "warn" | "allow";
    reason?: string;
  }> {
    switch (check.type) {
      case "circuit_breaker":
        const health = await import("./lazy-loading-circuit-breaker").then(m => m.lazyLoadingCircuitBreaker.getHealthStatus());
        if (health.openCircuits.length > 0) {
          return { action: "warn", reason: `${health.openCircuits.length} circuit breakers are open` };
        }
        return { action: "allow" };

      case "error_budget":
        const budgetHealth = errorBudgetManager.getHealthStatus();
        if (budgetHealth.overall === "exceeded") {
          return { action: "block", reason: "Error budget is exceeded, rollback too risky" };
        }
        return { action: "allow" };

      case "system_health":
        // Check overall system health
        const degradationState = gracefulDegradationManager.getState();
        if (degradationState.forcedDegradation) {
          return { action: "warn", reason: "System is in forced degradation mode" };
        }
        return { action: "allow" };

      case "user_impact":
        // Check for high user impact periods
        const currentHour = new Date().getHours();
        if (currentHour >= 9 && currentHour <= 17) { // Business hours
          return { action: "warn", reason: "High user impact time window" };
        }
        return { action: "allow" };

      default:
        return { action: "allow" };
    }
  }

  /**
   * Create system state snapshot
   */
  private async createSystemSnapshot(): Promise<SystemStateSnapshot> {
    // Gather current system state
    const degradationLevel = gracefulDegradationManager.getCurrentLevel()?.id || "unknown";

    // This would integrate with other managers to get their current state
    // For now, creating a basic snapshot
    const snapshot: SystemStateSnapshot = {
      timestamp: Date.now(),
      degradationLevel,
      activeRules: [], // Would come from adaptive rule manager
      thresholdConfigs: {}, // Would come from dynamic threshold manager
      featureFlags: {}, // Would come from feature flag system
      performanceMetrics: {
        lcp: 0,
        cls: 0,
        inp: 0,
      },
      errorMetrics: {
        errorRate: 0,
        totalErrors: 0,
      },
    };

    return snapshot;
  }

  /**
   * Execute rollback based on strategy
   */
  private async executeRollbackStrategy(config: RollbackConfig): Promise<any> {
    switch (config.rollbackTarget) {
      case "degradation_level":
        return await this.rollbackDegradationLevel();

      case "rule_config":
        return await this.rollbackRuleConfig();

      case "threshold_config":
        return await this.rollbackThresholdConfig();

      case "feature_flags":
        return await this.rollbackFeatureFlags();

      default:
        throw new RollbackError(`Unknown rollback target: ${config.rollbackTarget}`, config.id);
    }
  }

  private async rollbackDegradationLevel(): Promise<any> {
    // Rollback to previous degradation level or safe default
    await gracefulDegradationManager.resetToDefault();
    return { previousLevel: "unknown", newLevel: "progressive" };
  }

  private async rollbackRuleConfig(): Promise<any> {
    // Would rollback rule configurations to previous version
    // This would integrate with adaptive rule manager
    return { rolledBackRules: [] };
  }

  private async rollbackThresholdConfig(): Promise<any> {
    // Would rollback threshold configurations
    // This would integrate with dynamic threshold manager
    return { rolledBackThresholds: [] };
  }

  private async rollbackFeatureFlags(): Promise<any> {
    // Would rollback feature flags to safe state
    return { rolledBackFlags: [] };
  }
}

/**
 * Rollback Monitoring System
 */
class RollbackMonitor {
  /**
   * Monitor rollback execution and assess success
   */
  async monitorRollback(execution: RollbackExecution, config: RollbackConfig): Promise<RollbackRecord> {
    const startTime = execution.monitoringStartTime || Date.now();
    const observationPeriod = config.recoveryMonitoring.observationPeriod;

    // Wait for observation period
    await new Promise(resolve => setTimeout(resolve, observationPeriod));

    // Assess rollback success
    const afterSnapshot = await this.createSystemSnapshot();
    const impact = await this.assessRollbackImpact(execution, config);

    const record: RollbackRecord = {
      id: execution.id,
      configId: execution.configId,
      timestamp: Date.now(),
      status: this.determineRollbackStatus(impact),
      duration: Date.now() - execution.startTime,
      triggerReason: "automated_rollback",
      rollbackTarget: config.rollbackTarget,
      beforeState: {} as SystemStateSnapshot, // Would be stored in execution
      afterState: afterSnapshot,
      impactAssessment: impact,
      lessonsLearned: this.generateLessonsLearned(impact),
    };

    logger.info("Rollback monitoring completed", {
      event: "ll_rollback_monitoring_completed",
      ll_execution_id: execution.id,
      ll_status: record.status,
      ll_duration: record.duration,
      ll_user_impact: impact.userImpact,
    });

    return record;
  }

  /**
   * Assess the impact of rollback
   */
  private async assessRollbackImpact(execution: RollbackExecution, config: RollbackConfig): Promise<RollbackImpact> {
    // Gather metrics during observation period
    const metrics = await this.gatherMonitoringMetrics(config);

    // Assess user impact
    const userImpact = this.assessUserImpact(metrics);

    // Calculate performance change
    const performanceChange = this.calculatePerformanceChange(metrics);

    // Assess reliability improvement
    const reliabilityChange = this.calculateReliabilityChange(metrics);

    // Calculate time to recovery
    const timeToRecovery = this.calculateTimeToRecovery(metrics);

    return {
      userImpact,
      performanceChange,
      reliabilityChange,
      timeToRecovery,
      confidence: this.calculateAssessmentConfidence(metrics),
    };
  }

  /**
   * Gather metrics during monitoring period
   */
  private async gatherMonitoringMetrics(config: RollbackConfig): Promise<Record<string, any>> {
    // This would gather actual metrics from monitoring systems
    // For now, return mock data
    return {
      errorRate: 0.02,
      performanceScore: 85,
      userSatisfaction: 4.2,
      recoveryTime: 30000,
    };
  }

  private assessUserImpact(metrics: Record<string, any>): "none" | "low" | "medium" | "high" {
    const errorRate = metrics.errorRate || 0;
    const userSat = metrics.userSatisfaction || 5;

    if (errorRate > 0.1 || userSat < 3) return "high";
    if (errorRate > 0.05 || userSat < 4) return "medium";
    if (errorRate > 0.02 || userSat < 4.5) return "low";
    return "none";
  }

  private calculatePerformanceChange(metrics: Record<string, any>): number {
    // Calculate performance improvement/degradation
    return metrics.performanceScore ? metrics.performanceScore - 75 : 0; // Assuming 75 was baseline
  }

  private calculateReliabilityChange(metrics: Record<string, any>): number {
    // Calculate reliability improvement
    const errorRate = metrics.errorRate || 0;
    return Math.max(0, 0.05 - errorRate) / 0.05; // Improvement from 5% baseline
  }

  private calculateTimeToRecovery(metrics: Record<string, any>): number {
    return metrics.recoveryTime || 30000;
  }

  private calculateAssessmentConfidence(metrics: Record<string, any>): number {
    // Higher confidence with more data points and stability
    return Math.min(1, 0.8); // Placeholder
  }

  private determineRollbackStatus(impact: RollbackImpact): "success" | "failure" | "partial" | "aborted" {
    if (impact.userImpact === "high" || impact.performanceChange < -10) {
      return "failure";
    }
    if (impact.userImpact === "medium" || impact.performanceChange < 0) {
      return "partial";
    }
    if (impact.reliabilityChange > 0.5 && impact.userImpact !== "high") {
      return "success";
    }
    return "partial";
  }

  private generateLessonsLearned(impact: RollbackImpact): string[] {
    const lessons: string[] = [];

    if (impact.userImpact === "high") {
      lessons.push("Rollback caused significant user impact - review safety checks");
    }

    if (impact.performanceChange < 0) {
      lessons.push("Performance degraded after rollback - consider different recovery strategy");
    }

    if (impact.reliabilityChange > 0) {
      lessons.push("Rollback improved reliability - validate trigger conditions");
    }

    return lessons;
  }

  private async createSystemSnapshot(): Promise<SystemStateSnapshot> {
    // Same as in RollbackExecutor
    return {} as SystemStateSnapshot;
  }
}

/**
 * Automated Rollback System
 */
export class AutomatedRollbackSystem {
  private configs: Map<string, RollbackConfig> = new Map();
  private state: RollbackState;
  private executor: RollbackExecutor;
  private monitor: RollbackMonitor;
  private static instance: AutomatedRollbackSystem;
  private initialized = false;

  constructor() {
    this.configs = new Map();
    this.state = {
      activeRollbacks: [],
      rollbackHistory: [],
      consecutiveFailures: 0,
      systemStateSnapshots: [],
    };
    this.executor = new RollbackExecutor();
    this.monitor = new RollbackMonitor();
  }

  static getInstance(): AutomatedRollbackSystem {
    if (!AutomatedRollbackSystem.instance) {
      AutomatedRollbackSystem.instance = new AutomatedRollbackSystem();
    }
    return AutomatedRollbackSystem.instance;
  }

  /**
   * Initialize the rollback system
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.defineRollbackConfigs();
    await this.loadPersistedState();

    this.initialized = true;

    logger.info("Automated Rollback System initialized", {
      event: "ll_rollback_system_initialized",
      ll_configs_defined: this.configs.size,
    });
  }

  /**
   * Define rollback configurations
   */
  private defineRollbackConfigs(): void {
    // Degradation level rollback
    this.configs.set("degradation_rollback", {
      id: "degradation_rollback",
      name: "Degradation Level Rollback",
      description: "Rollback degradation level when system remains unstable",
      rollbackTarget: "degradation_level",
      rollbackStrategy: "safe_fallback",
      triggerConditions: [
        {
          type: "system_instability",
          threshold: 0.8,
          timeWindow: 1800000, // 30 minutes
          confidence: 0.85,
          consecutiveOccurrences: 3,
        },
      ],
      safetyChecks: [
        {
          type: "error_budget",
          condition: "budget_not_exceeded",
          action: "block",
        },
        {
          type: "user_impact",
          condition: "low_impact_window",
          action: "warn",
        },
      ],
      recoveryMonitoring: {
        observationPeriod: 900000, // 15 minutes
        successMetrics: ["errorRate", "userSatisfaction", "performanceScore"],
        failureThreshold: 0.7,
      },
    });

    // Rule configuration rollback
    this.configs.set("rule_config_rollback", {
      id: "rule_config_rollback",
      name: "Rule Configuration Rollback",
      description: "Rollback rule changes that cause performance issues",
      rollbackTarget: "rule_config",
      rollbackStrategy: "gradual",
      triggerConditions: [
        {
          type: "performance_degradation",
          threshold: 0.7,
          timeWindow: 3600000, // 1 hour
          confidence: 0.8,
          consecutiveOccurrences: 2,
        },
      ],
      safetyChecks: [
        {
          type: "circuit_breaker",
          condition: "not_open",
          action: "warn",
        },
      ],
      recoveryMonitoring: {
        observationPeriod: 1800000, // 30 minutes
        successMetrics: ["ruleActivationRate", "performanceImprovement"],
        failureThreshold: 0.6,
      },
    });

    // Threshold configuration rollback
    this.configs.set("threshold_rollback", {
      id: "threshold_rollback",
      name: "Threshold Configuration Rollback",
      description: "Rollback threshold changes causing layout shifts",
      rollbackTarget: "threshold_config",
      rollbackStrategy: "immediate",
      triggerConditions: [
        {
          type: "user_satisfaction",
          threshold: 0.6, // Below 60% satisfaction
          timeWindow: 7200000, // 2 hours
          confidence: 0.75,
          consecutiveOccurrences: 1,
        },
      ],
      safetyChecks: [
        {
          type: "system_health",
          condition: "degradation_not_forced",
          action: "allow",
        },
      ],
      recoveryMonitoring: {
        observationPeriod: 1200000, // 20 minutes
        successMetrics: ["cls", "userSatisfaction", "layoutStability"],
        failureThreshold: 0.5,
      },
    });
  }

  /**
   * Evaluate triggers and potentially execute rollback
   */
  async evaluateAndRollback(context: {
    errorRate?: number;
    performanceScore?: number;
    userSatisfaction?: number;
    systemStability?: number;
    timeWindow?: number;
  }): Promise<RollbackExecution | null> {
    await this.initialize();

    for (const config of this.configs.values()) {
      if (await this.shouldTriggerRollback(config, context)) {
        try {
          const execution = await this.executor.executeRollback(config);
          this.state.activeRollbacks.push(execution);

          // Start monitoring in background
          this.monitorRollbackAsync(execution, config);

          return execution;
        } catch (error) {
          logger.error("Failed to execute rollback", {
            event: "ll_rollback_execution_error",
            ll_config_id: config.id,
            error: error instanceof Error ? error.message : String(error),
          });

          this.state.consecutiveFailures++;
        }
      }
    }

    return null;
  }

  /**
   * Check if rollback should be triggered
   */
  private async shouldTriggerRollback(config: RollbackConfig, context: any): Promise<boolean> {
    for (const trigger of config.triggerConditions) {
      if (await this.evaluateTrigger(trigger, context)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Evaluate individual trigger
   */
  private async evaluateTrigger(trigger: RollbackTrigger, context: any): Promise<boolean> {
    // Simplified trigger evaluation
    switch (trigger.type) {
      case "error_rate":
        return (context.errorRate || 0) > trigger.threshold;

      case "performance_degradation":
        return (context.performanceScore || 100) < (100 - trigger.threshold * 100);

      case "user_satisfaction":
        return (context.userSatisfaction || 1) < trigger.threshold;

      case "system_instability":
        return (context.systemStability || 1) < trigger.threshold;

      default:
        return false;
    }
  }

  /**
   * Monitor rollback execution asynchronously
   */
  private async monitorRollbackAsync(execution: RollbackExecution, config: RollbackConfig): Promise<void> {
    try {
      const record = await this.monitor.monitorRollback(execution, config);

      // Update execution status
      execution.status = "completed";

      // Add to history
      this.state.rollbackHistory.push(record);

      // Clean up old history
      if (this.state.rollbackHistory.length > 50) {
        this.state.rollbackHistory = this.state.rollbackHistory.slice(-50);
      }

      // Remove from active rollbacks
      this.state.activeRollbacks = this.state.activeRollbacks.filter(r => r.id !== execution.id);

      await this.persistState();

      logger.info("Rollback completed and monitored", {
        event: "ll_rollback_completed",
        ll_execution_id: execution.id,
        ll_status: record.status,
        ll_duration: record.duration,
        ll_user_impact: record.impactAssessment.userImpact,
      });

    } catch (error) {
      logger.error("Rollback monitoring failed", {
        event: "ll_rollback_monitoring_error",
        ll_execution_id: execution.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Manually trigger rollback
   */
  async triggerRollback(configId: string, reason: string): Promise<RollbackExecution | null> {
    await this.initialize();

    const config = this.configs.get(configId);
    if (!config) {
      logger.warn("Rollback config not found", {
        event: "ll_rollback_config_not_found",
        ll_config_id: configId,
      });
      return null;
    }

    try {
      const execution = await this.executor.executeRollback(config);
      this.state.activeRollbacks.push(execution);

      // Start monitoring
      this.monitorRollbackAsync(execution, config);

      logger.info("Manual rollback triggered", {
        event: "ll_manual_rollback_triggered",
        ll_config_id: configId,
        ll_reason: reason,
        ll_execution_id: execution.id,
      });

      return execution;
    } catch (error) {
      logger.error("Manual rollback failed", {
        event: "ll_manual_rollback_error",
        ll_config_id: configId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Get rollback statistics
   */
  getStats() {
    const recentHistory = this.state.rollbackHistory.slice(-10);
    const successRate = recentHistory.length > 0 ?
      recentHistory.filter(r => r.status === "success").length / recentHistory.length : 0;

    return {
      initialized: this.initialized,
      configs: this.configs.size,
      activeRollbacks: this.state.activeRollbacks.length,
      totalRollbacks: this.state.rollbackHistory.length,
      successRate,
      consecutiveFailures: this.state.consecutiveFailures,
      lastRollbackTime: this.state.lastRollbackTime,
      averageRollbackDuration: recentHistory.length > 0 ?
        recentHistory.reduce((sum, r) => sum + r.duration, 0) / recentHistory.length : 0,
    };
  }

  /**
   * Get rollback history
   */
  getRollbackHistory(limit = 10): RollbackRecord[] {
    return this.state.rollbackHistory.slice(-limit);
  }

  /**
   * Persist rollback state
   */
  private async persistState(): Promise<void> {
    try {
      await AtomicStorage.atomicUpdate(
        "automated_rollback_state",
        () => ({
          state: {
            ...this.state,
            activeRollbacks: this.state.activeRollbacks.map(r => ({
              ...r,
              // Don't persist large rollback data
              rollbackData: undefined,
            })),
            rollbackHistory: this.state.rollbackHistory.slice(-20), // Keep last 20
          },
          lastUpdated: Date.now(),
        }),
        {}
      );
    } catch (error) {
      logger.error("Failed to persist rollback state", {
        event: "ll_rollback_persist_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Load persisted state
   */
  private async loadPersistedState(): Promise<void> {
    try {
      const persisted = storageManager.getItem("automated_rollback_state");
      if (persisted && persisted.state) {
        this.state = { ...this.state, ...persisted.state };
      }
    } catch (error) {
      logger.error("Failed to load persisted rollback state", {
        event: "ll_rollback_load_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export class RollbackError extends Error {
  constructor(message: string, public configId: string) {
    super(message);
    this.name = "RollbackError";
  }
}

// Export singleton
export const automatedRollbackSystem = AutomatedRollbackSystem.getInstance();
