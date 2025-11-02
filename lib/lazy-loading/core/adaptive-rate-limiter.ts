"use client";

import { logger } from "../../observability/logger";
import { storageManager, AtomicStorage } from "./storage-manager";

/**
 * Adaptive Rate Limiter - Phase 3 Correction
 * Solves H3.22: Rate limiting adaptativo
 */

export interface RateLimitConfig {
  id: string;
  name: string;
  description: string;

  // Base limits
  baseRequestsPerSecond: number;
  baseRequestsPerMinute: number;
  baseConcurrentRequests: number;

  // Adaptive factors
  cpuMultiplier: number; // How much CPU affects limits
  memoryMultiplier: number; // How much memory affects limits
  networkMultiplier: number; // How much network affects limits
  userPriorityMultiplier: number; // How user priority affects limits

  // Burst handling
  burstAllowance: number; // Percentage above base for bursts
  burstRecoveryRate: number; // How quickly burst capacity recovers

  // Learning parameters
  adaptationRate: number; // How quickly to adapt (0-1)
  minLimit: number; // Minimum requests per second
  maxLimit: number; // Maximum requests per second

  // Resource thresholds
  highCpuThreshold: number; // CPU % that triggers reduction
  highMemoryThreshold: number; // Memory % that triggers reduction
  slowNetworkThreshold: number; // RTT ms that triggers reduction
}

export interface RateLimitState {
  currentRequestsPerSecond: number;
  currentRequestsPerMinute: number;
  currentConcurrentRequests: number;

  // Resource usage
  currentCpuUsage: number;
  currentMemoryUsage: number;
  currentNetworkRtt: number;

  // Usage tracking
  requestsThisSecond: number;
  requestsThisMinute: number;
  concurrentRequests: number;
  lastRequestTime: number;

  // Adaptation tracking
  adaptationFactor: number; // Current adaptation multiplier
  lastAdapted: number;
  adaptationHistory: Array<{
    timestamp: number;
    factor: number;
    reason: string;
    resourceUsage: Record<string, number>;
  }>;
}

export interface RateLimitDecision {
  allowed: boolean;
  waitTime?: number; // ms to wait before retry
  reason?: string;
  currentLimits: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    concurrentRequests: number;
  };
  resourceUsage: Record<string, number>;
}

export interface UserPriority {
  level: "low" | "medium" | "high" | "critical";
  score: number; // 0-1, affects rate limit allocation
  sessionId?: string;
  userId?: string;
}

/**
 * Resource Monitor for adaptive decisions
 */
class ResourceMonitor {
  private static instance: ResourceMonitor;
  private lastMeasurements: Map<string, number> = new Map();

  static getInstance(): ResourceMonitor {
    if (!ResourceMonitor.instance) {
      ResourceMonitor.instance = new ResourceMonitor();
    }
    return ResourceMonitor.instance;
  }

  /**
   * Get current CPU usage (simplified)
   */
  getCpuUsage(): number {
    // In a real implementation, this would use Performance API or Web Workers
    // For now, estimate based on request patterns
    const now = Date.now();
    const recentActivity = Array.from(this.lastMeasurements.values())
      .filter(timestamp => now - timestamp < 5000).length; // Last 5 seconds

    // Simulate CPU usage based on recent activity
    return Math.min(100, recentActivity * 2);
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): number {
    if (typeof performance !== "undefined" && (performance as any).memory) {
      const memInfo = (performance as any).memory;
      const used = memInfo.usedJSHeapSize;
      const total = memInfo.totalJSHeapSize || memInfo.jsHeapSizeLimit;

      if (total > 0) {
        return (used / total) * 100;
      }
    }

    // Fallback: estimate based on localStorage usage
    try {
      let storageSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          storageSize += key.length + (localStorage.getItem(key)?.length || 0);
        }
      }
      // Rough estimate: 10MB localStorage = 50% memory usage
      return Math.min(100, (storageSize / 10000000) * 50);
    } catch {
      return 30; // Default assumption
    }
  }

  /**
   * Get current network RTT
   */
  getNetworkRtt(): number {
    // This would typically use the Network Information API
    if (typeof navigator !== "undefined" && "connection" in navigator) {
      const connection = (navigator as any).connection;
      if (connection && connection.rtt) {
        return connection.rtt;
      }
    }

    // Fallback: estimate based on recent request performance
    // For now, return a reasonable default
    return 100; // 100ms default
  }

  /**
   * Record activity for resource estimation
   */
  recordActivity(type: string): void {
    this.lastMeasurements.set(type, Date.now());

    // Clean old measurements
    const cutoff = Date.now() - 30000; // 30 seconds
    for (const [key, timestamp] of this.lastMeasurements) {
      if (timestamp < cutoff) {
        this.lastMeasurements.delete(key);
      }
    }
  }

  /**
   * Get resource pressure score (0-1, higher = more pressure)
   */
  getResourcePressure(): {
    score: number;
    breakdown: {
      cpu: number;
      memory: number;
      network: number;
    };
  } {
    const cpu = this.getCpuUsage() / 100;
    const memory = this.getMemoryUsage() / 100;
    const network = Math.min(1, this.getNetworkRtt() / 1000); // Normalize to 0-1 (1000ms = 1)

    // Weighted average: CPU 40%, Memory 40%, Network 20%
    const score = cpu * 0.4 + memory * 0.4 + network * 0.2;

    return {
      score,
      breakdown: { cpu, memory, network },
    };
  }
}

