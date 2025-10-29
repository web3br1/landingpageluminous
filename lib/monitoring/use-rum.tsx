"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { realUserMonitoring, trackRUMEvent } from "./real-user-monitoring";

interface UseRUMOptions {
  trackPageViews?: boolean;
  trackPerformance?: boolean;
  trackPerformanceMetrics?: boolean;
  customMetrics?: string[];
  enableAlerts?: boolean;
}

interface RUMHookReturn {
  session: any;
  alerts: any[];
  trackEvent: (type: string, data: Record<string, any>) => void;
  trackPerformance: (
    metric: string,
    value: number,
    context?: Record<string, any>,
  ) => void;
  getSessionMetrics: () => any;
  forceFlush: () => Promise<void>;
}

export function useRUM(options: UseRUMOptions = {}): RUMHookReturn {
  const {
    trackPageViews = true,
    trackPerformanceMetrics = true,
    customMetrics = [],
    enableAlerts = true,
  } = options;

  const [session, setSession] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Update session and alerts periodically - only on client
  useEffect(() => {
    // Only initialize if realUserMonitoring is available (client-side)
    if (!realUserMonitoring) return;

    const updateData = () => {
      try {
        if (realUserMonitoring) {
          const newSession = realUserMonitoring.getCurrentSession();
          const newAlerts = realUserMonitoring.getAlerts();

          // Only update state if values actually changed to prevent unnecessary re-renders
          setSession((currentSession: any) => {
            if (JSON.stringify(currentSession) !== JSON.stringify(newSession)) {
              return newSession;
            }
            return currentSession;
          });

          setAlerts((currentAlerts) => {
            if (JSON.stringify(currentAlerts) !== JSON.stringify(newAlerts)) {
              return newAlerts;
            }
            return currentAlerts;
          });
        }
      } catch (error) {
        console.warn("[useRUM] Failed to update session data:", error);
      }
    };

    updateData();
    const interval = setInterval(updateData, 30000); // Update every 30 seconds instead of 10

    return () => clearInterval(interval);
  }, []);

  // Track page views - only on client
  useEffect(() => {
    if (trackPageViews && typeof window !== "undefined" && realUserMonitoring) {
      const handlePageView = () => {
        try {
          if (realUserMonitoring) {
            realUserMonitoring.trackPageView(
              window.location.href,
              document.referrer,
            );
          }
        } catch (error) {
          console.warn("[useRUM] Failed to track page view:", error);
        }
      };

      // Track initial page view
      handlePageView();

      // Track navigation changes (for SPAs)
      const handleNavigation = () => {
        setTimeout(handlePageView, 100); // Small delay for navigation to complete
      };

      window.addEventListener("popstate", handleNavigation);
      // Listen for custom navigation events if using a router

      return () => {
        window.removeEventListener("popstate", handleNavigation);
      };
    }
  }, [trackPageViews]);

  // Track performance metrics - only on client
  useEffect(() => {
    if (
      trackPerformanceMetrics &&
      typeof window !== "undefined" &&
      "PerformanceObserver" in window &&
      realUserMonitoring
    ) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          trackRUMEvent("performance_metric", {
            name: entry.name,
            type: entry.entryType,
            value: "duration" in entry ? entry.duration : 0,
            startTime: entry.startTime,
            size:
              "transferSize" in entry ? (entry as any).transferSize : undefined,
          });
        });
      });

      observer.observe({
        entryTypes: [
          "resource",
          "navigation",
          "paint",
          "largest-contentful-paint",
          "layout-shift",
          "first-input",
        ],
      });

      return () => observer.disconnect();
    }
  }, [trackPerformanceMetrics]);

  // Track custom metrics
  useEffect(() => {
    customMetrics.forEach((metric) => {
      // This would be customized based on the metric type
      // For example, tracking specific business metrics
      trackRUMEvent("custom_metric_init", { metric });
    });
  }, [customMetrics]);

  const trackEvent = useCallback((type: string, data: Record<string, any>) => {
    trackRUMEvent(type, data);
  }, []);

  const trackPerformance = useCallback(
    (metric: string, value: number, context?: Record<string, any>) => {
      trackRUMEvent("performance", {
        metric,
        value,
        timestamp: Date.now(),
        ...context,
      });
    },
    [],
  );

  const getSessionMetrics = useCallback(() => {
    if (!realUserMonitoring) return null;

    const currentSession = realUserMonitoring.getCurrentSession();
    if (!currentSession) return null;

    const duration = currentSession.endTime
      ? currentSession.endTime - currentSession.startTime
      : Date.now() - currentSession.startTime;

    return {
      sessionId: currentSession.sessionId,
      duration,
      pageViews: currentSession.pageViews.length,
      interactions: currentSession.interactions.length,
      errors: currentSession.errors.length,
      scrollDepth: Math.max(
        ...currentSession.pageViews.map((pv) => pv.scrollDepth || 0),
      ),
      device: currentSession.device,
      customMetrics: currentSession.customMetrics,
    };
  }, []);

  const forceFlush = useCallback(async () => {
    if (realUserMonitoring) {
      await realUserMonitoring.forceFlush();
    }
  }, []);

  return {
    session,
    alerts,
    trackEvent,
    trackPerformance,
    getSessionMetrics,
    forceFlush,
  };
}

