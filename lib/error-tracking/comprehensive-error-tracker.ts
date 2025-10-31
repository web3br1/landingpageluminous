"use client";

import { ProductionMonitor } from "../production-monitoring";
import { isHTMLElement } from "@/lib/utils/dom-type-guards";

export enum ErrorCategory {
  NETWORK = "network",
  RUNTIME = "runtime",
  REACT = "react",
  WEBPACK = "webpack",
  PERFORMANCE = "performance",
  ACCESSIBILITY = "accessibility",
  SECURITY = "security",
  UNKNOWN = "unknown",
}

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export interface ErrorContext {
  url: string;
  userAgent: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  viewport: { width: number; height: number };
  connection: { effectiveType: string; downlink: number; rtt: number };
  memory?: { used: number; total: number; limit: number };
  experiments?: string[];
  sections?: string[];
  componentName?: string;
  componentStack?: string;
  retryCount?: number;
  boundary?: string;
  sectionId?: string;
}

export interface TrackedError {
  id: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  stack?: string;
  context: ErrorContext;
  timestamp: number;
  frequency: number;
  lastSeen: number;
  resolved: boolean;
  tags: string[];
}

class ComprehensiveErrorTracker {
  private static instance: ComprehensiveErrorTracker;
  private monitor: ProductionMonitor;
  private errors: Map<string, TrackedError> = new Map();
  private errorQueue: TrackedError[] = [];
  private isInitialized = false;

  private constructor() {
    this.monitor = ProductionMonitor.getInstance();
  }

  static getInstance(): ComprehensiveErrorTracker {
    if (!ComprehensiveErrorTracker.instance) {
      ComprehensiveErrorTracker.instance = new ComprehensiveErrorTracker();
    }
    return ComprehensiveErrorTracker.instance;
  }

  // Initialize error tracking
  initialize(): void {
    if (this.isInitialized || typeof window === "undefined") return;

    this.setupGlobalErrorHandlers();
    this.setupNetworkErrorTracking();
    this.setupReactErrorTracking();
    this.setupPerformanceErrorTracking();

    this.isInitialized = true;

    // Process queued errors
    this.errorQueue.forEach((trackedError) => {
      // Re-process tracked error with proper error object and context
      this.trackError(trackedError.message, trackedError.context);
    });
    this.errorQueue = [];
  }

  // Comprehensive error categorization
  private categorizeError(
    error: Error | string | unknown,
    context?: unknown,
  ): ErrorCategory {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const contextMessage = (context as Error)?.message || "";

    const fullMessage = `${errorMessage} ${contextMessage}`.toLowerCase();

    // Network errors
    if (
      fullMessage.includes("fetch") ||
      fullMessage.includes("network") ||
      fullMessage.includes("timeout") ||
      fullMessage.includes("cors") ||
      fullMessage.includes("connection") ||
      fullMessage.includes("offline") ||
      fullMessage.includes("4") || // HTTP status codes
      fullMessage.includes("5")
    ) {
      return ErrorCategory.NETWORK;
    }

    // React errors
    if (
      fullMessage.includes("react") ||
      fullMessage.includes("render") ||
      fullMessage.includes("component") ||
      fullMessage.includes("hook") ||
      fullMessage.includes("state") ||
      fullMessage.includes("effect") ||
      fullMessage.includes("memo") ||
      fullMessage.includes("context") ||
      (errorStack && errorStack.includes("react"))
    ) {
      return ErrorCategory.REACT;
    }

    // Webpack/Bundle errors
    if (
      fullMessage.includes("chunk") ||
      fullMessage.includes("loading") ||
      fullMessage.includes("factory") ||
      fullMessage.includes("webpack") ||
      fullMessage.includes("bundle") ||
      fullMessage.includes("module") ||
      fullMessage.includes("import") ||
      (errorStack && errorStack.includes("webpack"))
    ) {
      return ErrorCategory.WEBPACK;
    }

    // Performance errors
    if (
      fullMessage.includes("performance") ||
      fullMessage.includes("memory") ||
      fullMessage.includes("timeout") ||
      fullMessage.includes("slow") ||
      fullMessage.includes("lcp") ||
      fullMessage.includes("cls") ||
      fullMessage.includes("fid")
    ) {
      return ErrorCategory.PERFORMANCE;
    }

    // Accessibility errors
    if (
      fullMessage.includes("accessibility") ||
      fullMessage.includes("a11y") ||
      fullMessage.includes("aria") ||
      fullMessage.includes("focus") ||
      fullMessage.includes("keyboard")
    ) {
      return ErrorCategory.ACCESSIBILITY;
    }

    // Security errors
    if (
      fullMessage.includes("security") ||
      fullMessage.includes("csrf") ||
      fullMessage.includes("xss") ||
      fullMessage.includes("csp") ||
      fullMessage.includes("cors")
    ) {
      return ErrorCategory.SECURITY;
    }

    // JavaScript runtime errors
    if (
      fullMessage.includes("typeerror") ||
      fullMessage.includes("referenceerror") ||
      fullMessage.includes("syntaxerror") ||
      fullMessage.includes("rangeerror") ||
      fullMessage.includes("urierror") ||
      (errorStack && errorStack.includes("at "))
    ) {
      return ErrorCategory.RUNTIME;
    }

    return ErrorCategory.UNKNOWN;
  }

