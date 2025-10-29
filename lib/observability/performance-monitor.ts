"use client";

import { logger } from "./logger";
import { metrics } from "./metrics";
import { tracer } from "./tracer";
import { getSSRAdapter } from "../composition/container";

// ===== PERFORMANCE ENTRY TYPES =====

export interface PerformanceEntry {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
  timestamp?: number;
  size?: number;
  transferSize?: number;
  decodedBodySize?: number;
  encodedBodySize?: number;
  nextHopProtocol?: string;
  serverTiming?: any[];
  workerStart?: number;
  redirectStart?: number;
  redirectEnd?: number;
  fetchStart?: number;
  domainLookupStart?: number;
  domainLookupEnd?: number;
  connectStart?: number;
  connectEnd?: number;
  secureConnectionStart?: number;
  requestStart?: number;
  responseStart?: number;
  responseEnd?: number;
  initiatorType?: string;
  deliveryType?: string;
}

// ===== WEB VITALS =====

export interface WebVitals {
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  ttfb: number; // Time to First Byte
  inp: number; // Interaction to Next Paint
}

// ===== PERFORMANCE MONITOR =====

export class PerformanceMonitor {
  private observers: Map<string, PerformanceObserver> = new Map();
  private webVitals: Partial<WebVitals> = {};
  private ssrAdapter = getSSRAdapter();

  constructor() {
    this.initializeObservers();
    this.initializeWebVitals();
  }

  // ===== OBSERVER INITIALIZATION =====

  private initializeObservers(): void {
    if (!this.ssrAdapter.isClientContext()) return;

    // Navigation Timing
    this.observePerformance("navigation", (entries) => {
      entries.forEach((entry) => {
        this.handleNavigationTiming(entry as any);
      });
    });

    // Resource Timing
    this.observePerformance("resource", (entries) => {
      entries.forEach((entry) => {
        this.handleResourceTiming(entry as any);
      });
    });

    // Paint Timing
    this.observePerformance("paint", (entries) => {
      entries.forEach((entry) => {
        this.handlePaintTiming(entry as any);
      });
    });

    // Largest Contentful Paint
    this.observePerformance("largest-contentful-paint", (entries) => {
      entries.forEach((entry) => {
        this.handleLargestContentfulPaint(entry as any);
      });
    });

    // First Input Delay
    this.observePerformance("first-input", (entries) => {
      entries.forEach((entry) => {
        this.handleFirstInputDelay(entry as any);
      });
    });

    // Layout Shift
    this.observePerformance("layout-shift", (entries) => {
      entries.forEach((entry) => {
        this.handleLayoutShift(entry as any);
      });
    });

    // Long Tasks
    this.observePerformance("longtask", (entries) => {
      entries.forEach((entry) => {
        this.handleLongTask(entry as any);
      });
    });
  }

