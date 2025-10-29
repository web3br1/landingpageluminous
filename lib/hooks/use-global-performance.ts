"use client";

import { useEffect, useState } from "react";
import {
  globalPerformanceOptimizer,
  performanceUtils,
  GeoPerformance,
  PerformanceOptimization,
  PerformanceMetrics,
} from "@/lib/performance/global-optimizer";

interface PerformanceSummary {
  totalMetrics: number;
  totalOptimizations: number;
  geoCoverage: string[];
  timeRange: {
    oldest?: number;
    newest?: number;
  };
  recentOptimizations: PerformanceOptimization[];
}

// Hook for tracking and optimizing global performance
export function useGlobalPerformance() {
  const [insights, setInsights] = useState<{
    averageMetrics: Partial<PerformanceMetrics>;
    optimizations: PerformanceOptimization[];
    recommendations: string[];
  } | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    // Start performance tracking
    if (typeof window !== "undefined" && "web-vitals" in window) {
      setIsTracking(true);

      // Import web-vitals dynamically
      import("web-vitals")
        .then((webVitals: any) => {
          // Note: These methods may not be available in all browsers or versions
          const safeGetLCP = webVitals.getLCP || (() => Promise.resolve());
          const safeGetFID = webVitals.getFID || (() => Promise.resolve());
          const safeGetCLS = webVitals.getCLS || (() => Promise.resolve());
          const safeGetFCP = webVitals.getFCP || (() => Promise.resolve());
          const safeGetTTFB = webVitals.getTTFB || (() => Promise.resolve());

          // Track metrics (simplified - just log for now)
          const trackMetric = (name: string, value: any) => {
            console.log(`Performance metric ${name}:`, value);
            // Could send to analytics service here
          };

          safeGetLCP((metric: any) => trackMetric("lcp", metric.value));
          safeGetFID((metric: any) => trackMetric("fid", metric.value));
          safeGetCLS((metric: any) => trackMetric("cls", metric.value));
          safeGetFCP((metric: any) => trackMetric("fcp", metric.value));
          safeGetTTFB((metric: any) => trackMetric("ttfb", metric.value));
        })
        .catch((err: any) => {
          console.warn("Web vitals tracking not available:", err);
        });
    }

    // Get initial insights
    updateInsights();

    // Update insights periodically
    const interval = setInterval(updateInsights, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const updateInsights = () => {
    const geoCookie = document?.cookie
      ?.split("; ")
      ?.find((row) => row.startsWith("user_geo="))
      ?.split("=")[1];

    const country = geoCookie ? geoCookie.split(":")[0] : undefined;
    const newInsights = globalPerformanceOptimizer.getGeoInsights(country, 1); // Last hour
    setInsights(newInsights);
  };

  const getRecommendations = () => {
    return performanceUtils.getPersonalizedRecommendations();
  };

  return {
    insights,
    isTracking,
    recommendations: getRecommendations(),
    refreshInsights: updateInsights,
  };
}

// Hook for performance monitoring dashboard
export function usePerformanceDashboard() {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [exportData, setExportData] = useState<{
    metrics: GeoPerformance[];
    optimizations: PerformanceOptimization[];
    summary: PerformanceSummary;
  } | null>(null);

  useEffect(() => {
    updateDashboard();
  }, []);

  const updateDashboard = () => {
    setSummary(globalPerformanceOptimizer.getGlobalSummary());
  };

  const exportDataForAnalysis = () => {
    const data = performanceUtils.exportPerformanceData();
    setExportData(data);
    return data;
  };

  const cleanupOldData = (hours = 168) => {
    // 1 week
    globalPerformanceOptimizer.cleanup(hours);
    updateDashboard();
  };

  return {
    summary,
    exportData,
    exportDataForAnalysis,
    cleanupOldData,
    refresh: updateDashboard,
  };
}

// Hook for real-time performance alerts
export function usePerformanceAlerts(
  thresholds = {
    lcp: 2500,
    cls: 0.1,
    fid: 100,
  },
) {
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    const checkPerformance = () => {
      const insights = globalPerformanceOptimizer.getGeoInsights(undefined, 1); // Last hour
      const newAlerts: string[] = [];

      if ((insights.averageMetrics.lcp || 0) > thresholds.lcp) {
        newAlerts.push(
          `LCP is too high: ${insights.averageMetrics.lcp || 0}ms`,
        );
      }

      if ((insights.averageMetrics.cls || 0) > thresholds.cls) {
        newAlerts.push(`CLS is too high: ${insights.averageMetrics.cls}`);
      }

      if ((insights.averageMetrics.fid || 0) > thresholds.fid) {
        newAlerts.push(
          `FID is too high: ${insights.averageMetrics.fid || 0}ms`,
        );
      }

      setAlerts(newAlerts);
    };

    checkPerformance();
    const interval = setInterval(checkPerformance, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [thresholds]);

  return alerts;
}

// Utility hook for performance-optimized rendering
export function usePerformanceOptimizedRender() {
  const [shouldRender, setShouldRender] = useState(false);
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");

  useEffect(() => {
    // SSR safety: only run on client-side
    if (typeof window === "undefined" || typeof navigator === "undefined")
      return;

    // Check connection type for rendering optimization
    const connection = (navigator as any).connection;
    if (connection) {
      if (
        connection.effectiveType === "slow-2g" ||
        connection.effectiveType === "2g"
      ) {
        setPriority("low");
      } else if (connection.effectiveType === "3g") {
        setPriority("medium");
      } else {
        setPriority("high");
      }
    }

    // Check if user is active (for rendering decisions)
    let timeoutId: NodeJS.Timeout;
    const handleActivity = () => {
      setShouldRender(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setShouldRender(false), 5000); // Stop rendering after 5s of inactivity
    };

    // Initial render
    setShouldRender(true);

    // Listen for user activity
    window.addEventListener("mousedown", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("scroll", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("mousedown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
    };
  }, []);

  return {
    shouldRender,
    priority,
    // Utility to conditionally render based on priority
    renderIf: (minPriority: "high" | "medium" | "low") => {
      const priorities = { high: 3, medium: 2, low: 1 };
      return priorities[priority] >= priorities[minPriority] && shouldRender;
    },
  };
}
