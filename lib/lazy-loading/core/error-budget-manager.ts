"use client";

import { logger } from "../../observability/logger";
import { storageManager, AtomicStorage } from "./storage-manager";
import { gracefulDegradationManager } from "./graceful-degradation-manager";

/**
 * Error Budget Manager - Phase 3 Correction
 * Solves H3.10: Error budget awareness (failure tolerance)
 */

export interface ErrorBudget {
  id: string;
  name: string;
  description: string;

  // Budget limits
  maxErrorRate: number; // Maximum allowed error rate (0-1)
  maxErrorsPerHour: number;
  maxConsecutiveErrors: number;

  // Time windows
  evaluationWindow: number; // Time window for evaluation (ms)
  resetWindow: number; // Time window for budget reset (ms)

  // Actions when budget is exceeded
  actions: ErrorBudgetAction[];

  // Current state
  currentState: ErrorBudgetState;
}

export interface ErrorBudgetAction {
  type: "degrade" | "alert" | "rollback" | "circuit_break";
  threshold: number; // Percentage of budget used (0-1)
  target?: string; // Target for action (level, operation, etc.)
  severity: "low" | "medium" | "high" | "critical";
  cooldownPeriod: number; // Minimum time between actions (ms)
  lastExecuted?: number;
}

export interface ErrorBudgetState {
  totalErrors: number;
  totalRequests: number;
  consecutiveErrors: number;
  errorRate: number;
  budgetUsed: number; // Percentage of budget consumed (0-1)
  lastErrorTime?: number;
  lastResetTime: number;
  periodStartTime: number;
  actionsExecuted: number;
}

export interface ErrorBudgetViolation {
  budgetId: string;
  violationType: "rate" | "count" | "consecutive";
  actualValue: number;
  thresholdValue: number;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: number;
  context: Record<string, any>;
}

export interface BudgetHealthStatus {
  overall: "healthy" | "warning" | "critical" | "exceeded";
  budgets: Array<{
    id: string;
    status: "healthy" | "warning" | "critical" | "exceeded";
    budgetUsed: number;
    errorRate: number;
    actionsAvailable: number;
  }>;
  recommendations: string[];
}

/**
 * Error Classification System
 */
class ErrorClassifier {
  /**
   * Classify error severity and impact
   */
  static classifyError(error: Error, context?: Record<string, any>): {
    severity: "low" | "medium" | "high" | "critical";
    impact: "user_visible" | "performance" | "functionality" | "data_integrity";
    recoverable: boolean;
    budgetWeight: number; // How much this error counts toward budget (0-1)
  } {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Critical errors - immediate user impact
    if (errorName.includes("security") ||
        errorMessage.includes("forbidden") ||
        errorMessage.includes("unauthorized") ||
        context?.dataIntegrity === true) {
      return {
        severity: "critical",
        impact: "data_integrity",
        recoverable: false,
        budgetWeight: 1.0,
      };
    }

    // High severity - breaks functionality
    if (errorName.includes("typeerror") ||
        errorMessage.includes("cannot read") ||
        errorMessage.includes("undefined") ||
        context?.breaksFunctionality === true) {
      return {
        severity: "high",
        impact: "functionality",
        recoverable: true,
        budgetWeight: 0.8,
      };
    }

    // Medium severity - affects performance
    if (errorMessage.includes("timeout") ||
        errorMessage.includes("network") ||
        errorMessage.includes("slow") ||
        context?.performanceImpact === true) {
      return {
        severity: "medium",
        impact: "performance",
        recoverable: true,
        budgetWeight: 0.6,
      };
    }

    // User visible errors
    if (errorMessage.includes("user") ||
        errorMessage.includes("display") ||
        errorMessage.includes("render") ||
        context?.userVisible === true) {
      return {
        severity: "medium",
        impact: "user_visible",
        recoverable: true,
        budgetWeight: 0.5,
      };
    }

    // Low severity - minor issues
    return {
      severity: "low",
      impact: "performance",
      recoverable: true,
      budgetWeight: 0.2,
    };
  }

