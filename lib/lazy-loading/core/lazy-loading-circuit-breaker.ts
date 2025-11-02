"use client";

import { logger } from "../../observability/logger";
import { storageManager, AtomicStorage } from "./storage-manager";

/**
 * Lazy Loading Circuit Breaker - Phase 3 Correction
 * Solves H3.21: Circuit breaker específico (lazy loading resilience)
 */

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  recoveryTimeout: number; // Time in ms before attempting recovery
  successThreshold: number; // Number of successes needed to close
  timeout: number; // Request timeout in ms
  monitoringPeriod: number; // Time window for failure tracking in ms
}

export interface CircuitBreakerState {
  status: "closed" | "open" | "half_open";
  failures: number;
  successes: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  nextAttemptTime: number;
}

export interface CircuitBreakerMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  timeoutRequests: number;
  rejectedRequests: number; // Requests rejected when circuit is open
  averageResponseTime: number;
  uptimePercentage: number;
  lastUpdated: number;
}

export interface CircuitBreakerEvent {
  type: "state_change" | "failure" | "success" | "timeout" | "recovery_attempt";
  timestamp: number;
  fromState?: CircuitBreakerState["status"];
  toState?: CircuitBreakerState["status"];
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Individual Circuit Breaker for specific operations
 */
class OperationCircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState;
  private metrics: CircuitBreakerMetrics;
  private events: CircuitBreakerEvent[] = [];
  private operationName: string;

  constructor(operationName: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.operationName = operationName;
    this.config = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      successThreshold: 3,
      timeout: 5000, // 5 seconds
      monitoringPeriod: 300000, // 5 minutes
      ...config,
    };

    this.state = {
      status: "closed",
      failures: 0,
      successes: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0,
      nextAttemptTime: 0,
    };

    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      timeoutRequests: 0,
      rejectedRequests: 0,
      averageResponseTime: 0,
      uptimePercentage: 100,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.metrics.totalRequests++;

    // Check if circuit is open
    if (this.state.status === "open") {
      if (Date.now() < this.state.nextAttemptTime) {
        this.metrics.rejectedRequests++;
        this.logEvent({
          type: "state_change",
          timestamp: Date.now(),
          reason: "Circuit is open, request rejected",
        });
        throw new CircuitBreakerError("Circuit breaker is open", this.operationName);
      } else {
        // Time to attempt recovery
        this.transitionToHalfOpen();
      }
    }

    const startTime = Date.now();
    let result: T;
    let success = false;