/**
 * User Priority Manager
 */
class UserPriorityManager {
  private priorities: Map<string, UserPriority> = new Map();

  /**
   * Get user priority for rate limiting
   */
  getUserPriority(userId?: string, sessionId?: string): UserPriority {
    const key = userId || sessionId || "anonymous";

    if (this.priorities.has(key)) {
      return this.priorities.get(key)!;
    }

    // Default priorities based on session characteristics
    let priority: UserPriority;

    if (userId) {
      // Registered users get higher priority
      priority = {
        level: "high",
        score: 0.8,
        userId,
        sessionId,
      };
    } else if (sessionId) {
      // Known session gets medium priority
      priority = {
        level: "medium",
        score: 0.6,
        sessionId,
      };
    } else {
      // Anonymous gets low priority
      priority = {
        level: "low",
        score: 0.3,
      };
    }

    this.priorities.set(key, priority);
    return priority;
  }

  /**
   * Update user priority based on behavior
   */
  updateUserPriority(userId: string, behavior: {
    engagementScore: number;
    sessionDuration: number;
    conversionActions: number;
    errorRate: number;
  }): void {
    const current = this.priorities.get(userId);
    if (!current) return;

    // Calculate new priority score based on behavior
    let newScore = 0.5; // Base score

    // Engagement bonus
    newScore += behavior.engagementScore * 0.2;

    // Session duration bonus (up to 20 points for 30+ minutes)
    newScore += Math.min(0.2, (behavior.sessionDuration / 1800000) * 0.2);

    // Conversion bonus
    newScore += behavior.conversionActions * 0.1;

    // Error penalty
    newScore -= behavior.errorRate * 0.3;

    // Clamp to 0-1
    newScore = Math.max(0, Math.min(1, newScore));

    // Update level based on score
    let level: "low" | "medium" | "high" | "critical";
    if (newScore >= 0.8) level = "critical";
    else if (newScore >= 0.6) level = "high";
    else if (newScore >= 0.4) level = "medium";
    else level = "low";

    this.priorities.set(userId, {
      ...current,
      level,
      score: newScore,
    });
  }
}

/**
 * Adaptive Rate Limiter
 */
export class AdaptiveRateLimiter {
  private configs: Map<string, RateLimitConfig> = new Map();
  private states: Map<string, RateLimitState> = new Map();
  private resourceMonitor: ResourceMonitor;
  private priorityManager: UserPriorityManager;
  private static instance: AdaptiveRateLimiter;
  private initialized = false;

  constructor() {
    this.resourceMonitor = ResourceMonitor.getInstance();
    this.priorityManager = new UserPriorityManager();
  }

  static getInstance(): AdaptiveRateLimiter {
    if (!AdaptiveRateLimiter.instance) {
      AdaptiveRateLimiter.instance = new AdaptiveRateLimiter();
    }
    return AdaptiveRateLimiter.instance;
  }

