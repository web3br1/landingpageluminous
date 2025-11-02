/**
 * Environment Manager - Fase 3
 * Sistema robusto de gerenciamento de ambientes com feature flags e configurações específicas
 */

import { logger } from "../observability/logger";

/**
 * Environment Types
 */
export enum Environment {
  DEVELOPMENT = "development",
  STAGING = "staging",
  PRODUCTION = "production",
  TEST = "test",
}

/**
 * Feature Flags
 */
export enum FeatureFlag {
  // Development Tools
  DEBUG_OVERLAYS = "debug_overlays",
  DEV_DASHBOARD = "dev_dashboard",
  HOT_RELOAD = "hot_reload",
  COMPONENT_INSPECTOR = "component_inspector",

  // Monitoring & Observability
  ADVANCED_METRICS = "advanced_metrics",
  DISTRIBUTED_TRACING = "distributed_tracing",
  LOG_AGGREGATION = "log_aggregation",
  SMART_ALERTS = "smart_alerts",

  // Webhooks
  ADVANCED_WEBHOOKS = "advanced_webhooks",
  WEBHOOK_DASHBOARD = "webhook_dashboard",
  WEBHOOK_RATE_LIMITING = "webhook_rate_limiting",

  // Performance
  BUNDLE_SPLITTING = "bundle_splitting",
  LAZY_LOADING = "lazy_loading",
  CDN_OPTIMIZATION = "cdn_optimization",

  // Security
  WEBHOOK_AUTHENTICATION = "webhook_authentication",
  INPUT_SANITIZATION = "input_sanitization",
  AUDIT_LOGGING = "audit_logging",

  // Business Features
  AB_TESTING = "ab_testing",
  PERSONALIZATION = "personalization",
  RECOMMENDATIONS = "recommendations",
}

/**
 * Environment Configuration
 */
export interface EnvironmentConfig {
  environment: Environment;
  isDevelopment: boolean;
  isStaging: boolean;
  isProduction: boolean;
  isTest: boolean;

  // Feature Flags
  featureFlags: Record<FeatureFlag, boolean>;

  // Logging
  logLevel: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
  enableConsoleLogging: boolean;
  enableFileLogging: boolean;

  // Monitoring
  enableMetrics: boolean;
  enableTracing: boolean;
  enableAlerts: boolean;
  metricsRetentionHours: number;

  // Performance
  enableBundleSplitting: boolean;
  enableLazyLoading: boolean;
  enableCDNOptimization: boolean;

  // Security
  enableWebhookAuthentication: boolean;
  enableInputSanitization: boolean;
  enableAuditLogging: boolean;
  rateLimitRequestsPerMinute: number;

  // API Keys (environment-specific)
  apiKeys: {
    stripe?: string;
    analytics?: string;
    sentry?: string;
    [key: string]: string | undefined;
  };

  // URLs
  urls: {
    api: string;
    cdn: string;
    websocket?: string;
    [key: string]: string | undefined;
  };

  // Limits
  limits: {
    maxFileUploadSize: number;
    maxRequestSize: number;
    rateLimitWindowMs: number;
    sessionTimeoutMs: number;
  };

  // Experimental Features
  experimental: Record<string, boolean>;
}

/**
 * Environment Manager Class
 */
export class EnvironmentManager {
  private config: EnvironmentConfig;
  private featureFlagOverrides: Map<FeatureFlag, boolean> = new Map();

  constructor() {
    this.config = this.loadEnvironmentConfig();
    this.validateConfiguration();
    this.logConfiguration();
  }