  // Calculate error severity based on impact and category
  private calculateSeverity(
    error: Error | string | unknown,
    category: ErrorCategory,
    context?: unknown,
  ): ErrorSeverity {
    // Critical errors that break the app
    if (
      category === ErrorCategory.WEBPACK ||
      category === ErrorCategory.SECURITY ||
      (context as any)?.boundary === "global" ||
      (context as any)?.severity === "critical"
    ) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity errors
    if (
      category === ErrorCategory.REACT ||
      category === ErrorCategory.NETWORK ||
      category === ErrorCategory.PERFORMANCE ||
      (context as any)?.boundary === "section" ||
      ((context as any)?.retryCount && (context as any).retryCount >= 3)
    ) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity errors
    if (
      category === ErrorCategory.RUNTIME ||
      category === ErrorCategory.ACCESSIBILITY
    ) {
      return ErrorSeverity.MEDIUM;
    }

    // Low severity errors
    return ErrorSeverity.LOW;
  }

  // Generate unique error ID
  private generateErrorId(
    error: Error | string | unknown,
    category: ErrorCategory,
  ): string {
    const message = error instanceof Error ? error.message : String(error);
    const hash = this.simpleHash(`${category}:${message.slice(0, 100)}`);
    return `${category}_${hash}`;
  }

  // Simple hash function for error deduplication
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Setup global error handlers
  private setupGlobalErrorHandlers(): void {
    // JavaScript errors
    window.addEventListener("error", (event) => {
      this.trackError(event.error, {
        type: "javascript",
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.trackError(event.reason, {
        type: "promise",
        promise: event.promise,
        message: event.reason?.message || "Unhandled promise rejection",
      });
    });

    // WebAssembly errors (if used)
    if ("WebAssembly" in window) {
      window.addEventListener("webassemblyerror", (event: unknown) => {
        this.trackError("WebAssembly Error", {
          type: "webassembly",
          message: (event as Error).message || "WebAssembly compilation/linking error",
        });
      });
    }
  }

  // Setup network error tracking
  private setupNetworkErrorTracking(): void {
    // Intercept fetch errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          // Filter out expected 404s for missing static assets to reduce noise
          const url = args[0] as string;
          const isExpectedMissingAsset =
            response.status === 404 &&
            (url.includes("/og-image.png") || url.includes(".placeholder"));

          if (!isExpectedMissingAsset) {
            this.trackError(`HTTP ${response.status}: ${response.statusText}`, {
              type: "network",
              url,
              status: response.status,
              statusText: response.statusText,
            });
          }
        }
        return response;
      } catch (error) {
        this.trackError(error, {
          type: "network",
          url: args[0] as string,
          isNetworkError: true,
        });
        throw error;
      }
    };

