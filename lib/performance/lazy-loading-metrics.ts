// Lazy Loading Performance Metrics
// Tracks performance metrics for lazy loaded components

import { analytics } from "../analytics-core";

export interface LazyLoadMetric {
  componentName: string;
  loadStartTime: number;
  loadEndTime?: number;
  loadDuration?: number;
  intersectionDelay?: number;
  priority: "critical" | "high" | "medium" | "low";
  success: boolean;
  error?: string;
  viewportPosition?: number; // Distance from viewport when loaded
  bundleSize?: number; // Estimated bundle size in KB
}

export interface LazyLoadSummary {
  totalComponents: number;
  loadedComponents: number;
  failedComponents: number;
  averageLoadTime: number;
  totalLoadTime: number;
  componentsByPriority: Record<string, number>;
  loadTimeByPriority: Record<string, number>;
  intersectionDelayStats: {
    average: number;
    max: number;
    min: number;
  };
}

class LazyLoadingMetricsTracker {
  private metrics: LazyLoadMetric[] = [];
  private sessionStartTime: number = Date.now();

  /**
   * Track when a lazy load starts
   */
  startLazyLoad(
    componentName: string,
    priority: LazyLoadMetric["priority"],
  ): void {
    const metric: LazyLoadMetric = {
      componentName,
      loadStartTime: performance.now(),
      priority,
      success: false,
    };

    this.metrics.push(metric);

    // Track start event
    if (typeof window !== "undefined") {
      analytics.track("lazy_load_start", {
        component_name: componentName,
        priority,
        session_duration: Date.now() - this.sessionStartTime,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Track when a lazy load completes successfully
   */
  completeLazyLoad(
    componentName: string,
    intersectionDelay?: number,
    viewportPosition?: number,
    bundleSize?: number,
  ): void {
    const metric = this.metrics.find(
      (m) => m.componentName === componentName && !m.success,
    );

    if (metric) {
      metric.loadEndTime = performance.now();
      metric.loadDuration = metric.loadEndTime - metric.loadStartTime;
      metric.intersectionDelay = intersectionDelay;
      metric.viewportPosition = viewportPosition;
      metric.bundleSize = bundleSize;
      metric.success = true;

      // Track completion event
      if (typeof window !== "undefined") {
        analytics.track("lazy_load_complete", {
          component_name: componentName,
          priority: metric.priority,
          load_duration: metric.loadDuration,
          intersection_delay: intersectionDelay,
          viewport_position: viewportPosition,
          bundle_size: bundleSize,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Track when a lazy load fails
   */
  failLazyLoad(componentName: string, error: string): void {
    const metric = this.metrics.find(
      (m) => m.componentName === componentName && !m.success,
    );

    if (metric) {
      metric.loadEndTime = performance.now();
      metric.loadDuration = metric.loadEndTime - metric.loadStartTime;
      metric.success = false;
      metric.error = error;

      // Track failure event
      if (typeof window !== "undefined") {
        analytics.track("lazy_load_error", {
          component_name: componentName,
          priority: metric.priority,
          load_duration: metric.loadDuration,
          error_message: error,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Get performance summary
   */
  getSummary(): LazyLoadSummary {
    const completedMetrics = this.metrics.filter(
      (m) => m.success && m.loadDuration,
    );

    const totalComponents = this.metrics.length;
    const loadedComponents = completedMetrics.length;
    const failedComponents = this.metrics.filter((m) => !m.success).length;

    const totalLoadTime = completedMetrics.reduce(
      (sum, m) => sum + (m.loadDuration || 0),
      0,
    );
    const averageLoadTime =
      loadedComponents > 0 ? totalLoadTime / loadedComponents : 0;

    const componentsByPriority = this.metrics.reduce(
      (acc, metric) => {
        acc[metric.priority] = (acc[metric.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const loadTimeByPriority = completedMetrics.reduce(
      (acc, metric) => {
        if (metric.loadDuration) {
          acc[metric.priority] =
            (acc[metric.priority] || 0) + metric.loadDuration;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    const intersectionDelays = completedMetrics
      .map((m) => m.intersectionDelay)
      .filter((delay) => delay !== undefined) as number[];

    const intersectionDelayStats = {
      average:
        intersectionDelays.length > 0
          ? intersectionDelays.reduce((sum, delay) => sum + delay, 0) /
            intersectionDelays.length
          : 0,
      max: intersectionDelays.length > 0 ? Math.max(...intersectionDelays) : 0,
      min: intersectionDelays.length > 0 ? Math.min(...intersectionDelays) : 0,
    };

    return {
      totalComponents,
      loadedComponents,
      failedComponents,
      averageLoadTime,
      totalLoadTime,
      componentsByPriority,
      loadTimeByPriority,
      intersectionDelayStats,
    };
  }

  /**
   * Get all metrics
   */
  getMetrics(): LazyLoadMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clear(): void {
    this.metrics = [];
    this.sessionStartTime = Date.now();
  }

  /**
   * Export metrics for debugging
   */
  exportMetrics(): string {
    return JSON.stringify(
      {
        summary: this.getSummary(),
        metrics: this.getMetrics(),
        sessionDuration: Date.now() - this.sessionStartTime,
      },
      null,
      2,
    );
  }
}

// Singleton instance
export const lazyLoadingMetrics = new LazyLoadingMetricsTracker();

// Utility functions for easy integration
export function trackLazyLoadStart(
  componentName: string,
  priority: LazyLoadMetric["priority"] = "medium",
): void {
  lazyLoadingMetrics.startLazyLoad(componentName, priority);
}

export function trackLazyLoadComplete(
  componentName: string,
  intersectionDelay?: number,
  viewportPosition?: number,
  bundleSize?: number,
): void {
  lazyLoadingMetrics.completeLazyLoad(
    componentName,
    intersectionDelay,
    viewportPosition,
    bundleSize,
  );
}

export function trackLazyLoadError(componentName: string, error: string): void {
  lazyLoadingMetrics.failLazyLoad(componentName, error);
}

// Performance observer for bundle size estimation
export function estimateBundleSize(componentName: string): number | undefined {
  // This is a rough estimation based on component name patterns
  // In a real implementation, you'd use webpack bundle analyzer data

  const sizeEstimates: Record<string, number> = {
    // Admin components - typically larger due to charts/tables
    "experiment-dashboard": 150,
    "ml-dashboard": 200,
    "monitoring-dashboard": 180,
    "performance-dashboard": 160,

    // Demo components - vary widely
    "morph-svg-demo": 50,
    "parallax-demo": 80,
    "path-motion-demo": 60,
    "performance-hud": 40,

    // UI components
    "live-chat": 120,
    "ux-advanced-orchestrator": 100,
    dialog: 30,
    table: 90,
  };

  return sizeEstimates[componentName];
}

// Hook for React components to automatically track lazy loading
export function useLazyLoadTracking(
  componentName: string,
  priority: LazyLoadMetric["priority"] = "medium",
) {
  React.useEffect(() => {
    trackLazyLoadStart(componentName, priority);

    // Estimate bundle size
    const bundleSize = estimateBundleSize(componentName);

    // Track completion when component mounts
    const startTime = performance.now();
    trackLazyLoadComplete(componentName, 0, 0, bundleSize);

    // Cleanup on unmount
    return () => {
      // Could track unmount events if needed
    };
  }, [componentName, priority]);
}

// Import React for the hook
import React from "react";