  /**
   * Initialize the rate limiter
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.defineDefaultConfigs();
    await this.loadPersistedStates();

    this.initialized = true;

    logger.info("Adaptive Rate Limiter initialized", {
      event: "ll_adaptive_rate_limiter_initialized",
      ll_configs_defined: this.configs.size,
    });
  }

  /**
   * Define default rate limit configurations
   */
  private defineDefaultConfigs(): void {
    // Image loading - most common, moderate limits
    this.configs.set("image_loading", {
      id: "image_loading",
      name: "Image Loading",
      description: "Rate limiting for image loading operations",
      baseRequestsPerSecond: 5,
      baseRequestsPerMinute: 100,
      baseConcurrentRequests: 3,
      cpuMultiplier: 0.7, // CPU intensive
      memoryMultiplier: 0.8, // Memory intensive
      networkMultiplier: 1.0, // Network dependent
      userPriorityMultiplier: 0.6,
      burstAllowance: 50, // 50% burst
      burstRecoveryRate: 0.1, // 10% per second recovery
      adaptationRate: 0.1,
      minLimit: 1,
      maxLimit: 20,
      highCpuThreshold: 70,
      highMemoryThreshold: 80,
      slowNetworkThreshold: 500,
    });

    // API calls - critical, stricter limits
    this.configs.set("api_calls", {
      id: "api_calls",
      name: "API Calls",
      description: "Rate limiting for API operations",
      baseRequestsPerSecond: 2,
      baseRequestsPerMinute: 30,
      baseConcurrentRequests: 2,
      cpuMultiplier: 0.3,
      memoryMultiplier: 0.2,
      networkMultiplier: 1.2, // Very network dependent
      userPriorityMultiplier: 0.8, // Important operations
      burstAllowance: 25,
      burstRecoveryRate: 0.05,
      adaptationRate: 0.05, // Slower adaptation for critical ops
      minLimit: 0.5,
      maxLimit: 10,
      highCpuThreshold: 60,
      highMemoryThreshold: 70,
      slowNetworkThreshold: 300,
    });

    // Cache operations - fast, generous limits
    this.configs.set("cache_operations", {
      id: "cache_operations",
      name: "Cache Operations",
      description: "Rate limiting for cache read/write operations",
      baseRequestsPerSecond: 50,
      baseRequestsPerMinute: 2000,
      baseConcurrentRequests: 10,
      cpuMultiplier: 0.2,
      memoryMultiplier: 0.9, // Memory intensive
      networkMultiplier: 0.1, // Mostly local
      userPriorityMultiplier: 0.4,
      burstAllowance: 100,
      burstRecoveryRate: 0.2,
      adaptationRate: 0.2,
      minLimit: 10,
      maxLimit: 200,
      highCpuThreshold: 80,
      highMemoryThreshold: 90,
      slowNetworkThreshold: 1000,
    });

    // Script loading - important, moderate limits
    this.configs.set("script_loading", {
      id: "script_loading",
      name: "Script Loading",
      description: "Rate limiting for JavaScript loading",
      baseRequestsPerSecond: 3,
      baseRequestsPerMinute: 50,
      baseConcurrentRequests: 2,
      cpuMultiplier: 0.8, // CPU intensive (parsing)
      memoryMultiplier: 0.6,
      networkMultiplier: 0.9,
      userPriorityMultiplier: 0.7,
      burstAllowance: 30,
      burstRecoveryRate: 0.08,
      adaptationRate: 0.08,
      minLimit: 1,
      maxLimit: 15,
      highCpuThreshold: 75,
      highMemoryThreshold: 85,
      slowNetworkThreshold: 400,
    });
  }

  /**
   * Check if a request should be allowed
   */
  async checkRateLimit(
    operationType: string,
    userId?: string,
    sessionId?: string,
    metadata?: Record<string, any>
  ): Promise<RateLimitDecision> {
    await this.initialize();

    const config = this.configs.get(operationType);
    if (!config) {
      // No config = allow (fail open)
      return {
        allowed: true,
        currentLimits: {
          requestsPerSecond: 1000,
          requestsPerMinute: 60000,
          concurrentRequests: 100,
        },
        resourceUsage: {},
      };
    }

    const state = this.getOrCreateState(operationType);
    const userPriority = this.priorityManager.getUserPriority(userId, sessionId);

    // Record activity for resource monitoring
    this.resourceMonitor.recordActivity(operationType);

    // Update resource usage in state
    this.updateResourceUsage(state);

    // Adapt limits based on current conditions
    this.adaptLimits(state, config, userPriority);

    // Check rate limits
    const decision = this.evaluateRateLimits(state, config);

    // Update state with this request attempt
    this.updateStateWithRequest(state, decision.allowed);

    if (!decision.allowed) {
      logger.debug("Rate limit exceeded", {
        event: "ll_rate_limit_exceeded",
        ll_operation_type: operationType,
        ll_user_priority: userPriority.level,
        ll_current_limits: decision.currentLimits,
        ll_wait_time: decision.waitTime,
      });
    }

    return decision;
  }

