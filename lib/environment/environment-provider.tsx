"use client";

/**
 * Environment Provider - Fase 3
 * React context provider para configurações de environment e feature flags
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getEnvironmentManager,
  EnvironmentConfig,
  FeatureFlag,
} from "./environment-manager";
import { getAdvancedFeatureFlags, FeatureFlagContext } from "./feature-flags";

// ===== TYPES =====

export interface ClientFlags {
  // Core features
  enableAnalytics?: boolean;
  enablePersonalization?: boolean;
  enableExperiments?: boolean;

  // Performance features
  enableProgressiveLoading?: boolean;
  enableLazyImages?: boolean;
  enableServiceWorker?: boolean;

  // UI features
  enableDarkMode?: boolean;
  enableAnimations?: boolean;
  enableNewUI?: boolean;

  // Development features
  enableDebugMode?: boolean;
  enablePerformanceMonitoring?: boolean;

  // Custom feature flags
  [key: string]: boolean | undefined;
}

/**
 * Environment Context
 */
interface EnvironmentContextType {
  config: EnvironmentConfig;
  isFeatureEnabled: (
    flag: FeatureFlag,
    context?: FeatureFlagContext,
  ) => boolean;
  refreshConfig: () => void;
  clientFlags: Record<FeatureFlag, boolean>;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(
  undefined,
);

/**
 * Environment Provider Props
 */
interface EnvironmentProviderProps {
  children: React.ReactNode;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Environment Provider Component
 */
export function EnvironmentProvider({
  children,
  userId,
  sessionId,
  userAgent,
  ipAddress,
}: EnvironmentProviderProps) {
  const [config, setConfig] = useState<EnvironmentConfig | null>(null);
  const [clientFlags, setClientFlags] = useState<ClientFlags>({});

  useEffect(() => {
    // Load initial configuration
    const envManager = getEnvironmentManager();
    const initialConfig = envManager.getConfig();
    setConfig(initialConfig);

    // Load client-safe feature flags
    const featureFlags = getAdvancedFeatureFlags();
    const context: FeatureFlagContext = {
      userId,
      sessionId,
      userAgent,
      ipAddress,
      environment: initialConfig.environment,
    };

    const flags = featureFlags.getClientFlags(context);
    setClientFlags(flags);

    // Optional: Set up periodic refresh for dynamic config updates
    const refreshInterval = setInterval(
      () => {
        envManager.reloadConfig();
        const updatedConfig = envManager.getConfig();
        setConfig(updatedConfig);

        const updatedFlags = featureFlags.getClientFlags(context);
        setClientFlags(updatedFlags);
      },
      5 * 60 * 1000,
    ); // Refresh every 5 minutes

    return () => clearInterval(refreshInterval);
  }, [userId, sessionId, userAgent, ipAddress]);

  const isFeatureEnabled = (
    flag: FeatureFlag,
    context?: FeatureFlagContext,
  ) => {
    const featureFlags = getAdvancedFeatureFlags();
    return featureFlags.isEnabled(flag, context);
  };

  const refreshConfig = () => {
    const envManager = getEnvironmentManager();
    envManager.reloadConfig();
    const updatedConfig = envManager.getConfig();
    setConfig(updatedConfig);

    const featureFlags = getAdvancedFeatureFlags();
    const context: FeatureFlagContext = {
      userId,
      sessionId,
      userAgent,
      ipAddress,
      environment: updatedConfig.environment,
    };

    const updatedFlags = featureFlags.getClientFlags(context);
    setClientFlags(updatedFlags);
  };

  if (!config) {
    return null; // Or loading spinner
  }

  const contextValue: EnvironmentContextType = {
    config,
    isFeatureEnabled,
    refreshConfig,
    clientFlags,
  };

  return (
    <EnvironmentContext.Provider value={contextValue}>
      {children}
    </EnvironmentContext.Provider>
  );
}

/**
 * Hook to use environment context
 */
export function useEnvironment(): EnvironmentContextType {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error(
      "useEnvironment must be used within an EnvironmentProvider",
    );
  }
  return context;
}

/**
 * Hook to check if feature is enabled
 */
export function useFeatureFlag(
  flag: FeatureFlag,
  context?: FeatureFlagContext,
): boolean {
  const { isFeatureEnabled } = useEnvironment();
  return isFeatureEnabled(flag, context);
}

/**
 * Hook to get environment config
 */
export function useEnvironmentConfig(): EnvironmentConfig {
  const { config } = useEnvironment();
  return config;
}

/**
 * Hook to get client feature flags
 */
export function useClientFeatureFlags(): Record<FeatureFlag, boolean> {
  const { clientFlags } = useEnvironment();
  return clientFlags;
}

/**
 * Component that conditionally renders based on feature flag
 */
export function FeatureFlagGate({
  flag,
  children,
  fallback = null,
  context,
}: {
  flag: FeatureFlag;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  context?: FeatureFlagContext;
}) {
  const isEnabled = useFeatureFlag(flag, context);

  if (isEnabled) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

/**
 * Higher-Order Component for feature flags (simplified)
 */
export function withFeatureFlag<P extends object>(
  flag: FeatureFlag,
  FallbackComponent?: React.ComponentType<P>,
) {
  return function (Component: React.ComponentType<P>) {
    return (props: P) => (
      <FeatureFlagGate
        flag={flag}
        fallback={FallbackComponent ? <FallbackComponent {...props} /> : null}
      >
        <Component {...props} />
      </FeatureFlagGate>
    );
  };
}

/**
 * Environment-aware component that shows different content based on environment
 */
export function EnvironmentGate({
  environments,
  children,
  fallback = null,
}: {
  environments: Array<"development" | "staging" | "production" | "test">;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { config } = useEnvironment();
  const isAllowed = environments.includes(config.environment);

  if (isAllowed) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

/**
 * Development-only component wrapper
 */
export function DevelopmentOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <EnvironmentGate environments={["development"]} fallback={fallback}>
      {children}
    </EnvironmentGate>
  );
}

/**
 * Production-only component wrapper
 */
export function ProductionOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <EnvironmentGate environments={["production"]} fallback={fallback}>
      {children}
    </EnvironmentGate>
  );
}
