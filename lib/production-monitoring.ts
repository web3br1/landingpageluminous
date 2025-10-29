// ===== PRODUCTION MONITORING SYSTEM =====
// Sistema avançado de monitoramento para produção com error tracking e CWV

import { AppError, ErrorType, createError } from "./error-handling";
import { analytics } from "./analytics-core";

// ===== CORE WEB VITALS MONITORING =====

export interface CoreWebVitals {
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
}

// Browser Performance API types (simplified)
interface NavigationTimingData {
  domContentLoaded: number;
  loadComplete: number;
  domInteractive: number;
  responseTime: number;
  totalTime: number;
}

interface ResourceTiming {
  name: string;
  startTime: number;
  duration: number;
  initiatorType: string;
  nextHopProtocol?: string;
  transferSize?: number;
  encodedBodySize?: number;
  decodedBodySize?: number;
}

export interface PerformanceMetrics {
  coreWebVitals: CoreWebVitals;
  navigationTiming: NavigationTimingData | null;
  resourceTiming: ResourceTiming[];
  memoryUsage: number | null;
  connectionSpeed: string;
}

// ===== ERROR TRACKING SYSTEM =====

export interface ErrorContext {
  url: string;
  userAgent: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  viewport: { width: number; height: number };
  connection: { effectiveType: string; downlink: number };
  memory?: { used: number; total: number; limit: number };
  experiments?: string[];
  sections?: string[];
}

export interface ErrorPattern {
  type: string;
  message: string;
  frequency: number;
  lastSeen: number;
  contexts: ErrorContext[];
  impact: "low" | "medium" | "high" | "critical";
}

// ===== PRODUCTION MONITOR CLASS =====

export class ProductionMonitor {
  private static instance: ProductionMonitor;
  private errorPatterns: Map<string, ErrorPattern> = new Map();
  private performanceMetrics: PerformanceMetrics;
  private sessionId: string;
  private observers: PerformanceObserver[] = [];
  private isTrackingError = false; // Prevent infinite loops

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.performanceMetrics = this.getInitialMetrics();

