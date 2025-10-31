import React, { useEffect, useCallback, useRef } from "react";
import { cacheManager } from "./cache-manager";
import { ImageCache } from "./image-optimization";
import {
  safeWindowAccess,
  safeDocumentAccess,
  safeNavigatorAccess,
} from "@/lib/utils/browser-api-helpers";

// Comprehensive performance optimization hook
// Combines caching, preloading, and monitoring strategies

interface PerformanceOptimizationConfig {
  enableCacheMonitoring?: boolean;
  enableResourcePreloading?: boolean;
  enablePerformanceTracking?: boolean;
  cacheStrategy?: "aggressive" | "conservative" | "balanced";
  preloadCritical?: boolean;
  trackInteractions?: boolean;
}

const defaultConfig: PerformanceOptimizationConfig = {
  enableCacheMonitoring: true,
  enableResourcePreloading: true,
  enablePerformanceTracking: true,
  cacheStrategy: "balanced",
  preloadCritical: true,
  trackInteractions: true,
};

export function usePerformanceOptimization(
  config: Partial<PerformanceOptimizationConfig> = {},
) {
  const finalConfig = { ...defaultConfig, ...config };
  const interactionObserverRef = useRef<PerformanceObserver | null>(null);
  const longTaskObserverRef = useRef<PerformanceObserver | null>(null);

  // Cache monitoring
  const monitorCache = useCallback(() => {
    if (!finalConfig.enableCacheMonitoring) return;

    // Monitor cache hit rates and performance
    const checkCacheStats = () => {
      const stats = cacheManager.getCacheStats();
      const imageCacheStats = { hits: 0, misses: 0 }; // ImageCache.getStats not implemented

      // Log cache performance for monitoring
      console.log("Cache Performance:", {
        cacheManager: stats,
        imageCache: imageCacheStats,
        timestamp: Date.now(),
      });

      // Clean up expired entries periodically
      // Cache cleanup for aggressive strategy
      if (finalConfig.cacheStrategy === "aggressive") {
        // Clear expired entries logic would go here
      }
    };

    // Check stats every 30 seconds
    const interval = setInterval(checkCacheStats, 30000);
    return () => clearInterval(interval);
  }, [finalConfig.enableCacheMonitoring, finalConfig.cacheStrategy]);

  // Resource preloading
  const preloadResources = useCallback(
    async (
      resources: Array<{
        url: string;
        type: "image" | "font" | "script";
        priority: "critical" | "high" | "medium" | "low";
      }>,
    ) => {
      if (!finalConfig.enableResourcePreloading) return;

      const promises = resources.map((resource) =>
        cacheManager.preloadResource(resource).catch((error) => {
          console.warn(
            `Failed to preload ${resource.type}: ${resource.url}`,
            error,
          );
        }),
      );

      await Promise.allSettled(promises);
    },
    [finalConfig.enableResourcePreloading],
  );

  // Performance tracking
  const trackPerformance = useCallback(() => {
    if (!finalConfig.enablePerformanceTracking || typeof window === "undefined")
      return;

    // Track Core Web Vitals
    const trackWebVitals = async () => {
      try {
        const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import(
          "web-vitals"
        );

        const sendToAnalytics = (params: unknown) => {
          const { name, delta, value, id } = params as any;
          // Send to analytics service
          if (typeof window !== "undefined" && (window as any).gtag) {
            (window as any).gtag("event", name, {
              event_category: "Web Vitals",
              event_label: id,
              value: Math.round(name === "CLS" ? value * 1000 : value),
              custom_map: { metric_value: value },
            });
          }

          // Store locally for debugging (client-side only)
          if (typeof localStorage !== "undefined") {
            const vitals = JSON.parse(
              localStorage.getItem("web-vitals") || "{}",
            );
            vitals[name] = { value, delta, timestamp: Date.now() };
            localStorage.setItem("web-vitals", JSON.stringify(vitals));
          }
        };

        onCLS(sendToAnalytics);
        onFCP(sendToAnalytics);
        onLCP(sendToAnalytics);
        onTTFB(sendToAnalytics);
        onINP(sendToAnalytics);
      } catch (error) {
        console.warn("Failed to load web-vitals:", error);
      }
    };

    trackWebVitals();
  }, [finalConfig.enablePerformanceTracking]);

  // Interaction tracking
  const trackInteractions = useCallback(() => {
    if (!finalConfig.trackInteractions || typeof window === "undefined") return;

    // Track user interactions for performance insights
    const trackInteraction = (entry: PerformanceEventTiming) => {
      // Log slow interactions (> 100ms)
      if (entry.duration > 100) {
        console.log("Slow interaction detected:", {
          type: entry.name,
          duration: entry.duration,
          startTime: entry.startTime,
        });

        // Send to analytics
        if (typeof window !== "undefined" && (window as any).gtag) {
          (window as any).gtag("event", "slow_interaction", {
            event_category: "Performance",
            event_label: entry.name,
            value: Math.round(entry.duration),
          });
        }
      }
    };

    try {
      if ("PerformanceObserver" in window) {
        interactionObserverRef.current = new PerformanceObserver((list) => {
          list
            .getEntries()
            .forEach((entry) =>
              trackInteraction(entry as PerformanceEventTiming),
            );
        });

        interactionObserverRef.current.observe({ entryTypes: ["event"] });
      }
    } catch (error) {
      console.warn("Failed to track interactions:", error);
    }

    return () => {
      interactionObserverRef.current?.disconnect();
    };
  }, [finalConfig.trackInteractions]);

  // Long task monitoring
  const monitorLongTasks = useCallback(() => {
    if (!finalConfig.enablePerformanceTracking || typeof window === "undefined")
      return;

    try {
      if ("PerformanceObserver" in window) {
        longTaskObserverRef.current = new PerformanceObserver((list) => {
          const entries = list.getEntries();

          entries.forEach((entry: unknown) => {
            if ((entry as any).duration > 50) {
              // Long task threshold
              console.log("Long task detected:", {
                duration: (entry as any).duration,
                startTime: (entry as any).startTime,
                attribution: (entry as any).attribution,
              });

              // Send to analytics
              if (typeof window !== "undefined" && (window as any).gtag) {
                (window as any).gtag("event", "long_task", {
                  event_category: "Performance",
                  event_label: "long_task",
                  value: Math.round((entry as any).duration),
                });
              }
            }
          });
        });

        longTaskObserverRef.current.observe({ entryTypes: ["longtask"] });
      }
    } catch (error) {
      console.warn("Failed to monitor long tasks:", error);
    }

    return () => {
      longTaskObserverRef.current?.disconnect();
    };
  }, [finalConfig.enablePerformanceTracking]);

  // Critical resource preloading
  const preloadCriticalResources = useCallback(() => {
    if (!finalConfig.preloadCritical) return;

    // Preload critical resources based on current page
    const criticalResources = [
      // Images
      {
        url: "/images/hero-bg.webp",
        type: "image" as const,
        priority: "critical" as const,
      },
      {
        url: "/images/logo.svg",
        type: "image" as const,
        priority: "critical" as const,
      },
    ];

    preloadResources(criticalResources);
  }, [finalConfig.preloadCritical, preloadResources]);

  // Initialize all optimizations
  useEffect(() => {
    const cleanupFunctions: (() => void)[] = [];

    // Start monitoring
    const cacheCleanup = monitorCache();
    const interactionCleanup = trackInteractions();
    const longTaskCleanup = monitorLongTasks();

    if (cacheCleanup) cleanupFunctions.push(cacheCleanup);
    if (interactionCleanup) cleanupFunctions.push(interactionCleanup);
    if (longTaskCleanup) cleanupFunctions.push(longTaskCleanup);

    // Start tracking
    trackPerformance();

    // Preload critical resources
    preloadCriticalResources();

    // Cleanup on unmount
    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup?.());
    };
  }, [
    monitorCache,
    trackInteractions,
    monitorLongTasks,
    trackPerformance,
    preloadCriticalResources,
  ]);

  // Return optimization API
  return {
    // Cache management
    getCacheStats: cacheManager.getCacheStats.bind(cacheManager),
    clearCache: cacheManager.clearCache.bind(cacheManager),

    // Image cache management
    getImageCacheStats: () => ({ hits: 0, misses: 0 }),

    // Resource preloading
    preloadResources,

    // Performance utilities
    measurePageLoad: () => {
      if (typeof window === "undefined") return null;
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      return navigation
        ? navigation.loadEventEnd - navigation.fetchStart
        : null;
    },

    // Web vitals getter
    getWebVitals: () => {
      try {
        if (typeof localStorage !== "undefined") {
          return JSON.parse(localStorage.getItem("web-vitals") || "{}");
        }
        return {};
      } catch {
        return {};
      }
    },
  };
}

// Hook for lazy loading optimization
export function useLazyOptimization() {
  const [isVisible, setIsVisible] = React.useState(false);
  const elementRef = useRef<Element | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "50px",
        threshold: 0.1,
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return { isVisible, elementRef };
}

// Utility for determining optimal loading strategy
export function getOptimalLoadingStrategy(
  priority: "critical" | "high" | "medium" | "low",
  viewportPosition: "above-fold" | "below-fold" | "unknown" = "unknown",
) {
  if (priority === "critical" || viewportPosition === "above-fold") {
    return "eager";
  }

  if (priority === "high") {
    return "viewport";
  }

  return "lazy";
}

// Utility for determining optimal image quality
export function getOptimalImageQuality(
  priority: "critical" | "high" | "medium" | "low",
  connectionSpeed: "slow" | "fast" | "unknown" = "unknown",
) {
  // Adjust quality based on connection speed
  const speedMultiplier =
    connectionSpeed === "slow" ? 0.8 : connectionSpeed === "fast" ? 1.0 : 0.9;

  const baseQualities = {
    critical: 95,
    high: 90,
    medium: 85,
    low: 80,
  };

  return Math.round(baseQualities[priority] * speedMultiplier);
}
