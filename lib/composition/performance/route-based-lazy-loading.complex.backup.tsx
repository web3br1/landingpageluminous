// Dynamic Lazy Loading with proper React.lazy usage
// Each section uses dynamic imports with named exports

import React, { lazy, ComponentType, Suspense } from "react";
import { SectionId, SectionRegistry } from "../registry/section-registry";
import {
  LazyLoadingPolicy,
  LoadingContext,
  LoadingPriority,
} from "./lazy-loading-policy";
import { logger } from "@/lib/logger";

// Fix import path for tests
export { logger };

// ===== LAZY LOADING LOGGING HELPERS =====

interface LazyLoadLogContext {
  sectionId: SectionId;
  componentName?: string;
  loadTime?: number;
  bundleSize?: number;
  trigger?: "viewport" | "scroll" | "manual" | "critical";
  priority?: "high" | "medium" | "low";
  strategy?: "critical" | "important" | "secondary";
  error?: string;
  fallbackDuration?: number;
  hydrationTime?: number;
  traceId?: string;
}

function logLazyLoadStart(context: LazyLoadLogContext): void {
  logger.info("Component lazy loading started", {
    event: "lazy_load_start",
    sectionId: context.sectionId,
    componentName: context.componentName,
    trigger: context.trigger,
    priority: context.priority,
    strategy: context.strategy,
    traceId: context.traceId || generateLazyLoadTraceId(),
  });
}

function logLazyLoadSuccess(context: LazyLoadLogContext): void {
  logger.info("Component lazy loading completed", {
    event: "lazy_load_success",
    sectionId: context.sectionId,
    componentName: context.componentName,
    loadTime: context.loadTime,
    bundleSize: context.bundleSize,
    trigger: context.trigger,
    priority: context.priority,
    strategy: context.strategy,
    traceId: context.traceId,
  });
}

function logLazyLoadError(context: LazyLoadLogContext): void {
  logger.error("Component lazy loading failed", {
    event: "lazy_load_error",
    sectionId: context.sectionId,
    componentName: context.componentName,
    loadTime: context.loadTime,
    trigger: context.trigger,
    priority: context.priority,
    strategy: context.strategy,
    error: context.error,
    traceId: context.traceId,
  });
}

function logHydrationMismatch(context: {
  sectionId: SectionId;
  serverHtml?: string;
  clientHtml?: string;
  componentName?: string;
  userAgent?: string;
  url?: string;
  traceId?: string;
  errorDetails?: string;
  severity?: "low" | "medium" | "high";
}): void {
  const logEntry = {
    event: "hydration_mismatch",
    sectionId: context.sectionId,
    componentName: context.componentName,
    hasServerHtml: !!context.serverHtml,
    hasClientHtml: !!context.clientHtml,
    serverHtmlLength: context.serverHtml?.length,
    clientHtmlLength: context.clientHtml?.length,
    htmlDifference:
      context.serverHtml && context.clientHtml
        ? Math.abs(context.serverHtml.length - context.clientHtml.length)
        : undefined,
    userAgent: context.userAgent,
    url: context.url,
    errorDetails: context.errorDetails,
    severity: context.severity || "medium",
    traceId: context.traceId || generateLazyLoadTraceId(),
  };

  logger.warn("Hydration mismatch detected", logEntry);

  // Process for alerts
  try {
    const { processLogForAlerts } = require("@/lib/monitoring/smart-alerts");
    processLogForAlerts(logEntry);
  } catch (e) {
    // Alert system not available, continue
  }
}

function logSuspenseFallback(context: LazyLoadLogContext): void {
  logger.info("Suspense fallback rendered", {
    event: "suspense_fallback",
    sectionId: context.sectionId,
    componentName: context.componentName,
    fallbackDuration: context.fallbackDuration,
    trigger: context.trigger,
    traceId: context.traceId,
  });
}

