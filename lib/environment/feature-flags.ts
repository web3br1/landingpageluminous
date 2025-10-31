/**
 * Advanced Feature Flags System - Fase 3
 * Sistema avançado de feature flags com controle granular e integração com environment manager
 */

import {
  getEnvironmentManager,
  Environment,
  FeatureFlag,
} from "./environment-manager";
import { logger } from "../observability/logger";
import { getEnhancedLogger } from "../observability/log-aggregator";

/**
 * Feature Flag Rule
 */
export interface FeatureFlagRule {
  flag: FeatureFlag;
  enabled: boolean;
  conditions?: {
    environment?: Environment[];
    userId?: string[];
    percentage?: number; // 0-100, for gradual rollouts
    customCondition?: () => boolean;
  };
  metadata?: {
    description?: string;
    owner?: string;
    jiraTicket?: string;
    rolloutPlan?: string;
    risks?: string[];
    dependencies?: FeatureFlag[];
  };
}

/**
 * Feature Flag Context
 */
export interface FeatureFlagContext {
  userId?: string;
  sessionId?: string;
  environment?: Environment;
  userAgent?: string;
  ipAddress?: string;
  customAttributes?: Record<string, unknown>;
}

/**
 * Advanced Feature Flags Manager
 */
export class AdvancedFeatureFlags {
  private rules: Map<FeatureFlag, FeatureFlagRule> = new Map();
  private contextOverrides: Map<string, FeatureFlagContext> = new Map();
  private environmentManager = getEnvironmentManager();
  private enhancedLogger = getEnhancedLogger();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default feature flag rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: FeatureFlagRule[] = [
      // Development Tools
      {
        flag: FeatureFlag.DEBUG_OVERLAYS,
        enabled: false, // Controlled by environment
        conditions: {
          environment: [Environment.DEVELOPMENT, Environment.STAGING],
        },
        metadata: {
          description:
            "Debug overlays for development (performance monitor, component inspector)",
          owner: "dev-team",
          risks: ["Performance impact in production", "Security exposure"],
        },
      },
      {
        flag: FeatureFlag.DEV_DASHBOARD,
        enabled: false, // Controlled by environment
        conditions: {
          environment: [Environment.DEVELOPMENT, Environment.STAGING],
        },
        metadata: {
          description:
            "Development dashboard with metrics and environment switching",
          owner: "dev-team",
          risks: ["Access control", "Performance impact"],
        },
      },
      {
        flag: FeatureFlag.HOT_RELOAD,
        enabled: false, // Controlled by environment
        conditions: {
          environment: [Environment.DEVELOPMENT],
        },
        metadata: {
          description: "Hot reload for faster development",
          owner: "dev-team",
        },
      },
      {
        flag: FeatureFlag.COMPONENT_INSPECTOR,
        enabled: false, // Controlled by environment
        conditions: {
          environment: [Environment.DEVELOPMENT],
        },
        metadata: {
          description: "Component inspector for debugging React components",
          owner: "dev-team",
        },
      },

      // Monitoring & Observability
      {
        flag: FeatureFlag.ADVANCED_METRICS,
        enabled: true,
        metadata: {
          description: "Advanced business and technical metrics collection",
          owner: "platform-team",
        },
      },
      {
        flag: FeatureFlag.DISTRIBUTED_TRACING,
        enabled: true,
        conditions: {
          environment: [
            Environment.DEVELOPMENT,
            Environment.STAGING,
            Environment.PRODUCTION,
          ],
        },
        metadata: {
          description: "Distributed tracing for request correlation",
          owner: "platform-team",
        },
      },
      {
        flag: FeatureFlag.LOG_AGGREGATION,
        enabled: true,
        metadata: {
          description: "Centralized log aggregation with correlation IDs",
          owner: "platform-team",
        },
      },
      {
        flag: FeatureFlag.SMART_ALERTS,
        enabled: true,
        conditions: {
          environment: [Environment.STAGING, Environment.PRODUCTION],
        },
        metadata: {
          description: "Intelligent alerting with anomaly detection",
          owner: "platform-team",
        },
      },

      // Webhooks
      {
        flag: FeatureFlag.ADVANCED_WEBHOOKS,
        enabled: true,
        metadata: {
          description:
            "Advanced webhook system with retry logic and dead letter queues",
          owner: "integration-team",
        },
      },
      {
        flag: FeatureFlag.WEBHOOK_DASHBOARD,
        enabled: false, // Controlled by environment
        conditions: {
          environment: [Environment.DEVELOPMENT, Environment.STAGING],
        },
        metadata: {
          description: "Administrative dashboard for webhook monitoring",
          owner: "integration-team",
          risks: ["Access control", "Sensitive data exposure"],
        },
      },
      {
        flag: FeatureFlag.WEBHOOK_RATE_LIMITING,
        enabled: true,
        metadata: {
          description: "Rate limiting for webhook endpoints",
          owner: "security-team",
        },
      },

      // Performance
      {
        flag: FeatureFlag.BUNDLE_SPLITTING,
        enabled: false, // Controlled by environment
        conditions: {
          environment: [Environment.PRODUCTION],
        },
        metadata: {
          description: "Code splitting for optimized bundle loading",
          owner: "frontend-team",
        },
      },
      {
        flag: FeatureFlag.LAZY_LOADING,
        enabled: true,
        metadata: {
          description: "Lazy loading for images and components",
          owner: "frontend-team",
        },
      },
      {
        flag: FeatureFlag.CDN_OPTIMIZATION,
        enabled: false, // Controlled by environment
        conditions: {
          environment: [Environment.PRODUCTION],
        },
        metadata: {
          description: "CDN optimization for static assets",
          owner: "frontend-team",
        },
      },

      // Security
      {
        flag: FeatureFlag.WEBHOOK_AUTHENTICATION,
        enabled: true,
        conditions: {
          environment: [Environment.STAGING, Environment.PRODUCTION],
        },
        metadata: {
          description: "Authentication for webhook endpoints",
          owner: "security-team",
        },
      },
      {
        flag: FeatureFlag.INPUT_SANITIZATION,
        enabled: true,
        metadata: {
          description: "Input sanitization for all user inputs",
          owner: "security-team",
        },
      },
      {
        flag: FeatureFlag.AUDIT_LOGGING,
        enabled: true,
        conditions: {
          environment: [Environment.STAGING, Environment.PRODUCTION],
        },
        metadata: {
          description: "Audit logging for security events",
          owner: "security-team",
        },
      },

      // Business Features
      {
        flag: FeatureFlag.AB_TESTING,
        enabled: true,
        metadata: {
          description: "A/B testing framework for feature experimentation",
          owner: "product-team",
        },
      },
      {
        flag: FeatureFlag.PERSONALIZATION,
        enabled: true,
        conditions: {
          percentage: 50, // 50% rollout
        },
        metadata: {
          description: "Personalized user experiences",
          owner: "product-team",
          jiraTicket: "PROJ-123",
        },
      },
      {
        flag: FeatureFlag.RECOMMENDATIONS,
        enabled: false, // Feature not yet implemented
        conditions: {
          environment: [Environment.DEVELOPMENT, Environment.STAGING],
        },
        metadata: {
          description: "AI-powered product recommendations",
          owner: "product-team",
          rolloutPlan: "Gradual rollout after A/B testing",
        },
      },
    ];