  /**
   * Load environment configuration
   */
  private loadEnvironmentConfig(): EnvironmentConfig {
    const nodeEnv = (process.env.NODE_ENV || "development") as Environment;
    const environment = this.parseEnvironment(nodeEnv);

    // Base configuration
    const baseConfig: EnvironmentConfig = {
      environment,
      isDevelopment: environment === Environment.DEVELOPMENT,
      isStaging: environment === Environment.STAGING,
      isProduction: environment === Environment.PRODUCTION,
      isTest: environment === Environment.TEST,

      // Default feature flags (all enabled in dev, selective in prod)
      featureFlags: this.getDefaultFeatureFlags(environment),

      // Logging configuration
      logLevel: this.getLogLevel(environment),
      enableConsoleLogging: environment !== Environment.PRODUCTION,
      enableFileLogging: environment === Environment.PRODUCTION,

      // Monitoring configuration
      enableMetrics: true,
      enableTracing: environment !== Environment.TEST,
      enableAlerts: environment !== Environment.TEST,
      metricsRetentionHours: environment === Environment.PRODUCTION ? 168 : 24, // 1 week vs 1 day

      // Performance configuration
      enableBundleSplitting: environment === Environment.PRODUCTION,
      enableLazyLoading: true,
      enableCDNOptimization: environment === Environment.PRODUCTION,

      // Security configuration
      enableWebhookAuthentication: environment !== Environment.DEVELOPMENT,
      enableInputSanitization: true,
      enableAuditLogging: environment !== Environment.TEST,
      rateLimitRequestsPerMinute: this.getRateLimit(environment),

      // API Keys from environment
      apiKeys: {
        stripe: process.env.STRIPE_SECRET_KEY,
        analytics: process.env.ANALYTICS_KEY,
        sentry: process.env.SENTRY_DSN,
        // Add more as needed
      },

      // Environment-specific URLs
      urls: this.getEnvironmentUrls(environment),

      // Limits
      limits: {
        maxFileUploadSize: this.getMaxFileUploadSize(environment),
        maxRequestSize: this.getMaxRequestSize(environment),
        rateLimitWindowMs: 60000, // 1 minute
        sessionTimeoutMs: this.getSessionTimeout(environment),
      },

      // Experimental features (disabled by default)
      experimental: {},
    };

    // Override with environment variables
    return this.applyEnvironmentOverrides(baseConfig);
  }

  /**
   * Parse environment string to enum
   */
  private parseEnvironment(env: string): Environment {
    switch (env.toLowerCase()) {
      case "dev":
      case "development":
        return Environment.DEVELOPMENT;
      case "staging":
      case "stage":
        return Environment.STAGING;
      case "prod":
      case "production":
        return Environment.PRODUCTION;
      case "test":
      case "testing":
        return Environment.TEST;
      default:
        logger.warn(`Unknown environment: ${env}, defaulting to development`);
        return Environment.DEVELOPMENT;
    }
  }

  /**
   * Get default feature flags based on environment
   */
  private getDefaultFeatureFlags(
    environment: Environment,
  ): Record<FeatureFlag, boolean> {
    const flags: Record<FeatureFlag, boolean> = {} as Record<
      FeatureFlag,
      boolean
    >;

    // Development: all tools enabled
    if (environment === Environment.DEVELOPMENT) {
      Object.values(FeatureFlag).forEach((flag) => {
        flags[flag] = true;
      });
      return flags;
    }

    // Production: only essential features enabled
    if (environment === Environment.PRODUCTION) {
      flags[FeatureFlag.ADVANCED_METRICS] = true;
      flags[FeatureFlag.DISTRIBUTED_TRACING] = true;
      flags[FeatureFlag.LOG_AGGREGATION] = true;
      flags[FeatureFlag.ADVANCED_WEBHOOKS] = true;
      flags[FeatureFlag.WEBHOOK_RATE_LIMITING] = true;
      flags[FeatureFlag.BUNDLE_SPLITTING] = true;
      flags[FeatureFlag.LAZY_LOADING] = true;
      flags[FeatureFlag.CDN_OPTIMIZATION] = true;
      flags[FeatureFlag.WEBHOOK_AUTHENTICATION] = true;
      flags[FeatureFlag.INPUT_SANITIZATION] = true;
      flags[FeatureFlag.AUDIT_LOGGING] = true;
      flags[FeatureFlag.AB_TESTING] = true;
      flags[FeatureFlag.PERSONALIZATION] = true;
      flags[FeatureFlag.RECOMMENDATIONS] = true;

      // Development tools disabled in production
      flags[FeatureFlag.DEBUG_OVERLAYS] = false;
      flags[FeatureFlag.DEV_DASHBOARD] = false;
      flags[FeatureFlag.HOT_RELOAD] = false;
      flags[FeatureFlag.COMPONENT_INSPECTOR] = false;
      flags[FeatureFlag.WEBHOOK_DASHBOARD] = false;
      flags[FeatureFlag.SMART_ALERTS] = true;

      return flags;
    }

    // Staging: most features enabled, some dev tools
    if (environment === Environment.STAGING) {
      Object.values(FeatureFlag).forEach((flag) => {
        flags[flag] = true;
      });
      // Disable some dev-only features
      flags[FeatureFlag.DEBUG_OVERLAYS] = false;
      flags[FeatureFlag.DEV_DASHBOARD] = false;
      flags[FeatureFlag.HOT_RELOAD] = false;
      return flags;
    }

    // Test: minimal features
    if (environment === Environment.TEST) {
      flags[FeatureFlag.ADVANCED_METRICS] = true;
      flags[FeatureFlag.LOG_AGGREGATION] = true;
      flags[FeatureFlag.INPUT_SANITIZATION] = true;
      return flags;
    }

    return flags;
  }

