/**
 * Dynamic Threshold Manager - Simplified Version
 * Fixed thresholds based on context instead of complex ML
 */

import { logger } from "../../observability/logger";

export interface ThresholdContext {
  sectionType?: string; // "hero", "pricing", "features", etc.
  deviceType?: "mobile" | "tablet" | "desktop";
  networkType?: string;
  userEngagement?: "low" | "medium" | "high";
}

/**
 * Simplified threshold configuration
 */
export interface ThresholdConfig {
  id: string;
  name: string;
  defaultValue: number;
  contextOverrides?: Record<string, number>; // context key -> value
}

/**
 * Simplified Dynamic Threshold Manager
 * Uses fixed thresholds with basic context overrides
 */
export class DynamicThresholdManager {
  private static instance: DynamicThresholdManager;
  private configs: Map<string, ThresholdConfig> = new Map();

  constructor() {
    this.createDefaultConfigs();
  }

  static getInstance(): DynamicThresholdManager {
    if (!DynamicThresholdManager.instance) {
      DynamicThresholdManager.instance = new DynamicThresholdManager();
    }
    return DynamicThresholdManager.instance;
  }

  /**
   * Create default threshold configurations with fixed values
   */
  private createDefaultConfigs(): void {
    // Intersection Ratio Threshold
    this.configs.set("intersection_ratio", {
      id: "intersection_ratio",
      name: "Intersection Observer Ratio",
      defaultValue: 0.3, // 30% visibility default
      contextOverrides: {
        "device:mobile": 0.2, // More aggressive on mobile
        "engagement:high": 0.1, // Very aggressive for engaged users
        "network:slow-2g": 0.8, // Conservative on slow networks
      },
    });

    // Scroll Velocity Threshold
    this.configs.set("scroll_velocity", {
      id: "scroll_velocity",
      name: "Scroll Velocity Threshold",
      defaultValue: 500, // pixels per second
      contextOverrides: {
        "device:mobile": 300, // Lower on mobile
        "engagement:high": 800, // Higher for engaged users
      },
    });

    // Time-based Preload Threshold
    this.configs.set("time_based_preload", {
      id: "time_based_preload",
      name: "Time-based Preload Delay",
      defaultValue: 1000, // 1 second delay
      contextOverrides: {
        "network:fast": 500, // Shorter delay on fast networks
        "engagement:high": 200, // Very short delay for engaged users
        "network:slow-2g": 2000, // Longer delay on slow networks
      },
    });

    logger.info("Created simplified threshold configurations", {
      event: "ll_simple_thresholds_created",
      ll_thresholds_count: this.configs.size,
    });
  }

  /**
   * Get threshold value based on context
   */
  async getThreshold(thresholdId: string, context?: ThresholdContext): Promise<number> {
    const config = this.configs.get(thresholdId);
    if (!config) {
      logger.warn("Threshold not found, using fallback", {
        event: "ll_threshold_not_found",
        ll_threshold_id: thresholdId,
      });
      return 0.3; // Safe fallback
    }

    // Start with default value
    let value = config.defaultValue;

    // Apply context overrides
    if (context && config.contextOverrides) {
      const contextKeys = this.buildContextKeys(context);

      for (const key of contextKeys) {
        if (config.contextOverrides[key] !== undefined) {
          value = config.contextOverrides[key];
          logger.debug("Applied context override", {
            event: "ll_context_override_applied",
            ll_threshold_id: thresholdId,
            ll_context_key: key,
            ll_new_value: value,
          });
          break; // Use first matching override
        }
      }
    }

    return value;
  }

  /**
   * Build context keys for override lookup
   */
  private buildContextKeys(context: ThresholdContext): string[] {
    const keys: string[] = [];

    if (context.deviceType) keys.push(`device:${context.deviceType}`);
    if (context.networkType) keys.push(`network:${context.networkType}`);
    if (context.userEngagement) keys.push(`engagement:${context.userEngagement}`);
    if (context.sectionType) keys.push(`section:${context.sectionType}`);

    return keys;
  }

  /**
   * Report performance (no-op in simplified version)
   */
  async reportPerformance(): Promise<void> {
    // Simplified version doesn't learn - thresholds are fixed
    // This method exists for API compatibility
  }

  /**
   * Add custom threshold configuration
   */
  async addThreshold(config: ThresholdConfig): Promise<void> {
    this.configs.set(config.id, config);
  }

  /**
   * Get manager statistics
   */
  getStats() {
    return {
      thresholds: this.configs.size,
      configs: Array.from(this.configs.keys()),
    };
  }

  /**
   * Reset threshold to default (no-op in simplified version)
   */
  async resetThreshold(): Promise<void> {
    // Simplified version uses fixed defaults
  }
}

// Export singleton
export const dynamicThresholdManager = DynamicThresholdManager.getInstance();