  /**
   * Determine if error should be counted in budget
   */
  static shouldCountInBudget(error: Error, context?: Record<string, any>): boolean {
    // Don't count expected errors in development
    if (process.env.NODE_ENV === "development" &&
        error.message.includes("expected")) {
      return false;
    }

    // Don't count client-side validation errors
    if (error.message.includes("validation") &&
        context?.clientValidation === true) {
      return false;
    }

    // Don't count cancelled requests
    if (error.message.includes("cancelled") ||
        error.message.includes("abort")) {
      return false;
    }

    return true;
  }
}

/**
 * Budget Consumption Calculator
 */
class BudgetCalculator {
  /**
   * Calculate budget consumption percentage
   */
  static calculateConsumption(state: ErrorBudgetState, budget: ErrorBudget): number {
    const timeElapsed = Date.now() - state.periodStartTime;
    const timeProgress = Math.min(timeElapsed / budget.evaluationWindow, 1);

    // Weight current consumption by time progress
    const errorRateConsumption = state.errorRate / budget.maxErrorRate;
    const countConsumption = (state.totalErrors / budget.maxErrorsPerHour) * timeProgress;
    const consecutiveConsumption = state.consecutiveErrors / budget.maxConsecutiveErrors;

    // Use the highest consumption metric
    return Math.max(errorRateConsumption, countConsumption, consecutiveConsumption);
  }

  /**
   * Check if budget is exceeded
   */
  static isBudgetExceeded(state: ErrorBudgetState, budget: ErrorBudget): boolean {
    return this.calculateConsumption(state, budget) >= 1.0;
  }

  /**
   * Get recommended actions based on budget usage
   */
  static getRecommendedActions(
    budget: ErrorBudget,
    consumption: number
  ): ErrorBudgetAction[] {
    return budget.actions
      .filter(action => consumption >= action.threshold)
      .sort((a, b) => b.threshold - a.threshold); // Highest threshold first
  }

  /**
   * Calculate time until budget reset
   */
  static getTimeUntilReset(budget: ErrorBudget, state: ErrorBudgetState): number {
    const timeSinceReset = Date.now() - state.lastResetTime;
    return Math.max(0, budget.resetWindow - timeSinceReset);
  }
}

/**
 * Error Budget Manager
 */
export class ErrorBudgetManager {
  private budgets: Map<string, ErrorBudget> = new Map();
  private violations: ErrorBudgetViolation[] = [];
  private static instance: ErrorBudgetManager;
  private initialized = false;

  constructor() {
    this.budgets = new Map();
    this.violations = [];
  }

  static getInstance(): ErrorBudgetManager {
    if (!ErrorBudgetManager.instance) {
      ErrorBudgetManager.instance = new ErrorBudgetManager();
    }
    return ErrorBudgetManager.instance;
  }