    if (typeof window !== "undefined") {
      this.setupErrorTracking();
      this.setupCoreWebVitals();
      this.setupPerformanceObservers();
    }
  }

  static getInstance(): ProductionMonitor {
    if (!ProductionMonitor.instance) {
      ProductionMonitor.instance = new ProductionMonitor();
    }
    return ProductionMonitor.instance;
  }

  // ===== SESSION MANAGEMENT =====

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  // ===== ERROR TRACKING =====

  private setupErrorTracking(): void {
    // Global error handler
    window.addEventListener("error", (event) => {
      this.trackError(event.error, {
        type: "javascript",
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Promise rejection handler
    window.addEventListener("unhandledrejection", (event) => {
      this.trackError(event.reason, {
        type: "promise",
        promise: event.promise,
      });
    });

    // React error tracking is now handled by dedicated error boundaries
    // SectionErrorBoundary and GlobalErrorBoundary provide proper categorization
  }

  // ===== WEBPACK ERROR DETECTION =====

  private detectWebpackErrors(message: string, stack?: string): boolean {
    const webpackIndicators = [
      "Cannot read properties of undefined (reading 'call')",
      "factory.call",
      "options.factory.call",
      "factory is not a function",
      "__webpack_require__",
      "Loading chunk",
      "ChunkLoadError",
      "webpack runtime",
      "Module not found",
      "Cannot resolve module",
      "Cannot read property 'call' of undefined",
      "TypeError: undefined is not a function",
      "ReferenceError: __webpack_modules__ is not defined",
      "Loading CSS chunk",
      "Loading JS chunk",
    ];

    return webpackIndicators.some(
      (indicator) =>
        message.includes(indicator) || (stack && stack.includes(indicator)),
    );
  }

  private detectFactoryCallError(message: string): boolean {
    return (
      message.includes(
        "Cannot read properties of undefined (reading 'call')",
      ) ||
      message.includes("factory.call") ||
      message.includes("options.factory.call") ||
      message.includes("Cannot read property 'call' of undefined")
    );
  }

  // ===== ERROR TRACKING =====

  trackError(error: Error | string | unknown, context?: any): void {
    // Prevent infinite loops - multiple protection layers
    if (this.isTrackingError) return;

    // Additional protection: limit error tracking frequency
    const now = Date.now();
    if (now - (this as any).lastErrorTime < 100) return; // Throttle to max 10 errors per second
    (this as any).lastErrorTime = now;

    this.isTrackingError = true;

    try {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      const errorContext = this.buildErrorContext(context);

      // Skip tracking our own monitoring errors to prevent loops
      if (
        errorObj.message.includes("[ProductionMonitor]") ||
        errorObj.stack?.includes("ProductionMonitor")
      ) {
        return;
      }

      // Classify error type
      let errorType: ErrorType = ErrorType.UNKNOWN;
      let errorMessage = errorObj.message;

      if (this.detectFactoryCallError(errorMessage)) {
        errorType = ErrorType.FACTORY_ERROR;
        errorMessage = "Factory function call error (webpack runtime)";
      } else if (this.detectWebpackErrors(errorMessage, errorObj.stack)) {
        errorType = ErrorType.WEBPACK_RUNTIME;
        errorMessage = "Webpack runtime error";
      } else if (
        errorMessage.includes("Loading chunk") ||
        errorMessage.includes("ChunkLoadError")
      ) {
        errorType = ErrorType.MODULE_LOADING;
        errorMessage = "Module loading error";
      }

      const appError = new AppError(errorMessage, errorType, {
        details: {
          stack: errorObj.stack,
          context,
          sessionId: this.sessionId,
          url: errorContext.url,
          userAgent: errorContext.userAgent,
          timestamp: errorContext.timestamp,
          originalMessage: errorObj.message,
        },
        cause: errorObj,
      });

      // Update error patterns
      this.updateErrorPatterns(appError, errorContext);

      // Send to monitoring service
      this.sendToMonitoringService(appError, errorContext);

      // Log locally in development (avoid triggering our own error handlers)
      if (process.env.NODE_ENV === "development") {
        // Use console.warn instead of console.error to avoid triggering React error detection
        console.warn("[ProductionMonitor]", appError.message);
      }
    } catch (internalError) {
      // Fallback error handling - use native console to avoid further recursion
      if (typeof console !== "undefined" && console.warn) {
        console.warn(
          "[ProductionMonitor] Internal error in trackError:",
          internalError,
        );
      }
    } finally {
      this.isTrackingError = false;
    }
  }

  private updateErrorPatterns(error: AppError, context: ErrorContext): void {
    const key = `${error.type}:${error.message.split(" ").slice(0, 3).join(" ")}`;

    const existing = this.errorPatterns.get(key);
    if (existing) {
      existing.frequency++;
      existing.lastSeen = Date.now();
      existing.contexts.push(context);

      // Keep only last 10 contexts
      if (existing.contexts.length > 10) {
        existing.contexts = existing.contexts.slice(-10);
      }
    } else {
      this.errorPatterns.set(key, {
        type: error.type,
        message: error.message,
        frequency: 1,
        lastSeen: Date.now(),
        contexts: [context],
        impact: this.calculateErrorImpact(error),
      });
    }
  }

  private calculateErrorImpact(
    error: AppError,
  ): "low" | "medium" | "high" | "critical" {
    if (error.type === ErrorType.FACTORY_ERROR) return "critical";
    if (error.type === ErrorType.WEBPACK_RUNTIME) return "high";
    if (error.type === ErrorType.MODULE_LOADING) return "high";
    if (error.type === ErrorType.PERFORMANCE) return "medium";
    return "low";
  }

  private buildErrorContext(additionalContext?: any): ErrorContext {
    return {
      url: typeof window !== "undefined" ? window.location.href : "",
      userAgent:
        typeof window !== "undefined" ? window.navigator.userAgent : "",
      timestamp: Date.now(),
      sessionId: this.sessionId,
      viewport:
        typeof window !== "undefined"
          ? {
              width: window.innerWidth,
              height: window.innerHeight,
            }
          : { width: 0, height: 0 },
      connection:
        typeof window !== "undefined" && "connection" in window.navigator
          ? (window.navigator as any).connection
          : { effectiveType: "unknown", downlink: 0 },
      memory:
        typeof window !== "undefined" && (window as any).performance?.memory
          ? {
              used: (window as any).performance.memory.usedJSHeapSize,
              total: (window as any).performance.memory.totalJSHeapSize,
              limit: (window as any).performance.memory.jsHeapSizeLimit,
            }
          : undefined,
      ...additionalContext,
    };
  }

  // ===== CORE WEB VITALS MONITORING =====

  private setupCoreWebVitals(): void {
    // Use web-vitals library if available
    this.loadWebVitalsLibrary();
  }

  private async loadWebVitalsLibrary(): Promise<void> {
    try {
      // Use dynamic import with error boundary
      const webVitals = await import("web-vitals");

      if (!webVitals.onCLS || !webVitals.onINP) {
        throw new Error("web-vitals library incomplete");
      }

      webVitals.onCLS((metric) => this.trackWebVital("cls", metric.value));
      // FID is deprecated, using INP instead
      webVitals.onFCP((metric) => this.trackWebVital("fcp", metric.value));
      webVitals.onLCP((metric) => this.trackWebVital("lcp", metric.value));
      webVitals.onTTFB((metric) => this.trackWebVital("ttfb", metric.value));
    } catch (error) {
      console.warn(
        "web-vitals library not available, falling back to manual measurement:",
        error,
      );
      this.setupManualWebVitals();
    }
  }

  private setupManualWebVitals(): void {
    // Fallback implementation for basic CWV tracking
    if (typeof window !== "undefined" && "PerformanceObserver" in window) {
      // LCP (Largest Contentful Paint)
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          if (lastEntry) {
            this.trackWebVital("lcp", lastEntry.startTime);
          }
        });
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn("LCP monitoring not supported");
      }

      // CLS (Cumulative Layout Shift)
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          this.trackWebVital("cls", clsValue);
        });
        clsObserver.observe({ entryTypes: ["layout-shift"] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn("CLS monitoring not supported");
      }
    }
  }

  private trackWebVital(metric: keyof CoreWebVitals, value: number): void {
    // Update local metrics
    this.performanceMetrics.coreWebVitals[metric] = value;

    // Send to analytics
    analytics.track("web_vital", {
      metric,
      value,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
    });

    // Check performance budgets
    this.checkPerformanceBudgets(metric, value);

    // Send to monitoring service
    this.sendPerformanceMetric(metric, value);
  }

  private checkPerformanceBudgets(
    metric: keyof CoreWebVitals,
    value: number,
  ): void {
    const budgets = {
      lcp: 2500, // 2.5s
      fid: 100, // 100ms
      cls: 0.1, // 0.1 score
      fcp: 1800, // 1.8s
      ttfb: 800, // 800ms
    };

    const budget = budgets[metric];
    if (budget && value > budget) {
      const error = createError.performance(
        `${metric.toUpperCase()} exceeded budget: ${value}ms (budget: ${budget}ms)`,
        metric,
        value,
        { budget, exceeded: value - budget },
      );

      this.trackError(error, { type: "performance_budget" });
    }
  }

  // ===== PERFORMANCE OBSERVERS =====

  private setupPerformanceObservers(): void {
    if (typeof window === "undefined" || !window.PerformanceObserver) return;

    // Monitor long tasks
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            // Long task > 50ms
            this.trackPerformanceIssue("long_task", {
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ["longtask"] });
      this.observers.push(longTaskObserver);
    } catch (e) {
      console.warn("Long task monitoring not supported");
    }

    // Monitor navigation timing
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "navigation") {
            this.updateNavigationTiming(entry as PerformanceNavigationTiming);
          }
        }
      });
      navigationObserver.observe({ entryTypes: ["navigation"] });
      this.observers.push(navigationObserver);
    } catch (e) {
      console.warn("Navigation timing monitoring not supported");
    }

    // Monitor resource timing
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[];
        this.updateResourceTiming(entries);
      });
      resourceObserver.observe({ entryTypes: ["resource"] });
      this.observers.push(resourceObserver);
    } catch (e) {
      console.warn("Resource timing monitoring not supported");
    }
  }

  private updateNavigationTiming(entry: PerformanceNavigationTiming): void {
    this.performanceMetrics.navigationTiming = {
      domContentLoaded:
        entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      domInteractive: entry.domInteractive,
      responseTime: entry.responseEnd - entry.requestStart,
      totalTime: entry.loadEventEnd - entry.fetchStart,
    };
  }

  private updateResourceTiming(entries: PerformanceResourceTiming[]): void {
    entries.forEach((entry) => {
      if (entry.duration > 1000) {
        // Resources taking > 1s
        this.trackPerformanceIssue("slow_resource", {
          url: entry.name,
          duration: entry.duration,
          size: entry.transferSize,
        });
      }
    });

    // Keep only recent entries
    this.performanceMetrics.resourceTiming = entries.slice(-50);
  }

  private trackPerformanceIssue(type: string, data: any): void {
    analytics.track("performance_issue", {
      type,
      ...data,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
    });

    // Send to monitoring service
    this.sendToMonitoringService({
      type: "performance_issue",
      data: { ...data, type, sessionId: this.sessionId },
    });
  }

  // ===== MONITORING SERVICE INTEGRATION =====

  private sendToMonitoringService(
    error: AppError | any,
    context?: ErrorContext,
  ): void {
    // In production, send to your monitoring service (Sentry, LogRocket, etc.)
    if (process.env.NODE_ENV === "production") {
      try {
        // Example: Send to monitoring service
        const payload = {
          error:
            error instanceof AppError
              ? {
                  message: error.message,
                  type: error.type,
                  code: error.code,
                  stack: error.stack,
                  details: error.details,
                }
              : error,
          context,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
          url: typeof window !== "undefined" ? window.location.href : "",
          userAgent:
            typeof window !== "undefined" ? window.navigator.userAgent : "",
        };

        // Send to your monitoring endpoint
        // fetch('/api/monitoring/error', { method: 'POST', body: JSON.stringify(payload) })

        console.log("[Monitoring]", payload);
      } catch (e) {
        console.error("Failed to send error to monitoring service:", e);
      }
    }
  }

  private sendPerformanceMetric(metric: string, value: number): void {
    if (process.env.NODE_ENV === "production") {
      try {
        const payload = {
          metric,
          value,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
          url: typeof window !== "undefined" ? window.location.href : "",
        };

        // Send to your monitoring endpoint
        // fetch('/api/monitoring/performance', { method: 'POST', body: JSON.stringify(payload) })

        console.log("[Performance]", payload);
      } catch (e) {
        console.error("Failed to send performance metric:", e);
      }
    }
  }

  // ===== PUBLIC API =====

  getErrorPatterns(): ErrorPattern[] {
    return Array.from(this.errorPatterns.values());
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  getCriticalErrors(): ErrorPattern[] {
    return Array.from(this.errorPatterns.values())
      .filter(
        (pattern) => pattern.impact === "critical" || pattern.impact === "high",
      )
      .sort((a, b) => b.frequency - a.frequency);
  }

  // ===== CLEANUP =====

  destroy(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    this.errorPatterns.clear();
  }

  // ===== UTILITIES =====

  private getInitialMetrics(): PerformanceMetrics {
    return {
      coreWebVitals: {
        lcp: null,
        fid: null,
        cls: null,
        fcp: null,
        ttfb: null,
      },
      navigationTiming: null,
      resourceTiming: [],
      memoryUsage:
        typeof window !== "undefined" && (window as any).performance?.memory
          ? (window as any).performance.memory.usedJSHeapSize
          : null,
      connectionSpeed:
        typeof window !== "undefined" && "connection" in window.navigator
          ? (window.navigator as any).connection?.effectiveType || "unknown"
          : "unknown",
    };
  }
}