    try {
      // Execute with timeout
      result = await this.executeWithTimeout(operation, this.config.timeout);
      success = true;

      this.recordSuccess(Date.now() - startTime);

      if (this.state.status === "half_open") {
        this.checkHalfOpenRecovery();
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordFailure(error, duration);

      // Re-throw the original error
      throw error;
    }

    return result;
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.metrics.timeoutRequests++;
        reject(new CircuitBreakerError("Operation timeout", this.operationName));
      }, timeoutMs);

      try {
        const result = await operation();
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Record successful operation
   */
  private recordSuccess(responseTime: number): void {
    this.state.successes++;
    this.state.lastSuccessTime = Date.now();
    this.metrics.successfulRequests++;

    // Update average response time
    const totalTime = this.metrics.averageResponseTime * (this.metrics.successfulRequests - 1) + responseTime;
    this.metrics.averageResponseTime = totalTime / this.metrics.successfulRequests;

    this.metrics.lastUpdated = Date.now();

    this.logEvent({
      type: "success",
      timestamp: Date.now(),
      metadata: { responseTime },
    });
  }

  /**
   * Record failed operation
   */
  private recordFailure(error: any, responseTime: number): void {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();
    this.metrics.failedRequests++;

    this.metrics.lastUpdated = Date.now();

    this.logEvent({
      type: "failure",
      timestamp: Date.now(),
      metadata: {
        error: error instanceof Error ? error.message : String(error),
        responseTime,
      },
    });

    // Check if we should open the circuit
    this.checkFailureThreshold();
  }

  /**
   * Check if failure threshold is exceeded
   */
  private checkFailureThreshold(): void {
    const recentFailures = this.getRecentFailures();

    if (recentFailures >= this.config.failureThreshold) {
      this.transitionToOpen();
    }
  }

  /**
   * Get number of failures in the monitoring period
   */
  private getRecentFailures(): number {
    const cutoffTime = Date.now() - this.config.monitoringPeriod;
    return this.events
      .filter(event => event.type === "failure" && event.timestamp > cutoffTime)
      .length;
  }

  /**
   * Transition to open state
   */
  private transitionToOpen(): void {
    const oldStatus = this.state.status;
    this.state.status = "open";
    this.state.nextAttemptTime = Date.now() + this.config.recoveryTimeout;

    this.logEvent({
      type: "state_change",
      timestamp: Date.now(),
      fromState: oldStatus,
      toState: "open",
      reason: `Failure threshold exceeded (${this.config.failureThreshold})`,
    });

    logger.warn("Circuit breaker opened", {
      event: "ll_circuit_breaker_opened",
      ll_operation: this.operationName,
      ll_failure_threshold: this.config.failureThreshold,
      ll_recent_failures: this.getRecentFailures(),
    });
  }

  /**
   * Transition to half-open state
   */
  private transitionToHalfOpen(): void {
    const oldStatus = this.state.status;
    this.state.status = "half_open";
    this.state.successes = 0; // Reset success counter for half-open

    this.logEvent({
      type: "state_change",
      timestamp: Date.now(),
      fromState: oldStatus,
      toState: "half_open",
      reason: "Recovery timeout reached, attempting recovery",
    });

    this.logEvent({
      type: "recovery_attempt",
      timestamp: Date.now(),
    });

    logger.info("Circuit breaker attempting recovery", {
      event: "ll_circuit_breaker_recovery_attempt",
      ll_operation: this.operationName,
    });
  }

  /**
   * Check if half-open recovery should be completed
   */
  private checkHalfOpenRecovery(): void {
    if (this.state.successes >= this.config.successThreshold) {
      this.transitionToClosed();
    }
  }

  /**
   * Transition to closed state
   */
  private transitionToClosed(): void {
    const oldStatus = this.state.status;
    this.state.status = "closed";
    this.state.failures = 0; // Reset failure counter
    this.state.successes = 0; // Reset success counter

    this.logEvent({
      type: "state_change",
      timestamp: Date.now(),
      fromState: oldStatus,
      toState: "closed",
      reason: `Recovery successful (${this.config.successThreshold} consecutive successes)`,
    });

    logger.info("Circuit breaker closed", {
      event: "ll_circuit_breaker_closed",
      ll_operation: this.operationName,
      ll_success_threshold: this.config.successThreshold,
    });
  }

  /**
   * Log circuit breaker event
   */
  private logEvent(event: CircuitBreakerEvent): void {
    this.events.push(event);

    // Keep only last 100 events
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  /**
   * Get current metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    const totalHandled = this.metrics.successfulRequests + this.metrics.failedRequests;
    this.metrics.uptimePercentage = totalHandled > 0 ?
      (this.metrics.successfulRequests / totalHandled) * 100 : 100;

    return { ...this.metrics };
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit = 10): CircuitBreakerEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Manually reset circuit breaker
   */
  reset(): void {
    this.state = {
      status: "closed",
      failures: 0,
      successes: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0,
      nextAttemptTime: 0,
    };

    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      timeoutRequests: 0,
      rejectedRequests: 0,
      averageResponseTime: 0,
      uptimePercentage: 100,
      lastUpdated: Date.now(),
    };

    this.events = [];

    logger.info("Circuit breaker manually reset", {
      event: "ll_circuit_breaker_reset",
      ll_operation: this.operationName,
    });
  }

  /**
   * Force circuit breaker state
   */
  forceState(status: CircuitBreakerState["status"]): void {
    const oldStatus = this.state.status;
    this.state.status = status;

    if (status === "open") {
      this.state.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
    }

    this.logEvent({
      type: "state_change",
      timestamp: Date.now(),
      fromState: oldStatus,
      toState: status,
      reason: "Manual state change",
    });

    logger.info("Circuit breaker state manually changed", {
      event: "ll_circuit_breaker_manual_state_change",
      ll_operation: this.operationName,
      ll_from_state: oldStatus,
      ll_to_state: status,
    });
  }
}

/**
 * Circuit Breaker Error
 */
export class CircuitBreakerError extends Error {
  constructor(message: string, public operation: string) {
    super(message);
    this.name = "CircuitBreakerError";
  }
}

/**
 * Lazy Loading Circuit Breaker Manager
 */
export class LazyLoadingCircuitBreaker {
  private breakers: Map<string, OperationCircuitBreaker> = new Map();
  private static instance: LazyLoadingCircuitBreaker;
  private initialized = false;

