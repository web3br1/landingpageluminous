/**
 * Bundle Optimization System - Fase 3
 * Sistema inteligente de otimização de bundles com splitting automático
 */

import React, { Suspense } from "react";
import {
  isFeatureEnabled,
  FeatureFlag,
} from "../environment/environment-manager";
import { getAdvancedMonitoringSystem } from "../monitoring/advanced-metrics";
import { logger } from "../observability/logger";

/**
 * Bundle Split Strategy
 */
export enum BundleSplitStrategy {
  ROUTE_BASED = "route_based",
  COMPONENT_BASED = "component_based",
  FEATURE_BASED = "feature_based",
  SIZE_BASED = "size_based",
}

/**
 * Bundle Configuration
 */
export interface BundleConfig {
  strategy: BundleSplitStrategy;
  maxSize: number; // KB
  minSize: number; // KB
  preloadCritical: boolean;
  prefetchOnIdle: boolean;
  cacheGroups: {
    vendor: boolean;
    framework: boolean;
    ui: boolean;
    features: boolean;
  };
}

/**
 * Component Load Priority
 */
export enum LoadPriority {
  CRITICAL = "critical", // Above the fold, immediately needed
  HIGH = "high", // Below the fold, likely to be used
  MEDIUM = "medium", // May be used during session
  LOW = "low", // Rarely used
}

/**
 * Lazy Load Configuration
 */
export interface LazyLoadConfig {
  component: string;
  priority: LoadPriority;
  triggerDistance?: number; // pixels from viewport
  timeout?: number; // fallback timeout
  fallback?: React.ComponentType;
}

/**
 * Bundle Optimizer Class
 */
export class BundleOptimizer {
  private config: BundleConfig;
  private lazyComponents = new Map<string, LazyLoadConfig>();
  private bundleSizes = new Map<string, number>();
  private monitoring = getAdvancedMonitoringSystem();

  constructor(config: Partial<BundleConfig> = {}) {
    this.config = {
      strategy: BundleSplitStrategy.ROUTE_BASED,
      maxSize: 244, // KB (based on Core Web Vitals recommendations)
      minSize: 30, // KB
      preloadCritical: true,
      prefetchOnIdle: true,
      cacheGroups: {
        vendor: true,
        framework: true,
        ui: true,
        features: true,
      },
      ...config,
    };

    this.initializeOptimizations();
  }

  /**
   * Initialize performance optimizations
   */
  private initializeOptimizations(): void {
    if (!isFeatureEnabled(FeatureFlag.BUNDLE_SPLITTING)) {
      logger.info("Bundle splitting disabled by feature flag");
      return;
    }

    // Register critical components for preloading
    this.registerCriticalComponents();

    // Set up performance monitoring
    this.setupPerformanceMonitoring();

    logger.info("Bundle optimization initialized", {
      strategy: this.config.strategy,
      maxSize: this.config.maxSize,
      features: this.config.cacheGroups,
    });
  }

  /**
   * Register components that should be loaded immediately
   */
  private registerCriticalComponents(): void {
    // Core components that are always needed
    this.registerComponent("HeroSection", {
      component: "HeroSection",
      priority: LoadPriority.CRITICAL,
    });

    this.registerComponent("Header", {
      component: "Header",
      priority: LoadPriority.CRITICAL,
    });

    // High priority components
    this.registerComponent("PricingSection", {
      component: "PricingSection",
      priority: LoadPriority.HIGH,
    });

    this.registerComponent("FeaturesSection", {
      component: "FeaturesSection",
      priority: LoadPriority.HIGH,
    });
  }

  /**
   * Register a component for lazy loading
   */
  registerComponent(name: string, config: LazyLoadConfig): void {
    this.lazyComponents.set(name, config);

    // Preload critical components
    if (
      config.priority === LoadPriority.CRITICAL &&
      this.config.preloadCritical
    ) {
      this.preloadComponent(name);
    }
  }