// ===== REACT HOOKS =====

export function useProductionMonitoring() {
  const monitor = ProductionMonitor.getInstance();

  return {
    trackError: (error: Error | string, context?: any) =>
      monitor.trackError(error, context),
    getErrorPatterns: () => monitor.getErrorPatterns(),
    getPerformanceMetrics: () => monitor.getPerformanceMetrics(),
    getCriticalErrors: () => monitor.getCriticalErrors(),
    sessionId: monitor.getSessionId(),
  };
}

// ===== STANDALONE FUNCTIONS =====

// Exported function for API routes
export async function collectPerformanceMetrics(): Promise<PerformanceMetrics> {
  // In server-side context, return mock data or collect from client-side storage
  if (typeof window === "undefined") {
    // Server-side: return mock data for health checks
    return {
      coreWebVitals: {
        lcp: 1200,
        fid: 50,
        cls: 0.05,
        fcp: 800,
        ttfb: 200,
      },
      navigationTiming: null,
      resourceTiming: [],
      memoryUsage: null,
      connectionSpeed: "unknown",
    };
  }

  // Client-side: use ProductionMonitor instance
  const monitor = ProductionMonitor.getInstance();
  return monitor.getPerformanceMetrics();
}

// ===== PRODUCTION MONITORING INITIALIZATION =====

// Initialize monitoring on client side
if (typeof window !== "undefined") {
  const monitor = ProductionMonitor.getInstance();

  // Note: console.error override is handled within ProductionMonitor.setupErrorTracking()
  // to prevent infinite loops. No additional global override needed.
}