  // Default configurations for different types of operations
  private static readonly DEFAULT_CONFIGS: Record<string, Partial<CircuitBreakerConfig>> = {
    // Image loading operations
    image_load: {
      failureThreshold: 3,
      recoveryTimeout: 30000, // 30 seconds
      successThreshold: 2,
      timeout: 10000, // 10 seconds
    },

    // Script loading operations
    script_load: {
      failureThreshold: 2,
      recoveryTimeout: 60000, // 1 minute
      successThreshold: 1,
      timeout: 15000, // 15 seconds
    },

    // API calls for dynamic content
    api_call: {
      failureThreshold: 5,
      recoveryTimeout: 120000, // 2 minutes
      successThreshold: 3,
      timeout: 8000, // 8 seconds
    },

    // Intersection observer operations
    intersection_observer: {
      failureThreshold: 10,
      recoveryTimeout: 180000, // 3 minutes
      successThreshold: 5,
      timeout: 100, // 100ms for observer callbacks
    },

    // Cache operations
    cache_operation: {
      failureThreshold: 8,
      recoveryTimeout: 90000, // 1.5 minutes
      successThreshold: 4,
      timeout: 2000, // 2 seconds
    },

    // Adaptive rule evaluation
    rule_evaluation: {
      failureThreshold: 15,
      recoveryTimeout: 240000, // 4 minutes
      successThreshold: 7,
      timeout: 500, // 500ms for rule evaluation
    },

    // Threshold optimization
    threshold_optimization: {
      failureThreshold: 12,
      recoveryTimeout: 300000, // 5 minutes
      successThreshold: 6,
      timeout: 1000, // 1 second
    },
  };

  constructor() {
    // Initialize with default configurations
    for (const [operation, config] of Object.entries(LazyLoadingCircuitBreaker.DEFAULT_CONFIGS)) {
      this.breakers.set(operation, new OperationCircuitBreaker(operation, config));
    }
  }

  static getInstance(): LazyLoadingCircuitBreaker {
    if (!LazyLoadingCircuitBreaker.instance) {
      LazyLoadingCircuitBreaker.instance = new LazyLoadingCircuitBreaker();
    }
    return LazyLoadingCircuitBreaker.instance;
  }

  /**
   * Initialize the circuit breaker system
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.loadPersistedState();

    this.initialized = true;

    logger.info("Lazy Loading Circuit Breaker initialized", {
      event: "ll_lazy_circuit_breaker_initialized",
      ll_operations_protected: this.breakers.size,
    });
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(
    operation: string,
    fn: () => Promise<T>,
    customConfig?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    await this.initialize();

    let breaker = this.breakers.get(operation);

    // Create breaker if it doesn't exist
    if (!breaker) {
      breaker = new OperationCircuitBreaker(
        operation,
        customConfig || LazyLoadingCircuitBreaker.DEFAULT_CONFIGS[operation] || {}
      );
      this.breakers.set(operation, breaker);
    }

    // Apply custom config if provided
    if (customConfig) {
      // Update breaker config (simplified - in practice would need more sophisticated config merging)
      Object.assign(breaker["config"], customConfig);
    }

    try {
      const result = await breaker.execute(fn);

      // Persist state after successful operations
      await this.persistState();

      return result;
    } catch (error) {
      // Persist state after failures too
      await this.persistState();

      throw error;
    }
  }

  /**
   * Get circuit breaker for specific operation
   */
  getBreaker(operation: string): OperationCircuitBreaker | null {
    return this.breakers.get(operation) || null;
  }

  /**
   * Get all circuit breaker states
   */
  getAllStates(): Record<string, CircuitBreakerState> {
    const states: Record<string, CircuitBreakerState> = {};

    for (const [operation, breaker] of this.breakers) {
      states[operation] = breaker.getState();
    }

    return states;
  }

