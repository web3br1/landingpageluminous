// Shared Observability Module
// Provides timing, metrics, and logging utilities across the application

import { logger } from "@/lib/logger";

// Types for observability
export type TimerHandle = {
  id: string;
  operation: string;
  startTime: number;
};

export type LogLevel = "debug" | "info" | "warn" | "error";

// Simple timing function (non-decorator version)
// Removed to avoid naming conflict - use timedDecorator instead

// Decorator version (experimental - needs TypeScript decorator support)
// Note: This may not work without proper decorator configuration
export function timedDecorator(operation: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: unknown[]) {
      const startTime = performance.now();
      try {
        logger.debug(`Starting method: ${propertyKey}`);
        const result = await originalMethod.apply(this, args);
        const duration = performance.now() - startTime;
        logger.info(`Method completed: ${propertyKey}`, {
          operation,
          duration,
        });
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        logger.error(`Method failed: ${propertyKey}`, {
          operation,
          duration,
          error,
        });
        throw error;
      }
    };
    return descriptor;
  };
}

// Function wrapper version for easier usage
export function timed<T extends (...args: unknown[]) => Promise<unknown>>(
  operation: string,
  fn: T,
): T {
  const wrapped = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const startTime = performance.now();
    try {
      logger.debug(`Starting operation: ${operation}`);
      const result = await fn(...args);
      const duration = performance.now() - startTime;
      logger.info(`Operation completed: ${operation}`, { operation, duration });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error(`Operation failed: ${operation}`, {
        operation,
        duration,
        error,
      });
      throw error;
    }
  };
  return wrapped as T;
}

// Export the decorator as 'timedDecorator' (already defined above)

// Simple metrics collection (placeholder)
export class MetricsCollector {
  private metrics = new Map<string, number[]>();

  record(name: string, value: number, tags?: Record<string, string>) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);

    logger.debug(`Metric recorded: ${name}`, { value, tags });
  }

  getAverage(name: string): number {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  getCount(name: string): number {
    return this.metrics.get(name)?.length || 0;
  }
}

// Global metrics instance
export const metrics = new MetricsCollector();

// Tracing utilities (placeholder)
export class Tracer {
  startSpan(name: string, parent?: string) {
    const spanId = `${name}_${Date.now()}_${Math.random()}`;
    logger.debug(`Starting span: ${name}`, { spanId, parent });
    const startTime = performance.now();
    return {
      spanId,
      name,
      startTime,
      end: (result?: any) => {
        const duration = performance.now() - startTime;
        logger.debug(`Ending span: ${name}`, { spanId, duration, result });
        return duration;
      },
    };
  }
}

// Global tracer instance
export const tracer = new Tracer();

// Error tracking utilities
export class ErrorTracker {
  captureException(error: Error, context?: Record<string, unknown>) {
    logger.error("Exception captured", {
      error: error.message,
      stack: error.stack,
      context,
    });
  }

  captureMessage(
    message: string,
    level: LogLevel = "error",
    context?: Record<string, unknown>,
  ) {
    logger.info(`Message captured: ${message}`, context);
  }
}

// Global error tracker instance
export const errorTracker = new ErrorTracker();