  /**
   * Initialize the error budget manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.defineBudgets();
    await this.loadPersistedState();

    this.initialized = true;

    logger.info("Error Budget Manager initialized", {
      event: "ll_error_budget_initialized",
      ll_budgets_defined: this.budgets.size,
    });
  }

  /**
   * Define error budgets for different system components
   */
  private defineBudgets(): void {
    // Overall system budget
    this.budgets.set("system_overall", {
      id: "system_overall",
      name: "System Overall",
      description: "Overall system error budget",
      maxErrorRate: 0.05, // 5% error rate
      maxErrorsPerHour: 50,
      maxConsecutiveErrors: 10,
      evaluationWindow: 3600000, // 1 hour
      resetWindow: 86400000, // 24 hours
      actions: [
        {
          type: "alert",
          threshold: 0.7,
          severity: "medium",
          cooldownPeriod: 300000, // 5 minutes
        },
        {
          type: "degrade",
          threshold: 0.85,
          target: "conservative",
          severity: "high",
          cooldownPeriod: 600000, // 10 minutes
        },
        {
          type: "degrade",
          threshold: 1.0,
          target: "safe",
          severity: "critical",
          cooldownPeriod: 1800000, // 30 minutes
        },
      ],
      currentState: this.createInitialState(),
    });

    // Lazy loading specific budget
    this.budgets.set("lazy_loading", {
      id: "lazy_loading",
      name: "Lazy Loading",
      description: "Lazy loading operations error budget",
      maxErrorRate: 0.08, // 8% error rate (more tolerant)
      maxErrorsPerHour: 30,
      maxConsecutiveErrors: 5,
      evaluationWindow: 1800000, // 30 minutes
      resetWindow: 3600000, // 1 hour
      actions: [
        {
          type: "circuit_break",
          threshold: 0.6,
          severity: "medium",
          cooldownPeriod: 120000, // 2 minutes
        },
        {
          type: "degrade",
          threshold: 0.8,
          target: "conservative",
          severity: "high",
          cooldownPeriod: 300000, // 5 minutes
        },
      ],
      currentState: this.createInitialState(),
    });

    // Performance monitoring budget
    this.budgets.set("performance_monitoring", {
      id: "performance_monitoring",
      name: "Performance Monitoring",
      description: "Performance monitoring operations budget",
      maxErrorRate: 0.15, // 15% error rate (monitoring can fail more)
      maxErrorsPerHour: 20,
      maxConsecutiveErrors: 8,
      evaluationWindow: 7200000, // 2 hours
      resetWindow: 86400000, // 24 hours
      actions: [
        {
          type: "alert",
          threshold: 0.8,
          severity: "low",
          cooldownPeriod: 600000, // 10 minutes
        },
      ],
      currentState: this.createInitialState(),
    });

    // Adaptive features budget
    this.budgets.set("adaptive_features", {
      id: "adaptive_features",
      name: "Adaptive Features",
      description: "Adaptive and ML features error budget",
      maxErrorRate: 0.12, // 12% error rate
      maxErrorsPerHour: 15,
      maxConsecutiveErrors: 6,
      evaluationWindow: 3600000, // 1 hour
      resetWindow: 43200000, // 12 hours
      actions: [
        {
          type: "degrade",
          threshold: 0.7,
          target: "disable_adaptive",
          severity: "medium",
          cooldownPeriod: 600000, // 10 minutes
        },
      ],
      currentState: this.createInitialState(),
    });
  }

  /**
   * Create initial state for a budget
   */
  private createInitialState(): ErrorBudgetState {
    const now = Date.now();
    return {
      totalErrors: 0,
      totalRequests: 0,
      consecutiveErrors: 0,
      errorRate: 0,
      budgetUsed: 0,
      lastResetTime: now,
      periodStartTime: now,
      actionsExecuted: 0,
    };
  }

  /**
   * Report an error to the budget system
   */
  async reportError(
    budgetId: string,
    error: Error,
    context?: {
      operation?: string;
      userId?: string;
      sessionId?: string;
      component?: string;
      recoverable?: boolean;
      userImpact?: "low" | "medium" | "high";
    }
  ): Promise<void> {
    await this.initialize();

    const budget = this.budgets.get(budgetId);
    if (!budget) {
      logger.warn("Budget not found for error reporting", {
        event: "ll_budget_not_found",
        ll_budget_id: budgetId,
        ll_error: error.message,
      });
      return;
    }

    // Classify the error
    const classification = ErrorClassifier.classifyError(error, context);
    const shouldCount = ErrorClassifier.shouldCountInBudget(error, context);

    if (!shouldCount) {
      logger.debug("Error not counted in budget", {
        event: "ll_error_not_counted",
        ll_budget_id: budgetId,
        ll_error: error.message,
        ll_classification: classification,
      });
      return;
    }

    // Update budget state
    const state = budget.currentState;
    state.totalErrors += classification.budgetWeight;
    state.totalRequests++;
    state.consecutiveErrors++;
    state.errorRate = state.totalErrors / Math.max(state.totalRequests, 1);
    state.lastErrorTime = Date.now();
    state.budgetUsed = BudgetCalculator.calculateConsumption(state, budget);

    // Reset consecutive errors if this was a success (but since it's an error, we keep them)
    // Consecutive errors are reset on successful operations

    // Check for violations and execute actions
    await this.checkBudgetViolations(budget);

    // Persist updated state
    await this.persistState();

    logger.warn("Error reported to budget", {
      event: "ll_budget_error_reported",
      ll_budget_id: budgetId,
      ll_error: error.message,
      ll_classification: classification,
      ll_budget_used: state.budgetUsed,
      ll_consecutive_errors: state.consecutiveErrors,
    });
  }

