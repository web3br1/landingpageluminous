"use client";

import { logger } from "../../observability/logger";
import { storageManager, AtomicStorage } from "./storage-manager";
import { lazyLoadingCircuitBreaker } from "./lazy-loading-circuit-breaker";

/**
 * Graceful Degradation Manager - Phase 3 Correction
 * Solves H3.6: Error recovery automático (graceful degradation)
 */

export interface DegradationLevel {
  id: string;
  name: string;
  description: string;
  priority: number; // Higher = more aggressive, Lower = more conservative
  capabilities: DegradationCapabilities;
  performance: {
    expectedLcp?: number;
    expectedCls?: number;
    expectedReliability: number;
    resourceUsage: "high" | "medium" | "low";
  };
  recovery: {
    autoRecoveryTime: number; // Time before attempting upgrade (ms)
    successThreshold: number; // Consecutive successes needed to upgrade
    failureThreshold: number; // Failures before downgrading further
  };
}

export interface DegradationCapabilities {
  // Loading strategies
  eagerLoading: boolean;
  progressiveLoading: boolean;
  skeletonLoading: boolean;

  // Features that can be disabled
  intersectionObserver: boolean;
  adaptiveThresholds: boolean;
  predictiveLoading: boolean;
  crossSessionLearning: boolean;
  analyticsTracking: boolean;

  // Performance monitoring
  realTimeMetrics: boolean;
  detailedLogging: boolean;
  performanceObserver: boolean;

  // Network and resource limits
  maxConcurrentRequests: number;
  maxPreloadDistance: number; // Viewport multiples
  cacheStrategy: "aggressive" | "balanced" | "conservative";
}

export interface DegradationState {
  currentLevel: string;
  lastChanged: number;
  consecutiveSuccesses: number;
  consecutiveFailures: number;
  totalTransitions: number;
  lastError?: {
    type: string;
    message: string;
    timestamp: number;
    context: Record<string, any>;
  };
  recoveryAttempts: number;
  forcedDegradation: boolean; // Manually forced degradation
}

export interface DegradationTrigger {
  id: string;
  name: string;
  condition: DegradationCondition;
  targetLevel: string;
  priority: number;
  cooldownPeriod: number; // Minimum time between triggers (ms)
  lastTriggered?: number;
}

export interface DegradationCondition {
  type: "error_rate" | "performance_threshold" | "resource_usage" | "circuit_breaker" | "manual";
  metric?: string;
  operator: "gt" | "lt" | "gte" | "lte" | "eq";
  value: number;
  timeWindow?: number; // For rate-based conditions (ms)
  confidence?: number; // Minimum confidence level
}

/**
 * Error Pattern Recognition for Intelligent Degradation
 */
class ErrorPatternAnalyzer {
  private errorPatterns: Map<string, ErrorPattern> = new Map();

  constructor() {
    this.initializePatterns();
  }

  private initializePatterns(): void {
    // Network-related errors
    this.errorPatterns.set("network_timeout", {
      pattern: "network_timeout",
      description: "Network request timeouts",
      triggers: ["fetch_timeout", "xhr_timeout"],
      degradationLevel: "conservative",
      recoveryTime: 30000, // 30 seconds
      confidence: 0.8,
    });

    // Resource exhaustion errors
    this.errorPatterns.set("resource_exhaustion", {
      pattern: "resource_exhaustion",
      description: "Browser resource limits exceeded",
      triggers: ["memory_limit", "quota_exceeded", "too_many_requests"],
      degradationLevel: "minimal",
      recoveryTime: 120000, // 2 minutes
      confidence: 0.9,
    });

    // JavaScript execution errors
    this.errorPatterns.set("js_execution", {
      pattern: "js_execution",
      description: "JavaScript execution failures",
      triggers: ["script_error", "eval_error", "type_error"],
      degradationLevel: "safe",
      recoveryTime: 60000, // 1 minute
      confidence: 0.7,
    });

    // Intersection Observer failures
    this.errorPatterns.set("intersection_observer", {
      pattern: "intersection_observer",
      description: "Intersection Observer API failures",
      triggers: ["intersection_unsupported", "intersection_error"],
      degradationLevel: "fallback",
      recoveryTime: 180000, // 3 minutes
      confidence: 0.85,
    });

    // Performance observer failures
    this.errorPatterns.set("performance_observer", {
      pattern: "performance_observer",
      description: "Performance monitoring failures",
      triggers: ["performance_unsupported", "observer_error"],
      degradationLevel: "basic_monitoring",
      recoveryTime: 90000, // 1.5 minutes
      confidence: 0.6,
    });
  }

