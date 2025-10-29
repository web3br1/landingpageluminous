// Infrastructure Adapters - Implement ports with concrete dependencies
// Infrastructure Layer: Concrete implementations of application ports

import { Result } from "@/shared/core";
import { AppError } from "@/shared/errors";
import { timed } from "@/shared/observ";
import type { PageType, PageMetadata, SectionId } from "../ports";
import {
  IExperimentService,
  IAnalyticsService,
  IPerformanceMonitor,
  IErrorTracker,
  TimerHandle,
  LogLevel,
} from "../ports";
import { flags } from "@/lib/flags";
import { logger } from "@/lib/logger";

// Experiment Service Adapter
export class ExperimentServiceAdapter implements IExperimentService {
  getActiveVariant(experimentId: string): Promise<Result<string, AppError>> {
    try {
      const variant = flags.getExperimentVariant(experimentId);
      return Promise.resolve(Result.ok(variant));
    } catch (error) {
      logger.error("Failed to get experiment variant", { experimentId, error });
      return Promise.resolve(
        Result.err({
          name: "AppError",
          message: `Failed to get variant for experiment ${experimentId}`,
          code: "INTERNAL_ERROR" as const,
        }),
      );
    }
  }

  isExperimentActive(experimentId: string): Promise<Result<boolean, AppError>> {
    try {
      // Check if experiment is configured and not 'control'
      const variant = flags.getExperimentVariant(experimentId);
      const isActive = variant !== "control";
      return Promise.resolve(Result.ok(isActive));
    } catch (error) {
      logger.error("Failed to check experiment status", {
        experimentId,
        error,
      });
      return Promise.resolve(
        Result.err({
          name: "AppError",
          message: `Failed to check status for experiment ${experimentId}`,
          code: "INTERNAL_ERROR" as const,
        }),
      );
    }
  }
}

// Analytics Service Adapter
export class AnalyticsServiceAdapter implements IAnalyticsService {
  trackPageView(
    pageType: PageType,
    metadata: PageMetadata,
  ): Promise<Result<void, AppError>> {
    try {
      // In a real implementation, this would send to analytics service
      logger.info("Page view tracked", { pageType, metadata });

      // Placeholder for actual analytics tracking
      if (typeof window !== "undefined") {
        // Client-side analytics tracking would go here
        console.log("Analytics: Page view", { pageType, metadata });
      }

      return Promise.resolve(Result.ok(void 0));
    } catch (error) {
      logger.error("Failed to track page view", { pageType, error });
      return Promise.resolve(
        Result.err({
          name: "AppError",
          message: "Failed to track page view",
          code: "INTERNAL_ERROR" as const,
          cause: error as Error,
        }),
      );
    }
  }

  trackSectionLoad(
    sectionId: SectionId,
    loadTime: number,
  ): Promise<Result<void, AppError>> {
    try {
      logger.info("Section load tracked", { sectionId, loadTime });

      if (typeof window !== "undefined") {
        // Client-side analytics tracking would go here
        console.log("Analytics: Section load", { sectionId, loadTime });
      }

      return Promise.resolve(Result.ok(void 0));
    } catch (error) {
      // Don't log errors to prevent infinite loops - use console.warn instead
      if (typeof console !== "undefined" && console.warn) {
        console.warn("Failed to track section load", { sectionId, error });
      }
      return Promise.resolve(
        Result.err({
          name: "AppError",
          message: "Failed to track section load",
          code: "INTERNAL_ERROR" as const,
          cause: error as Error,
        }),
      );
    }
  }
}

// Performance Monitor Adapter
export class PerformanceMonitorAdapter implements IPerformanceMonitor {
  private timers = new Map<string, { startTime: number; operation: string }>();

  startTimer(operation: string): TimerHandle {
    const id = `${operation}_${Date.now()}_${Math.random()}`;
    const startTime = performance.now();

    this.timers.set(id, { startTime, operation });

    return { id, operation, startTime };
  }

  async endTimer(handle: TimerHandle): Promise<Result<number, AppError>> {
    const timer = this.timers.get(handle.id);

    if (!timer) {
      return Promise.resolve(
        Result.err({
          name: "AppError",
          message: `Timer not found: ${handle.id}`,
          code: "INTERNAL_ERROR" as const,
        }),
      );
    }

    const duration = performance.now() - timer.startTime;
    this.timers.delete(handle.id);

    // Record the metric
    await this.recordMetric(`${timer.operation}_duration`, duration, {
      operation: timer.operation,
    });

    return Result.ok(duration);
  }