  private observePerformance(
    entryType: string,
    callback: (entries: PerformanceEntry[]) => void,
  ): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries() as any);
      });

      observer.observe({ entryTypes: [entryType] });
      this.observers.set(entryType, observer);
    } catch (error) {
      logger.warn(`Failed to observe ${entryType} performance entries`, {
        error:
          error instanceof Error
            ? error
            : { name: "UnknownError", message: "Unknown error" },
      });
    }
  }

  // ===== WEB VITALS INITIALIZATION =====

  private initializeWebVitals(): void {
    if (!this.ssrAdapter.isClientContext()) return;

    // Web Vitals library would normally be used here
    // For now, we'll track them manually through PerformanceObserver

    // Send Web Vitals on page unload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        this.reportWebVitals();
      });

      // Also send periodically
      setInterval(() => {
        this.reportWebVitals();
      }, 30000); // Every 30 seconds
    }
  }

  // ===== PERFORMANCE HANDLERS =====

  private handleNavigationTiming(
    entry: PerformanceEntry & {
      loadEventEnd: number;
      loadEventStart: number;
      domContentLoadedEventEnd: number;
      domContentLoadedEventStart: number;
      responseEnd: number;
      responseStart: number;
      requestStart: number;
      connectEnd: number;
      connectStart: number;
      domainLookupEnd: number;
      domainLookupStart: number;
      fetchStart: number;
      redirectEnd: number;
      redirectStart: number;
    },
  ): void {
    const navigationSpan = tracer.startSpan("navigation_timing", undefined, {
      url: typeof window !== "undefined" ? window.location.href : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    });

    try {
      // Time to First Byte
      const ttfb = entry.responseStart - entry.fetchStart;
      this.webVitals.ttfb = ttfb;
      metrics.recordHistogram("ttfb_seconds", ttfb / 1000);

      // DOM Content Loaded
      const domContentLoaded =
        entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
      metrics.recordHistogram(
        "dom_content_loaded_seconds",
        domContentLoaded / 1000,
      );

      // Page Load Time
      const pageLoad = entry.loadEventEnd - entry.fetchStart;
      metrics.recordHistogram("page_load_seconds", pageLoad / 1000);

      // DNS Lookup
      const dnsLookup = entry.domainLookupEnd - entry.domainLookupStart;
      metrics.recordHistogram("dns_lookup_seconds", dnsLookup / 1000);

      // TCP Connection
      const tcpConnection = entry.connectEnd - entry.connectStart;
      metrics.recordHistogram("tcp_connection_seconds", tcpConnection / 1000);

      // Server Response
      const serverResponse = entry.responseEnd - entry.requestStart;
      metrics.recordHistogram("server_response_seconds", serverResponse / 1000);

      tracer.logToSpan(navigationSpan, "info", "Navigation timing collected", {
        ttfb,
        domContentLoaded,
        pageLoad,
        dnsLookup,
        tcpConnection,
        serverResponse,
      });

      logger.info("Navigation timing collected", {
        ttfb,
        domContentLoaded,
        pageLoad,
        url: window.location.href,
      });
    } finally {
      tracer.finishSpan(navigationSpan);
    }
  }

  private handleResourceTiming(entry: PerformanceEntry): void {
    // Only log significant resources (ignore very small ones)
    if (entry.duration < 100) return;

    const resourceType = this.getResourceType(entry.name);

    metrics.recordHistogram("resource_load_seconds", entry.duration / 1000, {
      resource_type: resourceType,
      resource_url: entry.name,
      initiator_type: entry.initiatorType || "unknown",
    });

    // Log slow resources
    if (entry.duration > 2000) {
      logger.warn("Slow resource load detected", {
        resource: entry.name,
        duration: entry.duration,
        type: resourceType,
        size: entry.transferSize,
      });
    }
  }

  private handlePaintTiming(entry: PerformanceEntry): void {
    if (entry.name === "first-paint") {
      this.webVitals.fcp = entry.startTime;
      metrics.recordHistogram("first_paint_seconds", entry.startTime / 1000);

      logger.info("First Paint recorded", {
        timestamp: entry.startTime,
      });
    }

    if (entry.name === "first-contentful-paint") {
      this.webVitals.fcp = entry.startTime;
      metrics.recordHistogram(
        "first_contentful_paint_seconds",
        entry.startTime / 1000,
      );

      logger.info("First Contentful Paint recorded", {
        timestamp: entry.startTime,
      });
    }
  }

  private handleLargestContentfulPaint(entry: PerformanceEntry): void {
    this.webVitals.lcp = entry.startTime;
    metrics.recordHistogram(
      "largest_contentful_paint_seconds",
      entry.startTime / 1000,
    );

    logger.info("Largest Contentful Paint recorded", {
      timestamp: entry.startTime,
    });
  }

  private handleFirstInputDelay(
    entry: PerformanceEntry & { processingStart: number },
  ): void {
    const fid = entry.processingStart - entry.startTime;
    this.webVitals.fid = fid;
    metrics.recordHistogram("first_input_delay_seconds", fid / 1000);

    logger.info("First Input Delay recorded", {
      delay: fid,
      inputType: entry.name,
    });
  }

  private handleLayoutShift(
    entry: PerformanceEntry & { value: number; hadRecentInput: boolean },
  ): void {
    // Only count layout shifts without recent input
    if (entry.hadRecentInput) return;

    this.webVitals.cls = (this.webVitals.cls || 0) + entry.value;
    metrics.recordHistogram("layout_shift", entry.value);

    // Log significant layout shifts
    if (entry.value > 0.1) {
      logger.warn("Significant layout shift detected", {
        value: entry.value,
        cumulative: this.webVitals.cls,
      });
    }
  }

  private handleLongTask(entry: PerformanceEntry): void {
    metrics.incrementCounter("long_tasks_total", 1, {
      duration_bucket: entry.duration > 100 ? "over_100ms" : "50_100ms",
    });

    logger.warn("Long task detected", {
      duration: entry.duration,
      startTime: entry.startTime,
    });
  }

  // ===== WEB VITALS REPORTING =====

  private reportWebVitals(): void {
    if (Object.keys(this.webVitals).length === 0) return;

    logger.info("Web Vitals report", {
      ...this.webVitals,
      url: this.ssrAdapter.isClientContext() ? window.location.href : undefined,
    });

    // Send to external monitoring service
    if (process.env.WEB_VITALS_ENDPOINT) {
      fetch(process.env.WEB_VITALS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.WEB_VITALS_API_KEY || ""}`,
        },
        body: JSON.stringify({
          ...this.webVitals,
          url: this.ssrAdapter.isClientContext()
            ? window.location.href
            : undefined,
          userAgent: this.ssrAdapter.isClientContext()
            ? navigator.userAgent
            : undefined,
          timestamp: Date.now(),
        }),
      }).catch((error) => {
        logger.error("Failed to send Web Vitals", { error: error.message });
      });
    }
  }

  // ===== UTILITY METHODS =====

  private getResourceType(url: string): string {
    if (url.includes(".js")) return "javascript";
    if (url.includes(".css")) return "stylesheet";
    if (
      url.includes(".png") ||
      url.includes(".jpg") ||
      url.includes(".jpeg") ||
      url.includes(".gif") ||
      url.includes(".webp") ||
      url.includes(".svg")
    )
      return "image";
    if (
      url.includes(".woff") ||
      url.includes(".woff2") ||
      url.includes(".ttf") ||
      url.includes(".eot")
    )
      return "font";
    if (url.includes("/api/")) return "api";
    return "other";
  }

  // ===== PUBLIC API =====

  recordCustomMetric(
    name: string,
    value: number,
    tags: Record<string, string> = {},
  ): void {
    metrics.recordHistogram(name, value, tags);
  }

  recordCustomEvent(name: string, properties: Record<string, any> = {}): void {
    logger.info(`Custom event: ${name}`, properties);
  }

  startOperationTimer(
    operation: string,
    tags: Record<string, string> = {},
  ): () => void {
    const span = tracer.startSpan(operation, undefined, tags);
    const endTimer = metrics.startTimer(`${operation}_duration_seconds`, tags);

    return () => {
      tracer.finishSpan(span);
      endTimer();
    };
  }

  // ===== CLEANUP =====

  destroy(): void {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();

    if (this.ssrAdapter.isClientContext() && typeof window !== "undefined") {
      window.removeEventListener(
        "beforeunload",
        this.reportWebVitals.bind(this),
      );
    }
  }
}

// ===== PERFORMANCE MONITOR FACTORY =====

export class PerformanceMonitorFactory {
  private static instance: PerformanceMonitor | null = null;

  static getMonitor(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }

    return this.instance;
  }

  static destroy(): void {
    if (this.instance) {
      this.instance.destroy();
      this.instance = null;
    }
  }
}

// ===== GLOBAL PERFORMANCE MONITOR INSTANCE =====

export const performanceMonitor = PerformanceMonitorFactory.getMonitor();

// ===== REACT HOOKS =====

import { useEffect } from "react";

export function usePerformanceMonitoring(componentName: string) {
  useEffect(() => {
    const endTimer = performanceMonitor.startOperationTimer(
      `component_${componentName}_render`,
    );

    return endTimer;
  }, [componentName]);
}

export function usePageLoadTracking(pageName: string) {
  useEffect(() => {
    metrics.recordPageView(pageName);

    const endTimer = performanceMonitor.startOperationTimer(
      `page_${pageName}_load`,
    );

    return endTimer;
  }, [pageName]);
}

// ===== CLEANUP ON EXIT =====

process.on("exit", () => {
  PerformanceMonitorFactory.destroy();
});

process.on("SIGINT", () => {
  PerformanceMonitorFactory.destroy();
  process.exit();
});

process.on("SIGTERM", () => {
  PerformanceMonitorFactory.destroy();
  process.exit();
});
