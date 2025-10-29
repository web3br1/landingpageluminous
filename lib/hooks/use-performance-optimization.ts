"use client";

import { useEffect, useCallback, useState } from "react";

// Performance budgets (aligned with Core Web Vitals)
export const PERFORMANCE_BUDGETS = {
  LCP: 2500, // ms
  FID: 100, // ms
  CLS: 0.1, // score
  FCP: 1800, // ms
  TTFB: 800, // ms
  bundleSize: 200 * 1024, // 200KB
  sectionLoadTime: 500, // ms per section
} as const;

interface PerformanceMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
  bundleSize?: number;
  sectionLoadTimes: Record<string, number>;
}

interface PerformanceOptimizationConfig {
  enablePreloading: boolean;
  enableBundleAnalysis: boolean;
  enableSectionMonitoring: boolean;
  maxConcurrentLoads: number;
}

const defaultConfig: PerformanceOptimizationConfig = {
  enablePreloading: true,
  enableBundleAnalysis: false,
  enableSectionMonitoring: true,
  maxConcurrentLoads: 2,
};

export function usePerformanceOptimization(
  config: Partial<PerformanceOptimizationConfig> = {},
) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    sectionLoadTimes: {},
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const finalConfig = { ...defaultConfig, ...config };

  // Preload critical resources
  const preloadCriticalResources = useCallback(() => {
    if (!finalConfig.enablePreloading) return;

    // Note: Font preloading removed to avoid CSP issues
    // Fonts are handled by Next.js font optimization and @next/font
    // which provides better performance and compatibility

    // Preload critical images
    const criticalImages = ["/images/logo.svg"];

    criticalImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [finalConfig.enablePreloading]);

  // Monitor Core Web Vitals
  const monitorCoreWebVitals = useCallback(() => {
    if (typeof window === "undefined") return;

    // Use web-vitals library if available
    import("web-vitals")
      .then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
        onCLS((metric) => {
          setMetrics((prev) => ({ ...prev, cls: metric.value }));
          checkPerformanceBudget("CLS", metric.value);
        });

        onFCP((metric) => {
          setMetrics((prev) => ({ ...prev, fcp: metric.value }));
          checkPerformanceBudget("FCP", metric.value);
        });

        onINP((metric) => {
          setMetrics((prev) => ({ ...prev, fid: metric.value })); // INP replaces FID
          checkPerformanceBudget("FID", metric.value);
        });

        onLCP((metric) => {
          setMetrics((prev) => ({ ...prev, lcp: metric.value }));
          checkPerformanceBudget("LCP", metric.value);
        });

        onTTFB((metric) => {
          setMetrics((prev) => ({ ...prev, ttfb: metric.value }));
          checkPerformanceBudget("TTFB", metric.value);
        });
      })
      .catch(() => {
        // Fallback: manual measurement
        console.warn(
          "web-vitals library not available, using manual measurement",
        );
      });
  }, []);

  // Check performance budgets
  const checkPerformanceBudget = useCallback(
    (metric: keyof typeof PERFORMANCE_BUDGETS, value: number) => {
      const budget = PERFORMANCE_BUDGETS[metric];
      if (budget && value > budget) {
        console.warn(
          `⚠️ Performance budget exceeded: ${metric} = ${value}ms (budget: ${budget}ms)`,
        );

        // Send to monitoring if available
        if (typeof window !== "undefined" && (window as any).gtag) {
          (window as any).gtag("event", "performance_budget_exceeded", {
            metric,
            value,
            budget,
            page_location: window.location.href,
          });
        }
      }
    },
    [],
  );

  // Monitor section loading times
  const monitorSectionLoad = useCallback(
    (sectionId: string, loadTime: number) => {
      if (!finalConfig.enableSectionMonitoring) return;

      setMetrics((prev) => ({
        ...prev,
        sectionLoadTimes: {
          ...prev.sectionLoadTimes,
          [sectionId]: loadTime,
        },
      }));

      // Check section loading budget
      if (loadTime > PERFORMANCE_BUDGETS.sectionLoadTime) {
        console.warn(
          `⚠️ Section ${sectionId} load time exceeded budget: ${loadTime}ms (budget: ${PERFORMANCE_BUDGETS.sectionLoadTime}ms)`,
        );
      }
    },
    [finalConfig.enableSectionMonitoring],
  );

  // Bundle analysis
  const analyzeBundle = useCallback(() => {
    if (!finalConfig.enableBundleAnalysis || typeof window === "undefined")
      return;

    // Analyze bundle sizes (this would be enhanced with actual bundle analysis)
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];

      entries.forEach((entry) => {
        if (entry.name.includes(".js") && entry.transferSize > 0) {
          const bundleSize = entry.transferSize;
          setMetrics((prev) => ({ ...prev, bundleSize }));

          if (bundleSize > PERFORMANCE_BUDGETS.bundleSize) {
            console.warn(
              `⚠️ Bundle size exceeded budget: ${(bundleSize / 1024).toFixed(1)}KB (budget: ${(PERFORMANCE_BUDGETS.bundleSize / 1024).toFixed(1)}KB)`,
            );
          }
        }
      });
    });

    observer.observe({ entryTypes: ["resource"] });

    return () => observer.disconnect();
  }, [finalConfig.enableBundleAnalysis]);

  // Resource hints manager
  const addResourceHint = useCallback(
    (
      href: string,
      as: "script" | "style" | "font" | "image",
      rel: "preload" | "prefetch" = "preload",
    ) => {
      if (typeof document === "undefined") return;

      // Check if hint already exists
      const existing = document.querySelector(`link[href="${href}"]`);
      if (existing) return;

      const link = document.createElement("link");
      link.rel = rel;
      link.href = href;
      link.as = as;
      if (as === "font") {
        link.crossOrigin = "anonymous";
      }

      document.head.appendChild(link);
    },
    [],
  );

  // Initialize performance monitoring
  useEffect(() => {
    preloadCriticalResources();
    monitorCoreWebVitals();

    const cleanup = analyzeBundle();

    setIsLoaded(true);

    return cleanup;
  }, [preloadCriticalResources, monitorCoreWebVitals, analyzeBundle]);

  return {
    metrics,
    isLoaded,
    monitorSectionLoad,
    addResourceHint,
    checkPerformanceBudget,
    preloadCriticalResources,
  };
}

