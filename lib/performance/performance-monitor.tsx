"use client";

/**
 * Performance Monitor - Fase 3
 * Sistema integrado de monitoramento de performance web com Core Web Vitals
 */

import { useEffect, useState, useCallback } from "react";
import { getAdvancedMonitoringSystem } from "../monitoring/advanced-metrics";
import { getBundleOptimizer } from "./bundle-optimization";
import { getCDNOptimizer } from "./cdn-optimization";
import {
  isFeatureEnabled,
  FeatureFlag,
} from "../environment/environment-manager";
import { logger } from "../observability/logger";

/**
 * Core Web Vitals Metrics
 */
export interface CoreWebVitals {
  lcp?: number; // Largest Contentful Paint
  cls?: number; // Cumulative Layout Shift
  inp?: number; // Interaction to Next Paint
  fid?: number; // First Input Delay
  ttfb?: number; // Time to First Byte
  fcp?: number; // First Contentful Paint
}

/**
 * Extended Performance Entry interfaces
 */
interface ExtendedPerformanceEntry {
  startTime: number;
  processingStart?: number;
  processingEnd?: number;
  hadRecentInput?: boolean;
  value?: number;
  name?: string;
  transferSize?: number;
  priority?: string;
}

/**
 * Performance Metrics
 */
export interface PerformanceMetrics {
  coreWebVitals: CoreWebVitals;
  navigationTiming: NavigationTimingMetrics;
  resourceTiming: ResourceTimingMetrics[];
  memoryUsage?: MemoryUsage;
  bundleMetrics: BundleMetrics;
  cdnMetrics: CDNMetrics;
  lazyLoadingMetrics: LazyLoadingMetrics;
  overallScore: number;
}

/**
 * Navigation Timing Metrics
 */
export interface NavigationTimingMetrics {
  dnsLookup: number;
  tcpConnect: number;
  serverResponse: number;
  pageLoad: number;
  domInteractive: number;
  domContentLoaded: number;
  domComplete: number;
}

/**
 * Resource Timing Metrics
 */
export interface ResourceTimingMetrics {
  name: string;
  type: string;
  duration: number;
  size?: number;
  cached: boolean;
  priority?: string;
}

/**
 * Memory Usage Metrics
 */
export interface MemoryUsage {
  used: number;
  total: number;
  limit: number;
  usagePercent: number;
}

/**
 * Bundle Performance Metrics
 */
export interface BundleMetrics {
  totalSize: number;
  bundleCount: number;
  largestBundle: {
    name: string;
    size: number;
  };
  optimizationScore: number;
  recommendations: Array<{
    component: string;
    recommendation: string;
    priority: "high" | "medium" | "low";
    estimatedSavings: number;
  }>;
}

/**
 * CDN Performance Metrics
 */
export interface CDNMetrics {
  totalResources: number;
  preloadedResources: number;
  prefetchedResources: number;
  loadingStrategy: string;
  connectionType?: string;
  recommendations: Array<{
    resource: string;
    recommendation: string;
    priority: "high" | "medium" | "low";
    estimatedSavings: number;
  }>;
}

/**
 * Lazy Loading Performance Metrics
 */
export interface LazyLoadingMetrics {
  totalComponents: number;
  loadedComponents: number;
  failedComponents: number;
  averageLoadTime: number;
  viewportTriggered: number;
  predictiveTriggered: number;
}