  /**
   * Preload a component
   */
  private async preloadComponent(componentName: string): Promise<void> {
    try {
      const startTime = Date.now();

      // Dynamic import based on component name
      await this.loadComponentBundle(componentName);

      const loadTime = Date.now() - startTime;

      // Record metrics
      this.monitoring.recordCoreWebVitals({
        inp: loadTime, // Use as interaction metric
      });

      logger.debug(`Component preloaded: ${componentName}`, {
        loadTime,
        priority: this.lazyComponents.get(componentName)?.priority,
      });
    } catch (error) {
      logger.error(`Failed to preload component: ${componentName}`, {
        error:
          error instanceof Error ? error : new Error("Unknown preload error"),
      });
    }
  }

  /**
   * Load component bundle dynamically
   */
  private async loadComponentBundle(componentName: string): Promise<unknown> {
    // This would be replaced with actual dynamic imports in a real implementation
    // For now, simulate loading
    return new Promise((resolve) => {
      setTimeout(() => resolve({ default: () => null }), 100);
    });
  }

  /**
   * Get lazy-loaded component
   */
  async getLazyComponent(
    componentName: string,
  ): Promise<React.ComponentType<unknown>> {
    const config = this.lazyComponents.get(componentName);

    if (!config) {
      logger.warn(
        `Component not registered for lazy loading: ${componentName}`,
      );
      return () => null;
    }

    try {
      const bundle = await this.loadComponentBundle(componentName);

      // Record component load metric
      this.monitoring.recordUserEngagement(
        "component_loaded",
        undefined,
        undefined,
        {
          component: componentName,
          priority: config.priority,
        },
      );

      return (bundle as any).default;
    } catch (error) {
      logger.error(`Failed to load lazy component: ${componentName}`, {
        error: error instanceof Error ? error : new Error("Unknown load error"),
      });

      // Return fallback component
      return config.fallback || (() => null);
    }
  }

  /**
   * Set up performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if (typeof window !== "undefined") {
      // Monitor bundle sizes
      this.monitorBundleSizes();

      // Monitor loading performance
      this.monitorLoadingPerformance();
    }
  }

  /**
   * Monitor bundle sizes (would integrate with webpack build info)
   */
  private monitorBundleSizes(): void {
    // In a real implementation, this would read from webpack stats
    // For now, simulate with mock data
    this.bundleSizes.set("main", 150);
    this.bundleSizes.set("vendor", 200);
    this.bundleSizes.set("ui", 80);
    this.bundleSizes.set("features", 120);
  }

  /**
   * Monitor loading performance
   */
  private monitorLoadingPerformance(): void {
    // Monitor navigation timing
    if ("performance" in window && "getEntriesByType" in performance) {
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;

      if (navigation) {
        this.monitoring.recordCoreWebVitals({
          ttfb: navigation.responseStart - navigation.requestStart,
        });
      }
    }

    // Monitor resource loading
    if ("performance" in window && "getEntriesByType" in performance) {
      const resources = performance.getEntriesByType(
        "resource",
      ) as PerformanceResourceTiming[];

      resources.forEach((resource) => {
        if (
          resource.initiatorType === "script" ||
          resource.name.includes(".js")
        ) {
          const loadTime = resource.responseEnd - resource.requestStart;

          // Record bundle load time
          this.monitoring.recordAPIPerformance(
            resource.name,
            "GET",
            loadTime,
            200, // Assume success
            { type: "bundle_load" },
          );
        }
      });
    }
  }

  /**
   * Check if bundle size is within limits
   */
  checkBundleSize(bundleName: string, sizeKB: number): boolean {
    const isWithinLimit = sizeKB <= this.config.maxSize;

    if (!isWithinLimit) {
      logger.warn(`Bundle size exceeds limit: ${bundleName}`, {
        sizeKB,
        limitKB: this.config.maxSize,
        recommendation: "Consider splitting this bundle further",
      });

      // Record as performance issue
      this.monitoring.recordCoreWebVitals({
        cls: 0.1, // Simulate layout shift due to large bundle
      });
    }

    return isWithinLimit;
  }