// Hook for lazy loading with performance monitoring
export function useLazySection(
  sectionId: string,
  priority: "high" | "medium" | "low" = "medium",
) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadTime, setLoadTime] = useState<number | null>(null);

  const { monitorSectionLoad } = usePerformanceOptimization({
    enableSectionMonitoring: true,
    enablePreloading: priority === "high",
  });

  useEffect(() => {
    if (!isVisible) return;

    const startTime = performance.now();

    // Simulate loading (replace with actual loading logic)
    const loadSection = async () => {
      try {
        // Your section loading logic here
        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 200 + 100),
        );

        const endTime = performance.now();
        const time = endTime - startTime;
        setLoadTime(time);
        setIsLoaded(true);

        monitorSectionLoad(sectionId, time);
      } catch (error) {
        console.error(`Failed to load section ${sectionId}:`, error);
      }
    };

    loadSection();
  }, [isVisible, sectionId, monitorSectionLoad]);

  const triggerLoad = useCallback(() => {
    setIsVisible(true);
  }, []);

  return {
    isVisible,
    isLoaded,
    loadTime,
    triggerLoad,
  };
}

// Bundle size monitoring hook
export function useBundleSizeMonitoring() {
  const [bundleSizes, setBundleSizes] = useState<Record<string, number>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];

      const sizes: Record<string, number> = {};

      entries.forEach((entry) => {
        if (entry.name.includes(".js") && entry.transferSize > 0) {
          const bundleName =
            entry.name.split("/").pop()?.split(".")[0] || "unknown";
          sizes[bundleName] = entry.transferSize;
        }
      });

      setBundleSizes(sizes);

      // Log bundle sizes in development
      if (process.env.NODE_ENV === "development") {
        console.table(sizes);
      }
    });

    observer.observe({ entryTypes: ["resource"] });

    return () => observer.disconnect();
  }, []);

  return bundleSizes;
}