/**
 * Performance Monitor Hook
 */
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const monitoring = getAdvancedMonitoringSystem();

  // Start performance monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring || typeof window === "undefined") return;

    setIsMonitoring(true);

    // Monitor Core Web Vitals
    monitorCoreWebVitals();

    // Monitor Navigation Timing
    monitorNavigationTiming();

    // Monitor Resource Timing
    monitorResourceTiming();

    // Monitor Memory Usage
    monitorMemoryUsage();

    // Collect bundle metrics
    collectBundleMetrics();

    // Collect CDN metrics
    collectCDNMetrics();

    logger.info("Performance monitoring started");
  }, [isMonitoring]);

  // Stop performance monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    logger.info("Performance monitoring stopped");
  }, []);

  // Monitor Core Web Vitals
  const monitorCoreWebVitals = useCallback(() => {
    if (
      !("web-vitals" in window) &&
      !isFeatureEnabled(FeatureFlag.ADVANCED_METRICS)
    )
      return;

    // Use web-vitals library if available, otherwise fallback to manual measurement
    try {
      // LCP - Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as ExtendedPerformanceEntry;
        if (lastEntry) {
          const lcp = lastEntry.startTime;
          updateCoreWebVitals({ lcp });
          monitoring.recordCoreWebVitals({ lcp });
        }
      }).observe({ entryTypes: ["largest-contentful-paint"] });

      // CLS - Cumulative Layout Shift
      let clsValue = 0;
      new PerformanceObserver((list) => {
        const entries = list.getEntries() as ExtendedPerformanceEntry[];
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value || 0;
          }
        });
        updateCoreWebVitals({ cls: clsValue });
        monitoring.recordCoreWebVitals({ cls: clsValue });
      }).observe({ entryTypes: ["layout-shift"] });

      // FID - First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries() as ExtendedPerformanceEntry[];
        entries.forEach((entry) => {
          const fid = (entry.processingStart || 0) - entry.startTime;
          updateCoreWebVitals({ fid });
          monitoring.recordCoreWebVitals({ fid });
        });
      }).observe({ entryTypes: ["first-input"] });

      // INP - Interaction to Next Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries() as ExtendedPerformanceEntry[];
        const inp = Math.max(
          ...entries.map((entry) => (entry.processingEnd || 0) - entry.startTime),
        );
        if (inp > 0) {
          updateCoreWebVitals({ inp });
          monitoring.recordCoreWebVitals({ inp });
        }
      }).observe({ entryTypes: ["event"] });
    } catch (error) {
      logger.warn("Failed to set up Core Web Vitals monitoring", {
        error: error instanceof Error ? error : new Error(String(error)),
      });
      // Fallback to basic measurements
      monitorBasicWebVitals();
    }
  }, [monitoring]);

  // Basic Web Vitals fallback
  const monitorBasicWebVitals = useCallback(() => {
    // FCP - First Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries() as ExtendedPerformanceEntry[];
      entries.forEach((entry) => {
        if (entry.name === "first-contentful-paint") {
          const fcp = entry.startTime;
          updateCoreWebVitals({ fcp });
        }
      });
    }).observe({ entryTypes: ["paint"] });

    // TTFB - Time to First Byte
    if (performance.timing) {
      const ttfb =
        performance.timing.responseStart - performance.timing.requestStart;
      updateCoreWebVitals({ ttfb });
    }
  }, []);

  // Monitor Navigation Timing
  const monitorNavigationTiming = useCallback(() => {
    if (!performance.timing) return;

    const timing = performance.timing;

    const navigationMetrics: NavigationTimingMetrics = {
      dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
      tcpConnect: timing.connectEnd - timing.connectStart,
      serverResponse: timing.responseEnd - timing.requestStart,
      pageLoad: timing.loadEventEnd - timing.navigationStart,
      domInteractive: timing.domInteractive - timing.navigationStart,
      domContentLoaded:
        timing.domContentLoadedEventEnd - timing.navigationStart,
      domComplete: timing.domComplete - timing.navigationStart,
    };

    setMetrics((prev) =>
      prev
        ? {
            ...prev,
            navigationTiming: navigationMetrics,
          }
        : {
            coreWebVitals: {},
            navigationTiming: navigationMetrics,
            resourceTiming: [],
            bundleMetrics: {
              totalSize: 0,
              bundleCount: 0,
              largestBundle: { name: "", size: 0 },
              optimizationScore: 0,
              recommendations: [],
            },
            cdnMetrics: {
              totalResources: 0,
              preloadedResources: 0,
              prefetchedResources: 0,
              loadingStrategy: "none",
              recommendations: [],
            },
            lazyLoadingMetrics: {
              totalComponents: 0,
              loadedComponents: 0,
              failedComponents: 0,
              averageLoadTime: 0,
              viewportTriggered: 0,
              predictiveTriggered: 0,
            },
            overallScore: 0,
          },
    );

    logger.debug("Navigation timing collected", {
      ...navigationMetrics,
    });
  }, []);

  // Monitor Resource Timing
  const monitorResourceTiming = useCallback(() => {
    new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];

      const resourceMetrics: ResourceTimingMetrics[] = entries.map((entry) => ({
        name: entry.name,
        type: getResourceType(entry.initiatorType),
        duration: entry.responseEnd - entry.requestStart,
        size: (entry as ExtendedPerformanceEntry).transferSize || 0,
        cached: isResourceCached(entry),
        priority: (entry as ExtendedPerformanceEntry).priority || "auto",
      }));

      setMetrics((prev) =>
        prev
          ? {
              ...prev,
              resourceTiming: resourceMetrics,
            }
          : null,
      );

      // Record slow resources
      resourceMetrics.forEach((resource) => {
        if (resource.duration > 2000) {
          // 2 seconds
          logger.warn("Slow resource detected", {
            resource: resource.name,
            duration: resource.duration,
            type: resource.type,
          });
        }
      });
    }).observe({ entryTypes: ["resource"] });
  }, []);

  // Monitor Memory Usage
  const monitorMemoryUsage = useCallback(() => {
    if (!("memory" in performance)) return;

    const memory = (performance as any).memory;
    const memoryMetrics: MemoryUsage = {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      usagePercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };

    setMetrics((prev) =>
      prev
        ? {
            ...prev,
            memoryUsage: memoryMetrics,
          }
        : null,
    );

    // Alert on high memory usage
    if (memoryMetrics.usagePercent > 80) {
      logger.warn("High memory usage detected", {
        usagePercent: memoryMetrics.usagePercent,
        usedMB: Math.round(memoryMetrics.used / 1024 / 1024),
      });
    }
  }, []);

  // Collect bundle metrics
  const collectBundleMetrics = useCallback(() => {
    const bundleOptimizer = getBundleOptimizer();
    const perfMetrics = bundleOptimizer.getPerformanceMetrics();

    // Map performance metrics to BundleMetrics interface
    const bundleMetrics: BundleMetrics = {
      totalSize: perfMetrics.bundleSizes
        ? Object.values(perfMetrics.bundleSizes).reduce((a, b) => a + b, 0)
        : 0,
      bundleCount: perfMetrics.bundleSizes
        ? Object.keys(perfMetrics.bundleSizes).length
        : 0,
      largestBundle: perfMetrics.bundleSizes
        ? Object.entries(perfMetrics.bundleSizes).reduce(
            (largest, [name, size]) =>
              size > largest.size ? { name, size } : largest,
            { name: "", size: 0 },
          )
        : { name: "", size: 0 },
      optimizationScore: perfMetrics.optimizationScore || 0,
      recommendations: Array.isArray(perfMetrics.recommendations)
        ? perfMetrics.recommendations
        : [],
    };

    setMetrics((prev) =>
      prev
        ? {
            ...prev,
            bundleMetrics,
          }
        : null,
    );
  }, []);

  // Collect CDN metrics
  const collectCDNMetrics = useCallback(() => {
    const cdnOptimizer = getCDNOptimizer();
    const cdnMetrics = cdnOptimizer.getResourceMetrics();
    const recommendations = cdnOptimizer.getOptimizationRecommendations();

    const fullCDNMetrics: CDNMetrics = {
      ...cdnMetrics,
      recommendations,
    };

    setMetrics((prev) =>
      prev
        ? {
            ...prev,
            cdnMetrics: fullCDNMetrics,
          }
        : null,
    );
  }, []);

  // Update Core Web Vitals
  const updateCoreWebVitals = useCallback((vitals: Partial<CoreWebVitals>) => {
    setMetrics((prev) => {
      const current = prev?.coreWebVitals || {};
      const updated = { ...current, ...vitals };

      return prev
        ? {
            ...prev,
            coreWebVitals: updated,
            overallScore: calculateOverallScore(updated),
          }
        : null;
    });
  }, []);

  // Calculate overall performance score
  const calculateOverallScore = useCallback((vitals: CoreWebVitals): number => {
    let score = 100;

    // LCP scoring (good: <2.5s, poor: >4s)
    if (vitals.lcp) {
      if (vitals.lcp > 4000) score -= 30;
      else if (vitals.lcp > 2500) score -= 15;
    }

    // CLS scoring (good: <0.1, poor: >0.25)
    if (vitals.cls) {
      if (vitals.cls > 0.25) score -= 30;
      else if (vitals.cls > 0.1) score -= 15;
    }

    // INP scoring (good: <200ms, poor: >500ms)
    if (vitals.inp) {
      if (vitals.inp > 500) score -= 30;
      else if (vitals.inp > 200) score -= 15;
    }

    return Math.max(0, Math.min(100, score));
  }, []);

  // Get performance report
  const getPerformanceReport = useCallback(() => {
    if (!metrics) return null;

    const report = {
      ...metrics,
      timestamp: Date.now(),
      recommendations: [
        ...metrics.bundleMetrics.recommendations,
        ...metrics.cdnMetrics.recommendations,
      ].sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }),
    };

    return report;
  }, [metrics]);

  // Auto-start monitoring
  useEffect(() => {
    if (isFeatureEnabled(FeatureFlag.ADVANCED_METRICS)) {
      startMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    getPerformanceReport,
  };
}

/**
 * Performance Dashboard Component
 */
export function PerformanceDashboard() {
  const {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    getPerformanceReport,
  } = usePerformanceMonitor();
  const [showDetails, setShowDetails] = useState(false);

  const report = getPerformanceReport();

  if (!isFeatureEnabled(FeatureFlag.ADVANCED_METRICS)) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800">
          Performance monitoring is disabled. Enable the ADVANCED_METRICS
          feature flag to view metrics.
        </p>
      </div>
    );
  }

  return (
    <div className="performance-dashboard space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Performance Monitor
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            className={`px-4 py-2 rounded-lg font-medium ${
              isMonitoring
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
          </button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showDetails ? "Hide Details" : "Show Details"}
          </button>
        </div>
      </div>

      {/* Overall Score */}
      {metrics && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Overall Performance Score</h3>
            <div
              className={`text-3xl font-bold ${
                metrics.overallScore >= 80
                  ? "text-green-600"
                  : metrics.overallScore >= 60
                    ? "text-yellow-600"
                    : "text-red-600"
              }`}
            >
              {metrics.overallScore}/100
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${
                metrics.overallScore >= 80
                  ? "bg-green-600"
                  : metrics.overallScore >= 60
                    ? "bg-yellow-600"
                    : "bg-red-600"
              }`}
              style={{ width: `${metrics.overallScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Core Web Vitals */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="Largest Contentful Paint"
            value={
              metrics.coreWebVitals.lcp
                ? `${(metrics.coreWebVitals.lcp / 1000).toFixed(1)}s`
                : "N/A"
            }
            status={getVitalStatus(metrics.coreWebVitals.lcp, 2500, 4000)}
            description="Time until largest content element is painted"
          />

          <MetricCard
            title="Cumulative Layout Shift"
            value={
              metrics.coreWebVitals.cls
                ? metrics.coreWebVitals.cls.toFixed(3)
                : "N/A"
            }
            status={getVitalStatus(metrics.coreWebVitals.cls, 0.1, 0.25)}
            description="Sum of all layout shift scores"
          />

          <MetricCard
            title="Interaction to Next Paint"
            value={
              metrics.coreWebVitals.inp
                ? `${metrics.coreWebVitals.inp}ms`
                : "N/A"
            }
            status={getVitalStatus(metrics.coreWebVitals.inp, 200, 500)}
            description="Worst interaction latency"
          />

          <MetricCard
            title="First Input Delay"
            value={
              metrics.coreWebVitals.fid
                ? `${metrics.coreWebVitals.fid}ms`
                : "N/A"
            }
            status={getVitalStatus(metrics.coreWebVitals.fid, 100, 300)}
            description="Time until first interaction is processed"
          />

          <MetricCard
            title="Time to First Byte"
            value={
              metrics.coreWebVitals.ttfb
                ? `${metrics.coreWebVitals.ttfb}ms`
                : "N/A"
            }
            status={getVitalStatus(metrics.coreWebVitals.ttfb, 800, 1800)}
            description="Time until first byte is received"
          />

          <MetricCard
            title="Bundle Optimization Score"
            value={`${metrics.bundleMetrics.optimizationScore}/100`}
            status={
              metrics.bundleMetrics.optimizationScore >= 80
                ? "good"
                : metrics.bundleMetrics.optimizationScore >= 60
                  ? "warning"
                  : "poor"
            }
            description="Overall bundle optimization score"
          />
        </div>
      )}

      {/* Detailed Metrics */}
      {showDetails && metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bundle Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Bundle Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Total Size:</span>
                <span className="font-medium">
                  {(metrics.bundleMetrics.totalSize / 1024).toFixed(1)} KB
                </span>
              </div>
              <div className="flex justify-between">
                <span>Bundle Count:</span>
                <span className="font-medium">
                  {metrics.bundleMetrics.bundleCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Largest Bundle:</span>
                <span className="font-medium">
                  {metrics.bundleMetrics.largestBundle.name} (
                  {(metrics.bundleMetrics.largestBundle.size / 1024).toFixed(1)}{" "}
                  KB)
                </span>
              </div>
            </div>

            {metrics.bundleMetrics.recommendations.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Recommendations:</h4>
                <div className="space-y-2">
                  {metrics.bundleMetrics.recommendations
                    .slice(0, 3)
                    .map((rec, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        <span
                          className={`font-medium ${
                            rec.priority === "high"
                              ? "text-red-600"
                              : rec.priority === "medium"
                                ? "text-yellow-600"
                                : "text-green-600"
                          }`}
                        >
                          {rec.priority.toUpperCase()}:
                        </span>{" "}
                        {rec.recommendation}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* CDN Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">CDN Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Total Resources:</span>
                <span className="font-medium">
                  {metrics.cdnMetrics.totalResources}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Preloaded:</span>
                <span className="font-medium">
                  {metrics.cdnMetrics.preloadedResources}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Prefetched:</span>
                <span className="font-medium">
                  {metrics.cdnMetrics.prefetchedResources}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Strategy:</span>
                <span className="font-medium capitalize">
                  {metrics.cdnMetrics.loadingStrategy}
                </span>
              </div>
              {metrics.cdnMetrics.connectionType && (
                <div className="flex justify-between">
                  <span>Connection:</span>
                  <span className="font-medium">
                    {metrics.cdnMetrics.connectionType}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {report && report.recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Performance Recommendations
          </h3>
          <div className="space-y-3">
            {report.recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  rec.priority === "high"
                    ? "border-red-200 bg-red-50"
                    : rec.priority === "medium"
                      ? "border-yellow-200 bg-yellow-50"
                      : "border-green-200 bg-green-50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div
                      className={`font-medium ${
                        rec.priority === "high"
                          ? "text-red-900"
                          : rec.priority === "medium"
                            ? "text-yellow-900"
                            : "text-green-900"
                      }`}
                    >
                      {rec.priority.toUpperCase()} PRIORITY
                    </div>
                    <div className="text-sm mt-1">{rec.recommendation}</div>
                  </div>
                  <div className="text-sm font-medium text-gray-600 ml-4">
                    ~{rec.estimatedSavings}ms savings
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== UTILITY FUNCTIONS =====

function getResourceType(initiatorType: string): string {
  switch (initiatorType) {
    case "script":
      return "JavaScript";
    case "link":
      return "CSS";
    case "img":
      return "Image";
    case "xmlhttprequest":
    case "fetch":
      return "API";
    default:
      return initiatorType || "Unknown";
  }
}

function isResourceCached(entry: PerformanceResourceTiming): boolean {
  return (entry as ExtendedPerformanceEntry).transferSize === 0 && entry.decodedBodySize > 0;
}

function getVitalStatus(
  value: number | undefined,
  goodThreshold: number,
  poorThreshold: number,
): "good" | "warning" | "poor" {
  if (!value) return "warning";
  if (value <= goodThreshold) return "good";
  if (value <= poorThreshold) return "warning";
  return "poor";
}

interface MetricCardProps {
  title: string;
  value: string;
  status: "good" | "warning" | "poor";
  description: string;
}

function MetricCard({ title, value, status, description }: MetricCardProps) {
  const statusColors = {
    good: "text-green-600 border-green-200 bg-green-50",
    warning: "text-yellow-600 border-yellow-200 bg-yellow-50",
    poor: "text-red-600 border-red-200 bg-red-50",
  };

  return (
    <div className={`p-4 rounded-lg border ${statusColors[status]}`}>
      <div className="font-medium text-sm text-gray-600 mb-1">{title}</div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs text-gray-500">{description}</div>
    </div>
  );
}