  /**
   * Get bundle optimization recommendations
   */
  getOptimizationRecommendations(): Array<{
    component: string;
    recommendation: string;
    priority: "high" | "medium" | "low";
    estimatedSavings: number; // KB
  }> {
    const recommendations: Array<{
      component: string;
      recommendation: string;
      priority: "high" | "medium" | "low";
      estimatedSavings: number;
    }> = [];

    // Analyze component usage patterns
    for (const [componentName, config] of this.lazyComponents) {
      if (config.priority === LoadPriority.LOW) {
        recommendations.push({
          component: componentName,
          recommendation: "Consider lazy loading this rarely used component",
          priority: "medium",
          estimatedSavings: 20, // Mock savings
        });
      }
    }

    // Bundle size recommendations
    for (const [bundleName, size] of this.bundleSizes) {
      if (size > this.config.maxSize * 0.8) {
        // 80% of limit
        recommendations.push({
          component: bundleName,
          recommendation: `Bundle size (${size}KB) is approaching limit. Consider splitting.`,
          priority: "high",
          estimatedSavings: Math.max(0, size - this.config.maxSize + 50),
        });
      }
    }

    return recommendations;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    bundleSizes: Record<string, number>;
    lazyComponents: number;
    optimizationScore: number;
    recommendations: number;
  } {
    const recommendations = this.getOptimizationRecommendations();

    // Calculate optimization score (0-100)
    let score = 100;

    // Deduct points for large bundles
    for (const size of this.bundleSizes.values()) {
      if (size > this.config.maxSize) {
        score -= 20;
      } else if (size > this.config.maxSize * 0.8) {
        score -= 10;
      }
    }

    // Deduct points for too many recommendations
    score -= Math.min(30, recommendations.length * 5);

    return {
      bundleSizes: Object.fromEntries(this.bundleSizes),
      lazyComponents: this.lazyComponents.size,
      optimizationScore: Math.max(0, score),
      recommendations: recommendations.length,
    };
  }

  /**
   * Prefetch components on idle
   */
  prefetchOnIdle(): void {
    if (!this.config.prefetchOnIdle || typeof window === "undefined") return;

    // Use requestIdleCallback for prefetching
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => {
        this.prefetchLowPriorityComponents();
      });
    } else {
      // Fallback to setTimeout
      setTimeout(() => {
        this.prefetchLowPriorityComponents();
      }, 5000);
    }
  }

  /**
   * Prefetch low priority components
   */
  private async prefetchLowPriorityComponents(): Promise<void> {
    const lowPriorityComponents = Array.from(this.lazyComponents.entries())
      .filter(([, config]) => config.priority === LoadPriority.LOW)
      .slice(0, 3); // Limit to 3 components

    for (const [componentName] of lowPriorityComponents) {
      try {
        await this.preloadComponent(componentName);
      } catch (error) {
        // Silently fail for prefetch
        logger.debug(`Prefetch failed for: ${componentName}`);
      }
    }
  }
}

// ===== SINGLETON INSTANCE =====

let bundleOptimizerInstance: BundleOptimizer | null = null;

export function getBundleOptimizer(
  config?: Partial<BundleConfig>,
): BundleOptimizer {
  if (!bundleOptimizerInstance) {
    bundleOptimizerInstance = new BundleOptimizer(config);
  }
  return bundleOptimizerInstance;
}

export function destroyBundleOptimizer(): void {
  bundleOptimizerInstance = null;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Create lazy-loaded component with automatic bundle splitting
 */
export function createLazyComponent<T extends React.ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  config: Partial<LazyLoadConfig> = {},
): React.ComponentType<unknown> {
  const LazyComponent = React.lazy(importFn);

  const componentName = config.component || "UnknownComponent";

  // Register with bundle optimizer
  getBundleOptimizer().registerComponent(componentName, {
    component: componentName,
    priority: LoadPriority.MEDIUM,
    ...config,
  } as LazyLoadConfig);

  return (props: unknown) => (
    <Suspense
      fallback={config.fallback ? <config.fallback /> : <div>Loading...</div>}
    >
      <LazyComponent {...(props as any)} />
    </Suspense>
  );
}

/**
 * Hook for bundle optimization
 */
export function useBundleOptimization(): {
  prefetchComponent: (componentName: string) => void;
  getOptimizationScore: () => number;
  getRecommendations: () => unknown[];
} {
  const optimizer = getBundleOptimizer();

  return {
    prefetchComponent: async (componentName: string) => {
      await optimizer.getLazyComponent(componentName);
    },
    getOptimizationScore: () =>
      optimizer.getPerformanceMetrics().optimizationScore,
    getRecommendations: () => optimizer.getOptimizationRecommendations(),
  };
}
