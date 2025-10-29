// Performance Monitoring Utilities
// Safe browser API access with SSR protection

import { logger } from "@/lib/logger";

// Type-safe performance monitoring
export class PerformanceMonitor {
  private static observers: Map<string, PerformanceObserver> = new Map();
  private static metrics: Map<string, any> = new Map();

  // Safe browser check
  private static isBrowser(): boolean {
    return typeof window !== "undefined" && typeof performance !== "undefined";
  }

  // Initialize Core Web Vitals monitoring
  static initCoreWebVitals(): void {
    if (!this.isBrowser()) return;

    try {
      // LCP Observer
      if ("PerformanceObserver" in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          if (lastEntry) {
            this.metrics.set("lcp", lastEntry.startTime);
            logger.debug("LCP recorded", { value: lastEntry.startTime });
          }
        });
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
        this.observers.set("lcp", lcpObserver);

        // CLS Observer
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          this.metrics.set("cls", clsValue);
          logger.debug("CLS recorded", { value: clsValue });
        });
        clsObserver.observe({ entryTypes: ["layout-shift"] });
        this.observers.set("cls", clsObserver);

        // FID Observer
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            const fid = entry.processingStart - entry.startTime;
            this.metrics.set("fid", fid);
            logger.debug("FID recorded", { value: fid });
          }
        });
        fidObserver.observe({ entryTypes: ["first-input"] });
        this.observers.set("fid", fidObserver);

        // FCP Observer
        const fcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            this.metrics.set("fcp", entry.startTime);
            logger.debug("FCP recorded", { value: entry.startTime });
          }
        });
        fcpObserver.observe({ entryTypes: ["paint"] });
        this.observers.set("fcp", fcpObserver);
      }
    } catch (error) {
      logger.warn("Failed to initialize Core Web Vitals observers", { error });
    }
  }

  // Get Core Web Vitals metrics
  static getCoreWebVitals(): {
    lcp?: number;
    cls?: number;
    fid?: number;
    fcp?: number;
  } {
    if (!this.isBrowser()) {
      return {};
    }

    return {
      lcp: this.metrics.get("lcp"),
      cls: this.metrics.get("cls"),
      fid: this.metrics.get("fid"),
      fcp: this.metrics.get("fcp"),
    };
  }

  // Measure page load time safely
  static measurePageLoad(): number | null {
    if (!this.isBrowser()) return null;

    try {
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        return navigation.loadEventEnd - navigation.fetchStart;
      }
    } catch (error) {
      logger.warn("Failed to measure page load", { error });
    }

    return null;
  }

  // Check for long tasks
  static getLongTasks(): PerformanceEntry[] {
    if (!this.isBrowser()) return [];

    try {
      const observer = new PerformanceObserver((list) => {
        // Store long tasks for later retrieval
        const longTasks = list
          .getEntries()
          .filter((entry) => entry.duration > 50);
        this.metrics.set("longTasks", longTasks);
      });

      observer.observe({ entryTypes: ["longtask"] });

      // Return any previously recorded long tasks
      return this.metrics.get("longTasks") || [];
    } catch (error) {
      logger.warn("Failed to observe long tasks", { error });
      return [];
    }
  }

  // Get memory usage (Chrome only)
  static getMemoryUsage(): {
    used: number;
    total: number;
    limit: number;
  } | null {
    if (!this.isBrowser()) return null;

    try {
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        return {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        };
      }
    } catch (error) {
      logger.warn("Failed to get memory usage", { error });
    }

    return null;
  }

  // Clean up observers
  static cleanup(): void {
    this.observers.forEach((observer) => {
      try {
        observer.disconnect();
      } catch (error) {
        logger.warn("Failed to disconnect observer", { error });
      }
    });
    this.observers.clear();
    this.metrics.clear();
  }

  // Initialize on page load
  static init(): void {
    if (!this.isBrowser()) return;

    // Initialize observers when DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.initCoreWebVitals();
      });
    } else {
      this.initCoreWebVitals();
    }

    // Cleanup on page unload
    window.addEventListener("beforeunload", () => {
      this.cleanup();
    });
  }
}

// Auto-initialize if in browser
if (typeof window !== "undefined") {
  PerformanceMonitor.init();
}
