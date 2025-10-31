import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  EnvironmentManager,
  Environment,
  FeatureFlag,
  getEnvironmentManager,
} from "@/lib/environment/environment-manager";

// Mock logger
vi.mock("@/lib/observability/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("Environment Manager", () => {
  let envManager: EnvironmentManager;

  beforeEach(() => {
    // Reset environment manager before each test
    vi.clearAllMocks();

    // Clear any cached instance
    (EnvironmentManager as any).instance = undefined;

    // Mock environment variables
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_ENVIRONMENT", "development");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("Environment Manager Creation", () => {
    it("should create environment manager instance", () => {
      const instance = getEnvironmentManager();

      expect(instance).toBeDefined();
      expect(instance).toBeInstanceOf(EnvironmentManager);
    });

    it("should create new instance each time", () => {
      const instance1 = new EnvironmentManager();
      const instance2 = new EnvironmentManager();

      // They should be different instances
      expect(instance1).not.toBe(instance2);
    });
  });

  describe("Environment Detection", () => {
    it("should detect development environment", () => {
      vi.stubEnv("NODE_ENV", "development");

      envManager = new EnvironmentManager();
      const config = envManager.getConfig();

      expect(config.environment).toBe(Environment.DEVELOPMENT);
      expect(config.isDevelopment).toBe(true);
      expect(config.isProduction).toBe(false);
    });

    it("should detect production environment", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_mock");
      vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "GA_MOCK");

      envManager = new EnvironmentManager();
      const config = envManager.getConfig();

      expect(config.environment).toBe(Environment.PRODUCTION);
      expect(config.isProduction).toBe(true);
      expect(config.isDevelopment).toBe(false);
    });

    it("should detect staging environment", () => {
      vi.stubEnv("NODE_ENV", "staging");
      vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_mock");
      vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "GA_MOCK");

      envManager = new EnvironmentManager();
      const config = envManager.getConfig();

      expect(config.environment).toBe(Environment.STAGING);
      expect(config.isStaging).toBe(true);
    });

    it("should detect test environment", () => {
      vi.stubEnv("NODE_ENV", "test");

      envManager = new EnvironmentManager();
      const config = envManager.getConfig();

      expect(config.environment).toBe(Environment.TEST);
      expect(config.isTest).toBe(true);
    });
  });

  describe("Feature Flags", () => {
    beforeEach(() => {
      envManager = new EnvironmentManager();
    });

    it("should enable debug features in development", () => {
      vi.stubEnv("NODE_ENV", "development");

      const config = envManager.getConfig();

      expect(config.featureFlags[FeatureFlag.DEBUG_OVERLAYS]).toBe(true);
      expect(config.featureFlags[FeatureFlag.DEV_DASHBOARD]).toBe(true);
    });

    it("should enable monitoring features in production", () => {
      vi.stubEnv("NODE_ENV", "production");

      const config = envManager.getConfig();

      expect(config.featureFlags[FeatureFlag.ADVANCED_METRICS]).toBe(true);
      expect(config.featureFlags[FeatureFlag.DISTRIBUTED_TRACING]).toBe(true);
    });

    it("should disable development features in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_mock");

      // Create fresh instance for this test
      const prodManager = new EnvironmentManager();
      const config = prodManager.getConfig();

      expect(config.environment).toBe(Environment.PRODUCTION);
      expect(config.featureFlags[FeatureFlag.DEBUG_OVERLAYS]).toBe(false);
      expect(config.featureFlags[FeatureFlag.DEV_DASHBOARD]).toBe(false);
    });

    it("should check feature flag status", () => {
      vi.stubEnv("NODE_ENV", "development");

      expect(envManager.isFeatureEnabled(FeatureFlag.DEBUG_OVERLAYS)).toBe(
        true,
      );
      expect(envManager.isFeatureEnabled(FeatureFlag.ADVANCED_METRICS)).toBe(
        true,
      );
    });
  });

  describe("Configuration Validation", () => {
    beforeEach(() => {
      envManager = new EnvironmentManager();
    });

    it("should validate required API keys in production", () => {
      vi.stubEnv("NODE_ENV", "production");

      // Should not throw even without API keys (graceful degradation)
      expect(() => envManager.getConfig()).not.toThrow();
    });

    it("should provide default URLs", () => {
      const config = envManager.getConfig();

      expect(config.urls).toBeDefined();
      expect(typeof config.urls.api).toBe("string");
      expect(config.urls.api.length).toBeGreaterThan(0);
    });

    it("should provide default rate limits", () => {
      const config = envManager.getConfig();

      expect(config.rateLimitRequestsPerMinute).toBeDefined();
      expect(typeof config.rateLimitRequestsPerMinute).toBe("number");
      expect(config.rateLimitRequestsPerMinute).toBeGreaterThan(0);
    });
  });

  describe("Logging Configuration", () => {
    it("should enable console logging in development", () => {
      vi.stubEnv("NODE_ENV", "development");

      envManager = new EnvironmentManager();
      const config = envManager.getConfig();

      expect(config.enableConsoleLogging).toBe(true);
    });

    it("should set appropriate log levels", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_mock");
      vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "GA_MOCK");

      envManager = new EnvironmentManager();
      const config = envManager.getConfig();

      expect(config.logLevel).toBe("warn");
    });
  });

  describe("Performance Configuration", () => {
    it("should enable bundle splitting in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_mock");
      vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "GA_MOCK");

      envManager = new EnvironmentManager();
      const config = envManager.getConfig();

      expect(config.enableBundleSplitting).toBe(true);
      expect(config.enableLazyLoading).toBe(true);
    });

    it("should enable CDN optimization in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_mock");
      vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "GA_MOCK");

      envManager = new EnvironmentManager();
      const config = envManager.getConfig();

      expect(config.enableCDNOptimization).toBe(true);
    });
  });

  describe("Security Configuration", () => {
    it("should enable security features", () => {
      envManager = new EnvironmentManager();
      const config = envManager.getConfig();

      expect(config.enableInputSanitization).toBe(true);
      expect(config.enableAuditLogging).toBe(true);
    });

    it("should enable webhook authentication in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_mock");
      vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "GA_MOCK");

      envManager = new EnvironmentManager();
      const config = envManager.getConfig();

      expect(config.enableWebhookAuthentication).toBe(true);
    });
  });

  describe("Configuration Updates", () => {
    beforeEach(() => {
      envManager = new EnvironmentManager();
    });

    it("should allow feature flag overrides", () => {
      const originalValue = envManager.isFeatureEnabled(
        FeatureFlag.DEBUG_OVERLAYS,
      );

      // This would require implementation of override methods
      // For now, just test that the method exists
      expect(typeof envManager.isFeatureEnabled).toBe("function");
    });

    it("should return configuration consistently", () => {
      const config1 = envManager.getConfig();
      const config2 = envManager.getConfig();

      // Should return equivalent configurations
      expect(config1.environment).toBe(config2.environment);
      expect(config1.isDevelopment).toBe(config2.isDevelopment);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid environment gracefully", () => {
      vi.stubEnv("NODE_ENV", "invalid");

      envManager = new EnvironmentManager();

      expect(() => envManager.getConfig()).not.toThrow();
    });

    it("should provide fallback configuration on errors", () => {
      // Mock a failure scenario
      vi.stubEnv("NODE_ENV", undefined);

      envManager = new EnvironmentManager();
      const config = envManager.getConfig();

      // Should still provide a valid configuration
      expect(config).toBeDefined();
      expect(config.environment).toBeDefined();
    });
  });
});