  /**
   * Get log level based on environment
   */
  private getLogLevel(
    environment: Environment,
  ): "trace" | "debug" | "info" | "warn" | "error" | "fatal" {
    switch (environment) {
      case Environment.DEVELOPMENT:
        return "debug";
      case Environment.STAGING:
        return "info";
      case Environment.PRODUCTION:
        return "warn";
      case Environment.TEST:
        return "error";
      default:
        return "info";
    }
  }

  /**
   * Get rate limit based on environment
   */
  private getRateLimit(environment: Environment): number {
    switch (environment) {
      case Environment.DEVELOPMENT:
        return 1000;
      case Environment.STAGING:
        return 500;
      case Environment.PRODUCTION:
        return 100;
      case Environment.TEST:
        return 10000;
      default:
        return 100;
    }
  }

  /**
   * Get environment-specific URLs
   */
  private getEnvironmentUrls(environment: Environment) {
    const baseUrls = {
      api: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
      cdn: process.env.NEXT_PUBLIC_CDN_URL || "http://localhost:3000",
    };

    switch (environment) {
      case Environment.DEVELOPMENT:
        return {
          ...baseUrls,
          websocket: "ws://localhost:3001",
        };
      case Environment.STAGING:
        return {
          ...baseUrls,
          api: process.env.STAGING_API_URL || baseUrls.api,
          cdn: process.env.STAGING_CDN_URL || baseUrls.cdn,
          websocket: process.env.STAGING_WS_URL,
        };
      case Environment.PRODUCTION:
        return {
          ...baseUrls,
          api: process.env.PRODUCTION_API_URL || baseUrls.api,
          cdn: process.env.PRODUCTION_CDN_URL || baseUrls.cdn,
          websocket: process.env.PRODUCTION_WS_URL,
        };
      default:
        return baseUrls;
    }
  }

  /**
   * Get max file upload size
   */
  private getMaxFileUploadSize(environment: Environment): number {
    switch (environment) {
      case Environment.DEVELOPMENT:
        return 50 * 1024 * 1024; // 50MB
      case Environment.STAGING:
        return 25 * 1024 * 1024; // 25MB
      case Environment.PRODUCTION:
        return 10 * 1024 * 1024; // 10MB
      case Environment.TEST:
        return 1 * 1024 * 1024; // 1MB
      default:
        return 10 * 1024 * 1024;
    }
  }