  /**
   * Analyze error and determine degradation strategy
   */
  analyzeError(error: Error, context?: Record<string, any>): {
    pattern: string;
    degradationLevel: string;
    confidence: number;
    recoveryTime: number;
  } | null {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // Find matching patterns
    for (const [patternId, pattern] of this.errorPatterns) {
      const matches = pattern.triggers.some(trigger =>
        errorMessage.includes(trigger) ||
        errorName.includes(trigger) ||
        (context?.errorType && context.errorType.includes(trigger))
      );

      if (matches) {
        return {
          pattern: patternId,
          degradationLevel: pattern.degradationLevel,
          confidence: pattern.confidence,
          recoveryTime: pattern.recoveryTime,
        };
      }
    }

    // Default degradation for unknown errors
    return {
      pattern: "unknown_error",
      degradationLevel: "conservative",
      confidence: 0.5,
      recoveryTime: 45000, // 45 seconds
    };
  }

  /**
   * Get all available degradation levels
   */
  getDegradationLevels(): Record<string, DegradationLevel> {
    return {
      aggressive: {
        id: "aggressive",
        name: "Aggressive Loading",
        description: "Full-featured loading with all optimizations enabled",
        priority: 10,
        capabilities: {
          eagerLoading: true,
          progressiveLoading: true,
          skeletonLoading: true,
          intersectionObserver: true,
          adaptiveThresholds: true,
          predictiveLoading: true,
          crossSessionLearning: true,
          analyticsTracking: true,
          realTimeMetrics: true,
          detailedLogging: true,
          performanceObserver: true,
          maxConcurrentRequests: 6,
          maxPreloadDistance: 3,
          cacheStrategy: "aggressive",
        },
        performance: {
          expectedReliability: 0.85,
          resourceUsage: "high",
        },
        recovery: {
          autoRecoveryTime: 30000,
          successThreshold: 5,
          failureThreshold: 3,
        },
      },

      progressive: {
        id: "progressive",
        name: "Progressive Loading",
        description: "Standard progressive loading with optimizations",
        priority: 7,
        capabilities: {
          eagerLoading: false,
          progressiveLoading: true,
          skeletonLoading: true,
          intersectionObserver: true,
          adaptiveThresholds: true,
          predictiveLoading: false,
          crossSessionLearning: true,
          analyticsTracking: true,
          realTimeMetrics: true,
          detailedLogging: true,
          performanceObserver: true,
          maxConcurrentRequests: 4,
          maxPreloadDistance: 2,
          cacheStrategy: "balanced",
        },
        performance: {
          expectedReliability: 0.92,
          resourceUsage: "medium",
        },
        recovery: {
          autoRecoveryTime: 45000,
          successThreshold: 4,
          failureThreshold: 4,
        },
      },

      conservative: {
        id: "conservative",
        name: "Conservative Loading",
        description: "Conservative loading with reduced features",
        priority: 4,
        capabilities: {
          eagerLoading: false,
          progressiveLoading: true,
          skeletonLoading: true,
          intersectionObserver: true,
          adaptiveThresholds: false,
          predictiveLoading: false,
          crossSessionLearning: false,
          analyticsTracking: true,
          realTimeMetrics: false,
          detailedLogging: true,
          performanceObserver: true,
          maxConcurrentRequests: 2,
          maxPreloadDistance: 1,
          cacheStrategy: "conservative",
        },
        performance: {
          expectedReliability: 0.96,
          resourceUsage: "low",
        },
        recovery: {
          autoRecoveryTime: 60000,
          successThreshold: 3,
          failureThreshold: 5,
        },
      },

      safe: {
        id: "safe",
        name: "Safe Mode",
        description: "Minimal features for maximum stability",
        priority: 2,
        capabilities: {
          eagerLoading: false,
          progressiveLoading: false,
          skeletonLoading: true,
          intersectionObserver: false,
          adaptiveThresholds: false,
          predictiveLoading: false,
          crossSessionLearning: false,
          analyticsTracking: false,
          realTimeMetrics: false,
          detailedLogging: false,
          performanceObserver: false,
          maxConcurrentRequests: 1,
          maxPreloadDistance: 0.5,
          cacheStrategy: "conservative",
        },
        performance: {
          expectedReliability: 0.98,
          resourceUsage: "low",
        },
        recovery: {
          autoRecoveryTime: 120000,
          successThreshold: 5,
          failureThreshold: 8,
        },
      },

      minimal: {
        id: "minimal",
        name: "Minimal Mode",
        description: "Bare minimum functionality",
        priority: 1,
        capabilities: {
          eagerLoading: false,
          progressiveLoading: false,
          skeletonLoading: false,
          intersectionObserver: false,
          adaptiveThresholds: false,
          predictiveLoading: false,
          crossSessionLearning: false,
          analyticsTracking: false,
          realTimeMetrics: false,
          detailedLogging: false,
          performanceObserver: false,
          maxConcurrentRequests: 1,
          maxPreloadDistance: 0,
          cacheStrategy: "conservative",
        },
        performance: {
          expectedReliability: 0.99,
          resourceUsage: "low",
        },
        recovery: {
          autoRecoveryTime: 300000, // 5 minutes
          successThreshold: 10,
          failureThreshold: 15,
        },
      },
    };
  }
}