  /**
   * Record a successful operation
   */
  async recordSuccess(operationType: string, responseTime?: number): Promise<void> {
    const state = this.states.get(operationType);
    if (!state) return;

    // Use success as signal for potential limit increase
    this.adaptLimitsBasedOnSuccess(state, operationType);
  }

  /**
   * Record a failed operation
   */
  async recordFailure(operationType: string, errorType?: string): Promise<void> {
    const state = this.states.get(operationType);
    if (!state) return;

    // Use failure as signal for limit decrease
    this.adaptLimitsBasedOnFailure(state, operationType, errorType);
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(operationType: string): {
    config: RateLimitConfig;
    state: RateLimitState;
    resourcePressure: number;
  } | null {
    const config = this.configs.get(operationType);
    const state = this.states.get(operationType);

    if (!config || !state) return null;

    const resourcePressure = this.resourceMonitor.getResourcePressure();

    return {
      config,
      state,
      resourcePressure: resourcePressure.score,
    };
  }

  /**
   * Force adaptation of limits
   */
  async forceAdaptation(operationType: string, reason: string): Promise<void> {
    const config = this.configs.get(operationType);
    const state = this.states.get(operationType);

    if (!config || !state) return;

    const oldLimits = {
      requestsPerSecond: state.currentRequestsPerSecond,
      requestsPerMinute: state.currentRequestsPerMinute,
      concurrentRequests: state.currentConcurrentRequests,
    };

    this.adaptLimits(state, config, { level: "medium", score: 0.5 });

    const newLimits = {
      requestsPerSecond: state.currentRequestsPerSecond,
      requestsPerMinute: state.currentRequestsPerMinute,
      concurrentRequests: state.currentConcurrentRequests,
    };

    logger.info("Forced rate limit adaptation", {
      event: "ll_rate_limit_forced_adaptation",
      ll_operation_type: operationType,
      ll_reason: reason,
      ll_old_limits: oldLimits,
      ll_new_limits: newLimits,
    });
  }

  /**
   * Get or create state for operation type
   */
  private getOrCreateState(operationType: string): RateLimitState {
    if (!this.states.has(operationType)) {
      const config = this.configs.get(operationType);
      const baseLimits = config ? {
        requestsPerSecond: config.baseRequestsPerSecond,
        requestsPerMinute: config.baseRequestsPerMinute,
        concurrentRequests: config.baseConcurrentRequests,
      } : {
        requestsPerSecond: 10,
        requestsPerMinute: 100,
        concurrentRequests: 5,
      };

      this.states.set(operationType, {
        currentRequestsPerSecond: baseLimits.requestsPerSecond,
        currentRequestsPerMinute: baseLimits.requestsPerMinute,
        currentConcurrentRequests: baseLimits.concurrentRequests,
        currentCpuUsage: 0,
        currentMemoryUsage: 0,
        currentNetworkRtt: 0,
        requestsThisSecond: 0,
        requestsThisMinute: 0,
        concurrentRequests: 0,
        lastRequestTime: 0,
        adaptationFactor: 1.0,
        lastAdapted: Date.now(),
        adaptationHistory: [],
      });
    }

    return this.states.get(operationType)!;
  }

  /**
   * Update resource usage in state
   */
  private updateResourceUsage(state: RateLimitState): void {
    state.currentCpuUsage = this.resourceMonitor.getCpuUsage();
    state.currentMemoryUsage = this.resourceMonitor.getMemoryUsage();
    state.currentNetworkRtt = this.resourceMonitor.getNetworkRtt();
  }

  /**
   * Adapt limits based on current conditions
   */
  private adaptLimits(
    state: RateLimitState,
    config: RateLimitConfig,
    userPriority: UserPriority
  ): void {
    const now = Date.now();
    const timeSinceLastAdaptation = now - state.lastAdapted;

    // Only adapt if enough time has passed (minimum 5 seconds)
    if (timeSinceLastAdaptation < 5000) return;

    const resourcePressure = this.resourceMonitor.getResourcePressure();

    // Calculate adaptation factors
    const cpuFactor = 1 - (state.currentCpuUsage / 100) * config.cpuMultiplier;
    const memoryFactor = 1 - (state.currentMemoryUsage / 100) * config.memoryMultiplier;
    const networkFactor = 1 - Math.min(1, state.currentNetworkRtt / 1000) * config.networkMultiplier;
    const priorityFactor = 1 + (userPriority.score - 0.5) * config.userPriorityMultiplier;

    // Combined adaptation factor
    const combinedFactor = cpuFactor * memoryFactor * networkFactor * priorityFactor;

    // Smooth adaptation using exponential moving average
    const smoothedFactor = state.adaptationFactor * (1 - config.adaptationRate) +
                          combinedFactor * config.adaptationRate;

    // Clamp to reasonable bounds
    const clampedFactor = Math.max(0.1, Math.min(3.0, smoothedFactor));

    // Apply adaptation to limits
    state.currentRequestsPerSecond = Math.max(
      config.minLimit,
      Math.min(config.maxLimit, config.baseRequestsPerSecond * clampedFactor)
    );

    state.currentRequestsPerMinute = Math.max(
      config.minLimit * 60,
      Math.min(config.maxLimit * 60, config.baseRequestsPerMinute * clampedFactor)
    );

    state.currentConcurrentRequests = Math.max(
      1,
      Math.min(20, Math.round(config.baseConcurrentRequests * clampedFactor))
    );

    // Record adaptation
    state.adaptationFactor = clampedFactor;
    state.lastAdapted = now;

    state.adaptationHistory.push({
      timestamp: now,
      factor: clampedFactor,
      reason: `cpu:${state.currentCpuUsage}%, mem:${state.currentMemoryUsage}%, net:${state.currentNetworkRtt}ms`,
      resourceUsage: {
        cpu: state.currentCpuUsage,
        memory: state.currentMemoryUsage,
        networkRtt: state.currentNetworkRtt,
      },
    });

    // Keep only last 10 adaptations
    if (state.adaptationHistory.length > 10) {
      state.adaptationHistory = state.adaptationHistory.slice(-10);
    }

    logger.debug("Adapted rate limits", {
      event: "ll_rate_limits_adapted",
      ll_operation_type: config.id,
      ll_old_factor: state.adaptationFactor / clampedFactor, // Previous factor
      ll_new_factor: clampedFactor,
      ll_new_limits: {
        requestsPerSecond: state.currentRequestsPerSecond,
        requestsPerMinute: state.currentRequestsPerMinute,
        concurrentRequests: state.currentConcurrentRequests,
      },
      ll_resource_pressure: resourcePressure.score,
    });
  }

  /**
   * Evaluate if request should be allowed based on current limits
   */
  private evaluateRateLimits(state: RateLimitState, config: RateLimitConfig): RateLimitDecision {
    const now = Date.now();
    const secondStart = Math.floor(now / 1000) * 1000;
    const minuteStart = Math.floor(now / 60000) * 60000;

    // Reset counters if time window changed
    if (state.lastRequestTime < secondStart) {
      state.requestsThisSecond = 0;
    }
    if (state.lastRequestTime < minuteStart) {
      state.requestsThisMinute = 0;
    }

    // Check concurrent requests
    if (state.concurrentRequests >= state.currentConcurrentRequests) {
      return {
        allowed: false,
        waitTime: 1000, // Wait 1 second
        reason: "Concurrent request limit exceeded",
        currentLimits: {
          requestsPerSecond: state.currentRequestsPerSecond,
          requestsPerMinute: state.currentRequestsPerMinute,
          concurrentRequests: state.currentConcurrentRequests,
        },
        resourceUsage: {
          cpu: state.currentCpuUsage,
          memory: state.currentMemoryUsage,
          networkRtt: state.currentNetworkRtt,
        },
      };
    }

    // Check per-second limit
    if (state.requestsThisSecond >= state.currentRequestsPerSecond) {
      const timeToNextSecond = 1000 - (now - secondStart);
      return {
        allowed: false,
        waitTime: timeToNextSecond,
        reason: "Per-second rate limit exceeded",
        currentLimits: {
          requestsPerSecond: state.currentRequestsPerSecond,
          requestsPerMinute: state.currentRequestsPerMinute,
          concurrentRequests: state.currentConcurrentRequests,
        },
        resourceUsage: {
          cpu: state.currentCpuUsage,
          memory: state.currentMemoryUsage,
          networkRtt: state.currentNetworkRtt,
        },
      };
    }

    // Check per-minute limit
    if (state.requestsThisMinute >= state.currentRequestsPerMinute) {
      const timeToNextMinute = 60000 - (now - minuteStart);
      return {
        allowed: false,
        waitTime: timeToNextMinute,
        reason: "Per-minute rate limit exceeded",
        currentLimits: {
          requestsPerSecond: state.currentRequestsPerSecond,
          requestsPerMinute: state.currentRequestsPerMinute,
          concurrentRequests: state.currentConcurrentRequests,
        },
        resourceUsage: {
          cpu: state.currentCpuUsage,
          memory: state.currentMemoryUsage,
          networkRtt: state.currentNetworkRtt,
        },
      };
    }

    return {
      allowed: true,
      currentLimits: {
        requestsPerSecond: state.currentRequestsPerSecond,
        requestsPerMinute: state.currentRequestsPerMinute,
        concurrentRequests: state.currentConcurrentRequests,
      },
      resourceUsage: {
        cpu: state.currentCpuUsage,
        memory: state.currentMemoryUsage,
        networkRtt: state.currentNetworkRtt,
      },
    };
  }

  /**
   * Update state after request attempt
   */
  private updateStateWithRequest(state: RateLimitState, allowed: boolean): void {
    if (allowed) {
      state.requestsThisSecond++;
      state.requestsThisMinute++;
      state.concurrentRequests++;
      state.lastRequestTime = Date.now();
    }
  }

  /**
   * Adapt limits based on success patterns
   */
  private adaptLimitsBasedOnSuccess(state: RateLimitState, operationType: string): void {
    // Success signals that current limits might be too conservative
    // Gradually increase adaptation factor
    const config = this.configs.get(operationType);
    if (!config) return;

    const successBonus = 0.02; // Small increase on success
    state.adaptationFactor = Math.min(3.0, state.adaptationFactor + successBonus);
  }

  /**
   * Adapt limits based on failure patterns
   */
  private adaptLimitsBasedOnFailure(
    state: RateLimitState,
    operationType: string,
    errorType?: string
  ): void {
    // Failures signal that current limits might be too aggressive
    // Decrease adaptation factor
    const failurePenalty = 0.05; // Moderate decrease on failure
    state.adaptationFactor = Math.max(0.1, state.adaptationFactor - failurePenalty);
  }

  /**
   * Persist rate limiter state
   */
  private async persistStates(): Promise<void> {
    try {
      const stateData: Record<string, RateLimitState> = {};
      for (const [operationType, state] of this.states) {
        stateData[operationType] = state;
      }

      await AtomicStorage.atomicUpdate(
        "adaptive_rate_limiter_states",
        () => ({
          states: stateData,
          lastUpdated: Date.now(),
        }),
        {}
      );
    } catch (error) {
      logger.error("Failed to persist rate limiter states", {
        event: "ll_rate_limiter_persist_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Load persisted states
   */
  private async loadPersistedStates(): Promise<void> {
    try {
      const persisted = storageManager.getItem("adaptive_rate_limiter_states");
      if (persisted && persisted.states) {
        for (const [operationType, state] of Object.entries(persisted.states)) {
          this.states.set(operationType, state as RateLimitState);
        }
      }
    } catch (error) {
      logger.error("Failed to load persisted rate limiter states", {
        event: "ll_rate_limiter_load_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get rate limiter statistics
   */
  getStats() {
    const operationStats: Record<string, any> = {};

    for (const [operationType, state] of this.states) {
      const config = this.configs.get(operationType);
      operationStats[operationType] = {
        currentLimits: {
          requestsPerSecond: state.currentRequestsPerSecond,
          requestsPerMinute: state.currentRequestsPerMinute,
          concurrentRequests: state.currentConcurrentRequests,
        },
        adaptationFactor: state.adaptationFactor,
        resourceUsage: {
          cpu: state.currentCpuUsage,
          memory: state.currentMemoryUsage,
          networkRtt: state.currentNetworkRtt,
        },
        requestCounts: {
          thisSecond: state.requestsThisSecond,
          thisMinute: state.requestsThisMinute,
          concurrent: state.concurrentRequests,
        },
        config: config ? {
          baseRequestsPerSecond: config.baseRequestsPerSecond,
          adaptationRate: config.adaptationRate,
        } : null,
      };
    }

    return {
      initialized: this.initialized,
      operations: this.states.size,
      configs: this.configs.size,
      operationStats,
      resourcePressure: this.resourceMonitor.getResourcePressure(),
    };
  }
}

// Export singleton
export const adaptiveRateLimiter = AdaptiveRateLimiter.getInstance();