  recordMetric(
    name: string,
    value: number,
    tags?: Record<string, string>,
  ): Promise<Result<void, AppError>> {
    try {
      logger.debug("Recording metric", { name, value, tags });

      // In a real implementation, this would send to metrics service
      if (typeof window !== "undefined") {
        // Client-side metrics recording would go here
        console.log("Metrics:", name, value, tags);
      }

      return Promise.resolve(Result.ok(void 0));
    } catch (error) {
      logger.error("Failed to record metric", { name, value, error });
      return Promise.resolve(
        Result.err({
          name: "AppError",
          message: "Failed to record metric",
          code: "INTERNAL_ERROR" as const,
          cause: error as Error,
        }),
      );
    }
  }
}

// Error Tracker Adapter
export class ErrorTrackerAdapter implements IErrorTracker {
  captureException(
    error: Error,
    context?: Record<string, unknown>,
  ): Promise<Result<void, AppError>> {
    try {
      logger.error("Exception captured", {
        error: error.message,
        stack: error.stack,
        context,
      });

      // In a real implementation, this would send to error tracking service
      if (typeof window !== "undefined") {
        // Client-side error tracking would go here
        console.error("Error tracked:", error, context);
      }

      return Promise.resolve(Result.ok(void 0));
    } catch (trackingError) {
      // Don't throw here to avoid infinite loops - use console.warn instead
      if (typeof console !== "undefined" && console.warn) {
        console.warn("Failed to track error:", trackingError);
      }
      return Promise.resolve(
        Result.err({
          name: "AppError",
          message: "Failed to capture exception",
          code: "INTERNAL_ERROR" as const,
          cause: trackingError as Error,
        }),
      );
    }
  }

  captureMessage(
    message: string,
    level: LogLevel,
    context?: Record<string, unknown>,
  ): Promise<Result<void, AppError>> {
    try {
      logger.info(`Message captured: ${message}`, context);

      if (typeof window !== "undefined") {
        console[level](`Error tracked: ${message}`, context);
      }

      return Promise.resolve(Result.ok(void 0));
    } catch (error) {
      console.error("Failed to track message:", error);
      return Promise.resolve(
        Result.err({
          name: "AppError",
          message: "Failed to capture message",
          code: "INTERNAL_ERROR" as const,
          cause: error as Error,
        }),
      );
    }
  }
}

// Factory functions for creating adapters
export function createExperimentService(): IExperimentService {
  return new ExperimentServiceAdapter();
}

export function createAnalyticsService(): IAnalyticsService {
  return new AnalyticsServiceAdapter();
}

export function createPerformanceMonitor(): IPerformanceMonitor {
  return new PerformanceMonitorAdapter();
}

export function createErrorTracker(): IErrorTracker {
  return new ErrorTrackerAdapter();
}

// SSR-safe versions for server-side rendering
export class SSRPerformanceMonitorAdapter implements IPerformanceMonitor {
  startTimer(operation: string): TimerHandle {
    // Return a no-op timer handle for SSR
    return {
      id: `ssr_${operation}_${Date.now()}`,
      operation,
      startTime: Date.now(),
    };
  }

  endTimer(handle: TimerHandle): Promise<Result<number, AppError>> {
    // Return a default duration for SSR
    return Promise.resolve(Result.ok(0));
  }

  recordMetric(
    name: string,
    value: number,
    tags?: Record<string, string>,
  ): Promise<Result<void, AppError>> {
    // No-op for SSR
    return Promise.resolve(Result.ok(undefined));
  }
}

export class SSRAnalyticsServiceAdapter implements IAnalyticsService {
  trackPageView(
    pageType: PageType,
    metadata: PageMetadata,
  ): Promise<Result<void, AppError>> {
    // No-op for SSR
    return Promise.resolve(Result.ok(undefined));
  }

  trackSectionLoad(
    sectionId: SectionId,
    loadTime: number,
  ): Promise<Result<void, AppError>> {
    // No-op for SSR
    return Promise.resolve(Result.ok(undefined));
  }
}

export class SSRErrorTrackerAdapter implements IErrorTracker {
  captureException(
    error: Error,
    context?: Record<string, unknown>,
  ): Promise<Result<void, AppError>> {
    // No-op for SSR
    return Promise.resolve(Result.ok(undefined));
  }

  captureMessage(
    message: string,
    level: LogLevel,
    context?: Record<string, unknown>,
  ): Promise<Result<void, AppError>> {
    // No-op for SSR
    return Promise.resolve(Result.ok(undefined));
  }
}

// Factory functions for SSR-safe services
export function createSSRPerformanceMonitor(): IPerformanceMonitor {
  return new SSRPerformanceMonitorAdapter();
}

export function createSSRAnalyticsService(): IAnalyticsService {
  return new SSRAnalyticsServiceAdapter();
}

export function createSSRErrorTracker(): IErrorTracker {
  return new SSRErrorTrackerAdapter();
}