export interface ErrorPattern {
  pattern: string;
  description: string;
  triggers: string[];
  degradationLevel: string;
  recoveryTime: number;
  confidence: number;
}

/**
 * Graceful Degradation Manager
 */
export class GracefulDegradationManager {
  private levels: Record<string, DegradationLevel>;
  private state: DegradationState;
  private triggers: DegradationTrigger[] = [];
  private patternAnalyzer: ErrorPatternAnalyzer;
  private static instance: GracefulDegradationManager;
  private initialized = false;

  constructor() {
    this.levels = {};
    this.state = {
      currentLevel: "progressive",
      lastChanged: Date.now(),
      consecutiveSuccesses: 0,
      consecutiveFailures: 0,
      totalTransitions: 0,
      recoveryAttempts: 0,
      forcedDegradation: false,
    };
    this.patternAnalyzer = new ErrorPatternAnalyzer();
    this.triggers = [];
  }

  static getInstance(): GracefulDegradationManager {
    if (!GracefulDegradationManager.instance) {
      GracefulDegradationManager.instance = new GracefulDegradationManager();
    }
    return GracefulDegradationManager.instance;
  }

  /**
   * Initialize the degradation manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.levels = this.patternAnalyzer.getDegradationLevels();
    this.defineTriggers();
    await this.loadPersistedState();

    this.initialized = true;

    logger.info("Graceful Degradation Manager initialized", {
      event: "ll_degradation_manager_initialized",
      ll_current_level: this.state.currentLevel,
      ll_available_levels: Object.keys(this.levels).length,
    });
  }

  /**
   * Define automatic degradation triggers
   */
  private defineTriggers(): void {
    this.triggers = [
      // High error rate trigger
      {
        id: "high_error_rate",
        name: "High Error Rate",
        condition: {
          type: "error_rate",
          metric: "error_rate",
          operator: "gt",
          value: 0.2, // 20% error rate
          timeWindow: 300000, // 5 minutes
          confidence: 0.8,
        },
        targetLevel: "conservative",
        priority: 9,
        cooldownPeriod: 60000, // 1 minute
      },

      // Performance degradation trigger
      {
        id: "performance_degradation",
        name: "Performance Degradation",
        condition: {
          type: "performance_threshold",
          metric: "lcp",
          operator: "gt",
          value: 4000, // 4 seconds LCP
          confidence: 0.85,
        },
        targetLevel: "conservative",
        priority: 8,
        cooldownPeriod: 120000, // 2 minutes
      },

      // Circuit breaker trigger
      {
        id: "circuit_breaker_open",
        name: "Circuit Breaker Open",
        condition: {
          type: "circuit_breaker",
          operator: "eq",
          value: 1, // Open state
          confidence: 0.95,
        },
        targetLevel: "safe",
        priority: 10,
        cooldownPeriod: 30000, // 30 seconds
      },

      // Resource usage trigger
      {
        id: "high_resource_usage",
        name: "High Resource Usage",
        condition: {
          type: "resource_usage",
          metric: "memory_usage",
          operator: "gt",
          value: 0.8, // 80% memory usage
          confidence: 0.75,
        },
        targetLevel: "conservative",
        priority: 7,
        cooldownPeriod: 180000, // 3 minutes
      },
    ];
  }