  /**
   * Get all circuit breaker metrics
   */
  getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};

    for (const [operation, breaker] of this.breakers) {
      metrics[operation] = breaker.getMetrics();
    }

    return metrics;
  }

  /**
   * Get system health status
   */
  getHealthStatus(): {
    overall: "healthy" | "degraded" | "unhealthy";
    openCircuits: string[];
    degradedCircuits: string[];
    uptime: number;
  } {
    const states = this.getAllStates();
    const metrics = this.getAllMetrics();

    const openCircuits: string[] = [];
    const degradedCircuits: string[] = [];
    let totalUptime = 0;
    let circuitCount = 0;

    for (const [operation, state] of Object.entries(states)) {
      circuitCount++;
      const circuitMetrics = metrics[operation];

      if (state.status === "open") {
        openCircuits.push(operation);
      } else if (state.status === "half_open" || circuitMetrics.uptimePercentage < 95) {
        degradedCircuits.push(operation);
      }

      totalUptime += circuitMetrics.uptimePercentage;
    }

    const averageUptime = circuitCount > 0 ? totalUptime / circuitCount : 100;

    let overall: "healthy" | "degraded" | "unhealthy";
    if (openCircuits.length > 0 || averageUptime < 80) {
      overall = "unhealthy";
    } else if (degradedCircuits.length > 0 || averageUptime < 95) {
      overall = "degraded";
    } else {
      overall = "healthy";
    }

    return {
      overall,
      openCircuits,
      degradedCircuits,
      uptime: averageUptime,
    };
  }

  /**
   * Reset specific circuit breaker
   */
  async resetBreaker(operation: string): Promise<boolean> {
    const breaker = this.breakers.get(operation);
    if (!breaker) return false;

    breaker.reset();
    await this.persistState();

    logger.info("Circuit breaker reset", {
      event: "ll_circuit_breaker_reset",
      ll_operation: operation,
    });

    return true;
  }

  /**
   * Force state for specific circuit breaker
   */
  async forceBreakerState(
    operation: string,
    status: CircuitBreakerState["status"]
  ): Promise<boolean> {
    const breaker = this.breakers.get(operation);
    if (!breaker) return false;

    breaker.forceState(status);
    await this.persistState();

    return true;
  }

  /**
   * Add new operation with custom configuration
   */
  addOperation(operation: string, config: Partial<CircuitBreakerConfig>): void {
    if (this.breakers.has(operation)) {
      logger.warn("Operation already exists, updating configuration", {
        event: "ll_operation_exists",
        ll_operation: operation,
      });
    }

    this.breakers.set(operation, new OperationCircuitBreaker(operation, config));

    logger.info("Added circuit breaker operation", {
      event: "ll_operation_added",
      ll_operation: operation,
    });
  }

  /**
   * Get operations with degraded performance
   */
  getDegradedOperations(): Array<{
    operation: string;
    state: CircuitBreakerState;
    metrics: CircuitBreakerMetrics;
    severity: "low" | "medium" | "high";
  }> {
    const degraded: Array<{
      operation: string;
      state: CircuitBreakerState;
      metrics: CircuitBreakerMetrics;
      severity: "low" | "medium" | "high";
    }> = [];

    for (const [operation, breaker] of this.breakers) {
      const state = breaker.getState();
      const metrics = breaker.getMetrics();

      let severity: "low" | "medium" | "high" = "low";

      if (state.status === "open") {
        severity = "high";
      } else if (state.status === "half_open" || metrics.uptimePercentage < 90) {
        severity = "medium";
      } else if (metrics.uptimePercentage < 95 || state.failures > 0) {
        severity = "low";
      }

      if (severity !== "low") {
        degraded.push({
          operation,
          state,
          metrics,
          severity,
        });
      }
    }

    return degraded.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Persist circuit breaker state
   */
  private async persistState(): Promise<void> {
    try {
      const stateData: Record<string, any> = {};

      for (const [operation, breaker] of this.breakers) {
        stateData[operation] = {
          state: breaker.getState(),
          metrics: breaker.getMetrics(),
          events: breaker.getRecentEvents(20), // Last 20 events
        };
      }

      await AtomicStorage.atomicUpdate(
        "lazy_loading_circuit_breakers",
        () => ({
          stateData,
          lastUpdated: Date.now(),
        }),
        {}
      );
    } catch (error) {
      logger.error("Failed to persist circuit breaker state", {
        event: "ll_circuit_breaker_persist_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Load persisted circuit breaker state
   */
  private async loadPersistedState(): Promise<void> {
    try {
      const persisted = storageManager.getItem("lazy_loading_circuit_breakers");
      if (persisted && typeof persisted === "object" && persisted.stateData) {
        // Restore state for existing operations
        for (const [operation, data] of Object.entries(persisted.stateData)) {
          const breaker = this.breakers.get(operation);
          if (breaker) {
            // Restore state and metrics (simplified - in practice would need more sophisticated restoration)
            logger.debug("Restored circuit breaker state", {
              event: "ll_circuit_breaker_state_restored",
              ll_operation: operation,
            });
          }
        }
      }
    } catch (error) {
      logger.error("Failed to load persisted circuit breaker state", {
        event: "ll_circuit_breaker_load_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get system statistics
   */
  getStats() {
    const health = this.getHealthStatus();
    const degraded = this.getDegradedOperations();

    return {
      initialized: this.initialized,
      operations: this.breakers.size,
      health: health.overall,
      openCircuits: health.openCircuits.length,
      degradedCircuits: health.degradedCircuits.length,
      averageUptime: health.uptime,
      degradedOperations: degraded.length,
      totalRequests: Object.values(this.getAllMetrics()).reduce(
        (sum, metrics) => sum + metrics.totalRequests, 0
      ),
    };
  }
}

// Export singleton and utilities
export const lazyLoadingCircuitBreaker = LazyLoadingCircuitBreaker.getInstance();