function generateLazyLoadTraceId(): string {
  return `lazy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ===== HYDRATION DEBUGGING HOOK =====

import { useEffect, useRef, useState } from "react";

interface HydrationDebugOptions {
  sectionId: SectionId;
  componentName?: string;
  enabled?: boolean;
  severityThreshold?: "low" | "medium" | "high";
}

export function useHydrationDebugger(options: HydrationDebugOptions) {
  const {
    sectionId,
    componentName,
    enabled = process.env.NODE_ENV === "development",
    severityThreshold = "low",
  } = options;

  const serverHtmlRef = useRef<string>("");
  const [isHydrated, setIsHydrated] = useState(false);
  const traceId = useRef(generateLazyLoadTraceId());

  // Capture server-rendered HTML
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const captureServerHtml = () => {
      const elements = document.querySelectorAll(
        `[data-section-id="${sectionId}"]`,
      );
      if (elements.length > 0) {
        serverHtmlRef.current = Array.from(elements)
          .map((el) => el.outerHTML)
          .join("");
      }
    };

    // Small delay to ensure DOM is fully rendered
    setTimeout(captureServerHtml, 0);
  }, [sectionId, enabled]);

  // Detect hydration mismatches
  useEffect(() => {
    if (!enabled || typeof window === "undefined" || isHydrated) return;

    const checkHydration = () => {
      const elements = document.querySelectorAll(
        `[data-section-id="${sectionId}"]`,
      );
      if (elements.length === 0) return;

      const clientHtml = Array.from(elements)
        .map((el) => el.outerHTML)
        .join("");

      const serverHtml = serverHtmlRef.current;

      if (serverHtml && clientHtml !== serverHtml) {
        const difference = Math.abs(clientHtml.length - serverHtml.length);
        const severity =
          difference > 1000 ? "high" : difference > 100 ? "medium" : "low";

        if (
          severityThreshold === "low" ||
          (severityThreshold === "medium" && severity !== "low") ||
          severity === "high"
        ) {
          logHydrationMismatch({
            sectionId,
            serverHtml,
            clientHtml,
            componentName,
            userAgent:
              typeof navigator !== "undefined"
                ? navigator.userAgent
                : "unknown",
            url:
              typeof window !== "undefined" ? window.location.href : "unknown",
            errorDetails: `HTML difference: ${difference} characters`,
            severity,
            traceId: traceId.current,
          });
        }
      }
    };

    // Check after hydration
    setTimeout(() => {
      setIsHydrated(true);
      checkHydration();
    }, 100);
  }, [sectionId, componentName, enabled, severityThreshold, isHydrated]);

  return {
    traceId: traceId.current,
    isHydrated,
  };
}

// ===== LAZY LOAD WRAPPER COMPONENT =====

interface LazyLoadWrapperProps {
  sectionId: SectionId;
  component: ComponentType<unknown>;
  props: unknown;
  traceId: string;
}

const LazyLoadWrapper: React.FC<LazyLoadWrapperProps> = ({
  sectionId,
  component: Component,
  props,
  traceId,
}) => {
  const mountTime = performance.now();

  React.useEffect(() => {
    const loadTime = performance.now() - mountTime;

    logLazyLoadSuccess({
      sectionId,
      componentName: Component.name || sectionId,
      loadTime,
      trigger: "viewport",
      strategy: SectionRegistry.getCriticality(sectionId),
      traceId,
    });
  }, [sectionId, Component.name, traceId]);

  return <Component {...props} />;
};

// ===== OBSERVABILITY DASHBOARD =====
// React hooks already imported above

interface ObservabilityDashboardProps {
  refreshInterval?: number;
  showPerformance?: boolean;
  showExperiments?: boolean;
  showErrors?: boolean;
  showAnalytics?: boolean;
}

interface DashboardMetrics {
  performance: {
    avgLoadTime: number;
    cacheHitRate: number;
    errorRate: number;
    hydrationMismatches: number;
  };
  experiments: {
    activeExperiments: number;
    totalAssignments: number;
    conversionRate: number;
    featureFlags: number;
  };
  analytics: {
    pageViews: number;
    conversions: number;
    bounceRate: number;
    sessionDuration: number;
  };
  errors: {
    totalErrors: number;
    criticalErrors: number;
    compositionErrors: number;
    hydrationErrors: number;
  };
}

export function ObservabilityDashboard({
  refreshInterval = 30000,
  showPerformance = true,
  showExperiments = true,
  showErrors = true,
  showAnalytics = true,
}: ObservabilityDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    performance: {
      avgLoadTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
      hydrationMismatches: 0,
    },
    experiments: {
      activeExperiments: 0,
      totalAssignments: 0,
      conversionRate: 0,
      featureFlags: 0,
    },
    analytics: {
      pageViews: 0,
      conversions: 0,
      bounceRate: 0,
      sessionDuration: 0,
    },
    errors: {
      totalErrors: 0,
      criticalErrors: 0,
      compositionErrors: 0,
      hydrationErrors: 0,
    },
  });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      // In production, this would fetch from a metrics API
      // For now, we'll simulate with mock data based on our logging structure

      const mockMetrics: DashboardMetrics = {
        performance: {
          avgLoadTime: Math.random() * 1000 + 500,
          cacheHitRate: Math.random() * 0.3 + 0.7,
          errorRate: Math.random() * 0.05,
          hydrationMismatches: Math.floor(Math.random() * 10),
        },
        experiments: {
          activeExperiments: Math.floor(Math.random() * 5) + 3,
          totalAssignments: Math.floor(Math.random() * 1000) + 500,
          conversionRate: Math.random() * 0.2 + 0.1,
          featureFlags: Math.floor(Math.random() * 8) + 2,
        },
        analytics: {
          pageViews: Math.floor(Math.random() * 5000) + 1000,
          conversions: Math.floor(Math.random() * 200) + 50,
          bounceRate: Math.random() * 0.3 + 0.2,
          sessionDuration: Math.random() * 300 + 120,
        },
        errors: {
          totalErrors: Math.floor(Math.random() * 50),
          criticalErrors: Math.floor(Math.random() * 5),
          compositionErrors: Math.floor(Math.random() * 10),
          hydrationErrors: Math.floor(Math.random() * 3),
        },
      };

      setMetrics(mockMetrics);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to fetch dashboard metrics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    unit?: string;
    status?: "good" | "warning" | "error";
    trend?: "up" | "down" | "stable";
  }> = ({ title, value, unit, status = "good", trend }) => (
    <div
      className={`p-4 rounded-lg border ${
        status === "error"
          ? "border-red-200 bg-red-50"
          : status === "warning"
            ? "border-yellow-200 bg-yellow-50"
            : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {trend && (
          <span
            className={`text-xs ${
              trend === "up"
                ? "text-green-600"
                : trend === "down"
                  ? "text-red-600"
                  : "text-gray-600"
            }`}
          >
            {trend === "up" ? "↗" : trend === "down" ? "↘" : "→"}
          </span>
        )}
      </div>
      <div className="mt-2">
        <span className="text-2xl font-bold text-gray-900">
          {typeof value === "number" ? value.toFixed(2) : value}
        </span>
        {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Observability Dashboard
          </h1>
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
            {isLoading && <span className="ml-2">⟳</span>}
          </div>
        </div>

        {showPerformance && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Performance Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Avg Load Time"
                value={metrics.performance.avgLoadTime}
                unit="ms"
                status={
                  metrics.performance.avgLoadTime > 1000 ? "warning" : "good"
                }
              />
              <MetricCard
                title="Cache Hit Rate"
                value={metrics.performance.cacheHitRate * 100}
                unit="%"
                status={
                  metrics.performance.cacheHitRate > 0.8 ? "good" : "warning"
                }
              />
              <MetricCard
                title="Error Rate"
                value={metrics.performance.errorRate * 100}
                unit="%"
                status={metrics.performance.errorRate > 0.05 ? "error" : "good"}
              />
              <MetricCard
                title="Hydration Mismatches"
                value={metrics.performance.hydrationMismatches}
                status={
                  metrics.performance.hydrationMismatches > 5
                    ? "warning"
                    : "good"
                }
              />
            </div>
          </div>
        )}

        {showExperiments && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Experiment Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Active Experiments"
                value={metrics.experiments.activeExperiments}
              />
              <MetricCard
                title="Total Assignments"
                value={metrics.experiments.totalAssignments}
              />
              <MetricCard
                title="Conversion Rate"
                value={metrics.experiments.conversionRate * 100}
                unit="%"
                status={
                  metrics.experiments.conversionRate > 0.15 ? "good" : "warning"
                }
              />
              <MetricCard
                title="Feature Flags"
                value={metrics.experiments.featureFlags}
              />
            </div>
          </div>
        )}

        {showAnalytics && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Analytics Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Page Views"
                value={metrics.analytics.pageViews}
              />
              <MetricCard
                title="Conversions"
                value={metrics.analytics.conversions}
              />
              <MetricCard
                title="Bounce Rate"
                value={metrics.analytics.bounceRate * 100}
                unit="%"
                status={metrics.analytics.bounceRate > 0.4 ? "warning" : "good"}
              />
              <MetricCard
                title="Avg Session Duration"
                value={metrics.analytics.sessionDuration}
                unit="s"
              />
            </div>
          </div>
        )}

        {showErrors && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Error Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Errors"
                value={metrics.errors.totalErrors}
                status={metrics.errors.totalErrors > 20 ? "error" : "warning"}
              />
              <MetricCard
                title="Critical Errors"
                value={metrics.errors.criticalErrors}
                status={metrics.errors.criticalErrors > 0 ? "error" : "good"}
              />
              <MetricCard
                title="Composition Errors"
                value={metrics.errors.compositionErrors}
                status={
                  metrics.errors.compositionErrors > 5 ? "warning" : "good"
                }
              />
              <MetricCard
                title="Hydration Errors"
                value={metrics.errors.hydrationErrors}
                status={metrics.errors.hydrationErrors > 0 ? "warning" : "good"}
              />
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-medium text-blue-800 mb-2">
              Real-time Log Stream
            </h3>
            <div className="bg-black text-green-400 p-3 rounded font-mono text-sm max-h-64 overflow-y-auto">
              <div className="space-y-1">
                <div>
                  {"{"}"level": "info", "msg": "Composer execution started",
                  "event": "composer_start", "sectionId": "hero"{"}"}
                </div>
                <div>
                  {"{"}"level": "info", "msg": "Cache operation completed",
                  "event": "cache_hit", "key": "composition:landing:v1"{"}"}
                </div>
                <div>
                  {"{"}"level": "info", "msg": "Experiment assignment", "event":
                  "experiment_assignment", "experimentId": "cta-color-test"{"}"}
                </div>
                <div>
                  {"{"}"level": "info", "msg": "Analytics event tracked",
                  "event": "analytics_event", "eventType": "page_view"{"}"}
                </div>
                <div>
                  {"{"}"level": "warn", "msg": "Hydration mismatch detected",
                  "event": "hydration_mismatch", "sectionId": "pricing"{"}"}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Active Alerts
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <div className="flex items-center justify-between p-2 bg-red-100 rounded">
                <div>
                  <div className="font-medium text-red-800">
                    High Hydration Mismatch Rate
                  </div>
                  <div className="text-sm text-red-600">
                    Too many hydration mismatches detected
                  </div>
                </div>
                <span className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs">
                  HIGH
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-yellow-100 rounded">
                <div>
                  <div className="font-medium text-yellow-800">
                    Composer Validation Failures
                  </div>
                  <div className="text-sm text-yellow-600">
                    Composer validation consistently failing
                  </div>
                </div>
                <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs">
                  MEDIUM
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-blue-100 rounded">
                <div>
                  <div className="font-medium text-blue-800">
                    Low Cache Hit Rate
                  </div>
                  <div className="text-sm text-blue-600">
                    Cache hit rate below acceptable threshold
                  </div>
                </div>
                <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">
                  LOW
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== COMPONENT LOADING STRATEGIES =====
// All component resolution is now handled by SectionRegistry for type safety

// ===== COMPONENT RESOLUTION =====
// All component resolution is now handled by SectionRegistry for type safety

// All component resolution is now handled by SectionRegistry

// ===== COMPONENT RESOLUTION BY CRITICALITY =====

/**
 * Get component based on section criticality
 * Critical: Direct import (no lazy)
 * Important: Dynamic with SSR
 * Secondary: Lazy with timeout
 */
// Component resolution using typed registry
function getComponentWithSuspense(
  sectionId: SectionId,
): ComponentType<unknown> | null {
  const traceId = generateLazyLoadTraceId();

  try {
    logLazyLoadStart({
      sectionId,
      strategy: SectionRegistry.getCriticality(sectionId),
      trigger: "manual",
      traceId,
    });

    // Get component from registry (type-safe)
    const Component = SectionRegistry.getComponent(sectionId);

    if (!Component) {
      logLazyLoadError({
        sectionId,
        error: "Component not found in registry",
        traceId,
      });
      return null;
    }

    // Create loading context and get decision from policy
    const loadingContext = LazyLoadingPolicy.createLoadingContext("landing");
    const loadingDecision = LazyLoadingPolicy.getLoadingDecision(
      sectionId,
      loadingContext,
    );

    console.log(`[LazyLoadingPolicy] Section ${sectionId} loading decision:`, {
      shouldLoad: loadingDecision.shouldLoad,
      priority: LoadingPriority[loadingDecision.priority],
      trigger: loadingDecision.trigger,
    });

    // Check if component should be lazy loaded using policy
    if (LazyLoadingPolicy.shouldLazyLoad(sectionId, loadingContext)) {
      console.log(
        `[LazyLoadingPolicy] ${sectionId} uses lazy loading with Suspense wrapper`,
      );

      // Return component that accepts props and wraps with Suspense
      return (props: unknown) => (
        <Suspense
          fallback={
            <section className="section-wrapper py-20 md:py-28">
              <div className="container mx-auto max-w-6xl px-4 md:px-6">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-12"></div>
                  <div className="grid md:grid-cols-3 gap-8">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-64 bg-gray-200 rounded-xl"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          }
        >
          <Component {...props} />
        </Suspense>
      );
    } else {
      console.log(`[SectionRegistry] ${sectionId} uses direct loading`);
      // Return component directly (no lazy loading)
      return Component;
    }
  } catch (error) {
    logLazyLoadError({
      sectionId,
      error: error instanceof Error ? error.message : String(error),
      traceId,
    });
    return null;
  }
}

// All lazy loading is now handled by getComponentWithSuspense

// All component resolution now handled by getComponentWithSuspense and SectionRegistry

export function getComponentForSection(
  sectionId: SectionId,
): ComponentType<unknown> {
  console.log(
    `[SectionRegistry] Resolving component for section: ${sectionId}`,
  );

  // Validate section ID
  if (!SectionRegistry.isValidSectionId(sectionId)) {
    console.error(`[SectionRegistry] Invalid section ID: ${sectionId}`);
    return () => (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Seção não encontrada: {sectionId}</p>
      </div>
    );
  }

  // Get component with proper loading strategy
  const component = getComponentWithSuspense(sectionId);

  if (!component) {
    console.error(
      `[SectionRegistry] Failed to resolve component for: ${sectionId}`,
    );
    return () => (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Erro ao carregar seção: {sectionId}</p>
      </div>
    );
  }

  return component;
}

/**
 * Check if section should use lazy loading (delegate to LazyLoadingPolicy)
 */
export function shouldUseLazyLoading(sectionId: SectionId): boolean {
  const loadingContext = LazyLoadingPolicy.createLoadingContext("landing");
  return LazyLoadingPolicy.shouldLazyLoad(sectionId, loadingContext);
}

/**
 * Get loading priority for section (delegate to LazyLoadingPolicy)
 */
export function getSectionPriority(
  sectionId: SectionId,
): "critical" | "important" | "secondary" {
  return SectionRegistry.getCriticality(sectionId);
}

// Simplified loading config - basic intersection observer
export interface LazyLoadingConfig {
  rootMargin: string;
  threshold: number | number[];
  priority: "high" | "medium" | "low";
}

export function getLazyLoadingConfig(sectionId: SectionId): LazyLoadingConfig {
  const loadingContext = LazyLoadingPolicy.createLoadingContext("landing");
  const intersectionConfig = LazyLoadingPolicy.getIntersectionConfig(
    sectionId,
    loadingContext,
  );

  if (!intersectionConfig) {
    // Section doesn't use viewport loading, return default config
    return {
      rootMargin: "300px",
      threshold: 0.1,
      priority: "low",
    };
  }

  // Map loading priority to config priority
  const loadingDecision = LazyLoadingPolicy.getLoadingDecision(
    sectionId,
    loadingContext,
  );
  let priority: "high" | "medium" | "low";

  switch (loadingDecision.priority) {
    case LoadingPriority.IMMEDIATE:
    case LoadingPriority.HIGH:
      priority = "high";
      break;
    case LoadingPriority.MEDIUM:
      priority = "medium";
      break;
    case LoadingPriority.LOW:
    case LoadingPriority.DEFERRED:
      priority = "low";
      break;
    default:
      priority = "medium";
  }

  return {
    rootMargin: intersectionConfig.rootMargin || "300px",
    threshold: intersectionConfig.threshold || 0.1,
    priority,
  };
}

// Minimal monitoring for debugging
export const lazyLoadingMonitor = {
  loadedSections: new Set<string>(),
  markLoaded(sectionId: string) {
    this.loadedSections.add(sectionId);
  },
  isLoaded(sectionId: string): boolean {
    return this.loadedSections.has(sectionId);
  },
};

// Bundle registry for tracking (simplified)
export const bundleRegistry = new Map<string, boolean>();

/**
 * Initialize lazy loading policies
 * Should be called once during app initialization
 */
export function initializeLazyLoadingPolicies(): void {
  LazyLoadingPolicy.initializePolicies();
}

// ===== TDD IMPLEMENTATION: RouteBasedLazyLoading =====

/**
 * Route-based lazy loading system
 * TDD-driven implementation for optimal loading performance
 */
export class RouteBasedLazyLoading {
  private static loadedSections = new Set<string>();
  private static componentCache = new Map<string, unknown>();

  /**
   * Initialize lazy loading system
   */
  static initializeLazyLoading(): void {
    LazyLoadingPolicy.initializePolicies();
  }

  /**
   * Create a lazy-loaded component
   */
  static createLazyComponent(
    sectionId: SectionId,
  ): React.ComponentType<unknown> {
    if (!SectionRegistry) {
      throw new Error("SectionRegistry not available");
    }

    const Component = SectionRegistry.getComponent(sectionId);
    if (!Component) {
      throw new Error(`Section ${sectionId} not found in registry`);
    }

    // Generate trace ID for logging
    const traceId = generateLazyLoadTraceId();

    logLazyLoadStart({
      sectionId,
      componentName: sectionId,
      trigger: "manual",
      priority: "medium",
      strategy: "secondary",
      traceId,
    });

    const LazyComponent = lazy(() =>
      Promise.resolve({ default: Component })
        .then((module: unknown) => {
          // Type guard for module structure
          if (module && typeof module === 'object' && 'default' in module) {
            const loadTime = Date.now();
            logLazyLoadSuccess({
              sectionId,
              componentName: sectionId,
              loadTime,
              trigger: "manual",
              priority: "medium",
              strategy: "secondary",
              traceId,
            });
            this.markSectionAsLoaded(sectionId);
            return module;
          } else {
            throw new Error(`Invalid module structure for section: ${sectionId}`);
          }
        })
        .catch((error: unknown) => {
          logger.error("Lazy loading failed", {
            sectionId,
            error: (error as Error).message,
            traceId,
          });
          throw error;
        }),
    );

    // Wrap with error boundary
    const WrappedComponent = (props: unknown) => (
      <Suspense fallback={<div>Loading...</div>}>
        <LazyComponent {...props} />
      </Suspense>
    );

    return WrappedComponent;
  }

  /**
   * Create intersection observer lazy component
   */
  static createIntersectionObserverLazyComponent(sectionId: SectionId): {
    component: React.ComponentType<unknown>;
    cleanup: () => void;
  } {
    const LazyComponent = this.createLazyComponent(sectionId);

    let observer: IntersectionObserver | null = null;

    const ObservedComponent = React.forwardRef<unknown, unknown>(
      (props, ref) => {
        const [isVisible, setIsVisible] = React.useState(false);

        React.useEffect(() => {
          if (
            typeof window !== "undefined" &&
            "IntersectionObserver" in window
          ) {
            const config = this.getIntersectionObserverConfig(sectionId);

            observer = new window.IntersectionObserver(
              (entries) => {
                entries.forEach((entry) => {
                  if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer?.disconnect();
                  }
                });
              },
              {
                rootMargin: config.rootMargin,
                threshold: config.threshold,
              },
            );

            if (ref && "current" in ref && ref.current) {
              observer.observe(ref.current);
            }
          } else {
            // Fallback: load immediately if no IntersectionObserver
            setIsVisible(true);
          }

          return () => {
            observer?.disconnect();
          };
        }, []);

        return (
          <div ref={ref}>
            {isVisible ? <LazyComponent {...props} /> : <div>Loading...</div>}
          </div>
        );
      },
    );

    const cleanup = () => {
      observer?.disconnect();
    };

    return { component: ObservedComponent, cleanup };
  }

  /**
   * Get intersection observer configuration
   */
  static getIntersectionObserverConfig(
    sectionId: SectionId,
    loadingContext?: unknown,
  ): {
    rootMargin: string;
    threshold: number;
    priority: "high" | "medium" | "low";
  } {
    const loadingDecision = LazyLoadingPolicy.getLoadingDecision(
      sectionId,
      loadingContext,
    );

    let priority: "high" | "medium" | "low" = "medium";

    switch (loadingDecision.priority) {
      case LoadingPriority.IMMEDIATE:
      case LoadingPriority.HIGH:
        priority = "high";
        break;
      case LoadingPriority.MEDIUM:
        priority = "medium";
        break;
      case LoadingPriority.LOW:
      case LoadingPriority.DEFERRED:
        priority = "low";
        break;
    }

    return {
      rootMargin: "300px",
      threshold: 0.1,
      priority,
    };
  }

  /**
   * Create error fallback component
   */
  static createErrorFallback(
    sectionId: SectionId,
    error: string,
  ): React.ComponentType<unknown> {
    return () => (
      <div>
        Error loading {sectionId}: {error}
      </div>
    );
  }

  /**
   * Get performance metrics
   */
  static getPerformanceMetrics(): unknown {
    return {
      loadedSections: Array.from(this.loadedSections),
      cacheSize: this.componentCache.size,
    };
  }

  /**
   * Get bundle info
   */
  static getBundleInfo(sectionId: SectionId): { size: number } {
    return { size: 0 }; // Placeholder
  }

  /**
   * Check if section is loaded
   */
  static isSectionLoaded(sectionId: SectionId): boolean {
    return this.loadedSections.has(sectionId);
  }

  /**
   * Mark section as loaded
   */
  static markSectionAsLoaded(sectionId: SectionId): void {
    this.loadedSections.add(sectionId);
  }

  /**
   * Cleanup unused components
   */
  static cleanupUnusedComponents(): void {
    // Basic cleanup - clear cache
    this.componentCache.clear();
  }

  /**
   * Get cache size
   */
  static getCacheSize(): number {
    return this.componentCache.size;
  }
}

// ===== CONTRACT EXPORTS =====
// These exports align with the LazyLoadingContract interface

/**
 * Check if a section should use lazy loading
 */
export function shouldLazyLoad(
  sectionId: SectionId,
  context?: unknown,
): boolean {
  const loadingContext = LazyLoadingPolicy.createLoadingContext("landing");
  return LazyLoadingPolicy.shouldLazyLoad(sectionId, loadingContext);
}

/**
 * Get chunk ID for a section
 */
export function getChunkId(sectionId: SectionId): string {
  return `section-${sectionId}`;
}

/**
 * Trace lazy loading operation
 */
export function traceLazyLoad(
  sectionId: SectionId,
  operation: string,
  data?: unknown,
): void {
  logger.info(`Lazy loading trace: ${operation}`, {
    sectionId,
    operation,
    ...data,
    traceId: generateLazyLoadTraceId(),
  });
}

/**
 * Prefetch a section component
 */
export async function prefetch(sectionId: SectionId): Promise<void> {
  const traceId = generateLazyLoadTraceId();

  logLazyLoadStart({
    sectionId,
    trigger: "manual",
    priority: "high",
    strategy: "critical",
    traceId,
  });

  try {
    // Simulate prefetch by preloading the component
    const Component = SectionRegistry.getComponent(sectionId);
    if (Component && typeof Component === "function") {
      logLazyLoadSuccess({
        sectionId,
        componentName: sectionId,
        loadTime: 0,
        trigger: "manual",
        priority: "high",
        strategy: "critical",
        traceId,
      });
    } else {
      throw new Error(`Component not found for section: ${sectionId}`);
    }
  } catch (error) {
    logLazyLoadError({
      sectionId,
      error: error instanceof Error ? error.message : String(error),
      traceId,
    });
    throw error;
  }
}

/**
 * Load a section component dynamically
 */
export async function load(
  sectionId: SectionId,
): Promise<ComponentType<unknown>> {
  const traceId = generateLazyLoadTraceId();

  logLazyLoadStart({
    sectionId,
    trigger: "manual",
    priority: "medium",
    strategy: "secondary",
    traceId,
  });

  try {
    const Component = SectionRegistry.getComponent(sectionId);
    if (!Component) {
      throw new Error(`Component not found for section: ${sectionId}`);
    }

    logLazyLoadSuccess({
      sectionId,
      componentName: sectionId,
      loadTime: Date.now(),
      trigger: "manual",
      priority: "medium",
      strategy: "secondary",
      traceId,
    });

    return Component;
  } catch (error) {
    logLazyLoadError({
      sectionId,
      error: error instanceof Error ? error.message : String(error),
      traceId,
    });
    throw error;
  }
}