  /**
   * Report an operation result and potentially trigger degradation
   */
  async reportOperation(
    operation: string,
    success: boolean,
    metrics?: {
      loadTime?: number;
      errorType?: string;
      resourceUsage?: number;
    },
    error?: Error
  ): Promise<void> {
    await this.initialize();

    if (success) {
      await this.handleSuccess(operation, metrics);
    } else {
      await this.handleFailure(operation, error, metrics);
    }

    // Check for automatic degradation triggers
    await this.checkTriggers();

    // Attempt automatic recovery if appropriate
    await this.attemptRecovery();
  }

  /**
   * Handle successful operation
   */
  private async handleSuccess(
    operation: string,
    metrics?: { loadTime?: number; resourceUsage?: number }
  ): Promise<void> {
    this.state.consecutiveSuccesses++;
    this.state.consecutiveFailures = 0;

    // Check if we can upgrade to a more aggressive level
    const currentLevel = this.levels[this.state.currentLevel];
    if (currentLevel && this.state.consecutiveSuccesses >= currentLevel.recovery.successThreshold) {
      await this.attemptUpgrade();
    }

    logger.debug("Operation success reported", {
      event: "ll_operation_success",
      ll_operation: operation,
      ll_consecutive_successes: this.state.consecutiveSuccesses,
      ll_current_level: this.state.currentLevel,
    });
  }

  /**
   * Handle failed operation
   */
  private async handleFailure(
    operation: string,
    error?: Error,
    metrics?: { loadTime?: number; resourceUsage?: number }
  ): Promise<void> {
    this.state.consecutiveFailures++;
    this.state.consecutiveSuccesses = 0;

    // Store last error for analysis
    if (error) {
      this.state.lastError = {
        type: error.name,
        message: error.message,
        timestamp: Date.now(),
        context: { operation, ...metrics },
      };
    }

    // Check if we need to degrade
    const currentLevel = this.levels[this.state.currentLevel];
    if (currentLevel && this.state.consecutiveFailures >= currentLevel.recovery.failureThreshold) {
      const degradationReason = error ?
        this.patternAnalyzer.analyzeError(error, { operation, ...metrics }) :
        { degradationLevel: "conservative", confidence: 0.7, recoveryTime: 30000 };

      if (degradationReason) {
        await this.degradeToLevel(degradationReason.degradationLevel, {
          reason: "automatic_degradation",
          trigger: "consecutive_failures",
          confidence: degradationReason.confidence,
          error: error?.message,
        });
      }
    }

    logger.warn("Operation failure reported", {
      event: "ll_operation_failure",
      ll_operation: operation,
      ll_consecutive_failures: this.state.consecutiveFailures,
      ll_current_level: this.state.currentLevel,
      ll_error: error?.message,
    });
  }

  /**
   * Check automatic triggers
   */
  private async checkTriggers(): Promise<void> {
    const now = Date.now();

    for (const trigger of this.triggers) {
      // Check cooldown
      if (trigger.lastTriggered &&
          now - trigger.lastTriggered < trigger.cooldownPeriod) {
        continue;
      }

      const shouldTrigger = await this.evaluateTrigger(trigger);
      if (shouldTrigger) {
        await this.degradeToLevel(trigger.targetLevel, {
          reason: "trigger_activated",
          trigger: trigger.id,
          confidence: trigger.condition.confidence || 0.8,
        });

        trigger.lastTriggered = now;
        break; // Only one trigger at a time
      }
    }
  }

