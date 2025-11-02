"use client";

import { logger } from "../../observability/logger";
import { storageManager, AtomicStorage } from "./storage-manager";

/**
 * Temporal Context Manager - Phase 3 Correction
 * Solves H3.5: Context awareness temporal
 */

export interface TemporalContext {
  // Time components
  hourOfDay: number; // 0-23
  minuteOfHour: number; // 0-59
  dayOfWeek: number; // 0-6 (Sunday = 0)
  dayOfMonth: number; // 1-31
  monthOfYear: number; // 0-11
  weekOfYear: number; // 1-52

  // Time categories
  isWeekend: boolean;
  isBusinessHours: boolean; // 9-17 on weekdays
  isPeakHours: boolean; // High traffic periods
  isOffPeakHours: boolean; // Low traffic periods

  // Seasonal patterns
  season: "winter" | "spring" | "summer" | "fall";
  isHoliday: boolean;
  isSpecialEvent: boolean;

  // User behavior patterns
  userEngagement: "low" | "medium" | "high";
  userPatience: "low" | "medium" | "high";
  expectedLoadTime: number; // Expected acceptable load time in ms
}

export interface TemporalPattern {
  id: string;
  name: string;
  description: string;

  // When this pattern applies
  conditions: TemporalCondition[];

  // Behavior adjustments
  adjustments: TemporalAdjustment[];

  // Performance expectations
  expectations: {
    expectedLoadTime: number;
    expectedUserSatisfaction: number;
    expectedBounceRate: number;
  };

  // Historical performance
  performance: TemporalPerformance;

  // Confidence in this pattern
  confidence: number;
  lastUpdated: number;
  activationCount: number;
}

export interface TemporalCondition {
  type: "time_range" | "day_type" | "season" | "traffic_level";
  operator: "eq" | "in" | "between" | "gte" | "lte";
  value: any;
  weight: number; // How important this condition is
}

export interface TemporalAdjustment {
  target: "loading_strategy" | "threshold_value" | "degradation_level" | "cache_strategy";
  adjustment: "increase" | "decrease" | "set";
  value: any;
  reason: string;
}

export interface TemporalPerformance {
  totalActivations: number;
  avgLoadTime: number;
  avgUserSatisfaction: number;
  avgBounceRate: number;
  successRate: number;
  lastMeasured: number;
}

/**
 * Temporal Pattern Learning
 */
class TemporalPatternLearner {
  private patterns: Map<string, TemporalPattern> = new Map();

  constructor() {
    this.initializeDefaultPatterns();
  }