  /**
   * Get max request size
   */
  private getMaxRequestSize(environment: Environment): number {
    switch (environment) {
      case Environment.DEVELOPMENT:
        return 10 * 1024 * 1024; // 10MB
      case Environment.STAGING:
        return 5 * 1024 * 1024; // 5MB
      case Environment.PRODUCTION:
        return 1 * 1024 * 1024; // 1MB
      case Environment.TEST:
        return 512 * 1024; // 512KB
      default:
        return 1 * 1024 * 1024;
    }
  }

  /**
   * Get session timeout
   */
  private getSessionTimeout(environment: Environment): number {
    switch (environment) {
      case Environment.DEVELOPMENT:
        return 24 * 60 * 60 * 1000; // 24 hours
      case Environment.STAGING:
        return 8 * 60 * 60 * 1000; // 8 hours
      case Environment.PRODUCTION:
        return 2 * 60 * 60 * 1000; // 2 hours
      case Environment.TEST:
        return 60 * 1000; // 1 minute
      default:
        return 2 * 60 * 60 * 1000;
    }
  }

  /**
   * Apply environment variable overrides
   */
  private applyEnvironmentOverrides(
    baseConfig: EnvironmentConfig,
  ): EnvironmentConfig {
    const config = { ...baseConfig };

    // Feature flag overrides from environment variables
    Object.values(FeatureFlag).forEach((flag) => {
      const envVar = `FEATURE_${flag.toUpperCase().replace(/_/g, "_")}`;
      const envValue = process.env[envVar];

      if (envValue !== undefined) {
        config.featureFlags[flag] = envValue === "true" || envValue === "1";
      }
    });

    // Other configuration overrides
    if (process.env.LOG_LEVEL) {
      config.logLevel = process.env.LOG_LEVEL as unknown;
    }

    if (process.env.ENABLE_METRICS) {
      config.enableMetrics = process.env.ENABLE_METRICS === "true";
    }

    if (process.env.ENABLE_TRACING) {
      config.enableTracing = process.env.ENABLE_TRACING === "true";
    }

    if (process.env.RATE_LIMIT_REQUESTS) {
      config.rateLimitRequestsPerMinute =
        parseInt(process.env.RATE_LIMIT_REQUESTS) ||
        config.rateLimitRequestsPerMinute;
    }

    return config;
  }

  /**
   * Validate configuration
   */
  private validateConfiguration(): void {
    // Validate required API keys in production
    if (this.config.isProduction) {
      const requiredKeys = ["stripe"];
      for (const key of requiredKeys) {
        if (!this.config.apiKeys[key as keyof typeof this.config.apiKeys]) {
          logger.error(`Missing required API key in production: ${key}`);
          throw new Error(`Missing required API key: ${key}`);
        }
      }
    }

    // Validate URLs
    if (!this.config.urls.api) {
      logger.warn("API URL not configured, using default");
    }

    // Validate feature flag consistency
    if (this.config.isProduction) {
      const devOnlyFlags = [
        FeatureFlag.DEBUG_OVERLAYS,
        FeatureFlag.DEV_DASHBOARD,
        FeatureFlag.HOT_RELOAD,
        FeatureFlag.COMPONENT_INSPECTOR,
      ];

      for (const flag of devOnlyFlags) {
        if (this.config.featureFlags[flag]) {
          logger.warn(
            `Development-only feature flag enabled in production: ${flag}`,
          );
        }
      }
    }
  }