  /**
   * Evaluate if a trigger should activate
   */
  private async evaluateTrigger(trigger: DegradationTrigger): Promise<boolean> {
    switch (trigger.condition.type) {
      case "error_rate":
        return this.evaluateErrorRateTrigger(trigger.condition);

      case "performance_threshold":
        return this.evaluatePerformanceTrigger(trigger.condition);

      case "circuit_breaker":
        return this.evaluateCircuitBreakerTrigger();

      case "resource_usage":
        return this.evaluateResourceUsageTrigger(trigger.condition);

      default:
        return false;
    }
  }

  private evaluateErrorRateTrigger(condition: DegradationCondition): boolean {
    // Simplified: check recent error rate from circuit breaker metrics
    const health = lazyLoadingCircuitBreaker.getHealthStatus();
    const errorRate = 1 - (health.uptime / 100);

    switch (condition.operator) {
      case "gt": return errorRate > condition.value;
      case "gte": return errorRate >= condition.value;
      default: return false;
    }
  }

  private evaluatePerformanceTrigger(condition: DegradationCondition): boolean {
    // Simplified: check if we have recent performance data indicating issues
    // In practice, this would check actual performance metrics
    return false; // Placeholder
  }

  private evaluateCircuitBreakerTrigger(): boolean {
    const health = lazyLoadingCircuitBreaker.getHealthStatus();
    return health.overall === "unhealthy" || health.openCircuits.length > 0;
  }

  private evaluateResourceUsageTrigger(condition: DegradationCondition): boolean {
    // Simplified: check memory usage if available
    if (typeof performance !== "undefined" && (performance as any).memory) {
      const memoryUsage = (performance as any).memory.usedJSHeapSize /
                         (performance as any).memory.totalJSHeapSize;

      switch (condition.operator) {
        case "gt": return memoryUsage > condition.value;
        case "gte": return memoryUsage >= condition.value;
        default: return false;
      }
    }
    return false;
  }

  /**
   * Degrade to a specific level
   */
  async degradeToLevel(
    levelId: string,
    context: {
      reason: string;
      trigger?: string;
      confidence: number;
      error?: string;
    }
  ): Promise<void> {
    if (!this.levels[levelId]) {
      logger.warn("Invalid degradation level requested", {
        event: "ll_invalid_degradation_level",
        ll_requested_level: levelId,
      });
      return;
    }

    const previousLevel = this.state.currentLevel;
    if (previousLevel === levelId) return; // Already at this level

    this.state.currentLevel = levelId;
    this.state.lastChanged = Date.now();
    this.state.consecutiveSuccesses = 0;
    this.state.consecutiveFailures = 0;
    this.state.totalTransitions++;
    this.state.forcedDegradation = false;

    await this.persistState();
    await this.applyDegradationLevel();

    logger.warn("Degraded to new level", {
      event: "ll_degradation_applied",
      ll_from_level: previousLevel,
      ll_to_level: levelId,
      ll_reason: context.reason,
      ll_trigger: context.trigger,
      ll_confidence: context.confidence,
      ll_error: context.error,
    });
  }

  /**
   * Attempt to upgrade to a more aggressive level
   */
  private async attemptUpgrade(): Promise<void> {
    const currentLevel = this.levels[this.state.currentLevel];
    if (!currentLevel) return;

    // Find next more aggressive level
    const sortedLevels = Object.values(this.levels)
      .sort((a, b) => b.priority - a.priority); // Most aggressive first

    const currentIndex = sortedLevels.findIndex(l => l.id === this.state.currentLevel);
    if (currentIndex > 0) { // There's a more aggressive level available
      const nextLevel = sortedLevels[currentIndex - 1];

      // Only upgrade if we're confident
      if (this.state.consecutiveSuccesses >= nextLevel.recovery.successThreshold) {
        await this.upgradeToLevel(nextLevel.id, {
          reason: "automatic_upgrade",
          confidence: 0.8,
          consecutiveSuccesses: this.state.consecutiveSuccesses,
        });
      }
    }
  }