  /**
   * Initialize default temporal patterns based on UX research
   */
  private initializeDefaultPatterns(): void {
    // Business hours pattern - users more impatient
    this.patterns.set("business_hours", {
      id: "business_hours",
      name: "Business Hours",
      description: "Weekday business hours - users expect fast loading",
      conditions: [
        { type: "day_type", operator: "eq", value: "weekday", weight: 0.8 },
        { type: "time_range", operator: "between", value: [9, 17], weight: 0.9 },
      ],
      adjustments: [
        {
          target: "loading_strategy",
          adjustment: "set",
          value: "aggressive",
          reason: "Users expect immediate results during work hours",
        },
        {
          target: "threshold_value",
          adjustment: "decrease",
          value: 0.1, // More aggressive intersection threshold
          reason: "Lower threshold for faster loading perception",
        },
      ],
      expectations: {
        expectedLoadTime: 1500,
        expectedUserSatisfaction: 0.85,
        expectedBounceRate: 0.35,
      },
      performance: {
        totalActivations: 0,
        avgLoadTime: 0,
        avgUserSatisfaction: 0,
        avgBounceRate: 0,
        successRate: 0,
        lastMeasured: 0,
      },
      confidence: 0.8,
      lastUpdated: Date.now(),
      activationCount: 0,
    });

    // Evening/weekend pattern - users more patient
    this.patterns.set("evening_weekend", {
      id: "evening_weekend",
      name: "Evening & Weekend",
      description: "Evening hours and weekends - users more tolerant",
      conditions: [
        { type: "day_type", operator: "in", value: ["weekend", "evening"], weight: 0.7 },
      ],
      adjustments: [
        {
          target: "loading_strategy",
          adjustment: "set",
          value: "progressive",
          reason: "Users more tolerant of progressive loading",
        },
        {
          target: "cache_strategy",
          adjustment: "set",
          value: "balanced",
          reason: "Balance performance with resource usage",
        },
      ],
      expectations: {
        expectedLoadTime: 2500,
        expectedUserSatisfaction: 0.75,
        expectedBounceRate: 0.45,
      },
      performance: {
        totalActivations: 0,
        avgLoadTime: 0,
        avgUserSatisfaction: 0,
        avgBounceRate: 0,
        successRate: 0,
        lastMeasured: 0,
      },
      confidence: 0.7,
      lastUpdated: Date.now(),
      activationCount: 0,
    });

    // Early morning pattern - fresh start, high expectations
    this.patterns.set("early_morning", {
      id: "early_morning",
      name: "Early Morning",
      description: "Early morning hours - fresh start, high productivity expectations",
      conditions: [
        { type: "time_range", operator: "between", value: [6, 9], weight: 0.8 },
        { type: "day_type", operator: "eq", value: "weekday", weight: 0.6 },
      ],
      adjustments: [
        {
          target: "loading_strategy",
          adjustment: "set",
          value: "aggressive",
          reason: "High productivity expectations in early morning",
        },
        {
          target: "degradation_level",
          adjustment: "set",
          value: "progressive", // Start more aggressive
          reason: "Begin with better UX expectations",
        },
      ],
      expectations: {
        expectedLoadTime: 1800,
        expectedUserSatisfaction: 0.8,
        expectedBounceRate: 0.4,
      },
      performance: {
        totalActivations: 0,
        avgLoadTime: 0,
        avgUserSatisfaction: 0,
        avgBounceRate: 0,
        successRate: 0,
        lastMeasured: 0,
      },
      confidence: 0.75,
      lastUpdated: Date.now(),
      activationCount: 0,
    });

    // Holiday season pattern - users more forgiving
    this.patterns.set("holiday_season", {
      id: "holiday_season",
      name: "Holiday Season",
      description: "Holiday periods - users more forgiving of slower loading",
      conditions: [
        { type: "season", operator: "in", value: ["winter_holidays", "summer_holidays"], weight: 0.9 },
      ],
      adjustments: [
        {
          target: "loading_strategy",
          adjustment: "set",
          value: "conservative",
          reason: "More forgiving during holiday periods",
        },
        {
          target: "threshold_value",
          adjustment: "increase",
          value: 0.3, // More conservative threshold
          reason: "Allow more time for loading during holidays",
        },
      ],
      expectations: {
        expectedLoadTime: 3000,
        expectedUserSatisfaction: 0.7,
        expectedBounceRate: 0.5,
      },
      performance: {
        totalActivations: 0,
        avgLoadTime: 0,
        avgUserSatisfaction: 0,
        avgBounceRate: 0,
        successRate: 0,
        lastMeasured: 0,
      },
      confidence: 0.6,
      lastUpdated: Date.now(),
      activationCount: 0,
    });

    // High traffic pattern - optimize for performance
    this.patterns.set("high_traffic", {
      id: "high_traffic",
      name: "High Traffic Period",
      description: "High traffic periods - optimize for scalability",
      conditions: [
        { type: "traffic_level", operator: "eq", value: "high", weight: 0.8 },
      ],
      adjustments: [
        {
          target: "cache_strategy",
          adjustment: "set",
          value: "aggressive",
          reason: "Maximize cache usage during high load",
        },
        {
          target: "loading_strategy",
          adjustment: "set",
          value: "progressive",
          reason: "Progressive loading reduces server load",
        },
      ],
      expectations: {
        expectedLoadTime: 2200,
        expectedUserSatisfaction: 0.75,
        expectedBounceRate: 0.42,
      },
      performance: {
        totalActivations: 0,
        avgLoadTime: 0,
        avgUserSatisfaction: 0,
        avgBounceRate: 0,
        successRate: 0,
        lastMeasured: 0,
      },
      confidence: 0.7,
      lastUpdated: Date.now(),
      activationCount: 0,
    });
  }