  /**
   * Report a successful operation
   */
  async reportSuccess(budgetId: string): Promise<void> {
    await this.initialize();

    const budget = this.budgets.get(budgetId);
    if (!budget) return;

    const state = budget.currentState;
    state.totalRequests++;
    state.consecutiveErrors = 0; // Reset consecutive errors on success
    state.errorRate = state.totalErrors / Math.max(state.totalRequests, 1);
    state.budgetUsed = BudgetCalculator.calculateConsumption(state, budget);

    await this.persistState();
  }

  /**
   * Check for budget violations and execute actions
   */
  private async checkBudgetViolations(budget: ErrorBudget): Promise<void> {
    const state = budget.currentState;
    const consumption = state.budgetUsed;

    if (consumption < 0.5) return; // No action needed for low consumption

    const recommendedActions = BudgetCalculator.getRecommendedActions(budget, consumption);

    for (const action of recommendedActions) {
      // Check cooldown
      if (action.lastExecuted &&
          Date.now() - action.lastExecuted < action.cooldownPeriod) {
        continue;
      }

      // Execute action
      await this.executeBudgetAction(budget, action, consumption);
      action.lastExecuted = Date.now();
      state.actionsExecuted++;

      // Record violation
      const violation: ErrorBudgetViolation = {
        budgetId: budget.id,
        violationType: "rate",
        actualValue: consumption,
        thresholdValue: action.threshold,
        severity: action.severity,
        timestamp: Date.now(),
        context: {
          action: action.type,
          target: action.target,
        },
      };

      this.violations.push(violation);

      // Limit violations history
      if (this.violations.length > 100) {
        this.violations = this.violations.slice(-100);
      }

      logger.warn("Budget violation action executed", {
        event: "ll_budget_violation_action",
        ll_budget_id: budget.id,
        ll_action: action.type,
        ll_target: action.target,
        ll_severity: action.severity,
        ll_consumption: consumption,
        ll_threshold: action.threshold,
      });
    }
  }

  /**
   * Execute a budget action
   */
  private async executeBudgetAction(
    budget: ErrorBudget,
    action: ErrorBudgetAction,
    consumption: number
  ): Promise<void> {
    switch (action.type) {
      case "degrade":
        if (action.target) {
          await gracefulDegradationManager.forceDegradation(action.target, `budget_violation_${budget.id}`);
        }
        break;

      case "alert":
        // In a real system, this would send alerts to monitoring systems
        logger.error("Budget alert triggered", {
          event: "ll_budget_alert",
          ll_budget_id: budget.id,
          ll_severity: action.severity,
          ll_consumption: consumption,
        });
        break;

      case "rollback":
        // Rollback to a safe state
        await gracefulDegradationManager.resetToDefault();
        break;

      case "circuit_break":
        // This would integrate with circuit breaker system
        logger.warn("Circuit breaker action triggered", {
          event: "ll_budget_circuit_break",
          ll_budget_id: budget.id,
        });
        break;
    }
  }

  /**
   * Reset budget periods
   */
  async resetBudgets(): Promise<void> {
    const now = Date.now();

    for (const budget of this.budgets.values()) {
      const state = budget.currentState;
      state.lastResetTime = now;
      state.periodStartTime = now;
      state.totalErrors = 0;
      state.totalRequests = 0;
      state.consecutiveErrors = 0;
      state.errorRate = 0;
      state.budgetUsed = 0;
      state.actionsExecuted = 0;
    }

    await this.persistState();

    logger.info("Budgets reset", {
      event: "ll_budgets_reset",
      ll_budgets_reset: this.budgets.size,
    });
  }