// Hook for tracking user frustration signals
export function useFrustrationTracking(
  trackEvent?: (type: string, data: Record<string, any>) => void,
) {
  // Use provided trackEvent or fallback to useRUM
  const rumTrackEvent = trackEvent || useRUM().trackEvent;

  useEffect(() => {
    let lastClickTime = 0;
    let clickCount = 0;
    let scrollTimeouts: NodeJS.Timeout[] = [];

    const handleClick = (event: MouseEvent) => {
      const now = Date.now();
      const timeSinceLastClick = now - lastClickTime;

      // Rage clicking detection
      if (timeSinceLastClick < 1000) {
        clickCount++;
        if (clickCount >= 3) {
          rumTrackEvent("frustration", {
            type: "rage_clicking",
            clickCount,
            timeWindow: timeSinceLastClick,
            element: (event.target as HTMLElement)?.tagName,
            position: { x: event.clientX, y: event.clientY },
          });
        }
      } else {
        clickCount = 1;
      }

      lastClickTime = now;
    };

    const handleScroll = () => {
      // Clear existing timeouts
      scrollTimeouts.forEach(clearTimeout);
      scrollTimeouts = [];

      // Detect erratic scrolling (potential frustration)
      const scrollCount = 0;
      const erraticScrollTimeout = setTimeout(() => {
        if (scrollCount > 10) {
          rumTrackEvent("frustration", {
            type: "erratic_scrolling",
            scrollCount,
            timeWindow: 2000,
          });
        }
      }, 2000);

      scrollTimeouts.push(erraticScrollTimeout);
    };

    // Detect slow loading frustration
    const loadingTimeout = setTimeout(() => {
      if (document.readyState !== "complete") {
        rumTrackEvent("frustration", {
          type: "slow_loading",
          loadTime: performance.now(),
          readyState: document.readyState,
        });
      }
    }, 5000);

    document.addEventListener("click", handleClick, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(loadingTimeout);
      scrollTimeouts.forEach(clearTimeout);
    };
  }, [rumTrackEvent]);

  return {
    trackFrustration: (type: string, details: Record<string, any>) => {
      rumTrackEvent("frustration", { type, ...details });
    },
  };
}

// Hook for tracking business metrics
export function useBusinessMetrics() {
  const { trackEvent } = useRUM();

  const trackRevenue = useCallback(
    (amount: number, currency: string = "BRL", source?: string) => {
      trackEvent("business", {
        type: "revenue",
        amount,
        currency,
        source,
        timestamp: Date.now(),
      });
    },
    [trackEvent],
  );

  const trackConversion = useCallback(
    (type: string, value?: number, metadata?: Record<string, any>) => {
      trackEvent("business", {
        type: "conversion",
        conversionType: type,
        value,
        metadata,
        timestamp: Date.now(),
      });
    },
    [trackEvent],
  );

  const trackGoal = useCallback(
    (goalName: string, properties?: Record<string, any>) => {
      trackEvent("business", {
        type: "goal",
        goalName,
        properties,
        timestamp: Date.now(),
      });
    },
    [trackEvent],
  );

  return {
    trackRevenue,
    trackConversion,
    trackGoal,
  };
}