  /**
   * Get applicable patterns for current context
   */
  getApplicablePatterns(context: TemporalContext): TemporalPattern[] {
    const applicable: TemporalPattern[] = [];

    for (const pattern of this.patterns.values()) {
      if (this.patternMatchesContext(pattern, context)) {
        applicable.push(pattern);
      }
    }

    // Sort by confidence
    return applicable.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Check if pattern matches current context
   */
  private patternMatchesContext(pattern: TemporalPattern, context: TemporalContext): boolean {
    let totalScore = 0;
    let totalWeight = 0;

    for (const condition of pattern.conditions) {
      const matches = this.evaluateCondition(condition, context);
      const weight = condition.weight;

      if (matches) {
        totalScore += weight;
      }
      totalWeight += weight;
    }

    // Require 70% condition match
    return totalWeight > 0 && (totalScore / totalWeight) >= 0.7;
  }

  /**
   * Evaluate individual condition
   */
  private evaluateCondition(condition: TemporalCondition, context: TemporalContext): boolean {
    switch (condition.type) {
      case "time_range":
        if (condition.operator === "between" && Array.isArray(condition.value)) {
          return context.hourOfDay >= condition.value[0] && context.hourOfDay <= condition.value[1];
        }
        return false;

      case "day_type":
        if (condition.operator === "eq") {
          switch (condition.value) {
            case "weekday":
              return !context.isWeekend;
            case "weekend":
              return context.isWeekend;
            case "business_hours":
              return context.isBusinessHours;
            default:
              return false;
          }
        }
        if (condition.operator === "in" && Array.isArray(condition.value)) {
          return condition.value.some(type => {
            switch (type) {
              case "weekend":
                return context.isWeekend;
              case "evening":
                return context.hourOfDay >= 18 || context.hourOfDay <= 6;
              case "business_hours":
                return context.isBusinessHours;
              default:
                return false;
            }
          });
        }
        return false;

      case "season":
        if (condition.operator === "in" && Array.isArray(condition.value)) {
          return condition.value.includes(context.season) ||
                 (context.isHoliday && condition.value.includes("winter_holidays"));
        }
        return false;

      case "traffic_level":
        // This would need traffic data integration
        // For now, use time-based heuristics
        if (condition.value === "high") {
          return context.isBusinessHours || (context.hourOfDay >= 19 && context.hourOfDay <= 21);
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Update pattern performance
   */
  updatePatternPerformance(patternId: string, metrics: {
    loadTime: number;
    userSatisfaction: number;
    bounceRate: number;
    success: boolean;
  }): void {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return;

    pattern.activationCount++;
    pattern.lastUpdated = Date.now();

    // Update rolling averages
    const total = pattern.performance.totalActivations + 1;
    pattern.performance.totalActivations = total;
    pattern.performance.avgLoadTime =
      (pattern.performance.avgLoadTime * (total - 1) + metrics.loadTime) / total;
    pattern.performance.avgUserSatisfaction =
      (pattern.performance.avgUserSatisfaction * (total - 1) + metrics.userSatisfaction) / total;
    pattern.performance.avgBounceRate =
      (pattern.performance.avgBounceRate * (total - 1) + metrics.bounceRate) / total;

    // Update success rate
    const successCount = pattern.performance.successRate * (total - 1) + (metrics.success ? 1 : 0);
    pattern.performance.successRate = successCount / total;
    pattern.performance.lastMeasured = Date.now();

    // Update confidence based on performance vs expectations
    const loadTimeDiff = Math.abs(metrics.loadTime - pattern.expectations.expectedLoadTime);
    const satisfactionDiff = Math.abs(metrics.userSatisfaction - pattern.expectations.expectedUserSatisfaction);
    const bounceDiff = Math.abs(metrics.bounceRate - pattern.expectations.expectedBounceRate);

    // Lower confidence if performance deviates significantly from expectations
    const deviationPenalty = (loadTimeDiff / 1000 + satisfactionDiff + bounceDiff) / 3;
    pattern.confidence = Math.max(0.1, pattern.confidence * (1 - deviationPenalty * 0.1));

    logger.debug("Updated temporal pattern performance", {
      event: "ll_temporal_pattern_updated",
      ll_pattern_id: patternId,
      ll_load_time: metrics.loadTime,
      ll_user_satisfaction: metrics.userSatisfaction,
      ll_new_confidence: pattern.confidence,
    });
  }
}

/**
 * Temporal Context Manager
 */
export class TemporalContextManager {
  private patternLearner: TemporalPatternLearner;
  private static instance: TemporalContextManager;
  private initialized = false;

  constructor() {
    this.patternLearner = new TemporalPatternLearner();
  }

  static getInstance(): TemporalContextManager {
    if (!TemporalContextManager.instance) {
      TemporalContextManager.instance = new TemporalContextManager();
    }
    return TemporalContextManager.instance;
  }

  /**
   * Initialize the temporal context manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.loadPersistedPatterns();

    this.initialized = true;

    logger.info("Temporal Context Manager initialized", {
      event: "ll_temporal_context_initialized",
    });
  }

  /**
   * Get current temporal context
   */
  getCurrentContext(): TemporalContext {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const dayOfMonth = now.getDate();
    const month = now.getMonth();

    // Calculate week of year (simplified)
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekOfYear = Math.ceil((((now.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7);

    // Time categories
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isBusinessHours = !isWeekend && hour >= 9 && hour <= 17;
    const isPeakHours = this.isPeakHour(hour, dayOfWeek);
    const isOffPeakHours = !isPeakHours;

    // Seasonal patterns
    const season = this.getSeason(month);
    const isHoliday = this.isHoliday(now);
    const isSpecialEvent = this.isSpecialEvent(now);

    // User behavior patterns (would be learned from data)
    const { userEngagement, userPatience, expectedLoadTime } = this.inferUserBehavior(hour, dayOfWeek, isHoliday);

    return {
      hourOfDay: hour,
      minuteOfHour: minute,
      dayOfWeek,
      dayOfMonth,
      monthOfYear: month,
      weekOfYear,
      isWeekend,
      isBusinessHours,
      isPeakHours,
      isOffPeakHours,
      season,
      isHoliday,
      isSpecialEvent,
      userEngagement,
      userPatience,
      expectedLoadTime,
    };
  }

  /**
   * Get applicable temporal patterns and adjustments
   */
  async getTemporalAdjustments(): Promise<{
    patterns: TemporalPattern[];
    adjustments: TemporalAdjustment[];
    context: TemporalContext;
  }> {
    await this.initialize();

    const context = this.getCurrentContext();
    const patterns = this.patternLearner.getApplicablePatterns(context);

    // Collect all adjustments from applicable patterns
    const adjustments: TemporalAdjustment[] = [];
    const seenAdjustments = new Set<string>();

    for (const pattern of patterns) {
      for (const adjustment of pattern.adjustments) {
        const key = `${adjustment.target}:${adjustment.adjustment}`;
        if (!seenAdjustments.has(key)) {
          adjustments.push(adjustment);
          seenAdjustments.add(key);
        }
      }
    }

    logger.debug("Retrieved temporal adjustments", {
      event: "ll_temporal_adjustments_retrieved",
      ll_applicable_patterns: patterns.length,
      ll_adjustments_count: adjustments.length,
      ll_context_hour: context.hourOfDay,
      ll_context_day: context.dayOfWeek,
    });

    return { patterns, adjustments, context };
  }

  /**
   * Report performance for temporal learning
   */
  async reportTemporalPerformance(
    patternIds: string[],
    metrics: {
      loadTime: number;
      userSatisfaction: number;
      bounceRate: number;
      success: boolean;
    }
  ): Promise<void> {
    await this.initialize();

    for (const patternId of patternIds) {
      this.patternLearner.updatePatternPerformance(patternId, metrics);
    }

    // Persist updated patterns
    await this.persistPatterns();

    logger.debug("Reported temporal performance", {
      event: "ll_temporal_performance_reported",
      ll_patterns_updated: patternIds.length,
      ll_load_time: metrics.loadTime,
      ll_user_satisfaction: metrics.userSatisfaction,
    });
  }

  /**
   * Get temporal statistics
   */
  getStats() {
    // This would provide statistics about temporal patterns
    return {
      initialized: this.initialized,
      currentContext: this.getCurrentContext(),
      patternCount: this.patternLearner["patterns"].size,
    };
  }

  /**
   * Helper methods for temporal calculations
   */
  private isPeakHour(hour: number, dayOfWeek: number): boolean {
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      // Weekend peaks: lunch time, evening
      return (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 22);
    } else {
      // Weekday peaks: morning commute, lunch, evening commute
      return (hour >= 7 && hour <= 9) || (hour >= 12 && hour <= 14) || (hour >= 17 && hour <= 19);
    }
  }

  private getSeason(month: number): "winter" | "spring" | "summer" | "fall" {
    if (month >= 11 || month <= 1) return "winter"; // Dec-Feb
    if (month >= 2 && month <= 4) return "spring"; // Mar-May
    if (month >= 5 && month <= 7) return "summer"; // Jun-Aug
    return "fall"; // Sep-Nov
  }

  private isHoliday(date: Date): boolean {
    const month = date.getMonth();
    const day = date.getDate();

    // Simplified holiday detection (would need proper holiday calendar)
    const holidays = [
      [0, 1], // New Year
      [11, 25], // Christmas
      [6, 4], // Independence Day (US example)
    ];

    return holidays.some(([hMonth, hDay]) => month === hMonth && day === hDay);
  }

  private isSpecialEvent(date: Date): boolean {
    // Would check for special events, sales periods, etc.
    // For now, return false
    return false;
  }

  private inferUserBehavior(hour: number, dayOfWeek: number, isHoliday: boolean): {
    userEngagement: "low" | "medium" | "high";
    userPatience: "low" | "medium" | "high";
    expectedLoadTime: number;
  } {
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isBusinessHours = !isWeekend && hour >= 9 && hour <= 17;

    let userEngagement: "low" | "medium" | "high" = "medium";
    let userPatience: "low" | "medium" | "high" = "medium";
    let expectedLoadTime = 2500; // 2.5 seconds default

    // Business hours - high engagement, low patience
    if (isBusinessHours && !isHoliday) {
      userEngagement = "high";
      userPatience = "low";
      expectedLoadTime = 1500; // 1.5 seconds
    }
    // Evenings/weekends - medium engagement, higher patience
    else if ((hour >= 18 || hour <= 6) || isWeekend) {
      userEngagement = "medium";
      userPatience = "high";
      expectedLoadTime = 3500; // 3.5 seconds
    }
    // Early morning - building toward high engagement
    else if (hour >= 6 && hour <= 8 && !isWeekend) {
      userEngagement = "high";
      userPatience = "medium";
      expectedLoadTime = 2000; // 2 seconds
    }

    // Holiday adjustment - slightly more forgiving
    if (isHoliday) {
      userPatience = userPatience === "low" ? "medium" : "high";
      expectedLoadTime += 500;
    }

    return { userEngagement, userPatience, expectedLoadTime };
  }

  /**
   * Persist patterns to storage
   */
  private async persistPatterns(): Promise<void> {
    try {
      const patterns = Array.from(this.patternLearner["patterns"].entries());
      await AtomicStorage.atomicUpdate(
        "temporal_patterns",
        () => ({
          patterns,
          lastUpdated: Date.now(),
        }),
        {}
      );
    } catch (error) {
      logger.error("Failed to persist temporal patterns", {
        event: "ll_temporal_patterns_persist_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Load persisted patterns
   */
  private async loadPersistedPatterns(): Promise<void> {
    try {
      const persisted = storageManager.getItem("temporal_patterns");
      if (persisted && persisted.patterns) {
        for (const [patternId, pattern] of persisted.patterns) {
          this.patternLearner["patterns"].set(patternId, pattern);
        }
      }
    } catch (error) {
      logger.error("Failed to load persisted temporal patterns", {
        event: "ll_temporal_patterns_load_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

// Export singleton
export const temporalContextManager = TemporalContextManager.getInstance();