  /**
   * Get health status of all budgets
   */
  getHealthStatus(): BudgetHealthStatus {
    const budgets: BudgetHealthStatus["budgets"] = [];
    let worstStatus: BudgetHealthStatus["overall"] = "healthy";
    const recommendations: string[] = [];

    for (const budget of this.budgets.values()) {
      const consumption = budget.currentState.budgetUsed;
      let status: "healthy" | "warning" | "critical" | "exceeded";

      if (consumption >= 1.0) status = "exceeded";
      else if (consumption >= 0.85) status = "critical";
      else if (consumption >= 0.7) status = "warning";
      else status = "healthy";

      budgets.push({
        id: budget.id,
        status,
        budgetUsed: consumption,
        errorRate: budget.currentState.errorRate,
        actionsAvailable: budget.actions.filter(a => consumption >= a.threshold).length,
      });

      // Update worst status
      const statusPriority = { healthy: 0, warning: 1, critical: 2, exceeded: 3 };
      if (statusPriority[status] > statusPriority[worstStatus]) {
        worstStatus = status;
      }

      // Generate recommendations
      if (status !== "healthy") {
        recommendations.push(
          `${budget.name}: ${Math.round(consumption * 100)}% budget used. ` +
          `Consider ${budget.actions.find(a => consumption >= a.threshold)?.type || "monitoring"}.`
        );
      }
    }

    return {
      overall: worstStatus,
      budgets,
      recommendations,
    };
  }

  /**
   * Get budget statistics
   */
  getBudgetStats(budgetId?: string) {
    if (budgetId) {
      const budget = this.budgets.get(budgetId);
      return budget ? {
        budget,
        timeUntilReset: BudgetCalculator.getTimeUntilReset(budget, budget.currentState),
      } : null;
    }

    const stats: Record<string, any> = {};
    for (const [id, budget] of this.budgets) {
      stats[id] = {
        ...budget.currentState,
        timeUntilReset: BudgetCalculator.getTimeUntilReset(budget, budget.currentState),
      };
    }

    return stats;
  }

  /**
   * Get recent violations
   */
  getRecentViolations(limit = 10): ErrorBudgetViolation[] {
    return this.violations.slice(-limit);
  }

  /**
   * Persist budget state
   */
  private async persistState(): Promise<void> {
    try {
      const budgetStates: Record<string, ErrorBudgetState> = {};
      for (const [id, budget] of this.budgets) {
        budgetStates[id] = budget.currentState;
      }

      await AtomicStorage.atomicUpdate(
        "error_budget_states",
        () => ({
          budgets: budgetStates,
          violations: this.violations.slice(-50), // Keep last 50 violations
          lastUpdated: Date.now(),
        }),
        {}
      );
    } catch (error) {
      logger.error("Failed to persist budget state", {
        event: "ll_budget_persist_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Load persisted state
   */
  private async loadPersistedState(): Promise<void> {
    try {
      const persisted = storageManager.getItem("error_budget_states");
      if (persisted && persisted.budgets) {
        for (const [budgetId, state] of Object.entries(persisted.budgets)) {
          const budget = this.budgets.get(budgetId);
          if (budget) {
            budget.currentState = { ...budget.currentState, ...state };
          }
        }

        this.violations = persisted.violations || [];
      }
    } catch (error) {
      logger.error("Failed to load persisted budget state", {
        event: "ll_budget_load_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get system statistics
   */
  getStats() {
    const health = this.getHealthStatus();

    return {
      initialized: this.initialized,
      budgets: this.budgets.size,
      overallHealth: health.overall,
      totalViolations: this.violations.length,
      budgetsStatus: health.budgets.map(b => ({
        id: b.id,
        status: b.status,
        budgetUsed: Math.round(b.budgetUsed * 100),
      })),
    };
  }
}

// Export singleton
export const errorBudgetManager = ErrorBudgetManager.getInstance();