  /**
   * Upgrade to a more aggressive level
   */
  private async upgradeToLevel(
    levelId: string,
    context: {
      reason: string;
      confidence: number;
      consecutiveSuccesses: number;
    }
  ): Promise<void> {
    const previousLevel = this.state.currentLevel;

    this.state.currentLevel = levelId;
    this.state.lastChanged = Date.now();
    this.state.consecutiveSuccesses = 0;
    this.state.recoveryAttempts++;

    await this.persistState();
    await this.applyDegradationLevel();

    logger.info("Upgraded to more aggressive level", {
      event: "ll_upgrade_applied",
      ll_from_level: previousLevel,
      ll_to_level: levelId,
      ll_reason: context.reason,
      ll_confidence: context.confidence,
      ll_consecutive_successes: context.consecutiveSuccesses,
    });
  }

  /**
   * Attempt automatic recovery
   */
  private async attemptRecovery(): Promise<void> {
    const currentLevel = this.levels[this.state.currentLevel];
    if (!currentLevel || this.state.forcedDegradation) return;

    const timeSinceLastChange = Date.now() - this.state.lastChanged;
    if (timeSinceLastChange >= currentLevel.recovery.autoRecoveryTime) {
      // Try to recover by upgrading one level
      await this.attemptUpgrade();
    }
  }

  /**
   * Apply the current degradation level to the system
   */
  private async applyDegradationLevel(): Promise<void> {
    const level = this.levels[this.state.currentLevel];
    if (!level) return;

    // Apply capabilities to the system
    // This would integrate with other managers to enable/disable features
    logger.info("Applying degradation level capabilities", {
      event: "ll_degradation_level_applied",
      ll_level: level.id,
      ll_capabilities: level.capabilities,
    });

    // Here we would:
    // 1. Configure intersection observer based on capabilities
    // 2. Enable/disable adaptive thresholds
    // 3. Adjust concurrent request limits
    // 4. Modify cache strategies
    // 5. Enable/disable analytics tracking
    // etc.

    // For now, just log the intent
    // In production, this would integrate with all the other managers
  }

  /**
   * Manually force a degradation level
   */
  async forceDegradation(levelId: string, reason: string): Promise<boolean> {
    await this.initialize();

    if (!this.levels[levelId]) return false;

    this.state.forcedDegradation = true;
    await this.degradeToLevel(levelId, {
      reason: `manual_forced_${reason}`,
      confidence: 1.0,
    });

    return true;
  }

  /**
   * Reset to default level
   */
  async resetToDefault(): Promise<void> {
    await this.degradeToLevel("progressive", {
      reason: "manual_reset",
      confidence: 1.0,
    });
  }

  /**
   * Persist current state
   */
  private async persistState(): Promise<void> {
    try {
      await AtomicStorage.atomicUpdate(
        "graceful_degradation_state",
        () => ({
          state: this.state,
          lastUpdated: Date.now(),
        }),
        {}
      );
    } catch (error) {
      logger.error("Failed to persist degradation state", {
        event: "ll_degradation_persist_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Load persisted state
   */
  private async loadPersistedState(): Promise<void> {
    try {
      const persisted = storageManager.getItem("graceful_degradation_state");
      if (persisted && persisted.state) {
        this.state = { ...this.state, ...persisted.state };
      }
    } catch (error) {
      logger.error("Failed to load persisted degradation state", {
        event: "ll_degradation_load_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get current degradation state
   */
  getState(): DegradationState {
    return { ...this.state };
  }

  /**
   * Get current degradation level
   */
  getCurrentLevel(): DegradationLevel | null {
    return this.levels[this.state.currentLevel] || null;
  }

  /**
   * Get all available levels
   */
  getAvailableLevels(): Record<string, DegradationLevel> {
    return { ...this.levels };
  }

  /**
   * Get system statistics
   */
  getStats() {
    const health = lazyLoadingCircuitBreaker.getHealthStatus();

    return {
      initialized: this.initialized,
      currentLevel: this.state.currentLevel,
      totalTransitions: this.state.totalTransitions,
      consecutiveSuccesses: this.state.consecutiveSuccesses,
      consecutiveFailures: this.state.consecutiveFailures,
      recoveryAttempts: this.state.recoveryAttempts,
      circuitBreakerHealth: health.overall,
      availableLevels: Object.keys(this.levels).length,
      activeTriggers: this.triggers.filter(t => t.lastTriggered).length,
    };
  }
}

// Export singleton
export const gracefulDegradationManager = GracefulDegradationManager.getInstance();