  /**
   * Log configuration summary
   */
  private logConfiguration(): void {
    const enabledFeatures = Object.entries(this.config.featureFlags)
      .filter(([, enabled]) => enabled)
      .map(([flag]) => flag);

    logger.info("Environment configuration loaded", {
      environment: this.config.environment,
      logLevel: this.config.logLevel,
      enabledFeatures: enabledFeatures.length,
      monitoring: {
        metrics: this.config.enableMetrics,
        tracing: this.config.enableTracing,
        alerts: this.config.enableAlerts,
      },
      security: {
        webhookAuth: this.config.enableWebhookAuthentication,
        inputSanitization: this.config.enableInputSanitization,
        auditLogging: this.config.enableAuditLogging,
      },
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  /**
   * Check if feature flag is enabled
   */
  isFeatureEnabled(flag: FeatureFlag): boolean {
    // Check overrides first
    if (this.featureFlagOverrides.has(flag)) {
      return this.featureFlagOverrides.get(flag)!;
    }

    return this.config.featureFlags[flag] || false;
  }

  /**
   * Override feature flag (for testing or runtime control)
   */
  overrideFeatureFlag(flag: FeatureFlag, enabled: boolean): void {
    this.featureFlagOverrides.set(flag, enabled);
    logger.info(`Feature flag override: ${flag} = ${enabled}`);
  }

  /**
   * Clear feature flag override
   */
  clearFeatureFlagOverride(flag: FeatureFlag): void {
    this.featureFlagOverrides.delete(flag);
    logger.info(`Feature flag override cleared: ${flag}`);
  }

  /**
   * Get environment-specific value with fallback
   */
  getEnvValue<T>(key: string, defaultValue: T): T {
    const envKey = `APP_${key.toUpperCase().replace(/-/g, "_")}`;
    const envValue = process.env[envKey];

    if (envValue !== undefined) {
      // Simple type conversion
      if (typeof defaultValue === "boolean") {
        return (envValue === "true" || envValue === "1") as T;
      }
      if (typeof defaultValue === "number") {
        return parseFloat(envValue) as T;
      }
      return envValue as T;
    }

    return defaultValue;
  }

  /**
   * Check if current environment matches
   */
  isEnvironment(env: Environment): boolean {
    return this.config.environment === env;
  }

  /**
   * Get all enabled feature flags
   */
  getEnabledFeatures(): FeatureFlag[] {
    return Object.entries(this.config.featureFlags)
      .filter(([, enabled]) => enabled)
      .map(([flag]) => flag as FeatureFlag);
  }

  /**
   * Get configuration for client-side usage (safe values only)
   */
  getClientConfig(): Partial<EnvironmentConfig> {
    return {
      environment: this.config.environment,
      isDevelopment: this.config.isDevelopment,
      isStaging: this.config.isStaging,
      isProduction: this.config.isProduction,
      featureFlags: {
        ...this.config.featureFlags,
        // Remove sensitive flags from client
      },
      urls: this.config.urls,
      experimental: this.config.experimental,
    };
  }

  /**
   * Reload configuration (for dynamic updates)
   */
  reloadConfig(): void {
    const oldConfig = this.config;
    this.config = this.loadEnvironmentConfig();
    this.validateConfiguration();

    if (JSON.stringify(oldConfig) !== JSON.stringify(this.config)) {
      logger.info("Environment configuration reloaded");
    }
  }
}

// ===== SINGLETON INSTANCE =====

let environmentManagerInstance: EnvironmentManager | null = null;

export function getEnvironmentManager(): EnvironmentManager {
  if (!environmentManagerInstance) {
    environmentManagerInstance = new EnvironmentManager();
  }
  return environmentManagerInstance;
}

export function destroyEnvironmentManager(): void {
  environmentManagerInstance = null;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Check if feature is enabled (convenience function)
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return getEnvironmentManager().isFeatureEnabled(flag);
}

/**
 * Get current environment
 */
export function getCurrentEnvironment(): Environment {
  return getEnvironmentManager().getConfig().environment;
}

/**
 * Check if development environment
 */
export function isDevelopment(): boolean {
  return getCurrentEnvironment() === Environment.DEVELOPMENT;
}

/**
 * Check if production environment
 */
export function isProduction(): boolean {
  return getCurrentEnvironment() === Environment.PRODUCTION;
}

/**
 * Get environment-specific configuration value
 */
export function getEnvConfig(): EnvironmentConfig {
  return getEnvironmentManager().getConfig();
}

/**
 * Get client-safe configuration
 */
export function getClientEnvConfig(): Partial<EnvironmentConfig> {
  return getEnvironmentManager().getClientConfig();
}