// Hook for real-time performance monitoring
export function usePerformanceMonitoring(
  trackEvent?: (type: string, data: Record<string, any>) => void,
  thresholds: {
    lcp?: number;
    fid?: number;
    cls?: number;
    inp?: number;
  } = {},
) {
  // Use provided trackEvent or fallback to useRUM
  const rumTrackEvent = trackEvent || useRUM().trackEvent;

  // Create trackPerformance function that uses rumTrackEvent
  const trackPerformance = useCallback(
    (metric: string, value: number, context?: Record<string, any>) => {
      rumTrackEvent("performance", {
        metric,
        value,
        timestamp: Date.now(),
        ...context,
      });
    },
    [rumTrackEvent],
  );

  const [violations, setViolations] = useState<
    Array<{
      metric: string;
      value: number;
      threshold: number;
      timestamp: number;
    }>
  >([]);

  // Memoize thresholds to prevent unnecessary effect re-runs
  const memoizedThresholds = useMemo(
    () => thresholds,
    [thresholds.lcp, thresholds.fid, thresholds.cls, thresholds.inp],
  );

  // Refs for batching updates
  const pendingViolationsRef = useRef<
    Array<{
      metric: string;
      value: number;
      threshold: number;
      timestamp: number;
    }>
  >([]);
  const batchUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create stable batch update function
  const batchUpdateViolations = useCallback(() => {
    if (
      pendingViolationsRef.current &&
      pendingViolationsRef.current.length > 0
    ) {
      setViolations((prev) => [
        ...prev.slice(-(10 - pendingViolationsRef.current.length)),
        ...pendingViolationsRef.current,
      ]);
      pendingViolationsRef.current = [];
    }
  }, []);

  useEffect(() => {
    if (!("PerformanceObserver" in window)) return;

    // Supported entry types - check compatibility before observing
    const supportedEntryTypes = [
      "largest-contentful-paint",
      "layout-shift",
      "first-input",
    ];
    const entryTypesToObserve: string[] = [];

    // Check which entry types are supported
    supportedEntryTypes.forEach((entryType) => {
      try {
        // Test if the entry type is supported by attempting to create an observer
        const testObserver = new PerformanceObserver(() => {});
        testObserver.observe({ entryTypes: [entryType] });
        testObserver.disconnect();
        entryTypesToObserve.push(entryType);
      } catch (error) {
        console.warn(
          `Performance entry type '${entryType}' not supported, skipping`,
        );
      }
    });

    // Only create observer if we have supported entry types
    if (entryTypesToObserve.length === 0) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry) => {
        let metricName = "";
        let value = 0;
        let threshold = 0;

        switch (entry.entryType) {
          case "largest-contentful-paint":
            metricName = "LCP";
            value = entry.startTime;
            threshold = memoizedThresholds.lcp || 2500;
            break;
          case "first-input":
            metricName = "FID";
            value = (entry as any).processingStart - entry.startTime;
            threshold = memoizedThresholds.fid || 100;
            break;
          case "layout-shift":
            metricName = "CLS";
            value = (entry as any).value;
            threshold = memoizedThresholds.cls || 0.1;
            break;
        }

        if (metricName && value > threshold) {
          const violation = {
            metric: metricName,
            value,
            threshold,
            timestamp: Date.now(),
          };

          // Add to pending violations
          pendingViolationsRef.current.push(violation);

          // Track immediately (non-state update)
          rumTrackEvent("performance", {
            metric: `violation_${metricName}`,
            value,
            threshold,
            exceededBy: value - threshold,
          });

          // Batch state update to prevent excessive re-renders
          if (batchUpdateTimeoutRef.current) {
            clearTimeout(batchUpdateTimeoutRef.current);
          }
          batchUpdateTimeoutRef.current = setTimeout(
            batchUpdateViolations,
            100,
          ); // Batch updates every 100ms
        }
      });
    });

    observer.observe({ entryTypes: entryTypesToObserve });

    return () => {
      observer.disconnect();
      if (batchUpdateTimeoutRef.current) {
        clearTimeout(batchUpdateTimeoutRef.current);
        batchUpdateViolations(); // Ensure any pending updates are applied
      }
    };
  }, [memoizedThresholds, trackPerformance]);

  return {
    violations,
    hasViolations: violations.length > 0,
    clearViolations: () => setViolations([]),
  };
}