    defaultRules.forEach((rule) => this.addRule(rule));
  }

  /**
   * Add or update a feature flag rule
   */
  addRule(rule: FeatureFlagRule): void {
    this.rules.set(rule.flag, rule);

    this.enhancedLogger.info(
      `Feature flag rule added: ${rule.flag}`,
      "feature-flags",
      {
        enabled: rule.enabled,
        conditions: rule.conditions,
        metadata: rule.metadata,
      },
    );
  }

  /**
   * Remove a feature flag rule
   */
  removeRule(flag: FeatureFlag): boolean {
    const removed = this.rules.delete(flag);
    if (removed) {
      this.enhancedLogger.info(
        `Feature flag rule removed: ${flag}`,
        "feature-flags",
      );
    }
    return removed;
  }

  /**
   * Check if feature flag is enabled for given context
   */
  isEnabled(flag: FeatureFlag, context?: FeatureFlagContext): boolean {
    const rule = this.rules.get(flag);
    if (!rule) {
      this.enhancedLogger.warn(
        `Feature flag not found: ${flag}`,
        "feature-flags",
      );
      return false;
    }

    // Check base enabled state
    if (!rule.enabled) {
      return false;
    }

    // Check conditions
    if (rule.conditions) {
      return this.evaluateConditions(rule.conditions, context);
    }

    return true;
  }

  /**
   * Evaluate feature flag conditions
   */
  private evaluateConditions(
    conditions: NonNullable<FeatureFlagRule["conditions"]>,
    context?: FeatureFlagContext,
  ): boolean {
    const currentContext = context || this.getCurrentContext();

    // Environment check
    if (conditions.environment && conditions.environment.length > 0) {
      if (
        !conditions.environment.includes(
          currentContext.environment ||
            this.environmentManager.getConfig().environment,
        )
      ) {
        return false;
      }
    }

    // User ID check
    if (conditions.userId && conditions.userId.length > 0) {
      if (
        !currentContext.userId ||
        !conditions.userId.includes(currentContext.userId)
      ) {
        return false;
      }
    }

    // Percentage rollout check
    if (conditions.percentage !== undefined) {
      if (!currentContext.userId) {
        return false; // Cannot do percentage rollout without user ID
      }

      const hash = this.simpleHash(currentContext.userId);
      const percentage = ((hash % 100) + 100) % 100; // Ensure positive

      if (percentage >= conditions.percentage) {
        return false;
      }
    }

    // Custom condition check
    if (conditions.customCondition) {
      try {
        if (!conditions.customCondition()) {
          return false;
        }
      } catch (error) {
        this.enhancedLogger.error(
          `Error evaluating custom condition for ${conditions}`,
          "feature-flags",
          {
            error: error instanceof Error ? error : new Error("Unknown error"),
          },
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Override context for testing
   */
  setContextOverride(key: string, context: FeatureFlagContext): void {
    this.contextOverrides.set(key, context);
    this.enhancedLogger.info(`Context override set: ${key}`, "feature-flags", {
      context,
    });
  }

  /**
   * Clear context override
   */
  clearContextOverride(key: string): void {
    this.contextOverrides.delete(key);
    this.enhancedLogger.info(
      `Context override cleared: ${key}`,
      "feature-flags",
    );
  }

  /**
   * Get current evaluation context
   */
  private getCurrentContext(): FeatureFlagContext {
    return {
      environment: this.environmentManager.getConfig().environment,
      // Other context would be populated from request/session
      customAttributes: {},
    };
  }

  /**
   * Simple hash function for percentage rollouts
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Get all feature flag rules
   */
  getAllRules(): FeatureFlagRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rule for specific flag
   */
  getRule(flag: FeatureFlag): FeatureFlagRule | undefined {
    return this.rules.get(flag);
  }

  /**
   * Enable/disable feature flag
   */
  setEnabled(flag: FeatureFlag, enabled: boolean): void {
    const rule = this.rules.get(flag);
    if (rule) {
      rule.enabled = enabled;
      this.enhancedLogger.info(
        `Feature flag ${enabled ? "enabled" : "disabled"}: ${flag}`,
        "feature-flags",
      );
    }
  }

  /**
   * Get rollout status for all flags
   */
  getRolloutStatus(): Record<
    FeatureFlag,
    {
      enabled: boolean;
      rolloutPercentage?: number;
      environmentRestricted: boolean;
      userRestricted: boolean;
    }
  > {
    const status: Record<string, unknown> = {};

    for (const [flag, rule] of this.rules) {
      status[flag] = {
        enabled: rule.enabled,
        rolloutPercentage: rule.conditions?.percentage,
        environmentRestricted: !!(
          rule.conditions?.environment && rule.conditions.environment.length > 0
        ),
        userRestricted: !!(
          rule.conditions?.userId && rule.conditions.userId.length > 0
        ),
      };
    }

    return status;
  }

  /**
   * Export feature flag configuration
   */
  exportConfig(): Record<string, FeatureFlagRule> {
    const config: Record<string, FeatureFlagRule> = {};
    for (const [flag, rule] of this.rules) {
      config[flag] = { ...rule };
    }
    return config;
  }

  /**
   * Import feature flag configuration
   */
  importConfig(config: Record<string, FeatureFlagRule>): void {
    for (const [flag, rule] of Object.entries(config)) {
      this.addRule(rule);
    }
    this.enhancedLogger.info(
      "Feature flag configuration imported",
      "feature-flags",
      {
        flagsCount: Object.keys(config).length,
      },
    );
  }

  /**
   * Get feature flags for client-side usage (safe flags only)
   */
  getClientFlags(context?: FeatureFlagContext): Record<FeatureFlag, boolean> {
    const clientFlags: Record<string, boolean> = {};

    // Only expose certain flags to client
    const clientSafeFlags = [
      FeatureFlag.AB_TESTING,
      FeatureFlag.PERSONALIZATION,
      FeatureFlag.RECOMMENDATIONS,
      FeatureFlag.LAZY_LOADING,
    ];

    for (const flag of clientSafeFlags) {
      clientFlags[flag] = this.isEnabled(flag as FeatureFlag, context);
    }

    return clientFlags;
  }
}

// ===== SINGLETON INSTANCE =====

let featureFlagsInstance: AdvancedFeatureFlags | null = null;

export function getAdvancedFeatureFlags(): AdvancedFeatureFlags {
  if (!featureFlagsInstance) {
    featureFlagsInstance = new AdvancedFeatureFlags();
  }
  return featureFlagsInstance;
}

export function destroyFeatureFlags(): void {
  featureFlagsInstance = null;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Check if feature is enabled (convenience function)
 */
export function isFeatureEnabled(
  flag: FeatureFlag,
  context?: FeatureFlagContext,
): boolean {
  return getAdvancedFeatureFlags().isEnabled(flag, context);
}

/**
 * Check multiple features at once
 */
export function areFeaturesEnabled(
  flags: FeatureFlag[],
  context?: FeatureFlagContext,
): Record<FeatureFlag, boolean> {
  const featureFlags = getAdvancedFeatureFlags();
  const result: Record<string, boolean> = {};

  for (const flag of flags) {
    result[flag] = featureFlags.isEnabled(flag, context);
  }

  return result;
}

/**
 * Get feature flag rule
 */
export function getFeatureRule(flag: FeatureFlag): FeatureFlagRule | undefined {
  return getAdvancedFeatureFlags().getRule(flag);
}

/**
 * Enable feature flag
 */
export function enableFeature(flag: FeatureFlag): void {
  getAdvancedFeatureFlags().setEnabled(flag, true);
}

/**
 * Disable feature flag
 */
export function disableFeature(flag: FeatureFlag): void {
  getAdvancedFeatureFlags().setEnabled(flag, false);
}

/**
 * React hook for feature flags (moved to environment-provider.tsx)
 */
export function useFeatureFlag(
  flag: FeatureFlag,
  context?: FeatureFlagContext,
): boolean {
  // This is just a placeholder - actual implementation is in environment-provider.tsx
  return isFeatureEnabled(flag, context);
}