    // Track resource loading errors (disabled for LINK tags to reduce noise)
    window.addEventListener(
      "error",
      (event) => {
        if (!isHTMLElement(event.target)) return;
        const target = event.target;
        if (
          target &&
          (target.tagName === "IMG" || target.tagName === "SCRIPT")
        ) {
          const url = (target as any).src || (target as any).href;

          // Filter out expected missing resources to reduce noise
          const isExpectedMissing =
            url &&
            (url.includes("/og-image.png") ||
              url.includes(".placeholder") ||
              (url.includes("favicon.ico") && !url.includes("/favicon.ico"))); // Only track root favicon

          if (!isExpectedMissing) {
            this.trackError(`Resource load failed: ${target.tagName}`, {
              type: "resource",
              url,
              tagName: target.tagName,
            });
          }
        }
      },
      true,
    );
  }

  // Setup React error tracking
  private setupReactErrorTracking(): void {
    // React error tracking is handled by error boundaries
    // This method is for additional React-specific monitoring
    if (process.env.NODE_ENV === "development") {
      // Track React warnings in development
      const originalWarn = console.warn;
      console.warn = (...args: unknown[]) => {
        const message = args.join(" ");
        if (message.includes("React") || message.includes("Warning:")) {
          this.trackError(new Error(message), {
            type: "react_warning",
            args,
          });
        }
        originalWarn.apply(console, args);
      };
    }
  }

  // Setup performance error tracking
  private setupPerformanceErrorTracking(): void {
    // Track performance issues
    if ("PerformanceObserver" in window) {
      // Long tasks
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ((entry as any).duration > 500) {
              // Only report very long tasks (>500ms) to reduce noise
              this.trackError(`Long task: ${(entry as any).duration}ms`, {
                type: "performance",
                duration: (entry as any).duration,
                startTime: entry.startTime,
                category: ErrorCategory.PERFORMANCE,
                severity: ErrorSeverity.MEDIUM,
              });
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ["longtask"] });
      } catch (e) {
        // Long task monitoring not supported
      }

      // Memory issues (if available) - disabled in development to reduce noise
      if ("memory" in performance && process.env.NODE_ENV === "production") {
        const checkMemory = () => {
          const memInfo = (performance as any).memory;
          const usedPercent =
            (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100;

          if (usedPercent > 95) {
            // Memory usage over 95% (only in production)
            this.trackError(`High memory usage: ${usedPercent.toFixed(1)}%`, {
              type: "performance",
              memoryUsed: memInfo.usedJSHeapSize,
              memoryTotal: memInfo.totalJSHeapSize,
              category: ErrorCategory.PERFORMANCE,
              severity:
                process.env.NODE_ENV === "production"
                  ? ErrorSeverity.HIGH
                  : ErrorSeverity.MEDIUM,
            });
          }
        };

        // Check memory periodically (less frequent in development)
        const checkInterval =
          process.env.NODE_ENV === "production" ? 60000 : 300000; // 1min prod, 5min dev
        setInterval(checkMemory, checkInterval);
      }
    }
  }

  // Main error tracking method
  trackError(error: Error | string | unknown, context?: unknown): void {
    if (!this.isInitialized) {
      // Queue error for later processing
      const trackedError = this.createTrackedError(error, context);
      this.errorQueue.push(trackedError);
      return;
    }

    const trackedError = this.createTrackedError(error, context);

    // Check if this is a duplicate error (within last 5 minutes)
    const existingError = this.errors.get(trackedError.id);
    if (existingError && Date.now() - existingError.lastSeen < 300000) {
      // Update frequency and last seen
      existingError.frequency++;
      existingError.lastSeen = Date.now();
      existingError.context = {
        ...existingError.context,
        ...trackedError.context,
      };
      return;
    }

    // Store the error
    this.errors.set(trackedError.id, trackedError);

    // Send to production monitor
    this.monitor.trackError(error, {
      ...context,
      category: trackedError.category,
      severity: trackedError.severity,
      errorId: trackedError.id,
    });

    // Log in development (less verbose for performance/memory issues)
    if (process.env.NODE_ENV === "development") {
      const isPerformanceIssue =
        trackedError.category === ErrorCategory.PERFORMANCE;
      const shouldLogVerbose =
        !isPerformanceIssue || trackedError.severity === ErrorSeverity.CRITICAL;

      if (shouldLogVerbose) {
        console.group(
          `🚨 [${trackedError.category.toUpperCase()}] Error Tracked`,
        );
        console.error("ID:", trackedError.id);
        console.error("Message:", trackedError.message);
        console.error("Severity:", trackedError.severity);
        console.error("Context:", trackedError.context);
        console.groupEnd();
      } else {
        // Simple log for performance issues
        console.warn(
          `⚡ [${trackedError.category.toUpperCase()}] ${trackedError.message} (ID: ${trackedError.id})`,
        );
      }
    }

    // Trigger alerts for critical errors
    if (trackedError.severity === ErrorSeverity.CRITICAL) {
      this.triggerCriticalAlert(trackedError);
    }
  }

  private createTrackedError(
    error: Error | string | unknown,
    context?: unknown,
  ): TrackedError {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const category = this.categorizeError(error, context);
    const severity = this.calculateSeverity(error, category, context);
    const id = this.generateErrorId(error, category);

    return {
      id,
      message: errorObj.message,
      category,
      severity,
      stack: errorObj.stack,
      context: this.buildErrorContext(context),
      timestamp: Date.now(),
      frequency: 1,
      lastSeen: Date.now(),
      resolved: false,
      tags: this.generateTags(error, category, context),
    };
  }

  private buildErrorContext(additionalContext?: unknown): ErrorContext {
    return {
      url: typeof window !== "undefined" ? window.location.href : "",
      userAgent:
        typeof window !== "undefined" ? window.navigator.userAgent : "",
      timestamp: Date.now(),
      sessionId: this.monitor.getSessionId(),
      viewport:
        typeof window !== "undefined"
          ? {
              width: window.innerWidth,
              height: window.innerHeight,
            }
          : { width: 0, height: 0 },
      connection:
        typeof window !== "undefined" && "connection" in window.navigator
          ? {
              effectiveType:
                (window.navigator as any).connection?.effectiveType ||
                "unknown",
              downlink: (window.navigator as any).connection?.downlink || 0,
              rtt: (window.navigator as any).connection?.rtt || 0,
            }
          : { effectiveType: "unknown", downlink: 0, rtt: 0 },
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

  private generateTags(
    error: Error | string | unknown,
    category: ErrorCategory,
    context?: unknown,
  ): string[] {
    const tags: string[] = [category];

    if ((context as any)?.boundary) tags.push(`boundary:${(context as any).boundary}`);
    if ((context as any)?.sectionId) tags.push(`section:${(context as any).sectionId}`);
    if ((context as any)?.componentName) tags.push(`component:${(context as any).componentName}`);
    if ((context as any)?.type) tags.push(`type:${(context as any).type}`);

    return tags;
  }

  private triggerCriticalAlert(error: TrackedError): void {
    // In production, this could send alerts to monitoring systems
    console.error("🚨 CRITICAL ERROR ALERT:", {
      id: error.id,
      message: error.message,
      category: error.category,
      context: error.context,
    });

    // Could integrate with services like Sentry, DataDog, etc.
    // Example: sendCriticalAlert(error)
  }

  // Public API methods
  getErrors(): TrackedError[] {
    return Array.from(this.errors.values());
  }

  getErrorsByCategory(category: ErrorCategory): TrackedError[] {
    return Array.from(this.errors.values()).filter(
      (error) => error.category === category,
    );
  }

  getErrorsBySeverity(severity: ErrorSeverity): TrackedError[] {
    return Array.from(this.errors.values()).filter(
      (error) => error.severity === severity,
    );
  }

  getCriticalErrors(): TrackedError[] {
    return this.getErrorsBySeverity(ErrorSeverity.CRITICAL);
  }

  markErrorResolved(errorId: string): void {
    const error = this.errors.get(errorId);
    if (error) {
      error.resolved = true;
    }
  }

  clearResolvedErrors(): void {
    for (const [id, error] of this.errors) {
      if (error.resolved) {
        this.errors.delete(id);
      }
    }
  }

  getErrorStats() {
    const errors = Array.from(this.errors.values());
    return {
      total: errors.length,
      byCategory: errors.reduce(
        (acc, error) => {
          acc[error.category] = (acc[error.category] || 0) + 1;
          return acc;
        },
        {} as Record<ErrorCategory, number>,
      ),
      bySeverity: errors.reduce(
        (acc, error) => {
          acc[error.severity] = (acc[error.severity] || 0) + 1;
          return acc;
        },
        {} as Record<ErrorSeverity, number>,
      ),
      unresolved: errors.filter((e) => !e.resolved).length,
    };
  }
}

// Export singleton instance
export const errorTracker = ComprehensiveErrorTracker.getInstance();

// React hook for error tracking in components
export function useErrorTracking(sectionId?: string) {
  const trackError = (error: Error | string | unknown, context?: unknown) => {
    errorTracker.trackError(error, {
      ...context,
      sectionId,
    });
  };

  const trackSectionError = (error: Error, componentName?: string) => {
    trackError(error, {
      boundary: "section",
      sectionId,
      componentName,
      componentStack: error.stack,
    });
  };

  return {
    trackError,
    trackSectionError,
    getErrorStats: () => errorTracker.getErrorStats(),
    getCriticalErrors: () => errorTracker.getCriticalErrors(),
  };
}

// Initialize error tracking when imported
if (typeof window !== "undefined") {
  errorTracker.initialize();
}
